DROP TRIGGER IF EXISTS sync_git_article_state_trigger ON public.articles;
DROP FUNCTION IF EXISTS public.sync_git_article_state();
DROP TABLE IF EXISTS public.git_article_state;