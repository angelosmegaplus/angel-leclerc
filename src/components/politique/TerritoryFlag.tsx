import type { ReactNode } from "react";
import type { TerritoryFlag as TerritoryFlagId } from "@/data/regionalExplorer";

function Frame({ children, title }: { children: ReactNode; title: string }) {
  return (
    <svg
      viewBox="0 0 120 80"
      role="img"
      aria-label={`Drapeau ou repère vexillologique de ${title}`}
      className="h-full w-full"
      preserveAspectRatio="xMidYMid slice"
    >
      {children}
    </svg>
  );
}

export function TerritoryFlag({ id, title, colors }: { id?: TerritoryFlagId; title: string; colors: [string, string] }) {
  if (!id) {
    return (
      <Frame title={title}>
        <rect width="120" height="80" fill={colors[0]} />
        <path d="M0 80 120 0v80Z" fill={colors[1]} />
      </Frame>
    );
  }

  switch (id) {
    case "bretagne":
      return (
        <Frame title={title}>
          <rect width="120" height="80" fill="#fff" />
          {[0, 1, 2, 3, 4].map((i) => (
            <rect key={i} y={i * 16} width="120" height="8" fill="#111" />
          ))}
          <rect width="50" height="40" fill="#fff" />
          <g fill="#111">
            {[10, 25, 40].map((x) => <circle key={`a-${x}`} cx={x} cy="10" r="4" />)}
            {[17, 33].map((x) => <circle key={`b-${x}`} cx={x} cy="25" r="4" />)}
          </g>
        </Frame>
      );
    case "normandie":
      return (
        <Frame title={title}>
          <rect width="120" height="80" fill="#c8102e" />
          <g fill="#f2c94c" stroke="#f2c94c" strokeWidth="2">
            <path d="M23 20h26l7 7-9 6-7-3-8 5-12-4 5-5-2-6Z" />
            <path d="M66 46h26l7 7-9 6-7-3-8 5-12-4 5-5-2-6Z" />
          </g>
        </Frame>
      );
    case "alsace":
      return (
        <Frame title={title}>
          <rect width="120" height="40" fill="#c8102e" />
          <rect y="40" width="120" height="40" fill="#fff" />
        </Frame>
      );
    case "savoie":
      return (
        <Frame title={title}>
          <rect width="120" height="80" fill="#c8102e" />
          <path d="M60 0v80M0 40h120" stroke="#fff" strokeWidth="18" />
        </Frame>
      );
    case "corse":
      return (
        <Frame title={title}>
          <rect width="120" height="80" fill="#fff" />
          <path d="M59 19c14 0 23 9 23 22 0 12-8 21-21 21-12 0-22-8-22-21 0-12 8-22 20-22Z" fill="#111" />
          <path d="M39 24h43v9H39z" fill="#fff" />
          <path d="M72 54c8-3 12-7 13-14-1 14-8 24-22 27Z" fill="#fff" />
        </Frame>
      );
    case "occitanie":
      return (
        <Frame title={title}>
          <rect width="120" height="80" fill="#c8102e" />
          <g fill="none" stroke="#f2c94c" strokeWidth="6">
            <circle cx="60" cy="40" r="20" />
            <path d="M60 12v56M32 40h56M40 20l40 40M80 20 40 60" />
          </g>
          <g fill="#f2c94c">
            <circle cx="60" cy="10" r="5" /><circle cx="60" cy="70" r="5" />
            <circle cx="30" cy="40" r="5" /><circle cx="90" cy="40" r="5" />
          </g>
        </Frame>
      );
    case "catalogne":
      return (
        <Frame title={title}>
          <rect width="120" height="80" fill="#f2c94c" />
          {[0, 1, 2, 3].map((i) => <rect key={i} y={8 + i * 19} width="120" height="9" fill="#c8102e" />)}
        </Frame>
      );
    case "paysbasque":
      return (
        <Frame title={title}>
          <rect width="120" height="80" fill="#c8102e" />
          <path d="M0 0 120 80M120 0 0 80" stroke="#1f6f4a" strokeWidth="20" />
          <path d="M60 0v80M0 40h120" stroke="#fff" strokeWidth="14" />
        </Frame>
      );
    default:
      return (
        <Frame title={title}>
          <rect width="40" height="80" fill="#1f4b99" />
          <rect x="40" width="40" height="80" fill="#fff" />
          <rect x="80" width="40" height="80" fill="#c8102e" />
        </Frame>
      );
  }
}
