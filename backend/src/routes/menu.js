const express = require("express");
const prisma = require("../lib/prisma");
const { requireAuth, requireRole } = require("../middleware/auth");
const { computeMenuDayConsumption } = require("../lib/calc");

const router = express.Router();
router.use(requireAuth);

const SEASONS = ["BAHOR", "YOZ", "KUZ", "QISH"];
const MEAL_TYPES = ["NONUSHTA", "TUSHLIK", "IKKINCHI_TUSHLIK"];

function canAccessBranch(user, branchId) {
  return user.role === "MUDIRA" || user.branchId === branchId;
}

function validIngredients(ingredients) {
  return (
    Array.isArray(ingredients) &&
    ingredients.length > 0 &&
    ingredients.every(
      (i) => Number.isInteger(Number(i.productId)) && Number.isFinite(Number(i.gramsPerChild)) && Number(i.gramsPerChild) > 0
    )
  );
}

// ---- Taomlar katalogi ----

router.get("/dishes", async (req, res) => {
  const dishes = await prisma.dish.findMany({
    include: { ingredients: { include: { product: true } } },
    orderBy: [{ mealType: "asc" }, { name: "asc" }],
  });
  res.json(dishes);
});

router.post("/dishes", requireRole("MUDIRA"), async (req, res) => {
  const { name, mealType, ingredients } = req.body || {};
  if (!name || !name.trim() || !MEAL_TYPES.includes(mealType) || !validIngredients(ingredients)) {
    return res.status(400).json({ error: "Taom ma'lumotlari to'liq emas" });
  }
  const dish = await prisma.dish.create({
    data: {
      name: name.trim(),
      mealType,
      ingredients: {
        create: ingredients.map((i) => ({ productId: Number(i.productId), gramsPerChild: Number(i.gramsPerChild) })),
      },
    },
    include: { ingredients: { include: { product: true } } },
  });
  res.status(201).json(dish);
});

router.put("/dishes/:id", requireRole("MUDIRA"), async (req, res) => {
  const id = Number(req.params.id);
  const { name, mealType, ingredients } = req.body || {};
  if (!name || !name.trim() || !MEAL_TYPES.includes(mealType) || !validIngredients(ingredients)) {
    return res.status(400).json({ error: "Taom ma'lumotlari to'liq emas" });
  }

  const exists = await prisma.dish.findUnique({ where: { id } });
  if (!exists) return res.status(404).json({ error: "Taom topilmadi" });

  await prisma.dishIngredient.deleteMany({ where: { dishId: id } });
  const dish = await prisma.dish.update({
    where: { id },
    data: {
      name: name.trim(),
      mealType,
      ingredients: {
        create: ingredients.map((i) => ({ productId: Number(i.productId), gramsPerChild: Number(i.gramsPerChild) })),
      },
    },
    include: { ingredients: { include: { product: true } } },
  });
  res.json(dish);
});

router.delete("/dishes/:id", requireRole("MUDIRA"), async (req, res) => {
  const id = Number(req.params.id);
  const dish = await prisma.dish.findUnique({ where: { id } });
  if (!dish) return res.status(404).json({ error: "Taom topilmadi" });

  const used = await prisma.menuDayDish.count({ where: { dishId: id } });
  if (used > 0) {
    return res.status(400).json({ error: "Bu taom taomnoma kunlarida ishlatilgan, avval o'sha kunlardan chiqaring" });
  }
  await prisma.dish.delete({ where: { id } });
  res.status(204).end();
});

// ---- Taomnoma kunlari (fasl + kun) ----

router.get("/days", async (req, res) => {
  const season = String(req.query.season || "").toUpperCase();
  if (!SEASONS.includes(season)) return res.status(400).json({ error: "Fasl noto'g'ri" });

  const days = await prisma.menuDay.findMany({
    where: { season },
    include: { dishes: { include: { dish: true } } },
    orderBy: { dayNumber: "asc" },
  });
  res.json(days);
});

router.get("/days/:id", async (req, res) => {
  const id = Number(req.params.id);
  const day = await prisma.menuDay.findUnique({
    where: { id },
    include: { dishes: { include: { dish: { include: { ingredients: { include: { product: true } } } } } } },
  });
  if (!day) return res.status(404).json({ error: "Taomnoma kuni topilmadi" });
  res.json(day);
});

