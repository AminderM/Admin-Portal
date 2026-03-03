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

if [ ! -d "$BUILD_DIR" ]; then
    echo "❌ ERROR: Build directory not found at $BUILD_DIR"
    echo "📋 Contents of $APP_DIR:"
    ls -la "$APP_DIR"
    exit 1
fi

if [ -z "$(ls -A $BUILD_DIR)" ]; then
    echo "❌ ERROR: Build directory is empty"
    exit 1
fi

echo "✅ Build directory verified at $BUILD_DIR"

echo "🔐 Setting permissions..."
sudo chown -R $USER:$USER "$APP_DIR"
sudo chmod -R 755 "$APP_DIR"

sudo mkdir -p "$LOG_DIR"
sudo chown -R $USER:$USER "$LOG_DIR"
sudo chmod -R 755 "$LOG_DIR"

if ! command -v serve &> /dev/null; then
    echo "📥 Installing serve..."
    sudo npm install -g serve
fi

SERVE_PATH=$(which serve)
if [ -z "$SERVE_PATH" ]; then
    echo "❌ ERROR: serve command not found after installation"
    exit 1
fi
echo "✅ serve found at: $SERVE_PATH"

if ! command -v pm2 &> /dev/null; then
    echo "📥 Installing PM2..."
    sudo npm install -g pm2
    sudo pm2 startup systemd -u $USER --hp /home/$USER
fi

sudo cp /tmp/ecosystem.config.js "$APP_DIR/ecosystem.config.js"

if [ ! -f "$BUILD_DIR/index.html" ]; then
    echo "❌ ERROR: index.html not found in build directory"
    echo "📋 Build directory contents:"
    ls -la "$BUILD_DIR" | head -10
    exit 1
fi
echo "✅ Build directory contains index.html"

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

