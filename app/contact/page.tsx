'use client'

import { useState, FormEvent } from 'react'

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle')

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)
    setSubmitStatus('idle')

    try {
      // 這裡可以整合實際的聯絡表單處理服務
      // 例如：SendGrid, Mailgun, 或 Supabase Edge Functions
      // 目前先模擬提交過程
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // 實際應用中，這裡應該調用 API 端點
      console.log('Contact form submission:', formData)
      
      setSubmitStatus('success')
      setFormData({ name: '', email: '', subject: '', message: '' })
    } catch (error) {
      console.error('Error submitting contact form:', error)
      setSubmitStatus('error')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mx-auto max-w-3xl">
        <h1 className="mb-8 text-4xl font-bold">聯絡我們</h1>

        <div className="grid gap-8 md:grid-cols-2">
          {/* Contact Information */}
          <div className="space-y-6">
            <div className="rounded-lg bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-xl font-semibold">聯絡資訊</h2>
              <div className="space-y-4 text-gray-700">
                <div>
                  <h3 className="mb-1 font-semibold">電子郵件</h3>
                  <a
                    href="mailto:support@imcooked.com"
                    className="text-primary-600 hover:underline"
                  >
                    support@imcooked.com
                  </a>
                </div>
                <div>
                  <h3 className="mb-1 font-semibold">回應時間</h3>
                  <p className="text-sm text-gray-600">
                    我們通常在 24-48 小時內回覆您的訊息
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-lg bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-xl font-semibold">常見問題</h2>
              <div className="space-y-3 text-sm text-gray-700">
                <div>
                  <h3 className="mb-1 font-semibold">如何上傳食譜？</h3>
                  <p className="text-gray-600">
                    請先註冊帳號，然後點擊「上傳食譜」按鈕即可開始創建您的食譜。
                  </p>
                </div>
                <div>
                  <h3 className="mb-1 font-semibold">可以編輯或刪除食譜嗎？</h3>
                  <p className="text-gray-600">
                    可以！您可以隨時編輯或刪除您自己發布的食譜。
                  </p>
                </div>
                <div>
                  <h3 className="mb-1 font-semibold">如何回報問題？</h3>
                  <p className="text-gray-600">
                    請使用下方的聯絡表單，詳細描述您遇到的問題，我們會盡快處理。
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="rounded-lg bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-xl font-semibold">發送訊息</h2>
            
            {submitStatus === 'success' && (
              <div className="mb-4 rounded-md bg-green-50 p-4 text-green-800">
                <p>感謝您的訊息！我們已收到您的來信，會盡快回覆您。</p>
              </div>
            )}

            {submitStatus === 'error' && (
              <div className="mb-4 rounded-md bg-red-50 p-4 text-red-800">
                <p>發送失敗，請稍後再試或直接發送郵件至 support@imcooked.com</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="name" className="mb-1 block text-sm font-medium text-gray-700">
                  姓名 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full rounded-md border border-gray-300 px-4 py-2 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  disabled={isSubmitting}
                />
              </div>

              <div>
                <label htmlFor="email" className="mb-1 block text-sm font-medium text-gray-700">
                  電子郵件 <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full rounded-md border border-gray-300 px-4 py-2 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  disabled={isSubmitting}
                />
              </div>

              <div>
                <label htmlFor="subject" className="mb-1 block text-sm font-medium text-gray-700">
                  主題 <span className="text-red-500">*</span>
                </label>
                <select
                  id="subject"
                  name="subject"
                  required
                  value={formData.subject}
                  onChange={handleChange}
                  className="w-full rounded-md border border-gray-300 px-4 py-2 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  disabled={isSubmitting}
                >
                  <option value="">請選擇主題</option>
                  <option value="general">一般詢問</option>
                  <option value="technical">技術問題</option>
                  <option value="suggestion">功能建議</option>
                  <option value="report">問題回報</option>
                  <option value="other">其他</option>
                </select>
              </div>

              <div>
                <label htmlFor="message" className="mb-1 block text-sm font-medium text-gray-700">
                  訊息內容 <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="message"
                  name="message"
                  required
                  rows={6}
                  value={formData.message}
                  onChange={handleChange}
                  className="w-full rounded-md border border-gray-300 px-4 py-2 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  disabled={isSubmitting}
                  placeholder="請詳細描述您的問題或建議..."
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full rounded-md bg-primary-600 px-6 py-3 font-medium text-white transition-colors hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSubmitting ? '發送中...' : '發送訊息'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}

