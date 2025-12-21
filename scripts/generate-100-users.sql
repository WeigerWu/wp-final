-- ============================================
-- 生成約100個新用戶的SQL腳本
-- 包含三名特殊用戶：Chaewon、Yujin、Karina（各80名followers）
-- ============================================
-- 注意：此腳本需要在 Supabase 中執行，需要管理員權限
-- 
-- 重要說明：
-- 1. 直接插入 auth.users 需要超級用戶權限，建議使用 Supabase Admin API 創建用戶
-- 2. 如果使用 SQL 直接插入，請確保已啟用必要的擴展
-- 3. 所有用戶的初始密碼是 'password123'，應提醒用戶更改
-- ============================================

-- 啟用必要的擴展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- 創建臨時表存儲用戶信息
-- ============================================

CREATE TEMP TABLE IF NOT EXISTS temp_users_to_create (
    username TEXT,
    email TEXT,
    display_name TEXT,
    bio TEXT,
    is_special BOOLEAN DEFAULT false
);

-- 插入三個特殊用戶
INSERT INTO temp_users_to_create (username, email, display_name, bio, is_special) VALUES
    ('Chaewon', 'chaewon@example.com', 'Chaewon', '熱愛烹飪的料理達人', true),
    ('Yujin', 'yujin@example.com', 'Yujin', '分享美味食譜的美食愛好者', true),
    ('Karina', 'karina@example.com', 'Karina', '專業廚師，專注於創意料理', true);

