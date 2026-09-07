# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Loyiha haqida

**MittiQadam** — O'zbekistondagi bog'cha (maktabgacha ta'lim tashkiloti) uchun boshqaruv tizimi, B2B SaaS sifatida rejalashtirilgan (filiallar soniga qarab oylik obuna). To'liq TZ bir nechta modulni ko'zda tutadi: Retseptlar, Mahsulotlarni tahlil qilish/Ombor, Haftalik mashg'ulotlar, Ota-onalar bilan aloqa, QR orqali tasdiqlash, Oylik hisobotlar. **Hozircha auth/rol poydevori, Ombor moduli, Retseptlar/Taomnoma moduli va Mashg'ulotlar (yillik mavzuli reja) moduli qurilgan** — qolgan modullar hali yo'q (pastdagi "Qamrov" bo'limiga qarang).

Loyiha ikkita mustaqil npm loyihasidan iborat (workspace emas, ikkalasi alohida `node_modules`ga ega):

```
backend/    Node.js + Express + Prisma (SQLite) — REST API, port 4000
frontend/   React + Vite (JS, TypeScript emas) — SPA, port 5173
```

## Buyruqlar

**Backend** (`backend/` ichida):
```
npm install
npm run prisma:migrate   # schema.prisma o'zgarganda yangi migratsiya yaratadi/qo'llaydi
npm run prisma:generate  # faqat Prisma Client'ni qayta generatsiya qiladi
npm run seed              # prisma/seed.js: bosh filial, mudira/povor akkauntlari, 24 ta standart me'yor, Yoz-1-kun namunaviy taomnoma
npm run dev                # nodemon bilan http://localhost:4000
npm start                  # nodemon'siz oddiy ishga tushirish
```
Lint va test skriptlari yo'q (hali yozilmagan).

**Frontend** (`frontend/` ichida):
```
npm install
npm run dev       # Vite dev server, http://localhost:5173
npm run build     # production build
npm run lint       # oxlint
npm run preview    # build natijasini ko'rish
```

Ikkala server alohida-alohida, parallel ishga tushirilishi kerak (frontend backend'ga `http://localhost:4000/api` orqali murojaat qiladi — `frontend/src/api.js`da `VITE_API_URL` environment o'zgaruvchisidan o'qiladi, o'rnatilmagan bo'lsa shu localhost manziliga tushadi; production build uchun Netlify/hosting sozlamalarida `VITE_API_URL`ni haqiqiy backend manziliga o'rnatish kerak).

**Netlify/Vercel orqali deploy:** repo tagida ikkalasi uchun ham tayyor konfiguratsiya bor — `netlify.toml` (`base = "frontend"`, `publish = "dist"`, SPA redirect) va `vercel.json` (`installCommand`/`buildCommand` `frontend/`ga `cd` qilib ishlaydi, `outputDirectory: frontend/dist`, SPA rewrite). Ikkalasi ham faqat frontend'ni (statik build) joylashtira oladi — `backend/` (Express + SQLite) ular ustida ishlamaydi (ikkalasi ham asosan statik/serverless platforma, doimiy Node server saqlamaydi). `backend/` alohida hostingga (masalan Render/Railway) joylashtirilishi va uning ochiq manzili Netlify/Vercel sayt sozlamalarida `VITE_API_URL` environment o'zgaruvchisi sifatida kiritilishi kerak — aks holda deploy qilingan sayt ochiladi, lekin login/ma'lumotlar ishlamaydi (brauzer localhost'ga so'rov yuborishga urinadi).

**Sinov uchun default loginlar** (`backend/prisma/seed.js`): `mudira` / `mudira12345` (rol: MUDIRA, barcha filiallarga kirish huquqi) va `povor` / `povor12345` (rol: POVOR, faqat o'z filialiga bog'langan). Real foydalanishdan oldin bu parollar almashtirilishi kerak.

## Arxitektura

### Backend — rol va ruxsat modeli

To'rtta rol bor: `MUDIRA`, `POVOR`, `TARBIYACHI`, `OTA_ONA`. **Muhim:** `User.role` Prisma schema'da oddiy `String`, native enum emas — chunki SQLite'da Prisma enumlarni qo'llab-quvvatlamaydi (`backend/prisma/schema.prisma`dagi izohga qarang). Ruxsat etilgan qiymatlar faqat ilova qatlamida (`backend/src/routes/users.js` ichidagi `ROLES` massivi) tekshiriladi — schema darajasida cheklov yo'q. Yangi rol qo'shilganda shu massivni yangilash kerak.

Avtorizatsiya ikki qatlamli:
- `middleware/auth.js`: `requireAuth` (JWT tekshiradi, `req.user`ga `{id, username, role, branchId}` yozadi) va `requireRole(...roles)`.
- Filial darajasidagi ruxsat esa route ichida qo'lda tekshiriladi (`canAccessBranch` funksiyasi `stock.js`da, shunga o'xshash mantiq `branches.js`da ham takrorlangan): MUDIRA istalgan filialga kira oladi, boshqa rollar faqat JWT'dagi `branchId`iga mos filialga.
- Ombor yozuvini o'chirishda qo'shimcha qoida bor: MUDIRA yoki yozuvni **o'zi yaratgan** foydalanuvchigina o'chira oladi (`stock.js`dagi `isOwner` tekshiruvi) — bu boshqa CRUD endpointlarda yo'q, faqat shu yerda.

### Backend — hisob-kitob mantig'i (tizimning yuragi)

`backend/src/lib/calc.js` dagi `computeStockStatus(entry, product, childrenCount, now)` — butun Ombor modulining markaziy formulasi:

```
kunlikSarf = mahsulotning kunlik me'yori (NormProduct.gramsPerChildPerDay) × filialning bolalar soni
necha kunga yetadi = floor(kelgan miqdor (gramm yoki dona) / kunlikSarf)
holat = daysLeft < 5 ? "critical" : daysLeft < 14 ? "warn" : "good"
```

Bu funksiya faqat `routes/stock.js`da chaqiriladi (GET va POST ikkalasida) — frontend hech qanday hisob-kitobni o'zi qilmaydi, faqat backend qaytargan `dailyNeed`/`daysCovered`/`runOutDate`/`daysLeft`/`status` maydonlarini ko'rsatadi.

**Muhim biznes cheklov (loyiha egasi bilan kelishilgan):** bu hisob-kitob SanQvaN №0016-21 rasmiy kunlik me'yoriga asoslangan **taxmin**, aniq retsept ingredientlariga bog'lanmagan. Retseptlar moduli qo'shilgach, ikki xil hisob-kitob parallel yashaydi: (1) shu `computeStockStatus` — norma-asosli taxmin, ombor nazorati uchun (Ombor sahifasi) va (2) quyidagi `computeMenuDayConsumption` — retsept-asosli aniq sarf (Kunlik retsept sahifasi). Ular birlashtirilmagan — ikkinchisi birinchisini almashtirmaydi, balki aniqlashtiradi.

### Backend — Retseptlar/Taomnoma moduli

Ombordan keyin qo'shilgan ikkinchi asosiy modul (migratsiya: `20260819101353_add_menu_recipe_module`). Ikki bosqichli ish oqimi:

1. **Taomnoma tuzish** (`backend/src/routes/menu.js`, faqat MUDIRA yoza oladi): avval `Dish` (taom) — nomi, `mealType` (`NONUSHTA`/`TUSHLIK`/`IKKINCHI_TUSHLIK`) va `DishIngredient` orqali tarkibi (`NormProduct`ga bog'langan, `gramsPerChild` — taomnoma hujjatidagi "chiqitli"/xom og'irlik) kiritiladi. So'ng har bir `season` (`BAHOR`/`YOZ`/`KUZ`/`QISH`) + `dayNumber` (1–10) juftligi uchun `PUT /menu/days/:season/:dayNumber` orqali qaysi taomlar beriladi belgilanadi (`MenuDay`/`MenuDayDish` — bu endpoint kun uchun taomlar ro'yxatini to'liq almashtiradi, incremental qo'shmaydi).
2. **Kunlik retsept ko'rish** (`GET /menu/days/:id/recipe?branchId=`, MUDIRA+POVOR): `backend/src/lib/calc.js`dagi `computeMenuDayConsumption(menuDay, childrenCount)` shu kundagi barcha taomlarning ingredientlarini mahsulot bo'yicha jamlab, filialning bolalar soniga ko'paytiradi. Route so'ng buni o'sha filialning joriy `StockEntry` yig'indisi bilan solishtirib, har bir mahsulot uchun `sufficient`/yetishmaydi belgisini qo'shadi — ombor va retsept ma'lumotlari shu yerda birinchi marta bir joyda ko'rinadi.

