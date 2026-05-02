import { z } from 'zod'
import { getKB, searchKB } from '../../utils/alazab-kb'

export default defineMcpTool({
  description: `ابحث في قاعدة معرفة مجموعة العزب الفعلية وأرجع مقتطفات مرتبطة بالمصدر.

متى تستخدم هذه الأداة:
- عندما يسأل المستخدم عن خدمات أو علامات تجارية لمجموعة العزب
- للبحث عن معلومات محددة في قاعدة المعرفة
- لاسترجاع محتوى مرتبط من الوثائق المصدرية

الإخراج: قائمة بالمقتطفات المرتبطة مع مسارات المصادر ومستويات الأهمية.`,
  annotations: {
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: false,
  },
  inputSchema: {
    query: z.string().describe('الاستعلام للبحث في قاعدة المعرفة'),
    brand: z.enum(['all', 'alazab_group', 'brand_identity', 'luxury_finishing', 'uberfix', 'laban_alasfour'])
      .optional()
      .default('all')
      .describe('تصفية النتائج حسب العلامة التجارية'),
    limit: z.number().min(1).max(20).optional().default(8).describe('الحد الأقصى لعدد النتائج'),
  },
  inputExamples: [
    { query: 'خدمات الصيانة', brand: 'uberfix', limit: 5 },
    { query: 'تجهيز فروع تجارية', brand: 'brand_identity' },
    { query: 'ما هي مجموعة العزب' },
  ],
  cache: '15m',
  handler: async ({ query, brand, limit }) => {
    const kb = await getKB()
    return searchKB(kb, query, brand, limit)
  },
})
