-- ============================================
-- Chatbot 對話歷史資料表
-- ============================================

-- Create chatbot_conversations table
CREATE TABLE IF NOT EXISTS public.chatbot_conversations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create chatbot_messages table
CREATE TABLE IF NOT EXISTS public.chatbot_messages (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    conversation_id UUID REFERENCES public.chatbot_conversations(id) ON DELETE CASCADE NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
    content TEXT NOT NULL,
    recipes JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_chatbot_conversations_user_id ON public.chatbot_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_chatbot_conversations_created_at ON public.chatbot_conversations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chatbot_messages_conversation_id ON public.chatbot_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_chatbot_messages_created_at ON public.chatbot_messages(created_at);

-- Enable Row Level Security
ALTER TABLE public.chatbot_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chatbot_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for chatbot_conversations
-- Users can only see their own conversations
CREATE POLICY "Users can view their own conversations"
    ON public.chatbot_conversations
    FOR SELECT
    USING (auth.uid() = user_id);

-- Users can create their own conversations
CREATE POLICY "Users can create their own conversations"
    ON public.chatbot_conversations
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can update their own conversations
CREATE POLICY "Users can update their own conversations"
    ON public.chatbot_conversations
    FOR UPDATE
    USING (auth.uid() = user_id);

-- Users can delete their own conversations
CREATE POLICY "Users can delete their own conversations"
    ON public.chatbot_conversations
    FOR DELETE
    USING (auth.uid() = user_id);

-- RLS Policies for chatbot_messages
-- Users can only see messages from their own conversations
CREATE POLICY "Users can view messages from their own conversations"
    ON public.chatbot_messages
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.chatbot_conversations
            WHERE chatbot_conversations.id = chatbot_messages.conversation_id
            AND chatbot_conversations.user_id = auth.uid()
        )
    );

-- Users can create messages in their own conversations
CREATE POLICY "Users can create messages in their own conversations"
    ON public.chatbot_messages
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.chatbot_conversations
            WHERE chatbot_conversations.id = chatbot_messages.conversation_id
            AND chatbot_conversations.user_id = auth.uid()
        )
    );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_chatbot_conversation_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.chatbot_conversations
    SET updated_at = TIMEZONE('utc'::text, NOW())
    WHERE id = NEW.conversation_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update updated_at when a message is created
CREATE TRIGGER update_chatbot_conversation_timestamp
    AFTER INSERT ON public.chatbot_messages
    FOR EACH ROW
    EXECUTE FUNCTION update_chatbot_conversation_updated_at();

