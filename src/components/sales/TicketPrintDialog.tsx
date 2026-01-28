import { useRef } from 'react';
import { Printer, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { SaleTicket } from './SaleTicket';
import type { CartItem, Customer } from '@/stores/cartStore';

interface TicketPrintDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  saleNumber: number;
  businessName: string;
  items: CartItem[];
  customer: Customer | null;
  paymentMethod: string;
  subtotal: number;
  discount: number;
  total: number;
  sellerName?: string;
  notes?: string;
}

export const TicketPrintDialog = ({
  open,
  onOpenChange,
  saleNumber,
  businessName,
  items,
  customer,
  paymentMethod,
  subtotal,
  discount,
  total,
  sellerName,
  notes,
}: TicketPrintDialogProps) => {
  const ticketRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    if (!ticketRef.current) return;

    const printContent = ticketRef.current.innerHTML;
    const printWindow = window.open('', '_blank', 'width=320,height=600');
    
    if (!printWindow) {
      alert('Por favor habilite las ventanas emergentes para imprimir');
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Ticket #${String(saleNumber).padStart(6, '0')}</title>
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            body {
              font-family: 'Courier New', monospace;
              font-size: 12px;
              background: white;
              color: black;
            }
            @page {
              size: 80mm auto;
              margin: 0;
            }
            @media print {
              body {
                width: 80mm;
              }
            }
          </style>
        </head>
        <body>
          ${printContent}
          <script>
            window.onload = function() {
              window.print();
              window.onafterprint = function() {
                window.close();
              };
            };
          </script>
        </body>
      </html>
    `);
    
    printWindow.document.close();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm p-0 gap-0">
        <DialogHeader className="p-4 pb-2">
          <DialogTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Printer className="h-5 w-5" />
              Vista Previa del Ticket
            </span>
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] border-y">
          <div className="flex justify-center bg-muted/50 p-4">
            <SaleTicket
              ref={ticketRef}
              saleNumber={saleNumber}
              businessName={businessName}
              items={items}
              customer={customer}
              paymentMethod={paymentMethod}
              subtotal={subtotal}
              discount={discount}
              total={total}
              sellerName={sellerName}
              notes={notes}
            />
          </div>
        </ScrollArea>

        <div className="p-4 flex gap-2">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => onOpenChange(false)}
          >
            <X className="h-4 w-4 mr-2" />
            Cerrar
          </Button>
          <Button className="flex-1" onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-2" />
            Imprimir
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
