# 關閉 Supabase Email 確認功能（測試期間）

## 為什麼需要關閉？

如果 Supabase 啟用了 Email 確認功能，新註冊的用戶必須：
1. 註冊帳號
2. 接收確認郵件
3. 點擊確認連結
4. 才能登入

這在開發和測試期間很不方便，建議暫時關閉。

## 如何關閉

### 步驟 1: 前往 Supabase Dashboard

1. 登入 [Supabase Dashboard](https://supabase.com/dashboard)
2. 選擇您的項目

### 步驟 2: 前往 Authentication 設置

1. 點擊左側選單的 **Authentication** (認證)
2. 點擊 **Providers** (提供商)
3. 找到 **Email** provider
4. 點擊 **Email** 或展開設置

### 步驟 3: 關閉 Email 確認

1. 找到 **Confirm email** 選項
2. **取消勾選** "Confirm email"
3. 點擊 **Save** (保存)

## 圖片說明

```
Supabase Dashboard
└── Authentication
    └── Providers
        └── Email
            └── [ ] Confirm email  ← 取消勾選這個
            └── [Save]             ← 點擊保存
```

## 驗證設置已關閉

1. **註冊新用戶** - 應該可以立即登入，不需要確認郵件
2. **登入測試** - 現有用戶應該可以正常登入
3. **檢查錯誤** - 不應該再出現 "Email not confirmed" 錯誤

## 注意事項

⚠️ **重要**：Email 確認是一個重要的安全功能，在生產環境中應該保持啟用。

- **開發/測試期間**：可以關閉，方便測試
- **生產環境**：應該啟用，確保用戶 Email 有效性

## 如果無法關閉 Email 確認

如果因為某些原因無法關閉 Email 確認，可以使用以下方法：

### 方法 1: 手動確認用戶 Email

在 **Supabase Dashboard > SQL Editor** 執行：

```sql
-- 手動確認所有用戶的 Email
UPDATE auth.users
SET email_confirmed_at = NOW()
WHERE email_confirmed_at IS NULL;
```

⚠️ **注意**：這會確認所有未確認的用戶，僅用於開發測試。

### 方法 2: 使用確認連結

1. 檢查註冊時的郵件收件匣（如果在開發環境有設置郵件服務）
2. 點擊確認連結
3. 然後登入

### 方法 3: 使用 Supabase Dashboard

1. 前往 **Authentication** > **Users**
2. 找到要確認的用戶
3. 點擊用戶進入詳情頁
4. 手動設置 `email_confirmed_at` 為當前時間

## 重新啟用 Email 確認

當測試完成，準備上線時：

1. 前往 **Authentication** > **Providers** > **Email**
2. **勾選** "Confirm email"
3. 點擊 **Save**

這樣新註冊的用戶就需要確認 Email 才能登入了。

## 相關功能

如果您關閉了 Email 確認，也可以考慮：

- **設置 Email 模板** - 自定義註冊歡迎郵件
- **設置重設密碼** - 如果用戶忘記密碼
- **設置 OAuth 登入** - 使用 Google/GitHub 等第三方登入

## 常見問題

### Q: 關閉 Email 確認後，現有用戶還是無法登入？

A: 已存在的用戶可能已經標記為未確認。執行上面的 SQL 來手動確認所有用戶。

### Q: 如何在代碼中處理 Email 確認？

A: 已更新的登入頁面會自動處理 Email 未確認的情況，並提供重新發送確認郵件的選項。

### Q: 關閉後還能接收註冊通知郵件嗎？

A: 可以，註冊郵件和確認郵件是分開的。關閉確認只是不需要點擊確認連結。

