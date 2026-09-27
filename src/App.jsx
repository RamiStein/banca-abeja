import { useState, useCallback, useMemo } from 'react';
import { UploadCloud, Wallet, TrendingUp, TrendingDown, LayoutDashboard, History, Trash2, Plus, X, Tag, User, Car, Layers } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { parseCSV } from './utils/parser';
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

function App() {
  const [transactions, setTransactions] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [activeTab, setActiveTab] = useState('community');
  
  // Filtros del historial
  const [filterProject, setFilterProject] = useState('');
  const [filterRecipient, setFilterRecipient] = useState('');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  
  // Estado para carga manual
  const [showManualForm, setShowManualForm] = useState(false);
  const [manualEntry, setManualEntry] = useState({
    date: new Date().toISOString().split('T')[0],
    concept: '',
    amount: '',
    type: 'income',
    wallet: 'Pago Fácil',
    recipient: '',
    project: '' 
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
          .map((t, i) => ({ ...t, id: `${Date.now()}-${Math.random()}-${i}` })); 
        
        setTransactions(prev => [...prev, ...newTransactions]);
      } catch (err) {
        alert("Error al leer el archivo CSV.");
      }
    }
  }, []);

  const clearData = () => {
    if (window.confirm("¿Estás seguro de que quieres borrar TODOS los datos? Esta acción no se puede deshacer.")) {
      setTransactions([]);
    }
  };

  const deleteTransaction = (id) => {
    if (window.confirm("¿Estás seguro de que deseas eliminar este movimiento individual?")) {
      setTransactions(prev => prev.filter(t => t.id !== id));
    }
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (!manualEntry.concept || !manualEntry.amount) return;
    
    let parsedAmount = parseFloat(manualEntry.amount);
    if (manualEntry.type === 'expense' && parsedAmount > 0) {
      parsedAmount = -parsedAmount;
    } else if (manualEntry.type === 'income' && parsedAmount < 0) {
      parsedAmount = Math.abs(parsedAmount);
    }

    const newTx = {
      id: `${Date.now()}-${Math.random()}`,
      date: manualEntry.date,
      amount: parsedAmount,
      concept: manualEntry.concept.trim(),
      recipient: manualEntry.recipient.trim() || null, 
      category: parsedAmount > 0 ? 'Ingreso' : 'Gasto',
      wallet: manualEntry.wallet,
      project: manualEntry.project.trim() || null
    };

    setTransactions(prev => [...prev, newTx]);
    setShowManualForm(false);
    setManualEntry({ ...manualEntry, concept: '', amount: '', recipient: '', project: '' });
  };

  // Cálculos globales del Dashboard
  const { balance, income, expense, incomeByProject, expenseByProject } = useMemo(() => {
    let bal = 0, inc = 0, exp = 0;
    const projectMapInc = {};
    const projectMapExp = {};

    transactions.forEach(t => {
      bal += t.amount;
      if (t.amount > 0) {
        inc += t.amount;
        if (t.project) projectMapInc[t.project] = (projectMapInc[t.project] || 0) + t.amount;
      } else {
        exp += Math.abs(t.amount);
        if (t.project) projectMapExp[t.project] = (projectMapExp[t.project] || 0) + Math.abs(t.amount);
      }
    });

    bal = Math.abs(bal) < 0.001 ? 0 : bal;
    inc = Math.abs(inc) < 0.001 ? 0 : inc;
    exp = Math.abs(exp) < 0.001 ? 0 : exp;

    const listInc = Object.entries(projectMapInc).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
    const listExp = Object.entries(projectMapExp).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);

    return { balance: bal, income: inc, expense: exp, incomeByProject: listInc, expenseByProject: listExp };
  }, [transactions]);

  // Datos para el gráfico
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

  // Filtrado de historial
  const { filteredHistory, filteredSummary, breakdownByClient, breakdownByProject, breakdownByConcept } = useMemo(() => {
    let result = transactions.slice().reverse();
    
    if (filterProject) result = result.filter(t => t.project === filterProject);
    if (filterRecipient) result = result.filter(t => t.recipient === filterRecipient);
    
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

      // Solo guardamos si existe el nombre, para el desglose
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
  }, [transactions, filterProject, filterRecipient, filterStartDate, filterEndDate]);

  const hasActiveFilters = filterProject || filterRecipient || filterStartDate || filterEndDate;

  return (
    <div className="container relative">
      <header className="flex justify-between items-center mb-6 flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <span style={{ fontSize: '1.8rem' }}>🐝</span>
            Banca Abeja
          </h1>
          <p className="text-secondary mt-1">Matriz En Conjunto • Billeteras Comunitarias & Gestión de Recursos</p>
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
            Historial
          </button>
          {transactions.length > 0 && (
             <button className="btn btn-outline" style={{ borderColor: 'var(--danger)', color: 'var(--danger)' }} onClick={clearData} title="Borrar Todos los Datos">
               <Trash2 size={18} />
             </button>
          )}
        </div>
      </header>

      <main className="flex flex-col gap-6">
        
        {/* Acciones Rápidas */}
        {activeTab === 'dashboard' && (
          <div className="flex gap-4 mb-2">
             <button className="btn btn-outline" onClick={() => setShowManualForm(true)}>
                <Plus size={18} />
                Carga Manual
             </button>
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
            <UploadCloud size={48} color="#6366f1" style={{ margin: '0 auto', marginBottom: '1rem' }} />
            <h3 className="text-xl">Arrastra tus archivos CSV o Excel aquí</h3>
            <p className="text-secondary mt-2">Soporta exportaciones de Mercado Pago. (Los datos viven solo en tu navegador).</p>
          </div>
        )}

        {/* Modal de Carga Manual */}
        {showManualForm && (
          <div className="modal-overlay">
            <div className="card w-full max-w-md relative" style={{ width: '400px', maxWidth: '90%' }}>
              <button 
                className="btn btn-outline absolute top-4 right-4" 
                style={{ padding: '0.25rem', border: 'none' }}
                onClick={() => setShowManualForm(false)}
              >
                <X size={20} />
              </button>
              <h3 className="text-xl mb-4 font-bold flex items-center gap-2">
                <Plus size={20} className="text-accent" /> Nuevo Movimiento
              </h3>
              
              <form onSubmit={handleManualSubmit} className="flex flex-col gap-4">
                <div>
                  <label className="text-sm text-secondary mb-1 block">Billetera</label>
                  <select 
                    className="input"
                    value={manualEntry.wallet}
                    onChange={e => setManualEntry({...manualEntry, wallet: e.target.value})}
                  >
                    <option value="Pago Fácil">Pago Fácil</option>
                    <option value="Mercado Pago">Mercado Pago</option>
                    <option value="Efectivo">Efectivo</option>
                  </select>
                </div>

                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="text-sm text-secondary mb-1 block">Tipo de Movimiento</label>
                    <select 
                      className="input"
                      value={manualEntry.type}
                      onChange={e => setManualEntry({...manualEntry, type: e.target.value})}
                    >
                      <option value="income">Ingreso (+)</option>
                      <option value="expense">Gasto / Egreso (-)</option>
                    </select>
                  </div>
                  <div className="flex-1">
                    <label className="text-sm text-secondary mb-1 block">Fecha</label>
                    <input 
                      type="date" 
                      className="input"
                      value={manualEntry.date}
                      onChange={e => setManualEntry({...manualEntry, date: e.target.value})}
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm text-secondary mb-1 block">Concepto / Detalle</label>
                  <input 
                    type="text" 
                    className="input"
                    placeholder="Ej. Anticipo Cliente"
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
                  <label className="text-sm text-secondary mb-1 block">
                    {manualEntry.type === 'income' ? 'Emisor / Cliente (Opcional)' : 'Destinatario / Proveedor (Opcional)'}
                  </label>
                  <input 
                    type="text" 
                    className="input"
                    placeholder={manualEntry.type === 'income' ? "Ej. Gloria Maria Sepulveda" : "Ej. Juan Pérez"}
                    value={manualEntry.recipient}
                    onChange={e => setManualEntry({...manualEntry, recipient: e.target.value})}
                    list="recipients-list"
                  />
                  <datalist id="recipients-list">
                    {uniqueRecipients.map(r => <option key={r} value={r} />)}
                  </datalist>
                </div>

                <div>
                  <label className="text-sm text-secondary mb-1 block">Grupo / Proyecto (Opcional)</label>
                  <input 
                    type="text" 
                    className="input"
                    placeholder="Ej. vrde, elementales"
                    value={manualEntry.project}
                    onChange={e => setManualEntry({...manualEntry, project: e.target.value})}
                    list="projects-list"
                  />
                  <datalist id="projects-list">
                    {uniqueProjects.map(p => <option key={p} value={p} />)}
                  </datalist>
                </div>

                <div>
                  <label className="text-sm text-secondary mb-1 block">Monto</label>
                  <input 
                    type="number" 
                    step="0.01"
                    className="input"
                    placeholder="0.00"
                    value={manualEntry.amount}
                    onChange={e => setManualEntry({...manualEntry, amount: e.target.value})}
                    required
                  />
                </div>

                <button type="submit" className="btn btn-primary mt-2">
                  Guardar Movimiento
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Summary Cards */}
        {activeTab === 'dashboard' && (
          <>
            <div className="grid grid-cols-3 gap-6">
              <div className="card flex flex-col gap-2">
                <div className="flex justify-between items-center text-secondary">
                  <span className="font-semibold">Flujo Neto / Saldo</span>
                  <Wallet size={20} />
                </div>
                <span className={`text-3xl font-bold ${balance < 0 ? 'text-danger' : (balance > 0 ? 'text-success' : '')}`}>
                  {formatCurrency(balance)}
                </span>
              </div>
              
              <div className="card flex flex-col gap-2">
                <div className="flex justify-between items-center text-secondary">
                  <span className="font-semibold">Total Ingresos</span>
                  <TrendingUp size={20} className="text-success" />
                </div>
                <span className="text-3xl font-bold text-success">
                  {formatCurrency(income)}
                </span>
              </div>

              <div className="card flex flex-col gap-2">
                <div className="flex justify-between items-center text-secondary">
                  <span className="font-semibold">Total Egresos</span>
                  <TrendingDown size={20} className="text-danger" />
                </div>
                <span className="text-3xl font-bold text-danger">
                  {formatCurrency(expense, true)}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6" style={{ gridTemplateColumns: '2fr 1fr' }}>
              {/* Gráfico de Barras */}
              <div className="card">
                <h3 className="text-xl mb-4">Evolución (Últimos Días)</h3>
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

        {/* History Tab */}
        {activeTab === 'history' && (
          <div className="card flex flex-col gap-4">
            
            {/* Header de la Tabla con Filtros Integrados */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <h3 className="text-xl whitespace-nowrap">Historial de Movimientos ({filteredHistory.length})</h3>
              
              <div className="flex flex-wrap items-center gap-3">
                {uniqueProjects.length > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-secondary">Proyecto:</span>
                    <select 
                      className="input py-1 px-2 text-sm" 
                      value={filterProject} 
                      onChange={e => setFilterProject(e.target.value)}
                      style={{ width: '120px' }}
                    >
                      <option value="">Todos</option>
                      {uniqueProjects.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>
                )}

                {uniqueRecipients.length > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-secondary">Cliente:</span>
                    <select 
                      className="input py-1 px-2 text-sm" 
                      value={filterRecipient} 
                      onChange={e => setFilterRecipient(e.target.value)}
                      style={{ width: '120px' }}
                    >
                      <option value="">Todos</option>
                      {uniqueRecipients.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <span className="text-sm text-secondary">Desde:</span>
                  <input 
                    type="date" 
                    className="input py-1 px-2 text-sm" 
                    value={filterStartDate} 
                    onChange={e => setFilterStartDate(e.target.value)}
                    style={{ width: '130px' }}
                  />
                </div>
                
                <div className="flex items-center gap-2">
                  <span className="text-sm text-secondary">Hasta:</span>
                  <input 
                    type="date" 
                    className="input py-1 px-2 text-sm" 
                    value={filterEndDate} 
                    onChange={e => setFilterEndDate(e.target.value)}
                    style={{ width: '130px' }}
                  />
                </div>
              </div>
            </div>

            {/* Resumen de la vista filtrada (Totales Parciales y Desgloses) */}
            {hasActiveFilters && (
              <div className="flex flex-col gap-4 mt-2 p-4 rounded-lg mb-4" style={{ background: 'rgba(99, 102, 241, 0.05)', border: '1px solid rgba(99, 102, 241, 0.2)' }}>
                
                {/* Totales Globales del Filtro */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <div className="text-sm text-secondary mb-1">Total Ingresos</div>
                    <div className="text-xl font-bold text-success">{formatCurrency(filteredSummary.income)}</div>
                  </div>
                  <div>
                    <div className="text-sm text-secondary mb-1">Total Egresos</div>
                    <div className="text-xl font-bold text-danger">{formatCurrency(filteredSummary.expense, true)}</div>
                  </div>
                  <div>
                    <div className="text-sm text-secondary mb-1">Saldo de esta vista</div>
                    <div className={`text-xl font-bold ${filteredSummary.balance < 0 ? 'text-danger' : (filteredSummary.balance > 0 ? 'text-success' : '')}`}>
                      {formatCurrency(filteredSummary.balance)}
                    </div>
                  </div>
                </div>

                {/* Desglose de saldos */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-2 pt-4 border-t" style={{ borderColor: 'rgba(99, 102, 241, 0.2)' }}>
                  
                  {!filterRecipient && filterProject && breakdownByClient.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-secondary mb-2 uppercase tracking-wider">Desglose por Cliente:</h4>
                      <div className="flex flex-col gap-2">
                        {breakdownByClient.map(b => (
                          <div key={b.name} className="flex justify-between items-center text-sm p-2 rounded" style={{ backgroundColor: 'rgba(255, 255, 255, 0.03)' }}>
                            <span className="font-medium text-secondary">{b.name}</span>
                            <span className={`font-bold ${b.val >= 0 ? 'text-success' : 'text-danger'}`}>{formatCurrency(b.val)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {!filterProject && filterRecipient && breakdownByProject.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-secondary mb-2 uppercase tracking-wider">Desglose por Proyecto:</h4>
                      <div className="flex flex-col gap-2">
                        {breakdownByProject.map(b => (
                          <div key={b.name} className="flex justify-between items-center text-sm p-2 rounded" style={{ backgroundColor: 'rgba(255, 255, 255, 0.03)' }}>
                            <span className="font-medium text-secondary">{b.name}</span>
                            <span className={`font-bold ${b.val >= 0 ? 'text-success' : 'text-danger'}`}>{formatCurrency(b.val)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {breakdownByConcept.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-secondary mb-2 uppercase tracking-wider">Desglose por Concepto:</h4>
                      <div className="flex flex-col gap-2">
                        {breakdownByConcept.map(b => (
                          <div key={b.name} className="flex justify-between items-center text-sm p-2 rounded" style={{ backgroundColor: 'rgba(255, 255, 255, 0.03)' }}>
                            <span className="font-medium text-secondary">{b.name}</span>
                            <span className={`font-bold ${b.val >= 0 ? 'text-success' : 'text-danger'}`}>{formatCurrency(b.val)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                </div>
              </div>
            )}

            {/* Tabla de Historial */}
            {filteredHistory.length === 0 ? (
              <div className="text-center py-8 text-secondary">No hay movimientos registrados para este filtro.</div>
            ) : (
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Fecha</th>
                      <th>Billetera</th>
                      <th>Proyecto</th>
                      <th>Concepto / Detalles</th>
                      <th>Monto</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredHistory.map((t) => (
                      <tr key={t.id}>
                        <td>{t.date}</td>
                        <td>
                          <span style={{ 
                            padding: '4px 8px', 
                            borderRadius: '12px', 
                            fontSize: '0.75rem',
                            backgroundColor: t.wallet === 'Mercado Pago' ? 'rgba(0, 158, 227, 0.2)' : 'rgba(255, 179, 0, 0.2)',
                            color: t.wallet === 'Mercado Pago' ? '#38bdf8' : '#fbbf24'
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
                          ) : <span className="text-secondary text-sm">-</span>}
                        </td>
                        <td>
                          <div className="font-semibold">{t.concept}</div>
                          {t.recipient && (
                            <div className="text-sm text-secondary mt-1">
                              {t.amount > 0 ? 'De:' : 'Para:'} {t.recipient}
                            </div>
                          )}
                        </td>
                        <td className={t.amount > 0 ? "text-success font-semibold" : "text-danger"}>
                          {t.amount > 0 ? '+' : ''}{Math.abs(t.amount).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <button 
                            className="btn btn-outline" 
                            style={{ padding: '0.25rem 0.5rem', borderColor: 'transparent', color: 'var(--danger)' }}
                            onClick={() => deleteTransaction(t.id)}
                            title="Borrar este movimiento"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
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
    </div>
  );
}

export default App;
