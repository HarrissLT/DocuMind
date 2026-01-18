import React, { useEffect, useState } from 'react';
import { Brain, FileSearch, Sparkles, Layers, Search, CheckCircle } from 'lucide-react';

interface AnalyzingViewProps {
  fileName: string;
}

export const AnalyzingView: React.FC<AnalyzingViewProps> = ({ fileName }) => {
  const [progress, setProgress] = useState(0);
  
  // Simulation logic
  useEffect(() => {
    const timer = setInterval(() => {
      setProgress(prev => {
        if (prev >= 95) return 95; // Stall at 95% waiting for actual response
        
        // Randomize increment slightly for "natural" feel
        const noise = Math.random() * 2;
        
        // Slow down as it gets higher
        const increment = prev < 30 ? 1.5 + noise : prev < 70 ? 0.8 + noise : 0.3 + noise;
        return Math.min(prev + increment, 95);
      });
    }, 150);
    return () => clearInterval(timer);
  }, []);

  // Determine current stage info based on progress
  const getStageInfo = (p: number) => {
    if (p < 25) return { 
      text: "Đang đọc & trích xuất dữ liệu...", 
      subtext: "Hệ thống đang quét nội dung file của bạn",
      icon: <FileSearch className="w-8 h-8 text-blue-500 animate-bounce" />,
      color: "bg-blue-500"
    };
    if (p < 50) return { 
      text: "Phân tích ngữ nghĩa & Logic...", 
      subtext: "Kiểm tra độ chính xác và tính sư phạm",
      icon: <Brain className="w-8 h-8 text-purple-500 animate-pulse" />,
      color: "bg-purple-500"
    };
    if (p < 75) return { 
      text: "Đánh giá thiết kế & Bố cục...", 
      subtext: "So sánh với các tiêu chuẩn thẩm mỹ hiện đại",
      icon: <Layers className="w-8 h-8 text-pink-500 animate-pulse" />,
      color: "bg-pink-500"
    };
    return { 
      text: "Tổng hợp kết quả & Chấm điểm...", 
      subtext: "Đang tạo báo cáo chi tiết cho bạn",
      icon: <Sparkles className="w-8 h-8 text-yellow-500 animate-pulse" />,
      color: "bg-yellow-500"
    };
  };

  const { text, subtext, icon, color } = getStageInfo(progress);

  const steps = [
    { label: "Đọc file", threshold: 0 },
    { label: "Nội dung", threshold: 25 },
    { label: "Thiết kế", threshold: 50 },
    { label: "Tổng hợp", threshold: 75 },
  ];

  return (
    <div className="flex flex-col items-center justify-center h-[60vh] max-w-2xl mx-auto animate-[fadeIn_0.5s_ease-out] w-full px-4">
        {/* Icon Container */}
        <div className="relative mb-8">
             <div className="absolute inset-0 bg-blue-50 rounded-full scale-[1.8] animate-ping opacity-30"></div>
             <div className="bg-white p-6 rounded-full shadow-xl border border-gray-100 relative z-10 flex items-center justify-center w-24 h-24">
                {icon}
             </div>
        </div>

        {/* Text */}
        <h2 className="text-2xl font-bold text-gray-800 mb-2 text-center min-h-[40px] transition-all">{text}</h2>
        <p className="text-gray-500 mb-8 text-sm text-center min-h-[20px]">{subtext}</p>

        {/* File Name Pill */}
        <div className="mb-8 px-4 py-1 bg-gray-100 rounded-full text-xs font-medium text-gray-500 flex items-center gap-2">
            <Search size={12} />
            Đang xử lý: {fileName}
        </div>

        {/* Progress Bar Container */}
        <div className="w-full max-w-md h-3 bg-gray-100 rounded-full overflow-hidden shadow-inner relative mb-2">
            <div 
                className={`h-full ${color} transition-all duration-300 ease-out relative`}
                style={{ width: `${progress}%` }}
            >
               <div className="absolute top-0 right-0 bottom-0 w-full bg-gradient-to-l from-white/30 to-transparent"></div>
            </div>
        </div>
        
        <div className="w-full max-w-md flex justify-between text-xs text-gray-400 font-medium px-1">
            <span>0%</span>
            <span>{Math.floor(progress)}%</span>
            <span>100%</span>
        </div>

        {/* Steps Visualizer */}
        <div className="w-full max-w-md flex justify-between mt-10 relative">
            {/* Connecting Line */}
            <div className="absolute top-3 left-0 w-full h-0.5 bg-gray-100 -z-10"></div>
            
            {steps.map((step, i) => {
                const isActive = progress >= step.threshold;
                const isCompleted = progress >= (steps[i+1]?.threshold || 100);
                
                return (
                  <div key={i} className="flex flex-col items-center gap-2">
                      <div className={`
                          w-6 h-6 rounded-full flex items-center justify-center text-[10px] border-2 transition-all duration-500
                          ${isActive ? 'border-blue-500 bg-white text-blue-600 scale-110' : 'border-gray-200 bg-gray-50 text-gray-300'}
                          ${isCompleted ? 'bg-blue-500 !text-white !border-blue-500' : ''}
                      `}>
                          {isCompleted ? <CheckCircle size={12} /> : i + 1}
                      </div>
                      <span className={`text-[10px] uppercase font-bold tracking-wider transition-colors duration-300 ${isActive ? 'text-gray-700' : 'text-gray-300'}`}>
                        {step.label}
                      </span>
                  </div>
                );
            })}
        </div>
    </div>
  );
};