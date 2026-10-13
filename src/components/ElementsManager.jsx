import React, { useState, useEffect, useMemo } from 'react';
import { 
  Wallet, Plus, Users, User, ArrowUpRight, ArrowDownLeft, 
  TrendingUp, TrendingDown, Eye, EyeOff, ShieldCheck, 
  Car, Sparkles, ChevronRight, X, Check, HelpCircle, 
  AlertCircle, DollarSign, Layers, ArrowRight, Share2, 
  Trash2, RefreshCw
} from 'lucide-react';
import { elementsService, DEFAULT_ELEMENTS } from '../services/elementsService';
import { FOUNDING_MEMBERS } from '../services/authService';

const AVAILABLE_ICONS = [
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

export default function ElementsManager({ currentUser = null, onSelectElement = null }) {
  const [elements, setElements] = useState(() => elementsService.elements || DEFAULT_ELEMENTS);
  const [transactions, setTransactions] = useState(() => elementsService.transactions || []);
  const [mainBalance, setMainBalance] = useState(() => {
    return elementsService.getMainBalance(currentUser?.id || 'ramiro');
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
    type: 'shared', // 'shared' | 'individual'
    icon: '🚗',
    category: 'Movilidad',
    description: '',
    members: ['ramiro', 'agustina', 'cristian'],
    initialDeposit: ''
  });

  // Formulario de acción en elemento
  const [actionForm, setActionForm] = useState({
    amount: '',
    concept: '',
    memberId: currentUser?.id || 'ramiro'
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

  const refreshData = () => {
    setElements([...elementsService.elements]);
    setTransactions([...elementsService.transactions]);
    setMainBalance(elementsService.getMainBalance(currentUser?.id || 'ramiro'));
  };

  // Miembros disponibles para invitar
  const availableMembers = useMemo(() => {
    return FOUNDING_MEMBERS.map(m => ({
      id: m.id,
      name: m.name,
      role: m.role
    }));
  }, []);

  // Elementos filtrados
  const filteredElements = useMemo(() => {
    return elements.filter(elem => {
      if (filterType === 'shared' && elem.type !== 'shared') return false;
      if (filterType === 'individual' && elem.type !== 'individual') return false;
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchName = elem.name.toLowerCase().includes(term);
        const matchCat = (elem.category || '').toLowerCase().includes(term);
        if (!matchName && !matchCat) return false;
      }
      return true;
    });
  }, [elements, filterType, searchTerm]);

  // Totales acumulados
  const metrics = useMemo(() => {
    let sharedFundsTotal = 0;
    let individualFundsTotal = 0;

    elements.forEach(elem => {
      const stats = elementsService.getElementStats(elem.id);
      if (elem.type === 'shared') {
        sharedFundsTotal += Math.max(0, stats.currentBalance);
      } else {
        individualFundsTotal += Math.max(0, stats.currentBalance);
      }
    });

    return {
      sharedFundsTotal,
      individualFundsTotal,
      totalPockets: elements.length
    };
  }, [elements, transactions]);

  // Manejador para abrir modal de creación
  const handleOpenCreate = () => {
    setNewElemForm({
      name: '',
      type: 'shared',
      icon: '🚗',
      category: 'Movilidad',
      description: '',
      members: [currentUser?.id || 'ramiro', 'agustina', 'cristian'],
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

    await elementsService.createElement({
      name: newElemForm.name,
      type: newElemForm.type,
      creatorId: currentUser?.id || 'ramiro',
      creatorName: currentUser?.name || 'Ramiro',
      icon: newElemForm.icon,
      category: newElemForm.category,
      description: newElemForm.description,
      members: newElemForm.type === 'shared' ? newElemForm.members : [currentUser?.id || 'ramiro'],
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
      await elementsService.addExpenseToElement({
        elementId: elem.id,
        memberId: memberObj.id,
        memberName: memberObj.name,
        amount: amountNum,
        concept: actionForm.concept || `Necesidad / Gasto de ${elem.name}`
      });
    }

    refreshData();
    setActionModal(null);
    setActionForm({ amount: '', concept: '', memberId: currentUser?.id || 'ramiro' });
  };

  // Recargar cuenta principal
  const handleTopUpMainAccount = async (e) => {
    e.preventDefault();
    const amt = parseFloat(topUpAmount) || 0;
    if (amt > 0) {
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
    <div className="flex flex-col gap-6 w-full max-w-5xl mx-auto pb-12">

      {/* ======================================================== */}
      {/* 1. CUENTA PRINCIPAL DEL USUARIO (HERO CARD ESTILO FINTECH) */}
      {/* ======================================================== */}
      <div 
        className="rounded-3xl p-6 sm:p-8 text-white relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 40%, #4338ca 100%)',
          boxShadow: '0 12px 30px -6px rgba(49, 46, 129, 0.35)'
        }}
      >
        {/* Adorno visual sutil de fondo */}
        <div 
          className="absolute -right-12 -top-12 w-64 h-64 rounded-full opacity-10 pointer-events-none"
          style={{ background: 'radial-gradient(circle, #818cf8 0%, transparent 70%)' }}
        />

        <div className="relative z-10 flex flex-col gap-5">
          {/* Fila superior: Título de cuenta & Ojo para ocultar saldo */}
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-full bg-indigo-500/30 flex items-center justify-center text-sm">
                🐝
              </span>
              <span className="text-sm font-medium tracking-wide text-indigo-200">
                Cuenta Principal • {currentUser?.name || 'Ramiro'}
              </span>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/30">
                Activa
              </span>
            </div>

            <button
              onClick={() => setShowBalance(!showBalance)}
              className="p-1.5 rounded-full hover:bg-white/10 text-indigo-200 hover:text-white transition-colors"
              title={showBalance ? "Ocultar saldo" : "Mostrar saldo"}
            >
              {showBalance ? <Eye size={18} /> : <EyeOff size={18} />}
            </button>
          </div>

          {/* Saldo Principal Destacado */}
          <div>
            <div className="text-xs uppercase tracking-wider text-indigo-200 font-semibold mb-1">
              Saldo Total Disponible
            </div>
            <div className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight flex items-baseline gap-2">
              <span>{showBalance ? `$${mainBalance.toLocaleString('es-AR', { minimumFractionDigits: 2 })}` : '••••••••'}</span>
              <span className="text-base sm:text-lg font-medium text-indigo-300">ARS</span>
            </div>
            <p className="text-xs text-indigo-200/80 mt-1">
              Monto base desde el cual fondeás tus elementos individuales y comunitarios.
            </p>
          </div>

          {/* Botones de Acción Rápida (Pills modernas y redondeadas) */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={handleOpenCreate}
              className="btn flex items-center gap-2 px-5 py-3 rounded-full font-bold text-sm bg-white text-indigo-900 hover:bg-indigo-50 shadow-md hover:shadow-lg transition-all transform active:scale-95"
            >
              <Plus size={18} className="text-indigo-600" />
              <span>Crear Elemento</span>
            </button>

            <button
              onClick={() => setShowTopUpModal(true)}
              className="btn flex items-center gap-2 px-4 py-3 rounded-full font-semibold text-sm bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-all backdrop-blur-sm"
            >
              <ArrowDownLeft size={17} className="text-emerald-400" />
              <span>Ingresar Dinero</span>
            </button>

            <div className="hidden sm:flex items-center gap-4 ml-auto text-xs text-indigo-200">
              <div className="flex items-center gap-1.5">
                <Users size={14} className="text-amber-400" />
                <span>En Compartidos: <strong>${metrics.sharedFundsTotal.toLocaleString('es-AR')}</strong></span>
              </div>
              <div className="flex items-center gap-1.5">
                <User size={14} className="text-emerald-400" />
                <span>En Individuales: <strong>${metrics.individualFundsTotal.toLocaleString('es-AR')}</strong></span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 2. SECCIÓN: TUS ELEMENTOS A GESTIONAR                    */}
      {/* ======================================================== */}
      <div className="flex flex-col gap-4">
        {/* Cabecera de Sección & Filtros Estilo Pill */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-800 flex items-center gap-2">
              <span>Elementos & Bolsillos</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-200 text-slate-700 font-bold">
                {filteredElements.length}
              </span>
            </h2>
            <p className="text-xs text-slate-500">
              Cada elemento gestiona sus propios ingresos, egresos y depósitos compartidos.
            </p>
          </div>

          {/* Segmented Control / Filtros Pill */}
          <div className="inline-flex p-1 bg-slate-200/70 rounded-full border border-slate-300/60 self-start sm:self-auto">
            <button
              onClick={() => setFilterType('all')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                filterType === 'all' 
                  ? 'bg-white text-slate-900 shadow-sm' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Todos ({elements.length})
            </button>
            <button
              onClick={() => setFilterType('shared')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all ${
                filterType === 'shared' 
                  ? 'bg-white text-indigo-700 shadow-sm' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Users size={13} />
              <span>Compartidos ({elements.filter(e => e.type === 'shared').length})</span>
            </button>
            <button
              onClick={() => setFilterType('individual')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all ${
                filterType === 'individual' 
                  ? 'bg-white text-emerald-700 shadow-sm' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <User size={13} />
              <span>Individuales ({elements.filter(e => e.type === 'individual').length})</span>
            </button>
          </div>
        </div>

        {/* ======================================================== */}
        {/* GRID DE ELEMENTOS (TARJETAS MODERNAS, REDONDEADAS)      */}
        {/* ======================================================== */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredElements.map((elem) => {
            const stats = elementsService.getElementStats(elem.id);
            const isShared = elem.type === 'shared';

            return (
              <div 
                key={elem.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between gap-4 relative group"
              >
                {/* Cabecera de la Tarjeta */}
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-3">
                      <span className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-2xl shadow-sm">
                        {elem.icon || '📦'}
                      </span>
                      <div>
                        <h3 className="text-lg font-bold text-slate-900 leading-tight">
                          {elem.name}
                        </h3>
                        <span className="text-xs text-slate-500 font-medium">
                          {elem.category || 'General'} • Creado por {elem.creatorName}
                        </span>
                      </div>
                    </div>

                    {/* Badge de tipo de gestión */}
                    <span className={`text-[11px] px-2.5 py-1 rounded-full font-bold flex items-center gap-1 ${
                      isShared 
                        ? 'bg-amber-50 text-amber-800 border border-amber-200' 
                        : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    }`}>
                      {isShared ? <Users size={12} /> : <User size={12} />}
                      {isShared ? `Compartido (${elem.members?.length || 1})` : 'Individual'}
                    </span>
                  </div>

                  {elem.description && (
                    <p className="text-xs text-slate-600 line-clamp-2 mt-1">
                      {elem.description}
                    </p>
                  )}
                </div>

                {/* Saldo y Flujos del Elemento */}
                <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                  <div className="flex items-baseline justify-between mb-1.5">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Fondo Disponible
                    </span>
                    <span className={`text-xl font-extrabold ${stats.currentBalance >= 0 ? 'text-slate-900' : 'text-rose-600'}`}>
                      ${stats.currentBalance.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  {/* Resumen de Flujos: Ingresos/Depósitos vs Gastos */}
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200/60 text-xs">
                    <div className="flex items-center gap-1.5 text-emerald-700 font-medium">
                      <TrendingUp size={14} className="text-emerald-500" />
                      <span>Ingresos/Depósitos:</span>
                      <strong className="ml-auto">${(stats.totalIncome + stats.totalDeposits).toLocaleString('es-AR')}</strong>
                    </div>
                    <div className="flex items-center gap-1.5 text-rose-700 font-medium">
                      <TrendingDown size={14} className="text-rose-500" />
                      <span>Gastos/Egresos:</span>
                      <strong className="ml-auto">${stats.totalExpense.toLocaleString('es-AR')}</strong>
                    </div>
                  </div>
                </div>

                {/* Integrantes del Elemento (si es compartido) */}
                {isShared && elem.members && elem.members.length > 0 && (
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span className="font-medium">Integrantes:</span>
                    <div className="flex items-center gap-1">
                      {elem.members.map((mId) => {
                        const mObj = availableMembers.find(m => m.id === mId) || { name: mId };
                        const contributed = stats.memberContributions[mId] || 0;
                        return (
                          <span 
                            key={mId}
                            className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-medium text-[11px] border border-slate-200"
                            title={`Aportó: $${contributed.toLocaleString('es-AR')}`}
                          >
                            {mObj.name} {contributed > 0 && `($${Math.round(contributed / 1000)}k)`}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Botones de Acción del Elemento (Redondeados, estilo App Móvil) */}
                <div className="grid grid-cols-3 gap-2 pt-1">
                  {/* Botón Depositar / Aportar */}
                  <button
                    onClick={() => {
                      setActionModal({ type: 'deposit', element: elem });
                      setActionForm({ amount: '', concept: `Aporte para ${elem.name}`, memberId: currentUser?.id || 'ramiro' });
                    }}
                    className="btn px-2 py-2 rounded-xl text-xs font-bold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 flex items-center justify-center gap-1 transition-colors"
                    title="Depositar dinero en este elemento"
                  >
                    <ArrowDownLeft size={14} />
                    <span>Depositar</span>
                  </button>

                  {/* Botón Egreso / Necesidad económica */}
                  <button
                    onClick={() => {
                      setActionModal({ type: 'expense', element: elem });
                      setActionForm({ amount: '', concept: `Gasto de ${elem.name}`, memberId: currentUser?.id || 'ramiro' });
                    }}
                    className="btn px-2 py-2 rounded-xl text-xs font-bold bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 flex items-center justify-center gap-1 transition-colors"
                    title="Registrar un gasto o necesidad económica"
                  >
                    <ArrowUpRight size={14} />
                    <span>- Gasto</span>
                  </button>

                  {/* Botón Detalle */}
                  <button
                    onClick={() => setSelectedElement(elem)}
                    className="btn px-2 py-2 rounded-xl text-xs font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200 flex items-center justify-center gap-1 transition-colors"
                    title="Ver detalle completo, historial y aportes"
                  >
                    <span>Detalle</span>
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {filteredElements.length === 0 && (
          <div className="p-8 text-center bg-white rounded-2xl border border-dashed border-slate-300">
            <span className="text-4xl mb-2 block">🔍</span>
            <h4 className="font-bold text-slate-800">No hay elementos que coincidan</h4>
            <p className="text-xs text-slate-500 mt-1 mb-4">
              Podés crear uno nuevo para empezar a gestionar ingresos y egresos.
            </p>
            <button
              onClick={handleOpenCreate}
              className="btn px-4 py-2 rounded-full font-bold text-xs bg-indigo-600 text-white hover:bg-indigo-700"
            >
              + Crear Elemento
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
              onClick={() => setShowCreateModal(false)}
              className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <X size={20} />
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

            {/* PASO 1: SELECCIÓN DE TIPO (INDIVIDUAL VS COMPARTIDO) */}
            {createStep === 1 && (
              <div className="flex flex-col gap-4">
                {/* Opción Compartida (Recomendada para la Colmena) */}
                <div
                  onClick={() => setNewElemForm(prev => ({ ...prev, type: 'shared' }))}
                  className={`p-5 rounded-2xl border-2 cursor-pointer transition-all flex items-start gap-4 ${
                    newElemForm.type === 'shared'
                      ? 'border-indigo-600 bg-indigo-50/60 shadow-sm'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <span className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center text-xl shadow-md shrink-0">
                    <Users size={24} />
                  </span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-slate-900 text-base">
                        Gestión Compartida / Comunitaria
                      </h4>
                      {newElemForm.type === 'shared' && (
                        <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs">
                          <Check size={13} />
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-600 mt-1">
                      Ideal para vehículos como el <strong>Clio</strong>, compras de <strong>Comida</strong>, insumos de huerta o gastos de la colmena.
                    </p>
                    <ul className="text-[11px] text-slate-500 mt-2 space-y-1">
                      <li>• Varios integrantes pueden depositar dinero en el elemento.</li>
                      <li>• Se registran egresos (combustible, service, compras).</li>
                      <li>• Se pueden recibir reintegros o excedentes.</li>
                    </ul>
                  </div>
                </div>

                {/* Opción Individual */}
                <div
                  onClick={() => setNewElemForm(prev => ({ ...prev, type: 'individual' }))}
                  className={`p-5 rounded-2xl border-2 cursor-pointer transition-all flex items-start gap-4 ${
                    newElemForm.type === 'individual'
                      ? 'border-emerald-600 bg-emerald-50/60 shadow-sm'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <span className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center text-xl shadow-md shrink-0">
                    <User size={24} />
                  </span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-slate-900 text-base">
                        Gestión Individual
                      </h4>
                      {newElemForm.type === 'individual' && (
                        <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs">
                          <Check size={13} />
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-600 mt-1">
                      Exclusivo para vos ({currentUser?.name || 'Ramiro'}). Controlá tus compras personales, ahorros o proyectos propios.
                    </p>
                    <ul className="text-[11px] text-slate-500 mt-2 space-y-1">
                      <li>• Solo vos ves y operás este elemento.</li>
                      <li>• No se comparte con el resto de la colmena.</li>
                    </ul>
                  </div>
                </div>

                {/* Botón Siguiente */}
                <button
                  type="button"
                  onClick={() => setCreateStep(2)}
                  className="btn mt-2 py-3.5 rounded-full font-bold text-sm bg-indigo-600 text-white hover:bg-indigo-700 flex items-center justify-center gap-2 shadow-lg"
                >
                  <span>Continuar al Paso 2</span>
                  <ArrowRight size={16} />
                </button>
              </div>
            )}

            {/* PASO 2: FORMULARIO DE INFORMACIÓN DEL ELEMENTO */}
            {createStep === 2 && (
              <form onSubmit={handleSaveElement} className="flex flex-col gap-4">
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
                    Saldo disponible en tu cuenta: ${mainBalance.toLocaleString('es-AR')}
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
              onClick={() => setActionModal(null)}
              className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <X size={20} />
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
                    actionModal.type === 'expense' ? 'Ej: Nafta Infinia YPF' :
                    actionModal.type === 'income' ? 'Ej: Cobro de viaje / flete' : 'Ej: Reintegro'
                  }
                  value={actionForm.concept}
                  onChange={e => setActionForm({ ...actionForm, concept: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs"
                />
              </div>

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
              onClick={() => setSelectedElement(null)}
              className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <X size={20} />
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
                  <span className={`text-[11px] px-2 py-0.5 rounded-full font-bold ${
                    selectedElement.type === 'shared' 
                      ? 'bg-amber-100 text-amber-800' 
                      : 'bg-emerald-100 text-emerald-800'
                  }`}>
                    {selectedElement.type === 'shared' ? 'Compartido' : 'Individual'}
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
                      ${stats.currentBalance.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                    </div>
                    <div className="grid grid-cols-2 gap-3 mt-3 pt-3 border-t border-slate-200 text-xs">
                      <div>
                        <span className="text-slate-500 block">Total Ingresos / Depósitos:</span>
                        <strong className="text-emerald-700 text-sm">
                          +${(stats.totalIncome + stats.totalDeposits).toLocaleString('es-AR')}
                        </strong>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Total Egresos / Gastos:</span>
                        <strong className="text-rose-700 text-sm">
                          -${stats.totalExpense.toLocaleString('es-AR')}
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

                  {/* Aportes por Integrante */}
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
                                ${contributed.toLocaleString('es-AR')}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Historial de Movimientos de este Elemento */}
                  <div>
                    <h4 className="text-xs font-bold text-slate-700 mb-2 uppercase tracking-wider">
                      Movimientos de {selectedElement.name} ({stats.recentTxs.length})
                    </h4>
                    {stats.recentTxs.length > 0 ? (
                      <div className="space-y-1.5 max-h-48 overflow-y-auto">
                        {stats.recentTxs.map(tx => (
                          <div key={tx.id} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                            <div>
                              <div className="font-semibold text-slate-900">{tx.concept}</div>
                              <span className="text-[10px] text-slate-500">
                                {tx.date} • {tx.memberName} • {tx.type === 'deposit' ? 'Depósito' : tx.type === 'expense' ? 'Egreso' : 'Ingreso'}
                              </span>
                            </div>
                            <span className={`font-bold ${tx.type === 'expense' ? 'text-rose-600' : 'text-emerald-600'}`}>
                              {tx.type === 'expense' ? '-' : '+'}${tx.amount.toLocaleString('es-AR')}
                            </span>
                          </div>
                        ))}
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
              onClick={() => setShowTopUpModal(false)}
              className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <X size={20} />
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
