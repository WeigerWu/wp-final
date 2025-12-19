import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '使用條款 | I\'m cooked',
  description: 'I\'m cooked 食譜分享平台的使用條款與服務協議',
}

export default function TermsPage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mx-auto max-w-4xl">
        <h1 className="mb-8 text-4xl font-bold">使用條款</h1>
        <p className="mb-8 text-sm text-gray-600">
          最後更新日期：{new Date().toLocaleDateString('zh-TW', { year: 'numeric', month: 'long', day: 'numeric' })}
        </p>

        <div className="space-y-8">
          <section className="rounded-lg bg-white p-8 shadow-sm">
            <h2 className="mb-4 text-2xl font-semibold">1. 接受條款</h2>
            <p className="leading-relaxed text-gray-700">
              歡迎使用 I'm cooked（以下簡稱「本平台」）。使用本平台即表示您同意遵守本使用條款。
              如果您不同意這些條款，請勿使用本平台。我們保留隨時修改這些條款的權利，
              修改後的條款將在本頁面公布，繼續使用本平台即視為您接受修改後的條款。
            </p>
          </section>

          <section className="rounded-lg bg-white p-8 shadow-sm">
            <h2 className="mb-4 text-2xl font-semibold">2. 帳號註冊與使用</h2>
            <div className="space-y-4 leading-relaxed text-gray-700">
              <p>
                <strong>2.1 註冊義務</strong><br />
                您必須提供真實、準確、完整的註冊資訊。您有責任保護您的帳號密碼，並對帳號下的所有活動負責。
              </p>
              <p>
                <strong>2.2 帳號限制</strong><br />
                每個使用者只能註冊一個帳號。禁止創建多個帳號以規避平台限制或進行不當行為。
              </p>
              <p>
                <strong>2.3 帳號安全</strong><br />
                若發現未經授權使用您的帳號，請立即通知我們。我們不對因未經授權使用您的帳號而造成的損失負責。
              </p>
            </div>
          </section>

          <section className="rounded-lg bg-white p-8 shadow-sm">
            <h2 className="mb-4 text-2xl font-semibold">3. 內容規範</h2>
            <div className="space-y-4 leading-relaxed text-gray-700">
              <p>
                <strong>3.1 使用者內容</strong><br />
                您對您在本平台上發布的所有內容（包括但不限於食譜、圖片、評論）擁有所有權或使用權。
                您授權本平台使用、展示、修改和分發這些內容。
              </p>
              <p>
                <strong>3.2 禁止內容</strong><br />
                您不得發布以下內容：
              </p>
              <ul className="ml-6 list-disc space-y-2">
                <li>侵犯他人智慧財產權、隱私權或其他權利的內容</li>
                <li>虛假、誤導性或欺詐性的內容</li>
                <li>色情、暴力、仇恨言論或歧視性內容</li>
                <li>垃圾訊息、廣告或未經授權的商業內容</li>
                <li>惡意程式碼、病毒或其他有害內容</li>
                <li>違反法律法規的內容</li>
              </ul>
              <p>
                <strong>3.3 內容審核</strong><br />
                我們保留審核、編輯、刪除或拒絕發布任何不符合本條款內容的權利。
              </p>
            </div>
          </section>

          <section className="rounded-lg bg-white p-8 shadow-sm">
            <h2 className="mb-4 text-2xl font-semibold">4. 智慧財產權</h2>
            <div className="space-y-4 leading-relaxed text-gray-700">
              <p>
                <strong>4.1 平台內容</strong><br />
                本平台的所有內容（包括但不限於文字、圖片、標誌、設計）均受智慧財產權保護，
                未經授權不得複製、轉載或商業使用。
              </p>
              <p>
                <strong>4.2 使用者內容</strong><br />
                您保留對您發布內容的所有權。但您授予本平台非獨家的、全球性的、免版稅的許可，
                允許我們使用、展示、修改和分發這些內容。
              </p>
              <p>
                <strong>4.3 侵權通知</strong><br />
                如果您認為本平台上的內容侵犯了您的智慧財產權，請立即聯絡我們。
              </p>
            </div>
          </section>

          <section className="rounded-lg bg-white p-8 shadow-sm">
            <h2 className="mb-4 text-2xl font-semibold">5. 免責聲明</h2>
            <div className="space-y-4 leading-relaxed text-gray-700">
              <p>
                <strong>5.1 內容準確性</strong><br />
                本平台上的食譜和內容由使用者提供，我們不對內容的準確性、完整性或實用性作任何保證。
                使用任何食譜或內容的風險由您自行承擔。
              </p>
              <p>
                <strong>5.2 食品安全</strong><br />
                請注意食物過敏、食品安全和衛生問題。我們不對因使用本平台上的食譜而導致的任何健康問題負責。
              </p>
              <p>
                <strong>5.3 服務中斷</strong><br />
                我們不保證本平台的服務不會中斷，也不對因服務中斷造成的損失負責。
              </p>
            </div>
          </section>

          <section className="rounded-lg bg-white p-8 shadow-sm">
            <h2 className="mb-4 text-2xl font-semibold">6. 終止服務</h2>
            <p className="leading-relaxed text-gray-700">
              我們保留在任何時候終止或暫停您的帳號和服務的權利，無需事先通知，
              特別是在您違反本使用條款的情況下。終止後，您將無法繼續使用本平台。
            </p>
          </section>

          <section className="rounded-lg bg-white p-8 shadow-sm">
            <h2 className="mb-4 text-2xl font-semibold">7. 爭議解決</h2>
            <p className="leading-relaxed text-gray-700">
              本使用條款受中華民國法律管轄。因本條款引起的任何爭議，
              雙方應本著誠信原則協商解決；協商不成的，應提交至有管轄權的法院解決。
            </p>
          </section>

          <section className="rounded-lg bg-white p-8 shadow-sm">
            <h2 className="mb-4 text-2xl font-semibold">8. 聯絡我們</h2>
            <p className="leading-relaxed text-gray-700">
              如果您對本使用條款有任何疑問，請透過
              <a href="/contact" className="text-primary-600 hover:underline">聯絡我們</a>
              頁面與我們取得聯繫。
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}

