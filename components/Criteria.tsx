import React from 'react';
import { BookOpen, Layout, Target, ShieldCheck, AlertTriangle, PenTool } from 'lucide-react';

export const Criteria: React.FC = () => {
  const criteriaList = [
    {
      icon: <BookOpen className="text-blue-600" size={32} />,
      title: "Tính Chính Xác & Logic (40%)",
      items: [
        "Tính xác thực của dữ liệu và nguồn trích dẫn (Citations).",
        "Mạch lạc trong tư duy biện luận, không mắc lỗi ngụy biện.",
        "Độ sâu chuyên môn phù hợp với tiêu chuẩn ngành/giáo dục.",
        "Sự cập nhật của thông tin (không sử dụng kiến thức lỗi thời)."
      ]
    },
    {
      icon: <PenTool className="text-purple-600" size={32} />,
      title: "Ngôn Ngữ & Văn Phong (30%)",
      items: [
        "Chính tả và Ngữ pháp phải tuyệt đối chuẩn xác.",
        "Văn phong học thuật/chuyên nghiệp, tránh văn nói hoặc từ sáo rỗng.",
        "Cấu trúc câu gãy gọn, rõ nghĩa, không lan man.",
        "Sử dụng thuật ngữ chuyên ngành chính xác."
      ]
    },
    {
      icon: <Layout className="text-pink-600" size={32} />,
      title: "Quy Chuẩn Trình Bày (30%)",
      items: [
        "Tính nhất quán trong Font chữ, Heading, Bullet points.",
        "Khoảng cách dòng (Leading) và đoạn văn (Spacing) hợp lý.",
        "Chất lượng hình ảnh minh họa (Độ nét, chú thích ảnh).",
        "Bố cục thị giác (Visual Hierarchy) dẫn dắt người đọc tốt."
      ]
    }
  ];

  return (
    <div className="space-y-8 animate-[fadeIn_0.5s_ease-out]">
      <div className="text-center max-w-3xl mx-auto mb-12">
         <div className="inline-flex items-center gap-2 bg-red-50 text-red-700 px-4 py-1.5 rounded-full text-sm font-bold mb-4 border border-red-100">
            <AlertTriangle size={16} /> Chế độ kiểm duyệt: NGHIÊM NGẶT (STRICT MODE)
         </div>
         <h2 className="text-3xl font-extrabold text-gray-900 mb-4">Bộ Tiêu Chí Thẩm Định DocuMind</h2>
         <p className="text-gray-500 leading-relaxed">
           Hệ thống áp dụng chuẩn đánh giá đa chiều, kết hợp giữa quy định soạn thảo văn bản hành chính/khoa học và các nguyên tắc thiết kế thông tin hiện đại. Mọi lỗi nhỏ đều sẽ bị trừ điểm để đảm bảo chất lượng đầu ra hoàn hảo nhất.
         </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {criteriaList.map((c, idx) => (
          <div key={idx} className="bg-white p-8 rounded-2xl shadow-xl shadow-gray-100 border border-gray-100 hover:-translate-y-2 transition-transform duration-300 group">
            <div className="bg-gray-50 w-16 h-16 rounded-2xl flex items-center justify-center mb-6 shadow-inner group-hover:scale-110 transition-transform duration-300">
              {c.icon}
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-4 border-b pb-3 border-gray-100">{c.title}</h3>
            <ul className="space-y-4">
              {c.items.map((item, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-gray-600">
                  <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-1.5 shrink-0 group-hover:bg-blue-600 transition-colors"></span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-2xl p-8 text-white shadow-2xl flex flex-col md:flex-row items-center justify-between gap-8 mt-8">
         <div className="space-y-4">
            <h3 className="text-2xl font-bold flex items-center gap-3">
              <ShieldCheck className="text-emerald-400" size={32} /> 
              Cam Kết Chất Lượng
            </h3>
            <p className="text-slate-300 max-w-xl leading-relaxed">
              DocuMind không chỉ chấm điểm, chúng tôi đóng vai trò như một thành viên hội đồng phản biện. AI sẽ phân tích sâu vào cấu trúc lập luận (Argument Structure) và phát hiện các lỗi ngụy biện logic (Logical Fallacies) mà các công cụ kiểm tra thông thường hay bỏ qua.
            </p>
         </div>
         <div className="grid grid-cols-2 gap-4 text-center">
            <div className="bg-white/10 p-4 rounded-xl backdrop-blur-sm">
                <div className="text-3xl font-bold text-emerald-400">99.8%</div>
                <div className="text-xs text-slate-400 uppercase tracking-wider mt-1">Độ Chính Xác</div>
            </div>
            <div className="bg-white/10 p-4 rounded-xl backdrop-blur-sm">
                <div className="text-3xl font-bold text-blue-400">ISO</div>
                <div className="text-xs text-slate-400 uppercase tracking-wider mt-1">Tiêu Chuẩn</div>
            </div>
         </div>
      </div>
    </div>
  );
};