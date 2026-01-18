import React, { useState } from 'react';
import { AnalysisResult, FileData, UserProfile } from '../types';
import { Check, X, Download, RotateCcw, FileText, Share2, Award, Zap, AlertCircle, Eye, Loader2, BookOpen } from 'lucide-react';
import { generatePDFReport, getPDFBlobUrl } from '../services/pdfService';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

interface AnalysisResultViewProps {
  result: AnalysisResult;
  fileData: FileData;
  onReset: () => void;
  userProfile: UserProfile;
}

export const AnalysisResultView: React.FC<AnalysisResultViewProps> = ({ result, fileData, onReset, userProfile }) => {
  const [showPreview, setShowPreview] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  const handlePreview = async () => {
    setIsGeneratingPdf(true);
    try {
      const url = await getPDFBlobUrl(fileData.file.name, result, userProfile);
      setPreviewUrl(url);
      setShowPreview(true);
    } catch (error) {
      console.error("Error generating PDF preview:", error);
      alert("Không thể tạo bản xem trước PDF.");
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleDownload = async () => {
    setIsGeneratingPdf(true);
    try {
      await generatePDFReport(fileData.file.name, result, userProfile);
    } catch (error) {
      console.error("Error downloading PDF:", error);
      alert("Không thể tải xuống PDF.");
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-emerald-600';
    if (score >= 75) return 'text-blue-600';
    if (score >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getVerdictBadge = (verdict: string) => {
     const styles = {
         "Xuất Sắc": "bg-emerald-100 text-emerald-700 border-emerald-200",
         "Tốt": "bg-blue-100 text-blue-700 border-blue-200",
         "Khá": "bg-yellow-100 text-yellow-700 border-yellow-200",
         "Cần Cải Thiện": "bg-orange-100 text-orange-700 border-orange-200",
         "Kém": "bg-red-100 text-red-700 border-red-200"
     };
     const style = styles[verdict as keyof typeof styles] || styles["Khá"];
     return (
         <span className={`px-4 py-1 rounded-full text-sm font-bold border ${style} uppercase tracking-wide`}>
             {verdict}
         </span>
     );
  };

  const chartData = [
    { name: 'Score', value: result.score },
    { name: 'Remaining', value: 100 - result.score },
  ];
  const chartColors = [result.score >= 80 ? '#10b981' : result.score >= 50 ? '#f59e0b' : '#ef4444', '#e5e7eb'];

  return (
    <div className="space-y-8 animate-[fadeIn_0.5s_ease-out]">
      {/* PDF Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out]">
            <div className="bg-white rounded-2xl w-full max-w-5xl h-[90vh] flex flex-col shadow-2xl overflow-hidden relative">
                <div className="flex justify-between items-center p-4 border-b border-gray-100 bg-white">
                     <div className="flex items-center gap-2">
                         <FileText className="text-blue-600" size={20} />
                         <h3 className="font-bold text-gray-800 text-lg">Xem Trước Báo Cáo</h3>
                     </div>
                     <button 
                        onClick={() => setShowPreview(false)} 
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500 hover:text-gray-800"
                     >
                        <X size={24}/>
                     </button>
                </div>
                
                <div className="flex-1 bg-gray-100 p-0 md:p-4 overflow-hidden relative">
                     {previewUrl ? (
                         <iframe 
                            src={previewUrl} 
                            className="w-full h-full rounded-lg border border-gray-300 shadow-inner bg-white" 
                            title="PDF Preview"
                         ></iframe>
                     ) : (
                         <div className="flex items-center justify-center h-full text-gray-400">
                           <Loader2 className="animate-spin mr-2" /> Đang tải bản xem trước...
                         </div>
                     )}
                </div>
                
                <div className="p-4 border-t border-gray-100 bg-white flex justify-end gap-3 items-center">
                     <span className="text-sm text-gray-400 hidden sm:block mr-auto">Bản xem trước có thể khác biệt nhỏ so với file tải về tùy trình duyệt.</span>
                     <button 
                        onClick={() => setShowPreview(false)} 
                        className="px-5 py-2.5 text-gray-600 font-medium hover:bg-gray-50 rounded-lg transition-colors"
                     >
                        Đóng
                     </button>
                     <button 
                        onClick={handleDownload} 
                        disabled={isGeneratingPdf}
                        className="px-5 py-2.5 bg-blue-600 text-white rounded-lg flex items-center gap-2 hover:bg-blue-700 transition shadow-lg shadow-blue-200 font-medium disabled:opacity-70"
                     >
                        {isGeneratingPdf ? <Loader2 className="animate-spin" size={18} /> : <Download size={18}/>} 
                        Tải Xuống PDF
                     </button>
                </div>
            </div>
        </div>
      )}

      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
           <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
               <Award className="text-blue-600" /> 
               Kết Quả Kiểm Duyệt
           </h2>
           <div className="flex flex-col gap-1 mt-1">
               <p className="text-gray-500 text-sm">File: {fileData.file.name}</p>
               <div className="flex items-center gap-2 text-sm text-purple-600 font-semibold bg-purple-50 px-2 py-0.5 rounded-md w-fit">
                  <BookOpen size={14} />
                  <span>Môn/Lĩnh vực: {result.subject}</span>
               </div>
           </div>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={onReset}
            className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition shadow-sm font-medium text-sm"
          >
            <RotateCcw size={16} />
            <span className="hidden sm:inline">Kiểm duyệt lại</span>
            <span className="sm:hidden">Lại</span>
          </button>
          
          <button 
            onClick={handlePreview}
            disabled={isGeneratingPdf}
            className="flex items-center space-x-2 px-4 py-2 bg-white border border-blue-200 text-blue-700 rounded-lg hover:bg-blue-50 transition shadow-sm font-medium text-sm disabled:opacity-70"
          >
            {isGeneratingPdf ? <Loader2 className="animate-spin" size={16} /> : <Eye size={16} />}
            <span>Xem trước PDF</span>
          </button>

          <button 
            onClick={handleDownload}
            disabled={isGeneratingPdf}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition shadow-md shadow-blue-200 font-medium text-sm disabled:opacity-70"
          >
            {isGeneratingPdf ? <Loader2 className="animate-spin" size={16} /> : <Download size={16} />}
            <span className="hidden sm:inline">Tải Báo Cáo</span>
            <span className="sm:hidden">Tải</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Score Card */}
        <div className="md:col-span-1 bg-white rounded-2xl shadow-lg border border-gray-100 p-6 flex flex-col items-center justify-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-500 to-purple-500"></div>
            <h3 className="text-gray-400 font-medium uppercase tracking-widest text-xs mb-4">Điểm Chất Lượng</h3>
            <div className="w-48 h-48 relative">
                 <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={chartData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            startAngle={90}
                            endAngle={-270}
                            dataKey="value"
                            stroke="none"
                        >
                            {chartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={chartColors[index]} />
                            ))}
                        </Pie>
                    </PieChart>
                 </ResponsiveContainer>
                 <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className={`text-4xl font-black ${getScoreColor(result.score)}`}>{result.score}</span>
                    <span className="text-gray-400 text-sm">/ 100</span>
                 </div>
            </div>
            <div className="mt-4">
                {getVerdictBadge(result.overallVerdict)}
            </div>
        </div>

        {/* Summary Card */}
        <div className="md:col-span-2 bg-white rounded-2xl shadow-lg border border-gray-100 p-8 flex flex-col justify-center">
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <FileText size={20} className="text-purple-500" />
                Tóm Tắt Nội Dung
            </h3>
            <p className="text-gray-600 leading-relaxed text-justify bg-gray-50 p-4 rounded-xl border border-gray-200">
                {result.summary}
            </p>
        </div>
      </div>

      {/* Pros & Cons */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Pros */}
          <div className="bg-white rounded-2xl shadow-md p-6 border-l-4 border-emerald-500">
              <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <div className="bg-emerald-100 p-1 rounded-full">
                    <Check size={16} className="text-emerald-600" />
                  </div>
                  Ưu Điểm
              </h3>
              <ul className="space-y-3">
                  {result.pros.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-3 text-gray-600">
                          <Check size={18} className="text-emerald-500 mt-0.5 shrink-0" />
                          <span className="text-sm">{item}</span>
                      </li>
                  ))}
              </ul>
          </div>

          {/* Cons */}
          <div className="bg-white rounded-2xl shadow-md p-6 border-l-4 border-red-500">
              <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                   <div className="bg-red-100 p-1 rounded-full">
                    <X size={16} className="text-red-600" />
                  </div>
                  Nhược Điểm & Hạn Chế
              </h3>
              <ul className="space-y-3">
                  {result.cons.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-3 text-gray-600">
                          <AlertCircle size={18} className="text-red-500 mt-0.5 shrink-0" />
                          <span className="text-sm">{item}</span>
                      </li>
                  ))}
              </ul>
          </div>
      </div>

      {/* Deep Dive */}
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="bg-gray-800 text-white p-4 px-6 flex items-center justify-between">
              <h3 className="font-bold text-lg flex items-center gap-2">
                  <Zap size={20} className="text-yellow-400" />
                  Phân Tích Chuyên Sâu AI
              </h3>
          </div>
          <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-10">
              <div>
                  <h4 className="font-bold text-gray-800 mb-2 border-b pb-2">Về Nội Dung ({result.subject})</h4>
                  <p className="text-gray-600 text-sm leading-7 text-justify whitespace-pre-line">
                      {result.contentFeedback}
                  </p>
              </div>
              <div>
                  <h4 className="font-bold text-gray-800 mb-2 border-b pb-2">Về Thiết Kế & Trình Bày</h4>
                  <p className="text-gray-600 text-sm leading-7 text-justify whitespace-pre-line">
                      {result.designFeedback}
                  </p>
              </div>
          </div>
          
          {/* Stamp Effect */}
          <div className="bg-gray-50 p-6 border-t border-gray-100 flex justify-end">
              <div className="border-4 border-red-600 p-2 px-6 rounded-lg rotate-[-5deg] opacity-80 select-none">
                  <p className="text-red-600 font-black text-xl tracking-widest text-center">ĐÃ KIỂM DUYỆT</p>
                  <p className="text-red-600 text-xs text-center font-bold">{userProfile.organization.toUpperCase()}</p>
              </div>
          </div>
      </div>
    </div>
  );
};