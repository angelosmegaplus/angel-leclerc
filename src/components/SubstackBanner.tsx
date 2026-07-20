export function SubstackBanner() {
  return (
    <a
      href="https://blog.angel-leclerc.fr"
      target="_blank"
      rel="noopener noreferrer"
      className="block w-full bg-primary text-primary-foreground hover:bg-primary/95 transition-colors"
    >
      <div className="container-tight flex items-center justify-center gap-2 py-2.5 text-sm font-medium">
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="currentColor"
          aria-hidden="true"
          className="shrink-0"
        >
          <path d="M22.539 8.242H1.46V5.406h21.08v2.836zM1.46 10.812V24L12 18.11 22.54 24V10.812H1.46zM22.54 0H1.46v2.836h21.08V0z" />
        </svg>
        <span>Mon blog — là où j'écris mes pensées</span>
        <span aria-hidden="true">→</span>
      </div>
    </a>
  );
}
