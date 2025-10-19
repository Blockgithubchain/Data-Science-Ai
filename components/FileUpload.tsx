
import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { FileData } from '../types';
import { CsvIcon, ImageIcon, UploadIcon } from './icons';

interface FileUploadProps {
  onFileAccepted: (data: FileData) => void;
}

const FileUpload: React.FC<FileUploadProps> = ({ onFileAccepted }) => {
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setError(null);
    if (acceptedFiles.length === 0) {
      return;
    }
    const file = acceptedFiles[0];
    const reader = new FileReader();

    const isImage = file.type.startsWith('image/');
    const isCsv = file.type === 'text/csv' || file.name.endsWith('.csv');

    if (!isImage && !isCsv) {
      setError('Invalid file type. Please upload a CSV or an image file.');
      return;
    }

    reader.onabort = () => console.log('file reading was aborted');
    reader.onerror = () => console.log('file reading has failed');
    reader.onload = () => {
      const content = reader.result as string;
      if (isCsv) {
        const lines = content.split('\n');
        const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
        onFileAccepted({ name: file.name, type: 'csv', content, headers });
      } else { // isImage
        onFileAccepted({ name: file.name, type: 'image', content });
      }
    };
    
    if (isImage) {
        reader.readAsDataURL(file);
    } else { // isCsv
        reader.readAsText(file);
    }

  }, [onFileAccepted]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop,
    multiple: false,
    accept: {
      'text/csv': ['.csv'],
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp']
    }
  });

  return (
    <div className="w-full max-w-2xl mx-auto flex flex-col items-center justify-center p-8 bg-gray-800/50 border-2 border-dashed border-gray-600 rounded-2xl transition-all duration-300 hover:border-blue-400 hover:bg-gray-800/80">
      <div {...getRootProps()} className="w-full text-center cursor-pointer">
        <input {...getInputProps()} />
        <div className="flex flex-col items-center justify-center gap-4">
          <UploadIcon />
          {isDragActive ? (
            <p className="text-xl font-semibold text-blue-300">Drop the file here ...</p>
          ) : (
            <p className="text-xl font-semibold text-gray-300">Drag & drop your dataset here, or click to select</p>
          )}
          <p className="text-gray-400">Supported formats:</p>
          <div className="flex items-center gap-6 mt-2">
            <div className="flex items-center gap-2 text-gray-300">
              <CsvIcon />
              <span>CSV</span>
            </div>
            <div className="flex items-center gap-2 text-gray-300">
              <ImageIcon />
              <span>Images (JPG, PNG, etc.)</span>
            </div>
          </div>
        </div>
      </div>
      {error && <p className="mt-4 text-red-400">{error}</p>}
    </div>
  );
};

export default FileUpload;
