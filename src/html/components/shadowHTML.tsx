import React, { useEffect, useRef } from "react";

interface ShadowHTMLProps {
	html: string;
	style?: string; // 可选：允许传入独立样式注入 shadow DOM
}

const DEFAULT_STYLES = `
    body {
      margin: 0;
      padding: 12px;
      background: #f8f9fa;
      color: #212529;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.5;
      max-width: 100%;
      box-sizing: border-box;
      overflow-x: auto;
      overflow-wrap: break-word;
      word-break: break-word;
    }
    * {
      box-sizing: border-box;
    }
    h1, h2, h3, h4, h5, h6 {
      margin-top: 1em;
      margin-bottom: 0.5em;
      font-weight: 600;
      line-height: 1.2;
      max-width: 100%;
      overflow-wrap: break-word;
    }
    p {
      margin: 0 0 1em;
      max-width: 100%;
      overflow-wrap: break-word;
    }
    ul, ol {
      margin: 0 0 1em;
      padding-left: 2em;
      max-width: 100%;
      overflow-wrap: break-word;
    }
    li {
      max-width: 100%;
      overflow-wrap: break-word;
    }
    a {
      color: #0d6efd;
      text-decoration: none;
      overflow-wrap: break-word;
      word-break: break-all;
    }
    a:hover {
      text-decoration: underline;
    }
    img {
      max-width: 100%;
      height: auto;
      border-radius: 4px;
      display: block;
    }
    code {
      background: #e9ecef;
      padding: 2px 6px;
      border-radius: 3px;
      font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
      font-size: 0.9em;
      max-width: 100%;
      overflow-x: auto;
      display: inline-block;
      word-break: break-all;
    }
    pre {
      background: #e9ecef;
      padding: 12px;
      border-radius: 6px;
      overflow: auto;
      max-width: 100%;
    }
    blockquote {
      border-left: 4px solid #dee2e6;
      margin: 0 0 1em;
      padding-left: 1em;
      color: #6c757d;
      max-width: 100%;
      overflow-wrap: break-word;
    }
    table {
      max-width: 100%;
      overflow-x: auto;
      display: block;
      border-collapse: collapse;
    }
    th, td {
      padding: 8px;
      border: 1px solid #dee2e6;
      max-width: 100%;
      overflow-wrap: break-word;
    }
    iframe, video, audio {
      max-width: 100%;
      display: block;
    }
  `;

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

		// 创建 style 标签，使用传入的样式或默认样式
		const styleEl = document.createElement("style");
		styleEl.textContent = style || DEFAULT_STYLES;
		shadow.appendChild(styleEl);

		// 创建一个容器用于存放 raw HTML
		const wrapper = document.createElement("div");
		// Add inline styles to prevent content from breaking boundaries
		wrapper.style.cssText = `
      max-width: 100%;
      overflow-wrap: break-word;
      word-break: break-word;
      box-sizing: border-box;
    `;
		wrapper.innerHTML = html;
		shadow.appendChild(wrapper);
	}, [html, style]);

	return <div ref={hostRef} className="bg-gray-300 w-full wrap-break-word" />;
};

export default ShadowHTML;
