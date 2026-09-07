const SUMMER_MONTHS = [6, 7, 8];

const MONTH_NAMES = [
  "Yanvar", "Fevral", "Mart", "Aprel", "May", "Iyun",
  "Iyul", "Avgust", "Sentabr", "Oktabr", "Noyabr", "Dekabr",
];

// Berilgan sanaga mos (oy, hafta raqami)ni topadi. Yozgi oylar (Iyun-Avgust)
// rasmiy hujjatda haftalarga bo'linmagan, shuning uchun ular uchun 0 qaytariladi
// (bitta oy = bitta yozuv, backend/prisma/schema.prisma'dagi ActivityWeek izohiga qarang).
function resolveActivityWeek(date = new Date()) {
  const month = date.getMonth() + 1;
  if (SUMMER_MONTHS.includes(month)) return { month, weekNumber: 0 };
  const weekNumber = Math.min(4, Math.ceil(date.getDate() / 7));
  return { month, weekNumber };
}

module.exports = { resolveActivityWeek, SUMMER_MONTHS, MONTH_NAMES };
