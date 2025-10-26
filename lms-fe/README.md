# 🍃 LeaveXact - Leave Management System

> A modern, full-stack leave management application built with Next.js 15, React 19, TypeScript, and Express.js backend with MongoDB.

[![Next.js](https://img.shields.io/badge/Next.js-15.2.4-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-blue?style=flat-square&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Express](https://img.shields.io/badge/Express-5.1.0-green?style=flat-square&logo=express)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-8.19.1-green?style=flat-square&logo=mongodb)](https://www.mongodb.com/)

---

## 📁 Project Structure

### 🎨 Frontend (Next.js 15 + React 19)

```
/app                              Next.js App Router pages and API routes
├── /admin                       Admin dashboard and management pages
├── /employee                    Employee dashboard and leave requests
├── /login                       Login page
├── /register                    Registration page
├── /profile                     User profile management
├── /api                         API route handlers
├── error.tsx                    Error boundary
├── layout.tsx                   Root layout
├── loading.tsx                  Loading states
├── not-found.tsx                404 page
└── page.tsx                     Home page

/components                       React components
├── /layout                      Layout components (header, sidebar, navigation)
├── /ui                          Reusable UI components (Radix UI + shadcn/ui)
├── activity-log.tsx             Activity logging component
├── performance-monitor.tsx      Performance monitoring
├── session-expired-dialog.tsx   Session management
└── theme-provider.tsx           Dark/light theme provider

/hooks                            Custom React hooks
├── use-mobile.ts                Mobile detection hook
├── use-optimistic-updates.ts    Optimistic UI updates
├── use-optimized-api.ts         Optimized API calls
├── use-simple-api.ts            Simple API wrapper
├── use-toast.ts                 Toast notifications
└── useTokenRefresh.ts           JWT token refresh logic

/lib                              Utility libraries and helpers
├── /types                       TypeScript type definitions
├── api.ts                       Main API client
├── api-external.ts              External API integration
├── api-hybrid.ts                Hybrid API approach
├── api-optimized.ts             Optimized API client
├── auth.ts                      Authentication utilities
├── date-utils.ts                Date formatting and utilities
├── mockData.ts                  Mock data for development
├── proxy.ts                     API proxy configuration
└── utils.ts                     General utilities

/styles                           Global styles
└── globals.css                  Global CSS styles

/public                           Static assets
└── placeholder-*.png/svg/jpg    Placeholder images
```

### ⚙️ Backend (Express.js + MongoDB)

```
/server
├── index.js                     Express server entry point
├── package.json                 Backend dependencies
└── .env                         Backend environment variables
```

---

## 🛠️ Tech Stack

### Frontend

| Technology | Version | Purpose |
|------------|---------|---------|
| **Next.js** | 15.2.4 | App Router, Server Components, API Routes |
| **React** | 19 | UI Library with latest features |
| **TypeScript** | 5 | Type-safe development |
| **Tailwind CSS** | 4.1.9 | Utility-first CSS framework |
| **Radix UI** | Latest | Accessible component primitives |
| **shadcn/ui** | Latest | Beautiful component library |
| **React Hook Form** | Latest | Form management |
| **Zod** | 3.25.67 | Schema validation |
| **Axios** | Latest | HTTP client |
| **Recharts** | 2.15.4 | Data visualization |
| **Lucide React** | 0.454.0 | Icon library |
| **date-fns** | Latest | Date utilities |
| **Sonner** | 1.7.4 | Toast notifications |
| **next-themes** | 0.4.6 | Theme management |

### Backend

| Technology | Version | Purpose |
|------------|---------|---------|
| **Express.js** | 5.1.0 | Web framework |
| **MongoDB** | - | NoSQL database |
| **Mongoose** | 8.19.1 | MongoDB ODM |
| **JWT** | 9.0.2 | Authentication tokens |
| **bcryptjs** | 3.0.2 | Password hashing |
| **CORS** | Latest | Cross-origin resource sharing |
| **dotenv** | Latest | Environment variables |

### Styling & UI

- **Tailwind CSS** 4.1.9
- **PostCSS** 8.5
- **tailwindcss-animate**
- **class-variance-authority** (CVA)
- **clsx** + **tailwind-merge**

---

## 🚀 Getting Started

### Prerequisites

- ✅ Node.js 18+ installed
- ✅ MongoDB installed and running
- ✅ npm or yarn package manager

### 🔧 Backend Setup

1. **Navigate to server directory:**
   ```bash
   cd server
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment variables:**
   
   Create `.env` file in `/server` directory:
   ```env
   PORT=8000
   MONGODB_URI=mongodb://localhost:27017/leave-management
   JWT_SECRET=your-secret-key-change-this-in-production
   NODE_ENV=development
   ```

4. **Start the backend server:**
   ```bash
   node index.js
   ```
   🌐 Server runs on `http://localhost:8000`

### 🎨 Frontend Setup

1. **Navigate to root directory**

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment variables:**
   
   Copy `.env.example` to `.env`:
   ```env
   BACKEND_URL=http://localhost:8000
   ```

4. **Run development server:**
   ```bash
   npm run dev
   ```
   🌐 App runs on `http://localhost:3000`

5. **Build for production:**
   ```bash
   npm run build
   npm start
   ```

---

## 📜 Available Scripts

### Frontend

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server (`http://localhost:3000`) |
| `npm run build` | Build production bundle |
| `npm start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run report` | Generate project report |

### Backend

| Command | Description |
|---------|-------------|
| `node index.js` | Start Express server (`http://localhost:8000`) |

> **Note:** Run backend commands from `/server` directory

---

## ✨ Key Features

### 🔐 Authentication & Authorization

- ✅ User registration and login
- ✅ JWT-based authentication
- ✅ Token refresh mechanism
- ✅ Role-based access control (Admin/Employee)
- ✅ Session management with expiry handling
- ✅ Password hashing with bcryptjs

### 👥 User Management

- ✅ User profiles with avatar support
- ✅ Profile editing
- ✅ Activity logging
- ✅ Performance monitoring

### 📅 Leave Management

- ✅ Leave request submission
- ✅ Leave approval/rejection (Admin)
- ✅ Leave history tracking
- ✅ Leave balance management
- ✅ Calendar integration with react-day-picker

### 👨‍💼 Admin Features

- ✅ Dashboard with analytics
- ✅ User management
- ✅ Leave request management
- ✅ Activity monitoring
- ✅ Report generation (DOCX export)

### 🎨 UI/UX Features

- ✅ Dark/Light theme toggle
- ✅ Responsive design (mobile-first)
- ✅ Toast notifications
- ✅ Loading states
- ✅ Error boundaries
- ✅ Optimistic UI updates
- ✅ Accessible components (Radix UI)

### ⚡ Performance

- ✅ Server-side rendering (SSR)
- ✅ Static generation where possible
- ✅ Optimized API calls with caching
- ✅ Image optimization with Next.js Image
- ✅ Code splitting

---

## 🔌 API Endpoints

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/login` | User login |
| `POST` | `/api/auth/register` | User registration |
| `POST` | `/api/auth/refresh` | Refresh JWT token |
| `GET` | `/api/auth/profile` | Get user profile |

### Users (Admin Only)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/admin/employees` | Get all employees |
| `GET` | `/api/admin/employees/:id` | Get employee by ID |
| `POST` | `/api/admin/employees` | Create new employee |
| `PUT` | `/api/admin/employees/:id` | Update employee |
| `DELETE` | `/api/admin/employees/:id` | Delete employee |

### Leave Requests

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/leave/my-requests` | Get user's leave requests |
| `GET` | `/api/leave/all-requests` | Get all leave requests (Admin) |
| `POST` | `/api/leave/request` | Create leave request |
| `PUT` | `/api/leave/update-status/:id` | Update leave status (Admin) |

### Admin Dashboard

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/admin/dashboard-stats` | Get dashboard statistics |
| `GET` | `/api/logs` | Get audit logs |
| `DELETE` | `/api/logs/reset` | Reset audit logs |

---

## 🔐 Environment Variables

### Frontend (`.env`)

```env
BACKEND_URL=http://localhost:8000
```

### Backend (`server/.env`)

```env
PORT=8000
MONGODB_URI=mongodb://localhost:27017/leave-management
JWT_SECRET=your-secret-key-change-this-in-production
NODE_ENV=development
```

---

## 🚢 Deployment

### Frontend (Vercel)

1. Push code to GitHub
2. Connect repository to Vercel
3. Configure environment variables
4. Deploy automatically on push

### Backend (Railway/Render/Heroku)

1. Push server code to repository
2. Configure MongoDB Atlas connection
3. Set environment variables
4. Deploy backend service

---

## 📝 Development Notes

- Frontend uses **Next.js 15 App Router** (not Pages Router)
- **React Server Components** used where possible
- API routes in `/app/api` for backend proxy
- `middleware.ts` handles authentication checks
- Mock data available in `lib/mockData.ts` for development
- Multiple API client implementations (`api.ts`, `api-optimized.ts`, etc.)

---

## 🐛 Troubleshooting

### Port already in use

**Frontend:**
```bash
npm run dev -- -p 3001
```

**Backend:**
Change `PORT` in `server/.env`

### MongoDB connection issues

- ✅ Ensure MongoDB is running
- ✅ Check `MONGODB_URI` in `server/.env`
- ✅ Verify network connectivity

### CORS errors

- ✅ Check CORS configuration in `server/index.js`
- ✅ Verify `BACKEND_URL` matches backend URL (`http://localhost:8000`)

---

## 📄 License & Info

| | |
|---|---|
| **Version** | 0.1.0 |
| **Status** | Private |
| **License** | Not specified |

---

<div align="center">

**For support or questions, contact the development team.**

Made with ❤️ using Next.js, React, and Express

</div>
