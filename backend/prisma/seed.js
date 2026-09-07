const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const { AGE_GROUPS } = require("../src/lib/ageGroups");

const prisma = new PrismaClient();

function sameForAll(text) {
  return Object.fromEntries(AGE_GROUPS.map((g) => [g, text]));
}

// Rasmiy "4-ILOVA. Namunaviy yillik mavzuli reja" hujjatidan. Har bir oy uchun
// oy mavzusi va 1-4 haftalik mavzular, yosh guruhlari (3-4/4-5/5-6/6-7 yosh) bo'yicha.
// Iyun-Iyul-Avgust hujjatda haftalarga bo'linmagan — shuning uchun bittadan,
// weekNumber 0 bilan, barcha guruhlar uchun bir xil izoh sifatida kiritilgan.
const SUMMER_NOTE =
  "Tabiiy omillar - quyosh, havo va suv yordamida turli xil muolajalar amalga oshiriladi. " +
  "Turli ko'ngilochar, sport o'yinlari o'tkaziladi. O'quv yili davomida o'tilgan materiallar, " +
  "jumladan, bolalar bilan individual mashg'ulotlar mustahkamlanadi.";

const ANNUAL_PLAN = [
  {
    month: 9,
    monthTheme: "O'zbekiston – mening Vatanim",
    weeks: [
      { weekNumber: 1, topics: { "3-4": "Men va bolalar bog'chasi", "4-5": "Men va bolalar bog'chasi", "5-6": "Mening jonajon O'zbekistonim", "6-7": "Mening jonajon O'zbekistonim" } },
      { weekNumber: 2, topics: { "3-4": "Mening shahrim", "4-5": "Mening shahrim – mening mahallam", "5-6": "Mening shahrim – mening mahallam", "6-7": "Mening shahrim – mening mahallam" } },
      { weekNumber: 3, topics: sameForAll("Men va bizning oilamiz") },
      { weekNumber: 4, topics: sameForAll("Men va mening do'stlarim") },
    ],
  },
  {
    month: 10,
    monthTheme: "Kuz bo'yoqlari",
    weeks: [
      { weekNumber: 1, topics: { "3-4": "Oltin kuz", "4-5": "Oltin kuz", "5-6": "Mavsumiy o'zgarishlar / Ko'chmanchi qushlar", "6-7": "Mavsumiy o'zgarishlar / Ko'chmanchi qushlar" } },
      { weekNumber: 2, topics: { "3-4": "Sabzavot va mevalar", "4-5": "Tabiat omborxonasi: sabzavotlar, mevalar, rezavor mevalar", "5-6": "Tabiat omborxonasi: sabzavotlar, mevalar, rezavor mevalar", "6-7": "Tabiat omborxonasi: sabzavotlar, mevalar, rezavor mevalar" } },
      { weekNumber: 3, topics: sameForAll("Non rizq-ro'zimiz") },
      { weekNumber: 4, topics: sameForAll("O'zbekistonning tabiiy boyliklari") },
    ],
  },
  {
    month: 11,
    monthTheme: "Transport, yo'l harakati qoidalari. Hayot xavfsizligi asoslari",
    weeks: [
      { weekNumber: 1, topics: { "3-4": "Transport bilan tanishuv", "4-5": "Yer usti transporti", "5-6": "Havo, suv va yer usti transporti", "6-7": "Havo, suv va yer usti transporti" } },
      { weekNumber: 2, topics: { "3-4": "Svetofor", "4-5": "Svetofor", "5-6": "Ehtiyotkor piyoda haftasi", "6-7": "Ehtiyotkor piyoda haftasi" } },
      { weekNumber: 3, topics: { "3-4": "Tez yordam va o't o'chirish yordami", "4-5": "Favqulodda yordam xizmatlari", "5-6": "Favqulodda yordam xizmatlari", "6-7": "Favqulodda yordam xizmatlari" } },
      { weekNumber: 4, topics: sameForAll("Bizning xayrli (ezgu) ishlarimiz") },
    ],
  },
  {
    month: 12,
    monthTheme: "Qish",
    weeks: [
      { weekNumber: 1, topics: { "3-4": "Qish", "4-5": "Qish", "5-6": "Qish / Konstitutsiya kuni", "6-7": "Qish / Konstitutsiya kuni" } },
      { weekNumber: 2, topics: sameForAll("Sog' tanda – sog'lom aql") },
      { weekNumber: 3, topics: { "3-4": "Kiyim-kechak", "4-5": "Mavsumiy kiyim va poyabzal", "5-6": "Mavsumiy kiyim va poyabzal", "6-7": "Mavsumiy kiyim, bosh kiyim va poyabzal" } },
      { weekNumber: 4, topics: sameForAll("Yangi yil nima?") },
    ],
  },
  {
    month: 1,
    monthTheme: "Bolalar bog'chasi",
    weeks: [
      { weekNumber: 1, topics: sameForAll("Qishki ko'ngilochar o'yinlar") },
      { weekNumber: 2, topics: sameForAll("Vatan himoyachilari kuni") },
      { weekNumber: 3, topics: sameForAll("Men va mening tanam") },
      { weekNumber: 4, topics: sameForAll("Xushmuomalalik alifbosi") },
    ],
  },
  {
    month: 2,
    monthTheme: "Ajib dunyo",
    weeks: [
      { weekNumber: 1, topics: { "3-4": "Bizning totuv mamlakatimiz", "4-5": "Mamlakatimiz – do'stlik va tinchlik mamlakati", "5-6": "Qo'shni mamlakatlar", "6-7": "Qo'shni mamlakatlar" } },
      { weekNumber: 2, topics: { "3-4": "Hayvonlar va qushlar bilan do'stlashamiz", "4-5": "Hayvonlar va qushlar bilan do'stlashamiz", "5-6": "Dunyo mamlakatlari", "6-7": "Dunyo mamlakatlari" } },
      { weekNumber: 3, topics: { "3-4": "O'simliklar bilan do'stlashamiz", "4-5": "O'simliklar bilan do'stlashamiz", "5-6": "O'zbekistonning buyuk arboblari", "6-7": "O'zbekistonning buyuk arboblari" } },
      { weekNumber: 4, topics: { "3-4": "Kitob bilan do'stlashamiz", "4-5": "Kitob bilan do'stlashamiz", "5-6": "Kitob tarixi", "6-7": "Kitob tarixi va inson" } },
    ],
  },
  {
    month: 3,
    monthTheme: "Go'zal bahor",
    weeks: [
      { weekNumber: 1, topics: sameForAll("Xotin-qizlar kuni") },
      { weekNumber: 2, topics: sameForAll("Mavsumiy o'zgarishlar") },
      { weekNumber: 3, topics: { "3-4": "Navro'z bayrami", "4-5": "Navro'z bayrami", "5-6": "Xalq sarchashmalari. Navro'z bayrami", "6-7": "Xalq sarchashmalari. Navro'z bayrami" } },
      { weekNumber: 4, topics: sameForAll("Hasharotlar") },
    ],
  },
  {
    month: 4,
    monthTheme: "Yer sayyorasi – umumiy uyimiz",
    weeks: [
      { weekNumber: 1, topics: sameForAll("Gullab-yashnayotgan bahor") },
      { weekNumber: 2, topics: sameForAll("Koinot sirlari") },
      { weekNumber: 3, topics: sameForAll("Yer sayyorasi kuni") },
      { weekNumber: 4, topics: { "3-4": "Tabiatni asrab-avaylaylik", "4-5": "Tabiatni asrab-avaylaylik", "5-6": "«Sayyorani asra!»", "6-7": "«Sayyorani asra!»" } },
    ],
  },
  {
    month: 5,
    monthTheme: "Asbob va uskunalar",
    weeks: [
      { weekNumber: 1, topics: { "3-4": "Men va mening uyim", "4-5": "Men va mening uyim", "5-6": "Men va mening uyim / Xotira va qadrlash kuni", "6-7": "Men va mening uyim / Xotira va qadrlash kuni" } },
      { weekNumber: 2, topics: { "3-4": "Mebel", "4-5": "Mebel", "5-6": "Mebel / Milliy hunarmandchilik", "6-7": "Mebel / Milliy hunarmandchilik" } },
      { weekNumber: 3, topics: { "3-4": "Idishlar", "4-5": "Idishlar", "5-6": "Idishlar / Milliy naqshlar", "6-7": "Idishlar / Milliy naqshlar" } },
      { weekNumber: 4, topics: sameForAll("Maishiy asbob-uskunalar – bizning yordamchimiz") },
    ],
  },
  { month: 6, monthTheme: "Yozgi sog'lomlashtirish davri", weeks: [{ weekNumber: 0, topics: sameForAll(SUMMER_NOTE) }] },
  { month: 7, monthTheme: "Yozgi sog'lomlashtirish davri", weeks: [{ weekNumber: 0, topics: sameForAll(SUMMER_NOTE) }] },
  { month: 8, monthTheme: "Yozgi sog'lomlashtirish davri", weeks: [{ weekNumber: 0, topics: sameForAll(SUMMER_NOTE) }] },
];

