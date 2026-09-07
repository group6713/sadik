const DAY_MS = 24 * 60 * 60 * 1000;

function startOfDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function diffDays(a, b) {
  return Math.round((startOfDay(a).getTime() - startOfDay(b).getTime()) / DAY_MS);
}

// Core rule: raw product qty is checked against the official per-child daily
// norm (SanQvaN) times the branch's children count, to estimate how many
// days a delivered batch will last and when it needs replacing.
function computeStockStatus(entry, product, childrenCount, now = new Date()) {
  const qtyBase = product.unit === "dona" ? entry.qty : entry.qty * 1000; // kg -> g
  const dailyNeed = product.gramsPerChildPerDay * childrenCount;
  const daysCovered = dailyNeed > 0 ? Math.floor(qtyBase / dailyNeed) : Infinity;
  const runOutDate = Number.isFinite(daysCovered) ? addDays(entry.receivedDate, daysCovered) : null;
  const daysLeft = runOutDate ? diffDays(runOutDate, now) : Infinity;
  const status = daysLeft < 5 ? "critical" : daysLeft < 14 ? "warn" : "good";

  return { dailyNeed, daysCovered, runOutDate, daysLeft, status };
}

// Retseptda "dona" birlikdagi mahsulotlar (hozircha faqat tuxum) ham
// taomnoma hujjatidagi kabi grammda kiritiladi (masalan "7g tuxum xamirga").
// Ombordagi tuxum esa dona hisobida saqlanadi — shu ikkisini solishtirish
// uchun taxminiy o'rtacha og'irlik kerak (hujjatdagi "1-toifa tuxum" ~50g netto).
const DONA_UNIT_APPROX_GRAMS = 50;

// Retsept-asosli aniq sarf: tanlangan taomnoma kunidagi barcha taomlarning
// mahsulotlarini bolalar soniga ko'paytirib, mahsulot bo'yicha jamlaydi.
// computeStockStatus'dagi norma-asosli taxminni ALMASHTIRMAYDI — uni
// aniqlashtiruvchi, undan mustaqil ikkinchi hisob-kitob.
function computeMenuDayConsumption(menuDay, childrenCount) {
  const byProduct = new Map();

  for (const md of menuDay.dishes) {
    for (const ing of md.dish.ingredients) {
      const totalGrams = ing.gramsPerChild * childrenCount;
      const prev = byProduct.get(ing.productId);
      if (prev) {
        prev.totalGrams += totalGrams;
        prev.dishes.push(md.dish.name);
      } else {
        byProduct.set(ing.productId, {
          product: ing.product,
          totalGrams,
          dishes: [md.dish.name],
        });
      }
    }
  }

  return Array.from(byProduct.values()).map((row) => ({
    product: row.product,
    totalGrams: row.totalGrams,
    totalQty:
      row.product.unit === "dona" ? row.totalGrams / DONA_UNIT_APPROX_GRAMS : row.totalGrams / 1000,
    dishes: row.dishes,
  }));
}

module.exports = { computeStockStatus, computeMenuDayConsumption, addDays, diffDays, startOfDay };
