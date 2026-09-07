# MittiQadam

Bog'cha boshqaruv tizimi — backend + frontend. Hozircha ishlaydigan qism: **login/rollar** va **Ombor/Ratsion moduli** (kelgan mahsulotni SanQvaN kunlik me'yoriga qarab necha kunga yetishini hisoblash).

## Loyiha tuzilishi

```
backend/    Node.js + Express + Prisma (SQLite) — REST API
frontend/   React + Vite — brauzer ilovasi
```

## Ishga tushirish

Ikkala qism alohida serverda ishlaydi, ikkalasini ham ishga tushirish kerak.

**1. Backend** (http://localhost:4000):

```
cd backend
npm install
npm run prisma:migrate   # bazani yaratadi (birinchi marta)
npm run seed              # namunaviy filial, foydalanuvchi va me'yor jadvalini yaratadi
npm run dev
```

**2. Frontend** (http://localhost:5173):

```
cd frontend
npm install
npm run dev
```

Brauzerda `http://localhost:5173` ni oching.

## Sinov uchun kirish

| Login | Parol | Rol |
|---|---|---|
| `mudira` | `mudira12345` | Mudira — hamma narsani ko'radi va boshqaradi |
| `povor` | `povor12345` | Oshxona xodimi — faqat Ombor bo'limi |

Haqiqiy foydalanishdan oldin bu parollarni **Foydalanuvchilar** bo'limidan albatta o'zgartiring.

## Ombor moduli qanday ishlaydi

1. **Me'yor jadvali** (mudira) — SanQvaN №0016-21 dagi 1-7 yoshgacha bola uchun kunlik me'yor (24 ta mahsulot) oldindan kiritilgan. Guruch kabi aniq mahsulotni alohida kuzatish uchun shu yerda yangi qator qo'shiladi.
2. **Filiallar** (mudira) — har bir filial uchun bolalar soni kiritiladi.
3. **Ombor** — kelgan mahsulot (nomi, kg yoki qop soni, sana) kiritiladi. Tizim avtomatik hisoblaydi:
   `kunlik sarf = me'yor × bolalar soni`, `necha kunga yetadi = kelgan miqdor ÷ kunlik sarf`.
   Natija: necha kunga yetishi, tugash sanasi va holat belgisi (yashil/sariq/qizil).

**Muhim cheklov:** bu hisob-kitob rasman ruxsat etilgan kunlik me'yorga asoslangan taxmin, aniq retsept ingredientlariga bog'lanmagan. Retsept moduli qo'shilgandan keyin haqiqiy sarf undan hisoblanishi mumkin — buni keyingi bosqichda ko'rib chiqamiz.

## Keyingi bosqichlar (TZ'dagi boshqa modullar)

Poydevor (auth + rollar: Mudira, Povor, Tarbiyachi, Ota-ona) shu loyihada tayyor — quyidagilarni shu asosga ustma-ust qurish mumkin:

- Retseptlar moduli (PDF yuklash, 10 kunlik menyu, QR tasdiqlash)
- Haftalik mashg'ulotlar moduli (Tarbiyachi roli)
- Ota-onalar bilan aloqa moduli (Ota-ona roli)
- Oylik hisobotlar (PDF/Excel eksport)

Hozircha Tarbiyachi va Ota-ona rollari tizimga kira oladi, lekin "Tez orada" sahifasini ko'radi.

## Texnik eslatmalar

- Baza: SQLite (`backend/dev.db`) — ishlab chiqarishga o'tishda PostgreSQL'ga oson ko'chiriladi (`schema.prisma`dagi `datasource` qatorini o'zgartirish kifoya).
- Autentifikatsiya: JWT (7 kunlik amal muddati).
- Hali hech qayerga deploy qilinmagan — bulutga chiqarish kerak bo'lganda (Railway/Render/VPS) buni birga hal qilamiz.
