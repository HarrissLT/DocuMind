import React from 'react';
import { HistoryItem } from '../types';
import { FileText, Calendar, Trash2, History as HistoryIcon, ArrowRight, Eye } from 'lucide-react';

interface HistoryProps {
  items: HistoryItem[];
  onClear: () => void;
  onSelect: (item: HistoryItem) => void; // Add select handler
}

export const History: React.FC<HistoryProps> = ({ items, onClear, onSelect }) => {
  if (items.length === 0) {
    return (
      <div className="text-center py-20 text-gray-400 animate-[fadeIn_0.5s_ease-out]">
        <HistoryIcon size={48} className="mx-auto mb-4 opacity-50" />
        <p>Chưa có lịch sử kiểm duyệt nào.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-[fadeIn_0.5s_ease-out]">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Lịch Sử Kiểm Duyệt</h2>
        <button 
          onClick={onClear}
          className="text-red-500 hover:text-red-700 text-sm flex items-center gap-1 font-medium transition-colors bg-red-50 px-3 py-1.5 rounded-lg border border-red-100 hover:bg-red-100"
        >
          <Trash2 size={16} /> Xóa tất cả
        </button>
      </div>

      <div className="grid gap-4">
        {items.map((item) => (
          <div 
            key={item.id} 
            onClick={() => onSelect(item)}
            className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 hover:shadow-md hover:border-blue-200 transition-all cursor-pointer flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 group relative overflow-hidden"
          >
            {/* Hover Indicator Line */}
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500 scale-y-0 group-hover:scale-y-100 transition-transform origin-top"></div>

            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center font-bold text-white text-lg shrink-0 shadow-sm
                ${item.result.score >= 80 ? 'bg-emerald-500' : item.result.score >= 50 ? 'bg-yellow-500' : 'bg-red-500'}
              `}>
                {item.result.score}
              </div>
              <div>
                <h3 className="font-semibold text-gray-800 group-hover:text-blue-600 transition-colors">{item.fileName}</h3>
                <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                   <span className="flex items-center gap-1"><Calendar size={12}/> {new Date(item.date).toLocaleDateString('vi-VN')} {new Date(item.date).toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'})}</span>
                   <span className="bg-gray-100 px-2 py-0.5 rounded text-gray-600 font-mono">{item.fileType}</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto mt-2 sm:mt-0">
              <span className={`text-sm font-bold px-3 py-1 rounded-full whitespace-nowrap ${
                  item.result.overallVerdict === 'Xuất Sắc' ? 'bg-emerald-100 text-emerald-700' : 
                  item.result.overallVerdict === 'Kém' ? 'bg-red-100 text-red-700' : 
                  item.result.overallVerdict === 'Cần Cải Thiện' ? 'bg-orange-100 text-orange-700' :
                  'bg-blue-100 text-blue-700'
              }`}>
                {item.result.overallVerdict}
              </span>
              
              <div className="flex items-center text-blue-500 text-xs font-semibold opacity-0 group-hover:opacity-100 transition-opacity transform translate-x-2 group-hover:translate-x-0">
                 Xem chi tiết <ArrowRight size={14} className="ml-1" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};