# دليل نشر قاعدة المعرفة

## قبل النشر
- لا تنشر أي ملف `.env` حقيقي.
- شغّل سكربت التحقق.
- راجع ملفات Rasa داخل بيئة المشروع الفعلية باستخدام `rasa data validate`.

## الدمج مع Rasa Pro
انسخ ملفات `04_rasa/domain/*.yml` إلى مجلد domain/knowledge داخل المشروع.

## الدمج مع RAG
استخدم `07_ingestion/enterprise_knowledge_corpus.jsonl` أو `07_ingestion/enterprise_knowledge_chunks.jsonl` حسب نظام الفهرسة.

## الدمج مع WhatsApp
استخدم الملفات Sanitized فقط، وضع الأسرار داخل Secret Manager.
