/**
 * Excel Processor - Handles bulk processing of Excel files with specific business logic
 */

import { createWorkbook, readExcelWorkbook, downloadFile } from './excel';
import { condicionIva } from './index';

// Types for the processor
export interface ProcessingResult {
  success: boolean;
  fileName: string;
  message: string;
  errors?: string[];
  processedData?: {
    distribuidor?: ProcessedDistribuidor[];
    listaPrecios?: ProcessedListaPrecios[];
    listaPreciosTradicional?: ProcessedListaPreciosTradicional[];
    clientes?: ProcessedClientes[];
  };
}

export interface ProcessedDistribuidor {
  Codigo: string | number;
  Nombre: string;
  CUIT: string;
  Telefono: string;
  Email: string; // This will be converted to uppercase
  'Condicion Iva': string | number; // Mapped to numeric key from condicionIva
  'Persona Contacto': string;
}

export interface ProcessedListaPrecios {
  Codigo: string;
  Nombre: string;
}

export interface ProcessedListaPreciosTradicional {
  'Codigo de Lista': string;
  'Código Producto Bimbo': string | number;
  'Nombre del Producto': string;
  Marca: string;
  'Categoria del producto': string;
  'Precio Sin IVA': number;
  '% IVA': number;
  'Precio con IVA': number;
}

export interface ProcessedClientes {
  Codigo: string | number;
  Nombre: string; // Concatenated nombre + direccion
  Direccion: string;
  Telefono: string;
  Email: string;
  CUIT: string;
  'Condicion Iva': string | number; // Mapped to numeric key from condicionIva
  'Persona Contacto': string;
  'Codigo Lista precios': string; // From Lista de precios sheet
  'Visita Lunes': string;
  'Visita Martes': string;
  'Visita Miercoles': string;
  'Visita Jueves': string;
  'Visita Viernes': string;
  'Visita Sábado': string;
  'Visita Domingo': string;
}

/**
 * Main function to process multiple Excel files
 */
export async function processExcelFiles(files: File[]): Promise<ProcessingResult[]> {
  const results: ProcessingResult[] = [];
  
  for (const file of files) {
    try {
      const result = await processExcelFile(file);
      results.push(result);
    } catch (error) {
      results.push({
        success: false,
        fileName: file.name,
        message: `Error processing file: ${error instanceof Error ? error.message : 'Unknown error'}`,
        errors: [error instanceof Error ? error.message : 'Unknown error']
      });
    }
  }
  
  return results;
}

/**
 * Process a single Excel file
 */
export async function processExcelFile(file: File): Promise<ProcessingResult> {
  if (!file.name.match(/\.(xlsx?|xls)$/i)) {
    return {
      success: false,
      fileName: file.name,
      message: 'File must be .xlsx or .xls format',
      errors: ['Invalid file format']
    };
  }

  try {
    // Read the Excel file as arrays to handle multiple worksheets
    const workbookData = await readExcelWorkbook(file);
    
    // Validate required worksheets
    const validationErrors = validateWorksheets(workbookData);
    if (validationErrors.length > 0) {
      return {
        success: false,
        fileName: file.name,
        message: 'Missing required worksheets',
        errors: validationErrors
      };
    }

    // Process each worksheet
    const processedData = await processWorksheets(workbookData);
    
    // Generate output file
    await generateOutputFile(file.name, processedData);

    return {
      success: true,
      fileName: file.name,
      message: 'Archivo procesado con éxito',
      processedData
    };
  } catch (error) {
    return {
      success: false,
      fileName: file.name,
      message: `Fallo el procesamiento: ${error instanceof Error ? error.message : 'Error desconocido'}`,
      errors: [error instanceof Error ? error.message : 'Error desconocido']
    };
  }
}

/**
 * Validate that all required worksheets exist
 */
