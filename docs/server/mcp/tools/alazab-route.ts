import { z } from 'zod'
import { getKB, routeMessage } from '../../utils/alazab-kb'

export default defineMcpTool({
  description: `وجّه رسالة عميل أو داخلية للعلامة التجارية الصحيحة داخل مجموعة العزب.

متى تستخدم هذه الأداة:
- عند استقبال رسالة من عميل وتحتاج تحديد القسم الأنسب
- للتصنيف التلقائي للطلبات بين العلامات التجارية
- عند بناء مسارات توجيه ذكية

العلامات المتاحة:
- alazab_group — مشاريع عامة وتوجيه أولي
- brand_identity — تجهيز مساحات تجارية وفروع
- luxury_finishing — تشطيبات سكنية راقية
- uberfix — صيانة وإدارة مرافق
- laban_alasfour — توريدات وخامات معمارية

الإخراج: العلامة المقترحة، مستوى الثقة، الدرجات لكل علامة، والإجراء المقترح التالي.`,
  annotations: {
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: false,
    openWorldHint: false,
  },
  inputSchema: {
    message: z.string().describe('رسالة العميل أو النص المراد تصنيفه وتوجيهه'),
  },
  inputExamples: [
    { message: 'عندي عطل في التكييف في الفرع وعاوز أسجل طلب صيانة' },
    { message: 'أريد تجهيز فرع جديد لسلسلة مطاعمي' },
    { message: 'ما الفرق بين هوية العلامة التجارية والتشطيب الراقي؟' },
  ],
  handler: async ({ message }) => {
    const kb = await getKB()
    return routeMessage(kb, message)
  },
})
