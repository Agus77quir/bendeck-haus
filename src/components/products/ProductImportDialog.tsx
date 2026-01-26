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

interface ProductImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImportComplete: () => void;
}

interface ImportRow {
  code: string;
  name: string;
  description?: string;
  purchase_price: number;
  sale_price: number;
  stock: number;
  min_stock: number;
  isValid: boolean;
  errors: string[];
}

const REQUIRED_COLUMNS = ['code', 'name', 'purchase_price', 'sale_price', 'stock'];
const OPTIONAL_COLUMNS = ['description', 'min_stock'];

const COLUMN_MAPPINGS: Record<string, string[]> = {
  code: ['code', 'codigo', 'código', 'sku', 'barcode', 'cod'],
  name: ['name', 'nombre', 'producto', 'descripcion_corta', 'title'],
  description: ['description', 'descripcion', 'descripción', 'detalle', 'obs'],
  purchase_price: ['purchase_price', 'precio_compra', 'costo', 'cost', 'precio_costo'],
  sale_price: ['sale_price', 'precio_venta', 'precio', 'price', 'pvp'],
  stock: ['stock', 'cantidad', 'qty', 'quantity', 'existencia'],
  min_stock: ['min_stock', 'stock_minimo', 'minimo', 'min'],
};

export function ProductImportDialog({ open, onOpenChange, onImportComplete }: ProductImportDialogProps) {
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
    const description = columnMap.description ? String(row[columnMap.description] || '').trim() : '';
    const purchasePrice = parseFloat(String(row[columnMap.purchase_price || ''] || '0'));
    const salePrice = parseFloat(String(row[columnMap.sale_price || ''] || '0'));
    const stock = parseInt(String(row[columnMap.stock || ''] || '0'), 10);
    const minStock = columnMap.min_stock ? parseInt(String(row[columnMap.min_stock] || '5'), 10) : 5;

    if (!code) errors.push('Código requerido');
    if (!name) errors.push('Nombre requerido');
    if (isNaN(purchasePrice) || purchasePrice < 0) errors.push('Precio compra inválido');
    if (isNaN(salePrice) || salePrice < 0) errors.push('Precio venta inválido');
    if (isNaN(stock) || stock < 0) errors.push('Stock inválido');

    return {
      code,
      name,
      description: description || undefined,
      purchase_price: isNaN(purchasePrice) ? 0 : purchasePrice,
      sale_price: isNaN(salePrice) ? 0 : salePrice,
      stock: isNaN(stock) ? 0 : stock,
      min_stock: isNaN(minStock) ? 5 : minStock,
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
    if (droppedFile && (droppedFile.name.endsWith('.xlsx') || droppedFile.name.endsWith('.xls'))) {
      processFile(droppedFile);
    } else {
      toast.error('Por favor sube un archivo Excel (.xlsx o .xls)');
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
        code: 'PROD001',
        name: 'Producto de ejemplo',
        description: 'Descripción del producto',
        purchase_price: 1000,
        sale_price: 1500,
        stock: 10,
        min_stock: 5,
      },
    ];

    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Productos');
    XLSX.writeFile(wb, 'plantilla_productos.xlsx');
  };

  const handleImport = async () => {
    const validRows = rows.filter(r => r.isValid);
    if (validRows.length === 0) {
      toast.error('No hay productos válidos para importar');
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
        const { error } = await supabase.from('products').insert({
          code: row.code,
          name: row.name,
          description: row.description || null,
          purchase_price: row.purchase_price,
          sale_price: row.sale_price,
          stock: row.stock,
          min_stock: row.min_stock,
          business: selectedBusiness,
        });

        if (error) {
          console.error('Error inserting product:', error);
          failCount++;
        } else {
          successCount++;
        }
      } catch (error) {
        console.error('Error inserting product:', error);
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
            Importar Productos desde Excel
          </DialogTitle>
          <DialogDescription>
            {step === 'upload' && 'Sube un archivo Excel con los productos a importar'}
            {step === 'preview' && 'Revisa los productos antes de importar'}
            {step === 'importing' && 'Importando productos...'}
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
                Arrastra y suelta tu archivo Excel aquí
              </p>
              <p className="text-sm text-muted-foreground mb-4">
                o haz clic para seleccionar
              </p>
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileChange}
                className="hidden"
                id="file-upload"
              />
              <label htmlFor="file-upload">
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
                <li><code>code</code> - Código del producto</li>
                <li><code>name</code> - Nombre del producto</li>
                <li><code>purchase_price</code> - Precio de compra</li>
                <li><code>sale_price</code> - Precio de venta</li>
                <li><code>stock</code> - Cantidad en stock</li>
              </ul>
              <p className="font-medium mt-3 mb-2">Columnas opcionales:</p>
              <ul className="list-disc list-inside space-y-1">
                <li><code>description</code> - Descripción del producto</li>
                <li><code>min_stock</code> - Stock mínimo (default: 5)</li>
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
                    <TableHead className="text-right">P. Compra</TableHead>
                    <TableHead className="text-right">P. Venta</TableHead>
                    <TableHead className="text-center">Stock</TableHead>
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
                      <TableCell className="text-right">${row.purchase_price.toLocaleString()}</TableCell>
                      <TableCell className="text-right">${row.sale_price.toLocaleString()}</TableCell>
                      <TableCell className="text-center">{row.stock}</TableCell>
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
              <p className="text-lg font-medium mb-2">Importando productos...</p>
              <p className="text-sm text-muted-foreground">
                Por favor espera mientras se procesan los productos
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
                {importResults.success} productos importados correctamente
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
                Importar {validCount} productos
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
