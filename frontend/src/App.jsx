import React, { useState, useEffect } from "react";
import { api } from "./services/api";
import { 
  Clock, 
  LogIn, 
  LogOut, 
  User, 
  ShieldCheck, 
  Calendar, 
  History, 
  AlertCircle,
  FileText,
  Briefcase,
  Download
} from "lucide-react";
import { exportToCSV } from "./utils/exportCsv";

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authMode, setAuthMode] = useState("login"); // 'login' | 'register'
  
  // Auth Form State
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    full_name: "",
    role: "employee",
  });
  const [authError, setAuthError] = useState("");

  // Clock state
  const [isClockedIn, setIsClockedIn] = useState(false);
  const [currentEntry, setCurrentEntry] = useState(null);
  const [elapsedTime, setElapsedTime] = useState("00:00:00");
  const [note, setNote] = useState("");
  const [history, setHistory] = useState([]);
  const [adminHistory, setAdminHistory] = useState([]);
  const [activeTab, setActiveTab] = useState("my-clock"); // 'my-clock' | 'admin-reports'

  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    try {
      const userData = await api.getMe();
      setUser(userData);
      await loadTimesheetData();
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const loadTimesheetData = async () => {
    try {
      const status = await api.getStatus();
      setIsClockedIn(status.is_clocked_in);
      setCurrentEntry(status.current_entry);

      const hist = await api.getMyHistory();
      setHistory(hist);
    } catch (err) {
      console.error(err);
    }
  };

  // Temporizador en vivo
  useEffect(() => {
    let interval = null;
    if (isClockedIn && currentEntry?.clock_in) {
      const start = new Date(currentEntry.clock_in).getTime();
      interval = setInterval(() => {
        const now = new Date().getTime();
        const diff = Math.max(0, now - start);
        const hours = Math.floor(diff / 3600000);
        const minutes = Math.floor((diff % 3600000) / 60000);
        const seconds = Math.floor((diff % 60000) / 1000);
        setElapsedTime(
          `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`
        );
      }, 1000);
    } else {
      setElapsedTime("00:00:00");
    }
    return () => clearInterval(interval);
  }, [isClockedIn, currentEntry]);

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setAuthError("");
    try {
      if (authMode === "login") {
        await api.login(formData.email, formData.password);
      } else {
        await api.register(formData);
        await api.login(formData.email, formData.password);
      }
      await checkSession();
    } catch (err) {
      setAuthError(err.message);
    }
  };

  const handleClockToggle = async () => {
    try {
      if (isClockedIn) {
        await api.clockOut();
        setNote("");
      } else {
        await api.clockIn(note);
      }
      await loadTimesheetData();
    } catch (err) {
      alert(err.message);
    }
  };

  const loadAdminReports = async () => {
    try {
      const reports = await api.getAdminHistory();
      setAdminHistory(reports);
      setActiveTab("admin-reports");
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-200 flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-indigo-500"></div>
      </div>
    );
  }

  // --- Vista de Login / Registro ---
  if (!user) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="p-3 bg-indigo-600/20 text-indigo-400 rounded-xl">
              <Clock className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">WorkClock AI</h1>
              <p className="text-xs text-slate-400">Control Horario y Gestión de Jornada</p>
            </div>
          </div>

          <div className="flex bg-slate-800/60 p-1 rounded-xl mb-6">
            <button
              onClick={() => setAuthMode("login")}
              className={`flex-1 py-2 text-sm font-semibold rounded-lg transition ${
                authMode === "login" ? "bg-indigo-600 text-white shadow" : "text-slate-400 hover:text-white"
              }`}
            >
              Iniciar Sesión
            </button>
            <button
              onClick={() => setAuthMode("register")}
              className={`flex-1 py-2 text-sm font-semibold rounded-lg transition ${
                authMode === "register" ? "bg-indigo-600 text-white shadow" : "text-slate-400 hover:text-white"
              }`}
            >
              Registrarse
            </button>
          </div>

          {authError && (
            <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/30 text-rose-400 text-sm rounded-lg flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{authError}</span>
            </div>
          )}

          <form onSubmit={handleAuthSubmit} className="space-y-4">
            {authMode === "register" && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Nombre Completo</label>
                  <input
                    type="text"
                    required
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-indigo-500"
                    placeholder="Ej. Jorge Pérez"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Rol</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="employee">Empleado</option>
                    <option value="admin">Administrador / RRHH</option>
                  </select>
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Correo Electrónico</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-indigo-500"
                placeholder="ejemplo@empresa.com"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Contraseña</label>
              <input
                type="password"
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-indigo-500"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg shadow-lg transition mt-2 cursor-pointer"
            >
              {authMode === "login" ? "Ingresar al Panel" : "Crear Cuenta"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // --- Vista Autenticada ---
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-600/20 text-indigo-400 rounded-lg">
              <Clock className="w-6 h-6" />
            </div>
            <span className="font-bold text-lg tracking-tight">WorkClock API</span>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-800/80 rounded-lg border border-slate-700 text-xs">
              <User className="w-3.5 h-3.5 text-slate-400" />
              <span className="font-semibold text-slate-200">{user.full_name}</span>
              <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                user.role === "admin" ? "bg-amber-500/20 text-amber-300 border border-amber-500/30" : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
              }`}>
                {user.role}
              </span>
            </div>

            <button
              onClick={() => {
                api.logout();
                setUser(null);
              }}
              className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition"
              title="Cerrar sesión"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8 flex-1 w-full space-y-8">
        {user.role === "admin" && (
          <div className="flex gap-2 border-b border-slate-800 pb-3">
            <button
              onClick={() => setActiveTab("my-clock")}
              className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition ${
                activeTab === "my-clock" ? "bg-indigo-600 text-white" : "text-slate-400 hover:bg-slate-800"
              }`}
            >
              <Clock className="w-4 h-4" /> Mi Fichaje
            </button>
            <button
              onClick={loadAdminReports}
              className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition ${
                activeTab === "admin-reports" ? "bg-indigo-600 text-white" : "text-slate-400 hover:bg-slate-800"
              }`}
            >
              <ShieldCheck className="w-4 h-4" /> Reporte Global de Personal
            </button>
          </div>
        )}

        {activeTab === "my-clock" ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Widget de Fichaje */}
            <div className="lg:col-span-1 bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col items-center justify-center text-center shadow-xl">
              <div className={`w-3.5 h-3.5 rounded-full mb-3 animate-pulse ${
                isClockedIn ? "bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.8)]" : "bg-rose-500"
              }`} />
              
              <p className="text-xs uppercase font-bold tracking-widest text-slate-400 mb-1">
                {isClockedIn ? "Jornada en Curso" : "Fuera de Servicio"}
              </p>

              <div className="text-5xl font-mono font-bold tracking-tight text-white my-4">
                {elapsedTime}
              </div>

              {isClockedIn && currentEntry && (
                <p className="text-xs text-slate-400 mb-6">
                  Entrada registrada: <span className="text-indigo-300 font-semibold">{new Date(currentEntry.clock_in).toLocaleTimeString()}</span>
                </p>
              )}

              {!isClockedIn && (
                <input
                  type="text"
                  placeholder="Nota opcional (ej: Teletrabajo)"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white mb-4 focus:outline-none focus:border-indigo-500"
                />
              )}

              <button
                onClick={handleClockToggle}
                className={`w-full py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg transition cursor-pointer ${
                  isClockedIn
                    ? "bg-rose-600 hover:bg-rose-500 text-white"
                    : "bg-emerald-600 hover:bg-emerald-500 text-white"
                }`}
              >
                {isClockedIn ? (
                  <>
                    <LogOut className="w-5 h-5" /> Fichar Salida
                  </>
                ) : (
                  <>
                    <LogIn className="w-5 h-5" /> Fichar Entrada
                  </>
                )}
              </button>
            </div>

            {/* Historial Propio */}
            <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col">
              <div className="flex items-center gap-2 mb-6">
                <History className="w-5 h-5 text-indigo-400" />
                <h2 className="text-lg font-bold">Mi Historial de Registros</h2>
              </div>

              {history.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-slate-500 py-12">
                  <Briefcase className="w-12 h-12 mb-2 opacity-30" />
                  <p className="text-sm">Aún no tienes jornadas registradas.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-slate-300">
                    <thead className="bg-slate-800/60 text-slate-400 text-xs uppercase tracking-wider">
                      <tr>
                        <th className="py-3 px-4">Fecha</th>
                        <th className="py-3 px-4">Entrada</th>
                        <th className="py-3 px-4">Salida</th>
                        <th className="py-3 px-4">Total</th>
                        <th className="py-3 px-4">Nota</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {history.map((entry) => (
                        <tr key={entry.id} className="hover:bg-slate-800/30 transition">
                          <td className="py-3 px-4 font-medium text-slate-200">
                            {new Date(entry.clock_in).toLocaleDateString()}
                          </td>
                          <td className="py-3 px-4 text-emerald-400">
                            {new Date(entry.clock_in).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </td>
                          <td className="py-3 px-4 text-rose-400">
                            {entry.clock_out 
                              ? new Date(entry.clock_out).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) 
                              : "En curso..."}
                          </td>
                          <td className="py-3 px-4 font-mono font-semibold text-white">
                            {entry.total_hours != null ? `${entry.total_hours} h` : "-"}
                          </td>
                          <td className="py-3 px-4 text-xs text-slate-400">
                            {entry.note || "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Reportes Globales (Admin) con Botón CSV */
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-amber-400" />
                <h2 className="text-lg font-bold">Control General de Jornada — Todos los Empleados</h2>
              </div>

              <button
                onClick={() => {
                  const dateStr = new Date().toISOString().split("T")[0];
                  exportToCSV(adminHistory, `fichajes_empresa_${dateStr}.csv`);
                }}
                disabled={adminHistory.length === 0}
                className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-lg shadow transition cursor-pointer"
              >
                <Download className="w-4 h-4" />
                Exportar a CSV
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="bg-slate-800/60 text-slate-400 text-xs uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">ID Empleado</th>
                    <th className="py-3 px-4">Fecha</th>
                    <th className="py-3 px-4">Entrada</th>
                    <th className="py-3 px-4">Salida</th>
                    <th className="py-3 px-4">Horas Netas</th>
                    <th className="py-3 px-4">Nota</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {adminHistory.map((entry) => (
                    <tr key={entry.id} className="hover:bg-slate-800/30 transition">
                      <td className="py-3 px-4 font-bold text-indigo-400">
                        Usuario #{entry.user_id}
                      </td>
                      <td className="py-3 px-4 text-slate-200">
                        {new Date(entry.clock_in).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 text-emerald-400">
                        {new Date(entry.clock_in).toLocaleTimeString()}
                      </td>
                      <td className="py-3 px-4 text-rose-400">
                        {entry.clock_out ? new Date(entry.clock_out).toLocaleTimeString() : "En progreso"}
                      </td>
                      <td className="py-3 px-4 font-mono font-semibold text-white">
                        {entry.total_hours != null ? `${entry.total_hours} h` : "-"}
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-400">
                        {entry.note || "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}