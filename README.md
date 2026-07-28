# Aperture Business Analytics Dashboard

A full-stack business intelligence dashboard for tracking revenue, orders, customers, payment status, reports, and forward-looking performance.

## Features

- JWT authentication with protected routes
- Responsive analytics dashboard with KPI cards and revenue charts
- CSV upload and spreadsheet-style manual entry UI
- Report search, category filters, creation, and CSV export
- Forecasting dashboard with growth and confidence metrics
- Payment workflow: `Unpaid`, `Pending`, and `Paid` statuses
- Due-date reminders scheduled daily at 9:00 AM
- PDF payment receipt generation for paid orders
- Payment status audit trail

## Tech stack

| Layer | Technologies |
| --- | --- |
| Frontend | React, Vite, React Router, Recharts, Tailwind CSS, Axios, Lucide |
| Backend | Node.js, Express, JWT, bcrypt, Multer |
| Database | MySQL |
| Payments | node-cron, Nodemailer, PDFKit |

## Project structure

```text
Business-Analytics-Dashboard/
├── client/                 # React application
├── server/                 # Express API
│   ├── controllers/
│   ├── routes/
│   ├── services/
│   └── schema.sql          # Payment tables
└── README.md
```

## Local setup

### 1. Clone and install dependencies

```bash
git clone https://github.com/pratikdesai472006/Business-Analytics-Dashboard.git
cd Business-Analytics-Dashboard

cd server && npm install
cd ../client && npm install
```

### 2. Configure MySQL

Create a database, run the existing users-table setup if it has not already been created, then import the payment schema:

```bash
mysql -u root -p your_database_name < server/schema.sql
```

Create `server/.env`:

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=business_analytics
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

## Payment reminders and receipts

Orders are stored with a due date and start as **Unpaid**. A scheduled task runs every day at 9:00 AM:

- Sends a reminder one day before the due date.
- Continues daily reminders while an order is `Unpaid` or `Pending`.
- Stops as soon as the order is marked `Paid`.
- Generates a downloadable PDF receipt for paid orders.

If SMTP credentials are not configured, reminder events are written to the server console. This allows safe local testing without emailing anyone.

## Deployment

Deploy the frontend on Vercel:

1. Import this GitHub repository.
2. Set the Vercel root directory to `client`.
3. Add `VITE_API_URL=https://your-api-domain/api` as an environment variable.
4. Deploy.

Deploy the Express API and MySQL database separately (for example, Render/Railway plus a MySQL provider). Configure the server environment variables above on the backend host.

## Useful scripts

```bash
# Frontend quality checks
cd client
npm run lint
npm run build

# Run backend
cd server
npm run dev
```

## License

This project is for portfolio and educational use.