function validateWorksheets(workbookData: Record<string, (string | number)[][]>): string[] {
  const requiredSheets = [
    'DISTRIBUIDOR',
    'LISTA DE PRECIOS', 
    'LISTA DE PRECIOS TRADICIONAL',
    'CLIENTES'
  ];
  
  const errors: string[] = [];
  const availableSheets = Object.keys(workbookData).map(s => s.toLowerCase());
  
  for (const sheet of requiredSheets) {
    if (!availableSheets.includes(sheet.toLowerCase())) {
      errors.push(`Falta la hoja: ${sheet}`);
    }
  }
  
  return errors;
}

/**
 * Process all worksheets according to business rules
 */
async function processWorksheets(workbookData: Record<string, (string | number)[][]>): Promise<{
  distribuidor: ProcessedDistribuidor[];
  listaPrecios: ProcessedListaPrecios[];
  listaPreciosTradicional: ProcessedListaPreciosTradicional[];
  clientes: ProcessedClientes[];
}> {
  // Get worksheet data
  const distribuidorData = findWorksheetData(workbookData, 'DISTRIBUIDOR');
  const listaPreciosData = findWorksheetData(workbookData, 'LISTA DE PRECIOS');
  const listaPreciosTradicionalData = findWorksheetData(workbookData, 'LISTA DE PRECIOS TRADICIONAL');
  const clientesData = findWorksheetData(workbookData, 'CLIENTES');

  // Process each worksheet
  const distribuidor = processDistribuidorWorksheet(distribuidorData);
  const listaPrecios = processListaPreciosWorksheet(listaPreciosData);
  const listaPreciosTradicional = processListaPreciosTradicionalWorksheet(listaPreciosTradicionalData);
  const clientes = processClientesWorksheet(clientesData, listaPrecios);

  return {
    distribuidor,
    listaPrecios,
    listaPreciosTradicional,
    clientes
  };
}

/**
 * Find worksheet data by name (case insensitive)
 */
function findWorksheetData(workbookData: Record<string, (string | number)[][]>, sheetName: string): (string | number)[][] {
  const key = Object.keys(workbookData).find(k => k.toLowerCase() === sheetName.toLowerCase());
  return key ? workbookData[key] : [];
}

/**
 * Process distribuidor worksheet - Rule 1: Convert email to uppercase
 * Also handles CUIT validation - transfers non-numeric CUIT values to nombre column
 */
function processDistribuidorWorksheet(data: (string | number)[][]): ProcessedDistribuidor[] {
  if (data.length <= 1) return [];
  
  const headers = data[0].map(h => String(h));
  const emailIndex = headers.findIndex(h => h.toLowerCase().includes('email'));
  const condicionIvaIndex = headers.findIndex(h => h.toLowerCase().includes('condicion') && h.toLowerCase().includes('iva'));
  const cuitIndex = headers.findIndex(h => h.toLowerCase().includes('cuit'));
  const nombreIndex = headers.findIndex(h => h.toLowerCase().includes('nombre'));
  
  return data.slice(1).map(row => {
    const result: any = {};
    let transferredFromCuit = '';
    
    // First pass: Check CUIT column for non-numeric values
    if (cuitIndex >= 0) {
      const cuitValue = row[cuitIndex];
      if (cuitValue && typeof cuitValue === 'string') {
        // Check if CUIT contains any numbers
        const hasNumbers = /\d/.test(cuitValue);
        if (!hasNumbers) {
          // Transfer to nombre and clear CUIT
          transferredFromCuit = cuitValue.trim();
        }
      }
    }
    
    headers.forEach((header, index) => {
      let value = row[index] ?? 'SN';
      
      // Rule 1: Convert email to uppercase
      if (index === emailIndex && typeof value === 'string') {
        value = value.toUpperCase();
      }
      
      // Map Condicion IVA text to numeric key
      if (index === condicionIvaIndex) {
        value = mapCondicionIvaToKey(value);
      }
      
      // CUIT validation: clear if non-numeric
      if (index === cuitIndex && transferredFromCuit) {
        value = 'SN'; // Clear the CUIT column
      }
      
      // Transfer non-numeric CUIT to nombre column
      if (index === nombreIndex && transferredFromCuit) {
        const currentNombre = String(value || '').trim();
        if (currentNombre && currentNombre !== 'SN') {
          value = `${currentNombre} - ${transferredFromCuit}`;
        } else {
          value = transferredFromCuit;
        }
      }
      
      result[header] = value;
    });
    return result;
  });
}

