#!/usr/bin/env bash
# =============================================================================
#  🚀  سكربت النشر التلقائي — مجموعة العزب — قاعدة المعرفة
#      Auto-Deployment Script for Ubuntu Server (22.04 / 24.04)
# =============================================================================
#
#  الاستخدام / Usage:
#    chmod +x deploy.sh
#    sudo bash deploy.sh [--domain alazab.com] [--email admin@alazab.com]
#
#  المتطلبات المسبقة / Prerequisites:
#    • Ubuntu 22.04 LTS أو 24.04 LTS
#    • صلاحيات sudo
#    • نطاق DNS يشير لهذا السيرفر (مطلوب للـ SSL)
# =============================================================================

set -euo pipefail

# ─── الألوان للإخراج ────────────────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
BLUE='\033[0;34m'; CYAN='\033[0;36m'; BOLD='\033[1m'; NC='\033[0m'

log()  { echo -e "${CYAN}[$(date +%H:%M:%S)]${NC} $*"; }
ok()   { echo -e "${GREEN}[✓]${NC} $*"; }
warn() { echo -e "${YELLOW}[!]${NC} $*"; }
fail() { echo -e "${RED}[✗] $*${NC}" >&2; exit 1; }

# ─── الإعدادات الافتراضية ───────────────────────────────────────────────────
APP_NAME="alazab-kb"
APP_DIR="/opt/${APP_NAME}"
REPO_URL="https://github.com/mohamedazab224/docus.git"
REPO_BRANCH="main"
DOCS_SUBDIR="docs"
NODE_VERSION="22"
PNPM_VERSION="10"
APP_PORT="3000"
DOMAIN="${DOMAIN:-}"
SSL_EMAIL="${SSL_EMAIL:-}"
NGINX_CONF="/etc/nginx/sites-available/${APP_NAME}"
SERVICE_USER="alazab"

# ─── معالجة الإعدادات من سطر الأوامر ───────────────────────────────────────
while [[ $# -gt 0 ]]; do
  case "$1" in
    --domain)  DOMAIN="$2";    shift 2 ;;
    --email)   SSL_EMAIL="$2"; shift 2 ;;
    --branch)  REPO_BRANCH="$2"; shift 2 ;;
    --port)    APP_PORT="$2";  shift 2 ;;
    *) warn "خيار غير معروف: $1"; shift ;;
  esac
done

# ─── التحقق من الصلاحيات ────────────────────────────────────────────────────
[[ "$EUID" -ne 0 ]] && fail "يجب تشغيل السكربت بصلاحيات root: sudo bash $0"

echo -e "\n${BOLD}${BLUE}══════════════════════════════════════════════════════════${NC}"
echo -e "${BOLD}${BLUE}   🏛️  نشر قاعدة معرفة مجموعة العزب — Al-Azab Knowledge Base${NC}"
echo -e "${BOLD}${BLUE}══════════════════════════════════════════════════════════${NC}\n"

# ─── 1. تحديث النظام وتثبيت المتطلبات الأساسية ─────────────────────────────
log "📦 تحديث حزم النظام..."
apt-get update -qq
apt-get install -y -qq \
  curl git nginx certbot python3-certbot-nginx \
  build-essential ca-certificates gnupg lsb-release ufw \
  > /dev/null
ok "تم تثبيت الحزم الأساسية"

# ─── 2. تثبيت Node.js ────────────────────────────────────────────────────────
if ! command -v node &>/dev/null || [[ "$(node -v | cut -d. -f1 | tr -d v)" -lt "$NODE_VERSION" ]]; then
  log "⬇️  تثبيت Node.js ${NODE_VERSION}..."
  mkdir -p /etc/apt/keyrings
  curl -fsSL "https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key" \
    | gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg
  echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_${NODE_VERSION}.x nodistro main" \
    | tee /etc/apt/sources.list.d/nodesource.list > /dev/null
  apt-get update -qq
  apt-get install -y -qq nodejs > /dev/null
  ok "Node.js $(node -v) تم التثبيت"
else
  ok "Node.js $(node -v) موجود مسبقاً"
fi

