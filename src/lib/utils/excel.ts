/**
 * Excel utilities for ProductosEnSucursales functionality
 */

interface ExcelJSWorkbook {
  addWorksheet(name: string): ExcelJSWorksheet;
  getWorksheet(index: number): ExcelJSWorksheet | undefined;
  eachSheet(callback: (worksheet: ExcelJSWorksheet, sheetId: number) => void): void;
  xlsx: {
    writeFile(filename: string): Promise<void>;
    writeBuffer(): Promise<ArrayBuffer>;
    load(buffer: ArrayBuffer): Promise<void>;
  };
}

interface ExcelJSWorksheet {
  addRow(values: unknown[]): void;
  columns: Array<{ header: string; key: string; width: number }>;
  getCell(row: number, col: number): ExcelJSCell;
  getRow(rowNumber: number): ExcelJSRow;
  eachRow(callback: (row: ExcelJSRow, rowNumber: number) => void): void;

  // Added spliceRows so you can call worksheet.spliceRows(1, 0, ...rows)
  spliceRows(start: number, deleteCount?: number, ...rows: unknown[][]): void;
}

interface ExcelJSRow {
  eachCell(callback: (cell: ExcelJSCell, colNumber: number) => void): void;
}

interface ExcelJSCell {
  value: unknown;
}


/**
 * Dynamic import for ExcelJS to avoid bloating the build
 */
async function getExcelJS(): Promise<{ Workbook: new () => ExcelJSWorkbook }> {
  const ExcelJS = await import("exceljs");
  return ExcelJS as unknown as { Workbook: new () => ExcelJSWorkbook };
}

/**
 * Create a new workbook using ExcelJS
 */
export async function createWorkbook(): Promise<ExcelJSWorkbook> {
  const { Workbook } = await getExcelJS();
  return new Workbook();
}

/**
 * Download a file from buffer
 */
