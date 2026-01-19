# ZocialOne Backend API

A Node.js + Express + Sequelize backend with PostgreSQL for managing user complaints, onboarding workflows, and notifications.

---

## Postman Quick Flow

1. `POST /auth/signup` → create user
2. `POST /auth/login` → copy token
3. `POST /complaints/raise-ticket` → create complaint
4. `PATCH /complaints/:id/status` → update status
5. `GET /complaints/:id/metrics` → view timings

---

## Scripts

```
npm run dev
npm start
```

---

A Node.js + Express + Sequelize backend with PostgreSQL for managing user complaints, onboarding workflows, and notifications.

---

## 📁 Project Structure

```
src/
├── config/
│   └── database.js          # Sequelize PostgreSQL connection
├── constants/
│   └── index.js             # Centralized constants (auth, statuses, stages)
├── controllers/
│   ├── authController.js    # Signup/Login logic
│   ├── complaintController.js # Complaint CRUD operations
│   └── userController.js    # User profile & onboarding
├── middleware/
│   └── auth.js              # JWT authentication middleware
├── models/
│   ├── User.js              # User model
│   ├── Complaint.js         # Complaint model with JSONB meta
│   ├── Notification.js      # Notification tracking
│   ├── OnboardingReminder.js # Onboarding reminder tracking
│   └── index.js             # Model associations
├── routes/
│   ├── auth.js              # /auth routes
│   ├── complaints.js        # /complaints routes
│   └── user.js              # /user routes
├── services/
│   ├── notificationService.js # Batch notification sending
│   └── onboardingCron.js    # Cron job for reminders
├── utils/
│   └── helpers.js           # Utility functions
├── validators/
│   └── complaintValidators.js # JSON schema validation
└── index.js                 # App entry point
```

---

## 🚀 Setup Steps

### Prerequisites
- Node.js v18+
- PostgreSQL 14+
- npm or yarn

### 1. Clone & Install Dependencies

```bash
git clone <repository-url>
cd Backend-Zocial
npm install
```

### 2. Create PostgreSQL Database

```sql
CREATE DATABASE zocial_db;
```

### 3. Configure Environment Variables

Create a `.env` file in the root directory:

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# Database Configuration
DATABASE_URL=postgres://username:password@localhost:5432/zocial_db

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_here_make_it_long_and_random
```

### 4. Start the Server

```bash
# Development (with auto-reload)
npm run dev

# Production
npm start
```

The server will automatically:
- Connect to PostgreSQL
- Sync all models (create tables)
- Start the onboarding cron job

---

## 🔧 Environment Variables

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `PORT` | No | Server port (default: 3000) | `3000` |
| `NODE_ENV` | No | Environment mode | `development` / `production` |
| `DATABASE_URL` | Yes | PostgreSQL connection string | `postgres://user:pass@localhost:5432/zocial_db` |
| `JWT_SECRET` | Yes | Secret key for JWT signing | `my_super_secret_key_123` |

---

## 🗄️ Database Structure

### Entity Relationship Diagram

```
┌─────────────┐       ┌─────────────────┐
│    Users    │───┬──▶│   Complaints    │
└─────────────┘   │   └─────────────────┘
       │          │
       │          │   ┌─────────────────┐
       ├─────────┬──▶│  Notifications  │
       │          │   └─────────────────┘
       │          │
       │          │   ┌─────────────────────┐
       └─────────┴──▶│ OnboardingReminders │
                      └─────────────────────┘
```

### Tables

#### 1. `users`
Stores user account information.

| Column | Type | Description |
|--------|------|-------------|
| `id` | INTEGER (PK) | Auto-increment primary key |
| `name` | VARCHAR | User's full name |
| `email` | VARCHAR (unique) | User's email (lowercase) |
| `password` | VARCHAR | Bcrypt hashed password (salt: 12) |
| `onboarding_stage` | INTEGER | Current onboarding stage (0-3) |
| `onboarding_stage_updated_at` | TIMESTAMP | When stage was last updated |
| `created_at` | TIMESTAMP | Account creation time |
| `updated_at` | TIMESTAMP | Last update time |

#### 2. `complaints`
Stores user complaints with type-specific JSON data.

| Column | Type | Description |
|--------|------|-------------|
| `id` | INTEGER (PK) | Auto-increment primary key |
| `user_id` | INTEGER (FK) | Reference to users.id |
| `complaint_type` | ENUM | `live_demo`, `technical_issue`, `billing_issue`, `feedback` |
| `status` | ENUM | `raised`, `in_progress`, `waiting_on_user`, `resolved`, `closed` |
| `status_updated_at` | TIMESTAMP | When status was last changed |
| `meta` | JSONB | Complaint details (subject, description, priority) |
| `created_at` | TIMESTAMP | Complaint creation time |
| `updated_at` | TIMESTAMP | Last update time |

