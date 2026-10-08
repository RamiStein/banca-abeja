import React, { useState, useMemo } from 'react';
import { 
  User, Plus, Phone, MessageSquare, CheckCircle2, AlertCircle, 
  ArrowUpRight, ArrowDownLeft, ShieldCheck, ExternalLink, Edit3, 
  Trash2, Send, Sparkles, Layers, Users, Wallet, ChevronRight, HelpCircle,
  LogOut
} from 'lucide-react';
import { doc, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';


export default function IndividualPortal({
  members = [],
  currentMemberId = 'ramiro',
  onSelectMember,
  currentUser = null,
  onLogout = null,
  transactions = [],
  onDeleteTx,
  onAddTx,
  onNavigateToCommunity,
  selectedCurrency = 'ARS',
  setSelectedCurrency
}) {
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  const [filterScope, setFilterScope] = useState('todos'); // 'todos' | 'comunitario' | 'individual'
  const [searchTerm, setSearchTerm] = useState('');
  const [showHowToBot, setShowHowToBot] = useState(false);

  // Formulario de Alta / Edición de Miembro
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    role: 'Miembro',
    nodeId: 'hogar',
    adults: 1,
    kids: 0
  });

  // Formulario de Gasto Rápido Personal
  const [quickInput, setQuickInput] = useState('');
  const [quickScope, setQuickScope] = useState('comunitario'); // 'comunitario' | 'individual'
  const [quickFeedback, setQuickFeedback] = useState(null);

  // Miembro activo actual (prioriza el usuario autenticado para asegurar identidad única)
  const currentMember = useMemo(() => {
    if (currentUser) {
      const match = members.find(m => m.id === currentUser.id || m.email === currentUser.email);
      return match || currentUser;
    }
    return members.find(m => m.id === currentMemberId) || members[0] || {
      id: 'ramiro',
      name: 'Ramiro',
      phone: '+54 9 11 2745-2476',
      cleanPhone: '5491127452476',
      role: 'Fundador'
    };
  }, [members, currentMemberId, currentUser]);


  // Transacciones exclusivas del miembro activo
  const memberTransactions = useMemo(() => {
    return transactions.filter(t => {
      const tMember = (t.memberId || t.memberName || '').toLowerCase();
      const cId = (currentMember.id || '').toLowerCase();
      const cName = (currentMember.name || '').toLowerCase();
      return tMember === cId || tMember === cName;
    });
  }, [transactions, currentMember]);

  // Cálculos de métricas personales y balance colectivo
  const metrics = useMemo(() => {
    let paidComunitarioARS = 0;
    let paidIndividualARS = 0;
    let paidUSD = 0;
    let paidABEJA = 0;

    memberTransactions.forEach(t => {
      const curr = t.currency || 'ARS';
      const amount = Number(t.amount) || 0;
      if (curr === 'ARS') {
        if (t.scope === 'comunitario') paidComunitarioARS += amount;
        else paidIndividualARS += amount;
      } else if (curr === 'USD') {
        paidUSD += amount;
      } else if (curr === 'ABEJA') {
        paidABEJA += amount;
      }
    });

    // Cálculo del balance colectivo de toda la colmena en ARS
    let totalComunitarioARSAll = 0;
    transactions.forEach(t => {
      if ((t.currency || 'ARS') === 'ARS' && t.scope === 'comunitario') {
        totalComunitarioARSAll += (Number(t.amount) || 0);
      }
    });

    const activeMemberCount = Math.max(members.length, 1);
    const fairShare = totalComunitarioARSAll / activeMemberCount;
    const netBalance = paidComunitarioARS - fairShare;

    return {
      paidComunitarioARS,
      paidIndividualARS,
      paidUSD,
      paidABEJA,
      totalComunitarioARSAll,
      fairShare,
      netBalance
    };
  }, [memberTransactions, transactions, members]);

  // Transacciones filtradas para la tabla personal
  const filteredTxs = useMemo(() => {
    return memberTransactions.filter(t => {
      if (filterScope !== 'todos' && t.scope !== filterScope) return false;
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchConcept = (t.concept || '').toLowerCase().includes(term);
        const matchCategory = (t.category || '').toLowerCase().includes(term);
        if (!matchConcept && !matchCategory) return false;
      }
      return true;
    });
  }, [memberTransactions, filterScope, searchTerm]);

  // Abrir modal para editar miembro
  const handleOpenEdit = (m) => {
    setEditingMember(m);
    setFormData({
      name: m.name || '',
      phone: m.phone || '',
      role: m.role || 'Miembro',
      nodeId: m.nodeId || 'hogar',
      adults: m.familyUnits?.adults || 1,
      kids: m.familyUnits?.kids || 0
    });
    setShowRegisterModal(true);
  };

  // Abrir modal para nuevo miembro
  const handleOpenNew = () => {
    setEditingMember(null);
    setFormData({
      name: '',
      phone: '+54 9 11 ',
      role: 'Miembro',
      nodeId: 'hogar',
      adults: 1,
      kids: 0
    });
    setShowRegisterModal(true);
  };

  // Guardar alta o edición de miembro
  const handleSaveMember = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.phone.trim()) {
      alert('Por favor completá nombre y número de teléfono.');
      return;
    }

    const cleanPhone = formData.phone.replace(/\D/g, '');
    const id = editingMember ? editingMember.id : formData.name.toLowerCase().trim().replace(/[^a-z0-9]/g, '_');

    const memberPayload = {
      id,
      name: formData.name.trim(),
      phone: formData.phone.trim(),
      cleanPhone,
      role: formData.role,
      nodeId: formData.nodeId,
      familyUnits: {
        adults: parseInt(formData.adults) || 1,
        kids: parseInt(formData.kids) || 0
      },
      updatedAt: Date.now()
    };

    if (!editingMember) {
      memberPayload.createdAt = Date.now();
    }

    try {
      if (db) {
        await setDoc(doc(db, 'banca_abeja_members', id), memberPayload, { merge: true });
      }
      // Actualizar localStorage
      const savedMembers = JSON.parse(localStorage.getItem('matrix_members') || '[]');
      const index = savedMembers.findIndex(m => m.id === id);
      if (index >= 0) {
        savedMembers[index] = { ...savedMembers[index], ...memberPayload };
      } else {
        savedMembers.push(memberPayload);
      }
      localStorage.setItem('matrix_members', JSON.stringify(savedMembers));

      if (onSelectMember) {
        onSelectMember(id);
      }
      setShowRegisterModal(false);
      setEditingMember(null);
    } catch (err) {
      console.error('Error guardando miembro:', err);
      alert('Error guardando miembro: ' + err.message);
    }
  };

  // Procesar gasto rápido personal desde la web
  const handleQuickSubmit = (e) => {
    e.preventDefault();
    if (!quickInput.trim()) return;

    if (onAddTx) {
      const result = onAddTx(quickInput.trim(), currentMember.id, quickScope);
      if (result && result.count > 0) {
        setQuickFeedback({
          text: `¡Anotado! ${result.count} gasto${result.count > 1 ? 's' : ''} registrado${result.count > 1 ? 's' : ''} por $${result.total.toLocaleString('es-AR')}.`,
          type: 'success'
        });
        setQuickInput('');
        setTimeout(() => setQuickFeedback(null), 4000);
      } else {
        setQuickFeedback({
          text: 'No pudimos reconocer el importe. Probá escribir por ejemplo: "30000 en verdulería"',
          type: 'error'
        });
        setTimeout(() => setQuickFeedback(null), 5000);
      }
    }
  };

  return (
    <div className="flex flex-col gap-6" style={{ width: '100%', maxWidth: '1200px', margin: '0 auto' }}>

      {/* 1. Selector de Identidad / Miembro Activo */}
      <div className="card" style={{ background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.12) 0%, rgba(16, 185, 129, 0.08) 100%)', border: '1px solid rgba(99, 102, 241, 0.25)', padding: '1.25rem' }}>
        <div className="flex justify-between items-center flex-wrap gap-4">
          
          <div>
            <div className="flex items-center gap-2 mb-1">
              <User className="text-accent" color="#6366f1" size={20} />
              <span className="font-semibold text-xs tracking-wider" style={{ color: 'var(--accent-color)', textTransform: 'uppercase' }}>
                Portal Individual • Ingreso de Miembro
              </span>
            </div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              Hola, <span style={{ color: '#fff' }}>{currentMember.name}</span> 👋
            </h2>
            <p className="text-secondary mt-0.5" style={{ fontSize: '0.88rem' }}>
              Desde este espacio gestionás tus flujos personales y tu vinculación directa con el Bot de WhatsApp.
            </p>
          </div>

          {/* Perfil de Usuario Autenticado (Identidad Exclusiva y Fija) */}
          <div className="flex items-center gap-2 flex-wrap">
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '6px 14px',
              backgroundColor: '#ffffff',
              borderRadius: '12px',
              border: '1px solid var(--border-color)',
              boxShadow: 'var(--shadow-sm)'
            }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                backgroundColor: 'rgba(99, 102, 241, 0.12)',
                color: '#4f46e5',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: '0.88rem'
              }}>
                {currentMember.name ? currentMember.name.charAt(0).toUpperCase() : '👤'}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '0.86rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.2 }}>
                  {currentMember.name}
                </span>
                <span style={{ fontSize: '0.72rem', color: '#16a34a', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <ShieldCheck size={12} /> Sesión activa • {currentMember.role || 'Miembro'}
                </span>
              </div>
            </div>

            <button
              onClick={handleOpenNew}
              className="btn btn-outline"
              style={{
                fontSize: '0.82rem',
                padding: '6px 12px',
                borderColor: 'rgba(16, 185, 129, 0.4)',
                color: '#10b981',
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                gap: '5px'
              }}
              title="Registrar a una nueva persona de la comunidad y conectar su WhatsApp"
            >
              <Plus size={15} />
              Darse de Alta
            </button>

            {onLogout && (
              <button
                onClick={onLogout}
                className="btn btn-outline"
                style={{
                  fontSize: '0.82rem',
                  padding: '6px 12px',
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  color: '#dc2626',
                  borderColor: '#fecaca',
                  backgroundColor: '#fef2f2'
                }}
                title="Cerrar sesión en esta cuenta"
              >
                <LogOut size={14} />
                Cerrar Sesión
              </button>
            )}
          </div>


        </div>
      </div>

      {/* 2. Tarjeta de Vinculación con WhatsApp Bot */}
      <div className="card" style={{ border: '1px solid rgba(16, 185, 129, 0.35)', backgroundColor: 'rgba(16, 185, 129, 0.05)', padding: '1.25rem' }}>
        <div className="flex justify-between items-start flex-wrap gap-4">
          
          <div className="flex items-start gap-3.5">
            <div style={{ 
              backgroundColor: 'rgba(16, 185, 129, 0.2)', 
              borderRadius: '12px', 
              padding: '10px', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center' 
            }}>
              <MessageSquare color="#10b981" size={26} />
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-bold text-lg" style={{ color: '#fff', margin: 0 }}>
                  Conexión WhatsApp Bot
                </h3>
                <span style={{ 
                  fontSize: '0.75rem', 
                  backgroundColor: 'rgba(16, 185, 129, 0.2)', 
                  color: '#10b981', 
                  border: '1px solid rgba(16, 185, 129, 0.4)',
                  padding: '2px 8px', 
                  borderRadius: '12px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#10b981' }}></span>
                  Vinculado & Activo
                </span>
              </div>

              <div className="flex items-center gap-2 mt-1 flex-wrap text-secondary" style={{ fontSize: '0.88rem' }}>
                <span>Número registrado:</span>
                <strong style={{ color: 'var(--text-primary)', fontFamily: 'monospace', fontSize: '0.95rem' }}>
                  {currentMember.phone || 'Sin número registrado'}
                </strong>
                <button 
                  onClick={() => handleOpenEdit(currentMember)}
                  className="btn btn-outline"
                  style={{ padding: '2px 8px', fontSize: '0.75rem', border: '1px solid rgba(255,255,255,0.15)', color: 'var(--text-secondary)' }}
                >
                  <Edit3 size={12} /> Cambiar
                </button>
              </div>

              <p className="text-secondary mt-2" style={{ fontSize: '0.84rem', lineHeight: '1.4' }}>
                Cualquier mensaje de texto o nota de voz 🎙️ que envíes desde este número al bot (o en grupos comunitarios) se registrará automáticamente como <strong>{currentMember.name}</strong>.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowHowToBot(!showHowToBot)}
              className="btn btn-outline"
              style={{ fontSize: '0.8rem', padding: '6px 12px' }}
            >
              <HelpCircle size={15} />
              {showHowToBot ? 'Ocultar Guía' : '¿Cómo usarlo?'}
            </button>
            <a
              href="https://wa.me/5491127452476?text=saldo"
              target="_blank"
              rel="noopener noreferrer"
              className="btn"
              style={{ backgroundColor: '#10b981', color: '#fff', fontSize: '0.8rem', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '5px' }}
            >
              <ExternalLink size={14} /> Abrir WhatsApp
            </a>
          </div>

        </div>

        {/* Guía desplegable de WhatsApp */}
        {showHowToBot && (
          <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid rgba(16, 185, 129, 0.2)', fontSize: '0.85rem' }}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div style={{ backgroundColor: 'rgba(255,255,255,0.03)', padding: '0.75rem', borderRadius: '8px' }}>
                <strong style={{ color: '#10b981' }}>1. Escribí gastos directos</strong>
                <p className="text-secondary mt-1">
                  <em>"Gasté 25.000 en verdura"</em> o <em>"15 mil de nafta clio y 30.000 de súper"</em>.
                </p>
              </div>
              <div style={{ backgroundColor: 'rgba(255,255,255,0.03)', padding: '0.75rem', borderRadius: '8px' }}>
                <strong style={{ color: '#10b981' }}>2. Mandá audios de voz 🎙️</strong>
                <p className="text-secondary mt-1">
                  Hablá como siempre: <em>"Che, puse 12.000 en la ferretería"</em>. El bot lo transcribe y lo anota.
                </p>
              </div>
              <div style={{ backgroundColor: 'rgba(255,255,255,0.03)', padding: '0.75rem', borderRadius: '8px' }}>
                <strong style={{ color: '#10b981' }}>3. Consultá balances</strong>
                <p className="text-secondary mt-1">
                  Escribí <em>"saldo"</em> o <em>"cuentas"</em> para ver quién debe reponer y quién tiene saldo a favor.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 3. Métricas Clave de la Economía Personal (3 Tarjetas) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* Tarjeta 1: Aportes Comunitarios */}
        <div className="card" style={{ border: '1px solid rgba(99, 102, 241, 0.3)' }}>
          <div className="flex justify-between items-center mb-1">
            <span className="text-secondary text-xs font-semibold uppercase tracking-wider">Aportes a la Colmena</span>
            <Users size={18} color="var(--accent-color)" />
          </div>
          <div className="text-3xl font-bold mt-1" style={{ color: 'var(--accent-color)' }}>
            ${metrics.paidComunitarioARS.toLocaleString('es-AR')}
          </div>
          <p className="text-secondary mt-2 text-xs">
            Total aportado de tu bolsillo para gastos colectivos del nodo.
          </p>
        </div>

        {/* Tarjeta 2: Balance frente a la Colmena */}
        <div className="card" style={{ 
          border: metrics.netBalance >= 0 ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid rgba(239, 68, 68, 0.4)',
          backgroundColor: metrics.netBalance >= 0 ? 'rgba(16, 185, 129, 0.04)' : 'rgba(239, 68, 68, 0.04)'
        }}>
          <div className="flex justify-between items-center mb-1">
            <span className="text-secondary text-xs font-semibold uppercase tracking-wider">Mi Balance Colectivo</span>
            <Wallet size={18} color={metrics.netBalance >= 0 ? '#10b981' : '#ef4444'} />
          </div>
          <div className="text-3xl font-bold mt-1" style={{ color: metrics.netBalance >= 0 ? '#10b981' : '#ef4444' }}>
            {metrics.netBalance >= 0 ? '+' : '-'}${Math.abs(Math.round(metrics.netBalance)).toLocaleString('es-AR')}
          </div>
          <p className="text-secondary mt-2 text-xs flex items-center gap-1">
            {metrics.netBalance >= 0 ? (
              <span className="text-success font-semibold">🟢 Saldo a favor (repusiste más que el promedio)</span>
            ) : (
              <span className="text-danger font-semibold">🔴 Pendiente de aporte para equiparar</span>
            )}
          </p>
        </div>

        {/* Tarjeta 3: Gastos Personales / Individuales */}
        <div className="card" style={{ border: '1px solid var(--border-color)' }}>
          <div className="flex justify-between items-center mb-1">
            <span className="text-secondary text-xs font-semibold uppercase tracking-wider">Gastos Personales (Míos)</span>
            <User size={18} color="var(--warning)" />
          </div>
          <div className="text-3xl font-bold mt-1" style={{ color: 'var(--warning)' }}>
            ${metrics.paidIndividualARS.toLocaleString('es-AR')}
          </div>
          <p className="text-secondary mt-2 text-xs">
            Gastos individuales registrados para tu control privado que no se dividen.
          </p>
        </div>

      </div>

      {/* 4. Carga Rápida de Gasto Personal */}
      <div className="card" style={{ border: '1px solid var(--border-color)' }}>
        <div className="flex justify-between items-center mb-3 flex-wrap gap-2">
          <div>
            <h3 className="font-bold text-base flex items-center gap-2">
              <Sparkles size={18} color="var(--accent-color)" /> Cargar Gasto a Nombre de {currentMember.name}
            </h3>
            <p className="text-secondary text-xs mt-0.5">
              Ingresá el texto tal como lo mandarías por WhatsApp.
            </p>
          </div>

          {/* Selector de Ámbito */}
          <div className="flex items-center gap-1 p-1 rounded-lg" style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}>
            <button
              type="button"
              onClick={() => setQuickScope('comunitario')}
              className="btn"
              style={{
                fontSize: '0.78rem',
                padding: '4px 10px',
                borderRadius: '6px',
                backgroundColor: quickScope === 'comunitario' ? 'var(--accent-color)' : 'transparent',
                color: quickScope === 'comunitario' ? '#fff' : 'var(--text-secondary)',
                border: 'none'
              }}
            >
              👥 Comunitario
            </button>
            <button
              type="button"
              onClick={() => setQuickScope('individual')}
              className="btn"
              style={{
                fontSize: '0.78rem',
                padding: '4px 10px',
                borderRadius: '6px',
                backgroundColor: quickScope === 'individual' ? 'var(--warning)' : 'transparent',
                color: quickScope === 'individual' ? '#000' : 'var(--text-secondary)',
                fontWeight: quickScope === 'individual' ? 600 : 400,
                border: 'none'
              }}
            >
              👤 Solo Mío
            </button>
          </div>
        </div>

        <form onSubmit={handleQuickSubmit} className="flex gap-2 flex-wrap sm:flex-nowrap">
          <input
            type="text"
            className="input"
            style={{ fontSize: '0.9rem', flex: 1 }}
            placeholder="Ej: '25.000 en verdulería' o '15.000 nafta clio y 18.000 súper'"
            value={quickInput}
            onChange={(e) => setQuickInput(e.target.value)}
          />
          <button
            type="submit"
            className="btn btn-primary"
            style={{ fontSize: '0.88rem', padding: '0.6rem 1.25rem', whiteSpace: 'nowrap' }}
          >
            <Send size={15} /> Registrar Gasto
          </button>
        </form>

        {quickFeedback && (
          <div style={{
            marginTop: '0.75rem',
            padding: '8px 12px',
            borderRadius: '8px',
            fontSize: '0.85rem',
            backgroundColor: quickFeedback.type === 'success' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
            color: quickFeedback.type === 'success' ? '#10b981' : '#ef4444',
            border: quickFeedback.type === 'success' ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(239, 68, 68, 0.3)'
          }}>
            {quickFeedback.text}
          </div>
        )}
      </div>

      {/* 5. Historial de Mis Flujos (Exclusivo de este miembro) */}
      <div className="card">
        <div className="flex justify-between items-center mb-4 flex-wrap gap-3">
          <div>
            <h3 className="text-xl font-bold flex items-center gap-2">
              <Wallet color="var(--accent-color)" size={20} /> Mis Flujos de Recursos ({filteredTxs.length})
            </h3>
            <p className="text-secondary text-xs mt-0.5">
              Movimientos registrados por {currentMember.name} (por WhatsApp y Web)
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Filtro Ámbito */}
            <div className="flex items-center gap-1 p-0.5 rounded-lg" style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}>
              <button
                onClick={() => setFilterScope('todos')}
                className="btn"
                style={{
                  fontSize: '0.75rem',
                  padding: '4px 8px',
                  backgroundColor: filterScope === 'todos' ? 'rgba(99, 102, 241, 0.3)' : 'transparent',
                  color: filterScope === 'todos' ? '#fff' : 'var(--text-secondary)',
                  border: 'none',
                  borderRadius: '6px'
                }}
              >
                Todos ({memberTransactions.length})
              </button>
              <button
                onClick={() => setFilterScope('comunitario')}
                className="btn"
                style={{
                  fontSize: '0.75rem',
                  padding: '4px 8px',
                  backgroundColor: filterScope === 'comunitario' ? 'rgba(99, 102, 241, 0.3)' : 'transparent',
                  color: filterScope === 'comunitario' ? '#fff' : 'var(--text-secondary)',
                  border: 'none',
                  borderRadius: '6px'
                }}
              >
                Comunitarios
              </button>
              <button
                onClick={() => setFilterScope('individual')}
                className="btn"
                style={{
                  fontSize: '0.75rem',
                  padding: '4px 8px',
                  backgroundColor: filterScope === 'individual' ? 'rgba(245, 158, 11, 0.3)' : 'transparent',
                  color: filterScope === 'individual' ? 'var(--warning)' : 'var(--text-secondary)',
                  border: 'none',
                  borderRadius: '6px'
                }}
              >
                Individuales
              </button>
            </div>

            {/* Buscador */}
            <input
              type="text"
              className="input"
              style={{ fontSize: '0.8rem', padding: '5px 10px', width: '160px' }}
              placeholder="Buscar concepto..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Tabla Limpia y Espaciosa */}
        {filteredTxs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2.5rem 1rem', color: 'var(--text-secondary)' }}>
            <p className="text-base font-semibold">No hay movimientos registrados en este filtro.</p>
            <p className="text-xs mt-1">Podés cargar tu primer gasto con el cuadro superior o mandando un mensaje por WhatsApp.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                  <th style={{ padding: '10px 12px' }}>FECHA</th>
                  <th style={{ padding: '10px 12px' }}>CONCEPTO & RUBRO</th>
                  <th style={{ padding: '10px 12px' }}>ÁMBITO</th>
                  <th style={{ padding: '10px 12px' }}>ORIGEN</th>
                  <th style={{ padding: '10px 12px', textAlign: 'right' }}>IMPORTE</th>
                  <th style={{ padding: '10px 12px', textAlign: 'center' }}></th>
                </tr>
              </thead>
              <tbody>
                {filteredTxs.map(t => {
                  const isComunitario = t.scope === 'comunitario';
                  const isWhatsApp = (t.channel || '').includes('whatsapp');
                  const currSymbol = t.currency === 'USD' ? 'US$' : t.currency === 'ABEJA' ? '🐝 ' : '$';

                  return (
                    <tr key={t.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                      <td style={{ padding: '12px', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                        {t.date}
                      </td>

                      <td style={{ padding: '12px' }}>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{t.concept}</div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{t.category}</div>
                      </td>

                      <td style={{ padding: '12px' }}>
                        <span style={{
                          fontSize: '0.75rem',
                          padding: '3px 8px',
                          borderRadius: '8px',
                          backgroundColor: isComunitario ? 'rgba(99, 102, 241, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                          color: isComunitario ? '#818cf8' : 'var(--warning)',
                          border: isComunitario ? '1px solid rgba(99, 102, 241, 0.3)' : '1px solid rgba(245, 158, 11, 0.3)'
                        }}>
                          {isComunitario ? 'Comunitario' : 'Individual'}
                        </span>
                      </td>

                      <td style={{ padding: '12px', whiteSpace: 'nowrap' }}>
                        <span style={{
                          fontSize: '0.78rem',
                          color: isWhatsApp ? '#10b981' : 'var(--text-secondary)',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}>
                          {isWhatsApp ? '💬 WhatsApp' : '💻 Web'}
                        </span>
                      </td>

                      <td style={{ padding: '12px', textAlign: 'right', fontWeight: 700, fontSize: '0.95rem' }}>
                        {currSymbol}{Number(t.amount || 0).toLocaleString('es-AR')}
                      </td>

                      <td style={{ padding: '12px', textAlign: 'center' }}>
                        <button
                          onClick={() => onDeleteTx && onDeleteTx(t.id)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#ef4444',
                            cursor: 'pointer',
                            opacity: 0.7,
                            padding: '4px'
                          }}
                          title="Eliminar este movimiento"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 6. Banner de Salto a la Visión Colectiva (La Colmena) */}
      <div 
        className="card" 
        onClick={onNavigateToCommunity}
        style={{
          cursor: 'pointer',
          background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(99, 102, 241, 0.1) 100%)',
          border: '1px solid rgba(245, 158, 11, 0.3)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '1.25rem'
        }}
      >
        <div className="flex items-center gap-3">
          <div style={{ backgroundColor: 'rgba(245, 158, 11, 0.2)', padding: '10px', borderRadius: '12px' }}>
            <Layers color="var(--warning)" size={24} />
          </div>
          <div>
            <h4 className="font-bold text-base" style={{ margin: 0, color: '#fff' }}>
              Ver Matriz Colectiva & Toda la Colmena 🐝
            </h4>
            <p className="text-secondary text-xs mt-0.5">
              Consultá el fondo común global, metas futuras e inversiones y el cruce de balances entre todos los miembros.
            </p>
          </div>
        </div>

        <button 
          className="btn" 
          style={{ backgroundColor: 'var(--warning)', color: '#000', fontWeight: 600, fontSize: '0.85rem' }}
        >
          Ver Colmena <ChevronRight size={16} />
        </button>
      </div>

      {/* MODAL: ALTA O EDICIÓN DE MIEMBRO */}
      {showRegisterModal && (
        <div className="modal-overlay" onClick={() => setShowRegisterModal(false)}>
          <div 
            className="card w-full max-w-md relative" 
            onClick={(e) => e.stopPropagation()}
            style={{ width: '480px', maxWidth: '95%' }}
          >
            <h3 className="text-xl font-bold mb-1 flex items-center gap-2">
              <Phone color="#10b981" size={22} />
              {editingMember ? 'Editar Datos de Miembro' : 'Darse de Alta en Banca Abeja'}
            </h3>
            <p className="text-secondary text-xs mb-4">
              Vinculá tu nombre y celular para que el Bot te reconozca automáticamente por WhatsApp.
            </p>

            <form onSubmit={handleSaveMember} className="flex flex-col gap-3.5">
              <div>
                <label className="text-xs text-secondary mb-1 block">Nombre / Apodo *</label>
                <input
                  type="text"
                  required
                  className="input"
                  placeholder="Ej: Agustina"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div>
                <label className="text-xs text-secondary mb-1 block">Número de WhatsApp (con código de país) *</label>
                <input
                  type="tel"
                  required
                  className="input"
                  placeholder="Ej: +54 9 11 2649-5598"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
                <span className="text-secondary" style={{ fontSize: '0.72rem', marginTop: '2px', display: 'block' }}>
                  El bot de WhatsApp utilizará este número exacto para registrar tus audios y mensajes.
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-secondary mb-1 block">Nodo de Pertenencia</label>
                  <select
                    className="input"
                    value={formData.nodeId}
                    onChange={(e) => setFormData({ ...formData, nodeId: e.target.value })}
                  >
                    <option value="hogar">Comunidad Hogar</option>
                    <option value="vrde">Nodo VRDE</option>
                    <option value="elementales">Nodo Elementales</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs text-secondary mb-1 block">Rol en la Colmena</label>
                  <input
                    type="text"
                    className="input"
                    placeholder="Ej: Miembro, Cocina, etc."
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-secondary mb-1 block">Adultos en familia</label>
                  <input
                    type="number"
                    min="1"
                    className="input"
                    value={formData.adults}
                    onChange={(e) => setFormData({ ...formData, adults: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-xs text-secondary mb-1 block">Niños</label>
                  <input
                    type="number"
                    min="0"
                    className="input"
                    value={formData.kids}
                    onChange={(e) => setFormData({ ...formData, kids: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 mt-3">
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setShowRegisterModal(false)}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn"
                  style={{ backgroundColor: '#10b981', color: '#fff' }}
                >
                  {editingMember ? 'Guardar Cambios' : 'Vincular y Comenzar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
