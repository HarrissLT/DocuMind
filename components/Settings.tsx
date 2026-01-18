import React from 'react';
import { UserProfile } from '../types';
import { Save } from 'lucide-react';

interface SettingsProps {
  profile: UserProfile;
  onSave: (profile: UserProfile) => void;
}

export const Settings: React.FC<SettingsProps> = ({ profile, onSave }) => {
  const [formData, setFormData] = React.useState<UserProfile>(profile);
  const [saved, setSaved] = React.useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setSaved(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Cài Đặt Hồ Sơ Kiểm Duyệt</h2>
      <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Họ và Tên Người Kiểm Duyệt</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Chức Danh / Học Vị</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tổ Chức / Đơn Vị</label>
            <input
              type="text"
              name="organization"
              value={formData.organization}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
            />
            <p className="text-xs text-gray-500 mt-1">Tên tổ chức sẽ xuất hiện trên con dấu đỏ trong báo cáo.</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Chữ Ký Mặc Định (Text)</label>
            <input
              type="text"
              name="signatureText"
              value={formData.signatureText}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
            />
          </div>

          <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
            {saved ? (
               <span className="text-emerald-600 font-medium text-sm animate-pulse">Đã lưu thành công!</span>
            ) : <span></span>}
            <button
              type="submit"
              className="flex items-center space-x-2 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition shadow-lg shadow-blue-200"
            >
              <Save size={18} />
              <span>Lưu Thay Đổi</span>
            </button>
          </div>
        </form>
      </div>
      
      <div className="mt-8 bg-blue-50 p-6 rounded-xl border border-blue-100">
         <h4 className="font-bold text-blue-800 mb-2">Lưu ý</h4>
         <p className="text-sm text-blue-700">Các thông tin này sẽ được tự động điền vào bản báo cáo PDF. Vui lòng điền chính xác để đảm bảo tính chuyên nghiệp của tài liệu kiểm duyệt.</p>
      </div>
    </div>
  );
};