import { createClient } from '@supabase/supabase-js';

// Cấu hình Supabase với thông tin dự án thực tế
const supabaseUrl = process.env.SUPABASE_URL || 'https://nimauxmkovuypkuxtrry.supabase.co';
const supabaseKey = process.env.SUPABASE_KEY || 'sb_publishable_y-lkpZ6cvihVO3Lf9HeJrQ_AL_Aa1G5';

export const supabase = createClient(supabaseUrl, supabaseKey);

// Kiểm tra xem client đã được cấu hình đúng chưa (so với giá trị placeholder cũ)
export const isSupabaseConfigured = () => {
    return supabaseUrl !== 'https://project.supabase.co' && supabaseKey !== 'placeholder-key';
};