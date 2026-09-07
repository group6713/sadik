const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:4000/api";

async function request(path, { method = "GET", body, token } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (res.status === 204) return null;

  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error((data && data.error) || "Server bilan bog'lanishda xatolik yuz berdi");
  }
  return data;
}

export const api = {
  login: (username, password) => request("/auth/login", { method: "POST", body: { username, password } }),
  me: (token) => request("/auth/me", { token }),

  branches: {
    list: (token) => request("/branches", { token }),
    create: (token, name) => request("/branches", { method: "POST", body: { name }, token }),
    setChildren: (token, id, count) =>
      request(`/branches/${id}/children`, { method: "PUT", body: { count }, token }),
    remove: (token, id) => request(`/branches/${id}`, { method: "DELETE", token }),
  },

  norms: {
    list: (token) => request("/norms", { token }),
    create: (token, data) => request("/norms", { method: "POST", body: data, token }),
    update: (token, id, data) => request(`/norms/${id}`, { method: "PUT", body: data, token }),
    remove: (token, id) => request(`/norms/${id}`, { method: "DELETE", token }),
  },

  stock: {
    list: (token, branchId) => request(`/stock?branchId=${branchId}`, { token }),
    create: (token, data) => request("/stock", { method: "POST", body: data, token }),
    remove: (token, id) => request(`/stock/${id}`, { method: "DELETE", token }),
  },

  users: {
    list: (token) => request("/users", { token }),
    create: (token, data) => request("/users", { method: "POST", body: data, token }),
    update: (token, id, data) => request(`/users/${id}`, { method: "PUT", body: data, token }),
    remove: (token, id) => request(`/users/${id}`, { method: "DELETE", token }),
  },

  menu: {
    dishes: {
      list: (token) => request("/menu/dishes", { token }),
      create: (token, data) => request("/menu/dishes", { method: "POST", body: data, token }),
      update: (token, id, data) => request(`/menu/dishes/${id}`, { method: "PUT", body: data, token }),
      remove: (token, id) => request(`/menu/dishes/${id}`, { method: "DELETE", token }),
    },
    days: {
      list: (token, season) => request(`/menu/days?season=${season}`, { token }),
      get: (token, id) => request(`/menu/days/${id}`, { token }),
      set: (token, season, dayNumber, dishIds) =>
        request(`/menu/days/${season}/${dayNumber}`, { method: "PUT", body: { dishIds }, token }),
      recipe: (token, id, branchId) => request(`/menu/days/${id}/recipe?branchId=${branchId}`, { token }),
    },
  },

  activities: {
    list: (token, month) => request(`/activities${month ? `?month=${month}` : ""}`, { token }),
    current: (token, ageGroup) =>
      request(`/activities/current${ageGroup ? `?ageGroup=${ageGroup}` : ""}`, { token }),
    setWeek: (token, month, weekNumber, data) =>
      request(`/activities/${month}/${weekNumber}`, { method: "PUT", body: data, token }),
  },
};
