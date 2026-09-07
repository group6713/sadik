import { useEffect, useState } from "react";
import { useAuth } from "../auth/AuthContext.jsx";
import { api } from "../api";

const MONTHS = [
  { value: 9, label: "Sentabr" },
  { value: 10, label: "Oktabr" },
  { value: 11, label: "Noyabr" },
  { value: 12, label: "Dekabr" },
  { value: 1, label: "Yanvar" },
  { value: 2, label: "Fevral" },
  { value: 3, label: "Mart" },
  { value: 4, label: "Aprel" },
  { value: 5, label: "May" },
  { value: 6, label: "Iyun" },
  { value: 7, label: "Iyul" },
  { value: 8, label: "Avgust" },
];
const SUMMER_MONTHS = [6, 7, 8];
const AGE_GROUPS = [
  { value: "3-4", label: "3–4 yosh" },
  { value: "4-5", label: "4–5 yosh" },
  { value: "5-6", label: "5–6 yosh" },
  { value: "6-7", label: "6–7 yosh" },
];

function emptyTopics() {
  return Object.fromEntries(AGE_GROUPS.map((g) => [g.value, ""]));
}

export default function Mashgulotlar() {
  const { user } = useAuth();
  return user.role === "MUDIRA" ? <MudiraView /> : <TarbiyachiView />;
}

export { AGE_GROUPS };

