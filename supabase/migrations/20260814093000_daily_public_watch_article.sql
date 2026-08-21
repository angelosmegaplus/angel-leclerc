-- Réutilise le secret du planificateur existant sans l'écrire dans le dépôt.
-- Les environnements de preview Supabase n'activent pas nécessairement pg_cron/vault.
-- Dans ce cas, la migration reste rejouable sans bloquer toute la preview : le cron
-- est une capacité de production et sera configuré là où les extensions existent.
do $$
declare
  scheduler_secret text;
begin
  if to_regclass('cron.job') is null then
    raise notice 'pg_cron indisponible : planification daily-public-watch-article ignorée dans cet environnement';
    return;
  end if;

  if to_regclass('vault.decrypted_secrets') is null then
    raise notice 'Supabase Vault indisponible : planification daily-public-watch-article ignorée dans cet environnement';
    return;
  end if;

  select (regexp_match(command, 'x-newsletter-token"\s*:\s*"([^"]+)"'))[1]
    into scheduler_secret
    from cron.job
   where jobname = 'weekly-newsletter'
   limit 1;

  if scheduler_secret is null then
    raise notice 'Secret du planificateur existant introuvable : planification daily-public-watch-article ignorée';
    return;
  end if;

  if not exists (select 1 from vault.decrypted_secrets where name = 'angel_daily_article_cron') then
    perform vault.create_secret(scheduler_secret, 'angel_daily_article_cron');
  end if;

  if exists (select 1 from cron.job where jobname = 'daily-public-watch-article') then
    perform cron.unschedule('daily-public-watch-article');
  end if;

  perform cron.schedule(
    'daily-public-watch-article',
    '0 8 * * *',
    $command$
      select net.http_post(
        url := 'https://www.angel-leclerc.fr/api/public/hooks/daily-article',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'x-cron-token', (select decrypted_secret from vault.decrypted_secrets where name = 'angel_daily_article_cron' limit 1)
        ),
        body := '{}'::jsonb,
        timeout_milliseconds := 60000
      ) as request_id;
    $command$
  );
end $$;
