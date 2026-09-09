import { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  UserPlus,
  LogOut,
  History,
  Users,
  Building2,
  FileText,
  ShieldCheck,
  QrCode,
  Bell,
  Menu,
  X,
  UserCheck,
  CheckCircle,
  AlertCircle,
  Clock,
  Sparkles,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import { Visit, Unit, Resident, User as AppUser, UserRole } from './types';
import {
  getVisits,
  getUnits,
  getResidents,
  getCurrentUser,
  setCurrentUser,
} from './utils/storage';

// Components
import DashboardView from './components/DashboardView';
import CheckInFlow from './components/CheckInFlow';
import CheckOutFlow from './components/CheckOutFlow';
import HistoryView from './components/HistoryView';
import ResidentsManagementView from './components/ResidentsManagementView';
import UnitsManagementView from './components/UnitsManagementView';
import ReportsView from './components/ReportsView';
import UserManagementView from './components/UserManagementView';
import AuditLogView from './components/AuditLogView';
import VisitDetailModal from './components/VisitDetailModal';
import ProofModal from './components/ProofModal';
import QRScannerModal from './components/QRScannerModal';
import LoginModal from './components/LoginModal';

type ActiveTab =
  | 'DASHBOARD'
  | 'CHECK_IN'
  | 'CHECK_OUT'
  | 'HISTORY'
  | 'RESIDENTS'
  | 'UNITS'
  | 'REPORTS'
  | 'USERS'
  | 'AUDIT';

interface Toast {
  id: string;
  title: string;
  message: string;
  type: 'success' | 'error';
}

export default function App() {
  // Master state from localStorage
  const [visits, setVisits] = useState<Visit[]>(() => getVisits());
  const [units, setUnits] = useState<Unit[]>(() => getUnits());
  const [residents, setResidents] = useState<Resident[]>(() => getResidents());
  const [currentUser, setCurrUser] = useState<AppUser | null>(() => getCurrentUser());

  // Navigation
  const [activeTab, setActiveTab] = useState<ActiveTab>('DASHBOARD');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Parameter for Check-Out flow (e.g. from QR scan or table row)
  const [targetCheckoutVisitNumber, setTargetCheckoutVisitNumber] = useState<string | undefined>(undefined);

  // Modals
  const [detailModalVisit, setDetailModalVisit] = useState<Visit | null>(null);
  const [proofModalVisit, setProofModalVisit] = useState<Visit | null>(null);
  const [isQRScannerOpen, setIsQRScannerOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  // Toast notifications
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = (title: string, message: string, type: 'success' | 'error' = 'success') => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    setToasts(prev => [...prev, { id, title, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  const refreshAllData = () => {
    setVisits(getVisits());
    setUnits(getUnits());
    setResidents(getResidents());
    setCurrUser(getCurrentUser());
  };

  // Switch to Check-Out tab with prefilled visit number
  const handleStartCheckOut = (visitNumber?: string) => {
    setTargetCheckoutVisitNumber(visitNumber);
    setActiveTab('CHECK_OUT');
  };

  // Quick QR Scan handler from header or dashboard
  const handleQRScanned = (scannedValue: string) => {
    setIsQRScannerOpen(false);
    const found = visits.find(v => v.visit_number === scannedValue);

    if (found) {
      if (found.status === 'INSIDE') {
        showToast('Tamu Ditemukan', `Membuka formulir Check-Out untuk ${found.guest_name}.`, 'success');
        setTargetCheckoutVisitNumber(found.visit_number);
        setActiveTab('CHECK_OUT');
      } else {
        showToast('Detail Kunjungan', `Tamu sudah ${found.status}. Membuka detail riwayat.`, 'success');
        setDetailModalVisit(found);
      }
    } else {
      showToast('QR Code Tidak Dikenali', `Nomor "${scannedValue}" tidak ada dalam database kunjungan.`, 'error');
    }
  };

  const activeGuestsCount = visits.filter(v => v.status === 'INSIDE').length;

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans text-slate-800">
      {/* GLOBAL TOAST CONTAINER */}
      <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm w-full pointer-events-none">
        {toasts.map(toast => (
          <div
            key={toast.id}
            className={`pointer-events-auto p-4 rounded-2xl shadow-xl border flex items-start space-x-3 transition-all transform animate-in slide-in-from-top-2 ${
              toast.type === 'success'
                ? 'bg-slate-900 border-emerald-500/50 text-white'
                : 'bg-red-950 border-red-500/50 text-white'
            }`}
          >
            {toast.type === 'success' ? (
              <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            )}
            <div className="flex-1">
              <h4 className="text-xs font-bold">{toast.title}</h4>
              <p className="text-xs text-slate-300 mt-0.5">{toast.message}</p>
            </div>
          </div>
        ))}
      </div>

      {/* TOP HEADER */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Brand & Mobile Menu Button */}
          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition"
              aria-label="Toggle Menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            <div
              onClick={() => setActiveTab('DASHBOARD')}
              className="flex items-center space-x-2.5 cursor-pointer select-none"
            >
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-700 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-600/20 font-black text-base">
                G
              </div>
              <div>
                <span className="text-sm font-black text-slate-950 tracking-tight block leading-none">
                  GUEST RECEPTION
                </span>
                <span className="text-[10px] font-semibold text-blue-600 uppercase tracking-wider block">
                  Apartemen & Rusunami
                </span>
              </div>
            </div>
          </div>

          {/* Quick Header Tools */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Quick QR Scanner Button */}
            <button
              type="button"
              onClick={() => setIsQRScannerOpen(true)}
              className="p-2 sm:px-3 sm:py-2 text-xs font-bold text-slate-700 hover:text-blue-700 hover:bg-slate-100 rounded-xl transition flex items-center"
              title="Scan QR Code Tamu"
            >
              <QrCode className="w-4 h-4 sm:mr-1.5 text-blue-600" />
              <span className="hidden sm:inline">Scan QR</span>
            </button>

            {/* Active inside badge indicator */}
            <div
              onClick={() => setActiveTab('DASHBOARD')}
              className="cursor-pointer px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center space-x-1.5 shadow-2xs hover:bg-emerald-100 transition"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="hidden sm:inline">Di Gedung:</span>
              <span>{activeGuestsCount} Tamu</span>
            </div>

            {/* User Profile / Switch Role button */}
            <button
              type="button"
              onClick={() => setIsLoginModalOpen(true)}
              className="flex items-center space-x-2 pl-2 sm:pl-3 pr-2 py-1.5 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition"
              title="Ganti Pengguna / Profil"
            >
              <div className="w-7 h-7 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold text-xs">
                {currentUser?.name.charAt(0) || 'U'}
              </div>
              <div className="text-left hidden md:block">
                <span className="text-xs font-bold text-slate-900 block leading-tight">
                  {currentUser?.name || 'Resepsionis'}
                </span>
                <span className="text-[10px] font-semibold text-slate-500 block leading-none">
                  {currentUser?.role || 'RECEPTIONIST'}
                </span>
              </div>
            </button>
          </div>
        </div>
      </header>

      {/* BODY WITH SIDEBAR + MAIN CONTENT */}
      <div className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-5 flex flex-col lg:flex-row gap-6">
        {/* DESKTOP SIDEBAR NAVIGATION */}
        <aside className="hidden lg:block w-64 shrink-0">
          <div className="sticky top-24 bg-white rounded-3xl p-4 border border-slate-200 shadow-xs space-y-6">
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-2 block">
                Menu Utama
              </span>
              <nav className="space-y-1">
                <button
                  type="button"
                  onClick={() => setActiveTab('DASHBOARD')}
                  className={`w-full flex items-center px-3.5 py-2.5 rounded-2xl text-xs font-bold transition ${
                    activeTab === 'DASHBOARD'
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <LayoutDashboard className="w-4 h-4 mr-3" />
                  <span>Dashboard Monitoring</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('CHECK_IN')}
                  className={`w-full flex items-center px-3.5 py-2.5 rounded-2xl text-xs font-bold transition ${
                    activeTab === 'CHECK_IN'
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <UserPlus className="w-4 h-4 mr-3 text-blue-500" />
                  <span>Check-In Tamu</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setTargetCheckoutVisitNumber(undefined);
                    setActiveTab('CHECK_OUT');
                  }}
                  className={`w-full flex items-center px-3.5 py-2.5 rounded-2xl text-xs font-bold transition ${
                    activeTab === 'CHECK_OUT'
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <LogOut className="w-4 h-4 mr-3 text-amber-500" />
                  <span>Check-Out Tamu</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('HISTORY')}
                  className={`w-full flex items-center px-3.5 py-2.5 rounded-2xl text-xs font-bold transition ${
                    activeTab === 'HISTORY'
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <History className="w-4 h-4 mr-3 text-indigo-500" />
                  <span>Riwayat Kunjungan</span>
                </button>
              </nav>
            </div>

            {/* Master Data */}
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-2 block">
                Master Gedung
              </span>
              <nav className="space-y-1">
                <button
                  type="button"
                  onClick={() => setActiveTab('RESIDENTS')}
                  className={`w-full flex items-center px-3.5 py-2.5 rounded-2xl text-xs font-bold transition ${
                    activeTab === 'RESIDENTS'
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Users className="w-4 h-4 mr-3" />
                  <span>Data Penghuni</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('UNITS')}
                  className={`w-full flex items-center px-3.5 py-2.5 rounded-2xl text-xs font-bold transition ${
                    activeTab === 'UNITS'
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Building2 className="w-4 h-4 mr-3" />
                  <span>Data Unit Apartemen</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('REPORTS')}
                  className={`w-full flex items-center px-3.5 py-2.5 rounded-2xl text-xs font-bold transition ${
                    activeTab === 'REPORTS'
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <FileText className="w-4 h-4 mr-3" />
                  <span>Laporan Kunjungan</span>
                </button>
              </nav>
            </div>

            {/* Administrasi & Audit */}
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-2 block">
                Administrasi & Keamanan
              </span>
              <nav className="space-y-1">
                <button
                  type="button"
                  onClick={() => setActiveTab('USERS')}
                  className={`w-full flex items-center px-3.5 py-2.5 rounded-2xl text-xs font-bold transition ${
                    activeTab === 'USERS'
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <ShieldCheck className="w-4 h-4 mr-3" />
                  <span>Manajemen User</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('AUDIT')}
                  className={`w-full flex items-center px-3.5 py-2.5 rounded-2xl text-xs font-bold transition ${
                    activeTab === 'AUDIT'
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Clock className="w-4 h-4 mr-3" />
                  <span>Audit Trail (Log)</span>
                </button>
              </nav>
            </div>
          </div>
        </aside>

        {/* MOBILE SLIDE-OUT MENU DRAWER */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 lg:hidden bg-slate-900/80 backdrop-blur-sm flex">
            <div className="w-72 bg-white h-full p-5 overflow-y-auto space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <span className="font-bold text-slate-900 text-sm">Menu Resepsionis</span>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-1">
                {[
                  { id: 'DASHBOARD', label: 'Dashboard', icon: LayoutDashboard },
                  { id: 'CHECK_IN', label: 'Check-In Tamu', icon: UserPlus },
                  { id: 'CHECK_OUT', label: 'Check-Out Tamu', icon: LogOut },
                  { id: 'HISTORY', label: 'Riwayat Kunjungan', icon: History },
                  { id: 'RESIDENTS', label: 'Data Penghuni', icon: Users },
                  { id: 'UNITS', label: 'Data Unit', icon: Building2 },
                  { id: 'REPORTS', label: 'Laporan', icon: FileText },
                  { id: 'USERS', label: 'Manajemen User', icon: ShieldCheck },
                  { id: 'AUDIT', label: 'Audit Trail', icon: Clock },
                ].map(item => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveTab(item.id as ActiveTab);
                        setMobileMenuOpen(false);
                      }}
                      className={`w-full flex items-center px-4 py-3 rounded-2xl text-xs font-bold ${
                        isActive
                          ? 'bg-blue-600 text-white'
                          : 'text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <Icon className="w-4 h-4 mr-3" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="flex-1" onClick={() => setMobileMenuOpen(false)}></div>
          </div>
        )}

        {/* MAIN VIEW CONTENT AREA */}
        <main className="flex-1 min-w-0 pb-20 lg:pb-8">
          {/* VIEW: DASHBOARD */}
          {activeTab === 'DASHBOARD' && (
            <DashboardView
              visits={visits}
              units={units}
              residents={residents}
              onStartCheckIn={() => setActiveTab('CHECK_IN')}
              onStartCheckOut={(visitNumber) => handleStartCheckOut(visitNumber)}
              onStartQRScan={() => setIsQRScannerOpen(true)}
              onViewActiveGuests={() => setActiveTab('HISTORY')}
              onViewDetail={(visit) => setDetailModalVisit(visit)}
            />
          )}

          {/* VIEW: CHECK-IN FLOW */}
          {activeTab === 'CHECK_IN' && (
            <CheckInFlow
              units={units}
              residents={residents}
              currentUserName={currentUser?.name || 'Petugas Resepsionis'}
              onSuccess={(newVisit) => {
                refreshAllData();
                showToast('Check-In Sukses', `Tamu ${newVisit.guest_name} berhasil didaftarkan.`, 'success');
              }}
              onCancel={() => setActiveTab('DASHBOARD')}
            />
          )}

          {/* VIEW: CHECK-OUT FLOW */}
          {activeTab === 'CHECK_OUT' && (
            <CheckOutFlow
              visits={visits}
              units={units}
              residents={residents}
              initialVisitNumber={targetCheckoutVisitNumber}
              onSuccess={(updatedVisit) => {
                refreshAllData();
                showToast('Check-Out Selesai', `Tamu ${updatedVisit.guest_name} telah menyelesaikan kunjungan.`, 'success');
              }}
              onCancel={() => {
                setTargetCheckoutVisitNumber(undefined);
                setActiveTab('DASHBOARD');
              }}
            />
          )}

          {/* VIEW: RIWAYAT KUNJUNGAN */}
          {activeTab === 'HISTORY' && (
            <HistoryView
              visits={visits}
              units={units}
              residents={residents}
              onViewDetail={(visit) => setDetailModalVisit(visit)}
              onPrintProof={(visit) => setProofModalVisit(visit)}
            />
          )}

          {/* VIEW: DATA PENGHUNI */}
          {activeTab === 'RESIDENTS' && (
            <ResidentsManagementView
              residents={residents}
              units={units}
              currentUserName={currentUser?.name || 'Resepsionis'}
              onDataChanged={refreshAllData}
              showToast={showToast}
            />
          )}

          {/* VIEW: DATA UNIT */}
          {activeTab === 'UNITS' && (
            <UnitsManagementView
              units={units}
              residents={residents}
              currentUserName={currentUser?.name || 'Admin'}
              onDataChanged={refreshAllData}
              showToast={showToast}
            />
          )}

          {/* VIEW: LAPORAN */}
          {activeTab === 'REPORTS' && (
            <ReportsView
              visits={visits}
              units={units}
              residents={residents}
            />
          )}

          {/* VIEW: MANAJEMEN USER */}
          {activeTab === 'USERS' && (
            <UserManagementView
              currentUserName={currentUser?.name || 'Admin'}
              showToast={showToast}
            />
          )}

          {/* VIEW: AUDIT LOG */}
          {activeTab === 'AUDIT' && (
            <AuditLogView />
          )}
        </main>
      </div>

      {/* SMARTPHONE BOTTOM NAVIGATION (Section 22: Responsive layout) */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 px-2 py-2 flex items-center justify-around shadow-lg">
        <button
          type="button"
          onClick={() => setActiveTab('DASHBOARD')}
          className={`flex flex-col items-center py-1 px-2 rounded-xl transition ${
            activeTab === 'DASHBOARD' ? 'text-blue-600 font-bold' : 'text-slate-500'
          }`}
        >
          <LayoutDashboard className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">Dashboard</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('CHECK_IN')}
          className={`flex flex-col items-center py-1 px-2 rounded-xl transition ${
            activeTab === 'CHECK_IN' ? 'text-blue-600 font-bold' : 'text-slate-500'
          }`}
        >
          <UserPlus className="w-5 h-5 text-blue-600" />
          <span className="text-[10px] mt-0.5">Check-In</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setTargetCheckoutVisitNumber(undefined);
            setActiveTab('CHECK_OUT');
          }}
          className={`flex flex-col items-center py-1 px-2 rounded-xl transition ${
            activeTab === 'CHECK_OUT' ? 'text-blue-600 font-bold' : 'text-slate-500'
          }`}
        >
          <LogOut className="w-5 h-5 text-amber-500" />
          <span className="text-[10px] mt-0.5">Check-Out</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('HISTORY')}
          className={`flex flex-col items-center py-1 px-2 rounded-xl transition ${
            activeTab === 'HISTORY' ? 'text-blue-600 font-bold' : 'text-slate-500'
          }`}
        >
          <History className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">Riwayat</span>
        </button>

        <button
          type="button"
          onClick={() => setMobileMenuOpen(true)}
          className="flex flex-col items-center py-1 px-2 rounded-xl text-slate-500 hover:text-slate-900"
        >
          <Menu className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">Lainnya</span>
        </button>
      </nav>

      {/* DETAIL MODAL */}
      {detailModalVisit && (
        <VisitDetailModal
          visit={detailModalVisit}
          unit={units.find(u => u.id === detailModalVisit.unit_id)}
          resident={residents.find(r => r.id === detailModalVisit.resident_id)}
          onClose={() => setDetailModalVisit(null)}
          onPrint={() => {
            const v = detailModalVisit;
            setDetailModalVisit(null);
            setProofModalVisit(v);
          }}
        />
      )}

      {/* PROOF MODAL (PRINT/DOWNLOAD BUKTI KUNJUNGAN) */}
      {proofModalVisit && (
        <ProofModal
          visit={proofModalVisit}
          unit={units.find(u => u.id === proofModalVisit.unit_id)}
          resident={residents.find(r => r.id === proofModalVisit.resident_id)}
          onClose={() => setProofModalVisit(null)}
          onBackToDashboard={() => {
            setProofModalVisit(null);
            setActiveTab('DASHBOARD');
          }}
        />
      )}

      {/* QUICK SCANNER MODAL */}
      <QRScannerModal
        isOpen={isQRScannerOpen}
        onClose={() => setIsQRScannerOpen(false)}
        onScanSuccess={handleQRScanned}
        title="Scan QR Code Bukti Kunjungan"
      />

      {/* LOGIN / USER SWITCHER MODAL */}
      <LoginModal
        isOpen={isLoginModalOpen}
        currentUser={currentUser}
        onClose={() => setIsLoginModalOpen(false)}
        onLoginSuccess={(user) => {
          setCurrentUser(user);
          setCurrUser(user);
          showToast('Login Berhasil', `Selamat bertugas, ${user.name} (${user.role})!`, 'success');
        }}
      />
    </div>
  );
}
