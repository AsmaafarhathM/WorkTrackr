# WorkTrackr — Real-Time Client Project Dashboard

A production-grade, full-stack internal client project management dashboard featuring strict role-based access control (Admin, Project Manager, Developer), real-time WebSocket activity feeds with server-side authorization filtering, live presence tracking, persistent database notifications, scheduled background overdue-task processing, URL-driven query filtering, and role-specific dashboards.

---

## 1. Project Overview

WorkTrackr enables enterprise engineering organizations and agencies to orchestrate client projects, manage high-velocity work orders, and maintain real-time situational awareness. The system strictly separates concerns across three core personas:

- **Admin (`ADMIN`)**: Complete global visibility over all clients, projects, tasks, online team members, and real-time audit logs.
- **Project Manager (`PROJECT_MANAGER`)**: Scoped access strictly to projects they created, client relationships, task assignments, and review notifications. PM1 cannot view or modify PM2's projects.
- **Developer (`DEVELOPER`)**: Scoped access strictly to tasks assigned to them, with capabilities to transition status (e.g., `TODO` → `IN_PROGRESS` → `IN_REVIEW`), triggering real-time project manager alerts.

---

## 2. Technology Stack

### Frontend
- **Framework**: React 18 + TypeScript + Vite
- **Styling**: Tailored Modern Vanilla CSS Design System with dark glassmorphism, glowing status badges, and responsive layouts
- **Routing**: React Router v6 (declarative protected layout & URL search parameter synchronization)
- **Networking**: Axios with automatic request interception and silent 401 refresh rotation
- **Real-Time Client**: Socket.IO Client (v4)
- **Icons**: Lucide React
- **Date Utilities**: Date-fns

### Backend
- **Runtime**: Node.js (v20+ / v22)
- **Framework**: Express + TypeScript
- **Database**: PostgreSQL 16 (running via Docker)
- **ORM**: Prisma ORM (v5)
- **Real-Time Engine**: Socket.IO (v4) with JWT handshake authentication
- **Background Scheduler**: node-cron (v3)
- **Security & Auth**: JSON Web Tokens (Access + Refresh tokens), bcryptjs password hashing, cookie-parser
- **Validation**: Zod (100% server-side validation on body, query, and params)

---

## 3. Architecture & Data Flow

WorkTrackr adheres to a clean layered architecture:

```
[ React + TypeScript Client ]
       |
       |-- HTTP REST (Bearer Access Token + HttpOnly Refresh Cookie)
       |-- WebSockets (Socket.IO with JWT Handshake Auth)
       v
[ Express Routes ]
       v
[ Middleware Pipeline ]
   ├─ Auth Middleware (Verifies Bearer JWT, populates req.user)
   ├─ RBAC Middleware (Enforces role: ADMIN, PROJECT_MANAGER, DEVELOPER)
   ├─ Ownership Middleware (Validates resource ownership / assignments)
   ├─ Validation Middleware (Zod schema parser)
   └─ Centralized Error Handler (Transforms errors into structured JSON)
       v
[ Controllers ] (Request parsing, status code handling)
       v
[ Services ] (Business logic, transactions, notification rules)
       ├─ Emits to SocketServer (Targeted to authorized rooms only)
       └─ Calls Prisma Client
       v
[ PostgreSQL 16 Database ]
```

---

## 4. Local Setup Guide

### Prerequisites
- Node.js v18+ or v22+
- npm v9+ or v10+
- Docker & Docker Compose (or a local PostgreSQL instance)

### 1. Clone & Navigate
```bash
git clone <repository-url>
cd WorkTrackr
```

### 2. Start PostgreSQL via Docker Compose
```bash
docker compose up -d
```
*Note: PostgreSQL runs in a lightweight Alpine container mapped to port `5435` to avoid collisions with any local PostgreSQL services.*

### 3. Backend Setup
```bash
cd server

# Install dependencies
npm install

# Push Prisma schema to PostgreSQL & generate client
npm run prisma:push

# Seed the database with sample users, projects, tasks, and activities
npm run prisma:seed

# Start the backend development server
npm run dev
```
Backend API will be running at `http://localhost:5000`.

### 4. Frontend Setup
In a new terminal window:
```bash
cd client

# Install dependencies
npm install

# Start the Vite development server
npm run dev
```
Frontend will be accessible at `http://localhost:5173`.

