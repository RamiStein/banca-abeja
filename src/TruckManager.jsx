import React, { useState, useEffect, useMemo } from 'react';
import { 
  Truck, DollarSign, MapPin, Wrench, Shield, 
  Plus, Send, Share2, 
  Trash2, Settings, ArrowDownLeft, 
  Wallet, X, Copy, Check, User, Lock, Calendar, 
  CalendarDays, FileText, ChevronLeft, ChevronRight, Eye, CreditCard
} from 'lucide-react';
import TruckInvoiceModal from './components/TruckInvoiceModal';

const formatMoney = (val) => {
  if (!val && val !== 0) return '$0';
  return `$${Math.round(val).toLocaleString('es-AR')}`;
};

export default function TruckManager({ onLockAdmin }) {
  // Sub-pestaña activa dentro de la gestión del camión
  const [activeSubTab, setActiveSubTab] = useState('calendar'); // 'calendar' | 'trips' | 'invoices' | 'fleet'

  // 1. Configuración del Camión y Valores Definidos por el Dueño
  const defaultSettings = {
    truckName: 'Camión Mercedes-Benz 1726',
    plate: 'AF 742 AB',
    ownerName: 'Ramiro Stein',
    ownerPhone: '+54 9 11 1234 5678',
    ownerAlias: 'RAMIRO.CAMION.MP',
    ownerCbu: '0000003100094827104821',
    driverName: 'Juan Pérez (Inquilino)',
    driverPhone: '+54 9 11 5555 4444',
    driverDni: '38.452.190',
    currentOdometer: 168400,
    dailyRentalRate: 45000, // VALOR DIARIO DEFINIDO POR EL DUEÑO
    weeklyRentalRate: 260000, // VALOR SEMANAL DEFINIDO POR EL DUEÑO
    kmLimitPerDay: 250, // Límite diario de km sugerido
    extraKmCost: 150, // Costo por km excedente
    pricingMode: 'fixed_daily', // 'fixed_daily' | 'percent' | 'fixed_weekly'
    ownerPercent: 30, // 30% dueño / 70% chofer si usa modo Uber
    fuelMode: 'driver', // 'driver' (a cargo del chofer) | 'deducted'
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

  useEffect(() => {
    localStorage.setItem('truck_settings', JSON.stringify(settings));
  }, [settings]);

  // 2. Períodos / Días de Alquiler en el Calendario
  const defaultRentals = [
    {
      id: 'rent-1',
      invoiceNumber: 'INV-2026-001',
      tenantName: 'Juan Pérez',
      tenantPhone: '+54 9 11 5555 4444',
      tenantDni: '38.452.190',
      startDate: new Date(Date.now() - 86400000 * 7).toISOString().split('T')[0],
      endDate: new Date(Date.now() - 86400000 * 1).toISOString().split('T')[0],
      daysCount: 7,
      dailyRate: 45000,
      subtotal: 315000,
      extraKmCost: 0,
      expensesAdjustment: 0,
      totalAmount: 315000,
      paidAmount: 200000,
      balanceDue: 115000,
      status: 'confirmed',
      notes: 'Distribución semanal logística zona norte'
    },
    {
      id: 'rent-2',
      invoiceNumber: 'INV-2026-002',
      tenantName: 'Juan Pérez',
      tenantPhone: '+54 9 11 5555 4444',
      tenantDni: '38.452.190',
      startDate: new Date(Date.now() + 86400000 * 1).toISOString().split('T')[0],
      endDate: new Date(Date.now() + 86400000 * 5).toISOString().split('T')[0],
      daysCount: 5,
      dailyRate: 45000,
      subtotal: 225000,
      extraKmCost: 0,
      expensesAdjustment: 0,
      totalAmount: 225000,
      paidAmount: 0,
      balanceDue: 225000,
      status: 'confirmed',
      notes: 'Fletes programados para corralón'
    }
  ];

  const [rentals, setRentals] = useState(() => {
    const saved = localStorage.getItem('truck_rentals');
    return saved ? JSON.parse(saved) : defaultRentals;
  });

  useEffect(() => {
    localStorage.setItem('truck_rentals', JSON.stringify(rentals));
  }, [rentals]);

  // 3. Viajes / Fletes (Estilo Uber)
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
      collectedBy: 'driver',
      driverEarnings: 126000,
      ownerEarnings: 54000,
      notes: 'Flete de secos y enlatados.',
      status: 'pending'
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

  // 4. Pagos / Rendiciones Recibidas del Inquilino
  const defaultPayments = [
    {
      id: 'pay-1',
      date: new Date(Date.now() - 86400000 * 3).toISOString().split('T')[0],
      amount: 200000,
      method: 'Transferencia Bancaria',
      reference: 'TRANSF-MP-8842',
      rentalId: 'rent-1',
      notes: 'Pago anticipo alquiler semana 1'
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
  const [showRentalModal, setShowRentalModal] = useState(false);
  const [showTripModal, setShowTripModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  // Visor de Factura / Invoice
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  // Navegación del Calendario (Mes actual)
  const [currentCalendarDate, setCurrentCalendarDate] = useState(new Date());

  // Formulario de Nueva Asignación de Días de Alquiler
  const [rentalForm, setRentalForm] = useState({
    tenantName: settings.driverName || 'Juan Pérez',
    tenantPhone: settings.driverPhone || '',
    tenantDni: settings.driverDni || '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 86400000 * 4).toISOString().split('T')[0],
    dailyRate: settings.dailyRentalRate || 45000, // PRECIO DEFINIDO POR EL DUEÑO
    extraKmCost: 0,
    expensesAdjustment: 0,
    paidAmount: '',
    notes: ''
  });

  // Formulario de Nuevo Viaje
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

  // Formulario de Pago
  const [paymentForm, setPaymentForm] = useState({
    date: new Date().toISOString().split('T')[0],
    amount: '',
    method: 'Transferencia Bancaria',
    reference: '',
    rentalId: '',
    notes: ''
  });

  // Días calculados en el formulario de alquiler
  const computedRentalDays = useMemo(() => {
    if (!rentalForm.startDate || !rentalForm.endDate) return 1;
    const start = new Date(rentalForm.startDate);
    const end = new Date(rentalForm.endDate);
    const diffTime = end.getTime() - start.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return Math.max(1, isNaN(diffDays) ? 1 : diffDays);
  }, [rentalForm.startDate, rentalForm.endDate]);

  const computedRentalSubtotal = computedRentalDays * (parseFloat(rentalForm.dailyRate) || 0);
  const computedRentalTotal = computedRentalSubtotal + (parseFloat(rentalForm.extraKmCost) || 0) + (parseFloat(rentalForm.expensesAdjustment) || 0);

  // Helper para guardar nuevo alquiler / período en calendario
  const handleSaveRental = (e) => {
    e.preventDefault();
    const days = computedRentalDays;
    const rate = parseFloat(rentalForm.dailyRate) || 0;
    const subtotal = days * rate;
    const total = subtotal + (parseFloat(rentalForm.extraKmCost) || 0) + (parseFloat(rentalForm.expensesAdjustment) || 0);
    const paid = parseFloat(rentalForm.paidAmount) || 0;
    const balance = Math.max(0, total - paid);

    const nextInvoiceNum = `INV-${new Date().getFullYear()}-${String(rentals.length + 1).padStart(3, '0')}`;

    const newRental = {
      id: `rent-${Date.now()}`,
      invoiceNumber: nextInvoiceNum,
      tenantName: rentalForm.tenantName.trim() || settings.driverName,
      tenantPhone: rentalForm.tenantPhone.trim() || settings.driverPhone,
      tenantDni: rentalForm.tenantDni.trim() || settings.driverDni,
      startDate: rentalForm.startDate,
      endDate: rentalForm.endDate,
      daysCount: days,
      dailyRate: rate,
      subtotal,
      extraKmCost: parseFloat(rentalForm.extraKmCost) || 0,
      expensesAdjustment: parseFloat(rentalForm.expensesAdjustment) || 0,
      totalAmount: total,
      paidAmount: paid,
      balanceDue: balance,
      status: 'confirmed',
      notes: rentalForm.notes
    };

    setRentals([newRental, ...rentals]);

    // Si hubo pago inicial registrado, creamos el pago
    if (paid > 0) {
      setPayments([
        {
          id: `pay-${Date.now()}`,
          date: rentalForm.startDate,
          amount: paid,
          method: 'Transferencia Bancaria',
          reference: `Anticipo ${nextInvoiceNum}`,
          rentalId: newRental.id,
          notes: 'Pago inicial al confirmar días de alquiler'
        },
        ...payments
      ]);
    }

    setShowRentalModal(false);
  };

  // Helper para abrir factura de un alquiler
  const handleOpenRentalInvoice = (rental) => {
    const invoiceData = {
      id: rental.id,
      invoiceNumber: rental.invoiceNumber,
      issueDate: rental.startDate,
      ownerName: settings.ownerName || 'Ramiro Stein',
      ownerPhone: settings.ownerPhone,
      ownerAlias: settings.ownerAlias,
      ownerCbu: settings.ownerCbu,
      tenantName: rental.tenantName,
      tenantPhone: rental.tenantPhone,
      tenantDni: rental.tenantDni,
      vehicleName: settings.truckName,
      plate: settings.plate,
      currentOdometer: settings.currentOdometer,
      startDate: rental.startDate,
      endDate: rental.endDate,
      daysCount: rental.daysCount,
      dailyRate: rental.dailyRate,
      subtotal: rental.subtotal,
      extraKmCost: rental.extraKmCost,
      expensesAdjustment: rental.expensesAdjustment,
      totalAmount: rental.totalAmount,
      paidAmount: rental.paidAmount,
      balanceDue: rental.balanceDue,
      notes: rental.notes
    };
    setSelectedInvoice(invoiceData);
  };

  // Marcar factura como pagada total
  const handleMarkInvoicePaid = (rentalId) => {
    setRentals(rentals.map(r => {
      if (r.id === rentalId) {
        return { ...r, paidAmount: r.totalAmount, balanceDue: 0 };
      }
      return r;
    }));
    if (selectedInvoice && selectedInvoice.id === rentalId) {
      setSelectedInvoice({ ...selectedInvoice, paidAmount: selectedInvoice.totalAmount, balanceDue: 0 });
    }
  };

  // Agregar Viaje
  const handleSaveTrip = (e) => {
    e.preventDefault();
    const gross = parseFloat(tripForm.grossAmount) || 0;
    const km = parseFloat(tripForm.km) || 0;
    const fuel = parseFloat(tripForm.fuelCost) || 0;
    const toll = parseFloat(tripForm.tollCost) || 0;

    let ownerEarnings = (gross * (settings.ownerPercent || 30)) / 100;
    let driverEarnings = gross - ownerEarnings;

    const newTrip = {
      id: `trip-${Date.now()}`,
      date: tripForm.date,
      time: tripForm.time,
      client: tripForm.client || 'Flete Particular',
      origin: tripForm.origin || 'Base',
      destination: tripForm.destination || 'Destino',
      km,
      grossAmount: gross,
      fuelCost: fuel,
      tollCost: toll,
      otherExpenses: parseFloat(tripForm.otherExpenses) || 0,
      collectedBy: tripForm.collectedBy,
      ownerEarnings,
      driverEarnings,
      notes: tripForm.notes,
      status: 'pending'
    };

    setTrips([newTrip, ...trips]);
    if (km > 0) {
      setSettings(prev => ({ ...prev, currentOdometer: (prev.currentOdometer || 0) + km }));
    }
    setShowTripModal(false);
  };

  // Guardar Pago
  const handleSavePayment = (e) => {
    e.preventDefault();
    const amount = parseFloat(paymentForm.amount) || 0;
    if (amount <= 0) return;

    const newPay = {
      id: `pay-${Date.now()}`,
      date: paymentForm.date,
      amount,
      method: paymentForm.method,
      reference: paymentForm.reference,
      rentalId: paymentForm.rentalId || '',
      notes: paymentForm.notes
    };

    setPayments([newPay, ...payments]);

    // Si fue imputado a un alquiler específico, descontar
    if (paymentForm.rentalId) {
      setRentals(rentals.map(r => {
        if (r.id === paymentForm.rentalId) {
          const newPaid = (r.paidAmount || 0) + amount;
          return { ...r, paidAmount: newPaid, balanceDue: Math.max(0, r.totalAmount - newPaid) };
        }
        return r;
      }));
    }

    setShowPaymentModal(false);
  };

  // Cálculos de Resumen General
  const financialSummary = useMemo(() => {
    const totalRentalsAmount = rentals.reduce((acc, r) => acc + (r.totalAmount || 0), 0);
    const totalRentalsPaid = rentals.reduce((acc, r) => acc + (r.paidAmount || 0), 0);
    const totalRentalsDebt = rentals.reduce((acc, r) => acc + (r.balanceDue || 0), 0);
    const totalPaymentsReceived = payments.reduce((acc, p) => acc + (p.amount || 0), 0);

    const totalDaysRented = rentals.reduce((acc, r) => acc + (r.daysCount || 0), 0);

    return {
      totalRentalsAmount,
      totalRentalsPaid,
      totalRentalsDebt,
      totalPaymentsReceived,
      totalDaysRented
    };
  }, [rentals, payments]);

  // Lógica de Construcción de Días para el Calendario Mensual
  const calendarDaysMatrix = useMemo(() => {
    const year = currentCalendarDate.getFullYear();
    const month = currentCalendarDate.getMonth();
    const firstDayOfMonth = new Date(year, month, 1);
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const startDayOfWeek = (firstDayOfMonth.getDay() + 6) % 7; // Lunes = 0, Domingo = 6

    const days = [];
    // Días vacíos previos al 1er día del mes
    for (let i = 0; i < startDayOfWeek; i++) {
      days.push({ empty: true, key: `empty-${i}` });
    }

    // Días del mes actual
    for (let dayNum = 1; dayNum <= daysInMonth; dayNum++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
      
      // Buscar si este día está dentro de algún período de alquiler
      const matchingRental = rentals.find(r => r.startDate <= dateStr && dateStr <= r.endDate);

      days.push({
        empty: false,
        dayNum,
        dateStr,
        rental: matchingRental,
        key: dateStr
      });
    }

    return days;
  }, [currentCalendarDate, rentals]);

  const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

  // Generar texto para WhatsApp
  const generateWhatsAppSummary = () => {
    return `🚚 *RESUMEN DE ALQUILER - ${settings.truckName}*
👤 *Inquilino:* ${settings.driverName}
📅 *Fecha:* ${new Date().toLocaleDateString('es-AR')}
-----------------------------------------
💰 *Tarifa pactada:* ${formatMoney(settings.dailyRentalRate)} / día
📦 *Días de alquiler contratados:* ${financialSummary.totalDaysRented} días
💼 *Facturación Total de Alquiler:* ${formatMoney(financialSummary.totalRentalsAmount)}
💳 *Pagos / Transferencias Recibidas:* ${formatMoney(financialSummary.totalPaymentsReceived)}
-----------------------------------------
👉 *SALDO PENDIENTE A LIQUIDAR:* ${formatMoney(Math.max(0, financialSummary.totalRentalsDebt))}
${financialSummary.totalRentalsDebt <= 0 ? '✅ ¡Cuentas al día! Gracias.' : '⚠️ Por favor confirmar cuando realices la transferencia.'}`;
  };

  const handleCopyWhatsApp = () => {
    navigator.clipboard.writeText(generateWhatsAppSummary());
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2500);
  };

  return (
    <div className="flex flex-col gap-6">
      {/* ========================================================================= */}
      {/* 1. ENCABEZADO SUPERIOR: CAMIÓN, TARIFA DEL DUEÑO Y ACCIONES             */}
      {/* ========================================================================= */}
      <div className="card p-5 flex flex-wrap items-center justify-between gap-4" style={{ borderLeft: '4px solid #f59e0b' }}>
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-xl" style={{ backgroundColor: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b' }}>
            <Truck size={28} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold">{settings.truckName}</h2>
              <span className="badge font-mono" style={{ backgroundColor: 'rgba(245, 158, 11, 0.2)', color: '#f59e0b', fontSize: '0.75rem', padding: '2px 8px', borderRadius: '4px' }}>
                {settings.plate}
              </span>
            </div>
            <p className="text-secondary text-sm flex items-center gap-2 mt-0.5">
              <User size={14} /> Inquilino: <strong className="text-white">{settings.driverName}</strong>
              <span className="text-xs px-2.5 py-0.5 rounded font-semibold text-warning bg-amber-500/10 border border-amber-500/20">
                Tarifa Dueño: {formatMoney(settings.dailyRentalRate)} / día
              </span>
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
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
            title="Configurar valores del camión, tarifas del dueño y datos bancarios"
          >
            <Settings size={15} />
            Tarifas Dueño
          </button>
          <button 
            className="btn btn-outline text-xs" 
            style={{ borderColor: '#22c55e', color: '#22c55e', padding: '6px 12px' }}
            onClick={() => setShowShareModal(true)}
            title="Generar resumen para enviar al inquilino por WhatsApp"
          >
            <Share2 size={15} />
            WhatsApp
          </button>
          <button 
            className="btn btn-primary text-xs" 
            style={{ backgroundColor: '#10b981', padding: '6px 12px' }}
            onClick={() => setShowPaymentModal(true)}
            title="Registrar dinero recibido por transferencia o efectivo"
          >
            <ArrowDownLeft size={16} />
            Registrar Cobro
          </button>
          <button 
            className="btn btn-primary text-xs" 
            style={{ backgroundColor: '#f59e0b', color: '#000', fontWeight: 600, padding: '6px 14px' }}
            onClick={() => {
              setRentalForm({
                tenantName: settings.driverName || 'Juan Pérez',
                tenantPhone: settings.driverPhone || '',
                tenantDni: settings.driverDni || '',
                startDate: new Date().toISOString().split('T')[0],
                endDate: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0],
                dailyRate: settings.dailyRentalRate || 45000,
                extraKmCost: 0,
                expensesAdjustment: 0,
                paidAmount: '',
                notes: ''
              });
              setShowRentalModal(true);
            }}
          >
            <CalendarDays size={16} />
            Asignar Días de Alquiler
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. TARJETAS PRINCIPALES: DEUDA, DÍAS ALQUILADOS, TARIFA Y SERVICE         */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* KPI 1: Saldo Pendiente del Inquilino */}
        <div className="card p-4 relative overflow-hidden" style={{ borderColor: financialSummary.totalRentalsDebt > 0 ? '#f59e0b' : '#10b981' }}>
          <div className="flex items-center justify-between text-secondary text-xs mb-1">
            <span>SALDO PENDIENTE DEL INQUILINO</span>
            <Wallet size={16} className={financialSummary.totalRentalsDebt > 0 ? "text-warning" : "text-success"} />
          </div>
          <div className={`text-2xl font-bold ${financialSummary.totalRentalsDebt > 0 ? "text-warning" : "text-success"}`}>
            {formatMoney(Math.max(0, financialSummary.totalRentalsDebt))}
          </div>
          <div className="text-xs text-secondary mt-1 flex items-center justify-between">
            <span>{financialSummary.totalRentalsDebt > 0 ? 'Debe transferir a tu cuenta' : 'Al día con los pagos'}</span>
            <span className="text-white font-medium">Cobrado: {formatMoney(financialSummary.totalPaymentsReceived)}</span>
          </div>
        </div>

        {/* KPI 2: Días de Alquiler en Calendario */}
        <div className="card p-4">
          <div className="flex items-center justify-between text-secondary text-xs mb-1">
            <span>DÍAS ALQUILADOS (CALENDARIO)</span>
            <CalendarDays size={16} className="text-accent" />
          </div>
          <div className="text-2xl font-bold text-white">
            {financialSummary.totalDaysRented} <span className="text-sm font-normal text-secondary">días</span>
          </div>
          <div className="text-xs text-secondary mt-1 flex items-center justify-between">
            <span>{rentals.length} contratos/períodos</span>
            <span className="text-warning font-semibold">{formatMoney(settings.dailyRentalRate)}/día base</span>
          </div>
        </div>

        {/* KPI 3: Facturación Total de Alquileres */}
        <div className="card p-4">
          <div className="flex items-center justify-between text-secondary text-xs mb-1">
            <span>TOTAL FACTURADO ALQUILER</span>
            <DollarSign size={16} className="text-success" />
          </div>
          <div className="text-2xl font-bold text-success">
            {formatMoney(financialSummary.totalRentalsAmount)}
          </div>
          <div className="text-xs text-secondary mt-1">
            Calculado con las tarifas fijadas por el dueño
          </div>
        </div>

        {/* KPI 4: Odómetro & Mantenimiento */}
        <div className="card p-4">
          <div className="flex items-center justify-between text-secondary text-xs mb-1">
            <span>ODÓMETRO & SERVICE</span>
            <Wrench size={16} className="text-secondary" />
          </div>
          <div className="text-2xl font-bold text-white">
            {(settings.currentOdometer || 0).toLocaleString('es-AR')} <span className="text-xs font-normal text-secondary">km</span>
          </div>
          <div className="text-xs text-secondary mt-1">
            Próximo aceite en: <strong>{((settings.lastOilKm || 0) + (settings.oilInterval || 15000) - (settings.currentOdometer || 0)).toLocaleString('es-AR')} km</strong>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. BARRA DE NAVEGACIÓN DE SUB-PESTAÑAS                                    */}
      {/* ========================================================================= */}
      <div className="flex items-center justify-between flex-wrap gap-3 border-b border-white/10 pb-2">
        <div className="flex items-center gap-2">
          <button
            className={`btn text-xs py-2 px-3.5 ${activeSubTab === 'calendar' ? 'btn-primary' : 'btn-outline'}`}
            style={{ 
              backgroundColor: activeSubTab === 'calendar' ? '#f59e0b' : 'transparent', 
              color: activeSubTab === 'calendar' ? '#000' : 'inherit',
              borderColor: activeSubTab === 'calendar' ? '#f59e0b' : 'var(--border-color)',
              fontWeight: activeSubTab === 'calendar' ? 600 : 400
            }}
            onClick={() => setActiveSubTab('calendar')}
          >
            <Calendar size={15} />
            Calendario de Alquiler
          </button>
          <button
            className={`btn text-xs py-2 px-3.5 ${activeSubTab === 'invoices' ? 'btn-primary' : 'btn-outline'}`}
            style={{ 
              backgroundColor: activeSubTab === 'invoices' ? '#6366f1' : 'transparent', 
              color: activeSubTab === 'invoices' ? '#fff' : 'inherit',
              borderColor: activeSubTab === 'invoices' ? '#6366f1' : 'var(--border-color)',
              fontWeight: activeSubTab === 'invoices' ? 600 : 400
            }}
            onClick={() => setActiveSubTab('invoices')}
          >
            <FileText size={15} />
            Facturas & Invoices ({rentals.length})
          </button>
          <button
            className={`btn text-xs py-2 px-3.5 ${activeSubTab === 'trips' ? 'btn-primary' : 'btn-outline'}`}
            style={{ 
              backgroundColor: activeSubTab === 'trips' ? '#10b981' : 'transparent', 
              color: activeSubTab === 'trips' ? '#fff' : 'inherit',
              borderColor: activeSubTab === 'trips' ? '#10b981' : 'var(--border-color)',
              fontWeight: activeSubTab === 'trips' ? 600 : 400
            }}
            onClick={() => setActiveSubTab('trips')}
          >
            <Truck size={15} />
            Viajes & Fletes (Tipo Uber) ({trips.length})
          </button>
        </div>

        <div className="text-xs text-secondary">
          Tarifa fija configurada: <strong className="text-white">{formatMoney(settings.dailyRentalRate)} / día</strong>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. VISTA A: CALENDARIO INTEGRADO DE DÍAS DE ALQUILER                      */}
      {/* ========================================================================= */}
      {activeSubTab === 'calendar' && (
        <div className="card p-5 flex flex-col gap-4">
          {/* Navegación del Mes */}
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <div className="flex items-center gap-3">
              <h3 className="text-lg font-bold capitalize flex items-center gap-2">
                <CalendarDays size={20} className="text-warning" />
                {monthNames[currentCalendarDate.getMonth()]} {currentCalendarDate.getFullYear()}
              </h3>
              <button 
                className="btn btn-outline text-xs py-1 px-2.5"
                onClick={() => setCurrentCalendarDate(new Date())}
              >
                Hoy
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button 
                className="btn btn-outline p-1.5"
                onClick={() => {
                  const prev = new Date(currentCalendarDate);
                  prev.setMonth(prev.getMonth() - 1);
                  setCurrentCalendarDate(prev);
                }}
                title="Mes anterior"
              >
                <ChevronLeft size={16} />
              </button>
              <button 
                className="btn btn-outline p-1.5"
                onClick={() => {
                  const next = new Date(currentCalendarDate);
                  next.setMonth(next.getMonth() + 1);
                  setCurrentCalendarDate(next);
                }}
                title="Mes siguiente"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          {/* Días de la semana */}
          <div className="grid grid-cols-7 gap-2 text-center text-xs font-semibold text-secondary">
            <div>Lun</div>
            <div>Mar</div>
            <div>Mié</div>
            <div>Jue</div>
            <div>Vie</div>
            <div>Sáb</div>
            <div>Dom</div>
          </div>

          {/* Cuadrícula de Días */}
          <div className="grid grid-cols-7 gap-2">
            {calendarDaysMatrix.map((item) => {
              if (item.empty) {
                return (
                  <div key={item.key} className="h-24 rounded-lg bg-white/[0.02] border border-transparent opacity-30" />
                );
              }

              const isToday = new Date().toISOString().split('T')[0] === item.dateStr;
              const hasRental = !!item.rental;

              return (
                <div 
                  key={item.key}
                  onClick={() => {
                    if (hasRental) {
                      handleOpenRentalInvoice(item.rental);
                    } else {
                      setRentalForm({
                        tenantName: settings.driverName || 'Juan Pérez',
                        tenantPhone: settings.driverPhone || '',
                        tenantDni: settings.driverDni || '',
                        startDate: item.dateStr,
                        endDate: item.dateStr,
                        dailyRate: settings.dailyRentalRate || 45000,
                        extraKmCost: 0,
                        expensesAdjustment: 0,
                        paidAmount: '',
                        notes: ''
                      });
                      setShowRentalModal(true);
                    }
                  }}
                  className={`h-24 p-2 rounded-lg border transition-all cursor-pointer flex flex-col justify-between ${
                    hasRental 
                      ? 'bg-amber-500/10 border-amber-500/30 hover:border-amber-500/60' 
                      : 'bg-white/5 border-white/10 hover:border-white/30 hover:bg-white/[0.08]'
                  }`}
                  style={{
                    boxShadow: isToday ? '0 0 0 2px var(--accent-color)' : 'none'
                  }}
                  title={hasRental ? `Alquilado a ${item.rental.tenantName} - Clic para ver Invoice` : 'Día disponible - Clic para alquilar'}
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-bold ${isToday ? 'text-accent' : hasRental ? 'text-warning' : 'text-white'}`}>
                      {item.dayNum}
                    </span>
                    {isToday && (
                      <span className="text-[10px] text-accent font-semibold">Hoy</span>
                    )}
                  </div>

                  {hasRental ? (
                    <div className="mt-1">
                      <div className="text-[11px] font-semibold text-warning truncate">
                        {item.rental.tenantName}
                      </div>
                      <div className="text-[10px] text-secondary flex items-center justify-between mt-0.5">
                        <span>{formatMoney(item.rental.dailyRate)}</span>
                        <FileText size={11} className="text-warning" />
                      </div>
                    </div>
                  ) : (
                    <div className="text-[10px] text-secondary/50 text-center py-1">
                      Disponible
                    </div>
                  )}

                  <div className="text-[9px] text-right text-secondary/60">
                    {hasRental ? 'Ver Invoice' : '+ Alquilar'}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between text-xs text-secondary pt-3 border-t border-white/10">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded bg-amber-500 inline-block" /> Alquilado (Clic para ver Invoice)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded bg-white/20 inline-block" /> Disponible (Clic para asignar)
              </span>
            </div>
            <span>
              Tarifa estándar pactada por el dueño: <strong className="text-warning">{formatMoney(settings.dailyRentalRate)} / día</strong>
            </span>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. VISTA B: LISTADO DE INVOICES & FACTURAS DE ALQUILER                     */}
      {/* ========================================================================= */}
      {activeSubTab === 'invoices' && (
        <div className="card p-0 overflow-hidden">
          <div className="p-4 border-b border-white/10 flex items-center justify-between">
            <div>
              <h3 className="font-bold flex items-center gap-2 text-base">
                <FileText size={18} className="text-accent" />
                Liquidaciones & Invoices Generados
              </h3>
              <p className="text-xs text-secondary mt-0.5">
                Facturas emitidas para el inquilino con cálculo de días y tarifas definidas por el dueño
              </p>
            </div>
            <button 
              className="btn btn-primary text-xs" 
              style={{ backgroundColor: '#6366f1' }}
              onClick={() => {
                setRentalForm({
                  tenantName: settings.driverName || 'Juan Pérez',
                  tenantPhone: settings.driverPhone || '',
                  tenantDni: settings.driverDni || '',
                  startDate: new Date().toISOString().split('T')[0],
                  endDate: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0],
                  dailyRate: settings.dailyRentalRate || 45000,
                  extraKmCost: 0,
                  expensesAdjustment: 0,
                  paidAmount: '',
                  notes: ''
                });
                setShowRentalModal(true);
              }}
            >
              <Plus size={15} /> Nuevo Invoice
            </button>
          </div>

          {rentals.length === 0 ? (
            <div className="p-8 text-center text-secondary text-sm">
              <FileText size={36} className="mx-auto mb-2 opacity-30" />
              No hay facturas generadas todavía. Asigná días en el calendario para crear la primera.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs" style={{ borderCollapse: 'collapse' }}>
                <thead>
                  <tr className="border-b border-white/10 text-secondary bg-white/[0.02]">
                    <th className="p-3">N° FACTURA</th>
                    <th className="p-3">INQUILINO</th>
                    <th className="p-3">PERÍODO / DÍAS</th>
                    <th className="p-3">TARIFA DIARIA</th>
                    <th className="p-3">TOTAL FACTURADO</th>
                    <th className="p-3">PAGADO</th>
                    <th className="p-3">SALDO PENDIENTE</th>
                    <th className="p-3">ESTADO</th>
                    <th className="p-3 text-right">ACCIONES</th>
                  </tr>
                </thead>
                <tbody>
                  {rentals.map(rental => (
                    <tr key={rental.id} className="border-b border-white/5 hover:bg-white/5 transition-all">
                      <td className="p-3 font-mono font-bold text-white whitespace-nowrap">
                        {rental.invoiceNumber}
                      </td>
                      <td className="p-3 whitespace-nowrap">
                        <div className="font-semibold text-white">{rental.tenantName}</div>
                        {rental.tenantPhone && <div className="text-[11px] text-secondary">{rental.tenantPhone}</div>}
                      </td>
                      <td className="p-3 whitespace-nowrap">
                        <div className="text-white">{rental.startDate} al {rental.endDate}</div>
                        <div className="text-[11px] text-secondary">{rental.daysCount} días contratados</div>
                      </td>
                      <td className="p-3 font-medium text-white whitespace-nowrap">
                        {formatMoney(rental.dailyRate)} / día
                      </td>
                      <td className="p-3 font-bold text-white whitespace-nowrap">
                        {formatMoney(rental.totalAmount)}
                      </td>
                      <td className="p-3 text-success font-medium whitespace-nowrap">
                        {formatMoney(rental.paidAmount || 0)}
                      </td>
                      <td className="p-3 font-bold whitespace-nowrap">
                        <span className={rental.balanceDue > 0 ? "text-warning" : "text-success"}>
                          {formatMoney(rental.balanceDue)}
                        </span>
                      </td>
                      <td className="p-3 whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${rental.balanceDue <= 0 ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'}`}>
                          {rental.balanceDue <= 0 ? 'Pagado' : 'Pendiente'}
                        </span>
                      </td>
                      <td className="p-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button 
                            className="btn btn-outline text-xs py-1 px-2.5"
                            style={{ borderColor: 'var(--accent-color)', color: 'var(--accent-color)' }}
                            onClick={() => handleOpenRentalInvoice(rental)}
                            title="Ver documento completo para imprimir o enviar"
                          >
                            <Eye size={13} /> Ver Invoice
                          </button>
                          <button 
                            className="btn btn-outline p-1 text-danger border-transparent hover:bg-danger/20"
                            onClick={() => {
                              if (window.confirm(`¿Eliminar la factura ${rental.invoiceNumber}?`)) {
                                setRentals(rentals.filter(r => r.id !== rental.id));
                              }
                            }}
                            title="Eliminar"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. VISTA C: PLANILLA ESTILO UBER (VIAJES Y FLETES)                        */}
      {/* ========================================================================= */}
      {activeSubTab === 'trips' && (
        <div className="card p-0 overflow-hidden">
          <div className="p-4 border-b border-white/10 flex items-center justify-between">
            <h3 className="font-bold flex items-center gap-2 text-base">
              <Truck size={18} className="text-warning" />
              Fletes y Viajes Realizados (Estilo Uber)
            </h3>
            <button 
              className="btn btn-primary text-xs" 
              style={{ backgroundColor: '#f59e0b', color: '#000', fontWeight: 600 }}
              onClick={() => setShowTripModal(true)}
            >
              <Plus size={15} /> Cargar Flete
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs" style={{ borderCollapse: 'collapse' }}>
              <thead>
                <tr className="border-b border-white/10 text-secondary bg-white/[0.02]">
                  <th className="p-3">FECHA</th>
                  <th className="p-3">CLIENTE / RUTA</th>
                  <th className="p-3">KM</th>
                  <th className="p-3">FACTURADO</th>
                  <th className="p-3">GASOIL/PEAJES</th>
                  <th className="p-3">ALQUILER DUEÑO</th>
                  <th className="p-3">CHOFER</th>
                  <th className="p-3 text-right">ACCIONES</th>
                </tr>
              </thead>
              <tbody>
                {trips.map(trip => (
                  <tr key={trip.id} className="border-b border-white/5 hover:bg-white/5 transition-all">
                    <td className="p-3 text-white whitespace-nowrap">{trip.date}</td>
                    <td className="p-3">
                      <div className="font-semibold text-white">{trip.client}</div>
                      <div className="text-[11px] text-secondary flex items-center gap-1 mt-0.5">
                        <MapPin size={11} className="text-accent" />
                        <span>{trip.origin}</span> → <span>{trip.destination}</span>
                      </div>
                    </td>
                    <td className="p-3 text-white whitespace-nowrap">{trip.km} km</td>
                    <td className="p-3 font-bold text-white whitespace-nowrap">{formatMoney(trip.grossAmount)}</td>
                    <td className="p-3 text-secondary whitespace-nowrap">
                      <div>Gasoil: {formatMoney(trip.fuelCost)}</div>
                    </td>
                    <td className="p-3 font-semibold text-warning whitespace-nowrap">{formatMoney(trip.ownerEarnings)}</td>
                    <td className="p-3 font-semibold text-success whitespace-nowrap">{formatMoney(trip.driverEarnings)}</td>
                    <td className="p-3 text-right whitespace-nowrap">
                      <button 
                        className="btn btn-outline p-1.5 text-danger border-transparent"
                        onClick={() => {
                          if (window.confirm('¿Borrar viaje?')) {
                            setTrips(trips.filter(t => t.id !== trip.id));
                          }
                        }}
                      >
                        <Trash2 size={13} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: ASIGNAR DÍAS DE ALQUILER (CON CALENDARIO Y TARIFA DEL DUEÑO)    */}
      {/* ========================================================================= */}
      {showRentalModal && (
        <div className="modal-overlay" onClick={() => setShowRentalModal(false)}>
          <div className="card w-full max-w-lg relative" onClick={e => e.stopPropagation()} style={{ width: '560px', maxHeight: '90vh', overflowY: 'auto' }}>
            <button className="btn btn-outline absolute top-4 right-4 p-1 border-none" onClick={() => setShowRentalModal(false)}>
              <X size={20} />
            </button>

            <h3 className="text-xl font-bold mb-2 flex items-center gap-2">
              <CalendarDays size={22} className="text-warning" /> Asignar Días de Alquiler en Calendario
            </h3>
            <p className="text-xs text-secondary mb-4">
              Definí el período contratado y la tarifa acordada para generar el Invoice automáticamente.
            </p>

            <form onSubmit={handleSaveRental} className="flex flex-col gap-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-secondary mb-1 block">Fecha de Inicio *</label>
                  <input 
                    type="date" 
                    className="input w-full" 
                    value={rentalForm.startDate} 
                    onChange={e => setRentalForm({ ...rentalForm, startDate: e.target.value })} 
                    required 
                  />
                </div>
                <div>
                  <label className="text-xs text-secondary mb-1 block">Fecha de Fin *</label>
                  <input 
                    type="date" 
                    className="input w-full" 
                    value={rentalForm.endDate} 
                    onChange={e => setRentalForm({ ...rentalForm, endDate: e.target.value })} 
                    required 
                  />
                </div>
              </div>

              {/* Tarifa definida por el dueño */}
              <div className="p-3.5 rounded-lg bg-amber-500/10 border border-amber-500/20">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-warning block">
                    Tarifa de Alquiler por Día (Fijada por Dueño) *
                  </label>
                  <span className="text-[11px] text-secondary">
                    Total: <strong className="text-white">{computedRentalDays} días</strong>
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-white font-bold">$</span>
                  <input 
                    type="number" 
                    className="input flex-1 font-bold text-white text-base" 
                    value={rentalForm.dailyRate} 
                    onChange={e => setRentalForm({ ...rentalForm, dailyRate: parseFloat(e.target.value) || 0 })} 
                    required 
                  />
                  <span className="text-xs text-secondary">por día</span>
                </div>

                <div className="flex justify-between items-center text-xs mt-2.5 pt-2 border-t border-amber-500/20">
                  <span className="text-secondary">Subtotal de Alquiler ({computedRentalDays} días × {formatMoney(rentalForm.dailyRate)}):</span>
                  <strong className="text-white text-sm">{formatMoney(computedRentalSubtotal)}</strong>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-secondary mb-1 block">Inquilino / Chofer</label>
                  <input 
                    type="text" 
                    className="input w-full" 
                    value={rentalForm.tenantName} 
                    onChange={e => setRentalForm({ ...rentalForm, tenantName: e.target.value })} 
                    required 
                  />
                </div>
                <div>
                  <label className="text-xs text-secondary mb-1 block">Teléfono WhatsApp</label>
                  <input 
                    type="text" 
                    className="input w-full" 
                    value={rentalForm.tenantPhone} 
                    onChange={e => setRentalForm({ ...rentalForm, tenantPhone: e.target.value })} 
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-secondary mb-1 block">Ajuste de Combustible / Peajes ($)</label>
                  <input 
                    type="number" 
                    className="input w-full" 
                    placeholder="Ej: 0 o compensación"
                    value={rentalForm.expensesAdjustment} 
                    onChange={e => setRentalForm({ ...rentalForm, expensesAdjustment: e.target.value })} 
                  />
                </div>
                <div>
                  <label className="text-xs text-secondary mb-1 block">Pago Inicial / Anticipo Recibido ($)</label>
                  <input 
                    type="number" 
                    className="input w-full" 
                    placeholder="Ej: 50000"
                    value={rentalForm.paidAmount} 
                    onChange={e => setRentalForm({ ...rentalForm, paidAmount: e.target.value })} 
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-secondary mb-1 block">Observaciones / Notas del Contrato</label>
                <input 
                  type="text" 
                  className="input w-full" 
                  placeholder="Ej: Alquiler semanal para mudanzas y fletes"
                  value={rentalForm.notes} 
                  onChange={e => setRentalForm({ ...rentalForm, notes: e.target.value })} 
                />
              </div>

              <div className="p-3 rounded-lg bg-black/40 border border-white/10 flex justify-between items-center text-sm">
                <span>TOTAL DEL INVOICE A EMITIR:</span>
                <strong className="text-warning text-base font-bold font-mono">{formatMoney(computedRentalTotal)}</strong>
              </div>

              <button type="submit" className="btn btn-primary mt-1" style={{ backgroundColor: '#f59e0b', color: '#000', fontWeight: 600 }}>
                Confirmar Alquiler & Emitir Invoice
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: CARGAR NUEVO FLETE (TIPO UBER)                                   */}
      {/* ========================================================================= */}
      {showTripModal && (
        <div className="modal-overlay" onClick={() => setShowTripModal(false)}>
          <div className="card w-full max-w-md relative" onClick={e => e.stopPropagation()} style={{ width: '500px', maxHeight: '90vh', overflowY: 'auto' }}>
            <button className="btn btn-outline absolute top-4 right-4 p-1 border-none" onClick={() => setShowTripModal(false)}>
              <X size={20} />
            </button>

            <h3 className="text-xl font-bold mb-3 flex items-center gap-2">
              <Truck size={22} className="text-warning" /> Registrar Flete Realizado
            </h3>

            <form onSubmit={handleSaveTrip} className="flex flex-col gap-3">
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
                  <label className="text-xs text-secondary mb-1 block">Cliente</label>
                  <input 
                    type="text" 
                    className="input w-full" 
                    placeholder="Ej: Corralón Sur"
                    value={tripForm.client} 
                    onChange={e => setTripForm({ ...tripForm, client: e.target.value })} 
                    required 
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-secondary mb-1 block">Origen</label>
                  <input 
                    type="text" 
                    className="input w-full" 
                    placeholder="Ej: Fábrica"
                    value={tripForm.origin} 
                    onChange={e => setTripForm({ ...tripForm, origin: e.target.value })} 
                  />
                </div>
                <div>
                  <label className="text-xs text-secondary mb-1 block">Destino</label>
                  <input 
                    type="text" 
                    className="input w-full" 
                    placeholder="Ej: Depósito"
                    value={tripForm.destination} 
                    onChange={e => setTripForm({ ...tripForm, destination: e.target.value })} 
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-secondary mb-1 block">KM Recorridos</label>
                  <input 
                    type="number" 
                    className="input w-full" 
                    placeholder="Ej: 90"
                    value={tripForm.km} 
                    onChange={e => setTripForm({ ...tripForm, km: e.target.value })} 
                  />
                </div>
                <div>
                  <label className="text-xs text-secondary mb-1 block font-semibold text-warning">Cobrado al Cliente ($) *</label>
                  <input 
                    type="number" 
                    className="input w-full" 
                    placeholder="Ej: 140000"
                    value={tripForm.grossAmount} 
                    onChange={e => setTripForm({ ...tripForm, grossAmount: e.target.value })} 
                    required 
                  />
                </div>
              </div>

              <button type="submit" className="btn btn-primary mt-1" style={{ backgroundColor: '#f59e0b', color: '#000', fontWeight: 600 }}>
                Guardar Flete
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: REGISTRAR COBRO / PAGO DEL INQUILINO                            */}
      {/* ========================================================================= */}
      {showPaymentModal && (
        <div className="modal-overlay" onClick={() => setShowPaymentModal(false)}>
          <div className="card w-full max-w-md relative" onClick={e => e.stopPropagation()} style={{ width: '480px' }}>
            <button className="btn btn-outline absolute top-4 right-4 p-1 border-none" onClick={() => setShowPaymentModal(false)}>
              <X size={20} />
            </button>

            <h3 className="text-xl font-bold mb-3 flex items-center gap-2">
              <ArrowDownLeft size={22} className="text-success" /> Registrar Cobro de Alquiler
            </h3>

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
                  className="input w-full font-bold text-lg" 
                  placeholder="Ej: 90000"
                  value={paymentForm.amount} 
                  onChange={e => setPaymentForm({ ...paymentForm, amount: e.target.value })} 
                  required 
                />
              </div>

              <div>
                <label className="text-xs text-secondary mb-1 block">Imputar a Factura / Alquiler</label>
                <select 
                  className="input w-full" 
                  value={paymentForm.rentalId} 
                  onChange={e => setPaymentForm({ ...paymentForm, rentalId: e.target.value })}
                >
                  <option value="">Saldo general / Cuenta corriente</option>
                  {rentals.map(r => (
                    <option key={r.id} value={r.id}>
                      {r.invoiceNumber} - {r.startDate} ({formatMoney(r.balanceDue)} pend.)
                    </option>
                  ))}
                </select>
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
                </select>
              </div>

              <div>
                <label className="text-xs text-secondary mb-1 block">Referencia / Comprobante</label>
                <input 
                  type="text" 
                  className="input w-full" 
                  placeholder="Ej: OP-994201"
                  value={paymentForm.reference} 
                  onChange={e => setPaymentForm({ ...paymentForm, reference: e.target.value })} 
                />
              </div>

              <button type="submit" className="btn btn-primary mt-1" style={{ backgroundColor: '#10b981' }}>
                Asentar Cobro en Cuenta
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: CONFIGURACIÓN DE TARIFAS DEL DUEÑO Y DATOS BANCARIOS            */}
      {/* ========================================================================= */}
      {showSettingsModal && (
        <div className="modal-overlay" onClick={() => setShowSettingsModal(false)}>
          <div className="card w-full max-w-lg relative" onClick={e => e.stopPropagation()} style={{ width: '560px', maxHeight: '90vh', overflowY: 'auto' }}>
            <button className="btn btn-outline absolute top-4 right-4 p-1 border-none" onClick={() => setShowSettingsModal(false)}>
              <X size={20} />
            </button>

            <h3 className="text-xl font-bold mb-3 flex items-center gap-2">
              <Settings size={22} className="text-warning" /> Tarifas del Dueño & Configuración
            </h3>

            <div className="flex flex-col gap-4">
              {/* Tarifas de Alquiler Definidas por Ramiro */}
              <div className="p-3.5 rounded-lg bg-amber-500/10 border border-amber-500/20">
                <label className="text-xs font-semibold text-warning mb-2 block uppercase tracking-wider">
                  Valores del Alquiler Fijados por el Dueño
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-secondary mb-1 block">Tarifa por Día ($)</label>
                    <input 
                      type="number" 
                      className="input w-full font-bold text-white" 
                      value={settings.dailyRentalRate} 
                      onChange={e => setSettings({ ...settings, dailyRentalRate: parseFloat(e.target.value) || 0 })} 
                    />
                  </div>
                  <div>
                    <label className="text-xs text-secondary mb-1 block">Tarifa por Semana ($)</label>
                    <input 
                      type="number" 
                      className="input w-full font-bold text-white" 
                      value={settings.weeklyRentalRate} 
                      onChange={e => setSettings({ ...settings, weeklyRentalRate: parseFloat(e.target.value) || 0 })} 
                    />
                  </div>
                </div>
              </div>

              {/* Datos Bancarios del Dueño (para que salgan en los Invoices) */}
              <div className="p-3.5 rounded-lg bg-white/5 border border-white/10">
                <label className="text-xs font-semibold text-white mb-2 flex items-center gap-1.5 uppercase tracking-wider">
                  <CreditCard size={14} className="text-accent" /> Datos de Pago del Dueño (Para Facturas)
                </label>
                <div className="grid grid-cols-2 gap-3 mb-2">
                  <div>
                    <label className="text-xs text-secondary mb-1 block">Titular de Cuenta</label>
                    <input 
                      type="text" 
                      className="input w-full" 
                      value={settings.ownerName} 
                      onChange={e => setSettings({ ...settings, ownerName: e.target.value })} 
                    />
                  </div>
                  <div>
                    <label className="text-xs text-secondary mb-1 block">Alias Bancario / MP</label>
                    <input 
                      type="text" 
                      className="input w-full font-mono text-warning" 
                      value={settings.ownerAlias} 
                      onChange={e => setSettings({ ...settings, ownerAlias: e.target.value })} 
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-secondary mb-1 block">CBU / CVU</label>
                  <input 
                    type="text" 
                    className="input w-full font-mono text-xs" 
                    value={settings.ownerCbu} 
                    onChange={e => setSettings({ ...settings, ownerCbu: e.target.value })} 
                  />
                </div>
              </div>

              {/* Datos del Camión e Inquilino */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-secondary mb-1 block">Modelo del Camión</label>
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
                    className="input w-full font-mono" 
                    value={settings.plate} 
                    onChange={e => setSettings({ ...settings, plate: e.target.value })} 
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-secondary mb-1 block">Inquilino / Chofer Actual</label>
                  <input 
                    type="text" 
                    className="input w-full" 
                    value={settings.driverName} 
                    onChange={e => setSettings({ ...settings, driverName: e.target.value })} 
                  />
                </div>
                <div>
                  <label className="text-xs text-secondary mb-1 block">Teléfono WhatsApp</label>
                  <input 
                    type="text" 
                    className="input w-full" 
                    value={settings.driverPhone} 
                    onChange={e => setSettings({ ...settings, driverPhone: e.target.value })} 
                  />
                </div>
              </div>

              {/* PIN de Seguridad Admin */}
              <div className="pt-2 border-t border-white/10">
                <label className="text-xs font-semibold text-warning mb-1.5 flex items-center gap-1.5">
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

      {/* ========================================================================= */}
      {/* MODAL 5: RESUMEN RÁPIDO PARA WHATSAPP                                    */}
      {/* ========================================================================= */}
      {showShareModal && (
        <div className="modal-overlay" onClick={() => setShowShareModal(false)}>
          <div className="card w-full max-w-md relative" onClick={e => e.stopPropagation()} style={{ width: '480px' }}>
            <button className="btn btn-outline absolute top-4 right-4 p-1 border-none" onClick={() => setShowShareModal(false)}>
              <X size={20} />
            </button>

            <h3 className="text-xl font-bold mb-3 flex items-center gap-2">
              <Share2 size={22} className="text-success" /> Resumen de Alquiler para WhatsApp
            </h3>

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
      {/* MODAL 6: VISOR Y DESCARGA FORMAL DE INVOICE / FACTURA                     */}
      {/* ========================================================================= */}
      {selectedInvoice && (
        <TruckInvoiceModal 
          invoice={selectedInvoice}
          onClose={() => setSelectedInvoice(null)}
          onMarkPaid={handleMarkInvoicePaid}
        />
      )}
    </div>
  );
}
