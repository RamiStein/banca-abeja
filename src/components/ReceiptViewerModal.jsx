import React from 'react';
import { 
  X, FileText, CheckCircle2, Clock, AlertTriangle, Download, 
  ExternalLink, Eye, ShieldCheck, Tag, Calendar, User, Wallet, 
  Building2, Hash, FileSpreadsheet
} from 'lucide-react';

const STATUS_CONFIG = {
  pendiente: {
    label: 'Pendiente de Revisión',
    bg: '#fffbeb',
    color: '#b45309',
    border: '#fde68a',
    icon: Clock
  },
  aprobado: {
    label: 'Aprobado / Validado',
    bg: '#f0fdf4',
    color: '#15803d',
    border: '#bbf7d0',
    icon: CheckCircle2
  },
  rendido: {
    label: 'Rendido con Factura',
    bg: '#f0f9ff',
    color: '#0284c7',
    border: '#bae6fd',
    icon: ShieldCheck
  },
  observado: {
    label: 'Observado / Rechazado',
    bg: '#fef2f2',
    color: '#b91c1c',
    border: '#fecaca',
    icon: AlertTriangle
  }
};

export default function ReceiptViewerModal({ transaction, onClose, onUpdateStatus }) {
  if (!transaction) return null;

  const currentStatus = transaction.status || 'aprobado';
  const statusCfg = STATUS_CONFIG[currentStatus] || STATUS_CONFIG.aprobado;
  const StatusIcon = statusCfg.icon;

  const handleDownload = () => {
    if (!transaction.receiptUrl) return;
    const link = document.createElement('a');
    link.href = transaction.receiptUrl;
    link.download = transaction.receiptFileName || `comprobante-${transaction.id}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const isPdf = transaction.receiptUrl && (
    transaction.receiptUrl.startsWith('data:application/pdf') || 
    (transaction.receiptFileName && transaction.receiptFileName.toLowerCase().endsWith('.pdf'))
  );

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 100 }}>
      <div 
        className="card w-full max-w-4xl relative" 
        onClick={(e) => e.stopPropagation()}
        style={{ 
          maxWidth: '900px', 
          width: '95%', 
          maxHeight: '90vh', 
          display: 'flex', 
          flexDirection: 'column',
          padding: '1.75rem',
          backgroundColor: '#ffffff',
          border: '1px solid #e2e8f0',
          boxShadow: 'var(--shadow-lg)'
        }}
      >
        {/* Header */}
        <div className="flex justify-between items-start pb-4 border-b" style={{ borderColor: 'var(--border-color)' }}>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span style={{ 
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '4px 10px',
                borderRadius: '9999px',
                fontSize: '0.78rem',
                fontWeight: 600,
                backgroundColor: statusCfg.bg,
                color: statusCfg.color,
                border: `1px solid ${statusCfg.border}`
              }}>
                <StatusIcon size={14} />
                {statusCfg.label}
              </span>

              {transaction.receiptType && (
                <span style={{
                  padding: '4px 8px',
                  borderRadius: '6px',
                  fontSize: '0.75rem',
                  backgroundColor: '#eef2ff',
                  color: '#4338ca',
                  fontWeight: 600,
                  border: '1px solid #c7d2fe'
                }}>
                  {transaction.receiptType}
                </span>
              )}
            </div>

            <h3 className="text-2xl font-bold mt-1 flex items-center gap-2" style={{ color: '#0f172a' }}>
              <FileText size={22} className="text-accent" />
              {transaction.concept}
            </h3>

            {transaction.receiptNumber && (
              <p className="text-secondary text-sm flex items-center gap-1 mt-0.5 font-mono">
                <Hash size={14} /> Nº Comprobante: {transaction.receiptNumber}
              </p>
            )}
          </div>

          <button 
            className="btn btn-outline" 
            style={{ padding: '0.4rem', border: 'none', color: 'var(--text-secondary)' }}
            onClick={onClose}
            title="Cerrar ventana"
          >
            <X size={22} />
          </button>
        </div>

        {/* Content Body */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4 overflow-y-auto" style={{ maxHeight: 'calc(80vh - 120px)' }}>
          
          {/* Panel Izquierdo: Vista previa del comprobante */}
          <div className="flex flex-col gap-3">
            <div className="flex justify-between items-center">
              <span className="text-xs uppercase font-semibold text-secondary tracking-wider flex items-center gap-1.5">
                <Eye size={14} /> Evidencia Digital / Ticket
              </span>
              {transaction.receiptUrl && (
                <div className="flex gap-2">
                  <button 
                    onClick={handleDownload}
                    className="btn btn-outline" 
                    style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                    title="Descargar archivo"
                  >
                    <Download size={14} /> Descargar
                  </button>
                  <a 
                    href={transaction.receiptUrl} 
                    target="_blank" 
                    rel="noreferrer"
                    className="btn btn-outline" 
                    style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                    title="Abrir en pestaña nueva"
                  >
                    <ExternalLink size={14} /> Ampliar
                  </a>
                </div>
              )}
            </div>

            <div 
              style={{ 
                minHeight: '280px', 
                backgroundColor: '#f8fafc', 
                borderRadius: '12px',
                border: '1px dashed #cbd5e1',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
                position: 'relative'
              }}
            >
              {transaction.receiptUrl ? (
                isPdf ? (
                  <div className="flex flex-col items-center gap-3 p-6 text-center">
                    <FileSpreadsheet size={48} color="#0284c7" />
                    <div>
                      <p className="font-semibold" style={{ color: '#0f172a' }}>{transaction.receiptFileName || 'Documento PDF'}</p>
                      <p className="text-secondary text-xs mt-1">Comprobante en formato digital PDF</p>
                    </div>
                    <a 
                      href={transaction.receiptUrl} 
                      target="_blank" 
                      rel="noreferrer" 
                      className="btn btn-primary"
                      style={{ fontSize: '0.85rem', padding: '6px 14px' }}
                    >
                      <ExternalLink size={16} /> Abrir PDF Completo
                    </a>
                  </div>
                ) : (
                  <img 
                    src={transaction.receiptUrl} 
                    alt="Comprobante digital" 
                    style={{ 
                      maxWidth: '100%', 
                      maxHeight: '400px', 
                      objectFit: 'contain',
                      borderRadius: '8px'
                    }} 
                  />
                )
              ) : (
                <div className="flex flex-col items-center gap-2 p-8 text-center text-secondary">
                  <FileText size={42} style={{ opacity: 0.4 }} />
                  <p className="text-sm font-medium">Sin comprobante digital adjunto</p>
                  <span className="text-xs" style={{ opacity: 0.7 }}>
                    Este movimiento fue registrado sin ticket o factura adjunta.
                  </span>
                </div>
              )}
            </div>

            {transaction.receiptFileName && (
              <p className="text-xs text-secondary font-mono truncate">
                Archivo: {transaction.receiptFileName}
              </p>
            )}
          </div>

          {/* Panel Derecho: Datos Económicos, Proveedor y Auditoría */}
          <div className="flex flex-col gap-4">
            
            {/* Monto Destacado */}
            <div style={{ 
              padding: '1.2rem', 
              borderRadius: '12px', 
              backgroundColor: '#f8fafc',
              border: '1px solid #e2e8f0'
            }}>
              <span className="text-xs text-secondary uppercase tracking-wider block mb-1">Monto de la Operación</span>
              <div className="text-3xl font-bold flex items-baseline gap-2">
                <span className={transaction.amount > 0 ? 'text-success' : 'text-danger'}>
                  {transaction.amount > 0 ? '+' : ''}${Math.abs(transaction.amount).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                </span>
                <span className="text-xs text-secondary font-normal font-sans">
                  ({transaction.type === 'income' ? 'Ingreso' : (transaction.type === 'advance' ? 'Anticipo a Rendir' : 'Gasto / Egreso')})
                </span>
              </div>
            </div>

            {/* Metadatos en Ficha */}
            <div className="flex flex-col gap-2.5 text-sm">
              <div className="flex justify-between items-center py-2 border-b" style={{ borderColor: '#e2e8f0' }}>
                <span className="text-secondary flex items-center gap-2"><Calendar size={15} /> Fecha del Movimiento</span>
                <span className="font-semibold" style={{ color: '#0f172a' }}>{transaction.date}</span>
              </div>

              <div className="flex justify-between items-center py-2 border-b" style={{ borderColor: '#e2e8f0' }}>
                <span className="text-secondary flex items-center gap-2"><Wallet size={15} /> Billetera / Cuenta</span>
                <span className="font-medium" style={{ color: '#0f172a' }}>{transaction.wallet}</span>
              </div>

              <div className="flex justify-between items-center py-2 border-b" style={{ borderColor: '#e2e8f0' }}>
                <span className="text-secondary flex items-center gap-2"><Tag size={15} /> Proyecto / Imputación</span>
                <span className="font-semibold" style={{ color: 'var(--accent-color)' }}>
                  {transaction.project || 'Sin Proyecto Asignado'}
                </span>
              </div>

              <div className="flex justify-between items-center py-2 border-b" style={{ borderColor: '#e2e8f0' }}>
                <span className="text-secondary flex items-center gap-2">
                  <User size={15} /> 
                  {transaction.type === 'income' ? 'Emisor / Cliente' : (transaction.type === 'advance' ? 'Responsable Anticipo' : 'Proveedor / Destinatario')}
                </span>
                <span className="font-medium" style={{ color: '#0f172a' }}>
                  {transaction.recipient || transaction.advanceHolder || 'No especificado'}
                </span>
              </div>

              {transaction.category && (
                <div className="flex justify-between items-center py-2 border-b" style={{ borderColor: '#e2e8f0' }}>
                  <span className="text-secondary flex items-center gap-2"><Building2 size={15} /> Categoría</span>
                  <span className="font-medium" style={{ color: '#0f172a' }}>{transaction.category}</span>
                </div>
              )}
            </div>

            {/* Selector de Acción de Auditoría (Cambio Rápido de Estado) */}
            <div className="mt-2 p-3.5 rounded-lg" style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
              <label className="text-xs font-semibold text-secondary uppercase tracking-wider block mb-2">
                Dictamen de Auditoría / Estado:
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => onUpdateStatus && onUpdateStatus(transaction.id, 'aprobado')}
                  style={{
                    fontSize: '0.8rem',
                    padding: '8px 10px',
                    borderColor: currentStatus === 'aprobado' ? '#16a34a' : '#cbd5e1',
                    backgroundColor: currentStatus === 'aprobado' ? '#dcfce7' : '#ffffff',
                    color: currentStatus === 'aprobado' ? '#15803d' : '#64748b',
                    fontWeight: currentStatus === 'aprobado' ? 700 : 500
                  }}
                >
                  <CheckCircle2 size={14} /> Aprobar
                </button>

                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => onUpdateStatus && onUpdateStatus(transaction.id, 'rendido')}
                  style={{
                    fontSize: '0.8rem',
                    padding: '8px 10px',
                    borderColor: currentStatus === 'rendido' ? '#0284c7' : '#cbd5e1',
                    backgroundColor: currentStatus === 'rendido' ? '#e0f2fe' : '#ffffff',
                    color: currentStatus === 'rendido' ? '#0369a1' : '#64748b',
                    fontWeight: currentStatus === 'rendido' ? 700 : 500
                  }}
                >
                  <ShieldCheck size={14} /> Rendido (Factura OK)
                </button>

                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => onUpdateStatus && onUpdateStatus(transaction.id, 'pendiente')}
                  style={{
                    fontSize: '0.8rem',
                    padding: '8px 10px',
                    borderColor: currentStatus === 'pendiente' ? '#d97706' : '#cbd5e1',
                    backgroundColor: currentStatus === 'pendiente' ? '#fef3c7' : '#ffffff',
                    color: currentStatus === 'pendiente' ? '#b45309' : '#64748b',
                    fontWeight: currentStatus === 'pendiente' ? 700 : 500
                  }}
                >
                  <Clock size={14} /> Poner en Revisión
                </button>

                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => onUpdateStatus && onUpdateStatus(transaction.id, 'observado')}
                  style={{
                    fontSize: '0.8rem',
                    padding: '8px 10px',
                    borderColor: currentStatus === 'observado' ? '#dc2626' : '#cbd5e1',
                    backgroundColor: currentStatus === 'observado' ? '#fee2e2' : '#ffffff',
                    color: currentStatus === 'observado' ? '#b91c1c' : '#64748b',
                    fontWeight: currentStatus === 'observado' ? 700 : 500
                  }}
                >
                  <AlertTriangle size={14} /> Observar / Rechazar
                </button>
              </div>
            </div>

          </div>

        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 pt-4 mt-4 border-t" style={{ borderColor: 'var(--border-color)' }}>
          <button className="btn btn-primary" onClick={onClose}>
            Entendido / Cerrar
          </button>
        </div>

      </div>
    </div>
  );
}
