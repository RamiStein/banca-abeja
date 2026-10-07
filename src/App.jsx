import { useState, useCallback, useMemo, useEffect } from 'react';
import { 
  UploadCloud, Wallet, TrendingUp, TrendingDown, LayoutDashboard, 
  History, Trash2, Plus, X, Tag, User, Car, Layers, FileText, 
  CheckCircle2, Clock, AlertTriangle, ShieldCheck, Eye, Paperclip, 
  ArrowDownRight, Sparkles, Upload, FileCheck, Coins, Image as ImageIcon
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { parseCSV } from './utils/parser';
import { compressReceiptImage } from './utils/imageCompressor';
import ReceiptViewerModal from './components/ReceiptViewerModal';
import VehicleManager from './VehicleManager';
import CommunityMatrix from './CommunityMatrix';
import './index.css';

// Función segura para formatear moneda sin errores de "-0"
const formatCurrency = (val, isExpense = false) => {
  if (Math.abs(val) < 0.001) return '$0,00';
  if (isExpense && val > 0) return `-$${val.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`;
  if (val < 0) return `-$${Math.abs(val).toLocaleString('es-AR', { minimumFractionDigits: 2 })}`;
  return `$${val.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`;
};

// Semillas demostrativas de Fase 1 (Trazabilidad, Comprobantes y Ciclo de Anticipos)
const SEED_TRANSACTIONS = [
  {
    id: 'tx-seed-1',
    date: new Date(Date.now() - 86400000 * 2).toISOString().split('T')[0],
    amount: -42500,
    concept: 'Combustible YPF Infinia (Clio - Comisión El Bolsón)',
    recipient: 'Estación de Servicio YPF Bariloche',
    category: 'Movilidad & Flota',
    type: 'expense',
    wallet: 'Mercado Pago',
    project: 'Movilidad General',
    status: 'rendido',
    receiptType: 'Ticket Fiscal',
    receiptNumber: 'TKT-0044-882193',
    receiptFileName: 'ticket_ypf_clio.jpg',
    receiptUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=600&q=80',
    notes: 'Carga de 35 litros para relevamiento en terreno. Ticket validado.'
  },
  {
    id: 'tx-seed-2',
    date: new Date(Date.now() - 86400000 * 3).toISOString().split('T')[0],
    amount: -65000,
    concept: 'Anticipo Caja Chica Compras Operativas de Campo',
    recipient: 'Ramiro Stein',
    advanceHolder: 'Ramiro Stein',
    category: 'Anticipo a Rendir',
    type: 'advance',
    wallet: 'Efectivo',
    project: 'elementales',
    status: 'pendiente',
    receiptType: 'Vale de Caja',
    receiptNumber: 'VALE-CC-0012',
    receiptFileName: 'vale_caja_chica.png',
    receiptUrl: '',
    notes: 'Fondo rotatorio para compra de materiales de huerta y ferretería menor.'
  },
  {
    id: 'tx-seed-3',
    date: new Date(Date.now() - 86400000 * 5).toISOString().split('T')[0],
    amount: 180000,
    concept: 'Cobro de Aportes Cuota Comunitaria & Taller',
    recipient: 'Gloria Maria Sepulveda',
    category: 'Ingreso',
    type: 'income',
    wallet: 'Mercado Pago',
    project: 'vrde',
    status: 'aprobado',
    receiptType: 'Comprobante Transferencia',
    receiptNumber: 'TRANSF-MP-9842104',
    receiptFileName: 'transferencia_sepulveda.png',
    receiptUrl: 'https://images.unsplash.com/photo-1554224154-26032ffc0d07?auto=format&fit=crop&w=600&q=80',
    notes: 'Aporte de sostenimiento productivo del mes.'
  },
  {
    id: 'tx-seed-4',
    date: new Date(Date.now() - 86400000 * 7).toISOString().split('T')[0],
    amount: -32400,
    concept: 'Materiales Ferretería y Riego (Mangueras y acoples)',
    recipient: 'Ferretería Industrial Nahuel',
    category: 'Insumos',
    type: 'settlement',
    wallet: 'Efectivo',
    project: 'elementales',
    status: 'aprobado',
    receiptType: 'Factura B',
    receiptNumber: 'FC-B-0003-00018942',
    receiptFileName: 'factura_ferreteria.jpg',
    receiptUrl: 'https://images.unsplash.com/photo-1450133064473-71024230f91b?auto=format&fit=crop&w=600&q=80',
    notes: 'Rendición parcial imputada al anticipo de compras operativas.'
  }
];

function App() {
  // Persistencia de transacciones con LocalStorage
  const [transactions, setTransactions] = useState(() => {
    const saved = localStorage.getItem('banca_abeja_transactions');
    if (!saved) return SEED_TRANSACTIONS;
    try {
      const parsed = JSON.parse(saved);
      return parsed.length > 0 ? parsed : SEED_TRANSACTIONS;
    } catch {
      return SEED_TRANSACTIONS;
    }
  });

  useEffect(() => {
    localStorage.setItem('banca_abeja_transactions', JSON.stringify(transactions));
  }, [transactions]);

  const [isDragging, setIsDragging] = useState(false);
  const [activeTab, setActiveTab] = useState('community');
  
  // Modal de Visor de Comprobantes
  const [selectedReceiptTx, setSelectedReceiptTx] = useState(null);

  // Filtros del historial
  const [filterProject, setFilterProject] = useState('');
  const [filterRecipient, setFilterRecipient] = useState('');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterHasReceipt, setFilterHasReceipt] = useState('');
  
  // Estado para carga manual
  const [showManualForm, setShowManualForm] = useState(false);
  const [isCompressingReceipt, setIsCompressingReceipt] = useState(false);
  const [manualEntry, setManualEntry] = useState({
    date: new Date().toISOString().split('T')[0],
    concept: '',
    amount: '',
    type: 'expense', // 'expense', 'income', 'advance', 'settlement'
    wallet: 'Mercado Pago',
    recipient: '',
    project: '',
    status: 'aprobado', // 'aprobado', 'pendiente', 'rendido', 'observado'
    receiptType: 'Factura B',
    receiptNumber: '',
    receiptUrl: '',
    receiptFileName: '',
    advanceHolder: '',
    notes: ''
  });

  // Autocompletados (Datalists)
  const uniqueProjects = useMemo(() => Array.from(new Set(transactions.map(t => t.project).filter(Boolean))), [transactions]);
  const uniqueRecipients = useMemo(() => Array.from(new Set(transactions.map(t => t.recipient).filter(Boolean))), [transactions]);
  const uniqueConcepts = useMemo(() => Array.from(new Set(transactions.map(t => t.concept).filter(Boolean))), [transactions]);

  const onDragOver = useCallback((e) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const onDragLeave = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const onDrop = useCallback(async (e) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      try {
        const parsedData = await parseCSV(files[0]);
        const newTransactions = parsedData
          .filter(t => t.amount !== 0)
          .map((t, i) => ({ 
            ...t, 
            id: `${Date.now()}-${Math.random()}-${i}`,
            status: 'aprobado',
            receiptType: 'Comprobante Digital',
            type: t.amount > 0 ? 'income' : 'expense'
          })); 
        
        setTransactions(prev => [...prev, ...newTransactions]);
      } catch {
        alert("Error al leer el archivo CSV.");
      }
    }
  }, []);

  const clearData = () => {
    if (window.confirm("¿Estás seguro de que quieres restablecer todos los movimientos a los datos por defecto?")) {
      setTransactions(SEED_TRANSACTIONS);
    }
  };

  const deleteTransaction = (id) => {
    if (window.confirm("¿Estás seguro de que deseas eliminar este movimiento individual?")) {
      setTransactions(prev => prev.filter(t => t.id !== id));
      if (selectedReceiptTx?.id === id) {
        setSelectedReceiptTx(null);
      }
    }
  };

  // Actualizar estado de auditoría
  const handleUpdateStatus = (id, newStatus) => {
    setTransactions(prev => prev.map(t => {
      if (t.id === id) {
        return { ...t, status: newStatus };
      }
      return t;
    }));
    if (selectedReceiptTx && selectedReceiptTx.id === id) {
      setSelectedReceiptTx(prev => ({ ...prev, status: newStatus }));
    }
  };

  // Manejo de carga de archivo de comprobante
  const handleReceiptFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsCompressingReceipt(true);
      const compressed = await compressReceiptImage(file);
      setManualEntry(prev => ({
        ...prev,
        receiptUrl: compressed.dataUrl,
        receiptFileName: compressed.fileName,
        // Si no tenía número de comprobante, sugerir el nombre
        receiptNumber: prev.receiptNumber || file.name.split('.')[0]
      }));
    } catch (err) {
      alert("Error al procesar el comprobante: " + err.message);
    } finally {
      setIsCompressingReceipt(false);
    }
  };

  const handleRemoveReceiptFile = () => {
    setManualEntry(prev => ({
      ...prev,
      receiptUrl: '',
      receiptFileName: ''
    }));
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (!manualEntry.concept || !manualEntry.amount) return;
    
    let rawAmount = parseFloat(manualEntry.amount);
    let finalAmount = rawAmount;
    
    // Asignar signo según el tipo de movimiento
    if (manualEntry.type === 'expense' || manualEntry.type === 'settlement') {
      finalAmount = -Math.abs(rawAmount);
    } else if (manualEntry.type === 'advance') {
      finalAmount = -Math.abs(rawAmount); // El anticipo sale de la caja inicialmente
    } else if (manualEntry.type === 'income') {
      finalAmount = Math.abs(rawAmount);
    }

    const newTx = {
      id: `${Date.now()}-${Math.random()}`,
      date: manualEntry.date,
      amount: finalAmount,
      concept: manualEntry.concept.trim(),
      recipient: manualEntry.recipient.trim() || null, 
      advanceHolder: manualEntry.type === 'advance' ? (manualEntry.recipient.trim() || manualEntry.advanceHolder.trim() || 'Responsable') : null,
      category: manualEntry.type === 'income' ? 'Ingreso' : (manualEntry.type === 'advance' ? 'Anticipo a Rendir' : (manualEntry.type === 'settlement' ? 'Rendición' : 'Gasto')),
      type: manualEntry.type,
      wallet: manualEntry.wallet,
      project: manualEntry.project.trim() || null,
      status: manualEntry.status,
      receiptType: manualEntry.receiptType,
      receiptNumber: manualEntry.receiptNumber.trim() || null,
      receiptUrl: manualEntry.receiptUrl || '',
      receiptFileName: manualEntry.receiptFileName || '',
      notes: manualEntry.notes.trim() || ''
    };

    setTransactions(prev => [newTx, ...prev]);
    setShowManualForm(false);
    setManualEntry({ 
      date: new Date().toISOString().split('T')[0],
      concept: '', 
      amount: '', 
      type: 'expense',
      wallet: 'Mercado Pago',
      recipient: '', 
      project: '',
      status: 'aprobado',
      receiptType: 'Factura B',
      receiptNumber: '',
      receiptUrl: '',
      receiptFileName: '',
      advanceHolder: '',
      notes: ''
    });
  };

  // Cálculos globales del Dashboard y Auditoría
  const { 
    balance, income, expense, pendingAdvances, 
    pendingAuditCount, receiptsCoverage,
    incomeByProject, expenseByProject 
  } = useMemo(() => {
    let bal = 0, inc = 0, exp = 0, advances = 0;
    let pendingCount = 0;
    let withReceiptCount = 0;
    let totalExpenseLikeCount = 0;

    const projectMapInc = {};
    const projectMapExp = {};

    transactions.forEach(t => {
      bal += t.amount;

      if (t.amount > 0) {
        inc += t.amount;
        if (t.project) projectMapInc[t.project] = (projectMapInc[t.project] || 0) + t.amount;
      } else {
        // Si es un anticipo en espera de rendición
        if (t.type === 'advance' && t.status !== 'rendido') {
          advances += Math.abs(t.amount);
        } else {
          exp += Math.abs(t.amount);
        }
        if (t.project) projectMapExp[t.project] = (projectMapExp[t.project] || 0) + Math.abs(t.amount);
      }

      // Conteo de auditoría
      if (t.status === 'pendiente' || t.status === 'observado') {
        pendingCount++;
      }

      // Conteo de cobertura de comprobantes
      if (t.amount < 0) {
        totalExpenseLikeCount++;
        if (t.receiptUrl || t.receiptNumber) {
          withReceiptCount++;
        }
      }
    });

    bal = Math.abs(bal) < 0.001 ? 0 : bal;
    inc = Math.abs(inc) < 0.001 ? 0 : inc;
    exp = Math.abs(exp) < 0.001 ? 0 : exp;
    advances = Math.abs(advances) < 0.001 ? 0 : advances;

    const coveragePct = totalExpenseLikeCount > 0 
      ? Math.round((withReceiptCount / totalExpenseLikeCount) * 100) 
      : 100;

    const listInc = Object.entries(projectMapInc).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
    const listExp = Object.entries(projectMapExp).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);

    return { 
      balance: bal, 
      income: inc, 
      expense: exp, 
      pendingAdvances: advances,
      pendingAuditCount: pendingCount,
      receiptsCoverage: coveragePct,
      incomeByProject: listInc, 
      expenseByProject: listExp 
    };
  }, [transactions]);

  // Datos para el gráfico de barras
  const chartData = useMemo(() => {
    const dailyMap = {};
    transactions.forEach(t => {
      const d = (t.date && t.date.split(' ')[0]) || 'Sin Fecha';
      if (!dailyMap[d]) dailyMap[d] = { date: d, income: 0, expense: 0 };
      if (t.amount > 0) dailyMap[d].income += t.amount;
      else dailyMap[d].expense += Math.abs(t.amount);
    });
    return Object.values(dailyMap).sort((a, b) => a.date.localeCompare(b.date)).slice(-14);
  }, [transactions]);

  // Filtrado de historial avanzado
  const { filteredHistory, filteredSummary, breakdownByClient, breakdownByProject, breakdownByConcept } = useMemo(() => {
    let result = transactions.slice().reverse();
    
    if (filterProject) result = result.filter(t => t.project === filterProject);
    if (filterRecipient) result = result.filter(t => (t.recipient === filterRecipient || t.advanceHolder === filterRecipient));
    if (filterStatus) result = result.filter(t => (t.status || 'aprobado') === filterStatus);
    if (filterType) result = result.filter(t => (t.type || (t.amount > 0 ? 'income' : 'expense')) === filterType);
    if (filterHasReceipt === 'yes') result = result.filter(t => !!(t.receiptUrl || t.receiptNumber));
    if (filterHasReceipt === 'no') result = result.filter(t => !(t.receiptUrl || t.receiptNumber));
    
    if (filterStartDate) result = result.filter(t => t.date >= filterStartDate);
    if (filterEndDate) result = result.filter(t => t.date <= filterEndDate);

    let fBal = 0, fInc = 0, fExp = 0;
    const clientMap = {};
    const projMap = {};
    const conceptMap = {};

    result.forEach(t => {
      fBal += t.amount;
      if (t.amount > 0) fInc += t.amount;
      else fExp += Math.abs(t.amount);

      if (t.recipient) clientMap[t.recipient] = (clientMap[t.recipient] || 0) + t.amount;
      if (t.project) projMap[t.project] = (projMap[t.project] || 0) + t.amount;
      if (t.concept) conceptMap[t.concept] = (conceptMap[t.concept] || 0) + t.amount;
    });

    fBal = Math.abs(fBal) < 0.001 ? 0 : fBal;
    fInc = Math.abs(fInc) < 0.001 ? 0 : fInc;
    fExp = Math.abs(fExp) < 0.001 ? 0 : fExp;

    const bClient = Object.entries(clientMap).map(([name, val]) => ({name, val})).sort((a,b) => b.val - a.val);
    const bProject = Object.entries(projMap).map(([name, val]) => ({name, val})).sort((a,b) => b.val - a.val);
    const bConcept = Object.entries(conceptMap).map(([name, val]) => ({name, val})).sort((a,b) => b.val - a.val);

    return { 
      filteredHistory: result,
      filteredSummary: { balance: fBal, income: fInc, expense: fExp },
      breakdownByClient: bClient,
      breakdownByProject: bProject,
      breakdownByConcept: bConcept
    };
  }, [transactions, filterProject, filterRecipient, filterStatus, filterType, filterHasReceipt, filterStartDate, filterEndDate]);

  const hasActiveFilters = filterProject || filterRecipient || filterStatus || filterType || filterHasReceipt || filterStartDate || filterEndDate;

  // Renderizador del badge de estado
  const renderStatusBadge = (t) => {
    const status = t.status || 'aprobado';
    if (status === 'aprobado') {
      return (
        <span 
          className="status-pill status-aprobado" 
          onClick={() => handleUpdateStatus(t.id, 'rendido')}
          title="Aprobado. Clic para marcar como Rendido"
        >
          <CheckCircle2 size={12} /> Aprobado
        </span>
      );
    }
    if (status === 'rendido') {
      return (
        <span 
          className="status-pill status-rendido" 
          onClick={() => handleUpdateStatus(t.id, 'aprobado')}
          title="Rendido con Factura. Clic para alternar estado"
        >
          <ShieldCheck size={12} /> Rendido
        </span>
      );
    }
    if (status === 'pendiente') {
      return (
        <span 
          className="status-pill status-pendiente" 
          onClick={() => handleUpdateStatus(t.id, 'aprobado')}
          title="Pendiente de Revisión. Clic para Aprobar"
        >
          <Clock size={12} /> Pendiente
        </span>
      );
    }
    return (
      <span 
        className="status-pill status-observado" 
        onClick={() => handleUpdateStatus(t.id, 'pendiente')}
        title="Observado. Clic para enviar a revisión"
      >
        <AlertTriangle size={12} /> Observado
      </span>
    );
  };

  return (
    <div className="container relative">
      <header className="flex justify-between items-center mb-6 flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <span style={{ fontSize: '1.8rem' }}>🐝</span>
            Banca Abeja
          </h1>
          <p className="text-secondary mt-1">Matriz En Conjunto • Trazabilidad, Comprobantes & Billeteras Comunitarias</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button 
            className={`btn ${activeTab === 'community' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setActiveTab('community')}
            style={{ 
               backgroundColor: activeTab === 'community' ? 'var(--accent-color)' : 'transparent',
               borderColor: activeTab === 'community' ? 'var(--accent-color)' : 'var(--border-color)',
               color: activeTab === 'community' ? '#fff' : 'inherit'
            }}
          >
            <Layers size={18} />
            Colmena & Red
          </button>
          <button 
            className={`btn ${activeTab === 'vehicle' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setActiveTab('vehicle')}
            style={{ 
               backgroundColor: activeTab === 'vehicle' ? '#bfe4dd' : 'transparent',
               borderColor: activeTab === 'vehicle' ? '#bfe4dd' : 'var(--border-color)',
               color: activeTab === 'vehicle' ? '#0f766e' : 'inherit'
            }}
          >
            <Car size={18} />
            Vehículos
          </button>
          <button 
            className={`btn ${activeTab === 'dashboard' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setActiveTab('dashboard')}
          >
            <LayoutDashboard size={18} />
            Dashboard
          </button>
          <button 
            className={`btn ${activeTab === 'history' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setActiveTab('history')}
          >
            <History size={18} />
            Historial ({transactions.length})
          </button>
          {transactions.length > 0 && (
             <button className="btn btn-outline" style={{ borderColor: 'var(--danger)', color: 'var(--danger)' }} onClick={clearData} title="Restablecer Datos Semilla">
               <Trash2 size={18} />
             </button>
          )}
        </div>
      </header>

      <main className="flex flex-col gap-6">
        
        {/* Acciones Rápidas del Dashboard */}
        {activeTab === 'dashboard' && (
          <div className="flex flex-wrap items-center justify-between gap-3 mb-1">
             <div className="flex items-center gap-3">
               <button className="btn btn-primary" onClick={() => {
                 setManualEntry(prev => ({ ...prev, type: 'expense' }));
                 setShowManualForm(true);
               }}>
                  <Plus size={18} />
                  Nuevo Gasto / Comprobante
               </button>
               <button className="btn btn-outline" onClick={() => {
                 setManualEntry(prev => ({ ...prev, type: 'advance', concept: 'Anticipo Caja Chica Operativa', status: 'pendiente' }));
                 setShowManualForm(true);
               }}>
                  <Coins size={18} className="text-warning" />
                  Entregar Anticipo (Caja Chica)
               </button>
             </div>
             
             <div className="text-xs text-secondary flex items-center gap-2">
               <ShieldCheck size={16} className="text-success" />
               Fase 1 Activa: Auditoría Digital & Trazabilidad de Comprobantes
             </div>
          </div>
        )}

        {/* Drop Zone */}
        {activeTab === 'dashboard' && (
          <div 
            className={`drop-zone ${isDragging ? 'active' : ''}`}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
          >
            <UploadCloud size={44} color="#6366f1" style={{ margin: '0 auto', marginBottom: '0.75rem' }} />
            <h3 className="text-xl">Arrastra tus archivos CSV o extractos bancarios aquí</h3>
            <p className="text-secondary mt-1 text-sm">Soporta exportaciones de Mercado Pago y Pago Fácil. Se integran automáticamente con estado de auditoría.</p>
          </div>
        )}

        {/* Modal Enriquecido de Carga Manual con Evidencia Digital */}
        {showManualForm && (
          <div className="modal-overlay" onClick={() => setShowManualForm(false)}>
            <div 
              className="card w-full max-w-lg relative" 
              onClick={(e) => e.stopPropagation()}
              style={{ width: '560px', maxWidth: '95%', maxHeight: '90vh', overflowY: 'auto' }}
            >
              <button 
                className="btn btn-outline absolute top-4 right-4" 
                style={{ padding: '0.25rem', border: 'none' }}
                onClick={() => setShowManualForm(false)}
              >
                <X size={20} />
              </button>

              <h3 className="text-xl mb-3 font-bold flex items-center gap-2">
                <FileCheck size={22} className="text-accent" /> Registrar Movimiento & Comprobante
              </h3>

              {/* Selector de Tipo en Pestañas */}
              <div className="grid grid-cols-4 gap-1.5 p-1 rounded-lg mb-4" style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}>
                <button
                  type="button"
                  className="btn"
                  onClick={() => setManualEntry({ ...manualEntry, type: 'expense' })}
                  style={{
                    fontSize: '0.8rem',
                    padding: '6px 8px',
                    backgroundColor: manualEntry.type === 'expense' ? 'var(--danger)' : 'transparent',
                    color: manualEntry.type === 'expense' ? '#fff' : 'var(--text-secondary)'
                  }}
                >
                  Gasto (-)
                </button>
                <button
                  type="button"
                  className="btn"
                  onClick={() => setManualEntry({ ...manualEntry, type: 'income' })}
                  style={{
                    fontSize: '0.8rem',
                    padding: '6px 8px',
                    backgroundColor: manualEntry.type === 'income' ? 'var(--success)' : 'transparent',
                    color: manualEntry.type === 'income' ? '#fff' : 'var(--text-secondary)'
                  }}
                >
                  Ingreso (+)
                </button>
                <button
                  type="button"
                  className="btn"
                  onClick={() => setManualEntry({ ...manualEntry, type: 'advance', status: 'pendiente' })}
                  style={{
                    fontSize: '0.8rem',
                    padding: '6px 8px',
                    backgroundColor: manualEntry.type === 'advance' ? '#f59e0b' : 'transparent',
                    color: manualEntry.type === 'advance' ? '#fff' : 'var(--text-secondary)'
                  }}
                  title="Fondo rotatorio de caja chica a rendir"
                >
                  Anticipo
                </button>
                <button
                  type="button"
                  className="btn"
                  onClick={() => setManualEntry({ ...manualEntry, type: 'settlement', status: 'rendido' })}
                  style={{
                    fontSize: '0.8rem',
                    padding: '6px 8px',
                    backgroundColor: manualEntry.type === 'settlement' ? '#38bdf8' : 'transparent',
                    color: manualEntry.type === 'settlement' ? '#0f172a' : 'var(--text-secondary)',
                    fontWeight: 600
                  }}
                  title="Rendición de un gasto contra un anticipo previo"
                >
                  Rendición
                </button>
              </div>
              
              <form onSubmit={handleManualSubmit} className="flex flex-col gap-3.5">
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-secondary mb-1 block">Billetera / Origen</label>
                    <select 
                      className="input"
                      value={manualEntry.wallet}
                      onChange={e => setManualEntry({...manualEntry, wallet: e.target.value})}
                    >
                      <option value="Mercado Pago">Mercado Pago</option>
                      <option value="Efectivo">Efectivo / Caja Chica</option>
                      <option value="Pago Fácil">Pago Fácil</option>
                      <option value="Banco Nación">Banco Nación</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-secondary mb-1 block">Fecha</label>
                    <input 
                      type="date" 
                      className="input"
                      value={manualEntry.date}
                      onChange={e => setManualEntry({...manualEntry, date: e.target.value})}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-2">
                    <label className="text-xs text-secondary mb-1 block">Concepto / Detalle del Gasto</label>
                    <input 
                      type="text" 
                      className="input"
                      placeholder="Ej. Combustible YPF Infinia, Tornillos y clavos..."
                      value={manualEntry.concept}
                      onChange={e => setManualEntry({...manualEntry, concept: e.target.value})}
                      list="concepts-list"
                      required
                    />
                    <datalist id="concepts-list">
                      {uniqueConcepts.map(c => <option key={c} value={c} />)}
                    </datalist>
                  </div>
                  <div>
                    <label className="text-xs text-secondary mb-1 block">Monto ($ ARS)</label>
                    <input 
                      type="number" 
                      step="0.01"
                      className="input font-bold"
                      placeholder="0.00"
                      value={manualEntry.amount}
                      onChange={e => setManualEntry({...manualEntry, amount: e.target.value})}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-secondary mb-1 block">
                      {manualEntry.type === 'income' 
                        ? 'Emisor / Cliente' 
                        : (manualEntry.type === 'advance' ? 'Responsable del Anticipo' : 'Proveedor / Comercio')}
                    </label>
                    <input 
                      type="text" 
                      className="input"
                      placeholder={manualEntry.type === 'advance' ? "Ej. Ramiro Stein" : "Ej. YPF Bariloche"}
                      value={manualEntry.recipient}
                      onChange={e => setManualEntry({...manualEntry, recipient: e.target.value})}
                      list="recipients-list"
                    />
                    <datalist id="recipients-list">
                      {uniqueRecipients.map(r => <option key={r} value={r} />)}
                    </datalist>
                  </div>
                  <div>
                    <label className="text-xs text-secondary mb-1 block">Grupo / Proyecto Imputado</label>
                    <input 
                      type="text" 
                      className="input"
                      placeholder="Ej. vrde, elementales, flota"
                      value={manualEntry.project}
                      onChange={e => setManualEntry({...manualEntry, project: e.target.value})}
                      list="projects-list"
                    />
                    <datalist id="projects-list">
                      {uniqueProjects.map(p => <option key={p} value={p} />)}
                    </datalist>
                  </div>
                </div>

                {/* Sección de Comprobante / Evidencia Digital */}
                <div className="p-3.5 rounded-lg mt-1" style={{ backgroundColor: 'rgba(99, 102, 241, 0.06)', border: '1px solid rgba(99, 102, 241, 0.2)' }}>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-semibold uppercase tracking-wider text-accent flex items-center gap-1.5">
                      <Paperclip size={14} /> Evidencia Digital / Comprobante
                    </span>
                    <span className="text-xs text-secondary">Inspirado en GDE & e-SIDIF</span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div>
                      <label className="text-xs text-secondary mb-1 block">Tipo de Comprobante</label>
                      <select 
                        className="input"
                        value={manualEntry.receiptType}
                        onChange={e => setManualEntry({...manualEntry, receiptType: e.target.value})}
                      >
                        <option value="Factura B">Factura B</option>
                        <option value="Factura A">Factura A</option>
                        <option value="Factura C">Factura C</option>
                        <option value="Ticket Fiscal">Ticket Fiscal</option>
                        <option value="Comprobante Transferencia">Comprobante Transferencia</option>
                        <option value="Recibo Oficial">Recibo Oficial</option>
                        <option value="Vale de Caja">Vale de Caja Chica</option>
                        <option value="Sin Comprobante">Sin Comprobante</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-xs text-secondary mb-1 block">Nº de Factura / Ticket</label>
                      <input 
                        type="text" 
                        className="input font-mono text-sm"
                        placeholder="Ej. FC-B-0001-000452"
                        value={manualEntry.receiptNumber}
                        onChange={e => setManualEntry({...manualEntry, receiptNumber: e.target.value})}
                      />
                    </div>
                  </div>

                  {/* Input de archivo con vista previa */}
                  {manualEntry.receiptUrl ? (
                    <div className="flex items-center justify-between p-2.5 rounded bg-black/40 border border-white/10">
                      <div className="flex items-center gap-2 overflow-hidden">
                        <ImageIcon size={20} className="text-accent flex-shrink-0" />
                        <span className="text-xs text-white truncate">{manualEntry.receiptFileName || 'Comprobante cargado'}</span>
                      </div>
                      <button 
                        type="button" 
                        className="btn btn-outline" 
                        style={{ padding: '2px 8px', fontSize: '0.75rem', color: 'var(--danger)', borderColor: 'transparent' }}
                        onClick={handleRemoveReceiptFile}
                      >
                        Quitar
                      </button>
                    </div>
                  ) : (
                    <div>
                      <label className="file-upload-box block">
                        <input 
                          type="file" 
                          accept="image/*,application/pdf"
                          onChange={handleReceiptFileUpload}
                          style={{ display: 'none' }}
                          disabled={isCompressingReceipt}
                        />
                        <Upload size={22} className="mx-auto mb-1 text-secondary" style={{ margin: '0 auto' }} />
                        <span className="text-xs font-semibold block text-white">
                          {isCompressingReceipt ? 'Optimizando imagen...' : 'Subir foto del Ticket o Factura (JPG, PNG, PDF)'}
                        </span>
                        <span className="text-xs text-secondary">Se optimiza automáticamente para no ocupar espacio</span>
                      </label>
                    </div>
                  )}

                  {/* Estado inicial del movimiento */}
                  <div className="mt-3 flex items-center justify-between pt-2 border-t border-white/5">
                    <span className="text-xs text-secondary">Estado inicial de Auditoría:</span>
                    <select 
                      className="input" 
                      style={{ width: '180px', padding: '4px 8px', fontSize: '0.8rem' }}
                      value={manualEntry.status}
                      onChange={e => setManualEntry({...manualEntry, status: e.target.value})}
                    >
                      <option value="aprobado">Aprobado / Validado</option>
                      <option value="rendido">Rendido con Factura</option>
                      <option value="pendiente">Pendiente de Revisión</option>
                      <option value="observado">Observado</option>
                    </select>
                  </div>
                </div>

                <button type="submit" className="btn btn-primary mt-1" disabled={isCompressingReceipt}>
                  Guardar Movimiento en la Matriz
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Resumen Principal de KPIs en Dashboard */}
        {activeTab === 'dashboard' && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              
              <div className="card flex flex-col gap-2">
                <div className="flex justify-between items-center text-secondary">
                  <span className="font-semibold text-sm">Flujo Neto / Caja Real</span>
                  <Wallet size={18} />
                </div>
                <span className={`text-2xl font-bold ${balance < 0 ? 'text-danger' : (balance > 0 ? 'text-success' : '')}`}>
                  {formatCurrency(balance)}
                </span>
                <span className="text-xs text-secondary">Saldo líquido disponible en cuentas</span>
              </div>
              
              <div className="card flex flex-col gap-2">
                <div className="flex justify-between items-center text-secondary">
                  <span className="font-semibold text-sm">Total Ingresos</span>
                  <TrendingUp size={18} className="text-success" />
                </div>
                <span className="text-2xl font-bold text-success">
                  {formatCurrency(income)}
                </span>
                <span className="text-xs text-secondary">Recaudación y aportes</span>
              </div>

              <div className="card flex flex-col gap-2">
                <div className="flex justify-between items-center text-secondary">
                  <span className="font-semibold text-sm">Total Egresos Definitivos</span>
                  <TrendingDown size={18} className="text-danger" />
                </div>
                <span className="text-2xl font-bold text-danger">
                  {formatCurrency(expense, true)}
                </span>
                <span className="text-xs text-secondary">Gastos operativos consolidados</span>
              </div>

              {/* KPI Nuevo: Anticipos de Caja Chica a Rendir */}
              <div className="card flex flex-col gap-2" style={{ borderLeft: '4px solid #f59e0b' }}>
                <div className="flex justify-between items-center text-secondary">
                  <span className="font-semibold text-sm">Anticipos por Rendir</span>
                  <Clock size={18} className="text-warning" />
                </div>
                <span className="text-2xl font-bold text-warning">
                  ${pendingAdvances.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                </span>
                <div className="flex justify-between items-center text-xs text-secondary">
                  <span>Caja chica en custodia</span>
                  <span className="font-semibold text-white">{receiptsCoverage}% con factura</span>
                </div>
              </div>

            </div>

            {/* Banner de Auditoría Operativa */}
            {pendingAuditCount > 0 && (
              <div 
                className="flex items-center justify-between p-3.5 rounded-lg flex-wrap gap-2"
                style={{ backgroundColor: 'rgba(245, 158, 11, 0.12)', border: '1px solid rgba(245, 158, 11, 0.3)' }}
              >
                <div className="flex items-center gap-2">
                  <AlertTriangle size={18} className="text-warning" />
                  <span className="text-sm font-semibold text-white">
                    Hay {pendingAuditCount} movimiento{pendingAuditCount > 1 ? 's' : ''} pendiente{pendingAuditCount > 1 ? 's' : ''} de revisión o rendición con factura.
                  </span>
                </div>
                <button 
                  className="btn btn-outline" 
                  style={{ fontSize: '0.8rem', padding: '4px 10px', borderColor: '#f59e0b', color: '#f59e0b' }}
                  onClick={() => {
                    setFilterStatus('pendiente');
                    setActiveTab('history');
                  }}
                >
                  Filtrar en Historial
                </button>
              </div>
            )}

            <div className="grid grid-cols-1 gap-6" style={{ gridTemplateColumns: '2fr 1fr' }}>
              {/* Gráfico de Barras */}
              <div className="card">
                <h3 className="text-xl mb-4">Evolución de Flujo (Últimos Días)</h3>
                {transactions.length > 0 ? (
                  <div style={{ width: '100%', height: '300px' }}>
                    <ResponsiveContainer>
                      <BarChart data={chartData}>
                        <XAxis dataKey="date" stroke="var(--text-secondary)" fontSize={12} />
                        <YAxis stroke="var(--text-secondary)" fontSize={12} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)', borderRadius: '8px' }}
                          itemStyle={{ color: 'var(--text-primary)' }}
                        />
                        <Bar dataKey="income" fill="var(--success)" name="Ingresos" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="expense" fill="var(--danger)" name="Egresos" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="flex items-center justify-center text-secondary" style={{ height: '300px' }}>
                    Sube un archivo o carga movimientos para ver gráficos
                  </div>
                )}
              </div>

              {/* Resumen por Proyecto */}
              <div className="card flex flex-col">
                <h3 className="text-xl mb-4 flex items-center gap-2">
                   <Tag size={20} className="text-accent" /> Ingresos por Proyecto
                </h3>
                {incomeByProject.length > 0 ? (
                  <div className="flex flex-col gap-3">
                    {incomeByProject.map(p => (
                      <div key={p.name} className="flex justify-between items-center border-b pb-2" style={{ borderColor: 'var(--border-color)' }}>
                        <span className="font-semibold text-secondary">{p.name}</span>
                        <span className="text-success font-bold">+{formatCurrency(p.value)}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-secondary text-sm">Agrupa tus ingresos añadiendo un Grupo/Proyecto en la carga manual.</p>
                )}
              </div>
            </div>
          </>
        )}

        {/* Tab de Historial con Trazabilidad Completa */}
        {activeTab === 'history' && (
          <div className="card flex flex-col gap-4">
            
            {/* Header de la Tabla con Filtros Integrados */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h3 className="text-xl whitespace-nowrap">Historial & Auditoría de Movimientos ({filteredHistory.length})</h3>
                <span className="text-xs text-secondary">Control de comprobantes, tickets fiscales y estados de rendición</span>
              </div>
              
              <div className="flex flex-wrap items-center gap-2.5">
                
                {/* Filtro por Estado */}
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-secondary">Estado:</span>
                  <select 
                    className="input py-1 px-2 text-xs" 
                    value={filterStatus} 
                    onChange={e => setFilterStatus(e.target.value)}
                    style={{ width: '125px' }}
                  >
                    <option value="">Todos</option>
                    <option value="pendiente">Pendientes</option>
                    <option value="aprobado">Aprobados</option>
                    <option value="rendido">Rendidos</option>
                    <option value="observado">Observados</option>
                  </select>
                </div>

                {/* Filtro por Tipo */}
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-secondary">Tipo:</span>
                  <select 
                    className="input py-1 px-2 text-xs" 
                    value={filterType} 
                    onChange={e => setFilterType(e.target.value)}
                    style={{ width: '115px' }}
                  >
                    <option value="">Todos</option>
                    <option value="expense">Gastos</option>
                    <option value="income">Ingresos</option>
                    <option value="advance">Anticipos</option>
                    <option value="settlement">Rendiciones</option>
                  </select>
                </div>

                {/* Filtro por Comprobante */}
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-secondary">Comprobante:</span>
                  <select 
                    className="input py-1 px-2 text-xs" 
                    value={filterHasReceipt} 
                    onChange={e => setFilterHasReceipt(e.target.value)}
                    style={{ width: '120px' }}
                  >
                    <option value="">Todos</option>
                    <option value="yes">Con Adjunto</option>
                    <option value="no">Sin Adjunto</option>
                  </select>
                </div>

                {uniqueProjects.length > 0 && (
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-secondary">Proyecto:</span>
                    <select 
                      className="input py-1 px-2 text-xs" 
                      value={filterProject} 
                      onChange={e => setFilterProject(e.target.value)}
                      style={{ width: '110px' }}
                    >
                      <option value="">Todos</option>
                      {uniqueProjects.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>
                )}

                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-secondary">Desde:</span>
                  <input 
                    type="date" 
                    className="input py-1 px-2 text-xs" 
                    value={filterStartDate} 
                    onChange={e => setFilterStartDate(e.target.value)}
                    style={{ width: '120px' }}
                  />
                </div>
                
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-secondary">Hasta:</span>
                  <input 
                    type="date" 
                    className="input py-1 px-2 text-xs" 
                    value={filterEndDate} 
                    onChange={e => setFilterEndDate(e.target.value)}
                    style={{ width: '120px' }}
                  />
                </div>

                {hasActiveFilters && (
                  <button 
                    className="btn btn-outline" 
                    style={{ padding: '3px 8px', fontSize: '0.75rem', color: 'var(--danger)', borderColor: 'rgba(239, 68, 68, 0.4)' }}
                    onClick={() => {
                      setFilterProject('');
                      setFilterRecipient('');
                      setFilterStatus('');
                      setFilterType('');
                      setFilterHasReceipt('');
                      setFilterStartDate('');
                      setFilterEndDate('');
                    }}
                  >
                    Limpiar Filtros
                  </button>
                )}

              </div>
            </div>

            {/* Resumen de la vista filtrada */}
            {hasActiveFilters && (
              <div className="flex flex-col gap-4 p-4 rounded-lg" style={{ background: 'rgba(99, 102, 241, 0.05)', border: '1px solid rgba(99, 102, 241, 0.2)' }}>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <div className="text-xs text-secondary mb-1">Total Ingresos Filtrados</div>
                    <div className="text-lg font-bold text-success">{formatCurrency(filteredSummary.income)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-secondary mb-1">Total Egresos Filtrados</div>
                    <div className="text-lg font-bold text-danger">{formatCurrency(filteredSummary.expense, true)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-secondary mb-1">Saldo de esta Selección</div>
                    <div className={`text-lg font-bold ${filteredSummary.balance < 0 ? 'text-danger' : (filteredSummary.balance > 0 ? 'text-success' : '')}`}>
                      {formatCurrency(filteredSummary.balance)}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Tabla de Historial & Auditoría */}
            {filteredHistory.length === 0 ? (
              <div className="text-center py-10 text-secondary">
                No hay movimientos registrados que coincidan con los filtros aplicados.
              </div>
            ) : (
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Fecha</th>
                      <th>Billetera</th>
                      <th>Proyecto</th>
                      <th>Detalle & Proveedor</th>
                      <th>Comprobante</th>
                      <th>Estado Auditoría</th>
                      <th>Monto</th>
                      <th style={{ textAlign: 'right' }}>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredHistory.map((t) => {
                      const hasReceipt = !!(t.receiptUrl || t.receiptNumber);
                      return (
                        <tr key={t.id}>
                          <td style={{ whiteSpace: 'nowrap', fontSize: '0.85rem' }}>{t.date}</td>
                          <td>
                            <span style={{ 
                              padding: '3px 7px', 
                              borderRadius: '12px', 
                              fontSize: '0.72rem',
                              fontWeight: 600,
                              backgroundColor: t.wallet === 'Mercado Pago' ? 'rgba(0, 158, 227, 0.2)' : (t.wallet === 'Efectivo' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255, 179, 0, 0.2)'),
                              color: t.wallet === 'Mercado Pago' ? '#38bdf8' : (t.wallet === 'Efectivo' ? '#10b981' : '#fbbf24')
                            }}>
                              {t.wallet}
                            </span>
                          </td>
                          <td>
                            {t.project ? (
                              <span style={{
                                padding: '2px 6px',
                                borderRadius: '4px',
                                backgroundColor: 'rgba(99, 102, 241, 0.1)',
                                color: 'var(--accent-color)',
                                fontSize: '0.75rem',
                                fontWeight: 600
                              }}>
                                {t.project}
                              </span>
                            ) : <span className="text-secondary text-xs">-</span>}
                          </td>
                          <td>
                            <div className="font-semibold text-sm flex items-center gap-1.5">
                              {t.type === 'advance' && (
                                <span style={{ padding: '2px 6px', borderRadius: '4px', fontSize: '0.68rem', backgroundColor: '#f59e0b', color: '#000', fontWeight: 700 }}>
                                  ANTICIPO
                                </span>
                              )}
                              {t.type === 'settlement' && (
                                <span style={{ padding: '2px 6px', borderRadius: '4px', fontSize: '0.68rem', backgroundColor: '#38bdf8', color: '#000', fontWeight: 700 }}>
                                  RENDICIÓN
                                </span>
                              )}
                              <span>{t.concept}</span>
                            </div>
                            {(t.recipient || t.advanceHolder) && (
                              <div className="text-xs text-secondary mt-0.5">
                                {t.type === 'income' ? 'De: ' : (t.type === 'advance' ? 'Responsable: ' : 'Para: ')} 
                                <span className="text-white/80">{t.recipient || t.advanceHolder}</span>
                              </div>
                            )}
                          </td>
                          
                          {/* Columna Comprobante Digital */}
                          <td>
                            {hasReceipt ? (
                              <button 
                                className="receipt-chip"
                                onClick={() => setSelectedReceiptTx(t)}
                                title="Ver comprobante digital adjunto"
                              >
                                <Paperclip size={12} />
                                <span className="truncate" style={{ maxWidth: '120px' }}>
                                  {t.receiptNumber || t.receiptType || 'Comprobante'}
                                </span>
                              </button>
                            ) : (
                              <button
                                className="text-xs text-secondary"
                                style={{ background: 'none', border: 'none', cursor: 'pointer', opacity: 0.6 }}
                                onClick={() => setSelectedReceiptTx(t)}
                                title="Sin comprobante. Clic para ver detalles"
                              >
                                Sin adjunto
                              </button>
                            )}
                          </td>

                          {/* Columna Estado de Auditoría */}
                          <td>
                            {renderStatusBadge(t)}
                          </td>

                          {/* Monto */}
                          <td style={{ whiteSpace: 'nowrap' }} className={t.amount > 0 ? "text-success font-semibold" : (t.type === 'advance' ? "text-warning font-semibold" : "text-danger")}>
                            {t.amount > 0 ? '+' : ''}{Math.abs(t.amount).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                          </td>

                          {/* Acciones */}
                          <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                            <div className="flex items-center justify-end gap-1">
                              <button 
                                className="btn btn-outline" 
                                style={{ padding: '4px 6px', borderColor: 'transparent', color: 'var(--text-secondary)' }}
                                onClick={() => setSelectedReceiptTx(t)}
                                title="Ver ficha y comprobante completo"
                              >
                                <Eye size={15} />
                              </button>
                              <button 
                                className="btn btn-outline" 
                                style={{ padding: '4px 6px', borderColor: 'transparent', color: 'var(--danger)' }}
                                onClick={() => deleteTransaction(t.id)}
                                title="Borrar este movimiento"
                              >
                                <Trash2 size={15} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Módulo de la Matriz Comunitaria y Colmena */}
        {activeTab === 'community' && (
          <CommunityMatrix />
        )}

        {/* Módulo de Gestión Vehicular */}
        {activeTab === 'vehicle' && (
          <VehicleManager />
        )}

      </main>

      {/* Visor Modal de Comprobante / Expediente Digital */}
      {selectedReceiptTx && (
        <ReceiptViewerModal 
          transaction={selectedReceiptTx}
          onClose={() => setSelectedReceiptTx(null)}
          onUpdateStatus={handleUpdateStatus}
        />
      )}
    </div>
  );
}

export default App;
