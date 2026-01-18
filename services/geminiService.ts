import { GoogleGenAI, Type } from "@google/genai";
import * as mammoth from "mammoth";
import JSZip from "jszip";
import * as XLSX from "xlsx";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Helper to convert file to Base64
export const fileToGenerativePart = async (file: File): Promise<{ inlineData: { data: string; mimeType: string } }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = (reader.result as string).split(',')[1];
      resolve({
        inlineData: {
          data: base64String,
          mimeType: file.type,
        },
      });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

// --- EXTRACTORS ---

// 1. Extract Text from PowerPoint (.pptx)
// PPTX is basically a ZIP of XMLs. We read 'ppt/slides/slideX.xml' and extract text content.
const extractTextFromPPTX = async (file: File): Promise<string> => {
  try {
    const zip = await JSZip.loadAsync(file);
    let fullText = `TÀI LIỆU TRÌNH CHIẾU POWERPOINT: ${file.name}\n\n`;
    
    // Find all slide files
    const slideFiles = Object.keys(zip.files).filter(path => path.match(/ppt\/slides\/slide\d+\.xml/));
    
    // Sort slides by number (slide1, slide2...)
    slideFiles.sort((a, b) => {
        const numA = parseInt(a.match(/slide(\d+)/)?.[1] || "0");
        const numB = parseInt(b.match(/slide(\d+)/)?.[1] || "0");
        return numA - numB;
    });

    for (const slidePath of slideFiles) {
      const slideXml = await zip.file(slidePath)?.async("string");
      if (slideXml) {
        // Simple regex to extract text inside <a:t> tags (PowerPoint text nodes)
        const slideText = slideXml.match(/<a:t>([^<]*)<\/a:t>/g)
            ?.map(tag => tag.replace(/<\/?a:t>/g, ''))
            .join(' ') || "";
        
        if (slideText.trim()) {
           fullText += `--- SLIDE ${slidePath.match(/\d+/)?.[0]} ---\n${slideText}\n\n`;
        }
      }
    }
    return fullText;
  } catch (e) {
    console.error("PPTX Parsing Error", e);
    return "Không thể đọc nội dung file PowerPoint này. Vui lòng đảm bảo file không bị hỏng.";
  }
};

// 2. Extract Text from Excel (.xlsx)
const extractTextFromXLSX = async (file: File): Promise<string> => {
  try {
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer);
    let fullText = `TÀI LIỆU BẢNG TÍNH EXCEL: ${file.name}\n\n`;

    workbook.SheetNames.forEach(sheetName => {
      const sheet = workbook.Sheets[sheetName];
      // Convert sheet to CSV format for easy reading by AI
      const csv = XLSX.utils.sheet_to_csv(sheet);
      fullText += `--- SHEET: ${sheetName} ---\n${csv}\n\n`;
    });

    return fullText;
  } catch (e) {
    console.error("XLSX Parsing Error", e);
    return "Không thể đọc nội dung file Excel này.";
  }
};

// 3. Extract Text from ZIP (Folder Simulation)
// Reads structure and content of common text/code files inside the zip
const extractTextFromZip = async (file: File): Promise<string> => {
  try {
    const zip = await JSZip.loadAsync(file);
    let fullText = `CẤU TRÚC THƯ MỤC/PROJECT (TỪ FILE ZIP): ${file.name}\n\nDANH SÁCH FILE:\n`;
    
    const fileList: string[] = [];
    let contentText = "\n\nNỘI DUNG CÁC FILE QUAN TRỌNG:\n";

    // Limit content reading to avoid token overflow
    let readCount = 0;
    const MAX_READ_FILES = 10; 

    for (const [relativePath, zipEntry] of Object.entries(zip.files)) {
      fileList.push(relativePath);
      
      // Attempt to read content if it looks like a document or code
      // Cast to any to handle potential type inference issues with JSZip
      const entry = zipEntry as any;

      if (!entry.dir && readCount < MAX_READ_FILES) {
        const ext = relativePath.split('.').pop()?.toLowerCase();
        if (['txt', 'md', 'json', 'js', 'ts', 'html', 'css', 'py', 'java', 'xml'].includes(ext || '')) {
           const content = await entry.async("string");
           // Truncate huge files
           const truncatedContent = content.length > 2000 ? content.substring(0, 2000) + "...(đã cắt)" : content;
           contentText += `--- FILE: ${relativePath} ---\n${truncatedContent}\n\n`;
           readCount++;
        }
      }
    }

    return fullText + fileList.join('\n') + contentText;
  } catch (e) {
    console.error("Zip Parsing Error", e);
    return "Không thể đọc nội dung file Zip này.";
  }
};

