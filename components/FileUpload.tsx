import React, { useCallback, useState } from 'react';
import { UploadCloud, File, AlertCircle, Loader2, FileSpreadsheet, FileArchive, Presentation, Crown } from 'lucide-react';
import { FileData } from '../types';

interface FileUploadProps {
  onFileSelected: (fileData: FileData) => void;
  isProcessing: boolean;
  isPremium?: boolean; // Add prop
  onUpgradeRequest?: () => void; // Add prop
}

export const FileUpload: React.FC<FileUploadProps> = ({ onFileSelected, isProcessing, isPremium = false, onUpgradeRequest }) => {
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const validateAndProcessFile = (file: File) => {
    // Extended file types support
    const validTypes = [
      // Documents
      'application/pdf', 
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // docx
      // Images
      'image/jpeg', 
      'image/png', 
      'image/webp',
      // Slides
      'application/vnd.openxmlformats-officedocument.presentationml.presentation', // pptx
      // Spreadsheets
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // xlsx
      // Archives
      'application/zip',
      'application/x-zip-compressed'
    ];
    
    // Check extension for cases where mimeType might be missing or generic
    const validExtensions = ['.pdf', '.docx', '.doc', '.jpg', '.jpeg', '.png', '.pptx', '.ppt', '.xlsx', '.xls', '.zip', '.rar'];
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();

    if (!validTypes.includes(file.type) && !validExtensions.includes(fileExtension)) {
      setError("Định dạng chưa hỗ trợ. Vui lòng dùng: PDF, Word, Excel, PPT, Ảnh hoặc Zip.");
      return; 
    } else {
      setError(null);
    }

    // SIZE LIMIT LOGIC
    const MAX_SIZE_FREE = 20 * 1024 * 1024; // 20MB
    const MAX_SIZE_PREMIUM = 500 * 1024 * 1024; // 500MB
    const currentLimit = isPremium ? MAX_SIZE_PREMIUM : MAX_SIZE_FREE;

    if (file.size > currentLimit) {
      if (!isPremium && file.size <= MAX_SIZE_PREMIUM) {
        setError("File quá lớn cho gói miễn phí. Vui lòng nâng cấp Premium để tải file lên tới 500MB.");
        // Optional: Trigger upgrade modal automatically or via a button in error
      } else {
        setError(`File quá lớn. Giới hạn tối đa là ${isPremium ? '500MB' : '20MB'}.`);
      }
      return;
    }

    const fileData: FileData = {
      file,
      // Create a generic preview icon URL based on type logic if it's not an image
      previewUrl: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined
    };
    onFileSelected(fileData);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndProcessFile(e.dataTransfer.files[0]);
    }
  }, [isPremium]); // Added isPremium to dependency

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      validateAndProcessFile(e.target.files[0]);
    }
  };

  return (
    <div className="max-w-xl mx-auto mt-10">
      <div 
        className={`relative group border-2 border-dashed rounded-3xl p-10 transition-all duration-300 ease-out text-center ${
          dragActive 
            ? 'border-blue-500 bg-blue-50 scale-[1.02]' 
            : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          type="file"
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
          onChange={handleChange}
          disabled={isProcessing}
          accept=".pdf,.docx,.jpg,.png,.pptx,.xlsx,.zip"
        />
        
        <div className="flex flex-col items-center justify-center space-y-4 pointer-events-none">
          <div className={`p-4 rounded-full transition-colors duration-300 ${dragActive ? 'bg-blue-200 text-blue-600' : 'bg-gray-100 text-gray-500 group-hover:bg-blue-100 group-hover:text-blue-500'}`}>
            {isProcessing ? (
               <Loader2 className="animate-spin w-10 h-10" />
            ) : (
               <UploadCloud className="w-10 h-10" />
            )}
          </div>
          
          <div className="space-y-2">
            <h3 className="text-xl font-semibold text-gray-700">
              {isProcessing ? 'Đang phân tích...' : 'Kéo thả tài liệu vào đây'}
            </h3>
            <p className="text-sm text-gray-500">
              Giới hạn: <span className="font-semibold">{isPremium ? '500MB' : '20MB'}</span> 
              {!isPremium && <span className="text-amber-500 text-xs ml-2">(Nâng cấp để tăng giới hạn)</span>}
            </p>
          </div>
          
          <div className="pt-4 grid grid-cols-4 gap-2 text-xs text-gray-400">
            <div className="flex flex-col items-center gap-1">
                <File size={16} /> <span>PDF/Doc</span>
            </div>
            <div className="flex flex-col items-center gap-1">
                <Presentation size={16} /> <span>PPTX</span>
            </div>
            <div className="flex flex-col items-center gap-1">
                <FileSpreadsheet size={16} /> <span>Excel</span>
            </div>
            <div className="flex flex-col items-center gap-1">
                <FileArchive size={16} /> <span>Zip</span>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="mt-4 p-4 bg-red-50 text-red-600 rounded-xl flex items-center justify-between space-x-2 text-sm animate-pulse border border-red-100">
          <div className="flex items-center gap-2">
            <AlertCircle size={16} className="shrink-0" />
            <span>{error}</span>
          </div>
          
          {!isPremium && error.includes("Premium") && onUpgradeRequest && (
            <button 
              onClick={(e) => {
                e.preventDefault(); 
                onUpgradeRequest();
              }}
              className="px-3 py-1 bg-gradient-to-r from-amber-400 to-amber-600 text-white rounded-lg text-xs font-bold whitespace-nowrap hover:shadow-md transition-all flex items-center gap-1"
            >
              <Crown size={12} fill="currentColor" /> Nâng cấp
            </button>
          )}
        </div>
      )}
    </div>
  );
};