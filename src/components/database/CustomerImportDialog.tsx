import { useState, useCallback } from 'react';
import * as XLSX from 'xlsx';
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle2, Download, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { useBusinessStore } from '@/stores/businessStore';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface CustomerImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImportComplete: () => void;
}

interface ImportRow {
  code: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  tax_id?: string;
  credit_limit: number;
  isValid: boolean;
  errors: string[];
}

const REQUIRED_COLUMNS = ['code', 'name'];
const OPTIONAL_COLUMNS = ['email', 'phone', 'address', 'city', 'tax_id', 'credit_limit'];

const COLUMN_MAPPINGS: Record<string, string[]> = {
  code: ['code', 'codigo', 'código', 'cod', 'id_cliente'],
  name: ['name', 'nombre', 'razon_social', 'razón_social', 'cliente'],
  email: ['email', 'correo', 'mail', 'e-mail'],
  phone: ['phone', 'telefono', 'teléfono', 'tel', 'celular'],
  address: ['address', 'direccion', 'dirección', 'domicilio'],
  city: ['city', 'ciudad', 'localidad'],
  tax_id: ['tax_id', 'cuit', 'dni', 'ruc', 'nit', 'rfc'],
  credit_limit: ['credit_limit', 'limite_credito', 'límite_crédito', 'credito'],
};

