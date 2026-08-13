export function AngelOSCardStyle() {
  return <style>{`
    article:has(> a[href="/angel-os-ia"]) > ul,
    article:has(> a[href="/angel-os-ia"]) > p:not(:first-of-type) { display:none; }
    article:has(> a[href="/angel-os-ia"]) > div:first-child > div:first-child {
      background:#000 url('/angel-os/logo.png') center/cover no-repeat !important;
      color:transparent !important; overflow:hidden;
    }
    article:has(> a[href="/angel-os-ia"]) > div:first-child > div:first-child svg { opacity:0; }
    article:has(> a[href="/angel-os-ia"]) h3 { font-size:0; }
    article:has(> a[href="/angel-os-ia"]) h3::after { content:'Angel OS'; font-size:1.125rem; font-weight:600; }
    article:has(> a[href="/angel-os-ia"]) > p:first-of-type { font-size:0; }
    article:has(> a[href="/angel-os-ia"]) > p:first-of-type::after {
      content:'Un noyau open source modulaire, avec Angel OS IA et angel-leclerc.fr comme premières applications concrètes.';
      font-size:.875rem; line-height:1.6;
    }
  `}</style>;
}
