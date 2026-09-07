const express = require("express");
const prisma = require("../lib/prisma");
const { requireAuth, requireRole } = require("../middleware/auth");
const { computeStockStatus } = require("../lib/calc");

const router = express.Router();
router.use(requireAuth);

function canAccessBranch(user, branchId) {
  return user.role === "MUDIRA" || user.branchId === branchId;
}

router.get("/", async (req, res) => {
  const branchId = Number(req.query.branchId);
  if (!branchId) return res.status(400).json({ error: "branchId talab qilinadi" });
  if (!canAccessBranch(req.user, branchId)) {
    return res.status(403).json({ error: "Bu filialga ruxsatingiz yo'q" });
  }

  const branch = await prisma.branch.findUnique({ where: { id: branchId } });
  if (!branch) return res.status(404).json({ error: "Filial topilmadi" });

  const entries = await prisma.stockEntry.findMany({
    where: { branchId },
    include: { product: true, createdBy: true },
    orderBy: { receivedDate: "desc" },
  });

  const result = entries.map((entry) => {
    const status = computeStockStatus(entry, entry.product, branch.childrenCount);
    return {
      id: entry.id,
      qty: entry.qty,
      receivedDate: entry.receivedDate,
      supplier: entry.supplier,
      createdByName: entry.createdBy ? entry.createdBy.fullName : null,
      product: { id: entry.product.id, name: entry.product.name, unit: entry.product.unit },
      ...status,
    };
  });

  res.json({ branch, entries: result });
});

router.post("/", requireRole("MUDIRA", "POVOR"), async (req, res) => {
  const { branchId, productId, qty, receivedDate, supplier } = req.body || {};
  const bId = Number(branchId);
  const pId = Number(productId);
  const q = Number(qty);

  if (!canAccessBranch(req.user, bId)) {
    return res.status(403).json({ error: "Bu filialga ruxsatingiz yo'q" });
  }
  if (!bId || !pId || !Number.isFinite(q) || q <= 0) {
    return res.status(400).json({ error: "Ma'lumotlar to'liq emas" });
  }

  const entry = await prisma.stockEntry.create({
    data: {
      branchId: bId,
      productId: pId,
      qty: q,
      receivedDate: receivedDate ? new Date(receivedDate) : new Date(),
      supplier: supplier || null,
      createdByUserId: req.user.id,
    },
    include: { product: true },
  });

  const branch = await prisma.branch.findUnique({ where: { id: bId } });
  const status = computeStockStatus(entry, entry.product, branch.childrenCount);
  res.status(201).json({ ...entry, ...status });
});

router.delete("/:id", async (req, res) => {
  const id = Number(req.params.id);
  const entry = await prisma.stockEntry.findUnique({ where: { id } });
  if (!entry) return res.status(404).json({ error: "Yozuv topilmadi" });

  const isOwner = entry.createdByUserId === req.user.id;
  if (req.user.role !== "MUDIRA" && !isOwner) {
    return res.status(403).json({ error: "Faqat o'zingiz kiritgan yozuvni o'chira olasiz" });
  }
  if (!canAccessBranch(req.user, entry.branchId)) {
    return res.status(403).json({ error: "Bu filialga ruxsatingiz yo'q" });
  }

  await prisma.stockEntry.delete({ where: { id } });
  res.status(204).end();
});

module.exports = router;
