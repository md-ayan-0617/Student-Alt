# CAMPUS CODING INTELLIGENCE
## College-Wide Programming Performance & Analytics Dashboard

**Campus Coding Intelligence (CCI)** is an institutional intelligence platform designed for universities and engineering colleges to track, compare, and analyze student programming performance, algorithmic consistency, competitive programming strength, and open-source developer activity across major platforms:

- **LeetCode**
- **GeeksforGeeks (GFG)**
- **CodeChef**
- **HackerRank**
- **GitHub**

---

## 🏛️ System Architecture

The platform separates student master records, platform handles, verified observations, and historical snapshots into a resilient relational architecture:

```
campus-coding-intelligence/
├── client/                     # Vite + React (JSX) + Tailwind CSS Frontend
│   ├── src/
│   │   ├── components/         # Reusable Cards, Charts, Layout, Modals
│   │   │   ├── cards/          # KpiCard, DifficultyCard
│   │   │   ├── charts/         # HistoricalTrendChart, PlatformDistributionChart
│   │   │   ├── layout/         # Sidebar, TopNav, DemoNoticeBanner, GlobalSearchModal
│   │   │   └── modals/         # DemoDataModal, StudentEditModal
│   │   ├── context/            # AppContext (Theme, Filters, Demo Mode, Toasts)
│   │   ├── pages/              # 18 Complete Analytics & Admin Pages
│   │   ├── services/           # Typed API Client (/api endpoints)
│   │   ├── index.css           # Custom Dark Navy & Cool Neutral Theme System
│   │   └── App.jsx             # React Router v6 Configuration
│   └── vite.config.js          # Vite config with Tailwind v4 & API proxy to :5000
│
├── server/                     # Node.js + Express.js API Server
│   ├── src/
│   │   ├── database/           # SQLite (better-sqlite3) with WAL Mode & Relational Schema
│   │   │   ├── schema.sql      # 10 Tables, Foreign Keys, Indexes
│   │   │   └── db.js           # Database Connection & Default Settings Manager
│   │   ├── integrations/       # Platform Connectors with Rate Limits & Fallbacks
│   │   │   ├── leetcodeAdapter.js    # Official GraphQL Public Stats Query
│   │   │   ├── gfgAdapter.js         # Public Profile Stats Connector
│   │   │   ├── codechefAdapter.js    # Public Handle API & Star Ratings
│   │   │   ├── hackerrankAdapter.js  # Authorized Profile & ELO Connector
│   │   │   ├── githubAdapter.js      # GitHub REST API v3 Repo & Language Aggregation
│   │   │   └── platformManager.js    # Multi-platform Sync & Completeness Scoring
│   │   ├── services/           # Core Business Logic & Repositories
│   │   │   ├── studentService.js     # Filtering, Search, Joins, CSV Export
│   │   │   ├── importService.js      # Flagship JSON Roster Validation & Preview
│   │   │   ├── analyticsService.js   # Institutional KPIs, Diff Ratios, 10 Leaderboards
│   │   │   └── seedService.js        # Calibrated 25-Student Dataset & Purge Engine
│   │   ├── routes/             # REST API Routes
│   │   │   ├── students.js     # /api/students
│   │   │   ├── analytics.js    # /api/analytics
│   │   │   ├── import.js       # /api/import
│   │   │   ├── platforms.js    # /api/platforms
│   │   │   └── settings.js     # /api/settings
│   │   └── index.js            # Express Server Entrypoint (:5000)
│
├── data/                       # Official Templates & Initial Datasets
│   ├── students_template.json  # Official College Schema JSON Template
│   └── sample_college_students.json # Calibrated 25-Student Demonstration Roster
└── package.json                # Root Concurrently runner scripts
```

---

## 🚀 Quick Start

### 1. Start Both Frontend & Backend Concurrently
From the root workspace directory:

```bash
npm run dev
```

