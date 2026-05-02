/**
 * بصمة الإنتاج — Production Build Fingerprint
 * يُسجّل معلومات الإصدار في Console عند تشغيل التطبيق للمرة الأولى.
 */
export default defineNuxtPlugin(() => {
  const { buildInfo } = useRuntimeConfig().public

  // طباعة بصمة الإنتاج في وحدة التحكم (console)
  // eslint-disable-next-line no-console
  console.info(
    `%c مجموعة العزب — قاعدة المعرفة %c\n`
    + ` 📦 الإصدار : ${buildInfo.version}\n`
    + ` 🕐 وقت البناء : ${new Date(buildInfo.time).toLocaleString('ar-EG')}\n`
    + ` 🔖 الكوميت  : ${buildInfo.commit} (${buildInfo.branch})`,
    'background:#1a1a2e;color:#e2b96f;font-weight:bold;padding:4px 8px;border-radius:4px 4px 0 0',
    'background:#16213e;color:#a8b4c0;padding:4px 8px;border-radius:0 0 4px 4px',
  )

  return {
    provide: {
      buildInfo,
    },
  }
})
