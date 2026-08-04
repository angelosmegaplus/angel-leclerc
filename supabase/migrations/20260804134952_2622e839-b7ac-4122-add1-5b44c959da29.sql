UPDATE public.feedback_settings
SET support_enabled = true,
    revolut_links = jsonb_build_object('custom', 'https://checkout.revolut.com/pay/7806bfcf-ddff-4ad9-aef4-47958964c2c8')
WHERE id = true;