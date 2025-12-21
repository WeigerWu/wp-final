-- ============================================
-- 為 Chaewon、Yujin、Karina 各創建10個食譜
-- 每個食譜約50個評價
-- ============================================
-- 注意：執行此腳本前請先執行 generate-100-users.sql
-- ============================================

-- 啟用必要的擴展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 第一部分：獲取用戶ID並創建臨時表
-- ============================================

DO $$
BEGIN
    -- 創建臨時表存儲用戶ID
    CREATE TEMP TABLE IF NOT EXISTS temp_recipe_users (
        username TEXT,
        user_id UUID
    );
    
    -- 獲取三個特殊用戶的ID
    INSERT INTO temp_recipe_users (username, user_id)
    SELECT username, id
    FROM public.profiles
    WHERE username IN ('Chaewon', 'Yujin', 'Karina')
    ON CONFLICT DO NOTHING;
    
    RAISE NOTICE '用戶ID已獲取';
END $$;

-- ============================================
-- 第二部分：為 Chaewon 創建10個食譜
-- ============================================

DO $$
DECLARE
    chaewon_id UUID;
    recipe_id_var UUID;
BEGIN
    -- 獲取 Chaewon 的用戶ID
    SELECT user_id INTO chaewon_id FROM temp_recipe_users WHERE username = 'Chaewon';
    
    IF chaewon_id IS NULL THEN
        RAISE EXCEPTION '找不到 Chaewon 用戶，請先執行 generate-100-users.sql';
    END IF;
    
    -- 食譜1：經典紅燒肉
    recipe_id_var := uuid_generate_v4();
    INSERT INTO public.recipes (
        id, user_id, title, description,
        servings, prep_time, cook_time, total_time, difficulty,
        ingredients, steps, tags, status, is_public, published_at,
        created_at, updated_at
    ) VALUES (
        recipe_id_var, chaewon_id, '經典紅燒肉', '色澤紅亮、肥而不膩的經典家常菜，入口即化，讓人回味無窮。',
        4, 30, 90, 120, 'medium',
        '[
            {"name": "五花肉", "amount": "500", "unit": "克"},
            {"name": "冰糖", "amount": "50", "unit": "克"},
            {"name": "老抽", "amount": "2", "unit": "大匙"},
            {"name": "生抽", "amount": "3", "unit": "大匙"},
            {"name": "料酒", "amount": "2", "unit": "大匙"},
            {"name": "生薑", "amount": "3", "unit": "片"},
            {"name": "蔥", "amount": "2", "unit": "根"},
            {"name": "八角", "amount": "2", "unit": "顆"},
            {"name": "桂皮", "amount": "1", "unit": "小塊"},
            {"name": "水", "amount": "適量", "unit": ""}
        ]'::jsonb,
        '[
            {"step": 1, "instruction": "五花肉切塊，放入冷水中煮沸後撈起，用溫水沖洗乾淨"},
            {"step": 2, "instruction": "熱鍋下油，放入冰糖小火炒至糖色"},
            {"step": 3, "instruction": "放入五花肉塊翻炒上色"},
            {"step": 4, "instruction": "加入料酒、生抽、老抽翻炒均勻"},
            {"step": 5, "instruction": "加入生薑、蔥、八角、桂皮和適量熱水"},
            {"step": 6, "instruction": "大火煮開後轉小火慢燉90分鐘"},
            {"step": 7, "instruction": "最後大火收汁即可"}
        ]'::jsonb,
        '["中式料理", "紅燒", "豬肉", "家常菜"]'::jsonb,
        'published', true, NOW() - interval '15 days',
        NOW() - interval '15 days', NOW() - interval '15 days'
    );
    
    -- 食譜2：宮保雞丁
    recipe_id_var := uuid_generate_v4();
    INSERT INTO public.recipes (
        id, user_id, title, description,
        servings, prep_time, cook_time, total_time, difficulty,
        ingredients, steps, tags, status, is_public, published_at,
        created_at, updated_at
    ) VALUES (
        recipe_id_var, chaewon_id, '宮保雞丁', '川菜經典，雞肉嫩滑，花生香脆，麻辣鮮香，下飯神器。',
        3, 20, 15, 35, 'medium',
        '[
            {"name": "雞胸肉", "amount": "300", "unit": "克"},
            {"name": "花生米", "amount": "100", "unit": "克"},
            {"name": "乾辣椒", "amount": "10", "unit": "根"},
            {"name": "花椒", "amount": "1", "unit": "大匙"},
            {"name": "生抽", "amount": "2", "unit": "大匙"},
            {"name": "料酒", "amount": "1", "unit": "大匙"},
            {"name": "糖", "amount": "1", "unit": "小匙"},
            {"name": "醋", "amount": "1", "unit": "小匙"},
            {"name": "蒜", "amount": "3", "unit": "瓣"},
            {"name": "薑", "amount": "1", "unit": "小塊"}
        ]'::jsonb,
        '[
            {"step": 1, "instruction": "雞胸肉切丁，用料酒、生抽、少許鹽醃製15分鐘"},
            {"step": 2, "instruction": "花生米用油炸至金黃香脆，撈起備用"},
            {"step": 3, "instruction": "熱鍋下油，放入雞丁炒至變白後盛起"},
            {"step": 4, "instruction": "鍋中留油，放入乾辣椒和花椒炒香"},
            {"step": 5, "instruction": "加入蒜、薑爆香，放入雞丁翻炒"},
            {"step": 6, "instruction": "調入生抽、糖、醋炒勻"},
            {"step": 7, "instruction": "最後加入花生米快速翻炒即可"}
        ]'::jsonb,
        '["中式料理", "川菜", "雞肉", "下飯菜"]'::jsonb,
        'published', true, NOW() - interval '14 days',
        NOW() - interval '14 days', NOW() - interval '14 days'
    );
    
    -- 食譜3：麻婆豆腐
    recipe_id_var := uuid_generate_v4();
    INSERT INTO public.recipes (
        id, user_id, title, description,
        servings, prep_time, cook_time, total_time, difficulty,
        ingredients, steps, tags, status, is_public, published_at,
        created_at, updated_at
    ) VALUES (
        recipe_id_var, chaewon_id, '麻婆豆腐', '四川名菜，豆腐嫩滑，麻辣鮮香，配白飯超讚！',
        4, 15, 10, 25, 'easy',
        '[
            {"name": "嫩豆腐", "amount": "400", "unit": "克"},
            {"name": "絞肉", "amount": "100", "unit": "克"},
            {"name": "豆瓣醬", "amount": "2", "unit": "大匙"},
            {"name": "花椒粉", "amount": "1", "unit": "小匙"},
            {"name": "蔥花", "amount": "適量", "unit": ""},
            {"name": "蒜末", "amount": "2", "unit": "大匙"},
            {"name": "生抽", "amount": "1", "unit": "大匙"},
            {"name": "糖", "amount": "0.5", "unit": "小匙"},
            {"name": "水澱粉", "amount": "適量", "unit": ""}
        ]'::jsonb,
        '[
            {"step": 1, "instruction": "豆腐切塊，放入鹽水中浸泡5分鐘後瀝乾"},
            {"step": 2, "instruction": "熱鍋下油，放入絞肉炒散"},
            {"step": 3, "instruction": "加入豆瓣醬和蒜末炒香"},
            {"step": 4, "instruction": "加入適量水和豆腐塊，小火煮5分鐘"},
            {"step": 5, "instruction": "調入生抽、糖，用水澱粉勾芡"},
            {"step": 6, "instruction": "撒上花椒粉和蔥花即可"}
        ]'::jsonb,
        '["中式料理", "川菜", "豆腐", "素食", "下飯菜"]'::jsonb,
        'published', true, NOW() - interval '13 days',
        NOW() - interval '13 days', NOW() - interval '13 days'
    );
    
    -- 食譜4：糖醋排骨
    recipe_id_var := uuid_generate_v4();
    INSERT INTO public.recipes (
        id, user_id, title, description,
        servings, prep_time, cook_time, total_time, difficulty,
        ingredients, steps, tags, status, is_public, published_at,
        created_at, updated_at
    ) VALUES (
        recipe_id_var, chaewon_id, '糖醋排骨', '酸甜開胃，外酥內嫩，老少皆宜的經典菜式。',
        4, 30, 40, 70, 'medium',
        '[
            {"name": "排骨", "amount": "500", "unit": "克"},
            {"name": "糖", "amount": "50", "unit": "克"},
            {"name": "醋", "amount": "3", "unit": "大匙"},
            {"name": "生抽", "amount": "2", "unit": "大匙"},
            {"name": "料酒", "amount": "1", "unit": "大匙"},
            {"name": "生薑", "amount": "3", "unit": "片"},
            {"name": "蔥", "amount": "2", "unit": "根"},
            {"name": "番茄醬", "amount": "1", "unit": "大匙"}
        ]'::jsonb,
        '[
            {"step": 1, "instruction": "排骨切段，用料酒、生薑、蔥醃製30分鐘"},
            {"step": 2, "instruction": "熱鍋下油，排骨炸至金黃後撈起"},
            {"step": 3, "instruction": "鍋中留少許油，放入糖小火炒至融化"},
            {"step": 4, "instruction": "加入醋、生抽、番茄醬和適量水煮開"},
            {"step": 5, "instruction": "放入排骨，小火慢燉30分鐘"},
            {"step": 6, "instruction": "大火收汁，讓每塊排骨均勻裹上糖醋汁即可"}
        ]'::jsonb,
        '["中式料理", "糖醋", "排骨", "家常菜"]'::jsonb,
        'published', true, NOW() - interval '12 days',
        NOW() - interval '12 days', NOW() - interval '12 days'
    );
    
    -- 食譜5：魚香茄子
    recipe_id_var := uuid_generate_v4();
    INSERT INTO public.recipes (
        id, user_id, title, description,
        servings, prep_time, cook_time, total_time, difficulty,
        ingredients, steps, tags, status, is_public, published_at,
        created_at, updated_at
    ) VALUES (
        recipe_id_var, chaewon_id, '魚香茄子', '沒有魚卻有魚香的經典川菜，茄子軟糯入味，超級下飯！',
        3, 15, 15, 30, 'easy',
        '[
            {"name": "茄子", "amount": "400", "unit": "克"},
            {"name": "絞肉", "amount": "100", "unit": "克"},
            {"name": "豆瓣醬", "amount": "1.5", "unit": "大匙"},
            {"name": "蒜末", "amount": "2", "unit": "大匙"},
            {"name": "薑末", "amount": "1", "unit": "大匙"},
            {"name": "蔥花", "amount": "適量", "unit": ""},
            {"name": "生抽", "amount": "1", "unit": "大匙"},
            {"name": "糖", "amount": "1", "unit": "小匙"},
            {"name": "醋", "amount": "1", "unit": "小匙"}
        ]'::jsonb,
        '[
            {"step": 1, "instruction": "茄子切條，用鹽醃製10分鐘後擠去水分"},
            {"step": 2, "instruction": "熱鍋下油，茄子炸至微黃後盛起"},
            {"step": 3, "instruction": "鍋中留油，放入絞肉炒散"},
            {"step": 4, "instruction": "加入豆瓣醬、蒜末、薑末炒香"},
            {"step": 5, "instruction": "放入茄子翻炒，調入生抽、糖、醋"},
            {"step": 6, "instruction": "最後撒上蔥花即可"}
        ]'::jsonb,
        '["中式料理", "川菜", "茄子", "下飯菜"]'::jsonb,
        'published', true, NOW() - interval '11 days',
        NOW() - interval '11 days', NOW() - interval '11 days'
    );
    
    -- 食譜6：可樂雞翅
    recipe_id_var := uuid_generate_v4();
    INSERT INTO public.recipes (
        id, user_id, title, description,
        servings, prep_time, cook_time, total_time, difficulty,
        ingredients, steps, tags, status, is_public, published_at,
        created_at, updated_at
    ) VALUES (
        recipe_id_var, chaewon_id, '可樂雞翅', '簡單易做的家常菜，可樂的甜味讓雞翅更鮮嫩美味。',
        4, 10, 30, 40, 'easy',
        '[
            {"name": "雞翅", "amount": "500", "unit": "克"},
            {"name": "可樂", "amount": "300", "unit": "毫升"},
            {"name": "生抽", "amount": "2", "unit": "大匙"},
            {"name": "老抽", "amount": "1", "unit": "大匙"},
            {"name": "料酒", "amount": "1", "unit": "大匙"},
            {"name": "生薑", "amount": "3", "unit": "片"},
            {"name": "蔥", "amount": "2", "unit": "根"}
        ]'::jsonb,
        '[
            {"step": 1, "instruction": "雞翅洗淨，用刀在表面劃幾刀方便入味"},
            {"step": 2, "instruction": "熱鍋下油，雞翅煎至兩面金黃"},
            {"step": 3, "instruction": "加入料酒、生抽、老抽翻炒上色"},
            {"step": 4, "instruction": "倒入可樂，放入生薑、蔥"},
            {"step": 5, "instruction": "大火煮開後轉小火慢燉20分鐘"},
            {"step": 6, "instruction": "最後大火收汁即可"}
        ]'::jsonb,
        '["中式料理", "雞翅", "家常菜", "簡單料理"]'::jsonb,
        'published', true, NOW() - interval '10 days',
        NOW() - interval '10 days', NOW() - interval '10 days'
    );
    
    -- 食譜7：蒜蓉粉絲蒸扇貝
    recipe_id_var := uuid_generate_v4();
    INSERT INTO public.recipes (
        id, user_id, title, description,
        servings, prep_time, cook_time, total_time, difficulty,
        ingredients, steps, tags, status, is_public, published_at,
        created_at, updated_at
    ) VALUES (
        recipe_id_var, chaewon_id, '蒜蓉粉絲蒸扇貝', '海鮮的鮮甜配上蒜蓉的香氣，粉絲吸滿湯汁，超美味！',
        4, 20, 10, 30, 'medium',
        '[
            {"name": "扇貝", "amount": "8", "unit": "個"},
            {"name": "粉絲", "amount": "50", "unit": "克"},
            {"name": "蒜", "amount": "1", "unit": "頭"},
            {"name": "生抽", "amount": "2", "unit": "大匙"},
            {"name": "香油", "amount": "1", "unit": "小匙"},
            {"name": "蔥花", "amount": "適量", "unit": ""},
            {"name": "紅辣椒", "amount": "1", "unit": "根"}
        ]'::jsonb,
        '[
            {"step": 1, "instruction": "扇貝洗淨，粉絲用溫水泡軟"},
            {"step": 2, "instruction": "蒜切蓉，用熱油爆香，調入生抽、香油"},
            {"step": 3, "instruction": "粉絲剪短，放在扇貝上，淋上蒜蓉醬"},
            {"step": 4, "instruction": "放入蒸鍋，大火蒸8-10分鐘"},
            {"step": 5, "instruction": "取出後撒上蔥花和紅辣椒絲即可"}
        ]'::jsonb,
        '["中式料理", "海鮮", "蒸料理", "家常菜"]'::jsonb,
        'published', true, NOW() - interval '9 days',
        NOW() - interval '9 days', NOW() - interval '9 days'
    );
    
    -- 食譜8：地三鮮
    recipe_id_var := uuid_generate_v4();
    INSERT INTO public.recipes (
        id, user_id, title, description,
        servings, prep_time, cook_time, total_time, difficulty,
        ingredients, steps, tags, status, is_public, published_at,
        created_at, updated_at
    ) VALUES (
        recipe_id_var, chaewon_id, '地三鮮', '東北名菜，土豆、茄子和青椒的完美組合，營養又美味。',
        4, 20, 20, 40, 'easy',
        '[
            {"name": "茄子", "amount": "200", "unit": "克"},
            {"name": "土豆", "amount": "200", "unit": "克"},
            {"name": "青椒", "amount": "150", "unit": "克"},
            {"name": "生抽", "amount": "2", "unit": "大匙"},
            {"name": "糖", "amount": "1", "unit": "小匙"},
            {"name": "蒜", "amount": "3", "unit": "瓣"},
            {"name": "水澱粉", "amount": "適量", "unit": ""}
        ]'::jsonb,
        '[
            {"step": 1, "instruction": "茄子、土豆、青椒分別切塊"},
            {"step": 2, "instruction": "熱鍋下油，土豆炸至金黃後撈起"},
            {"step": 3, "instruction": "茄子炸至微黃後撈起"},
            {"step": 4, "instruction": "鍋中留少許油，放入蒜爆香"},
            {"step": 5, "instruction": "放入青椒翻炒，再加入土豆和茄子"},
            {"step": 6, "instruction": "調入生抽、糖，用水澱粉勾芡即可"}
        ]'::jsonb,
        '["中式料理", "東北菜", "素食", "下飯菜"]'::jsonb,
        'published', true, NOW() - interval '8 days',
        NOW() - interval '8 days', NOW() - interval '8 days'
    );
    
    -- 食譜9：紅燒魚
    recipe_id_var := uuid_generate_v4();
    INSERT INTO public.recipes (
        id, user_id, title, description,
        servings, prep_time, cook_time, total_time, difficulty,
        ingredients, steps, tags, status, is_public, published_at,
        created_at, updated_at
    ) VALUES (
        recipe_id_var, chaewon_id, '紅燒魚', '魚肉鮮嫩，湯汁濃郁，經典的家常紅燒做法。',
        3, 20, 25, 45, 'medium',
        '[
            {"name": "魚", "amount": "1", "unit": "條（約500克）"},
            {"name": "生抽", "amount": "3", "unit": "大匙"},
            {"name": "老抽", "amount": "1", "unit": "大匙"},
            {"name": "料酒", "amount": "2", "unit": "大匙"},
            {"name": "糖", "amount": "1", "unit": "大匙"},
            {"name": "生薑", "amount": "5", "unit": "片"},
            {"name": "蔥", "amount": "3", "unit": "根"},
            {"name": "蒜", "amount": "3", "unit": "瓣"}
        ]'::jsonb,
        '[
            {"step": 1, "instruction": "魚處理乾淨，在表面劃幾刀，用料酒和鹽醃製15分鐘"},
            {"step": 2, "instruction": "熱鍋下油，魚煎至兩面金黃後盛起"},
            {"step": 3, "instruction": "鍋中留油，放入生薑、蔥、蒜爆香"},
            {"step": 4, "instruction": "放入魚，加入生抽、老抽、糖和適量熱水"},
            {"step": 5, "instruction": "大火煮開後轉小火慢煮15分鐘"},
            {"step": 6, "instruction": "最後大火收汁，裝盤即可"}
        ]'::jsonb,
        '["中式料理", "魚", "紅燒", "家常菜"]'::jsonb,
        'published', true, NOW() - interval '7 days',
        NOW() - interval '7 days', NOW() - interval '7 days'
    );
    
    -- 食譜10：酸辣土豆絲
    recipe_id_var := uuid_generate_v4();
    INSERT INTO public.recipes (
        id, user_id, title, description,
        servings, prep_time, cook_time, total_time, difficulty,
        ingredients, steps, tags, status, is_public, published_at,
        created_at, updated_at
    ) VALUES (
        recipe_id_var, chaewon_id, '酸辣土豆絲', '爽脆開胃，酸辣過癮，簡單快手的下飯小菜。',
        3, 15, 5, 20, 'easy',
        '[
            {"name": "土豆", "amount": "300", "unit": "克"},
            {"name": "青椒", "amount": "1", "unit": "個"},
            {"name": "乾辣椒", "amount": "3", "unit": "根"},
            {"name": "醋", "amount": "2", "unit": "大匙"},
            {"name": "生抽", "amount": "1", "unit": "大匙"},
            {"name": "蒜", "amount": "2", "unit": "瓣"},
            {"name": "鹽", "amount": "適量", "unit": ""}
        ]'::jsonb,
        '[
            {"step": 1, "instruction": "土豆切絲，用清水沖洗去掉澱粉，瀝乾"},
            {"step": 2, "instruction": "青椒切絲，蒜切片"},
            {"step": 3, "instruction": "熱鍋下油，放入乾辣椒和蒜爆香"},
            {"step": 4, "instruction": "放入土豆絲大火快炒"},
            {"step": 5, "instruction": "加入青椒絲，調入醋、生抽、鹽"},
            {"step": 6, "instruction": "快速翻炒均勻即可出鍋"}
        ]'::jsonb,
        '["中式料理", "素食", "下飯菜", "簡單料理"]'::jsonb,
        'published', true, NOW() - interval '6 days',
        NOW() - interval '6 days', NOW() - interval '6 days'
    );
    
    RAISE NOTICE 'Chaewon 的10個食譜已全部創建';
