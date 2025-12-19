import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '關於我們 | I\'m cooked',
  description: '了解 I\'m cooked 食譜分享平台的使命與願景',
}

export default function AboutPage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mx-auto max-w-4xl">
        <h1 className="mb-8 text-4xl font-bold">關於我們</h1>

        <div className="space-y-8">
          {/* Mission Section */}
          <section className="rounded-lg bg-white p-8 shadow-sm">
            <h2 className="mb-4 text-2xl font-semibold">我們的使命</h2>
            <p className="leading-relaxed text-gray-700">
              I'm cooked 致力於打造一個友善、開放且充滿創意的食譜分享平台。
              我們相信每個人都有獨特的烹飪故事值得分享，無論是家常小菜還是精緻料理，
              都能在這裡找到共鳴與啟發。我們希望透過這個平台，連結全球的烹飪愛好者，
              讓美食文化得以傳承與發揚。
            </p>
          </section>

          {/* Vision Section */}
          <section className="rounded-lg bg-white p-8 shadow-sm">
            <h2 className="mb-4 text-2xl font-semibold">我們的願景</h2>
            <p className="leading-relaxed text-gray-700">
              成為全球最受歡迎的食譜分享社群，讓每個人都能輕鬆地記錄、分享和發現美味食譜。
              我們致力於提供最優質的使用體驗，讓烹飪變得更加簡單、有趣且充滿成就感。
            </p>
          </section>

          {/* Features Section */}
          <section className="rounded-lg bg-white p-8 shadow-sm">
            <h2 className="mb-4 text-2xl font-semibold">平台特色</h2>
            <ul className="space-y-4 text-gray-700">
              <li className="flex items-start">
                <span className="mr-3 text-2xl">🍳</span>
                <div>
                  <h3 className="font-semibold">豐富的食譜庫</h3>
                  <p className="text-sm text-gray-600">
                    收錄來自全球的各式食譜，從傳統家常菜到創意料理，應有盡有
                  </p>
                </div>
              </li>
              <li className="flex items-start">
                <span className="mr-3 text-2xl">👥</span>
                <div>
                  <h3 className="font-semibold">友善的社群</h3>
                  <p className="text-sm text-gray-600">
                    與其他烹飪愛好者互動、交流心得，建立屬於你的烹飪社群
                  </p>
                </div>
              </li>
              <li className="flex items-start">
                <span className="mr-3 text-2xl">⭐</span>
                <div>
                  <h3 className="font-semibold">評價與收藏</h3>
                  <p className="text-sm text-gray-600">
                    為喜歡的食譜評分、收藏，建立你的個人食譜書
                  </p>
                </div>
              </li>
              <li className="flex items-start">
                <span className="mr-3 text-2xl">🔍</span>
                <div>
                  <h3 className="font-semibold">智能搜尋</h3>
                  <p className="text-sm text-gray-600">
                    透過標籤、分類和關鍵字，快速找到你想要的食譜
                  </p>
                </div>
              </li>
              <li className="flex items-start">
                <span className="mr-3 text-2xl">📱</span>
                <div>
                  <h3 className="font-semibold">響應式設計</h3>
                  <p className="text-sm text-gray-600">
                    無論是電腦、平板還是手機，都能流暢使用
                  </p>
                </div>
              </li>
            </ul>
          </section>

          {/* Team Section */}
          <section className="rounded-lg bg-white p-8 shadow-sm">
            <h2 className="mb-4 text-2xl font-semibold">加入我們</h2>
            <p className="leading-relaxed text-gray-700">
              I'm cooked 由一群熱愛烹飪和技術的團隊共同打造。
              我們持續改進平台功能，傾聽用戶的聲音，並致力於提供最佳的服務體驗。
              如果你有任何建議或想法，歡迎隨時與我們聯絡！
            </p>
          </section>

          {/* CTA Section */}
          <section className="rounded-lg bg-primary-50 p-8 text-center">
            <h2 className="mb-4 text-2xl font-semibold">開始你的烹飪之旅</h2>
            <p className="mb-6 text-gray-700">
              加入 I'm cooked，與全球的烹飪愛好者一起分享美味！
            </p>
            <div className="flex justify-center gap-4">
              <a
                href="/recipes/new"
                className="inline-flex items-center justify-center rounded-md bg-primary-600 px-6 py-3 font-medium text-white transition-colors hover:bg-primary-700"
              >
                上傳你的第一個食譜
              </a>
              <a
                href="/contact"
                className="inline-flex items-center justify-center rounded-md border border-primary-600 bg-white px-6 py-3 font-medium text-primary-600 transition-colors hover:bg-primary-50"
              >
                聯絡我們
              </a>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}

