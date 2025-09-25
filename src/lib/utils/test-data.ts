/**
 * Test data and utilities for Excel processor
 */
import { processExcelFile, ProcessingResult } from './excel-processor';

// Sample test data that simulates Excel worksheets with missing columns
export const createTestExcelData = () => {
  // Create a simple mock File object for testing
  const createMockFile = (name: string, worksheets: Record<string, (string | number)[][]>) => {
    // This is a simplified mock - in real usage, you'd use actual Excel files
    const file = new File([''], name, { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    
    // Add the worksheet data as a property for testing
    (file as any).worksheetData = worksheets;
    
    return file;
  };

  // Test case 1: DISTRIBUIDOR sheet missing CUIT column
  const distributedorTestData = {
    'DISTRIBUIDOR': [
      ['Codigo', 'Nombre', 'Telefono', 'Email', 'Condicion Iva', 'Persona Contacto'], // Missing CUIT
      [1, 'Empresa ABC', '1234567890', 'test@example.com', 'Responsable Inscripto', 'Juan Perez'],
      [2, 'Empresa XYZ', '0987654321', 'info@xyz.com', 'Monotributista', 'Maria Lopez']
    ],
    'LISTA DE PRECIOS': [
      ['Codigo', 'Nombre'],
      ['LP001', 'Lista Principal']
    ],
    'LISTA DE PRECIOS TRADICIONAL': [
      ['Codigo de Lista', 'Código Producto Bimbo', 'Nombre del Producto', 'Marca', 'Categoria del producto', 'Precio Sin IVA', '% IVA', 'Precio con IVA'],
      ['LP001', 'PROD001', 'Producto 1', 'Marca A', 'Categoria 1', 100, 21, 121]
    ],
    'CLIENTES': [
      ['Codigo', 'Nombre', 'Direccion', 'Telefono', 'Email', 'CUIT', 'Condicion Iva', 'Persona Contacto', 'Visita Lunes', 'Visita Martes', 'Visita Miercoles', 'Visita Jueves', 'Visita Viernes', 'Visita Sábado', 'Visita Domingo'], // Missing Codigo Lista precios
      [1, 'Cliente 1', 'Direccion 1', '1111111111', 'cliente1@example.com', '20-12345678-9', 'Responsable Inscripto', 'Contacto 1', 'Si', 'No', 'Si', 'No', 'Si', 'No', 'No']
    ]
  };

  return createMockFile('test-missing-columns.xlsx', distributedorTestData);
};

// Expected results for the test
export const expectedColumnValidation = [
  {
    sheetName: 'DISTRIBUIDOR',
    missingColumns: ['CUIT'],
    addedColumns: ['CUIT'],
    existingColumns: ['Codigo', 'Nombre', 'Telefono', 'Email', 'Condicion Iva', 'Persona Contacto']
  },
  {
    sheetName: 'LISTA DE PRECIOS',
    missingColumns: [],
    addedColumns: [],
    existingColumns: ['Codigo', 'Nombre']
  },
  {
    sheetName: 'LISTA DE PRECIOS TRADICIONAL',
    missingColumns: [],
    addedColumns: [],
    existingColumns: [
      'Codigo de Lista',
      'Código Producto Bimbo',
      'Nombre del Producto',
      'Marca',
      'Categoria del producto',
      'Precio Sin IVA',
      '% IVA',
      'Precio con IVA'
    ]
  },
  {
    sheetName: 'CLIENTES',
    missingColumns: ['Codigo Lista precios'],
    addedColumns: ['Codigo Lista precios'],
    existingColumns: [
      'Codigo',
      'Nombre',
      'Direccion',
      'Telefono',
      'Email',
      'CUIT',
      'Condicion Iva',
      'Persona Contacto',
      'Visita Lunes',
      'Visita Martes',
      'Visita Miercoles',
      'Visita Jueves',
      'Visita Viernes',
      'Visita Sábado',
      'Visita Domingo'
    ]
  }
];

/**
 * Demo function to show column validation results
 */
export function logColumnValidationExample() {
  console.log('=== Column Validation Example ===');
  console.log('Expected validation results for a file with missing CUIT and Codigo Lista precios columns:');
  console.log(JSON.stringify(expectedColumnValidation, null, 2));
  
  console.log('\n=== Processing Rules Applied ===');
  console.log('1. DISTRIBUIDOR sheet: CUIT column will be inserted to the left of Nombre column');
  console.log('2. CLIENTES sheet: Codigo Lista precios column will be inserted before Visita Lunes');
  console.log('3. All other business rules (email uppercase, price calculations, etc.) will still apply');
  console.log('4. The processed file will include all required columns with proper positioning');
}