END $$;

-- ============================================
-- 第三部分：為 Yujin 創建10個食譜
-- ============================================

DO $$
DECLARE
    yujin_id UUID;
    recipe_id_var UUID;
BEGIN
    SELECT user_id INTO yujin_id FROM temp_recipe_users WHERE username = 'Yujin';
    
    IF yujin_id IS NULL THEN
        RAISE EXCEPTION '找不到 Yujin 用戶';
    END IF;
    
    -- 食譜1：韓式泡菜炒飯
    recipe_id_var := uuid_generate_v4();
    INSERT INTO public.recipes (
        id, user_id, title, description,
        servings, prep_time, cook_time, total_time, difficulty,
        ingredients, steps, tags, status, is_public, published_at,
        created_at, updated_at
    ) VALUES (
        recipe_id_var, yujin_id, '韓式泡菜炒飯', '酸辣開胃的韓式經典，簡單快速，一個人也能吃得開心！',
        2, 10, 10, 20, 'easy',
        '[
            {"name": "米飯", "amount": "2", "unit": "碗"},
            {"name": "韓式泡菜", "amount": "100", "unit": "克"},
            {"name": "雞蛋", "amount": "2", "unit": "個"},
            {"name": "蔥", "amount": "2", "unit": "根"},
            {"name": "韓式辣醬", "amount": "1", "unit": "大匙"},
            {"name": "芝麻油", "amount": "1", "unit": "小匙"},
            {"name": "海苔", "amount": "適量", "unit": ""}
        ]'::jsonb,
        '[
            {"step": 1, "instruction": "泡菜切小塊，蔥切末"},
            {"step": 2, "instruction": "熱鍋下油，雞蛋炒散後盛起"},
            {"step": 3, "instruction": "鍋中下油，放入泡菜炒香"},
            {"step": 4, "instruction": "加入米飯炒散，調入韓式辣醬"},
            {"step": 5, "instruction": "加入炒蛋和蔥末翻炒"},
            {"step": 6, "instruction": "淋上芝麻油，撒上海苔即可"}
        ]'::jsonb,
        '["韓式料理", "炒飯", "簡單料理", "一人份"]'::jsonb,
        'published', true, NOW() - interval '15 days',
        NOW() - interval '15 days', NOW() - interval '15 days'
    );
    
    -- 食譜2：韓式大醬湯
    recipe_id_var := uuid_generate_v4();
    INSERT INTO public.recipes (
        id, user_id, title, description,
        servings, prep_time, cook_time, total_time, difficulty,
        ingredients, steps, tags, status, is_public, published_at,
        created_at, updated_at
    ) VALUES (
        recipe_id_var, yujin_id, '韓式大醬湯', '韓國家庭必備湯品，濃郁的大醬香氣，溫暖又開胃。',
        4, 15, 20, 35, 'easy',
        '[
            {"name": "韓式大醬", "amount": "2", "unit": "大匙"},
            {"name": "豆腐", "amount": "200", "unit": "克"},
            {"name": "馬鈴薯", "amount": "1", "unit": "個"},
            {"name": "洋蔥", "amount": "0.5", "unit": "個"},
            {"name": "金針菇", "amount": "100", "unit": "克"},
            {"name": "青椒", "amount": "1", "unit": "個"},
            {"name": "蒜", "amount": "2", "unit": "瓣"},
            {"name": "水", "amount": "500", "unit": "毫升"}
        ]'::jsonb,
        '[
            {"step": 1, "instruction": "豆腐、馬鈴薯、洋蔥、青椒切塊"},
            {"step": 2, "instruction": "鍋中放水，放入大醬攪拌均勻"},
            {"step": 3, "instruction": "放入馬鈴薯和洋蔥煮10分鐘"},
            {"step": 4, "instruction": "加入豆腐、金針菇、青椒繼續煮5分鐘"},
            {"step": 5, "instruction": "最後加入蒜末即可"}
        ]'::jsonb,
        '["韓式料理", "湯品", "素食", "家常菜"]'::jsonb,
        'published', true, NOW() - interval '14 days',
        NOW() - interval '14 days', NOW() - interval '14 days'
    );
    
    -- 食譜3：韓式烤肉
    recipe_id_var := uuid_generate_v4();
    INSERT INTO public.recipes (
        id, user_id, title, description,
        servings, prep_time, cook_time, total_time, difficulty,
        ingredients, steps, tags, status, is_public, published_at,
        created_at, updated_at
    ) VALUES (
        recipe_id_var, yujin_id, '韓式烤肉', '醃製入味的牛肉，配生菜和醬料，正宗的韓式吃法！',
        4, 60, 15, 75, 'medium',
        '[
            {"name": "牛肉片", "amount": "500", "unit": "克"},
            {"name": "韓式烤肉醬", "amount": "4", "unit": "大匙"},
            {"name": "洋蔥", "amount": "0.5", "unit": "個"},
            {"name": "蒜", "amount": "3", "unit": "瓣"},
            {"name": "生菜", "amount": "適量", "unit": ""},
            {"name": "芝麻油", "amount": "1", "unit": "大匙"},
            {"name": "白芝麻", "amount": "適量", "unit": ""}
        ]'::jsonb,
        '[
            {"step": 1, "instruction": "牛肉用烤肉醬、洋蔥絲、蒜末醃製1小時"},
            {"step": 2, "instruction": "平底鍋加熱，刷少許油"},
            {"step": 3, "instruction": "放入牛肉片兩面煎至微焦"},
            {"step": 4, "instruction": "用生菜包住烤肉，配醬料和芝麻油"},
            {"step": 5, "instruction": "撒上白芝麻即可"}
        ]'::jsonb,
        '["韓式料理", "烤肉", "牛肉", "聚會美食"]'::jsonb,
        'published', true, NOW() - interval '13 days',
        NOW() - interval '13 days', NOW() - interval '13 days'
    );
    
    -- 食譜4：韓式拌飯
    recipe_id_var := uuid_generate_v4();
    INSERT INTO public.recipes (
        id, user_id, title, description,
        servings, prep_time, cook_time, total_time, difficulty,
        ingredients, steps, tags, status, is_public, published_at,
        created_at, updated_at
    ) VALUES (
        recipe_id_var, yujin_id, '韓式拌飯', '色彩繽紛的蔬菜配白飯，加上韓式辣醬，營養又美味！',
        2, 20, 10, 30, 'easy',
        '[
            {"name": "米飯", "amount": "2", "unit": "碗"},
            {"name": "胡蘿蔔", "amount": "0.5", "unit": "根"},
            {"name": "菠菜", "amount": "100", "unit": "克"},
            {"name": "豆芽", "amount": "100", "unit": "克"},
            {"name": "香菇", "amount": "3", "unit": "朵"},
            {"name": "韓式辣醬", "amount": "2", "unit": "大匙"},
            {"name": "芝麻油", "amount": "1", "unit": "小匙"},
            {"name": "雞蛋", "amount": "1", "unit": "個"}
        ]'::jsonb,
        '[
            {"step": 1, "instruction": "各種蔬菜分別處理：胡蘿蔔切絲，菠菜燙熟，豆芽燙熟，香菇切片炒熟"},
            {"step": 2, "instruction": "每種蔬菜用少許鹽和芝麻油調味"},
            {"step": 3, "instruction": "米飯盛入大碗，將各種蔬菜整齊擺放"},
            {"step": 4, "instruction": "中間放上韓式辣醬"},
            {"step": 5, "instruction": "煎一個荷包蛋放在最上面"},
            {"step": 6, "instruction": "食用時攪拌均勻即可"}
        ]'::jsonb,
        '["韓式料理", "拌飯", "素食", "一人份"]'::jsonb,
        'published', true, NOW() - interval '12 days',
        NOW() - interval '12 days', NOW() - interval '12 days'
    );
    
    -- 食譜5：韓式炸雞
    recipe_id_var := uuid_generate_v4();
    INSERT INTO public.recipes (
        id, user_id, title, description,
        servings, prep_time, cook_time, total_time, difficulty,
        ingredients, steps, tags, status, is_public, published_at,
        created_at, updated_at
    ) VALUES (
        recipe_id_var, yujin_id, '韓式炸雞', '外酥內嫩，配上甜辣的韓式醬汁，超讚的下酒菜！',
        4, 30, 20, 50, 'medium',
        '[
            {"name": "雞翅", "amount": "500", "unit": "克"},
            {"name": "韓式辣醬", "amount": "3", "unit": "大匙"},
            {"name": "番茄醬", "amount": "2", "unit": "大匙"},
            {"name": "糖", "amount": "2", "unit": "大匙"},
            {"name": "蒜末", "amount": "2", "unit": "大匙"},
            {"name": "麵粉", "amount": "適量", "unit": ""},
            {"name": "鹽", "amount": "適量", "unit": ""}
        ]'::jsonb,
        '[
            {"step": 1, "instruction": "雞翅用鹽和料酒醃製30分鐘"},
            {"step": 2, "instruction": "雞翅沾麵粉，下油鍋炸至金黃"},
            {"step": 3, "instruction": "鍋中放入韓式辣醬、番茄醬、糖、蒜末炒勻"},
            {"step": 4, "instruction": "放入炸好的雞翅翻炒均勻"},
            {"step": 5, "instruction": "讓每塊雞翅都裹上醬汁即可"}
        ]'::jsonb,
        '["韓式料理", "炸雞", "下酒菜", "派對美食"]'::jsonb,
        'published', true, NOW() - interval '11 days',
        NOW() - interval '11 days', NOW() - interval '11 days'
    );
    
    -- 食譜6：韓式海鮮餅
    recipe_id_var := uuid_generate_v4();
    INSERT INTO public.recipes (
        id, user_id, title, description,
        servings, prep_time, cook_time, total_time, difficulty,
        ingredients, steps, tags, status, is_public, published_at,
        created_at, updated_at
    ) VALUES (
        recipe_id_var, yujin_id, '韓式海鮮餅', '外脆內軟的海鮮餅，配特製醬料，超適合當下酒菜！',
        3, 20, 15, 35, 'medium',
        '[
            {"name": "中筋麵粉", "amount": "200", "unit": "克"},
            {"name": "雞蛋", "amount": "2", "unit": "個"},
            {"name": "蝦", "amount": "100", "unit": "克"},
            {"name": "花枝", "amount": "100", "unit": "克"},
            {"name": "韭菜", "amount": "50", "unit": "克"},
            {"name": "洋蔥", "amount": "0.5", "unit": "個"},
            {"name": "水", "amount": "200", "unit": "毫升"},
            {"name": "鹽", "amount": "適量", "unit": ""}
        ]'::jsonb,
        '[
            {"step": 1, "instruction": "蝦和花枝處理乾淨切塊，韭菜、洋蔥切段"},
            {"step": 2, "instruction": "麵粉、雞蛋、水、鹽混合成麵糊"},
            {"step": 3, "instruction": "加入所有海鮮和蔬菜拌勻"},
            {"step": 4, "instruction": "平底鍋熱油，倒入麵糊攤平"},
            {"step": 5, "instruction": "兩面煎至金黃酥脆即可"}
        ]'::jsonb,
        '["韓式料理", "海鮮", "煎餅", "下酒菜"]'::jsonb,
        'published', true, NOW() - interval '10 days',
        NOW() - interval '10 days', NOW() - interval '10 days'
    );
    
    -- 食譜7：韓式冷麵
    recipe_id_var := uuid_generate_v4();
    INSERT INTO public.recipes (
        id, user_id, title, description,
        servings, prep_time, cook_time, total_time, difficulty,
        ingredients, steps, tags, status, is_public, published_at,
        created_at, updated_at
    ) VALUES (
        recipe_id_var, yujin_id, '韓式冷麵', '清爽的冷湯配上Q彈的麵條，夏天必吃！',
        2, 30, 10, 40, 'easy',
        '[
            {"name": "韓式冷麵", "amount": "200", "unit": "克"},
            {"name": "牛肉湯", "amount": "500", "unit": "毫升"},
            {"name": "牛肉", "amount": "100", "unit": "克"},
            {"name": "水煮蛋", "amount": "1", "unit": "個"},
            {"name": "黃瓜", "amount": "0.5", "unit": "根"},
            {"name": "白蘿蔔", "amount": "50", "unit": "克"},
            {"name": "梨", "amount": "0.25", "unit": "個"},
            {"name": "白醋", "amount": "2", "unit": "大匙"},
            {"name": "糖", "amount": "1", "unit": "大匙"}
        ]'::jsonb,
        '[
            {"step": 1, "instruction": "牛肉湯放涼，加入白醋、糖調味"},
            {"step": 2, "instruction": "冷麵煮熟後用冰水沖洗，瀝乾"},
            {"step": 3, "instruction": "黃瓜、白蘿蔔、梨切絲，牛肉切片"},
            {"step": 4, "instruction": "麵條放入碗中，擺上各種配料"},
            {"step": 5, "instruction": "倒入冷湯，放上水煮蛋即可"}
        ]'::jsonb,
        '["韓式料理", "冷麵", "夏天料理", "一人份"]'::jsonb,
        'published', true, NOW() - interval '9 days',
        NOW() - interval '9 days', NOW() - interval '9 days'
    );
    
    -- 食譜8：韓式部隊鍋
    recipe_id_var := uuid_generate_v4();
    INSERT INTO public.recipes (
        id, user_id, title, description,
        servings, prep_time, cook_time, total_time, difficulty,
        ingredients, steps, tags, status, is_public, published_at,
        created_at, updated_at
    ) VALUES (
        recipe_id_var, yujin_id, '韓式部隊鍋', '豐富的配料配上濃郁的湯底，暖胃又滿足！',
        4, 20, 20, 40, 'easy',
        '[
            {"name": "韓式泡菜", "amount": "200", "unit": "克"},
            {"name": "韓式辣醬", "amount": "2", "unit": "大匙"},
            {"name": "午餐肉", "amount": "200", "unit": "克"},
            {"name": "熱狗", "amount": "4", "unit": "根"},
            {"name": "泡麵", "amount": "2", "unit": "包"},
            {"name": "起司", "amount": "100", "unit": "克"},
            {"name": "豆腐", "amount": "200", "unit": "克"},
            {"name": "金針菇", "amount": "100", "unit": "克"},
            {"name": "高湯", "amount": "800", "unit": "毫升"}
        ]'::jsonb,
        '[
            {"step": 1, "instruction": "鍋中放入泡菜和韓式辣醬"},
            {"step": 2, "instruction": "加入高湯煮開"},
            {"step": 3, "instruction": "放入午餐肉、熱狗、豆腐、金針菇"},
            {"step": 4, "instruction": "煮10分鐘後加入泡麵"},
            {"step": 5, "instruction": "最後放上起司片，煮至融化即可"}
        ]'::jsonb,
        '["韓式料理", "火鍋", "聚會美食", "一人份"]'::jsonb,
        'published', true, NOW() - interval '8 days',
        NOW() - interval '8 days', NOW() - interval '8 days'
    );
    
    -- 食譜9：韓式雞蛋捲
    recipe_id_var := uuid_generate_v4();
    INSERT INTO public.recipes (
        id, user_id, title, description,
        servings, prep_time, cook_time, total_time, difficulty,
        ingredients, steps, tags, status, is_public, published_at,
        created_at, updated_at
    ) VALUES (
        recipe_id_var, yujin_id, '韓式雞蛋捲', '嫩滑的蛋捲配上蔬菜，營養豐富的早餐選擇！',
        2, 10, 10, 20, 'easy',
        '[
            {"name": "雞蛋", "amount": "4", "unit": "個"},
            {"name": "胡蘿蔔", "amount": "0.25", "unit": "根"},
            {"name": "蔥", "amount": "2", "unit": "根"},
            {"name": "鹽", "amount": "適量", "unit": ""},
            {"name": "糖", "amount": "0.5", "unit": "小匙"},
            {"name": "芝麻油", "amount": "少許", "unit": ""}
        ]'::jsonb,
        '[
            {"step": 1, "instruction": "胡蘿蔔、蔥切末"},
            {"step": 2, "instruction": "雞蛋打散，加入胡蘿蔔、蔥、鹽、糖"},
            {"step": 3, "instruction": "平底鍋刷油，倒入一半蛋液"},
            {"step": 4, "instruction": "半熟時從一端捲起，推到鍋邊"},
            {"step": 5, "instruction": "倒入剩餘蛋液，重複捲起動作"},
            {"step": 6, "instruction": "切塊即可"}
        ]'::jsonb,
        '["韓式料理", "雞蛋", "早餐", "簡單料理"]'::jsonb,
        'published', true, NOW() - interval '7 days',
        NOW() - interval '7 days', NOW() - interval '7 days'
    );
    
    -- 食譜10：韓式辣炒年糕
    recipe_id_var := uuid_generate_v4();
    INSERT INTO public.recipes (
        id, user_id, title, description,
        servings, prep_time, cook_time, total_time, difficulty,
        ingredients, steps, tags, status, is_public, published_at,
        created_at, updated_at
    ) VALUES (
        recipe_id_var, yujin_id, '韓式辣炒年糕', 'Q彈的年糕配上甜辣的醬汁，韓國街頭小吃首選！',
        3, 10, 15, 25, 'easy',
        '[
            {"name": "年糕", "amount": "300", "unit": "克"},
            {"name": "韓式辣醬", "amount": "2", "unit": "大匙"},
            {"name": "糖", "amount": "1", "unit": "大匙"},
            {"name": "魚板", "amount": "100", "unit": "克"},
            {"name": "白煮蛋", "amount": "2", "unit": "個"},
            {"name": "高麗菜", "amount": "100", "unit": "克"},
            {"name": "蔥", "amount": "2", "unit": "根"},
            {"name": "水", "amount": "200", "unit": "毫升"}
        ]'::jsonb,
        '[
            {"step": 1, "instruction": "年糕用熱水稍微煮軟"},
            {"step": 2, "instruction": "鍋中放入韓式辣醬、糖、水煮開"},
            {"step": 3, "instruction": "放入年糕、魚板、高麗菜煮5分鐘"},
            {"step": 4, "instruction": "放入白煮蛋，繼續煮至湯汁濃稠"},
            {"step": 5, "instruction": "最後撒上蔥花即可"}
        ]'::jsonb,
        '["韓式料理", "年糕", "街頭小吃", "簡單料理"]'::jsonb,
        'published', true, NOW() - interval '6 days',
        NOW() - interval '6 days', NOW() - interval '6 days'
    );
    
    RAISE NOTICE 'Yujin 的10個食譜已全部創建';
