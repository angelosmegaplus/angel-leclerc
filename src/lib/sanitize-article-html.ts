export function sanitizeArticleHtml(input: string): string {
  if (typeof window === "undefined") return input;
  const doc = new DOMParser().parseFromString(input, "text/html");
  doc.querySelectorAll("script,object,embed,base,meta,link").forEach((node) => node.remove());
  doc.querySelectorAll("*").forEach((element) => {
    for (const attribute of Array.from(element.attributes)) {
      const name = attribute.name.toLowerCase();
      const value = attribute.value.trim().toLowerCase();
      if (name.startsWith("on")) element.removeAttribute(attribute.name);
      if ((name === "href" || name === "src") && value.startsWith("javascript:")) {
        element.removeAttribute(attribute.name);
      }
    }
  });
  return doc.body.innerHTML;
}
