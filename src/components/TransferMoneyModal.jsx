import React, { useState, useEffect, useMemo } from 'react';
import { 
  ArrowLeft, X, Search, Check, Copy, Share2, 
  ArrowRight, ShieldCheck, Wallet, ChevronRight,
  TrendingDown, TrendingUp, RefreshCw, Sparkles, CheckCircle2
} from 'lucide-react';
import { elementsService } from '../services/elementsService';

export default function TransferMoneyModal({
  isOpen,
  onClose,
  initialSourceWalletId = null,
  currentUser = null,
  onTransferComplete = null
}) {
  const [wallets, setWallets] = useState(() => elementsService.getWallets());
  const [sourceWalletId, setSourceWalletId] = useState(
    () => initialSourceWalletId || elementsService.getActiveWalletId() || wallets[0]?.id
  );
  const [destWalletId, setDestWalletId] = useState('');
  const [amount, setAmount] = useState('');
  const [concept, setConcept] = useState('');
  const [step, setStep] = useState(1); // 1: Destino, 2: Monto, 3: Revisión, 4: Comprobante
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [transferResult, setTransferResult] = useState(null);
  const [copiedCode, setCopiedCode] = useState(false);

  // Sincronizar billeteras cuando se abre el modal
  useEffect(() => {
    if (isOpen) {
      const refreshed = elementsService.getWallets();
      setWallets(refreshed);
      const activeId = initialSourceWalletId || elementsService.getActiveWalletId() || refreshed[0]?.id;
      setSourceWalletId(activeId);
      setStep(1);
      setAmount('');
      setConcept('');
      setDestWalletId('');
      setSearchQuery('');
      setErrorMessage('');
      setTransferResult(null);
      setCopiedCode(false);
    }
  }, [isOpen, initialSourceWalletId]);

  // Billetera de origen actual
  const sourceWallet = useMemo(() => {
    return (wallets || []).find(w => w.id === sourceWalletId) || wallets[0];
  }, [wallets, sourceWalletId]);

  // Billetera de destino seleccionada
  const destWallet = useMemo(() => {
    return (wallets || []).find(w => w.id === destWalletId) || null;
  }, [wallets, destWalletId]);

  // Saldo disponible en origen
  const sourceBalance = useMemo(() => {
    return Number(sourceWallet?.balance) || 0;
  }, [sourceWallet]);

  // Lista de billeteras elegibles como destino (todas menos la de origen)
  const availableDestinations = useMemo(() => {
    return (wallets || []).filter(w => w.id !== sourceWalletId);
  }, [wallets, sourceWalletId]);

  // Filtrado por buscador (alias, nombre o miembros)
  const filteredDestinations = useMemo(() => {
    const q = searchQuery.trim().toLowerCase().replace(/^@+/, '');
    if (!q) return availableDestinations;
    return availableDestinations.filter(w => {
      const wName = (w.name || '').toLowerCase();
      const wAlias = (w.alias || '').toLowerCase();
      const wDetail = (w.detail || '').toLowerCase();
      const wMembers = (w.members || []).map(m => String(m).toLowerCase()).join(' ');
      return wName.includes(q) || wAlias.includes(q) || wDetail.includes(q) || wMembers.includes(q);
    });
  }, [availableDestinations, searchQuery]);

  // Coincidencia exacta por alias ingresado
  const exactAliasMatch = useMemo(() => {
    const q = searchQuery.trim().toLowerCase().replace(/^@+/, '');
    if (!q) return null;
    return availableDestinations.find(w => {
      const wAlias = (w.alias || '').toLowerCase().replace(/^@+/, '');
      return wAlias === q || `abeja.${wAlias}` === q || wAlias === `abeja.${q}`;
    });
  }, [availableDestinations, searchQuery]);

  // Formateador seguro de dinero ARS
  const safeMoney = (val) => {
    return `$${Number(val || 0).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const handleSelectDestination = (wId) => {
    setDestWalletId(wId);
    setErrorMessage('');
    setStep(2); // Avanzar a monto
  };

  const handleAmountSubmit = (e) => {
    e?.preventDefault();
    const numAmt = parseFloat(amount);
    if (!numAmt || numAmt <= 0) {
      setErrorMessage('Ingresá un monto mayor a $0.');
      return;
    }
    if (numAmt > sourceBalance) {
      setErrorMessage(`Saldo insuficiente. Tenés disponible ${safeMoney(sourceBalance)}.`);
      return;
    }
    setErrorMessage('');
    setStep(3); // Avanzar a revisión
  };

  const handleExecuteTransfer = async () => {
    if (!sourceWallet || !destWallet) return;
    setIsLoading(true);
    setErrorMessage('');

    try {
      const res = await elementsService.transferBetweenWallets({
        sourceWalletId: sourceWallet.id,
        destinationWalletId: destWallet.id,
        amount: parseFloat(amount),
        concept: concept.trim(),
        memberId: currentUser?.id || 'ramiro',
        memberName: currentUser?.name || 'Ramiro'
      });

      setTransferResult(res);
      // Actualizar listado local de billeteras
      setWallets(elementsService.getWallets());
      setStep(4); // Pantalla de Comprobante / Éxito

      if (onTransferComplete) {
        onTransferComplete(res);
      }
    } catch (err) {
      setErrorMessage(err.message || 'Error al procesar la transferencia.');
    } finally {
      setIsLoading(false);
    }
  };

  // Compartir comprobante por WhatsApp
  const handleShareWhatsApp = () => {
    if (!transferResult) return;
    const { referenceCode, amount, sourceWallet, destWallet, concept, date } = transferResult;
    const msg = `🐝 *COMPROBANTE DE TRANSFERENCIA - BANCA ABEJA*\n` +
      `✅ *Estado:* Transferencia exitosa\n` +
      `💵 *Monto:* ${safeMoney(amount)}\n\n` +
      `📤 *De:* ${sourceWallet.name} (@${sourceWallet.alias})\n` +
      `📥 *Para:* ${destWallet.name} (@${destWallet.alias})\n` +
      `📝 *Motivo:* ${concept || 'Transferencia entre billeteras'}\n` +
      `📅 *Fecha:* ${date}\n` +
      `🔖 *Operación:* ${referenceCode}\n` +
      `⚡ *Acreditación:* Inmediata ($0 comisión)\n\n` +
      `_Gestión Económica Colectiva - Banca Abeja_`;

    const url = `https://wa.me/?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
  };

  const handleCopyCode = () => {
    if (!transferResult?.referenceCode) return;
    navigator.clipboard?.writeText(transferResult.referenceCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-md overflow-y-auto animate-fade-in"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-[28px] w-full max-w-lg shadow-2xl relative overflow-hidden flex flex-col border border-slate-200"
        style={{ maxHeight: '92vh' }}
        onClick={e => e.stopPropagation()}
      >
        {/* ======================================================== */}
        {/* HEADER ESTILO MERCADO PAGO                               */}
        {/* ======================================================== */}
        <div 
          style={{
            background: step === 4 ? '#00a650' : '#009ee3',
            color: '#ffffff',
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            position: 'relative'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {step > 1 && step < 4 && (
              <button
                type="button"
                onClick={() => {
                  setErrorMessage('');
                  setStep(prev => prev - 1);
                }}
                style={{
                  background: 'rgba(255, 255, 255, 0.2)',
                  border: 'none',
                  borderRadius: '50%',
                  width: '34px',
                  height: '34px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ffffff',
                  cursor: 'pointer',
                  transition: 'background 0.15s ease'
                }}
                title="Volver al paso anterior"
              >
                <ArrowLeft size={18} />
              </button>
            )}
            <div>
              <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.08em', opacity: 0.85, fontWeight: 700, display: 'block' }}>
                Banca Abeja • Transferencias
              </span>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0 }}>
                {step === 1 && 'Transferir dinero'}
                {step === 2 && '¿Cuánto querés transferir?'}
                {step === 3 && 'Revisá si está todo bien'}
                {step === 4 && '¡Transferencia exitosa!'}
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.2)',
              border: 'none',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              cursor: 'pointer'
            }}
            title="Cerrar"
          >
            <X size={18} />
          </button>
        </div>

        {/* Barra de progreso de 4 pasos */}
        <div style={{ display: 'flex', height: '4px', background: '#e2e8f0', width: '100%' }}>
          <div style={{ flex: 1, background: step >= 1 ? (step === 4 ? '#00a650' : '#009ee3') : 'transparent' }} />
          <div style={{ flex: 1, background: step >= 2 ? (step === 4 ? '#00a650' : '#009ee3') : 'transparent' }} />
          <div style={{ flex: 1, background: step >= 3 ? (step === 4 ? '#00a650' : '#009ee3') : 'transparent' }} />
          <div style={{ flex: 1, background: step >= 4 ? '#00a650' : 'transparent' }} />
        </div>

        {/* ======================================================== */}
        {/* CUERPO DEL MODAL                                         */}
        {/* ======================================================== */}
        <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1 }}>

          {/* MENSAJE DE ERROR GLOBAL */}
          {errorMessage && (
            <div 
              style={{
                background: '#fef2f2',
                color: '#b91c1c',
                border: '1px solid #fecaca',
                padding: '10px 14px',
                borderRadius: '12px',
                fontSize: '0.82rem',
                fontWeight: 600,
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <span>⚠️</span>
              <span>{errorMessage}</span>
            </div>
          )}

          {/* ======================================================== */}
          {/* PASO 1: SELECCIONAR DESTINO                              */}
          {/* ======================================================== */}
          {step === 1 && (
            <div className="space-y-4">
              {/* Selector de Billetera de Origen */}
              <div 
                style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '18px',
                  padding: '12px 16px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Desde (Billetera de Origen):
                  </span>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#047857', background: '#ecfdf5', padding: '2px 8px', borderRadius: '9999px' }}>
                    Disponible: {safeMoney(sourceBalance)}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '1.4rem' }}>{sourceWallet?.icon || '🐝'}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <strong style={{ fontSize: '0.92rem', color: '#0f172a' }}>{sourceWallet?.name}</strong>
                      <span style={{ fontSize: '0.7rem', color: '#4f46e5', background: '#eef2ff', padding: '1px 6px', borderRadius: '9999px', fontFamily: 'monospace', fontWeight: 600 }}>
                        @{sourceWallet?.alias}
                      </span>
                    </div>
                  </div>

                  {wallets.length > 1 && (
                    <select
                      value={sourceWalletId}
                      onChange={e => {
                        setSourceWalletId(e.target.value);
                        setErrorMessage('');
                      }}
                      style={{
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        color: '#009ee3',
                        background: '#ffffff',
                        border: '1px solid #cbd5e1',
                        borderRadius: '10px',
                        padding: '6px 10px',
                        cursor: 'pointer',
                        outline: 'none'
                      }}
                    >
                      {wallets.map(w => (
                        <option key={w.id} value={w.id}>
                          Cambiar: {w.name} (${Number(w.balance || 0).toLocaleString('es-AR')})
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>

              {/* Buscador de Destinatario / Alias */}
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 800, color: '#1e293b', display: 'block', marginBottom: '8px' }}>
                  ¿A qué billetera o alias querés transferir?
                </label>
                <div style={{ position: 'relative' }}>
                  <Search 
                    size={18} 
                    style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} 
                  />
                  <input
                    type="text"
                    autoFocus
                    placeholder="Buscá por alias (ej: abeja.vrde, ramiro.personal)..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px 14px 12px 42px',
                      borderRadius: '16px',
                      border: '2px solid #e2e8f0',
                      fontSize: '0.9rem',
                      fontWeight: 600,
                      color: '#0f172a',
                      background: '#ffffff',
                      outline: 'none',
                      transition: 'border 0.15s ease'
                    }}
                    onFocus={e => e.target.style.borderColor = '#009ee3'}
                    onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      style={{
                        position: 'absolute',
                        right: '12px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: '#f1f5f9',
                        border: 'none',
                        borderRadius: '50%',
                        width: '22px',
                        height: '22px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        color: '#64748b'
                      }}
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>

                {/* Coincidencia directa por alias */}
                {exactAliasMatch && (
                  <div 
                    onClick={() => handleSelectDestination(exactAliasMatch.id)}
                    style={{
                      marginTop: '10px',
                      padding: '12px 14px',
                      background: '#e0f2fe',
                      border: '2px solid #009ee3',
                      borderRadius: '16px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '1.4rem' }}>{exactAliasMatch.icon || '🐝'}</span>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <strong style={{ fontSize: '0.92rem', color: '#0369a1' }}>{exactAliasMatch.name}</strong>
                          <span style={{ fontSize: '0.72rem', background: '#0284c7', color: '#ffffff', padding: '1px 8px', borderRadius: '9999px', fontWeight: 700 }}>
                            @{exactAliasMatch.alias}
                          </span>
                        </div>
                        <span style={{ fontSize: '0.75rem', color: '#0284c7' }}>
                          ¡Coincidencia exacta de alias! Clic para continuar.
                        </span>
                      </div>
                    </div>
                    <ArrowRight size={18} color="#0284c7" />
                  </div>
                )}
              </div>

              {/* Lista de Cuentas Disponibles en la Banca Abeja */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '0.74rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Cuentas y Billeteras Disponibles ({filteredDestinations.length}):
                  </span>
                </div>

                {filteredDestinations.length === 0 ? (
                  <div style={{ padding: '24px 16px', textAlign: 'center', background: '#f8fafc', borderRadius: '16px', border: '1px dashed #cbd5e1' }}>
                    <span style={{ fontSize: '1.8rem', display: 'block', marginBottom: '4px' }}>🔍</span>
                    <strong style={{ fontSize: '0.88rem', color: '#334155', display: 'block' }}>No se encontraron billeteras</strong>
                    <span style={{ fontSize: '0.76rem', color: '#64748b' }}>
                      Verificá el alias ingresado o probá con otro nombre.
                    </span>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {filteredDestinations.map(w => (
                      <div
                        key={w.id}
                        onClick={() => handleSelectDestination(w.id)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '12px 16px',
                          borderRadius: '16px',
                          border: '1px solid #e2e8f0',
                          background: '#ffffff',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
                        }}
                        onMouseEnter={e => {
                          e.currentTarget.style.borderColor = '#009ee3';
                          e.currentTarget.style.backgroundColor = '#f0f9ff';
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.borderColor = '#e2e8f0';
                          e.currentTarget.style.backgroundColor = '#ffffff';
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div 
                            style={{
                              width: '42px',
                              height: '42px',
                              borderRadius: '14px',
                              background: '#f1f5f9',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '1.3rem'
                            }}
                          >
                            {w.icon || '🐝'}
                          </div>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <strong style={{ fontSize: '0.9rem', color: '#0f172a' }}>{w.name}</strong>
                              <span 
                                style={{ 
                                  fontSize: '0.7rem', 
                                  color: '#0284c7', 
                                  background: '#e0f2fe', 
                                  padding: '2px 8px', 
                                  borderRadius: '9999px', 
                                  fontFamily: 'monospace',
                                  fontWeight: 700 
                                }}
                              >
                                @{w.alias || w.id}
                              </span>
                            </div>
                            <span style={{ fontSize: '0.74rem', color: '#64748b', display: 'block', marginTop: '2px' }}>
                              {(w.members || []).length} integrantes • {w.detail?.slice(0, 48) || 'Billetera del sistema'}
                            </span>
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{ textAlign: 'right' }}>
                            <span style={{ fontSize: '0.68rem', color: '#94a3b8', display: 'block' }}>Saldo</span>
                            <strong style={{ fontSize: '0.85rem', color: '#334155' }}>
                              {safeMoney(w.balance)}
                            </strong>
                          </div>
                          <ChevronRight size={18} color="#94a3b8" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* PASO 2: INGRESAR MONTO Y CONCEPTO                        */}
          {/* ======================================================== */}
          {step === 2 && destWallet && (
            <form onSubmit={handleAmountSubmit} className="space-y-5">
              {/* Tarjeta Destinatario Seleccionado */}
              <div 
                style={{
                  background: '#f0f9ff',
                  border: '1px solid #bae6fd',
                  borderRadius: '18px',
                  padding: '12px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '1.4rem' }}>{destWallet.icon || '🐝'}</span>
                  <div>
                    <span style={{ fontSize: '0.7rem', color: '#0369a1', textTransform: 'uppercase', fontWeight: 800 }}>
                      Transferir a:
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <strong style={{ fontSize: '0.92rem', color: '#0c4a6e' }}>{destWallet.name}</strong>
                      <span style={{ fontSize: '0.7rem', background: '#0284c7', color: '#ffffff', padding: '1px 6px', borderRadius: '9999px', fontFamily: 'monospace', fontWeight: 700 }}>
                        @{destWallet.alias}
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setStep(1)}
                  style={{
                    fontSize: '0.76rem',
                    fontWeight: 700,
                    color: '#0284c7',
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    textDecoration: 'underline'
                  }}
                >
                  Cambiar
                </button>
              </div>

              {/* INPUT GIGANTE DE MONTO ESTILO MERCADO PAGO */}
              <div style={{ textAlign: 'center', padding: '16px 8px' }}>
                <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Ingresá el monto
                </span>

                <div 
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    margin: '8px 0',
                    gap: '4px' 
                  }}
                >
                  <span style={{ fontSize: '2.4rem', fontWeight: 900, color: '#009ee3' }}>$</span>
                  <input
                    type="number"
                    autoFocus
                    required
                    min="1"
                    max={sourceBalance}
                    step="any"
                    placeholder="0"
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    style={{
                      fontSize: '2.8rem',
                      fontWeight: 900,
                      color: '#0f172a',
                      border: 'none',
                      outline: 'none',
                      background: 'transparent',
                      width: '100%',
                      maxWidth: '240px',
                      textAlign: 'left'
                    }}
                  />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Disponible en {sourceWallet?.name}:</span>
                  <strong style={{ fontSize: '0.82rem', color: sourceBalance > 0 ? '#047857' : '#dc2626' }}>
                    {safeMoney(sourceBalance)}
                  </strong>
                </div>

                {/* Chips de Montos Rápidos */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: '14px', flexWrap: 'wrap' }}>
                  {[1000, 5000, 10000, 25000, 50000].map(val => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => {
                        const cur = parseFloat(amount) || 0;
                        const next = Math.min(sourceBalance, cur + val);
                        setAmount(next.toString());
                      }}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '9999px',
                        background: '#f1f5f9',
                        color: '#334155',
                        border: '1px solid #e2e8f0',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      +${(val / 1000)}k
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setAmount(sourceBalance.toString())}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '9999px',
                      background: '#e0f2fe',
                      color: '#0369a1',
                      border: '1px solid #bae6fd',
                      fontSize: '0.75rem',
                      fontWeight: 800,
                      cursor: 'pointer'
                    }}
                  >
                    Transferir todo
                  </button>
                </div>
              </div>

              {/* Concepto / Motivo de la Transferencia */}
              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 800, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: '6px' }}>
                  Motivo o Concepto (Opcional):
                </label>
                <input
                  type="text"
                  placeholder="Ej: Aporte a compra de semillas, fondo de caja, devolución..."
                  value={concept}
                  onChange={e => setConcept(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: '14px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.85rem',
                    color: '#0f172a',
                    background: '#f8fafc',
                    outline: 'none'
                  }}
                  onFocus={e => e.target.style.borderColor = '#009ee3'}
                  onBlur={e => e.target.style.borderColor = '#cbd5e1'}
                />

                {/* Sugerencias de conceptos */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px', flexWrap: 'wrap' }}>
                  {['Insumos', 'Feria', 'Devolución', 'Fondo de caja', 'Gastos comunes'].map(tag => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => setConcept(tag)}
                      style={{
                        fontSize: '0.7rem',
                        padding: '3px 8px',
                        borderRadius: '6px',
                        background: '#f1f5f9',
                        color: '#64748b',
                        border: 'none',
                        cursor: 'pointer'
                      }}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>

              {/* Botón Continuar */}
              <button
                type="submit"
                disabled={!parseFloat(amount) || parseFloat(amount) <= 0 || parseFloat(amount) > sourceBalance}
                style={{
                  width: '100%',
                  padding: '14px',
                  borderRadius: '16px',
                  background: (!parseFloat(amount) || parseFloat(amount) <= 0 || parseFloat(amount) > sourceBalance) ? '#cbd5e1' : '#009ee3',
                  color: '#ffffff',
                  fontWeight: 800,
                  fontSize: '0.95rem',
                  border: 'none',
                  cursor: (!parseFloat(amount) || parseFloat(amount) <= 0 || parseFloat(amount) > sourceBalance) ? 'not-allowed' : 'pointer',
                  boxShadow: '0 4px 14px rgba(0, 158, 227, 0.3)',
                  transition: 'all 0.15s ease'
                }}
              >
                Continuar
              </button>
            </form>
          )}

          {/* ======================================================== */}
          {/* PASO 3: REVISIÓN / TICKET DE CONFIRMACIÓN                */}
          {/* ======================================================== */}
          {step === 3 && destWallet && (
            <div className="space-y-5">
              <div style={{ textAlign: 'center' }}>
                <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Vas a transferir
                </span>
                <div style={{ fontSize: '2.5rem', fontWeight: 900, color: '#0f172a', margin: '4px 0' }}>
                  {safeMoney(amount)}
                </div>
                <span style={{ fontSize: '0.75rem', color: '#047857', fontWeight: 700, background: '#ecfdf5', padding: '3px 10px', borderRadius: '9999px', border: '1px solid #a7f3d0' }}>
                  ✓ Sin comisiones • Acreditación inmediata
                </span>
              </div>

              {/* Ticket Resumen Estilo Comprobante */}
              <div 
                style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '20px',
                  padding: '18px 20px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {/* Origen */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600 }}>De:</span>
                    <div style={{ textAlign: 'right' }}>
                      <strong style={{ fontSize: '0.85rem', color: '#0f172a' }}>
                        {sourceWallet.icon} {sourceWallet.name}
                      </strong>
                      <span style={{ fontSize: '0.72rem', color: '#64748b', display: 'block', fontFamily: 'monospace' }}>
                        @{sourceWallet.alias}
                      </span>
                    </div>
                  </div>

                  {/* Destino */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px dashed #cbd5e1', paddingTop: '10px' }}>
                    <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600 }}>Para:</span>
                    <div style={{ textAlign: 'right' }}>
                      <strong style={{ fontSize: '0.85rem', color: '#009ee3' }}>
                        {destWallet.icon} {destWallet.name}
                      </strong>
                      <span style={{ fontSize: '0.72rem', color: '#0284c7', display: 'block', fontFamily: 'monospace', fontWeight: 700 }}>
                        @{destWallet.alias}
                      </span>
                    </div>
                  </div>

                  {/* Motivo */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px dashed #cbd5e1', paddingTop: '10px' }}>
                    <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600 }}>Motivo:</span>
                    <span style={{ fontSize: '0.82rem', color: '#334155', fontWeight: 600, textAlign: 'right' }}>
                      {concept || 'Transferencia entre billeteras'}
                    </span>
                  </div>

                  {/* Fecha y Plazo */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px dashed #cbd5e1', paddingTop: '10px' }}>
                    <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600 }}>Cuándo:</span>
                    <span style={{ fontSize: '0.82rem', color: '#0f172a', fontWeight: 700 }}>
                      Ahora mismo (En el acto)
                    </span>
                  </div>

                  {/* Costo */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px dashed #cbd5e1', paddingTop: '10px' }}>
                    <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600 }}>Costo del envío:</span>
                    <strong style={{ fontSize: '0.85rem', color: '#047857' }}>
                      $ 0,00 (Gratis)
                    </strong>
                  </div>
                </div>
              </div>

              {/* Botones de Confirmación */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <button
                  type="button"
                  disabled={isLoading}
                  onClick={handleExecuteTransfer}
                  style={{
                    width: '100%',
                    padding: '14px',
                    borderRadius: '16px',
                    background: isLoading ? '#94a3b8' : '#009ee3',
                    color: '#ffffff',
                    fontWeight: 800,
                    fontSize: '0.95rem',
                    border: 'none',
                    cursor: isLoading ? 'wait' : 'pointer',
                    boxShadow: '0 4px 14px rgba(0, 158, 227, 0.35)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                >
                  {isLoading ? (
                    <>
                      <RefreshCw size={18} className="animate-spin" />
                      <span>Transfiriendo dinero...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck size={18} />
                      <span>Confirmar y Transferir {safeMoney(amount)}</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  disabled={isLoading}
                  onClick={() => setStep(2)}
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '14px',
                    background: 'transparent',
                    color: '#64748b',
                    fontWeight: 700,
                    fontSize: '0.82rem',
                    border: 'none',
                    cursor: 'pointer'
                  }}
                >
                  Modificar datos
                </button>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* PASO 4: COMPROBANTE FINAL (ÉXITO ESTILO MERCADO PAGO)   */}
          {/* ======================================================== */}
          {step === 4 && transferResult && (
            <div className="space-y-5 animate-fade-in">
              <div style={{ textAlign: 'center', padding: '10px 0' }}>
                <div 
                  style={{
                    width: '68px',
                    height: '68px',
                    borderRadius: '50%',
                    background: '#ecfdf5',
                    color: '#00a650',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 12px auto',
                    boxShadow: '0 8px 20px rgba(0, 166, 80, 0.2)'
                  }}
                >
                  <CheckCircle2 size={44} />
                </div>
                <h3 style={{ fontSize: '1.35rem', fontWeight: 900, color: '#0f172a', margin: 0 }}>
                  ¡Listo! Ya transferiste el dinero
                </h3>
                <span style={{ fontSize: '0.85rem', color: '#64748b', display: 'block', marginTop: '4px' }}>
                  Le enviaste a <strong>{transferResult.destWallet?.name}</strong>
                </span>

                <div style={{ fontSize: '2.4rem', fontWeight: 900, color: '#00a650', margin: '8px 0' }}>
                  {safeMoney(transferResult.amount)}
                </div>
              </div>

              {/* TICKET COMPROBANTE DE PAGO */}
              <div 
                style={{
                  background: '#ffffff',
                  border: '1px solid #cbd5e1',
                  borderRadius: '20px',
                  padding: '18px 20px',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.04)',
                  position: 'relative'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px' }}>
                  <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>
                    Comprobante de Operación
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{ fontSize: '0.75rem', fontFamily: 'monospace', fontWeight: 700, color: '#0f172a' }}>
                      {transferResult.referenceCode}
                    </span>
                    <button
                      type="button"
                      onClick={handleCopyCode}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: copiedCode ? '#00a650' : '#64748b',
                        padding: '2px'
                      }}
                      title="Copiar código de comprobante"
                    >
                      {copiedCode ? <Check size={14} /> : <Copy size={14} />}
                    </button>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.8rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748b' }}>De:</span>
                    <strong style={{ color: '#0f172a' }}>
                      {transferResult.sourceWallet?.name} (@{transferResult.sourceWallet?.alias})
                    </strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748b' }}>Para:</span>
                    <strong style={{ color: '#0284c7' }}>
                      {transferResult.destWallet?.name} (@{transferResult.destWallet?.alias})
                    </strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748b' }}>Motivo:</span>
                    <span style={{ color: '#334155' }}>
                      {transferResult.concept}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748b' }}>Fecha y hora:</span>
                    <span style={{ color: '#334155' }}>
                      {transferResult.date}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px dashed #e2e8f0', paddingTop: '8px' }}>
                    <span style={{ color: '#64748b' }}>Saldo actual en {transferResult.sourceWallet?.name}:</span>
                    <strong style={{ color: '#047857' }}>
                      {safeMoney(transferResult.sourceWallet?.balance)}
                    </strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748b' }}>Saldo actual en {transferResult.destWallet?.name}:</span>
                    <strong style={{ color: '#0284c7' }}>
                      {safeMoney(transferResult.destWallet?.balance)}
                    </strong>
                  </div>
                </div>
              </div>

              {/* Acciones del Comprobante */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <button
                  type="button"
                  onClick={handleShareWhatsApp}
                  style={{
                    width: '100%',
                    padding: '13px',
                    borderRadius: '16px',
                    background: '#25d366',
                    color: '#ffffff',
                    fontWeight: 800,
                    fontSize: '0.9rem',
                    border: 'none',
                    cursor: 'pointer',
                    boxShadow: '0 4px 14px rgba(37, 211, 102, 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                >
                  <Share2 size={18} />
                  <span>Compartir comprobante por WhatsApp</span>
                </button>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setStep(1);
                      setAmount('');
                      setConcept('');
                      setSearchQuery('');
                      setErrorMessage('');
                    }}
                    style={{
                      padding: '11px',
                      borderRadius: '14px',
                      background: '#f1f5f9',
                      color: '#334155',
                      fontWeight: 700,
                      fontSize: '0.82rem',
                      border: '1px solid #cbd5e1',
                      cursor: 'pointer'
                    }}
                  >
                    Hacer otra transferencia
                  </button>

                  <button
                    type="button"
                    onClick={onClose}
                    style={{
                      padding: '11px',
                      borderRadius: '14px',
                      background: '#009ee3',
                      color: '#ffffff',
                      fontWeight: 800,
                      fontSize: '0.82rem',
                      border: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    Volver a billeteras
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
