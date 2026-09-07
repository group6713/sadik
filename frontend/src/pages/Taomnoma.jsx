import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../auth/AuthContext.jsx";
import { api } from "../api";

const SEASONS = [
  { value: "BAHOR", label: "Bahor" },
  { value: "YOZ", label: "Yoz" },
  { value: "KUZ", label: "Kuz" },
  { value: "QISH", label: "Qish" },
];
const MEAL_TYPES = [
  { value: "NONUSHTA", label: "Ertalabki nonushta" },
  { value: "TUSHLIK", label: "Tushlik" },
  { value: "IKKINCHI_TUSHLIK", label: "Ikkinchi tushlik" },
];
const MEAL_LABEL = Object.fromEntries(MEAL_TYPES.map((m) => [m.value, m.label]));

function emptyIngredientRow() {
  return { productId: "", gramsPerChild: "" };
}

export default function Taomnoma() {
  const { token } = useAuth();
  const [tab, setTab] = useState("dishes");
  const [dishes, setDishes] = useState([]);
  const [norms, setNorms] = useState([]);
  const [error, setError] = useState("");

  function loadDishes() {
    api.menu.dishes.list(token).then(setDishes).catch((e) => setError(e.message));
  }
  useEffect(() => {
    loadDishes();
    api.norms.list(token).then(setNorms);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div>
      <div className="content-header">
        <div>
          <h1>Taomnoma</h1>
          <p>
            Rasmiy taomnoma hujjatidagi taomlar va ularning tarkibini (bitta bolaga necha gramm) kiriting, so'ng har bir
            fasl-kun uchun qaysi taomlar berilishini belgilang. "Retsept" sahifasi shu ma'lumot asosida filial bolalar
            soniga moslab oshpazga aniq miqdorlarni hisoblab beradi.
          </p>
        </div>
      </div>

      {error && <p className="error-text">{error}</p>}

      <div className="tabs">
        <button className={"tab" + (tab === "dishes" ? " active" : "")} onClick={() => setTab("dishes")}>
          Taomlar katalogi
        </button>
        <button className={"tab" + (tab === "days" ? " active" : "")} onClick={() => setTab("days")}>
          Kunlarga taqsimlash
        </button>
      </div>

      {tab === "dishes" && (
        <DishesTab token={token} dishes={dishes} norms={norms} reload={loadDishes} setError={setError} />
      )}
      {tab === "days" && <DaysTab token={token} dishes={dishes} setError={setError} />}
    </div>
  );
}

function DishesTab({ token, dishes, norms, reload, setError }) {
  const [editingId, setEditingId] = useState(null);
  const [name, setName] = useState("");
  const [mealType, setMealType] = useState("NONUSHTA");
  const [rows, setRows] = useState([emptyIngredientRow()]);
  const [submitting, setSubmitting] = useState(false);

  function resetForm() {
    setEditingId(null);
    setName("");
    setMealType("NONUSHTA");
    setRows([emptyIngredientRow()]);
  }

  function startEdit(dish) {
    setEditingId(dish.id);
    setName(dish.name);
    setMealType(dish.mealType);
    setRows(
      dish.ingredients.map((i) => ({ productId: String(i.productId), gramsPerChild: String(i.gramsPerChild) }))
    );
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function updateRow(idx, field, value) {
    setRows((prev) => prev.map((r, i) => (i === idx ? { ...r, [field]: value } : r)));
  }
  function addRow() {
    setRows((prev) => [...prev, emptyIngredientRow()]);
  }
  function removeRow(idx) {
    setRows((prev) => prev.filter((_, i) => i !== idx));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    const ingredients = rows
      .filter((r) => r.productId && r.gramsPerChild)
      .map((r) => ({ productId: Number(r.productId), gramsPerChild: parseFloat(r.gramsPerChild) }));
    if (!name.trim() || ingredients.length === 0) {
      setError("Taom nomi va kamida bitta mahsulot kiritilishi kerak");
      return;
    }
    setSubmitting(true);
    try {
      const payload = { name: name.trim(), mealType, ingredients };
      if (editingId) {
        await api.menu.dishes.update(token, editingId, payload);
      } else {
        await api.menu.dishes.create(token, payload);
      }
      resetForm();
      reload();
    } catch (e) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id) {
    setError("");
    try {
      await api.menu.dishes.remove(token, id);
      if (editingId === id) resetForm();
      reload();
    } catch (e) {
      setError(e.message);
    }
  }

  const dishesByMeal = useMemo(() => {
    const grouped = {};
    for (const mt of MEAL_TYPES) grouped[mt.value] = [];
    for (const d of dishes) grouped[d.mealType]?.push(d);
    return grouped;
  }, [dishes]);

  return (
    <>
      <div className="panel">
        <h2>{editingId ? "Taomni tahrirlash" : "Yangi taom qo'shish"}</h2>
        <p className="panel-hint">
          Har bir mahsulot uchun taomnoma jadvalidagi "chiqitli" (xom, tozalanmagan) og'irlikni gramm hisobida kiriting
          — bu ombordan qancha xom mahsulot olinishini bildiradi.
        </p>
        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="field">
              <label htmlFor="dishName">Taom nomi</label>
              <input id="dishName" value={name} onChange={(e) => setName(e.target.value)} placeholder="masalan, Manniy yormasidan bo'tqa" />
            </div>
            <div className="field">
              <label htmlFor="dishMeal">Ovqatlanish vaqti</label>
              <select id="dishMeal" value={mealType} onChange={(e) => setMealType(e.target.value)}>
                {MEAL_TYPES.map((m) => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="ingredient-rows">
            {rows.map((row, idx) => (
              <div className="ingredient-row" key={idx}>
                <select value={row.productId} onChange={(e) => updateRow(idx, "productId", e.target.value)}>
                  <option value="">— mahsulot —</option>
                  {norms.map((n) => (
                    <option key={n.id} value={n.id}>{n.name}</option>
                  ))}
                </select>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={row.gramsPerChild}
                  onChange={(e) => updateRow(idx, "gramsPerChild", e.target.value)}
                  placeholder="g / bola"
                />
                <button type="button" className="btn-danger-text" onClick={() => removeRow(idx)} title="Qatorni o'chirish">✕</button>
              </div>
            ))}
            <button type="button" className="btn btn-ghost" onClick={addRow}>+ Mahsulot qatori</button>
          </div>

          <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? "Saqlanmoqda..." : editingId ? "Saqlash" : "Qo'shish"}
            </button>
            {editingId && (
              <button type="button" className="btn btn-ghost" onClick={resetForm}>Bekor qilish</button>
            )}
          </div>
        </form>
      </div>

      {MEAL_TYPES.map((mt) => (
        <div className="panel" key={mt.value}>
          <h2>{mt.label}</h2>
          {dishesByMeal[mt.value].length === 0 ? (
            <p className="empty-state">Bu bo'lim uchun taom kiritilmagan.</p>
          ) : (
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>Taom</th>
                    <th>Tarkibi (bitta bolaga)</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {dishesByMeal[mt.value].map((d) => (
                    <tr key={d.id}>
                      <td className="product-name">{d.name}</td>
                      <td className="muted">
                        {d.ingredients.map((i) => `${i.product.name} ${i.gramsPerChild} ${i.product.unit === "dona" ? "dona" : "g"}`).join(", ")}
                      </td>
                      <td style={{ whiteSpace: "nowrap" }}>
                        <button className="btn-ghost btn" style={{ padding: "6px 10px", marginRight: 6 }} onClick={() => startEdit(d)}>Tahrirlash</button>
                        <button className="btn-danger-text" title="O'chirish" onClick={() => handleDelete(d.id)}>✕</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ))}
    </>
  );
}

function DaysTab({ token, dishes, setError }) {
  const [season, setSeason] = useState("YOZ");
  const [dayNumber, setDayNumber] = useState(1);
  const [selectedDishIds, setSelectedDishIds] = useState(new Set());
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);

  function load() {
    setLoaded(false);
    api.menu.days
      .list(token, season)
      .then((days) => {
        const day = days.find((d) => d.dayNumber === dayNumber);
        setSelectedDishIds(new Set((day?.dishes || []).map((md) => md.dishId)));
        setLoaded(true);
      })
      .catch((e) => {
        setError(e.message);
        setLoaded(true);
      });
  }
  useEffect(load, [season, dayNumber]); // eslint-disable-line react-hooks/exhaustive-deps

  function toggle(dishId) {
    setSelectedDishIds((prev) => {
      const next = new Set(prev);
      if (next.has(dishId)) next.delete(dishId);
      else next.add(dishId);
      return next;
    });
  }

  async function handleSave() {
    setError("");
    setSaving(true);
    try {
      await api.menu.days.set(token, season, dayNumber, Array.from(selectedDishIds));
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  const dishesByMeal = useMemo(() => {
    const grouped = {};
    for (const mt of MEAL_TYPES) grouped[mt.value] = [];
    for (const d of dishes) grouped[d.mealType]?.push(d);
    return grouped;
  }, [dishes]);

  return (
    <div className="panel">
      <h2>Fasl va kunni tanlang</h2>
      <div className="form-grid" style={{ maxWidth: 420, marginBottom: 20 }}>
        <div className="field">
          <label htmlFor="season">Fasl</label>
          <select id="season" value={season} onChange={(e) => setSeason(e.target.value)}>
            {SEASONS.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="dayNumber">Kun</label>
          <select id="dayNumber" value={dayNumber} onChange={(e) => setDayNumber(Number(e.target.value))}>
            {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
              <option key={n} value={n}>{n}-kun</option>
            ))}
          </select>
        </div>
      </div>

      {!loaded ? (
        <p className="empty-state">Yuklanmoqda...</p>
      ) : (
        <>
          {MEAL_TYPES.map((mt) => (
            <div key={mt.value} style={{ marginBottom: 18 }}>
              <h3 style={{ fontSize: 14, marginBottom: 8 }}>{mt.label}</h3>
              {dishesByMeal[mt.value].length === 0 ? (
                <p className="muted">Katalogda bu bo'lim uchun taom yo'q — avval "Taomlar katalogi"ga qo'shing.</p>
              ) : (
                <div className="checklist">
                  {dishesByMeal[mt.value].map((d) => (
                    <label className="checklist-item" key={d.id}>
                      <input
                        type="checkbox"
                        checked={selectedDishIds.has(d.id)}
                        onChange={() => toggle(d.id)}
                      />
                      {d.name}
                    </label>
                  ))}
                </div>
              )}
            </div>
          ))}
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? "Saqlanmoqda..." : `${SEASONS.find((s) => s.value === season)?.label}, ${dayNumber}-kunni saqlash`}
          </button>
        </>
      )}
    </div>
  );
}

export { SEASONS, MEAL_TYPES, MEAL_LABEL };