END $$;

-- ============================================
-- 第四部分：為 Karina 創建10個食譜
-- ============================================

DO $$
DECLARE
    karina_id UUID;
    recipe_id_var UUID;
BEGIN
    SELECT user_id INTO karina_id FROM temp_recipe_users WHERE username = 'Karina';
    
    IF karina_id IS NULL THEN
        RAISE EXCEPTION '找不到 Karina 用戶';
    END IF;
    
    -- 食譜1：義式番茄肉醬麵
    recipe_id_var := uuid_generate_v4();
    INSERT INTO public.recipes (
        id, user_id, title, description,
        servings, prep_time, cook_time, total_time, difficulty,
        ingredients, steps, tags, status, is_public, published_at,
        created_at, updated_at
    ) VALUES (
        recipe_id_var, karina_id, '義式番茄肉醬麵', '經典義大利麵，濃郁的肉醬配上Q彈的麵條，絕對讓人滿足！',
        4, 20, 40, 60, 'medium',
        '[
            {"name": "義大利麵", "amount": "400", "unit": "克"},
            {"name": "絞肉", "amount": "300", "unit": "克"},
            {"name": "番茄罐頭", "amount": "400", "unit": "克"},
            {"name": "洋蔥", "amount": "1", "unit": "個"},
            {"name": "蒜", "amount": "3", "unit": "瓣"},
            {"name": "紅酒", "amount": "100", "unit": "毫升"},
            {"name": "起司粉", "amount": "適量", "unit": ""},
            {"name": "橄欖油", "amount": "2", "unit": "大匙"}
        ]'::jsonb,
        '[
            {"step": 1, "instruction": "洋蔥、蒜切末，番茄切塊"},
            {"step": 2, "instruction": "熱鍋下橄欖油，炒香洋蔥和蒜"},
            {"step": 3, "instruction": "加入絞肉炒至變色，倒入紅酒"},
            {"step": 4, "instruction": "加入番茄罐頭，小火燉煮30分鐘"},
            {"step": 5, "instruction": "同時煮義大利麵至彈牙"},
            {"step": 6, "instruction": "將麵條與肉醬拌勻，撒上起司粉即可"}
        ]'::jsonb,
        '["義式料理", "義大利麵", "西式料理", "家常菜"]'::jsonb,
        'published', true, NOW() - interval '15 days',
        NOW() - interval '15 days', NOW() - interval '15 days'
    );
    
    -- 食譜2：奶油蘑菇義大利麵
    recipe_id_var := uuid_generate_v4();
    INSERT INTO public.recipes (
        id, user_id, title, description,
        servings, prep_time, cook_time, total_time, difficulty,
        ingredients, steps, tags, status, is_public, published_at,
        created_at, updated_at
    ) VALUES (
        recipe_id_var, karina_id, '奶油蘑菇義大利麵', '濃郁的奶油白醬配上鮮美的蘑菇，簡單卻優雅。',
        3, 15, 20, 35, 'easy',
        '[
            {"name": "義大利麵", "amount": "300", "unit": "克"},
            {"name": "蘑菇", "amount": "200", "unit": "克"},
            {"name": "鮮奶油", "amount": "200", "unit": "毫升"},
            {"name": "蒜", "amount": "2", "unit": "瓣"},
            {"name": "洋蔥", "amount": "0.5", "unit": "個"},
            {"name": "起司粉", "amount": "適量", "unit": ""},
            {"name": "黑胡椒", "amount": "適量", "unit": ""}
        ]'::jsonb,
        '[
            {"step": 1, "instruction": "蘑菇切片，洋蔥、蒜切末"},
            {"step": 2, "instruction": "熱鍋下油，炒香洋蔥和蒜"},
            {"step": 3, "instruction": "加入蘑菇炒至出水"},
            {"step": 4, "instruction": "倒入鮮奶油，小火煮5分鐘"},
            {"step": 5, "instruction": "加入煮好的義大利麵拌勻"},
            {"step": 6, "instruction": "撒上起司粉和黑胡椒即可"}
        ]'::jsonb,
        '["義式料理", "義大利麵", "素食", "簡單料理"]'::jsonb,
        'published', true, NOW() - interval '14 days',
        NOW() - interval '14 days', NOW() - interval '14 days'
    );
    
    -- 食譜3：法式洋蔥湯
    recipe_id_var := uuid_generate_v4();
    INSERT INTO public.recipes (
        id, user_id, title, description,
        servings, prep_time, cook_time, total_time, difficulty,
        ingredients, steps, tags, status, is_public, published_at,
        created_at, updated_at
    ) VALUES (
        recipe_id_var, karina_id, '法式洋蔥湯', '經典法式湯品，香甜的洋蔥配上融化的起司，溫暖人心。',
        4, 30, 60, 90, 'medium',
        '[
            {"name": "洋蔥", "amount": "4", "unit": "個"},
            {"name": "牛高湯", "amount": "1", "unit": "公升"},
            {"name": "白葡萄酒", "amount": "100", "unit": "毫升"},
            {"name": "起司", "amount": "100", "unit": "克"},
            {"name": "法國麵包", "amount": "4", "unit": "片"},
            {"name": "奶油", "amount": "2", "unit": "大匙"},
            {"name": "鹽", "amount": "適量", "unit": ""}
        ]'::jsonb,
        '[
            {"step": 1, "instruction": "洋蔥切絲"},
            {"step": 2, "instruction": "熱鍋下奶油，放入洋蔥小火炒30分鐘至焦糖色"},
            {"step": 3, "instruction": "倒入白葡萄酒，煮至酒精揮發"},
            {"step": 4, "instruction": "加入牛高湯，小火煮30分鐘"},
            {"step": 5, "instruction": "湯碗放入法國麵包，倒入湯"},
            {"step": 6, "instruction": "撒上起司，放入烤箱烤至起司融化即可"}
        ]'::jsonb,
        '["法式料理", "湯品", "西式料理", "經典料理"]'::jsonb,
        'published', true, NOW() - interval '13 days',
        NOW() - interval '13 days', NOW() - interval '13 days'
    );
    
    -- 食譜4：西班牙海鮮飯
    recipe_id_var := uuid_generate_v4();
    INSERT INTO public.recipes (
        id, user_id, title, description,
        servings, prep_time, cook_time, total_time, difficulty,
        ingredients, steps, tags, status, is_public, published_at,
        created_at, updated_at
    ) VALUES (
        recipe_id_var, karina_id, '西班牙海鮮飯', '豐富的海鮮配上香料飯，一鍋到底的豪華料理！',
        4, 30, 30, 60, 'medium',
        '[
            {"name": "義大利米", "amount": "300", "unit": "克"},
            {"name": "蝦", "amount": "200", "unit": "克"},
            {"name": "淡菜", "amount": "200", "unit": "克"},
            {"name": "花枝", "amount": "150", "unit": "克"},
            {"name": "番茄", "amount": "2", "unit": "個"},
            {"name": "洋蔥", "amount": "1", "unit": "個"},
            {"name": "番紅花", "amount": "少許", "unit": ""},
            {"name": "高湯", "amount": "600", "unit": "毫升"}
        ]'::jsonb,
        '[
            {"step": 1, "instruction": "所有海鮮處理乾淨"},
            {"step": 2, "instruction": "洋蔥、番茄切丁"},
            {"step": 3, "instruction": "平底鍋熱油，炒香洋蔥和番茄"},
            {"step": 4, "instruction": "加入米和番紅花翻炒"},
            {"step": 5, "instruction": "分次加入高湯，煮15分鐘"},
            {"step": 6, "instruction": "擺上海鮮，繼續煮10分鐘至米熟透即可"}
        ]'::jsonb,
        '["西班牙料理", "海鮮", "米飯料理", "異國料理"]'::jsonb,
        'published', true, NOW() - interval '12 days',
        NOW() - interval '12 days', NOW() - interval '12 days'
    );
    
    -- 食譜5：法式烤雞
    recipe_id_var := uuid_generate_v4();
    INSERT INTO public.recipes (
        id, user_id, title, description,
        servings, prep_time, cook_time, total_time, difficulty,
        ingredients, steps, tags, status, is_public, published_at,
        created_at, updated_at
    ) VALUES (
        recipe_id_var, karina_id, '法式烤雞', '外皮酥脆，肉質鮮嫩多汁，配蔬菜一起烤，營養均衡！',
        4, 30, 60, 90, 'medium',
        '[
            {"name": "全雞", "amount": "1", "unit": "隻（約1.5公斤）"},
            {"name": "馬鈴薯", "amount": "4", "unit": "個"},
            {"name": "紅蘿蔔", "amount": "2", "unit": "根"},
            {"name": "洋蔥", "amount": "2", "unit": "個"},
            {"name": "蒜", "amount": "1", "unit": "頭"},
            {"name": "迷迭香", "amount": "2", "unit": "枝"},
            {"name": "奶油", "amount": "50", "unit": "克"},
            {"name": "鹽", "amount": "適量", "unit": ""}
        ]'::jsonb,
        '[
            {"step": 1, "instruction": "雞用鹽和迷迭香醃製30分鐘"},
            {"step": 2, "instruction": "蔬菜切塊，用鹽、胡椒調味"},
            {"step": 3, "instruction": "雞身抹上奶油，蔬菜鋪在烤盤底"},
            {"step": 4, "instruction": "雞放在蔬菜上，放入預熱200度的烤箱"},
            {"step": 5, "instruction": "烤60分鐘，中途翻面"},
            {"step": 6, "instruction": "用叉子插入雞肉，流出清汁即熟"}
        ]'::jsonb,
        '["法式料理", "烤雞", "西式料理", "主菜"]'::jsonb,
        'published', true, NOW() - interval '11 days',
        NOW() - interval '11 days', NOW() - interval '11 days'
    );
    
    -- 食譜6：義式提拉米蘇
    recipe_id_var := uuid_generate_v4();
    INSERT INTO public.recipes (
        id, user_id, title, description,
        servings, prep_time, cook_time, total_time, difficulty,
        ingredients, steps, tags, status, is_public, published_at,
        created_at, updated_at
    ) VALUES (
        recipe_id_var, karina_id, '義式提拉米蘇', '經典義式甜點，濃郁的咖啡和可可香氣，入口即化！',
        6, 30, 0, 180, 'medium',
        '[
            {"name": "馬斯卡彭起司", "amount": "500", "unit": "克"},
            {"name": "手指餅乾", "amount": "200", "unit": "克"},
            {"name": "濃縮咖啡", "amount": "200", "unit": "毫升"},
            {"name": "蛋黃", "amount": "3", "unit": "個"},
            {"name": "蛋白", "amount": "3", "unit": "個"},
            {"name": "糖", "amount": "60", "unit": "克"},
            {"name": "可可粉", "amount": "適量", "unit": ""}
        ]'::jsonb,
        '[
            {"step": 1, "instruction": "蛋黃加糖打發至淡黃色"},
            {"step": 2, "instruction": "加入馬斯卡彭起司拌勻"},
            {"step": 3, "instruction": "蛋白打發至硬性發泡，分次加入起司糊"},
            {"step": 4, "instruction": "手指餅乾快速沾一下咖啡"},
            {"step": 5, "instruction": "一層餅乾一層起司糊，重複兩次"},
            {"step": 6, "instruction": "冷藏3小時，食用前撒上可可粉"}
        ]'::jsonb,
        '["義式料理", "甜點", "蛋糕", "西式料理"]'::jsonb,
        'published', true, NOW() - interval '10 days',
        NOW() - interval '10 days', NOW() - interval '10 days'
    );
    
    -- 食譜7：牛排配馬鈴薯泥
    recipe_id_var := uuid_generate_v4();
    INSERT INTO public.recipes (
        id, user_id, title, description,
        servings, prep_time, cook_time, total_time, difficulty,
        ingredients, steps, tags, status, is_public, published_at,
        created_at, updated_at
    ) VALUES (
        recipe_id_var, karina_id, '牛排配馬鈴薯泥', '完美的五分熟牛排，配上綿密的馬鈴薯泥，經典西餐組合！',
        2, 20, 30, 50, 'medium',
        '[
            {"name": "牛排", "amount": "2", "unit": "塊（各200克）"},
            {"name": "馬鈴薯", "amount": "400", "unit": "克"},
            {"name": "奶油", "amount": "50", "unit": "克"},
            {"name": "鮮奶油", "amount": "50", "unit": "毫升"},
            {"name": "黑胡椒", "amount": "適量", "unit": ""},
            {"name": "鹽", "amount": "適量", "unit": ""},
            {"name": "蒜", "amount": "2", "unit": "瓣"}
        ]'::jsonb,
        '[
            {"step": 1, "instruction": "牛排用鹽和黑胡椒調味，回溫30分鐘"},
            {"step": 2, "instruction": "馬鈴薯煮熟壓成泥，加入奶油和鮮奶油"},
            {"step": 3, "instruction": "熱鍋下油，牛排兩面各煎2-3分鐘"},
            {"step": 4, "instruction": "加入蒜和奶油，用湯匙淋在牛排上"},
            {"step": 5, "instruction": "牛排休息5分鐘"},
            {"step": 6, "instruction": "切片搭配馬鈴薯泥即可"}
        ]'::jsonb,
        '["西式料理", "牛排", "主菜", "經典料理"]'::jsonb,
        'published', true, NOW() - interval '9 days',
        NOW() - interval '9 days', NOW() - interval '9 days'
    );
    
    -- 食譜8：義式卡布奇諾
    recipe_id_var := uuid_generate_v4();
    INSERT INTO public.recipes (
        id, user_id, title, description,
        servings, prep_time, cook_time, total_time, difficulty,
        ingredients, steps, tags, status, is_public, published_at,
        created_at, updated_at
    ) VALUES (
        recipe_id_var, karina_id, '義式卡布奇諾', '香濃的咖啡配上細緻的奶泡，完美的下午茶選擇！',
        1, 5, 5, 10, 'easy',
        '[
            {"name": "濃縮咖啡", "amount": "30", "unit": "毫升"},
            {"name": "牛奶", "amount": "150", "unit": "毫升"},
            {"name": "可可粉", "amount": "少許", "unit": ""},
            {"name": "糖", "amount": "適量", "unit": ""}
        ]'::jsonb,
        '[
            {"step": 1, "instruction": "製作濃縮咖啡"},
            {"step": 2, "instruction": "牛奶加熱至60度，用奶泡機打成細緻奶泡"},
            {"step": 3, "instruction": "將奶泡倒入咖啡中，形成分層"},
            {"step": 4, "instruction": "撒上可可粉即可"}
        ]'::jsonb,
        '["義式料理", "飲品", "咖啡", "下午茶"]'::jsonb,
        'published', true, NOW() - interval '8 days',
        NOW() - interval '8 days', NOW() - interval '8 days'
    );
    
    -- 食譜9：法式可麗餅
    recipe_id_var := uuid_generate_v4();
    INSERT INTO public.recipes (
        id, user_id, title, description,
        servings, prep_time, cook_time, total_time, difficulty,
        ingredients, steps, tags, status, is_public, published_at,
        created_at, updated_at
    ) VALUES (
        recipe_id_var, karina_id, '法式可麗餅', '薄如蟬翼的法式薄餅，可以搭配各種甜或鹹的配料！',
        4, 20, 20, 40, 'easy',
        '[
            {"name": "中筋麵粉", "amount": "200", "unit": "克"},
            {"name": "雞蛋", "amount": "3", "unit": "個"},
            {"name": "牛奶", "amount": "500", "unit": "毫升"},
            {"name": "奶油", "amount": "50", "unit": "克"},
            {"name": "糖", "amount": "2", "unit": "大匙"},
            {"name": "鹽", "amount": "少許", "unit": ""}
        ]'::jsonb,
        '[
            {"step": 1, "instruction": "所有材料混合均勻成麵糊"},
            {"step": 2, "instruction": "麵糊過篩，冷藏30分鐘"},
            {"step": 3, "instruction": "平底鍋熱油，倒入一勺麵糊"},
            {"step": 4, "instruction": "快速轉動鍋子讓麵糊攤平"},
            {"step": 5, "instruction": "煎至兩面金黃即可"},
            {"step": 6, "instruction": "可搭配果醬、鮮奶油或火腿起司"}
        ]'::jsonb,
        '["法式料理", "薄餅", "早餐", "簡單料理"]'::jsonb,
        'published', true, NOW() - interval '7 days',
        NOW() - interval '7 days', NOW() - interval '7 days'
    );
    
    -- 食譜10：義式烤蔬菜
    recipe_id_var := uuid_generate_v4();
    INSERT INTO public.recipes (
        id, user_id, title, description,
        servings, prep_time, cook_time, total_time, difficulty,
        ingredients, steps, tags, status, is_public, published_at,
        created_at, updated_at
    ) VALUES (
        recipe_id_var, karina_id, '義式烤蔬菜', '用橄欖油和香草烤製的各種蔬菜，健康又美味！',
        4, 20, 30, 50, 'easy',
        '[
            {"name": "茄子", "amount": "1", "unit": "條"},
            {"name": "節瓜", "amount": "2", "unit": "根"},
            {"name": "紅甜椒", "amount": "2", "unit": "個"},
            {"name": "番茄", "amount": "3", "unit": "個"},
            {"name": "洋蔥", "amount": "1", "unit": "個"},
            {"name": "橄欖油", "amount": "3", "unit": "大匙"},
            {"name": "義式香草", "amount": "1", "unit": "大匙"},
            {"name": "鹽", "amount": "適量", "unit": ""}
        ]'::jsonb,
        '[
            {"step": 1, "instruction": "所有蔬菜切塊"},
            {"step": 2, "instruction": "用橄欖油、香草、鹽調味"},
            {"step": 3, "instruction": "鋪在烤盤上"},
            {"step": 4, "instruction": "放入預熱200度的烤箱烤30分鐘"},
            {"step": 5, "instruction": "中途翻面，烤至蔬菜軟化即可"}
        ]'::jsonb,
        '["義式料理", "素食", "配菜", "健康料理"]'::jsonb,
        'published', true, NOW() - interval '6 days',
        NOW() - interval '6 days', NOW() - interval '6 days'
    );
    
    RAISE NOTICE 'Karina 的10個食譜已全部創建';