-- 插入其他97個用戶
INSERT INTO temp_users_to_create (username, email, display_name, bio) VALUES
    ('user001', 'user001@example.com', '美食探索者', '喜歡嘗試各種料理'),
    ('user002', 'user002@example.com', '家常菜愛好者', '專注於簡單美味的家常菜'),
    ('user003', 'user003@example.com', '烘焙達人', '熱愛烘焙，分享甜點食譜'),
    ('user004', 'user004@example.com', '健康飲食', '追求健康營養的飲食方式'),
    ('user005', 'user005@example.com', '異國料理', '探索世界各地的美食'),
    ('user006', 'user006@example.com', '素食主義', '分享美味的素食料理'),
    ('user007', 'user007@example.com', '快速料理', '專注於快速簡單的料理'),
    ('user008', 'user008@example.com', '傳統美食', '傳承經典傳統料理'),
    ('user009', 'user009@example.com', '創意料理', '喜歡創新和實驗'),
    ('user010', 'user010@example.com', '中式料理', '專精於中式烹飪'),
    ('user011', 'user011@example.com', '日式料理', '熱愛日式美食文化'),
    ('user012', 'user012@example.com', '西式料理', '分享西式經典料理'),
    ('user013', 'user013@example.com', '韓式料理', '專業韓式料理廚師'),
    ('user014', 'user014@example.com', '泰式料理', '探索泰式風味'),
    ('user015', 'user015@example.com', '義式料理', '義大利料理愛好者'),
    ('user016', 'user016@example.com', '法式料理', '精緻法式料理'),
    ('user017', 'user017@example.com', '墨西哥料理', '熱愛墨西哥風味'),
    ('user018', 'user018@example.com', '印度料理', '分享豐富的印度美食'),
    ('user019', 'user019@example.com', '地中海料理', '健康的地中海飲食'),
    ('user020', 'user020@example.com', '早餐達人', '專注於營養早餐'),
    ('user021', 'user021@example.com', '午餐專家', '創意午餐料理'),
    ('user022', 'user022@example.com', '晚餐料理', '豐盛的晚餐食譜'),
    ('user023', 'user023@example.com', '點心時間', '分享各種點心'),
    ('user024', 'user024@example.com', '飲品專家', '調製各種飲品'),
    ('user025', 'user025@example.com', '湯品達人', '溫暖的湯品料理'),
    ('user026', 'user026@example.com', '沙拉愛好者', '新鮮健康的沙拉'),
    ('user027', 'user027@example.com', '主菜專家', '豐盛的主菜料理'),
    ('user028', 'user028@example.com', '配菜達人', '精緻的配菜搭配'),
    ('user029', 'user029@example.com', '開胃菜', '美味的開胃小食'),
    ('user030', 'user030@example.com', '下酒菜', '適合配酒的小菜'),
    ('user031', 'user031@example.com', '節慶料理', '節日特別料理'),
    ('user032', 'user032@example.com', '聚會美食', '適合聚會的料理'),
    ('user033', 'user033@example.com', '一人份料理', '單人份量料理'),
    ('user034', 'user034@example.com', '家庭料理', '適合全家的料理'),
    ('user035', 'user035@example.com', '派對美食', '派對必備料理'),
    ('user036', 'user036@example.com', '野餐料理', '適合野餐的美食'),
    ('user037', 'user037@example.com', '便當達人', '營養豐富的便當'),
    ('user038', 'user038@example.com', '宵夜時間', '深夜美食'),
    ('user039', 'user039@example.com', '減脂餐', '低卡健康餐'),
    ('user040', 'user040@example.com', '增肌餐', '高蛋白營養餐'),
    ('user041', 'user041@example.com', '兒童餐', '適合兒童的料理'),
    ('user042', 'user042@example.com', '長者料理', '適合長者的料理'),
    ('user043', 'user043@example.com', '孕婦餐', '孕期營養料理'),
    ('user044', 'user044@example.com', '養生料理', '注重養生的料理'),
    ('user045', 'user045@example.com', '季節料理', '當季食材料理'),
    ('user046', 'user046@example.com', '春料理', '春季特色料理'),
    ('user047', 'user047@example.com', '夏料理', '夏季清爽料理'),
    ('user048', 'user048@example.com', '秋料理', '秋季豐收料理'),
    ('user049', 'user049@example.com', '冬料理', '冬季溫暖料理'),
    ('user050', 'user050@example.com', '地方特色', '地方傳統美食'),
    ('user051', 'user051@example.com', '街頭小吃', '特色街頭美食'),
    ('user052', 'user052@example.com', '餐廳料理', '還原餐廳美味'),
    ('user053', 'user053@example.com', '家常小菜', '簡單家常小菜'),
    ('user054', 'user054@example.com', '功夫菜', '需要技巧的料理'),
    ('user055', 'user055@example.com', '懶人料理', '簡單快速料理'),
    ('user056', 'user056@example.com', '一鍋到底', '一鍋料理'),
    ('user057', 'user057@example.com', '電鍋料理', '電鍋簡單料理'),
    ('user058', 'user058@example.com', '氣炸鍋', '氣炸鍋美食'),
    ('user059', 'user059@example.com', '烤箱料理', '烤箱烘焙料理'),
    ('user060', 'user060@example.com', '平底鍋', '平底鍋料理'),
    ('user061', 'user061@example.com', '微波爐', '微波爐快速料理'),
    ('user062', 'user062@example.com', '壓力鍋', '壓力鍋料理'),
    ('user063', 'user063@example.com', '慢燉鍋', '慢燉鍋料理'),
    ('user064', 'user064@example.com', '燒烤達人', '燒烤料理專家'),
    ('user065', 'user065@example.com', '火鍋愛好者', '各種火鍋料理'),
    ('user066', 'user066@example.com', '蒸料理', '健康蒸料理'),
    ('user067', 'user067@example.com', '炸物專家', '各種炸物'),
    ('user068', 'user068@example.com', '炒菜達人', '各種炒菜'),
    ('user069', 'user069@example.com', '滷味專家', '各種滷味'),
    ('user070', 'user070@example.com', '醃製達人', '醃製料理'),
    ('user071', 'user071@example.com', '發酵美食', '發酵料理'),
    ('user072', 'user072@example.com', '麵食達人', '各種麵食'),
    ('user073', 'user073@example.com', '米飯料理', '各種米飯料理'),
    ('user074', 'user074@example.com', '麵包愛好者', '自製麵包'),
    ('user075', 'user075@example.com', '蛋糕達人', '各種蛋糕'),
    ('user076', 'user076@example.com', '餅乾專家', '各種餅乾'),
    ('user077', 'user077@example.com', '糖果製作', '手工糖果'),
    ('user078', 'user078@example.com', '巧克力', '巧克力製作'),
    ('user079', 'user079@example.com', '冰淇淋', '自製冰淇淋'),
    ('user080', 'user080@example.com', '果醬製作', '手工果醬'),
    ('user081', 'user081@example.com', '醃菜達人', '各種醃菜'),
    ('user082', 'user082@example.com', '醬料製作', '自製醬料'),
    ('user083', 'user083@example.com', '調味專家', '調味技巧'),
    ('user084', 'user084@example.com', '擺盤達人', '精美擺盤'),
    ('user085', 'user085@example.com', '攝影美食', '美食攝影'),
    ('user086', 'user086@example.com', '食譜收集', '收集各種食譜'),
    ('user087', 'user087@example.com', '料理實驗', '實驗新料理'),
    ('user088', 'user088@example.com', '食材探索', '探索新食材'),
    ('user089', 'user089@example.com', '料理分享', '分享料理心得'),
    ('user090', 'user090@example.com', '新手廚師', '學習烹飪中'),
    ('user091', 'user091@example.com', '料理教學', '烹飪教學'),
    ('user092', 'user092@example.com', '美食評論', '美食評論家'),
    ('user093', 'user093@example.com', '料理比賽', '參加料理比賽'),
    ('user094', 'user094@example.com', '專業廚師', '專業餐廳廚師'),
    ('user095', 'user095@example.com', '料理作家', '食譜書作家'),
    ('user096', 'user096@example.com', '美食部落客', '美食部落格'),
    ('user097', 'user097@example.com', '料理Youtuber', '料理影片'),
    ('user098', 'user098@example.com', '料理網紅', '料理網紅'),
    ('user099', 'user099@example.com', '料理愛好者', '純粹熱愛料理'),
    ('user100', 'user100@example.com', '美食探索家', '探索美食世界');

