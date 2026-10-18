import React, { useState, useEffect, useMemo } from 'react';
import { 
  Wallet, Plus, TrendingDown, ArrowRight, CheckCircle2, 
  Share2, RefreshCw, Trash2, Tag, Calendar, Sparkles, 
  Layers, Users, Shield, Clock, ExternalLink, HelpCircle,
  FileText, Check, AlertCircle, ArrowUpRight, Search, Filter
} from 'lucide-react';
import { elementsService } from '../services/elementsService';

export default function UserSpace({
  currentUser,
  wallets = [],
  onNavigateToWallet = null,
  onNavigateToTab = null
}) {
  const [selectedWalletId, setSelectedWalletId] = useState(() => {
    return wallets[0]?.id || 'wallet-elementales';
  });
  const [selectedElementId, setSelectedElementId] = useState('');
  const [selectedMilestoneId, setSelectedMilestoneId] = useState('');

  // Formulario de gasto rápido
  const [amount, setAmount] = useState('');
  const [concept, setConcept] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [category, setCategory] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successFeedback, setSuccessFeedback] = useState(null);

  // Estados de lista y filtros de historial de usuario
  const [userExpenses, setUserExpenses] = useState([]);
  const [historyFilterWallet, setHistoryFilterWallet] = useState('all');
  const [historySearchTerm, setHistorySearchTerm] = useState('');

  // Modal para re-direccionar un gasto
  const [redirectingTx, setRedirectingTx] = useState(null);
  const [redirectWalletId, setRedirectWalletId] = useState('');
  const [redirectElementId, setRedirectElementId] = useState('');

  // Cargar gastos del usuario actual
  const loadUserExpenses = () => {
    if (!currentUser?.id && !currentUser?.name) return;
    const txs = elementsService.getUserExpenses(currentUser.id || currentUser.name);
    setUserExpenses(txs);
  };

  useEffect(() => {
    loadUserExpenses();
  }, [currentUser]);

  // Si la billetera cambia, reiniciar el elemento seleccionado si no pertenece a ella
  const availableElementsForWallet = useMemo(() => {
    if (!selectedWalletId) return [];
    return (elementsService.elements || []).filter(e => {
      const isDirect = e.walletId === selectedWalletId || (!e.walletId && selectedWalletId === 'wallet-elementales');
      const isCoOwned = Array.isArray(e.walletIds) && e.walletIds.includes(selectedWalletId);
      return isDirect || isCoOwned;
    });
  }, [selectedWalletId]);

  // Hitos activos para el elemento seleccionado
  const availableMilestonesForElement = useMemo(() => {
    if (!selectedElementId) return [];
    return elementsService.getActiveMilestones(selectedElementId);
  }, [selectedElementId]);

  // Formateador monetario seguro
  const safeFormatCurrency = (val, decimals = 0) => {
    const num = Number(val) || 0;
    return `$${num.toLocaleString('es-AR', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    })}`;
  };

  // Enviar y Direccionar el Gasto
  const handleRecordDirectedExpense = async (e) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (!numAmount || numAmount <= 0) {
      alert("Por favor ingresá un monto válido.");
      return;
    }
    if (!selectedWalletId) {
      alert("Por favor seleccioná la billetera a la que corresponde este gasto.");
      return;
    }

    setIsSubmitting(true);
    try {
      const targetWallet = wallets.find(w => w.id === selectedWalletId);
      const targetElem = selectedElementId ? availableElementsForWallet.find(e => e.id === selectedElementId) : null;

      const tx = await elementsService.recordDirectedExpense({
        walletId: selectedWalletId,
        elementId: selectedElementId || null,
        memberId: currentUser?.id || 'ramiro',
        memberName: currentUser?.name || 'Ramiro',
        amount: numAmount,
        concept: concept.trim() || (targetElem ? `Gasto en ${targetElem.name}` : `Gasto de ${targetWallet?.name || 'Billetera'}`),
        date,
        milestoneId: selectedMilestoneId || null,
        category: category || (targetElem ? targetElem.category : 'General')
      });

      // Feedback visual enriquecido
      setSuccessFeedback({
        tx,
        walletName: targetWallet?.name || 'Billetera',
        elementName: targetElem?.name || null,
        amount: numAmount
      });

      // Resetear campos principales de entrada
      setAmount('');
      setConcept('');
      loadUserExpenses();

      // Ocultar feedback automáticamente después de 6 segundos
      setTimeout(() => {
        setSuccessFeedback(null);
      }, 6000);
    } catch (err) {
      console.error("Error al registrar gasto direccionado:", err);
      alert("No se pudo registrar el gasto: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Eliminar un gasto cargado por el usuario
  const handleDeleteTx = async (txId) => {
    if (!window.confirm("¿Estás seguro de que deseas eliminar este gasto? El saldo de la billetera o elemento será reintegrado.")) {
      return;
    }
    await elementsService.deleteElementTransaction(txId);
    loadUserExpenses();
  };

  // Confirmar re-direccionamiento
  const handleConfirmRedirect = async () => {
    if (!redirectingTx) return;
    await elementsService.redirectTransaction(redirectingTx.id, redirectWalletId, redirectElementId || null);
    setRedirectingTx(null);
    loadUserExpenses();
  };

  // Métricas calculadas para el usuario actual
  const userMetrics = useMemo(() => {
    let totalSpent = 0;
    const spentByWallet = {};

    userExpenses.forEach(tx => {
      const amt = Number(tx.amount) || 0;
      totalSpent += amt;
      const wName = tx.walletName || (wallets.find(w => w.id === tx.walletId)?.name) || 'Otras';
      spentByWallet[wName] = (spentByWallet[wName] || 0) + amt;
    });

    return {
      totalSpent,
      txCount: userExpenses.length,
      spentByWallet
    };
  }, [userExpenses, wallets]);

  // Filtrado de la tabla de gastos
  const filteredUserExpenses = useMemo(() => {
    return userExpenses.filter(tx => {
      if (historyFilterWallet !== 'all') {
        if (tx.walletId !== historyFilterWallet) return false;
      }
      if (historySearchTerm.trim()) {
        const term = historySearchTerm.toLowerCase();
        const cMatch = (tx.concept || '').toLowerCase().includes(term);
        const eMatch = (tx.elementName || '').toLowerCase().includes(term);
        const wMatch = (tx.walletName || '').toLowerCase().includes(term);
        if (!cMatch && !eMatch && !wMatch) return false;
      }
      return true;
    });
  }, [userExpenses, historyFilterWallet, historySearchTerm]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '1080px', margin: '0 auto', width: '100%' }}>
      
      {/* ======================================================== */}
      {/* 1. CABECERA: IDENTIDAD DEL ESPACIO DE USUARIO           */}
      {/* ======================================================== */}
      <div 
        style={{
          background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
          borderRadius: '26px',
          padding: '24px 28px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 4px 20px -2px rgba(15, 23, 42, 0.05)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div 
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '20px',
              background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.6rem',
              fontWeight: 900,
              boxShadow: '0 8px 18px rgba(79, 70, 229, 0.3)',
              flexShrink: 0
            }}
          >
            {currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : '👤'}
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <h2 style={{ fontSize: '1.45rem', fontWeight: 900, color: '#0f172a', margin: 0, letterSpacing: '-0.02em' }}>
                Espacio de {currentUser?.name || 'Usuario'}
              </h2>
              <span style={{ fontSize: '0.7rem', fontWeight: 800, padding: '3px 10px', borderRadius: '9999px', background: '#e0e7ff', color: '#4338ca', border: '1px solid #c7d2fe' }}>
                {currentUser?.role || 'Miembro Activo'}
              </span>
            </div>
            <p style={{ fontSize: '0.82rem', color: '#64748b', margin: '4px 0 0 0', fontWeight: 500 }}>
              Cargá y direccioná tus gastos sin tener que entrar a cada billetera o elemento individualmente.
            </p>
          </div>
        </div>

        {/* Acceso Rápido a Billeteras */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {onNavigateToTab && (
            <button
              type="button"
              onClick={() => onNavigateToTab('elements')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '9px 18px',
                borderRadius: '14px',
                fontSize: '0.82rem',
                fontWeight: 700,
                backgroundColor: '#ffffff',
                color: '#334155',
                border: '1px solid #cbd5e1',
                cursor: 'pointer',
                boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                transition: 'all 0.15s ease'
              }}
              title="Ir al gestor general de billeteras colectivas"
            >
              <Wallet size={15} color="#4f46e5" />
              <span>Ver Billeteras Colectivas</span>
            </button>
          )}
        </div>
      </div>

      {/* ======================================================== */}
      {/* 2. CARGADOR CENTRAL DE GASTOS CON DIRECCIONAMIENTO       */}
      {/* ======================================================== */}
      <div 
        style={{
          background: '#ffffff',
          borderRadius: '28px',
          padding: '28px 32px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 10px 25px -4px rgba(15, 23, 42, 0.06)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', paddingBottom: '16px', borderBottom: '1px solid #f1f5f9' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '1.25rem' }}>💸</span>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 900, color: '#0f172a', margin: 0 }}>
                Subir y Direccionar Nuevo Gasto
              </h3>
            </div>
            <span style={{ fontSize: '0.78rem', color: '#64748b', display: 'block', marginTop: '3px' }}>
              Completá el monto y asigná a qué billetera o bolsillo debe imputarse este gasto.
            </span>
          </div>

          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#10b981', background: '#ecfdf5', padding: '4px 12px', borderRadius: '9999px', border: '1px solid #a7f3d0' }}>
            ⚡ 1 Solo Toque
          </span>
        </div>

        <form onSubmit={handleRecordDirectedExpense} style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
          
          {/* Fila 1: Monto y Concepto */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '18px' }}>
            
            {/* Campo de Monto */}
            <div>
              <label style={{ fontSize: '0.78rem', fontWeight: 800, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: '8px' }}>
                Monto del Gasto *
              </label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', fontSize: '1.3rem', fontWeight: 900, color: '#94a3b8' }}>
                  $
                </span>
                <input 
                  type="number"
                  required
                  min="1"
                  step="any"
                  placeholder="0,00"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '14px 16px 14px 38px',
                    borderRadius: '16px',
                    border: '2px solid #e2e8f0',
                    fontSize: '1.35rem',
                    fontWeight: 900,
                    color: '#0f172a',
                    background: '#f8fafc',
                    outline: 'none',
                    transition: 'all 0.15s ease'
                  }}
                  onFocus={e => e.target.style.borderColor = '#4f46e5'}
                  onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                />
              </div>

              {/* Botones de adición rápida */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '8px', flexWrap: 'wrap' }}>
                {[1000, 5000, 10000, 25000, 50000].map(val => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => {
                      const cur = parseFloat(amount) || 0;
                      setAmount((cur + val).toString());
                    }}
                    style={{
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      padding: '4px 10px',
                      borderRadius: '8px',
                      background: '#f1f5f9',
                      color: '#475569',
                      border: '1px solid #e2e8f0',
                      cursor: 'pointer'
                    }}
                  >
                    +${(val / 1000)}k
                  </button>
                ))}
              </div>
            </div>

            {/* Campo de Concepto y Fecha */}
            <div>
              <label style={{ fontSize: '0.78rem', fontWeight: 800, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: '8px' }}>
                Concepto o Detalle *
              </label>
              <input 
                type="text"
                required
                placeholder="Ej: Nafta para traslado, verduras para viandas, insumos..."
                value={concept}
                onChange={e => setConcept(e.target.value)}
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  borderRadius: '16px',
                  border: '2px solid #e2e8f0',
                  fontSize: '0.95rem',
                  fontWeight: 600,
                  color: '#0f172a',
                  background: '#f8fafc',
                  outline: 'none',
                  transition: 'all 0.15s ease'
                }}
                onFocus={e => e.target.style.borderColor = '#4f46e5'}
                onBlur={e => e.target.style.borderColor = '#e2e8f0'}
              />

              {/* Sugerencias Rápidas */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '8px', flexWrap: 'wrap' }}>
                {['Nafta Clio', 'Verdulería', 'Insumos Arepas', 'Logística Puesto', 'Herramientas', 'Despensa'].map(sug => (
                  <button
                    key={sug}
                    type="button"
                    onClick={() => setConcept(sug)}
                    style={{
                      fontSize: '0.72rem',
                      fontWeight: 600,
                      padding: '4px 10px',
                      borderRadius: '8px',
                      background: concept === sug ? '#e0e7ff' : '#f8fafc',
                      color: concept === sug ? '#4338ca' : '#64748b',
                      border: '1px solid #e2e8f0',
                      cursor: 'pointer'
                    }}
                  >
                    {sug}
                  </button>
                ))}
              </div>
            </div>

          </div>

          {/* ======================================================== */}
          {/* PASO 1: SELECCIONAR BILLETERA DESTINO                     */}
          {/* ======================================================== */}
          <div style={{ background: '#f8fafc', padding: '18px 20px', borderRadius: '20px', border: '1px solid #e2e8f0' }}>
            <label style={{ fontSize: '0.78rem', fontWeight: 800, color: '#1e293b', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px' }}>
              <Wallet size={15} color="#4f46e5" />
              <span>1. ¿A qué Billetera pertenece este gasto? *</span>
            </label>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px' }}>
              {wallets.map(w => {
                const isSelected = selectedWalletId === w.id;
                const wElems = (elementsService.elements || []).filter(e => (e.walletId || 'wallet-elementales') === w.id);
                return (
                  <button
                    key={w.id}
                    type="button"
                    onClick={() => {
                      setSelectedWalletId(w.id);
                      setSelectedElementId(''); // Reset element when wallet changes
                    }}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'flex-start',
                      padding: '14px 16px',
                      borderRadius: '16px',
                      backgroundColor: isSelected ? '#eef2ff' : '#ffffff',
                      border: isSelected ? '2px solid #4f46e5' : '1px solid #cbd5e1',
                      cursor: 'pointer',
                      textAlign: 'left',
                      boxShadow: isSelected ? '0 4px 14px rgba(79, 70, 229, 0.15)' : '0 1px 3px rgba(0,0,0,0.02)',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', marginBottom: '6px' }}>
                      <span style={{ fontSize: '1.4rem' }}>{w.icon || '🐝'}</span>
                      {isSelected && (
                        <span style={{ width: '20px', height: '20px', borderRadius: '50%', background: '#4f46e5', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 900 }}>
                          ✓
                        </span>
                      )}
                    </div>
                    <span style={{ fontSize: '0.9rem', fontWeight: 800, color: isSelected ? '#1e1b4b' : '#0f172a' }}>
                      {w.name}
                    </span>
                    <span style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '2px' }}>
                      {wElems.length} bolsillos/elementos
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ======================================================== */}
          {/* PASO 2: SELECCIONAR ELEMENTO DENTRO DE ESA BILLETERA     */}
          {/* ======================================================== */}
          <div style={{ background: '#f8fafc', padding: '18px 20px', borderRadius: '20px', border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <label style={{ fontSize: '0.78rem', fontWeight: 800, color: '#1e293b', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Layers size={15} color="#4f46e5" />
                <span>2. Asignar a un Elemento / Bolsillo (Opcional)</span>
              </label>
              <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
                Podés cargarlo directo a la billetera o especificar el bolsillo
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
              
              {/* Opción 1: Directo a la billetera (Sin elemento específico) */}
              <button
                type="button"
                onClick={() => {
                  setSelectedElementId('');
                  setSelectedMilestoneId('');
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '12px 14px',
                  borderRadius: '14px',
                  backgroundColor: selectedElementId === '' ? '#eef2ff' : '#ffffff',
                  border: selectedElementId === '' ? '2px solid #4f46e5' : '1px solid #cbd5e1',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.15s ease'
                }}
              >
                <span style={{ fontSize: '1.2rem' }}>⚡</span>
                <div>
                  <span style={{ fontSize: '0.82rem', fontWeight: 800, color: selectedElementId === '' ? '#1e1b4b' : '#0f172a', display: 'block' }}>
                    Gasto Directo
                  </span>
                  <span style={{ fontSize: '0.68rem', color: '#64748b' }}>
                    Sin elemento específico
                  </span>
                </div>
              </button>

              {/* Opción 2: Los elementos pertenecientes a esta billetera */}
              {availableElementsForWallet.map(el => {
                const isSelected = selectedElementId === el.id;
                const stats = elementsService.getElementStats(el.id);
                return (
                  <button
                    key={el.id}
                    type="button"
                    onClick={() => {
                      setSelectedElementId(el.id);
                      setSelectedMilestoneId('');
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '12px 14px',
                      borderRadius: '14px',
                      backgroundColor: isSelected ? '#eef2ff' : '#ffffff',
                      border: isSelected ? '2px solid #4f46e5' : '1px solid #cbd5e1',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <span style={{ fontSize: '1.25rem' }}>{el.icon || '📦'}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ fontSize: '0.82rem', fontWeight: 800, color: isSelected ? '#1e1b4b' : '#0f172a', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {el.name}
                      </span>
                      <span style={{ fontSize: '0.68rem', color: '#64748b' }}>
                        Saldo: {safeFormatCurrency(stats.currentBalance)}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* PASO 3: Si el elemento tiene Hitos Temporales Activos */}
            {availableMilestonesForElement.length > 0 && (
              <div style={{ marginTop: '14px', paddingTop: '14px', borderTop: '1px solid #e2e8f0' }}>
                <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#b45309', display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '8px' }}>
                  <span>🎪 Este elemento tiene hitos activos:</span>
                </span>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={() => setSelectedMilestoneId('')}
                    style={{
                      padding: '5px 12px',
                      borderRadius: '10px',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      backgroundColor: selectedMilestoneId === '' ? '#fef3c7' : '#ffffff',
                      color: selectedMilestoneId === '' ? '#92400e' : '#64748b',
                      border: selectedMilestoneId === '' ? '1.5px solid #f59e0b' : '1px solid #e2e8f0',
                      cursor: 'pointer'
                    }}
                  >
                    General (Sin hito específico)
                  </button>
                  {availableMilestonesForElement.map(m => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setSelectedMilestoneId(m.id)}
                      style={{
                        padding: '5px 12px',
                        borderRadius: '10px',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        backgroundColor: selectedMilestoneId === m.id ? '#fef3c7' : '#ffffff',
                        color: selectedMilestoneId === m.id ? '#92400e' : '#64748b',
                        border: selectedMilestoneId === m.id ? '1.5px solid #f59e0b' : '1px solid #e2e8f0',
                        cursor: 'pointer'
                      }}
                    >
                      🎪 {m.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Fila Inferior: Botón de Envío y Feedback */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                width: '100%',
                padding: '16px',
                borderRadius: '16px',
                fontSize: '0.98rem',
                fontWeight: 900,
                backgroundColor: isSubmitting ? '#94a3b8' : '#4f46e5',
                color: '#ffffff',
                border: 'none',
                cursor: isSubmitting ? 'default' : 'pointer',
                boxShadow: '0 6px 18px rgba(79, 70, 229, 0.35)',
                transition: 'all 0.15s ease'
              }}
            >
              <Check size={18} strokeWidth={2.5} />
              <span>{isSubmitting ? 'Guardando gasto...' : '🚀 Registrar y Direccionar Gasto'}</span>
            </button>

            {/* Mensaje de Confirmación / Éxito */}
            {successFeedback && (
              <div 
                style={{
                  padding: '14px 18px',
                  borderRadius: '14px',
                  backgroundColor: '#ecfdf5',
                  border: '1px solid #a7f3d0',
                  color: '#065f46',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '10px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <CheckCircle2 size={18} color="#059669" />
                  <span>
                    ¡Gasto de <strong>{safeFormatCurrency(successFeedback.amount)}</strong> direccionado con éxito a <strong>{successFeedback.walletName}</strong> {successFeedback.elementName ? `➔ ${successFeedback.elementName}` : ''}!
                  </span>
                </div>

                {/* Compartir Comprobante por WhatsApp */}
                <button
                  type="button"
                  onClick={() => {
                    const msg = `👋 Registré un gasto en Banca Abeja:\n\n📝 Detalle: ${successFeedback.tx.concept}\n💰 Monto: ${safeFormatCurrency(successFeedback.amount)}\n👛 Billetera: ${successFeedback.walletName}\n${successFeedback.elementName ? `📦 Elemento: ${successFeedback.elementName}\n` : ''}📅 Fecha: ${successFeedback.tx.date}\n👤 Cargado por: ${currentUser?.name || 'Ramiro'}`;
                    const url = `https://wa.me/?text=${encodeURIComponent(msg)}`;
                    window.open(url, '_blank');
                  }}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 14px',
                    borderRadius: '10px',
                    backgroundColor: '#10b981',
                    color: '#ffffff',
                    fontSize: '0.75rem',
                    fontWeight: 800,
                    border: 'none',
                    cursor: 'pointer'
                  }}
                >
                  <Share2 size={13} />
                  <span>Avisar por WhatsApp</span>
                </button>
              </div>
            )}
          </div>
        </form>
      </div>

      {/* ======================================================== */}
      {/* 3. RESUMEN DE GASTOS CARGADOS POR EL USUARIO             */}
      {/* ======================================================== */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
        
        {/* Tarjeta 1: Total Acumulado */}
        <div style={{ background: '#ffffff', padding: '20px 24px', borderRadius: '22px', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: '4px' }}>
            Total Gastado / Subido por Vos
          </span>
          <span style={{ fontSize: '1.9rem', fontWeight: 900, color: '#0f172a', display: 'block', lineHeight: 1.15 }}>
            {safeFormatCurrency(userMetrics.totalSpent)}
          </span>
          <span style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '4px', display: 'block' }}>
            En {userMetrics.txCount} registro{userMetrics.txCount !== 1 ? 's' : ''} cargados
          </span>
        </div>

        {/* Tarjeta 2: Distribución por Billeteras */}
        <div style={{ background: '#ffffff', padding: '20px 24px', borderRadius: '22px', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: '8px' }}>
            Distribución por Billetera
          </span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {Object.entries(userMetrics.spentByWallet).length === 0 ? (
              <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Aún no registraste gastos.</span>
            ) : (
              Object.entries(userMetrics.spentByWallet).map(([wName, amt]) => {
                const pct = userMetrics.totalSpent > 0 ? Math.round((amt / userMetrics.totalSpent) * 100) : 0;
                return (
                  <div key={wName} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                    <span style={{ fontWeight: 700, color: '#334155' }}>{wName}:</span>
                    <span style={{ fontWeight: 800, color: '#0f172a' }}>
                      {safeFormatCurrency(amt)} <span style={{ color: '#64748b', fontWeight: 500 }}>({pct}%)</span>
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 4. HISTORIAL DE GASTOS REGISTRADOS POR EL USUARIO        */}
      {/* ======================================================== */}
      <div style={{ background: '#ffffff', borderRadius: '26px', padding: '24px 28px', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
        
        {/* Cabecera y Filtros de la Lista */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '18px', paddingBottom: '14px', borderBottom: '1px solid #f1f5f9' }}>
          <div>
            <h4 style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
              Tus Gastos Registrados ({filteredUserExpenses.length})
            </h4>
            <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
              Historial de movimientos imputados por {currentUser?.name || 'vos'} con sus destinos asignados.
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            {/* Buscador */}
            <div style={{ position: 'relative' }}>
              <Search size={13} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input 
                type="text"
                placeholder="Buscar por concepto..."
                value={historySearchTerm}
                onChange={e => setHistorySearchTerm(e.target.value)}
                style={{
                  padding: '6px 12px 6px 28px',
                  borderRadius: '10px',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.75rem',
                  outline: 'none',
                  background: '#f8fafc'
                }}
              />
            </div>

            {/* Filtro por Billetera */}
            <select
              value={historyFilterWallet}
              onChange={e => setHistoryFilterWallet(e.target.value)}
              style={{
                padding: '6px 12px',
                borderRadius: '10px',
                border: '1px solid #cbd5e1',
                fontSize: '0.75rem',
                fontWeight: 600,
                color: '#334155',
                background: '#f8fafc',
                outline: 'none'
              }}
            >
              <option value="all">Todas las Billeteras</option>
              {wallets.map(w => (
                <option key={w.id} value={w.id}>{w.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Lista de Gastos */}
        {filteredUserExpenses.length === 0 ? (
          <div style={{ padding: '36px', textAlign: 'center', background: '#f8fafc', borderRadius: '18px', border: '1px solid #e2e8f0' }}>
            <span style={{ fontSize: '2rem', display: 'block', marginBottom: '8px' }}>📂</span>
            <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#1e293b', display: 'block' }}>
              No se encontraron gastos cargados con los filtros actuales
            </span>
            <p style={{ fontSize: '0.75rem', color: '#64748b', margin: '4px 0 0 0' }}>
              Utilizá el formulario de arriba para cargar tu primer gasto y direccionarlo a la billetera que quieras.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {filteredUserExpenses.map(tx => {
              const targetWallet = wallets.find(w => w.id === tx.walletId) || { name: tx.walletName || 'Billetera', icon: '👛' };
              const targetElem = tx.elementId ? (elementsService.elements || []).find(e => e.id === tx.elementId) : null;

              return (
                <div 
                  key={tx.id}
                  style={{
                    padding: '14px 18px',
                    borderRadius: '16px',
                    backgroundColor: '#ffffff',
                    border: '1px solid #e2e8f0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '12px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {/* Info del Gasto */}
                  <div style={{ flex: '1 1 240px', minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.88rem' }}>
                        {tx.concept}
                      </span>
                      
                      {/* Badge de Billetera Destino */}
                      <span style={{ fontSize: '0.7rem', fontWeight: 800, background: '#eef2ff', color: '#4338ca', padding: '2px 8px', borderRadius: '8px', border: '1px solid #c7d2fe', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <span>{targetWallet.icon || '👛'}</span>
                        <span>{targetWallet.name}</span>
                      </span>

                      {/* Badge de Elemento Destino si tiene */}
                      {targetElem && (
                        <span style={{ fontSize: '0.7rem', fontWeight: 800, background: '#f1f5f9', color: '#334155', padding: '2px 8px', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <span>➔ {targetElem.icon || '📦'}</span>
                          <span>{targetElem.name}</span>
                        </span>
                      )}

                      {/* Badge de Hito si tiene */}
                      {tx.milestoneId && (
                        <span style={{ fontSize: '0.68rem', fontWeight: 700, background: '#fef3c7', color: '#92400e', padding: '2px 7px', borderRadius: '8px', border: '1px solid #fde68a' }}>
                          🎪 Hito asignado
                        </span>
                      )}
                    </div>

                    <span style={{ fontSize: '0.72rem', color: '#64748b', display: 'block', marginTop: '3px' }}>
                      {tx.date} • Imputado por {tx.memberName || currentUser?.name || 'Ramiro'}
                    </span>
                  </div>

                  {/* Monto y Botones de Acción */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexShrink: 0 }}>
                    <span style={{ fontSize: '1.05rem', fontWeight: 900, color: '#e11d48' }}>
                      -{safeFormatCurrency(tx.amount)}
                    </span>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {/* Botón Re-direccionar */}
                      <button
                        type="button"
                        onClick={() => {
                          setRedirectingTx(tx);
                          setRedirectWalletId(tx.walletId || wallets[0]?.id || 'wallet-elementales');
                          setRedirectElementId(tx.elementId || '');
                        }}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '6px 10px',
                          borderRadius: '8px',
                          backgroundColor: '#f1f5f9',
                          color: '#475569',
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          border: '1px solid #e2e8f0',
                          cursor: 'pointer'
                        }}
                        title="Cambiar la billetera o elemento de este gasto"
                      >
                        <RefreshCw size={12} />
                        <span>Re-direccionar</span>
                      </button>

                      {/* Botón Eliminar */}
                      <button
                        type="button"
                        onClick={() => handleDeleteTx(tx.id)}
                        style={{
                          padding: '6px',
                          borderRadius: '8px',
                          backgroundColor: '#fff1f2',
                          color: '#e11d48',
                          border: '1px solid #fecdd3',
                          cursor: 'pointer'
                        }}
                        title="Eliminar gasto y restaurar saldo"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>

                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* MODAL: RE-DIRECCIONAR GASTO                             */}
      {/* ======================================================== */}
      {redirectingTx && (
        <div 
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 60,
            background: 'rgba(15, 23, 42, 0.6)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px'
          }}
          onClick={() => setRedirectingTx(null)}
        >
          <div 
            style={{
              background: '#ffffff',
              borderRadius: '24px',
              padding: '24px 28px',
              maxWidth: '480px',
              width: '100%',
              boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
              border: '1px solid #e2e8f0'
            }}
            onClick={e => e.stopPropagation()}
          >
            <h3 style={{ fontSize: '1.1rem', fontWeight: 900, color: '#0f172a', margin: '0 0 6px 0' }}>
              🔄 Re-direccionar Gasto
            </h3>
            <p style={{ fontSize: '0.78rem', color: '#64748b', margin: '0 0 16px 0' }}>
              Cambiá la billetera o el elemento donde debe computarse este gasto de <strong>{safeFormatCurrency(redirectingTx.amount)}</strong> ("{redirectingTx.concept}").
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#334155', display: 'block', marginBottom: '6px' }}>
                  Nueva Billetera Destino:
                </label>
                <select
                  value={redirectWalletId}
                  onChange={e => {
                    setRedirectWalletId(e.target.value);
                    setRedirectElementId('');
                  }}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '12px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    outline: 'none',
                    background: '#f8fafc'
                  }}
                >
                  {wallets.map(w => (
                    <option key={w.id} value={w.id}>
                      {w.icon || '👛'} {w.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#334155', display: 'block', marginBottom: '6px' }}>
                  Elemento / Bolsillo (Opcional):
                </label>
                <select
                  value={redirectElementId}
                  onChange={e => setRedirectElementId(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '12px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    outline: 'none',
                    background: '#f8fafc'
                  }}
                >
                  <option value="">⚡ Gasto Directo de la Billetera (Sin elemento)</option>
                  {(elementsService.elements || [])
                    .filter(e => e.walletId === redirectWalletId || (!e.walletId && redirectWalletId === 'wallet-elementales'))
                    .map(el => (
                      <option key={el.id} value={el.id}>
                        {el.icon || '📦'} {el.name}
                      </option>
                    ))}
                </select>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setRedirectingTx(null)}
                  style={{
                    flex: 1,
                    padding: '10px',
                    borderRadius: '12px',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    backgroundColor: '#f1f5f9',
                    color: '#475569',
                    border: 'none',
                    cursor: 'pointer'
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleConfirmRedirect}
                  style={{
                    flex: 1,
                    padding: '10px',
                    borderRadius: '12px',
                    fontSize: '0.82rem',
                    fontWeight: 800,
                    backgroundColor: '#4f46e5',
                    color: '#ffffff',
                    border: 'none',
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(79, 70, 229, 0.25)'
                  }}
                >
                  Confirmar Cambio
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
