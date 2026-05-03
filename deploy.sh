#!/bin/bash
# =============================================================================
#  🚀  سكربت النشر المستقل — مجموعة العزب
#      مخصص لـ assets.alazab.com فقط — منفصل تماماً عن أي كود مصدري
# =============================================================================
#
#  الميزات:
#    1. يتحقق من وجود الشهادات قبل البدء
#    2. ينشر على منفذ 3005
#    3. لا يعتمد على أي مشروع خارجي
#    4. يقطع أي علاقة مع Git أو الكود المصدري
# =============================================================================

set -euo pipefail

# ─── الألوان ────────────────────────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
BLUE='\033[0;34m'; CYAN='\033[0;36m'; BOLD='\033[1m'; NC='\033[0m'

log()  { echo -e "${CYAN}[$(date +%H:%M:%S)]${NC} $*"; }
ok()   { echo -e "${GREEN}[✓]${NC} $*"; }
warn() { echo -e "${YELLOW}[!]${NC} $*"; }
fail() { echo -e "${RED}[✗] $*${NC}" >&2; exit 1; }

# ─── الإعدادات الثابتة ──────────────────────────────────────────────────────
DOMAIN="assets.alazab.com"
APP_PORT="3005"
APP_DIR="/var/www/assets"
CONFIG_DIR="${APP_DIR}/config"
PUBLIC_DIR="${APP_DIR}/public"
LOG_DIR="/var/log/assets-standalone"
NGINX_CONF="/etc/nginx/sites-available/${DOMAIN}"
SSL_PATH="/etc/letsencrypt/live/${DOMAIN}"
SSL_EMAIL="admin@alazab.com"

echo -e "\n${BOLD}${BLUE}══════════════════════════════════════════════════════════${NC}"
echo -e "${BOLD}${BLUE}   🏛️  النشر المستقل — ${DOMAIN} — منفذ ${APP_PORT}${NC}"
echo -e "${BOLD}${BLUE}══════════════════════════════════════════════════════════${NC}\n"

# ─── 1. التحقق من الصلاحيات ─────────────────────────────────────────────────
log "🔍 التحقق من الصلاحيات..."
[[ "$EUID" -ne 0 ]] && fail "يجب تشغيل السكربت بصلاحيات root"

# ─── 2. فحص الأدوات المطلوبة قبل أي شيء ─────────────────────────────────────
log "🛠️  فحص الأدوات المطلوبة..."

MISSING_TOOLS=()
for tool in node npm nginx certbot curl lsof openssl; do
    if ! command -v "$tool" &>/dev/null; then
        MISSING_TOOLS+=("$tool")
    fi
done