-- ============================================
-- 創建用戶和 Profiles（第一部分：創建用戶）
-- ============================================

DO $$
DECLARE
    user_record RECORD;
    new_user_id UUID;
    chaewon_id UUID;
    yujin_id UUID;
    karina_id UUID;
    all_user_ids UUID[] := ARRAY[]::UUID[];
    regular_user_ids UUID[] := ARRAY[]::UUID[];
BEGIN
    -- 創建所有用戶
    FOR user_record IN SELECT * FROM temp_users_to_create ORDER BY is_special DESC, username
    LOOP
        new_user_id := uuid_generate_v4();
        all_user_ids := array_append(all_user_ids, new_user_id);
        
        -- 記錄特殊用戶的 ID
        IF user_record.username = 'Chaewon' THEN
            chaewon_id := new_user_id;
        ELSIF user_record.username = 'Yujin' THEN
            yujin_id := new_user_id;
        ELSIF user_record.username = 'Karina' THEN
            karina_id := new_user_id;
        ELSE
            regular_user_ids := array_append(regular_user_ids, new_user_id);
        END IF;
        
        -- 插入 auth.users（需要管理員權限）
        BEGIN
            INSERT INTO auth.users (
                id,
                instance_id,
                aud,
                role,
                email,
                encrypted_password,
                email_confirmed_at,
                raw_app_meta_data,
                raw_user_meta_data,
                created_at,
                updated_at,
                confirmation_token,
                email_change,
                email_change_token_new,
                recovery_token
            ) VALUES (
                new_user_id,
                (SELECT id FROM auth.instances LIMIT 1),
                'authenticated',
                'authenticated',
                user_record.email,
                crypt('password123', gen_salt('bf')),
                NOW(),
                '{"provider":"email","providers":["email"]}'::jsonb,
                jsonb_build_object('username', user_record.username),
                NOW(),
                NOW(),
                '',
                '',
                '',
                ''
            );
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE '無法創建用戶 %: %', user_record.username, SQLERRM;
        END;
        
        -- 插入 profiles
        INSERT INTO public.profiles (
            id,
            username,
            display_name,
            bio,
            created_at,
            updated_at
        ) VALUES (
            new_user_id,
            user_record.username,
            user_record.display_name,
            user_record.bio,
            NOW(),
            NOW()
        ) ON CONFLICT (id) DO UPDATE SET
            username = EXCLUDED.username,
            display_name = EXCLUDED.display_name,
            bio = EXCLUDED.bio;
    END LOOP;
    
    -- 將特殊用戶ID保存到臨時表供後續使用
    CREATE TEMP TABLE IF NOT EXISTS temp_special_user_ids (
        username TEXT,
        user_id UUID
    );
    
    INSERT INTO temp_special_user_ids VALUES
        ('Chaewon', chaewon_id),
        ('Yujin', yujin_id),
        ('Karina', karina_id);
    
    -- 將所有用戶ID保存供創建follows使用
    CREATE TEMP TABLE IF NOT EXISTS temp_all_user_ids (
        username TEXT,
        user_id UUID,
        is_regular BOOLEAN
    );
    
    FOR user_record IN SELECT * FROM temp_users_to_create ORDER BY is_special DESC, username
    LOOP
        INSERT INTO temp_all_user_ids (username, user_id, is_regular)
        SELECT user_record.username, p.id, NOT user_record.is_special
        FROM public.profiles p
        WHERE p.username = user_record.username;
    END LOOP;
    
    RAISE NOTICE '用戶創建完成！';
END $$;

-- ============================================
-- 第二部分：創建追蹤關係
-- ============================================

DO $$
DECLARE
    chaewon_id UUID;
    yujin_id UUID;
    karina_id UUID;
    regular_user_record RECORD;
    follower_counter INTEGER;
    follower_index INTEGER;
    regular_user_ids UUID[] := ARRAY[]::UUID[];
