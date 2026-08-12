CREATE TABLE IF NOT EXISTS public.oauth_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider text NOT NULL,
  user_id uuid NOT NULL,
  account_label text,
  token_ciphertext text NOT NULL,
  scopes text[] NOT NULL DEFAULT '{}',
  status text NOT NULL DEFAULT 'connected',
  expires_at timestamptz,
  last_sync_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, provider)
);
GRANT ALL ON public.oauth_connections TO service_role;
ALTER TABLE public.oauth_connections ENABLE ROW LEVEL SECURITY;