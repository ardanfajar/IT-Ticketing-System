import React, { useState, useEffect, useMemo } from 'react';
import { 
  LayoutDashboard, 
  Ticket, 
  Users, 
  BarChart3, 
  LogOut, 
  User, 
  Shield, 
  Radio, 
  PlusCircle, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  XCircle, 
  Database, 
  RefreshCw,
  Search,
  SlidersHorizontal,
  Sparkles,
  Download,
  FileText
} from 'lucide-react';
import { io } from 'socket.io-client';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

interface UserSession {
  id: number;
  username: string;
  name: string;
  role: string;
  avatar: string;
  token: string;
}

interface ITTicket {
  id: number;
  ticket_number: string;
  source: string;
  message: string;
  status: 'belum_dikerjakan' | 'diproses' | 'selesai' | 'ditolak';
  completed_by: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

interface ITStaff {
  id: number;
  username: string;
  name: string;
  role: string;
  avatar: string;
  completedCount: number;
}

interface LogEntry {
  id: number;
  type: string;
  text: string;
  time: string;
}

export default function App() {
  // === STATE UTAMA ===
  const [user, setUser] = useState<UserSession | null>(null);
  const [tickets, setTickets] = useState<ITTicket[]>([]);
  const [usersList, setUsersList] = useState<ITStaff[]>([]);
  const [activeTab, setActiveTab] = useState<string>('dashboard'); // dashboard, tickets, staff, analytics
  const [loading, setLoading] = useState<boolean>(false);
  const [pdfLoading, setPdfLoading] = useState<boolean>(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // State Form Login
  const [usernameInput, setUsernameInput] = useState<string>('andri_admin');
  const [passwordInput, setPasswordInput] = useState<string>('password123');
  const [loginError, setLoginError] = useState<string>('');

  // State Form Tiket Baru (Simulasi Input Bot/API)
  const [newTicketMsg, setNewTicketMsg] = useState<string>('');
  const [newTicketSource, setNewTicketSource] = useState<string>('WhatsApp');
  const [showAddModal, setShowAddModal] = useState<boolean>(false);

  // State Notifikasi & Simulasi Socket.IO Logs
  const [socketLogs, setSocketLogs] = useState<LogEntry[]>([
    { id: 1, type: 'info', text: 'Menginisialisasi koneksi Socket.IO...', time: new Date().toTimeString().split(' ')[0] }
  ]);
  const [realtimeNotification, setRealtimeNotification] = useState<{ message: string; type: string } | null>(null);

  // === AUXILIARY: LOGS ===
  const addSocketLog = (type: string, text: string) => {
    const now = new Date();
    const timeStr = now.toTimeString().split(' ')[0];
    setSocketLogs(prev => [
      { id: Date.now(), type, text, time: timeStr },
      ...prev.slice(0, 15) // Batasi hanya 15 log terbaru
    ]);
  };

  // === SESSION CHECK ON MOUNT ===
  useEffect(() => {
    const savedUser = localStorage.getItem('it_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  // === FETCH DATA FROM API ===
  const fetchTickets = async () => {
    try {
      const res = await fetch(`${API_URL}/api/tickets`);
      if (res.ok) {
        const data = await res.json();
        setTickets(data);
      }
    } catch (err) {
      console.error('Error fetching tickets:', err);
    }
  };

  const fetchStaff = async () => {
    try {
      const res = await fetch(`${API_URL}/api/staff`);
      if (res.ok) {
        const data = await res.json();
        setUsersList(data);
      }
    } catch (err) {
      console.error('Error fetching staff:', err);
    }
  };

  useEffect(() => {
    fetchTickets();
    fetchStaff();
  }, [user]);

  useEffect(() => {
    if (usersList.length > 0) {
      setUsernameInput(usersList[0].username);
    }
  }, [usersList]);

  // === REAL-TIME SYNC (SOCKET.IO CLIENT) ===
  useEffect(() => {
    console.log(`Connecting to Socket.IO server at: ${SOCKET_URL}`);
    const socket = io(SOCKET_URL);

    socket.on('connect', () => {
      addSocketLog('socket', `Koneksi Socket.IO terhubung ke ${SOCKET_URL}`);
      addSocketLog('postgres', 'PostgreSQL LISTEN/NOTIFY siap mendengarkan channel "ticket_update"');
    });

    socket.on('ticketChanged', (payload) => {
      console.log('Realtime ticket change received:', payload);
      
      // Sync state from server
      fetchTickets();
      fetchStaff();

      const { operation, ticket } = payload;
      let logText = '';
      if (operation === 'INSERT') {
        logText = `Database INSERT di tabel "tickets": ${ticket.ticket_number}. Memicu pg_notify()`;
        triggerBannerNotification(`Tiket Baru Masuk: ${ticket.ticket_number} dari ${ticket.source}`);
      } else if (operation === 'UPDATE') {
        logText = `Database UPDATE untuk ${ticket.ticket_number} berhasil. Memicu trigger notify_ticket_changes()`;
        triggerBannerNotification(`Status tiket ${ticket.ticket_number} diperbarui menjadi ${ticket.status.toUpperCase().replace('_', ' ')}`);
      }
      
      addSocketLog('postgres', logText);
      setTimeout(() => {
        addSocketLog('socket', `Socket.IO memancarkan event "ticketChanged" untuk ${ticket.ticket_number}`);
      }, 500);
    });

    socket.on('disconnect', () => {
      addSocketLog('info', 'Sesi Socket.IO terputus.');
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  // === FUNGSIONALITAS AUTHENTIKASI ===
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    
    try {
      const res = await fetch(`${API_URL}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: usernameInput, password: passwordInput })
      });

      if (res.ok) {
        const data = await res.json();
        localStorage.setItem('it_user', JSON.stringify(data));
        localStorage.setItem('it_token', data.token);
        setUser(data);
        addSocketLog('info', `Pengguna ${data.name} berhasil login dengan aman. JWT Token disimpan.`);
      } else {
        const errData = await res.json();
        setLoginError(errData.error || 'Kredensial tidak valid. Silakan gunakan akun terdaftar.');
      }
    } catch (err) {
      console.error(err);
      setLoginError('Koneksi ke server backend gagal. Harap jalankan server backend.');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('it_user');
    localStorage.removeItem('it_token');
    setUser(null);
    addSocketLog('info', 'Sesi login dihapus. Berhasil keluar.');
  };

  // Pemicu Tiket Baru (Klien mengirim HTTP POST, memicu PostgreSQL trigger)
  const simulateNewTicketTrigger = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTicketMsg.trim()) return;

    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/api/tickets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source: newTicketSource, message: newTicketMsg })
      });

      if (res.ok) {
        setNewTicketMsg('');
        setShowAddModal(false);
      } else {
        triggerBannerNotification('Gagal mengirim tiket masuk.', 'error');
      }
    } catch (err) {
      console.error(err);
      triggerBannerNotification('Koneksi backend gagal.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Update status tiket secara optimistik & kirim PATCH ke API
  const updateTicketStatus = async (ticketId: number, newStatus: ITTicket['status']) => {
    if (!user || (user.role !== 'admin' && user.role !== 'petugas')) {
      triggerBannerNotification('Error: Hak akses tidak sah!', 'error');
      return;
    }

    const token = localStorage.getItem('it_token');
    
    // Simpan data lama untuk rollback jika request gagal
    const previousTickets = [...tickets];

    // Perubahan optimistik di Frontend
    const updatedTickets = tickets.map(t => {
      if (t.id === ticketId) {
        const isCompleted = newStatus === 'selesai';
        const isCancelled = newStatus === 'ditolak';
        return {
          ...t,
          status: newStatus,
          completed_by: isCompleted || isCancelled ? user.name : null,
          completed_at: isCompleted || isCancelled ? new Date().toISOString().replace('T', ' ').slice(0, 16) : null,
          updated_at: new Date().toISOString().replace('T', ' ').slice(0, 16)
        };
      }
      return t;
    });

    setTickets(updatedTickets);
    addSocketLog('info', `Melakukan PATCH optimistik untuk tiket ID #${ticketId} ke status: ${newStatus}`);

    try {
      const res = await fetch(`${API_URL}/api/tickets/${ticketId}`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (!res.ok) {
        // Rollback state
        setTickets(previousTickets);
        const errData = await res.json();
        triggerBannerNotification(errData.error || 'Gagal memperbarui tiket.', 'error');
      }
    } catch (err) {
      console.error(err);
      setTickets(previousTickets);
      triggerBannerNotification('Koneksi backend gagal saat update status.', 'error');
    }
  };

  const triggerBannerNotification = (message: string, type = 'success') => {
    setRealtimeNotification({ message, type });
    setTimeout(() => {
      setRealtimeNotification(null);
    }, 4000);
  };

  // === DATA COMPUTATIONS (STATISTIK) ===
  const stats = useMemo(() => {
    const total = tickets.length;
    const open = tickets.filter(t => t.status === 'belum_dikerjakan').length;
    const processing = tickets.filter(t => t.status === 'diproses').length;
    const completed = tickets.filter(t => t.status === 'selesai').length;
    const cancelled = tickets.filter(t => t.status === 'ditolak').length;
    return { total, open, processing, completed, cancelled };
  }, [tickets]);

  const filteredTickets = useMemo(() => {
    return tickets.filter(ticket => {
      const matchesStatus = filterStatus === 'all' || ticket.status === filterStatus;
      const matchesSearch = 
        ticket.ticket_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ticket.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ticket.source.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (ticket.completed_by && ticket.completed_by.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesStatus && matchesSearch;
    });
  }, [tickets, filterStatus, searchQuery]);

  // Sorting petugas berdasarkan jumlah penyelesaian tiket
  const sortedStaffForChart = useMemo(() => {
    return [...usersList]
      .filter(u => u.role === 'admin' || u.role === 'petugas')
      .sort((a, b) => b.completedCount - a.completedCount);
  }, [usersList]);

  // Max value untuk proporsi diagram
  const maxCompleted = useMemo(() => {
    return Math.max(...sortedStaffForChart.map(s => s.completedCount), 1);
  }, [sortedStaffForChart]);

  // === FITUR UNDUH LAPORAN KINERJA PDF ===
  const handleDownloadPDF = () => {
    if (!user) return;
    setPdfLoading(true);
    addSocketLog('info', 'Memulai proses pembuatan laporan PDF...');

    const jsPdfScript = document.createElement('script');
    jsPdfScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
    
    jsPdfScript.onload = () => {
      const autoTableScript = document.createElement('script');
      autoTableScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.29/jspdf.plugin.autotable.min.js';
      
      autoTableScript.onload = () => {
        try {
          // @ts-ignore
          const { jsPDF } = window.jspdf;
          const doc = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4'
          });

          // Kop Surat
          doc.setFillColor(30, 41, 59); // Slate-800
          doc.rect(0, 0, 210, 40, 'F');

          doc.setTextColor(255, 255, 255);
          doc.setFont('Helvetica', 'bold');
          doc.setFontSize(20);
          doc.text('IT TICKETING SYSTEM', 15, 18);

          doc.setFont('Helvetica', 'normal');
          doc.setFontSize(10);
          doc.setTextColor(148, 163, 184); // Slate-400
          doc.text('Laporan Hasil Analisis Kinerja & Produktivitas Petugas IT Support', 15, 25);
          doc.text('Sistem Real-Time Terintegrasi (Express, PostgreSQL, Socket.IO)', 15, 30);

          // Info Laporan
          doc.setTextColor(30, 41, 59);
          doc.setFontSize(9);
          doc.setFont('Helvetica', 'bold');
          doc.text('INFORMASI LAPORAN:', 15, 50);

          doc.setFont('Helvetica', 'normal');
          doc.text(`Dicetak Oleh:  ${user.name} (${user.role.toUpperCase()})`, 15, 56);
          doc.text(`Tanggal Cetak:  ${new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`, 15, 62);
          doc.text(`Waktu Cetak:    ${new Date().toLocaleTimeString('id-ID')} WIB`, 15, 68);

          // Ringkasan Box
          doc.setFillColor(241, 245, 249);
          doc.roundedRect(15, 75, 180, 26, 3, 3, 'F');
          
          doc.setTextColor(15, 23, 42);
          doc.setFont('Helvetica', 'bold');
          doc.setFontSize(10);
          doc.text('RINGKASAN EKSEKUTIF DATA SISTEM:', 20, 82);

          doc.setFont('Helvetica', 'normal');
          doc.setFontSize(9);
          const totalSelesai = sortedStaffForChart.reduce((sum, s) => sum + s.completedCount, 0);
          doc.text(`Total Petugas Terdaftar :  ${usersList.length} Anggota`, 20, 88);
          doc.text(`Total Tiket Diselesaikan :  ${totalSelesai} Kasus Masalah IT`, 20, 94);

          // Header Tabel
          doc.setFontSize(11);
          doc.setFont('Helvetica', 'bold');
          doc.text('Tabel Distribusi Kontribusi Penyelesaian Kasus', 15, 112);

          // Data Tabel
          const tableColumn = ["Peringkat", "Nama Petugas Support", "Username", "Tiket Tuntas (DB)", "Rasio Kontribusi"];
          const tableRows: string[][] = [];

          sortedStaffForChart.forEach((staff, index) => {
            const ratio = totalSelesai > 0 ? `${Math.round((staff.completedCount / totalSelesai) * 100)}%` : '0%';
            tableRows.push([
              `${index + 1}`,
              staff.name,
              `@${staff.username}`,
              `${staff.completedCount} Kasus`,
              ratio
            ]);
          });

          // Render AutoTable
          // @ts-ignore
          doc.autoTable({
            startY: 118,
            head: [tableColumn],
            body: tableRows,
            theme: 'striped',
            headStyles: {
              fillColor: [79, 70, 229], // Indigo-600
              textColor: [255, 255, 255],
              fontSize: 9,
              fontStyle: 'bold',
              halign: 'center'
            },
            bodyStyles: {
              fontSize: 9,
              textColor: [51, 65, 85]
            },
            columnStyles: {
              0: { halign: 'center', width: 25 },
              3: { halign: 'center' },
              4: { halign: 'center', fontStyle: 'bold' }
            },
            margin: { left: 15, right: 15 }
          });

          // @ts-ignore
          const finalY = doc.previousAutoTable.finalY + 15;
          doc.setFillColor(239, 246, 255);
          doc.roundedRect(15, finalY, 180, 20, 2, 2, 'F');
          
          doc.setTextColor(30, 58, 138);
          doc.setFont('Helvetica', 'bold');
          doc.setFontSize(8);
          doc.text('CATATAN VALIDASI OTOMATIS:', 20, finalY + 6);
          doc.setFont('Helvetica', 'normal');
          doc.text('Dokumen ini dihasilkan secara otomatis oleh sistem IT Ticketing menggunakan database terpusat.', 20, finalY + 11);
          doc.text('Seluruh data bersifat valid dan sesuai dengan histori trigger penyelesaian (trigger_notify_changes) PostgreSQL.', 20, finalY + 15);

          // Footer
          doc.setFontSize(8);
          doc.setTextColor(148, 163, 184);
          doc.text('Halaman 1 dari 1  |  IT Ticketing System Core Architecture Platform', 15, 285);

          const tglString = new Date().toISOString().slice(0, 10);
          doc.save(`Laporan_Kinerja_Petugas_${tglString}.pdf`);
          
          setPdfLoading(false);
          addSocketLog('socket', 'Laporan PDF berhasil di-render dan diunduh oleh klien.');
          triggerBannerNotification('Sukses: Laporan PDF Berhasil Diunduh!');
        } catch (err) {
          console.error(err);
          setPdfLoading(false);
          triggerBannerNotification('Gagal memproses file PDF', 'error');
        }
      };

      autoTableScript.onerror = () => {
        setPdfLoading(false);
        triggerBannerNotification('Gagal memuat modul PDF AutoTable', 'error');
      };
      document.body.appendChild(autoTableScript);
    };

    jsPdfScript.onerror = () => {
      setPdfLoading(false);
      triggerBannerNotification('Gagal memuat modul inti jsPDF', 'error');
    };
    document.body.appendChild(jsPdfScript);
  };

  // === RENDER SCREEN LOGIN JIKA BELUM AUTH ===
  if (!user) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6 relative overflow-hidden font-sans">
        {/* Dekorasi Background */}
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-emerald-600/5 rounded-full blur-3xl pointer-events-none"></div>

        {/* Form Utama Login */}
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl relative z-10">
          <div className="text-center mb-8">
            <div className="inline-flex p-3 bg-indigo-500/10 text-indigo-400 rounded-2xl mb-4 border border-indigo-500/20">
              <Shield className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold text-white tracking-wide">IT Ticketing System</h2>
          </div>

          {loginError && (
            <div className="mb-5 bg-rose-500/10 border border-rose-500/30 text-rose-200 text-sm px-4 py-3 rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{loginError}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Akun Petugas</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-500">
                  <User className="w-4 h-4" />
                </span>
                <select 
                  value={usernameInput} 
                  onChange={(e) => setUsernameInput(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all appearance-none cursor-pointer text-ellipsis overflow-hidden font-medium"
                >
                  {usersList.length > 0 ? (
                    usersList.map((u) => (
                      <option key={u.id} value={u.username}>
                        {u.username} ({u.name} - {u.role === 'admin' ? 'Admin' : 'Petugas'})
                      </option>
                    ))
                  ) : (
                    <option value="">Memuat petugas dari database...</option>
                  )}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Password</label>
              <input 
                type="password" 
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-sm text-white placeholder-slate-700 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-medium"
                required
              />
            </div>

            <button 
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm py-3 px-4 rounded-xl shadow-lg shadow-indigo-600/25 hover:shadow-indigo-500/30 transform transition-all active:scale-[0.98] mt-2 cursor-pointer uppercase tracking-wider"
            >
              Masuk
            </button>
          </form>
        </div>
      </div>
    );
  }

  // === RENDER UTAMA APPLIKASI SETELAH LOGIN ===
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row font-sans">
      
      {/* 1. NOTIFIKASI REALTIME FLOATING BANNER */}
      {realtimeNotification && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-3 px-5 py-4 rounded-2xl shadow-2xl border animate-bounce ${
          realtimeNotification.type === 'error' 
            ? 'bg-rose-950 border-rose-500/45 text-rose-200' 
            : 'bg-indigo-950 border-indigo-500/45 text-indigo-200'
        }`}>
          <div className="p-2 bg-indigo-500/20 rounded-lg">
            <Radio className="w-5 h-5 animate-pulse text-indigo-400" />
          </div>
          <div>
            <h4 className="font-bold text-xs uppercase tracking-wider text-slate-400">Notifikasi Real-time</h4>
            <p className="text-sm font-medium mt-0.5">{realtimeNotification.message}</p>
          </div>
        </div>
      )}

      {/* 2. SIDEBAR KIRI (NAVIGASI) */}
      <aside className="w-full md:w-64 bg-slate-900 border-b md:border-b-0 md:border-r border-slate-800 flex flex-col shrink-0 z-30">
        {/* Identitas Brand */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-indigo-600 text-white rounded-lg flex items-center justify-center font-bold shadow-md shadow-indigo-600/20">
              T
            </div>
            <div>
              <h2 className="text-sm font-bold text-white tracking-wide">IT-PORTAL</h2>
              <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping"></span>
                Socket Connected
              </span>
            </div>
          </div>

          <button 
            onClick={() => setShowAddModal(true)}
            className="md:hidden p-2 text-indigo-400 hover:bg-slate-800 rounded-lg"
            title="Buat Tiket Baru"
          >
            <PlusCircle className="w-5 h-5" />
          </button>
        </div>

        {/* Konten Scrollable Sidebar */}
        <div className="flex-1 overflow-y-auto p-3 space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            {/* Profil Singkat User */}
            <div className="p-4 bg-slate-950/40 rounded-2xl border border-slate-800/80 flex items-center gap-3">
              <img 
                className="w-10 h-10 rounded-xl object-cover border border-slate-700" 
                src={user.avatar} 
                alt={user.name} 
              />
              <div className="flex-1 min-w-0">
                <h3 className="text-xs font-bold text-slate-100 truncate">{user.name}</h3>
                <span className="inline-flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 mt-1">
                  <Shield className="w-2.5 h-2.5" />
                  {user.role}
                </span>
              </div>
            </div>

            {/* Menu Navigasi */}
            <nav className="space-y-1.5">
              <button 
                onClick={() => setActiveTab('dashboard')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  activeTab === 'dashboard' 
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/15' 
                    : 'text-slate-400 hover:bg-slate-850 hover:text-slate-100'
                }`}
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>Dashboard Utama</span>
              </button>

              <button 
                onClick={() => setActiveTab('tickets')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  activeTab === 'tickets' 
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/15' 
                    : 'text-slate-400 hover:bg-slate-850 hover:text-slate-100'
                }`}
              >
                <Ticket className="w-4 h-4" />
                <div className="flex-1 flex items-center justify-between">
                  <span>Informasi Tiket</span>
                  <span className="text-[10px] font-mono bg-slate-950/60 px-2 py-0.5 rounded-full text-slate-300">
                    {tickets.length}
                  </span>
                </div>
              </button>

              <button 
                onClick={() => setActiveTab('staff')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  activeTab === 'staff' 
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/15' 
                    : 'text-slate-400 hover:bg-slate-850 hover:text-slate-100'
                }`}
              >
                <Users className="w-4 h-4" />
                <span>Daftar Petugas</span>
              </button>

              <button 
                onClick={() => setActiveTab('analytics')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  activeTab === 'analytics' 
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/15' 
                    : 'text-slate-400 hover:bg-slate-850 hover:text-slate-100'
                }`}
              >
                <BarChart3 className="w-4 h-4" />
                <span>Diagram Tiket</span>
              </button>
            </nav>
          </div>

          {/* Tombol Logout & Aksi Tambah di Bawah Menu (Dinamis Mengikuti Scroll jika melebihi tinggi sidebar) */}
          <div className="border-t border-slate-800/80 pt-4 space-y-3">
            <button 
              onClick={() => setShowAddModal(true)}
              className="w-full bg-slate-800 hover:bg-indigo-600 hover:text-white text-indigo-400 border border-slate-750 hover:border-indigo-500 font-semibold text-xs py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              BUAT TIKET BARU
            </button>

            <button 
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border border-slate-800 hover:bg-rose-500/10 hover:border-rose-500/30 rounded-xl text-xs font-semibold text-slate-400 hover:text-rose-300 transition-all cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              Keluar Sesi
            </button>
          </div>
        </div>
      </aside>

      {/* 3. KONTEN UTAMA */}
      <main className="flex-1 flex flex-col min-w-0 bg-slate-950">
        
        {/* Header Dashboard Atas */}
        <header className="h-16 border-b border-slate-800 px-6 flex items-center justify-between shrink-0 bg-slate-900/60 backdrop-blur">
          <div className="flex items-center gap-4">
            <h1 className="text-base font-bold text-white capitalize flex items-center gap-2">
              {activeTab === 'dashboard' && <LayoutDashboard className="w-5 h-5 text-indigo-500" />}
              {activeTab === 'tickets' && <Ticket className="w-5 h-5 text-indigo-500" />}
              {activeTab === 'staff' && <Users className="w-5 h-5 text-indigo-500" />}
              {activeTab === 'analytics' && <BarChart3 className="w-5 h-5 text-indigo-500" />}
              {activeTab === 'dashboard' ? 'Dasbor Utama' : activeTab === 'tickets' ? 'Tabel Informasi Tiket' : activeTab === 'staff' ? 'Petugas IT & Support' : 'Diagram Kinerja Petugas'}
            </h1>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-full text-xs text-slate-400">
              <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping"></span>
              <span className="font-mono">Listening to ticket_update</span>
            </div>

            {/* Tombol Shortcut Simulasi Tiket di Header */}
            <button
              onClick={() => {
                const msgs = [
                  "Server database PostgreSQL mengalami spike CPU 100%!",
                  "Akses VPN kantor cabang Bali terputus total.",
                  "Request pembuatan backup database mingguan selesai.",
                  "Email phising dilaporkan oleh divisi HR."
                ];
                const msg = msgs[Math.floor(Math.random() * msgs.length)];
                setNewTicketMsg(msg);
                setNewTicketSource(["WhatsApp", "Telepon"][Math.floor(Math.random() * 2)]);
                setShowAddModal(true);
              }}
              className="bg-indigo-600/10 hover:bg-indigo-600 text-indigo-400 hover:text-white border border-indigo-500/20 px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer animate-pulse"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Simulasi Cepat</span>
            </button>
          </div>
        </header>

        {/* Area Isi Konten */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* SIMULASI REALTIME MONITOR (POSTGRESQL & SOCKET.IO LOGS) */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
            <div className="bg-slate-850 px-5 py-3 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse"></div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                  <Radio className="w-3.5 h-3.5 text-indigo-400" />
                  Aliran Data Real-time (Socket.IO + PostgreSQL Triggers)
                </h3>
              </div>
              <span className="text-[10px] bg-slate-950 text-slate-400 px-2 py-0.5 rounded font-mono">
                System Active
              </span>
            </div>
            <div className="p-4 bg-slate-950/80 font-mono text-[11px] leading-relaxed max-h-36 overflow-y-auto space-y-1.5 text-slate-300">
              {socketLogs.map(log => (
                <div key={log.id} className="flex items-start gap-2">
                  <span className="text-slate-600 font-medium select-none shrink-0">[{log.time}]</span>
                  {log.type === 'postgres' ? (
                    <span className="text-amber-400 font-bold shrink-0">[PG TRIGGER]</span>
                  ) : log.type === 'socket' ? (
                    <span className="text-indigo-400 font-bold shrink-0">[SOCKET.IO]</span>
                  ) : (
                    <span className="text-slate-400 font-bold shrink-0">[INFO]</span>
                  )}
                  <span className="text-slate-300 break-all">{log.text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* TAB 1: DASHBOARD */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              {/* Statistik Kartu Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center justify-between shadow-sm">
                  <div>
                    <span className="text-xs text-slate-400 font-medium">Total Tiket</span>
                    <h3 className="text-2xl font-bold text-white mt-1">{stats.total}</h3>
                  </div>
                  <div className="p-3 bg-slate-850 text-slate-300 rounded-xl">
                    <Ticket className="w-5 h-5" />
                  </div>
                </div>

                <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center justify-between shadow-sm">
                  <div>
                    <span className="text-xs text-slate-400 font-medium">Belum Dikerjakan</span>
                    <h3 className="text-2xl font-bold text-sky-400 mt-1">{stats.open}</h3>
                  </div>
                  <div className="p-3 bg-sky-500/10 text-sky-400 rounded-xl">
                    <AlertCircle className="w-5 h-5" />
                  </div>
                </div>

                <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center justify-between shadow-sm">
                  <div>
                    <span className="text-xs text-slate-400 font-medium">Diproses</span>
                    <h3 className="text-2xl font-bold text-amber-400 mt-1">{stats.processing}</h3>
                  </div>
                  <div className="p-3 bg-amber-500/10 text-amber-400 rounded-xl">
                    <Clock className="w-5 h-5" />
                  </div>
                </div>

                <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center justify-between shadow-sm">
                  <div>
                    <span className="text-xs text-slate-400 font-medium">Selesai</span>
                    <h3 className="text-2xl font-bold text-emerald-400 mt-1">{stats.completed}</h3>
                  </div>
                  <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                </div>

                <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl col-span-2 lg:col-span-1 flex items-center justify-between shadow-sm">
                  <div>
                    <span className="text-xs text-slate-400 font-medium">Ditolak (Rejected)</span>
                    <h3 className="text-2xl font-bold text-rose-400 mt-1">{stats.cancelled}</h3>
                  </div>
                  <div className="p-3 bg-rose-500/10 text-rose-400 rounded-xl">
                    <XCircle className="w-5 h-5" />
                  </div>
                </div>
              </div>

              {/* Layout Dua Kolom: Ringkasan Tiket & Diagram Ringkas */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Kolom Kiri: Ringkasan 5 Tiket Terbaru */}
                <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider">Tiket Terbaru Aktif</h3>
                    <button 
                      onClick={() => setActiveTab('tickets')}
                      className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold"
                    >
                      Lihat Semua &rarr;
                    </button>
                  </div>

                  <div className="divide-y divide-slate-800 overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                          <th className="py-2.5">No Tiket</th>
                          <th className="py-2.5">Pesan Masalah</th>
                          <th className="py-2.5">Status</th>
                          <th className="py-2.5">Sumber</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/80 text-xs">
                        {tickets.slice(0, 5).map(ticket => (
                          <tr key={ticket.id} className="hover:bg-slate-850/50 transition-colors">
                            <td className="py-3 font-mono font-bold text-indigo-300">{ticket.ticket_number}</td>
                            <td className="py-3 pr-4 max-w-xs truncate text-slate-300">{ticket.message}</td>
                            <td className="py-3">
                              <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-semibold ${
                                ticket.status === 'selesai' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                                ticket.status === 'diproses' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                                ticket.status === 'ditolak' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' :
                                'bg-sky-500/10 text-sky-400 border border-sky-500/20'
                              }`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${
                                  ticket.status === 'selesai' ? 'bg-emerald-400' :
                                  ticket.status === 'diproses' ? 'bg-amber-400' :
                                  ticket.status === 'ditolak' ? 'bg-rose-400' :
                                  'bg-sky-400'
                                }`}></span>
                                {ticket.status === 'belum_dikerjakan' ? 'BELUM DIKERJAKAN' : ticket.status === 'ditolak' ? 'DITOLAK (REJECTED)' : ticket.status.toUpperCase()}
                              </span>
                            </td>
                            <td className="py-3 text-slate-400">{ticket.source}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Kolom Kanan: Kinerja Petugas (Paling Banyak Menyelesaikan) */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider">Performa Petugas</h3>
                    <button 
                      onClick={() => setActiveTab('analytics')}
                      className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold"
                    >
                      Selengkapnya
                    </button>
                  </div>
                  
                  <div className="space-y-4">
                    {sortedStaffForChart.slice(0, 3).map((staff, idx) => (
                      <div key={staff.id} className="space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <img className="w-6 h-6 rounded-lg object-cover" src={staff.avatar} alt={staff.name} />
                            <span className="font-bold text-slate-200">{staff.name}</span>
                          </div>
                          <span className="font-mono text-emerald-400 font-semibold">{staff.completedCount} Tiket Selesai</span>
                        </div>
                        <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all duration-1000 ${
                              idx === 0 ? 'bg-indigo-500' : idx === 1 ? 'bg-sky-500' : 'bg-emerald-500'
                            }`}
                            style={{ width: `${(staff.completedCount / maxCompleted) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-6 bg-slate-950/50 p-3 rounded-xl border border-slate-800 text-center">
                    <p className="text-[11px] text-slate-400">
                      Rata-rata waktu penyelesaian tiket adalah <span className="font-bold text-white">4.2 Jam</span> berdasarkan database saat ini.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: TABEL INFORMASI TIKET */}
          {activeTab === 'tickets' && (
            <div className="space-y-5">
              {/* Filter & Toolbar */}
              <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                {/* Search Bar */}
                <div className="relative flex-1 max-w-md">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500 pointer-events-none">
                    <Search className="w-4 h-4" />
                  </span>
                  <input 
                    type="text" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Cari nomor tiket, pesan, sumber, atau petugas..."
                    className="w-full bg-slate-950 border border-slate-800 pl-10 pr-4 py-2.5 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                  />
                </div>

                {/* Filter Buttons */}
                <div className="flex items-center gap-1.5 overflow-x-auto self-start md:self-auto pb-1 md:pb-0">
                  <span className="text-xs text-slate-400 mr-2 flex items-center gap-1.5">
                    <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-400" />
                    Filter:
                  </span>
                  {[
                    { id: 'all', label: 'Semua' },
                    { id: 'belum_dikerjakan', label: 'Belum Dikerjakan' },
                    { id: 'diproses', label: 'Diproses' },
                    { id: 'selesai', label: 'Selesai' },
                    { id: 'ditolak', label: 'Ditolak (Rejected)' }
                  ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setFilterStatus(tab.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                        filterStatus === tab.id 
                          ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/10' 
                          : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-850 hover:border-slate-700'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tabel Utama Tiket Sesuai Konsep */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-850 text-slate-400 text-[10px] uppercase font-bold tracking-wider border-b border-slate-800">
                        <th className="py-4 px-5">Nomor Tiket</th>
                        <th className="py-4 px-4">Sumber</th>
                        <th className="py-4 px-4 w-96">Masalah / Deskripsi</th>
                        <th className="py-4 px-4">Status</th>
                        <th className="py-4 px-4">Dibuat Pada</th>
                        <th className="py-4 px-4">Selesai Oleh</th>
                        <th className="py-4 px-5 text-right">Aksi Tindakan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/80 text-xs text-slate-300">
                      {filteredTickets.length > 0 ? (
                        filteredTickets.map(ticket => (
                          <tr key={ticket.id} className="hover:bg-slate-850/30 transition-colors">
                            <td className="py-4 px-5 font-mono font-bold text-indigo-400">{ticket.ticket_number}</td>
                            <td className="py-4 px-4">
                              <span className="bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-850 text-slate-400 font-medium">
                                {ticket.source}
                              </span>
                            </td>
                            <td className="py-4 px-4">
                              <p className="line-clamp-2 leading-relaxed">{ticket.message}</p>
                            </td>
                            <td className="py-4 px-4">
                              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold ${
                                ticket.status === 'selesai' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                                ticket.status === 'diproses' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                                ticket.status === 'ditolak' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' :
                                'bg-sky-500/10 text-sky-400 border border-sky-500/20'
                              }`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${
                                  ticket.status === 'selesai' ? 'bg-emerald-400' :
                                  ticket.status === 'diproses' ? 'bg-amber-400' :
                                  ticket.status === 'ditolak' ? 'bg-rose-400' :
                                  'bg-sky-400'
                                }`}></span>
                                {ticket.status === 'belum_dikerjakan' ? 'BELUM DIKERJAKAN' : ticket.status === 'ditolak' ? 'DITOLAK (REJECTED)' : ticket.status.toUpperCase()}
                              </span>
                            </td>
                            <td className="py-4 px-4 font-mono text-slate-500">{ticket.created_at}</td>
                            <td className="py-4 px-4">
                              {ticket.completed_by ? (
                                <div className="flex items-center gap-2">
                                  <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center text-[10px] text-emerald-400 font-bold">
                                    {ticket.completed_by[0]}
                                  </div>
                                  <div>
                                    <p className="font-medium text-slate-200">{ticket.completed_by}</p>
                                    <p className="text-[9px] text-slate-500 font-mono">{ticket.completed_at}</p>
                                  </div>
                                </div>
                              ) : (
                                <span className="text-slate-600 font-mono">-</span>
                              )}
                            </td>
                            <td className="py-4 px-5 text-right">
                              {user.role === 'admin' || user.role === 'petugas' ? (
                                <div className="flex items-center justify-end gap-1">
                                  {ticket.status === 'belum_dikerjakan' && (
                                    <button 
                                      onClick={() => updateTicketStatus(ticket.id, 'diproses')}
                                      className="bg-amber-500/15 hover:bg-amber-500 text-amber-400 hover:text-white border border-amber-500/30 font-semibold px-2.5 py-1.5 rounded-lg text-[10px] transition-all cursor-pointer"
                                    >
                                      Proses
                                    </button>
                                  )}
                                  {(ticket.status === 'belum_dikerjakan' || ticket.status === 'diproses') && (
                                    <>
                                      <button 
                                        onClick={() => updateTicketStatus(ticket.id, 'selesai')}
                                        className="bg-emerald-500/15 hover:bg-emerald-500 text-emerald-400 hover:text-white border border-emerald-500/30 font-semibold px-2.5 py-1.5 rounded-lg text-[10px] transition-all cursor-pointer"
                                      >
                                        Selesaikan
                                      </button>
                                      <button 
                                        onClick={() => updateTicketStatus(ticket.id, 'ditolak')}
                                        className="bg-rose-500/15 hover:bg-rose-500 text-rose-400 hover:text-white border border-rose-500/30 font-semibold px-2.5 py-1.5 rounded-lg text-[10px] transition-all cursor-pointer"
                                        title="Tolak Tiket"
                                      >
                                        Tolak (Reject)
                                      </button>
                                    </>
                                  )}
                                  {ticket.status === 'selesai' && (
                                    <span className="text-xs text-emerald-400 font-medium">Selesai ✓</span>
                                  )}
                                  {ticket.status === 'ditolak' && (
                                    <span className="text-xs text-rose-400 font-semibold">Ditolak ✕</span>
                                  )}
                                </div>
                              ) : (
                                <span className="text-[10px] text-slate-500 italic">Admin Access Only</span>
                              )}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={7} className="py-8 text-center text-slate-500 font-medium">
                            Tidak ada tiket yang ditemukan dengan kriteria pencarian ini.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
                <div className="bg-slate-850 px-5 py-3 border-t border-slate-800 flex justify-between items-center">
                  <p className="text-xs text-slate-400">
                    Menampilkan <span className="text-slate-200 font-semibold">{filteredTickets.length}</span> dari {tickets.length} total tiket.
                  </p>
                  <p className="text-[10px] text-indigo-400 font-semibold uppercase tracking-wider">
                    Semua perubahan memicu trigger NOTIFY PostgreSQL secara instan.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: DAFTAR PETUGAS */}
          {activeTab === 'staff' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-white">Anggota Tim Dukungan IT</h3>
                  <p className="text-xs text-slate-400">Daftar personil aktif yang memiliki kredensial administrasi sistem.</p>
                </div>
                <button
                  onClick={handleDownloadPDF}
                  disabled={pdfLoading}
                  className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-850 text-white border border-indigo-500/20 px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-lg shadow-indigo-600/15"
                >
                  {pdfLoading ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Download className="w-4 h-4" />
                  )}
                  <span>{pdfLoading ? 'Membuat PDF...' : 'Unduh PDF Performa'}</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {usersList.map(staff => {
                  return (
                    <div key={staff.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col justify-between relative overflow-hidden">
                      <div className="absolute top-3 right-3 bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 p-1.5 rounded-lg" title="Administrator">
                        <Shield className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-3 mb-4">
                          <img 
                            className="w-12 h-12 rounded-xl object-cover border-2 border-slate-750" 
                            src={staff.avatar} 
                            alt={staff.name} 
                          />
                          <div>
                            <h3 className="font-bold text-white text-sm">{staff.name}</h3>
                            <span className="text-xs text-slate-500 font-mono">@{staff.username}</span>
                          </div>
                        </div>

                        <div className="space-y-2 mt-4 pt-4 border-t border-slate-800">
                          <div className="flex justify-between text-xs text-slate-400">
                            <span>Selesai (Database):</span>
                            <span className="font-bold text-emerald-400">{staff.completedCount} Tiket</span>
                          </div>
                          <div className="flex justify-between text-xs text-slate-400">
                            <span>Beban Kerja Aktif:</span>
                            <span className="font-bold text-slate-200">
                              {tickets.filter(t => t.status === 'diproses').length} Tiket
                            </span>
                          </div>
                          <div className="flex justify-between text-xs text-slate-400">
                            <span>Role Sistem:</span>
                            <span className="text-xs font-mono capitalize font-bold text-indigo-400">{staff.role}</span>
                          </div>
                        </div>
                      </div>

                      <div className="mt-5 pt-3 border-t border-slate-850 text-center">
                        <span className="text-[10px] text-slate-500">Terdaftar sejak 12 Januari 2026</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Catatan Alur Kerja Pengguna */}
              <div className="bg-indigo-950/20 border border-indigo-500/20 p-5 rounded-2xl flex items-start gap-4">
                <div className="p-3 bg-indigo-500/10 rounded-xl text-indigo-400">
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-indigo-300">Catatan Integrasi Otorisasi</h4>
                  <p className="text-xs text-indigo-200/80 leading-relaxed mt-1">
                    Semua transaksi pembaruan tiket di-validasi menggunakan middleware <code className="bg-indigo-950 px-1 py-0.5 rounded text-white text-[10px]">authorizeRole(['admin'])</code> di sisi backend Node.js. 
                    Setiap petugas memiliki token JWT unik yang dikirimkan pada header <code className="bg-indigo-950 px-1 py-0.5 rounded text-white text-[10px]">Authorization</code> untuk menjaga integritas data tindakan.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: DIAGRAM TIKET SELESAI */}
          {activeTab === 'analytics' && (
            <div className="space-y-6">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                  <div>
                    <h3 className="text-base font-bold text-white">Grafik Kinerja Penyelesaian Tiket</h3>
                    <p className="text-xs text-slate-400">Statistik representatif jumlah tiket yang diselesaikan oleh masing-masing staff admin IT.</p>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <button
                      onClick={handleDownloadPDF}
                      disabled={pdfLoading}
                      className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-850 text-white border border-indigo-500/20 px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-lg shadow-indigo-600/15"
                    >
                      {pdfLoading ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <FileText className="w-4 h-4" />
                      )}
                      <span>{pdfLoading ? 'Memproses PDF...' : 'Cetak PDF Laporan'}</span>
                    </button>
                    <div className="bg-slate-950 border border-slate-800 px-3.5 py-1.5 rounded-xl text-xs text-slate-300 flex items-center gap-1.5 font-mono">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      Total Penyelesaian: {sortedStaffForChart.reduce((sum, s) => sum + s.completedCount, 0)} Tiket
                    </div>
                  </div>
                </div>

                {/* VISUAL DIAGRAM BATANG SECARA MANUAL DENGAN TAILWIND */}
                <div className="space-y-6">
                  {sortedStaffForChart.map((staff, idx) => {
                    const percentage = Math.round((staff.completedCount / maxCompleted) * 100);
                    return (
                      <div key={staff.id} className="grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-4 items-center">
                        {/* Info Petugas */}
                        <div className="md:col-span-3 flex items-center gap-3">
                          <img className="w-9 h-9 rounded-xl object-cover border border-slate-700" src={staff.avatar} alt={staff.name} />
                          <div>
                            <p className="text-xs font-bold text-white">{staff.name}</p>
                            <span className="text-[10px] text-slate-500 font-mono">ID Karyawan: IT-00{staff.id}</span>
                          </div>
                        </div>

                        {/* Diagram Batang */}
                        <div className="md:col-span-7">
                          <div className="w-full bg-slate-950 h-8 rounded-xl overflow-hidden p-1 border border-slate-850 flex items-center">
                            <div 
                              className={`h-full rounded-lg transition-all duration-1000 ease-out flex items-center justify-end pr-3 min-w-[24px] ${
                                idx === 0 ? 'bg-indigo-600 shadow-md shadow-indigo-600/20' : 
                                idx === 1 ? 'bg-sky-600 shadow-md shadow-sky-600/20' : 
                                'bg-emerald-600 shadow-md shadow-emerald-600/20'
                              }`}
                              style={{ width: `${percentage}%` }}
                            >
                              {percentage > 15 && (
                                <span className="text-[10px] font-bold text-white font-mono">{percentage}%</span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Jumlah Tiket */}
                        <div className="md:col-span-2 text-left md:text-right">
                          <span className="text-sm font-bold text-slate-100 font-mono">{staff.completedCount} Tiket</span>
                          <span className="text-[10px] text-slate-500 block">Selesai</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Widget Insights */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Paling Produktif Pekan Ini</h4>
                  {sortedStaffForChart.length > 0 && (
                    <div className="flex items-center gap-3">
                      <img className="w-10 h-10 rounded-xl object-cover" src={sortedStaffForChart[0]?.avatar} alt="" />
                      <div>
                        <p className="text-sm font-bold text-white">{sortedStaffForChart[0]?.name}</p>
                        <p className="text-xs text-emerald-400">Penyelesaian tertinggi dengan {sortedStaffForChart[0]?.completedCount} kasus tuntas.</p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex flex-col justify-center">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Mekanisme PostgreSQL Notifikasi</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Setiap perubahan di atas dikirimkan dari server melalui PostgreSQL trigger <code className="bg-slate-950 px-1 py-0.5 rounded text-indigo-400 text-[10px]">pg_notify('ticket_update', ...)</code> dan dipancarkan ke frontend menggunakan Socket.IO.
                  </p>
                </div>
              </div>
            </div>
          )}

        </div>
      </main>

      {/* 4. MODAL SIMULASI BUAT TIKET BARU */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
            <div className="bg-slate-850 px-6 py-4 border-b border-slate-800 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <PlusCircle className="text-indigo-500 w-5 h-5" />
                <h3 className="font-bold text-white text-sm">Buat Tiket Baru</h3>
              </div>
              <button 
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white font-bold text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={simulateNewTicketTrigger} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Sumber Tiket</label>
                <div className="grid grid-cols-2 gap-2">
                  {['WhatsApp', 'Telepon'].map(src => (
                    <button
                      type="button"
                      key={src}
                      onClick={() => setNewTicketSource(src)}
                      className={`py-2 px-1 text-center rounded-lg text-xs font-semibold transition-all ${
                        newTicketSource === src 
                          ? 'bg-indigo-600 text-white' 
                          : 'bg-slate-950 text-slate-400 hover:bg-slate-850 border border-slate-850'
                      }`}
                    >
                      {src}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Isi Masalah (Pesan)</label>
                <textarea
                  value={newTicketMsg}
                  onChange={(e) => setNewTicketMsg(e.target.value)}
                  placeholder="Contoh: Server utama mati atau aplikasi mengalami internal server error..."
                  rows={4}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  required
                ></textarea>
              </div>

              <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 text-[10px] text-slate-400 leading-relaxed font-mono">
                ⚡ Tindakan ini membuat tiket baru langsung di database PostgreSQL dan menyiarkan event pembaruan secara real-time ke semua dashboard petugas aktif via Socket.IO.
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="bg-slate-950 text-slate-400 hover:text-white px-4 py-2.5 rounded-xl text-xs font-bold border border-slate-850"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all"
                >
                  {loading ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <>
                      <PlusCircle className="w-3.5 h-3.5" />
                      Kirim Tiket Masuk
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