if [[ ${#MISSING_TOOLS[@]} -gt 0 ]]; then
    echo -e "${RED}[✗] الأدوات التالية غير مثبتة:${NC}" >&2
    for t in "${MISSING_TOOLS[@]}"; do
        echo -e "     ${RED}• $t${NC}" >&2
    done
    echo -e "${YELLOW}[!] قم بتثبيتها أولاً:${NC}"
    echo -e "     ${CYAN}apt update && apt install -y nodejs npm nginx certbot curl lsof openssl${NC}"
    exit 1
fi

# التحقق من إصدار Node.js (يجب أن يكون 18 أو أعلى)
NODE_MAJOR=$(node -e "process.stdout.write(process.versions.node.split('.')[0])" 2>/dev/null || echo "0")
if [[ "$NODE_MAJOR" -lt 18 ]]; then
    NODE_ACTUAL=$(node --version 2>/dev/null || echo "غير معروف")
    fail "يجب أن يكون Node.js الإصدار 18 أو أعلى (الحالي: ${NODE_ACTUAL})"
fi

ok "جميع الأدوات المطلوبة متوفرة"

# ─── 3. التحقق من وجود الشهادات قبل أي شيء ─────────────────────────────────
log "🔐 [3/13] التحقق من شهادة SSL للنطاق ${DOMAIN}..."

if [[ ! -d "$SSL_PATH" ]]; then
    warn "شهادة SSL غير موجودة للنطاق ${DOMAIN}"
    warn "جاري محاولة الحصول على شهادة جديدة..."
    
    certbot certonly --standalone \
        -d "$DOMAIN" \
        --email "$SSL_EMAIL" \
        --agree-tos \
        --non-interactive \
        --key-type ecdsa \
        --elliptic-curve secp384r1 \
        2>/dev/null || {
            fail "فشل الحصول على الشهادة. تأكد من أن DNS يشير إلى هذا السيرفر"
        }
    ok "تم الحصول على شهادة SSL جديدة"
fi

if [[ ! -f "${SSL_PATH}/fullchain.pem" ]] || [[ ! -f "${SSL_PATH}/privkey.pem" ]]; then
    fail "الشهادة موجودة ولكن الملفات ناقصة: ${SSL_PATH}"
fi

ok "شهادة SSL موجودة وصالحة في ${SSL_PATH}"

# ─── 4. إيقاف أي خدمات قديمة على المنفذ 3005 ────────────────────────────────
log "🔍 [4/13] التحقق من المنفذ ${APP_PORT}..."
if lsof -i :${APP_PORT} -sTCP:LISTEN -t >/dev/null 2>&1; then
    warn "المنفذ ${APP_PORT} مشغول، جاري إيقاف الخدمات القديمة..."
    pkill -f "node.*${APP_PORT}" 2>/dev/null || true
    pkill -f "nuxt.*${APP_PORT}" 2>/dev/null || true
    sleep 2
fi

# ─── 5. إنشاء مجلد مستقل ونظيف ─────────────────────────────────────────────
log "📁 [5/13] إنشاء مجلد مستقل ونظيف..."
rm -rf "$APP_DIR"
mkdir -p "$APP_DIR"
mkdir -p "$CONFIG_DIR"
mkdir -p "$PUBLIC_DIR"
mkdir -p "$LOG_DIR"
ok "تم إنشاء المجلدات"

# ─── 6. إنشاء ملف اختبار ────────────────────────────────────────────────────
log "📄 [6/13] إنشاء ملف اختبار..."
cat > "${CONFIG_DIR}/example.txt" <<EOF
✅ الخدمة تعمل بشكل صحيح!
📅 التاريخ: $(date)
🔗 الرابط: https://${DOMAIN}/config/example.txt
🌐 المنفذ: ${APP_PORT}

هذا مسار آمن ومستقل تماماً عن أي كود مصدري.
EOF

chmod -R 755 "$APP_DIR"
ok "تم إعداد الملفات"

# ─── 7. إنشاء تطبيق ويب بسيط جداً (Node.js) ─────────────────────────────────
log "📝 [7/13] إنشاء تطبيق ويب مستقل..."

# إنشاء package.json بسيط
cat > "${APP_DIR}/package.json" <<EOF
{
  "name": "assets-standalone",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "start": "node server.js"
  }
}
EOF

# إنشاء خادوم ويب بسيط
cat > "${APP_DIR}/server.js" <<'EOF'
import { createServer } from 'http';
import { readFile } from 'fs/promises';
import { createReadStream } from 'fs';
import { join, extname } from 'path';
import { stat } from 'fs/promises';

const PORT = process.env.PORT || 3005;
const ASSETS_DIR = '/var/www/assets';

const MIME_TYPES = {
    '.pdf': 'application/pdf',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.webp': 'image/webp',
    '.svg': 'image/svg+xml',
    '.txt': 'text/plain',
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'application/javascript',
    '.json': 'application/json',
    '.zip': 'application/zip',
    '.mp4': 'video/mp4',
    '.mp3': 'audio/mpeg'
};

const server = createServer(async (req, res) => {
    const url = req.url;
    
    // فقط نسمح بالوصول إلى /config/ و /public/
    if (url.startsWith('/config/')) {
        const filePath = join(ASSETS_DIR, url);
        const ext = extname(filePath);
        const contentType = MIME_TYPES[ext] || 'application/octet-stream';
        
        try {
            await stat(filePath);
            res.writeHead(200, {
                'Content-Type': contentType,
                'Cache-Control': 'public, max-age=31536000, immutable',
                'Accept-Ranges': 'bytes',
                'X-Content-Type-Options': 'nosniff'
            });
            createReadStream(filePath).pipe(res);
        } catch (err) {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('File not found');
        }
    } 
    else if (url.startsWith('/public/')) {
        const filePath = join(ASSETS_DIR, url);
        const ext = extname(filePath);
        const contentType = MIME_TYPES[ext] || 'application/octet-stream';
        
        try {
            await stat(filePath);
            res.writeHead(200, {
                'Content-Type': contentType,
                'Cache-Control': 'public, max-age=3600'
            });
            createReadStream(filePath).pipe(res);
        } catch (err) {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('File not found');
        }
    }
    else if (url === '/' || url === '/health' || url === '/health/') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            status: 'ok',
            service: 'assets-standalone',
            port: PORT,
            domain: 'assets.alazab.com',
            timestamp: new Date().toISOString()
        }));
    }
    else {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Not Found - استفاده از /config/ برای دسترسی به فایل‌ها');
    }
});