function MudiraView() {
  const { token } = useAuth();
  const [month, setMonth] = useState(9);
  const [monthTheme, setMonthTheme] = useState("");
  const [weekTopics, setWeekTopics] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  const isSummer = SUMMER_MONTHS.includes(month);
  const weekNumbers = isSummer ? [0] : [1, 2, 3, 4];

  useEffect(() => {
    setLoading(true);
    setError("");
    setSaved(false);
    api.activities
      .list(token, month)
      .then((weeks) => {
        setMonthTheme(weeks[0]?.monthTheme || "");
        const topics = {};
        for (const wn of weekNumbers) {
          topics[wn] = emptyTopics();
          const week = weeks.find((w) => w.weekNumber === wn);
          if (week) for (const t of week.topics) topics[wn][t.ageGroup] = t.topic;
        }
        setWeekTopics(topics);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, month]);

  function updateTopic(weekNumber, ageGroup, value) {
    setWeekTopics((prev) => ({ ...prev, [weekNumber]: { ...prev[weekNumber], [ageGroup]: value } }));
  }

  function updateSummerNote(value) {
    setWeekTopics((prev) => ({ ...prev, 0: Object.fromEntries(AGE_GROUPS.map((g) => [g.value, value])) }));
  }

  async function handleSave() {
    setError("");
    setSaved(false);
    if (!monthTheme.trim()) {
      setError("Oy mavzusini kiriting");
      return;
    }
    setSaving(true);
    try {
      for (const wn of weekNumbers) {
        const topics = AGE_GROUPS.map((g) => ({ ageGroup: g.value, topic: (weekTopics[wn]?.[g.value] || "").trim() }));
        if (topics.some((t) => !t.topic)) {
          throw new Error(isSummer ? "Yozgi davr uchun izohni to'ldiring" : `${wn}-hafta uchun barcha yosh guruhlarini to'ldiring`);
        }
        await api.activities.setWeek(token, month, wn, { monthTheme: monthTheme.trim(), topics });
      }
      setSaved(true);
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div className="content-header">
        <div>
          <h1>Mashg'ulotlar</h1>
          <p>
            Yillik mavzuli reja — har bir oy va hafta uchun yosh guruhlari bo'yicha mavzuni kiriting. Tarbiyachilar
            bosh sahifasida joriy sana bo'yicha o'z guruhiga mos mavzu shu ma'lumot asosida avtomatik ko'rinadi.
          </p>
        </div>
      </div>

      {error && <p className="error-text">{error}</p>}

      <div className="panel">
        <div className="form-grid" style={{ maxWidth: 260, marginBottom: 18 }}>
          <div className="field">
            <label htmlFor="month">Oy</label>
            <select id="month" value={month} onChange={(e) => setMonth(Number(e.target.value))}>
              {MONTHS.map((m) => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </div>
        </div>

        {loading ? (
          <p className="empty-state">Yuklanmoqda...</p>
        ) : (
          <>
            <div className="field" style={{ marginBottom: 18, maxWidth: 520 }}>
              <label htmlFor="monthTheme">Oy mavzusi</label>
              <input
                id="monthTheme"
                value={monthTheme}
                onChange={(e) => setMonthTheme(e.target.value)}
                placeholder="masalan, O'zbekiston – mening Vatanim"
              />
            </div>

            {isSummer ? (
              <div className="field">
                <label htmlFor="summerNote">Yozgi davr uchun umumiy izoh (barcha guruhlar uchun bir xil)</label>
                <textarea
                  id="summerNote"
                  rows={4}
                  value={weekTopics[0]?.["3-4"] || ""}
                  onChange={(e) => updateSummerNote(e.target.value)}
                />
              </div>
            ) : (
              <div className="table-scroll">
                <table>
                  <thead>
                    <tr>
                      <th style={{ width: 90 }}>Hafta</th>
                      {AGE_GROUPS.map((g) => (
                        <th key={g.value}>{g.label}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {weekNumbers.map((wn) => (
                      <tr key={wn}>
                        <td className="product-name">{wn}-hafta</td>
                        {AGE_GROUPS.map((g) => (
                          <td key={g.value}>
                            <input
                              value={weekTopics[wn]?.[g.value] || ""}
                              onChange={(e) => updateTopic(wn, g.value, e.target.value)}
                            />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 16 }}>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? "Saqlanmoqda..." : "Oyni saqlash"}
              </button>
              {saved && <span className="muted">Saqlandi.</span>}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function TarbiyachiView() {
  const { token, user } = useAuth();
  const [current, setCurrent] = useState(null);
  const [weeks, setWeeks] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user.ageGroup) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    Promise.all([api.activities.current(token, user.ageGroup), api.activities.list(token)])
      .then(([cur, all]) => {
        setCurrent(cur);
        setWeeks(all);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [token, user.ageGroup]);

  if (!user.ageGroup) {
    return (
      <div>
        <div className="content-header">
          <div>
            <h1>Mashg'ulotlar</h1>
            <p>Sizga hali yosh guruhi biriktirilmagan.</p>
          </div>
        </div>
        <div className="panel">
          <p className="empty-state">Yosh guruhingizni biriktirish uchun mudiraga murojaat qiling.</p>
        </div>
      </div>
    );
  }

  const groupLabel = AGE_GROUPS.find((g) => g.value === user.ageGroup)?.label || user.ageGroup;
  const monthOrder = MONTHS.map((m) => m.value);
  const rows = weeks
    .map((w) => ({ ...w, topic: w.topics.find((t) => t.ageGroup === user.ageGroup)?.topic }))
    .filter((w) => w.topic)
    .sort((a, b) => monthOrder.indexOf(a.month) - monthOrder.indexOf(b.month) || a.weekNumber - b.weekNumber);

  return (
    <div>
      <div className="content-header">
        <div>
          <h1>Mashg'ulotlar</h1>
          <p>{groupLabel} guruhi uchun yillik mavzuli reja.</p>
        </div>
      </div>

      {error && <p className="error-text">{error}</p>}

      {!loading && current && (
        <div className="panel">
          <h2>Bugungi mavzu</h2>
          {current.topic ? (
            <>
              <p className="panel-hint">
                {current.monthName}, {current.isSummer ? "yozgi davr" : `${current.weekNumber}-hafta`} — {current.monthTheme}
              </p>
              <p style={{ fontSize: 16, fontWeight: 600 }}>{current.topic}</p>
            </>
          ) : (
            <p className="empty-state">Joriy oy uchun reja hali kiritilmagan.</p>
          )}
        </div>
      )}

      <div className="panel">
        <h2>Yillik reja</h2>
        {loading ? (
          <p className="empty-state">Yuklanmoqda...</p>
        ) : rows.length === 0 ? (
          <p className="empty-state">Hali reja kiritilmagan.</p>
        ) : (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Oy</th>
                  <th>Hafta</th>
                  <th>Oy mavzusi</th>
                  <th>Mavzu</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((w) => (
                  <tr key={w.id}>
                    <td className="product-name">{MONTHS.find((m) => m.value === w.month)?.label}</td>
                    <td className="muted">{w.weekNumber === 0 ? "—" : `${w.weekNumber}-hafta`}</td>
                    <td className="muted">{w.monthTheme}</td>
                    <td>{w.topic}</td>
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
