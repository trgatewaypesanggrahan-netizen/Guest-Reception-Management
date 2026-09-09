export type UserRole = 'ADMIN' | 'RECEPTIONIST' | 'GUEST';

export interface User {
  id: string;
  name: string;
  username: string;
  email: string;
  password_hash: string;
  role: UserRole;
  status: 'Aktif' | 'Nonaktif';
  created_at: string;
}

export type UnitStatus = 'Terisi' | 'Kosong' | 'Tidak Aktif';

export interface Unit {
  id: string;
  unit_number: string;
  floor: string;
  building: string;
  resident_id?: string;
  status: UnitStatus;
  created_at: string;
  updated_at: string;
}

export interface Resident {
  id: string;
  resident_name: string;
  phone_number: string;
  unit_id: string;
  status: 'Aktif' | 'Tidak Aktif';
  created_at: string;
  updated_at: string;
}

export type VisitStatus = 'INSIDE' | 'CHECKED_OUT' | 'CANCELLED';

export type DepositedIdentity = 'KTP' | 'SIM' | 'Kartu Identitas Lainnya' | 'Tidak Ada';

export interface Visit {
  id: string;
  visit_number: string;
  guest_name: string;
  phone_number: string;
  unit_id: string;
  resident_id: string;
  purpose: string;
  deposited_identity: DepositedIdentity;
  deposited_identity_note?: string; // Catatan nomor seri kartu titipan / kartu akses visitor (BUKAN NIK)
  checkin_photo: string;
  checkin_signature: string;
  checkin_datetime: string;
  checkout_photo?: string;
  checkout_signature?: string;
  checkout_datetime?: string;
  status: VisitStatus;
  created_at: string;
  updated_at: string;
  guest_user_id?: string;
  receptionist_name?: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  user_name: string;
  user_role: string;
  activity: string;
  target_id: string;
  details: string;
  ip_device: string;
  status: 'SUCCESS' | 'FAILED';
}

export interface ToastMessage {
  id: string;
  title: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  timestamp: number;
}
