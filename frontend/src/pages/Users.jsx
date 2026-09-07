import { useEffect, useState } from "react";
import { useAuth } from "../auth/AuthContext.jsx";
import { api } from "../api";
import { AGE_GROUPS } from "./Mashgulotlar.jsx";

const ROLES = [
  { value: "MUDIRA", label: "Mudira" },
  { value: "POVOR", label: "Oshxona xodimi" },
  { value: "TARBIYACHI", label: "Tarbiyachi" },
  { value: "OTA_ONA", label: "Ota-ona" },
];

export default function Users() {
  const { token, user: me } = useAuth();
  const [users, setUsers] = useState([]);
  const [branches, setBranches] = useState([]);
  const [error, setError] = useState("");

  const [form, setForm] = useState({ username: "", password: "", fullName: "", role: "POVOR", branchId: "", ageGroup: "" });

  function load() {
    api.users.list(token).then(setUsers).catch((e) => setError(e.message));
    api.branches.list(token).then(setBranches);
  }
  useEffect(load, [token]);

  async function handleCreate(e) {
    e.preventDefault();
    setError("");
    if (!form.username.trim() || !form.password || !form.fullName.trim()) return;
    try {
      const created = await api.users.create(token, {
        ...form,
        username: form.username.trim(),
        fullName: form.fullName.trim(),
        branchId: form.branchId || null,
        ageGroup: form.ageGroup || null,
      });
      setUsers((prev) => [...prev, created]);
      setForm({ username: "", password: "", fullName: "", role: "POVOR", branchId: "", ageGroup: "" });
    } catch (e) {
      setError(e.message);
    }
  }

  async function handleRoleChange(u, role) {
    try {
      const updated = await api.users.update(token, u.id, { role });
      setUsers((prev) => prev.map((x) => (x.id === u.id ? updated : x)));
    } catch (e) {
      setError(e.message);
    }
  }

  async function handleBranchChange(u, branchId) {
    try {
      const updated = await api.users.update(token, u.id, { branchId: branchId || null });
      setUsers((prev) => prev.map((x) => (x.id === u.id ? updated : x)));
    } catch (e) {
      setError(e.message);
    }
  }

  async function handleAgeGroupChange(u, ageGroup) {
    try {
      const updated = await api.users.update(token, u.id, { ageGroup: ageGroup || null });
      setUsers((prev) => prev.map((x) => (x.id === u.id ? updated : x)));
    } catch (e) {
      setError(e.message);
    }
  }

  async function handleDelete(id) {
    try {
      await api.users.remove(token, id);
      setUsers((prev) => prev.filter((u) => u.id !== id));
    } catch (e) {
      setError(e.message);
    }
  }

  return (
    <div>
      <div className="content-header">
        <div>
          <h1>Foydalanuvchilar</h1>
          <p>Povor, tarbiyachi va ota-onalar uchun tizimga kirish huquqini shu yerdan boshqaring.</p>
        </div>
      </div>

      {error && <p className="error-text">{error}</p>}

      <div className="panel">
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Ism</th>
                <th>Login</th>
                <th>Rol</th>
                <th>Filial</th>
                <th>Yosh guruhi</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td className="product-name">{u.fullName}</td>
                  <td className="muted">{u.username}</td>
                  <td style={{ width: 160 }}>
                    <select value={u.role} onChange={(e) => handleRoleChange(u, e.target.value)} disabled={u.id === me.id}>
                      {ROLES.map((r) => (
                        <option key={r.value} value={r.value}>{r.label}</option>
                      ))}
                    </select>
                  </td>
                  <td style={{ width: 160 }}>
                    <select value={u.branchId || ""} onChange={(e) => handleBranchChange(u, e.target.value)}>
                      <option value="">—</option>
                      {branches.map((b) => (
                        <option key={b.id} value={b.id}>{b.name}</option>
                      ))}
                    </select>
                  </td>
                  <td style={{ width: 140 }}>
                    {u.role === "TARBIYACHI" ? (
                      <select value={u.ageGroup || ""} onChange={(e) => handleAgeGroupChange(u, e.target.value)}>
                        <option value="">—</option>
                        {AGE_GROUPS.map((g) => (
                          <option key={g.value} value={g.value}>{g.label}</option>
                        ))}
                      </select>
                    ) : (
                      <span className="muted">—</span>
                    )}
                  </td>
                  <td>
                    {u.id !== me.id && (
                      <button className="btn-danger-text" title="O'chirish" onClick={() => handleDelete(u.id)}>✕</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <form className="form-grid" style={{ marginTop: 18 }} onSubmit={handleCreate}>
          <div className="field">
            <label htmlFor="fullName">Ism-familiya</label>
            <input id="fullName" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
          </div>
          <div className="field">
            <label htmlFor="uUsername">Login</label>
            <input id="uUsername" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} />
          </div>
          <div className="field">
            <label htmlFor="uPassword">Parol</label>
            <input id="uPassword" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          </div>
          <div className="field">
            <label htmlFor="uRole">Rol</label>
            <select id="uRole" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value, ageGroup: "" })}>
              {ROLES.map((r) => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="uBranch">Filial</label>
            <select id="uBranch" value={form.branchId} onChange={(e) => setForm({ ...form, branchId: e.target.value })}>
              <option value="">—</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>
          {form.role === "TARBIYACHI" && (
            <div className="field">
              <label htmlFor="uAgeGroup">Yosh guruhi</label>
              <select id="uAgeGroup" value={form.ageGroup} onChange={(e) => setForm({ ...form, ageGroup: e.target.value })}>
                <option value="">—</option>
                {AGE_GROUPS.map((g) => (
                  <option key={g.value} value={g.value}>{g.label}</option>
                ))}
              </select>
            </div>
          )}
          <div className="field">
            <label>&nbsp;</label>
            <button type="submit" className="btn btn-ghost">+ Qo'shish</button>
          </div>
        </form>
      </div>
    </div>
  );
}
