import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { AnalysisResult, UserProfile } from '../types';

// URL font hỗ trợ tiếng Việt (Roboto Regular, Medium, Italic)
const FONT_URL = 'https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.1.66/fonts/Roboto/Roboto-Regular.ttf';
const FONT_BOLD_URL = 'https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.1.66/fonts/Roboto/Roboto-Medium.ttf';
const FONT_ITALIC_URL = 'https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.1.66/fonts/Roboto/Roboto-Italic.ttf';

// Helper to convert ArrayBuffer to binary string (browser compatible replacement for Buffer)
function arrayBufferToBinaryString(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return binary;
}

// Hàm tải font
async function loadFonts(doc: jsPDF) {
  try {
    // Tải song song cả 3 loại font: Thường, Đậm, Nghiêng
    const [regular, bold, italic] = await Promise.all([
      fetch(FONT_URL).then(res => res.arrayBuffer()),
      fetch(FONT_BOLD_URL).then(res => res.arrayBuffer()),
      fetch(FONT_ITALIC_URL).then(res => res.arrayBuffer())
    ]);

    doc.addFileToVFS('Roboto-Regular.ttf', arrayBufferToBinaryString(regular));
    doc.addFileToVFS('Roboto-Bold.ttf', arrayBufferToBinaryString(bold));
    doc.addFileToVFS('Roboto-Italic.ttf', arrayBufferToBinaryString(italic));

    doc.addFont('Roboto-Regular.ttf', 'Roboto', 'normal');
    doc.addFont('Roboto-Bold.ttf', 'Roboto', 'bold');
    doc.addFont('Roboto-Italic.ttf', 'Roboto', 'italic');
    
    return true;
  } catch (error) {
    console.error("Lỗi tải font tiếng Việt:", error);
    return false; // Fallback về font mặc định nếu lỗi
  }
}

// --- MAIN GENERATION FUNCTION ---