- **Frontend Client:** [http://localhost:5173/](http://localhost:5173/)
- **Backend API:** [http://localhost:5000/api](http://localhost:5000/api)

Or run individually:
```bash
# Start backend only
npm run server

# Start frontend only
npm run client
```

---

## 📂 The JSON Student Import Specification

The college can upload or paste its student roster JSON file with the initial schema:

```json
[
  {
    "name": "Student Full Name",
    "leetcode_id": "leetcode_username",
    "gfg_id": "gfg_username",
    "codechef_id": "codechef_username"
  }
]
```

### Import Pipeline Guarantees:
1. **Schema Validation:** Checks for valid JSON array structure and mandatory student names.
2. **Missing Identifiers:** Handles optional or empty platform handles gracefully without errors.
3. **Preview & Conflict Resolution:** Compares uploaded records against existing database entries. Identifies:
   - Total records
   - Valid records
   - Malformed entries
   - Duplicate entries within the file
   - New students to be created
   - Existing student records to be updated
4. **Historical Continuity:** Updating an existing student's handles or academic information **never wipes** previously recorded historical snapshots.
5. **Additional Platforms:** Allows linking **GitHub** and **HackerRank** identifiers separately through the administrator interface or extended JSON fields.

---

## 📊 Core Features & Analytical Pages

| Section | Page Route | Description |
| :--- | :--- | :--- |
| **Overview** | `/` | Executive KPIs, Snapshot Trend Chart, Difficulty Distribution, Platform Adoption |
| **Student Directory** | `/students` | Multi-filter table (Branch, Batch, Platform, Min Solved), Search, Sorting, CSV Export |
| **Student Dossier** | `/students/:id` | Full student profile, 5 platform breakdowns, snapshot progression, handle editing |
| **Problem Solving** | `/problem-solving` | Algorithmic volume, Easy/Medium/Hard ratios, student tier distributions |
| **Consistency** | `/activity` | 30-day verified activity heatmap matrix, streak tracking, active days |
| **Rankings** | `/leaderboards` | 10 distinct leaderboards (Total Solved, Easy, Med, Hard, CP, Consistency, 30D Growth, GitHub) |
| **Skills & Topics** | `/skills` | 15 core DSA topics (Arrays, Trees, Graphs, DP, etc.) and practice recommendations |
| **Platform Comparison**| `/platforms` | Side-by-side connector comparisons without conflating incompatible metrics |
| **Dedicated Deep Dives**| `/platforms/:id` | Dedicated pages for LeetCode, GFG, CodeChef, HackerRank, and GitHub |
| **College Standing** | `/standing` | Growth index evaluated against internal baselines and verified competition partners |
| **Branch / Batch** | `/branches-batches` | Cross-departmental and graduation cohort performance matrices |
| **Longitudinal Trends**| `/trends` | Timestamped snapshot trend curves over 7d, 30d, 90d, and semester intervals |
| **Reports & Exports** | `/reports` | Printable institutional dossier, PDF layout, and live CSV data downloads |
| **JSON Roster Import**| `/import` | File upload, direct JSON paste, preview diffs, and template download |
| **Administration** | `/admin/students` | Manual student record additions, handle edits, and deletions |
| **Connectors & APIs** | `/integrations` | Platform adapter health, rate limits, and live sync execution |
| **Synchronization** | `/synchronization` | Trigger multi-platform background sync and inspect job execution logs |
| **Audit Trail** | `/audit` | Immutable audit log of administrative actions and compliance records |
| **Settings** | `/settings` | Institutional identity, Index weight sliders, and Demo data toggle/purge |

---

## ⚖️ Metric Integrity & Principles

- **Separation of Metrics:** LeetCode ratings, CodeChef stars, and GitHub contribution counts are never combined into arbitrary sums.
- **No Synthetic Zeroes:** A student with an unlinked or private profile is clearly marked as "Unlinked / Unverified", never assumed to have zero skill.
- **Snapshot Math:** Progress curves represent actual recorded timestamped snapshots, not artificially interpolated daily graphs from a single lifetime total.
- **Demo Mode Transparency:** When sample preview records are active, a prominent banner clearly indicates `DEMO DATA ACTIVE`. The administrator can purge the demo records and import their real college roster with a single click.
