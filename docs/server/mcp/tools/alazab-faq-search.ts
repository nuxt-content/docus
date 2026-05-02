import { z } from 'zod'
import { getKB, faqSearch } from '../../utils/alazab-kb'

export default defineMcpTool({
  description: `ابحث في الأسئلة الشائعة العربية المستخرجة من قاعدة معرفة مجموعة العزب.

متى تستخدم هذه الأداة:
- عندما يطرح المستخدم أسئلة شائعة عن خدمات المجموعة
- للعثور على إجابات جاهزة من قاعدة المعرفة
- عند الحاجة لتقديم إجابات سريعة ومباشرة

الإخراج: قائمة بالأسئلة والإجابات المرتبة حسب الصلة.`,
  annotations: {
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: false,
  },
  inputSchema: {
    query: z.string().optional().describe('الاستعلام للبحث في الأسئلة الشائعة (اختياري — بدونه يُرجع جميع الأسئلة)'),
    limit: z.number().min(1).max(20).optional().default(6).describe('الحد الأقصى لعدد النتائج'),
  },
  inputExamples: [
    { query: 'كيف أسجل طلب صيانة', limit: 3 },
    { query: 'ما هي العلامات التجارية' },
    {},
  ],
  cache: '30m',
  handler: async ({ query, limit }) => {
    const kb = await getKB()
    return faqSearch(kb, query ?? '', limit)
  },
})
