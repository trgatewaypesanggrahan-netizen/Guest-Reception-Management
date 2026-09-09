import { Unit, Resident, User, Visit, AuditLog } from '../types';

// Helper to generate SVG avatars for dummy visits so the app has realistic photo data right away
export function generateAvatarDataUrl(name: string, bg: string, textCol: string = '#ffffff'): string {
  const initials = name
    .split(' ')
    .map(p => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">
    <rect width="200" height="200" fill="${bg}" rx="16"/>
    <circle cx="100" cy="75" r="35" fill="rgba(255,255,255,0.25)"/>
    <path d="M45 160 C45 125, 70 115, 100 115 C130 115, 155 125, 155 160 Z" fill="rgba(255,255,255,0.25)"/>
    <text x="100" y="105" font-family="sans-serif" font-size="28" font-weight="bold" fill="${textCol}" text-anchor="middle" dominant-baseline="middle">${initials}</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export function generateDummySignature(name: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="120" viewBox="0 0 300 120">
    <rect width="300" height="120" fill="#ffffff"/>
    <path d="M 30 75 Q 70 20, 110 65 T 180 55 T 260 70" fill="none" stroke="#1e3a8a" stroke-width="3" stroke-linecap="round"/>
    <path d="M 60 50 L 140 85" fill="none" stroke="#1e3a8a" stroke-width="2" stroke-linecap="round"/>
    <text x="150" y="105" font-family="sans-serif" font-size="11" fill="#64748b" text-anchor="middle">Tanda tangan terverifikasi: ${name}</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export const initialUnits: Unit[] = [
  { id: 'u-1', unit_number: 'A-101', floor: '1', building: 'Tower A', resident_id: 'r-1', status: 'Terisi', created_at: '2026-01-10T08:00:00.000Z', updated_at: '2026-01-10T08:00:00.000Z' },
  { id: 'u-2', unit_number: 'A-102', floor: '1', building: 'Tower A', resident_id: 'r-2', status: 'Terisi', created_at: '2026-01-10T08:00:00.000Z', updated_at: '2026-01-10T08:00:00.000Z' },
  { id: 'u-3', unit_number: 'A-201', floor: '2', building: 'Tower A', resident_id: 'r-3', status: 'Terisi', created_at: '2026-01-10T08:00:00.000Z', updated_at: '2026-01-10T08:00:00.000Z' },
  { id: 'u-4', unit_number: 'A-202', floor: '2', building: 'Tower A', resident_id: 'r-4', status: 'Terisi', created_at: '2026-01-10T08:00:00.000Z', updated_at: '2026-01-10T08:00:00.000Z' },
  { id: 'u-5', unit_number: 'B-101', floor: '1', building: 'Tower B', resident_id: 'r-5', status: 'Terisi', created_at: '2026-01-10T08:00:00.000Z', updated_at: '2026-01-10T08:00:00.000Z' },
  { id: 'u-6', unit_number: 'B-102', floor: '1', building: 'Tower B', resident_id: 'r-6', status: 'Terisi', created_at: '2026-01-10T08:00:00.000Z', updated_at: '2026-01-10T08:00:00.000Z' },
  { id: 'u-7', unit_number: 'B-201', floor: '2', building: 'Tower B', resident_id: '', status: 'Kosong', created_at: '2026-01-10T08:00:00.000Z', updated_at: '2026-01-10T08:00:00.000Z' },
  { id: 'u-8', unit_number: 'B-202', floor: '2', building: 'Tower B', resident_id: '', status: 'Kosong', created_at: '2026-01-10T08:00:00.000Z', updated_at: '2026-01-10T08:00:00.000Z' },
];

export const initialResidents: Resident[] = [
  { id: 'r-1', resident_name: 'Budi Santoso', phone_number: '081234567890', unit_id: 'u-1', status: 'Aktif', created_at: '2026-01-10T08:00:00.000Z', updated_at: '2026-01-10T08:00:00.000Z' },
  { id: 'r-2', resident_name: 'Siti Rahma', phone_number: '081398765432', unit_id: 'u-2', status: 'Aktif', created_at: '2026-01-10T08:00:00.000Z', updated_at: '2026-01-10T08:00:00.000Z' },
  { id: 'r-3', resident_name: 'Andi Wijaya', phone_number: '085712345678', unit_id: 'u-3', status: 'Aktif', created_at: '2026-01-10T08:00:00.000Z', updated_at: '2026-01-10T08:00:00.000Z' },
  { id: 'r-4', resident_name: 'Rina Putri', phone_number: '087812349999', unit_id: 'u-4', status: 'Aktif', created_at: '2026-01-10T08:00:00.000Z', updated_at: '2026-01-10T08:00:00.000Z' },
  { id: 'r-5', resident_name: 'Hendra Setiawan', phone_number: '082198887766', unit_id: 'u-5', status: 'Aktif', created_at: '2026-01-10T08:00:00.000Z', updated_at: '2026-01-10T08:00:00.000Z' },
  { id: 'r-6', resident_name: 'Dewi Lestari', phone_number: '081567891234', unit_id: 'u-6', status: 'Aktif', created_at: '2026-01-10T08:00:00.000Z', updated_at: '2026-01-10T08:00:00.000Z' },
];

export const initialUsers: User[] = [
  {
    id: 'usr-admin',
    name: 'Administrator Gedung',
    username: 'admin',
    email: 'admin@grm-apartemen.id',
    password_hash: 'admin123', // In demo app stored with simulated safe hash
    role: 'ADMIN',
    status: 'Aktif',
    created_at: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'usr-recep-1',
    name: 'Sarah Resepsionis',
    username: 'resepsionis',
    email: 'sarah@grm-apartemen.id',
    password_hash: 'resepsionis123',
    role: 'RECEPTIONIST',
    status: 'Aktif',
    created_at: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'usr-guest-1',
    name: 'Ahmad Fauzi (Tamu)',
    username: 'tamu',
    email: 'tamu@gmail.com',
    password_hash: 'tamu123',
    role: 'GUEST',
    status: 'Aktif',
    created_at: '2026-01-01T00:00:00.000Z',
  },
];

// Helper to format date string for today and past visits
const now = new Date();
const todayStr = now.toISOString().slice(0, 10).replace(/-/g, '');

export const initialVisits: Visit[] = [
  {
    id: 'v-1',
    visit_number: `GRM-${todayStr}-0001`,
    guest_name: 'Ahmad Fauzi',
    phone_number: '081288990011',
    unit_id: 'u-1',
    resident_id: 'r-1',
    purpose: 'Kunjungan keluarga dan silaturahmi akhir pekan',
    deposited_identity: 'KTP',
    deposited_identity_note: 'Kartu Titipan Slot #12',
    checkin_photo: generateAvatarDataUrl('Ahmad Fauzi', '#1e40af'),
    checkin_signature: generateDummySignature('Ahmad Fauzi'),
    checkin_datetime: new Date(Date.now() - 1000 * 60 * 105).toISOString(), // 1 jam 45 mnt lalu
    status: 'INSIDE',
    created_at: new Date(Date.now() - 1000 * 60 * 105).toISOString(),
    updated_at: new Date(Date.now() - 1000 * 60 * 105).toISOString(),
    receptionist_name: 'Sarah Resepsionis',
  },
  {
    id: 'v-2',
    visit_number: `GRM-${todayStr}-0002`,
    guest_name: 'Dian Permata',
    phone_number: '085711223344',
    unit_id: 'u-2',
    resident_id: 'r-2',
    purpose: 'Pengiriman dokumen legal dan berkas sertifikat',
    deposited_identity: 'SIM',
    deposited_identity_note: 'Kartu Akses Tamu B-04',
    checkin_photo: generateAvatarDataUrl('Dian Permata', '#0f766e'),
    checkin_signature: generateDummySignature('Dian Permata'),
    checkin_datetime: new Date(Date.now() - 1000 * 60 * 45).toISOString(), // 45 mnt lalu
    status: 'INSIDE',
    created_at: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    updated_at: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    receptionist_name: 'Sarah Resepsionis',
  },
  {
    id: 'v-3',
    visit_number: `GRM-${todayStr}-0003`,
    guest_name: 'Bambang Kusuma',
    phone_number: '081377889900',
    unit_id: 'u-3',
    resident_id: 'r-3',
    purpose: 'Teknisi perbaikan instalasi pendingin ruangan AC',
    deposited_identity: 'Kartu Identitas Lainnya',
    deposited_identity_note: 'Kartu Vendor AC No. 09',
    checkin_photo: generateAvatarDataUrl('Bambang Kusuma', '#7c3aed'),
    checkin_signature: generateDummySignature('Bambang Kusuma'),
    checkin_datetime: new Date(Date.now() - 1000 * 60 * 180).toISOString(), // 3 jam lalu
    checkout_photo: generateAvatarDataUrl('Bambang Kusuma (Out)', '#64748b'),
    checkout_signature: generateDummySignature('Bambang Kusuma (Out)'),
    checkout_datetime: new Date(Date.now() - 1000 * 60 * 40).toISOString(), // 40 mnt lalu
    status: 'CHECKED_OUT',
    created_at: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
    updated_at: new Date(Date.now() - 1000 * 60 * 40).toISOString(),
    receptionist_name: 'Sarah Resepsionis',
  },
  {
    id: 'v-4',
    visit_number: `GRM-${todayStr}-0004`,
    guest_name: 'Mega Suryani',
    phone_number: '081900112233',
    unit_id: 'u-4',
    resident_id: 'r-4',
    purpose: 'Konsultasi arsitektur interior unit',
    deposited_identity: 'KTP',
    deposited_identity_note: 'Kartu Titipan Slot #18',
    checkin_photo: generateAvatarDataUrl('Mega Suryani', '#c026d3'),
    checkin_signature: generateDummySignature('Mega Suryani'),
    checkin_datetime: new Date(Date.now() - 1000 * 60 * 25).toISOString(), // 25 mnt lalu
    status: 'INSIDE',
    created_at: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
    updated_at: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
    receptionist_name: 'Sarah Resepsionis',
  },
];

export const initialAuditLogs: AuditLog[] = [
  {
    id: 'log-1',
    timestamp: new Date(Date.now() - 1000 * 60 * 200).toISOString(),
    user_name: 'Sarah Resepsionis',
    user_role: 'RECEPTIONIST',
    activity: 'LOGIN',
    target_id: 'usr-recep-1',
    details: 'Login resepsionis ke sistem shift pagi',
    ip_device: 'Desk-FrontDesk-PC (192.168.1.10)',
    status: 'SUCCESS',
  },
  {
    id: 'log-2',
    timestamp: new Date(Date.now() - 1000 * 60 * 105).toISOString(),
    user_name: 'Sarah Resepsionis',
    user_role: 'RECEPTIONIST',
    activity: 'CHECK_IN',
    target_id: `GRM-${todayStr}-0001`,
    details: 'Check-In tamu Ahmad Fauzi untuk Unit A-101 (Budi Santoso)',
    ip_device: 'Desk-FrontDesk-PC (192.168.1.10)',
    status: 'SUCCESS',
  },
  {
    id: 'log-3',
    timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    user_name: 'Sarah Resepsionis',
    user_role: 'RECEPTIONIST',
    activity: 'CHECK_IN',
    target_id: `GRM-${todayStr}-0002`,
    details: 'Check-In tamu Dian Permata untuk Unit A-102 (Siti Rahma)',
    ip_device: 'Desk-FrontDesk-PC (192.168.1.10)',
    status: 'SUCCESS',
  },
  {
    id: 'log-4',
    timestamp: new Date(Date.now() - 1000 * 60 * 40).toISOString(),
    user_name: 'Sarah Resepsionis',
    user_role: 'RECEPTIONIST',
    activity: 'CHECK_OUT',
    target_id: `GRM-${todayStr}-0003`,
    details: 'Check-Out tamu Bambang Kusuma dari Unit A-201',
    ip_device: 'Desk-FrontDesk-PC (192.168.1.10)',
    status: 'SUCCESS',
  },
];
