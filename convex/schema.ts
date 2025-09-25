import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

const applicationTables = {
  processedFiles: defineTable({
    originalFileName: v.string(),
    processedFileName: v.string(),
    originalFileId: v.id("_storage"), // Original file stored in Convex storage
    processedFileId: v.id("_storage"), // Processed file stored in Convex storage
    status: v.union(v.literal("processing"), v.literal("completed"), v.literal("failed")),
    errorMessage: v.optional(v.string()),
    processingTimeMs: v.optional(v.number()),
    fileSize: v.number(), // Original file size in bytes
    processedFileSize: v.optional(v.number()), // Processed file size in bytes
    createdBy: v.id("users"),
    // Statistics snapshot for quick access
    totalRecordsProcessed: v.optional(v.number()),
    worksheetsProcessed: v.optional(v.array(v.string())),
  })
    .index("byUser", ["createdBy"])
    .index("byStatus", ["status"]),

  fileStatistics: defineTable({
    processedFileId: v.id("processedFiles"),
    worksheetName: v.string(),
    originalRecordCount: v.number(),
    processedRecordCount: v.number(),
    validRecords: v.number(),
    invalidRecords: v.number(),
    // Distribuidor specific stats
    emailsConverted: v.optional(v.number()),
    cuitTransferred: v.optional(v.number()),
    condicionIvaMapped: v.optional(v.number()),
    // Precios specific stats
    pricesCalculated: v.optional(v.number()),
    pricesWithIva: v.optional(v.number()),
    pricesWithoutIva: v.optional(v.number()),
    categoriesMatched: v.optional(v.number()),
    // Clientes specific stats
    codigosGenerated: v.optional(v.number()),
    namesConcat: v.optional(v.number()),
    priceListsAssigned: v.optional(v.number()),
    visitaColumnsProcessed: v.optional(v.number()),
    createdBy: v.id("users"),
  })
    .index("byProcessedFile", ["processedFileId"])
    .index("byUser", ["createdBy"])
    .index("byWorksheet", ["worksheetName"]),

  processingErrors: defineTable({
    processedFileId: v.id("processedFiles"),
    worksheetName: v.optional(v.string()),
    rowNumber: v.optional(v.number()),
    columnName: v.optional(v.string()),
    errorType: v.string(), // e.g., "validation", "parsing", "mapping"
    errorMessage: v.string(),
    originalValue: v.optional(v.string()),
    suggestedFix: v.optional(v.string()),
    createdBy: v.id("users"),
  })
    .index("byProcessedFile", ["processedFileId"])
    .index("byErrorType", ["errorType"])
    .index("byUser", ["createdBy"]),

  globalStatistics: defineTable({
    // Daily/Monthly aggregated statistics
    period: v.string(), // e.g., "2025-09-25", "2025-09", "2025"
    periodType: v.union(v.literal("daily"), v.literal("monthly"), v.literal("yearly")),
    totalFilesProcessed: v.number(),
    totalRecordsProcessed: v.number(),
    totalProcessingTimeMs: v.number(),
    averageProcessingTimeMs: v.number(),
    successRate: v.number(), // percentage of successful files
    mostCommonErrors: v.array(v.object({
      errorType: v.string(),
      count: v.number(),
    })),
    worksheetBreakdown: v.object({
      distribuidor: v.number(),
      listaPrecios: v.number(),
      listaPreciosTradicional: v.number(),
      clientes: v.number(),
    }),
    totalUsers: v.number(),
    activeUsers: v.number(),
  })
    .index("byPeriod", ["period"])
    .index("byPeriodType", ["periodType"]),
};

export default defineSchema({
  ...authTables,
  ...applicationTables,
});
