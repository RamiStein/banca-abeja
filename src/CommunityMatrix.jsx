import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, Wallet, Globe, ArrowUpRight, ArrowDownLeft, Plus, 
  Sparkles, MessageSquare, Send, CheckCircle2, TrendingUp, 
  DollarSign, Coins, Target, Calendar, ChevronRight, Filter, 
  ShieldCheck, Share2, Layers, HeartHandshake, Trash2, AlertCircle,
  Wifi, RefreshCw
} from 'lucide-react';
import { db } from './firebase';
import { collection, onSnapshot, addDoc, deleteDoc, doc, query, orderBy } from 'firebase/firestore';

// ==========================================
// PARSER INTELIGENTE DE LENGUAJE COLOQUIAL (WHATSAPP)
// ==========================================
function parseWhatsAppExpenses(rawText, defaultSenderId) {
  if (!rawText || !rawText.trim()) return [];
  const text = rawText.trim();

  // Helper para convertir cualquier número en formato argentino/latinoamericano
  // Soporta: "30.000" -> 30000, "15000" -> 15000, "10 mil" -> 10000, "10k" -> 10000, "45 usd" -> 45
  const parseAmount = (str) => {
    if (!str) return 0;
    let s = str.trim().toLowerCase();
    let multiplier = 1;
    if (s.includes('mil') || s.endsWith('k')) {
      multiplier = 1000;
      s = s.replace(/mil/gi, '').replace(/k/gi, '').trim();
    }
    // Si tiene punto como separador de miles argentino (ej: 30.000 o 1.500.000)
    if (/\d+\.\d{3}/.test(s)) {
      s = s.replace(/\./g, '');
    } else if (/\d+,\d{3}/.test(s)) {
      s = s.replace(/,/g, '');
    } else {
      s = s.replace(',', '.');
    }
    const cleanDigits = s.replace(/[^\d.]/g, '');
    const num = parseFloat(cleanDigits);
    return isNaN(num) ? 0 : num * multiplier;
  };

  // Separar en cláusulas lógicas cuando el mensaje trae múltiples gastos
  // Ej: "gaste en alimentos 30.000 y en nafte 15000 con el clio y 10 mil en nafta con el etios y puse 20.000 para ferreteria y arepas"
  const splitRegex = /(?:\r?\n+|;\s*|,\s*(?=[a-zñáéíóú\s]*\d)|\s+y\s+(?:en\s+|puse\s+|gast[eé]\s+|para\s+|de\s+)?|\s+adem[aá]s\s+|\s+tambi[eé]n\s+)/i;
  
  let rawClauses = text.split(splitRegex).map(c => c.trim()).filter(Boolean);

  // Si no se dividió bien pero contiene " y ", intentamos dividir por " y "
  if (rawClauses.length <= 1 && /\s+y\s+/i.test(text)) {
    rawClauses = text.split(/\s+y\s+/i).map(c => c.trim()).filter(Boolean);
  }

  const parsedItems = [];

  rawClauses.forEach((clause) => {
    // Regex para capturar números con separadores de miles y sufijos como "mil" o "k"
    const numberRegex = /(\d+(?:[.,]\d{3})*(?:[.,]\d+)?\s*(?:mil|k)?)/i;
    const numMatch = clause.match(numberRegex);

    if (numMatch) {
      const rawNumStr = numMatch[0];
      const amount = parseAmount(rawNumStr);

      if (amount > 0) {
        const lowerClause = clause.toLowerCase();

        // 1. Detectar moneda
        let currency = 'ARS';
        if (lowerClause.includes('usd') || lowerClause.includes('dolar') || lowerClause.includes('dólar') || lowerClause.includes('u$s')) {
          currency = 'USD';
        } else if (lowerClause.includes('abeja') || lowerClause.includes('hora') || lowerClause.includes('semilla')) {
          currency = 'ABEJA';
        }

        // 2. Detectar ámbito (Comunitario vs Individual)
        let scope = 'comunitario';
        if (lowerClause.includes('personal') || lowerClause.includes('propio') || lowerClause.includes('mío') || lowerClause.includes('mio') || lowerClause.includes('mía')) {
          scope = 'individual';
        }

        // 3. Detectar categoría específica
        let category = 'Despensa & Alimentos';
        if (lowerClause.includes('clio')) {
          category = 'Movilidad (Clio)';
        } else if (lowerClause.includes('etios')) {
          category = 'Movilidad (Etios)';
        } else if (lowerClause.includes('nafta') || lowerClause.includes('nafte') || lowerClause.includes('combustible') || lowerClause.includes('auto') || lowerClause.includes('gasoil')) {
          category = 'Movilidad';
        } else if (lowerClause.includes('ferreteria') || lowerClause.includes('ferretería') || lowerClause.includes('bomba') || lowerClause.includes('herramienta') || lowerClause.includes('huerta') || lowerClause.includes('tierra') || lowerClause.includes('obra')) {
          category = 'Hábitat & Mantenimiento';
        } else if (lowerClause.includes('luz') || lowerClause.includes('gas') || lowerClause.includes('internet') || lowerClause.includes('starlink') || lowerClause.includes('agua') || lowerClause.includes('seguro')) {
          category = 'Servicios';
        } else if (lowerClause.includes('alimento') || lowerClause.includes('verdura') || lowerClause.includes('comida') || lowerClause.includes('arepa') || lowerClause.includes('super') || lowerClause.includes('pan')) {
          category = 'Despensa & Alimentos';
        }

        // 4. Limpiar concepto descriptivo legible
        let concept = clause
          .replace(rawNumStr, '')
          .replace(/^(gast[eé]\s+en|gast[eé]|puse\s+para|puse|compr[eé]\s+en|compr[eé]|para|en|de)\s+/i, '')
          .replace(/\s+(con|para|en)$/i, '')
          .replace(/\s*(usd|dolares|dólares|u\$s|pesos|abejas|horas)\s*/gi, '')
          .trim();

        if (lowerClause.includes('clio') && (!concept || concept.length < 3)) concept = 'Nafta con el Clio';
        if (lowerClause.includes('etios') && (!concept || concept.length < 3)) concept = 'Nafta con el Etios';
        if (!concept || concept.length < 3) concept = category;

        // Capitalizar primer letra
        concept = concept.charAt(0).toUpperCase() + concept.slice(1);

        parsedItems.push({
          id: `tx-wa-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
          date: new Date().toLocaleDateString('es-AR'),
          memberId: defaultSenderId,
          concept,
          scope,
          category,
          currency,
          amount,
          channel: 'whatsapp'
        });
      }
    }
  });

  return parsedItems;
}

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
      scope: 'comunitario',
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
      category: 'Hábitat & Mantenimiento',
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
    if (!saved) return defaultTransactions;
    try {
      const parsed = JSON.parse(saved);
      // Limpiar automáticamente el registro erróneo previo con 30 pesos si existe
      return parsed.filter(t => !(t.amount === 30 && t.concept && t.concept.includes('gaste en alimentos')));
    } catch (e) {
      return defaultTransactions;
    }
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

  // Estados de interfaz
  const [whatsappInput, setWhatsappInput] = useState('');
  const [whatsappSender, setWhatsappSender] = useState('ramiro');
  const [showNewTxModal, setShowNewTxModal] = useState(false);
  const [showNewGoalModal, setShowNewGoalModal] = useState(false);
  const [filterScope, setFilterScope] = useState('todos'); // 'todos' | 'comunitario' | 'individual'
  const [feedbackBanner, setFeedbackBanner] = useState(null);
  const [isLiveSynced, setIsLiveSynced] = useState(false);
  const [syncStatusText, setSyncStatusText] = useState('Conectando con WhatsApp...');

  // Formulario manual de movimiento
  const [formTx, setFormTx] = useState({
    memberId: 'ramiro',
    concept: '',
    amount: '',
    currency: 'ARS',
    scope: 'comunitario',
    category: 'Despensa & Alimentos'
  });

  // Formulario manual de meta
  const [formGoal, setFormGoal] = useState({
    title: '',
    category: 'Alimentos',
    currency: 'ARS',
    targetAmount: '',
    targetDate: ''
  });

  // Persistencia en LocalStorage
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

  // Sincronización en Tiempo Real con Firebase Firestore (Banca Abeja & WhatsApp Bot)
  useEffect(() => {
    if (!db) {
      setSyncStatusText('Modo Local');
      return;
    }

    try {
      const q = query(collection(db, 'banca_abeja_transactions'), orderBy('timestamp', 'desc'));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        if (!snapshot.empty) {
          const liveTxs = snapshot.docs.map(docSnap => ({
            id: docSnap.id,
            ...docSnap.data()
          }));
          setTransactions(liveTxs);
          localStorage.setItem('matrix_transactions', JSON.stringify(liveTxs));
          setIsLiveSynced(true);
          setSyncStatusText('WhatsApp en Vivo (cobelgrano-36019)');
        } else {
          setIsLiveSynced(true);
          setSyncStatusText('WhatsApp en Vivo (Esperando mensajes)');
        }
      }, (err) => {
        console.warn("Firestore snapshot error, operando en modo local:", err.message);
        setIsLiveSynced(false);
        setSyncStatusText('Modo Local');
      });

      return () => unsubscribe();
    } catch (e) {
      console.warn("No se pudo iniciar listener de Firestore:", e.message);
      setIsLiveSynced(false);
      setSyncStatusText('Modo Local');
    }
  }, []);

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

  // Lista dinámica de miembros (incluye a miembros que envíen gastos por WhatsApp)
  const activeMembersList = useMemo(() => {
    const knownMap = new Map();
    members.forEach(m => knownMap.set(m.id, { ...m }));
    transactions.forEach(t => {
      if (t.memberId && !knownMap.has(t.memberId)) {
        const displayName = t.memberName || (t.memberId.charAt(0).toUpperCase() + t.memberId.slice(1));
        knownMap.set(t.memberId, {
          id: t.memberId,
          name: displayName,
          familyUnits: { adults: 1, kids: 0 },
          phone: ''
        });
      }
    });
    return Array.from(knownMap.values());
  }, [members, transactions]);

  // Balance por Miembro en la moneda seleccionada
  const memberBalances = activeMembersList.map(m => {
    const userTxs = transactions.filter(t => t.memberId === m.id && t.currency === selectedCurrency);
    const paidComunitario = userTxs.filter(t => t.scope === 'comunitario').reduce((acc, t) => acc + t.amount, 0);
    const paidIndividual = userTxs.filter(t => t.scope === 'individual').reduce((acc, t) => acc + t.amount, 0);
    
    const totalComunitarioCurr = totalsByCurrency[selectedCurrency]?.totalComunitario || 0;
    const fairShare = activeMembersList.length > 0 ? totalComunitarioCurr / activeMembersList.length : 0;
    const netBalance = paidComunitario - fairShare;

    return {
      ...m,
      paidComunitario,
      paidIndividual,
      fairShare,
      netBalance
    };
  });

  // ==========================================
  // MANEJADOR DE MENSAJE DE WHATSAPP
  // ==========================================
  const handleSimulateWhatsApp = async (e) => {
    e.preventDefault();
    if (!whatsappInput.trim()) return;

    const parsedItems = parseWhatsAppExpenses(whatsappInput, whatsappSender);

    if (parsedItems.length === 0) {
      alert("No se pudo detectar ningún importe en el mensaje. Escribe por ejemplo: 'Gasté 25000 en alimentos' o 'Pagué 15000 de nafta con el clio'");
      return;
    }

    const senderObj = activeMembersList.find(m => m.id === whatsappSender);
    const senderName = senderObj?.name || (whatsappSender.charAt(0).toUpperCase() + whatsappSender.slice(1));

    // Guardar en Firestore si está conectado
    if (db) {
      for (const item of parsedItems) {
        try {
          await addDoc(collection(db, 'banca_abeja_transactions'), {
            date: new Date().toLocaleDateString('es-AR'),
            memberId: whatsappSender,
            memberName: senderName,
            concept: item.concept,
            category: item.category,
            currency: item.currency,
            amount: item.amount,
            scope: item.scope,
            channel: 'whatsapp_web',
            timestamp: Date.now()
          });
        } catch (err) {
          console.warn("Error guardando en Firestore:", err);
        }
      }
    } else {
      setTransactions(prev => [...parsedItems, ...prev]);
    }

    setWhatsappInput('');

    // Armar mensaje de confirmación detallado
    const totalSum = parsedItems.reduce((acc, item) => acc + item.amount, 0);
    const itemsSummary = parsedItems.map(item => `${item.concept} (${getCurrencySymbol(item.currency)}${item.amount.toLocaleString('es-AR')})`).join(', ');

    setFeedbackBanner({
      sender: senderName,
      count: parsedItems.length,
      total: totalSum,
      currency: parsedItems[0].currency,
      detail: itemsSummary
    });
  };

  // Carga manual de gasto
  const handleCreateTx = async (e) => {
    e.preventDefault();
    if (!formTx.concept || !formTx.amount) return;

    const senderObj = activeMembersList.find(m => m.id === formTx.memberId);
    const senderName = senderObj?.name || (formTx.memberId.charAt(0).toUpperCase() + formTx.memberId.slice(1));

    const newTx = {
      date: new Date().toLocaleDateString('es-AR'),
      memberId: formTx.memberId,
      memberName: senderName,
      concept: formTx.concept.trim(),
      scope: formTx.scope,
      category: formTx.category,
      currency: formTx.currency,
      amount: parseFloat(formTx.amount) || 0,
      channel: 'web',
      timestamp: Date.now()
    };

    if (db) {
      try {
        await addDoc(collection(db, 'banca_abeja_transactions'), newTx);
      } catch (err) {
        console.warn("Error guardando en Firestore:", err);
        setTransactions(prev => [{ ...newTx, id: `tx-man-${Date.now()}` }, ...prev]);
      }
    } else {
      setTransactions(prev => [{ ...newTx, id: `tx-man-${Date.now()}` }, ...prev]);
    }

    setShowNewTxModal(false);
    setFormTx({ ...formTx, concept: '', amount: '' });
  };

  // Eliminar transacción
  const handleDeleteTx = async (id) => {
    if (window.confirm("¿Seguro que deseas eliminar este movimiento?")) {
      setTransactions(prev => prev.filter(t => t.id !== id));
      if (db && !id.startsWith('tx-')) {
        try {
          await deleteDoc(doc(db, 'banca_abeja_transactions', id));
        } catch (err) {
          console.warn("Error eliminando documento de Firestore:", err);
        }
      }
    }
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

    setProjects(prev => [newGoal, ...prev]);
    setShowNewGoalModal(false);
    setFormGoal({ title: '', category: 'Alimentos', currency: 'ARS', targetAmount: '', targetDate: '' });
  };

  const activeNode = nodes.find(n => n.id === activeNodeId) || nodes[0];

  const filteredTransactions = transactions.filter(t => {
    if (filterScope !== 'todos' && t.scope !== filterScope) return false;
    return true;
  });

  const getCurrencySymbol = (curr) => {
    if (curr === 'USD') return 'US$';
    if (curr === 'ABEJA') return '🐝';
    return '$';
  };

  return (
    <div className="flex flex-col gap-6" style={{ width: '100%' }}>

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
            <h2 className="text-2xl font-bold flex items-center gap-2 flex-wrap">
              Banca Abeja <span style={{ fontSize: '0.85rem', padding: '2px 10px', backgroundColor: 'rgba(245, 158, 11, 0.2)', color: 'var(--warning)', borderRadius: '12px' }}>Economía de la Colmena</span>
              <span style={{ 
                fontSize: '0.75rem', 
                padding: '3px 10px', 
                backgroundColor: isLiveSynced ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)', 
                color: isLiveSynced ? '#10b981' : '#f59e0b', 
                border: isLiveSynced ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(245, 158, 11, 0.3)',
                borderRadius: '12px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: isLiveSynced ? '#10b981' : '#f59e0b', display: 'inline-block' }}></span>
                {syncStatusText}
              </span>
            </h2>
            <p className="text-secondary mt-1" style={{ fontSize: '0.9rem' }}>
              Nodo Activo: <strong style={{ color: 'var(--text-primary)' }}>{activeNode.name}</strong> — {activeNode.desc}
            </p>
          </div>

          {/* Selector de Nodos */}
          <div className="matrix-nodes-bar">
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

      {/* 2. Barra de Multimoneda y Acciones */}
      <div className="currency-bar-responsive">
        {/* Selector de Moneda */}
        <div className="currency-pills">
          <button
            onClick={() => setSelectedCurrency('ARS')}
            className="btn"
            style={{
              borderRadius: '8px',
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
              borderRadius: '8px',
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
              borderRadius: '8px',
              backgroundColor: selectedCurrency === 'ABEJA' ? 'rgba(245, 158, 11, 0.25)' : 'transparent',
              color: selectedCurrency === 'ABEJA' ? 'var(--warning)' : 'var(--text-secondary)',
              border: selectedCurrency === 'ABEJA' ? '1px solid var(--warning)' : 'none'
            }}
          >
            🐝 Abejas (Labor)
          </button>
        </div>

        {/* Acciones Rápidas */}
        <div className="currency-actions">
          <button className="btn btn-outline" onClick={() => setShowNewGoalModal(true)}>
            <Target size={16} color="var(--warning)" /> + Inversión
          </button>
          <button className="btn btn-primary" onClick={() => setShowNewTxModal(true)}>
            <Plus size={16} /> + Gasto Manual
          </button>
        </div>
      </div>

      {/* 3. Acceso Rápido WhatsApp & Bot (Procesador Coloquial) */}
      <div className="card" style={{ border: '1px solid rgba(16, 185, 129, 0.3)', backgroundColor: 'rgba(16, 185, 129, 0.04)' }}>
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <MessageSquare color="var(--success)" size={20} />
            <h3 className="font-bold text-base" style={{ color: 'var(--success)', margin: 0 }}>
              Acceso Rápido WhatsApp & Bot
            </h3>
            <span style={{ fontSize: '0.75rem', backgroundColor: 'rgba(16, 185, 129, 0.2)', padding: '2px 8px', borderRadius: '8px', color: 'var(--success)' }}>
              Desglose Múltiple
            </span>
          </div>
          <span className="text-secondary" style={{ fontSize: '0.78rem' }}>
            Carga varios gastos separados por "y" o comas
          </span>
        </div>

        <form onSubmit={handleSimulateWhatsApp} className="whatsapp-input-group">
          <select 
            className="input" 
            style={{ fontSize: '0.85rem' }}
            value={whatsappSender}
            onChange={(e) => setWhatsappSender(e.target.value)}
          >
            {activeMembersList.map(m => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>

          <input 
            type="text" 
            className="input" 
            style={{ fontSize: '0.85rem' }}
            placeholder="Ej: 'gasté en alimentos 30.000 y en nafta 15000 con el clio y 10 mil en etios'"
            value={whatsappInput}
            onChange={(e) => setWhatsappInput(e.target.value)}
          />

          <button type="submit" className="btn" style={{ backgroundColor: 'var(--success)', color: '#fff', fontSize: '0.85rem', whiteSpace: 'nowrap' }}>
            <Send size={15} /> Procesar Mensaje
          </button>
        </form>

        {/* Banner de confirmación cuando se procesa WhatsApp */}
        {feedbackBanner && (
          <div style={{ marginTop: '1rem', backgroundColor: 'rgba(16, 185, 129, 0.15)', border: '1px solid var(--success)', borderRadius: '10px', padding: '0.75rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem' }}>
            <div>
              <div style={{ fontWeight: 'bold', color: 'var(--success)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <CheckCircle2 size={16} /> ¡Interpretado con éxito! {feedbackBanner.sender} registró {feedbackBanner.count} gasto{feedbackBanner.count > 1 ? 's' : ''} por un total de {getCurrencySymbol(feedbackBanner.currency)}{feedbackBanner.total.toLocaleString('es-AR')}:
              </div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                {feedbackBanner.detail}
              </div>
            </div>
            <button 
              onClick={() => setFeedbackBanner(null)} 
              style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '1rem' }}
            >
              ✕
            </button>
          </div>
        )}
      </div>

      {/* 4. Grid Superior: Billeteras Individuales a la Izquierda e Inversiones a la Derecha */}
      <div className="responsive-two-col-grid">
        
        {/* Columna 1: Billeteras de la Comunidad */}
        <div className="card" style={{ height: 'fit-content' }}>
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
                      fontSize: '1.05rem', 
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
              <span className="text-secondary font-semibold" style={{ fontSize: '0.75rem', textTransform: 'uppercase' }}>
                Gasto Comunitario ({selectedCurrency})
              </span>
              <div className="font-bold text-2xl" style={{ color: 'var(--accent-color)' }}>
                {getCurrencySymbol(selectedCurrency)}{(totalsByCurrency[selectedCurrency]?.totalComunitario || 0).toLocaleString('es-AR')}
              </div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <span className="text-secondary font-semibold" style={{ fontSize: '0.75rem', textTransform: 'uppercase' }}>
                Gastos Individuales
              </span>
              <div className="font-bold text-lg" style={{ color: 'var(--text-secondary)' }}>
                {getCurrencySymbol(selectedCurrency)}{(totalsByCurrency[selectedCurrency]?.totalIndividual || 0).toLocaleString('es-AR')}
              </div>
            </div>
          </div>
        </div>

        {/* Columna 2: Inversiones Previstas & Red En Conjunto */}
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
              Metas de ahorro colectivo y compras planificadas de la colmena.
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

          {/* Card: Intercambio con la Red En Conjunto */}
          <div className="card" style={{ borderTop: '4px solid var(--accent-color)' }}>
            <h3 className="text-xl font-bold mb-3 flex items-center gap-2">
              <Globe color="var(--accent-color)" size={22} />
              Intercambio en la Red
            </h3>
            <p className="text-secondary mb-3" style={{ fontSize: '0.85rem' }}>
              Este nodo interactúa de forma directa con los demás nodos de la matriz.
            </p>

            <div className="flex flex-col gap-3">
              <div style={{ border: '1px solid rgba(16, 185, 129, 0.25)', backgroundColor: 'rgba(16, 185, 129, 0.05)', borderRadius: '12px', padding: '10px 14px' }}>
                <div className="flex justify-between items-center mb-1">
                  <span className="font-semibold" style={{ color: 'var(--success)', fontSize: '0.88rem' }}>Canal VRDE Alimentos</span>
                  <span style={{ fontSize: '0.72rem', color: 'var(--success)' }}>✓ Nodo Activo</span>
                </div>
                <p className="text-secondary" style={{ fontSize: '0.78rem', margin: 0 }}>
                  Alimentos agroecológicos debitados del pozo de despensa sin bancos tradicionales.
                </p>
              </div>

              <div style={{ border: '1px solid rgba(99, 102, 241, 0.25)', backgroundColor: 'rgba(99, 102, 241, 0.05)', borderRadius: '12px', padding: '10px 14px' }}>
                <div className="flex justify-between items-center mb-1">
                  <span className="font-semibold" style={{ color: 'var(--accent-color)', fontSize: '0.88rem' }}>Canal Elementales Hábitat</span>
                  <span style={{ fontSize: '0.72rem', color: 'var(--accent-color)' }}>✓ Nodo Activo</span>
                </div>
                <p className="text-secondary" style={{ fontSize: '0.78rem', margin: 0 }}>
                  Labor dedicada a la tierra o huerta computada como créditos comunitarios (🐝 Abejas).
                </p>
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* 5. SECCIÓN HISTORIAL Y FLUJO DE RECURSOS - ANCHO COMPLETO (100%) */}
      <div className="card" style={{ width: '100%', overflow: 'hidden' }}>
        <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
          <div>
            <h3 className="text-xl font-bold flex items-center gap-2">
              <HeartHandshake className="text-accent" color="var(--accent-color)" size={22} />
              Flujo de Recursos & Historial
            </h3>
            <p className="text-secondary mt-1" style={{ fontSize: '0.85rem' }}>
              Registro abierto de gastos comunitarios e individuales de toda la colmena
            </p>
          </div>

          {/* Filtros */}
          <div style={{ display: 'flex', gap: '4px', backgroundColor: 'rgba(0,0,0,0.25)', padding: '3px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <button
              onClick={() => setFilterScope('todos')}
              className="btn"
              style={{
                padding: '4px 12px', fontSize: '0.75rem', borderRadius: '6px',
                backgroundColor: filterScope === 'todos' ? 'var(--accent-color)' : 'transparent',
                color: filterScope === 'todos' ? '#fff' : 'var(--text-secondary)'
              }}
            >
              Todos ({transactions.length})
            </button>
            <button
              onClick={() => setFilterScope('comunitario')}
              className="btn"
              style={{
                padding: '4px 12px', fontSize: '0.75rem', borderRadius: '6px',
                backgroundColor: filterScope === 'comunitario' ? 'var(--accent-color)' : 'transparent',
                color: filterScope === 'comunitario' ? '#fff' : 'var(--text-secondary)'
              }}
            >
              Comunitarios
            </button>
            <button
              onClick={() => setFilterScope('individual')}
              className="btn"
              style={{
                padding: '4px 12px', fontSize: '0.75rem', borderRadius: '6px',
                backgroundColor: filterScope === 'individual' ? 'var(--accent-color)' : 'transparent',
                color: filterScope === 'individual' ? '#fff' : 'var(--text-secondary)'
              }}
            >
              Individuales
            </button>
          </div>
        </div>

        <div style={{ overflowX: 'auto', width: '100%' }}>
          <table style={{ width: '100%', minWidth: '720px', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)', fontSize: '0.78rem', textTransform: 'uppercase' }}>
                <th style={{ padding: '12px 14px', width: '110px', textAlign: 'left' }}>Fecha</th>
                <th style={{ padding: '12px 14px', width: '130px', textAlign: 'left' }}>Miembro</th>
                <th style={{ padding: '12px 14px', textAlign: 'left', minWidth: '280px' }}>Concepto & Rubro</th>
                <th style={{ padding: '12px 14px', width: '120px', textAlign: 'center' }}>Ámbito</th>
                <th style={{ padding: '12px 14px', width: '100px', textAlign: 'center' }}>Origen</th>
                <th style={{ padding: '12px 14px', width: '140px', textAlign: 'right' }}>Importe</th>
                <th style={{ padding: '12px 14px', width: '50px', textAlign: 'center' }}></th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                    No hay movimientos registrados con los filtros seleccionados.
                  </td>
                </tr>
              ) : (
                filteredTransactions.map(t => {
                  const member = members.find(m => m.id === t.memberId);
                  return (
                    <tr key={t.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                      <td style={{ padding: '12px 14px', color: 'var(--text-secondary)', fontSize: '0.85rem', whiteSpace: 'nowrap' }}>
                        {t.date}
                      </td>
                      <td style={{ padding: '12px 14px', fontWeight: 'bold', fontSize: '0.9rem', whiteSpace: 'nowrap' }}>
                        {member ? member.name : t.memberId}
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        <div>
                          <span style={{ fontSize: '0.92rem', fontWeight: '500', color: 'var(--text-primary)', display: 'block' }}>
                            {t.concept}
                          </span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                            {t.category}
                          </span>
                        </div>
                      </td>
                      <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                        <span style={{
                          padding: '3px 10px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 600,
                          backgroundColor: t.scope === 'comunitario' ? 'rgba(99, 102, 241, 0.15)' : 'rgba(255,255,255,0.08)',
                          color: t.scope === 'comunitario' ? 'var(--accent-color)' : 'var(--text-secondary)'
                        }}>
                          {t.scope === 'comunitario' ? 'Comunitario' : 'Individual'}
                        </span>
                      </td>
                      <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                        {t.channel === 'whatsapp' ? (
                          <span style={{ fontSize: '0.75rem', color: 'var(--success)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <MessageSquare size={13} /> WhatsApp
                          </span>
                        ) : (
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Web</span>
                        )}
                      </td>
                      <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 'bold', fontSize: '1rem', whiteSpace: 'nowrap' }}>
                        {getCurrencySymbol(t.currency)}{t.amount.toLocaleString('es-AR')}
                      </td>
                      <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                        <button
                          onClick={() => handleDeleteTx(t.id)}
                          className="btn"
                          title="Eliminar este movimiento"
                          style={{
                            padding: '4px',
                            background: 'none',
                            border: 'none',
                            color: 'rgba(239, 68, 68, 0.6)',
                            cursor: 'pointer'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.color = '#ef4444'}
                          onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(239, 68, 68, 0.6)'}
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Carga Manual */}
      {showNewTxModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div className="card" style={{ maxWidth: '450px', width: '100%', position: 'relative' }}>
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Plus color="var(--accent-color)" size={20} /> Registrar Movimiento Manual
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
                    <option value="Hábitat & Mantenimiento">Hábitat & Mantenimiento</option>
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
