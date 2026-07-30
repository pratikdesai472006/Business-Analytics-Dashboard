# Business Analytics Dashboard

A fully serverless MERN Business Analytics Dashboard application hosted on **Vercel** with **MongoDB Atlas**.

## Architecture Overview

- **Frontend**: React 19 + Vite SPA (served by Vercel Edge CDN)
- **Backend API**: Vercel Serverless Functions (`/api/*`)
- **Database**: MongoDB Atlas (with cached connection pooling optimized for serverless)
- **Authentication**: JWT Authentication (Serverless protected endpoints)
- **Automated Tasks**: Vercel Cron Jobs (`/api/cron/reminders`)
- **Hosting**: 100% Vercel (No Express server, no `server.js`, no Render required)

---

## Folder Structure

```
├── api/                        # Vercel Serverless Functions
│   ├── auth/
│   │   ├── login.js            # POST /api/auth/login
│   │   ├── register.js         # POST /api/auth/register
│   │   └── me.js               # GET /api/auth/me
│   ├── datasets/
│   │   ├── index.js            # GET /api/datasets
│   │   ├── active.js           # GET /api/datasets/active
│   │   ├── upload.js           # POST /api/datasets/upload (Busboy CSV parser)
│   │   ├── manual.js           # POST /api/datasets/manual
│   │   ├── active/
│   │   │   └── analytics.js    # GET /api/datasets/active/analytics
│   │   └── [id]/
│   │       ├── activate.js     # PATCH /api/datasets/:id/activate
│   │       ├── rename.js       # PATCH /api/datasets/:id/rename
│   │       ├── index.js        # DELETE /api/datasets/:id
│   │       ├── rows.js         # GET /api/datasets/:id/rows
│   │       ├── file.js         # GET /api/datasets/:id/file
│   │       └── export.js       # GET /api/datasets/:id/export
│   ├── orders/
│   │   ├── index.js            # GET/POST /api/orders
│   │   └── [id]/
│   │       ├── status.js       # PATCH /api/orders/:id/status
│   │       └── receipt.js      # GET /api/orders/:id/receipt (PDF generation)
│   ├── cron/
│   │   └── reminders.js        # Vercel Cron daily email reminders
│   └── health.js               # GET /api/health
├── lib/
│   ├── mongodb.js              # Serverless MongoDB cached connection pool
│   └── auth.js                 # Serverless JWT verification & protect wrapper
├── models/                     # Mongoose Models (User, Dataset, DatasetRow, Order)
├── services/                   # Business Services (auth, dataset, payment, reminder)
├── utils/                      # Utilities (analyticsEngine, generateToken, parseCsv)
├── src/                        # React Frontend (Vite)
├── public/                     # Static assets (Favicon, SVG icons)
├── vercel.json                 # Vercel routing & Cron configuration
└── package.json                # Project dependencies
```

---

## Environment Variables Needed in Vercel

Set these in **Vercel Dashboard → Project Settings → Environment Variables**:

| Variable | Required | Description |
|---|---|---|
| `MONGODB_URI` | Yes | MongoDB Atlas connection string |
| `JWT_SECRET` | Yes | Secret key for signing JWT tokens |
| `SMTP_HOST` | Optional | SMTP host for email reminders (e.g. `smtp.gmail.com`) |
| `SMTP_PORT` | Optional | SMTP port (e.g. `587`) |
| `SMTP_SECURE` | Optional | Set to `true` for port 465, `false` for 587 |
| `SMTP_USER` | Optional | SMTP username / email address |
| `SMTP_PASS` | Optional | SMTP password / app password |
| `MAIL_FROM` | Optional | Sender display name and email |
| `CRON_SECRET` | Optional | Optional secret token for Vercel Cron header |

---

## Local Development

```bash
# 1. Install dependencies
npm install

# 2. Run local development server with Vercel CLI (or Vite)
npx vercel dev
# or
npm run dev
```

---

## Deployment to Vercel

1. Push this repository to GitHub / GitLab / Bitbucket.
2. Import project into Vercel.
3. Configure the environment variables (`MONGODB_URI`, `JWT_SECRET`, etc.).
4. Click **Deploy**. Vercel will automatically build the React frontend with Vite and deploy all `/api` functions as serverless endpoints.