const DEFAULT_NORMS = [
  { name: "Non", unit: "g", gramsPerChildPerDay: 100 },
  { name: "Un", unit: "g", gramsPerChildPerDay: 30 },
  { name: "Quruq kisel / kraxmal", unit: "g", gramsPerChildPerDay: 3 },
  { name: "Yorma / makaron", unit: "g", gramsPerChildPerDay: 45 },
  { name: "Shakar", unit: "g", gramsPerChildPerDay: 25 },
  { name: "Qandolat mahsulotlari", unit: "g", gramsPerChildPerDay: 10 },
  { name: "Sariyog'", unit: "g", gramsPerChildPerDay: 20 },
  { name: "O'simlik yog'i", unit: "g", gramsPerChildPerDay: 8 },
  { name: "Sut (2.5-3.2%)", unit: "g", gramsPerChildPerDay: 200 },
  { name: "Qatiq / kefir", unit: "g", gramsPerChildPerDay: 100 },
  { name: "Smetana", unit: "g", gramsPerChildPerDay: 5 },
  { name: "Tvorog", unit: "g", gramsPerChildPerDay: 20 },
  { name: "Pishloq", unit: "g", gramsPerChildPerDay: 10 },
  { name: "Go'sht / parranda / quyon go'shti", unit: "g", gramsPerChildPerDay: 80 },
  { name: "Baliq (tozalangan)", unit: "g", gramsPerChildPerDay: 20 },
  { name: "Tuxum", unit: "dona", gramsPerChildPerDay: 0.5 },
  { name: "Kartoshka", unit: "g", gramsPerChildPerDay: 120 },
  { name: "Sabzavotlar, tomat pastasi", unit: "g", gramsPerChildPerDay: 180 },
  { name: "Mevalar, rezavorlar, sharbatlar", unit: "g", gramsPerChildPerDay: 150 },
  { name: "Quruq meva", unit: "g", gramsPerChildPerDay: 10 },
  { name: "Choy", unit: "g", gramsPerChildPerDay: 0.3 },
  { name: "Kakao", unit: "g", gramsPerChildPerDay: 2 },
  { name: "Yo'dlangan osh tuzi", unit: "g", gramsPerChildPerDay: 5 },
  { name: "Drojja", unit: "g", gramsPerChildPerDay: 1 },
];

