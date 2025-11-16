import { treaty } from '@elysiajs/eden'

import type { App } from '../index'

export const edenTreaty = treaty<App>(window.location.origin)

/**
 * 使用正则表达式高效替换 URL 参数，默认用来处理image url还原为低分辨率图片以提高加载速度
 * @param urlString 原始 URL 字符串
 * @param paramName 参数名（默认 'original'）
 * @param paramValue 参数值（默认 'false'）
 * @returns 修改后的 URL 字符串
 */
export function replaceUrlParam(
  urlString: string,
  paramName: string = "original",
  paramValue: string = "false",
): string {
  // 转义特殊字符用于正则表达式
  const escapedParamName = paramName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  // 匹配 paramName=任意值
  const regex = new RegExp(`(${escapedParamName}=)[^&/]+`, "gi");

  // 如果找到匹配项，直接替换
  if (regex.test(urlString)) {
    return urlString.replace(regex, `$1${paramValue}`);
  }

  // 如果没有找到，在最后一个 / 前添加参数
  const lastSlashIndex = urlString.lastIndexOf("/");
  if (lastSlashIndex !== -1) {
    const beforeSlash = urlString.substring(0, lastSlashIndex);
    const afterSlash = urlString.substring(lastSlashIndex);
    return `${beforeSlash}/${paramName}=${paramValue}${afterSlash}`;
  }

  return urlString;
}

export function getFileType(filename: string) {
  if (!filename) return 'unknown';
  const ext = filename.split('.').pop()!.toLowerCase();

  const imageExts = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg', 'avif'];
  const videoExts = ['mp4', 'webm', 'ogg', 'mov', 'avi', 'mkv', 'flv'];

  if (imageExts.includes(ext)) return 'image';
  if (videoExts.includes(ext)) return 'video';
  return 'unknown';
}

// // 示例：
// console.log(getFileType('photo.jpg'));   // => "image"
// console.log(getFileType('clip.mp4'));    // => "video"
// console.log(getFileType('doc.pdf'));     // => "unknown"
