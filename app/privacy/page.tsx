import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '隱私政策 | I\'m cooked',
  description: 'I\'m cooked 食譜分享平台的隱私政策與資料保護聲明',
}

export default function PrivacyPage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mx-auto max-w-4xl">
        <h1 className="mb-8 text-4xl font-bold">隱私政策</h1>
        <p className="mb-8 text-sm text-gray-600">
          最後更新日期：{new Date().toLocaleDateString('zh-TW', { year: 'numeric', month: 'long', day: 'numeric' })}
        </p>

        <div className="space-y-8">
          <section className="rounded-lg bg-white p-8 shadow-sm">
            <h2 className="mb-4 text-2xl font-semibold">1. 簡介</h2>
            <p className="leading-relaxed text-gray-700">
              I'm cooked（以下簡稱「我們」或「本平台」）重視您的隱私權。
              本隱私政策說明我們如何收集、使用、儲存和保護您的個人資料。
              使用本平台即表示您同意本隱私政策的內容。如果您不同意，請勿使用本平台。
            </p>
          </section>

          <section className="rounded-lg bg-white p-8 shadow-sm">
            <h2 className="mb-4 text-2xl font-semibold">2. 我們收集的資料</h2>
            <div className="space-y-4 leading-relaxed text-gray-700">
              <p>
                <strong>2.1 您主動提供的資料</strong>
              </p>
              <ul className="ml-6 list-disc space-y-2">
                <li>註冊資訊：電子郵件地址、使用者名稱、密碼</li>
                <li>個人資料：個人檔案、大頭貼、個人簡介</li>
                <li>內容資料：您發布的食譜、圖片、評論、評分</li>
                <li>聯絡資訊：透過聯絡表單提供的姓名、電子郵件、訊息內容</li>
              </ul>
              
              <p>
                <strong>2.2 自動收集的資料</strong>
              </p>
              <ul className="ml-6 list-disc space-y-2">
                <li>裝置資訊：IP 位址、瀏覽器類型、作業系統</li>
                <li>使用資料：頁面瀏覽記錄、點擊行為、停留時間</li>
                <li>Cookie 和類似技術：用於改善使用者體驗和分析</li>
                <li>位置資料：根據 IP 位址推斷的大致地理位置</li>
              </ul>
            </div>
          </section>

          <section className="rounded-lg bg-white p-8 shadow-sm">
            <h2 className="mb-4 text-2xl font-semibold">3. 資料使用目的</h2>
            <div className="space-y-4 leading-relaxed text-gray-700">
              <p>我們使用您的個人資料用於以下目的：</p>
              <ul className="ml-6 list-disc space-y-2">
                <li>提供、維護和改善本平台的服務</li>
                <li>處理您的註冊、登入和帳號管理</li>
                <li>顯示您的個人檔案和您發布的內容</li>
                <li>提供個人化的內容推薦和搜尋結果</li>
                <li>與您溝通，包括服務通知、更新和安全警示</li>
                <li>分析使用情況以改善平台功能和體驗</li>
                <li>偵測、預防和處理技術問題、詐欺或安全威脅</li>
                <li>遵守法律義務和執行我們的權利</li>
              </ul>
            </div>
          </section>

          <section className="rounded-lg bg-white p-8 shadow-sm">
            <h2 className="mb-4 text-2xl font-semibold">4. 資料分享與揭露</h2>
            <div className="space-y-4 leading-relaxed text-gray-700">
              <p>
                <strong>4.1 公開資料</strong><br />
                您選擇在本平台上公開的資訊（如使用者名稱、個人檔案、食譜內容）將對所有使用者可見。
              </p>
              <p>
                <strong>4.2 第三方服務提供者</strong><br />
                我們可能與以下第三方服務提供者分享資料：
              </p>
              <ul className="ml-6 list-disc space-y-2">
                <li>雲端服務提供者（用於資料儲存和處理）</li>
                <li>分析服務提供者（用於網站分析和統計）</li>
                <li>電子郵件服務提供者（用於發送通知）</li>
                <li>圖片儲存服務提供者（用於儲存上傳的圖片）</li>
              </ul>
              <p>
                <strong>4.3 法律要求</strong><br />
                在法律要求或為了保護我們的權利、財產或安全的情況下，我們可能會揭露您的資料。
              </p>
            </div>
          </section>

          <section className="rounded-lg bg-white p-8 shadow-sm">
            <h2 className="mb-4 text-2xl font-semibold">5. 資料安全</h2>
            <div className="space-y-4 leading-relaxed text-gray-700">
              <p>
                我們採取合理的技術和管理措施來保護您的個人資料安全，包括：
              </p>
              <ul className="ml-6 list-disc space-y-2">
                <li>使用加密技術保護資料傳輸和儲存</li>
                <li>實施存取控制和身份驗證機制</li>
                <li>定期進行安全審計和漏洞檢測</li>
                <li>限制員工和服務提供者的資料存取權限</li>
              </ul>
              <p>
                然而，沒有任何系統是完全安全的。雖然我們努力保護您的資料，
                但無法保證絕對安全，您使用本平台的風險需自行承擔。
              </p>
            </div>
          </section>

          <section className="rounded-lg bg-white p-8 shadow-sm">
            <h2 className="mb-4 text-2xl font-semibold">6. Cookie 和類似技術</h2>
            <div className="space-y-4 leading-relaxed text-gray-700">
              <p>
                我們使用 Cookie 和類似的追蹤技術來改善您的使用體驗、記住您的偏好設定、
                分析網站流量和提供個人化內容。
              </p>
              <p>
                您可以透過瀏覽器設定來管理或刪除 Cookie。但請注意，
                停用 Cookie 可能會影響本平台的某些功能。
              </p>
            </div>
          </section>

          <section className="rounded-lg bg-white p-8 shadow-sm">
            <h2 className="mb-4 text-2xl font-semibold">7. 您的權利</h2>
            <div className="space-y-4 leading-relaxed text-gray-700">
              <p>根據適用法律，您對您的個人資料享有以下權利：</p>
              <ul className="ml-6 list-disc space-y-2">
                <li><strong>存取權：</strong>要求查看我們持有的您的個人資料</li>
                <li><strong>更正權：</strong>要求更正不準確或不完整的資料</li>
                <li><strong>刪除權：</strong>要求刪除您的個人資料</li>
                <li><strong>限制處理權：</strong>要求限制我們對您資料的處理</li>
                <li><strong>資料可攜權：</strong>要求以結構化格式提供您的資料</li>
                <li><strong>反對權：</strong>反對我們對您資料的某些處理方式</li>
              </ul>
              <p>
                要行使這些權利，請透過
                <a href="/contact" className="text-primary-600 hover:underline">聯絡我們</a>
                頁面與我們聯繫。我們將在合理時間內回應您的請求。
              </p>
            </div>
          </section>

          <section className="rounded-lg bg-white p-8 shadow-sm">
            <h2 className="mb-4 text-2xl font-semibold">8. 資料保留</h2>
            <p className="leading-relaxed text-gray-700">
              我們會保留您的個人資料，直到您要求刪除或我們不再需要這些資料為止。
              即使您刪除帳號，某些資料可能會因法律要求或合法的商業目的而保留一段時間。
              刪除的資料將在合理時間內從我們的系統中移除。
            </p>
          </section>

          <section className="rounded-lg bg-white p-8 shadow-sm">
            <h2 className="mb-4 text-2xl font-semibold">9. 兒童隱私</h2>
            <p className="leading-relaxed text-gray-700">
              本平台不面向 13 歲以下的兒童。我們不會故意收集 13 歲以下兒童的個人資料。
              如果您是家長或監護人，發現您的孩子向我們提供了個人資料，請立即聯絡我們，
              我們將盡快刪除相關資料。
            </p>
          </section>

          <section className="rounded-lg bg-white p-8 shadow-sm">
            <h2 className="mb-4 text-2xl font-semibold">10. 隱私政策變更</h2>
            <p className="leading-relaxed text-gray-700">
              我們可能會不時更新本隱私政策。重大變更將透過電子郵件或在網站上發布公告的方式通知您。
              繼續使用本平台即表示您接受更新後的隱私政策。建議您定期查看本頁面以了解最新資訊。
            </p>
          </section>

          <section className="rounded-lg bg-white p-8 shadow-sm">
            <h2 className="mb-4 text-2xl font-semibold">11. 聯絡我們</h2>
            <p className="leading-relaxed text-gray-700">
              如果您對本隱私政策有任何疑問、意見或投訴，或想行使您的資料保護權利，
              請透過
              <a href="/contact" className="text-primary-600 hover:underline">聯絡我們</a>
              頁面與我們取得聯繫。我們將盡力協助您。
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}



