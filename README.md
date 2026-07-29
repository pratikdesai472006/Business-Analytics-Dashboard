# Aperture Business Analytics Dashboard

A full-stack business dashboard for tracking revenue, orders, customers, payment status, reports, and forecasts.

## Features

- JWT authentication with protected routes
- Responsive analytics dashboard with KPI cards and revenue charts
- CSV upload and spreadsheet-style manual entry UI
- Report search, filters, creation, and CSV export
- Payment workflow with reminders, audit history, and PDF receipts

## Tech stack

| Layer | Technologies |
| --- | --- |
| Frontend | React, Vite, React Router, Recharts, Tailwind CSS, Axios |
| Backend | Node.js, Express, JWT, bcrypt, Multer |
| Database | MongoDB with Mongoose |
| Payments | node-cron, Nodemailer, PDFKit |

## Local setup

### 1. Clone and install dependencies

```bash
git clone https://github.com/pratikdesai472006/Business-Analytics-Dashboard.git
cd Business-Analytics-Dashboard
cd server && npm install
cd ../client && npm install
```

### 2. Configure MongoDB

No customer needs to install MySQL or run database commands. Create a free [MongoDB Atlas](https://www.mongodb.com/atlas/database) cluster, create a database user, allow your application's IP address, and copy its connection string.

Copy `server/.env.example` to `server/.env` and set the values:

```env
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster-url>/business_analytics?retryWrites=true&w=majority
JWT_SECRET=replace_with_a_long_random_secret
PORT=5000

# Optional: enable real reminder emails
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your-email@example.com
SMTP_PASS=your-app-password
MAIL_FROM=your-email@example.com
```

Create `client/.env` for local development:

```env
VITE_API_URL=http://localhost:5000/api
```

### 3. Start the application

Run the API:

```bash
cd server
npm run dev
```

Run the frontend in a separate terminal:

```bash
cd client
npm run dev
```

Open `http://localhost:5173`.

MongoDB collections and indexes are created automatically; there is no schema import or manual database setup step.

## Payment reminders and receipts

Orders start as **Unpaid**. A scheduled task runs every day at 9:00 AM, sends due reminders, stops once an order is marked **Paid**, and generates downloadable PDF receipts for paid orders. If SMTP credentials are not configured, reminders are logged by the server for safe local testing.

## Deployment

Deploy the frontend on Vercel with `client` as the root directory and set `VITE_API_URL=https://your-api-domain/api`.

Deploy the Express API on Render, Railway, or another Node host. Set `MONGODB_URI`, `JWT_SECRET`, and optional mail variables on the backend host. Use MongoDB Atlas as the managed database so customers never need a local database installation.

## Useful scripts

```bash
cd client && npm run lint
cd client && npm run build
cd server && npm run dev
```

## License

This project is for portfolio and educational use.
