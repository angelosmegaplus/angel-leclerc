select cron.alter_job(
  1,
  command := $cmd$
  select net.http_post(
    url:='https://project--5bca9ec4-6763-4641-aa6d-439dc0e8bfc8.lovable.app/api/public/hooks/newsletter',
    headers:='{"Content-Type": "application/json", "x-newsletter-token": "bfc220e1a5fb5106b6763c677b1f9b0b3aa23fef7f42615ff64a308049f12fdb"}'::jsonb,
    body:='{}'::jsonb
  ) as request_id;
  $cmd$
);