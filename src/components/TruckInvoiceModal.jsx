import React, { useState } from 'react';
import { 
  X, Printer, Share2, CheckCircle2, 
  Truck, User, CreditCard, Shield, Check
} from 'lucide-react';

const formatMoney = (val) => {
  if (!val && val !== 0) return '$0';
  return `$${Math.round(val).toLocaleString('es-AR')}`;
};

export default function TruckInvoiceModal({ invoice, onClose, onMarkPaid }) {
  const [copySuccess, setCopySuccess] = useState(false);

  if (!invoice) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleCopyWhatsApp = () => {
    const text = `📄 *FACTURA DE ALQUILER - ${invoice.invoiceNumber}*
🚚 *Vehículo:* ${invoice.vehicleName} (${invoice.plate})
👤 *Inquilino:* ${invoice.tenantName}
📅 *Período:* ${invoice.startDate} al ${invoice.endDate} (${invoice.daysCount} días)
----------------------------------------
💰 *Tarifa pactada:* ${formatMoney(invoice.dailyRate)} / día
💼 *Subtotal Alquiler:* ${formatMoney(invoice.subtotal)}
${invoice.extraKmCost > 0 ? `🛣️ *Km Excedentes:* ${formatMoney(invoice.extraKmCost)}\n` : ''}${invoice.expensesAdjustment !== 0 ? `⛽ *Ajuste Gastos/Combustible:* ${formatMoney(invoice.expensesAdjustment)}\n` : ''}----------------------------------------
💵 *Total Facturado:* ${formatMoney(invoice.totalAmount)}
💳 *Pagos Recibidos:* ${formatMoney(invoice.paidAmount || 0)}
👉 *SALDO A TRANSFERIR:* ${formatMoney(Math.max(0, invoice.balanceDue))}
----------------------------------------
🏦 *Datos de Pago:*
• Titular: ${invoice.ownerName || 'Ramiro Stein'}
• Alias: ${invoice.ownerAlias || 'RAMIRO.CAMION.MP'}
• CBU: ${invoice.ownerCbu || '0000003100094827104821'}

⚠️ Por favor enviar el comprobante de transferencia al abonar.`;

    navigator.clipboard.writeText(text);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2500);
  };

  return (
    <div className="modal-overlay print:p-0 print:bg-white" onClick={onClose}>
      <div 
        className="card w-full max-w-2xl relative print:border-none print:shadow-none print:bg-white print:p-0"
        onClick={(e) => e.stopPropagation()}
        style={{ width: '680px', maxHeight: '92vh', overflowY: 'auto', backgroundColor: '#131620' }}
      >
        {/* Barra de Acciones Superior (se oculta al imprimir) */}
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-white/10 print:hidden">
          <div className="flex items-center gap-2">
            <span className="badge" style={{ backgroundColor: invoice.balanceDue <= 0 ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)', color: invoice.balanceDue <= 0 ? '#10b981' : '#f59e0b' }}>
              {invoice.balanceDue <= 0 ? 'PAGADO COMPLETO' : 'PENDIENTE DE PAGO'}
            </span>
            <span className="text-xs text-secondary font-mono">{invoice.invoiceNumber}</span>
          </div>

          <div className="flex items-center gap-2">
            <button 
              className="btn btn-outline text-xs py-1.5 px-3"
              style={{ borderColor: '#22c55e', color: '#22c55e' }}
              onClick={handleCopyWhatsApp}
              title="Copiar texto para enviar por WhatsApp"
            >
              {copySuccess ? <Check size={14} /> : <Share2 size={14} />}
              {copySuccess ? '¡Copiado!' : 'WhatsApp'}
            </button>
            <button 
              className="btn btn-primary text-xs py-1.5 px-3"
              style={{ backgroundColor: '#6366f1' }}
              onClick={handlePrint}
              title="Imprimir o guardar en PDF"
            >
              <Printer size={14} /> Imprimir / PDF
            </button>
            <button 
              className="btn btn-outline text-xs p-1.5 border-none text-secondary hover:text-white"
              onClick={onClose}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* =============================================================== */}
        {/* DOCUMENTO FORMAL DE INVOICE / FACTURA DE ALQUILER               */}
        {/* =============================================================== */}
        <div 
          className="p-6 rounded-xl border border-white/10 print:border-none print:p-0 print:text-black"
          style={{ backgroundColor: '#0f111a', color: '#f8fafc' }}
        >
          {/* Encabezado Principal */}
          <div className="flex justify-between items-start pb-6 mb-6 border-b border-white/10">
            <div>
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-lg" style={{ backgroundColor: 'rgba(245, 158, 11, 0.2)', color: '#f59e0b' }}>
                  <Truck size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-bold tracking-tight">LIQUIDACIÓN DE ALQUILER</h2>
                  <p className="text-xs text-secondary">Transporte & Logística • Gestión de Flota</p>
                </div>
              </div>
            </div>

            <div className="text-right">
              <div className="text-xs text-secondary font-mono">COMPROBANTE N°</div>
              <div className="text-lg font-bold text-warning font-mono">{invoice.invoiceNumber}</div>
              <div className="text-[11px] text-secondary mt-1">
                Fecha emisión: <strong className="text-white">{invoice.issueDate}</strong>
              </div>
            </div>
          </div>

          {/* Bloque de Partes: Dueño vs Inquilino */}
          <div className="grid grid-cols-2 gap-4 pb-6 mb-6 border-b border-white/10 text-xs">
            {/* Propietario / Emisor */}
            <div className="p-3 rounded-lg bg-white/5 border border-white/5">
              <div className="text-secondary font-semibold uppercase tracking-wider text-[10px] mb-1.5 flex items-center gap-1.5">
                <Shield size={12} className="text-warning" /> PROPIETARIO DEL VEHÍCULO
              </div>
              <div className="text-sm font-bold text-white">{invoice.ownerName || 'Ramiro Stein'}</div>
              <div className="text-secondary mt-0.5">Gestión y Administración de Unidad</div>
              {invoice.ownerPhone && (
                <div className="text-secondary mt-1">Tel: {invoice.ownerPhone}</div>
              )}
            </div>

            {/* Inquilino / Arrendatario */}
            <div className="p-3 rounded-lg bg-white/5 border border-white/5">
              <div className="text-secondary font-semibold uppercase tracking-wider text-[10px] mb-1.5 flex items-center gap-1.5">
                <User size={12} className="text-accent" /> INQUILINO / ARRENDATARIO
              </div>
              <div className="text-sm font-bold text-white">{invoice.tenantName}</div>
              {invoice.tenantPhone && (
                <div className="text-secondary mt-0.5">Tel: {invoice.tenantPhone}</div>
              )}
              {invoice.tenantDni && (
                <div className="text-secondary mt-0.5">DNI / CUIT: {invoice.tenantDni}</div>
              )}
            </div>
          </div>

          {/* Datos del Camión Alquilado */}
          <div className="mb-6 p-3.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <Truck size={18} className="text-warning" />
              <div>
                <span className="text-secondary">Unidad: </span>
                <strong className="text-white">{invoice.vehicleName}</strong>
              </div>
            </div>
            <div>
              <span className="text-secondary">Patente: </span>
              <strong className="text-warning font-mono px-2 py-0.5 rounded bg-black/40 border border-white/10">{invoice.plate}</strong>
            </div>
            {invoice.currentOdometer && (
              <div>
                <span className="text-secondary">Odómetro registrado: </span>
                <strong className="text-white">{invoice.currentOdometer.toLocaleString('es-AR')} km</strong>
              </div>
            )}
          </div>

          {/* Tabla de Conceptos Desglosados */}
          <div className="mb-6 overflow-hidden rounded-lg border border-white/10">
            <table className="w-full text-xs text-left" style={{ borderCollapse: 'collapse' }}>
              <thead>
                <tr className="bg-white/5 text-secondary border-b border-white/10">
                  <th className="p-2.5">DESCRIPCIÓN DEL CONCEPTO</th>
                  <th className="p-2.5 text-center">DÍAS</th>
                  <th className="p-2.5 text-right">VALOR DIARIO</th>
                  <th className="p-2.5 text-right">SUBTOTAL</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-white/5">
                  <td className="p-2.5 text-white">
                    <div className="font-semibold">Alquiler de Camión Comercial</div>
                    <div className="text-[11px] text-secondary mt-0.5">
                      Período pactado: del <strong>{invoice.startDate}</strong> al <strong>{invoice.endDate}</strong>
                    </div>
                    {invoice.notes && (
                      <div className="text-[10px] text-secondary/70 italic mt-0.5">"{invoice.notes}"</div>
                    )}
                  </td>
                  <td className="p-2.5 text-center font-bold text-white">
                    {invoice.daysCount}
                  </td>
                  <td className="p-2.5 text-right font-medium text-white">
                    {formatMoney(invoice.dailyRate)}
                  </td>
                  <td className="p-2.5 text-right font-bold text-white">
                    {formatMoney(invoice.subtotal)}
                  </td>
                </tr>

                {invoice.extraKmCost > 0 && (
                  <tr className="border-b border-white/5">
                    <td className="p-2.5 text-white">
                      <div className="font-medium">Kilómetros Excedentes</div>
                      <div className="text-[11px] text-secondary">Cálculo de desgaste según odómetro</div>
                    </td>
                    <td className="p-2.5 text-center text-secondary">-</td>
                    <td className="p-2.5 text-right text-secondary">-</td>
                    <td className="p-2.5 text-right font-semibold text-warning">
                      +{formatMoney(invoice.extraKmCost)}
                    </td>
                  </tr>
                )}

                {invoice.expensesAdjustment !== 0 && (
                  <tr className="border-b border-white/5">
                    <td className="p-2.5 text-white">
                      <div className="font-medium">Ajuste de Gastos Operativos / Combustible</div>
                      <div className="text-[11px] text-secondary">Compensación acordada de cargas o peajes</div>
                    </td>
                    <td className="p-2.5 text-center text-secondary">-</td>
                    <td className="p-2.5 text-right text-secondary">-</td>
                    <td className={`p-2.5 text-right font-semibold ${invoice.expensesAdjustment < 0 ? 'text-success' : 'text-danger'}`}>
                      {invoice.expensesAdjustment < 0 ? '-' : '+'}{formatMoney(Math.abs(invoice.expensesAdjustment))}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Resumen Total y Saldo */}
          <div className="grid grid-cols-2 gap-6 items-start pb-6 mb-6 border-b border-white/10">
            {/* Instrucciones de Pago */}
            <div className="p-3.5 rounded-lg bg-white/5 border border-white/5 text-xs">
              <div className="text-secondary font-semibold uppercase text-[10px] mb-2 flex items-center gap-1.5">
                <CreditCard size={13} className="text-warning" /> DATOS PARA TRANSFERENCIA BANCARIA
              </div>
              <div className="flex justify-between py-0.5">
                <span className="text-secondary">Titular:</span>
                <strong className="text-white">{invoice.ownerName || 'Ramiro Stein'}</strong>
              </div>
              <div className="flex justify-between py-0.5">
                <span className="text-secondary">Alias:</span>
                <strong className="text-warning font-mono">{invoice.ownerAlias || 'RAMIRO.CAMION.MP'}</strong>
              </div>
              <div className="flex justify-between py-0.5">
                <span className="text-secondary">CBU / CVU:</span>
                <span className="text-white font-mono text-[11px]">{invoice.ownerCbu || '0000003100094827104821'}</span>
              </div>
            </div>

            {/* Totales Numéricos */}
            <div className="flex flex-col gap-1.5 text-xs">
              <div className="flex justify-between text-secondary">
                <span>Total Facturado Alquiler:</span>
                <strong className="text-white">{formatMoney(invoice.totalAmount)}</strong>
              </div>
              <div className="flex justify-between text-success">
                <span>Pagos / Anticipos Registrados:</span>
                <strong>-{formatMoney(invoice.paidAmount || 0)}</strong>
              </div>
              <div className="pt-2 mt-1 border-t border-white/10 flex justify-between items-center text-base">
                <span className="font-bold text-white">SALDO A LIQUIDAR:</span>
                <span className={`text-xl font-bold font-mono ${invoice.balanceDue > 0 ? 'text-warning' : 'text-success'}`}>
                  {formatMoney(Math.max(0, invoice.balanceDue))}
                </span>
              </div>
              {invoice.balanceDue <= 0 && (
                <div className="text-right text-xs text-success flex items-center justify-end gap-1 font-medium">
                  <CheckCircle2 size={13} /> Alquiler completamente saldado
                </div>
              )}
            </div>
          </div>

          {/* Pie de Página */}
          <div className="flex justify-between items-center text-[11px] text-secondary">
            <div>Liquidación generada con el Sistema de Gestión de Camión • Banca Abeja</div>
            <div>Válido como comprobante interno de arrendamiento</div>
          </div>
        </div>

        {/* Acciones al pie en modal */}
        <div className="mt-4 flex items-center justify-between print:hidden">
          {onMarkPaid && invoice.balanceDue > 0 ? (
            <button 
              className="btn btn-outline text-xs" 
              style={{ borderColor: '#10b981', color: '#10b981' }}
              onClick={() => onMarkPaid(invoice.id)}
            >
              <CheckCircle2 size={15} /> Marcar como Pagado Total
            </button>
          ) : (
            <div />
          )}

          <button className="btn btn-outline text-xs" onClick={onClose}>
            Cerrar Ficha
          </button>
        </div>
      </div>
    </div>
  );
}
