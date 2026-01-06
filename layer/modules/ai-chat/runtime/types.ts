export interface FaqCategory {
  category: string
  items: string[]
}

export type FaqQuestions = string[] | FaqCategory[]
export type LocalizedFaqQuestions = Record<string, FaqQuestions>
