#!/usr/bin/env bash
# ==============================================================================
# NEXA ERP - Automated Oracle Cloud (OCI) Ubuntu Provisioning Script
# ==============================================================================
set -e

echo "🚀 [1/6] Updating Ubuntu packages and installing core dependencies..."
sudo apt-get update -y
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y curl git build-essential ufw iptables-persistent

echo "📦 [2/6] Installing Node.js 22 LTS (Required for node:sqlite)..."
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs

echo "🔥 [3/6] Configuring Oracle Cloud Ubuntu Firewall (iptables & UFW)..."
# Oracle Cloud Ubuntu images include default iptables rules that drop non-SSH ports.
# We insert ACCEPT rules at the top of the INPUT chain:
sudo iptables -I INPUT 1 -p tcp --dport 80 -j ACCEPT
sudo iptables -I INPUT 1 -p tcp --dport 443 -j ACCEPT
sudo iptables -I INPUT 1 -p tcp --dport 4000 -j ACCEPT
sudo netfilter-persistent save || true

# Also configure UFW if active
sudo ufw allow 22/tcp || true
sudo ufw allow 80/tcp || true
sudo ufw allow 443/tcp || true
sudo ufw allow 4000/tcp || true

echo "📥 [4/6] Installing NPM project dependencies & building production bundle..."
npm install
npm run build

echo "⚙️ [5/6] Setting up PM2 Process Manager for 24/7 background execution..."
sudo npm install -g pm2
pm2 delete nexa-erp 2>/dev/null || true
pm2 start ecosystem.config.js
pm2 save

echo "🔄 [6/6] Configuring systemd startup hook for PM2..."
STARTUP_CMD=$(pm2 startup systemd -u $USER --hp $HOME | grep "sudo env")
if [ -n "$STARTUP_CMD" ]; then
  eval "$STARTUP_CMD"
fi

PUBLIC_IP=$(curl -s https://ifconfig.me || echo "<YOUR_ORACLE_PUBLIC_IP>")

echo ""
echo "=============================================================================="
echo "✅ NEXA ERP successfully deployed on Oracle Cloud!"
echo "🌐 Access your ERP now at: http://${PUBLIC_IP}:4000"
echo "📊 Check status anytime with: pm2 status"
echo "📜 View live logs with:       pm2 logs nexa-erp"
echo "=============================================================================="
