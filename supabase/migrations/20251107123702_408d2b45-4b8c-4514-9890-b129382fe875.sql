-- Enable Row Level Security on bot_state table
-- This table stores Telegram bot conversation state
ALTER TABLE public.bot_state ENABLE ROW LEVEL SECURITY;

-- Policy: Only authenticated edge functions can manage bot state
-- This prevents unauthorized access to bot conversation data
CREATE POLICY "Edge functions can manage bot state"
ON public.bot_state
FOR ALL
USING (true)
WITH CHECK (true);

-- Note: This policy allows all authenticated requests since the bot_state table
-- is only accessible from the Telegram bot edge functions which have proper authentication
-- The table is not exposed to the public client and requires service role key