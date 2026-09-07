import { useEffect, useState } from "react";
import { useAuth } from "../auth/AuthContext.jsx";
import { api } from "../api";

export default function Branches() {
  const { token } = useAuth();
  const [branches, setBranches] = useState([]);
  const [error, setError] = useState("");
  const [newName, setNewName] = useState("");

  function load() {
    api.branches.list(token).then(setBranches).catch((e) => setError(e.message));
  }
  useEffect(load, [token]);

  async function handleAdd(e) {
    e.preventDefault();
    if (!newName.trim()) return;
    try {
      const created = await api.branches.create(token, newName.trim());
      setBranches((prev) => [...prev, created]);
      setNewName("");
    } catch (e) {
      setError(e.message);
    }
  }

  async function handleChildren(id, value) {
    const v = parseInt(value, 10);
    if (!Number.isFinite(v) || v < 0) return;
    try {
      const updated = await api.branches.setChildren(token, id, v);
      setBranches((prev) => prev.map((b) => (b.id === id ? updated : b)));
    } catch (e) {
      setError(e.message);
    }
  }

  async function handleDelete(id) {
    try {
      await api.branches.remove(token, id);
      setBranches((prev) => prev.filter((b) => b.id !== id));
    } catch (e) {
      setError(e.message);
    }
  }

  return (
    <div>
      <div className="content-header">
        <div>
          <h1>Filiallar</h1>
          <p>Har bir filial uchun bolalar sonini kiriting — ombor hisob-kitobi shu songa asoslanadi.</p>
        </div>
      </div>

      {error && <p className="error-text">{error}</p>}

      <div className="panel">
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Filial nomi</th>
                <th>Bolalar soni</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {branches.map((b) => (
                <tr key={b.id}>
                  <td className="product-name">{b.name}</td>
                  <td style={{ width: 120 }}>
                    <input
                      type="number"
                      min="0"
                      defaultValue={b.childrenCount}
                      onBlur={(e) => e.target.value !== String(b.childrenCount) && handleChildren(b.id, e.target.value)}
                    />
                  </td>
                  <td>
                    <button className="btn-danger-text" title="O'chirish" onClick={() => handleDelete(b.id)}>✕</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <form className="form-grid" style={{ marginTop: 18, maxWidth: 420 }} onSubmit={handleAdd}>
          <div className="field">
            <label htmlFor="newBranch">Yangi filial nomi</label>
            <input id="newBranch" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="masalan, 2-filial" />
          </div>
          <div className="field">
            <label>&nbsp;</label>
            <button type="submit" className="btn btn-ghost">+ Qo'shish</button>
          </div>
        </form>
      </div>
    </div>
  );
}
