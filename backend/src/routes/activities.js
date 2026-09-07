const express = require("express");
const prisma = require("../lib/prisma");
const { requireAuth, requireRole } = require("../middleware/auth");
const { resolveActivityWeek, SUMMER_MONTHS, MONTH_NAMES } = require("../lib/activityWeek");
const { AGE_GROUPS } = require("../lib/ageGroups");

const router = express.Router();
router.use(requireAuth);

function validTopics(topics) {
  return (
    Array.isArray(topics) &&
    AGE_GROUPS.every((g) =>
      topics.some((t) => t.ageGroup === g && typeof t.topic === "string" && t.topic.trim())
    )
  );
}

router.get("/", async (req, res) => {
  const month = req.query.month ? Number(req.query.month) : null;
  const weeks = await prisma.activityWeek.findMany({
    where: month ? { month } : undefined,
    include: { topics: true },
    orderBy: [{ month: "asc" }, { weekNumber: "asc" }],
  });
  res.json(weeks);
});

router.get("/current", async (req, res) => {
  const ageGroup = String(req.query.ageGroup || req.user.ageGroup || "");
  if (!AGE_GROUPS.includes(ageGroup)) {
    return res.status(400).json({ error: "Yosh guruhi noto'g'ri yoki tanlanmagan" });
  }
  const forDate = req.query.date ? new Date(req.query.date) : new Date();
  const { month, weekNumber } = resolveActivityWeek(forDate);

  const week = await prisma.activityWeek.findUnique({
    where: { month_weekNumber: { month, weekNumber } },
    include: { topics: true },
  });
  const topic = week?.topics.find((t) => t.ageGroup === ageGroup) || null;

  res.json({
    month,
    monthName: MONTH_NAMES[month - 1],
    weekNumber,
    isSummer: SUMMER_MONTHS.includes(month),
    monthTheme: week?.monthTheme || null,
    topic: topic?.topic || null,
  });
});

// Bitta oy+hafta uchun oy mavzusi va barcha yosh guruhlari mavzularini to'liq almashtiradi
// (yo'q bo'lsa yaratadi). weekNumber: yozgi oylar (Iyun/Iyul/Avgust) uchun 0, qolganlar uchun 1-4.
router.put("/:month/:weekNumber", requireRole("MUDIRA"), async (req, res) => {
  const month = Number(req.params.month);
  const weekNumber = Number(req.params.weekNumber);
  const { monthTheme, topics } = req.body || {};

  if (!Number.isInteger(month) || month < 1 || month > 12) {
    return res.status(400).json({ error: "Oy noto'g'ri" });
  }
  const maxWeek = SUMMER_MONTHS.includes(month) ? 0 : 4;
  const minWeek = SUMMER_MONTHS.includes(month) ? 0 : 1;
  if (!Number.isInteger(weekNumber) || weekNumber < minWeek || weekNumber > maxWeek) {
    return res.status(400).json({ error: "Hafta raqami noto'g'ri" });
  }
  if (!monthTheme || !monthTheme.trim() || !validTopics(topics)) {
    return res.status(400).json({ error: "Oy mavzusi va barcha yosh guruhlari uchun mavzu to'ldirilishi kerak" });
  }

  const week = await prisma.activityWeek.upsert({
    where: { month_weekNumber: { month, weekNumber } },
    create: { month, weekNumber, monthTheme: monthTheme.trim() },
    update: { monthTheme: monthTheme.trim() },
  });

  await prisma.activityTopic.deleteMany({ where: { weekId: week.id } });
  await prisma.activityTopic.createMany({
    data: AGE_GROUPS.map((g) => ({
      weekId: week.id,
      ageGroup: g,
      topic: topics.find((t) => t.ageGroup === g).topic.trim(),
    })),
  });

  const full = await prisma.activityWeek.findUnique({ where: { id: week.id }, include: { topics: true } });
  res.json(full);
});

module.exports = router;
