export type EmbedPosition = "bottom-right" | "bottom-left";

export function getScriptEmbedSnippet(
  appBaseUrl: string,
  botPublicKey: string,
  position: EmbedPosition = "bottom-right"
): string {
  return `<script src="${appBaseUrl}/embed/widget.js" data-bot-key="${botPublicKey}" data-position="${position}" async></script>`;
}

export function getIframeEmbedSnippet(
  appBaseUrl: string,
  botPublicKey: string,
  position: EmbedPosition = "bottom-right"
): string {
  const iframeSrc = `${appBaseUrl}/widget/${botPublicKey}`;
  const posStyle = position === "bottom-left" ? "left:20px" : "right:20px";

  return `<iframe src="${iframeSrc}" style="position:fixed;${posStyle};bottom:20px;width:400px;height:600px;border:none;z-index:9999;" title="Chat Widget"></iframe>`;
}
