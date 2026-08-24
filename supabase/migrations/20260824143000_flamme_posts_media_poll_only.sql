-- Les medias sont ajoutes apres la creation du post et un sondage peut etre publie sans texte libre.
-- L'ancienne contrainte exigeant content non vide annulait donc les posts photo/sondage valides.
alter table public.flamme_posts drop constraint if exists flamme_posts_check;
