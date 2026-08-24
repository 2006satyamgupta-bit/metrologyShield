# MetrologyShield — Production Deployment Guide

MetrologyShield is a Next.js 16 (App Router) application with TypeScript, Tailwind CSS, Tesseract OCR, and client-side PDF certificate generation.

---

## Option 1: Deploy on Vercel (Fastest & Recommended)

Vercel is the native platform for Next.js with automatic SSL, CI/CD, and global CDN.

### Steps:
1. **Push your code to GitHub / GitLab / Bitbucket**:
   ```bash
   git add .
   git commit -m "feat: complete metrologyshield compliance platform"
   git push origin main
   ```
2. **Import to Vercel**:
   - Go to [vercel.com](https://vercel.com) and log in.
   - Click **"Add New" ➔ "Project"**.
   - Select your `metroshieldag` repository.
3. **Configure Environment Variables** (Optional, for Supabase integration):
   - `NEXT_PUBLIC_APP_URL`: `https://your-domain.vercel.app`
   - `NEXT_PUBLIC_SUPABASE_URL`: *(Your Supabase project URL if using cloud DB)*
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: *(Your Supabase Anon Key)*
4. Click **"Deploy"**.
   - Your site will be live within ~1–2 minutes at `https://your-project.vercel.app`.

---

## Option 2: Deploy with Docker (Render, Railway, Fly.io, GCP Cloud Run, AWS ECS)

The repository includes a production-ready multi-stage `Dockerfile`.

### Build & Run Locally:
```bash
# 1. Build Docker image
docker build -t metrologyshield:latest .

# 2. Run container on port 3000
docker run -p 3000:3000 metrologyshield:latest
```

### Deploying to Render / Railway:
1. Push to GitHub.
2. Create a new **Web Service** on [Render.com](https://render.com) or [Railway.app](https://railway.app).
3. Connect your repository — it will automatically detect the `Dockerfile` or `npm start` command.
4. Set Port to `3000`.

---

## Option 3: Deploy on a Linux VPS / Virtual Server (Ubuntu / Debian / AWS EC2)

### 1. Install Node.js 20 & PM2:
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
sudo npm install -g pm2
```

### 2. Clone & Build:
```bash
git clone <your-repo-url> /var/www/metroshield
cd /var/www/metroshield
npm ci
npm run build
```

### 3. Start with PM2 Process Manager:
```bash
pm2 start npm --name "metrologyshield" -- start
pm2 save
pm2 startup
```

### 4. Configure Nginx Reverse Proxy:
```nginx
server {
    listen 80;
    server_name your-domain.com;

    client_max_body_size 25M;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## Production Health & Verification Checklist

- [x] Production build passes: `npm run build`
- [x] Unit test suites pass: `npm run test:compliance`
- [x] Database pipeline tests pass: `npm run test:pipeline`
- [x] Footwear & Multi-product OCR tests pass: `npx tsx tests/test_multi_product_diversity.ts`
- [x] Client-side PDF Certificate generation active
