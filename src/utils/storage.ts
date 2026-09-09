import { Unit, Resident, User, Visit, AuditLog, VisitStatus } from '../types';
import { initialUnits, initialResidents, initialUsers, initialVisits, initialAuditLogs } from './dummyData';

const STORAGE_KEYS = {
  UNITS: 'grm_units_v1',
  RESIDENTS: 'grm_residents_v1',
  USERS: 'grm_users_v1',
  VISITS: 'grm_visits_v1',
  AUDIT_LOGS: 'grm_audit_logs_v1',
  CURRENT_USER: 'grm_current_user_v1',
};

// Initialize default data if not present
export function initLocalStorage(): void {
  if (typeof window === 'undefined') return;

  if (!localStorage.getItem(STORAGE_KEYS.UNITS)) {
    localStorage.setItem(STORAGE_KEYS.UNITS, JSON.stringify(initialUnits));
  }
  if (!localStorage.getItem(STORAGE_KEYS.RESIDENTS)) {
    localStorage.setItem(STORAGE_KEYS.RESIDENTS, JSON.stringify(initialResidents));
  }
  if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(initialUsers));
  }
  if (!localStorage.getItem(STORAGE_KEYS.VISITS)) {
    localStorage.setItem(STORAGE_KEYS.VISITS, JSON.stringify(initialVisits));
  }
  if (!localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS)) {
    localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(initialAuditLogs));
  }
  if (!localStorage.getItem(STORAGE_KEYS.CURRENT_USER)) {
    // Default logged in as Receptionist for immediate seamless use
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(initialUsers[1]));
  }
}

// ================= USER & AUTH =================
export function getCurrentUser(): User | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setCurrentUser(user: User | null): void {
  if (user) {
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
  } else {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
  }
}

export function getUsers(): User[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.USERS);
    return raw ? JSON.parse(raw) : initialUsers;
  } catch {
    return initialUsers;
  }
}

export function saveUser(user: User): void {
  const users = getUsers();
  const idx = users.findIndex(u => u.id === user.id);
  if (idx >= 0) {
    users[idx] = user;
  } else {
    users.unshift(user);
  }
  localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
}

export function deleteUser(id: string): void {
  const users = getUsers().filter(u => u.id !== id);
  localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
}

// ================= UNITS =================
export function getUnits(): Unit[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.UNITS);
    return raw ? JSON.parse(raw) : initialUnits;
  } catch {
    return initialUnits;
  }
}

export function saveUnit(unit: Unit): void {
  const units = getUnits();
  const idx = units.findIndex(u => u.id === unit.id);
  if (idx >= 0) {
    units[idx] = { ...unit, updated_at: new Date().toISOString() };
  } else {
    units.push({ ...unit, created_at: new Date().toISOString(), updated_at: new Date().toISOString() });
  }
  localStorage.setItem(STORAGE_KEYS.UNITS, JSON.stringify(units));
}

export function deleteUnit(id: string): void {
  const units = getUnits().filter(u => u.id !== id);
  localStorage.setItem(STORAGE_KEYS.UNITS, JSON.stringify(units));
}

// ================= RESIDENTS =================
export function getResidents(): Resident[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.RESIDENTS);
    return raw ? JSON.parse(raw) : initialResidents;
  } catch {
    return initialResidents;
  }
}

export function saveResident(resident: Resident): void {
  const residents = getResidents();
  const idx = residents.findIndex(r => r.id === resident.id);
  if (idx >= 0) {
    residents[idx] = { ...resident, updated_at: new Date().toISOString() };
  } else {
    residents.push({ ...resident, created_at: new Date().toISOString(), updated_at: new Date().toISOString() });
  }
  localStorage.setItem(STORAGE_KEYS.RESIDENTS, JSON.stringify(residents));

  // Sync unit's resident_id if active
  const units = getUnits();
  const unitIdx = units.findIndex(u => u.id === resident.unit_id);
  if (unitIdx >= 0) {
    units[unitIdx].resident_id = resident.id;
    units[unitIdx].status = 'Terisi';
    localStorage.setItem(STORAGE_KEYS.UNITS, JSON.stringify(units));
  }
}

export function deleteResident(id: string): void {
  const residents = getResidents().filter(r => r.id !== id);
  localStorage.setItem(STORAGE_KEYS.RESIDENTS, JSON.stringify(residents));
}

// ================= VISITS =================
export function getVisits(): Visit[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.VISITS);
    return raw ? JSON.parse(raw) : initialVisits;
  } catch {
    return initialVisits;
  }
}

// Generate automatic format: GRM-YYYYMMDD-0001
export function generateNextVisitNumber(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const dateKey = `${year}${month}${day}`;

  const visits = getVisits();
  const prefix = `GRM-${dateKey}-`;
  const todaysVisits = visits.filter(v => v.visit_number?.startsWith(prefix));
  
  const nextNum = todaysVisits.length + 1;
  const numPadded = String(nextNum).padStart(4, '0');
  return `${prefix}${numPadded}`;
}

