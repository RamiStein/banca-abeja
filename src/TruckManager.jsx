import React, { useState, useEffect, useMemo } from 'react';
import { 
  Truck, DollarSign, MapPin, Wrench, Shield, 
  Plus, CheckCircle2, Send, Share2, 
  Trash2, Settings, ArrowUpRight, ArrowDownLeft, 
  Wallet, X, Copy, Check, User, Lock
} from 'lucide-react';

const formatMoney = (val) => {
  if (!val && val !== 0) return '$0';
  return `$${Math.round(val).toLocaleString('es-AR')}`;
};

export default function TruckManager({ onLockAdmin }) {
  // 1. Configuración del Camión e Inquilino
  const defaultSettings = {
    truckName: 'Camión Mercedes-Benz 1726',
    plate: 'AF 742 AB',
    driverName: 'Juan Pérez (Inquilino)',
    driverPhone: '+54 9 11 5555 4444',
    currentOdometer: 168400,
    pricingMode: 'percent', // 'percent' (tipo Uber) | 'fixed_daily' | 'fixed_weekly'
    ownerPercent: 30, // 30% dueño / 70% chofer
    fixedDailyRate: 55000,
    fixedWeeklyRate: 280000,
    fuelMode: 'driver', // 'driver' (a cargo del chofer) | 'deducted' (se descuenta del flete antes de dividir)
    oilInterval: 15000,
    lastOilKm: 160000,
    tireInterval: 60000,
    lastTireKm: 130000,
    insuranceCost: 115000,
    insuranceDueDay: 15
  };

  const [settings, setSettings] = useState(() => {
    const saved = localStorage.getItem('truck_settings');
    return saved ? { ...defaultSettings, ...JSON.parse(saved) } : defaultSettings;
  });

  // Guardar configuración
  useEffect(() => {
    localStorage.setItem('truck_settings', JSON.stringify(settings));
  }, [settings]);

  // 2. Viajes / Fletes
  const defaultTrips = [
    {
      id: 'trip-1',
      date: new Date(Date.now() - 86400000 * 2).toISOString().split('T')[0],
      time: '09:30',
      client: 'Distribuidora Luján',
      origin: 'Mercado Central',
      destination: 'Luján Centro',
      km: 85,
      grossAmount: 180000,
      fuelCost: 45000,
      tollCost: 3500,
      otherExpenses: 0,
      collectedBy: 'driver', // 'driver' | 'owner'
      driverEarnings: 126000,
      ownerEarnings: 54000,
      notes: 'Flete de secos y enlatados. Cobrado en efectivo por el chofer.',
      status: 'pending' // 'pending' | 'settled'
    },
    {
      id: 'trip-2',
      date: new Date(Date.now() - 86400000 * 1).toISOString().split('T')[0],
      time: '14:00',
      client: 'Corralón Nahuel',
      origin: 'Campana Puerto',
      destination: 'Pilar Parque Industrial',
      km: 65,
      grossAmount: 140000,
      fuelCost: 32000,
      tollCost: 2800,
      otherExpenses: 0,
      collectedBy: 'driver',
      driverEarnings: 98000,
      ownerEarnings: 42000,
      notes: 'Pallets de materiales livianos.',
      status: 'pending'
    }
  ];

  const [trips, setTrips] = useState(() => {
    const saved = localStorage.getItem('truck_trips');
    return saved ? JSON.parse(saved) : defaultTrips;
  });

  useEffect(() => {
    localStorage.setItem('truck_trips', JSON.stringify(trips));
  }, [trips]);

  // 3. Pagos / Rendiciones del Chofer hacia el Dueño
  const defaultPayments = [
    {
      id: 'pay-1',
      date: new Date(Date.now() - 86400000 * 3).toISOString().split('T')[0],
      amount: 50000,
      method: 'Transferencia Mercado Pago',
      reference: 'TRANSF-MP-8842',
      notes: 'Pago anticipado de alquiler fin de semana anterior'
    }
  ];

  const [payments, setPayments] = useState(() => {
    const saved = localStorage.getItem('truck_payments');
    return saved ? JSON.parse(saved) : defaultPayments;
  });

  useEffect(() => {
    localStorage.setItem('truck_payments', JSON.stringify(payments));
  }, [payments]);

  // Modales
  const [showTripModal, setShowTripModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  // Filtros
  const [filterPeriod, setFilterPeriod] = useState('all'); // 'week' | 'month' | 'all'

  // Estado del Formulario de Viaje
  const [tripForm, setTripForm] = useState({
    date: new Date().toISOString().split('T')[0],
    time: new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }),
    client: '',
    origin: '',
    destination: '',
    km: '',
    grossAmount: '',
    fuelCost: '',
    tollCost: '',
    otherExpenses: '',
    collectedBy: 'driver',
    notes: ''
  });

  // Estado del Formulario de Pago
  const [paymentForm, setPaymentForm] = useState({
    date: new Date().toISOString().split('T')[0],
    amount: '',
    method: 'Transferencia Bancaria',
    reference: '',
    notes: ''
  });

  // Cálculo en tiempo real del nuevo viaje
  const computedTripPreview = useMemo(() => {
    const gross = parseFloat(tripForm.grossAmount) || 0;
    const fuel = parseFloat(tripForm.fuelCost) || 0;
    const toll = parseFloat(tripForm.tollCost) || 0;
    const extras = parseFloat(tripForm.otherExpenses) || 0;
    const expensesTotal = fuel + toll + extras;

    let baseForSplit = gross;
    if (settings.fuelMode === 'deducted') {
      baseForSplit = Math.max(0, gross - expensesTotal);
    }

    let ownerEarnings = 0;
    let driverEarnings = 0;

    if (settings.pricingMode === 'percent') {
      ownerEarnings = (baseForSplit * (settings.ownerPercent || 30)) / 100;
      driverEarnings = baseForSplit - ownerEarnings;
      if (settings.fuelMode === 'driver') {
        // El chofer asume los gastos de su ganancia
        driverEarnings = driverEarnings - expensesTotal;
      }
    } else {
      // Canon fijo
      ownerEarnings = 0; // Se cobra por período fijo
      driverEarnings = gross - expensesTotal;
    }

    return {
      gross,
      expensesTotal,
      ownerEarnings,
      driverEarnings
    };
  }, [tripForm, settings]);

  // Agregar Viaje
  const handleSaveTrip = (e) => {
    e.preventDefault();
    if (!tripForm.grossAmount || parseFloat(tripForm.grossAmount) <= 0) {
      alert('Ingresá el monto cobrado del viaje.');
      return;
    }

    const km = parseFloat(tripForm.km) || 0;

    const newTrip = {
      id: `trip-${Date.now()}`,
      date: tripForm.date,
      time: tripForm.time,
      client: tripForm.client || 'Flete Particular',
      origin: tripForm.origin || 'Base',
      destination: tripForm.destination || 'Destino',
      km,
      grossAmount: computedTripPreview.gross,
      fuelCost: parseFloat(tripForm.fuelCost) || 0,
      tollCost: parseFloat(tripForm.tollCost) || 0,
      otherExpenses: parseFloat(tripForm.otherExpenses) || 0,
      collectedBy: tripForm.collectedBy,
      ownerEarnings: computedTripPreview.ownerEarnings,
      driverEarnings: computedTripPreview.driverEarnings,
      notes: tripForm.notes,
      status: 'pending'
    };

    setTrips([newTrip, ...trips]);

    // Actualizar odómetro automáticamente si se cargaron km
    if (km > 0) {
      setSettings(prev => ({
        ...prev,
        currentOdometer: (prev.currentOdometer || 0) + km
      }));
    }

    setShowTripModal(false);
    setTripForm({
      date: new Date().toISOString().split('T')[0],
      time: new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }),
      client: '',
      origin: '',
      destination: '',
      km: '',
      grossAmount: '',
      fuelCost: '',
      tollCost: '',
      otherExpenses: '',
      collectedBy: 'driver',
      notes: ''
    });
  };

  // Agregar Pago / Rendición
  const handleSavePayment = (e) => {
    e.preventDefault();
    if (!paymentForm.amount || parseFloat(paymentForm.amount) <= 0) {
      alert('Ingresá el monto de la rendición/pago.');
      return;
    }

    const newPay = {
      id: `pay-${Date.now()}`,
      date: paymentForm.date,
      amount: parseFloat(paymentForm.amount),
      method: paymentForm.method,
      reference: paymentForm.reference,
      notes: paymentForm.notes
    };

    setPayments([newPay, ...payments]);
    setShowPaymentModal(false);
    setPaymentForm({
      date: new Date().toISOString().split('T')[0],
      amount: '',
      method: 'Transferencia Bancaria',
      reference: '',
      notes: ''
    });
  };

  const handleDeleteTrip = (id) => {
    if (window.confirm('¿Eliminar este viaje?')) {
      setTrips(trips.filter(t => t.id !== id));
    }
  };

  const handleDeletePayment = (id) => {
    if (window.confirm('¿Eliminar este registro de cobro?')) {
      setPayments(payments.filter(p => p.id !== id));
    }
  };

  // Cálculos Consolidados de la Cuenta Corriente
  const balanceSummary = useMemo(() => {
    // Filtrar viajes según el período si es necesario
    const now = new Date();
    let filtered = trips;

    if (filterPeriod === 'week') {
      const oneWeekAgo = new Date(now.getTime() - 7 * 86400000).toISOString().split('T')[0];
      filtered = trips.filter(t => t.date >= oneWeekAgo);
    } else if (filterPeriod === 'month') {
      const oneMonthAgo = new Date(now.getTime() - 30 * 86400000).toISOString().split('T')[0];
      filtered = trips.filter(t => t.date >= oneMonthAgo);
    }

    const totalKm = filtered.reduce((acc, t) => acc + (t.km || 0), 0);
    const totalGross = filtered.reduce((acc, t) => acc + (t.grossAmount || 0), 0);
    const totalFuel = filtered.reduce((acc, t) => acc + (t.fuelCost || 0), 0);
    const totalTolls = filtered.reduce((acc, t) => acc + (t.tollCost || 0), 0);

    // Total que le corresponde al dueño por fletes
    const totalOwnerEarned = filtered.reduce((acc, t) => acc + (t.ownerEarnings || 0), 0);
    // Total que le corresponde al chofer
    const totalDriverEarned = filtered.reduce((acc, t) => acc + (t.driverEarnings || 0), 0);

    // Dinero cobrado en mano por el chofer directamente (que le debe al dueño su parte)
    const collectedByDriver = filtered
      .filter(t => t.collectedBy === 'driver')
      .reduce((acc, t) => acc + (t.grossAmount || 0), 0);

    // Dinero cobrado por el dueño (transferencias del cliente directo a Ramiro)
    const collectedByOwner = filtered
      .filter(t => t.collectedBy === 'owner')
      .reduce((acc, t) => acc + (t.grossAmount || 0), 0);

    // Total rendido / pagado por el chofer al dueño
    const totalPaidByDriver = payments.reduce((acc, p) => acc + (p.amount || 0), 0);

    // Canon fijo si aplica
    let fixedRentDue = 0;
    if (settings.pricingMode === 'fixed_weekly') {
      fixedRentDue = settings.fixedWeeklyRate || 0;
    } else if (settings.pricingMode === 'fixed_daily') {
      // Días con al menos un viaje
      const uniqueDays = new Set(filtered.map(t => t.date)).size;
      fixedRentDue = uniqueDays * (settings.fixedDailyRate || 0);
    }

    const ownerTotalDue = settings.pricingMode === 'percent' ? totalOwnerEarned : fixedRentDue;

    // Saldo que el chofer le debe liquidar a Ramiro:
    // (Lo que el dueño debe cobrar) - (Lo que el dueño ya cobró directo de clientes) - (Lo que el chofer ya le transfirió)
    // Nota: Si el chofer cobró todo en mano, debe transferir ownerTotalDue - totalPaidByDriver.
    // Si el dueño cobró viajes, eso cuenta a favor del chofer.
    const debtBalance = ownerTotalDue - (collectedByOwner > 0 ? (totalOwnerEarned - totalDriverEarned) : 0) - totalPaidByDriver;

    return {
      tripsCount: filtered.length,
      totalKm,
      totalGross,
      totalFuel,
      totalTolls,
      totalOwnerEarned: ownerTotalDue,
      totalDriverEarned,
      collectedByDriver,
      collectedByOwner,
      totalPaidByDriver,
      debtBalance
    };
  }, [trips, payments, settings, filterPeriod]);

  // Mantenimiento
  const kmSinceOil = (settings.currentOdometer || 0) - (settings.lastOilKm || 0);
  const kmForOilRemaining = (settings.oilInterval || 15000) - kmSinceOil;
  const oilPercent = Math.min(100, Math.max(0, (kmSinceOil / (settings.oilInterval || 15000)) * 100));

  // Generar texto para WhatsApp
  const generateWhatsAppSummary = () => {
    const text = `🚚 *RESUMEN DE LIQUIDACIÓN - ${settings.truckName}*
👤 *Inquilino/Chofer:* ${settings.driverName}
📅 *Fecha:* ${new Date().toLocaleDateString('es-AR')}
-----------------------------------------
📦 *Viajes realizados:* ${balanceSummary.tripsCount}
🛣️ *Kilómetros:* ${balanceSummary.totalKm} km
💰 *Facturación Bruta Total:* ${formatMoney(balanceSummary.totalGross)}
⛽ *Combustible registrado:* ${formatMoney(balanceSummary.totalFuel)}
-----------------------------------------
💼 *Alquiler / Canon Dueño:* ${formatMoney(balanceSummary.totalOwnerEarned)}
💳 *Rendiciones / Pagos recibidos:* ${formatMoney(balanceSummary.totalPaidByDriver)}
-----------------------------------------
👉 *SALDO PENDIENTE A LIQUIDAR:* ${formatMoney(Math.max(0, balanceSummary.debtBalance))}
${balanceSummary.debtBalance <= 0 ? '✅ ¡Cuentas al día! Gracias.' : '⚠️ Por favor confirmar cuando realices la transferencia.'}`;
    return text;
  };

  const handleCopyWhatsApp = () => {
    navigator.clipboard.writeText(generateWhatsAppSummary());
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2500);
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Barra Superior de Identificación y Acciones Rápidas */}
      <div className="card p-5 flex flex-wrap items-center justify-between gap-4" style={{ borderLeft: '4px solid #f59e0b' }}>
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-xl" style={{ backgroundColor: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b' }}>
            <Truck size={28} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold">{settings.truckName}</h2>
              <span className="badge" style={{ backgroundColor: 'rgba(245, 158, 11, 0.2)', color: '#f59e0b', fontSize: '0.75rem', padding: '2px 8px', borderRadius: '4px' }}>
                {settings.plate}
              </span>
            </div>
            <p className="text-secondary text-sm flex items-center gap-2 mt-0.5">
              <User size={14} /> Chofer actual: <strong className="text-white">{settings.driverName}</strong>
              <span className="text-xs px-2 py-0.5 rounded bg-white/5">
                {settings.pricingMode === 'percent' ? `${settings.ownerPercent}% Alquiler Dueño` : settings.pricingMode === 'fixed_daily' ? `${formatMoney(settings.fixedDailyRate)} / día` : `${formatMoney(settings.fixedWeeklyRate)} / semana`}
              </span>
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {onLockAdmin && (
            <button 
              className="btn btn-outline text-xs" 
              style={{ borderColor: 'rgba(239, 68, 68, 0.4)', color: 'var(--danger)', padding: '6px 10px' }}
              onClick={onLockAdmin}
              title="Cerrar y bloquear sesión de Administrador"
            >
              <Lock size={14} />
              Bloquear Admin
            </button>
          )}
          <button 
            className="btn btn-outline text-xs" 
            style={{ borderColor: 'var(--border-color)', padding: '6px 12px' }}
            onClick={() => setShowSettingsModal(true)}
            title="Configurar valores del camión y porcentajes"
          >
            <Settings size={15} />
            Configuración
          </button>
          <button 
            className="btn btn-outline text-xs" 
            style={{ borderColor: '#22c55e', color: '#22c55e', padding: '6px 12px' }}
            onClick={() => setShowShareModal(true)}
            title="Generar resumen para enviar al chofer por WhatsApp"
          >
            <Share2 size={15} />
            Liquidación WhatsApp
          </button>
          <button 
            className="btn btn-primary text-xs" 
            style={{ backgroundColor: '#10b981', padding: '6px 12px' }}
            onClick={() => setShowPaymentModal(true)}
            title="Registrar dinero que te transfiere o entrega el chofer"
          >
            <ArrowDownLeft size={16} />
            Registrar Cobro
          </button>
          <button 
            className="btn btn-primary text-xs" 
            style={{ backgroundColor: '#f59e0b', color: '#000', fontWeight: 600, padding: '6px 14px' }}
            onClick={() => setShowTripModal(true)}
          >
            <Plus size={16} />
            Cargar Flete / Viaje
          </button>
        </div>
      </div>

      {/* Tarjetas Principales de KPI y Cuenta Corriente */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* KPI 1: Saldo Pendiente del Inquilino */}
        <div className="card p-4 relative overflow-hidden" style={{ borderColor: balanceSummary.debtBalance > 0 ? '#f59e0b' : '#10b981' }}>
          <div className="flex items-center justify-between text-secondary text-xs mb-1">
            <span>SALDO PENDIENTE A LIQUIDAR</span>
            <Wallet size={16} className={balanceSummary.debtBalance > 0 ? "text-warning" : "text-success"} />
          </div>
          <div className={`text-2xl font-bold ${balanceSummary.debtBalance > 0 ? "text-warning" : "text-success"}`}>
            {formatMoney(Math.max(0, balanceSummary.debtBalance))}
          </div>
          <div className="text-xs text-secondary mt-1 flex items-center justify-between">
            <span>{balanceSummary.debtBalance > 0 ? 'El chofer debe transferir' : 'Al día con las cuentas'}</span>
            <span className="text-white font-medium">Cobrado: {formatMoney(balanceSummary.totalPaidByDriver)}</span>
          </div>
        </div>

        {/* KPI 2: Recaudación Bruta de Fletes */}
        <div className="card p-4">
          <div className="flex items-center justify-between text-secondary text-xs mb-1">
            <span>FACTURACIÓN TOTAL FLETES</span>
            <DollarSign size={16} className="text-accent" />
          </div>
          <div className="text-2xl font-bold text-white">
            {formatMoney(balanceSummary.totalGross)}
          </div>
          <div className="text-xs text-secondary mt-1 flex items-center justify-between">
            <span>{balanceSummary.tripsCount} viajes registrados</span>
            <span>{balanceSummary.totalKm} km rodados</span>
          </div>
        </div>

        {/* KPI 3: Ganancia del Dueño (Alquiler) */}
        <div className="card p-4">
          <div className="flex items-center justify-between text-secondary text-xs mb-1">
            <span>TU GANANCIA (ALQUILER CAMIÓN)</span>
            <ArrowUpRight size={16} className="text-success" />
          </div>
          <div className="text-2xl font-bold text-success">
            {formatMoney(balanceSummary.totalOwnerEarned)}
          </div>
          <div className="text-xs text-secondary mt-1">
            {settings.pricingMode === 'percent' ? `${settings.ownerPercent}% de comisión pactada` : 'Según canon fijo acordado'}
          </div>
        </div>

        {/* KPI 4: Odómetro & Mantenimiento */}
        <div className="card p-4">
          <div className="flex items-center justify-between text-secondary text-xs mb-1">
            <span>ODÓMETRO & SERVICE</span>
            <Wrench size={16} className={kmForOilRemaining < 2000 ? "text-danger" : "text-secondary"} />
          </div>
          <div className="text-2xl font-bold text-white">
            {(settings.currentOdometer || 0).toLocaleString('es-AR')} <span className="text-xs font-normal text-secondary">km</span>
          </div>
          <div className="mt-1.5">
            <div className="flex justify-between text-[11px] text-secondary mb-1">
              <span>Aceite: {kmForOilRemaining > 0 ? `quedan ${kmForOilRemaining} km` : '¡Service vencido!'}</span>
              <span>{Math.round(oilPercent)}%</span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
              <div 
                className="h-full transition-all" 
                style={{ 
                  width: `${oilPercent}%`, 
                  backgroundColor: kmForOilRemaining < 2000 ? 'var(--danger)' : kmForOilRemaining < 4000 ? 'var(--warning)' : 'var(--success)' 
                }} 
              />
            </div>
          </div>
        </div>
      </div>

      {/* Selector de Período y Filtro */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs text-secondary">Ver viajes de:</span>
          <div className="inline-flex rounded-lg p-0.5 bg-white/5 border border-white/10 text-xs">
            <button 
              className={`px-3 py-1 rounded-md transition-all ${filterPeriod === 'all' ? 'bg-white/20 text-white font-medium' : 'text-secondary'}`}
              onClick={() => setFilterPeriod('all')}
            >
              Todos ({trips.length})
            </button>
            <button 
              className={`px-3 py-1 rounded-md transition-all ${filterPeriod === 'month' ? 'bg-white/20 text-white font-medium' : 'text-secondary'}`}
              onClick={() => setFilterPeriod('month')}
            >
              Últimos 30 días
            </button>
            <button 
              className={`px-3 py-1 rounded-md transition-all ${filterPeriod === 'week' ? 'bg-white/20 text-white font-medium' : 'text-secondary'}`}
              onClick={() => setFilterPeriod('week')}
            >
              Esta semana
            </button>
          </div>
        </div>

        <div className="text-xs text-secondary flex items-center gap-2">
          <span>Combustible registrado: <strong>{formatMoney(balanceSummary.totalFuel)}</strong></span>
          <span>•</span>
          <span>Peajes: <strong>{formatMoney(balanceSummary.totalTolls)}</strong></span>
        </div>
      </div>

      {/* Listado de Viajes / Fletes (Estilo Uber) */}
      <div className="card p-0 overflow-hidden">
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <h3 className="font-bold flex items-center gap-2 text-base">
            <Truck size={18} className="text-warning" />
            Registro de Fletes & Viajes Realizados
          </h3>
          <span className="text-xs text-secondary">
            {trips.length} viajes registrados
          </span>
        </div>

        {trips.length === 0 ? (
          <div className="p-8 text-center text-secondary text-sm">
            <Truck size={36} className="mx-auto mb-2 opacity-30" />
            No hay fletes registrados aún. Hacé clic en "Cargar Flete / Viaje" para asentar el primero.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs" style={{ borderCollapse: 'collapse' }}>
              <thead>
                <tr className="border-b border-white/10 text-secondary" style={{ backgroundColor: 'rgba(255,255,255,0.02)' }}>
                  <th className="p-3">FECHA / HORA</th>
                  <th className="p-3">CLIENTE / RUTA</th>
                  <th className="p-3">KM</th>
                  <th className="p-3">FACTURADO</th>
                  <th className="p-3">GASTOS (GASOIL/PEAJE)</th>
                  <th className="p-3">ALQUILER DUEÑO</th>
                  <th className="p-3">CHOFER</th>
                  <th className="p-3">COBRANZA</th>
                  <th className="p-3 text-right">ACCIONES</th>
                </tr>
              </thead>
              <tbody>
                {trips.map(trip => (
                  <tr key={trip.id} className="border-b border-white/5 hover:bg-white/5 transition-all">
                    <td className="p-3 text-white whitespace-nowrap">
                      <div>{trip.date}</div>
                      <div className="text-[11px] text-secondary">{trip.time || ''}</div>
                    </td>
                    <td className="p-3">
                      <div className="font-semibold text-white">{trip.client}</div>
                      <div className="text-[11px] text-secondary flex items-center gap-1 mt-0.5">
                        <MapPin size={11} className="text-accent" />
                        <span>{trip.origin}</span> → <span>{trip.destination}</span>
                      </div>
                      {trip.notes && <div className="text-[10px] text-secondary/70 italic mt-0.5">"{trip.notes}"</div>}
                    </td>
                    <td className="p-3 text-white font-medium whitespace-nowrap">
                      {trip.km} km
                    </td>
                    <td className="p-3 font-bold text-white whitespace-nowrap">
                      {formatMoney(trip.grossAmount)}
                    </td>
                    <td className="p-3 text-secondary whitespace-nowrap">
                      <div>Gasoil: {formatMoney(trip.fuelCost)}</div>
                      {trip.tollCost > 0 && <div className="text-[10px]">Peaje: {formatMoney(trip.tollCost)}</div>}
                    </td>
                    <td className="p-3 font-semibold text-warning whitespace-nowrap">
                      {formatMoney(trip.ownerEarnings)}
                    </td>
                    <td className="p-3 font-semibold text-success whitespace-nowrap">
                      {formatMoney(trip.driverEarnings)}
                    </td>
                    <td className="p-3 whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-medium ${trip.collectedBy === 'driver' ? 'bg-amber-500/20 text-amber-300' : 'bg-emerald-500/20 text-emerald-300'}`}>
                        {trip.collectedBy === 'driver' ? 'Chofer cobró' : 'Dueño cobró'}
                      </span>
                    </td>
                    <td className="p-3 text-right whitespace-nowrap">
                      <button 
                        className="btn btn-outline p-1.5 text-danger border-transparent hover:bg-danger/20"
                        onClick={() => handleDeleteTrip(trip.id)}
                        title="Eliminar viaje"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Historial de Cobros / Rendiciones Recibidas */}
      <div className="card p-0 overflow-hidden">
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <h3 className="font-bold flex items-center gap-2 text-base">
            <CheckCircle2 size={18} className="text-success" />
            Rendiciones y Pagos de Alquiler Recibidos
          </h3>
          <span className="text-xs text-secondary">
            Total Rendido: <strong className="text-success">{formatMoney(balanceSummary.totalPaidByDriver)}</strong>
          </span>
        </div>

        {payments.length === 0 ? (
          <div className="p-6 text-center text-secondary text-sm">
            Aún no hay cobros registrados. Cuando el chofer te transfiera, tocalo en "Registrar Cobro".
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs" style={{ borderCollapse: 'collapse' }}>
              <thead>
                <tr className="border-b border-white/10 text-secondary" style={{ backgroundColor: 'rgba(255,255,255,0.02)' }}>
                  <th className="p-3">FECHA</th>
                  <th className="p-3">MÉTODO / REFERENCIA</th>
                  <th className="p-3">NOTAS</th>
                  <th className="p-3">MONTO RECIBIDO</th>
                  <th className="p-3 text-right">ACCIONES</th>
                </tr>
              </thead>
              <tbody>
                {payments.map(pay => (
                  <tr key={pay.id} className="border-b border-white/5 hover:bg-white/5 transition-all">
                    <td className="p-3 text-white whitespace-nowrap">{pay.date}</td>
                    <td className="p-3">
                      <div className="text-white font-medium">{pay.method}</div>
                      {pay.reference && <div className="text-[11px] text-secondary">Ref: {pay.reference}</div>}
                    </td>
                    <td className="p-3 text-secondary">{pay.notes || '-'}</td>
                    <td className="p-3 font-bold text-success text-sm whitespace-nowrap">
                      +{formatMoney(pay.amount)}
                    </td>
                    <td className="p-3 text-right whitespace-nowrap">
                      <button 
                        className="btn btn-outline p-1.5 text-danger border-transparent hover:bg-danger/20"
                        onClick={() => handleDeletePayment(pay.id)}
                        title="Eliminar este cobro"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* MODAL: CARGAR NUEVO FLETE / VIAJE */}
      {/* ========================================================================= */}
      {showTripModal && (
        <div className="modal-overlay" onClick={() => setShowTripModal(false)}>
          <div className="card w-full max-w-lg relative" onClick={e => e.stopPropagation()} style={{ width: '550px', maxHeight: '90vh', overflowY: 'auto' }}>
            <button className="btn btn-outline absolute top-4 right-4 p-1 border-none" onClick={() => setShowTripModal(false)}>
              <X size={20} />
            </button>

            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Truck size={22} className="text-warning" /> Cargar Nuevo Flete / Viaje
            </h3>

            <form onSubmit={handleSaveTrip} className="flex flex-col gap-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-secondary mb-1 block">Fecha</label>
                  <input 
                    type="date" 
                    className="input w-full" 
                    value={tripForm.date} 
                    onChange={e => setTripForm({ ...tripForm, date: e.target.value })} 
                    required 
                  />
                </div>
                <div>
                  <label className="text-xs text-secondary mb-1 block">Hora aproximada</label>
                  <input 
                    type="time" 
                    className="input w-full" 
                    value={tripForm.time} 
                    onChange={e => setTripForm({ ...tripForm, time: e.target.value })} 
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-secondary mb-1 block">Cliente / Empresa del Flete</label>
                <input 
                  type="text" 
                  className="input w-full" 
                  placeholder="Ej: Distribuidora Norte, Mudanza Juan, etc."
                  value={tripForm.client} 
                  onChange={e => setTripForm({ ...tripForm, client: e.target.value })} 
                  required 
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-secondary mb-1 block">Origen</label>
                  <input 
                    type="text" 
                    className="input w-full" 
                    placeholder="Ej: Retiro / Galpón"
                    value={tripForm.origin} 
                    onChange={e => setTripForm({ ...tripForm, origin: e.target.value })} 
                  />
                </div>
                <div>
                  <label className="text-xs text-secondary mb-1 block">Destino</label>
                  <input 
                    type="text" 
                    className="input w-full" 
                    placeholder="Ej: Pilar / Rosario"
                    value={tripForm.destination} 
                    onChange={e => setTripForm({ ...tripForm, destination: e.target.value })} 
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-secondary mb-1 block">Kilómetros recorridos</label>
                  <input 
                    type="number" 
                    className="input w-full" 
                    placeholder="Ej: 120"
                    value={tripForm.km} 
                    onChange={e => setTripForm({ ...tripForm, km: e.target.value })} 
                  />
                </div>
                <div>
                  <label className="text-xs text-secondary mb-1 block font-semibold text-warning">
                    Monto Cobrado al Cliente ($) *
                  </label>
                  <input 
                    type="number" 
                    className="input w-full" 
                    placeholder="Ej: 150000"
                    value={tripForm.grossAmount} 
                    onChange={e => setTripForm({ ...tripForm, grossAmount: e.target.value })} 
                    required 
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-secondary mb-1 block">Gasto Gasoil ($)</label>
                  <input 
                    type="number" 
                    className="input w-full" 
                    placeholder="Ej: 35000"
                    value={tripForm.fuelCost} 
                    onChange={e => setTripForm({ ...tripForm, fuelCost: e.target.value })} 
                  />
                </div>
                <div>
                  <label className="text-xs text-secondary mb-1 block">Peajes / Extras ($)</label>
                  <input 
                    type="number" 
                    className="input w-full" 
                    placeholder="Ej: 4500"
                    value={tripForm.tollCost} 
                    onChange={e => setTripForm({ ...tripForm, tollCost: e.target.value })} 
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-secondary mb-1 block">¿Quién cobró el dinero del flete?</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    className={`btn text-xs py-2 ${tripForm.collectedBy === 'driver' ? 'btn-primary' : 'btn-outline'}`}
                    style={{ backgroundColor: tripForm.collectedBy === 'driver' ? '#f59e0b' : 'transparent', color: tripForm.collectedBy === 'driver' ? '#000' : 'inherit' }}
                    onClick={() => setTripForm({ ...tripForm, collectedBy: 'driver' })}
                  >
                    El Chofer en mano / su MP
                  </button>
                  <button
                    type="button"
                    className={`btn text-xs py-2 ${tripForm.collectedBy === 'owner' ? 'btn-primary' : 'btn-outline'}`}
                    style={{ backgroundColor: tripForm.collectedBy === 'owner' ? '#10b981' : 'transparent', color: tripForm.collectedBy === 'owner' ? '#fff' : 'inherit' }}
                    onClick={() => setTripForm({ ...tripForm, collectedBy: 'owner' })}
                  >
                    El Dueño (Ramiro) por transf.
                  </button>
                </div>
              </div>

              {/* Vista previa de la liquidación instantánea */}
              {computedTripPreview.gross > 0 && (
                <div className="p-3 rounded-lg bg-black/40 border border-white/10 text-xs">
                  <div className="text-secondary font-semibold mb-1">Previsualización de Liquidación:</div>
                  <div className="flex justify-between py-0.5">
                    <span>Cobro bruto:</span>
                    <strong className="text-white">{formatMoney(computedTripPreview.gross)}</strong>
                  </div>
                  <div className="flex justify-between py-0.5 text-warning font-semibold">
                    <span>Alquiler Dueño ({settings.ownerPercent}%):</span>
                    <span>+{formatMoney(computedTripPreview.ownerEarnings)}</span>
                  </div>
                  <div className="flex justify-between py-0.5 text-success">
                    <span>Parte Chofer:</span>
                    <span>+{formatMoney(computedTripPreview.driverEarnings)}</span>
                  </div>
                </div>
              )}

              <div>
                <label className="text-xs text-secondary mb-1 block">Notas u Observaciones</label>
                <input 
                  type="text" 
                  className="input w-full" 
                  placeholder="Ej: Carga pesada, llovió en ruta, etc."
                  value={tripForm.notes} 
                  onChange={e => setTripForm({ ...tripForm, notes: e.target.value })} 
                />
              </div>

              <button type="submit" className="btn btn-primary mt-2" style={{ backgroundColor: '#f59e0b', color: '#000', fontWeight: 600 }}>
                Guardar Flete & Calcular Liquidación
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: REGISTRAR COBRO / PAGO DE ALQUILER */}
      {/* ========================================================================= */}
      {showPaymentModal && (
        <div className="modal-overlay" onClick={() => setShowPaymentModal(false)}>
          <div className="card w-full max-w-md relative" onClick={e => e.stopPropagation()} style={{ width: '480px' }}>
            <button className="btn btn-outline absolute top-4 right-4 p-1 border-none" onClick={() => setShowPaymentModal(false)}>
              <X size={20} />
            </button>

            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <ArrowDownLeft size={22} className="text-success" /> Registrar Cobro del Chofer
            </h3>

            <p className="text-xs text-secondary mb-3">
              Anotá aquí cuando el chofer te transfiera parte de su recaudación o el canon de alquiler.
            </p>

            <form onSubmit={handleSavePayment} className="flex flex-col gap-3">
              <div>
                <label className="text-xs text-secondary mb-1 block">Fecha de Pago</label>
                <input 
                  type="date" 
                  className="input w-full" 
                  value={paymentForm.date} 
                  onChange={e => setPaymentForm({ ...paymentForm, date: e.target.value })} 
                  required 
                />
              </div>

              <div>
                <label className="text-xs text-secondary mb-1 block font-semibold text-success">Monto Recibido ($) *</label>
                <input 
                  type="number" 
                  className="input w-full" 
                  placeholder="Ej: 80000"
                  value={paymentForm.amount} 
                  onChange={e => setPaymentForm({ ...paymentForm, amount: e.target.value })} 
                  required 
                />
              </div>

              <div>
                <label className="text-xs text-secondary mb-1 block">Medio de Pago</label>
                <select 
                  className="input w-full" 
                  value={paymentForm.method} 
                  onChange={e => setPaymentForm({ ...paymentForm, method: e.target.value })}
                >
                  <option value="Transferencia Bancaria">Transferencia Bancaria</option>
                  <option value="Mercado Pago">Mercado Pago</option>
                  <option value="Efectivo en mano">Efectivo en mano</option>
                  <option value="Otro">Otro</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-secondary mb-1 block">Comprobante / N° de Referencia</label>
                <input 
                  type="text" 
                  className="input w-full" 
                  placeholder="Ej: OP-991244"
                  value={paymentForm.reference} 
                  onChange={e => setPaymentForm({ ...paymentForm, reference: e.target.value })} 
                />
              </div>

              <div>
                <label className="text-xs text-secondary mb-1 block">Notas</label>
                <input 
                  type="text" 
                  className="input w-full" 
                  placeholder="Ej: Liquidación parcial semana 1"
                  value={paymentForm.notes} 
                  onChange={e => setPaymentForm({ ...paymentForm, notes: e.target.value })} 
                />
              </div>

              <button type="submit" className="btn btn-primary mt-2" style={{ backgroundColor: '#10b981' }}>
                Asentar Cobro en Cuenta Corriente
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: COMPARTIR LIQUIDACIÓN POR WHATSAPP */}
      {/* ========================================================================= */}
      {showShareModal && (
        <div className="modal-overlay" onClick={() => setShowShareModal(false)}>
          <div className="card w-full max-w-md relative" onClick={e => e.stopPropagation()} style={{ width: '480px' }}>
            <button className="btn btn-outline absolute top-4 right-4 p-1 border-none" onClick={() => setShowShareModal(false)}>
              <X size={20} />
            </button>

            <h3 className="text-xl font-bold mb-3 flex items-center gap-2">
              <Share2 size={22} className="text-success" /> Resumen para WhatsApp
            </h3>

            <p className="text-xs text-secondary mb-3">
              Copia este mensaje o abrilo directo en WhatsApp para enviarle la liquidación al chofer.
            </p>

            <div className="p-3.5 rounded-lg bg-black/60 border border-white/10 font-mono text-xs text-secondary whitespace-pre-wrap leading-relaxed select-all">
              {generateWhatsAppSummary()}
            </div>

            <div className="flex gap-2 mt-4">
              <button 
                className="btn btn-primary flex-1" 
                style={{ backgroundColor: '#22c55e', color: '#fff' }}
                onClick={handleCopyWhatsApp}
              >
                {copySuccess ? <Check size={16} /> : <Copy size={16} />}
                {copySuccess ? '¡Copiado al Portapapeles!' : 'Copiar Mensaje'}
              </button>
              
              {settings.driverPhone && (
                <a 
                  href={`https://wa.me/${settings.driverPhone.replace(/[^\d]/g, '')}?text=${encodeURIComponent(generateWhatsAppSummary())}`} 
                  target="_blank" 
                  rel="noreferrer" 
                  className="btn btn-outline" 
                  style={{ borderColor: '#22c55e', color: '#22c55e' }}
                >
                  <Send size={16} /> Abrir WhatsApp
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: CONFIGURACIÓN DEL CAMIÓN Y REGLAS DE COBRO */}
      {/* ========================================================================= */}
      {showSettingsModal && (
        <div className="modal-overlay" onClick={() => setShowSettingsModal(false)}>
          <div className="card w-full max-w-lg relative" onClick={e => e.stopPropagation()} style={{ width: '540px', maxHeight: '90vh', overflowY: 'auto' }}>
            <button className="btn btn-outline absolute top-4 right-4 p-1 border-none" onClick={() => setShowSettingsModal(false)}>
              <X size={20} />
            </button>

            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Settings size={22} className="text-accent" /> Configuración del Camión & Alquiler
            </h3>

            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-secondary mb-1 block">Nombre / Modelo del Camión</label>
                  <input 
                    type="text" 
                    className="input w-full" 
                    value={settings.truckName} 
                    onChange={e => setSettings({ ...settings, truckName: e.target.value })} 
                  />
                </div>
                <div>
                  <label className="text-xs text-secondary mb-1 block">Patente</label>
                  <input 
                    type="text" 
                    className="input w-full" 
                    value={settings.plate} 
                    onChange={e => setSettings({ ...settings, plate: e.target.value })} 
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-secondary mb-1 block">Nombre del Inquilino / Chofer</label>
                  <input 
                    type="text" 
                    className="input w-full" 
                    value={settings.driverName} 
                    onChange={e => setSettings({ ...settings, driverName: e.target.value })} 
                  />
                </div>
                <div>
                  <label className="text-xs text-secondary mb-1 block">Teléfono WhatsApp (con código país)</label>
                  <input 
                    type="text" 
                    className="input w-full" 
                    placeholder="Ej: +54 9 11 1234 5678"
                    value={settings.driverPhone} 
                    onChange={e => setSettings({ ...settings, driverPhone: e.target.value })} 
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-white/10">
                <label className="text-xs font-semibold text-warning mb-2 block">Modalidad de Cobro del Alquiler</label>
                <div className="grid grid-cols-3 gap-2 mb-3">
                  <button
                    type="button"
                    className={`btn text-xs py-2 ${settings.pricingMode === 'percent' ? 'btn-primary' : 'btn-outline'}`}
                    style={{ backgroundColor: settings.pricingMode === 'percent' ? '#f59e0b' : 'transparent', color: settings.pricingMode === 'percent' ? '#000' : 'inherit' }}
                    onClick={() => setSettings({ ...settings, pricingMode: 'percent' })}
                  >
                    Porcentaje (Uber)
                  </button>
                  <button
                    type="button"
                    className={`btn text-xs py-2 ${settings.pricingMode === 'fixed_daily' ? 'btn-primary' : 'btn-outline'}`}
                    style={{ backgroundColor: settings.pricingMode === 'fixed_daily' ? '#f59e0b' : 'transparent', color: settings.pricingMode === 'fixed_daily' ? '#000' : 'inherit' }}
                    onClick={() => setSettings({ ...settings, pricingMode: 'fixed_daily' })}
                  >
                    Canon Diario
                  </button>
                  <button
                    type="button"
                    className={`btn text-xs py-2 ${settings.pricingMode === 'fixed_weekly' ? 'btn-primary' : 'btn-outline'}`}
                    style={{ backgroundColor: settings.pricingMode === 'fixed_weekly' ? '#f59e0b' : 'transparent', color: settings.pricingMode === 'fixed_weekly' ? '#000' : 'inherit' }}
                    onClick={() => setSettings({ ...settings, pricingMode: 'fixed_weekly' })}
                  >
                    Canon Semanal
                  </button>
                </div>

                {settings.pricingMode === 'percent' ? (
                  <div>
                    <label className="text-xs text-secondary mb-1 block">% de Comisión para el Dueño (Ramiro)</label>
                    <div className="flex items-center gap-2">
                      <input 
                        type="number" 
                        className="input" 
                        style={{ width: '100px' }}
                        value={settings.ownerPercent} 
                        onChange={e => setSettings({ ...settings, ownerPercent: parseFloat(e.target.value) || 0 })} 
                      />
                      <span className="text-xs text-secondary">% Dueño • {(100 - (settings.ownerPercent || 0))}% Chofer</span>
                    </div>
                  </div>
                ) : settings.pricingMode === 'fixed_daily' ? (
                  <div>
                    <label className="text-xs text-secondary mb-1 block">Canon Fijo por Día ($)</label>
                    <input 
                      type="number" 
                      className="input w-full" 
                      value={settings.fixedDailyRate} 
                      onChange={e => setSettings({ ...settings, fixedDailyRate: parseFloat(e.target.value) || 0 })} 
                    />
                  </div>
                ) : (
                  <div>
                    <label className="text-xs text-secondary mb-1 block">Canon Fijo por Semana ($)</label>
                    <input 
                      type="number" 
                      className="input w-full" 
                      value={settings.fixedWeeklyRate} 
                      onChange={e => setSettings({ ...settings, fixedWeeklyRate: parseFloat(e.target.value) || 0 })} 
                    />
                  </div>
                )}
              </div>

              <div className="pt-2 border-t border-white/10">
                <label className="text-xs font-semibold text-white mb-2 block">Odómetro y Mantenimiento</label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-secondary mb-1 block">Odómetro Actual (km)</label>
                    <input 
                      type="number" 
                      className="input w-full" 
                      value={settings.currentOdometer} 
                      onChange={e => setSettings({ ...settings, currentOdometer: parseFloat(e.target.value) || 0 })} 
                    />
                  </div>
                  <div>
                    <label className="text-xs text-secondary mb-1 block">Último cambio de aceite (km)</label>
                    <input 
                      type="number" 
                      className="input w-full" 
                      value={settings.lastOilKm} 
                      onChange={e => setSettings({ ...settings, lastOilKm: parseFloat(e.target.value) || 0 })} 
                    />
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-white/10">
                <label className="text-xs font-semibold text-warning mb-2 flex items-center gap-1.5">
                  <Shield size={14} /> PIN de Acceso Administrador
                </label>
                <div className="flex items-center gap-2">
                  <input 
                    type="text" 
                    className="input font-mono text-center tracking-wider" 
                    style={{ width: '130px' }}
                    defaultValue={localStorage.getItem('banca_abeja_admin_pin') || '1234'} 
                    onChange={e => {
                      if (e.target.value.trim()) {
                        localStorage.setItem('banca_abeja_admin_pin', e.target.value.trim());
                      }
                    }} 
                    placeholder="1234"
                  />
                  <span className="text-xs text-secondary">Clave requerida para ver esta pestaña (por defecto: 1234)</span>
                </div>
              </div>

              <button 
                type="button" 
                className="btn btn-primary mt-2" 
                onClick={() => setShowSettingsModal(false)}
              >
                Cerrar y Guardar Cambios
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
