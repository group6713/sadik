import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../auth/AuthContext.jsx";
import { api } from "../api";
import { SEASONS, MEAL_TYPES } from "./Taomnoma.jsx";

function fmtQty(qty, unit) {
  if (!Number.isFinite(qty)) return "—";
  const rounded = Math.round(qty * 100) / 100;
  return `${rounded.toLocaleString("uz-UZ")} ${unit}`;
}

export default function Retsept() {
  const { token, user } = useAuth();
  const [branches, setBranches] = useState([]);
  const [branchId, setBranchId] = useState(user.branchId || null);
  const [season, setSeason] = useState("YOZ");
  const [dayNumber, setDayNumber] = useState(1);
  const [menuDayId, setMenuDayId] = useState(null);
  const [recipe, setRecipe] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.branches.list(token).then((list) => {
      setBranches(list);
      if (!branchId && list.length) setBranchId(list[0].id);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setMenuDayId(null);
    setRecipe(null);
    api.menu.days
      .list(token, season)
      .then((days) => {
        const day = days.find((d) => d.dayNumber === dayNumber);
        setMenuDayId(day ? day.id : null);
      })
      .catch((e) => setError(e.message));
  }, [token, season, dayNumber]);

  useEffect(() => {
    if (!menuDayId || !branchId) return;
    setLoading(true);
    setError("");
    api.menu.days
      .recipe(token, menuDayId, branchId)
      .then(setRecipe)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [token, menuDayId, branchId]);

  const counts = useMemo(() => {
    if (!recipe) return {};
    return recipe.totals.reduce(
      (acc, t) => ({ ...acc, [t.sufficient ? "sufficient" : "insufficient"]: (acc[t.sufficient ? "sufficient" : "insufficient"] || 0) + 1 }),
      {}
    );
  }, [recipe]);

  return (
    <div>
      <div className="content-header">
        <div>
          <h1>Kunlik retsept</h1>
          <p>Tanlangan filialning bolalar soniga moslab, taomnomadagi har bir taom uchun oshpaz solishi kerak bo'lgan aniq miqdorlar.</p>
        </div>
        {recipe && (
          <div className="summary-chips">
            <div className="chip neutral"><span className="dot" />{recipe.branch.childrenCount} bola</div>
            {counts.insufficient > 0 && <div className="chip critical"><span className="dot" />{counts.insufficient} mahsulot yetishmaydi</div>}
            {counts.sufficient > 0 && <div className="chip good"><span className="dot" />{counts.sufficient} mahsulot yetarli</div>}
          </div>
        )}
      </div>

      {error && <p className="error-text">{error}</p>}

      <div className="panel">
        <div className="form-grid" style={{ maxWidth: 620 }}>
          {branches.length > 1 ? (
            <div className="field">
              <label htmlFor="branch">Filial</label>
              <select id="branch" value={branchId || ""} onChange={(e) => setBranchId(Number(e.target.value))}>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>
          ) : (
            <div className="field">
              <label>Filial</label>
              <div style={{ padding: "9px 0", fontWeight: 600 }}>{branches[0]?.name || "—"}</div>
            </div>
          )}
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
      </div>

      {loading && <p className="empty-state">Hisoblanmoqda...</p>}

      {!loading && !menuDayId && (
        <p className="empty-state">
          {SEASONS.find((s) => s.value === season)?.label}, {dayNumber}-kun uchun taomnoma hali kiritilmagan.
          "Taomnoma" sahifasidan kiriting.
        </p>
      )}

      {!loading && recipe && (
        <>
          {MEAL_TYPES.map((mt) => {
            const list = recipe.dishesByMeal[mt.value] || [];
            if (list.length === 0) return null;
            return (
              <div className="panel" key={mt.value}>
                <h2>{mt.label}</h2>
                {list.map((dish) => (
                  <div key={dish.id} style={{ marginBottom: 14 }}>
                    <div className="product-name" style={{ marginBottom: 6 }}>{dish.name}</div>
                    <div className="table-scroll">
                      <table>
                        <thead>
                          <tr>
                            <th>Mahsulot</th>
                            <th>1 bolaga</th>
                            <th>Jami ({recipe.branch.childrenCount} bola)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {dish.ingredients.map((ing, idx) => (
                            <tr key={idx}>
                              <td>{ing.product.name}</td>
                              <td className="muted">{fmtQty(ing.gramsPerChild, "g")}</td>
                              <td>{fmtQty(ing.totalGrams, "g")}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </div>
            );
          })}

          <div className="panel">
            <h2>Kunlik jami sarf va ombor holati</h2>
            <p className="panel-hint">Bugungi kun uchun barcha taomlardan kerak bo'ladigan mahsulotlar, ombordagi mavjud miqdor bilan solishtirilgan.</p>
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>Mahsulot</th>
                    <th>Kerak</th>
                    <th>Omborda bor</th>
                    <th>Holat</th>
                  </tr>
                </thead>
                <tbody>
                  {recipe.totals.map((t) => (
                    <tr key={t.product.id}>
                      <td className="product-name">{t.product.name}</td>
                      <td>{fmtQty(t.totalQty, t.product.unit === "dona" ? "dona" : "kg")}</td>
                      <td className="muted">{fmtQty(t.stockQty, t.product.unit === "dona" ? "dona" : "kg")}</td>
                      <td>
                        <span className={`badge ${t.sufficient ? "good" : "critical"}`}>
                          <span className="dot" />
                          {t.sufficient ? "Yetarli" : "Yetishmaydi"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
