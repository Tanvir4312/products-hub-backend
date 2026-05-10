# Products Hub — Backend

A robust REST API for the Products Hub platform — built with Express 5, Prisma, PostgreSQL, and TypeScript. Supports product discovery, voting, user roles, subscriptions, and AI-powered features.

## About The Project

In today's AI-driven world, thousands of products — especially AI tools — are scattered across the internet. Finding the right tool at the right time is nearly impossible for most people.

**Products Hub** solves this problem by bringing everything into one place. It is a community-driven product discovery platform where users can explore, share, and upvote the best products available on the internet — with direct links to their official websites.

Whether you are a developer, a startup founder, or someone who simply works with AI tools every day — Products Hub gives you a single destination to discover what's trending, what's useful, and what's new.

**Key highlights:**
- Users can add any product (especially AI tools) with a link to the original website
- Browse and discover products across categories — all in one platform
- Upvote your favorites to help others find the best tools
- Affordable subscription to access **Featured Products** — handpicked top tools
- Affordable subscription to **publish your own product** and reach a wider audience
- Built for everyone — from AI enthusiasts to everyday users

---

A robust REST API for the Products Hub platform — built with Express 5, Prisma, PostgreSQL, and TypeScript. Supports product discovery, voting, user roles, subscriptions, and AI-powered features.

## 🔗 Links

