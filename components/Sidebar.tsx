import React from 'react';
import { ViewState } from '../types';
import { Upload, History, Settings, FileText, CheckCircle, Crown, User } from 'lucide-react';

interface SidebarProps {
  currentView: ViewState;
  onChangeView: (view: ViewState) => void;
  isPremium?: boolean; // Add prop
  onUpgradeClick?: () => void; // Add prop
  userName?: string; // Add prop for profile name
}

export const Sidebar: React.FC<SidebarProps> = ({ currentView, onChangeView, isPremium = false, onUpgradeClick, userName = "Người dùng" }) => {
  const menuItems = [
    { id: 'upload', label: 'Kiểm Duyệt Mới', icon: <Upload size={20} /> },
    { id: 'history', label: 'Lịch Sử', icon: <History size={20} /> },
    { id: 'criteria', label: 'Tiêu Chí', icon: <CheckCircle size={20} /> },
    { id: 'settings', label: 'Cài Đặt', icon: <Settings size={20} /> },
  ];

  return (
    <div className="w-64 bg-white h-full shadow-xl flex flex-col z-10 border-r border-gray-100 hidden md:flex">
      <div className="p-6 flex items-center space-x-3 border-b border-gray-50">
        <div className="bg-gradient-to-tr from-blue-600 to-indigo-600 p-2 rounded-lg text-white">
          <FileText size={24} />
        </div>
        <div>
          <h1 className="font-bold text-xl text-gray-800 tracking-tight">DocuMind</h1>
          <div className="flex items-center gap-1">
             <p className="text-xs text-gray-500 font-medium">AI Document Review</p>
             {isPremium && <span className="bg-yellow-100 text-yellow-700 text-[10px] px-1.5 py-0.5 rounded-full font-bold border border-yellow-200">PRO</span>}
          </div>
        </div>
      </div>
      
      <nav className="flex-1 p-4 space-y-2 mt-4">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onChangeView(item.id as ViewState)}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 group font-medium ${
              currentView === item.id 
                ? 'bg-blue-50 text-blue-700 shadow-sm' 
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            }`}
          >
            <span className={`${currentView === item.id ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-600'}`}>
              {item.icon}
            </span>
            <span>{item.label}</span>
          </button>
        ))}
      </nav>
      
      <div className="p-4 border-t border-gray-50 space-y-4">
        {!isPremium && (
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-4 text-white shadow-lg relative overflow-hidden group cursor-pointer" onClick={onUpgradeClick}>
             <div className="absolute top-0 right-0 w-16 h-16 bg-white/10 rounded-full blur-xl group-hover:bg-white/20 transition-all"></div>
             <p className="text-sm font-semibold mb-1 flex items-center gap-2 relative z-10">
                <Crown size={16} className="text-yellow-300" /> Nâng cấp Premium
             </p>
             <p className="text-[10px] text-blue-100 opacity-90 mb-3 relative z-10">Mở khóa upload file 500MB & Tốc độ cao</p>
             <button 
               className="w-full bg-white/20 hover:bg-white/30 text-xs py-1.5 rounded-lg transition-colors backdrop-blur-sm font-bold relative z-10"
             >
               Nhập mã kích hoạt
             </button>
          </div>
        )}

        <button 
          onClick={() => onChangeView('profile')}
          className={`w-full flex items-center gap-3 p-3 rounded-xl transition-colors ${currentView === 'profile' ? 'bg-gray-100' : 'hover:bg-gray-50'}`}
        >
           <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 overflow-hidden border border-gray-300">
               <User size={20} />
           </div>
           <div className="text-left overflow-hidden">
              <p className="text-sm font-bold text-gray-800 truncate">{userName}</p>
              <p className="text-xs text-gray-500 truncate">{isPremium ? 'Thành viên Pro' : 'Thành viên Free'}</p>
           </div>
        </button>
      </div>
    </div>
  );
};