export function downloadFile(buffer: ArrayBuffer, filename: string): void {
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Read Excel file and parse data using ExcelJS
 */
export async function readExcelFile(file: File): Promise<Record<string, unknown>[]> {
  if (!file.name.endsWith(".xlsx")) {
    throw new Error("Solo se permiten archivos .xlsx");
  }

  const { Workbook } = await getExcelJS();
  const workbook = new Workbook();

  try {
    const buffer = await file.arrayBuffer();
    await workbook.xlsx.load(buffer);

    const worksheet = workbook.getWorksheet(1);
    if (!worksheet) {
      throw new Error("No se encontró ninguna hoja de trabajo");
    }

    const jsonData: Record<string, unknown>[] = [];
    const headers: string[] = [];

    // Get headers from row 6 (skip the 5 info rows)
    const headerRow = worksheet.getRow(6);
    headerRow.eachCell((cell: ExcelJSCell, colNumber: number) => {
      headers[colNumber - 1] = cell.value?.toString() || "";
    });

    // Process data rows starting from row 7
    worksheet.eachRow((row: ExcelJSRow, rowNumber: number) => {
      if (rowNumber > 6) {
        // Skip header and info rows
        const rowData: Record<string, unknown> = {};
        row.eachCell((cell: ExcelJSCell, colNumber: number) => {
          const header = headers[colNumber - 1];
          if (header) {
            rowData[header] = cell.value ?? "";
          }
        });

        // Only add row if it has some data
        if (Object.values(rowData).some((value) => value !== "")) {
          jsonData.push(rowData);
        }
      }
    });

    return jsonData;
  } catch {
    throw new Error("Error al leer el archivo Excel");
  }
}

/**
 * Export data to Excel file using ExcelJS
 */
export async function exportDataToExcel(
  data: unknown[],
  headers: ExcelColumn[],
  filename: string,
  sheetName: string,
  infoRows?: string[][]
): Promise<void> {
  const workbook = await createWorkbook();
  const worksheet = workbook.addWorksheet(sheetName);

  // Set column definitions
  worksheet.columns = headers.map((h) => ({
    header: h.header,
    key: h.key,
    width: h.width,
  }));

  // ExcelJS will create the header row when columns are set. If informational
  // rows are provided we want them ABOVE the header, so insert them at the
  // top using spliceRows which shifts the header down. This avoids adding the
  // header twice (once automatically and once manually).
  if (infoRows) {
    // spliceRows(start, deleteCount, ...rows)
    // insert info rows at the top so header stays after them
    worksheet.spliceRows(1, 0, ...infoRows);
  }

  // Add data rows
  data.forEach((row) => {
    const rowData = headers.map((h) => {
      const cell = (row as Record<string, unknown>)[h.key];
      // Do not export the default 'ALTA' value as a pre-filled action; leave empty instead.
      if (h.key === "ACCION" && cell === "ALTA") return "";
      return cell ?? "";
    });
    worksheet.addRow(rowData);
  });

  // Download the file
  const buffer = await workbook.xlsx.writeBuffer();
  downloadFile(buffer, filename);
}

export interface ExcelColumn {
  header: string;
  key: string;
  width: number;
}

/**
 * Format date for Excel filename
 */
export function formatDateForFilename(date: Date): string {
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = String(date.getFullYear()).slice(-2);
  return `${day}-${month}-${year}`;
}

/**
 * Export simple data to Excel file using ExcelJS (for data tables)
 */
export async function exportSimpleDataToExcel(
  data: Record<string, unknown>[],
  filename: string,
  sheetName = "Sheet1"
): Promise<void> {
  const workbook = await createWorkbook();
  const worksheet = workbook.addWorksheet(sheetName);

  if (data.length > 0) {
    // Get headers from first row
    const headers = Object.keys(data[0]);

    // Set columns
    worksheet.columns = headers.map((key) => ({
      header: key,
      key,
      width: 15,
    }));

    // Add data rows
    data.forEach((row) => {
      const rowValues = headers.map((key) => row[key]);
      worksheet.addRow(rowValues);
    });
  }

  const buffer = await workbook.xlsx.writeBuffer();
  downloadFile(buffer, filename);
}

/**
 * Read Excel file as array of arrays (similar to XLSX sheet_to_json with header: 1)
 */
export async function readExcelFileAsArrays(file: File): Promise<(string | number)[][]> {
  if (!file.name.endsWith(".xlsx")) {
    throw new Error("Solo se permiten archivos .xlsx");
  }

  const { Workbook } = await getExcelJS();
  const workbook = new Workbook();

  try {
    const buffer = await file.arrayBuffer();
    await workbook.xlsx.load(buffer);

    const worksheet = workbook.getWorksheet(1);
    if (!worksheet) {
      throw new Error("No se encontró ninguna hoja de trabajo");
    }

    const arrayData: (string | number)[][] = [];

    worksheet.eachRow((row: ExcelJSRow) => {
      const rowData: (string | number)[] = [];
      row.eachCell((cell: ExcelJSCell, colNumber: number) => {
        // Fill empty cells to maintain column positions
        while (rowData.length < colNumber - 1) {
          rowData.push("");
        }
        const value = cell.value;
        if (typeof value === "string" || typeof value === "number") {
          rowData.push(value);
        } else if (value === null || value === undefined) {
          rowData.push("");
        } else if (value instanceof Date) {
          // Format dates as ISO strings
          rowData.push(value.toISOString());
        } else if (typeof value === "object") {
          // Handle various ExcelJS object shapes (text, richText, formula results, etc.)
          const v = value as any;
          if (typeof v.text === "string") {
            rowData.push(v.text);
          } else if (Array.isArray(v.richText)) {
            rowData.push(
              v.richText
                .map((part: any) => (typeof part.text === "string" ? part.text : String(part)))
                .join("")
            );
          } else if (v.result !== undefined) {
            // Formula cells often have a result property
            const inner = v.result;
            if (typeof inner === "string" || typeof inner === "number") {
              rowData.push(inner);
            } else if (inner instanceof Date) {
              rowData.push(inner.toISOString());
            } else {
              try {
                rowData.push(JSON.stringify(inner));
              } catch {
                rowData.push(String(inner));
              }
            }
          } else {
            // Fallback to JSON.stringify to avoid '[object Object]'
            try {
              rowData.push(JSON.stringify(v));
            } catch {
              rowData.push(String(v));
            }
          }
        } else {
          // For other types (boolean, bigint, symbol, function, etc.), try JSON.stringify first
          // and fall back to Object.prototype.toString to avoid the default "[object Object]".
          try {
            const s = JSON.stringify(value);
            if (s === undefined) {
              rowData.push(Object.prototype.toString.call(value));
            } else {
              rowData.push(s);
            }
          } catch {
            rowData.push(Object.prototype.toString.call(value));
          }
        }
      });
      arrayData.push(rowData);
    });

    return arrayData;
  } catch {
    throw new Error("Error al leer el archivo Excel");
  }
}

/**
 * Read all worksheets from an Excel file and return as a record
 */
export async function readExcelWorkbook(file: File): Promise<Record<string, (string | number)[][]>> {
  if (!file.name.match(/\.(xlsx?|xls)$/i)) {
    throw new Error("Solo se permiten archivos .xlsx o .xls");
  }

  const { Workbook } = await getExcelJS();
  const workbook = new Workbook();

  try {
    const buffer = await file.arrayBuffer();
    await workbook.xlsx.load(buffer);

    const worksheetData: Record<string, (string | number)[][]> = {};

    // Read all worksheets
    workbook.eachSheet((worksheet: ExcelJSWorksheet, sheetId: number) => {
      const sheetName = (worksheet as any).name || `Sheet${sheetId}`;
      const arrayData: (string | number)[][] = [];

      worksheet.eachRow((row: ExcelJSRow) => {
        const rowData: (string | number)[] = [];
        row.eachCell((cell: ExcelJSCell, colNumber: number) => {
          // Fill empty cells to maintain column positions
          while (rowData.length < colNumber - 1) {
            rowData.push("");
          }
          const value = cell.value;
          if (typeof value === "string" || typeof value === "number") {
            rowData.push(value);
          } else if (value === null || value === undefined) {
            rowData.push("");
          } else if (value instanceof Date) {
            // Format dates as ISO strings
            rowData.push(value.toISOString());
          } else if (typeof value === "object") {
            // Handle various ExcelJS object shapes (text, richText, formula results, etc.)
            const v = value as any;
            if (typeof v.text === "string") {
              rowData.push(v.text);
            } else if (Array.isArray(v.richText)) {
              rowData.push(
                v.richText
                  .map((part: any) => (typeof part.text === "string" ? part.text : String(part)))
                  .join("")
              );
            } else if (v.result !== undefined) {
              // Formula cells often have a result property
              const inner = v.result;
              if (typeof inner === "string" || typeof inner === "number") {
                rowData.push(inner);
              } else if (inner instanceof Date) {
                rowData.push(inner.toISOString());
              } else {
                try {
                  rowData.push(JSON.stringify(inner));
                } catch {
                  rowData.push(String(inner));
                }
              }
            } else {
              // Fallback to JSON.stringify to avoid '[object Object]'
              try {
                rowData.push(JSON.stringify(v));
              } catch {
                rowData.push(String(v));
              }
            }
          } else {
            // For other types (boolean, bigint, symbol, function, etc.), try JSON.stringify first
            // and fall back to Object.prototype.toString to avoid the default "[object Object]".
            try {
              const s = JSON.stringify(value);
              if (s === undefined) {
                rowData.push(Object.prototype.toString.call(value));
              } else {
                rowData.push(s);
              }
            } catch {
              rowData.push(Object.prototype.toString.call(value));
            }
          }
        });
        arrayData.push(rowData);
      });

      worksheetData[sheetName] = arrayData;
    });

    return worksheetData;
  } catch {
    throw new Error("Error al leer el archivo Excel");
  }
}

/**
 * Export complex data with custom formatting (for ventas reports)
 */
export async function exportComplexDataToExcel(
  data: Record<string, unknown>[],
  headers: string[],
  filename: string,
  sheetName = "Hoja 1",
  filterInfo?: {
    year?: string | null;
    month?: string | null;
    distribuidor?: string | null;
    preventistas?: string | null;
  }
): Promise<void> {
  const workbook = await createWorkbook();
  const worksheet = workbook.addWorksheet(sheetName);

  // Set columns first so ExcelJS creates the header row
  worksheet.columns = headers.map((header) => ({
    header,
    key: header,
    width: header.length < 20 ? 20 : header.length + 5,
  }));

  // If filter info is provided, insert those rows above the header.
  // Use spliceRows to insert at the top so headers are pushed down.
  if (filterInfo) {
    const filterRows: (string | number | null)[][] = [
      [], // blank separator row
      [`Año: ${filterInfo.year ?? ""}`],
      [`Mes: ${filterInfo.month ?? ""}`],
      [`Distribuidora: ${filterInfo.distribuidor ?? "Todas"}`],
      [`Preventistas: ${filterInfo.preventistas ?? "Todos"}`],
      [], // blank separator row
    ];

    // spliceRows is not declared on our minimal interface, use any to call it at runtime
    worksheet.spliceRows(1, 0, ...filterRows);
  }

  // Add data rows (headers already present thanks to worksheet.columns)
  data.forEach((row) => {
    const rowValues = headers.map((header) => row[header]);
    worksheet.addRow(rowValues);
  });

  const buffer = await workbook.xlsx.writeBuffer();
  downloadFile(buffer, filename);
}