---

## 5. Environment Variables

### Backend (`server/.env`)
| Variable | Description | Default / Example |
| :--- | :--- | :--- |
| `PORT` | Express HTTP & WebSocket port | `5000` |
| `NODE_ENV` | Application environment mode | `development` |
| `CLIENT_URL` | Allowed CORS frontend origin | `http://localhost:5173` |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://worktrackr:worktrackr_password@localhost:5435/worktrackr_db?schema=public` |
| `JWT_ACCESS_SECRET` | Secret for signing short-lived access tokens | `<secure-string>` |
| `JWT_REFRESH_SECRET` | Secret for signing long-lived refresh tokens | `<secure-string>` |
| `JWT_ACCESS_EXPIRATION` | Access token lifespan | `15m` |
| `JWT_REFRESH_EXPIRATION` | Refresh token lifespan | `7d` |
| `COOKIE_SECURE` | Set to true in production HTTPS | `false` |

---

## 6. Seed Data & Test Credentials

The database seed provides a complete, realistic dataset for immediate evaluation:

| Role | Name | Email | Password | Scope |
| :--- | :--- | :--- | :--- | :--- |
| **ADMIN** | Arthur Admin | `admin@worktrackr.io` | `Password123!` | Global access to all projects, clients, and activity |
| **PM 1** | Sarah Jenkins | `pm.sarah@worktrackr.io` | `Password123!` | Owns *Fintech Cloud Migration* & *OmniChannel Streaming Hub* |
| **PM 2** | Marcus Vance | `pm.marcus@worktrackr.io` | `Password123!` | Owns *Automated Logistics Platform* |
| **DEVELOPER 1** | Alex Rivera | `dev.alex@worktrackr.io` | `Password123!` | Assigned tasks in Project Alpha & Beta |
| **DEVELOPER 2** | Ravi Patel | `dev.ravi@worktrackr.io` | `Password123!` | Assigned tasks in Project Alpha & Gamma |
| **DEVELOPER 3** | Elena Rostova | `dev.elena@worktrackr.io` | `Password123!` | Assigned tasks across projects |
| **DEVELOPER 4** | Priya Sharma | `dev.priya@worktrackr.io` | `Password123!` | Assigned tasks across projects |

*Tip: The login screen contains 1-click **Quick Test Login** pills to instantly sign in as any role.*

---

## 7. Database Relationships & Indexing Strategy

### Entities
1. **User**: Represents internal team members (`ADMIN`, `PROJECT_MANAGER`, `DEVELOPER`).
2. **Client**: Corporate organizations requesting client projects.
3. **Project**: Created by PM or Admin; linked to one Client (`1:N` Client to Projects).
4. **Task**: Work orders belonging to a Project (`1:N` Project to Tasks), optionally assigned to one Developer (`1:N` User to Tasks).
5. **ActivityLog**: Persistent audit trail created on status transitions and task events.
6. **Notification**: Persistent in-app alerts with read/unread status.
7. **RefreshToken**: Database-backed refresh tokens enabling rotation and instant revocation.

### Indexing Decisions
- `User(email)`: Unique B-tree index for instantaneous credential lookups.
- `Project(ownerId, clientId)`: Foreign key indexes ensuring `O(log N)` ownership validation.
- `Task(projectId, assignedToId)`: Essential for role-scoped task queries.
- `Task(status, priority, dueDate, isOverdue)`: Composite and single-column indexes backing URL filter queries (`/tasks?status=...&priority=...`).
- `ActivityLog(projectId, taskId, createdAt)`: Indexed for descending time queries and 20-event recovery queries.
- `Notification(userId, isRead, createdAt)`: Indexed for low-latency unread badge counts (`COUNT(*) WHERE userId = ? AND isRead = false`).

---

## 8. Architectural Justifications

### WebSocket Choice: Socket.IO
- **Why Socket.IO over raw WebSockets:** Socket.IO provides built-in room abstractions (`socket.join`), automatic reconnection handling, HTTP long-polling fallback, and per-connection handshake authentication middleware. This allows creating dynamic authorization boundaries (`admin-room`, `user:${userId}`, `project:${projectId}`) seamlessly.

