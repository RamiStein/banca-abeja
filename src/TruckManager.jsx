import React, { useState, useEffect, useMemo } from 'react';
import { 
  Truck, DollarSign, MapPin, Wrench, Shield, 
  Plus, Send, Share2, Filter, RotateCcw, AlertCircle,
  Trash2, Settings, ArrowDownLeft, 
  Wallet, X, Copy, Check, User, Users, Lock, Calendar, 
  CalendarDays, FileText, ChevronLeft, ChevronRight, Eye, CreditCard
} from 'lucide-react';
import TruckInvoiceModal from './components/TruckInvoiceModal';

const formatMoney = (val) => {
  if (!val && val !== 0) return '$0';
  return `$${Math.round(val).toLocaleString('es-AR')}`;
};

export default function TruckManager({ onLockAdmin }) {
  // Sub-pestaña activa dentro de la gestión del camión
  const [activeSubTab, setActiveSubTab] = useState('calendar'); // 'calendar' | 'invoices' | 'trips'

  // Filtros interactivos de Chofer y Estado
  const [filterDriver, setFilterDriver] = useState('all'); // 'all' | nombre del chofer
  const [filterPaymentStatus, setFilterPaymentStatus] = useState('all'); // 'all' | 'pending' | 'paid'

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
    weeklyRentalRate: 260000,
    kmLimitPerDay: 250,
    extraKmCost: 150,
    pricingMode: 'fixed_daily',
    ownerPercent: 30,
    fuelMode: 'driver',
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

  // Lista única de todos los choferes registrados para los filtros
  const allDriversList = useMemo(() => {
    const set = new Set();
    if (settings.driverName) set.add(settings.driverName.replace(/\s*\(.*?\)/, '').trim());
    rentals.forEach(r => { if (r.tenantName) set.add(r.tenantName.trim()); });
    return Array.from(set).filter(Boolean);
  }, [rentals, settings.driverName]);

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
    endDate: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0],
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

  // Filtrado de alquileres según Chofer y Estado de pago
  const filteredRentals = useMemo(() => {
    return rentals.filter(r => {
      const matchDriver = filterDriver === 'all' || r.tenantName.toLowerCase().includes(filterDriver.toLowerCase());
      const matchStatus = filterPaymentStatus === 'all' || 
        (filterPaymentStatus === 'pending' ? r.balanceDue > 0 : r.balanceDue <= 0);
      return matchDriver && matchStatus;
    });
  }, [rentals, filterDriver, filterPaymentStatus]);

  // Cálculos de Resumen General Adaptados a los Filtros
  const financialSummary = useMemo(() => {
    let sourceRentals = rentals;
    let sourcePayments = payments;

    if (filterDriver !== 'all') {
      sourceRentals = sourceRentals.filter(r => r.tenantName.toLowerCase().includes(filterDriver.toLowerCase()));
      const filteredRentalIds = new Set(sourceRentals.map(r => r.id));
      sourcePayments = sourcePayments.filter(p => !p.rentalId || filteredRentalIds.has(p.rentalId));
    }

    if (filterPaymentStatus === 'pending') {
      sourceRentals = sourceRentals.filter(r => r.balanceDue > 0);
    } else if (filterPaymentStatus === 'paid') {
      sourceRentals = sourceRentals.filter(r => r.balanceDue <= 0);
    }

    const totalRentalsAmount = sourceRentals.reduce((acc, r) => acc + (r.totalAmount || 0), 0);
    const totalRentalsPaid = sourceRentals.reduce((acc, r) => acc + (r.paidAmount || 0), 0);
    const totalRentalsDebt = sourceRentals.reduce((acc, r) => acc + (r.balanceDue || 0), 0);
    const totalPaymentsReceived = sourcePayments.reduce((acc, p) => acc + (p.amount || 0), 0);
    const totalDaysRented = sourceRentals.reduce((acc, r) => acc + (r.daysCount || 0), 0);

    return {
      totalRentalsAmount,
      totalRentalsPaid,
      totalRentalsDebt,
      totalPaymentsReceived,
      totalDaysRented,
      rentalsCount: sourceRentals.length
    };
  }, [rentals, payments, filterDriver, filterPaymentStatus]);

  // Lógica de Construcción de Días para el Calendario Mensual
  const calendarDaysMatrix = useMemo(() => {
    const year = currentCalendarDate.getFullYear();
    const month = currentCalendarDate.getMonth();
    const firstDayOfMonth = new Date(year, month, 1);
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const startDayOfWeek = (firstDayOfMonth.getDay() + 6) % 7; // Lunes = 0, Domingo = 6

    const days = [];
    for (let i = 0; i < startDayOfWeek; i++) {
      days.push({ empty: true, key: `empty-${i}` });
    }

    for (let dayNum = 1; dayNum <= daysInMonth; dayNum++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
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

  // Abrir modal de asignación con fecha preseleccionada
  const handleStartBooking = (dateStr) => {
    setRentalForm({
      tenantName: filterDriver !== 'all' ? filterDriver : (settings.driverName || 'Juan Pérez'),
      tenantPhone: settings.driverPhone || '',
      tenantDni: settings.driverDni || '',
      startDate: dateStr,
      endDate: dateStr,
      dailyRate: settings.dailyRentalRate || 45000,
      extraKmCost: 0,
      expensesAdjustment: 0,
      paidAmount: '',
      notes: ''
    });
    setShowRentalModal(true);
  };

  // Generar texto para WhatsApp
  const generateWhatsAppSummary = () => {
    const targetDriver = filterDriver !== 'all' ? filterDriver : settings.driverName;
    return `🚚 *RESUMEN DE ALQUILER - ${settings.truckName}*
👤 *Inquilino:* ${targetDriver}
📅 *Fecha de emisión:* ${new Date().toLocaleDateString('es-AR')}
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

  const hasActiveFilters = filterDriver !== 'all' || filterPaymentStatus !== 'all';

  return (
    <div className="flex flex-col gap-5">
      {/* ========================================================================= */}
      {/* 1. ENCABEZADO SUPERIOR: CAMIÓN, TARIFA DEL DUEÑO Y ACCIONES             */}
      {/* ========================================================================= */}
      <div 
        className="card p-6 flex flex-wrap items-center justify-between gap-5" 
        style={{ 
          borderLeft: '5px solid #d97706', 
          background: '#ffffff', 
          border: '1px solid #e2e8f0', 
          boxShadow: '0 2px 8px -2px rgba(0,0,0,0.05)' 
        }}
      >
        <div className="flex items-center gap-4">
          <div 
            style={{ 
              width: '54px', 
              height: '54px', 
              borderRadius: '14px', 
              backgroundColor: '#fffbeb', 
              color: '#d97706', 
              border: '1px solid #fde68a',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}
          >
            <Truck size={28} />
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em', margin: 0 }}>
                {settings.truckName}
              </h2>
              <span 
                className="badge font-mono" 
                style={{ 
                  backgroundColor: '#f1f5f9', 
                  color: '#334155', 
                  fontSize: '0.8rem', 
                  padding: '3px 9px', 
                  borderRadius: '6px', 
                  border: '1px solid #cbd5e1',
                  fontWeight: 700
                }}
              >
                {settings.plate}
              </span>
            </div>
            <div className="flex items-center gap-3 mt-2 flex-wrap" style={{ fontSize: '0.85rem' }}>
              <span className="flex items-center gap-1.5" style={{ color: '#475569' }}>
                <User size={14} className="text-accent" /> Chofer habitual: <strong style={{ color: '#0f172a' }}>{settings.driverName}</strong>
              </span>
              <span style={{ color: '#cbd5e1' }}>•</span>
              <span className="badge" style={{ backgroundColor: '#fffbeb', color: '#b45309', border: '1px solid #fde68a', fontSize: '0.8rem', padding: '3px 10px' }}>
                Tarifa pactada: <strong>{formatMoney(settings.dailyRentalRate)} / día</strong>
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {onLockAdmin && (
            <button 
              type="button"
              className="btn btn-sm" 
              style={{ borderColor: '#fecdd3', color: '#e11d48', background: '#fff1f2', border: '1px solid' }}
              onClick={onLockAdmin}
              title="Cerrar y bloquear sesión de Administrador"
            >
              <Lock size={14} />
              Bloquear Admin
            </button>
          )}
          <button 
            type="button"
            className="btn btn-sm btn-outline" 
            style={{ borderColor: '#cbd5e1', color: '#334155' }}
            onClick={() => setShowSettingsModal(true)}
            title="Configurar valores del camión, tarifas del dueño y datos bancarios"
          >
            <Settings size={14} />
            Tarifas Dueño
          </button>
          <button 
            type="button"
            className="btn btn-sm btn-outline" 
            style={{ borderColor: '#bbf7d0', color: '#15803d', background: '#f0fdf4' }}
            onClick={() => setShowShareModal(true)}
            title="Generar resumen para enviar al inquilino por WhatsApp"
          >
            <Share2 size={14} />
            WhatsApp
          </button>
          <button 
            type="button"
            className="btn btn-sm" 
            style={{ backgroundColor: '#10b981', color: '#ffffff', boxShadow: '0 2px 6px rgba(16, 185, 129, 0.25)' }}
            onClick={() => setShowPaymentModal(true)}
            title="Registrar dinero recibido por transferencia o efectivo"
          >
            <ArrowDownLeft size={15} />
            Registrar Cobro
          </button>
          <button 
            type="button"
            className="btn btn-sm" 
            style={{ backgroundColor: '#d97706', color: '#ffffff', boxShadow: '0 2px 8px rgba(217, 119, 6, 0.3)' }}
            onClick={() => handleStartBooking(new Date().toISOString().split('T')[0])}
          >
            <CalendarDays size={15} />
            + Asignar Días
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. BARRA DE FILTROS VINCULADA AL CHOFER Y A ESTADOS                      */}
      {/* ========================================================================= */}
      <div 
        className="card p-3.5 flex flex-wrap items-center justify-between gap-4" 
        style={{ 
          background: '#ffffff', 
          border: '1px solid #e2e8f0', 
          borderColor: hasActiveFilters ? '#d97706' : '#e2e8f0', 
          boxShadow: '0 1px 3px rgba(0,0,0,0.03)' 
        }}
      >
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-1.5" style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>
            <Filter size={16} className={hasActiveFilters ? "text-warning" : "text-secondary"} />
            <span>Filtrar por:</span>
          </div>

          {/* Selector de Chofer */}
          <div className="flex items-center gap-2">
            <label style={{ fontSize: '0.82rem', color: '#64748b', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Users size={14} className="text-accent" /> Chofer:
            </label>
            <select 
              className="input"
              style={{ 
                minWidth: '180px', 
                height: '36px', 
                padding: '4px 10px', 
                fontSize: '0.82rem', 
                borderColor: filterDriver !== 'all' ? '#d97706' : '#cbd5e1', 
                borderRadius: '8px' 
              }}
              value={filterDriver} 
              onChange={e => setFilterDriver(e.target.value)}
            >
              <option value="all">Todos los choferes ({allDriversList.length})</option>
              {allDriversList.map(driver => (
                <option key={driver} value={driver}>{driver}</option>
              ))}
            </select>
          </div>

          {/* Filtro de Estado de Pago (Segmented Control Horizontal) */}
          <div className="flex items-center gap-2">
            <span style={{ fontSize: '0.82rem', color: '#64748b', fontWeight: 500 }}>Estado:</span>
            <div className="segmented-control">
              <button
                type="button"
                className={`segmented-btn ${filterPaymentStatus === 'all' ? 'active' : ''}`}
                onClick={() => setFilterPaymentStatus('all')}
              >
                Todos
              </button>
              <button
                type="button"
                className={`segmented-btn ${filterPaymentStatus === 'pending' ? 'active-warning' : ''}`}
                onClick={() => setFilterPaymentStatus('pending')}
              >
                <AlertCircle size={13} /> Con Deuda
              </button>
              <button
                type="button"
                className={`segmented-btn ${filterPaymentStatus === 'paid' ? 'active-success' : ''}`}
                onClick={() => setFilterPaymentStatus('paid')}
              >
                <Check size={13} /> Al Día
              </button>
            </div>
          </div>

          {/* Botón Reset de Filtros */}
          {hasActiveFilters && (
            <button 
              type="button"
              className="btn btn-sm btn-outline"
              style={{ borderColor: '#cbd5e1', color: '#64748b', background: '#f8fafc' }}
              onClick={() => {
                setFilterDriver('all');
                setFilterPaymentStatus('all');
              }}
              title="Restablecer filtros"
            >
              <RotateCcw size={13} /> Limpiar filtros
            </button>
          )}
        </div>

        {/* Resumen dinámico del filtro activo */}
        <div style={{ fontSize: '0.82rem', color: '#64748b' }}>
          {filterDriver !== 'all' ? (
            <span className="badge" style={{ background: '#fffbeb', color: '#b45309', border: '1px solid #fde68a' }}>
              Viendo exclusivamente a: <strong>{filterDriver}</strong>
            </span>
          ) : (
            <span>Mostrando todos los registros del camión</span>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. TARJETAS PRINCIPALES: DEUDA, DÍAS ALQUILADOS, TARIFA Y SERVICE         */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-4 gap-4">
        {/* KPI 1: Saldo Pendiente del Inquilino */}
        <div 
          className="card" 
          style={{ 
            padding: '1.25rem', 
            display: 'flex', 
            flexDirection: 'column', 
            justifyContent: 'space-between',
            minHeight: '130px',
            borderColor: financialSummary.totalRentalsDebt > 0 ? '#fde68a' : '#bbf7d0', 
            background: financialSummary.totalRentalsDebt > 0 ? '#fffbeb' : '#f0fdf4', 
            borderWidth: '1px' 
          }}
        >
          <div className="flex items-center justify-between" style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.04em', color: financialSummary.totalRentalsDebt > 0 ? '#b45309' : '#15803d' }}>
            <span>SALDO PENDIENTE</span>
            <Wallet size={16} />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: financialSummary.totalRentalsDebt > 0 ? '#b45309' : '#15803d', fontFamily: 'monospace', margin: '0.35rem 0' }}>
            {formatMoney(Math.max(0, financialSummary.totalRentalsDebt))}
          </div>
          <div className="flex items-center justify-between text-xs" style={{ color: '#64748b', borderTop: '1px solid rgba(0,0,0,0.06)', paddingTop: '0.5rem' }}>
            <span>{financialSummary.totalRentalsDebt > 0 ? 'Falta transferir' : 'Cuentas al día'}</span>
            <strong style={{ color: '#0f172a' }}>Cobrado: {formatMoney(financialSummary.totalPaymentsReceived)}</strong>
          </div>
        </div>

        {/* KPI 2: Días de Alquiler en Calendario */}
        <div 
          className="card" 
          style={{ 
            padding: '1.25rem', 
            display: 'flex', 
            flexDirection: 'column', 
            justifyContent: 'space-between',
            minHeight: '130px',
            background: '#ffffff', 
            border: '1px solid #e2e8f0' 
          }}
        >
          <div className="flex items-center justify-between" style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.04em', color: '#64748b' }}>
            <span>DÍAS ALQUILADOS</span>
            <CalendarDays size={16} className="text-accent" />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', margin: '0.35rem 0' }}>
            {financialSummary.totalDaysRented} <span style={{ fontSize: '0.85rem', fontWeight: 500, color: '#64748b' }}>días contratados</span>
          </div>
          <div className="flex items-center justify-between text-xs" style={{ color: '#64748b', borderTop: '1px solid #f1f5f9', paddingTop: '0.5rem' }}>
            <span>{financialSummary.rentalsCount} períodos</span>
            <strong style={{ color: '#b45309' }}>{formatMoney(settings.dailyRentalRate)} / día</strong>
          </div>
        </div>

        {/* KPI 3: Facturación Total de Alquileres */}
        <div 
          className="card" 
          style={{ 
            padding: '1.25rem', 
            display: 'flex', 
            flexDirection: 'column', 
            justifyContent: 'space-between',
            minHeight: '130px',
            background: '#ffffff', 
            border: '1px solid #e2e8f0' 
          }}
        >
          <div className="flex items-center justify-between" style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.04em', color: '#64748b' }}>
            <span>TOTAL FACTURADO</span>
            <DollarSign size={16} className="text-success" />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#15803d', fontFamily: 'monospace', margin: '0.35rem 0' }}>
            {formatMoney(financialSummary.totalRentalsAmount)}
          </div>
          <div className="text-xs" style={{ color: '#64748b', borderTop: '1px solid #f1f5f9', paddingTop: '0.5rem' }}>
            Tarifas fijadas por el dueño
          </div>
        </div>

        {/* KPI 4: Odómetro & Mantenimiento */}
        <div 
          className="card" 
          style={{ 
            padding: '1.25rem', 
            display: 'flex', 
            flexDirection: 'column', 
            justifyContent: 'space-between',
            minHeight: '130px',
            background: '#ffffff', 
            border: '1px solid #e2e8f0' 
          }}
        >
          <div className="flex items-center justify-between" style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.04em', color: '#64748b' }}>
            <span>ODÓMETRO & SERVICE</span>
            <Wrench size={16} className="text-secondary" />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', margin: '0.35rem 0' }}>
            {(settings.currentOdometer || 0).toLocaleString('es-AR')} <span style={{ fontSize: '0.85rem', fontWeight: 500, color: '#64748b' }}>km</span>
          </div>
          <div className="text-xs" style={{ color: '#64748b', borderTop: '1px solid #f1f5f9', paddingTop: '0.5rem' }}>
            Próximo aceite en: <strong style={{ color: '#0f172a' }}>{((settings.lastOilKm || 0) + (settings.oilInterval || 15000) - (settings.currentOdometer || 0)).toLocaleString('es-AR')} km</strong>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. BARRA DE NAVEGACIÓN DE SUB-PESTAÑAS CON IDENTIDAD CLARA                */}
      {/* ========================================================================= */}
      <div 
        className="flex items-center justify-between flex-wrap gap-4 pb-2" 
        style={{ borderBottom: '1px solid #e2e8f0' }}
      >
        <div className="segmented-control" style={{ padding: '4px', background: '#f1f5f9' }}>
          <button
            type="button"
            className={`segmented-btn ${activeSubTab === 'calendar' ? 'active' : ''}`}
            style={{ 
              padding: '8px 18px', 
              fontSize: '0.85rem',
              color: activeSubTab === 'calendar' ? '#b45309' : '#64748b'
            }}
            onClick={() => setActiveSubTab('calendar')}
          >
            <Calendar size={16} />
            Calendario de Alquiler
          </button>
          <button
            type="button"
            className={`segmented-btn ${activeSubTab === 'invoices' ? 'active' : ''}`}
            style={{ 
              padding: '8px 18px', 
              fontSize: '0.85rem',
              color: activeSubTab === 'invoices' ? '#4338ca' : '#64748b'
            }}
            onClick={() => setActiveSubTab('invoices')}
          >
            <FileText size={16} />
            Facturas & Invoices ({filteredRentals.length})
          </button>
          <button
            type="button"
            className={`segmented-btn ${activeSubTab === 'trips' ? 'active' : ''}`}
            style={{ 
              padding: '8px 18px', 
              fontSize: '0.85rem',
              color: activeSubTab === 'trips' ? '#15803d' : '#64748b'
            }}
            onClick={() => setActiveSubTab('trips')}
          >
            <Truck size={16} />
            Viajes & Fletes Uber ({trips.length})
          </button>
        </div>

        <div className="badge font-medium" style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', color: '#475569', padding: '6px 12px' }}>
          Tarifa fija del camión: <strong style={{ color: '#b45309', marginLeft: '4px' }}>{formatMoney(settings.dailyRentalRate)} / día</strong>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 5. VISTA A: CALENDARIO INTEGRADO EN CUADRÍCULA REAL DE 7 COLUMNAS         */}
      {/* ========================================================================= */}
      {activeSubTab === 'calendar' && (
        <div className="truck-calendar-container">
          {/* Navegación del Mes con Botones Claros y de Alto Contraste */}
          <div className="flex items-center justify-between pb-4" style={{ borderBottom: '1px solid #e2e8f0' }}>
            <div className="flex items-center gap-3">
              <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#fffbeb', border: '1px solid #fde68a', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#d97706' }}>
                <CalendarDays size={20} />
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: 0, textTransform: 'capitalize', letterSpacing: '-0.02em' }}>
                {monthNames[currentCalendarDate.getMonth()]} {currentCalendarDate.getFullYear()}
              </h3>
            </div>

            <div className="flex items-center gap-1.5" style={{ background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '3px' }}>
              <button 
                type="button"
                className="btn btn-sm btn-outline"
                style={{ padding: '5px 10px', border: 'none', background: 'transparent', color: '#475569' }}
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
                type="button"
                className="btn btn-sm"
                style={{ padding: '5px 14px', background: '#ffffff', border: '1px solid #e2e8f0', color: '#0f172a', fontWeight: 600, boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}
                onClick={() => setCurrentCalendarDate(new Date())}
              >
                Hoy
              </button>
              <button 
                type="button"
                className="btn btn-sm btn-outline"
                style={{ padding: '5px 10px', border: 'none', background: 'transparent', color: '#475569' }}
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

          {/* Días de la semana (Encabezado 7 columnas) */}
          <div className="truck-calendar-header-weekdays">
            <div>Lun</div>
            <div>Mar</div>
            <div>Mié</div>
            <div>Jue</div>
            <div>Vie</div>
            <div>Sáb</div>
            <div>Dom</div>
          </div>

          {/* Cuadrícula de 7 Columnas */}
          <div className="truck-calendar-grid">
            {calendarDaysMatrix.map((item) => {
              if (item.empty) {
                return (
                  <div key={item.key} className="calendar-tile is-empty" />
                );
              }

              const isToday = new Date().toISOString().split('T')[0] === item.dateStr;
              const hasRental = !!item.rental;
              const isFilteredDriverMatch = !hasRental || filterDriver === 'all' || 
                item.rental.tenantName.toLowerCase().includes(filterDriver.toLowerCase());

              return (
                <div 
                  key={item.key}
                  className={`calendar-tile ${hasRental ? 'is-rented' : 'is-available'} ${isToday ? 'is-today' : ''} ${!isFilteredDriverMatch ? 'is-dimmed' : ''}`}
                >
                  {/* Encabezado del día */}
                  <div className="calendar-day-header">
                    <span className="calendar-day-num">
                      {item.dayNum}
                    </span>
                    {isToday && (
                      <span className="calendar-today-badge">Hoy</span>
                    )}
                  </div>

                  {/* Cuerpo del día */}
                  {hasRental ? (
                    <div className="calendar-rented-info">
                      <div className="calendar-driver-name" title={item.rental.tenantName}>
                        👤 {item.rental.tenantName}
                      </div>
                      <div className="calendar-driver-rate">
                        {formatMoney(item.rental.dailyRate)} / día
                      </div>

                      {/* Botón obvio e interactivo para ver la factura */}
                      <button 
                        type="button"
                        className="calendar-action-btn calendar-btn-invoice-action"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenRentalInvoice(item.rental);
                        }}
                        title="Ver documento completo de alquiler"
                      >
                        <FileText size={12} /> Ver Factura
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col justify-end gap-1 mt-auto">
                      <div className="text-[10px] text-secondary/60 text-center">
                        Disponible
                      </div>
                      <button 
                        type="button"
                        className="calendar-action-btn calendar-btn-book-action"
                        onClick={() => handleStartBooking(item.dateStr)}
                        title="Alquilar este día"
                      >
                        <Plus size={11} /> Alquilar
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Leyenda y Explicación al pie del calendario */}
          <div className="flex items-center justify-between text-xs text-secondary pt-3 flex-wrap gap-2" style={{ borderTop: '1px solid #e2e8f0' }}>
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5 font-medium" style={{ color: '#0f172a' }}>
                <span className="w-3 h-3 rounded inline-block" style={{ backgroundColor: '#f59e0b', border: '1px solid #d97706' }} /> Días Alquilados (tocá "Ver Factura" para abrir el comprobante)
              </span>
              <span className="flex items-center gap-1.5 font-medium text-secondary">
                <span className="w-3 h-3 rounded inline-block" style={{ backgroundColor: '#ffffff', border: '1px solid #cbd5e1' }} /> Días Libres (tocá "+ Alquilar" para agendar)
              </span>
            </div>
            <span>
              Tarifa estándar pactada: <strong style={{ color: '#b45309' }}>{formatMoney(settings.dailyRentalRate)} / día</strong>
            </span>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. VISTA B: LISTADO DE INVOICES & FACTURAS DE ALQUILER                     */}
      {/* ========================================================================= */}
      {activeSubTab === 'invoices' && (
        <div className="card p-0 overflow-hidden" style={{ background: '#ffffff', border: '1px solid #e2e8f0', boxShadow: 'var(--shadow-sm)' }}>
          <div className="p-4 flex items-center justify-between flex-wrap gap-3" style={{ borderBottom: '1px solid #e2e8f0' }}>
            <div>
              <h3 className="font-bold flex items-center gap-2 text-base" style={{ color: '#0f172a' }}>
                <FileText size={18} className="text-accent" />
                Liquidaciones & Invoices Generados
              </h3>
              <p className="text-xs text-secondary mt-0.5">
                Facturas emitidas para el inquilino con cálculo de días y tarifas definidas por el dueño
              </p>
            </div>
            <button 
              type="button"
              className="btn btn-primary text-xs" 
              style={{ backgroundColor: '#4f46e5', color: '#fff', fontWeight: 600 }}
              onClick={() => handleStartBooking(new Date().toISOString().split('T')[0])}
            >
              <Plus size={15} /> + Nuevo Invoice
            </button>
          </div>

          {filteredRentals.length === 0 ? (
            <div className="p-10 text-center text-secondary text-sm">
              <FileText size={40} className="mx-auto mb-2 opacity-30 text-accent" />
              {hasActiveFilters ? 'No se encontraron facturas con los filtros seleccionados.' : 'No hay facturas generadas todavía. Asigná días en el calendario para crear la primera.'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs" style={{ borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #e2e8f0', background: '#f8fafc', color: '#475569' }}>
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
                  {filteredRentals.map(rental => (
                    <tr key={rental.id} style={{ borderBottom: '1px solid #f1f5f9' }} className="hover:bg-slate-50 transition-all">
                      <td className="p-3 font-mono font-bold whitespace-nowrap" style={{ color: '#0f172a' }}>
                        <span className="px-2 py-0.5 rounded font-mono font-semibold" style={{ background: '#f1f5f9', border: '1px solid #e2e8f0', color: '#0f172a' }}>
                          {rental.invoiceNumber}
                        </span>
                      </td>
                      <td className="p-3 whitespace-nowrap">
                        <div className="font-semibold" style={{ color: '#0f172a' }}>{rental.tenantName}</div>
                        {rental.tenantPhone && <div className="text-[11px] text-secondary">{rental.tenantPhone}</div>}
                      </td>
                      <td className="p-3 whitespace-nowrap">
                        <div className="font-medium" style={{ color: '#0f172a' }}>{rental.startDate} al {rental.endDate}</div>
                        <div className="text-[11px] text-secondary">{rental.daysCount} días contratados</div>
                      </td>
                      <td className="p-3 font-medium whitespace-nowrap" style={{ color: '#0f172a' }}>
                        {formatMoney(rental.dailyRate)} / día
                      </td>
                      <td className="p-3 font-bold whitespace-nowrap font-mono" style={{ color: '#0f172a' }}>
                        {formatMoney(rental.totalAmount)}
                      </td>
                      <td className="p-3 font-semibold whitespace-nowrap font-mono" style={{ color: '#16a34a' }}>
                        {formatMoney(rental.paidAmount || 0)}
                      </td>
                      <td className="p-3 font-bold whitespace-nowrap font-mono">
                        <span style={{ color: rental.balanceDue > 0 ? '#b45309' : '#16a34a' }}>
                          {formatMoney(rental.balanceDue)}
                        </span>
                      </td>
                      <td className="p-3 whitespace-nowrap">
                        <span className="px-2.5 py-0.5 rounded text-[11px] font-bold" style={{ background: rental.balanceDue <= 0 ? '#dcfce7' : '#fef3c7', color: rental.balanceDue <= 0 ? '#15803d' : '#b45309', border: rental.balanceDue <= 0 ? '1px solid #bbf7d0' : '1px solid #fde68a' }}>
                          {rental.balanceDue <= 0 ? 'Pagado' : 'Pendiente'}
                        </span>
                      </td>
                      <td className="p-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            type="button"
                            className="btn btn-primary text-xs py-1.5 px-3 rounded-lg"
                            style={{ backgroundColor: '#eef2ff', color: '#4338ca', borderColor: '#c7d2fe', border: '1px solid' }}
                            onClick={() => handleOpenRentalInvoice(rental)}
                            title="Ver documento completo para imprimir o enviar"
                          >
                            <Eye size={13} /> Ver Invoice
                          </button>
                          <button 
                            type="button"
                            className="btn btn-outline p-1.5 rounded-lg"
                            style={{ color: '#dc2626', borderColor: 'transparent', background: '#fef2f2' }}
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
      {/* 7. VISTA C: PLANILLA ESTILO UBER (VIAJES Y FLETES)                        */}
      {/* ========================================================================= */}
      {activeSubTab === 'trips' && (
        <div className="card p-0 overflow-hidden" style={{ background: '#ffffff', border: '1px solid #e2e8f0', boxShadow: 'var(--shadow-sm)' }}>
          <div className="p-4 flex items-center justify-between" style={{ borderBottom: '1px solid #e2e8f0' }}>
            <h3 className="font-bold flex items-center gap-2 text-base" style={{ color: '#0f172a' }}>
              <Truck size={18} className="text-warning" />
              Fletes y Viajes Realizados (Estilo Uber)
            </h3>
            <button 
              type="button"
              className="btn btn-primary text-xs" 
              style={{ backgroundColor: '#f59e0b', color: '#ffffff', fontWeight: 700 }}
              onClick={() => setShowTripModal(true)}
            >
              <Plus size={15} /> + Cargar Flete
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs" style={{ borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #e2e8f0', background: '#f8fafc', color: '#475569' }}>
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
                  <tr key={trip.id} style={{ borderBottom: '1px solid #f1f5f9' }} className="hover:bg-slate-50 transition-all">
                    <td className="p-3 whitespace-nowrap" style={{ color: '#0f172a' }}>{trip.date}</td>
                    <td className="p-3">
                      <div className="font-semibold" style={{ color: '#0f172a' }}>{trip.client}</div>
                      <div className="text-[11px] text-secondary flex items-center gap-1 mt-0.5">
                        <MapPin size={11} className="text-accent" />
                        <span>{trip.origin}</span> → <span>{trip.destination}</span>
                      </div>
                    </td>
                    <td className="p-3 whitespace-nowrap" style={{ color: '#0f172a' }}>{trip.km} km</td>
                    <td className="p-3 font-bold whitespace-nowrap font-mono" style={{ color: '#0f172a' }}>{formatMoney(trip.grossAmount)}</td>
                    <td className="p-3 text-secondary whitespace-nowrap">
                      <div>Gasoil: {formatMoney(trip.fuelCost)}</div>
                    </td>
                    <td className="p-3 font-semibold whitespace-nowrap font-mono" style={{ color: '#b45309' }}>{formatMoney(trip.ownerEarnings)}</td>
                    <td className="p-3 font-semibold whitespace-nowrap font-mono" style={{ color: '#16a34a' }}>{formatMoney(trip.driverEarnings)}</td>
                    <td className="p-3 text-right whitespace-nowrap">
                      <button 
                        type="button"
                        className="btn btn-outline p-1.5 rounded-lg"
                        style={{ color: '#dc2626', borderColor: 'transparent', background: '#fef2f2' }}
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
            <button type="button" className="btn btn-outline absolute top-4 right-4 p-1 border-none" onClick={() => setShowRentalModal(false)}>
              <X size={20} />
            </button>

            <h3 className="text-xl font-bold mb-1 flex items-center gap-2" style={{ color: '#0f172a' }}>
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
              <div className="p-3.5 rounded-lg" style={{ backgroundColor: '#fffbeb', border: '1px solid #fde68a' }}>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold block uppercase tracking-wider" style={{ color: '#b45309' }}>
                    Tarifa de Alquiler por Día (Fijada por Dueño) *
                  </label>
                  <span className="text-[11px] text-secondary">
                    Total: <strong style={{ color: '#0f172a' }}>{computedRentalDays} días</strong>
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-lg" style={{ color: '#0f172a' }}>$</span>
                  <input 
                    type="number" 
                    className="input flex-1 font-bold text-lg font-mono" 
                    value={rentalForm.dailyRate} 
                    onChange={e => setRentalForm({ ...rentalForm, dailyRate: parseFloat(e.target.value) || 0 })} 
                    required 
                  />
                  <span className="text-xs text-secondary">por día</span>
                </div>

                <div className="flex justify-between items-center text-xs mt-2.5 pt-2" style={{ borderTop: '1px solid #fde68a' }}>
                  <span className="text-secondary">Subtotal de Alquiler ({computedRentalDays} días × {formatMoney(rentalForm.dailyRate)}):</span>
                  <strong className="text-sm font-mono" style={{ color: '#0f172a' }}>{formatMoney(computedRentalSubtotal)}</strong>
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

              <div className="p-3 rounded-lg flex justify-between items-center text-sm" style={{ background: '#f8fafc', border: '1px solid #e2e8f0', color: '#0f172a' }}>
                <span>TOTAL DEL INVOICE A EMITIR:</span>
                <strong className="text-lg font-bold font-mono" style={{ color: '#b45309' }}>{formatMoney(computedRentalTotal)}</strong>
              </div>

              <button type="submit" className="btn btn-primary mt-1" style={{ backgroundColor: '#f59e0b', color: '#ffffff', fontWeight: 700, padding: '10px' }}>
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
            <button type="button" className="btn btn-outline absolute top-4 right-4 p-1 border-none" onClick={() => setShowTripModal(false)}>
              <X size={20} />
            </button>

            <h3 className="text-xl font-bold mb-3 flex items-center gap-2" style={{ color: '#0f172a' }}>
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

              <button type="submit" className="btn btn-primary mt-1" style={{ backgroundColor: '#f59e0b', color: '#ffffff', fontWeight: 700 }}>
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
            <button type="button" className="btn btn-outline absolute top-4 right-4 p-1 border-none" onClick={() => setShowPaymentModal(false)}>
              <X size={20} />
            </button>

            <h3 className="text-xl font-bold mb-3 flex items-center gap-2" style={{ color: '#0f172a' }}>
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
                  className="input w-full font-bold text-lg font-mono" 
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
                      {r.invoiceNumber} - {r.tenantName} ({formatMoney(r.balanceDue)} pend.)
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

              <button type="submit" className="btn btn-primary mt-1" style={{ backgroundColor: '#10b981', color: '#ffffff', fontWeight: 600 }}>
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
            <button type="button" className="btn btn-outline absolute top-4 right-4 p-1 border-none" onClick={() => setShowSettingsModal(false)}>
              <X size={20} />
            </button>

            <h3 className="text-xl font-bold mb-3 flex items-center gap-2" style={{ color: '#0f172a' }}>
              <Settings size={22} className="text-warning" /> Tarifas del Dueño & Configuración
            </h3>

            <div className="flex flex-col gap-4">
              {/* Tarifas de Alquiler Definidas por Ramiro */}
              <div className="p-3.5 rounded-lg" style={{ backgroundColor: '#fffbeb', border: '1px solid #fde68a' }}>
                <label className="text-xs font-bold mb-2 block uppercase tracking-wider" style={{ color: '#b45309' }}>
                  Valores del Alquiler Fijados por el Dueño
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-secondary mb-1 block">Tarifa por Día ($)</label>
                    <input 
                      type="number" 
                      className="input w-full font-bold font-mono" 
                      value={settings.dailyRentalRate} 
                      onChange={e => setSettings({ ...settings, dailyRentalRate: parseFloat(e.target.value) || 0 })} 
                    />
                  </div>
                  <div>
                    <label className="text-xs text-secondary mb-1 block">Tarifa por Semana ($)</label>
                    <input 
                      type="number" 
                      className="input w-full font-bold font-mono" 
                      value={settings.weeklyRentalRate} 
                      onChange={e => setSettings({ ...settings, weeklyRentalRate: parseFloat(e.target.value) || 0 })} 
                    />
                  </div>
                </div>
              </div>

              {/* Datos Bancarios del Dueño (para que salgan en los Invoices) */}
              <div className="p-3.5 rounded-lg" style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                <label className="text-xs font-bold mb-2 flex items-center gap-1.5 uppercase tracking-wider" style={{ color: '#0f172a' }}>
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
                      className="input w-full font-mono font-semibold" 
                      style={{ color: '#b45309' }}
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
              <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '0.75rem' }}>
                <label className="text-xs font-semibold mb-1.5 flex items-center gap-1.5" style={{ color: '#b45309' }}>
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
            <button type="button" className="btn btn-outline absolute top-4 right-4 p-1 border-none" onClick={() => setShowShareModal(false)}>
              <X size={20} />
            </button>

            <h3 className="text-xl font-bold mb-3 flex items-center gap-2" style={{ color: '#0f172a' }}>
              <Share2 size={22} className="text-success" /> Resumen de Alquiler para WhatsApp
            </h3>

            <div className="p-3.5 rounded-lg font-mono text-xs whitespace-pre-wrap leading-relaxed select-all" style={{ backgroundColor: '#f8fafc', border: '1px solid #cbd5e1', color: '#1e293b' }}>
              {generateWhatsAppSummary()}
            </div>

            <div className="flex gap-2 mt-4">
              <button 
                type="button"
                className="btn btn-primary flex-1" 
                style={{ backgroundColor: '#22c55e', color: '#fff', fontWeight: 600 }}
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
                  style={{ borderColor: '#22c55e', color: '#15803d', background: '#f0fdf4' }}
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
