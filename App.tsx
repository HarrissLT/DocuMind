import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { FileUpload } from './components/FileUpload';
import { AnalysisResultView } from './components/AnalysisResultView';
import { History } from './components/History';
import { Settings } from './components/Settings';
import { Criteria } from './components/Criteria';
import { ProfileView } from './components/ProfileView'; // Import
import { AnalyzingView } from './components/AnalyzingView';
import { UpgradeModal } from './components/UpgradeModal';
import { ViewState, FileData, AnalysisResult, HistoryItem, UserProfile } from './types';
import { analyzeDocumentWithGemini } from './services/geminiService';
import { Menu, X, CloudOff, Loader2, ShieldAlert } from 'lucide-react';
import { supabase, isSupabaseConfigured } from './services/supabaseClient';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewState>('upload');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [fileData, setFileData] = useState<FileData | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  
  // States for History & Profile
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  
  // Cloud Sync State
  const [cloudSyncStatus, setCloudSyncStatus] = useState<'active' | 'offline' | 'denied'>(
      isSupabaseConfigured() ? 'active' : 'offline'
  );
  
  const [userProfile, setUserProfile] = useState<UserProfile>(() => {
    const saved = localStorage.getItem('documind_profile');
    const parsed = saved ? JSON.parse(saved) : {};
    return {
      id: parsed.id || crypto.randomUUID(), // Generate UUID if missing
      name: parsed.name || "Nguyễn Văn A",
      title: parsed.title || "Chuyên viên Kiểm định",
      organization: parsed.organization || "Ban Kiểm Duyệt Tài Liệu Quốc Gia",
      signatureText: parsed.signatureText || "Đã ký duyệt",
      isPremium: parsed.isPremium || false
    };
  });

  // Save profile to local storage (keep profile local for fast access/offline)
  useEffect(() => {
    localStorage.setItem('documind_profile', JSON.stringify(userProfile));
  }, [userProfile]);

  // Fetch History: Hybrid approach (Load Local first, then Sync Cloud)
  useEffect(() => {
    const fetchHistory = async () => {
      // 1. Load from Local Storage immediately for instant UX
      const localSaved = localStorage.getItem('documind_history');
      if (localSaved) {
        try {
           setHistory(JSON.parse(localSaved));
        } catch (e) {
           console.error("Local history parse error", e);
        }
      }

      // 2. If Supabase is configured and not denied, fetch and sync
      if (isSupabaseConfigured() && cloudSyncStatus === 'active') {
        setIsLoadingHistory(true);
        try {
          const { data, error } = await supabase
            .from('history')
            .select('*')
            .eq('user_id', userProfile.id)
            .order('date', { ascending: false });

          if (error) {
             // Handle RLS Policy Error (42501) gracefully
             if (error.code === '42501') {
                 console.warn("Supabase RLS Policy blocked access. Switching to Local-Only mode.");
                 setCloudSyncStatus('denied');
             } else {
                 console.error('Supabase fetch error:', JSON.stringify(error, null, 2));
             }
             // Fallback to local data (already loaded)
          } else if (data && data.length > 0) {
             // Map database columns to frontend type
             const mappedHistory: HistoryItem[] = data.map(item => ({
               id: item.id,
               fileName: item.file_name,
               fileType: item.file_type,
               date: item.date,
               result: item.result
             }));
             
             // Update state with cloud data (Single Source of Truth)
             setHistory(mappedHistory);
             
             // Sync cloud data back to local storage for offline use next time
             localStorage.setItem('documind_history', JSON.stringify(mappedHistory));
          }
        } catch (err) {
          console.error('Supabase connection error:', err);
        } finally {
          setIsLoadingHistory(false);
        }
      }
    };

    fetchHistory();
  }, [userProfile.id, cloudSyncStatus]);

  const saveToHistory = async (item: HistoryItem) => {
    // 1. Update UI state immediately
    setHistory(prev => [item, ...prev]);

    // 2. Always save to LocalStorage (Backup/Offline)
    try {
        const currentHistory = JSON.parse(localStorage.getItem('documind_history') || '[]');
        localStorage.setItem('documind_history', JSON.stringify([item, ...currentHistory]));
    } catch (e) {
        console.error("Local storage error:", e);
    }

    // 3. Try saving to Supabase (if active)
    if (isSupabaseConfigured() && cloudSyncStatus === 'active') {
      try {
        const { error } = await supabase
          .from('history')
          .insert([
            {
              id: item.id,
              user_id: userProfile.id,
              file_name: item.fileName,
              file_type: item.fileType,
              date: item.date,
              result: item.result
            }
          ]);
        
        if (error) {
            if (error.code === '42501') {
                console.warn("Supabase RLS Policy blocked insert. Switching to Local-Only mode.");
                setCloudSyncStatus('denied');
            } else {
                console.error('Error saving to Supabase:', JSON.stringify(error, null, 2));
            }
        }
      } catch (err) {
        console.error('Supabase unexpected error:', err);
      }
    }
  };

  const clearAllHistory = async () => {
     if (window.confirm("Bạn có chắc chắn muốn xóa toàn bộ lịch sử?")) {
        setHistory([]);
        localStorage.removeItem('documind_history'); // Clear local
        
        if (isSupabaseConfigured() && cloudSyncStatus === 'active') {
            try {
                const { error } = await supabase
                    .from('history')
                    .delete()
                    .eq('user_id', userProfile.id);
                if (error) {
                    if (error.code === '42501') {
                        console.warn("Supabase RLS Policy blocked delete. Switching to Local-Only mode.");
                        setCloudSyncStatus('denied');
                    } else {
                        console.error('Error clearing Supabase history:', JSON.stringify(error, null, 2));
                    }
                    alert("Đã xóa dữ liệu trên thiết bị. Không thể xóa trên đám mây do giới hạn quyền truy cập.");
                }
            } catch (err) {
                console.error('Error clearing history:', err);
            }
        }
     }
  };

  const handleFileSelected = async (data: FileData) => {
    setFileData(data);
    setIsAnalyzing(true);
    setCurrentView('analyzing');

    try {
      const result = await analyzeDocumentWithGemini(data.file);
      setAnalysisResult(result);
      
      const newHistoryItem: HistoryItem = {
        id: crypto.randomUUID(),
        fileName: data.file.name,
        fileType: data.file.name.split('.').pop()?.toUpperCase() || 'FILE',
        date: new Date().toISOString(),
        result: result
      };
      
      await saveToHistory(newHistoryItem);
      setCurrentView('result');
    } catch (error) {
      console.error(error);
      alert("Có lỗi xảy ra trong quá trình phân tích AI. Vui lòng kiểm tra API Key hoặc thử lại.");
      setCurrentView('upload');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleReset = () => {
    setFileData(null);
    setAnalysisResult(null);
    setCurrentView('upload');
  };

  const handleUpgradeSuccess = () => {
    setUserProfile(prev => ({ ...prev, isPremium: true }));
    setShowUpgradeModal(false);
    alert("Chúc mừng! Tài khoản của bạn đã được nâng cấp lên Premium.");
  };

  const handleLogout = () => {
    if (window.confirm("Bạn có chắc chắn muốn đăng xuất?")) {
      localStorage.removeItem('documind_profile');
      localStorage.removeItem('documind_history'); 
      window.location.reload();
    }
  };

  const handleHistorySelect = (item: HistoryItem) => {
    setAnalysisResult(item.result);
    const dummyFile = new File([""], item.fileName, { type: "application/octet-stream" });
    setFileData({
      file: dummyFile,
      previewUrl: undefined 
    });
    setCurrentView('result');
  };

  const renderContent = () => {
    switch (currentView) {
      case 'upload':
        return (
          <div className="space-y-6 animate-[fadeIn_0.5s_ease-out]">
            <div className="text-center mb-10">
              <h2 className="text-4xl font-extrabold text-gray-900 mb-4 tracking-tight">
                Kiểm Duyệt Tài Liệu <span className="text-blue-600">Thông Minh</span>
              </h2>
              <p className="text-lg text-gray-500 max-w-2xl mx-auto">
                Sử dụng AI tiên tiến để đánh giá chất lượng nội dung và thiết kế của tài liệu giáo dục, khoa học. Nhanh chóng, chính xác và chuyên nghiệp.
              </p>
              
              {/* Status Indicators */}
              <div className="flex justify-center gap-2 mt-4">
                  {cloudSyncStatus === 'offline' && (
                     <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-50 text-amber-700 rounded-full text-xs font-medium border border-amber-100">
                        <CloudOff size={12} /> Offline Mode (Chưa cấu hình Supabase)
                     </div>
                  )}
                  {cloudSyncStatus === 'denied' && (
                     <div className="inline-flex items-center gap-2 px-3 py-1 bg-gray-50 text-gray-600 rounded-full text-xs font-medium border border-gray-200" title="Backend từ chối quyền truy cập (RLS Policy)">
                        <ShieldAlert size={12} /> Local Storage Only
                     </div>
                  )}
              </div>
            </div>
            <FileUpload 
              onFileSelected={handleFileSelected} 
              isProcessing={isAnalyzing}
              isPremium={userProfile.isPremium} 
              onUpgradeRequest={() => setShowUpgradeModal(true)}
            />
            
            {/* Features Grid Mini */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16 text-center opacity-80">
               <div className="p-4">
                  <h4 className="font-bold text-gray-800">Đa Định Dạng</h4>
                  <p className="text-sm text-gray-500">Hỗ trợ PDF, Word, PowerPoint, Zip</p>
               </div>
               <div className="p-4">
                  <h4 className="font-bold text-gray-800">Phân Tích Sâu</h4>
                  <p className="text-sm text-gray-500">Đánh giá 50+ tiêu chí nội dung & hình thức</p>
               </div>
               <div className="p-4">
                  <h4 className="font-bold text-gray-800">Báo Cáo PDF</h4>
                  <p className="text-sm text-gray-500">Xuất file báo cáo đóng dấu đỏ chuyên nghiệp</p>
               </div>
            </div>
          </div>
        );
      case 'analyzing':
        return (
          <AnalyzingView fileName={fileData?.file.name || 'Tài liệu'} />
        );
      case 'result':
        return analysisResult && fileData ? (
          <AnalysisResultView 
            result={analysisResult} 
            fileData={fileData} 
            onReset={handleReset}
            userProfile={userProfile}
          />
        ) : null;
      case 'history':
        return (
          <History 
            items={history} 
            onClear={clearAllHistory} 
            onSelect={handleHistorySelect}
          />
        );
      case 'settings':
        return <Settings profile={userProfile} onSave={setUserProfile} />;
      case 'criteria':
        return <Criteria />;
      case 'profile':
        return <ProfileView profile={userProfile} historyCount={history.length} onLogout={handleLogout} />;
      default:
        return <div>Not found</div>;
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans text-gray-900">
      <UpgradeModal 
        isOpen={showUpgradeModal} 
        onClose={() => setShowUpgradeModal(false)} 
        onConfirm={handleUpgradeSuccess}
      />

      {/* Mobile Menu Toggle */}
      <div className="md:hidden fixed top-0 left-0 w-full bg-white z-50 px-4 py-3 shadow-sm flex items-center justify-between">
         <span className="font-bold text-lg text-blue-600">DocuMind</span>
         <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
           {isMobileMenuOpen ? <X /> : <Menu />}
         </button>
      </div>

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-40 transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
         <Sidebar 
            currentView={currentView} 
            onChangeView={(view) => { setCurrentView(view); setIsMobileMenuOpen(false); }} 
            isPremium={userProfile.isPremium}
            onUpgradeClick={() => setShowUpgradeModal(true)}
            userName={userProfile.name}
         />
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto w-full md:p-8 p-4 pt-20 md:pt-8 scroll-smooth">
         <div className="max-w-6xl mx-auto">
            {renderContent()}
         </div>
      </main>
    </div>
  );
};

export default App;