### Background Job Scheduler: node-cron
- **Why node-cron:** `node-cron` runs in-process with zero external infrastructure overhead (no Redis dependency required for lightweight task scanning). The scheduler runs once per minute (`* * * * *`), identifying tasks where `status != 'DONE' AND dueDate < NOW() AND isOverdue == false`, updates them transactionally, logs activity records, and emits alerts.

### Authentication & Token Storage Approach
- **Access Tokens:** Short-lived (15 minutes), kept in client memory (React state / Axios headers). Never stored in `localStorage` to eliminate XSS token theft.
- **Refresh Tokens:** Long-lived (7 days), stored in an `HttpOnly`, `SameSite=lax` cookie with path `/`. Inaccessible to JavaScript. Stored in the database `RefreshToken` table to support automatic token rotation and instant revocation upon logout.

---

## 9. Handling of Missed Events & Presence

### 20-Event Missed Recovery
When a client reconnects after network disruption or socket disconnection, the application executes a database query (`GET /api/activity/recent` or socket `activity:request_recent`). The server queries PostgreSQL directly:
- **Admin**: latest 20 activities globally.
- **Project Manager**: latest 20 activities for projects they own (`project.ownerId = userId`).
- **Developer**: latest 20 activities for tasks assigned to them (`task.assignedToId = userId`).
No in-memory cache is used as the source of truth.

### Multi-Tab Presence Tracking
The server maintains a thread-safe `PresenceManager` mapping `userId -> Set<socketId>`. When a user opens 3 browser tabs, they have 3 active sockets, but the system calculates `userSockets.size` to track distinct active human users. When all tabs close, the user transitions to offline, and an updated count is broadcast to Admins in real time.

---

## 10. URL-Driven Filtering Specification

Task lists support composite URL query parameters parsed by the backend:
- Status: `/tasks?status=IN_PROGRESS`
- Priority: `/tasks?priority=HIGH`
- Composite: `/tasks?status=TODO&priority=HIGH`
- Date Range: `/tasks?dueFrom=2026-09-01T00:00:00Z&dueTo=2026-09-30T23:59:59Z`
- Overdue: `/tasks?isOverdue=true`

All filtering is executed via Prisma `WHERE` conditions in PostgreSQL, never on the client.

---

## 11. Deployment (Vercel & Cloud)

### Frontend Deployment on Vercel
1. In the Vercel Dashboard, import the repository and set the root directory to `client`.
2. Configure Environment Variable:
   - `VITE_API_URL`: Your deployed backend URL (e.g., `https://api.worktrackr.io`).
3. Deploy. The `vercel.json` rewrite configuration handles Single Page Application routing:
   ```json
   {
     "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
   }
   ```

### Backend Deployment
Deploy the backend on Render, Railway, or AWS ECS with a managed PostgreSQL instance:
1. Set environment variables (`DATABASE_URL`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `CLIENT_URL`, `COOKIE_SECURE=true`).
2. Build command: `npm run build && npx prisma db push`.
3. Start command: `npm run start`.

---

## 12. Assessment Reflection (150–250 Words)

> **Mandatory Reflection**
>
> The most challenging problem in building WorkTrackr was ensuring that real-time WebSocket events maintained the exact same zero-trust authorization guarantees as the REST API without leaking sensitive client data across role boundaries. In typical implementations, developers either broadcast globally and filter on the frontend (creating critical security vulnerabilities) or overcomplicate with fragmented socket channels. 
> 
> To solve this, I designed a multi-tiered server-side room routing model combined with JWT handshake authentication. Upon connection, the socket server verifies the user's role and automatically joins them to their personal room (`user:${userId}`) and authorized project rooms. When a developer changes a task status, the backend executes a transactional database update, generates an activity record, and emits the event strictly to `admin-room`, the project manager's room (`user:${projectOwnerId}`), and the assigned developer's room (`user:${assignedToId}`). Unrelated project managers and other developers never receive the socket packet at the network layer.
>
> If I were to approach this differently in an enterprise scale deployment with horizontal scaling across multiple Node.js instances, I would replace the in-memory presence map and socket adapter with Redis Streams and the `@socket.io/redis-adapter`. This would enable distributed socket fan-out and persistent pub/sub across server replicas while offloading background cron jobs to BullMQ workers.
