import { useState, useCallback } from 'react';
import { Upload, FileCheck, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { parseZipFile, parseCSVFile, processRawData } from '@/utils/dataProcessor';
import { useAnalyticsStore } from '@/store/analyticsStore';
import { toast } from 'sonner';

export function FileUploader() {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<string | null>(null);
  const { setIndividualClasses, setAggregatedData, setIsLoading } = useAnalyticsStore();

  const processFile = useCallback(async (file: File) => {
    setIsProcessing(true);
    setIsLoading(true);
    
    try {
      let rawData;
      
      if (file.name.endsWith('.zip')) {
        rawData = await parseZipFile(file);
      } else if (file.name.endsWith('.csv')) {
        rawData = await parseCSVFile(file);
      } else {
        throw new Error('Please upload a ZIP or CSV file');
      }

      const { individualClasses, aggregated } = processRawData(rawData);
      
      setIndividualClasses(individualClasses);
      setAggregatedData(aggregated);
      setUploadedFile(file.name);
      
      toast.success(`Successfully processed ${individualClasses.length} class records!`, {
        description: `Aggregated into ${aggregated.length} unique groups`,
      });
    } catch (error) {
      console.error('File processing error:', error);
      toast.error('Failed to process file', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setIsProcessing(false);
      setIsLoading(false);
    }
  }, [setIndividualClasses, setAggregatedData, setIsLoading]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }, [processFile]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  }, [processFile]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full"
    >
      <div
        className={`
          relative border-2 border-dashed rounded-lg p-12 text-center transition-all
          ${isDragging ? 'border-accent bg-accent/5 scale-105' : 'border-border hover:border-accent/50'}
          ${uploadedFile ? 'bg-success/5 border-success' : 'bg-white'}
        `}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
      >
        {isProcessing ? (
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin" />
            <p className="text-lg font-semibold">Processing your data...</p>
            <p className="text-sm text-muted-foreground">Parsing and normalizing class records</p>
          </div>
        ) : uploadedFile ? (
          <div className="flex flex-col items-center gap-4">
            <FileCheck className="w-16 h-16 text-success" />
            <div>
              <p className="text-lg font-semibold text-success">File uploaded successfully!</p>
              <p className="text-sm text-muted-foreground mt-1">{uploadedFile}</p>
            </div>
            <label className="btn-accent px-6 py-3 cursor-pointer mt-2">
              Upload Different File
              <input
                type="file"
                accept=".zip,.csv"
                onChange={handleFileInput}
                className="hidden"
              />
            </label>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4">
            <Upload className="w-16 h-16 text-primary" />
            <div>
              <p className="text-xl font-bold mb-2">Drop your file here</p>
              <p className="text-sm text-muted-foreground">
                Supports ZIP archives with CSV files or direct CSV upload
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Accepts: momence-teachers-payroll-report-combined.csv
              </p>
            </div>
            <label className="btn-navy px-8 py-3 cursor-pointer mt-4">
              Browse Files
              <input
                type="file"
                accept=".zip,.csv"
                onChange={handleFileInput}
                className="hidden"
              />
            </label>
          </div>
        )}
        
        {!isProcessing && !uploadedFile && (
          <div className="absolute bottom-4 right-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <AlertCircle className="w-4 h-4" />
              Max file size: 50MB
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