# ─── 3. تثبيت pnpm ──────────────────────────────────────────────────────────
if ! command -v pnpm &>/dev/null; then
  log "⬇️  تثبيت pnpm ${PNPM_VERSION}..."
  npm install -g "pnpm@${PNPM_VERSION}" --silent
  ok "pnpm $(pnpm -v) تم التثبيت"
else
  ok "pnpm $(pnpm -v) موجود مسبقاً"
fi

# ─── 4. تثبيت PM2 ────────────────────────────────────────────────────────────
if ! command -v pm2 &>/dev/null; then
  log "⬇️  تثبيت PM2..."
  npm install -g pm2 --silent
  ok "PM2 $(pm2 -v) تم التثبيت"
else
  ok "PM2 $(pm2 -v) موجود مسبقاً"
fi

# ─── 5. إنشاء مستخدم النظام ─────────────────────────────────────────────────
if ! id "$SERVICE_USER" &>/dev/null; then
  log "👤 إنشاء مستخدم النظام: ${SERVICE_USER}..."
  useradd --system --create-home --shell /bin/bash "$SERVICE_USER"
  ok "تم إنشاء المستخدم ${SERVICE_USER}"
else
  ok "المستخدم ${SERVICE_USER} موجود مسبقاً"
fi

# ─── 6. استنساخ / تحديث المستودع ────────────────────────────────────────────
if [[ -d "${APP_DIR}/.git" ]]; then
  log "🔄 تحديث المستودع..."
  cd "$APP_DIR"
  sudo -u "$SERVICE_USER" git fetch origin
  sudo -u "$SERVICE_USER" git reset --hard "origin/${REPO_BRANCH}"
  ok "تم تحديث المستودع إلى آخر إصدار"
else
  log "📥 استنساخ المستودع..."
  rm -rf "$APP_DIR"
  git clone --branch "$REPO_BRANCH" --depth 1 "$REPO_URL" "$APP_DIR"
  chown -R "${SERVICE_USER}:${SERVICE_USER}" "$APP_DIR"
  ok "تم استنساخ المستودع في ${APP_DIR}"
fi

# ─── 7. تثبيت الاعتماديات وبناء التطبيق ─────────────────────────────────────
log "📦 تثبيت اعتماديات المشروع..."
cd "$APP_DIR"
sudo -u "$SERVICE_USER" pnpm install --frozen-lockfile

log "🏗️  تحضير المشروع (dev:prepare)..."
sudo -u "$SERVICE_USER" pnpm run dev:prepare 2>/dev/null || true

log "🔨 بناء تطبيق الـ docs..."
cd "${APP_DIR}/${DOCS_SUBDIR}"
sudo -u "$SERVICE_USER" pnpm run build
ok "تم بناء التطبيق بنجاح"

# ─── 8. إعداد PM2 ─────────────────────────────────────────────────────────────
PM2_CONFIG="${APP_DIR}/ecosystem.config.cjs"

cat > "$PM2_CONFIG" <<ECOSYSTEM
/**
 * PM2 Ecosystem — مجموعة العزب قاعدة المعرفة
 * Auto-generated by deploy.sh — $(date)
 */
module.exports = {
  apps: [{
    name: '${APP_NAME}',
    script: '.output/server/index.mjs',
    cwd: '${APP_DIR}/${DOCS_SUBDIR}',
    instances: 'max',
    exec_mode: 'cluster',
    max_memory_restart: '512M',
    env: {
      NODE_ENV: 'production',
      PORT: '${APP_PORT}',
      HOST: '0.0.0.0',
    },
    error_file: '/var/log/${APP_NAME}/err.log',
    out_file: '/var/log/${APP_NAME}/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss',
    autorestart: true,
    watch: false,
    restart_delay: 3000,
    kill_timeout: 10000,
  }],
}
ECOSYSTEM

chown "${SERVICE_USER}:${SERVICE_USER}" "$PM2_CONFIG"
mkdir -p "/var/log/${APP_NAME}"
chown -R "${SERVICE_USER}:${SERVICE_USER}" "/var/log/${APP_NAME}"

