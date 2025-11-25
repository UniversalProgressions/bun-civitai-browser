import React, { useEffect, useRef } from "react";

interface ShadowHTMLProps {
  html: string;
  style?: string; // 可选：允许传入独立样式注入 shadow DOM
}

const ShadowHTML: React.FC<ShadowHTMLProps> = ({ html, style }) => {
  const hostRef = useRef<HTMLDivElement>(null);
  const shadowRef = useRef<ShadowRoot | null>(null);

  useEffect(() => {
    if (!hostRef.current) return;

    // 初始化 shadow root（只创建一次）
    if (!shadowRef.current) {
      shadowRef.current = hostRef.current.attachShadow({ mode: "open" });
    }

    const shadow = shadowRef.current;

    // 清空上一次内容
    shadow.innerHTML = "";

    // 创建 style 标签（如果提供）
    if (style) {
      const styleEl = document.createElement("style");
      styleEl.textContent = style;
      shadow.appendChild(styleEl);
    }

    // 创建一个容器用于存放 raw HTML
    const wrapper = document.createElement("div");
    wrapper.innerHTML = html;
    shadow.appendChild(wrapper);
  }, [html, style]);

  return <div ref={hostRef} className="bg-gray-300 w-full wrap-break-word" />;
};

export default ShadowHTML;