export function CustomerImportDialog({ open, onOpenChange, onImportComplete }: CustomerImportDialogProps) {
  const [step, setStep] = useState<'upload' | 'preview' | 'importing' | 'complete'>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [rows, setRows] = useState<ImportRow[]>([]);
  const [progress, setProgress] = useState(0);
  const [importResults, setImportResults] = useState({ success: 0, failed: 0 });
  const [isDragging, setIsDragging] = useState(false);
  
  const { selectedBusiness } = useBusinessStore();

  const resetState = () => {
    setStep('upload');
    setFile(null);
    setRows([]);
    setProgress(0);
    setImportResults({ success: 0, failed: 0 });
  };

  const handleClose = (open: boolean) => {
    if (!open) {
      resetState();
    }
    onOpenChange(open);
  };

  const findColumn = (headers: string[], field: string): string | null => {
    const mappings = COLUMN_MAPPINGS[field] || [field];
    const normalizedHeaders = headers.map(h => h.toLowerCase().trim().replace(/\s+/g, '_'));
    
    for (const mapping of mappings) {
      const index = normalizedHeaders.indexOf(mapping.toLowerCase());
      if (index !== -1) {
        return headers[index];
      }
    }
    return null;
  };

  const validateRow = (row: Record<string, unknown>, columnMap: Record<string, string | null>): ImportRow => {
    const errors: string[] = [];
    
    const code = String(row[columnMap.code || ''] || '').trim();
    const name = String(row[columnMap.name || ''] || '').trim();
    const email = columnMap.email ? String(row[columnMap.email] || '').trim() : '';
    const phone = columnMap.phone ? String(row[columnMap.phone] || '').trim() : '';
    const address = columnMap.address ? String(row[columnMap.address] || '').trim() : '';
    const city = columnMap.city ? String(row[columnMap.city] || '').trim() : '';
    const tax_id = columnMap.tax_id ? String(row[columnMap.tax_id] || '').trim() : '';
    const creditLimit = columnMap.credit_limit ? parseFloat(String(row[columnMap.credit_limit] || '0')) : 0;

    if (!code) errors.push('Código requerido');
    if (!name) errors.push('Nombre requerido');

    return {
      code,
      name,
      email: email || undefined,
      phone: phone || undefined,
      address: address || undefined,
      city: city || undefined,
      tax_id: tax_id || undefined,
      credit_limit: isNaN(creditLimit) ? 0 : creditLimit,
      isValid: errors.length === 0,
      errors,
    };
  };

  const processFile = useCallback(async (file: File) => {
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet);

      if (jsonData.length === 0) {
        toast.error('El archivo está vacío');
        return;
      }

      const headers = Object.keys(jsonData[0]);
      const columnMap: Record<string, string | null> = {};

      for (const field of [...REQUIRED_COLUMNS, ...OPTIONAL_COLUMNS]) {
        columnMap[field] = findColumn(headers, field);
      }

      const missingRequired = REQUIRED_COLUMNS.filter(col => !columnMap[col]);
      if (missingRequired.length > 0) {
        toast.error(`Columnas requeridas no encontradas: ${missingRequired.join(', ')}`);
        return;
      }

      const validatedRows = jsonData.map(row => validateRow(row, columnMap));
      setRows(validatedRows);
      setFile(file);
      setStep('preview');
    } catch (error) {
      console.error('Error processing file:', error);
      toast.error('Error al procesar el archivo');
    }
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      processFile(selectedFile);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && (droppedFile.name.endsWith('.xlsx') || droppedFile.name.endsWith('.xls') || droppedFile.name.endsWith('.csv'))) {
      processFile(droppedFile);
    } else {
      toast.error('Por favor sube un archivo Excel (.xlsx, .xls) o CSV');
    }
  }, [processFile]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const downloadTemplate = () => {
    const template = [
      {
        code: 'CLI-001',
        name: 'Cliente Ejemplo',
        email: 'cliente@ejemplo.com',
        phone: '+54 11 1234-5678',
        address: 'Av. Principal 123',
        city: 'Buenos Aires',
        tax_id: '20-12345678-9',
        credit_limit: 50000,
      },
    ];

    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Clientes');
    XLSX.writeFile(wb, 'plantilla_clientes.xlsx');
  };

  const handleImport = async () => {
    const validRows = rows.filter(r => r.isValid);
    if (validRows.length === 0) {
      toast.error('No hay clientes válidos para importar');
      return;
    }

    if (!selectedBusiness) {
      toast.error('Debe seleccionar un negocio primero');
      return;
    }

    setStep('importing');
    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < validRows.length; i++) {
      const row = validRows[i];
      try {
        const { error } = await supabase.from('customers').insert({
          code: row.code,
          name: row.name,
          email: row.email || null,
          phone: row.phone || null,
          address: row.address || null,
          city: row.city || null,
          tax_id: row.tax_id || null,
          credit_limit: row.credit_limit,
          business: selectedBusiness,
          current_balance: 0,
        });

        if (error) {
          console.error('Error inserting customer:', error);
          failCount++;
        } else {
          successCount++;
        }
      } catch (error) {
        console.error('Error inserting customer:', error);
        failCount++;
      }

      setProgress(Math.round(((i + 1) / validRows.length) * 100));
    }

    setImportResults({ success: successCount, failed: failCount });
    setStep('complete');
    
    if (successCount > 0) {
      onImportComplete();
    }
  };

  const validCount = rows.filter(r => r.isValid).length;
  const invalidCount = rows.filter(r => !r.isValid).length;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Importar Clientes desde Excel/CSV
          </DialogTitle>
          <DialogDescription>
            {step === 'upload' && 'Sube un archivo Excel o CSV con los clientes a importar'}
            {step === 'preview' && 'Revisa los clientes antes de importar'}
            {step === 'importing' && 'Importando clientes...'}
            {step === 'complete' && 'Importación completada'}
          </DialogDescription>
        </DialogHeader>

        {step === 'upload' && (
          <div className="space-y-4">
            <div
              className={cn(
                "border-2 border-dashed rounded-lg p-8 text-center transition-colors",
                isDragging ? "border-primary bg-primary/5" : "border-muted-foreground/25"
              )}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
            >
              <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-lg font-medium mb-2">
                Arrastra y suelta tu archivo aquí
              </p>
              <p className="text-sm text-muted-foreground mb-4">
                Formatos soportados: .xlsx, .xls, .csv
              </p>
              <input
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileChange}
                className="hidden"
                id="customer-file-upload"
              />
              <label htmlFor="customer-file-upload">
                <Button variant="outline" asChild>
                  <span>Seleccionar archivo</span>
                </Button>
              </label>
            </div>

            <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
              <div>
                <p className="font-medium">¿Necesitas una plantilla?</p>
                <p className="text-sm text-muted-foreground">
                  Descarga la plantilla con el formato correcto
                </p>
              </div>
              <Button variant="outline" onClick={downloadTemplate}>
                <Download className="h-4 w-4 mr-2" />
                Descargar plantilla
              </Button>
            </div>

            <div className="text-sm text-muted-foreground">
              <p className="font-medium mb-2">Columnas requeridas:</p>
              <ul className="list-disc list-inside space-y-1">
                <li><code>code</code> - Código del cliente</li>
                <li><code>name</code> - Nombre o razón social</li>
              </ul>
              <p className="font-medium mt-3 mb-2">Columnas opcionales:</p>
              <ul className="list-disc list-inside space-y-1">
                <li><code>email</code> - Correo electrónico</li>
                <li><code>phone</code> - Teléfono</li>
                <li><code>address</code> - Dirección</li>
                <li><code>city</code> - Ciudad</li>
                <li><code>tax_id</code> - CUIT/DNI</li>
                <li><code>credit_limit</code> - Límite de crédito</li>
              </ul>
            </div>
          </div>
        )}

        {step === 'preview' && (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <Badge variant="outline" className="gap-1">
                <FileSpreadsheet className="h-3 w-3" />
                {file?.name}
              </Badge>
              <Badge variant="default" className="gap-1">
                <CheckCircle2 className="h-3 w-3" />
                {validCount} válidos
              </Badge>
              {invalidCount > 0 && (
                <Badge variant="destructive" className="gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {invalidCount} con errores
                </Badge>
              )}
            </div>

            <ScrollArea className="h-[400px] border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">Estado</TableHead>
                    <TableHead>Código</TableHead>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Teléfono</TableHead>
                    <TableHead className="text-right">Crédito</TableHead>
                    <TableHead>Errores</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((row, index) => (
                    <TableRow key={index} className={cn(!row.isValid && "bg-destructive/10")}>
                      <TableCell>
                        {row.isValid ? (
                          <CheckCircle2 className="h-4 w-4 text-primary" />
                        ) : (
                          <AlertCircle className="h-4 w-4 text-destructive" />
                        )}
                      </TableCell>
                      <TableCell className="font-mono text-sm">{row.code}</TableCell>
                      <TableCell>{row.name}</TableCell>
                      <TableCell className="text-sm">{row.email || '-'}</TableCell>
                      <TableCell className="text-sm">{row.phone || '-'}</TableCell>
                      <TableCell className="text-right">${row.credit_limit.toLocaleString()}</TableCell>
                      <TableCell>
                        {row.errors.length > 0 && (
                          <span className="text-sm text-destructive">
                            {row.errors.join(', ')}
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          </div>
        )}

        {step === 'importing' && (
          <div className="py-8 space-y-4">
            <div className="text-center">
              <p className="text-lg font-medium mb-2">Importando clientes...</p>
              <p className="text-sm text-muted-foreground">
                Por favor espera mientras se procesan los clientes
              </p>
            </div>
            <Progress value={progress} className="h-3" />
            <p className="text-center text-sm text-muted-foreground">{progress}%</p>
          </div>
        )}

        {step === 'complete' && (
          <div className="py-8 text-center space-y-4">
            <CheckCircle2 className="h-16 w-16 mx-auto text-primary" />
            <div>
              <p className="text-lg font-medium">¡Importación completada!</p>
              <p className="text-muted-foreground mt-2">
                {importResults.success} clientes importados correctamente
                {importResults.failed > 0 && `, ${importResults.failed} fallaron`}
              </p>
            </div>
          </div>
        )}

        <DialogFooter>
          {step === 'upload' && (
            <Button variant="outline" onClick={() => handleClose(false)}>
              Cancelar
            </Button>
          )}
          
          {step === 'preview' && (
            <>
              <Button variant="outline" onClick={resetState}>
                <X className="h-4 w-4 mr-2" />
                Cancelar
              </Button>
              <Button onClick={handleImport} disabled={validCount === 0}>
                <Upload className="h-4 w-4 mr-2" />
                Importar {validCount} clientes
              </Button>
            </>
          )}
          
          {step === 'complete' && (
            <Button onClick={() => handleClose(false)}>
              Cerrar
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}