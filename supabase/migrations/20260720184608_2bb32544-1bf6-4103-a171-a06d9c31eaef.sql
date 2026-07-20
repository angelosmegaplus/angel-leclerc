CREATE TABLE public.contact_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  structure TEXT,
  project_type TEXT NOT NULL,
  budget TEXT,
  deadline TEXT,
  description TEXT NOT NULL,
  attachment_path TEXT,
  attachment_name TEXT,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT ALL ON public.contact_requests TO service_role;

ALTER TABLE public.contact_requests ENABLE ROW LEVEL SECURITY;

-- No public policies: only service_role (server functions) can access.
-- Public writes happen through a server function using supabaseAdmin.

CREATE INDEX contact_requests_created_at_idx ON public.contact_requests (created_at DESC);
CREATE INDEX contact_requests_ip_created_idx ON public.contact_requests (ip_address, created_at DESC);