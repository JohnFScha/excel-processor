import { useState, useCallback } from 'react';
import { processExcelFiles, ProcessingResult, formatProcessingResults } from '../utils/excel-processor';

interface UseExcelProcessorState {
  isProcessing: boolean;
  results: ProcessingResult[];
  resultsSummary: string;
  error: string | null;
}

interface UseExcelProcessorActions {
  processFiles: (files: File[]) => Promise<void>;
  clearResults: () => void;
  clearError: () => void;
}

export function useExcelProcessor(): UseExcelProcessorState & UseExcelProcessorActions {
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState<ProcessingResult[]>([]);
  const [resultsSummary, setResultsSummary] = useState('');
  const [error, setError] = useState<string | null>(null);

  const processFiles = useCallback(async (files: File[]) => {
    if (!files || files.length === 0) {
      setError('No files selected');
      return;
    }

    setIsProcessing(true);
    setError(null);
    setResults([]);
    setResultsSummary('');

    try {
      const processingResults = await processExcelFiles(files);
      setResults(processingResults);
      setResultsSummary(formatProcessingResults(processingResults));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error no conocido';
      setError(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const clearResults = useCallback(() => {
    setResults([]);
    setResultsSummary('');
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    isProcessing,
    results,
    resultsSummary,
    error,
    processFiles,
    clearResults,
    clearError,
  };
}