import React from 'react';
import { UserProfile, HistoryItem } from '../types';
import { User, LogOut, Shield, Briefcase, Award, Crown, Mail, Clock } from 'lucide-react';

interface ProfileViewProps {
  profile: UserProfile;
  historyCount: number;
  onLogout: () => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({ profile, historyCount, onLogout }) => {
  return (
    <div className="max-w-4xl mx-auto animate-[fadeIn_0.5s_ease-out]">
      <div className="bg-white rounded-3xl shadow-xl overflow-hidden mb-8 border border-gray-100">
        {/* Banner */}
        <div className={`h-48 w-full relative ${profile.isPremium ? 'bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600' : 'bg-gradient-to-r from-gray-700 to-gray-900'}`}>
          <div className="absolute inset-0 opacity-20">
            <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
              <path d="M0 100 C 40 0 60 0 100 100 Z" fill="white" />
            </svg>
          </div>
          {profile.isPremium && (
             <div className="absolute top-6 right-6 bg-white/20 backdrop-blur-md px-4 py-1.5 rounded-full flex items-center gap-2 border border-white/30 text-white font-bold text-sm">
                <Crown size={16} fill="currentColor" className="text-yellow-300" /> Premium Member
             </div>
          )}
        </div>

        {/* Profile Info */}
        <div className="px-8 pb-8 relative">
          <div className="flex flex-col md:flex-row gap-6 items-end -mt-16 mb-6">
            <div className="w-32 h-32 rounded-3xl bg-white p-2 shadow-lg rotate-3 transition-transform hover:rotate-0">
               <div className="w-full h-full bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400">
                  <User size={64} />
               </div>
            </div>
            <div className="flex-1 mb-2">
              <h1 className="text-3xl font-extrabold text-gray-900">{profile.name}</h1>
              <div className="flex flex-wrap items-center gap-4 text-gray-500 mt-2">
                 <span className="flex items-center gap-1.5"><Briefcase size={16} /> {profile.title}</span>
                 <span className="hidden md:inline text-gray-300">|</span>
                 <span className="flex items-center gap-1.5"><Shield size={16} /> {profile.organization}</span>
              </div>
            </div>
            <div className="mb-2">
               <button 
                  onClick={onLogout}
                  className="flex items-center gap-2 px-5 py-2.5 border border-red-200 text-red-600 bg-red-50 hover:bg-red-100 hover:border-red-300 rounded-xl font-medium transition-colors"
               >
                  <LogOut size={18} /> Đăng Xuất
               </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
             {/* Stat 1 */}
             <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100">
                <div className="flex items-center gap-3 mb-2">
                   <div className="bg-blue-100 p-2 rounded-lg text-blue-600">
                      <Clock size={20} />
                   </div>
                   <span className="text-sm font-semibold text-gray-500">Lịch Sử Kiểm Duyệt</span>
                </div>
                <div className="text-2xl font-bold text-gray-800">{historyCount} <span className="text-sm font-normal text-gray-400">tài liệu</span></div>
             </div>

             {/* Stat 2 */}
             <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100">
                <div className="flex items-center gap-3 mb-2">
                   <div className={`p-2 rounded-lg ${profile.isPremium ? 'bg-purple-100 text-purple-600' : 'bg-gray-200 text-gray-600'}`}>
                      <Award size={20} />
                   </div>
                   <span className="text-sm font-semibold text-gray-500">Loại Tài Khoản</span>
                </div>
                <div className="text-2xl font-bold text-gray-800">
                   {profile.isPremium ? 'Premium' : 'Miễn Phí'} 
                   {!profile.isPremium && <span className="text-xs font-medium text-blue-500 ml-2 cursor-pointer hover:underline">Nâng cấp?</span>}
                </div>
             </div>

             {/* Stat 3 */}
             <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100">
                <div className="flex items-center gap-3 mb-2">
                   <div className="bg-emerald-100 p-2 rounded-lg text-emerald-600">
                      <Mail size={20} />
                   </div>
                   <span className="text-sm font-semibold text-gray-500">Trạng Thái Email</span>
                </div>
                <div className="text-2xl font-bold text-gray-800">Đã Xác Thực</div>
             </div>
          </div>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-100 rounded-2xl p-6">
         <h3 className="text-lg font-bold text-blue-800 mb-2">Thông tin bảo mật</h3>
         <p className="text-blue-700 text-sm mb-4">
            Tài khoản của bạn được bảo vệ bởi các tiêu chuẩn bảo mật cao nhất. Chúng tôi không chia sẻ thông tin cá nhân của bạn với bên thứ ba.
            Dữ liệu kiểm duyệt được lưu trữ cục bộ trên trình duyệt của bạn (Local Storage) để đảm bảo quyền riêng tư.
         </p>
         <div className="text-xs text-blue-400 uppercase tracking-widest font-bold">DocuMind ID: {Date.now().toString(36).toUpperCase()}</div>
      </div>
    </div>
  );
};