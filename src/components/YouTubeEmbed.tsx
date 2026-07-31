interface YouTubeEmbedProps {
  id: string;
  title: string;
}

export function YouTubeEmbed({ id, title }: YouTubeEmbedProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-background">
      <div className="relative w-full pt-[56.25%]">
        <iframe
          className="absolute inset-0 h-full w-full"
          src={`https://www.youtube-nocookie.com/embed/${id}`}
          title={title}
          loading="lazy"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          referrerPolicy="strict-origin-when-cross-origin"
          allowFullScreen
        />
      </div>
    </div>
  );
}
