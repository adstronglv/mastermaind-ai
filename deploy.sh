#!/bin/bash
# Deployment script for Prompt Engineer on Hostinger VPS

set -e

echo "🚀 Deploying Prompt Engineer..."

# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker if not installed
if ! command -v docker &> /dev/null; then
    echo "Installing Docker..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker $USER
fi

# Install Docker Compose if not installed
if ! command -v docker-compose &> /dev/null; then
    echo "Installing Docker Compose..."
    sudo apt install docker-compose -y
fi

# Create app directory
APP_DIR=/opt/prompt-engineer
sudo mkdir -p $APP_DIR
sudo chown $USER:$USER $APP_DIR

# Copy files (run this from project directory)
cp -r . $APP_DIR/

# Go to app directory
cd $APP_DIR

# Create .env if not exists
if [ ! -f .env ]; then
    echo "Creating .env file..."
    cp .env.example .env
    echo "⚠️  Please edit .env and add your ANTHROPIC_API_KEY"
    exit 1
fi

# Build and start
echo "Building and starting application..."
docker-compose down || true
docker-compose up -d --build

# Setup Nginx reverse proxy
echo "Setting up Nginx..."
sudo apt install nginx -y

sudo tee /etc/nginx/sites-available/prompt-engineer > /dev/null <<EOF
server {
    listen 80;
    server_name mastermaind.ai www.mastermaind.ai;

    location / {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

sudo ln -sf /etc/nginx/sites-available/prompt-engineer /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl restart nginx

# Setup SSL with Let's Encrypt
echo "Setting up SSL..."
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d mastermaind.ai -d www.mastermaind.ai --non-interactive --agree-tos -m alexbelafostau@gmail.com || echo "SSL setup failed - will try again later"

echo "✅ Deployment complete!"
echo "🌐 Visit: https://mastermaind.ai"
