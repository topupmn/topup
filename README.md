# topup.mn

Монгол хэрэглэгчдэд зориулсан тоглоомын карт (Steam, Roblox, PUBG) худалдан авах вэбсайт. QPay-ээр MNT төлбөр хүлээн авч, Reloadly-ээр картын код хүргэнэ.

## Tech Stack

- **Frontend:** Next.js 15 (App Router), React 19, Tailwind CSS 4
- **Backend:** Next.js API Routes
- **Database:** PostgreSQL + Prisma ORM
- **Auth:** NextAuth.js (credentials)
- **Payments:** QPay (MNT QR payments)
- **Fulfillment:** Reloadly Gift Cards API

## Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL database
- Reloadly sandbox account
- QPay sandbox merchant credentials

### Setup

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env
# Fill in DATABASE_URL, NEXTAUTH_SECRET, Reloadly and QPay credentials

# Push database schema
npm run db:push

# Test Reloadly connection
npm run reloadly:test

# Sync Steam/Roblox/PUBG products from Reloadly into database
npm run reloadly:sync

# Start dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Environment Variables

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `NEXTAUTH_URL` | App URL (http://localhost:3000 for dev) |
| `NEXTAUTH_SECRET` | Random secret for JWT signing |
| `RELOADLY_CLIENT_ID` | Reloadly API client ID |
| `RELOADLY_CLIENT_SECRET` | Reloadly API client secret |
| `RELOADLY_ENV` | `sandbox` or `live` |
| `QPAY_BASE_URL` | QPay API URL (sandbox or production) |
| `QPAY_USERNAME` | QPay merchant username |
| `QPAY_PASSWORD` | QPay merchant password |
| `QPAY_INVOICE_CODE` | QPay invoice code |
| `QPAY_CALLBACK_URL` | Webhook URL for payment notifications |

## Order Flow

1. User registers / logs in
2. Selects a gift card product
3. System creates order + QPay invoice with QR code
4. User scans QR and pays via bank app
5. QPay webhook confirms payment
6. System places order on Reloadly API
7. Card code is delivered to user on order page

## Project Structure

```
src/
├── app/                    # Next.js pages and API routes
│   ├── api/
│   │   ├── auth/           # NextAuth + registration
│   │   ├── checkout/       # Create order + QPay invoice
│   │   ├── orders/         # Order list and detail
│   │   ├── products/       # Product catalog API
│   │   └── qpay/webhook/   # QPay payment callback
│   ├── login/              # Login page
│   ├── register/           # Registration page
│   ├── products/           # Product catalog pages
│   └── orders/             # Order pages
├── components/             # React components
└── lib/
    ├── auth.ts             # NextAuth config
    ├── prisma.ts           # Database client
    ├── qpay.ts             # QPay API integration
    ├── reloadly.ts         # Reloadly API integration
    └── utils.ts            # Helpers
```

## Before Going Live

- [ ] Replace seed product `reloadlyId` values with real Reloadly product IDs
- [ ] Set MNT prices based on USD cost + markup + exchange rate
- [ ] Switch `RELOADLY_ENV` to `live` and fund Reloadly wallet
- [ ] Switch QPay to production credentials
- [ ] Set `QPAY_CALLBACK_URL` to production HTTPS URL
- [ ] Generate a strong `NEXTAUTH_SECRET`
- [ ] Set up production PostgreSQL (e.g. Neon, Supabase, Railway)
- [ ] Configure domain topup.mn with HTTPS

## License

Private — all rights reserved.
