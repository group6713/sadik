import { useEffect, useState } from "react";
import { useAuth } from "../auth/AuthContext.jsx";
import { api } from "../api";

export default function Norms() {
  const { token } = useAuth();
  const [norms, setNorms] = useState([]);
  const [error, setError] = useState("");
  const [newName, setNewName] = useState("");
  const [newUnit, setNewUnit] = useState("g");
  const [newValue, setNewValue] = useState("");

  function load() {
    api.norms.list(token).then(setNorms).catch((e) => setError(e.message));
  }
  useEffect(load, [token]);

  async function saveField(norm, field, value) {
    try {
      const updated = await api.norms.update(token, norm.id, { [field]: value });
      setNorms((prev) => prev.map((n) => (n.id === norm.id ? updated : n)));
    } catch (e) {
      setError(e.message);
      load();
    }
  }

  async function handleDelete(id) {
    try {
      await api.norms.remove(token, id);
      setNorms((prev) => prev.filter((n) => n.id !== id));
    } catch (e) {
      setError(e.message);
    }
  }

  async function handleAdd(e) {
    e.preventDefault();
    const value = parseFloat(newValue);
    if (!newName.trim() || !Number.isFinite(value) || value < 0) return;
    try {
      const created = await api.norms.create(token, {
        name: newName.trim(),
        unit: newUnit,
        gramsPerChildPerDay: value,
      });
      setNorms((prev) => [...prev, created]);
      setNewName("");
      setNewValue("");
      setNewUnit("g");
    } catch (e) {
      setError(e.message);
    }
  }

  return (
    <div>
      <div className="content-header">
        <div>
          <h1>Me'yor jadvali</h1>
          <p>
            SanQvaN №0016-21 hujjatidagi 1-7 yoshgacha bola uchun kunlik me'yor (gramm/bola/kun, tuxum uchun dona/bola/kun).
            Ombor hisob-kitobi shu jadvaldan foydalanadi — qiymatlarni o'z hujjatingiz bilan solishtirib to'g'irlang.
          </p>
        </div>
      </div>

      {error && <p className="error-text">{error}</p>}

      <div className="panel">
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Mahsulot</th>
                <th>Birlik</th>
                <th>Me'yor / bola / kun</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {norms.map((n) => (
                <tr key={n.id}>
                  <td style={{ minWidth: 220 }}>
                    <input
                      defaultValue={n.name}
                      onBlur={(e) => e.target.value.trim() && e.target.value !== n.name && saveField(n, "name", e.target.value.trim())}
                    />
                  </td>
                  <td style={{ width: 110 }}>
                    <select defaultValue={n.unit} onChange={(e) => saveField(n, "unit", e.target.value)}>
                      <option value="g">gramm</option>
                      <option value="dona">dona</option>
                    </select>
                  </td>
                  <td style={{ width: 110 }}>
                    <input
                      type="number"
                      min="0"
                      step="0.1"
                      defaultValue={n.gramsPerChildPerDay}
                      onBlur={(e) => {
                        const v = parseFloat(e.target.value);
                        if (Number.isFinite(v) && v >= 0 && v !== n.gramsPerChildPerDay) saveField(n, "gramsPerChildPerDay", v);
                      }}
                    />
                  </td>
                  <td>
                    <button className="btn-danger-text" title="O'chirish" onClick={() => handleDelete(n.id)}>✕</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <form className="form-grid" style={{ marginTop: 18, maxWidth: 620 }} onSubmit={handleAdd}>
          <div className="field">
            <label htmlFor="newName">Yangi mahsulot</label>
            <input id="newName" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="masalan, Guruch" />
          </div>
          <div className="field">
            <label htmlFor="newUnit">Birlik</label>
            <select id="newUnit" value={newUnit} onChange={(e) => setNewUnit(e.target.value)}>
              <option value="g">gramm</option>
              <option value="dona">dona</option>
            </select>
          </div>
          <div className="field">
            <label htmlFor="newValue">Me'yor / bola / kun</label>
            <input id="newValue" type="number" min="0" step="0.1" value={newValue} onChange={(e) => setNewValue(e.target.value)} placeholder="masalan, 30" />
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
