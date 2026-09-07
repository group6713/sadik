const express = require("express");
const bcrypt = require("bcryptjs");
const prisma = require("../lib/prisma");
const { requireAuth, requireRole } = require("../middleware/auth");
const { AGE_GROUPS } = require("../lib/ageGroups");

const router = express.Router();
router.use(requireAuth, requireRole("MUDIRA"));

const ROLES = ["MUDIRA", "POVOR", "TARBIYACHI", "OTA_ONA"];

function serialize(user) {
  const { passwordHash, ...rest } = user;
  return rest;
}

router.get("/", async (req, res) => {
  const users = await prisma.user.findMany({ include: { branch: true }, orderBy: { id: "asc" } });
  res.json(users.map(serialize));
});

router.post("/", async (req, res) => {
  const { username, password, fullName, role, branchId, ageGroup } = req.body || {};
  if (!username || !password || !fullName || !role) {
    return res.status(400).json({ error: "Barcha maydonlarni to'ldiring" });
  }
  if (!ROLES.includes(role)) return res.status(400).json({ error: "Noto'g'ri rol" });
  if (ageGroup && !AGE_GROUPS.includes(ageGroup)) return res.status(400).json({ error: "Yosh guruhi noto'g'ri" });

  const existing = await prisma.user.findUnique({ where: { username } });
  if (existing) return res.status(409).json({ error: "Bu login band" });

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: {
      username,
      passwordHash,
      fullName,
      role,
      branchId: branchId ? Number(branchId) : null,
      ageGroup: role === "TARBIYACHI" && ageGroup ? ageGroup : null,
    },
  });
  res.status(201).json(serialize(user));
});

router.put("/:id", async (req, res) => {
  const id = Number(req.params.id);
  const { fullName, role, branchId, password, ageGroup } = req.body || {};
  const data = {};
  if (fullName) data.fullName = fullName;
  if (role) {
    if (!ROLES.includes(role)) return res.status(400).json({ error: "Noto'g'ri rol" });
    data.role = role;
  }
  if (branchId !== undefined) data.branchId = branchId ? Number(branchId) : null;
  if (ageGroup !== undefined) {
    if (ageGroup && !AGE_GROUPS.includes(ageGroup)) return res.status(400).json({ error: "Yosh guruhi noto'g'ri" });
    data.ageGroup = ageGroup || null;
  }
  if (password) data.passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.user.update({ where: { id }, data });
  res.json(serialize(user));
});

router.delete("/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (id === req.user.id) return res.status(400).json({ error: "O'zingizni o'chira olmaysiz" });
  await prisma.user.delete({ where: { id } });
  res.status(204).end();
});

module.exports = router;