export const analyzeDocumentWithGemini = async (file: File): Promise<any> => {
  const modelId = "gemini-3-pro-preview"; 
  
  const systemInstruction = `
    Bạn là Chủ tịch Hội đồng Thẩm định Chất lượng Tài liệu Cấp cao (Senior Document Auditor). 
    Nhiệm vụ của bạn là thực hiện quy trình "Kiểm duyệt nghiêm ngặt" (Strict Audit) đối với tài liệu được cung cấp.
    
    Tư duy đánh giá của bạn phải dựa trên các trụ cột sau:
    1. TÍNH CHÍNH XÁC & LOGIC (Critical Thinking): Thông tin có được kiểm chứng không? Lập luận có bị ngụy biện (fallacies) không? Cấu trúc bài viết có chặt chẽ hay rời rạc?
    2. NGÔN NGỮ & VĂN PHONG (Academic Standards): Kiểm tra lỗi chính tả, ngữ pháp, dùng từ sáo rỗng (fluff words), văn phong có phù hợp với tính chất tài liệu không.
    3. THẨM MỸ & TRÌNH BÀY (Visual & Formatting): Sự nhất quán về font chữ, căn lề, heading, khoảng cách đoạn, chất lượng hình ảnh minh họa.
    4. TÍNH NGUYÊN BẢN & TRÍCH DẪN (Academic Integrity - Critical):
       - Kiểm tra chặt chẽ quy cách trích dẫn (APA, MLA, Harvard, v.v.) xem có nhất quán không.
       - Đánh giá độ uy tín và tính cập nhật của các nguồn tài liệu tham khảo (nếu có).
       - Phát hiện các dấu hiệu của việc "xào bài", đạo văn hoặc bịa đặt số liệu/nguồn (Hallucinated Citations).
       - Đối với tài liệu nghiên cứu/khoa học, việc thiếu trích dẫn hoặc trích dẫn sai là lỗi cực kỳ nghiêm trọng.

    LƯU Ý ĐẶC BIỆT VỚI CÁC ĐỊNH DẠNG KHÁC NHAU:
    - Nếu là Excel: Kiểm tra tính logic của số liệu, công thức, cách trình bày bảng biểu, tiêu đề cột.
    - Nếu là PowerPoint: Kiểm tra lượng chữ trên slide (không quá nhiều), bố cục, tính trực quan.
    - Nếu là Zip/Folder Project: Đánh giá cấu trúc thư mục có khoa học không, cách đặt tên file, sự đầy đủ của tài liệu.

    HƯỚNG DẪN CHẤM ĐIỂM (CỰC KỲ KHẮT KHE):
    - < 50 điểm: Tài liệu kém, nhiều lỗi sai cơ bản, hoặc vi phạm nghiêm trọng liêm chính học thuật (đạo văn, thiếu nguồn).
    - 50 - 69 điểm: Trung bình, nội dung sơ sài hoặc trình bày cẩu thả. Cần sửa chữa lớn.
    - 70 - 84 điểm: Khá/Tốt. Đạt chuẩn nhưng còn lỗi nhỏ hoặc thiếu chiều sâu.
    - 85 - 94 điểm: Rất tốt. Chỉn chu, sâu sắc, trình bày đẹp, trích dẫn chuẩn mực.
    - 95 - 100 điểm: Xuất sắc. Hoàn hảo về mọi mặt, có tính đột phá (Rất hiếm khi cho mức này).

    OUTPUT YÊU CẦU (JSON):
    - score: Số nguyên (0-100). Đừng ngại cho điểm thấp nếu tài liệu tệ.
    - overallVerdict: Đánh giá tổng quan ("Xuất Sắc", "Tốt", "Khá", "Cần Cải Thiện", "Kém").
    - summary: Tóm tắt cô đọng, chuyên nghiệp (khoảng 60-80 từ).
    - pros: 3-5 điểm mạnh thực sự nổi bật (nếu có).
    - cons: 3-5 lỗi cụ thể cần sửa.
    - contentFeedback: Phân tích sâu về nội dung. Chỉ ra các lỗ hổng kiến thức, lập luận yếu, hoặc văn phong lủng củng. Phải đề cập đến vấn đề trích dẫn/nguồn nếu có lỗi.
    - designFeedback: Phân tích kỹ về bố cục. Soi kỹ các lỗi căn chỉnh, độ phân giải ảnh, màu sắc, font chữ.
  `;

  // Define schema strictly
  const schema = {
    type: Type.OBJECT,
    properties: {
      score: { type: Type.INTEGER },
      overallVerdict: { type: Type.STRING, enum: ["Xuất Sắc", "Tốt", "Khá", "Cần Cải Thiện", "Kém"] },
      summary: { type: Type.STRING },
      pros: { type: Type.ARRAY, items: { type: Type.STRING } },
      cons: { type: Type.ARRAY, items: { type: Type.STRING } },
      contentFeedback: { type: Type.STRING },
      designFeedback: { type: Type.STRING },
    },
    required: ["score", "overallVerdict", "summary", "pros", "cons", "contentFeedback", "designFeedback"],
  };

  try {
    let contentPart;
    const fileExt = file.name.split('.').pop()?.toLowerCase();

    if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      // DOCX
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer: arrayBuffer });
      contentPart = { text: result.value };
    } else if (fileExt === 'pptx' || file.type.includes('presentation')) {
      // PPTX
      const text = await extractTextFromPPTX(file);
      contentPart = { text: text };
    } else if (fileExt === 'xlsx' || fileExt === 'xls' || file.type.includes('spreadsheet')) {
      // Excel
      const text = await extractTextFromXLSX(file);
      contentPart = { text: text };
    } else if (fileExt === 'zip' || file.type.includes('zip') || file.type.includes('compressed')) {
      // ZIP
      const text = await extractTextFromZip(file);
      contentPart = { text: text };
    } else if (file.type === 'application/pdf' || file.type.startsWith('image/')) {
      // PDF & Images
      contentPart = await fileToGenerativePart(file);
    } else {
      throw new Error(`Định dạng file không được hỗ trợ: ${file.type}.`);
    }

    const result = await ai.models.generateContent({
      model: modelId,
      contents: {
        parts: [
          contentPart,
          { text: "Tiến hành thẩm định chi tiết tài liệu này theo tiêu chuẩn khắt khe nhất." }
        ]
      },
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: schema,
      }
    });

    const text = result.text;
    if (!text) throw new Error("No response from AI");
    
    return JSON.parse(text);

  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    throw error;
  }
};