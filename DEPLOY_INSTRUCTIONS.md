# Deployment Instructions for Prompt Engineer

## Hostinger VPS Deployment

### Step 1: Access VPS via SSH

```bash
ssh root@YOUR_VPS_IP
# Or use Hostinger hPanel SSH terminal
```

### Step 2: Upload Project Files

Option A - Via Git (recommended):
```bash
# On VPS
cd /opt
git clone https://github.com/YOUR_USERNAME/prompt-engineer.git
cd prompt-engineer
```

Option B - Via SCP from local:
```bash
# On local machine (PowerShell)
scp -r C:\Users\alexb\prompt-engineer root@YOUR_VPS_IP:/opt/
```

Option C - Via Hostinger File Manager:
1. Go to hPanel > Files > File Manager
2. Upload files to /opt/prompt-engineer/

### Step 3: Configure Environment

```bash
cd /opt/prompt-engineer
cp .env.example .env
nano .env
```

Add your Anthropic API key:
```
ANTHROPIC_API_KEY=sk-ant-api03-xxxxx
```

### Step 4: Run Deployment Script

```bash
chmod +x deploy.sh
./deploy.sh
```

### Step 5: Point Domain to VPS

In Hostinger hPanel:
1. Go to DNS Zone
2. Set A record: @ → YOUR_VPS_IP
3. Set A record: www → YOUR_VPS_IP

Wait 5-15 minutes for DNS propagation.

### Step 6: Verify

Visit https://adstronglv.com

---

## Alternative: Hostinger Shared Hosting (if no VPS)

Shared hosting doesn't support Python directly. Options:

### Option 1: Use Python Anywhere (Free Tier)
1. Sign up at pythonanywhere.com
2. Upload files
3. Set up WSGI application
4. Point domain via CNAME

### Option 2: Use Railway.app (Free Tier)
1. Sign up at railway.app
2. Connect GitHub repo
3. Deploy automatically
4. Add custom domain

### Option 3: Use Render.com (Free Tier)
1. Sign up at render.com
2. Create new Web Service
3. Connect GitHub repo
4. Add environment variables
5. Add custom domain

---

## Quick Railway Deployment (Recommended for Speed)

1. Install Railway CLI:
```bash
npm install -g @railway/cli
```

2. Login and deploy:
```bash
cd C:\Users\alexb\prompt-engineer
railway login
railway init
railway up
```

3. Add environment variables in Railway dashboard

4. Add custom domain adstronglv.com

---

## Monitoring

Check logs:
```bash
docker-compose logs -f
```

Restart:
```bash
docker-compose restart
```

Stop:
```bash
docker-compose down
```