log "🔁 تشغيل التطبيق عبر PM2..."
sudo -u "$SERVICE_USER" pm2 delete "$APP_NAME" 2>/dev/null || true
sudo -u "$SERVICE_USER" pm2 start "$PM2_CONFIG"
sudo -u "$SERVICE_USER" pm2 save
ok "التطبيق يعمل على المنفذ ${APP_PORT}"

# ─── 9. إعداد PM2 للبدء التلقائي مع النظام ─────────────────────────────────
log "⚙️  إعداد البدء التلقائي عند إعادة التشغيل..."
env PATH="$PATH:/usr/bin" pm2 startup systemd -u "$SERVICE_USER" --hp "/home/${SERVICE_USER}" \
  | tail -1 | bash > /dev/null 2>&1 || true
ok "تم إعداد البدء التلقائي"

# ─── 10. إعداد Nginx ──────────────────────────────────────────────────────────
log "🌐 إعداد Nginx..."

UPSTREAM_NAME="${APP_NAME//-/_}"

cat > "$NGINX_CONF" <<NGINX
# =============================================================================
#  Nginx — مجموعة العزب — قاعدة المعرفة
#  Auto-generated by deploy.sh — $(date)
# =============================================================================

upstream ${UPSTREAM_NAME} {
    server 127.0.0.1:${APP_PORT};
    keepalive 64;
}

# ── إعادة توجيه HTTP ← HTTPS ─────────────────────────────────────────────────
server {
    listen 80;
    listen [::]:80;
    server_name ${DOMAIN:-_};

    # دعم التحقق من Let's Encrypt
    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }

    location / {
        return 301 https://\$host\$request_uri;
    }
}

# ── HTTPS ─────────────────────────────────────────────────────────────────────
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name ${DOMAIN:-_};

    # ── SSL (يُحدَّث بواسطة Certbot تلقائياً) ─────────────────────────────
    ssl_certificate     /etc/ssl/certs/ssl-cert-snakeoil.pem;
    ssl_certificate_key /etc/ssl/private/ssl-cert-snakeoil.key;
    ssl_protocols       TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers off;
    ssl_session_cache   shared:SSL:10m;
    ssl_session_timeout 1d;

    # ── إعدادات الأمان ────────────────────────────────────────────────────
    add_header Strict-Transport-Security "max-age=63072000; includeSubDomains" always;
    add_header X-Frame-Options SAMEORIGIN always;
    add_header X-Content-Type-Options nosniff always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Permissions-Policy "camera=(), microphone=(), geolocation=()" always;

    # ── الضغط gzip ───────────────────────────────────────────────────────
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml application/json application/javascript application/rss+xml application/atom+xml image/svg+xml;

    # ── ملفات ثابتة (Cache طويل) ─────────────────────────────────────────
    location ~* \.(js|css|woff2?|ttf|eot|svg|ico|png|jpg|jpeg|webp|avif|gif)$ {
        proxy_pass http://${UPSTREAM_NAME};
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        add_header Cache-Control "public, max-age=31536000, immutable";
        add_header Vary "Accept-Encoding";
    }

    # ── التطبيق الرئيسي ──────────────────────────────────────────────────
    location / {
        proxy_pass http://${UPSTREAM_NAME};
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 60s;
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
    }

    # ── حماية ملفات النظام ───────────────────────────────────────────────
    location ~ /\\.(?!well-known) {
        deny all;
    }

    # ── تسجيل الوصول ─────────────────────────────────────────────────────
    access_log /var/log/nginx/${APP_NAME}_access.log;
    error_log  /var/log/nginx/${APP_NAME}_error.log;

    # ── حجم الرفع ──────────────────────────────────────────────────────── 
    client_max_body_size 50M;
}
NGINX

# تفعيل موقع Nginx
ln -sf "$NGINX_CONF" "/etc/nginx/sites-enabled/${APP_NAME}" 2>/dev/null || true
rm -f /etc/nginx/sites-enabled/default 2>/dev/null || true

nginx -t && systemctl reload nginx
ok "Nginx تم إعداده وإعادة تحميله"

