import React, { useState, useEffect, useMemo } from 'react';
import { 
  Plus, Users, User, ArrowUpRight, ArrowDownLeft, 
  TrendingUp, TrendingDown, Eye, EyeOff, 
  ChevronRight, X, Check, ArrowRight, Trash2
} from 'lucide-react';
import { elementsService, DEFAULT_ELEMENTS } from '../services/elementsService';
import { FOUNDING_MEMBERS } from '../services/authService';

const AVAILABLE_ICONS = [
  { icon: '🤝', label: 'Intercambio / Mano a Mano', category: 'Intercambios' },
  { icon: '🎪', label: 'Feria & Eventos', category: 'Feria' },
  { icon: '🌽', label: 'Granja & Animales', category: 'Alimentos' },
  { icon: '🚗', label: 'Vehículo / Movilidad', category: 'Movilidad' },
  { icon: '🥗', label: 'Comida & Despensa', category: 'Alimentos' },
  { icon: '🏡', label: 'Hogar & Hábitat', category: 'Hábitat' },
  { icon: '🌱', label: 'Huerta & Tierra', category: 'Hábitat' },
  { icon: '⚡', label: 'Servicios & Luz', category: 'Servicios' },
  { icon: '🛠️', label: 'Taller & Herramientas', category: 'Herramientas' },
  { icon: '💼', label: 'Trabajo & Proyectos', category: 'Personal' },
  { icon: '📦', label: 'General / Otro', category: 'General' },
  { icon: '🏥', label: 'Salud & Botiquín', category: 'Salud' },
  { icon: '📚', label: 'Educación & Cursos', category: 'Educación' }
];

const safeFormatCurrency = (val, decimals = 0) => {
  const num = Number(val);
  if (isNaN(num)) return '$0';
  return `$${num.toLocaleString('es-AR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  })}`;
};

