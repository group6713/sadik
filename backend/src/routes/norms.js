const express = require("express");
const prisma = require("../lib/prisma");
const { requireAuth, requireRole } = require("../middleware/auth");

const router = express.Router();
router.use(requireAuth);

router.get("/", async (req, res) => {
  const norms = await prisma.normProduct.findMany({ orderBy: { id: "asc" } });
  res.json(norms);
});

router.post("/", requireRole("MUDIRA"), async (req, res) => {
  const { name, unit, gramsPerChildPerDay } = req.body || {};
  if (!name || !unit || !Number.isFinite(Number(gramsPerChildPerDay))) {
    return res.status(400).json({ error: "Mahsulot ma'lumotlari to'liq emas" });
  }
  const norm = await prisma.normProduct.create({
    data: { name: name.trim(), unit, gramsPerChildPerDay: Number(gramsPerChildPerDay) },
  });
  res.status(201).json(norm);
});

router.put("/:id", requireRole("MUDIRA"), async (req, res) => {
  const id = Number(req.params.id);
  const { name, unit, gramsPerChildPerDay } = req.body || {};
  const data = {};
  if (name) data.name = name.trim();
  if (unit) data.unit = unit;
  if (gramsPerChildPerDay !== undefined) {
    const v = Number(gramsPerChildPerDay);
    if (!Number.isFinite(v) || v < 0) return res.status(400).json({ error: "Me'yor qiymati noto'g'ri" });
    data.gramsPerChildPerDay = v;
  }
  const norm = await prisma.normProduct.update({ where: { id }, data });
  res.json(norm);
});

router.delete("/:id", requireRole("MUDIRA"), async (req, res) => {
  const id = Number(req.params.id);
  const used = await prisma.stockEntry.count({ where: { productId: id } });
  if (used > 0) {
    return res.status(400).json({ error: "Bu mahsulot ombor yozuvlarida ishlatilgan, avval o'sha yozuvlarni o'chiring" });
  }
  await prisma.normProduct.delete({ where: { id } });
  res.status(204).end();
});

module.exports = router;
