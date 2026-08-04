CREATE TABLE public.content_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  section text NOT NULL,
  title text NOT NULL,
  subtitle text,
  period text,
  description text,
  bullets jsonb NOT NULL DEFAULT '[]'::jsonb,
  tags jsonb NOT NULL DEFAULT '[]'::jsonb,
  videos jsonb NOT NULL DEFAULT '[]'::jsonb,
  extra_label text,
  extra_value text,
  logo_domain text,
  logo_url text,
  icon text,
  url text,
  link_label text,
  sort_order integer NOT NULL DEFAULT 0,
  published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.content_items TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.content_items TO authenticated;
GRANT ALL ON public.content_items TO service_role;

ALTER TABLE public.content_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Contenus visibles publiquement"
  ON public.content_items FOR SELECT
  USING (published = true OR private.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins peuvent creer des contenus"
  ON public.content_items FOR INSERT TO authenticated
  WITH CHECK (private.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins peuvent modifier des contenus"
  ON public.content_items FOR UPDATE TO authenticated
  USING (private.has_role(auth.uid(), 'admin'))
  WITH CHECK (private.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins peuvent supprimer des contenus"
  ON public.content_items FOR DELETE TO authenticated
  USING (private.has_role(auth.uid(), 'admin'));

CREATE INDEX content_items_section_idx ON public.content_items (section, sort_order);

CREATE TRIGGER update_content_items_updated_at
  BEFORE UPDATE ON public.content_items
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.content_items (section, title, subtitle, period, description, bullets, tags, videos, extra_label, extra_value, logo_domain, icon, url, link_label, sort_order) VALUES
('experience', $t$Agent de propreté urbaine (emploi saisonnier)$t$, $t$Mairie de Sarlat-la-Canéda$t$, $t$Depuis juillet 2026$t$, NULL,
 $j$["Entretien et propreté des rues et espaces publics du centre historique","Travail en équipe, en autonomie et en horaires matinaux","Contact quotidien avec les habitants et les visiteurs","Rigueur, ponctualité et sens du service public"]$j$::jsonb,
 '[]'::jsonb, '[]'::jsonb, NULL, NULL, 'sarlat.fr', 'Building2', NULL, NULL, 10),
('experience', $t$Apprenti — Baccalauréat professionnel Métiers de l'accueil$t$, $t$Office de Tourisme Val de Sioule$t$, $t$2023 – 2025$t$, NULL,
 $j$["Accueil des visiteurs, vente de produits touristiques, gestion des demandes par téléphone et e-mail","Création de livrets pour les hébergeurs, de livrets statistiques et d'affiches promotionnelles","Montages vidéos et publications réseaux sociaux avec Canva","Utilisation d'outils professionnels : Moka, Koesio, Avizi, Apidae, Brevo, Microsoft"]$j$::jsonb,
 '[]'::jsonb, '[]'::jsonb, NULL, NULL, 'valdesioule.com', 'Building2', NULL, NULL, 20),
('experience', $t$Service civique — développement d'une émission jeunesse$t$, $t$Ligue de l'enseignement 03 · Radio Bocage$t$, $t$2026 — 2 mois$t$, NULL,
 $j$["Réflexion sur le concept de l'émission","Recherche et préparation de contenus","Participation au développement du projet","Découverte de la production radiophonique"]$j$::jsonb,
 '[]'::jsonb, '[]'::jsonb, NULL, NULL, 'laligue.org', 'Radio', NULL, NULL, 30),
('experience', $t$Missions ponctuelles auprès de particuliers et d'employeurs$t$, $t$Intérim et petits travaux$t$, $t$2026$t$, NULL,
 $j$["Électricité, ménage, peinture, bûcheronnage et autres missions pratiques","Développement de l'autonomie, de la ponctualité et de la polyvalence","Adaptation rapide à différents environnements de travail"]$j$::jsonb,
 '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, 'Hammer', NULL, NULL, 40),
('formation', $t$Baccalauréat professionnel Métiers de l'accueil$t$, $t$MFR du Périgord noir — Salignac$t$, $t$Sept. 2023 – Juil. 2025$t$,
 $t$Diplôme de niveau 4 préparé en alternance dans une Maison familiale rurale (MFR), un établissement de formation par alternance qui associe périodes en entreprise et semaines de cours en petits groupes. Le baccalauréat professionnel Métiers de l'accueil forme à l'accueil physique et téléphonique, à la relation client, à la vente de services et de produits, à la gestion de l'information et au travail administratif au sein d'une structure recevant du public.$t$,
 $j$["Accueil, orientation et conseil des visiteurs et des clients","Vente, gestion des demandes et suivi administratif","Communication écrite et orale, outils numériques et bureautiques","Deux ans en alternance à l'Office de Tourisme Val de Sioule"]$j$::jsonb,
 $j$["Mention Bien","SST — Sauveteur secouriste du travail"]$j$::jsonb,
 $j$[{"id":"knKUojBLR2I","title":"Baccalauréat professionnel Métiers de l'accueil — présentation"},{"id":"03vn5fWIIOQ","title":"MFR du Périgord noir — Salignac"}]$j$::jsonb,
 NULL, NULL, NULL, 'GraduationCap', NULL, NULL, 10),
('certification', $t$Les principes fondamentaux du marketing numérique$t$, $t$Google$t$, NULL,
 $t$Certification en ligne couvrant le référencement, la publicité, les réseaux sociaux, l'e-mailing et l'analyse d'audience.$t$,
 '[]'::jsonb, '[]'::jsonb, '[]'::jsonb, NULL, NULL, 'google.com', 'Award', NULL, NULL, 10),
('certification', $t$BAFA$t$, $t$Ligue de l'enseignement$t$, NULL,
 $t$Brevet d'aptitude aux fonctions d'animateur : encadrement de groupes d'enfants et de jeunes en accueils collectifs de mineurs.$t$,
 '[]'::jsonb, '[]'::jsonb, '[]'::jsonb, NULL, NULL, 'laligue.org', 'Award', NULL, NULL, 20),
('certification', $t$PSC1$t$, $t$Prévention et secours civiques$t$, NULL,
 $t$Formation aux gestes de premiers secours : alerte, protection, malaises, hémorragies et réanimation.$t$,
 '[]'::jsonb, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, 'Award', NULL, NULL, 30),
('certification', $t$SST$t$, $t$Sauveteur secouriste du travail$t$, NULL,
 $t$Prévention des risques professionnels et intervention en cas d'accident sur le lieu de travail.$t$,
 '[]'::jsonb, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, 'Award', NULL, NULL, 40),
('engagement', $t$Président d'association$t$, $t$La Fraternité du Scoutisme$t$, NULL,
 $t$Coordination associative, organisation de projets, communication, animation de bénévoles et gestion des responsabilités.$t$,
 '[]'::jsonb, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, 'HeartHandshake', NULL, NULL, 10),
('engagement', $t$Chef scout$t$, $t$Scouts et Guides de France · Scouts d'Europe$t$, $t$3 ans$t$,
 $t$Encadrement de jeunes, préparation d'activités, travail en équipe, organisation et prise de responsabilités.$t$,
 '[]'::jsonb, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, 'Tent', NULL, NULL, 20),
('engagement', $t$Bénévole$t$, $t$Réseau Baden-Powell — Archives Nationales du Scoutisme$t$, NULL,
 $t$Contribution aux archives nationales du scoutisme : classement, recherche documentaire et valorisation du patrimoine.$t$,
 '[]'::jsonb, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, 'Archive', NULL, NULL, 30),
('engagement', $t$Bénévole$t$, $t$Amis de Renard Noir$t$, NULL,
 $t$Pédagogie, formations et transmission auprès des jeunes bénévoles.$t$,
 '[]'::jsonb, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, 'BookOpen', NULL, NULL, 40),
('projet', $t$Tombola Patrimoine$t$, NULL, NULL,
 $t$Campagne de communication au service d'une tombola destinée à financer la restauration de la chapelle de la Visitation à Besançon.$t$,
 $j$["Création et amélioration du site internet de la campagne","Définition de la stratégie de communication et du calendrier éditorial","Rédaction et publication des contenus sur les réseaux sociaux","Relations presse et recherche de relais médiatiques"]$j$::jsonb,
 '[]'::jsonb, '[]'::jsonb,
 $t$Lovable · Canva · Meta Business Suite · rédaction web$t$,
 $t$Une campagne visible en ligne et relayée par les médias locaux, avec un site clair pour informer et inciter à participer.$t$,
 NULL, 'PenLine', NULL, NULL, 10),
('projet', $t$Angel Leclerc Communication$t$, NULL, NULL,
 $t$Création de mon activité de communication en tant qu'entrepreneur individuel.$t$,
 $j$["Construction de l'identité visuelle et de la ligne éditoriale","Conception et mise en ligne du site internet","Structuration de l'offre de services et des tarifs indicatifs"]$j$::jsonb,
 '[]'::jsonb, '[]'::jsonb,
 $t$Lovable · Canva · Figma · Squarespace$t$,
 $t$Un site professionnel en ligne, une offre lisible et un premier canal de contact pour les clients.$t$,
 NULL, 'Briefcase', 'https://www.angel-leclerc.fr', 'Voir le projet', 20),
('projet', $t$Projet d'émission jeunesse — Radio Bocage$t$, NULL, NULL,
 $t$Service civique auprès de la Ligue de l'enseignement 03, au sein d'une radio associative.$t$,
 $j$["Réflexion sur le concept et le format de l'émission","Recherche de sujets et préparation éditoriale","Découverte de la production et du montage radiophonique"]$j$::jsonb,
 '[]'::jsonb, '[]'::jsonb,
 $t$Rédaction · recherche · montage audio · MixPad$t$,
 $t$Un concept d'émission jeunesse construit et une première expérience concrète de la production radio.$t$,
 NULL, 'Radio', NULL, NULL, 30),
('projet', $t$Créations graphiques et projets associatifs$t$, NULL, NULL,
 $t$Missions ponctuelles de création de supports pour des projets personnels, professionnels et associatifs.$t$,
 $j$["Affiches, flyers et publications pour les réseaux sociaux","Logos et identités visuelles simples","Documents de présentation et supports numériques"]$j$::jsonb,
 '[]'::jsonb, '[]'::jsonb,
 $t$Canva · Figma · Adobe$t$,
 $t$Des supports homogènes et réutilisables, adaptés à chaque public et à chaque format.$t$,
 NULL, 'Palette', NULL, NULL, 40),
('service', $t$Gestion de projet$t$, NULL, NULL,
 $t$Organisation et suivi de votre projet de la conception à la mise en œuvre.$t$,
 $j$["Cadrage, planning et jalons","Coordination des étapes et intervenants","Recherche et pilotage des prestataires","Suivi et points d'avancement"]$j$::jsonb,
 '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, 'Compass', NULL, NULL, 10),
('service', $t$Conseil en communication$t$, NULL, NULL,
 $t$Analyse des besoins et définition d'une stratégie adaptée au projet.$t$,
 $j$["Analyse du contexte, des publics et des objectifs","Positionnement et messages clés","Choix des supports et canaux","Plan d'action et recommandations"]$j$::jsonb,
 '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, 'Layers', NULL, NULL, 20),
('service', $t$Rédaction et contenus éditoriaux$t$, NULL, NULL,
 $t$Rédaction de textes professionnels, journalistiques ou numériques.$t$,
 $j$["Articles, portraits, interviews","Enquêtes et recherches","Textes institutionnels et communiqués","Contenus web et réseaux sociaux","Ton adapté au public visé"]$j$::jsonb,
 '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, 'FileText', NULL, NULL, 30),
('service_extra', $t$Rédaction de textes$t$, NULL, NULL, $t$Articles, enquêtes et réflexions éditoriales.$t$,
 '[]'::jsonb, '[]'::jsonb, '[]'::jsonb, NULL, $t$à partir de 30 €$t$, NULL, 'PenLine', NULL, NULL, 10),
('service_extra', $t$Affiche ou flyer$t$, NULL, NULL, NULL,
 '[]'::jsonb, '[]'::jsonb, '[]'::jsonb, NULL, $t$à partir de 50 €$t$, NULL, 'FileImage', NULL, NULL, 20),
('service_extra', $t$Identité visuelle simple$t$, NULL, NULL, NULL,
 '[]'::jsonb, '[]'::jsonb, '[]'::jsonb, NULL, $t$à partir de 150 €$t$, NULL, 'Palette', NULL, NULL, 30),
('service_extra', $t$Recherche et coordination de prestataires$t$, NULL, NULL, NULL,
 '[]'::jsonb, '[]'::jsonb, '[]'::jsonb, NULL, $t$sur devis$t$, NULL, 'Network', NULL, NULL, 40),
('service_extra', $t$Production audio, vidéo ou numérique$t$, NULL, NULL, NULL,
 '[]'::jsonb, '[]'::jsonb, '[]'::jsonb, NULL, $t$sur devis$t$, NULL, 'Radio', NULL, NULL, 50),
('service_extra', $t$Création de sites internet$t$, NULL, NULL, $t$Sites vitrines ou simples via Lovable ou Webnode.$t$,
 '[]'::jsonb, '[]'::jsonb, '[]'::jsonb, NULL, $t$sur devis$t$, NULL, 'Globe', NULL, NULL, 60),
('service_extra', $t$Réseaux sociaux$t$, NULL, NULL, $t$Création, gestion ou accompagnement de comptes et pages : Instagram, Facebook, TikTok…$t$,
 '[]'::jsonb, '[]'::jsonb, '[]'::jsonb, NULL, $t$sur devis$t$, NULL, 'Smartphone', NULL, NULL, 70),
('service_extra', $t$Accompagnement création d'association$t$, NULL, NULL, $t$Association loi 1901 : démarches, conseil et organisation.$t$,
 '[]'::jsonb, '[]'::jsonb, '[]'::jsonb, NULL, $t$sur devis$t$, NULL, 'Building2', NULL, NULL, 80);