/**
 * Process lista de precios worksheet
 */
function processListaPreciosWorksheet(data: (string | number)[][]): ProcessedListaPrecios[] {
  if (data.length <= 1) return [];
  
  const headers = data[0].map(h => String(h));
  
  return data.slice(1).map(row => {
    const result: any = {};
    headers.forEach((header, index) => {
      result[header] = row[index] ?? 'SN';
    });
    return result;
  });
}

/**
 * Process lista de precios tradicional worksheet
 * Rules 2-4: Handle marks, categories, and price validation
 */
function processListaPreciosTradicionalWorksheet(data: (string | number)[][]): ProcessedListaPreciosTradicional[] {
  if (data.length <= 1) return [];
  
  const headers = data[0].map(h => String(h));
  const _codigoProductoIndex = headers.findIndex(h => h.toLowerCase().includes('código producto') || h.toLowerCase().includes('codigo producto'));
  const _marcaIndex = headers.findIndex(h => h.toLowerCase().includes('marca'));
  const _categoriaIndex = headers.findIndex(h => h.toLowerCase().includes('categoria'));
  const precioSinIvaIndex = headers.findIndex(h => h.toLowerCase().includes('precio sin iva'));
  const ivaIndex = headers.findIndex(h => h.toLowerCase().includes('% iva') || h.toLowerCase().includes('iva'));
  const precioConIvaIndex = headers.findIndex(h => h.toLowerCase().includes('precio con iva'));
  
  return data.slice(1).map(row => {
    const result: any = {};
    
    headers.forEach((header, index) => {
      let value = row[index] ?? 'SN';
      
      // Handle numeric conversions for prices and IVA
      if (index === precioSinIvaIndex || index === precioConIvaIndex || index === ivaIndex) {
        value = parseNumericValue(value);
      }
      
      result[header] = value;
    });
    
    // Rule 3: Validate prices with/without IVA
    const precioSinIva = result[headers[precioSinIvaIndex]];
    const precioConIva = result[headers[precioConIvaIndex]];
    const iva = result[headers[ivaIndex]] || 21; // Default to 21%
    
    // If we only have price with IVA, calculate price without IVA
    if (precioConIva && (!precioSinIva || precioSinIva === 'SN')) {
      const calculatedPrice = precioConIva / (1 + iva / 100);
      result[headers[precioSinIvaIndex]] = Math.round(calculatedPrice * 100) / 100;
    }
    
    // If we only have price without IVA, calculate price with IVA
    if (precioSinIva && (!precioConIva || precioConIva === 'SN')) {
      const calculatedPrice = precioSinIva * (1 + iva / 100);
      result[headers[precioConIvaIndex]] = Math.round(calculatedPrice * 100) / 100;
    }
    
    return result;
  });
}

/**
 * Process clientes worksheet
 * Rules 5-9: Handle auto-incremental Codigo, name concatenation, and price list codes
 */