Birlik moslashtirish: `StockEntry.qty` mahsulotning o'z birligida (`kg` yoki `dona`) saqlanadi, ingredientlar esa har doim grammda (`gramsPerChild`). `dona` birlikdagi mahsulotlar (hozircha faqat Tuxum) uchun `calc.js`dagi `DONA_UNIT_APPROX_GRAMS = 50` taxminiy og'irlik solishtirish uchun ishlatiladi — bu rasmiy "1-toifa tuxum" og'irligiga asoslangan taxmin, aniq o'lchov emas.

### Backend — Mashg'ulotlar moduli (yillik mavzuli reja)

Rasmiy "4-ILOVA. Namunaviy yillik mavzuli reja" hujjatiga asoslangan, filiallardan mustaqil, global modul (`backend/src/routes/activities.js`). Ombor/Retseptlar modullaridan farqli o'laroq bolalar sonini emas, faqat **vaqt** (kalendar oy + hafta) va **yosh guruhi**ni ishlatadi:

- Har bir kalendar oy uchun 1–4 haftalik mavzu bor; yozgi oylar (Iyun/Iyul/Avgust) hujjatda haftalarga bo'linmagan, shuning uchun `weekNumber = 0` bitta "butun oy" yozuvi sifatida saqlanadi (`backend/src/lib/activityWeek.js`dagi `SUMMER_MONTHS`).
- `PUT /activities/:month/:weekNumber` (MUDIRA) — oy mavzusi va 4 ta yosh guruhining (`3-4`/`4-5`/`5-6`/`6-7`, `backend/src/lib/ageGroups.js`) hammasini birdan to'liq almashtiradi; qisman to'ldirilgan so'rov rad etiladi.
- `GET /activities/current?ageGroup=` — `backend/src/lib/activityWeek.js`dagi `resolveActivityWeek(now)` joriy sanadan (oy, hafta)ni hisoblab, o'sha guruhning bugungi mavzusini qaytaradi. `TARBIYACHI` uchun `User.ageGroup` (JWT'da ham bor) — front-end buni har doim `ageGroup` query parametri sifatida aniq yuboradi, shuning uchun mudira guruhini o'zgartirganda eski JWT muammo tug'dirmaydi.
- Frontend: `src/pages/Mashgulotlar.jsx` — MUDIRA uchun oy/hafta/guruh jadvalini tahrirlash, TARBIYACHI uchun faqat o'z guruhiga tegishli "bugungi mavzu" + yillik jadval (guruh biriktirilmagan bo'lsa bo'sh holat ko'rsatadi). `Users.jsx`dagi foydalanuvchi shakli TARBIYACHI uchun shu yerdan import qilingan `AGE_GROUPS`dan foydalanadi.

