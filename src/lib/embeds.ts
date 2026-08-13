/** Génère le HTML d'intégration pour les principales plateformes audio/vidéo. */

export type EmbedResult = { html: string; label: string };

const iframe = (src: string, title: string, opts: { ratio?: boolean; height?: number } = {}) => {
  const allow =
    "accelerometer; autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture";
  if (opts.ratio) {
    return `<div class="video-embed"><iframe src="${src}" title="${title}" loading="lazy" allow="${allow}" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe></div><p><br/></p>`;
  }
  return `<iframe class="media-frame" src="${src}" title="${title}" height="${opts.height ?? 180}" loading="lazy" allow="${allow}"></iframe><p><br/></p>`;
};

export function buildEmbedHtml(input: string): EmbedResult | null {
  const raw = input.trim();
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return null;
  }
  const host = url.hostname.replace(/^www\./, "");
  const path = url.pathname;

  // YouTube
  const yt = raw.match(
    /(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([\w-]{11})/,
  );
  if (yt) {
    return {
      html: iframe(`https://www.youtube-nocookie.com/embed/${yt[1]}`, "Vidéo YouTube", {
        ratio: true,
      }),
      label: "YouTube",
    };
  }

  // Spotify (titre, album, playlist, artiste, podcast, épisode)
  if (host.endsWith("spotify.com")) {
    const m = path.match(/\/(track|album|playlist|artist|show|episode)\/([A-Za-z0-9]+)/);
    if (m) {
      const compact = m[1] === "track" || m[1] === "episode";
      return {
        html: iframe(
          `https://open.spotify.com/embed/${m[1]}/${m[2]}?utm_source=generator`,
          "Lecteur Spotify",
          { height: compact ? 152 : 352 },
        ),
        label: "Spotify",
      };
    }
  }

  // Deezer
  if (host.endsWith("deezer.com")) {
    const m = path.match(/\/(track|album|playlist|episode|show)\/(\d+)/);
    if (m) {
      return {
        html: iframe(`https://widget.deezer.com/widget/auto/${m[1]}/${m[2]}`, "Lecteur Deezer", {
          height: m[1] === "track" ? 150 : 300,
        }),
        label: "Deezer",
      };
    }
  }

  // SoundCloud
  if (host.endsWith("soundcloud.com")) {
    return {
      html: iframe(
        `https://w.soundcloud.com/player/?url=${encodeURIComponent(raw)}&color=%23ce654b&auto_play=false&show_comments=false`,
        "Lecteur SoundCloud",
        { height: 166 },
      ),
      label: "SoundCloud",
    };
  }

  // Apple Music / Podcasts
  if (host.endsWith("music.apple.com") || host.endsWith("podcasts.apple.com")) {
    const embedHost = host.replace(/^(music|podcasts)\./, "embed.$1.");
    return {
      html: iframe(`https://${embedHost}${path}${url.search}`, "Lecteur Apple", {
        height: host.startsWith("podcasts") ? 175 : 320,
      }),
      label: "Apple",
    };
  }

  // Vimeo
  if (host.endsWith("vimeo.com")) {
    const m = path.match(/\/(\d+)/);
    if (m) {
      return {
        html: iframe(`https://player.vimeo.com/video/${m[1]}`, "Vidéo Vimeo", {
          ratio: true,
        }),
        label: "Vimeo",
      };
    }
  }

  // Dailymotion
  if (host.endsWith("dailymotion.com") || host === "dai.ly") {
    const m = raw.match(/(?:dailymotion\.com\/video\/|dai\.ly\/)([A-Za-z0-9]+)/);
    if (m) {
      return {
        html: iframe(`https://www.dailymotion.com/embed/video/${m[1]}`, "Vidéo Dailymotion", {
          ratio: true,
        }),
        label: "Dailymotion",
      };
    }
  }

  // Ausha
  if (host.endsWith("ausha.co")) {
    const m = path.match(/\/([\w-]+)/);
    if (m) {
      return {
        html: iframe(`https://player.ausha.co/index.html?podcastId=${m[1]}`, "Lecteur Ausha", {
          height: 220,
        }),
        label: "Ausha",
      };
    }
  }

  // Substack
  if (host.endsWith("substack.com")) {
    return {
      html: iframe(raw, "Publication Substack", { height: 320 }),
      label: "Substack",
    };
  }

  // Fichier audio/vidéo direct
  if (/\.(mp4|webm|mov)(\?|$)/i.test(raw)) {
    return {
      html: `<video class="media-video" src="${raw}" controls playsinline preload="metadata"></video><p><br/></p>`,
      label: "Vidéo",
    };
  }
  if (/\.(mp3|wav|ogg|m4a)(\?|$)/i.test(raw)) {
    return {
      html: `<figure class="media-audio"><audio src="${raw}" controls preload="metadata"></audio></figure><p><br/></p>`,
      label: "Audio",
    };
  }

  return null;
}
