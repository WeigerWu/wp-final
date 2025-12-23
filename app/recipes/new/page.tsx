import { RecipeUploadForm } from '@/components/recipes/RecipeUploadForm'

export default function NewRecipePage() {
  // 讓客戶端組件處理登入檢查和提示
  // 這樣用戶可以看到友好的提示信息，而不是直接被重定向
  return <RecipeUploadForm />
}