### Ma'lumotlar modeli (`backend/prisma/schema.prisma`)

`Branch` (filial, `childrenCount` maydoni bilan) → `User` (branchId bog'lanadi) va `StockEntry`. `NormProduct` filiallardan mustaqil, global (bitta tashkilotning barcha filiallari bir xil me'yor jadvalidan foydalanadi) — Ombor va Retseptlar moduli ikkalasi ham shu bitta mahsulot ro'yxatidan foydalanadi, alohida katalog yo'q. `StockEntry` — `Branch`, `NormProduct` va uni yaratgan `User`ga bog'langan. Bolalar soni yosh guruhlariga bo'linmagan (rasmiy me'yor jadvalida ham bitta ustun bo'lgani uchun) — bitta `childrenCount` son sifatida saqlanadi.

`Dish` (taom) → `DishIngredient` orqali `NormProduct`ga ko'p-ko'p bog'lanadi (bitta taom bir nechta mahsulotdan, bitta mahsulot bir nechta taomda ishlatilishi mumkin). `MenuDay` (`season`+`dayNumber` unique juftlik) → `MenuDayDish` join jadvali orqali bir nechta `Dish`ga ko'p-ko'p bog'lanadi.

`User.ageGroup` (nullable String) — faqat TARBIYACHI uchun ma'noli, Mashg'ulotlar modulida qaysi yosh guruhi mavzusi ko'rsatilishini belgilaydi. `ActivityWeek` (`month`+`weekNumber` unique juftlik) → `ActivityTopic` orqali har bir yosh guruhi uchun alohida mavzu matniga ega; ikkalasi ham `Branch`/`NormProduct`dan mustaqil.

