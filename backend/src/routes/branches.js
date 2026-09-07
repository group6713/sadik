const express = require("express");
const prisma = require("../lib/prisma");
const { requireAuth, requireRole } = require("../middleware/auth");

const router = express.Router();
router.use(requireAuth);

// Mudira sees every branch; other roles only their own.
router.get("/", async (req, res) => {
  const where = req.user.role === "MUDIRA" ? {} : { id: req.user.branchId || -1 };
  const branches = await prisma.branch.findMany({ where, orderBy: { id: "asc" } });
  res.json(branches);
});

router.post("/", requireRole("MUDIRA"), async (req, res) => {
  const { name } = req.body || {};
  if (!name || !name.trim()) return res.status(400).json({ error: "Filial nomini kiriting" });
  const branch = await prisma.branch.create({ data: { name: name.trim() } });
  res.status(201).json(branch);
});

router.put("/:id/children", async (req, res) => {
  const id = Number(req.params.id);
  if (req.user.role !== "MUDIRA" && req.user.branchId !== id) {
    return res.status(403).json({ error: "Bu amal uchun ruxsatingiz yo'q" });
  }
  const count = Number(req.body?.count);
  if (!Number.isFinite(count) || count < 0) {
    return res.status(400).json({ error: "Bolalar soni noto'g'ri" });
  }
  const branch = await prisma.branch.update({ where: { id }, data: { childrenCount: count } });
  res.json(branch);
});

router.delete("/:id", requireRole("MUDIRA"), async (req, res) => {
  const id = Number(req.params.id);
  const stockCount = await prisma.stockEntry.count({ where: { branchId: id } });
  const userCount = await prisma.user.count({ where: { branchId: id } });
  if (stockCount > 0 || userCount > 0) {
    return res.status(400).json({ error: "Bu filialda ombor yozuvlari yoki foydalanuvchilar bor, avval ularni ko'chiring/o'chiring" });
  }
  await prisma.branch.delete({ where: { id } });
  res.status(204).end();
});

module.exports = router;
