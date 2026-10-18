import React, { useState, useEffect, useMemo } from 'react';
import { 
  Plus, Users, User, ArrowUpRight, ArrowDownLeft, 
  TrendingUp, TrendingDown, Eye, EyeOff, 
  ChevronRight, X, Check, ArrowRight, Trash2, Info,
  Calendar, FileText, Sparkles, Share2, DollarSign,
  CheckCircle2, Tag, Sliders, Shield, BookOpen, Clock
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
  const [milestones, setMilestones] = useState(() => elementsService.milestones || []);
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
  const [showWalletInfoModal, setShowWalletInfoModal] = useState(false);
  const [selectedElement, setSelectedElement] = useState(null);
  const [elementDetailTab, setElementDetailTab] = useState('overview'); // 'overview' | 'milestones' | 'costs' | 'history'
  const [walletInfoTab, setWalletInfoTab] = useState('rules'); // 'rules' | 'report' | 'elements'
  const [actionModal, setActionModal] = useState(null); // { type: 'deposit' | 'withdraw' | 'income' | 'expense', element: obj }

  // Estados de Hitos (Micro-contabilidad por eventos)
  const [showCreateMilestoneModal, setShowCreateMilestoneModal] = useState(false);
  const [newMilestoneForm, setNewMilestoneForm] = useState({ name: '', initialSeedFund: '', goalDescription: '' });
  const [closingMilestone, setClosingMilestone] = useState(null);
  const [closeMilestoneSummary, setCloseMilestoneSummary] = useState('');

  // Estados de Base de Costos (Planilla Viva)
  const [showAddCostItem, setShowAddCostItem] = useState(false);
  const [newCostItemForm, setNewCostItemForm] = useState({ name: '', unitCost: '', unit: 'kg', category: 'Insumos' });

  // Estados de Reglas de Grupalidad e Informe Ejecutivo de Billetera
  const [walletRulesForm, setWalletRulesForm] = useState(() => ({
    contributionModel: currentWallet?.rules?.contributionModel || 'equal',
    expenseApprovalThreshold: currentWallet?.rules?.expenseApprovalThreshold || 30000,
    reservePercentage: currentWallet?.rules?.reservePercentage || 10,
    agreementSummary: currentWallet?.rules?.agreementSummary || ''
  }));
  const [showExecutiveReport, setShowExecutiveReport] = useState(false);
  const [rulesSavedNotice, setRulesSavedNotice] = useState(false);

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
    targetMemberId: '',
    milestoneId: ''
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

  // Sincronizar formulario de reglas al cambiar de billetera activa
  useEffect(() => {
    if (currentWallet?.rules) {
      setWalletRulesForm({
        contributionModel: currentWallet.rules.contributionModel || 'equal',
        expenseApprovalThreshold: currentWallet.rules.expenseApprovalThreshold || 30000,
        reservePercentage: currentWallet.rules.reservePercentage || 10,
        agreementSummary: currentWallet.rules.agreementSummary || ''
      });
    }
  }, [currentWallet]);

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
    const handleMilestonesUpdated = () => {
      setMilestones([...elementsService.milestones]);
    };
    window.addEventListener('banca_wallet_changed', handleWalletChanged);
    window.addEventListener('banca_wallets_updated', handleWalletsUpdated);
    window.addEventListener('banca_milestones_updated', handleMilestonesUpdated);
    return () => {
      window.removeEventListener('banca_wallet_changed', handleWalletChanged);
      window.removeEventListener('banca_wallets_updated', handleWalletsUpdated);
      window.removeEventListener('banca_milestones_updated', handleMilestonesUpdated);
    };
  }, []);

  const refreshData = () => {
    setElements([...elementsService.elements]);
    setTransactions([...elementsService.transactions]);
    setWallets(elementsService.getWallets());
    setMilestones([...elementsService.milestones]);
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

  // Todos los elementos asociados a la billetera activa
  const activeWalletElements = useMemo(() => {
    return elements.filter(elem => {
      const isDirect = elem.walletId === currentWalletId || (currentWalletId === 'wallet-elementales' && !elem.walletId);
      const isCoOwned = Array.isArray(elem.walletIds) && elem.walletIds.includes(currentWalletId);
      return isDirect || isCoOwned;
    });
  }, [elements, currentWalletId]);

  // Elementos filtrados para la vista (por pestaña y término de búsqueda)
  const filteredElements = useMemo(() => {
    return activeWalletElements.filter(elem => {
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
  }, [activeWalletElements, filterType, searchTerm]);

  // Totales acumulados para la billetera activa (Conectados transparentemente con sus elementos)
  const metrics = useMemo(() => {
    let sharedFundsTotal = 0;
    let bilateralFundsTotal = 0;
    let individualFundsTotal = 0;

    activeWalletElements.forEach(elem => {
      const stats = elementsService.getElementStats(elem.id);
      if (elem.type === 'shared') {
        sharedFundsTotal += Math.max(0, stats.currentBalance);
      } else if (elem.type === 'bilateral') {
        bilateralFundsTotal += Math.max(0, stats.currentBalance);
      } else {
        individualFundsTotal += Math.max(0, stats.currentBalance);
      }
    });

    const totalInElements = sharedFundsTotal + bilateralFundsTotal + individualFundsTotal;
    const unallocatedCash = Math.max(0, Number(currentWallet?.balance) || 0);
    const totalConsolidated = totalInElements + unallocatedCash;

    return {
      sharedFundsTotal,
      bilateralFundsTotal,
      individualFundsTotal,
      totalInElements,
      unallocatedCash,
      totalConsolidated,
      totalPockets: activeWalletElements.length
    };
  }, [activeWalletElements, currentWallet, transactions]);

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
        concept: actionForm.concept || `Ingreso generado por ${elem.name}`,
        milestoneId: actionForm.milestoneId || null
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
        targetMemberId: actionForm.targetMemberId || null,
        milestoneId: actionForm.milestoneId || null
      });
    }

    refreshData();
    setActionModal(null);
    setActionForm({ amount: '', concept: '', memberId: currentUser?.id || 'ramiro', linkedElementId: '', targetMemberId: '', milestoneId: '' });
  };

  // Guardar reglas y acuerdos de la grupalidad en la billetera
  const handleSaveWalletRules = async (e) => {
    e.preventDefault();
    if (!currentWallet) return;
    await elementsService.updateWalletRules(currentWallet.id, walletRulesForm);
    setRulesSavedNotice(true);
    setTimeout(() => setRulesSavedNotice(false), 3000);
    refreshData();
  };

  // Crear un nuevo hito temporal en el elemento seleccionado
  const handleCreateMilestone = async (e) => {
    e.preventDefault();
    if (!selectedElement || !newMilestoneForm.name.trim()) return;
    await elementsService.createMilestone({
      elementId: selectedElement.id,
      name: newMilestoneForm.name,
      initialSeedFund: parseFloat(newMilestoneForm.initialSeedFund) || 0,
      goalDescription: newMilestoneForm.goalDescription
    });
    setNewMilestoneForm({ name: '', initialSeedFund: '', goalDescription: '' });
    setShowCreateMilestoneModal(false);
    refreshData();
  };

  // Cerrar y liquidar un hito temporal
  const handleCloseMilestone = async (e) => {
    e.preventDefault();
    if (!closingMilestone) return;
    await elementsService.closeMilestone(closingMilestone.id, closeMilestoneSummary);
    setClosingMilestone(null);
    setCloseMilestoneSummary('');
    refreshData();
  };

  // Agregar insumo a la base de costos del elemento
  const handleAddCostItem = async (e) => {
    e.preventDefault();
    if (!selectedElement || !newCostItemForm.name.trim()) return;
    await elementsService.addCostItemToElement(selectedElement.id, {
      name: newCostItemForm.name,
      unitCost: parseFloat(newCostItemForm.unitCost) || 0,
      unit: newCostItemForm.unit || 'unidad',
      category: newCostItemForm.category || 'Insumos'
    });
    setNewCostItemForm({ name: '', unitCost: '', unit: 'kg', category: 'Insumos' });
    setShowAddCostItem(false);
    refreshData();
    const updated = elementsService.elements.find(el => el.id === selectedElement.id);
    if (updated) setSelectedElement(updated);
  };

  // Eliminar insumo de la base de costos del elemento
  const handleDeleteCostItem = async (costItemId) => {
    if (!selectedElement) return;
    await elementsService.deleteCostItemFromElement(selectedElement.id, costItemId);
    refreshData();
    const updated = elementsService.elements.find(el => el.id === selectedElement.id);
    if (updated) setSelectedElement(updated);
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

  // Eliminar la billetera activa desde Información de Billetera
  const handleDeleteCurrentWallet = async () => {
    if (wallets.length <= 1) {
      alert("No puedes eliminar la única billetera activa.");
      return;
    }
    const confirmMsg = `¿Estás seguro de que deseas eliminar la billetera "${currentWallet.name}"?\n\nLos elementos económicos asociados no se perderán; se reasignarán automáticamente a la Billetera Principal.`;
    if (window.confirm(confirmMsg)) {
      await elementsService.deleteWallet(currentWallet.id);
      setShowWalletInfoModal(false);
      refreshData();
    }
  };

  return (
    <div className="w-full flex flex-col gap-6 pb-16">

      {/* ======================================================== */}
      {/* 1. CUENTA PRINCIPAL DEL USUARIO (HERO CARD ESTILO FINTECH) */}
      {/* ======================================================== */}
      <div 
        className="fintech-hero"
        style={{
          background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 45%, #4338ca 100%)',
          borderRadius: '28px',
          padding: '2.2rem 2rem',
          color: '#ffffff',
          boxShadow: '0 18px 40px -10px rgba(49, 46, 129, 0.45), 0 4px 14px rgba(0, 0, 0, 0.08)',
          border: '1px solid rgba(255, 255, 255, 0.16)',
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
              <button
                type="button"
                onClick={() => setShowWalletInfoModal(true)}
                className="px-3.5 py-1.5 rounded-full text-xs font-bold text-white transition-all flex items-center gap-1.5 shadow-sm"
                style={{ background: 'rgba(255, 255, 255, 0.18)', border: '1px solid rgba(255,255,255,0.25)', cursor: 'pointer' }}
                title="Ver información y gestión de esta billetera"
              >
                <Info size={14} />
                <span>Info de Billetera</span>
              </button>

              <button
                onClick={() => setShowBalance(!showBalance)}
                className="p-1.5 rounded-full transition-colors"
                style={{ background: 'rgba(255, 255, 255, 0.14)', color: '#ffffff', border: 'none', cursor: 'pointer' }}
                title={showBalance ? "Ocultar saldo" : "Mostrar saldo"}
              >
                {showBalance ? <Eye size={17} color="#ffffff" /> : <EyeOff size={17} color="#ffffff" />}
              </button>
            </div>
          </div>

          {/* Saldo Principal de la Billetera Destacado (Conectado con sus Elementos) */}
          <div>
            <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#c7d2fe', fontWeight: 700, marginBottom: '2px' }}>
              Total en Billetera {currentWallet?.name || 'Elementales'}
            </div>
            <div 
              style={{ 
                fontSize: '2.45rem', 
                fontWeight: 900, 
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
                {showBalance ? safeFormatCurrency(metrics.totalConsolidated, 2) : '••••••••'}
              </span>
              <span style={{ fontSize: '1rem', fontWeight: 700, color: '#c7d2fe' }}>ARS</span>
            </div>
            <p style={{ fontSize: '0.78rem', color: 'rgba(224, 231, 255, 0.85)', margin: 0, lineHeight: 1.35 }}>
              {currentWallet?.detail || 'Fondos totales distribuidos entre sus elementos y caja disponible.'}
            </p>

            {/* Desglose Conectado: En Elementos vs Caja Libre */}
            <div 
              style={{ 
                display: 'flex', 
                flexWrap: 'wrap', 
                alignItems: 'center', 
                gap: '10px', 
                marginTop: '10px',
                marginBottom: '4px'
              }}
            >
              <div 
                style={{ 
                  display: 'inline-flex', 
                  alignItems: 'center', 
                  gap: '8px', 
                  padding: '6px 14px', 
                  borderRadius: '9999px', 
                  background: 'rgba(255, 255, 255, 0.16)', 
                  border: '1px solid rgba(255, 255, 255, 0.22)',
                  fontSize: '0.76rem',
                  color: '#ffffff'
                }}
              >
                <span>📦 En Elementos ({activeWalletElements.length}):</span>
                <strong style={{ color: '#ffffff', fontWeight: 800 }}>
                  {showBalance ? safeFormatCurrency(metrics.totalInElements, 2) : '••••••'}
                </strong>
              </div>

              <div 
                style={{ 
                  display: 'inline-flex', 
                  alignItems: 'center', 
                  gap: '8px', 
                  padding: '6px 14px', 
                  borderRadius: '9999px', 
                  background: 'rgba(16, 185, 129, 0.22)', 
                  border: '1px solid rgba(16, 185, 129, 0.38)',
                  fontSize: '0.76rem',
                  color: '#a7f3d0'
                }}
              >
                <span>💵 Caja Libre / Sin Asignar:</span>
                <strong style={{ color: '#6ee7b7', fontWeight: 800 }}>
                  {showBalance ? safeFormatCurrency(metrics.unallocatedCash, 2) : '••••••'}
                </strong>
              </div>
            </div>
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
        <div 
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '14px'
          }}
        >
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
              Todos ({activeWalletElements.length})
            </button>
            <button
              onClick={() => setFilterType('bilateral')}
              className={`fintech-filter-btn ${filterType === 'bilateral' ? 'active-shared' : ''}`}
            >
              <span>🤝 Mano a Mano ({activeWalletElements.filter(e => e.type === 'bilateral').length})</span>
            </button>
            <button
              onClick={() => setFilterType('shared')}
              className={`fintech-filter-btn ${filterType === 'shared' ? 'active-shared' : ''}`}
            >
              <Users size={13} />
              <span>Colectivos ({activeWalletElements.filter(e => e.type === 'shared').length})</span>
            </button>
            <button
              onClick={() => setFilterType('individual')}
              className={`fintech-filter-btn ${filterType === 'individual' ? 'active-indiv' : ''}`}
            >
              <User size={13} />
              <span>Individuales ({activeWalletElements.filter(e => e.type === 'individual').length})</span>
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
                    borderRadius: '20px',
                    padding: '16px 18px',
                    border: '1px solid #e2e8f0',
                    marginTop: '14px'
                  }}
                >
                  <div className="flex items-baseline justify-between mb-1.5">
                    <span style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748b' }}>
                      {isBilateral ? 'Balanza del Intercambio' : 'Fondo Disponible'}
                    </span>
                    <span style={{ fontSize: '1.4rem', fontWeight: 800, color: stats.currentBalance >= 0 ? '#0f172a' : '#dc2626' }}>
                      {safeFormatCurrency(stats.currentBalance, 2)}
                    </span>
                  </div>

                  {/* Resumen de Flujos: Ingresos/Depósitos vs Gastos */}
                  <div 
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: '10px',
                      paddingTop: '10px',
                      marginTop: '10px',
                      borderTop: '1px solid #e2e8f0',
                      fontSize: '0.74rem'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#16a34a', fontWeight: 600 }}>
                      <TrendingUp size={14} color="#16a34a" />
                      <span>{isBilateral ? 'Abonado:' : 'Ingresos:'}</span>
                      <strong style={{ marginLeft: 'auto', color: '#15803d' }}>
                        {safeFormatCurrency((stats.totalIncome || 0) + (stats.totalDeposits || 0))}
                      </strong>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#dc2626', fontWeight: 600 }}>
                      <TrendingDown size={14} color="#dc2626" />
                      <span>{isBilateral ? 'Gastos:' : 'Gastos:'}</span>
                      <strong style={{ marginLeft: 'auto', color: '#b91c1c' }}>
                        {safeFormatCurrency(stats.totalExpense)}
                      </strong>
                    </div>
                  </div>
                </div>

                {/* Integrantes del Elemento */}
                {(isShared || isBilateral) && elem.members && elem.members.length > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.74rem', color: '#64748b', marginTop: '12px', padding: '0 2px' }}>
                    <span style={{ fontWeight: 600 }}>{isBilateral ? 'Entre:' : 'Integrantes:'}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                      {elem.members.map((mId) => {
                        const mObj = availableMembers.find(m => m.id === mId) || { name: mId };
                        const contributed = stats.memberContributions[mId] || 0;
                        return (
                          <span 
                            key={mId}
                            style={{
                              padding: '2px 9px',
                              borderRadius: '9999px',
                              background: '#f1f5f9',
                              color: '#334155',
                              fontWeight: 600,
                              fontSize: '0.72rem',
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
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', paddingTop: '10px', marginTop: '6px' }}>
                  {/* Botón Depositar / Aportar */}
                  <button
                    onClick={() => {
                      setActionModal({ type: 'deposit', element: elem });
                      setActionForm({ amount: '', concept: `Aporte para ${elem.name}`, memberId: currentUser?.id || 'ramiro' });
                    }}
                    style={{
                      padding: '9px 8px',
                      borderRadius: '9999px',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      background: '#eef2ff',
                      color: '#4338ca',
                      border: '1px solid #c7d2fe',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '5px',
                      transition: 'all 0.15s ease'
                    }}
                    title="Depositar dinero en este elemento"
                  >
                    <ArrowDownLeft size={14} color="#4338ca" />
                    <span>Depositar</span>
                  </button>

                  {/* Botón Egreso / Necesidad económica */}
                  <button
                    onClick={() => {
                      setActionModal({ type: 'expense', element: elem });
                      setActionForm({ amount: '', concept: `Gasto de ${elem.name}`, memberId: currentUser?.id || 'ramiro' });
                    }}
                    style={{
                      padding: '9px 8px',
                      borderRadius: '9999px',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      background: '#fff1f2',
                      color: '#e11d48',
                      border: '1px solid #fecdd3',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '5px',
                      transition: 'all 0.15s ease'
                    }}
                    title="Registrar un gasto o necesidad económica"
                  >
                    <ArrowUpRight size={14} color="#e11d48" />
                    <span>- Gasto</span>
                  </button>

                  {/* Botón Detalle */}
                  <button
                    onClick={() => setSelectedElement(elem)}
                    style={{
                      padding: '9px 8px',
                      borderRadius: '9999px',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      background: '#f8fafc',
                      color: '#334155',
                      border: '1px solid #cbd5e1',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '4px',
                      transition: 'all 0.15s ease'
                    }}
                    title="Ver detalle completo, historial y aportes"
                  >
                    <span>Detalle</span>
                    <ChevronRight size={14} color="#64748b" />
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
        <div 
          className="fixed inset-0 z-50 flex items-start sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto py-6 sm:py-8"
          style={{ overflowY: 'auto' }}
          onClick={() => setShowCreateModal(false)}
        >
          <div 
            className="bg-white rounded-[32px] w-full max-w-xl p-6 sm:p-8 shadow-2xl relative my-auto border border-slate-100"
            style={{ maxHeight: '90vh', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}
            onClick={e => e.stopPropagation()}
          >
            {/* Cerrar modal */}
            <button 
              type="button"
              onClick={() => setShowCreateModal(false)}
              style={{
                position: 'absolute',
                top: '20px',
                right: '20px',
                width: '38px',
                height: '38px',
                borderRadius: '50%',
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                color: '#64748b',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                zIndex: 25,
                transition: 'all 0.15s ease'
              }}
              title="Cerrar ventana"
            >
              <X size={18} />
            </button>

            {/* Encabezado del modal */}
            <div className="mb-6 pr-12">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">
                Paso {createStep} de 2
              </span>
              <h3 className="text-2xl font-black text-slate-900 mt-2.5 tracking-tight">
                {createStep === 1 ? '¿Cómo vas a gestionar este elemento?' : 'Información del Elemento'}
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 mt-1 leading-relaxed">
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
        <div 
          className="fixed inset-0 z-50 flex items-start sm:items-center justify-center bg-black/60 backdrop-blur-md p-3 sm:p-5 overflow-y-auto py-6 sm:py-8"
          style={{ overflowY: 'auto' }}
          onClick={() => setActionModal(null)}
        >
          <div 
            className="bg-white rounded-[32px] w-full max-w-xl p-6 sm:p-8 shadow-2xl relative my-auto border border-slate-100"
            style={{ maxHeight: '90vh', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}
            onClick={e => e.stopPropagation()}
          >
            <button 
              type="button"
              onClick={() => setActionModal(null)}
              style={{
                position: 'absolute',
                top: '20px',
                right: '20px',
                width: '38px',
                height: '38px',
                borderRadius: '50%',
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                color: '#64748b',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                zIndex: 25,
                transition: 'all 0.15s ease'
              }}
              title="Cerrar ventana"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-3.5 mb-6 pr-12">
              <span className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-3xl shadow-sm shrink-0">
                {actionModal.element.icon || '📦'}
              </span>
              <div className="flex-1 min-w-0">
                <span className="text-xs uppercase tracking-wider font-bold text-indigo-600 block">
                  {actionModal.type === 'deposit' && '📥 Depositar Dinero en el Elemento'}
                  {actionModal.type === 'withdraw' && '📤 Retirar / Reintegrar Saldo'}
                  {actionModal.type === 'income' && '➕ Registrar Ingreso Generado'}
                  {actionModal.type === 'expense' && '➖ Registrar Egreso / Necesidad'}
                </span>
                <h3 className="text-xl font-black text-slate-900 leading-tight truncate mt-0.5">
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
                <label className="text-xs font-bold text-slate-700 mb-1.5 block">
                  Monto (ARS) *
                </label>
                <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 focus-within:bg-white focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/20 transition-all">
                  <span className="text-xl font-black text-slate-400 select-none">$</span>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="0"
                    value={actionForm.amount}
                    onChange={e => setActionForm({ ...actionForm, amount: e.target.value })}
                    className="w-full bg-transparent border-none text-xl font-black text-slate-900 focus:outline-none"
                  />
                  <span className="text-xs font-bold text-slate-400 select-none">ARS</span>
                </div>
              </div>

              {/* Insumos Frecuentes / Base de Costos (Acceso Rápido) */}
              {actionModal.element.costBase && actionModal.element.costBase.length > 0 && actionModal.type === 'expense' && (
                <div className="p-2.5 rounded-2xl bg-slate-50 border border-slate-200">
                  <span className="text-[11px] font-bold text-slate-600 block mb-1.5">
                    ⚡ Insumos Frecuentes (Planilla Viva del Elemento):
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {actionModal.element.costBase.map(item => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          setActionForm(prev => ({
                            ...prev,
                            amount: item.unitCost.toString(),
                            concept: `${item.name} (${safeFormatCurrency(item.unitCost)} / ${item.unit})`
                          }));
                        }}
                        className="px-2.5 py-1 rounded-lg bg-white border border-slate-300 hover:border-indigo-400 text-[11px] font-bold text-slate-700 shadow-2xs transition-colors flex items-center gap-1"
                      >
                        <span>{item.name}</span>
                        <span className="text-indigo-600 font-extrabold">{safeFormatCurrency(item.unitCost)}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

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

              {/* Asignar a un Hito Temporal (Si el elemento tiene hitos activos) */}
              {(actionModal.type === 'expense' || actionModal.type === 'income') && (() => {
                const activeMilestones = elementsService.getActiveMilestones(actionModal.element.id);
                if (activeMilestones.length === 0) return null;
                return (
                  <div className="p-3 rounded-2xl bg-amber-50/70 border border-amber-200 flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
                      <Calendar size={13} className="text-amber-700" />
                      <span>🎪 ¿Asignar a un Hito Temporal?</span>
                    </label>
                    <select
                      value={actionForm.milestoneId || ''}
                      onChange={e => setActionForm({ ...actionForm, milestoneId: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-amber-300 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
                    >
                      <option value="">-- Sin hito específico (Fondo general del elemento) --</option>
                      {activeMilestones.map(m => (
                        <option key={m.id} value={m.id}>
                          {m.name} (Fondo semilla: {safeFormatCurrency(m.initialSeedFund)})
                        </option>
                      ))}
                    </select>
                    <p className="text-[11px] text-amber-800 leading-snug">
                      Asigna este movimiento a una edición o evento puntual para calcular su balance y liquidación neta.
                    </p>
                  </div>
                );
              })()}

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
      {/* ======================================================== */}
      {/* MODAL 3: DETALLE COMPLETO DEL ELEMENTO (FINTECH MODERNO) */}
      {/* ======================================================== */}
      {selectedElement && (
        <div 
          className="fixed inset-0 z-50 flex items-start sm:items-center justify-center bg-black/60 backdrop-blur-md p-3 sm:p-5 overflow-y-auto py-6 sm:py-8"
          style={{ overflowY: 'auto' }}
          onClick={() => setSelectedElement(null)}
        >
          <div 
            className="bg-white rounded-[32px] w-full max-w-2xl p-6 sm:p-8 shadow-2xl relative my-auto border border-slate-100"
            style={{ maxHeight: '90vh', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}
            onClick={e => e.stopPropagation()}
          >
            {/* Botón flotante para cerrar */}
            <button 
              type="button"
              onClick={() => setSelectedElement(null)}
              style={{
                position: 'absolute',
                top: '20px',
                right: '20px',
                width: '38px',
                height: '38px',
                borderRadius: '50%',
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                color: '#64748b',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                zIndex: 25,
                transition: 'all 0.15s ease'
              }}
              title="Cerrar ventana"
            >
              <X size={18} />
            </button>

            {/* Cabecera del Elemento Espaciosa */}
            <div className="flex items-start gap-4 mb-6 pr-12">
              <div className="w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-3xl shadow-sm shrink-0">
                {selectedElement.icon || '📦'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h3 className="text-2xl font-black text-slate-900 tracking-tight leading-tight">
                    {selectedElement.name}
                  </h3>
                  <span className={`text-xs px-3 py-1 rounded-full font-bold ${
                    selectedElement.type === 'bilateral'
                      ? 'bg-purple-100 text-purple-800 border border-purple-200'
                      : selectedElement.type === 'shared' 
                      ? 'bg-amber-100 text-amber-800 border border-amber-200' 
                      : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                  }`}>
                    {selectedElement.type === 'bilateral' ? '🤝 Mano a Mano' : selectedElement.type === 'shared' ? 'Compartido' : 'Individual'}
                  </span>
                </div>

                {/* Badges de Co-creación Multi-billetera */}
                {Array.isArray(selectedElement.walletIds) && selectedElement.walletIds.length > 1 && (
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    <span className="text-xs font-semibold text-slate-500">🤝 Co-creado con:</span>
                    {selectedElement.walletIds.map(wId => {
                      const wObj = wallets.find(wall => wall.id === wId) || { name: wId, icon: '🐝' };
                      return (
                        <span key={wId} className="px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200/80 shadow-2xs">
                          {wObj.icon} {wObj.name}
                        </span>
                      );
                    })}
                  </div>
                )}

                {selectedElement.description && (
                  <p className="text-xs sm:text-sm text-slate-500 mt-2 leading-relaxed">
                    {selectedElement.description}
                  </p>
                )}
              </div>
            </div>

            {/* Saldo y Estadísticas */}
            {(() => {
              const stats = elementsService.getElementStats(selectedElement.id);
              const elemMilestones = elementsService.getMilestonesByElement(selectedElement.id);
              const costBaseItems = Array.isArray(selectedElement.costBase) ? selectedElement.costBase : [];

              return (
                <div className="flex flex-col gap-6">
                  {/* Hero Card de Saldo */}
                  <div className="p-5 sm:p-6 rounded-3xl bg-slate-900 text-white shadow-xl shadow-slate-900/10 relative overflow-hidden">
                    <div className="relative z-10">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
                        Saldo Total en {selectedElement.name}
                      </span>
                      <div className="text-3xl sm:text-4xl font-black text-white tracking-tight my-2">
                        {safeFormatCurrency(stats.currentBalance, 2)}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4 pt-4 border-t border-slate-800 text-xs">
                        <div className="flex items-center justify-between sm:justify-start sm:gap-2 p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/50">
                          <span className="text-slate-400 font-medium">Ingresos / Depósitos:</span>
                          <span className="text-emerald-400 font-extrabold text-sm">
                            +{safeFormatCurrency((stats.totalIncome || 0) + (stats.totalDeposits || 0))}
                          </span>
                        </div>
                        <div className="flex items-center justify-between sm:justify-start sm:gap-2 p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/50">
                          <span className="text-slate-400 font-medium">Egresos / Gastos:</span>
                          <span className="text-rose-400 font-extrabold text-sm">
                            -{safeFormatCurrency(stats.totalExpense)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Botones de acción rápida estilo Fintech */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    <button
                      onClick={() => {
                        setActionModal({ type: 'deposit', element: selectedElement });
                        setActionForm({ amount: '', concept: `Depósito en ${selectedElement.name}`, memberId: currentUser?.id || 'ramiro', linkedElementId: '', targetMemberId: '', milestoneId: '' });
                      }}
                      className="btn py-3 px-3 rounded-2xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm flex items-center justify-center gap-1.5 transition-all"
                    >
                      <ArrowDownLeft size={16} />
                      <span>+ Depositar</span>
                    </button>
                    <button
                      onClick={() => {
                        setActionModal({ type: 'income', element: selectedElement });
                        setActionForm({ amount: '', concept: `Ingreso de ${selectedElement.name}`, memberId: currentUser?.id || 'ramiro', linkedElementId: '', targetMemberId: '', milestoneId: '' });
                      }}
                      className="btn py-3 px-3 rounded-2xl text-xs font-bold bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200/80 shadow-2xs flex items-center justify-center gap-1.5 transition-all"
                    >
                      <TrendingUp size={16} />
                      <span>+ Ingreso</span>
                    </button>
                    <button
                      onClick={() => {
                        setActionModal({ type: 'expense', element: selectedElement });
                        setActionForm({ amount: '', concept: `Gasto de ${selectedElement.name}`, memberId: currentUser?.id || 'ramiro', linkedElementId: '', targetMemberId: '', milestoneId: '' });
                      }}
                      className="btn py-3 px-3 rounded-2xl text-xs font-bold bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200/80 shadow-2xs flex items-center justify-center gap-1.5 transition-all"
                    >
                      <TrendingDown size={16} />
                      <span>- Egreso</span>
                    </button>
                    <button
                      onClick={() => {
                        setActionModal({ type: 'withdraw', element: selectedElement });
                        setActionForm({ amount: '', concept: `Retiro de ${selectedElement.name}`, memberId: currentUser?.id || 'ramiro', linkedElementId: '', targetMemberId: '', milestoneId: '' });
                      }}
                      className="btn py-3 px-3 rounded-2xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 shadow-2xs flex items-center justify-center gap-1.5 transition-all"
                    >
                      <ArrowUpRight size={16} />
                      <span>Retirar</span>
                    </button>
                  </div>

                  {/* Barra de Pestañas / Segmented Control Tabs */}
                  <div className="flex items-center gap-1.5 p-1.5 bg-slate-100 rounded-2xl overflow-x-auto text-xs font-bold text-slate-600">
                    <button
                      type="button"
                      onClick={() => setElementDetailTab('overview')}
                      className={`flex-1 py-2 px-3 rounded-xl transition-all whitespace-nowrap flex items-center justify-center gap-1.5 ${
                        elementDetailTab === 'overview'
                          ? 'bg-white text-slate-900 shadow-sm font-extrabold'
                          : 'hover:text-slate-900'
                      }`}
                    >
                      <Users size={14} />
                      <span>Resumen</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setElementDetailTab('milestones')}
                      className={`flex-1 py-2 px-3 rounded-xl transition-all whitespace-nowrap flex items-center justify-center gap-1.5 ${
                        elementDetailTab === 'milestones'
                          ? 'bg-white text-slate-900 shadow-sm font-extrabold'
                          : 'hover:text-slate-900'
                      }`}
                    >
                      <Calendar size={14} />
                      <span>Hitos ({elemMilestones.length})</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setElementDetailTab('costs')}
                      className={`flex-1 py-2 px-3 rounded-xl transition-all whitespace-nowrap flex items-center justify-center gap-1.5 ${
                        elementDetailTab === 'costs'
                          ? 'bg-white text-slate-900 shadow-sm font-extrabold'
                          : 'hover:text-slate-900'
                      }`}
                    >
                      <Tag size={14} />
                      <span>Insumos ({costBaseItems.length})</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setElementDetailTab('history')}
                      className={`flex-1 py-2 px-3 rounded-xl transition-all whitespace-nowrap flex items-center justify-center gap-1.5 ${
                        elementDetailTab === 'history'
                          ? 'bg-white text-slate-900 shadow-sm font-extrabold'
                          : 'hover:text-slate-900'
                      }`}
                    >
                      <Clock size={14} />
                      <span>Movimientos ({stats.recentTxs.length})</span>
                    </button>
                  </div>

                  {/* CONTENIDO DE PESTAÑAS */}

                  {/* 1. PESTAÑA: RESUMEN */}
                  {elementDetailTab === 'overview' && (
                    <div className="space-y-5">
                      {/* Intercambio Bilateral Mano a Mano */}
                      {selectedElement.type === 'bilateral' && selectedElement.members && (
                        <div className="p-5 rounded-2xl bg-purple-50/70 border border-purple-200 text-xs">
                          <div className="flex items-center justify-between font-bold text-purple-900 mb-2">
                            <span className="flex items-center gap-1.5 text-xs">
                              <span>🤝 Intercambio Bilateral</span>
                              <span className="text-[10px] bg-purple-200/80 text-purple-800 px-2.5 py-0.5 rounded-full font-bold">1 a 1</span>
                            </span>
                            <span className="text-purple-700 text-[11px] font-semibold">Balanza Directa</span>
                          </div>
                          <div className="flex items-center gap-2.5 text-slate-700 my-2.5">
                            {selectedElement.members.map((mId, idx) => {
                              const mObj = availableMembers.find(m => m.id === mId) || { name: mId };
                              return (
                                <React.Fragment key={mId}>
                                  {idx > 0 && <span className="text-purple-500 font-black text-sm">⇄</span>}
                                  <span className="font-bold px-3 py-1.5 bg-white rounded-xl border border-purple-100 shadow-2xs">
                                    {mObj.name}
                                  </span>
                                </React.Fragment>
                              );
                            })}
                          </div>
                          <p className="text-[11px] text-purple-900/80 mt-2 mb-0 leading-relaxed">
                            Intercambios, compras por encargo y deudas mutuas. Cualquier gasto puede tallarse a un proyecto colectivo (como la Feria o la Huerta) para computarse como inversión.
                          </p>
                        </div>
                      )}

                      {/* Aportes por Integrante con Avatar y Porcentaje */}
                      {selectedElement.type === 'shared' && (
                        <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80">
                          <h4 className="text-xs font-bold text-slate-700 mb-3 uppercase tracking-wider flex items-center gap-1.5">
                            <Users size={14} className="text-indigo-600" />
                            <span>Aportes por Integrante</span>
                          </h4>
                          <div className="space-y-2.5">
                            {selectedElement.members?.map(mId => {
                              const mObj = availableMembers.find(m => m.id === mId) || { name: mId };
                              const contributed = stats.memberContributions[mId] || 0;
                              const totalDep = stats.totalDeposits > 0 ? stats.totalDeposits : 1;
                              const pct = stats.totalDeposits > 0 ? Math.min(100, Math.round((contributed / totalDep) * 100)) : 0;

                              return (
                                <div key={mId} className="p-3.5 rounded-xl bg-white border border-slate-200/70 shadow-2xs">
                                  <div className="flex items-center justify-between mb-1.5 text-xs">
                                    <div className="flex items-center gap-2.5">
                                      <span className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs shadow-2xs">
                                        {mObj.name.charAt(0).toUpperCase()}
                                      </span>
                                      <span className="font-bold text-slate-800">{mObj.name}</span>
                                    </div>
                                    <span className="font-extrabold text-slate-900 text-sm">
                                      {safeFormatCurrency(contributed)}
                                      <span className="text-[11px] text-slate-400 font-normal ml-1.5">({pct}%)</span>
                                    </span>
                                  </div>
                                  <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden mt-2">
                                    <div
                                      className="bg-indigo-600 h-1.5 rounded-full transition-all duration-300"
                                      style={{ width: `${pct}%` }}
                                    />
                                  </div>
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
                          <div className="p-5 rounded-2xl bg-amber-50/80 border border-amber-200/90">
                            <div className="flex items-center justify-between mb-3">
                              <span className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
                                <Sparkles size={14} className="text-amber-700" />
                                <span>Inversiones desde Mano a Mano ({linkedTxs.length})</span>
                              </span>
                              <span className="text-sm font-black text-amber-950">
                                {safeFormatCurrency(totalLinked)}
                              </span>
                            </div>
                            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                              {linkedTxs.map(ltx => (
                                <div key={ltx.id} className="p-3 rounded-xl bg-white border border-amber-100 shadow-2xs flex items-center justify-between text-xs gap-3">
                                  <div className="flex-1 min-w-0">
                                    <div className="font-bold text-slate-800 truncate">{ltx.concept}</div>
                                    <div className="text-[10px] text-slate-500 mt-0.5">
                                      {ltx.date} • Aportado por <strong>{ltx.memberName}</strong> {ltx.targetMemberId ? `(pedido por ${ltx.targetMemberId})` : ''}
                                    </div>
                                  </div>
                                  <span className="font-black text-amber-900 shrink-0 text-sm">
                                    {safeFormatCurrency(ltx.amount)}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  )}

                  {/* 2. PESTAÑA: HITOS TEMPORALES */}
                  {elementDetailTab === 'milestones' && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                            Hitos & Ediciones Temporales
                          </h4>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            Micro-contabilidad con fondo semilla, ingresos/egresos y liquidación neta.
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setShowCreateMilestoneModal(true)}
                          className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white shadow-sm flex items-center gap-1.5 transition-all"
                        >
                          <Plus size={14} />
                          <span>Nuevo Hito</span>
                        </button>
                      </div>

                      {elemMilestones.length === 0 ? (
                        <div className="p-6 rounded-2xl bg-amber-50/60 border border-amber-200/80 text-center">
                          <span className="text-2xl block mb-1">🎪</span>
                          <span className="text-xs font-bold text-amber-950 block">No hay hitos activos en este elemento</span>
                          <p className="text-[11px] text-amber-800/80 mt-1 mb-3">
                            Puedes crear hitos para ferias puntuales, cosechas o ciclos de producción independientes.
                          </p>
                          <button
                            type="button"
                            onClick={() => setShowCreateMilestoneModal(true)}
                            className="px-4 py-2 rounded-full text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white shadow-sm inline-flex items-center gap-1.5"
                          >
                            <Plus size={14} />
                            <span>Crear Primer Hito</span>
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {elemMilestones.map(m => {
                            const mStats = elementsService.getMilestoneStats(m.id);
                            const isOpen = m.status === 'open';
                            const net = isOpen ? mStats.netResult : (m.netResult ?? mStats.netResult);

                            return (
                              <div key={m.id} className="p-4 sm:p-5 rounded-2xl bg-white border border-amber-200/90 shadow-sm text-xs">
                                <div className="flex items-start justify-between gap-3 flex-wrap">
                                  <div className="flex-1 min-w-[200px]">
                                    <div className="flex items-center gap-2">
                                      <span className="font-extrabold text-slate-900 text-sm">{m.name}</span>
                                      <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                                        isOpen ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-slate-100 text-slate-600'
                                      }`}>
                                        {isOpen ? 'En curso' : 'Liquidado / Cerrado'}
                                      </span>
                                    </div>
                                    <div className="text-[11px] text-slate-500 mt-1">
                                      Inicio: <strong>{m.startDate}</strong> {m.endDate ? `• Cierre: ${m.endDate}` : ''} • Semilla: <strong>{safeFormatCurrency(m.initialSeedFund)}</strong>
                                    </div>
                                    {m.goalDescription && (
                                      <p className="text-xs text-slate-600 mt-2 italic bg-slate-50 p-2 rounded-xl border border-slate-100">
                                        🎯 {m.goalDescription}
                                      </p>
                                    )}
                                  </div>

                                  <div className="text-right sm:text-right">
                                    <span className="text-[10px] text-slate-400 block uppercase font-bold tracking-wider">Balance Neto</span>
                                    <span className={`text-base font-black ${net >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                      {net >= 0 ? '+' : ''}{safeFormatCurrency(net)}
                                    </span>
                                  </div>
                                </div>

                                {isOpen && (
                                  <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between flex-wrap gap-2">
                                    <span className="text-[11px] text-slate-500">
                                      {mStats.txCount} movimiento{mStats.txCount !== 1 ? 's' : ''} asignado{mStats.txCount !== 1 ? 's' : ''}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setClosingMilestone(m);
                                        setCloseMilestoneSummary(`Cierre con balance neto de ${safeFormatCurrency(net)}.`);
                                      }}
                                      className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 shadow-2xs transition-all"
                                    >
                                      Cerrar y Liquidar Hito
                                    </button>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}

                  {/* 3. PESTAÑA: BASE DE COSTOS (PLANILLA VIVA) */}
                  {elementDetailTab === 'costs' && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                            Planilla Viva de Costos e Insumos
                          </h4>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            Catálogo de insumos y costos unitarios para cargar compras en 1 clic.
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setShowAddCostItem(!showAddCostItem)}
                          className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm flex items-center gap-1.5 transition-all"
                        >
                          <Plus size={14} />
                          <span>{showAddCostItem ? 'Cancelar' : 'Sumar Insumo'}</span>
                        </button>
                      </div>

                      {/* Formulario para agregar insumo */}
                      {showAddCostItem && (
                        <form onSubmit={handleAddCostItem} className="p-4 bg-indigo-50/60 rounded-2xl border border-indigo-200 space-y-3 text-xs">
                          <div className="font-bold text-indigo-950 text-xs flex items-center gap-1.5">
                            <Tag size={13} className="text-indigo-600" />
                            <span>Nuevo Insumo en el Catálogo de Costos</span>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                            <input
                              type="text"
                              required
                              placeholder="Nombre (ej: Maíz partido)"
                              value={newCostItemForm.name}
                              onChange={e => setNewCostItemForm({ ...newCostItemForm, name: e.target.value })}
                              className="px-3 py-2 rounded-xl border border-indigo-200 text-xs bg-white font-medium"
                            />
                            <div className="relative">
                              <span className="absolute left-3 top-2 text-slate-400 font-bold">$</span>
                              <input
                                type="number"
                                required
                                min="1"
                                placeholder="Costo unitario"
                                value={newCostItemForm.unitCost}
                                onChange={e => setNewCostItemForm({ ...newCostItemForm, unitCost: e.target.value })}
                                className="w-full pl-7 pr-3 py-2 rounded-xl border border-indigo-200 text-xs font-bold bg-white"
                              />
                            </div>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                            <input
                              type="text"
                              placeholder="Unidad de medida (kg, litro, 100gr, unidad)"
                              value={newCostItemForm.unit}
                              onChange={e => setNewCostItemForm({ ...newCostItemForm, unit: e.target.value })}
                              className="px-3 py-2 rounded-xl border border-indigo-200 text-xs bg-white"
                            />
                            <input
                              type="text"
                              placeholder="Categoría (ej: Insumos Arepas, Despensa)"
                              value={newCostItemForm.category}
                              onChange={e => setNewCostItemForm({ ...newCostItemForm, category: e.target.value })}
                              className="px-3 py-2 rounded-xl border border-indigo-200 text-xs bg-white"
                            />
                          </div>
                          <button
                            type="submit"
                            className="btn w-full py-2.5 rounded-xl font-bold text-xs bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm"
                          >
                            Guardar en Planilla Viva
                          </button>
                        </form>
                      )}

                      {/* Lista de insumos */}
                      {costBaseItems.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          {costBaseItems.map(item => (
                            <div key={item.id} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between text-xs hover:border-slate-300 transition-all">
                              <div>
                                <span className="font-extrabold text-slate-800 block text-xs">{item.name}</span>
                                <div className="text-[11px] text-slate-500 mt-0.5">
                                  <strong className="text-indigo-700">{safeFormatCurrency(item.unitCost)}</strong> / {item.unit}
                                </div>
                                <span className="text-[10px] text-slate-400 font-medium block mt-0.5">
                                  {item.category || 'Insumos'}
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setActionModal({ type: 'expense', element: selectedElement });
                                    setActionForm({
                                      amount: item.unitCost.toString(),
                                      concept: `${item.name} (${safeFormatCurrency(item.unitCost)}/${item.unit})`,
                                      memberId: currentUser?.id || 'ramiro',
                                      linkedElementId: '',
                                      targetMemberId: '',
                                      milestoneId: ''
                                    });
                                  }}
                                  className="px-2.5 py-1.5 rounded-xl text-[11px] font-bold bg-white text-indigo-700 hover:bg-indigo-50 border border-indigo-200 shadow-2xs"
                                  title="Registrar gasto usando este insumo"
                                >
                                  Cargar Gasto
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteCostItem(item.id)}
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                                  title="Eliminar de catálogo"
                                >
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80 text-center">
                          <span className="text-2xl block mb-1">📋</span>
                          <span className="text-xs font-bold text-slate-800 block">No hay insumos cargados aún</span>
                          <p className="text-[11px] text-slate-500 mt-1 mb-3">
                            Agregá insumos recurrentes (como maíz, harina o combustible) para registrar gastos con 1 solo toque.
                          </p>
                          <button
                            type="button"
                            onClick={() => setShowAddCostItem(true)}
                            className="px-4 py-2 rounded-full text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm inline-flex items-center gap-1.5"
                          >
                            <Plus size={14} />
                            <span>Sumar Primer Insumo</span>
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* 4. PESTAÑA: HISTORIAL DE MOVIMIENTOS */}
                  {elementDetailTab === 'history' && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                          Historial de Movimientos ({stats.recentTxs.length})
                        </h4>
                      </div>

                      {stats.recentTxs.length > 0 ? (
                        <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
                          {stats.recentTxs.map(tx => {
                            const targetId = tx.targetMemberId || (selectedElement.members?.find(m => m !== tx.memberId) || 'cristian');
                            const targetMember = availableMembers.find(m => m.id === targetId) || { name: 'Compañero', cleanPhone: '5491149748673' };
                            const refCode = tx.id.replace('etx-', '').slice(-6).toUpperCase();

                            return (
                              <div key={tx.id} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs flex flex-col gap-2 hover:border-slate-300 transition-all">
                                <div className="flex items-start justify-between gap-3">
                                  <div className="flex-1 min-w-0">
                                    <div className="font-extrabold text-slate-900 text-xs">{tx.concept}</div>
                                    <div className="text-[10px] text-slate-500 mt-0.5">
                                      {tx.date} • Por <strong>{tx.memberName}</strong> {tx.targetMemberId ? `(Para: ${tx.targetMemberId})` : ''} • {tx.type === 'deposit' ? 'Depósito' : tx.type === 'expense' ? 'Gasto' : 'Ingreso'}
                                    </div>
                                    {tx.linkedElementName && (
                                      <div className="mt-1">
                                        <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-200 px-2 py-0.5 rounded-full">
                                          ✨ Vinculado a: {tx.linkedElementName}
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                  <span className={`font-black text-sm shrink-0 ${tx.type === 'expense' ? 'text-rose-600' : 'text-emerald-600'}`}>
                                    {tx.type === 'expense' ? '-' : '+'}{safeFormatCurrency(tx.amount)}
                                  </span>
                                </div>

                                {/* Barra de Notificación y Código de Referencia Unívoco */}
                                <div className="flex items-center justify-between pt-2 border-t border-slate-200/70">
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
                                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition-colors shadow-2xs"
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
                        <p className="text-xs text-slate-400 italic py-4 text-center">No hay movimientos registrados aún en este elemento.</p>
                      )}
                    </div>
                  )}

                  {/* Botón Peligroso Eliminar */}
                  <div className="pt-3 border-t border-slate-100 flex justify-end">
                    <button
                      onClick={() => handleDeleteElement(selectedElement.id, selectedElement.name)}
                      className="text-xs text-rose-500 hover:text-rose-700 flex items-center gap-1 font-medium transition-colors"
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
      {/* MODAL 4: INGRESAR DINERO A LA BILLETERA                  */}
      {/* ======================================================== */}
      {showTopUpModal && (
        <div 
          className="fixed inset-0 z-50 flex items-start sm:items-center justify-center bg-black/60 backdrop-blur-md p-3 sm:p-5 overflow-y-auto py-6 sm:py-8"
          style={{ overflowY: 'auto' }}
          onClick={() => setShowTopUpModal(false)}
        >
          <div 
            className="bg-white rounded-[32px] w-full max-w-md p-6 sm:p-8 shadow-2xl relative my-auto border border-slate-100"
            style={{ maxHeight: '90vh', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}
            onClick={e => e.stopPropagation()}
          >
            {/* Botón cerrar flotante */}
            <button 
              type="button"
              onClick={() => setShowTopUpModal(false)}
              style={{
                position: 'absolute',
                top: '20px',
                right: '20px',
                width: '38px',
                height: '38px',
                borderRadius: '50%',
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                color: '#64748b',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                zIndex: 25,
                transition: 'all 0.15s ease'
              }}
              title="Cerrar ventana"
            >
              <X size={18} />
            </button>

            {/* Cabecera */}
            <div style={{ textAlign: 'center', marginBottom: '1.5rem', padding: '0 0.5rem' }}>
              <div 
                style={{
                  width: '60px',
                  height: '60px',
                  borderRadius: '20px',
                  background: '#ecfdf5',
                  border: '1px solid #a7f3d0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '2rem',
                  margin: '0 auto 12px auto',
                  boxShadow: '0 2px 8px rgba(16, 185, 129, 0.15)'
                }}
              >
                💵
              </div>
              <h3 style={{ fontSize: '1.3rem', fontWeight: 900, color: '#0f172a', margin: 0, letterSpacing: '-0.02em' }}>
                Ingresar Dinero a Billetera
              </h3>
              <p style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '6px', lineHeight: 1.4 }}>
                Carga saldo libre en <strong>{currentWallet?.name || 'esta billetera'}</strong> para fondear sus elementos y actividades.
              </p>
            </div>

            <form onSubmit={handleTopUpMainAccount} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#334155', display: 'block', marginBottom: '6px' }}>
                  Monto a Ingresar (ARS)
                </label>
                
                {/* Input de Monto Inline con $ sin colisiones */}
                <div 
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    background: '#f8fafc',
                    border: '2px solid #e2e8f0',
                    borderRadius: '20px',
                    padding: '12px 18px',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <span style={{ fontSize: '1.75rem', fontWeight: 900, color: '#059669', userSelect: 'none' }}>$</span>
                  <input
                    type="number"
                    required
                    min="100"
                    step="100"
                    value={topUpAmount}
                    onChange={e => setTopUpAmount(e.target.value)}
                    style={{
                      border: 'none',
                      background: 'transparent',
                      fontSize: '1.85rem',
                      fontWeight: 900,
                      color: '#0f172a',
                      outline: 'none',
                      width: '180px',
                      textAlign: 'left'
                    }}
                    placeholder="0"
                    autoFocus
                  />
                  <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#94a3b8', userSelect: 'none' }}>ARS</span>
                </div>
              </div>

              {/* Botones de montos rápidos con estilos fintech modernos */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                {['50000', '100000', '250000'].map(m => {
                  const isSelected = topUpAmount === m;
                  return (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setTopUpAmount(m)}
                      style={{
                        padding: '10px 8px',
                        borderRadius: '9999px',
                        background: isSelected ? '#ecfdf5' : '#f8fafc',
                        border: isSelected ? '2px solid #10b981' : '1px solid #e2e8f0',
                        color: isSelected ? '#047857' : '#334155',
                        fontSize: '0.82rem',
                        fontWeight: 800,
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                        boxShadow: isSelected ? '0 2px 6px rgba(16, 185, 129, 0.2)' : 'none'
                      }}
                    >
                      +${(parseInt(m) / 1000)}k
                    </button>
                  );
                })}
              </div>

              {/* Botón principal */}
              <button
                type="submit"
                style={{
                  width: '100%',
                  padding: '14px',
                  borderRadius: '9999px',
                  background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
                  color: '#ffffff',
                  fontSize: '0.95rem',
                  fontWeight: 800,
                  border: 'none',
                  cursor: 'pointer',
                  boxShadow: '0 4px 14px rgba(16, 185, 129, 0.35)',
                  transition: 'all 0.15s ease',
                  marginTop: '6px'
                }}
              >
                Cargar Saldo
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 5: INFORMACIÓN Y GESTIÓN DE LA BILLETERA           */}
      {/* ======================================================== */}
      {/* ======================================================== */}
      {/* MODAL 5: INFORMACIÓN Y GESTIÓN DE LA BILLETERA (FINTECH) */}
      {/* ======================================================== */}
      {showWalletInfoModal && currentWallet && (
        <div 
          className="fixed inset-0 z-50 flex items-start sm:items-center justify-center bg-black/60 backdrop-blur-md p-3 sm:p-5 overflow-y-auto py-6 sm:py-8"
          style={{ overflowY: 'auto' }}
          onClick={() => setShowWalletInfoModal(false)}
        >
          <div 
            className="bg-white rounded-[32px] w-full max-w-2xl p-6 sm:p-8 shadow-2xl relative my-auto border border-slate-100"
            style={{ maxHeight: '90vh', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}
            onClick={e => e.stopPropagation()}
          >
            {/* Cerrar modal */}
            <button 
              type="button"
              onClick={() => setShowWalletInfoModal(false)}
              style={{
                position: 'absolute',
                top: '20px',
                right: '20px',
                width: '38px',
                height: '38px',
                borderRadius: '50%',
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                color: '#64748b',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                zIndex: 25,
                transition: 'all 0.15s ease'
              }}
              title="Cerrar ventana"
            >
              <X size={18} />
            </button>

            {/* Cabecera de la Billetera */}
            <div className="flex items-start gap-4 mb-6 pr-12">
              <span className="w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-3xl shadow-sm shrink-0">
                {currentWallet.icon || '🐝'}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h3 className="text-2xl font-black text-slate-900 tracking-tight leading-tight">
                    {currentWallet.name}
                  </h3>
                  <span className="text-xs px-3 py-1 rounded-full font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Billetera Activa
                  </span>
                </div>
                {currentWallet.alias && (
                  <span className="text-xs text-indigo-600 font-mono font-bold block mt-1">
                    @{currentWallet.alias}
                  </span>
                )}
                {currentWallet.detail && (
                  <p className="text-xs sm:text-sm text-slate-500 mt-1.5 leading-relaxed">
                    {currentWallet.detail}
                  </p>
                )}
              </div>
            </div>

            {/* Resumen de Saldo y Elementos en esta Billetera */}
            {(() => {
              const walletElements = (elements || []).filter(e => {
                const isDirect = e.walletId === currentWallet.id || (currentWallet.id === 'wallet-elementales' && !e.walletId);
                const isCoOwned = Array.isArray(e.walletIds) && e.walletIds.includes(currentWallet.id);
                return isDirect || isCoOwned;
              });
              const totalBalance = walletElements.reduce((sum, e) => {
                const st = elementsService.getElementStats(e.id);
                return sum + (st.currentBalance || 0);
              }, 0);

              return (
                <div className="flex flex-col gap-6">
                  {/* Hero Balances */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="p-4 rounded-2xl bg-indigo-600 text-white shadow-sm">
                      <span className="text-[11px] font-bold uppercase text-indigo-200 tracking-wider block">
                        Total Billetera
                      </span>
                      <span className="text-xl sm:text-2xl font-black block mt-1">
                        {safeFormatCurrency(totalBalance + Math.max(0, Number(currentWallet.balance) || 0))}
                      </span>
                      <span className="text-[10px] text-indigo-200 block mt-0.5">Consolidado total</span>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
                      <span className="text-[11px] font-bold uppercase text-slate-500 tracking-wider block">
                        En Elementos ({walletElements.length})
                      </span>
                      <span className="text-xl sm:text-2xl font-black text-slate-900 block mt-1">
                        {safeFormatCurrency(totalBalance)}
                      </span>
                      <span className="text-[10px] text-slate-400 block mt-0.5">Asignado a bolsillos</span>
                    </div>

                    <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200/80">
                      <span className="text-[11px] font-bold uppercase text-emerald-800 tracking-wider block">
                        Caja Libre / Disponible
                      </span>
                      <span className="text-xl sm:text-2xl font-black text-emerald-700 block mt-1">
                        {safeFormatCurrency(Math.max(0, Number(currentWallet.balance) || 0))}
                      </span>
                      <span className="text-[10px] text-emerald-600/80 block mt-0.5">Sin asignar a elemento</span>
                    </div>
                  </div>

                  {/* Tabs de Billetera */}
                  <div className="flex items-center gap-1.5 p-1.5 bg-slate-100 rounded-2xl overflow-x-auto text-xs font-bold text-slate-600">
                    <button
                      type="button"
                      onClick={() => setWalletInfoTab('rules')}
                      className={`flex-1 py-2 px-3 rounded-xl transition-all whitespace-nowrap flex items-center justify-center gap-1.5 ${
                        walletInfoTab === 'rules'
                          ? 'bg-white text-slate-900 shadow-sm font-extrabold'
                          : 'hover:text-slate-900'
                      }`}
                    >
                      <Shield size={14} />
                      <span>Reglas & Acuerdos</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setWalletInfoTab('report')}
                      className={`flex-1 py-2 px-3 rounded-xl transition-all whitespace-nowrap flex items-center justify-center gap-1.5 ${
                        walletInfoTab === 'report'
                          ? 'bg-white text-slate-900 shadow-sm font-extrabold'
                          : 'hover:text-slate-900'
                      }`}
                    >
                      <FileText size={14} />
                      <span>Informe Ejecutivo</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setWalletInfoTab('elements')}
                      className={`flex-1 py-2 px-3 rounded-xl transition-all whitespace-nowrap flex items-center justify-center gap-1.5 ${
                        walletInfoTab === 'elements'
                          ? 'bg-white text-slate-900 shadow-sm font-extrabold'
                          : 'hover:text-slate-900'
                      }`}
                    >
                      <Users size={14} />
                      <span>Elementos & Integrantes</span>
                    </button>
                  </div>

                  {/* PESTAÑA 1: REGLAS & ACUERDOS */}
                  {walletInfoTab === 'rules' && (
                    <div className="p-5 sm:p-6 rounded-2xl bg-indigo-50/50 border border-indigo-100 space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Shield size={16} className="text-indigo-600" />
                          <h4 className="text-xs font-bold text-indigo-950 uppercase tracking-wider">
                            Memoria y Acuerdos de la Grupalidad
                          </h4>
                        </div>
                        {rulesSavedNotice && (
                          <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                            <CheckCircle2 size={13} /> Guardado con éxito
                          </span>
                        )}
                      </div>

                      <form onSubmit={handleSaveWalletRules} className="space-y-4 text-xs">
                        <div>
                          <label className="text-xs font-bold text-slate-700 block mb-1.5">
                            Modelo de Contribución / Aportes:
                          </label>
                          <select
                            value={walletRulesForm.contributionModel}
                            onChange={e => setWalletRulesForm({ ...walletRulesForm, contributionModel: e.target.value })}
                            className="w-full px-3.5 py-2.5 rounded-xl border border-indigo-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                          >
                            <option value="equal">⚖️ Partes Iguales (División equitativa entre todos)</option>
                            <option value="proportional">📊 Proporcional a ingresos / ventas</option>
                            <option value="voluntary">🤝 Voluntario / Libre según necesidad y capacidad</option>
                          </select>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                          <div>
                            <label className="text-xs font-bold text-slate-700 block mb-1.5">
                              Límite de gasto sin consulta:
                            </label>
                            <div className="relative">
                              <span className="absolute left-3 top-2.5 text-slate-400 font-bold">$</span>
                              <input
                                type="number"
                                min="0"
                                step="1000"
                                value={walletRulesForm.expenseApprovalThreshold}
                                onChange={e => setWalletRulesForm({ ...walletRulesForm, expenseApprovalThreshold: parseFloat(e.target.value) || 0 })}
                                className="w-full pl-7 pr-3 py-2.5 rounded-xl border border-indigo-200 text-xs font-bold bg-white"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="text-xs font-bold text-slate-700 block mb-1.5">
                              Fondo de Resguardo (%):
                            </label>
                            <div className="relative">
                              <input
                                type="number"
                                min="0"
                                max="100"
                                value={walletRulesForm.reservePercentage}
                                onChange={e => setWalletRulesForm({ ...walletRulesForm, reservePercentage: parseFloat(e.target.value) || 0 })}
                                className="w-full pl-3.5 pr-7 py-2.5 rounded-xl border border-indigo-200 text-xs font-bold bg-white"
                              />
                              <span className="absolute right-3 top-2.5 text-slate-400 font-bold">%</span>
                            </div>
                          </div>
                        </div>

                        <div>
                          <label className="text-xs font-bold text-slate-700 block mb-1.5">
                            Memoria del Acuerdo Colectivo:
                          </label>
                          <textarea
                            rows={3}
                            value={walletRulesForm.agreementSummary}
                            onChange={e => setWalletRulesForm({ ...walletRulesForm, agreementSummary: e.target.value })}
                            placeholder="Ej: Gastos cotidianos hasta $30.000 son libres. Compras mayores se acuerdan por WhatsApp grupal."
                            className="w-full px-3.5 py-2.5 rounded-xl border border-indigo-200 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 leading-relaxed"
                          />
                        </div>

                        <button
                          type="submit"
                          className="btn w-full py-3 rounded-xl font-bold text-xs bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm flex items-center justify-center gap-2"
                        >
                          <Check size={16} />
                          <span>Guardar Acuerdos de la Billetera</span>
                        </button>
                      </form>
                    </div>
                  )}

                  {/* PESTAÑA 2: INFORME EJECUTIVO */}
                  {walletInfoTab === 'report' && (() => {
                    const report = elementsService.generateWalletReport(currentWallet.id);
                    if (!report) return null;
                    return (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                              Informe Ejecutivo Listo para Enviar
                            </h4>
                            <p className="text-[11px] text-slate-500 mt-0.5">
                              Procesamiento automático de saldos, elementos y reglas grupales.
                            </p>
                          </div>
                        </div>

                        <div className="p-4 sm:p-5 bg-slate-50 rounded-2xl border border-slate-200 font-mono text-xs text-slate-800 whitespace-pre-wrap max-h-72 overflow-y-auto leading-relaxed">
                          {report.whatsAppText}
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            const url = `https://wa.me/?text=${encodeURIComponent(report.whatsAppText)}`;
                            window.open(url, '_blank');
                          }}
                          className="btn w-full py-3.5 rounded-2xl font-bold text-sm bg-emerald-600 hover:bg-emerald-700 text-white shadow-md flex items-center justify-center gap-2 transition-all"
                        >
                          <Share2 size={16} />
                          <span>📲 Compartir Informe por WhatsApp</span>
                        </button>
                      </div>
                    );
                  })()}

                  {/* PESTAÑA 3: ELEMENTOS & INTEGRANTES */}
                  {walletInfoTab === 'elements' && (
                    <div className="space-y-6">
                      {/* Integrantes con Avatar */}
                      <div>
                        <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2.5">
                          Integrantes con Acceso
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {(currentWallet.members && currentWallet.members.length > 0 ? currentWallet.members : ['ramiro', 'agustina', 'cristian']).map((mId) => {
                            const mObj = availableMembers.find(m => m.id === mId) || { name: mId };
                            return (
                              <span 
                                key={mId} 
                                className="px-3.5 py-2 rounded-2xl text-xs font-bold bg-slate-50 text-slate-800 border border-slate-200 flex items-center gap-2 shadow-2xs"
                              >
                                <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-[10px] font-black">
                                  {mObj.name.charAt(0).toUpperCase()}
                                </span>
                                <span>{mObj.name}</span>
                              </span>
                            );
                          })}
                        </div>
                      </div>

                      {/* Listado de Elementos que contiene */}
                      <div>
                        <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2.5">
                          Elementos en esta Billetera ({walletElements.length})
                        </h4>
                        {walletElements.length === 0 ? (
                          <div className="p-4 rounded-2xl bg-slate-50 text-center text-xs text-slate-500 border border-slate-200">
                            No hay elementos asociados todavía a esta billetera.
                          </div>
                        ) : (
                          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                            {walletElements.map(e => {
                              const st = elementsService.getElementStats(e.id);
                              return (
                                <div key={e.id} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between text-xs hover:border-slate-300 transition-all">
                                  <div className="flex items-center gap-3">
                                    <span className="text-xl p-1 bg-white rounded-xl border border-slate-100 shadow-2xs">{e.icon || '📦'}</span>
                                    <div>
                                      <span className="font-bold text-slate-900 block text-xs">{e.name}</span>
                                      <span className="text-[10px] text-slate-500">{e.type === 'bilateral' ? '🤝 Mano a Mano' : e.type === 'shared' ? 'Colectivo' : 'Individual'}</span>
                                    </div>
                                  </div>
                                  <span className="font-black text-slate-900 text-sm">
                                    {safeFormatCurrency(st.currentBalance)}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      {/* Zona de Gestión / Peligro */}
                      <div className="pt-4 border-t border-slate-200 flex flex-col gap-3">
                        <div className="p-3.5 rounded-2xl bg-rose-50/80 border border-rose-200 flex items-start gap-2.5">
                          <Trash2 size={16} className="text-rose-600 mt-0.5 shrink-0" />
                          <div className="text-xs text-rose-900">
                            <span className="font-bold block">Gestión de la Billetera</span>
                            <span className="text-rose-700 text-[11px] leading-tight block mt-0.5">
                              Si eliminas esta billetera, sus elementos se reasignarán automáticamente a la billetera principal para preservar los datos.
                            </span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={handleDeleteCurrentWallet}
                          disabled={wallets.length <= 1}
                          className={`btn py-3 px-4 rounded-full font-bold text-xs flex items-center justify-center gap-2 transition-all ${
                            wallets.length <= 1
                              ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                              : 'bg-white hover:bg-rose-50 text-rose-600 border border-rose-300 shadow-sm'
                          }`}
                          title={wallets.length <= 1 ? "No se puede eliminar la única billetera activa" : "Eliminar esta billetera"}
                        >
                          <Trash2 size={14} />
                          <span>{wallets.length <= 1 ? "Billetera principal requerida (no se puede borrar)" : `Eliminar Billetera "${currentWallet.name}"`}</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 6: CREAR NUEVO HITO TEMPORAL                       */}
      {/* ======================================================== */}
      {showCreateMilestoneModal && selectedElement && (
        <div 
          className="fixed inset-0 z-50 flex items-start sm:items-center justify-center bg-black/60 backdrop-blur-md p-3 sm:p-5 overflow-y-auto py-6 sm:py-8"
          style={{ overflowY: 'auto' }}
          onClick={() => setShowCreateMilestoneModal(false)}
        >
          <div 
            className="bg-white rounded-[32px] w-full max-w-md p-6 sm:p-8 shadow-2xl relative my-auto border border-slate-100"
            style={{ maxHeight: '90vh', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}
            onClick={e => e.stopPropagation()}
          >
            <button 
              type="button"
              onClick={() => setShowCreateMilestoneModal(false)}
              style={{
                position: 'absolute',
                top: '20px',
                right: '20px',
                width: '38px',
                height: '38px',
                borderRadius: '50%',
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                color: '#64748b',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                zIndex: 25,
                transition: 'all 0.15s ease'
              }}
              title="Cerrar ventana"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-3.5 mb-6 pr-12">
              <span className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-700 border border-amber-200 flex items-center justify-center text-3xl shadow-sm shrink-0">
                🎪
              </span>
              <div>
                <span className="text-[11px] uppercase font-bold text-amber-800 tracking-wider block">
                  Micro-contabilidad de Evento
                </span>
                <h3 className="text-xl font-black text-slate-900 leading-tight">
                  Nuevo Hito en {selectedElement.name}
                </h3>
              </div>
            </div>

            <form onSubmit={handleCreateMilestone} className="flex flex-col gap-4 text-xs">
              <div>
                <label className="text-xs font-bold text-slate-700 mb-1.5 block">
                  Nombre o Edición del Hito *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Edición Primavera (18 de Octubre)"
                  value={newMilestoneForm.name}
                  onChange={e => setNewMilestoneForm({ ...newMilestoneForm, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500 bg-slate-50 focus:bg-white transition-all"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 mb-1.5 block">
                  Fondo Semilla / Inversión de Apertura (ARS)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-slate-400 font-bold">$</span>
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    placeholder="0"
                    value={newMilestoneForm.initialSeedFund}
                    onChange={e => setNewMilestoneForm({ ...newMilestoneForm, initialSeedFund: e.target.value })}
                    className="w-full pl-8 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-amber-500 bg-slate-50 focus:bg-white transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 mb-1.5 block">
                  Objetivo o Detalle de Producción
                </label>
                <textarea
                  rows={2}
                  placeholder="Ej: Producción de arepas, compras de maíz y logística de puesto."
                  value={newMilestoneForm.goalDescription}
                  onChange={e => setNewMilestoneForm({ ...newMilestoneForm, goalDescription: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500 bg-slate-50 focus:bg-white transition-all resize-none"
                />
              </div>

              <button
                type="submit"
                className="btn mt-2 py-3 rounded-full font-bold text-xs bg-amber-600 hover:bg-amber-700 text-white shadow-md shadow-amber-200 flex items-center justify-center gap-2 transition-all"
              >
                <Check size={15} />
                <span>Crear Hito Temporal</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 7: CERRAR Y LIQUIDAR HITO TEMPORAL                 */}
      {/* ======================================================== */}
      {closingMilestone && (
        <div 
          className="fixed inset-0 z-50 flex items-start sm:items-center justify-center bg-black/60 backdrop-blur-md p-3 sm:p-5 overflow-y-auto py-6 sm:py-8"
          style={{ overflowY: 'auto' }}
          onClick={() => setClosingMilestone(null)}
        >
          <div 
            className="bg-white rounded-[32px] w-full max-w-md p-6 sm:p-8 shadow-2xl relative my-auto border border-slate-100"
            style={{ maxHeight: '90vh', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}
            onClick={e => e.stopPropagation()}
          >
            <button 
              type="button"
              onClick={() => setClosingMilestone(null)}
              style={{
                position: 'absolute',
                top: '20px',
                right: '20px',
                width: '38px',
                height: '38px',
                borderRadius: '50%',
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                color: '#64748b',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                zIndex: 25,
                transition: 'all 0.15s ease'
              }}
              title="Cerrar ventana"
            >
              <X size={18} />
            </button>

            {(() => {
              const stats = elementsService.getMilestoneStats(closingMilestone.id);
              return (
                <div>
                  <div className="flex items-center gap-3.5 mb-5 pr-12">
                    <span className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center justify-center text-3xl shadow-sm shrink-0">
                      ⚖️
                    </span>
                    <div>
                      <span className="text-[11px] uppercase font-bold text-indigo-800 tracking-wider block">
                        Liquidación de Hito
                      </span>
                      <h3 className="text-xl font-black text-slate-900 leading-tight">
                        {closingMilestone.name}
                      </h3>
                    </div>
                  </div>

                  {/* Resumen contable neto */}
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 mb-4 text-xs space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 font-medium">Total Ingresos:</span>
                      <strong className="text-emerald-700 font-bold">+{safeFormatCurrency(stats.totalIncomes)}</strong>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 font-medium">Total Egresos:</span>
                      <strong className="text-rose-700 font-bold">-{safeFormatCurrency(stats.totalExpenses)}</strong>
                    </div>
                    <div className="pt-2 border-t border-slate-200/80 flex justify-between items-center font-black text-sm">
                      <span className="text-slate-800">Resultado Neto:</span>
                      <span className={stats.netResult >= 0 ? 'text-emerald-600' : 'text-rose-600'}>
                        {stats.netResult >= 0 ? 'Superávit +' : 'Déficit '}{safeFormatCurrency(stats.netResult)}
                      </span>
                    </div>
                  </div>

                  <form onSubmit={handleCloseMilestone} className="flex flex-col gap-4 text-xs">
                    <div>
                      <label className="text-xs font-bold text-slate-700 mb-1.5 block">
                        Conclusión o Informe de Cierre
                      </label>
                      <textarea
                        rows={2}
                        value={closeMilestoneSummary}
                        onChange={e => setCloseMilestoneSummary(e.target.value)}
                        placeholder="Ej: Se completó la edición con superávit asignado al fondo de feria."
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50 focus:bg-white transition-all resize-none"
                      />
                    </div>

                    <button
                      type="submit"
                      className="btn py-3 rounded-full font-bold text-xs bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-200 flex items-center justify-center gap-2 transition-all"
                    >
                      <Check size={15} />
                      <span>Confirmar Cierre y Liquidar</span>
                    </button>
                  </form>
                </div>
              );
            })()}
          </div>
        </div>
      )}

    </div>
  );
}
