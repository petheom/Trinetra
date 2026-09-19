# TriNetra Enterprise Backend API (Node.js / Express / MongoDB)

Production-ready backend for the **TriNetra Ministry of Legal Metrology Enforcement Portal**.

## Core Features Implemented in Step 1
1. **Authentication & Authorization:**
   - Hashed password storage using `bcryptjs` with salt rounds.
   - JWT tokens embedded with Officer `id`, `role`, `region`, `name`, and `badgeId`.
   - Role-Based Access Control (`Admin` vs `Field Officer`).
2. **MongoDB Schemas (Mongoose):**
   - **`User` Model:** Complete schema for field inspectors and command directors (`name`, `badgeId`, `password`, `role`, `region`).
   - **`Report` Model:** Inspection dossier records strictly validated against the *Legal Metrology (Packaged Commodities) Rules, 2011* (`officerId`, `region`, `extractedText`, `missingFields`, `verdict`, `pdfDocumentUrl`).
3. **RBAC Middleware:**
   - `protect`: Verifies `Bearer <JWT_TOKEN>` from `Authorization` header and attaches `req.user`.
   - `adminOnly`: Restricts administrative routes to users with `role: 'Admin'`.
   - `authorizeRoles(...roles)`: Flexible multi-role authorization guard.

---

## API Endpoints

### Auth (`/api/auth`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Public | Register a new Field Officer or Admin account |
| `POST` | `/api/auth/login` | Public | Authenticate credentials and receive secure JWT token |
| `GET` | `/api/auth/me` | Protected | Retrieve active logged-in officer profile |
| `GET` | `/api/auth/admin-check` | Admin Only | Test endpoint verifying strict RBAC access control |

---

## Getting Started

### 1. Environment Setup
Create a `.env` file in the root of `trinetra-backend`:
```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://127.0.0.1:27017/trinetra
JWT_SECRET=trinetra_enterprise_super_secret_jwt_key_2026_metrology_secure
JWT_EXPIRE=7d
CLIENT_URL=http://localhost:5173
```

### 2. Start the Server
```bash
# Start in development mode (with auto-reloading via node --watch)
npm run dev

# Start in production mode
npm start
```