function processClientesWorksheet(data: (string | number)[][], listaPrecios: ProcessedListaPrecios[]): ProcessedClientes[] {
  if (data.length <= 1) return [];
  
  const headers = data[0].map(h => String(h));
  const nombreIndex = headers.findIndex(h => h.toLowerCase().includes('nombre'));
  const direccionIndex = headers.findIndex(h => h.toLowerCase().includes('direccion'));
  const codigoListaPreciosIndex = headers.findIndex(h => h.toLowerCase().includes('codigo lista precios'));
  const condicionIvaIndex = headers.findIndex(h => h.toLowerCase().includes('condicion') && h.toLowerCase().includes('iva'));
  
  // Rule 8: Validate that "Codigo Lista precios" column exists
  if (codigoListaPreciosIndex === -1) {
    throw new Error('Columna "Codigo Lista precios" no encontrada en la hoja de Clientes');
  }
  
  // Get the price list code from Lista de precios worksheet
  const priceListCode = listaPrecios.length > 0 ? listaPrecios[0].Codigo : 'SN';
  
  const codigoIndex = headers.findIndex(h => h.toLowerCase().includes('codigo') && !h.toLowerCase().includes('lista'));
  
  return data.slice(1).map((row, index) => {
    const result: any = {};
    
    // Rule 5: Make Codigo column auto-incremental starting from 1
    result.Codigo = index + 1;
    
    headers.forEach((header, colIndex) => {
      // Skip the original Codigo column since we're making it auto-incremental
      if (colIndex === codigoIndex) return;
      
      const originalValue = row[colIndex];
      let value = originalValue ?? 'SN';
      
      // Special handling for visita columns - keep empty if no data
      const isVisitaColumn = header.toLowerCase().includes('visita');
      if (isVisitaColumn && (originalValue === undefined || originalValue === null || originalValue === '')) {
        value = '';
      }
      
      // Rule 6: Concatenate nombre and direccion
      if (colIndex === nombreIndex && direccionIndex >= 0) {
        const nombre = String(row[nombreIndex] ?? '');
        const direccion = String(row[direccionIndex] ?? '');
        value = `${nombre} - ${direccion}`.trim();
      }
      
      // Rule 9: Set price list code from Lista de precios
      if (colIndex === codigoListaPreciosIndex) {
        value = priceListCode;
      }
      
      // Map Condicion IVA text to numeric key
      if (colIndex === condicionIvaIndex) {
        value = mapCondicionIvaToKey(value);
      }
      
      result[header] = value;
    });
    
    return result;
  });
}

/**
 * Parse numeric values, handling comma decimals and various formats
 * Rounds to 2 decimal places and limits precision
 */
