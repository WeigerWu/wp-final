# 使用者追蹤系統 - 快速開始

## 🎯 5 分鐘快速設定

### 1. 安裝 GA4（可選，但建議）

```bash
# 套件已安裝，只需設定環境變數
```

在 `.env.local` 中加入：
```env
NEXT_PUBLIC_GA4_MEASUREMENT_ID=G-XXXXXXXXXX
```

### 2. 設定資料庫

在 Supabase SQL Editor 執行：
```sql
-- 執行 supabase/user-events-schema.sql
```

### 3. 設定管理員（可選）

在 `.env.local` 中加入：
```env
ADMIN_USER_IDS=your-user-id-here
```

### 4. 完成！

系統會自動開始追蹤所有使用者活動。

## 📍 重要檔案位置

- **後台管理**: `/admin/events`
- **資料庫 Schema**: `supabase/user-events-schema.sql`
- **設定文件**: `docs/ANALYTICS_SETUP.md`

## ✅ 驗證設定

1. **GA4**: 訪問網站，檢查 GA4 DebugView
2. **自建系統**: 訪問 `/admin/events`（需管理員權限）
3. **事件追蹤**: 執行任何操作（建立食譜、收藏等），檢查後台是否有記錄

## 🆘 需要幫助？

查看完整文件：`docs/ANALYTICS_SETUP.md`

