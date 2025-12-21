# 使用 Supabase Admin API 創建用戶

由於直接插入 `auth.users` 表可能導致認證失敗，建議使用 Supabase Admin API 來創建用戶。

## 方法一：使用 Supabase Dashboard

1. 進入 Supabase Dashboard
2. 導航到 Authentication > Users
3. 手動添加用戶（推薦僅用於測試少量用戶）

## 方法二：使用 Supabase Admin API（推薦）

創建一個 Node.js 腳本來批量創建用戶：

```javascript
// create-users.js
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'YOUR_SUPABASE_URL';
const supabaseServiceKey = 'YOUR_SERVICE_ROLE_KEY'; // 注意：使用 service_role key，不要暴露在前端

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const users = [
  { username: 'Chaewon', email: 'chaewon@example.com', password: 'password123', display_name: 'Chaewon', bio: '熱愛烹飪的料理達人' },
  { username: 'Yujin', email: 'yujin@example.com', password: 'password123', display_name: 'Yujin', bio: '分享美味食譜的美食愛好者' },
  { username: 'Karina', email: 'karina@example.com', password: 'password123', display_name: 'Karina', bio: '專業廚師，專注於創意料理' },
  // ... 其他用戶
];

async function createUsers() {
  for (const user of users) {
    try {
      // 使用 admin API 創建用戶
      const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
        email: user.email,
        password: user.password,
        email_confirm: true, // 自動確認 email
        user_metadata: {
          username: user.username
        }
      });

      if (authError) {
        console.error(`Error creating auth user ${user.email}:`, authError);
        continue;
      }

      // 創建 profile
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: authUser.user.id,
          username: user.username,
          display_name: user.display_name,
          bio: user.bio
        });

      if (profileError) {
        console.error(`Error creating profile for ${user.email}:`, profileError);
      } else {
        console.log(`✅ Created user: ${user.email}`);
      }
    } catch (error) {
      console.error(`Error processing user ${user.email}:`, error);
    }
  }
}

createUsers();
```

## 方法三：修正 SQL 腳本（如果必須使用 SQL）

如果必須使用 SQL，需要確保使用 Supabase 認可的密碼哈希格式。但這通常不推薦，因為：

1. Supabase 的密碼哈希格式可能在不同版本間變化
2. 直接操作 `auth.users` 表可能導致安全問題
3. 可能破壞 Supabase 的內部機制

