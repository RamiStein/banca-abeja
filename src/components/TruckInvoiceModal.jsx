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
        style={{ width: '680px', maxHeight: '92vh', overflowY: 'auto', backgroundColor: '#ffffff', color: '#0f172a', border: '1px solid #e2e8f0', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}
      >
        {/* Barra de Acciones Superior (se oculta al imprimir) */}
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200 print:hidden">
          <div className="flex items-center gap-2">
            <span className="badge font-bold" style={{ backgroundColor: invoice.balanceDue <= 0 ? '#dcfce7' : '#fef3c7', color: invoice.balanceDue <= 0 ? '#15803d' : '#b45309', border: invoice.balanceDue <= 0 ? '1px solid #bbf7d0' : '1px solid #fde68a' }}>
              {invoice.balanceDue <= 0 ? 'PAGADO COMPLETO' : 'PENDIENTE DE PAGO'}
            </span>
            <span className="text-xs text-slate-500 font-mono font-bold">{invoice.invoiceNumber}</span>
          </div>

          <div className="flex items-center gap-2">
            <button 
              type="button"
              className="btn btn-outline text-xs py-1.5 px-3 rounded-lg"
              style={{ borderColor: '#86efac', color: '#15803d', background: '#f0fdf4', fontWeight: 600 }}
              onClick={handleCopyWhatsApp}
              title="Copiar texto para enviar por WhatsApp"
            >
              {copySuccess ? <Check size={14} /> : <Share2 size={14} />}
              {copySuccess ? '¡Copiado!' : 'WhatsApp'}
            </button>
            <button 
              type="button"
              className="btn btn-primary text-xs py-1.5 px-3 rounded-lg"
              style={{ backgroundColor: '#4f46e5', color: '#ffffff', fontWeight: 600 }}
              onClick={handlePrint}
              title="Imprimir o guardar en PDF"
            >
              <Printer size={14} /> Imprimir / PDF
            </button>
            <button 
              type="button"
              className="btn btn-outline text-xs p-1.5 border-none text-slate-400 hover:text-slate-800"
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
          className="p-6 rounded-xl border border-slate-200 print:border-none print:p-0"
          style={{ backgroundColor: '#ffffff', color: '#0f172a' }}
        >
          {/* Encabezado Principal */}
          <div className="flex justify-between items-start pb-5 mb-5 border-b border-slate-200">
            <div>
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-lg" style={{ backgroundColor: '#fffbeb', color: '#d97706', border: '1px solid #fde68a' }}>
                  <Truck size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-bold tracking-tight text-slate-900">LIQUIDACIÓN DE ALQUILER</h2>
                  <p className="text-xs text-slate-500">Transporte & Logística • Gestión de Flota</p>
                </div>
              </div>
            </div>

            <div className="text-right">
              <div className="text-xs text-slate-400 font-mono font-bold">COMPROBANTE N°</div>
              <div className="text-lg font-bold text-amber-700 font-mono">{invoice.invoiceNumber}</div>
              <div className="text-[11px] text-slate-500 mt-1">
                Fecha emisión: <strong className="text-slate-900">{invoice.issueDate}</strong>
              </div>
            </div>
          </div>

          {/* Bloque de Partes: Dueño vs Inquilino */}
          <div className="grid grid-cols-2 gap-4 pb-5 mb-5 border-b border-slate-200 text-xs">
            {/* Propietario / Emisor */}
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
              <div className="text-slate-500 font-bold uppercase tracking-wider text-[10px] mb-1.5 flex items-center gap-1.5">
                <Shield size={12} className="text-amber-600" /> PROPIETARIO DEL VEHÍCULO
              </div>
              <div className="text-sm font-bold text-slate-900">{invoice.ownerName || 'Ramiro Stein'}</div>
              <div className="text-slate-500 mt-0.5">Gestión y Administración de Unidad</div>
              {invoice.ownerPhone && (
                <div className="text-slate-600 mt-1">Tel: {invoice.ownerPhone}</div>
              )}
            </div>

            {/* Inquilino / Arrendatario */}
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
              <div className="text-slate-500 font-bold uppercase tracking-wider text-[10px] mb-1.5 flex items-center gap-1.5">
                <User size={12} className="text-indigo-600" /> INQUILINO / ARRENDATARIO
              </div>
              <div className="text-sm font-bold text-slate-900">{invoice.tenantName}</div>
              {invoice.tenantPhone && (
                <div className="text-slate-600 mt-0.5">Tel: {invoice.tenantPhone}</div>
              )}
              {invoice.tenantDni && (
                <div className="text-slate-600 mt-0.5">DNI / CUIT: {invoice.tenantDni}</div>
              )}
            </div>
          </div>

          {/* Datos del Camión Alquilado */}
          <div className="mb-5 p-3.5 rounded-lg bg-amber-50 border border-amber-200 text-xs flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <Truck size={18} className="text-amber-700" />
              <div>
                <span className="text-slate-600">Unidad: </span>
                <strong className="text-slate-900">{invoice.vehicleName}</strong>
              </div>
            </div>
            <div>
              <span className="text-slate-600">Patente: </span>
              <strong className="text-amber-800 font-mono px-2 py-0.5 rounded bg-white border border-amber-300 font-bold">{invoice.plate}</strong>
            </div>
            {invoice.currentOdometer && (
              <div>
                <span className="text-slate-600">Odómetro registrado: </span>
                <strong className="text-slate-900">{invoice.currentOdometer.toLocaleString('es-AR')} km</strong>
              </div>
            )}
          </div>

          {/* Tabla de Conceptos Desglosados */}
          <div className="mb-5 overflow-hidden rounded-lg border border-slate-200">
            <table className="w-full text-xs text-left" style={{ borderCollapse: 'collapse' }}>
              <thead>
                <tr className="bg-slate-100 text-slate-600 border-b border-slate-200">
                  <th className="p-2.5">DESCRIPCIÓN DEL CONCEPTO</th>
                  <th className="p-2.5 text-center">DÍAS</th>
                  <th className="p-2.5 text-right">VALOR DIARIO</th>
                  <th className="p-2.5 text-right">SUBTOTAL</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-slate-100">
                  <td className="p-2.5 text-slate-900">
                    <div className="font-semibold text-slate-900">Alquiler de Camión Comercial</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      Período pactado: del <strong>{invoice.startDate}</strong> al <strong>{invoice.endDate}</strong>
                    </div>
                    {invoice.notes && (
                      <div className="text-[10px] text-slate-400 italic mt-0.5">"{invoice.notes}"</div>
                    )}
                  </td>
                  <td className="p-2.5 text-center font-bold text-slate-900">
                    {invoice.daysCount}
                  </td>
                  <td className="p-2.5 text-right font-medium text-slate-800">
                    {formatMoney(invoice.dailyRate)}
                  </td>
                  <td className="p-2.5 text-right font-bold text-slate-900 font-mono">
                    {formatMoney(invoice.subtotal)}
                  </td>
                </tr>

                {invoice.extraKmCost > 0 && (
                  <tr className="border-b border-slate-100">
                    <td className="p-2.5 text-slate-900">
                      <div className="font-medium text-slate-900">Kilómetros Excedentes</div>
                      <div className="text-[11px] text-slate-500">Cálculo de desgaste según odómetro</div>
                    </td>
                    <td className="p-2.5 text-center text-slate-500">-</td>
                    <td className="p-2.5 text-right text-slate-500">-</td>
                    <td className="p-2.5 text-right font-semibold text-amber-700 font-mono">
                      +{formatMoney(invoice.extraKmCost)}
                    </td>
                  </tr>
                )}

                {invoice.expensesAdjustment !== 0 && (
                  <tr className="border-b border-slate-100">
                    <td className="p-2.5 text-slate-900">
                      <div className="font-medium text-slate-900">Ajuste de Gastos Operativos / Combustible</div>
                      <div className="text-[11px] text-slate-500">Compensación acordada de cargas o peajes</div>
                    </td>
                    <td className="p-2.5 text-center text-slate-500">-</td>
                    <td className="p-2.5 text-right text-slate-500">-</td>
                    <td className={`p-2.5 text-right font-semibold font-mono ${invoice.expensesAdjustment < 0 ? 'text-green-700' : 'text-red-700'}`}>
                      {invoice.expensesAdjustment < 0 ? '-' : '+'}{formatMoney(Math.abs(invoice.expensesAdjustment))}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Resumen Total y Saldo */}
          <div className="grid grid-cols-2 gap-5 items-start pb-5 mb-5 border-b border-slate-200">
            {/* Instrucciones de Pago */}
            <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 text-xs">
              <div className="text-slate-500 font-bold uppercase text-[10px] mb-2 flex items-center gap-1.5">
                <CreditCard size={13} className="text-amber-600" /> DATOS PARA TRANSFERENCIA BANCARIA
              </div>
              <div className="flex justify-between py-0.5">
                <span className="text-slate-500">Titular:</span>
                <strong className="text-slate-900">{invoice.ownerName || 'Ramiro Stein'}</strong>
              </div>
              <div className="flex justify-between py-0.5">
                <span className="text-slate-500">Alias:</span>
                <strong className="text-amber-800 font-mono font-bold">{invoice.ownerAlias || 'RAMIRO.CAMION.MP'}</strong>
              </div>
              <div className="flex justify-between py-0.5">
                <span className="text-slate-500">CBU / CVU:</span>
                <span className="text-slate-700 font-mono text-[11px]">{invoice.ownerCbu || '0000003100094827104821'}</span>
              </div>
            </div>

            {/* Totales Numéricos */}
            <div className="flex flex-col gap-1.5 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Total Facturado Alquiler:</span>
                <strong className="text-slate-900 font-mono">{formatMoney(invoice.totalAmount)}</strong>
              </div>
              <div className="flex justify-between text-green-700 font-medium">
                <span>Pagos / Anticipos Registrados:</span>
                <strong className="font-mono">-{formatMoney(invoice.paidAmount || 0)}</strong>
              </div>
              <div className="pt-2 mt-1 border-t border-slate-200 flex justify-between items-center text-base">
                <span className="font-bold text-slate-900">SALDO A LIQUIDAR:</span>
                <span className={`text-xl font-bold font-mono ${invoice.balanceDue > 0 ? 'text-amber-700' : 'text-green-700'}`}>
                  {formatMoney(Math.max(0, invoice.balanceDue))}
                </span>
              </div>
              {invoice.balanceDue <= 0 && (
                <div className="text-right text-xs text-green-700 flex items-center justify-end gap-1 font-semibold">
                  <CheckCircle2 size={13} /> Alquiler completamente saldado
                </div>
              )}
            </div>
          </div>

          {/* Pie de Página */}
          <div className="flex justify-between items-center text-[11px] text-slate-400">
            <div>Liquidación generada con el Sistema de Gestión de Camión • Banca Abeja</div>
            <div>Válido como comprobante interno de arrendamiento</div>
          </div>
        </div>

        {/* Acciones al pie en modal */}
        <div className="mt-3 flex items-center justify-between print:hidden">
          {onMarkPaid && invoice.balanceDue > 0 ? (
            <button 
              type="button"
              className="btn btn-outline text-xs rounded-lg" 
              style={{ borderColor: '#86efac', color: '#15803d', background: '#f0fdf4', fontWeight: 600 }}
              onClick={() => onMarkPaid(invoice.id)}
            >
              <CheckCircle2 size={15} /> Marcar como Pagado Total
            </button>
          ) : (
            <div />
          )}

          <button type="button" className="btn btn-outline text-xs rounded-lg" onClick={onClose}>
            Cerrar Ficha
          </button>
        </div>
      </div>
    </div>
  );
}
