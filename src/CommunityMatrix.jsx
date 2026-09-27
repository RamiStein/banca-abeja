import React, { useState, useEffect } from 'react';
import { 
  Users, Wallet, Globe, ArrowUpRight, ArrowDownLeft, Plus, 
  Sparkles, MessageSquare, Send, CheckCircle2, TrendingUp, 
  DollarSign, Coins, Target, Calendar, ChevronRight, Filter, 
  ShieldCheck, Share2, Layers, HeartHandshake, Eye, EyeOff
} from 'lucide-react';

export default function CommunityMatrix() {
  // 1. Matriz de Nodos en la Red "En Conjunto"
  const defaultNodes = [
    { id: 'hogar', name: 'Comunidad Hogar', type: 'Convivencia & Familia', desc: 'Espacio de vida compartida, despensa y movilidad' },
    { id: 'vrde', name: 'Nodo VRDE', type: 'Red de Alimentos & Cocina', desc: 'Abastecimiento agroecológico, canastas y delivery' },
    { id: 'elementales', name: 'Nodo Elementales', type: 'Tierra & Bio-hábitat', desc: 'Huerta comunitaria, biopiscinas y mantenimiento de la tierra' }
  ];

  const [nodes, setNodes] = useState(() => {
    const saved = localStorage.getItem('matrix_nodes');
    return saved ? JSON.parse(saved) : defaultNodes;
  });

  const [activeNodeId, setActiveNodeId] = useState('hogar');

  // 2. Miembros / Familias de la Colmena
  const defaultMembers = [
    { id: 'ramiro', name: 'Ramiro', familyUnits: { adults: 1, kids: 1 }, phone: '+54911...' },
    { id: 'cristian', name: 'Cristian', familyUnits: { adults: 1, kids: 1 }, phone: '+54911...' },
    { id: 'agustina', name: 'Agustina', familyUnits: { adults: 1, kids: 0 }, phone: '+54911...' }
  ];

  const [members, setMembers] = useState(() => {
    const saved = localStorage.getItem('matrix_members');
    return saved ? JSON.parse(saved) : defaultMembers;
  });

  // 3. Moneda Activa para Visualización (ARS, USD, ABEJA)
  const [selectedCurrency, setSelectedCurrency] = useState('ARS'); // 'ARS' | 'USD' | 'ABEJA'

  // 4. Movimientos / Gastos (Individuales y Comunitarios)
  const defaultTransactions = [
    {
      id: 'tx-1',
      date: new Date().toLocaleDateString('es-AR'),
      memberId: 'cristian',
      concept: 'Verdulería agroecológica semana',
      scope: 'comunitario', // 'comunitario' | 'individual'
      category: 'Despensa & Alimentos',
      currency: 'ARS',
      amount: 32000,
      channel: 'whatsapp'
    },
    {
      id: 'tx-2',
      date: new Date().toLocaleDateString('es-AR'),
      memberId: 'ramiro',
      concept: 'Repuesto bomba de agua huerta',
      scope: 'comunitario',
      category: 'Hábitat & Infraestructura',
      currency: 'ARS',
      amount: 45000,
      channel: 'web'
    },
    {
      id: 'tx-3',
      date: new Date().toLocaleDateString('es-AR'),
      memberId: 'agustina',
      concept: 'Internet satelital Starlink mensual',
      scope: 'comunitario',
      category: 'Servicios',
      currency: 'USD',
      amount: 45,
      channel: 'whatsapp'
    },
    {
      id: 'tx-4',
      date: new Date().toLocaleDateString('es-AR'),
      memberId: 'ramiro',
      concept: '4 Horas trabajo bio-piscina y huerta',
      scope: 'comunitario',
      category: 'Aporte de Labor',
      currency: 'ABEJA',
      amount: 4,
      channel: 'web'
    },
    {
      id: 'tx-5',
      date: new Date().toLocaleDateString('es-AR'),
      memberId: 'cristian',
      concept: 'Compra personal libros infantiles',
      scope: 'individual',
      category: 'Personal / Familia',
      currency: 'ARS',
      amount: 18000,
      channel: 'whatsapp'
    }
  ];

  const [transactions, setTransactions] = useState(() => {
    const saved = localStorage.getItem('matrix_transactions');
    return saved ? JSON.parse(saved) : defaultTransactions;
  });

  // 5. Inversiones Previstas & Gastos Futuros
  const defaultProjects = [
    {
      id: 'inv-1',
      title: 'Compra Mayorista de Granos & Despensa VRDE',
      category: 'Alimentos',
      currency: 'ARS',
      targetAmount: 180000,
      collectedAmount: 120000,
      targetDate: '15 de Octubre',
      status: 'active'
    },
    {
      id: 'inv-2',
      title: 'Sistema de Riego Solar para Huerta Elementales',
      category: 'Hábitat & Tierra',
      currency: 'USD',
      targetAmount: 350,
      collectedAmount: 200,
      targetDate: 'Noviembre',
      status: 'active'
    },
    {
      id: 'inv-3',
      title: 'Fondo Reparaciones Vehiculares (Clio / Etios)',
      category: 'Movilidad',
      currency: 'ARS',
      targetAmount: 300000,
      collectedAmount: 240000,
      targetDate: 'Diciembre',
      status: 'active'
    }
  ];

  const [projects, setProjects] = useState(() => {
    const saved = localStorage.getItem('matrix_future_projects');
    return saved ? JSON.parse(saved) : defaultProjects;
  });

  // 6. Estado de Formularios y Simulador de WhatsApp
  const [whatsappInput, setWhatsappInput] = useState('');
  const [whatsappSender, setWhatsappSender] = useState('ramiro');
  const [showNewTxModal, setShowNewTxModal] = useState(false);
  const [showNewGoalModal, setShowNewGoalModal] = useState(false);
  const [filterScope, setFilterScope] = useState('todos'); // 'todos' | 'comunitario' | 'individual'
  const [filterMember, setFilterMember] = useState('todos');

  // Formulario de nueva transacción manual
  const [formTx, setFormTx] = useState({
    memberId: 'ramiro',
    concept: '',
    amount: '',
    currency: 'ARS',
    scope: 'comunitario',
    category: 'Despensa & Alimentos'
  });

  // Formulario de nueva inversión futura
  const [formGoal, setFormGoal] = useState({
    title: '',
    category: 'Despensa',
    currency: 'ARS',
    targetAmount: '',
    targetDate: ''
  });

  // Persistencia
  useEffect(() => {
    localStorage.setItem('matrix_nodes', JSON.stringify(nodes));
  }, [nodes]);

  useEffect(() => {
    localStorage.setItem('matrix_members', JSON.stringify(members));
  }, [members]);

  useEffect(() => {
    localStorage.setItem('matrix_transactions', JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem('matrix_future_projects', JSON.stringify(projects));
  }, [projects]);

  // Cálculos de Totales por Moneda
  const totalsByCurrency = {
    ARS: { totalComunitario: 0, totalIndividual: 0 },
    USD: { totalComunitario: 0, totalIndividual: 0 },
    ABEJA: { totalComunitario: 0, totalIndividual: 0 }
  };

  transactions.forEach(t => {
    const curr = t.currency || 'ARS';
    if (!totalsByCurrency[curr]) totalsByCurrency[curr] = { totalComunitario: 0, totalIndividual: 0 };
    if (t.scope === 'comunitario') {
      totalsByCurrency[curr].totalComunitario += t.amount;
    } else {
      totalsByCurrency[curr].totalIndividual += t.amount;
    }
  });

  // Balance por Miembro en la moneda seleccionada
  const memberBalances = members.map(m => {
    const userTxs = transactions.filter(t => t.memberId === m.id && t.currency === selectedCurrency);
    const paidComunitario = userTxs.filter(t => t.scope === 'comunitario').reduce((acc, t) => acc + t.amount, 0);
    const paidIndividual = userTxs.filter(t => t.scope === 'individual').reduce((acc, t) => acc + t.amount, 0);
    
    // Lo que le corresponde aportar del total comunitario (división simple o por unidades)
    const totalComunitarioCurr = totalsByCurrency[selectedCurrency]?.totalComunitario || 0;
    const fairShare = members.length > 0 ? totalComunitarioCurr / members.length : 0;
    const netBalance = paidComunitario - fairShare; // Positivo = adelantó plata, Negativo = debe aportar

    return {
      ...m,
      paidComunitario,
      paidIndividual,
      fairShare,
      netBalance
    };
  });

  // Manejador del Simulador de WhatsApp
  const handleSimulateWhatsApp = (e) => {
    e.preventDefault();
    if (!whatsappInput.trim()) return;

    const text = whatsappInput.toLowerCase();
    let detectedCurrency = 'ARS';
    if (text.includes('usd') || text.includes('dolar') || text.includes('dólar') || text.includes('u$s')) {
      detectedCurrency = 'USD';
    } else if (text.includes('abeja') || text.includes('hora') || text.includes('semilla')) {
      detectedCurrency = 'ABEJA';
    }

    // Extraer número
    const matchNumber = text.match(/\d+([.,]\d+)?/);
    const detectedAmount = matchNumber ? parseFloat(matchNumber[0].replace(',', '.')) : 0;

    if (!detectedAmount) {
      alert("Por favor incluye un importe numérico en el mensaje (ej: 'Gasté 15000 en verdura')");
      return;
    }

    let detectedScope = 'comunitario';
    if (text.includes('personal') || text.includes('propio') || text.includes('mío') || text.includes('mio')) {
      detectedScope = 'individual';
    }

    let detectedCategory = 'Despensa & Compras';
    if (text.includes('nafta') || text.includes('auto') || text.includes('clio') || text.includes('etios')) {
      detectedCategory = 'Movilidad';
    } else if (text.includes('luz') || text.includes('gas') || text.includes('internet') || text.includes('starlink')) {
      detectedCategory = 'Servicios';
    } else if (text.includes('huerta') || text.includes('tierra') || text.includes('bomba') || text.includes('planta')) {
      detectedCategory = 'Hábitat & Tierra';
    }

    const newTx = {
      id: `tx-wa-${Date.now()}`,
      date: new Date().toLocaleDateString('es-AR'),
      memberId: whatsappSender,
      concept: whatsappInput.trim(),
      scope: detectedScope,
      category: detectedCategory,
      currency: detectedCurrency,
      amount: detectedAmount,
      channel: 'whatsapp'
    };

    setTransactions([newTx, ...transactions]);
    setWhatsappInput('');
  };

  // Carga manual de gasto
  const handleCreateTx = (e) => {
    e.preventDefault();
    if (!formTx.concept || !formTx.amount) return;

    const newTx = {
      id: `tx-man-${Date.now()}`,
      date: new Date().toLocaleDateString('es-AR'),
      memberId: formTx.memberId,
      concept: formTx.concept.trim(),
      scope: formTx.scope,
      category: formTx.category,
      currency: formTx.currency,
      amount: parseFloat(formTx.amount) || 0,
      channel: 'web'
    };

    setTransactions([newTx, ...transactions]);
    setShowNewTxModal(false);
    setFormTx({ ...formTx, concept: '', amount: '' });
  };

  // Carga de inversión futura
  const handleCreateGoal = (e) => {
    e.preventDefault();
    if (!formGoal.title || !formGoal.targetAmount) return;

    const newGoal = {
      id: `inv-${Date.now()}`,
      title: formGoal.title.trim(),
      category: formGoal.category,
      currency: formGoal.currency,
      targetAmount: parseFloat(formGoal.targetAmount) || 0,
      collectedAmount: 0,
      targetDate: formGoal.targetDate || 'A definir',
      status: 'active'
    };

    setProjects([newGoal, ...projects]);
    setShowNewGoalModal(false);
    setFormGoal({ title: '', category: 'Despensa', currency: 'ARS', targetAmount: '', targetDate: '' });
  };

  const activeNode = nodes.find(n => n.id === activeNodeId) || nodes[0];

  const filteredTransactions = transactions.filter(t => {
    if (filterScope !== 'todos' && t.scope !== filterScope) return false;
    if (filterMember !== 'todos' && t.memberId !== filterMember) return false;
    return true;
  });

  const getCurrencySymbol = (curr) => {
    if (curr === 'USD') return 'US$';
    if (curr === 'ABEJA') return '🐝';
    return '$';
  };

  return (
    <div className="flex flex-col gap-6">

      {/* 1. Header de la Matriz En Conjunto y Selector de Nodos */}
      <div className="card" style={{ background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(16, 185, 129, 0.1) 100%)', border: '1px solid rgba(99, 102, 241, 0.3)' }}>
        <div className="flex justify-between items-center flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Layers className="text-accent" color="#6366f1" size={24} />
              <span className="font-semibold text-xs tracking-wider" style={{ color: 'var(--accent-color)', textTransform: 'uppercase' }}>
                Matriz En Conjunto • Red Comunitaria
              </span>
            </div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              Banca Abeja <span style={{ fontSize: '0.85rem', padding: '2px 10px', backgroundColor: 'rgba(245, 158, 11, 0.2)', color: 'var(--warning)', borderRadius: '12px' }}>Economía de la Colmena</span>
            </h2>
            <p className="text-secondary mt-1" style={{ fontSize: '0.9rem' }}>
              Nodo Activo: <strong style={{ color: 'var(--text-primary)' }}>{activeNode.name}</strong> — {activeNode.desc}
            </p>
          </div>

          {/* Selector de Nodos */}
          <div className="flex gap-2 flex-wrap">
            {nodes.map(n => (
              <button
                key={n.id}
                onClick={() => setActiveNodeId(n.id)}
                className="btn"
                style={{
                  fontSize: '0.85rem',
                  padding: '0.5rem 0.9rem',
                  backgroundColor: activeNodeId === n.id ? 'var(--accent-color)' : 'rgba(255,255,255,0.05)',
                  color: activeNodeId === n.id ? '#fff' : 'var(--text-secondary)',
                  border: activeNodeId === n.id ? '1px solid var(--accent-color)' : '1px solid var(--border-color)',
                  borderRadius: '10px'
                }}
              >
                {n.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 2. Barra de Multimoneda y Resumen Global */}
      <div className="flex justify-between items-center flex-wrap gap-4">
        {/* Selector de Moneda */}
        <div style={{ display: 'flex', gap: '0.5rem', backgroundColor: 'rgba(0,0,0,0.3)', padding: '4px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
          <button
            onClick={() => setSelectedCurrency('ARS')}
            className="btn"
            style={{
              padding: '6px 14px', fontSize: '0.85rem', borderRadius: '8px',
              backgroundColor: selectedCurrency === 'ARS' ? 'rgba(99, 102, 241, 0.25)' : 'transparent',
              color: selectedCurrency === 'ARS' ? '#fff' : 'var(--text-secondary)',
              border: selectedCurrency === 'ARS' ? '1px solid var(--accent-color)' : 'none'
            }}
          >
            🇦🇷 Pesos ($)
          </button>
          <button
            onClick={() => setSelectedCurrency('USD')}
            className="btn"
            style={{
              padding: '6px 14px', fontSize: '0.85rem', borderRadius: '8px',
              backgroundColor: selectedCurrency === 'USD' ? 'rgba(16, 185, 129, 0.25)' : 'transparent',
              color: selectedCurrency === 'USD' ? 'var(--success)' : 'var(--text-secondary)',
              border: selectedCurrency === 'USD' ? '1px solid var(--success)' : 'none'
            }}
          >
            🇺🇸 Dólares (USD)
          </button>
          <button
            onClick={() => setSelectedCurrency('ABEJA')}
            className="btn"
            style={{
              padding: '6px 14px', fontSize: '0.85rem', borderRadius: '8px',
              backgroundColor: selectedCurrency === 'ABEJA' ? 'rgba(245, 158, 11, 0.25)' : 'transparent',
              color: selectedCurrency === 'ABEJA' ? 'var(--warning)' : 'var(--text-secondary)',
              border: selectedCurrency === 'ABEJA' ? '1px solid var(--warning)' : 'none'
            }}
          >
            🐝 Moneda Abeja (Labor)
          </button>
        </div>

        {/* Acciones Rápidas */}
        <div className="flex gap-2">
          <button className="btn btn-outline" style={{ fontSize: '0.85rem' }} onClick={() => setShowNewGoalModal(true)}>
            <Target size={16} color="var(--warning)" /> + Inversión Prevista
          </button>
          <button className="btn btn-primary" style={{ fontSize: '0.85rem' }} onClick={() => setShowNewTxModal(true)}>
            <Plus size={16} /> Cargar Gasto
          </button>
        </div>
      </div>

      {/* 3. Simulador & Conexión WhatsApp (Cero Fricción) */}
      <div className="card" style={{ border: '1px solid rgba(16, 185, 129, 0.3)', backgroundColor: 'rgba(16, 185, 129, 0.04)' }}>
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <MessageSquare color="var(--success)" size={20} />
            <h3 className="font-bold text-base" style={{ color: 'var(--success)' }}>
              Acceso Rápido WhatsApp & Bot
            </h3>
            <span style={{ fontSize: '0.75rem', backgroundColor: 'rgba(16, 185, 129, 0.2)', padding: '2px 8px', borderRadius: '8px', color: 'var(--success)' }}>
              Entrada Inteligente
            </span>
          </div>
          <span className="text-secondary" style={{ fontSize: '0.8rem' }}>
            Escribe como le mandarías un mensaje a la comunidad
          </span>
        </div>

        <form onSubmit={handleSimulateWhatsApp} style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <select 
            className="input" 
            style={{ width: 'auto', minWidth: '130px', fontSize: '0.85rem' }}
            value={whatsappSender}
            onChange={(e) => setWhatsappSender(e.target.value)}
          >
            {members.map(m => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>

          <input 
            type="text" 
            className="input" 
            style={{ flex: 1, minWidth: '240px', fontSize: '0.85rem' }}
            placeholder="Ej: 'Gasté 28000 en verdulería para la casa' o 'Pagué 45 USD de internet'"
            value={whatsappInput}
            onChange={(e) => setWhatsappInput(e.target.value)}
          />

          <button type="submit" className="btn" style={{ backgroundColor: 'var(--success)', color: '#fff', fontSize: '0.85rem' }}>
            <Send size={15} /> Registrar por WhatsApp
          </button>
        </form>
      </div>

      {/* 4. Columnas Principales: Billeteras Individuales y Visión Abierta */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
        
        {/* Columna Izquierda: Billeteras Individuales y Transparencia */}
        <div className="flex flex-col gap-6">
          
          {/* Card: Billeteras de Cada Miembro (Sin perder lo individual) */}
          <div className="card">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <Wallet color="var(--accent-color)" size={22} />
                Billeteras de la Comunidad ({selectedCurrency})
              </h3>
              <span className="text-secondary" style={{ fontSize: '0.8rem' }}>
                Transparencia Abierta
              </span>
            </div>
            <p className="text-secondary mb-4" style={{ fontSize: '0.85rem' }}>
              Cada miembro mantiene el registro de sus gastos individuales y sus aportes al fondo colectivo.
            </p>

            <div className="flex flex-col gap-3">
              {memberBalances.map(m => (
                <div 
                  key={m.id} 
                  style={{ 
                    backgroundColor: 'rgba(255,255,255,0.03)', 
                    border: '1px solid var(--border-color)', 
                    borderRadius: '12px', 
                    padding: '1rem' 
                  }}
                >
                  <div className="flex justify-between items-center mb-2">
                    <div>
                      <span className="font-bold text-base">{m.name}</span>
                      <span className="text-secondary" style={{ fontSize: '0.75rem', display: 'block' }}>
                        Familia: {m.familyUnits.adults} Adulto{m.familyUnits.adults > 1 ? 's' : ''}, {m.familyUnits.kids} Niño{m.familyUnits.kids !== 1 ? 's' : ''}
                      </span>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <span className="text-secondary" style={{ fontSize: '0.7rem', textTransform: 'uppercase' }}>Balance Colectivo</span>
                      <div className="font-bold" style={{ 
                        fontSize: '1rem', 
                        color: m.netBalance >= 0 ? 'var(--success)' : 'var(--danger)' 
                      }}>
                        {m.netBalance >= 0 ? `+${getCurrencySymbol(selectedCurrency)}${m.netBalance.toLocaleString('es-AR')}` : `-${getCurrencySymbol(selectedCurrency)}${Math.abs(m.netBalance).toLocaleString('es-AR')}`}
                      </div>
                    </div>
                  </div>

                  {/* Detalle Individual vs Aporte Comunitario */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid rgba(255,255,255,0.05)', fontSize: '0.8rem' }}>
                    <div style={{ backgroundColor: 'rgba(99, 102, 241, 0.08)', padding: '0.4rem 0.6rem', borderRadius: '8px' }}>
                      <span className="text-secondary" style={{ display: 'block', fontSize: '0.7rem' }}>Aportado a la Casa</span>
                      <strong style={{ color: 'var(--accent-color)' }}>
                        {getCurrencySymbol(selectedCurrency)}{m.paidComunitario.toLocaleString('es-AR')}
                      </strong>
                    </div>

                    <div style={{ backgroundColor: 'rgba(255,255,255,0.05)', padding: '0.4rem 0.6rem', borderRadius: '8px' }}>
                      <span className="text-secondary" style={{ display: 'block', fontSize: '0.7rem' }}>Gastos Propios</span>
                      <strong style={{ color: 'var(--text-primary)' }}>
                        {getCurrencySymbol(selectedCurrency)}{m.paidIndividual.toLocaleString('es-AR')}
                      </strong>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Total General de la Comunidad */}
            <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span className="text-secondary font-semibold" style={{ fontSize: '0.8rem', textTransform: 'uppercase' }}>
                  Gasto Total Comunitario ({selectedCurrency})
                </span>
                <div className="font-bold text-2xl" style={{ color: 'var(--accent-color)' }}>
                  {getCurrencySymbol(selectedCurrency)}{(totalsByCurrency[selectedCurrency]?.totalComunitario || 0).toLocaleString('es-AR')}
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <span className="text-secondary font-semibold" style={{ fontSize: '0.8rem', textTransform: 'uppercase' }}>
                  Gastos Individuales Sumados
                </span>
                <div className="font-bold text-lg" style={{ color: 'var(--text-secondary)' }}>
                  {getCurrencySymbol(selectedCurrency)}{(totalsByCurrency[selectedCurrency]?.totalIndividual || 0).toLocaleString('es-AR')}
                </div>
              </div>
            </div>
          </div>

          {/* Card: Historial de Movimientos */}
          <div className="card">
            <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <HeartHandshake className="text-secondary" size={22} />
                Flujo de Recursos
              </h3>

              {/* Filtros */}
              <div className="flex gap-2">
                <button
                  onClick={() => setFilterScope(filterScope === 'todos' ? 'comunitario' : filterScope === 'comunitario' ? 'individual' : 'todos')}
                  className="btn btn-outline"
                  style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                >
                  Filtro: {filterScope === 'todos' ? 'Todos' : filterScope === 'comunitario' ? 'Solo Comunitarios' : 'Solo Individuales'}
                </button>
              </div>
            </div>

            <div className="table-container">
              {filteredTransactions.length === 0 ? (
                <div className="text-center py-8 text-secondary">No hay movimientos registrados con los filtros actuales.</div>
              ) : (
                <table>
                  <thead>
                    <tr>
                      <th>Fecha</th>
                      <th>Miembro</th>
                      <th>Concepto / Rubro</th>
                      <th>Ámbito</th>
                      <th style={{ textAlign: 'right' }}>Importe</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTransactions.map(t => {
                      const member = members.find(m => m.id === t.memberId);
                      return (
                        <tr key={t.id}>
                          <td className="text-secondary" style={{ fontSize: '0.8rem' }}>{t.date}</td>
                          <td className="font-semibold">{member ? member.name : t.memberId}</td>
                          <td>
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                              <span style={{ fontSize: '0.88rem' }}>{t.concept}</span>
                              <span className="text-secondary" style={{ fontSize: '0.72rem' }}>{t.category}</span>
                            </div>
                          </td>
                          <td>
                            <span style={{
                              padding: '2px 8px', borderRadius: '8px', fontSize: '0.72rem', fontWeight: 600,
                              backgroundColor: t.scope === 'comunitario' ? 'rgba(99, 102, 241, 0.15)' : 'rgba(255,255,255,0.08)',
                              color: t.scope === 'comunitario' ? 'var(--accent-color)' : 'var(--text-secondary)'
                            }}>
                              {t.scope === 'comunitario' ? 'Comunitario' : 'Individual'}
                            </span>
                          </td>
                          <td style={{ textAlign: 'right', fontWeight: 'bold' }}>
                            {getCurrencySymbol(t.currency)}{t.amount.toLocaleString('es-AR')}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>

        </div>

        {/* Columna Derecha: Inversiones Previstas, Gastos Futuros & Proyectos de la Red */}
        <div className="flex flex-col gap-6">

          {/* Card: Gastos Futuros e Inversiones Previstas */}
          <div className="card" style={{ borderTop: '4px solid var(--warning)' }}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <Target color="var(--warning)" size={22} />
                Inversiones & Gastos Previstos
              </h3>
              <button 
                onClick={() => setShowNewGoalModal(true)}
                className="btn btn-outline" 
                style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}
              >
                + Planificar
              </button>
            </div>
            <p className="text-secondary mb-4" style={{ fontSize: '0.85rem' }}>
              Metas de ahorro colectivo y compras planificadas de la colmena antes de realizarlas.
            </p>

            <div className="flex flex-col gap-4">
              {projects.map(p => {
                const percent = Math.min(100, Math.round((p.collectedAmount / p.targetAmount) * 100));
                return (
                  <div key={p.id} style={{ backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '1rem' }}>
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-semibold text-base mb-0.5">{p.title}</h4>
                        <span className="text-secondary" style={{ fontSize: '0.75rem' }}>
                          Rubro: {p.category} • Fecha meta: <strong>{p.targetDate}</strong>
                        </span>
                      </div>
                      <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: percent >= 100 ? 'var(--success)' : 'var(--warning)' }}>
                        {percent}%
                      </span>
                    </div>

                    {/* Barra de progreso */}
                    <div style={{ width: '100%', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '999px', height: '8px', marginBottom: '8px' }}>
                      <div style={{ backgroundColor: percent >= 100 ? 'var(--success)' : 'var(--warning)', height: '8px', borderRadius: '999px', width: `${percent}%`, transition: 'width 0.4s ease' }}></div>
                    </div>

                    <div className="flex justify-between items-center" style={{ fontSize: '0.8rem' }}>
                      <span className="text-secondary">
                        Aportado: <strong style={{ color: 'var(--text-primary)' }}>{getCurrencySymbol(p.currency)}{p.collectedAmount.toLocaleString('es-AR')}</strong>
                      </span>
                      <span>
                        Objetivo: <strong>{getCurrencySymbol(p.currency)}{p.targetAmount.toLocaleString('es-AR')}</strong>
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Card: Integración de la Red En Conjunto (VRDE & Elementales) */}
          <div className="card" style={{ borderTop: '4px solid var(--accent-color)' }}>
            <h3 className="text-xl font-bold mb-3 flex items-center gap-2">
              <Globe color="var(--accent-color)" size={22} />
              Intercambio en la Red
            </h3>
            <p className="text-secondary mb-4" style={{ fontSize: '0.85rem' }}>
              Este nodo de convivencia interactúa de forma directa con los nodos de la matriz En Conjunto.
            </p>

            <div className="flex flex-col gap-3">
              <div style={{ border: '1px solid rgba(16, 185, 129, 0.25)', backgroundColor: 'rgba(16, 185, 129, 0.05)', borderRadius: '12px', padding: '12px' }}>
                <div className="flex justify-between items-center mb-1">
                  <span className="font-semibold text-success" style={{ fontSize: '0.9rem' }}>Canal VRDE Alimentos</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--success)' }}>Nodo Activo</span>
                </div>
                <p className="text-secondary" style={{ fontSize: '0.8rem', margin: 0 }}>
                  Las compras de alimentos agroecológicos se debitan del fondo comunitario de despensa sin intermediarios bancarios.
                </p>
              </div>

              <div style={{ border: '1px solid rgba(99, 102, 241, 0.25)', backgroundColor: 'rgba(99, 102, 241, 0.05)', borderRadius: '12px', padding: '12px' }}>
                <div className="flex justify-between items-center mb-1">
                  <span className="font-semibold" style={{ color: 'var(--accent-color)', fontSize: '0.9rem' }}>Canal Elementales Tierra</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--accent-color)' }}>Nodo Activo</span>
                </div>
                <p className="text-secondary" style={{ fontSize: '0.8rem', margin: 0 }}>
                  Las horas de labor dedicadas a biopiscinas, huerta o infraestructura se computan como créditos de labor (🐝 Abejas).
                </p>
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* Modal: Nuevo Gasto Manual */}
      {showNewTxModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div className="card" style={{ maxWidth: '450px', width: '100%', position: 'relative' }}>
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Plus color="var(--accent-color)" size={20} /> Registrar Nuevo Movimiento
            </h3>

            <form onSubmit={handleCreateTx} className="flex flex-col gap-4">
              <div>
                <label className="text-secondary" style={{ fontSize: '0.85rem', display: 'block', marginBottom: '4px' }}>¿Quién pagó?</label>
                <select 
                  className="input" 
                  value={formTx.memberId} 
                  onChange={e => setFormTx({...formTx, memberId: e.target.value})}
                >
                  {members.map(m => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-secondary" style={{ fontSize: '0.85rem', display: 'block', marginBottom: '4px' }}>Concepto o Detalle</label>
                <input 
                  type="text" 
                  className="input" 
                  placeholder="Ej: Verdulería, internet, compras del hogar..."
                  value={formTx.concept}
                  onChange={e => setFormTx({...formTx, concept: e.target.value})}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label className="text-secondary" style={{ fontSize: '0.85rem', display: 'block', marginBottom: '4px' }}>Importe</label>
                  <input 
                    type="number" 
                    step="any"
                    className="input" 
                    placeholder="Ej: 15000"
                    value={formTx.amount}
                    onChange={e => setFormTx({...formTx, amount: e.target.value})}
                    required
                  />
                </div>

                <div>
                  <label className="text-secondary" style={{ fontSize: '0.85rem', display: 'block', marginBottom: '4px' }}>Moneda</label>
                  <select 
                    className="input"
                    value={formTx.currency}
                    onChange={e => setFormTx({...formTx, currency: e.target.value})}
                  >
                    <option value="ARS">🇦🇷 Pesos ($)</option>
                    <option value="USD">🇺🇸 Dólares (USD)</option>
                    <option value="ABEJA">🐝 Abejas (Labor)</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label className="text-secondary" style={{ fontSize: '0.85rem', display: 'block', marginBottom: '4px' }}>Ámbito del Gasto</label>
                  <select 
                    className="input"
                    value={formTx.scope}
                    onChange={e => setFormTx({...formTx, scope: e.target.value})}
                  >
                    <option value="comunitario">Comunitario (Compartido)</option>
                    <option value="individual">Individual (Gasto Propio)</option>
                  </select>
                </div>

                <div>
                  <label className="text-secondary" style={{ fontSize: '0.85rem', display: 'block', marginBottom: '4px' }}>Rubro</label>
                  <select 
                    className="input"
                    value={formTx.category}
                    onChange={e => setFormTx({...formTx, category: e.target.value})}
                  >
                    <option value="Despensa & Alimentos">Despensa & Alimentos</option>
                    <option value="Servicios">Servicios (Luz, Gas, Red)</option>
                    <option value="Hábitat & Tierra">Hábitat & Tierra</option>
                    <option value="Movilidad">Movilidad</option>
                    <option value="Personal / Familia">Personal / Familia</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-2 justify-end mt-2">
                <button type="button" className="btn btn-outline" onClick={() => setShowNewTxModal(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary">Guardar Movimiento</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Nueva Inversión Prevista */}
      {showNewGoalModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div className="card" style={{ maxWidth: '450px', width: '100%', position: 'relative' }}>
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Target color="var(--warning)" size={20} /> Planificar Gasto o Inversión Futura
            </h3>

            <form onSubmit={handleCreateGoal} className="flex flex-col gap-4">
              <div>
                <label className="text-secondary" style={{ fontSize: '0.85rem', display: 'block', marginBottom: '4px' }}>Proyecto o Meta</label>
                <input 
                  type="text" 
                  className="input" 
                  placeholder="Ej: Compra mayorista de harina y aceite, leña para invierno..."
                  value={formGoal.title}
                  onChange={e => setFormGoal({...formGoal, title: e.target.value})}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label className="text-secondary" style={{ fontSize: '0.85rem', display: 'block', marginBottom: '4px' }}>Monto Estimado</label>
                  <input 
                    type="number" 
                    step="any"
                    className="input" 
                    placeholder="Ej: 200000"
                    value={formGoal.targetAmount}
                    onChange={e => setFormGoal({...formGoal, targetAmount: e.target.value})}
                    required
                  />
                </div>

                <div>
                  <label className="text-secondary" style={{ fontSize: '0.85rem', display: 'block', marginBottom: '4px' }}>Moneda</label>
                  <select 
                    className="input"
                    value={formGoal.currency}
                    onChange={e => setFormGoal({...formGoal, currency: e.target.value})}
                  >
                    <option value="ARS">🇦🇷 Pesos ($)</option>
                    <option value="USD">🇺🇸 Dólares (USD)</option>
                    <option value="ABEJA">🐝 Abejas (Labor)</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label className="text-secondary" style={{ fontSize: '0.85rem', display: 'block', marginBottom: '4px' }}>Fecha Prevista</label>
                  <input 
                    type="text" 
                    className="input" 
                    placeholder="Ej: Próximo mes, Noviembre..."
                    value={formGoal.targetDate}
                    onChange={e => setFormGoal({...formGoal, targetDate: e.target.value})}
                  />
                </div>

                <div>
                  <label className="text-secondary" style={{ fontSize: '0.85rem', display: 'block', marginBottom: '4px' }}>Rubro</label>
                  <select 
                    className="input"
                    value={formGoal.category}
                    onChange={e => setFormGoal({...formGoal, category: e.target.value})}
                  >
                    <option value="Alimentos">Alimentos & Despensa</option>
                    <option value="Hábitat & Tierra">Hábitat & Tierra</option>
                    <option value="Movilidad">Movilidad</option>
                    <option value="Infraestructura">Infraestructura</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-2 justify-end mt-2">
                <button type="button" className="btn btn-outline" onClick={() => setShowNewGoalModal(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary" style={{ backgroundColor: 'var(--warning)', color: '#000' }}>Planificar Meta</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