END $$;

-- ============================================
-- 第五部分：為所有食譜添加約50個評價
-- ============================================

DO $$
DECLARE
    recipe_record RECORD;
    user_record RECORD;
    rating_user_ids UUID[];
    rating_user_id UUID;
    rating_value INTEGER;
    rating_counter INTEGER;
    attempts INTEGER;
    max_attempts INTEGER;
    review_texts TEXT[] := ARRAY[
        '很好吃！一定會再做的！',
        '不錯的食譜，步驟很清楚',
        '味道很棒，家人很喜歡',
        '稍微調整了一下調味，結果很滿意',
        '第一次做就成功了，很有成就感',
        '比預期的還要好吃',
        '簡單易做，推薦給新手',
        '已經做過好幾次了，每次都成功',
        '朋友都說好吃，很受歡迎',
        '味道不錯，但需要多練習',
        '步驟詳細，很適合我這種新手',
        '調味剛好，不需要再調整',
        '色香味俱全，看起來就很專業',
        '比餐廳的還好吃',
        '做法簡單，時間也很快',
        '營養又美味，很適合家庭',
        '食材容易取得，很方便',
        '做了給家人吃，大家都說讚',
        '第一次做這個，結果超乎預期',
        '步驟清楚，照著做就能成功',
        '味道不錯，但可以再調整一下',
        '很實用的食譜，收藏了',
        '做出了餐廳的味道，很滿意',
        '簡單快速，適合忙碌的時候',
        '味道很棒，但需要一點技巧',
        '按照食譜做，結果很成功',
        '食材新鮮，味道自然就好',
        '適合宴客，看起來很高級',
        '做起來不難，味道也不錯',
        '家人很喜歡，會經常做',
        '比想像中簡單，推薦',
        '味道還可以，但有改進空間',
        '步驟有點多，但值得',
        '做出來的成品很漂亮',
        '味道正宗，很滿意',
        '適合初學者，容易上手',
        '做出來的效果很好',
        '味道不錯，可以嘗試',
        '步驟詳細，不會失敗',
        '很實用的家常菜',
        NULL,
        NULL,
        NULL,
        NULL,
        NULL
    ];
    review_text TEXT;
    total_ratings INTEGER := 50;