function parseNumericValue(value: string | number): number {
  if (typeof value === 'number') {
    return Math.round(value * 100) / 100; // Round to 2 decimal places
  }
  if (typeof value !== 'string') return 0;
  
  // Remove quotes and spaces
  let cleanValue = value.replace(/["'\s]/g, '');
  
  // Handle comma as decimal separator
  cleanValue = cleanValue.replace(',', '.');
  
  const parsed = parseFloat(cleanValue);
  if (isNaN(parsed)) return 0;
  
  // Round to 2 decimal places
  return Math.round(parsed * 100) / 100;
}

/**
 * Map Condicion IVA text values to their corresponding numeric keys
 * Handles case-insensitive matching using the condicionIva mapper
 */
function mapCondicionIvaToKey(condicionText: string | number): number | string {
  if (typeof condicionText === 'number') return condicionText;
  
  const text = String(condicionText).trim();
  if (!text || text === 'SN') return text;
  
  // Try exact match first (case-insensitive)
  const lowerText = text.toLowerCase();
  for (const [key, value] of Object.entries(condicionIva)) {
    if (key.toLowerCase() === lowerText) {
      return value;
    }
  }
  
  // Try partial matches for common variations
  for (const [key, value] of Object.entries(condicionIva)) {
    const keyLower = key.toLowerCase();
    if (lowerText.includes(keyLower) || keyLower.includes(lowerText)) {
      return value;
    }
    
    // Also try matching first word for variations like "resp. inscripto" vs "responsable inscripto"
    const firstWord = keyLower.split(' ')[0];
    if (lowerText.includes(firstWord) || firstWord.includes(lowerText)) {
      return value;
    }
  }
  
  // If no match found, return original value
  return text;
}

/**
 * Generate output Excel file with processed data
 */
async function generateOutputFile(
  originalFileName: string, 
  processedData: {
    distribuidor: ProcessedDistribuidor[];
    listaPrecios: ProcessedListaPrecios[];
    listaPreciosTradicional: ProcessedListaPreciosTradicional[];
    clientes: ProcessedClientes[];
  }
): Promise<void> {
  const workbook = await createWorkbook();
  
  // Create worksheets for each processed data type
  const distribuidorSheet = workbook.addWorksheet('DISTRIBUIDOR');
  const listaPreciosSheet = workbook.addWorksheet('LISTA DE PRECIOS');
  const listaPreciosTradicionalSheet = workbook.addWorksheet('LISTA DE PRECIOS TRADICIONAL');
  const clientesSheet = workbook.addWorksheet('CLIENTES');

  // Add distribuidor data
  if (processedData.distribuidor.length > 0) {
    const distribuidorHeaders = Object.keys(processedData.distribuidor[0]);
    
    // Set column widths to header length + 15
    distribuidorSheet.columns = distribuidorHeaders.map(header => ({
      header,
      key: header,
      width: header.length + 15
    }));
    
    processedData.distribuidor.forEach(item => {
      distribuidorSheet.addRow(distribuidorHeaders.map(header => (item as any)[header]));
    });
  }
  
  // Add lista de precios data
  if (processedData.listaPrecios.length > 0) {
    const listaPreciosHeaders = Object.keys(processedData.listaPrecios[0]);
    
    // Set column widths to header length + 15
    listaPreciosSheet.columns = listaPreciosHeaders.map(header => ({
      header,
      key: header,
      width: header.length + 15
    }));
    
    processedData.listaPrecios.forEach(item => {
      listaPreciosSheet.addRow(listaPreciosHeaders.map(header => (item as any)[header]));
    });
  }
  
  // Add lista de precios tradicional data
  if (processedData.listaPreciosTradicional.length > 0) {
    const listaPreciosTradicionalHeaders = Object.keys(processedData.listaPreciosTradicional[0]);
    
    // Set column widths to header length + 15
    listaPreciosTradicionalSheet.columns = listaPreciosTradicionalHeaders.map(header => ({
      header,
      key: header,
      width: header.length + 15
    }));
    
    processedData.listaPreciosTradicional.forEach(item => {
      listaPreciosTradicionalSheet.addRow(listaPreciosTradicionalHeaders.map(header => (item as any)[header]));
    });
  }
  
  // Add clientes data
  if (processedData.clientes.length > 0) {
    const clientesHeaders = Object.keys(processedData.clientes[0]);
    
    // Set column widths to header length + 15
    clientesSheet.columns = clientesHeaders.map(header => ({
      header,
      key: header,
      width: header.length + 15
    }));
    
    processedData.clientes.forEach(item => {
      clientesSheet.addRow(clientesHeaders.map(header => (item as any)[header]));
    });
  }
  
  // Generate output filename
  const outputFileName = `procesado_${originalFileName.replace(/\.(xlsx?|xls)$/i, '.xlsx')}`;
  
  // Download the processed file
  const buffer = await workbook.xlsx.writeBuffer();
  downloadFile(buffer, outputFileName);
}

/**
 * Utility function to format processing results for display
 */
export function formatProcessingResults(results: ProcessingResult[]): string {
  const successCount = results.filter(r => r.success).length;
  const totalCount = results.length;

  let summary = `Se procesaron ${successCount}/${totalCount} archivos con éxito.\n\n`;

  results.forEach(result => {
    summary += `📁 ${result.fileName}:\n`;
    summary += `   ${result.success ? '✅' : '❌'} ${result.message}\n`;
    
    if (result.errors && result.errors.length > 0) {
      summary += `   Errores: ${result.errors.join(', ')}\n`;
    }
    
    if (result.processedData) {
      const { distribuidor, listaPrecios, listaPreciosTradicional, clientes } = result.processedData;
      summary += `   Procesados: ${distribuidor?.length || 0} distribuidores, ${listaPrecios?.length || 0} listas de precios, ${listaPreciosTradicional?.length || 0} precios tradicionales, ${clientes?.length || 0} clientes\n`;
    }
    
    summary += '\n';
  });
  
  return summary;
}