const createPDFDoc = async (
  fileName: string,
  analysis: AnalysisResult,
  userProfile: UserProfile
): Promise<jsPDF> => {
  const doc = new jsPDF();
  
  // Tải font tiếng Việt
  const fontLoaded = await loadFonts(doc);
  const fontName = fontLoaded ? 'Roboto' : 'helvetica';

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  const contentWidth = pageWidth - margin * 2;

  // --- MÀU SẮC & STYLE CHUNG ---
  const COLOR_BLACK = [0, 0, 0]; // Đen tuyệt đối cho nét vẽ
  const COLOR_TEXT_MAIN = [33, 37, 41]; // Gần đen cho văn bản (#212529)
  const COLOR_PRIMARY = [13, 110, 253]; // Xanh dương đậm (#0d6efd)
  const COLOR_TABLE_HEAD = [241, 243, 245]; // Xám rất nhạt cho header bảng
  const COLOR_DARK_RED = [160, 0, 0]; // Đỏ đậm thẫm cho tiêu đề chính

  // --- HEADER: QUỐC HIỆU & TIÊU NGỮ ---
  let currentY = 15;
  
  // Cột trái: Đơn vị chủ quản
  doc.setFont(fontName, 'bold');
  doc.setFontSize(10);
  doc.setTextColor(COLOR_TEXT_MAIN[0], COLOR_TEXT_MAIN[1], COLOR_TEXT_MAIN[2]);
  doc.text(userProfile.organization.toUpperCase(), margin, currentY);
  
  doc.setFont(fontName, 'normal');
  doc.setFontSize(9);
  doc.text("Số: " + Date.now().toString().slice(-6) + "/BC-KDTL", margin, currentY + 5);

  // Cột phải: Quốc hiệu
  doc.setFont(fontName, 'bold');
  doc.setFontSize(10);
  doc.text("CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM", pageWidth - margin, currentY, { align: 'right' });
  doc.setFont(fontName, 'bold'); 
  doc.setFontSize(10);
  doc.text("Độc lập - Tự do - Hạnh phúc", pageWidth - margin, currentY + 5, { align: 'right' });
  
  // Đường gạch chân tiêu ngữ (Đậm hơn)
  const mottoWidth = doc.getTextWidth("Độc lập - Tự do - Hạnh phúc");
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.5); // Nét đậm hơn chút
  doc.line(pageWidth - margin - mottoWidth, currentY + 7, pageWidth - margin, currentY + 7);

  currentY += 25;

  // --- TITLE ---
  doc.setFont(fontName, 'bold');
  doc.setFontSize(16);
  // Sử dụng màu đỏ đậm thẫm
  doc.setTextColor(COLOR_DARK_RED[0], COLOR_DARK_RED[1], COLOR_DARK_RED[2]);
  doc.text("BÁO CÁO KIỂM DUYỆT TÀI LIỆU", pageWidth / 2, currentY, { align: 'center' });
  
  // Đường kẻ trang trí dưới tiêu đề (cùng màu đỏ đậm)
  doc.setDrawColor(COLOR_DARK_RED[0], COLOR_DARK_RED[1], COLOR_DARK_RED[2]);
  doc.setLineWidth(1);
  doc.line(pageWidth / 2 - 40, currentY + 3, pageWidth / 2 + 40, currentY + 3);

  currentY += 10;
  doc.setFont(fontName, 'normal');
  doc.setFontSize(10);
  doc.setTextColor(COLOR_TEXT_MAIN[0], COLOR_TEXT_MAIN[1], COLOR_TEXT_MAIN[2]);
  doc.text(`Ngày báo cáo: ${new Date().toLocaleDateString('vi-VN')}`, pageWidth / 2, currentY, { align: 'center' });

  currentY += 12;

  // --- INFO TABLE & SCORE ---
  
  autoTable(doc, {
    startY: currentY,
    theme: 'grid', // Dùng theme grid để có viền ô
    head: [[
      { content: 'THÔNG TIN TÀI LIỆU', styles: { halign: 'center' } },
      { content: 'KẾT QUẢ TỔNG QUAN', styles: { halign: 'center' } }
    ]],
    body: [
      [
        { 
          content: `Tên tài liệu: ${fileName}\nMôn/Lĩnh vực: ${analysis.subject}\nNgười kiểm duyệt: ${userProfile.name}\nChức danh: ${userProfile.title}`,
          styles: { halign: 'left', valign: 'middle' } 
        },
        { 
          content: `${analysis.score}/100\n${analysis.overallVerdict.toUpperCase()}`,
          styles: { 
            halign: 'center', 
            valign: 'middle', 
            fontSize: 16, 
            fontStyle: 'bold', 
            textColor: COLOR_DARK_RED // Dùng màu đỏ đậm cho kết quả luôn
          } 
        }
      ]
    ],
    // Style chung cho bảng này để đậm nét
    styles: { 
      font: fontName, 
      fontSize: 10, 
      cellPadding: 5,
      textColor: COLOR_TEXT_MAIN, // Chữ đen rõ
      lineColor: [0, 0, 0], // Viền đen tuyệt đối
      lineWidth: 0.1, // Độ dày nét viền
    },
    headStyles: {
      fillColor: COLOR_TABLE_HEAD,
      textColor: [0, 0, 0],
      fontStyle: 'bold',
      lineColor: [0, 0, 0],
      lineWidth: 0.1
    },
    columnStyles: {
      0: { cellWidth: contentWidth * 0.65 },
      1: { cellWidth: contentWidth * 0.35 }
    },
    margin: { left: margin, right: margin }
  });

  // @ts-ignore
  currentY = doc.lastAutoTable.finalY + 12;

  // --- TÓM TẮT ---
  doc.setFont(fontName, 'bold');
  doc.setFontSize(11);
  doc.setTextColor(0, 0, 0);
  doc.text("I. TÓM TẮT NỘI DUNG", margin, currentY);
  currentY += 2;

  // Vẽ khung cho tóm tắt thay vì table đơn điệu
  const summaryText = doc.splitTextToSize(analysis.summary, contentWidth - 6);
  const summaryHeight = summaryText.length * 5 + 6; // Tính chiều cao khung
  
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.1);
  doc.rect(margin, currentY, contentWidth, summaryHeight); // Khung viền đen
  
  doc.setFont(fontName, 'normal');
  doc.setFontSize(10);
  doc.setTextColor(COLOR_TEXT_MAIN[0], COLOR_TEXT_MAIN[1], COLOR_TEXT_MAIN[2]);
  doc.text(summaryText, margin + 3, currentY + 5);
  
  currentY += summaryHeight + 10;

  // --- ƯU ĐIỂM & NHƯỢC ĐIỂM ---
  doc.setFont(fontName, 'bold');
  doc.setFontSize(11);
  doc.setTextColor(0, 0, 0);
  doc.text("II. PHÂN TÍCH CHI TIẾT", margin, currentY);
  currentY += 4;

  const maxRows = Math.max(analysis.pros.length, analysis.cons.length);
  const comparisonBody = [];
  for (let i = 0; i < maxRows; i++) {
    comparisonBody.push([
      analysis.pros[i] ? `+ ${analysis.pros[i]}` : '',
      analysis.cons[i] ? `- ${analysis.cons[i]}` : ''
    ]);
  }

  autoTable(doc, {
    startY: currentY,
    head: [[
      { content: 'ƯU ĐIỂM', styles: { textColor: [25, 135, 84], halign: 'center', fontStyle: 'bold' } }, // Green Text
      { content: 'HẠN CHẾ & NHƯỢC ĐIỂM', styles: { textColor: [220, 53, 69], halign: 'center', fontStyle: 'bold' } } // Red Text
    ]],
    body: comparisonBody,
    theme: 'grid',
    styles: { 
      font: fontName, 
      fontSize: 10, 
      cellPadding: 4, 
      valign: 'top',
      textColor: COLOR_TEXT_MAIN,
      lineColor: [0, 0, 0], // Viền đen
      lineWidth: 0.1 
    },
    headStyles: {
      fillColor: [255, 255, 255], // Nền trắng để làm nổi bật chữ màu
      lineColor: [0, 0, 0],
      lineWidth: 0.1
    },
    columnStyles: {
      0: { cellWidth: contentWidth / 2 },
      1: { cellWidth: contentWidth / 2 }
    },
    margin: { left: margin, right: margin },
    showHead: 'firstPage'
  });

  // @ts-ignore
  currentY = doc.lastAutoTable.finalY + 10;

  // --- NHẬN XÉT CHUYÊN SÂU ---
  if (currentY > pageHeight - 60) {
    doc.addPage();
    currentY = 20;
  }

  autoTable(doc, {
    startY: currentY,
    head: [[
      { content: 'TIÊU CHÍ', styles: { halign: 'left' } },
      { content: 'NHẬN XÉT & KHUYẾN NGHỊ', styles: { halign: 'left' } }
    ]],
    body: [
      [
        { content: 'NỘI DUNG\nCHUYÊN MÔN', styles: { fontStyle: 'bold', cellWidth: 35, valign: 'middle' } },
        analysis.contentFeedback
      ],
      [
        { content: 'THIẾT KẾ &\nTRÌNH BÀY', styles: { fontStyle: 'bold', cellWidth: 35, valign: 'middle' } },
        analysis.designFeedback
      ]
    ],
    theme: 'grid',
    styles: { 
      font: fontName, 
      fontSize: 10, 
      cellPadding: 5, 
      valign: 'top',
      textColor: COLOR_TEXT_MAIN,
      lineColor: [0, 0, 0],
      lineWidth: 0.1
    },
    headStyles: {
      fillColor: COLOR_TABLE_HEAD,
      textColor: [0, 0, 0],
      fontStyle: 'bold',
      lineColor: [0, 0, 0],
      lineWidth: 0.1
    },
    margin: { left: margin, right: margin }
  });

  // @ts-ignore
  currentY = doc.lastAutoTable.finalY + 15;

  // --- CHỮ KÝ & CON DẤU ---
  if (currentY > pageHeight - 50) {
    doc.addPage();
    currentY = 20;
  }

  const signX = pageWidth - 85;
  
  doc.setFont(fontName, 'bold');
  doc.setFontSize(11);
  doc.setTextColor(0, 0, 0);
  doc.text("NGƯỜI KIỂM DUYỆT", signX + 25, currentY, { align: 'center' });
  
  doc.setFont(fontName, 'italic');
  doc.setFontSize(9);
  doc.text("(Ký, đóng dấu và ghi rõ họ tên)", signX + 25, currentY + 4, { align: 'center' });

  // Vẽ khung dấu (Thiết kế lại cho giống thật hơn)
  const stampY = currentY + 10;
  const stampColor = [204, 0, 0]; // Đỏ đậm hơn
  
  doc.setDrawColor(stampColor[0], stampColor[1], stampColor[2]);
  doc.setLineWidth(1.5); // Viền ngoài dày
  doc.rect(signX, stampY, 50, 32); 
  
  doc.setLineWidth(0.5); // Viền trong mảnh
  doc.rect(signX + 3, stampY + 3, 44, 26); 

  doc.setTextColor(stampColor[0], stampColor[1], stampColor[2]);
  doc.setFont(fontName, 'bold');
  doc.setFontSize(11);
  doc.text("ĐÃ KIỂM DUYỆT", signX + 25, stampY + 13, { align: 'center' });
  
  doc.setFontSize(8);
  // Cắt tên tổ chức nếu quá dài
  const orgName = userProfile.organization.toUpperCase();
  const splitOrg = doc.splitTextToSize(orgName, 40);
  doc.text(splitOrg, signX + 25, stampY + 20, { align: 'center' });

  // Chữ ký tên (Mô phỏng chữ ký tay)
  doc.setTextColor(0, 51, 153); // Xanh mực bút bi
  doc.setFont(fontName, 'bold'); // Hoặc dùng font script nếu có, ở đây dùng bold italic tạm
  doc.setFontSize(12);
  doc.text(userProfile.name, signX + 25, stampY + 45, { align: 'center' });


  // --- FOOTER ---
  const pageCount = doc.internal.pages.length - 1;
  for(let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(100); // Màu xám nhẹ cho footer để không tranh chấp nội dung
    doc.setFont(fontName, 'normal');
    
    // Line separator footer
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.1);
    doc.line(margin, pageHeight - 12, pageWidth - margin, pageHeight - 12);

    doc.text(
      `Hệ thống DocuMind AI - Trang ${i}/${pageCount}`,
      pageWidth / 2,
      pageHeight - 7,
      { align: 'center' }
    );
  }

  return doc;
};

export const generatePDFReport = async (
  fileName: string,
  analysis: AnalysisResult,
  userProfile: UserProfile
) => {
  const doc = await createPDFDoc(fileName, analysis, userProfile);
  doc.save(`Bao_cao_${fileName}.pdf`);
};

export const getPDFBlobUrl = async (
  fileName: string,
  analysis: AnalysisResult,
  userProfile: UserProfile
) => {
  const doc = await createPDFDoc(fileName, analysis, userProfile);
  return doc.output('bloburl');
};