**Meta JSON Structure (Same for all complaint types):**

```javascript
{
  "subject": "App crashes on login",           
  "description": "Detailed description..."    
}
```

#### 3. `notifications`
Stores all sent notifications.

| Column | Type | Description |
|--------|------|-------------|
| `id` | INTEGER (PK) | Auto-increment primary key |
| `user_id` | INTEGER (FK) | Reference to users.id |
| `title` | VARCHAR | Notification title |
| `body` | TEXT | Notification body |
| `is_sent` | BOOLEAN | Whether notification was sent |
| `created_at` | TIMESTAMP | When notification was created |

#### 4. `onboarding_reminders`
Tracks which onboarding reminders have been sent to each user.

| Column | Type | Description |
|--------|------|-------------|
| `id` | INTEGER (PK) | Auto-increment primary key |
| `user_id` | INTEGER (FK) | Reference to users.id |
| `stage` | INTEGER | Onboarding stage (0, 1, 2) |
| `reminder_key` | VARCHAR | Reminder identifier (e.g., '24h', '3d', '5d') |
| `notification_count` | INTEGER | Number of notifications sent for this stage |
| `created_at` | TIMESTAMP | First reminder sent time |
| `updated_at` | TIMESTAMP | Last update time |

**Unique Constraint:** `(user_id, stage, reminder_key)` - Prevents duplicate reminders

---

## 📡 API Endpoints

### Authentication

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/auth/signup` | No | Register new user |
| POST | `/auth/login` | No | Login, returns JWT token |

### User

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/user/details` | Yes | Get user profile with complaint stats |
| PATCH | `/user/onboarding-stage` | Yes | Update onboarding stage (0-3) |

### Complaints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/complaints/schemas` | No | Get JSON schemas for complaint types |
| GET | `/complaints` | Yes | Get all user complaints (with filters) |
| POST | `/complaints/raise-ticket` | Yes | Create a new complaint |
| PATCH | `/complaints/:id/status` | Yes | Update complaint status |
| GET | `/complaints/:id/metrics` | Yes | Get time metrics for a complaint |

---

## 🔄 Status Transition Rules

Complaints follow a strict status flow. Backward transitions are blocked:

```
raised ──────────────────┐
   │                     │
   ▼                     ▼
in_progress ◄────► waiting_on_user
   │                     │
   └──────────┬──────────┘
              ▼
          resolved
              │
              ▼
           closed (Terminal - No further changes)
```

**Valid Transitions:**
| From | To |
|------|-----|
| `raised` | `in_progress`, `waiting_on_user` |
| `in_progress` | `waiting_on_user`, `resolved` |
| `waiting_on_user` | `in_progress`, `resolved` |
| `resolved` | `closed` |
| `closed` | ❌ (None - terminal state) |

---

## ⏰ Onboarding Cron Job

Runs every **5 minutes** and sends reminders based on how long a user has been stuck in a stage:

| Stage | Reminders Sent After | Max Notifications |
|-------|---------------------|-------------------|
| 0 (Initial Setup) | 24 hours, 3 days, 5 days | 3 |
| 1 (Profile Completion) | 12 hours, 24 hours | 2 |
| 2 (Final Steps) | 24 hours, 1 day, 3 days, 5 days | 4 |
| 3 (Complete) | No reminders | 0 |

**Features:**
- Each reminder is sent only once per user per stage
- Uses batch processing (100 notifications at a time)
- Processes users in batches of 50 to reduce DB load

---

## 🔒 Authentication

All protected routes require a JWT token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

**Token Details:**
- Algorithm: HS256
- Expiry: 7 days
- Payload: `{ userId: <user_id> }`

**Error Codes:**
| Code | Description |
|------|-------------|
| `TOKEN_MISSING` | No token provided |
| `TOKEN_INVALID` | Token is malformed |
| `TOKEN_EXPIRED` | Token has expired |

---

## 🧪 Testing with Postman

1. **Signup**: `POST /auth/signup`
2. **Login**: `POST /auth/login` → Copy the `token`
3. **Set Authorization**: Bearer Token in Postman
4. **Test APIs**: Use the token for all protected routes

---

## 📦 Dependencies

| Package | Purpose |
|---------|---------|
| `express` | Web framework |
| `sequelize` | ORM for PostgreSQL |
| `pg` / `pg-hstore` | PostgreSQL driver |
| `bcrypt` | Password hashing |
| `jsonwebtoken` | JWT authentication |
| `node-cron` | Scheduled tasks |
| `dotenv` | Environment variables |

---

## 🛠️ Scripts

```bash
npm run dev    # Start with auto-reload (development)
npm start      # Start production server
```

---

