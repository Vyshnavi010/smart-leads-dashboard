# Smart Leads Dashboard

A full-stack, real-time Lead Management Dashboard built using the MERN stack with strict TypeScript typing, role-based access control, advanced combinable filters, backend pagination, debounced search, CSV export, dark mode, and dockerized setups.

---

## 🚀 Features

### 1. Authentication System
* **Secure Flow**: JSON Web Token (JWT) based authentication.
* **Security**: Password hashing using `bcryptjs`.
* **Middlewares**: Secure routes on both client (React Router guards) and server (Express JWT validation middleware).

### 2. Leads Management (CRUD)
* **Lead Fields**: `Name`, `Email`, `Status` (New, Contacted, Qualified, Lost), `Source` (Website, Instagram, Referral), and auto-timestamps.
* **Full CRUD**: Add, edit, view detail cards, and delete leads.

### 3. Advanced Filtering & Search
* **Combinable Options**: Simultaneously filter by **Status** and **Source** while performing text searches.
* **Search Fields**: Matches against `Name` or `Email` (case-insensitive).
* **Sorting**: Quick toggles to sort by `Latest` or `Oldest` records.
* **Debounced Inputs**: Automatically debounces keyboard inputs on search to reduce network overhead.

### 4. Backend Pagination
* Paginated at the database layer (using MongoDB `skip` and `limit`) with a size limit of **10 records per page**.
* Returns pagination metadata (`totalRecords`, `currentPage`, `totalPages`, `hasNextPage`, `hasPrevPage`).

### 5. Role-Based Access Control (RBAC)
* Supports **Admin** and **Sales User** roles.
* **Deletes Restricted**: Only **Admin** users can delete lead records (enforced at both UI layout layer and backend route controller).

### 6. CSV Export
* Exports current search/filter queries to a standard CSV file directly from the database query.

### 7. Dark Mode Support (Bonus Feature)
* Cohesive dark theme togglable at the dashboard header.

---

## 📁 Folder Structure

```
c:\Myportfolio\
├── backend\               # Node.js + Express + TypeScript
│   ├── src\
│   │   ├── config\        # Configuration variables
│   │   ├── controllers\   # Request handlers (auth, leads)
│   │   ├── middleware\    # Authentication and role guards
│   │   ├── models\        # Mongoose schemas (User, Lead)
│   │   ├── routes\        # Express routing definitions
│   │   ├── types\         # Custom Express typings
│   │   ├── utils\         # Password helper & CSV helpers
│   │   ├── app.ts         # Express config
│   │   └── server.ts      # Server entry listener
│   ├── tsconfig.json
│   ├── package.json
│   └── .env.example
│
├── frontend\              # React + Vite + TypeScript + TailwindCSS v4
│   ├── src\
│   │   ├── components\    # Reusable UI widgets
│   │   ├── context\       # Global state providers (Auth)
│   │   ├── hooks\         # useDebounce hooks
│   │   ├── pages\         # Full views (Login, Register, Dashboard)
│   │   ├── services\      # Axios client configuration
│   │   ├── types\         # Common interfaces
│   │   ├── App.tsx        # Main application router
│   │   └── index.css      # Core styles with Tailwind directive
│   ├── tsconfig.json
│   └── package.json
│
├── docker-compose.yml     # Monorepo container orchestrator
└── README.md              # Documentation
```

---

## 📦 Getting Started

You can run this project locally using either **Docker Compose** (recommended) or manual installation.

### Method 1: Using Docker Compose (Recommended)
1. Ensure you have [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed.
2. In the root directory (`c:\Myportfolio`), run:
   ```bash
   docker-compose up --build
   ```
3. Once running, access:
   * **Frontend**: `http://localhost:3000`
   * **Backend**: `http://localhost:5000`
   * **MongoDB**: Running internally on port `27017`

---

### Method 2: Local Installation

#### Prerequisites
* Node.js (v18+)
* MongoDB running locally (`mongodb://localhost:27017/`)

#### 1. Setup Backend
1. Open a terminal in the `backend/` folder.
2. Create your `.env` file (see `.env.example` as a template):
   ```env
   PORT=5000
   MONGODB_URI=mongodb://127.0.0.1:27017/smart-leads-db
   JWT_SECRET=super_secret_dev_key_for_smart_leads
   JWT_EXPIRES_IN=7d
   ```
3. Install dependencies and start the dev server:
   ```bash
   npm install
   npm run dev
   ```

#### 2. Setup Frontend
1. Open a terminal in the `frontend/` folder.
2. Install dependencies and start the Vite dev server:
   ```bash
   npm install
   npm run dev
   ```
3. Open `http://localhost:5173` (or the printed port) in your browser.

---

## 🛜 API Documentation

All routes prefix: `/api`

### 🔑 Authentication Routes
* **`POST /auth/register`**: Register a new user.
  * *Request Body*: `{ name, email, password, role: 'Admin' | 'Sales User' }`
* **`POST /auth/login`**: Sign in.
  * *Request Body*: `{ email, password }`
* **`GET /auth/profile`**: Get active profile (*Bearer Token required*).

### 📈 Leads Routes (*Bearer Token required*)
* **`GET /leads`**: Fetch list of leads (paginated, sorted, filtered, searchable).
  * *Query Params*: `page`, `limit`, `status`, `source`, `search`, `sortBy`
* **`POST /leads`**: Create new lead.
  * *Request Body*: `{ name, email, status, source }`
* **`GET /leads/:id`**: Get single lead.
* **`PUT /leads/:id`**: Update lead details.
* **`DELETE /leads/:id`**: Delete lead record (*Admin Only*).
* **`GET /leads/export/csv`**: Export lead list as CSV attachment.
