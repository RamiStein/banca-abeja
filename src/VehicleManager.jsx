import React, { useState, useEffect } from 'react';
import { Car, AlertTriangle, Settings, FileText, Phone, Plus, History, X, BarChart3, Activity, Users, Filter, CheckCircle, Wrench, Shield, Sparkles, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';

export default function VehicleManager() {
  // Car Selection
  const [activeCar, setActiveCar] = useState('Clio');

  // Parameters per car (Fuel & Multiplier)
  const defaultParams = {
    Clio: { gasPrice: 2100, consumption: 7, multiplier: 2.5 },
    Etios: { gasPrice: 2100, consumption: 8, multiplier: 2.5 }
  };
  
  const [carParams, setCarParams] = useState(() => {
    const saved = localStorage.getItem('vehicleParams');
    return saved ? JSON.parse(saved) : defaultParams;
  });

  useEffect(() => {
    localStorage.setItem('vehicleParams', JSON.stringify(carParams));
  }, [carParams]);

  const updateParam = (key, value) => {
    setCarParams(prev => ({
      ...prev,
      [activeCar]: {
        ...prev[activeCar],
        [key]: value
      }
    }));
  };

  const { gasPrice, consumption, multiplier } = carParams[activeCar] || defaultParams[activeCar];

  // Maintenance Config per car (Self-administered)
  const defaultMaintenance = {
    Clio: {
      baseOdometer: 125000,
      lastOilKm: 120000,
      oilInterval: 10000,
      lastTireKm: 100000,
      tireInterval: 50000,
      insuranceCost: 90000,
      insurancePaid: false,
      batteryMonthsRemaining: 16
    },
    Etios: {
      baseOdometer: 85000,
      lastOilKm: 80000,
      oilInterval: 10000,
      lastTireKm: 60000,
      tireInterval: 50000,
      insuranceCost: 90000,
      insurancePaid: true,
      batteryMonthsRemaining: 22
    }
  };

  const [maintenanceData, setMaintenanceData] = useState(() => {
    const saved = localStorage.getItem('vehicleMaintenance');
    return saved ? JSON.parse(saved) : defaultMaintenance;
  });

  const [isEditingMaintenance, setIsEditingMaintenance] = useState(false);

  useEffect(() => {
    localStorage.setItem('vehicleMaintenance', JSON.stringify(maintenanceData));
  }, [maintenanceData]);

  const currentMaint = maintenanceData[activeCar] || defaultMaintenance[activeCar];

  const updateMaintenanceField = (field, value) => {
    setMaintenanceData(prev => ({
      ...prev,
      [activeCar]: {
        ...prev[activeCar],
        [field]: value
      }
    }));
  };

  // Trip inputs
  const [kmInput, setKmInput] = useState('');
  const [client, setClient] = useState('');
  const [paidNafta, setPaidNafta] = useState(true);
  const [paidAmortization, setPaidAmortization] = useState(true);
  
  // Ledger
  const [trips, setTrips] = useState(() => {
    const saved = localStorage.getItem('vehicleTrips');
    if (saved) {
      const parsed = JSON.parse(saved);
      return parsed.map(t => {
        let updated = { ...t };
        if (updated.paymentStatus) {
          updated.paidNafta = updated.paymentStatus.includes('Completo') || updated.paymentStatus.includes('Solo');
          updated.paidAmortization = updated.paymentStatus.includes('Completo');
          updated.client = updated.client || 'Amigo';
          delete updated.paymentStatus;
        }
        if (!updated.car) {
          updated.car = 'Clio';
        }
        return updated;
      });
    }
    return [];
  });

  const [filter, setFilter] = useState('Todos'); // Todos, Deuda Nafta, Deuda Amort

  useEffect(() => {
    localStorage.setItem('vehicleTrips', JSON.stringify(trips));
  }, [trips]);

  // Derived Calculations for current trip
  const fuelCostPerKm = (gasPrice * consumption) / 100;
  const realCostPerKm = fuelCostPerKm * multiplier;
  
  const km = parseFloat(kmInput) || 0;
  const naftaTotal = km * fuelCostPerKm;
  const pozoTotal = (km * realCostPerKm) - naftaTotal;
  const tripTotal = naftaTotal + pozoTotal;

  const handleRegisterTrip = () => {
    if (!km || km <= 0) {
      alert("Por favor ingresa una cantidad de KM válida.");
      return;
    }
    if (!client.trim()) {
      alert("Por favor selecciona quién usó el auto.");
      return;
    }
    
    const newTrip = {
      id: Date.now().toString(),
      date: new Date().toLocaleDateString('es-AR'),
      km,
      client: client.trim(),
      naftaTotal,
      pozoTotal,
      tripTotal,
      paidNafta,
      paidAmortization,
      pozoFunded: paidAmortization ? pozoTotal : 0,
      car: activeCar
    };

    setTrips([newTrip, ...trips]);
    setKmInput('');
    setClient('');
    setPaidNafta(true);
    setPaidAmortization(true);
  };

  const deleteTrip = (id) => {
    if(window.confirm("¿Borrar este registro?")) {
      setTrips(trips.filter(t => t.id !== id));
    }
  };

  const markNaftaPaid = (id) => {
    setTrips(trips.map(t => {
      if (t.id === id) return { ...t, paidNafta: true };
      return t;
    }));
  };

  const markAmortizationPaid = (id) => {
    setTrips(trips.map(t => {
      if (t.id === id) return { ...t, paidAmortization: true, pozoFunded: t.pozoTotal };
      return t;
    }));
  };

  // Filter trips for the active car
  const activeCarTrips = trips.filter(t => t.car === activeCar);

  // Ledger Summary (for active car)
  const totalKm = activeCarTrips.reduce((acc, t) => acc + t.km, 0);
  const totalPozoTeorico = activeCarTrips.reduce((acc, t) => acc + t.pozoTotal, 0);
  const totalPozoReal = activeCarTrips.reduce((acc, t) => acc + t.pozoFunded, 0);

  // User Stats (for active car)
  const userStats = activeCarTrips.reduce((acc, trip) => {
    const user = trip.client.toLowerCase();
    if (!acc[user]) {
      acc[user] = { name: trip.client, km: 0, deudaNafta: 0, deudaAmortizacion: 0 };
    }
    acc[user].km += trip.km;
    if (!trip.paidNafta) acc[user].deudaNafta += trip.naftaTotal;
    if (!trip.paidAmortization) acc[user].deudaAmortizacion += trip.pozoTotal;
    return acc;
  }, {});
  const usersArray = Object.values(userStats).sort((a, b) => b.km - a.km);

  // Filtering for table
  const filteredTrips = activeCarTrips.filter(trip => {
    if (filter === 'Todos') return true;
    if (filter === 'Deuda Nafta') return !trip.paidNafta;
    if (filter === 'Deuda Amort') return !trip.paidAmortization;
    return true;
  });

  // Dynamic Maintenance Calculations based on real KMs
  const currentOdometer = (currentMaint.baseOdometer || 0) + totalKm;
  
  // 1. Oil Service (every 10,000 km)
  const kmSinceLastOil = Math.max(0, currentOdometer - (currentMaint.lastOilKm || currentOdometer));
  const oilRemainingKm = (currentMaint.oilInterval || 10000) - kmSinceLastOil;
  const oilPercentRemaining = Math.max(0, Math.min(100, Math.round((oilRemainingKm / (currentMaint.oilInterval || 10000)) * 100)));

  // 2. Tires (Standard duration 50,000 km)
  const kmSinceLastTires = Math.max(0, currentOdometer - (currentMaint.lastTireKm || currentOdometer));
  const tiresRemainingKm = (currentMaint.tireInterval || 50000) - kmSinceLastTires;
  const tiresPercentRemaining = Math.max(0, Math.min(100, Math.round((tiresRemainingKm / (currentMaint.tireInterval || 50000)) * 100)));

  // Quick Maintenance Actions
  const handleRegisterOilChange = () => {
    if (window.confirm(`¿Confirmar cambio de aceite y filtros realizado en el KM ${currentOdometer.toLocaleString('es-AR')}?`)) {
      updateMaintenanceField('lastOilKm', currentOdometer);
    }
  };

  const handleRegisterTireChange = () => {
    if (window.confirm(`¿Confirmar cambio de neumáticos realizado en el KM ${currentOdometer.toLocaleString('es-AR')}?`)) {
      updateMaintenanceField('lastTireKm', currentOdometer);
    }
  };

  const handleToggleInsurance = () => {
    updateMaintenanceField('insurancePaid', !currentMaint.insurancePaid);
  };

  return (
    <div className="flex flex-col gap-6">
      
      {/* Header integrado */}
      <div className="flex justify-between items-center mb-2 flex-wrap gap-4 vehicle-header-responsive">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Car color="var(--accent-color)" size={28} />
            Auto Compartido <span style={{fontSize: '0.8rem', padding: '2px 8px', backgroundColor: 'rgba(245, 158, 11, 0.2)', color: 'var(--warning)', borderRadius: '12px', marginLeft: '8px'}}>Control & Mantenimiento</span>
          </h2>
          <p className="text-secondary mt-1">Gestión de kilómetros, nafta, seguro y pozo de amortización entre amigos.</p>
        </div>
        
        {/* Car Selector */}
        <div className="vehicle-selector-bar">
          <button 
            className="btn"
            style={{ 
              backgroundColor: activeCar === 'Clio' ? 'var(--accent-color)' : 'transparent', 
              color: activeCar === 'Clio' ? '#fff' : 'var(--text-secondary)',
              border: 'none', padding: '0.5rem 1rem', fontWeight: 'bold'
            }}
            onClick={() => setActiveCar('Clio')}
          >
            Renault Clio
          </button>
          <button 
            className="btn"
            style={{ 
              backgroundColor: activeCar === 'Etios' ? 'var(--accent-color)' : 'transparent', 
              color: activeCar === 'Etios' ? '#fff' : 'var(--text-secondary)',
              border: 'none', padding: '0.5rem 1rem', fontWeight: 'bold'
            }}
            onClick={() => setActiveCar('Etios')}
          >
            Toyota Etios
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem', width: '100%' }}>
        
        {/* Columna Izquierda */}
        <div className="flex flex-col gap-6" style={{ flex: '1 1 55%', minWidth: 'min(100%, 300px)', width: '100%' }}>
          
          {/* Card: Calculadora y Registro */}
          <div className="card">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
              <BarChart3 className="text-secondary" size={24} />
              Registrar Viaje ({activeCar})
            </h3>
            
            <div className="flex flex-col gap-6">
              {/* Parámetros Editables */}
              <div className="grid grid-cols-3 gap-4 pb-6" style={{ borderBottom: '1px solid var(--border-color)' }}>
                <div>
                  <label className="text-secondary font-semibold" style={{ fontSize: '0.85rem', display: 'block', marginBottom: '4px' }}>Nafta ($/L)</label>
                  <input type="number" className="input" value={gasPrice} onChange={(e) => updateParam('gasPrice', Number(e.target.value))} />
                </div>
                <div>
                  <label className="text-secondary font-semibold" style={{ fontSize: '0.85rem', display: 'block', marginBottom: '4px' }}>Consumo (L/100km)</label>
                  <input type="number" className="input" value={consumption} onChange={(e) => updateParam('consumption', Number(e.target.value))} />
                </div>
                <div>
                  <label className="text-secondary font-semibold" style={{ fontSize: '0.85rem', display: 'block', marginBottom: '4px' }}>Factor (Desgaste)</label>
                  <input type="number" step="0.1" className="input" value={multiplier} onChange={(e) => updateParam('multiplier', Number(e.target.value))} />
                </div>
              </div>

              {/* Inputs del Viaje */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                <div>
                  <label className="font-semibold" style={{ fontSize: '0.9rem', display: 'block', marginBottom: '4px' }}>¿Quién usó el auto?</label>
                  <select className="input" value={client} onChange={(e) => setClient(e.target.value)}>
                    <option value="" disabled>Seleccionar amigo...</option>
                    <option value="Cristian">Cristian</option>
                    <option value="Ramiro">Ramiro</option>
                    <option value="Agustina">Agustina</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold" style={{ fontSize: '0.9rem', display: 'block', marginBottom: '4px' }}>Kilómetros recorridos</label>
                  <input type="number" placeholder="Ej. 100" className="input" value={kmInput} onChange={(e) => setKmInput(e.target.value)} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 140px), 1fr))', gap: '1rem', backgroundColor: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                <div>
                  <label className="font-semibold" style={{ fontSize: '0.9rem', display: 'block', marginBottom: '8px' }}>¿Pagó la Nafta?</label>
                  <div className="flex gap-2">
                    <button className="btn" style={{ flex: 1, backgroundColor: paidNafta ? 'rgba(16, 185, 129, 0.2)' : 'transparent', color: paidNafta ? 'var(--success)' : 'var(--text-secondary)', border: paidNafta ? '1px solid var(--success)' : '1px solid var(--border-color)' }} onClick={() => setPaidNafta(true)}>Sí</button>
                    <button className="btn" style={{ flex: 1, backgroundColor: !paidNafta ? 'rgba(239, 68, 68, 0.2)' : 'transparent', color: !paidNafta ? 'var(--danger)' : 'var(--text-secondary)', border: !paidNafta ? '1px solid var(--danger)' : '1px solid var(--border-color)' }} onClick={() => setPaidNafta(false)}>No (Debe)</button>
                  </div>
                </div>
                <div>
                  <label className="font-semibold" style={{ fontSize: '0.9rem', display: 'block', marginBottom: '8px' }}>¿Pagó Amortización?</label>
                  <div className="flex gap-2">
                    <button className="btn" style={{ flex: 1, backgroundColor: paidAmortization ? 'rgba(16, 185, 129, 0.2)' : 'transparent', color: paidAmortization ? 'var(--success)' : 'var(--text-secondary)', border: paidAmortization ? '1px solid var(--success)' : '1px solid var(--border-color)' }} onClick={() => setPaidAmortization(true)}>Sí</button>
                    <button className="btn" style={{ flex: 1, backgroundColor: !paidAmortization ? 'rgba(239, 68, 68, 0.2)' : 'transparent', color: !paidAmortization ? 'var(--danger)' : 'var(--text-secondary)', border: !paidAmortization ? '1px solid var(--danger)' : '1px solid var(--border-color)' }} onClick={() => setPaidAmortization(false)}>No (Debe)</button>
                  </div>
                </div>
              </div>

              {/* Desglose en tiempo real */}
              {km > 0 && (
                <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '1.25rem' }}>
                  <div className="flex justify-between mb-2 text-secondary" style={{ fontSize: '0.9rem' }}>
                    <span>Valor Nafta ({km}km):</span>
                    <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>${naftaTotal.toLocaleString('es-AR', {maximumFractionDigits:0})}</span>
                  </div>
                  <div className="flex justify-between mb-2 text-secondary" style={{ fontSize: '0.9rem' }}>
                    <span>Valor Amortización (Pozo):</span>
                    <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>${pozoTotal.toLocaleString('es-AR', {maximumFractionDigits:0})}</span>
                  </div>
                </div>
              )}

              <button className="btn btn-primary w-full" style={{ width: '100%', padding: '0.8rem' }} onClick={handleRegisterTrip}>
                <Plus size={18} /> Registrar Viaje en {activeCar}
              </button>
            </div>
          </div>
          
          {/* Card: Registro Contable (Tabla) */}
          <div className="card">
            <div className="flex justify-between items-center mb-6 flex-wrap gap-2">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <History className="text-secondary" size={24} />
                Historial de Viajes ({activeCar})
              </h3>
              
              <div className="flex gap-2" style={{ backgroundColor: 'rgba(0,0,0,0.2)', padding: '4px', borderRadius: '8px' }}>
                <button 
                  onClick={() => setFilter('Todos')}
                  style={{ padding: '4px 12px', fontSize: '0.8rem', borderRadius: '6px', border: 'none', cursor: 'pointer', backgroundColor: filter === 'Todos' ? 'rgba(255,255,255,0.1)' : 'transparent', color: filter === 'Todos' ? '#fff' : 'var(--text-secondary)' }}
                >Todos</button>
                <button 
                  onClick={() => setFilter('Deuda Nafta')}
                  style={{ padding: '4px 12px', fontSize: '0.8rem', borderRadius: '6px', border: 'none', cursor: 'pointer', backgroundColor: filter === 'Deuda Nafta' ? 'rgba(239, 68, 68, 0.2)' : 'transparent', color: filter === 'Deuda Nafta' ? 'var(--danger)' : 'var(--text-secondary)' }}
                >Deuda Nafta</button>
                <button 
                  onClick={() => setFilter('Deuda Amort')}
                  style={{ padding: '4px 12px', fontSize: '0.8rem', borderRadius: '6px', border: 'none', cursor: 'pointer', backgroundColor: filter === 'Deuda Amort' ? 'rgba(245, 158, 11, 0.2)' : 'transparent', color: filter === 'Deuda Amort' ? 'var(--warning)' : 'var(--text-secondary)' }}
                >Deuda Amort.</button>
              </div>
            </div>
            
            <div className="table-container">
              {filteredTrips.length === 0 ? (
                <div className="text-center py-8 text-secondary flex flex-col items-center gap-2">
                  <Filter size={32} opacity={0.5} />
                  No hay viajes de {activeCar} que coincidan.
                </div>
              ) : (
                <table>
                  <thead>
                    <tr>
                      <th>Fecha</th>
                      <th>Amigo</th>
                      <th style={{ textAlign: 'center' }}>KM</th>
                      <th style={{ textAlign: 'center' }}>Nafta</th>
                      <th style={{ textAlign: 'center' }}>Amortización</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTrips.map(trip => (
                      <tr key={trip.id}>
                        <td className="text-secondary" style={{ fontSize: '0.85rem' }}>{trip.date}</td>
                        <td className="font-bold">{trip.client}</td>
                        <td style={{ textAlign: 'center' }} className="text-secondary">{trip.km}</td>
                        <td style={{ textAlign: 'center' }}>
                          <div className="flex flex-col items-center gap-1">
                            <span style={{ 
                              padding: '4px 8px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 600,
                              backgroundColor: trip.paidNafta ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.2)',
                              color: trip.paidNafta ? 'var(--success)' : 'var(--danger)', border: trip.paidNafta ? '1px solid rgba(16,185,129,0.2)' : '1px solid rgba(239,68,68,0.5)'
                            }}>
                              {trip.paidNafta ? 'Pagado' : `$${trip.naftaTotal.toLocaleString('es-AR', {maximumFractionDigits:0})}`}
                            </span>
                            {!trip.paidNafta && (
                              <button onClick={() => markNaftaPaid(trip.id)} className="text-secondary hover:text-success transition" style={{ fontSize: '0.65rem', textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer' }}>
                                Saldar
                              </button>
                            )}
                          </div>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <div className="flex flex-col items-center gap-1">
                            <span style={{ 
                              padding: '4px 8px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 600,
                              backgroundColor: trip.paidAmortization ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.2)',
                              color: trip.paidAmortization ? 'var(--success)' : 'var(--warning)', border: trip.paidAmortization ? '1px solid rgba(16,185,129,0.2)' : '1px solid rgba(245,158,11,0.5)'
                            }}>
                              {trip.paidAmortization ? 'Al Pozo' : `Debe $${trip.pozoTotal.toLocaleString('es-AR', {maximumFractionDigits:0})}`}
                            </span>
                            {!trip.paidAmortization && (
                              <button onClick={() => markAmortizationPaid(trip.id)} className="text-secondary hover:text-success transition" style={{ fontSize: '0.65rem', textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer' }}>
                                Saldar
                              </button>
                            )}
                          </div>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <button onClick={() => deleteTrip(trip.id)} className="btn btn-outline" style={{ padding: '0.25rem 0.5rem', borderColor: 'transparent', color: 'var(--text-secondary)' }}>
                            <X size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

        </div>

        {/* Columna Derecha */}
        <div className="flex flex-col gap-6" style={{ flex: '1 1 40%', minWidth: 'min(100%, 280px)', width: '100%' }}>
          
          {/* Card: Resumen por Usuario */}
          <div className="card" style={{ borderTop: '4px solid #8b5cf6' }}>
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Users color="#8b5cf6" size={24} />
              Resumen por Amigo ({activeCar})
            </h3>
            <p className="text-secondary mb-4" style={{ fontSize: '0.85rem' }}>Acumulado de deudas y uso de {activeCar} por persona.</p>
            
            {usersArray.length === 0 ? (
              <div className="text-center py-6 text-secondary" style={{ fontSize: '0.9rem' }}>Aún no hay amigos registrados para este auto.</div>
            ) : (
              <div className="flex flex-col gap-3">
                {usersArray.map((u, i) => (
                  <div key={i} style={{ backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '1rem' }}>
                    <div className="flex justify-between items-center mb-3">
                      <span className="font-bold text-lg">{u.name}</span>
                      <span className="text-secondary" style={{ fontSize: '0.85rem' }}>{u.km} km totales</span>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <div style={{ flex: 1, padding: '0.5rem', borderRadius: '8px', backgroundColor: u.deudaNafta > 0 ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.05)', border: u.deudaNafta > 0 ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid transparent' }}>
                        <span style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Deuda Nafta</span>
                        <span style={{ fontWeight: 'bold', color: u.deudaNafta > 0 ? 'var(--danger)' : 'var(--success)' }}>${u.deudaNafta.toLocaleString('es-AR', {maximumFractionDigits:0})}</span>
                      </div>
                      <div style={{ flex: 1, padding: '0.5rem', borderRadius: '8px', backgroundColor: u.deudaAmortizacion > 0 ? 'rgba(245, 158, 11, 0.1)' : 'rgba(16, 185, 129, 0.05)', border: u.deudaAmortizacion > 0 ? '1px solid rgba(245, 158, 11, 0.3)' : '1px solid transparent' }}>
                        <span style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Deuda Pozo</span>
                        <span style={{ fontWeight: 'bold', color: u.deudaAmortizacion > 0 ? 'var(--warning)' : 'var(--success)' }}>${u.deudaAmortizacion.toLocaleString('es-AR', {maximumFractionDigits:0})}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Card: Estadísticas de Pozo y Fondo para Mejoras/Imprevistos */}
          <div className="card" style={{ borderTop: '4px solid var(--accent-color)' }}>
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Activity color="var(--accent-color)" size={24} />
              Caja del {activeCar} & Fondos
            </h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem', marginBottom: '1.25rem' }}>
              <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)', padding: '1.25rem', borderRadius: '16px', textAlign: 'center' }}>
                <p className="text-success font-semibold" style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Fondo Total Disponible (Pozo Real)</p>
                <div className="font-bold text-success" style={{ fontSize: '2.5rem', lineHeight: '1.2' }}>
                  ${totalPozoReal.toLocaleString('es-AR', {maximumFractionDigits:0})}
                </div>
              </div>
            </div>

            {/* Desglose Estratégico de Fondos */}
            <div style={{ backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '1rem', marginBottom: '1.25rem' }}>
              <span className="text-secondary font-semibold" style={{ fontSize: '0.75rem', textTransform: 'uppercase', display: 'block', marginBottom: '0.75rem' }}>
                Destino Estimado del Pozo
              </span>
              <div className="flex flex-col gap-2" style={{ fontSize: '0.85rem' }}>
                <div className="flex justify-between items-center">
                  <span className="flex items-center gap-1.5 text-secondary">
                    <Shield size={14} color="#60a5fa" /> Cuota Seguro ({currentMaint.insurancePaid ? 'Cubierta' : 'Pendiente'}):
                  </span>
                  <span className="font-semibold" style={{ color: currentMaint.insurancePaid ? 'var(--success)' : 'var(--warning)' }}>
                    ${(currentMaint.insuranceCost || 90000).toLocaleString('es-AR')}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="flex items-center gap-1.5 text-secondary">
                    <Wrench size={14} color="#fb923c" /> Reserva Service & Cubiertas:
                  </span>
                  <span className="font-semibold">
                    ${Math.round(totalPozoReal * 0.4).toLocaleString('es-AR')} (40%)
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="flex items-center gap-1.5 text-secondary">
                    <Sparkles size={14} color="#a855f7" /> Fondo Mejoras e Imprevistos:
                  </span>
                  <span className="font-semibold" style={{ color: '#a855f7' }}>
                    ${Math.round(totalPozoReal * 0.6).toLocaleString('es-AR')} (60%)
                  </span>
                </div>
              </div>
            </div>
            
            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
              <div className="flex justify-between items-center text-secondary mb-2" style={{ fontSize: '0.85rem' }}>
                <span>Pozo Teórico (Ideal si todos pagaron):</span>
                <span className="font-bold text-primary" style={{ color: 'var(--text-primary)' }}>${totalPozoTeorico.toLocaleString('es-AR', {maximumFractionDigits:0})}</span>
              </div>
              <div style={{ width: '100%', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '999px', height: '8px' }}>
                <div style={{ backgroundColor: 'var(--accent-color)', height: '8px', borderRadius: '999px', width: `${totalPozoTeorico > 0 ? (totalPozoReal/totalPozoTeorico)*100 : 0}%`, transition: 'width 0.5s ease' }}></div>
              </div>
              <p className="text-secondary" style={{ fontSize: '0.75rem', marginTop: '6px', textAlign: 'right' }}>
                {totalPozoTeorico > 0 ? Math.round((totalPozoReal/totalPozoTeorico)*100) : 0}% fondeado en mano
              </p>
            </div>
          </div>

          {/* Card: Alertas y Mantenimiento AUTOADMINISTRADO */}
          <div className="card" style={{ borderTop: '4px solid var(--warning)' }}>
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-xl font-bold flex items-center gap-2">
                  <AlertTriangle color="var(--warning)" size={24} />
                  Mantenimiento ({activeCar})
                </h3>
                <span className="text-secondary" style={{ fontSize: '0.8rem' }}>
                  Tablero: <strong style={{ color: 'var(--text-primary)' }}>{currentOdometer.toLocaleString('es-AR')} km</strong>
                </span>
              </div>
              
              <button 
                className="btn btn-outline" 
                style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem', gap: '4px' }}
                onClick={() => setIsEditingMaintenance(!isEditingMaintenance)}
              >
                <Settings size={14} />
                {isEditingMaintenance ? 'Cerrar' : 'Configurar'}
              </button>
            </div>

            {/* Panel de Configuración Autoadministrado (Colapsable) */}
            {isEditingMaintenance && (
              <div style={{ backgroundColor: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '1rem', marginBottom: '1.25rem' }}>
                <h4 className="font-bold text-sm mb-3 flex items-center gap-2">
                  <Settings size={16} color="var(--accent-color)" /> Ajustar Parámetros de Mantenimiento
                </h4>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', fontSize: '0.85rem' }}>
                  <div>
                    <label className="text-secondary" style={{ display: 'block', marginBottom: '3px', fontSize: '0.75rem' }}>KM Base Tablero</label>
                    <input 
                      type="number" 
                      className="input" 
                      style={{ padding: '0.4rem 0.6rem', fontSize: '0.85rem' }} 
                      value={currentMaint.baseOdometer || 0} 
                      onChange={(e) => updateMaintenanceField('baseOdometer', Number(e.target.value))} 
                    />
                  </div>
                  <div>
                    <label className="text-secondary" style={{ display: 'block', marginBottom: '3px', fontSize: '0.75rem' }}>Seguro Mensual ($)</label>
                    <input 
                      type="number" 
                      className="input" 
                      style={{ padding: '0.4rem 0.6rem', fontSize: '0.85rem' }} 
                      value={currentMaint.insuranceCost || 90000} 
                      onChange={(e) => updateMaintenanceField('insuranceCost', Number(e.target.value))} 
                    />
                  </div>
                  <div>
                    <label className="text-secondary" style={{ display: 'block', marginBottom: '3px', fontSize: '0.75rem' }}>KM Últ. Cambio Aceite</label>
                    <input 
                      type="number" 
                      className="input" 
                      style={{ padding: '0.4rem 0.6rem', fontSize: '0.85rem' }} 
                      value={currentMaint.lastOilKm || 0} 
                      onChange={(e) => updateMaintenanceField('lastOilKm', Number(e.target.value))} 
                    />
                  </div>
                  <div>
                    <label className="text-secondary" style={{ display: 'block', marginBottom: '3px', fontSize: '0.75rem' }}>KM Últ. Cambio Cubiertas</label>
                    <input 
                      type="number" 
                      className="input" 
                      style={{ padding: '0.4rem 0.6rem', fontSize: '0.85rem' }} 
                      value={currentMaint.lastTireKm || 0} 
                      onChange={(e) => updateMaintenanceField('lastTireKm', Number(e.target.value))} 
                    />
                  </div>
                  <div>
                    <label className="text-secondary" style={{ display: 'block', marginBottom: '3px', fontSize: '0.75rem' }}>Frecuencia Aceite (km)</label>
                    <input 
                      type="number" 
                      className="input" 
                      style={{ padding: '0.4rem 0.6rem', fontSize: '0.85rem' }} 
                      value={currentMaint.oilInterval || 10000} 
                      onChange={(e) => updateMaintenanceField('oilInterval', Number(e.target.value))} 
                    />
                  </div>
                  <div>
                    <label className="text-secondary" style={{ display: 'block', marginBottom: '3px', fontSize: '0.75rem' }}>Duración Cubiertas (km)</label>
                    <input 
                      type="number" 
                      className="input" 
                      style={{ padding: '0.4rem 0.6rem', fontSize: '0.85rem' }} 
                      value={currentMaint.tireInterval || 50000} 
                      onChange={(e) => updateMaintenanceField('tireInterval', Number(e.target.value))} 
                    />
                  </div>
                </div>

                <div className="mt-3 flex justify-end">
                  <button className="btn btn-primary" style={{ padding: '0.4rem 1rem', fontSize: '0.8rem' }} onClick={() => setIsEditingMaintenance(false)}>
                    Guardar Cambios
                  </button>
                </div>
              </div>
            )}
            
            <div className="flex flex-col gap-4">
              
              {/* 1. Seguro del Auto */}
              <div style={{ 
                border: currentMaint.insurancePaid ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(245, 158, 11, 0.3)', 
                backgroundColor: currentMaint.insurancePaid ? 'rgba(16, 185, 129, 0.08)' : 'rgba(245, 158, 11, 0.08)', 
                borderRadius: '12px', padding: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' 
              }}>
                <div className="flex items-center gap-2">
                  <Shield size={18} color={currentMaint.insurancePaid ? 'var(--success)' : 'var(--warning)'} />
                  <div>
                    <span className="font-semibold" style={{ fontSize: '0.9rem', color: currentMaint.insurancePaid ? 'var(--success)' : 'var(--warning)' }}>Seguro Mensual</span>
                    <span className="text-secondary" style={{ display: 'block', fontSize: '0.75rem' }}>${(currentMaint.insuranceCost || 90000).toLocaleString('es-AR')}/mes</span>
                  </div>
                </div>
                <button 
                  onClick={handleToggleInsurance}
                  className="btn" 
                  style={{ 
                    padding: '4px 10px', fontSize: '0.75rem', borderRadius: '8px', 
                    backgroundColor: currentMaint.insurancePaid ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                    color: currentMaint.insurancePaid ? 'var(--success)' : 'var(--warning)',
                    border: currentMaint.insurancePaid ? '1px solid var(--success)' : '1px solid var(--warning)'
                  }}
                >
                  {currentMaint.insurancePaid ? '✓ Pagado este mes' : 'Pendiente de Pago'}
                </button>
              </div>

              {/* 2. Service General / Cambio de Aceite (Cada 10.000 km) */}
              <div style={{ 
                border: oilRemainingKm <= 0 ? '1px solid rgba(239, 68, 68, 0.4)' : oilRemainingKm < 1500 ? '1px solid rgba(245, 158, 11, 0.4)' : '1px solid rgba(16, 185, 129, 0.3)', 
                backgroundColor: oilRemainingKm <= 0 ? 'rgba(239, 68, 68, 0.1)' : oilRemainingKm < 1500 ? 'rgba(245, 158, 11, 0.08)' : 'rgba(16, 185, 129, 0.08)', 
                borderRadius: '12px', padding: '12px' 
              }}>
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-2">
                    <Wrench size={18} color={oilRemainingKm <= 0 ? 'var(--danger)' : oilRemainingKm < 1500 ? 'var(--warning)' : 'var(--success)'} />
                    <span className="font-semibold" style={{ fontSize: '0.9rem', color: oilRemainingKm <= 0 ? 'var(--danger)' : 'var(--text-primary)' }}>
                      Cambio de Aceite & Filtros
                    </span>
                  </div>
                  <span className="font-bold" style={{ fontSize: '0.8rem', color: oilRemainingKm <= 0 ? 'var(--danger)' : oilRemainingKm < 1500 ? 'var(--warning)' : 'var(--success)' }}>
                    {oilRemainingKm <= 0 ? '¡Vencido!' : `Faltan ${oilRemainingKm.toLocaleString('es-AR')} km`}
                  </span>
                </div>

                {/* Barra de progreso de Aceite */}
                <div style={{ width: '100%', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '999px', height: '6px', marginBottom: '8px' }}>
                  <div style={{ 
                    backgroundColor: oilRemainingKm <= 0 ? 'var(--danger)' : oilRemainingKm < 1500 ? 'var(--warning)' : 'var(--success)', 
                    height: '6px', borderRadius: '999px', width: `${oilPercentRemaining}%` 
                  }}></div>
                </div>

                <div className="flex justify-between items-center text-secondary" style={{ fontSize: '0.75rem' }}>
                  <span>Último: {currentMaint.lastOilKm?.toLocaleString('es-AR')} km (cada {currentMaint.oilInterval?.toLocaleString('es-AR')} km)</span>
                  <button 
                    onClick={handleRegisterOilChange} 
                    className="text-secondary hover:text-success" 
                    style={{ background: 'none', border: 'none', textDecoration: 'underline', cursor: 'pointer', fontSize: '0.75rem' }}
                  >
                    ✓ Marcar Service Hecho
                  </button>
                </div>
              </div>

              {/* 3. Duración de Ruedas / Cubiertas (Estándar 50.000 km) */}
              <div style={{ border: '1px solid var(--border-color)', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '12px', padding: '12px' }}>
                <div className="flex justify-between items-center mb-2">
                  <span className="font-semibold" style={{ fontSize: '0.9rem' }}>Cubiertas / Neumáticos</span>
                  <span className="font-bold" style={{ fontSize: '0.8rem', color: tiresPercentRemaining < 25 ? 'var(--danger)' : tiresPercentRemaining < 50 ? 'var(--warning)' : '#60a5fa' }}>
                    {tiresPercentRemaining}% útil ({tiresRemainingKm.toLocaleString('es-AR')} km rest.)
                  </span>
                </div>
                
                {/* Barra de progreso de Cubiertas */}
                <div style={{ width: '100%', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '999px', height: '6px', marginBottom: '8px' }}>
                  <div style={{ 
                    backgroundColor: tiresPercentRemaining < 25 ? 'var(--danger)' : tiresPercentRemaining < 50 ? 'var(--warning)' : '#60a5fa', 
                    height: '6px', borderRadius: '999px', width: `${tiresPercentRemaining}%` 
                  }}></div>
                </div>

                <div className="flex justify-between items-center text-secondary" style={{ fontSize: '0.75rem' }}>
                  <span>Puestas en: {currentMaint.lastTireKm?.toLocaleString('es-AR')} km (vida {currentMaint.tireInterval?.toLocaleString('es-AR')} km)</span>
                  <button 
                    onClick={handleRegisterTireChange} 
                    className="text-secondary hover:text-success" 
                    style={{ background: 'none', border: 'none', textDecoration: 'underline', cursor: 'pointer', fontSize: '0.75rem' }}
                  >
                    ✓ Marcar Ruedas Nuevas
                  </button>
                </div>
              </div>

              {/* 4. Batería */}
              <div style={{ border: '1px solid rgba(16, 185, 129, 0.3)', backgroundColor: 'rgba(16, 185, 129, 0.05)', borderRadius: '12px', padding: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div className="flex items-center gap-2">
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--success)' }}></div>
                  <span className="font-semibold text-success" style={{ fontSize: '0.9rem' }}>Batería (Ciclo 2 años)</span>
                </div>
                <span style={{ fontSize: '0.8rem', color: 'var(--success)' }}>Resta aprox. {currentMaint.batteryMonthsRemaining || 18} meses</span>
              </div>

            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
