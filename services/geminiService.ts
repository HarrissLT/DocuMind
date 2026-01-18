import { GoogleGenAI, Type } from "@google/genai";
import * as mammoth from "mammoth";
import JSZip from "jszip";
import * as XLSX from "xlsx";

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
const extractTextFromZip = async (file: File): Promise<string> => {
  try {
    const zip = await JSZip.loadAsync(file);
    let fullText = `CẤU TRÚC THƯ MỤC/PROJECT (TỪ FILE ZIP): ${file.name}\n\nDANH SÁCH FILE:\n`;
    
    const fileList: string[] = [];
    let contentText = "\n\nNỘI DUNG CÁC FILE QUAN TRỌNG:\n";

    let readCount = 0;
    const MAX_READ_FILES = 15; // Increased limit slightly

    for (const [relativePath, zipEntry] of Object.entries(zip.files)) {
      fileList.push(relativePath);
      
      const entry = zipEntry as any;

      if (!entry.dir && readCount < MAX_READ_FILES) {
        const ext = relativePath.split('.').pop()?.toLowerCase();
        if (['txt', 'md', 'json', 'js', 'ts', 'html', 'css', 'py', 'java', 'xml', 'c', 'cpp', 'h'].includes(ext || '')) {
           const content = await entry.async("string");
           const truncatedContent = content.length > 3000 ? content.substring(0, 3000) + "...(đã cắt)" : content;
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
    Bạn là một CHUYÊN GIA KIỂM DUYỆT TÀI LIỆU (Document Auditor) cấp cao với 20 năm kinh nghiệm.
    Nhiệm vụ: Thẩm định chất lượng tài liệu giáo dục/chuyên môn một cách KHẮT KHE, CHÍNH XÁC và CÔNG TÂM.

    QUY TRÌNH PHÂN TÍCH 5 BƯỚC:

    1. NHẬN DIỆN MÔN HỌC (Subject Identification):
       - Xác định chính xác môn học (Toán, Lý, Hóa, Văn, Anh, Sử, Địa, GDCD, Tin học, v.v.).
       - Xác định trình độ (Tiểu học, THCS, THPT, Đại học).
       - *Lưu ý*: Nếu tài liệu là đề thi, giáo án, hay bài giảng, hãy áp dụng tiêu chuẩn sư phạm tương ứng.

    2. KIỂM TRA TÍNH CHÍNH XÁC (Accuracy Audit):
       - Toán/Lý/Hóa/Tin: Kiểm tra công thức, đáp số, logic giải toán, syntax code. Phát hiện lỗi sai cơ bản.
       - Văn/Sử/Địa: Kiểm tra sự thật lịch sử, kiến thức địa lý, chuẩn mực chính trị/xã hội, lỗi diễn đạt.
       - Tiếng Anh: Kiểm tra ngữ pháp (Grammar), từ vựng (Vocabulary), cấu trúc câu.

    3. ĐÁNH GIÁ SƯ PHẠM (Pedagogical Evaluation):
       - Nội dung có phù hợp với trình độ không?
       - Cách diễn giải có dễ hiểu, gãy gọn không?
       - Có tính gợi mở tư duy cho người học không?

    4. HÌNH THỨC & TRÌNH BÀY (Format & Design):
       - Lỗi typo, căn lề, font chữ, chất lượng hình ảnh minh họa.
       - Bố cục có thoáng, dễ nhìn không?

    5. LIÊM CHÍNH HỌC THUẬT (Academic Integrity):
       - Kiểm tra trích dẫn nguồn (nếu có).
       - Phát hiện dấu hiệu sao chép sơ sài.

    HỆ THỐNG CHẤM ĐIỂM (Scoring Rubric):
    - 0-49 (Kém): Sai kiến thức cơ bản, trình bày cẩu thả. Không thể sử dụng.
    - 50-69 (Cần Cải Thiện): Đúng kiến thức nhưng diễn đạt lủng củng, trình bày xấu. Cần sửa nhiều.
    - 70-84 (Khá/Tốt): Đạt chuẩn, còn vài lỗi nhỏ (typo, formatting). Dùng được ngay.
    - 85-94 (Rất Tốt): Kiến thức chuẩn xác, trình bày đẹp, sư phạm tốt.
    - 95-100 (Xuất Sắc): Hoàn hảo, sáng tạo, truyền cảm hứng.

    OUTPUT JSON FORMAT:
    {
      "score": number (0-100),
      "subject": string (Ví dụ: "Toán học - Lớp 12", "Ngữ Văn - THPT"),
      "overallVerdict": "Xuất Sắc" | "Tốt" | "Khá" | "Cần Cải Thiện" | "Kém",
      "summary": string (Tóm tắt 60-80 từ về nội dung và chất lượng),
      "pros": string[] (3-5 điểm mạnh),
      "cons": string[] (3-5 điểm yếu cụ thể),
      "contentFeedback": string (Nhận xét chi tiết về kiến thức chuyên môn),
      "designFeedback": string (Nhận xét chi tiết về trình bày)
    }
  `;

  // Define schema
  const schema = {
    type: Type.OBJECT,
    properties: {
      score: { type: Type.INTEGER },
      subject: { type: Type.STRING },
      overallVerdict: { type: Type.STRING, enum: ["Xuất Sắc", "Tốt", "Khá", "Cần Cải Thiện", "Kém"] },
      summary: { type: Type.STRING },
      pros: { type: Type.ARRAY, items: { type: Type.STRING } },
      cons: { type: Type.ARRAY, items: { type: Type.STRING } },
      contentFeedback: { type: Type.STRING },
      designFeedback: { type: Type.STRING },
    },
    required: ["score", "subject", "overallVerdict", "summary", "pros", "cons", "contentFeedback", "designFeedback"],
  };

  try {
    // 1. Check API Key inside try block to ensure it's caught
    if (!process.env.API_KEY) {
       throw new Error("Chưa cấu hình API Key. Vui lòng kiểm tra file .env hoặc biến môi trường.");
    }

    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    // 2. Prepare content
    let contentPart;
    const fileExt = file.name.split('.').pop()?.toLowerCase();

    if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer: arrayBuffer });
      contentPart = { text: result.value };
    } else if (fileExt === 'pptx' || file.type.includes('presentation')) {
      const text = await extractTextFromPPTX(file);
      contentPart = { text: text };
    } else if (fileExt === 'xlsx' || fileExt === 'xls' || file.type.includes('spreadsheet')) {
      const text = await extractTextFromXLSX(file);
      contentPart = { text: text };
    } else if (fileExt === 'zip' || file.type.includes('zip') || file.type.includes('compressed')) {
      const text = await extractTextFromZip(file);
      contentPart = { text: text };
    } else if (file.type === 'application/pdf' || file.type.startsWith('image/')) {
      contentPart = await fileToGenerativePart(file);
    } else {
      throw new Error(`Định dạng file không được hỗ trợ: ${file.type}.`);
    }

    // 3. Call AI
    const result = await ai.models.generateContent({
      model: modelId,
      contents: {
        parts: [
          contentPart,
          { text: "Hãy phân tích và thẩm định tài liệu này theo vai trò Chuyên gia Kiểm duyệt." }
        ]
      },
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: schema,
      }
    });

    const text = result.text;
    if (!text) throw new Error("AI không trả về kết quả.");
    
    return JSON.parse(text);

  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    // Re-throw to let UI handle it
    throw error;
  }
};