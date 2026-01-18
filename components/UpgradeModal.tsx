import React, { useState } from 'react';
import { Crown, Check, X, Zap, KeyRound, AlertCircle } from 'lucide-react';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export const UpgradeModal: React.FC<UpgradeModalProps> = ({ isOpen, onClose, onConfirm }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleUpgrade = () => {
    setError(null);
    if (!code.trim()) {
      setError("Vui lòng nhập mã kích hoạt.");
      return;
    }

    setIsProcessing(true);
    
    // Simulate API call to verify code
    setTimeout(() => {
      // Hardcoded check for demo purposes
      if (code.trim().toUpperCase() === 'DOCUMIND_PRO') {
        onConfirm();
        onClose();
        setCode(''); // Reset code
      } else {
        setError("Mã kích hoạt không hợp lệ hoặc đã hết hạn.");
      }
      setIsProcessing(false);
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out]">
      <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl relative animate-[scaleIn_0.3s_ease-out]">
        {/* Header Background */}
        <div className="bg-gradient-to-br from-indigo-600 to-purple-700 p-8 text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full opacity-20">
            <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
               <path d="M0 100 C 20 0 50 0 100 100 Z" fill="white" />
            </svg>
          </div>
          
          <div className="relative z-10">
            <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center mx-auto mb-4 shadow-inner border border-white/30">
              <Crown className="text-yellow-300 w-8 h-8 drop-shadow-md" fill="currentColor" />
            </div>
            <h2 className="text-3xl font-extrabold text-white mb-2">DocuMind Premium</h2>
            <p className="text-indigo-100 text-sm">Mở khóa sức mạnh tối đa của AI</p>
          </div>
          
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-8">
          <div className="space-y-4 mb-6">
            {[
              "Tải lên file dung lượng lớn tới 500MB",
              "Phân tích chuyên sâu không giới hạn",
              "Tốc độ xử lý ưu tiên (Nhanh gấp 3 lần)",
              "Lưu trữ lịch sử vĩnh viễn"
            ].map((feature, idx) => (
              <div key={idx} className="flex items-center gap-3 text-gray-700">
                <div className="bg-green-100 text-green-600 p-1 rounded-full shrink-0">
                  <Check size={14} strokeWidth={3} />
                </div>
                <span className="text-sm font-medium">{feature}</span>
              </div>
            ))}
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Nhập mã kích hoạt (Redeem Code)</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <KeyRound size={18} className="text-gray-400" />
              </div>
              <input 
                type="text" 
                value={code}
                onChange={(e) => {
                  setCode(e.target.value);
                  setError(null);
                }}
                placeholder="VD: DOCUMIND_PRO"
                className={`w-full pl-10 pr-4 py-3 border rounded-xl outline-none focus:ring-2 transition-all font-mono uppercase ${error ? 'border-red-300 focus:ring-red-200 bg-red-50' : 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-200'}`}
              />
            </div>
            {error && (
              <div className="flex items-center gap-1 text-red-600 text-xs mt-2 animate-pulse">
                <AlertCircle size={12} /> {error}
              </div>
            )}
          </div>

          <button
            onClick={handleUpgrade}
            disabled={isProcessing}
            className="w-full py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl font-bold shadow-lg shadow-indigo-200 transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isProcessing ? (
              <>Đang kiểm tra mã...</>
            ) : (
              <>
                <Zap size={20} fill="currentColor" className="text-yellow-300" /> Kích Hoạt Ngay
              </>
            )}
          </button>
          
          <p className="text-center text-xs text-gray-400 mt-4">
            Liên hệ quản trị viên nếu bạn chưa có mã.
          </p>
        </div>
      </div>
    </div>
  );
};