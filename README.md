# MetrologyShield — Automated Legal Metrology Compliance Platform

MetrologyShield is a Next.js 16 (App Router) compliance audit platform engineered for Indian Legal Metrology (Packaged Commodities) Rules, 2011.

## Key Features
- **OCR Engine**: Client & server-side OCR extracting MRP, net quantity, manufacturer/packer details, date of manufacture/import, consumer care, and dimensions.
- **Rule Verification**: Automated deterministic rule checking covering mandatory declarations, unit formatting, consumer care contacts, and MRP display.
- **Category Specific Rules**: Dedicated parsing and validation for diverse product categories (Food & Beverages, Footwear & Apparel, Electronics, Personal Care, and General Commodities).
- **Certificate Generation**: Client-side verifiable PDF compliance audit certificates.

## Getting Started

First, install dependencies:
```bash
npm install
```

Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Running Verification Tests
```bash
# Run rule & compliance tests
npm run test:compliance

# Run full pipeline tests
npm run test:pipeline
```

## Production Deployment
Refer to [`DEPLOYMENT.md`](./DEPLOYMENT.md) for deployment options on Vercel, Docker, Render, Railway, or Linux VPS.
