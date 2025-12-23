# 調試指南

## 如何使用調試日誌

我已經為你的應用添加了詳細的調試日誌系統。當你在生產環境中遇到問題時，可以通過以下方式查看日誌：

### 1. 在瀏覽器控制台查看

打開瀏覽器的開發者工具（F12），在 Console 標籤頁中，你會看到所有調試日誌。

### 2. 使用全局函數查看日誌

在瀏覽器控制台中，你可以使用以下命令：

```javascript
// 查看所有日誌
__getDebugLogs()

// 查看日誌的 JSON 格式
JSON.stringify(__getDebugLogs(), null, 2)

// 清除日誌
__clearDebugLogs()

// 直接訪問日誌數組
__debugLogs
```

### 3. 導出日誌

你可以將日誌複製並保存：

```javascript
// 在控制台執行
copy(JSON.stringify(__getDebugLogs(), null, 2))
```

然後將內容貼到文件中。

## 日誌包含的信息

日誌會記錄以下組件的詳細信息：

### LoadMoreRecipes 組件
- 組件初始化和渲染次數
- 搜索參數變化
- 狀態更新
- `loadMore` 函數的調用和執行過程
- API 請求的參數和響應

### FilterBar 組件
- 組件渲染次數
- 篩選資料獲取過程
- 用戶點擊篩選條件的操作
- URL 導航

### getRecipesClient 函數
- 函數調用參數
- 查詢執行過程
- 標籤過濾邏輯
- 查詢結果和執行時間

## 測試步驟

1. **構建並啟動應用**：
   ```bash
   npm run build
   npm start
   ```

2. **打開瀏覽器開發者工具**（F12）

3. **訪問探索食譜頁面**：`http://localhost:3000/recipes`

4. **執行以下操作**：
   - 點擊條件篩選中的任何選項
   - 點擊「載入更多」按鈕
   - 觀察控制台中的日誌輸出

5. **複製日誌**：
   在控制台執行：
   ```javascript
   copy(JSON.stringify(__getDebugLogs(), null, 2))
   ```
   然後將內容貼給我

## 日誌格式

每個日誌條目包含：
- `timestamp`: 時間戳
- `level`: 日誌級別（info, warn, error, debug）
- `component`: 組件名稱
- `action`: 操作描述
- `data`: 相關數據
- `error`: 錯誤信息（如果有）

## 常見問題排查

### 如果看到大量重複的日誌
這可能表示組件在無限循環。查看日誌中的 `renderCount` 是否持續增長。

### 如果看到 API 請求但沒有響應
檢查 `getRecipesClient` 的日誌，看看請求是否完成，以及是否有錯誤。

### 如果狀態更新頻繁
查看 `useEffect` 觸發的日誌，檢查依賴項是否正確。

## 注意事項

- 日誌會自動限制在最近 100 條
- 日誌在生產環境中默認啟用（可以通過環境變量 `NEXT_PUBLIC_DEBUG=false` 關閉）
- 日誌不會影響應用的性能，但會增加控制台輸出


