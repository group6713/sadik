import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../auth/AuthContext.jsx";
import { api } from "../api";

function fmtDate(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  const p = (n) => String(n).padStart(2, "0");
  return `${p(d.getDate())}.${p(d.getMonth() + 1)}.${d.getFullYear()}`;
}
function todayISO() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}
function fmtNum(n) {
  if (!Number.isFinite(n)) return "—";
  return (Math.round(n * 10) / 10).toLocaleString("uz-UZ");
}
const STATUS_LABEL = { good: "Yetarli", warn: "Kam qolgan", critical: "Shoshilinch" };

export default function Ombor() {
  const { token, user } = useAuth();
  const [branches, setBranches] = useState([]);
  const [branchId, setBranchId] = useState(user.branchId || null);
  const [norms, setNorms] = useState([]);
  const [stockData, setStockData] = useState(null);
  const [error, setError] = useState("");
  const [childrenDraft, setChildrenDraft] = useState("");

  const [productId, setProductId] = useState("");
  const [qtyKg, setQtyKg] = useState("");
  const [sackCount, setSackCount] = useState("");
  const [sackWeight, setSackWeight] = useState(50);
  const [receivedDate, setReceivedDate] = useState(todayISO());
  const [supplier, setSupplier] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api.branches.list(token).then((list) => {
      setBranches(list);
      if (!branchId && list.length) setBranchId(list[0].id);
    });
    api.norms.list(token).then((list) => {
      setNorms(list);
      if (list.length) setProductId(String(list[0].id));
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function loadStock(id) {
    if (!id) return;
    api.stock
      .list(token, id)
      .then((data) => {
        setStockData(data);
        setChildrenDraft(String(data.branch.childrenCount));
      })
      .catch((e) => setError(e.message));
  }

  useEffect(() => {
    if (branchId) loadStock(branchId);
  }, [branchId]); // eslint-disable-line react-hooks/exhaustive-deps

  const selectedProduct = useMemo(
    () => norms.find((n) => String(n.id) === String(productId)),
    [norms, productId]
  );
  const isDona = selectedProduct?.unit === "dona";

  function handleSackChange(count, weight) {
    const c = parseFloat(count);
    const w = parseFloat(weight);
    if (Number.isFinite(c) && c >= 0 && Number.isFinite(w)) {
      setQtyKg(c * w ? String(c * w) : "");
    }
  }

  async function handleChildrenSave() {
    const v = parseInt(childrenDraft, 10);
    if (!Number.isFinite(v) || v < 0) return;
    try {
      await api.branches.setChildren(token, branchId, v);
      loadStock(branchId);
    } catch (e) {
      setError(e.message);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    const qty = parseFloat(qtyKg);
    if (!productId || !Number.isFinite(qty) || qty <= 0) return;
    setSubmitting(true);
    try {
      await api.stock.create(token, {
        branchId,
        productId: Number(productId),
        qty,
        receivedDate,
        supplier: supplier.trim() || undefined,
      });
      setQtyKg("");
      setSackCount("");
      setSupplier("");
      loadStock(branchId);
    } catch (e) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id) {
    try {
      await api.stock.remove(token, id);
      loadStock(branchId);
    } catch (e) {
      setError(e.message);
    }
  }

  const entries = stockData?.entries || [];
  const counts = entries.reduce(
    (acc, e) => ({ ...acc, [e.status]: (acc[e.status] || 0) + 1 }),
    {}
  );

  return (
    <div>
      <div className="content-header">
        <div>
          <h1>Ombor holati</h1>
          <p>Kelgan mahsulotni bolalar soni va kunlik me'yorga qarab necha kunga yetishini hisoblaydi.</p>
        </div>
        <div className="summary-chips">
          <div className="chip neutral"><span className="dot" />{entries.length} mahsulot kuzatilmoqda</div>
          {counts.critical > 0 && <div className="chip critical"><span className="dot" />{counts.critical} shoshilinch</div>}
          {counts.warn > 0 && <div className="chip warn"><span className="dot" />{counts.warn} kam qolgan</div>}
          {counts.good > 0 && <div className="chip good"><span className="dot" />{counts.good} yetarli</div>}
        </div>
      </div>

      {error && <p className="error-text">{error}</p>}

      <div className="panel">
        <h2>Filial</h2>
        <div className="form-grid" style={{ maxWidth: 480 }}>
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
              <div style={{ padding: "9px 0", fontWeight: 600 }}>{stockData?.branch?.name || "—"}</div>
            </div>
          )}
          <div className="field">
            <label htmlFor="children">Bolalar soni (jami)</label>
            <input
              id="children"
              type="number"
              min="0"
              value={childrenDraft}
              onChange={(e) => setChildrenDraft(e.target.value)}
              onBlur={handleChildrenSave}
              disabled={user.role !== "MUDIRA"}
            />
          </div>
        </div>
      </div>

      {(user.role === "MUDIRA" || user.role === "POVOR") && (
        <div className="panel">
          <h2>Mahsulot kiritish</h2>
          <p className="panel-hint">Kelgan mahsulotni kiriting — tizim uni bolalar soni va kunlik me'yorga qarab necha kunga yetishini avtomatik hisoblaydi.</p>
          <form className="form-grid" onSubmit={handleSubmit}>
            <div className="field">
              <label htmlFor="product">Mahsulot</label>
              <select id="product" value={productId} onChange={(e) => setProductId(e.target.value)}>
                {norms.map((n) => (
                  <option key={n.id} value={n.id}>{n.name}</option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="qty">{isDona ? "Miqdori (dona)" : "Miqdori (kg)"}</label>
              <input
                id="qty"
                type="number"
                min="0"
                step="0.1"
                value={qtyKg}
                onChange={(e) => setQtyKg(e.target.value)}
                placeholder={isDona ? "masalan, 200" : "masalan, 50"}
                required
              />
            </div>
            {!isDona && (
              <div className="field">
                <label htmlFor="sackCount">yoki qop soni</label>
                <div className="sack-inline">
                  <input
                    id="sackCount"
                    type="number"
                    min="0"
                    value={sackCount}
                    onChange={(e) => {
                      setSackCount(e.target.value);
                      handleSackChange(e.target.value, sackWeight);
                    }}
                    placeholder="—"
                  />
                  <span>×</span>
                  <input
                    type="number"
                    min="0"
                    value={sackWeight}
                    onChange={(e) => {
                      setSackWeight(e.target.value);
                      handleSackChange(sackCount, e.target.value);
                    }}
                  />
                  <span>kg</span>
                </div>
              </div>
            )}
            <div className="field">
              <label htmlFor="date">Kelgan sana</label>
              <input id="date" type="date" value={receivedDate} onChange={(e) => setReceivedDate(e.target.value)} />
            </div>
            <div className="field">
              <label htmlFor="supplier">Yetkazib beruvchi</label>
              <input id="supplier" type="text" value={supplier} onChange={(e) => setSupplier(e.target.value)} placeholder="ixtiyoriy" />
            </div>
            <div className="field">
              <label>&nbsp;</label>
              <button type="submit" className="btn btn-primary" disabled={submitting}>
                {submitting ? "Qo'shilmoqda..." : "Qo'shish"}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="panel">
        <h2>Ombor ro'yxati</h2>
        {entries.length === 0 ? (
          <p className="empty-state">Hali mahsulot kiritilmagan.</p>
        ) : (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Mahsulot</th>
                  <th>Kelgan miqdor</th>
                  <th>Kunlik sarf</th>
                  <th>Necha kunga yetadi</th>
                  <th>Tugash sanasi</th>
                  <th>Holat</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {entries.map((e) => (
                  <tr key={e.id}>
                    <td>
                      <div className="product-name">{e.product.name}</div>
                      <div className="muted">{e.supplier || ""}</div>
                    </td>
                    <td>
                      {fmtNum(e.qty)} {e.product.unit === "dona" ? "dona" : "kg"}
                      <div className="muted">{fmtDate(e.receivedDate)}</div>
                    </td>
                    <td>{fmtNum(e.dailyNeed)} {e.product.unit === "dona" ? "dona/kun" : "g/kun"}</td>
                    <td>{Number.isFinite(e.daysCovered) ? `${e.daysCovered} kun` : "—"}</td>
                    <td>{fmtDate(e.runOutDate)}</td>
                    <td>
                      <span className={`badge ${e.status}`}>
                        <span className="dot" />
                        {e.daysLeft < 0 ? "Tugagan" : e.status === "good" ? STATUS_LABEL.good : `${e.daysLeft} kun qoldi`}
                      </span>
                    </td>
                    <td>
                      <button className="btn-danger-text" title="O'chirish" onClick={() => handleDelete(e.id)}>✕</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
