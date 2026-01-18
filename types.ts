export interface UserProfile {
  id: string; // Unique ID for Supabase
  name: string;
  title: string;
  organization: string;
  signatureText: string;
  isPremium?: boolean; // New field for premium status
}

export interface AnalysisResult {
  score: number;
  subject: string; // Môn học/Lĩnh vực chuyên môn
  summary: string;
  pros: string[];
  cons: string[];
  designFeedback: string;
  contentFeedback: string;
  overallVerdict: "Xuất Sắc" | "Tốt" | "Khá" | "Cần Cải Thiện" | "Kém";
}

export interface HistoryItem {
  id: string;
  fileName: string;
  fileType: string;
  date: string;
  result: AnalysisResult;
}

export type ViewState = 'upload' | 'analyzing' | 'result' | 'history' | 'settings' | 'criteria' | 'profile';

export interface FileData {
  file: File;
  previewUrl?: string;
}