// Rasmiy "Yagona mavsumiy taomnoma" hujjatidan Yoz fasli, 1-kun namunasi.
// Og'irliklar "chiqitli" (tozalanmagan/xom) ustunidan olingan — bu ombordan
// qancha xom mahsulot olinishini bildiradi. Qolgan 39 kun mudira tomonidan
// Taomnoma sahifasi orqali xuddi shu qolipda kiritiladi.
const SAMPLE_DAY = {
  season: "YOZ",
  dayNumber: 1,
  dishes: [
    {
      name: "Tarik bo'tqasi",
      mealType: "NONUSHTA",
      ingredients: [
        { product: "Yorma / makaron", grams: 17.3 },
        { product: "Sut (2.5-3.2%)", grams: 52.0 },
        { product: "Sariyog'", grams: 3.0 },
        { product: "Shakar", grams: 2.5 },
        { product: "Yo'dlangan osh tuzi", grams: 0.6 },
      ],
    },
    {
      name: "Choy",
      mealType: "NONUSHTA",
      ingredients: [{ product: "Choy", grams: 0.2 }],
    },
    {
      name: "Sariyog'li buterbrod",
      mealType: "NONUSHTA",
      ingredients: [
        { product: "Sariyog'", grams: 10.0 },
        { product: "Non", grams: 40.0 },
      ],
    },
    {
      name: "Mampar",
      mealType: "TUSHLIK",
      ingredients: [
        { product: "Un", grams: 15.0 },
        { product: "Go'sht / parranda / quyon go'shti", grams: 34.0 },
        { product: "O'simlik yog'i", grams: 4.0 },
        { product: "Sabzavotlar, tomat pastasi", grams: 8.3 + 7.5 + 6.7 + 1.1 + 2.0 },
        { product: "Tuxum", grams: 7.0 },
        { product: "Smetana", grams: 5.0 },
        { product: "Yo'dlangan osh tuzi", grams: 1.0 },
      ],
    },
    {
      name: "Dimlangan mol go'shtidan befstrogan",
      mealType: "TUSHLIK",
      ingredients: [
        { product: "Go'sht / parranda / quyon go'shti", grams: 64.2 },
        { product: "Sabzavotlar, tomat pastasi", grams: 17.4 + 1.0 },
        { product: "O'simlik yog'i", grams: 3.5 },
        { product: "Un", grams: 1.0 },
        { product: "Yo'dlangan osh tuzi", grams: 1.0 },
      ],
    },
    {
      name: "Kartoshka pyuresi",
      mealType: "TUSHLIK",
      ingredients: [
        { product: "Kartoshka", grams: 142.5 },
        { product: "Sut (2.5-3.2%)", grams: 19.9 },
        { product: "Sariyog'", grams: 4.3 },
        { product: "Yo'dlangan osh tuzi", grams: 1.0 },
      ],
    },
    {
      name: "Bodiring (porsiyali)",
      mealType: "TUSHLIK",
      ingredients: [
        { product: "Sabzavotlar, tomat pastasi", grams: 47.4 },
        { product: "Yo'dlangan osh tuzi", grams: 0.2 },
      ],
    },
    {
      name: "Olma kompoti",
      mealType: "TUSHLIK",
      ingredients: [
        { product: "Mevalar, rezavorlar, sharbatlar", grams: 42.9 },
        { product: "Shakar", grams: 8.0 },
      ],
    },
    {
      name: "Bug'doy noni (tushlik)",
      mealType: "TUSHLIK",
      ingredients: [{ product: "Non", grams: 60.0 }],
    },
    {
      name: "Plyushka bulochka",
      mealType: "IKKINCHI_TUSHLIK",
      ingredients: [
        { product: "Sariyog'", grams: 2.6 + 1.0 },
        { product: "Tuxum", grams: 6.1 + 2.3 },
        { product: "Un", grams: 30.8 },
        { product: "Drojja", grams: 1.04 },
        { product: "Sut (2.5-3.2%)", grams: 15.6 + 15.6 },
        { product: "Shakar", grams: 7.8 + 2.0 },
        { product: "Yo'dlangan osh tuzi", grams: 0.8 },
      ],
    },
    {
      name: "Kefir",
      mealType: "IKKINCHI_TUSHLIK",
      ingredients: [{ product: "Qatiq / kefir", grams: 150.0 }],
    },
  ],
};