export function createVisit(data: Omit<Visit, 'id' | 'visit_number' | 'created_at' | 'updated_at' | 'status'> & { status?: VisitStatus }): Visit {
  const visits = getVisits();
  const now = new Date().toISOString();
  const visitNumber = generateNextVisitNumber();

  const newVisit: Visit = {
    ...data,
    id: `v-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
    visit_number: visitNumber,
    status: data.status || 'INSIDE',
    created_at: now,
    updated_at: now,
  };

  visits.unshift(newVisit);
  localStorage.setItem(STORAGE_KEYS.VISITS, JSON.stringify(visits));

  // Log audit
  const currentUser = getCurrentUser();
  addAuditLog({
    activity: 'CHECK_IN',
    target_id: newVisit.visit_number,
    details: `Check-In tamu: ${newVisit.guest_name} ke unit ${newVisit.unit_id}`,
    user_name: currentUser?.name || 'Resepsionis',
    user_role: currentUser?.role || 'RECEPTIONIST',
    status: 'SUCCESS',
  });

  return newVisit;
}

export function updateVisit(visit: Visit): void {
  const visits = getVisits();
  const idx = visits.findIndex(v => v.id === visit.id);
  if (idx >= 0) {
    visits[idx] = { ...visit, updated_at: new Date().toISOString() };
    localStorage.setItem(STORAGE_KEYS.VISITS, JSON.stringify(visits));
  }
}

export function checkOutVisit(
  visitId: string,
  checkoutPhoto: string,
  checkoutSignature: string
): Visit | null {
  const visits = getVisits();
  const idx = visits.findIndex(v => v.id === visitId);
  if (idx < 0) return null;

  const visit = visits[idx];
  if (visit.status !== 'INSIDE') {
    throw new Error('Hanya kunjungan dengan status INSIDE (Sedang Berada) yang dapat di-Check-Out.');
  }

  const now = new Date().toISOString();
  const updated: Visit = {
    ...visit,
    status: 'CHECKED_OUT',
    checkout_photo: checkoutPhoto,
    checkout_signature: checkoutSignature,
    checkout_datetime: now,
    updated_at: now,
  };

  visits[idx] = updated;
  localStorage.setItem(STORAGE_KEYS.VISITS, JSON.stringify(visits));

  // Log audit
  const currentUser = getCurrentUser();
  addAuditLog({
    activity: 'CHECK_OUT',
    target_id: updated.visit_number,
    details: `Check-Out tamu: ${updated.guest_name}`,
    user_name: currentUser?.name || 'Resepsionis',
    user_role: currentUser?.role || 'RECEPTIONIST',
    status: 'SUCCESS',
  });

  return updated;
}

// ================= AUDIT LOGS =================
export function getAuditLogs(): AuditLog[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS);
    return raw ? JSON.parse(raw) : initialAuditLogs;
  } catch {
    return initialAuditLogs;
  }
}

export function addAuditLog(data: Omit<AuditLog, 'id' | 'timestamp' | 'ip_device'> & { ip_device?: string }): void {
  const logs = getAuditLogs();
  const newLog: AuditLog = {
    ...data,
    id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    timestamp: new Date().toISOString(),
    ip_device: data.ip_device || 'Web Browser (Session)',
  };
  logs.unshift(newLog);
  // Keep last 300 logs
  if (logs.length > 300) logs.pop();
  localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(logs));
}

// ================= CALCULATIONS & HELPERS =================
export function calculateDuration(startTimeStr?: string, endTimeStr?: string): string {
  if (!startTimeStr) return '-';
  const start = new Date(startTimeStr).getTime();
  const end = endTimeStr ? new Date(endTimeStr).getTime() : Date.now();

  const diffMs = Math.max(0, end - start);
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const hours = Math.floor(diffMinutes / 60);
  const minutes = diffMinutes % 60;
  const days = Math.floor(hours / 24);

  if (days > 0) {
    const remHours = hours % 24;
    return `${days} hari ${remHours} jam ${minutes} menit`;
  }
  if (hours > 0) {
    return `${hours} jam ${minutes} menit`;
  }
  return `${minutes} menit`;
}

export function formatIndonesianDate(isoStr?: string): string {
  if (!isoStr) return '-';
  try {
    const d = new Date(isoStr);
    return new Intl.DateTimeFormat('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(d);
  } catch {
    return isoStr;
  }
}

export function formatIndonesianDateOnly(isoStr?: string): string {
  if (!isoStr) return '-';
  try {
    const d = new Date(isoStr);
    return new Intl.DateTimeFormat('id-ID', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    }).format(d);
  } catch {
    return isoStr;
  }
}

// Export visits to CSV
export function exportVisitsToCSV(visits: Visit[], units: Unit[], residents: Resident[]): string {
  const headers = [
    'No. Kunjungan',
    'Nama Tamu',
    'No. Telepon',
    'Unit Tujuan',
    'Lantai',
    'Gedung',
    'Penghuni Dikunjungi',
    'Keperluan',
    'Identitas Titipan',
    'Waktu Check-In',
    'Waktu Check-Out',
    'Durasi',
    'Status',
  ];

  const rows = visits.map(v => {
    const unit = units.find(u => u.id === v.unit_id);
    const resident = residents.find(r => r.id === v.resident_id);
    const duration = calculateDuration(v.checkin_datetime, v.checkout_datetime);
    
    return [
      `"${v.visit_number}"`,
      `"${v.guest_name.replace(/"/g, '""')}"`,
      `"${v.phone_number}"`,
      `"${unit ? unit.unit_number : '-'}"`,
      `"${unit ? unit.floor : '-'}"`,
      `"${unit ? unit.building : '-'}"`,
      `"${resident ? resident.resident_name.replace(/"/g, '""') : '-'}"`,
      `"${v.purpose.replace(/"/g, '""')}"`,
      `"${v.deposited_identity}${v.deposited_identity_note ? ` (${v.deposited_identity_note})` : ''}"`,
      `"${formatIndonesianDate(v.checkin_datetime)}"`,
      `"${v.checkout_datetime ? formatIndonesianDate(v.checkout_datetime) : '-'}"`,
      `"${duration}"`,
      `"${v.status === 'INSIDE' ? 'Sedang Berada' : v.status === 'CHECKED_OUT' ? 'Sudah Check-Out' : 'Dibatalkan'}"`,
    ].join(',');
  });

  return [headers.join(','), ...rows].join('\r\n');
}