### Frontend

- `src/auth/AuthContext.jsx` — JWT `localStorage`da (`mq_token`), `/api/auth/me` orqali sahifa yuklanganda tasdiqlanadi.
- `src/api.js` — barcha backend chaqiruvlari shu yerdan o'tadi (fetch wrapper, xato bo'lsa `Error` tashlaydi).
- `src/App.jsx` — `ProtectedRoute` (login talab qiladi) va `RoleRoute` (rol bo'yicha cheklaydi) pattern'lari; TARBIYACHI/OTA_ONA rollari uchun `/tez-orada` (ComingSoon) sahifasiga yo'naltiriladi.
- `src/pages/Layout.jsx` — sidebar navigatsiyasi rolga qarab shartli render qilinadi (masalan Me'yor jadvali/Filiallar/Foydalanuvchilar faqat MUDIRA uchun).
- `src/pages/Taomnoma.jsx` (faqat MUDIRA) — ikki tabli sahifa: "Taomlar katalogi" (Dish CRUD + ingredient qatorlari) va "Kunlarga taqsimlash" (fasl+kun tanlab, checklist orqali qaysi taomlar beriladi belgilash). `SEASONS`/`MEAL_TYPES`/`MEAL_LABEL` shu fayldan export qilinadi va `Retsept.jsx` ularni qayta ishlatadi.
- `src/pages/Retsept.jsx` (MUDIRA+POVOR) — filial, fasl va kun tanlangach `api.menu.days.recipe`ni chaqirib, backend hisoblagan bolalar soniga moslangan aniq miqdorlarni va ombor yetarli/yetishmaydi holatini ko'rsatadi; bu yerda ham hech qanday hisob-kitob frontend'da qilinmaydi.
- `src/pages/Mashgulotlar.jsx` — rolga qarab ikki xil ko'rinish bitta faylda: MUDIRA uchun oy tanlab yillik reja jadvalini tahrirlash, TARBIYACHI uchun faqat o'ziga (`user.ageGroup`) tegishli bugungi mavzu + yillik jadval (faqat o'qish uchun). `AGE_GROUPS` shu fayldan export qilinib `Users.jsx`da ham ishlatiladi.
- Dizayn tokenlari (`src/index.css`): teal/stone palitra, Fraunces (display) + Work Sans (body) — Google Fonts orqali `index.html`da ulangan. Bu palitra/shrift juftligi loyihaning barcha ekranlarida (shu jumladan avvalgi bir martalik HTML artifact'da) qo'llanilgan, yangi sahifalar shu tokenlarga mos bo'lishi kerak.

## Qamrov — nima bor, nima yo'q

Qurilgan: login/JWT, 4 rol, Filiallar CRUD, Foydalanuvchilar CRUD, Me'yor jadvali CRUD, Ombor (mahsulot kiritish + avtomatik "necha kunga yetadi" hisobi), Retseptlar/Taomnoma moduli (taomlar katalogi, fasl+10 kunlik taomnoma tuzish, filial bolalar soniga moslangan kunlik retsept hisobi + ombor bilan solishtirish), Mashg'ulotlar moduli (yillik mavzuli reja — oy/hafta/yosh guruhi bo'yicha, TARBIYACHI o'z guruhiga tegishli joriy mavzuni avtomatik ko'radi).

Retseptlar modulida TZ'dagi qismlardan hali yo'qlari: taomnoma hujjatini PDF/fayldan avtomatik import qilish yo'q (har bir taom qo'lda, UI orqali kiritiladi) va QR orqali tasdiqlash yo'q. Mashg'ulotlar modulida haftalik/kunlik konspekt (mashg'ulot ishlanmasi) yo'q — faqat mavzu nomi, TZ'dagi to'liq "haftalik mashg'ulotlar" tafsiloti emas.

Hali umuman yo'q (TZ'da bor, kod bazasida yo'q): Ota-onalar bilan aloqa moduli, Oylik hisobotlar (PDF/Excel eksport). OTA_ONA roli tizimga kira oladi, lekin hozircha faqat placeholder sahifa ko'radi (`src/pages/ComingSoon.jsx`).

Deploy hali qilinmagan (lokal SQLite bilan ishlaydi). Production'ga o'tishda `schema.prisma`dagi `datasource.provider`ni o'zgartirib PostgreSQL'ga ko'chirish mo'ljallangan — bu hali amalga oshirilmagan.