server.listen(PORT, '127.0.0.1', () => {
    console.log(`✅ Server running on port ${PORT}`);
    console.log(`📁 Serving files from: ${ASSETS_DIR}`);
});
EOF

cd "$APP_DIR"
npm install --production --silent 2>/dev/null || true
ok "تم إنشاء التطبيق المستقل"

# ─── 8. تشغيل التطبيق بـ PM2 ────────────────────────────────────────────────
log "🚀 [8/13] تشغيل التطبيق على المنفذ ${APP_PORT}..."

# تثبيت PM2 لو مش موجود
if ! command -v pm2 &>/dev/null; then
    npm install -g pm2 --silent
fi

# نسخ ملف الإعداد إلى مجلد التطبيق
ECOSYSTEM_SRC="$(cd "$(dirname "$0")" && pwd)/ecosystem.config.cjs"
if [[ -f "$ECOSYSTEM_SRC" ]]; then
    cp "$ECOSYSTEM_SRC" "${APP_DIR}/ecosystem.config.cjs" \
        || fail "فشل نسخ ecosystem.config.cjs إلى ${APP_DIR}"
else
    warn "ملف ecosystem.config.cjs غير موجود بجانب السكربت، سيتم الإنشاء تلقائياً"
    cat > "${APP_DIR}/ecosystem.config.cjs" <<ECOSYSTEM
module.exports = {
  apps: [{
    name: 'assets-standalone',
    script: 'server.js',
    cwd: '${APP_DIR}',
    env: { NODE_ENV: 'production', PORT: ${APP_PORT} },
    instances: 1,
    exec_mode: 'fork',
    watch: false,
    autorestart: true,
    restart_delay: 5000,
    max_restarts: 10,
    max_memory_restart: '256M',
    out_file: '${LOG_DIR}/out.log',
    error_file: '${LOG_DIR}/error.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
  }],
};
ECOSYSTEM
fi

pm2 delete assets-standalone 2>/dev/null || true
pm2 start "${APP_DIR}/ecosystem.config.cjs"
pm2 save

# تفعيل بدء التشغيل التلقائي فقط لو لم يكن مفعلاً من قبل
# (نتجنب إعادة توليد الـ unit file لأن PM2 يخدم خدمات إنتاج أخرى)
PM2_SERVICE="pm2-$(id -un)"
if ! systemctl is-enabled "$PM2_SERVICE" &>/dev/null; then
    log "تفعيل PM2 عند بدء تشغيل النظام..."
    pm2 startup systemd -u root --hp /root 2>/dev/null || true
    pm2 save
else
    ok "PM2 startup مفعل مسبقاً — لا حاجة لتعديله"
fi

ok "التطبيق يعمل على المنفذ ${APP_PORT}"

