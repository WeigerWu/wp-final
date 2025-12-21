-- ============================================
-- 修正用戶密碼的 SQL 腳本
-- 注意：此方法可能仍然無法正常工作，建議使用 Admin API
-- ============================================
-- 這個腳本嘗試為已存在的用戶重置密碼
-- 如果用戶認證失敗，請使用 Supabase Dashboard 或 Admin API 重置密碼
-- ============================================

-- 方法：刪除現有用戶並重新創建（僅用於測試環境）
-- 警告：這會刪除用戶的所有數據！

-- 1. 查看現有用戶
SELECT 
    id,
    email,
    created_at,
    email_confirmed_at
FROM auth.users
WHERE email IN ('chaewon@example.com', 'yujin@example.com', 'karina@example.com');

-- 2. 如果認證失敗，建議手動操作：
--    - 在 Supabase Dashboard > Authentication > Users 中
--    - 找到對應用戶
--    - 點擊 "Reset Password" 或 "Send Password Reset Email"
--    - 或者直接編輯用戶，設置新密碼

-- 3. 或者使用 Supabase Management API 重置密碼
--    POST https://YOUR_PROJECT.supabase.co/auth/v1/admin/users/{user_id}
--    Headers: { "Authorization": "Bearer YOUR_SERVICE_ROLE_KEY" }
--    Body: { "password": "newpassword123" }

-- ============================================
-- 臨時解決方案：如果用戶已存在但密碼無法使用
-- ============================================

-- 檢查用戶是否已存在
DO $$
DECLARE
    user_email TEXT;
    user_exists BOOLEAN;
BEGIN
    FOR user_email IN SELECT unnest(ARRAY['chaewon@example.com', 'yujin@example.com', 'karina@example.com']) LOOP
        SELECT EXISTS(SELECT 1 FROM auth.users WHERE email = user_email) INTO user_exists;
        
        IF user_exists THEN
            RAISE NOTICE '用戶 % 已存在。請在 Supabase Dashboard 中重置密碼。', user_email;
        ELSE
            RAISE NOTICE '用戶 % 不存在。', user_email;
        END IF;
    END LOOP;
END $$;

-- ============================================
-- 建議的解決方案
-- ============================================
-- 1. 在 Supabase Dashboard 中手動創建這三個用戶
-- 2. 或者使用 Admin API（見 create-users-with-admin-api.md）
-- 3. 然後再執行 generate-100-users.sql 中的其他部分（創建 profiles 和 follows）
-- ============================================

