set -e  

APP_NAME="admin-portal-staging"
APP_DIR="/var/www/admin-portal"
BACKUP_DIR="/var/www/backups"
LOG_DIR="$APP_DIR/logs"
BUILD_DIR="$APP_DIR/build"

echo "🚀 Starting deployment for $APP_NAME..."

echo "📁 Creating directories..."
sudo mkdir -p "$APP_DIR" "$BACKUP_DIR" "$LOG_DIR"

if [ -d "$BUILD_DIR" ]; then
    echo "💾 Creating backup..."
    BACKUP_NAME="backup-$(date +%Y%m%d-%H%M%S)"
    sudo tar -czf "$BACKUP_DIR/$BACKUP_NAME.tar.gz" -C "$APP_DIR" build
    echo "✅ Backup created: $BACKUP_NAME.tar.gz"
fi

echo "📦 Extracting new build..."
sudo rm -rf "$BUILD_DIR"
sudo mkdir -p "$APP_DIR"
cd "$APP_DIR"
sudo tar -xzf /tmp/build.tar.gz

echo "🔐 Setting permissions..."
sudo chown -R $USER:$USER "$APP_DIR"
sudo chmod -R 755 "$APP_DIR"

if ! command -v serve &> /dev/null; then
    echo "📥 Installing serve..."
    sudo npm install -g serve
fi

if ! command -v pm2 &> /dev/null; then
    echo "📥 Installing PM2..."
    sudo npm install -g pm2
    sudo pm2 startup systemd -u $USER --hp /home/$USER
fi

sudo cp /tmp/ecosystem.config.js "$APP_DIR/ecosystem.config.js"

echo "🛑 Stopping existing application..."
cd "$APP_DIR"
pm2 stop "$APP_NAME" || true
pm2 delete "$APP_NAME" || true

echo "▶️  Starting application with PM2..."
pm2 start ecosystem.config.js

pm2 save

echo "📊 Application status:"
pm2 status

echo "✅ Deployment completed successfully!"
echo "🌐 Application should be running on port 3001"
echo "📝 View logs with: pm2 logs $APP_NAME"

