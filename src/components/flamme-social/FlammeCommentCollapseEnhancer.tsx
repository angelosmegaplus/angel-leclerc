import { useEffect } from "react";

const ROOT_PREVIEW_LIMIT = 2;
const REPLY_PREVIEW_LIMIT = 1;

function setVisible(node: HTMLElement, visible: boolean) {
  const next = visible ? "" : "none";
  if (node.style.display !== next) node.style.display = next;
}

function makeToggle(label: string, marker: string) {
  const button = document.createElement("button");
  button.type = "button";
  button.dataset[marker] = "true";
  button.className =
    "min-h-0 w-full py-2 text-left text-xs font-extrabold text-slate-500 hover:text-[#CE654B] dark:text-slate-400";
  button.textContent = label;
  return button;
}

function enhancePanel(panel: HTMLElement) {
  const form = panel.querySelector<HTMLFormElement>('form input[placeholder="Écrire un commentaire…"]')?.closest("form");
  if (!form) return;
  const list = panel.firstElementChild as HTMLElement | null;
  if (!list) return;

  const rootNodes = Array.from(list.children).filter(
    (node): node is HTMLElement => node instanceof HTMLElement && node.tagName === "DIV",
  );
  const expanded = panel.dataset.flammeCommentsExpanded === "true";
  const hiddenRootCount = Math.max(0, rootNodes.length - ROOT_PREVIEW_LIMIT);

  rootNodes.forEach((root, index) => {
    const showRoot = expanded || index >= rootNodes.length - ROOT_PREVIEW_LIMIT;
    setVisible(root, showRoot);

    const replyNodes = Array.from(root.children).filter(
      (node): node is HTMLElement =>
        node instanceof HTMLElement && node.tagName === "DIV" && node.classList.contains("ml-10"),
    );
    if (!replyNodes.length) return;

    const repliesExpanded = root.dataset.flammeRepliesExpanded === "true";
    const hiddenReplies = Math.max(0, replyNodes.length - REPLY_PREVIEW_LIMIT);
    replyNodes.forEach((reply, replyIndex) => {
      setVisible(reply, repliesExpanded || replyIndex < REPLY_PREVIEW_LIMIT);
    });

    let replyToggle = root.querySelector<HTMLButtonElement>(":scope > [data-flamme-replies-toggle]");
    if (!hiddenReplies) {
      replyToggle?.remove();
      return;
    }
    if (!replyToggle) {
      replyToggle = makeToggle("", "flammeRepliesToggle");
      replyToggle.className += " ml-10 pl-9";
      replyToggle.addEventListener("click", () => {
        root.dataset.flammeRepliesExpanded = root.dataset.flammeRepliesExpanded === "true" ? "false" : "true";
        enhancePanel(panel);
      });
      root.appendChild(replyToggle);
    }
    replyToggle.textContent = repliesExpanded
      ? "Masquer les réponses"
      : `Voir ${hiddenReplies} réponse${hiddenReplies > 1 ? "s" : ""} de plus`;
  });

  let rootToggle = panel.querySelector<HTMLButtonElement>(":scope > [data-flamme-comments-toggle]");
  if (!hiddenRootCount) {
    rootToggle?.remove();
    return;
  }
  if (!rootToggle) {
    rootToggle = makeToggle("", "flammeCommentsToggle");
    rootToggle.addEventListener("click", () => {
      panel.dataset.flammeCommentsExpanded = panel.dataset.flammeCommentsExpanded === "true" ? "false" : "true";
      enhancePanel(panel);
    });
    panel.insertBefore(rootToggle, form);
  }
  rootToggle.textContent = expanded
    ? "Réduire les commentaires"
    : `Voir ${hiddenRootCount} commentaire${hiddenRootCount > 1 ? "s" : ""} précédent${hiddenRootCount > 1 ? "s" : ""}`;
}

function enhanceAll() {
  document
    .querySelectorAll<HTMLInputElement>('.flamme-social-route input[placeholder="Écrire un commentaire…"]')
    .forEach((input) => {
      const form = input.closest("form");
      const panel = form?.parentElement;
      if (panel instanceof HTMLElement) enhancePanel(panel);
    });
}

export function FlammeCommentCollapseEnhancer() {
  useEffect(() => {
    let queued = false;
    const run = () => {
      if (queued) return;
      queued = true;
      requestAnimationFrame(() => {
        queued = false;
        enhanceAll();
      });
    };

    run();
    const observer = new MutationObserver(run);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);

  return null;
}
