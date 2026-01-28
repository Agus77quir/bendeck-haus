import { forwardRef } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import type { CartItem, Customer } from '@/stores/cartStore';

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
  }).format(amount);
};

const paymentLabels: Record<string, string> = {
  cash: 'Efectivo',
  card: 'Tarjeta',
  transfer: 'Transferencia',
  account: 'Cuenta Corriente',
};

interface SaleTicketProps {
  saleNumber: number;
  businessName: string;
  items: CartItem[];
  customer: Customer | null;
  paymentMethod: string;
  subtotal: number;
  discount: number;
  total: number;
  sellerName?: string;
  date?: Date;
  notes?: string;
}

export const SaleTicket = forwardRef<HTMLDivElement, SaleTicketProps>(
  (
    {
      saleNumber,
      businessName,
      items,
      customer,
      paymentMethod,
      subtotal,
      discount,
      total,
      sellerName,
      date = new Date(),
      notes,
    },
    ref
  ) => {
    return (
      <div
        ref={ref}
        className="bg-white text-black p-6 w-[80mm] min-h-[200mm] font-mono text-xs"
        style={{ fontFamily: 'monospace' }}
      >
        {/* Header */}
        <div className="text-center border-b border-dashed border-gray-400 pb-3 mb-3">
          <h1 className="text-lg font-bold uppercase tracking-wide">
            {businessName}
          </h1>
          <p className="text-[10px] text-gray-600 mt-1">
            Comprobante de Venta
          </p>
        </div>

        {/* Sale Info */}
        <div className="border-b border-dashed border-gray-400 pb-3 mb-3 space-y-1">
          <div className="flex justify-between">
            <span>Ticket Nº:</span>
            <span className="font-bold">{String(saleNumber).padStart(6, '0')}</span>
          </div>
          <div className="flex justify-between">
            <span>Fecha:</span>
            <span>{format(date, "dd/MM/yyyy", { locale: es })}</span>
          </div>
          <div className="flex justify-between">
            <span>Hora:</span>
            <span>{format(date, "HH:mm:ss", { locale: es })}</span>
          </div>
          {sellerName && (
            <div className="flex justify-between">
              <span>Vendedor:</span>
              <span>{sellerName}</span>
            </div>
          )}
        </div>

        {/* Customer Info */}
        {customer && (
          <div className="border-b border-dashed border-gray-400 pb-3 mb-3">
            <p className="font-bold mb-1">Cliente:</p>
            <p>{customer.name}</p>
            {customer.code && <p className="text-gray-600">Cód: {customer.code}</p>}
            {customer.tax_id && <p className="text-gray-600">CUIT: {customer.tax_id}</p>}
          </div>
        )}

        {/* Items */}
        <div className="border-b border-dashed border-gray-400 pb-3 mb-3">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-300">
                <th className="text-left py-1">Cant</th>
                <th className="text-left py-1">Descripción</th>
                <th className="text-right py-1">Total</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.product.id} className="border-b border-gray-200">
                  <td className="py-1 align-top">{item.quantity}</td>
                  <td className="py-1">
                    <div className="break-words max-w-[120px]">
                      {item.product.name}
                    </div>
                    <div className="text-[9px] text-gray-500">
                      {formatCurrency(item.unitPrice)} c/u
                      {item.discount > 0 && ` (-${item.discount}%)`}
                    </div>
                  </td>
                  <td className="py-1 text-right align-top">
                    {formatCurrency(item.total)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="space-y-1 mb-3">
          <div className="flex justify-between">
            <span>Subtotal:</span>
            <span>{formatCurrency(subtotal)}</span>
          </div>
          {discount > 0 && (
            <div className="flex justify-between text-gray-600">
              <span>Descuentos:</span>
              <span>-{formatCurrency(discount)}</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-sm border-t border-gray-400 pt-2 mt-2">
            <span>TOTAL:</span>
            <span>{formatCurrency(total)}</span>
          </div>
        </div>

        {/* Payment Method */}
        <div className="border-t border-dashed border-gray-400 pt-3 mb-3">
          <div className="flex justify-between">
            <span>Forma de Pago:</span>
            <span className="font-bold">{paymentLabels[paymentMethod] || paymentMethod}</span>
          </div>
        </div>

        {/* Notes */}
        {notes && (
          <div className="border-t border-dashed border-gray-400 pt-3 mb-3">
            <p className="font-bold mb-1">Notas:</p>
            <p className="text-[10px] text-gray-600">{notes}</p>
          </div>
        )}

        {/* Footer */}
        <div className="text-center border-t border-dashed border-gray-400 pt-3 mt-4">
          <p className="text-[10px] text-gray-500">
            ¡Gracias por su compra!
          </p>
          <p className="text-[9px] text-gray-400 mt-2">
            Este documento no es válido como factura
          </p>
        </div>

        {/* Print-only styles */}
        <style>{`
          @media print {
            @page {
              size: 80mm auto;
              margin: 0;
            }
            body {
              margin: 0;
              padding: 0;
            }
          }
        `}</style>
      </div>
    );
  }
);

SaleTicket.displayName = 'SaleTicket';