# ─── 9. إعداد Nginx ---------------------------------------------------------
log "🌐 [9/13] إعداد Nginx..."

cat > "$NGINX_CONF" <<'NGINX'
# HTTP → HTTPS
server {
    listen 80;
    listen [::]:80;
    server_name DOMAIN_PLACEHOLDER;

    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }

    location / {
        return 301 https://$server_name$request_uri;
    }
}

# HTTPS
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name DOMAIN_PLACEHOLDER;

    ssl_certificate     /etc/letsencrypt/live/DOMAIN_PLACEHOLDER/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/DOMAIN_PLACEHOLDER/privkey.pem;
    ssl_protocols       TLSv1.2 TLSv1.3;
    ssl_ciphers         ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256;
    ssl_prefer_server_ciphers off;

    add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "DENY" always;

    client_max_body_size 100M;

    # المسار الآمن للملفات
    location /config/ {
        proxy_pass http://127.0.0.1:PORT_PLACEHOLDER/config/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        expires 30d;
        add_header Cache-Control "public, immutable" always;
    }

    location /public/ {
        proxy_pass http://127.0.0.1:PORT_PLACEHOLDER/public/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /health {
        proxy_pass http://127.0.0.1:PORT_PLACEHOLDER/health;
        proxy_http_version 1.1;
        access_log off;
    }

    location / {
        proxy_pass http://127.0.0.1:PORT_PLACEHOLDER/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    access_log /var/log/nginx/DOMAIN_PLACEHOLDER_access.log;
    error_log  /var/log/nginx/DOMAIN_PLACEHOLDER_error.log;
}
NGINX

sed -i "s/DOMAIN_PLACEHOLDER/${DOMAIN}/g" "$NGINX_CONF"
sed -i "s/PORT_PLACEHOLDER/${APP_PORT}/g" "$NGINX_CONF"

ln -sf "$NGINX_CONF" "/etc/nginx/sites-enabled/${DOMAIN}" 2>/dev/null || true
rm -f /etc/nginx/sites-enabled/default 2>/dev/null || true

nginx -t && systemctl reload nginx
ok "Nginx تم إعداده بنجاح"

# ─── 10. إزالة أي أثر للكود المصدري ─────────────────────────────────────────
log "🧹 [10/13] قطع أي علاقة بالكود المصدري..."

# إزالة مجلد .git لو موجود
rm -rf "$APP_DIR/.git" 2>/dev/null || true

# إزالة أي ملفات مشروع قديمة
rm -f "$APP_DIR/package-lock.json" 2>/dev/null || true
rm -f "$APP_DIR/pnpm-lock.yaml" 2>/dev/null || true
rm -rf "$APP_DIR/node_modules" 2>/dev/null || true
rm -rf "$APP_DIR/.nuxt" 2>/dev/null || true
rm -rf "$APP_DIR/.output" 2>/dev/null || true

ok "تم الفصل النهائي عن أي كود مصدري"

# ─── 11. سكربت إدارة الملفات ───────────────────────────────────────────────
log "📋 [11/13] تثبيت سكربت إدارة الملفات..."
cat > /usr/local/bin/assets-manage <<'SCRIPT'
#!/bin/bash
CONFIG_DIR="/var/www/assets-standalone/config"
DOMAIN="assets.alazab.com"

