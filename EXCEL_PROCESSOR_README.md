# Excel Processor Documentation

## Overview

The Excel Processor is a comprehensive solution for processing Excel files with specific business logic for distribuidor, lista de precios, lista de precios tradicional, and clientes worksheets. It supports bulk file processing and applies various transformations according to predefined business rules.

## Features

- 📄 **Bulk Processing**: Process multiple Excel files simultaneously
- 🔄 **Business Rules**: Automatic application of specific transformation rules
- 📊 **Multiple Worksheets**: Handles 4 different worksheet types with specific logic
- ✅ **Validation**: Comprehensive validation of required columns and data
- 📥 **Download**: Automatic generation and download of processed files
- 🎯 **User Interface**: React component with drag-and-drop functionality

## Supported File Formats

- `.xlsx` (Excel 2007+)
- `.xls` (Excel 97-2003)

## Required Worksheets

Each Excel file must contain the following 4 worksheets:

1. **distribuidor** - Distributor information
2. **lista de precios** - Price list master data
3. **lista de precios tradicional** - Traditional price list with products
4. **clientes** - Client information

## Processing Rules

### 1. Distribuidor Worksheet

**Rule**: Convert email addresses to uppercase

```typescript
// Input:  ceciliabimbo2021@gmail.com
// Output: CECILIABIMBO2021@GMAIL.COM
```

**Columns Expected**:
- Codigo, Nombre, CUIT, Telefono, Email, Condicion Iva, Persona Contacto

### 2. Lista de Precios Worksheet

**Rule**: Pass through data (used as reference for other worksheets)

**Columns Expected**:
- Codigo, Nombre

### 3. Lista de Precios Tradicional Worksheet

**Rules**:
- Extract brands and categories by product code
- Validate prices with/without IVA (21% tax rate)
- Convert all price values to numbers
- Calculate missing price values

```typescript
// IVA Calculation Examples:
// If only "Precio con IVA" exists: Precio Sin IVA = Precio con IVA / 1.21
// If only "Precio Sin IVA" exists: Precio con IVA = Precio Sin IVA * 1.21
```

**Columns Expected**:
- Codigo de Lista, Código Producto Bimbo, Nombre del Producto, Marca, Categoria del producto, Precio Sin IVA, % IVA, Precio con IVA

### 4. Clientes Worksheet

**Rules**:
- Add auto-incremental IDs starting from 1
- Concatenate "nombre" and "direccion" fields
- Set price list codes from Lista de Precios worksheet
- Validate that "Codigo Lista precios" column exists
- Fill missing values with "SN"

```typescript
// Name Concatenation Example:
// Input:  Nombre: "Super Ebe", Direccion: "Caferata 776 Ricardone"
// Output: Nombre: "Super Ebe - Caferata 776 Ricardone"
```

**Columns Expected**:
- Codigo, Nombre, Direccion, Telefono, Email, CUIT, Condicion Iva, Persona Contacto, Codigo Lista precios, Visita Lunes, Visita Martes, Visita Miercoles, Visita Jueves, Visita Viernes, Visita Sábado, Visita Domingo

## Usage

### React Component

```tsx
import { ExcelProcessorComponent } from '@/components/ExcelProcessorComponent';

function MyApp() {
  return (
    <div>
      <ExcelProcessorComponent />
    </div>
  );
}
```

### Programmatic Usage

```typescript
import { processExcelFiles } from '@/lib/utils/excel-processor';

async function handleFiles(files: File[]) {
  try {
    const results = await processExcelFiles(files);
    
    results.forEach(result => {
      if (result.success) {
        console.log(`✅ ${result.fileName}: ${result.message}`);
        console.log('Processed data:', result.processedData);
      } else {
        console.error(`❌ ${result.fileName}: ${result.message}`);
        console.error('Errors:', result.errors);
      }
    });
  } catch (error) {
    console.error('Processing failed:', error);
  }
}
```

### Custom Hook

