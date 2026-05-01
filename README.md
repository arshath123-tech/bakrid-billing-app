# 🐐 Bakrid Billing Software

Complete goat sales billing system for Bakrid season.
**React JS frontend + Supabase (PostgreSQL) backend.**

---

## ⚡ Quick Setup

### Step 1 — Supabase Database

1. Go to [supabase.com](https://supabase.com) → Sign up → Create project
2. Go to **SQL Editor** → paste the contents of `supabase-setup.sql` → click **Run**

### Step 2 — Add Your Credentials

Open `src/lib/supabase.js` and fill in:

```js
const SUPABASE_URL      = "https://your-project.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJ...your-anon-key";
```

Get these from: **Supabase → Your Project → Settings → API**

### Step 3 — Install & Run

```bash
npm install
npm start
```

App opens at **http://localhost:3000**

---

## 🔐 Login

| Field    | Value        |
|----------|--------------|
| Username | `admin`      |
| Password | `bakrid2024` |

---

## 📁 Project Structure

```
bakrid-billing/
├── public/
│   └── index.html
├── src/
│   ├── lib/
│   │   └── supabase.js          ← Put your credentials here
│   ├── context/
│   │   └── BillsContext.jsx     ← All Supabase DB operations
│   ├── utils/
│   │   └── helpers.js           ← Calculations & formatters
│   ├── pages/
│   │   ├── LoginPage.jsx
│   │   ├── HomePage.jsx         ← Search + date folders
│   │   ├── SalesPage.jsx        ← Day & season sales
│   │   ├── BillFormPage.jsx     ← Create / Edit bill
│   │   └── BillViewPage.jsx     ← View & print bill
│   ├── components/
│   │   └── Navbar.jsx
│   ├── App.jsx
│   ├── App.css
│   ├── index.js
│   └── index.css
├── supabase-setup.sql            ← Run this in Supabase SQL Editor
└── package.json
```

---

## ✅ Features

- 🔐 Login system
- 📋 Bill creation with Small Goat (kg-based) + Big Goat (flat price)
- ₹/kg rate editable per row (default ₹500)
- 🔄 Goat In/Out tracking with token numbers
- 🏠 Maintenance charge
- 🔪 Cutting details
- 💰 Cash + GPay payment split with balance tracking
- 🧾 Tax invoice (2%) with printable bill (A3/A4/A5/A6/Receipt/Custom)
- 📊 Sales page — Day sales & Season sales with goat counts
- 🔍 Search bills by number or customer name
- ✏️ Edit & Delete bills anytime
- 🔢 Unique bill numbers — never reused after deletion
- ☁️ All data saved to Supabase — safe across devices & browser clears
- 📱 Mobile responsive