// Bitta fasl+kun uchun taomlar ro'yxatini to'liq almashtiradi (yo'q bo'lsa yaratadi).
router.put("/days/:season/:dayNumber", requireRole("MUDIRA"), async (req, res) => {
  const season = String(req.params.season || "").toUpperCase();
  const dayNumber = Number(req.params.dayNumber);
  const { dishIds } = req.body || {};

  if (!SEASONS.includes(season) || !Number.isInteger(dayNumber) || dayNumber < 1 || dayNumber > 10) {
    return res.status(400).json({ error: "Fasl yoki kun raqami noto'g'ri" });
  }
  if (!Array.isArray(dishIds)) return res.status(400).json({ error: "Taomlar ro'yxati noto'g'ri" });

  const day = await prisma.menuDay.upsert({
    where: { season_dayNumber: { season, dayNumber } },
    create: { season, dayNumber },
    update: {},
  });

  await prisma.menuDayDish.deleteMany({ where: { menuDayId: day.id } });
  if (dishIds.length > 0) {
    await prisma.menuDayDish.createMany({
      data: dishIds.map((dishId) => ({ menuDayId: day.id, dishId: Number(dishId) })),
    });
  }

  const full = await prisma.menuDay.findUnique({
    where: { id: day.id },
    include: { dishes: { include: { dish: true } } },
  });
  res.json(full);
});

// ---- Filial uchun bolalar soniga moslab hisoblangan retsept ----

router.get("/days/:id/recipe", async (req, res) => {
  const id = Number(req.params.id);
  const branchId = Number(req.query.branchId);
  if (!branchId) return res.status(400).json({ error: "branchId talab qilinadi" });
  if (!canAccessBranch(req.user, branchId)) {
    return res.status(403).json({ error: "Bu filialga ruxsatingiz yo'q" });
  }

  const branch = await prisma.branch.findUnique({ where: { id: branchId } });
  if (!branch) return res.status(404).json({ error: "Filial topilmadi" });

  const menuDay = await prisma.menuDay.findUnique({
    where: { id },
    include: { dishes: { include: { dish: { include: { ingredients: { include: { product: true } } } } } } },
  });
  if (!menuDay) return res.status(404).json({ error: "Taomnoma kuni topilmadi" });

  const totals = computeMenuDayConsumption(menuDay, branch.childrenCount);

  // Ombordagi mavjud miqdor — StockEntry.qty allaqachon mahsulotning o'z birligida
  // (kg yoki dona) kiritilgan, computeStockStatus'dagi kabi grammga normallashtiramiz.
  const stockEntries = await prisma.stockEntry.findMany({ where: { branchId }, include: { product: true } });
  const stockBaseByProduct = new Map();
  for (const e of stockEntries) {
    const qtyBase = e.product.unit === "dona" ? e.qty : e.qty * 1000;
    stockBaseByProduct.set(e.productId, (stockBaseByProduct.get(e.productId) || 0) + qtyBase);
  }

  // totalQty va stockQty ikkalasi ham mahsulotning o'z birligida (kg yoki dona) —
  // shu tufayli to'g'ridan-to'g'ri solishtirsa bo'ladi.
  const totalsWithStock = totals.map((row) => {
    const stockBase = stockBaseByProduct.get(row.product.id) || 0;
    const stockQty = row.product.unit === "dona" ? stockBase : stockBase / 1000;
    return {
      ...row,
      stockQty,
      sufficient: stockQty >= row.totalQty,
    };
  });

  const dishesByMeal = {};
  for (const mt of MEAL_TYPES) dishesByMeal[mt] = [];
  for (const md of menuDay.dishes) {
    dishesByMeal[md.dish.mealType].push({
      id: md.dish.id,
      name: md.dish.name,
      ingredients: md.dish.ingredients.map((ing) => ({
        product: ing.product,
        gramsPerChild: ing.gramsPerChild,
        totalGrams: ing.gramsPerChild * branch.childrenCount,
      })),
    });
  }

  res.json({
    menuDay: { id: menuDay.id, season: menuDay.season, dayNumber: menuDay.dayNumber },
    branch: { id: branch.id, name: branch.name, childrenCount: branch.childrenCount },
    dishesByMeal,
    totals: totalsWithStock,
  });
});

module.exports = router;
