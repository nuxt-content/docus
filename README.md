# قاعدة معرفة مجموعة العزب — Alazab Group Knowledge Base

> منظومة أعمال معمارية وتشغيلية متكاملة: تصميم، تنفيذ، تشطيب راقٍ، تجهيز مساحات تجارية، صيانة ذكية، وتوريدات.

## 🚀 تشغيل الموقع محلياً

```bash
# تثبيت المتطلبات
pnpm install

# تشغيل خادم التطوير
pnpm run dev
```

سيعمل الموقع على `http://localhost:3000`

## 📁 هيكل المحتوى

```
docs/content/ar/          # محتوى اللغة العربية (الرئيسية)
├── index.md              # الصفحة الرئيسية
├── 1.about/
│   └── index.md          # من نحن — مجموعة العزب
├── 2.brands/
│   ├── alazab-group.md   # مجموعة العزب
│   ├── brand-identity.md # هوية العلامة التجارية
│   ├── luxury-finishing.md # التشطيب الراقي
│   ├── uberfix.md        # أوبرفيكس — الصيانة
│   └── laban-alasfour.md # لبن العصفور — التوريدات
├── 3.faq/
│   └── index.md          # الأسئلة الشائعة
└── 4.policies/
    └── index.md          # السياسات والتواصل
```

## ✏️ إضافة صفحة جديدة

1. أنشئ ملف `.md` جديد داخل المجلد المناسب في `docs/content/ar/`
2. أضف رأس الصفحة (frontmatter) في أعلى الملف:
   ```markdown
   ---
   title: عنوان الصفحة
   description: وصف مختصر للصفحة
   ---
   ```
3. اكتب المحتوى بصيغة Markdown تحت الرأس.
4. ستظهر الصفحة تلقائياً في قائمة التنقل.

## 🔢 ترتيب الأقسام والصفحات

يمكن التحكم في ترتيب الأقسام بإضافة رقم قبل اسم المجلد أو الملف:
- `1.about/` يظهر قبل `2.brands/`
- `01.introduction.md` يظهر قبل `02.details.md`

لتخصيص عنوان القسم في القائمة، أضف ملف `.navigation.yml` داخل المجلد:
```yaml
title: اسم القسم في القائمة
icon: i-lucide-icon-name
```

## 🎨 تخصيص الهوية البصرية

- **اسم الموقع وعنوان التبويب:** عدّل `docs/nuxt.config.ts` ← `site.name`
- **الشعار والألوان:** عدّل `docs/app/app.config.ts` ← `header.logo`
- **روابط التذييل والتواصل:** عدّل `docs/app/app.config.ts` ← `toc.bottom.links`
- **أسئلة المساعد:** عدّل `docs/app/app.config.ts` ← `assistant.faqQuestions`
- **CSS وخطوط:** عدّل `docs/app/assets/css/main.css`

## 🖼️ إضافة شعار المؤسسة

ضع ملف الشعار في `docs/public/logo/` ثم حدّث المسارات في `docs/app/app.config.ts`:
```ts
logo: {
  light: '/logo/alazab-logo-dark.svg',
  dark: '/logo/alazab-logo-light.svg',
}
```

## 📞 التواصل والدعم

- **الموقع الرسمي:** [alazab.com](https://alazab.com)
- **جميع الروابط:** [linktr.ee/Alazab.co](https://linktr.ee/Alazab.co)
- **طلب صيانة:** [uberfix.shop/service-request](https://uberfix.shop/service-request)

---

*مبني بـ [Docus](https://docus.dev) — قاعدة معرفة رسمية لمجموعة العزب © 2025*