BEGIN
    -- 獲取所有可以評分的用戶ID（排除三位作者）
    SELECT ARRAY_AGG(id) INTO rating_user_ids
    FROM public.profiles
    WHERE username NOT IN ('Chaewon', 'Yujin', 'Karina')
    AND id IS NOT NULL;
    
    IF rating_user_ids IS NULL OR array_length(rating_user_ids, 1) = 0 THEN
        RAISE NOTICE '沒有可用的用戶進行評分，請先確保有足夠的用戶';
        RETURN;
    END IF;
    
    -- 為每個食譜添加評價
    FOR recipe_record IN 
        SELECT r.id as recipe_id, r.user_id as author_id, p.username as author_name, r.created_at as recipe_created_at
        FROM public.recipes r
        JOIN public.profiles p ON r.user_id = p.id
        WHERE p.username IN ('Chaewon', 'Yujin', 'Karina')
        AND r.status = 'published'
        ORDER BY r.created_at
    LOOP
        -- 為每個食譜隨機選擇50個不同的用戶進行評分
        rating_counter := 0;
        attempts := 0;
        max_attempts := total_ratings * 3; -- 最多嘗試次數
        
        WHILE rating_counter < total_ratings AND attempts < max_attempts LOOP
            attempts := attempts + 1;
                
                -- 隨機選擇一個用戶（從非作者用戶中選擇）
                rating_user_id := rating_user_ids[1 + floor(random() * array_length(rating_user_ids, 1))::int];
                
                -- 檢查該用戶是否已經評價過這個食譜
                IF EXISTS (SELECT 1 FROM public.recipe_ratings WHERE recipe_id = recipe_record.recipe_id AND user_id = rating_user_id) THEN
                    CONTINUE; -- 如果已經評價過，跳過
                END IF;
            
            -- 生成評分（1-5分，但大多數是3-5分，符合真實情況）
            IF random() < 0.05 THEN
                rating_value := 1; -- 5% 一星
            ELSIF random() < 0.10 THEN
                rating_value := 2; -- 5% 二星
            ELSIF random() < 0.25 THEN
                rating_value := 3; -- 15% 三星
            ELSIF random() < 0.65 THEN
                rating_value := 4; -- 40% 四星
            ELSE
                rating_value := 5; -- 35% 五星
            END IF;
            
            -- 約30%的評價有文字評論
            IF random() < 0.3 THEN
                review_text := review_texts[1 + floor(random() * array_length(review_texts, 1))::int];
            ELSE
                review_text := NULL;
            END IF;
            
            -- 插入評價
            INSERT INTO public.recipe_ratings (
                recipe_id,
                user_id,
                rating,
                review,
                created_at,
                updated_at
            ) VALUES (
                recipe_record.recipe_id,
                rating_user_id,
                rating_value,
                review_text,
                recipe_record.recipe_created_at + (random() * interval '14 days'), -- 在食譜發布後14天內隨機時間
                recipe_record.recipe_created_at + (random() * interval '14 days')
            );
            
            rating_counter := rating_counter + 1;
        END LOOP;
        
        RAISE NOTICE '已為食譜 % 添加 % 個評價', recipe_record.recipe_id, rating_counter;
    END LOOP;
    
    RAISE NOTICE '所有食譜的評價已添加完成';
