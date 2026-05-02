import { z } from 'zod'
import { getKB, contextPack } from '../../utils/alazab-kb'

export default defineMcpTool({
  description: `ابنِ حزمة سياق شاملة تجمع نتائج البحث، الأسئلة الشائعة، ومسار التوجيه لسؤال أو طلب بعينه.

متى تستخدم هذه الأداة:
- قبل الإجابة على سؤال عميل لجمع كل السياق اللازم دفعة واحدة
- عند بناء ردود مستندة لقاعدة المعرفة الفعلية
- لتزويد نموذج الذكاء الاصطناعي بسياق غني ومنظم

الإخراج: حزمة تحتوي على نتائج البحث + أسئلة شائعة ذات صلة + مسار التوجيه + قواعد الإجابة.`,
  annotations: {
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: false,
  },
  inputSchema: {
    query: z.string().describe('السؤال أو الطلب المراد بناء السياق له'),
    brand: z.enum(['all', 'alazab_group', 'brand_identity', 'luxury_finishing', 'uberfix', 'laban_alasfour'])
      .optional()
      .default('all')
      .describe('تضييق البحث لعلامة تجارية محددة (اختياري)'),
    limit: z.number().min(1).max(12).optional().default(8).describe('الحد الأقصى لنتائج البحث في الحزمة'),
  },
  inputExamples: [
    { query: 'أريد تجهيز فرع مطعم من الألف إلى الياء', brand: 'brand_identity' },
    { query: 'كيف أسجل شكوى صيانة وأتابعها' },
    { query: 'ما هي خدمات مجموعة العزب' },
  ],
  cache: '15m',
  handler: async ({ query, brand, limit }) => {
    const kb = await getKB()
    return contextPack(kb, query, brand, limit)
  },
})
