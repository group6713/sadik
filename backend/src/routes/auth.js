const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const prisma = require("../lib/prisma");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

router.post("/login", async (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ error: "Login va parolni kiriting" });
  }

  const user = await prisma.user.findUnique({ where: { username } });
  if (!user) return res.status(401).json({ error: "Login yoki parol noto'g'ri" });

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return res.status(401).json({ error: "Login yoki parol noto'g'ri" });

  const token = jwt.sign(
    { id: user.id, username: user.username, role: user.role, branchId: user.branchId, ageGroup: user.ageGroup },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );

  res.json({
    token,
    user: {
      id: user.id,
      username: user.username,
      fullName: user.fullName,
      role: user.role,
      branchId: user.branchId,
      ageGroup: user.ageGroup,
    },
  });
});

router.get("/me", requireAuth, async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.user.id } });
  if (!user) return res.status(404).json({ error: "Foydalanuvchi topilmadi" });
  res.json({
    id: user.id,
    username: user.username,
    fullName: user.fullName,
    role: user.role,
    branchId: user.branchId,
    ageGroup: user.ageGroup,
  });
});

module.exports = router;