async function main() {
  const existingNorms = await prisma.normProduct.findMany({ select: { name: true } });
  const existingNames = new Set(existingNorms.map((n) => n.name));
  const missingNorms = DEFAULT_NORMS.filter((n) => !existingNames.has(n.name));
  if (missingNorms.length > 0) {
    await prisma.normProduct.createMany({ data: missingNorms });
    console.log(`Me'yor jadvaliga qo'shildi: ${missingNorms.map((n) => n.name).join(", ")}`);
  }

  const menuDayExists = await prisma.menuDay.findUnique({
    where: { season_dayNumber: { season: SAMPLE_DAY.season, dayNumber: SAMPLE_DAY.dayNumber } },
  });
  if (!menuDayExists) {
    const norms = await prisma.normProduct.findMany();
    const normByName = new Map(norms.map((n) => [n.name, n]));

    const menuDay = await prisma.menuDay.create({
      data: { season: SAMPLE_DAY.season, dayNumber: SAMPLE_DAY.dayNumber },
    });

    for (const d of SAMPLE_DAY.dishes) {
      const dish = await prisma.dish.create({
        data: {
          name: d.name,
          mealType: d.mealType,
          ingredients: {
            create: d.ingredients.map((i) => {
              const norm = normByName.get(i.product);
              if (!norm) throw new Error(`Me'yor jadvalida topilmadi: ${i.product}`);
              return { productId: norm.id, gramsPerChild: i.grams };
            }),
          },
        },
      });
      await prisma.menuDayDish.create({ data: { menuDayId: menuDay.id, dishId: dish.id } });
    }
    console.log(`Taomnoma namunasi yaratildi: ${SAMPLE_DAY.season}, ${SAMPLE_DAY.dayNumber}-kun (${SAMPLE_DAY.dishes.length} ta taom).`);
  }

  const weekCount = await prisma.activityWeek.count();
  if (weekCount === 0) {
    for (const monthPlan of ANNUAL_PLAN) {
      for (const w of monthPlan.weeks) {
        const week = await prisma.activityWeek.create({
          data: { month: monthPlan.month, weekNumber: w.weekNumber, monthTheme: monthPlan.monthTheme },
        });
        await prisma.activityTopic.createMany({
          data: AGE_GROUPS.map((g) => ({ weekId: week.id, ageGroup: g, topic: w.topics[g] })),
        });
      }
    }
    console.log(`Yillik mavzuli reja yaratildi: ${ANNUAL_PLAN.length} oy.`);
  }

  let branch = await prisma.branch.findFirst();
  if (!branch) {
    branch = await prisma.branch.create({ data: { name: "Bosh filial", childrenCount: 80 } });
    console.log(`Filial yaratildi: ${branch.name}`);
  }

  const mudiraExists = await prisma.user.findUnique({ where: { username: "mudira" } });
  if (!mudiraExists) {
    const passwordHash = await bcrypt.hash("mudira12345", 10);
    await prisma.user.create({
      data: { username: "mudira", passwordHash, fullName: "Bosh mudira", role: "MUDIRA" },
    });
    console.log("Mudira akkaunti yaratildi -> login: mudira, parol: mudira12345");
  }

  const povorExists = await prisma.user.findUnique({ where: { username: "povor" } });
  if (!povorExists) {
    const passwordHash = await bcrypt.hash("povor12345", 10);
    await prisma.user.create({
      data: {
        username: "povor",
        passwordHash,
        fullName: "Oshxona xodimi",
        role: "POVOR",
        branchId: branch.id,
      },
    });
    console.log("Povor akkaunti yaratildi -> login: povor, parol: povor12345");
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
