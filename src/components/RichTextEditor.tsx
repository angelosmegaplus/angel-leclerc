import { useEffect, useState } from "react";
import { RichTextEditor as LegacyRichTextEditor } from "./RichTextEditorLegacy";

export { parseYouTubeId } from "./RichTextEditorLegacy";

type Props = { value: string; onChange: (html: string) => void };

/**
 * Adaptateur de chargement : l'ancien éditeur mémorisait la valeur reçue dès son
 * premier rendu et considérait ensuite, à tort, qu'elle était déjà affichée dans
 * le contentEditable. On lui fournit donc une valeur de démarrage distincte,
 * puis la vraie valeur après montage afin de déclencher sa synchronisation.
 */
export function RichTextEditor({ value, onChange }: Props) {
  const [editorValue, setEditorValue] = useState("__ANGEL_EDITOR_INITIALIZING__");

  useEffect(() => {
    setEditorValue(value ?? "");
  }, [value]);

  return <LegacyRichTextEditor value={editorValue} onChange={onChange} />;
}