export default function ElementsManager({ 
  currentUser = null, 
  onSelectElement = null,
  activeWalletId: propActiveWalletId = null,
  onOpenCreateWallet = null
}) {
  const [elements, setElements] = useState(() => {
    const list = elementsService.elements;
    return Array.isArray(list) && list.length > 0 ? list : DEFAULT_ELEMENTS;
  });
  const [transactions, setTransactions] = useState(() => {
    const list = elementsService.transactions;
    return Array.isArray(list) ? list : [];
  });
  const [wallets, setWallets] = useState(() => elementsService.getWallets());
  const [currentWalletId, setCurrentWalletId] = useState(() => propActiveWalletId || elementsService.getActiveWalletId());

  const currentWallet = useMemo(() => {
    return (wallets || []).find(w => w.id === currentWalletId) || elementsService.getActiveWallet();
  }, [wallets, currentWalletId]);

  const [mainBalance, setMainBalance] = useState(() => {
    const bal = elementsService.getMainBalance(currentUser?.id || 'ramiro');
    return typeof bal === 'number' && !isNaN(bal) ? bal : 450000;
  });

  const [showBalance, setShowBalance] = useState(true);
  const [filterType, setFilterType] = useState('all'); // 'all' | 'shared' | 'individual'
  const [searchTerm, setSearchTerm] = useState('');

  // Modales
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createStep, setCreateStep] = useState(1); // 1: Tipo (individual vs compartido), 2: Info
  const [showTopUpModal, setShowTopUpModal] = useState(false);
  const [selectedElement, setSelectedElement] = useState(null);
  const [actionModal, setActionModal] = useState(null); // { type: 'deposit' | 'withdraw' | 'income' | 'expense', element: obj }

  // Formulario de creación
  const [newElemForm, setNewElemForm] = useState({
    name: '',
    type: 'shared', // 'shared' | 'bilateral' | 'individual'
    icon: '🚗',
    category: 'Movilidad',
    description: '',
    members: ['ramiro', 'agustina', 'cristian'],
    partnerId: 'cristian',
    walletId: currentWalletId,
    initialDeposit: ''
  });

  // Formulario de acción en elemento
  const [actionForm, setActionForm] = useState({
    amount: '',
    concept: '',
    memberId: currentUser?.id || 'ramiro',
    linkedElementId: '',
    targetMemberId: ''
  });

  // Monto para fondear cuenta principal
  const [topUpAmount, setTopUpAmount] = useState('100000');

  // Actualizar estado al cambiar usuario
  useEffect(() => {
    if (currentUser?.id) {
      setMainBalance(elementsService.getMainBalance(currentUser.id));
      setActionForm(prev => ({ ...prev, memberId: currentUser.id }));
    }
  }, [currentUser]);

  // Sincronizar billetera activa prop o eventos globales
  useEffect(() => {
    if (propActiveWalletId) {
      setCurrentWalletId(propActiveWalletId);
    }
  }, [propActiveWalletId]);

  useEffect(() => {
    const handleWalletChanged = (e) => {
      if (e?.detail?.walletId) {
        setCurrentWalletId(e.detail.walletId);
      }
    };
    const handleWalletsUpdated = () => {
      setWallets(elementsService.getWallets());
      refreshData();
    };
    window.addEventListener('banca_wallet_changed', handleWalletChanged);
    window.addEventListener('banca_wallets_updated', handleWalletsUpdated);
    return () => {
      window.removeEventListener('banca_wallet_changed', handleWalletChanged);
      window.removeEventListener('banca_wallets_updated', handleWalletsUpdated);
    };
  }, []);

  const refreshData = () => {
    setElements([...elementsService.elements]);
    setTransactions([...elementsService.transactions]);
    setWallets(elementsService.getWallets());
    setMainBalance(elementsService.getMainBalance(currentUser?.id || 'ramiro'));
  };

  // Miembros disponibles para invitar
  const availableMembers = useMemo(() => {
    return (FOUNDING_MEMBERS || []).map(m => ({
      id: m.id,
      name: m.name,
      role: m.role
    }));
  }, []);

  // Elementos filtrados pertenecientes a la billetera activa
  const filteredElements = useMemo(() => {
    return elements.filter(elem => {
      // Filtrar por pertenencia a la billetera actual
      const elemWallet = elem.walletId || 'wallet-elementales';
      if (elemWallet !== currentWalletId && !(currentWalletId === 'wallet-elementales' && !elem.walletId)) {
        return false;
      }
      if (filterType === 'shared' && elem.type !== 'shared') return false;
      if (filterType === 'bilateral' && elem.type !== 'bilateral') return false;
      if (filterType === 'individual' && elem.type !== 'individual') return false;
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchName = elem.name.toLowerCase().includes(term);
        const matchCat = (elem.category || '').toLowerCase().includes(term);
        if (!matchName && !matchCat) return false;
      }
      return true;
    });
  }, [elements, currentWalletId, filterType, searchTerm]);

  // Totales acumulados para la billetera activa
  const metrics = useMemo(() => {
    let sharedFundsTotal = 0;
    let bilateralFundsTotal = 0;
    let individualFundsTotal = 0;

    const walletElems = elements.filter(elem => {
      const elemWallet = elem.walletId || 'wallet-elementales';
      return elemWallet === currentWalletId || (currentWalletId === 'wallet-elementales' && !elem.walletId);
    });

    walletElems.forEach(elem => {
      const stats = elementsService.getElementStats(elem.id);
      if (elem.type === 'shared') {
        sharedFundsTotal += Math.max(0, stats.currentBalance);
      } else if (elem.type === 'bilateral') {
        bilateralFundsTotal += Math.max(0, stats.currentBalance);
      } else {
        individualFundsTotal += Math.max(0, stats.currentBalance);
      }
    });

    return {
      sharedFundsTotal,
      bilateralFundsTotal,
      individualFundsTotal,
      totalPockets: walletElems.length
    };
  }, [elements, currentWalletId, transactions]);

  // Manejador para abrir modal de creación
  const handleOpenCreate = () => {
    setNewElemForm({
      name: '',
      type: 'shared',
      icon: '🚗',
      category: 'Movilidad',
      description: '',
      members: currentWallet?.members?.length > 0 ? currentWallet.members : [currentUser?.id || 'ramiro', 'agustina', 'cristian'],
      partnerId: 'cristian',
      walletId: currentWalletId,
      initialDeposit: ''
    });
    setCreateStep(1);
    setShowCreateModal(true);
  };

  // Guardar nuevo elemento
  const handleSaveElement = async (e) => {
    e.preventDefault();
    if (!newElemForm.name.trim()) return;

    const initialDep = parseFloat(newElemForm.initialDeposit) || 0;
    const myId = currentUser?.id || 'ramiro';
    let membersList = [myId];

    if (newElemForm.type === 'shared') {
      membersList = newElemForm.members && newElemForm.members.length > 0 ? newElemForm.members : [myId];
    } else if (newElemForm.type === 'bilateral') {
      const partner = newElemForm.partnerId || 'cristian';
      membersList = Array.from(new Set([myId, partner]));
    }

    await elementsService.createElement({
      name: newElemForm.name,
      type: newElemForm.type,
      creatorId: myId,
      creatorName: currentUser?.name || 'Ramiro',
      icon: newElemForm.icon,
      category: newElemForm.category,
      description: newElemForm.description,
      members: membersList,
      walletId: newElemForm.walletId || currentWalletId,
      initialDeposit: initialDep,
      currency: 'ARS'
    });

    refreshData();
    setShowCreateModal(false);
  };

  // Ejecutar acción (Depósito, Retiro, Ingreso o Egreso)
  const handleExecuteAction = async (e) => {
    e.preventDefault();
    if (!actionModal?.element || !actionForm.amount) return;

    const elem = actionModal.element;
    const amountNum = parseFloat(actionForm.amount);
    const memberObj = availableMembers.find(m => m.id === actionForm.memberId) || { name: 'Ramiro', id: 'ramiro' };

    if (actionModal.type === 'deposit') {
      await elementsService.depositToElement({
        elementId: elem.id,
        memberId: memberObj.id,
        memberName: memberObj.name,
        amount: amountNum,
        concept: actionForm.concept || `Depósito de ${memberObj.name}`
      });
    } else if (actionModal.type === 'withdraw') {
      await elementsService.withdrawFromElement({
        elementId: elem.id,
        memberId: memberObj.id,
        memberName: memberObj.name,
        amount: amountNum,
        concept: actionForm.concept || `Retiro / Reintegro a ${memberObj.name}`
      });
    } else if (actionModal.type === 'income') {
      await elementsService.addIncomeToElement({
        elementId: elem.id,
        memberId: memberObj.id,
        memberName: memberObj.name,
        amount: amountNum,
        concept: actionForm.concept || `Ingreso generado por ${elem.name}`
      });
    } else if (actionModal.type === 'expense') {
      const linkedElem = elements.find(el => el.id === actionForm.linkedElementId);
      await elementsService.addExpenseToElement({
        elementId: elem.id,
        memberId: memberObj.id,
        memberName: memberObj.name,
        amount: amountNum,
        concept: actionForm.concept || `Necesidad / Gasto de ${elem.name}`,
        linkedElementId: linkedElem ? linkedElem.id : null,
        linkedElementName: linkedElem ? linkedElem.name : null,
        targetMemberId: actionForm.targetMemberId || null
      });
    }

    refreshData();
    setActionModal(null);
    setActionForm({ amount: '', concept: '', memberId: currentUser?.id || 'ramiro', linkedElementId: '', targetMemberId: '' });
  };

  // Recargar saldo de la billetera activa y cuenta
  const handleTopUpMainAccount = async (e) => {
    e.preventDefault();
    const amt = parseFloat(topUpAmount) || 0;
    if (amt > 0) {
      await elementsService.updateWalletBalance(currentWalletId, amt);
      await elementsService.updateMainBalance(currentUser?.id || 'ramiro', amt);
      refreshData();
      setShowTopUpModal(false);
    }
  };

  // Eliminar elemento
  const handleDeleteElement = async (elemId, elemName) => {
    if (window.confirm(`¿Estás seguro de que deseas eliminar el elemento "${elemName}"?`)) {
      await elementsService.deleteElement(elemId);
      refreshData();
      if (selectedElement?.id === elemId) setSelectedElement(null);
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-5xl mx-auto pb-12" style={{ padding: '0 2px' }}>

      {/* ======================================================== */}
      {/* 1. CUENTA PRINCIPAL DEL USUARIO (HERO CARD ESTILO FINTECH) */}
      {/* ======================================================== */}
      <div 
        className="fintech-hero"
        style={{
          background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 45%, #4338ca 100%)',
          borderRadius: '26px',
          padding: '1.6rem 1.4rem',
          color: '#ffffff',
          boxShadow: '0 16px 36px -8px rgba(49, 46, 129, 0.42), 0 4px 12px rgba(0, 0, 0, 0.08)',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {/* Adorno visual sutil de fondo */}
        <div 
          className="absolute -right-12 -top-12 w-64 h-64 rounded-full opacity-15 pointer-events-none"
          style={{ background: 'radial-gradient(circle, #818cf8 0%, transparent 70%)' }}
        />

        <div className="relative z-10 flex flex-col gap-4">
          {/* Fila superior: Título de Billetera & Ojo para ocultar saldo */}
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span 
                className="w-8 h-8 rounded-full flex items-center justify-center text-base shadow-sm"
                style={{ background: 'rgba(255, 255, 255, 0.2)' }}
              >
                {currentWallet?.icon || '🐝'}
              </span>
              <span style={{ fontSize: '0.88rem', fontWeight: 800, color: '#ffffff', letterSpacing: '0.01em' }}>
                Billetera {currentWallet?.name || 'Elementales'}
              </span>
              {currentWallet?.alias && (
                <span 
                  style={{ 
                    fontSize: '0.72rem', 
                    color: '#c7d2fe', 
                    background: 'rgba(255,255,255,0.1)', 
                    padding: '2px 8px', 
                    borderRadius: '9999px',
                    fontFamily: 'monospace',
                    fontWeight: 600
                  }}
                >
                  @{currentWallet.alias}
                </span>
              )}
              <span 
                style={{ 
                  fontSize: '11px', 
                  padding: '2px 8px', 
                  borderRadius: '9999px', 
                  background: 'rgba(16, 185, 129, 0.25)', 
                  color: '#6ee7b7', 
                  fontWeight: 700, 
                  border: '1px solid rgba(16, 185, 129, 0.4)' 
                }}
              >
                Activa
              </span>
            </div>

            <div className="flex items-center gap-2">
              {onOpenCreateWallet && (
                <button
                  type="button"
                  onClick={onOpenCreateWallet}
                  className="px-2.5 py-1 rounded-full text-xs font-bold text-indigo-100 hover:text-white transition-all flex items-center gap-1"
                  style={{ background: 'rgba(255, 255, 255, 0.15)', border: '1px solid rgba(255,255,255,0.2)', cursor: 'pointer' }}
                  title="Crear una nueva billetera"
                >
                  <Plus size={13} />
                  <span>+ Billetera</span>
                </button>
              )}
              <button
                onClick={() => setShowBalance(!showBalance)}
                className="p-1.5 rounded-full transition-colors"
                style={{ background: 'rgba(255, 255, 255, 0.12)', color: '#ffffff', border: 'none', cursor: 'pointer' }}
                title={showBalance ? "Ocultar saldo" : "Mostrar saldo"}
              >
                {showBalance ? <Eye size={17} color="#ffffff" /> : <EyeOff size={17} color="#ffffff" />}
              </button>
            </div>
          </div>

          {/* Saldo Principal de la Billetera Destacado */}
          <div>
            <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#c7d2fe', fontWeight: 700, marginBottom: '2px' }}>
              Saldo Disponible en {currentWallet?.name || 'Billetera'}
            </div>
            <div 
              style={{ 
                fontSize: '2.25rem', 
                fontWeight: 800, 
                letterSpacing: '-0.02em', 
                color: '#ffffff', 
                display: 'flex', 
                alignItems: 'baseline', 
                gap: '8px', 
                margin: '2px 0 4px 0',
                textShadow: '0 2px 8px rgba(0,0,0,0.2)' 
              }}
            >
              <span style={{ color: '#ffffff' }}>
                {showBalance ? safeFormatCurrency(currentWallet?.balance ?? mainBalance, 2) : '••••••••'}
              </span>
              <span style={{ fontSize: '1rem', fontWeight: 700, color: '#c7d2fe' }}>ARS</span>
            </div>
            <p style={{ fontSize: '0.78rem', color: 'rgba(224, 231, 255, 0.85)', margin: 0, lineHeight: 1.35 }}>
              {currentWallet?.detail || 'Monto base desde el cual fondeás los elementos económicos de esta billetera.'}
            </p>
          </div>

          {/* Integrantes de esta Billetera */}
          {currentWallet?.members && currentWallet.members.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', paddingTop: '2px' }}>
              <span style={{ fontSize: '0.72rem', color: '#c7d2fe', fontWeight: 600 }}>
                Integrantes de la billetera:
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', flexWrap: 'wrap' }}>
                {currentWallet.members.map(mId => {
                  const mObj = availableMembers.find(m => m.id === mId) || { name: mId };
                  return (
                    <span 
                      key={mId}
                      style={{ 
                        fontSize: '0.7rem', 
                        padding: '2px 8px', 
                        borderRadius: '9999px', 
                        background: 'rgba(255, 255, 255, 0.14)', 
                        color: '#ffffff', 
                        fontWeight: 600,
                        border: '1px solid rgba(255, 255, 255, 0.2)'
                      }}
                    >
                      {mObj.name}
                    </span>
                  );
                })}
              </div>
            </div>
          )}

          {/* Botones de Acción Rápida (Pills modernas y redondeadas) */}
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '10px', marginTop: '14px', marginBottom: '8px' }}>
            <button
              onClick={handleOpenCreate}
              className="btn"
              style={{
                background: '#ffffff',
                color: '#312e81',
                fontWeight: 800,
                fontSize: '0.82rem',
                padding: '0.65rem 1.25rem',
                borderRadius: '9999px',
                border: 'none',
                boxShadow: '0 4px 14px rgba(0, 0, 0, 0.18)',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <Plus size={16} color="#4338ca" />
              <span>Crear Elemento</span>
            </button>

            <button
              onClick={() => setShowTopUpModal(true)}
              className="btn"
              style={{
                background: 'rgba(255, 255, 255, 0.16)',
                color: '#ffffff',
                fontWeight: 700,
                fontSize: '0.82rem',
                padding: '0.65rem 1.15rem',
                borderRadius: '9999px',
                border: '1px solid rgba(255, 255, 255, 0.28)',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                backdropFilter: 'blur(8px)'
              }}
            >
              <ArrowDownLeft size={16} color="#34d399" />
              <span>Ingresar Dinero</span>
            </button>
          </div>

          {/* Sub-balances en Elementos (Separados holgadamente con su divisor) */}
          <div 
            style={{ 
              display: 'flex', 
              flexWrap: 'wrap', 
              alignItems: 'center', 
              gap: '16px', 
              paddingTop: '14px', 
              marginTop: '12px', 
              borderTop: '1px solid rgba(255, 255, 255, 0.18)', 
              fontSize: '0.76rem', 
              color: 'rgba(224, 231, 255, 0.92)' 
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <Users size={14} color="#fde047" />
              <span>Colectivos: <strong style={{ color: '#fde047', fontWeight: 800 }}>{safeFormatCurrency(metrics.sharedFundsTotal)}</strong></span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span style={{ fontSize: '13px' }}>🤝</span>
              <span>Mano a Mano: <strong style={{ color: '#c084fc', fontWeight: 800 }}>{safeFormatCurrency(metrics.bilateralFundsTotal)}</strong></span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <User size={14} color="#6ee7b7" />
              <span>Individuales: <strong style={{ color: '#6ee7b7', fontWeight: 800 }}>{safeFormatCurrency(metrics.individualFundsTotal)}</strong></span>
            </div>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 2. SECCIÓN: TUS ELEMENTOS A GESTIONAR                    */}
      {/* ======================================================== */}
      <div className="flex flex-col gap-4" style={{ marginTop: '14px' }}>
        {/* Cabecera de Sección & Filtros Estilo Pill */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5">
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
              <span>Elementos & Bolsillos</span>
              <span style={{ fontSize: '0.75rem', padding: '2px 8px', borderRadius: '9999px', background: '#e2e8f0', color: '#334155', fontWeight: 800 }}>
                {filteredElements.length}
              </span>
            </h2>
            <p style={{ fontSize: '0.78rem', color: '#64748b', margin: '3px 0 0 0' }}>
              Cada elemento gestiona sus propios ingresos, egresos y depósitos compartidos.
            </p>
          </div>

          {/* Segmented Control / Filtros Pill */}
          <div className="fintech-filter-bar" style={{ marginTop: '4px' }}>
            <button
              onClick={() => setFilterType('all')}
              className={`fintech-filter-btn ${filterType === 'all' ? 'active' : ''}`}
            >
              Todos ({elements.length})
            </button>
            <button
              onClick={() => setFilterType('bilateral')}
              className={`fintech-filter-btn ${filterType === 'bilateral' ? 'active-shared' : ''}`}
            >
              <span>🤝 Mano a Mano ({elements.filter(e => e.type === 'bilateral').length})</span>
            </button>
            <button
              onClick={() => setFilterType('shared')}
              className={`fintech-filter-btn ${filterType === 'shared' ? 'active-shared' : ''}`}
            >
              <Users size={13} />
              <span>Colectivos ({elements.filter(e => e.type === 'shared').length})</span>
            </button>
            <button
              onClick={() => setFilterType('individual')}
              className={`fintech-filter-btn ${filterType === 'individual' ? 'active-indiv' : ''}`}
            >
              <User size={13} />
              <span>Individuales ({elements.filter(e => e.type === 'individual').length})</span>
            </button>
          </div>
        </div>

        {/* ======================================================== */}
        {/* GRID DE ELEMENTOS (TARJETAS MODERNAS, REDONDEADAS)      */}
        {/* ======================================================== */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4" style={{ marginTop: '8px' }}>
          {filteredElements.map((elem) => {
            const stats = elementsService.getElementStats(elem.id);
            const isShared = elem.type === 'shared';
            const isBilateral = elem.type === 'bilateral';

            return (
              <div 
                key={elem.id}
                className="fintech-card"
              >
                {/* Cabecera de la Tarjeta */}
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-3">
                      <span 
                        style={{
                          width: '46px',
                          height: '46px',
                          borderRadius: '16px',
                          background: isBilateral ? '#ede9fe' : isShared ? '#fef3c7' : '#ecfdf5',
                          border: isBilateral ? '1px solid #ddd6fe' : isShared ? '1px solid #fde68a' : '1px solid #a7f3d0',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '1.45rem',
                          flexShrink: 0
                        }}
                      >
                        {elem.icon || '📦'}
                      </span>
                      <div>
                        <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a', margin: 0, lineHeight: 1.25 }}>
                          {elem.name}
                        </h3>
                        <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 500 }}>
                          {elem.category || 'General'} • Creado por {elem.creatorName}
                        </span>
                      </div>
                    </div>

                    {/* Badge de tipo de gestión */}
                    <span 
                      style={{
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        padding: '3px 10px',
                        borderRadius: '9999px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        background: isBilateral ? '#ede9fe' : isShared ? '#fffbeb' : '#f0fdf4',
                        color: isBilateral ? '#6d28d9' : isShared ? '#b45309' : '#15803d',
                        border: isBilateral ? '1px solid #ddd6fe' : isShared ? '1px solid #fde68a' : '1px solid #bbf7d0',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {isBilateral ? <span>🤝 Mano a Mano</span> : isShared ? <><Users size={12} /> Colectivo ({elem.members?.length || 1})</> : <><User size={12} /> Individual</>}
                    </span>
                  </div>

                  {elem.description && (
                    <p style={{ fontSize: '0.78rem', color: '#475569', margin: '6px 0 0 0', lineHeight: 1.35 }}>
                      {elem.description}
                    </p>
                  )}

                  {/* Si el proyecto recibió inversiones vinculadas desde un mano a mano */}
                  {(() => {
                    const linked = elementsService.getLinkedTransactions(elem.id);
                    if (linked.length === 0) return null;
                    const totalLinked = linked.reduce((sum, t) => sum + (t.amount || 0), 0);
                    return (
                      <div style={{ marginTop: '8px' }}>
                        <span style={{ fontSize: '0.68rem', fontWeight: 700, background: '#fef3c7', color: '#92400e', border: '1px solid #fde68a', borderRadius: '9999px', padding: '3px 10px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          ✨ {safeFormatCurrency(totalLinked)} invertidos desde Mano a Mano
                        </span>
                      </div>
                    );
                  })()}
                </div>

                {/* Saldo y Flujos del Elemento (Caja con contraste y números nítidos) */}
                <div 
                  style={{
                    background: '#f8fafc',
                    borderRadius: '16px',
                    padding: '13px 14px',
                    border: '1px solid #e2e8f0',
                    marginTop: '10px'
                  }}
                >
                  <div className="flex items-baseline justify-between mb-1">
                    <span style={{ fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748b' }}>
                      {isBilateral ? 'Balanza del Intercambio' : 'Fondo Disponible'}
                    </span>
                    <span style={{ fontSize: '1.35rem', fontWeight: 800, color: stats.currentBalance >= 0 ? '#0f172a' : '#dc2626' }}>
                      {safeFormatCurrency(stats.currentBalance, 2)}
                    </span>
                  </div>

                  {/* Resumen de Flujos: Ingresos/Depósitos vs Gastos */}
                  <div 
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: '8px',
                      paddingTop: '8px',
                      marginTop: '6px',
                      borderTop: '1px solid #e2e8f0',
                      fontSize: '0.73rem'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#16a34a', fontWeight: 600 }}>
                      <TrendingUp size={13} color="#16a34a" />
                      <span>{isBilateral ? 'Abonado/Saldado:' : 'Ingresos:'}</span>
                      <strong style={{ marginLeft: 'auto', color: '#15803d' }}>
                        {safeFormatCurrency((stats.totalIncome || 0) + (stats.totalDeposits || 0))}
                      </strong>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#dc2626', fontWeight: 600 }}>
                      <TrendingDown size={13} color="#dc2626" />
                      <span>{isBilateral ? 'Adelantos/Gastos:' : 'Gastos:'}</span>
                      <strong style={{ marginLeft: 'auto', color: '#b91c1c' }}>
                        {safeFormatCurrency(stats.totalExpense)}
                      </strong>
                    </div>
                  </div>
                </div>

                {/* Integrantes del Elemento */}
                {(isShared || isBilateral) && elem.members && elem.members.length > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.73rem', color: '#64748b', marginTop: '6px' }}>
                    <span style={{ fontWeight: 600 }}>{isBilateral ? 'Entre:' : 'Integrantes:'}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                      {elem.members.map((mId) => {
                        const mObj = availableMembers.find(m => m.id === mId) || { name: mId };
                        const contributed = stats.memberContributions[mId] || 0;
                        return (
                          <span 
                            key={mId}
                            style={{
                              padding: '2px 8px',
                              borderRadius: '9999px',
                              background: '#f1f5f9',
                              color: '#334155',
                              fontWeight: 600,
                              fontSize: '0.7rem',
                              border: '1px solid #e2e8f0'
                            }}
                            title={`Aportó: ${safeFormatCurrency(contributed)}`}
                          >
                            {mObj.name} {contributed > 0 && `(${safeFormatCurrency(Math.round(contributed / 1000))}k)`}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Botones de Acción del Elemento (Píldoras Finas, Modernas) */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', paddingTop: '6px', marginTop: '4px' }}>
                  {/* Botón Depositar / Aportar */}
                  <button
                    onClick={() => {
                      setActionModal({ type: 'deposit', element: elem });
                      setActionForm({ amount: '', concept: `Aporte para ${elem.name}`, memberId: currentUser?.id || 'ramiro' });
                    }}
                    style={{
                      padding: '8px 4px',
                      borderRadius: '9999px',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      background: '#eef2ff',
                      color: '#4338ca',
                      border: '1px solid #c7d2fe',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '4px',
                      transition: 'all 0.15s ease'
                    }}
                    title="Depositar dinero en este elemento"
                  >
                    <ArrowDownLeft size={13} color="#4338ca" />
                    <span>Depositar</span>
                  </button>

                  {/* Botón Egreso / Necesidad económica */}
                  <button
                    onClick={() => {
                      setActionModal({ type: 'expense', element: elem });
                      setActionForm({ amount: '', concept: `Gasto de ${elem.name}`, memberId: currentUser?.id || 'ramiro' });
                    }}
                    style={{
                      padding: '8px 4px',
                      borderRadius: '9999px',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      background: '#fff1f2',
                      color: '#e11d48',
                      border: '1px solid #fecdd3',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '4px',
                      transition: 'all 0.15s ease'
                    }}
                    title="Registrar un gasto o necesidad económica"
                  >
                    <ArrowUpRight size={13} color="#e11d48" />
                    <span>- Gasto</span>
                  </button>

                  {/* Botón Detalle */}
                  <button
                    onClick={() => setSelectedElement(elem)}
                    style={{
                      padding: '8px 4px',
                      borderRadius: '9999px',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      background: '#f8fafc',
                      color: '#334155',
                      border: '1px solid #cbd5e1',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '3px',
                      transition: 'all 0.15s ease'
                    }}
                    title="Ver detalle completo, historial y aportes"
                  >
                    <span>Detalle</span>
                    <ChevronRight size={13} color="#64748b" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {filteredElements.length === 0 && (
          <div className="p-8 text-center bg-white rounded-3xl border border-dashed border-slate-300">
            <span className="text-4xl mb-2 block">{currentWallet?.icon || '📦'}</span>
            <h4 className="font-bold text-slate-800 text-base">
              No hay elementos en {currentWallet?.name || 'esta billetera'}
            </h4>
            <p className="text-xs text-slate-500 mt-1 mb-4 max-w-sm mx-auto">
              Crea tu primer elemento económico (colectivo, mano a mano o individual) para empezar a gestionar fondos en {currentWallet?.name}.
            </p>
            <button
              onClick={handleOpenCreate}
              className="btn px-4 py-2 rounded-full font-bold text-xs bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm"
            >
              + Crear Elemento en {currentWallet?.name}
            </button>
          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* MODAL 1: CREAR ELEMENTO (2 PASOS CLAROS Y FLUIDOS)        */}
      {/* ======================================================== */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div 
            className="bg-white rounded-3xl w-full max-w-lg p-6 sm:p-7 shadow-2xl relative max-h-[90vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            {/* Cerrar modal */}
            <button 
              type="button"
              onClick={() => setShowCreateModal(false)}
              className="top-5 right-5"
              style={{
                position: 'absolute',
                top: '18px',
                right: '18px',
                width: '34px',
                height: '34px',
                borderRadius: '50%',
                background: '#f1f5f9',
                border: '1px solid #e2e8f0',
                color: '#64748b',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                zIndex: 25
              }}
              title="Cerrar ventana"
            >
              <X size={18} />
            </button>

            {/* Encabezado del modal */}
            <div className="mb-5">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-100">
                Paso {createStep} de 2
              </span>
              <h3 className="text-xl font-extrabold text-slate-900 mt-2">
                {createStep === 1 ? '¿Cómo vas a gestionar este elemento?' : 'Información del Elemento'}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {createStep === 1 
                  ? 'Elegí si será de uso exclusivamente personal o compartido con otros integrantes.' 
                  : 'Completá los detalles para que el elemento empiece a registrar ingresos y egresos.'}
              </p>
            </div>

            {/* PASO 1: SELECCIÓN DE TIPO (COMPARTIDO VS MANO A MANO VS INDIVIDUAL) */}
            {createStep === 1 && (
              <div className="flex flex-col gap-3.5">
                {/* Opción Compartida (Recomendada para la Colmena) */}
                <div
                  onClick={() => setNewElemForm(prev => ({ ...prev, type: 'shared' }))}
                  className={`p-4 sm:p-5 rounded-2xl border-2 cursor-pointer transition-all flex items-start gap-3.5 ${
                    newElemForm.type === 'shared'
                      ? 'border-indigo-600 bg-indigo-50/70 shadow-sm'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <span className="w-11 h-11 rounded-2xl bg-indigo-600 text-white flex items-center justify-center text-xl shadow-md shrink-0">
                    <Users size={22} />
                  </span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-slate-900 text-sm sm:text-base">
                        Gestión Compartida / Colectiva
                      </h4>
                      {newElemForm.type === 'shared' && (
                        <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs">
                          <Check size={13} />
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-600 mt-1">
                      Ideal para vehículos (<strong>Clio</strong>), compras de <strong>Comida</strong>, insumos de huerta o proyectos comunitarios.
                    </p>
                    <ul className="text-[11px] text-slate-500 mt-1.5 space-y-1">
                      <li>• Varios integrantes pueden depositar dinero en el elemento.</li>
                      <li>• Se registran egresos y gastos colectivos transparentes.</li>
                    </ul>
                  </div>
                </div>

                {/* Opción Mano a Mano Bilateral */}
                <div
                  onClick={() => setNewElemForm(prev => ({ 
                    ...prev, 
                    type: 'bilateral',
                    icon: '🤝',
                    category: 'Intercambios',
                    name: prev.name && !prev.name.startsWith('Mano a Mano') ? prev.name : 'Mano a Mano con Cris'
                  }))}
                  className={`p-4 sm:p-5 rounded-2xl border-2 cursor-pointer transition-all flex items-start gap-3.5 ${
                    newElemForm.type === 'bilateral'
                      ? 'border-purple-600 bg-purple-50/80 shadow-sm'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <span className="w-11 h-11 rounded-2xl bg-purple-600 text-white flex items-center justify-center text-xl shadow-md shrink-0">
                    🤝
                  </span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-slate-900 text-sm sm:text-base">
                        Intercambio Bilateral (Mano a Mano)
                      </h4>
                      {newElemForm.type === 'bilateral' && (
                        <span className="w-5 h-5 rounded-full bg-purple-600 text-white flex items-center justify-center text-xs">
                          <Check size={13} />
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-600 mt-1">
                      Para compras por encargo, préstamos y devoluciones 1 a 1 entre dos integrantes (ej: <strong>Cris y Ramiro</strong>).
                    </p>
                    <ul className="text-[11px] text-slate-500 mt-1.5 space-y-1">
                      <li>• Balanza neta clara de intercambio (sin mezclar con fondos generales).</li>
                      <li>• <strong>Vínculo a Proyecto:</strong> Podés tallar gastos como inversión a la Feria o Huerta.</li>
                      <li>• Envío de comprobante por WhatsApp con código de referencia unívoco.</li>
                    </ul>
                  </div>
                </div>

                {/* Opción Individual */}
                <div
                  onClick={() => setNewElemForm(prev => ({ ...prev, type: 'individual' }))}
                  className={`p-4 sm:p-5 rounded-2xl border-2 cursor-pointer transition-all flex items-start gap-3.5 ${
                    newElemForm.type === 'individual'
                      ? 'border-emerald-600 bg-emerald-50/70 shadow-sm'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <span className="w-11 h-11 rounded-2xl bg-emerald-600 text-white flex items-center justify-center text-xl shadow-md shrink-0">
                    <User size={22} />
                  </span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-slate-900 text-sm sm:text-base">
                        Gestión Individual
                      </h4>
                      {newElemForm.type === 'individual' && (
                        <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs">
                          <Check size={13} />
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-600 mt-1">
                      Exclusivo para vos ({currentUser?.name || 'Ramiro'}). Controlá compras personales o ahorros propios.
                    </p>
                    <ul className="text-[11px] text-slate-500 mt-1.5 space-y-1">
                      <li>• Solo vos ves y operás este elemento.</li>
                    </ul>
                  </div>
                </div>

                {/* Botón Siguiente */}
                <button
                  type="button"
                  onClick={() => setCreateStep(2)}
                  className="btn mt-1 py-3.5 rounded-full font-bold text-sm bg-indigo-600 text-white hover:bg-indigo-700 flex items-center justify-center gap-2 shadow-lg"
                >
                  <span>Continuar al Paso 2</span>
                  <ArrowRight size={16} />
                </button>
              </div>
            )}

            {/* PASO 2: FORMULARIO DE INFORMACIÓN DEL ELEMENTO */}
            {createStep === 2 && (
              <form onSubmit={handleSaveElement} className="flex flex-col gap-4">
                {/* Billetera de asignación */}
                <div className="flex items-center justify-between p-2.5 bg-indigo-50/70 rounded-xl border border-indigo-100">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{currentWallet?.icon || '🐝'}</span>
                    <div>
                      <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider block">
                        Billetera Asignada
                      </span>
                      <span className="text-xs font-bold text-slate-800">
                        {currentWallet?.name} (@{currentWallet?.alias || 'billetera'})
                      </span>
                    </div>
                  </div>
                  {wallets.length > 1 && (
                    <select
                      value={newElemForm.walletId || currentWalletId}
                      onChange={e => setNewElemForm({ ...newElemForm, walletId: e.target.value })}
                      className="text-xs bg-white border border-indigo-200 rounded-lg px-2 py-1 font-semibold text-slate-700 focus:outline-none"
                    >
                      {wallets.map(w => (
                        <option key={w.id} value={w.id}>
                          {w.icon} {w.name}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {/* Nombre */}
                <div>
                  <label className="text-xs font-bold text-slate-700 mb-1 block">
                    Nombre del Elemento *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: Clio, Comida, Alquiler, Huerta"
                    value={newElemForm.name}
                    onChange={e => setNewElemForm({ ...newElemForm, name: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-semibold"
                  />
                </div>

                {/* Selector de Icono / Categoría */}
                <div>
                  <label className="text-xs font-bold text-slate-700 mb-1.5 block">
                    Icono y Rubro
                  </label>
                  <div className="grid grid-cols-5 gap-2">
                    {AVAILABLE_ICONS.map((item) => (
                      <button
                        key={item.label}
                        type="button"
                        onClick={() => setNewElemForm({ 
                          ...newElemForm, 
                          icon: item.icon, 
                          category: item.category 
                        })}
                        className={`p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all ${
                          newElemForm.icon === item.icon 
                            ? 'border-indigo-600 bg-indigo-50 shadow-sm scale-105' 
                            : 'border-slate-200 hover:border-slate-300 bg-white'
                        }`}
                        title={item.label}
                      >
                        <span className="text-2xl">{item.icon}</span>
                        <span className="text-[10px] text-slate-600 truncate w-full text-center">
                          {item.category}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Descripción / Necesidad económica */}
                <div>
                  <label className="text-xs font-bold text-slate-700 mb-1 block">
                    Descripción o Propósito (Opcional)
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: Gestión de combustible y mantenimiento preventivo"
                    value={newElemForm.description}
                    onChange={e => setNewElemForm({ ...newElemForm, description: e.target.value })}
                    className="w-full px-4 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs"
                  />
                </div>

                {/* Si es compartido: Selector de Integrantes */}
                {newElemForm.type === 'shared' && (
                  <div>
                    <label className="text-xs font-bold text-slate-700 mb-1.5 block">
                      Integrantes que participan en este elemento
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {availableMembers.map((member) => {
                        const isSelected = newElemForm.members.includes(member.id);
                        return (
                          <button
                            key={member.id}
                            type="button"
                            onClick={() => {
                              // El creador siempre debe quedar
                              if (member.id === (currentUser?.id || 'ramiro')) return;
                              if (isSelected) {
                                setNewElemForm({
                                  ...newElemForm,
                                  members: newElemForm.members.filter(id => id !== member.id)
                                });
                              } else {
                                setNewElemForm({
                                  ...newElemForm,
                                  members: [...newElemForm.members, member.id]
                                });
                              }
                            }}
                            className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 border transition-all ${
                              isSelected
                                ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                                : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                            }`}
                          >
                            <span>{member.name}</span>
                            {isSelected && <Check size={12} />}
                          </button>
                        );
                      })}
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Los integrantes seleccionados podrán depositar dinero y registrar necesidades económicas en este elemento.
                    </p>
                  </div>
                )}

                {/* Si es Mano a Mano Bilateral: Selector de la contraparte */}
                {newElemForm.type === 'bilateral' && (
                  <div>
                    <label className="text-xs font-bold text-slate-700 mb-1.5 block">
                      ¿Con quién es este intercambio Mano a Mano?
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {availableMembers
                        .filter(m => m.id !== (currentUser?.id || 'ramiro'))
                        .map((member) => {
                          const isSelected = newElemForm.partnerId === member.id;
                          return (
                            <button
                              key={member.id}
                              type="button"
                              onClick={() => {
                                const newName = (!newElemForm.name || newElemForm.name.startsWith('Mano a Mano'))
                                  ? `Mano a Mano con ${member.name}`
                                  : newElemForm.name;
                                setNewElemForm({
                                  ...newElemForm,
                                  partnerId: member.id,
                                  name: newName
                                });
                              }}
                              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 border transition-all ${
                                isSelected
                                  ? 'bg-purple-600 text-white border-purple-600 shadow-sm'
                                  : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                              }`}
                            >
                              <span>{member.name} ({member.role})</span>
                              {isSelected && <Check size={12} />}
                            </button>
                          );
                        })}
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Llevará el registro de compras por encargo, préstamos y devoluciones directas entre ustedes dos.
                    </p>
                  </div>
                )}

                {/* Depósito inicial desde la cuenta principal */}
                <div>
                  <label className="text-xs font-bold text-slate-700 mb-1 block">
                    Depósito inicial desde tu Cuenta Principal (Opcional)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-slate-400 font-bold">$</span>
                    <input
                      type="number"
                      placeholder="0"
                      min="0"
                      max={mainBalance}
                      value={newElemForm.initialDeposit}
                      onChange={e => setNewElemForm({ ...newElemForm, initialDeposit: e.target.value })}
                      className="w-full pl-8 pr-4 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-semibold"
                    />
                  </div>
                  <span className="text-[11px] text-slate-500 mt-0.5 block">
                    Saldo disponible en tu cuenta: {safeFormatCurrency(mainBalance)}
                  </span>
                </div>

                {/* Botones de acción del paso 2 */}
                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setCreateStep(1)}
                    className="btn px-4 py-3 rounded-full text-xs font-semibold text-slate-600 hover:bg-slate-100"
                  >
                    Volver
                  </button>
                  <button
                    type="submit"
                    className="btn flex-1 py-3.5 rounded-full font-bold text-sm bg-indigo-600 text-white hover:bg-indigo-700 shadow-md"
                  >
                    Confirmar & Crear Elemento
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 2: OPERAR EN ELEMENTO (DEPÓSITO / EGRESO / INGRESO) */}
      {/* ======================================================== */}
      {actionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div 
            className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl relative"
            onClick={e => e.stopPropagation()}
          >
            <button 
              type="button"
              onClick={() => setActionModal(null)}
              className="top-4 right-4"
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                width: '34px',
                height: '34px',
                borderRadius: '50%',
                background: '#f1f5f9',
                border: '1px solid #e2e8f0',
                color: '#64748b',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                zIndex: 25
              }}
              title="Cerrar ventana"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <span className="text-3xl p-2 bg-indigo-50 rounded-2xl border border-indigo-100">
                {actionModal.element.icon || '📦'}
              </span>
              <div>
                <span className="text-xs uppercase tracking-wider font-bold text-indigo-600">
                  {actionModal.type === 'deposit' && '📥 Depositar Dinero en el Elemento'}
                  {actionModal.type === 'withdraw' && '📤 Retirar / Reintegrar Saldo'}
                  {actionModal.type === 'income' && '➕ Registrar Ingreso Generado'}
                  {actionModal.type === 'expense' && '➖ Registrar Egreso / Necesidad'}
                </span>
                <h3 className="text-lg font-bold text-slate-900 leading-tight">
                  {actionModal.element.name}
                </h3>
              </div>
            </div>

            <form onSubmit={handleExecuteAction} className="flex flex-col gap-3.5">
              {/* Quién opera */}
              <div>
                <label className="text-xs font-bold text-slate-700 mb-1 block">
                  {actionModal.type === 'deposit' ? 'Integrante que deposita:' : 'Registrado por:'}
                </label>
                <select
                  value={actionForm.memberId}
                  onChange={e => setActionForm({ ...actionForm, memberId: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {availableMembers.map(m => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.role})
                    </option>
                  ))}
                </select>
              </div>

              {/* Monto */}
              <div>
                <label className="text-xs font-bold text-slate-700 mb-1 block">
                  Monto (ARS) *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-slate-400 font-bold">$</span>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="Ej: 25000"
                    value={actionForm.amount}
                    onChange={e => setActionForm({ ...actionForm, amount: e.target.value })}
                    className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-lg font-bold"
                  />
                </div>
              </div>

              {/* Concepto */}
              <div>
                <label className="text-xs font-bold text-slate-700 mb-1 block">
                  Concepto o Motivo
                </label>
                <input
                  type="text"
                  placeholder={
                    actionModal.type === 'deposit' ? 'Ej: Nafta para viaje a Bariloche' :
                    actionModal.type === 'expense' ? 'Ej: Maíz partido blanco y amarillo' :
                    actionModal.type === 'income' ? 'Ej: Cobro de viaje / flete' : 'Ej: Reintegro'
                  }
                  value={actionForm.concept}
                  onChange={e => setActionForm({ ...actionForm, concept: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs"
                />
              </div>

              {/* Para quién fue el encargo o gasto en el Mano a Mano */}
              {actionModal.element.type === 'bilateral' && actionModal.type === 'expense' && (
                <div>
                  <label className="text-xs font-bold text-slate-700 mb-1 block">
                    ¿A pedido / beneficio de quién fue este gasto?
                  </label>
                  <select
                    value={actionForm.targetMemberId || (actionModal.element.members?.find(m => m !== (currentUser?.id || 'ramiro')) || 'cristian')}
                    onChange={e => setActionForm({ ...actionForm, targetMemberId: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                  >
                    {actionModal.element.members?.map(mId => {
                      const mObj = availableMembers.find(m => m.id === mId) || { id: mId, name: mId };
                      const isMe = mId === (currentUser?.id || 'ramiro');
                      return (
                        <option key={mId} value={mId}>
                          {mObj.name} {isMe ? '(Para mí)' : '(Por encargo / le adelanto yo)'}
                        </option>
                      );
                    })}
                  </select>
                </div>
              )}

              {/* Vincular a un Proyecto Colectivo (Opcional) */}
              {actionModal.type === 'expense' && (
                <div className="p-3 rounded-2xl bg-indigo-50/70 border border-indigo-100 flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-indigo-950 flex items-center gap-1.5">
                      <span>🔗 ¿Vincular a un Proyecto Colectivo?</span>
                    </label>
                    <span className="text-[10px] font-semibold text-indigo-600 bg-indigo-100/80 px-2 py-0.5 rounded-full">
                      Opcional
                    </span>
                  </div>
                  <select
                    value={actionForm.linkedElementId || ''}
                    onChange={e => setActionForm({ ...actionForm, linkedElementId: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-indigo-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                  >
                    <option value="">-- Sin vincular (Gasto o intercambio directo) --</option>
                    {elements
                      .filter(el => el.id !== actionModal.element.id && el.type === 'shared')
                      .map(el => (
                        <option key={el.id} value={el.id}>
                          {el.icon} {el.name} ({el.category})
                        </option>
                      ))}
                  </select>
                  <p className="text-[11px] text-slate-500 leading-snug">
                    Ej: Si compraste maíz para la <strong>Feria Comunitaria</strong>, quedará registrado en tu mano a mano con Cris y además se computará como inversión del proyecto colectivo.
                  </p>
                </div>
              )}

              <button
                type="submit"
                className={`btn mt-2 py-3.5 rounded-full font-bold text-sm text-white shadow-md ${
                  actionModal.type === 'deposit' ? 'bg-indigo-600 hover:bg-indigo-700' :
                  actionModal.type === 'expense' ? 'bg-rose-600 hover:bg-rose-700' :
                  'bg-emerald-600 hover:bg-emerald-700'
                }`}
              >
                Confirmar Registro
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 3: DETALLE COMPLETO DEL ELEMENTO                   */}
      {/* ======================================================== */}
      {selectedElement && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div 
            className="bg-white rounded-3xl w-full max-w-lg p-6 sm:p-7 shadow-2xl relative max-h-[90vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <button 
              type="button"
              onClick={() => setSelectedElement(null)}
              className="top-5 right-5"
              style={{
                position: 'absolute',
                top: '18px',
                right: '18px',
                width: '34px',
                height: '34px',
                borderRadius: '50%',
                background: '#f1f5f9',
                border: '1px solid #e2e8f0',
                color: '#64748b',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                zIndex: 25
              }}
              title="Cerrar ventana"
            >
              <X size={18} />
            </button>

            {/* Cabecera del Elemento */}
            <div className="flex items-center gap-3.5 mb-5">
              <span className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-3xl shadow-sm">
                {selectedElement.icon || '📦'}
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-bold text-slate-900">
                    {selectedElement.name}
                  </h3>
                  <span className={`text-[11px] px-2.5 py-0.5 rounded-full font-bold ${
                    selectedElement.type === 'bilateral'
                      ? 'bg-purple-100 text-purple-800 border border-purple-200'
                      : selectedElement.type === 'shared' 
                      ? 'bg-amber-100 text-amber-800' 
                      : 'bg-emerald-100 text-emerald-800'
                  }`}>
                    {selectedElement.type === 'bilateral' ? '🤝 Mano a Mano' : selectedElement.type === 'shared' ? 'Compartido' : 'Individual'}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  {selectedElement.description || 'Gestión económica de este elemento'}
                </p>
              </div>
            </div>

            {/* Saldo y Estadísticas */}
            {(() => {
              const stats = elementsService.getElementStats(selectedElement.id);
              return (
                <div className="flex flex-col gap-4">
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                      Saldo Total Acumulado en {selectedElement.name}
                    </span>
                    <div className="text-3xl font-extrabold text-slate-900 mt-1">
                      {safeFormatCurrency(stats.currentBalance, 2)}
                    </div>
                    <div className="grid grid-cols-2 gap-3 mt-3 pt-3 border-t border-slate-200 text-xs">
                      <div>
                        <span className="text-slate-500 block">Total Ingresos / Depósitos:</span>
                        <strong className="text-emerald-700 text-sm">
                          +{safeFormatCurrency((stats.totalIncome || 0) + (stats.totalDeposits || 0))}
                        </strong>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Total Egresos / Gastos:</span>
                        <strong className="text-rose-700 text-sm">
                          -{safeFormatCurrency(stats.totalExpense)}
                        </strong>
                      </div>
                    </div>
                  </div>

                  {/* Botones de acción rápida para este elemento */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <button
                      onClick={() => {
                        setActionModal({ type: 'deposit', element: selectedElement });
                        setActionForm({ amount: '', concept: `Depósito en ${selectedElement.name}`, memberId: currentUser?.id || 'ramiro' });
                      }}
                      className="btn py-2 px-2 rounded-xl text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-700"
                    >
                      + Depositar
                    </button>
                    <button
                      onClick={() => {
                        setActionModal({ type: 'expense', element: selectedElement });
                        setActionForm({ amount: '', concept: `Gasto de ${selectedElement.name}`, memberId: currentUser?.id || 'ramiro' });
                      }}
                      className="btn py-2 px-2 rounded-xl text-xs font-bold bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200"
                    >
                      - Egreso
                    </button>
                    <button
                      onClick={() => {
                        setActionModal({ type: 'income', element: selectedElement });
                        setActionForm({ amount: '', concept: `Ingreso de ${selectedElement.name}`, memberId: currentUser?.id || 'ramiro' });
                      }}
                      className="btn py-2 px-2 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200"
                    >
                      + Ingreso
                    </button>
                    <button
                      onClick={() => {
                        setActionModal({ type: 'withdraw', element: selectedElement });
                        setActionForm({ amount: '', concept: `Retiro de ${selectedElement.name}`, memberId: currentUser?.id || 'ramiro' });
                      }}
                      className="btn py-2 px-2 rounded-xl text-xs font-bold bg-slate-100 text-slate-700 hover:bg-slate-200"
                    >
                      Retirar
                    </button>
                  </div>

                  {/* Si es Mano a Mano Bilateral: Balanza y Acuerdo entre integrantes */}
                  {selectedElement.type === 'bilateral' && selectedElement.members && (
                    <div className="p-3.5 rounded-2xl bg-purple-50/70 border border-purple-200 text-xs">
                      <div className="flex items-center justify-between font-bold text-purple-900 mb-1.5">
                        <span className="flex items-center gap-1.5">
                          <span>🤝 Intercambio Bilateral</span>
                          <span className="text-[10px] bg-purple-200/80 text-purple-800 px-2 py-0.5 rounded-full">1 a 1</span>
                        </span>
                        <span className="text-purple-700 text-[11px]">Balanza Directa</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-700">
                        {selectedElement.members.map((mId, idx) => {
                          const mObj = availableMembers.find(m => m.id === mId) || { name: mId };
                          return (
                            <React.Fragment key={mId}>
                              {idx > 0 && <span className="text-purple-500 font-bold text-sm">⇄</span>}
                              <span className="font-semibold px-2.5 py-1 bg-white rounded-lg border border-purple-100 shadow-2xs">
                                {mObj.name}
                              </span>
                            </React.Fragment>
                          );
                        })}
                      </div>
                      <p className="text-[11px] text-purple-900/80 mt-2 mb-0 leading-snug">
                        Intercambios, compras por encargo y deudas mutuas. Cualquier gasto puede tallarse a un proyecto colectivo (como la Feria o la Huerta) para computarse como inversión.
                      </p>
                    </div>
                  )}

                  {/* Aportes por Integrante (en proyectos compartidos) */}
                  {selectedElement.type === 'shared' && (
                    <div>
                      <h4 className="text-xs font-bold text-slate-700 mb-2 uppercase tracking-wider">
                        Aportes por Integrante
                      </h4>
                      <div className="space-y-1.5">
                        {selectedElement.members?.map(mId => {
                          const mObj = availableMembers.find(m => m.id === mId) || { name: mId };
                          const contributed = stats.memberContributions[mId] || 0;
                          return (
                            <div key={mId} className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                              <span className="font-semibold text-slate-800">{mObj.name}</span>
                              <span className="font-bold text-indigo-700">
                                {safeFormatCurrency(contributed)}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Inversiones vinculadas desde Mano a Mano a este Proyecto */}
                  {(() => {
                    const linkedTxs = elementsService.getLinkedTransactions(selectedElement.id);
                    if (linkedTxs.length === 0) return null;
                    const totalLinked = linkedTxs.reduce((sum, t) => sum + (t.amount || 0), 0);
                    return (
                      <div className="p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                            <span>✨ Inversiones desde Mano a Mano ({linkedTxs.length})</span>
                          </span>
                          <span className="text-xs font-extrabold text-amber-900">
                            {safeFormatCurrency(totalLinked)}
                          </span>
                        </div>
                        <div className="space-y-1.5 max-h-36 overflow-y-auto">
                          {linkedTxs.map(ltx => (
                            <div key={ltx.id} className="p-2 rounded-xl bg-white border border-amber-100 flex items-center justify-between text-xs">
                              <div>
                                <div className="font-bold text-slate-800">{ltx.concept}</div>
                                <div className="text-[10px] text-slate-500">
                                  {ltx.date} • Aportado por {ltx.memberName} {ltx.targetMemberId ? `(pedido por ${ltx.targetMemberId})` : ''}
                                </div>
                              </div>
                              <span className="font-extrabold text-amber-800">{safeFormatCurrency(ltx.amount)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })()}

                  {/* Historial de Movimientos de este Elemento */}
                  <div>
                    <h4 className="text-xs font-bold text-slate-700 mb-2 uppercase tracking-wider">
                      Movimientos de {selectedElement.name} ({stats.recentTxs.length})
                    </h4>
                    {stats.recentTxs.length > 0 ? (
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {stats.recentTxs.map(tx => {
                          const targetId = tx.targetMemberId || (selectedElement.members?.find(m => m !== tx.memberId) || 'cristian');
                          const targetMember = availableMembers.find(m => m.id === targetId) || { name: 'Compañero', cleanPhone: '5491149748673' };
                          const refCode = tx.id.replace('etx-', '').slice(-6).toUpperCase();

                          return (
                            <div key={tx.id} className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs flex flex-col gap-1.5">
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1">
                                  <div className="font-bold text-slate-900 text-xs">{tx.concept}</div>
                                  <div className="text-[10px] text-slate-500 mt-0.5">
                                    {tx.date} • Por <strong>{tx.memberName}</strong> {tx.targetMemberId ? `(Para: ${tx.targetMemberId})` : ''} • {tx.type === 'deposit' ? 'Depósito' : tx.type === 'expense' ? 'Gasto/Adelanto' : 'Ingreso'}
                                  </div>
                                  {tx.linkedElementName && (
                                    <div className="mt-1">
                                      <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-200 px-2 py-0.5 rounded-full">
                                        ✨ Inversión vinculada a: {tx.linkedElementName}
                                      </span>
                                    </div>
                                  )}
                                </div>
                                <span className={`font-extrabold text-sm shrink-0 ${tx.type === 'expense' ? 'text-rose-600' : 'text-emerald-600'}`}>
                                  {tx.type === 'expense' ? '-' : '+'}{safeFormatCurrency(tx.amount)}
                                </span>
                              </div>

                              {/* Barra de Notificación y Código de Referencia Unívoco */}
                              <div className="flex items-center justify-between pt-1.5 border-t border-slate-200/70 mt-0.5">
                                <span className="text-[10px] font-mono font-bold text-slate-400">
                                  Ref: #{refCode}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const msg = `👋 Hola ${targetMember.name}! Registré en Banca Abeja:\n\n📝 Detalle: ${tx.concept}\n💰 Monto: ${safeFormatCurrency(tx.amount)}\n📅 Fecha: ${tx.date}\n🏷️ Ref: #${refCode}\n${tx.linkedElementName ? `🎪 Vinculado a: ${tx.linkedElementName}\n` : ''}\nPodés revisarlo en https://www.bancaabeja.org/`;
                                    const phone = targetMember.cleanPhone || '5491149748673';
                                    const url = `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
                                    window.open(url, '_blank');
                                  }}
                                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition-colors shadow-2xs"
                                  title="Enviar comprobante con referencia unívoca a WhatsApp"
                                >
                                  <span>📲 Avisar a {targetMember.name}</span>
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 italic">No hay movimientos registrados aún en este elemento.</p>
                    )}
                  </div>

                  {/* Botón Peligroso Eliminar */}
                  <div className="pt-2 border-t border-slate-100 flex justify-end">
                    <button
                      onClick={() => handleDeleteElement(selectedElement.id, selectedElement.name)}
                      className="text-xs text-rose-500 hover:text-rose-700 flex items-center gap-1 font-medium"
                    >
                      <Trash2 size={13} />
                      <span>Eliminar este elemento</span>
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 4: INGRESAR DINERO A LA CUENTA PRINCIPAL           */}
      {/* ======================================================== */}
      {showTopUpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div 
            className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl relative"
            onClick={e => e.stopPropagation()}
          >
            <button 
              type="button"
              onClick={() => setShowTopUpModal(false)}
              className="top-4 right-4"
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                width: '34px',
                height: '34px',
                borderRadius: '50%',
                background: '#f1f5f9',
                border: '1px solid #e2e8f0',
                color: '#64748b',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                zIndex: 25
              }}
              title="Cerrar ventana"
            >
              <X size={18} />
            </button>

            <div className="text-center mb-4">
              <span className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center text-2xl mx-auto mb-2 border border-emerald-100">
                💵
              </span>
              <h3 className="text-lg font-bold text-slate-900">
                Ingresar Dinero a Cuenta Principal
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Similar a cargar saldo en Mercado Pago para distribuir en tus elementos.
              </p>
            </div>

            <form onSubmit={handleTopUpMainAccount} className="flex flex-col gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700 mb-1 block">
                  Monto a Ingresar (ARS)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-slate-400 font-bold">$</span>
                  <input
                    type="number"
                    required
                    min="100"
                    step="100"
                    value={topUpAmount}
                    onChange={e => setTopUpAmount(e.target.value)}
                    className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-lg font-bold text-center"
                  />
                </div>
              </div>

              {/* Botones de montos rápidos */}
              <div className="grid grid-cols-3 gap-1.5">
                {['50000', '100000', '250000'].map(m => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setTopUpAmount(m)}
                    className="px-2 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700"
                  >
                    +${(parseInt(m) / 1000)}k
                  </button>
                ))}
              </div>

              <button
                type="submit"
                className="btn mt-2 py-3 rounded-full font-bold text-sm bg-emerald-600 hover:bg-emerald-700 text-white shadow-md"
              >
                Cargar Saldo
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