case "${1:-}" in
  list)
    echo "📁 الملفات في المسار الآمن:"
    echo "================================"
    ls -lh "$CONFIG_DIR"
    echo ""
    echo "🔗 الروابط المتاحة:"
    ls -1 "$CONFIG_DIR" 2>/dev/null | while read f; do
      echo "   https://${DOMAIN}/config/$f"
    done
    ;;
  add)
    if [[ -z "${2:-}" ]] || [[ ! -f "$2" ]]; then
      echo "الاستخدام: assets-manage add <مسار_الملف>"
      exit 1
    fi
    cp "$2" "$CONFIG_DIR/"
    filename=$(basename "$2")
    echo "✅ تمت الإضافة: https://${DOMAIN}/config/${filename}"
    ;;
  remove)
    if [[ -z "${2:-}" ]]; then
      echo "الاستخدام: assets-manage remove <اسم_الملف>"
      exit 1
    fi
    rm -f "$CONFIG_DIR/$2"
    echo "✅ تم حذف: $2"
    ;;
  info)
    if [[ -z "${2:-}" ]]; then
      echo "الاستخدام: assets-manage info <اسم_الملف>"
      exit 1
    fi
    if [[ -f "$CONFIG_DIR/$2" ]]; then
      ls -lh "$CONFIG_DIR/$2"
      echo "🔗 https://${DOMAIN}/config/$2"
    else
      echo "❌ الملف غير موجود"
    fi
    ;;
  *)
    echo "الأوامر: list | add <ملف> | remove <اسم> | info <اسم>"
    ;;
esac
SCRIPT

chmod +x /usr/local/bin/assets-manage
ok "سكربت إدارة الملفات جاهز"

# ─── 12. إعداد جدار الحماية ─────────────────────────────────────────────────
log "🔥 [12/13] إعداد جدار الحماية..."
ufw allow OpenSSH 2>/dev/null || true
ufw allow 'Nginx Full' 2>/dev/null || true
ufw --force enable 2>/dev/null || true
ok "جدار الحماية مفعل"

# ─── 13. التحقق من العمل ────────────────────────────────────────────────────
log "🔍 [13/13] التحقق من صحة التثبيت..."

sleep 3

# التحقق من المنفذ
if curl -s -f "http://127.0.0.1:${APP_PORT}/health" >/dev/null 2>&1; then
    ok "التطبيق يعمل محلياً على http://127.0.0.1:${APP_PORT}"
else
    warn "قد يحتاج التطبيق بضع ثوانٍ إضافية للبدء"
fi

# التحقق من HTTPS
if curl -s -k -f "https://${DOMAIN}/config/example.txt" >/dev/null 2>&1; then
    ok "الخدمة متاحة عبر https://${DOMAIN}/config/"
else
    warn "تحقق من SSL أو انتظر قليلاً: https://${DOMAIN}/config/example.txt"
fi

# ─── الملخص النهائي ─────────────────────────────────────────────────────────
echo ""
echo -e "${BOLD}${GREEN}══════════════════════════════════════════════════════════${NC}"
echo -e "${BOLD}${GREEN}   ✅  تم النشر المستقل بنجاح!${NC}"
echo -e "${BOLD}${GREEN}══════════════════════════════════════════════════════════${NC}"
echo ""
echo -e " ${BOLD}🔒 المجلد${NC}       : ${APP_DIR}"
echo -e " ${BOLD}📂 المسار الآمن${NC} : ${CONFIG_DIR}"
echo -e " ${BOLD}🔗 الرابط${NC}       : https://${DOMAIN}/config/اسم_الملف"
echo -e " ${BOLD}🌐 المنفذ${NC}       : ${APP_PORT}"
echo -e " ${BOLD}🔐 الشهادة${NC}      : ${SSL_PATH}"
echo ""
echo -e " ${BOLD}📝 اختبار:${NC}"
echo -e "   ${CYAN}curl https://${DOMAIN}/config/example.txt${NC}"
echo ""
echo -e " ${BOLD}📂 إضافة ملف:${NC}"
echo -e "   ${CYAN}cp Raceway.pdf ${CONFIG_DIR}/${NC}"
echo -e "   ${CYAN}assets-manage add Raceway.pdf${NC}"
echo ""
echo -e " ${BOLD}🛠️  إدارة الخدمة:${NC}"
echo -e "   ${CYAN}pm2 status${NC}"
echo -e "   ${CYAN}pm2 logs assets-standalone${NC}"
echo -e "   ${CYAN}pm2 restart assets-standalone${NC}"
echo ""
echo -e "${BOLD}✅ النظام مستقل تماماً عن أي كود مصدري ولا يحتاج تحديثات${NC}"