```typescript
import { useExcelProcessor } from '@/lib/hooks/process-rutas-hooks';

function MyComponent() {
  const {
    isProcessing,
    results,
    resultsSummary,
    error,
    processFiles,
    clearResults,
    clearError,
  } = useExcelProcessor();

  const handleFileUpload = async (files: File[]) => {
    await processFiles(files);
  };

  return (
    <div>
      {isProcessing && <div>Processing...</div>}
      {error && <div>Error: {error}</div>}
      {resultsSummary && <pre>{resultsSummary}</pre>}
    </div>
  );
}
```

## API Reference

### Types

```typescript
interface ProcessingResult {
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

interface ProcessedClientes {
  ID: number; // Auto-incremental starting from 1
  Codigo: string | number;
  Nombre: string; // Concatenated nombre + direccion
  Direccion: string;
  // ... other fields
  'Codigo Lista precios': string; // From Lista de precios sheet
}
```

### Functions

#### `processExcelFiles(files: File[]): Promise<ProcessingResult[]>`

Process multiple Excel files with business rules.

**Parameters**:
- `files`: Array of Excel files to process

**Returns**: Promise resolving to array of processing results

#### `processExcelFile(file: File): Promise<ProcessingResult>`

Process a single Excel file.

**Parameters**:
- `file`: Excel file to process

**Returns**: Promise resolving to processing result

#### `formatProcessingResults(results: ProcessingResult[]): string`

Format processing results for display.

**Parameters**:
- `results`: Array of processing results

**Returns**: Formatted string summary

## Error Handling

The processor handles various error scenarios:

### File Format Errors
- Invalid file extensions (only .xlsx/.xls allowed)
- Corrupted Excel files
- Empty or invalid workbooks

### Worksheet Validation Errors
- Missing required worksheets
- Empty worksheets
- Invalid worksheet structure

### Data Processing Errors
- Missing required columns
- Invalid data types
- Calculation errors (IVA processing)

### Example Error Handling

```typescript
const results = await processExcelFiles(files);

results.forEach(result => {
  if (!result.success) {
    console.log('File:', result.fileName);
    console.log('Error:', result.message);
    
    if (result.errors) {
      result.errors.forEach(error => {
        console.log('- ', error);
      });
    }
  }
});
```

## Dependencies

- **exceljs**: For Excel file reading and writing
- **React**: For UI components
- **Radix UI**: For UI component library
- **Tailwind CSS**: For styling

## Installation

The processor is already integrated into the project. Make sure you have the required dependencies installed:

```bash
npm install exceljs
# or
yarn add exceljs
```

## File Structure

```
src/
├── components/
│   └── ExcelProcessorComponent.tsx     # Main React component
├── lib/
│   ├── hooks/
│   │   └── process-rutas-hooks.ts      # Custom React hook
│   └── utils/
│       ├── excel-processor.ts          # Core processing logic
│       ├── excel.ts                    # Excel utilities
│       └── excel-processor.test.ts     # Test utilities
└── pages/
    └── ExcelProcessorPage.tsx          # Demo page
```

## Testing

Run the test utilities to verify processor functionality:

```typescript
import { runTests } from '@/lib/utils/excel-processor.test';

runTests(); // Returns true if all tests pass
```

## Performance Considerations

- **Large Files**: The processor handles large Excel files efficiently using streaming
- **Multiple Files**: Processes files sequentially to avoid memory issues
- **Memory Usage**: Uses ArrayBuffers for optimal memory management
- **Download Optimization**: Generates files as blobs for efficient downloading

## Browser Compatibility

- Modern browsers with ArrayBuffer support
- File API support required for drag-and-drop functionality
- Blob API support required for file downloads

## Troubleshooting

### Common Issues

1. **Files not processing**: Check file format (.xlsx/.xls only)
2. **Missing worksheets error**: Ensure all 4 required worksheets exist
3. **Column validation errors**: Verify column names match expected format
4. **Price calculations incorrect**: Check IVA percentage and numeric formatting

### Debug Mode

Enable debugging by checking browser console for detailed error messages during processing.

---

For additional support or feature requests, please refer to the project documentation or contact the development team.