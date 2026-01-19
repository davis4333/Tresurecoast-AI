import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function generateEmbedScript(): string {
  return `(function(){
  if(window.__TCA_WIDGET_LOADED__){return}
  window.__TCA_WIDGET_LOADED__=true;
  try{
    var script=document.currentScript;
    if(!script){console.error("[TCA] Cannot find script element");return}
    var botKey=script.getAttribute("data-bot-key");
    if(!botKey){console.error("[TCA] Missing data-bot-key attribute");return}
    var position=script.getAttribute("data-position")||"bottom-right";
    var containerId="tca-widget-container";
    if(document.getElementById(containerId)){return}
    var origin=script.src.split("/embed/")[0];
    var iframeSrc=origin+"/widget/"+encodeURIComponent(botKey);
    var container=document.createElement("div");
    container.id=containerId;
    container.style.cssText="position:fixed;"+(position==="bottom-left"?"left:20px;":"right:20px;")+"bottom:20px;z-index:2147483647;font-family:system-ui,-apple-system,sans-serif;";
    var isOpen=false;
    var launcher=document.createElement("button");
    launcher.id="tca-launcher";
    launcher.setAttribute("aria-label","Open chat");
    launcher.innerHTML='<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 21 1.9-5.7a8.5 8.5 0 1 1 3.8 3.8z"></path></svg>';
    launcher.style.cssText="width:56px;height:56px;border-radius:50%;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 12px rgba(0,0,0,0.15);transition:transform 0.2s,box-shadow 0.2s;background:#2563eb;color:#fff;";
    launcher.onmouseenter=function(){this.style.transform="scale(1.05)";this.style.boxShadow="0 6px 16px rgba(0,0,0,0.2)"};
    launcher.onmouseleave=function(){this.style.transform="scale(1)";this.style.boxShadow="0 4px 12px rgba(0,0,0,0.15)"};
    var chatFrame=document.createElement("div");
    chatFrame.id="tca-chat-frame";
    chatFrame.style.cssText="display:none;width:380px;height:560px;margin-bottom:12px;border-radius:12px;overflow:hidden;box-shadow:0 8px 32px rgba(0,0,0,0.2);";
    var iframe=document.createElement("iframe");
    iframe.src=iframeSrc;
    iframe.style.cssText="width:100%;height:100%;border:none;";
    iframe.title="Chat Widget";
    chatFrame.appendChild(iframe);
    launcher.onclick=function(){
      isOpen=!isOpen;
      chatFrame.style.display=isOpen?"block":"none";
      launcher.innerHTML=isOpen?'<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"></path><path d="m6 6 12 12"></path></svg>':'<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 21 1.9-5.7a8.5 8.5 0 1 1 3.8 3.8z"></path></svg>';
      launcher.setAttribute("aria-label",isOpen?"Close chat":"Open chat");
    };
    container.appendChild(chatFrame);
    container.appendChild(launcher);
    document.body.appendChild(container);
  }catch(e){console.error("[TCA] Widget load error:",e)}
})();`;
}

export async function GET(_request: NextRequest) {
  const script = generateEmbedScript();

  return new NextResponse(script, {
    status: 200,
    headers: {
      "Content-Type": "application/javascript; charset=utf-8",
      "Cache-Control": "public, max-age=300",
    },
  });
}