# ─── 11. إعداد جدار الحماية UFW ─────────────────────────────────────────────
log "🔒 إعداد جدار الحماية..."
ufw allow OpenSSH   > /dev/null 2>&1 || true
ufw allow 'Nginx Full' > /dev/null 2>&1 || true
ufw --force enable  > /dev/null 2>&1 || true
ok "جدار الحماية UFW مفعّل"

# ─── 12. إعداد SSL (Let's Encrypt) ──────────────────────────────────────────
if [[ -n "$DOMAIN" && -n "$SSL_EMAIL" ]]; then
  log "🔐 طلب شهادة SSL من Let's Encrypt للنطاق ${DOMAIN}..."
  certbot --nginx \
    -d "$DOMAIN" \
    --email "$SSL_EMAIL" \
    --agree-tos \
    --non-interactive \
    --redirect
  ok "شهادة SSL تم تثبيتها للنطاق ${DOMAIN}"

  # تجديد تلقائي عبر cron
  (crontab -l 2>/dev/null; echo "0 3 * * * certbot renew --quiet --post-hook 'systemctl reload nginx'") \
    | sort -u | crontab -
  ok "تجديد الشهادة التلقائي مُجدوَل"
else
  warn "لم يُحدَّد نطاق أو بريد إلكتروني — تم تخطي إعداد SSL"
  warn "لتفعيل SSL لاحقاً: certbot --nginx -d your-domain.com"
fi

# ─── 13. إنشاء سكربت التحديث السريع ─────────────────────────────────────────
cat > /usr/local/bin/alazab-update <<UPDATE_SCRIPT
#!/usr/bin/env bash
# سكربت التحديث السريع — مجموعة العزب
set -euo pipefail

APP_DIR="${APP_DIR}"
DOCS_SUBDIR="${DOCS_SUBDIR}"
SERVICE_USER="${SERVICE_USER}"
APP_NAME="${APP_NAME}"

echo "🔄 سحب آخر التغييرات..."
cd "\$APP_DIR"
sudo -u "\$SERVICE_USER" git fetch origin
sudo -u "\$SERVICE_USER" git reset --hard origin/${REPO_BRANCH}

echo "📦 تحديث الاعتماديات..."
sudo -u "\$SERVICE_USER" pnpm install --frozen-lockfile

echo "🏗️  تحضير المشروع..."
sudo -u "\$SERVICE_USER" pnpm run dev:prepare 2>/dev/null || true

echo "🔨 بناء التطبيق..."
cd "\$APP_DIR/\$DOCS_SUBDIR"
sudo -u "\$SERVICE_USER" pnpm run build

echo "🔁 إعادة تشغيل PM2..."
sudo -u "\$SERVICE_USER" pm2 reload "\$APP_NAME" --update-env

echo "✅ تم التحديث بنجاح!"
UPDATE_SCRIPT

chmod +x /usr/local/bin/alazab-update
ok "سكربت التحديث السريع: /usr/local/bin/alazab-update"

# ─── الملخص النهائي ───────────────────────────────────────────────────────────
echo ""
echo -e "${BOLD}${GREEN}══════════════════════════════════════════════════════════${NC}"
echo -e "${BOLD}${GREEN}   ✅  تم النشر بنجاح!${NC}"
echo -e "${BOLD}${GREEN}══════════════════════════════════════════════════════════${NC}"
echo -e " 🌐 النطاق   : ${DOMAIN:-http://SERVER_IP}"
echo -e " 📂 المجلد   : ${APP_DIR}"
echo -e " 🔌 المنفذ   : ${APP_PORT}"
echo -e " 👤 المستخدم : ${SERVICE_USER}"
echo -e ""
echo -e " 📋 أوامر مفيدة:"
echo -e "   ${CYAN}sudo -u ${SERVICE_USER} pm2 status${NC}         # حالة التطبيق"
echo -e "   ${CYAN}sudo -u ${SERVICE_USER} pm2 logs ${APP_NAME}${NC}   # سجلات التطبيق"
echo -e "   ${CYAN}sudo alazab-update${NC}                    # تحديث سريع"
echo -e "   ${CYAN}sudo nginx -t && systemctl reload nginx${NC}  # إعادة تحميل Nginx"
echo -e ""