- 🌐 **Live Website:** [Products Hunt](https://products-hunt-frontend.vercel.app)
- 🖥️ **Frontend:** [Products Hunt Client](https://github.com/Tanvir4312/products-hub-client)


---

## Tech Stack

| Category | Technology |
|---|---|
| Runtime | Node.js |
| Framework | Express 5 |
| Language | TypeScript |
| Package Manager | pnpm |
| ORM | Prisma 7 |
| Database | PostgreSQL |
| Caching | Redis (Upstash via ioredis) |
| Auth | Better Auth, JWT, bcrypt |
| AI Provider | Groq (@ai-sdk/groq) |
| File Upload | Cloudinary, Multer |
| Email | Nodemailer, EJS templates |
| Payments | Stripe |
| Logging | Winston |
| Rate Limiting | express-rate-limit |
| Validation | Zod |
| PDF Generation | PDFKit |
| Task Scheduling | node-cron |

---

## Key Features

### 1. Rate Limiting
Protects the server from API abuse and brute force attacks.
- **Auth routes** (`/api/auth`): Max **10 requests** per IP per minute
- **Global routes**: Max **100 requests** per IP per minute
- Returns `429 Too Many Requests` when the limit is exceeded

---

### 2. Logging (Winston)
Automatically logs all incoming HTTP requests and server errors.
- Tracks **method, url, status, duration, ip, and userAgent** for every request
- Errors are stored separately in `logs/error.log`
- All logs are available in `logs/combined.log`

---

### 3. Redis Caching (Upstash)
Reduces database load and improves response times using Redis.
- On the first request, data is fetched from the database and stored in Redis
- Subsequent requests are served directly from cache — no database hit
- Cache TTL: **60–120 seconds** (auto-expires)
- Cache is automatically invalidated when data is updated

---

### 4. Authentication & Authorization
Secure auth system with role-based access control.
- JWT-based authentication with HTTP-only cookies
- Google OAuth via Better Auth
- 4 user roles: **Guest, User, Moderator, Admin/Super Admin**
- Protected routes with role-based middleware

---

### 5. AI-Powered Chat Assistant
Context-aware chatbot powered by Groq (LLaMA 3.3 70B).
- Answers questions about products and platform
- Maintains conversation context
- Endpoint: `POST /api/v1/chat`

---

### 6. File Upload (Cloudinary)
Handles product image uploads via Cloudinary.
- Multer processes multipart form data
- Images stored and served via Cloudinary CDN
- Automatic image optimization


---

### 7. Scheduled Tasks (node-cron)
Runs background jobs on a schedule.
- Auto-expires featured products
- Cleans up old logs periodically

---

## Project Structure

```
src/
├── app/
│   ├── modules/
│   │   ├── auth/              # Auth routes & controllers
│   │   ├── product/           # Product CRUD, voting, featured
│   │   ├── user/              # User management
│   │   ├── tag/               # Tag management
│   │   ├── review/            # Product reviews
│   │   ├── report/            # Product reports
│   │   ├── coupon/            # Coupon management
│   │   ├── subscription/      # Stripe subscriptions
│   │   └── chat/              # AI chat assistant
│   ├── middlewares/
│   │   ├── auth.middleware.ts  # JWT verification
│   │   ├── rateLimiter.ts      # Rate limiting config
│   │   └── errorHandler.ts     # Global error handler
│   ├── utils/
│   │   ├── logger.ts           # Winston logger
│   │   ├── redis.ts            # Redis/Upstash client
│   │   ├── sendEmail.ts        # Nodemailer helper
│   │   └── seed.ts             # Admin seeder
│   └── scripts/
│       └── seed-ai.ts          # AI data seeder
├── generated/                  # Prisma generated client
└── server.ts                   # App entry point
```

---

## Getting Started

### Prerequisites
- Node.js 18+
- pnpm installed
- PostgreSQL database
- Redis instance (Upstash recommended)
- Cloudinary account
- Stripe account
- Groq API key

### Installation

```bash
# Clone the repository
git clone <repo-url>
cd products-hub-backend

# Install dependencies
pnpm install
```

### Environment Variables

Create a `.env` file in the root:

```env
# Database
DATABASE_URL=your_postgresql_url

# JWT
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=7d

# Redis (Upstash)
UPSTASH_REDIS_URL=your_redis_url
UPSTASH_REDIS_TOKEN=your_redis_token

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Email
SMTP_HOST=your_smtp_host
SMTP_PORT=587
SMTP_USER=your_email
SMTP_PASS=your_password

# Stripe
STRIPE_SECRET_KEY=your_stripe_secret
STRIPE_WEBHOOK_SECRET=your_webhook_secret

# Groq AI
GROQ_API_KEY=your_groq_api_key

# App
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:3000
```

### Database Setup

```bash
# Run migrations
pnpm migrate

# Generate Prisma client
pnpm generate

# Seed admin user
pnpm seed:admin
```

### Running Locally

```bash
pnpm dev
```

Server runs on `http://localhost:5000`

### Build for Production

```bash
pnpm build
pnpm start
```

---

## API Endpoints

### Auth
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/sign-up` | Register new user |
| POST | `/api/auth/sign-in` | Login |
| POST | `/api/auth/sign-out` | Logout |
| GET | `/api/auth/google` | Google OAuth |

### Products
| Method | Endpoint | Description | Access |
|---|---|---|---|
| GET | `/api/v1/products` | Get all products | Public |
| GET | `/api/v1/products/:id` | Get single product | Public |
| POST | `/api/v1/products` | Submit new product | User |
| PATCH | `/api/v1/products/:id` | Update product | Owner |
| DELETE | `/api/v1/products/:id` | Delete product | Admin |
| GET | `/api/v1/products/upvoted` | Get user's upvoted products | User |
| GET | `/api/v1/products/featured` | Get featured products | Public |
| GET | `/api/v1/products/most-voted` | Get most voted products | Public |

### Voting
| Method | Endpoint | Description | Access |
|---|---|---|---|
| POST | `/api/v1/votes/:productId` | Toggle upvote | User |

### Tags
| Method | Endpoint | Description | Access |
|---|---|---|---|
| GET | `/api/v1/tags` | Get all tags | Public |
| POST | `/api/v1/tags` | Create tag | Admin |
| DELETE | `/api/v1/tags/:id` | Delete tag | Admin |

### AI
| Method | Endpoint | Description | Access |
|---|---|---|---|
| POST | `/api/v1/chat` | AI chat assistant | User |

### Admin
| Method | Endpoint | Description | Access |
|---|---|---|---|
| GET | `/api/v1/admin/stats` | Dashboard stats | Admin |
| GET | `/api/v1/admin/users` | All users | Admin |
| PATCH | `/api/v1/admin/users/:id/role` | Update user role | Admin |

---

## User Roles

| Role | Access |
|---|---|
| Guest | Browse products, view details |
| User | Upvote, submit products, manage profile, subscribe |
| Moderator | Review & approve submitted products, manage reports |
| Admin / Super Admin | Full access — users, tags, coupons, reports, stats |

---

## Deployment

Deployed on **Vercel**.

- 🌐 **Frontend:** [Visit Products Hub](https://your-frontend-url.vercel.app)

The build process:
1. `prisma generate` — generates the Prisma client
2. `tsup` — compiles TypeScript to JavaScript
3. `ncp` — copies generated Prisma files to dist

```bash
pnpm build
pnpm start
```
