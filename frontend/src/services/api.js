const API_URL = "http://127.0.0.1:8000/api/v1";

const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

export const api = {
  async register(userData) {
    const res = await fetch(`${API_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(userData),
    });
    if (!res.ok) throw new Error((await res.json()).detail || "Error en el registro");
    return res.json();
  },

  async login(email, password) {
    const formData = new URLSearchParams();
    formData.append("username", email);
    formData.append("password", password);

    const res = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: formData.toString(),
    });
    if (!res.ok) throw new Error((await res.json()).detail || "Credenciales incorrectas");
    const data = await res.json();
    localStorage.setItem("token", data.access_token);
    return data;
  },

  async getMe() {
    const res = await fetch(`${API_URL}/users/me`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error("No autenticado");
    return res.json();
  },

  async getStatus() {
    const res = await fetch(`${API_URL}/timesheet/status`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error("Error al obtener estado");
    return res.json();
  },

  async clockIn(note = "") {
    const res = await fetch(`${API_URL}/timesheet/clock-in`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ note: note || null }),
    });
    if (!res.ok) throw new Error((await res.json()).detail || "Error al fichar entrada");
    return res.json();
  },

  async clockOut() {
    const res = await fetch(`${API_URL}/timesheet/clock-out`, {
      method: "POST",
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error((await res.json()).detail || "Error al fichar salida");
    return res.json();
  },

  async getMyHistory() {
    const res = await fetch(`${API_URL}/timesheet/me`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error("Error al obtener historial");
    return res.json();
  },

  async getAdminHistory() {
    const res = await fetch(`${API_URL}/timesheet/admin/all`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error("Error al obtener historial global");
    return res.json();
  },

  logout() {
    localStorage.removeItem("token");
  }
};