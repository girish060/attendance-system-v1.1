import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface Course {
  id: string;
  code: string;
  name: string;
  instructor: string;
  created_at?: string;
}

export interface Student {
  id: string;
  roll_number: string;
  name: string;
  email: string;
  course_id: string;
  created_at?: string;
}

export interface AttendanceRecord {
  id: string;
  student_id: string;
  course_id: string;
  date: string;
  status: 'present' | 'absent' | 'late';
  notes: string;
  created_at?: string;
}