END $$;

-- ============================================
-- 驗證結果
-- ============================================

-- 檢查每個用戶的食譜數量
SELECT 
    p.username,
    p.display_name,
    COUNT(r.id) as recipe_count
FROM public.profiles p
LEFT JOIN public.recipes r ON r.user_id = p.id AND r.status = 'published'
WHERE p.username IN ('Chaewon', 'Yujin', 'Karina')
GROUP BY p.id, p.username, p.display_name
ORDER BY p.username;

-- 檢查每個食譜的評價數量
SELECT 
    p.username as author,
    r.title as recipe_title,
    COUNT(rr.id) as rating_count,
    ROUND(AVG(rr.rating::numeric), 2) as average_rating,
    r.rating_count as recipe_rating_count,
    r.average_rating as recipe_avg_rating
FROM public.recipes r
JOIN public.profiles p ON r.user_id = p.id
LEFT JOIN public.recipe_ratings rr ON rr.recipe_id = r.id
WHERE p.username IN ('Chaewon', 'Yujin', 'Karina')
AND r.status = 'published'
GROUP BY p.username, r.id, r.title, r.rating_count, r.average_rating
ORDER BY p.username, r.created_at;

-- 統計總評價數
SELECT 
    'Total ratings created' as description,
    COUNT(*) as count
FROM public.recipe_ratings rr
JOIN public.recipes r ON rr.recipe_id = r.id
JOIN public.profiles p ON r.user_id = p.id
WHERE p.username IN ('Chaewon', 'Yujin', 'Karina');

-- 清理臨時表
DROP TABLE IF EXISTS temp_recipe_users;

