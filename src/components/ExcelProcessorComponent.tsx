import React, { useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { 
  Upload, 
  FileSpreadsheet, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Loader2,
  Trash2
} from 'lucide-react';
import { useExcelProcessor } from '@/lib/hooks/process-rutas-hooks';
import { cn } from '@/lib/utils';

export function ExcelProcessorComponent() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const {
    isProcessing,
    results,
    resultsSummary,
    error,
    processFiles,
    clearResults,
    clearError,
  } = useExcelProcessor();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      const fileArray = Array.from(files);
      void processFiles(fileArray);
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    
    const files = event.dataTransfer.files;
    if (files && files.length > 0) {
      const fileArray = Array.from(files).filter(file => 
        file.name.match(/\.(xlsx?|xls)$/i)
      );
      
      if (fileArray.length === 0) {
        alert('Please select only Excel files (.xlsx or .xls)');
        return;
      }
      
      void processFiles(fileArray);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleClearResults = () => {
    clearResults();
    clearError();
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const successCount = results.filter(r => r.success).length;
  const errorCount = results.filter(r => !r.success).length;
  const totalCount = results.length;
  const progressPercentage = isProcessing ? 50 : (totalCount > 0 ? 100 : 0);

  return (
    <div className="w-full max-w-4xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-6 w-6" />
            Procesador de Excel
          </CardTitle>
          <CardDescription>
            Sube archivos de Excel (.xlsx o .xls) para procesarlos de acuerdo con la lógica de negocio.
            Admite el procesamiento por lotes de varios archivos con distribuidor, lista de precios,
            lista de precios tradicional y hojas de trabajo de clientes.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* File Upload Section */}
          <div
            className={cn(
              "border-2 border-dashed rounded-lg p-8 text-center transition-colors",
              "hover:border-primary/50 hover:bg-primary/5",
              isProcessing && "pointer-events-none opacity-50"
            )}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".xlsx,.xls"
              onChange={handleFileSelect}
              className="hidden"
              disabled={isProcessing}
            />
            
            {isProcessing ? (
              <div className="space-y-4">
                <Loader2 className="h-12 w-12 mx-auto text-primary animate-spin" />
                <div className="space-y-2">
                  <p className="text-lg font-medium">Procesando archivos...</p>
                  <Progress value={progressPercentage} className="w-full max-w-md mx-auto" />
                  <p className="text-sm text-muted-foreground">
                    Por favor espera mientras procesamos tus archivos de Excel
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <Upload className="h-12 w-12 mx-auto text-muted-foreground" />
                <div className="space-y-2">
                  <p className="text-lg font-medium">
                    Suelta los archivos de Excel aquí o haz clic para subir
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Admite archivos .xlsx y .xls. Puedes seleccionar varios archivos para el procesamiento por lotes.
                  </p>
                </div>
                <Button 
                  onClick={handleUploadClick}
                  disabled={isProcessing}
                  className="mt-4"
                >
                  Seleccionar archivos
                </Button>
              </div>
            )}
          </div>

          {/* Error Display */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Results Summary */}
          {totalCount > 0 && !isProcessing && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Resultados del procesamiento</h3>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleClearResults}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Limpiar resultados
                </Button>
              </div>

              {/* Summary Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      <div>
                        <p className="text-2xl font-bold text-green-600">{successCount}</p>
                        <p className="text-sm text-muted-foreground">Exitoso</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-2">
                      <XCircle className="h-5 w-5 text-red-500" />
                      <div>
                        <p className="text-2xl font-bold text-red-600">{errorCount}</p>
                        <p className="text-sm text-muted-foreground">Fallido</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-2">
                      <FileSpreadsheet className="h-5 w-5 text-blue-500" />
                      <div>
                        <p className="text-2xl font-bold text-blue-600">{totalCount}</p>
                        <p className="text-sm text-muted-foreground">Total de archivos</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Separator />

              {/* Detailed Results */}
              <div className="space-y-4">
                <h4 className="font-medium">Detalles del procesamiento de archivos</h4>
                <ScrollArea className="h-64 w-full border rounded-md p-4">
                  <div className="space-y-3">
                    {results.map((result, index) => (
                      <div key={index} className="flex items-start space-x-3 p-3 border rounded-lg">
                        <div className="flex-shrink-0 mt-0.5">
                          {result.success ? (
                            <CheckCircle className="h-5 w-5 text-green-500" />
                          ) : (
                            <XCircle className="h-5 w-5 text-red-500" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="font-medium truncate">{result.fileName}</p>
                            <Badge variant={result.success ? "default" : "destructive"}>
                              {result.success ? "Exitoso" : "Fallido"}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            {result.message}
                          </p>
                          {result.errors && result.errors.length > 0 && (
                            <div className="mt-2">
                              <p className="text-xs font-medium text-red-600">Errores:</p>
                              <ul className="text-xs text-red-600 list-disc list-inside mt-1">
                                {result.errors.map((error, errorIndex) => (
                                  <li key={errorIndex}>{error}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {result.processedData && (
                            <div className="mt-2 text-xs text-muted-foreground">
                              <p>
                                Se procesaron: {result.processedData.distribuidor?.length || 0} distribuidores, {' '}
                                {result.processedData.listaPrecios?.length || 0} listas de precios, {' '}
                                {result.processedData.listaPreciosTradicional?.length || 0} precios tradicionales, {' '}
                                {result.processedData.clientes?.length || 0} clientes
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>

              {/* Results Summary Text */}
              {resultsSummary && (
                <div className="space-y-2">
                  <h4 className="font-medium">Resumen del procesamiento</h4>
                  <div className="bg-muted/50 p-4 rounded-lg">
                    <pre className="text-sm whitespace-pre-wrap font-mono">
                      {resultsSummary}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Processing Rules Info */}
          {!isProcessing && totalCount === 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Reglas de procesamiento</CardTitle>
                <CardDescription>
                  El procesador aplica las siguientes reglas comerciales a tus archivos de Excel:
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Hoja Distribuidor</h4>
                    <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                      <li>Convertir direcciones de correo electrónico a mayúsculas</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-2">Hoja de Lista de Precios Tradicional</h4>
                    <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                      <li>Extraer marcas y categorías por código de producto</li>
                      <li>Validar precios con/sin IVA (21% de tasa impositiva)</li>
                      <li>Convertir todos los valores de precios a números</li>
                      <li>Calcular valores de precios faltantes (con/sin IVA)</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-2">Hoja de Clientes</h4>
                    <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                      <li>Agregar IDs auto-incrementales comenzando desde 1</li>
                      <li>Concatenar campos de nombre y dirección</li>
                      <li>Establecer códigos de lista de precios desde la hoja de Lista de Precios</li>
                      <li>Validar que existan las columnas requeridas</li>
                      <li>Rellenar valores faltantes con "SN" donde sea apropiado</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  );
}