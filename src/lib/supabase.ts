import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Profile = {
  id: string;
  full_name: string;
  nip: string | null;
  role: 'guru' | 'admin';
  subject: string;
  school_id: string | null;
  avatar_url: string;
  phone: string;
  created_at: string;
  updated_at: string;
};

export type School = {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  allowed_radius_meters: number;
  created_at: string;
};

export type Attendance = {
  id: string;
  user_id: string;
  date: string;
  check_in_time: string | null;
  check_out_time: string | null;
  check_in_lat: number | null;
  check_in_lng: number | null;
  check_out_lat: number | null;
  check_out_lng: number | null;
  check_in_photo: string;
  check_out_photo: string;
  status: 'hadir' | 'terlambat' | 'tidak_hadir' | 'izin' | 'sakit' | 'cuti' | 'belum_absen';
  distance_check_in: number;
  distance_check_out: number;
  location_valid_check_in: boolean;
  location_valid_check_out: boolean;
  notes: string;
  created_at: string;
  updated_at: string;
  profiles?: Profile;
};

export type LeaveRequest = {
  id: string;
  user_id: string;
  type: 'izin' | 'sakit' | 'cuti';
  start_date: string;
  end_date: string;
  reason: string;
  attachment_url: string;
  status: 'pending' | 'approved' | 'rejected';
  approved_by: string | null;
  approved_at: string | null;
  admin_notes: string;
  created_at: string;
  updated_at: string;
  profiles?: Profile;
};