BEGIN
    -- 獲取特殊用戶ID
    SELECT user_id INTO chaewon_id FROM temp_special_user_ids WHERE username = 'Chaewon';
    SELECT user_id INTO yujin_id FROM temp_special_user_ids WHERE username = 'Yujin';
    SELECT user_id INTO karina_id FROM temp_special_user_ids WHERE username = 'Karina';
    
    -- 收集所有普通用戶ID
    FOR regular_user_record IN 
        SELECT user_id FROM temp_all_user_ids WHERE is_regular = true ORDER BY user_id
    LOOP
        regular_user_ids := array_append(regular_user_ids, regular_user_record.user_id);
    END LOOP;
    
    -- 為 Chaewon 添加 80 名 followers
    IF chaewon_id IS NOT NULL AND array_length(regular_user_ids, 1) >= 80 THEN
        FOR follower_counter IN 1..80 LOOP
            INSERT INTO public.follows (follower_id, following_id, created_at)
            VALUES (
                regular_user_ids[follower_counter],
                chaewon_id,
                NOW() - (random() * interval '30 days')
            ) ON CONFLICT (follower_id, following_id) DO NOTHING;
        END LOOP;
    END IF;
    
    -- 為 Yujin 添加 80 名 followers（循環使用用戶）
    IF yujin_id IS NOT NULL AND array_length(regular_user_ids, 1) > 0 THEN
        FOR follower_counter IN 1..80 LOOP
            follower_index := ((follower_counter - 1 + 80) % array_length(regular_user_ids, 1)) + 1;
            INSERT INTO public.follows (follower_id, following_id, created_at)
            VALUES (
                regular_user_ids[follower_index],
                yujin_id,
                NOW() - (random() * interval '30 days')
            ) ON CONFLICT (follower_id, following_id) DO NOTHING;
        END LOOP;
    END IF;
    
    -- 為 Karina 添加 80 名 followers（循環使用用戶）
    IF karina_id IS NOT NULL AND array_length(regular_user_ids, 1) > 0 THEN
        FOR follower_counter IN 1..80 LOOP
            follower_index := ((follower_counter - 1 + 160) % array_length(regular_user_ids, 1)) + 1;
            INSERT INTO public.follows (follower_id, following_id, created_at)
            VALUES (
                regular_user_ids[follower_index],
                karina_id,
                NOW() - (random() * interval '30 days')
            ) ON CONFLICT (follower_id, following_id) DO NOTHING;
        END LOOP;
    END IF;
    
    RAISE NOTICE '追蹤關係創建完成！';
END $$;

-- 清理臨時表
DROP TABLE IF EXISTS temp_users_to_create;

-- ============================================
-- 驗證結果
-- ============================================

-- 檢查創建的用戶總數
SELECT 
    'Total users in profiles' as description,
    COUNT(*) as count
FROM public.profiles
WHERE username IN (
    SELECT username FROM (VALUES 
        ('Chaewon'), ('Yujin'), ('Karina'),
        ('user001'), ('user002'), ('user003'), ('user004'), ('user005'),
        ('user006'), ('user007'), ('user008'), ('user009'), ('user010'),
        ('user011'), ('user012'), ('user013'), ('user014'), ('user015'),
        ('user016'), ('user017'), ('user018'), ('user019'), ('user020'),
        ('user021'), ('user022'), ('user023'), ('user024'), ('user025'),
        ('user026'), ('user027'), ('user028'), ('user029'), ('user030'),
        ('user031'), ('user032'), ('user033'), ('user034'), ('user035'),
        ('user036'), ('user037'), ('user038'), ('user039'), ('user040'),
        ('user041'), ('user042'), ('user043'), ('user044'), ('user045'),
        ('user046'), ('user047'), ('user048'), ('user049'), ('user050'),
        ('user051'), ('user052'), ('user053'), ('user054'), ('user055'),
        ('user056'), ('user057'), ('user058'), ('user059'), ('user060'),
        ('user061'), ('user062'), ('user063'), ('user064'), ('user065'),
        ('user066'), ('user067'), ('user068'), ('user069'), ('user070'),
        ('user071'), ('user072'), ('user073'), ('user074'), ('user075'),
        ('user076'), ('user077'), ('user078'), ('user079'), ('user080'),
        ('user081'), ('user082'), ('user083'), ('user084'), ('user085'),
        ('user086'), ('user087'), ('user088'), ('user089'), ('user090'),
        ('user091'), ('user092'), ('user093'), ('user094'), ('user095'),
        ('user096'), ('user097'), ('user098'), ('user099'), ('user100')
    ) AS t(username)
);

-- 檢查特殊用戶的 followers 數量
SELECT 
    p.username,
    p.display_name,
    COALESCE(COUNT(f.id), 0) as follower_count,
    p.follower_count as profile_follower_count
FROM public.profiles p
LEFT JOIN public.follows f ON f.following_id = p.id
WHERE p.username IN ('Chaewon', 'Yujin', 'Karina')
GROUP BY p.id, p.username, p.display_name, p.follower_count
ORDER BY p.username;

