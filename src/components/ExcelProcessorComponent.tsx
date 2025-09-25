import React, { useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Upload, 
  FileSpreadsheet, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Loader2,
  Trash2,
  Copy,
  Download,
  FileImage,
  Plus,
  Minus
} from 'lucide-react';
import { useExcelProcessor } from '@/lib/hooks/process-rutas-hooks';
import { cn } from '@/lib/utils';
import { copyToClipboard as copyText, exportToPDF as exportElementToPDF, exportToPNG as exportElementToPNG, exportToPNGFallback, exportToPNGCanvas, debugElementStyles, showMessage } from '@/lib/utils/export-utils';

export function ExcelProcessorComponent() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const {
    isProcessing,
    results,
    resultsSummary,
    error,
    processFiles,
    clearResults,
    clearError,
  } = useExcelProcessor();

  // Export functions
  const handleCopyToClipboard = async () => {
    if (!resultsSummary) return;
    
    try {
      await copyText(resultsSummary);
      showMessage('Resultados copiados al portapapeles');
    } catch (err) {
      console.error('Error copying to clipboard:', err);
      showMessage('Error al copiar al portapapeles', 'error');
    }
  };

  const handleExportToPDF = async () => {
    if (!resultsRef.current) return;

    try {
      await exportElementToPDF(resultsRef.current, 'resultados-procesamiento.pdf');
      showMessage('PDF exportado correctamente');
    } catch (err) {
      console.error('Error exporting to PDF:', err);
      console.log('PDF export failed, trying to export as PNG instead...');
      
      try {
        await exportElementToPNG(resultsRef.current, 'resultados-procesamiento.png');
        showMessage('Se exportó como PNG en lugar de PDF');
      } catch (pngErr) {
        console.error('PNG fallback also failed:', pngErr);
        showMessage('Error al exportar - intente con el botón PNG', 'error');
      }
    }
  };

  const handleExportToPNG = async () => {
    if (!resultsRef.current) return;

    // Debug the element before export
    debugElementStyles(resultsRef.current);

    try {
      await exportElementToPNG(resultsRef.current, 'resultados-procesamiento.png');
      showMessage('Imagen exportada correctamente');
    } catch (err) {
      console.error('Error exporting to PNG:', err);
      console.log('Trying fallback export method...');
      
      try {
        await exportToPNGFallback(resultsRef.current, 'resultados-procesamiento.png');
        showMessage('Imagen exportada correctamente (método alternativo)');
      } catch (fallbackErr) {
        console.error('Fallback export also failed:', fallbackErr);
        console.log('Trying canvas-based export...');
        
        try {
          await exportToPNGCanvas(resultsRef.current, 'resultados-procesamiento.png');
          showMessage('Imagen exportada correctamente (método básico)');
        } catch (canvasErr) {
          console.error('All export methods failed:', canvasErr);
          showMessage('Error al exportar a PNG - se agotaron todos los métodos', 'error');
        }
      }
    }
  };

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
    <div className="w-full mx-auto lg:mx-0 p-6">
      {/* Header */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-start gap-2">
            <FileSpreadsheet className="h-6 w-6" />
            Procesador de Excel
          </CardTitle>
          <CardDescription>
            Sube archivos de Excel (.xlsx o .xls) para procesarlos de acuerdo con la lógica de negocio.
            Admite el procesamiento por lotes de varios archivos con distribuidor, lista de precios,
            lista de precios tradicional y hojas de trabajo de clientes.
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Main Content - Responsive Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column - File Upload and Errors */}
        <div className="space-y-6">
          <Card>
            <CardContent className="p-6">
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
            </CardContent>
          </Card>

          {/* Error Display */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>

        {/* Right Column - Results Summary and Rules */}
        <div className="space-y-6">
          {/* Results Summary */}
          {totalCount > 0 && !isProcessing && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    Resultados del procesamiento
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => void handleCopyToClipboard()}
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Copiar
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => void handleExportToPNG()}
                    >
                      <FileImage className="h-4 w-4 mr-2" />
                      PNG
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => void handleExportToPDF()}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      PDF
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={handleClearResults}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Limpiar
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div ref={resultsRef}>

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
                          {result.columnValidation && result.columnValidation.length > 0 && (
                            <div className="mt-2">
                              <p className="text-xs font-medium text-blue-600">Validación de columnas:</p>
                              <div className="mt-1 space-y-1">
                                {result.columnValidation.map((validation, validationIndex) => (
                                  <div key={validationIndex} className="text-xs">
                                    <p className="font-medium text-gray-700">{validation.sheetName}:</p>
                                    <div className="ml-2 space-y-0.5">
                                      <div className="flex items-center gap-1">
                                        <CheckCircle className="h-3 w-3 text-green-500" />
                                        <span className="text-green-600">
                                          Existentes: {validation.existingColumns.length}
                                        </span>
                                      </div>
                                      {validation.addedColumns.length > 0 && (
                                        <div className="flex items-center gap-1">
                                          <Plus className="h-3 w-3 text-blue-500" />
                                          <span className="text-blue-600">
                                            Agregadas: {validation.addedColumns.join(', ')}
                                          </span>
                                        </div>
                                      )}
                                      {validation.missingColumns.length > 0 && (
                                        <div className="flex items-center gap-1">
                                          <Minus className="h-3 w-3 text-red-500" />
                                          <span className="text-red-600">
                                            Faltantes: {validation.missingColumns.join(', ')}
                                          </span>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
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
              </CardContent>
            </Card>
          )}

          {/* Processing Rules Info - Always visible */}
          <Tabs defaultValue="rules" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="rules">Reglas de Procesamiento</TabsTrigger>
              <TabsTrigger value="info">Información Técnica</TabsTrigger>
            </TabsList>
            
            <TabsContent value="rules" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Reglas de Procesamiento</CardTitle>
                  <CardDescription>
                    El procesador aplica las siguientes reglas comerciales a tus archivos de Excel:
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-start gap-2">
                      <FileSpreadsheet className="h-4 w-4 text-blue-600 mt-0.5" />
                      <div>
                        <p className="font-medium text-sm">🔍 Validación de columnas</p>
                        <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside ml-4">
                          <li>Detecta automáticamente columnas faltantes en cada hoja</li>
                          <li>Inserta columna CUIT a la izquierda de Nombre en hoja Distribuidor</li>
                          <li>Inserta columna "Codigo Lista precios" antes de "Visita Lunes" en hoja Clientes</li>
                          <li>Preserva el orden y ubicación correcta de todas las demás columnas</li>
                        </ul>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-2">
                      <FileSpreadsheet className="h-4 w-4 text-green-600 mt-0.5" />
                      <div>
                        <p className="font-medium text-sm">Hoja Distribuidor</p>
                        <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside ml-4">
                          <li>Convertir direcciones de correo electrónico a mayúsculas</li>
                          <li>Transferir valores no numéricos de CUIT a la columna Nombre</li>
                          <li>Mapear condiciones de IVA a códigos numéricos</li>
                        </ul>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-2">
                      <FileSpreadsheet className="h-4 w-4 text-orange-600 mt-0.5" />
                      <div>
                        <p className="font-medium text-sm">Hoja Lista de Precios Tradicional</p>
                        <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside ml-4">
                          <li>Extraer marcas y categorías por código de producto</li>
                          <li>Validar precios con/sin IVA (21% de tasa impositiva)</li>
                          <li>Convertir todos los valores de precios a números</li>
                          <li>Calcular valores de precios faltantes (con/sin IVA)</li>
                        </ul>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-2">
                      <FileSpreadsheet className="h-4 w-4 text-purple-600 mt-0.5" />
                      <div>
                        <p className="font-medium text-sm">Hoja de Clientes</p>
                        <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside ml-4">
                          <li>Agregar IDs auto-incrementales comenzando desde 1</li>
                          <li>Concatenar campos de nombre y dirección</li>
                          <li>Establecer códigos de lista de precios desde la hoja de Lista de Precios</li>
                          <li>Validar que existan las columnas requeridas</li>
                          <li>Rellenar valores faltantes con "SN" donde sea apropiado</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="info" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Información Técnica</CardTitle>
                  <CardDescription>
                    Detalles técnicos sobre el procesamiento y exportación de archivos.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-start gap-2">
                      <FileSpreadsheet className="h-4 w-4 text-blue-600 mt-0.5" />
                      <div>
                        <p className="font-medium text-sm">Formatos Admitidos</p>
                        <p className="text-xs text-muted-foreground">
                          Excel (.xlsx, .xls) con soporte para múltiples hojas de trabajo.
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-2">
                      <Upload className="h-4 w-4 text-green-600 mt-0.5" />
                      <div>
                        <p className="font-medium text-sm">Procesamiento por Lotes</p>
                        <p className="text-xs text-muted-foreground">
                          Puedes subir múltiples archivos para procesarlos de una vez.
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-2">
                      <Download className="h-4 w-4 text-purple-600 mt-0.5" />
                      <div>
                        <p className="font-medium text-sm">📤 Exportación de resultados</p>
                        <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside ml-4">
                          <li>Copiar resultados de validación al portapapeles</li>
                          <li>Exportar reporte como imagen PNG</li>
                          <li>Exportar reporte como documento PDF</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}