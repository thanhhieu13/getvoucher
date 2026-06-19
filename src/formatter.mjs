import { escapeHTML } from './utils.mjs';

const MAX_MESSAGE_LENGTH = 4000;

export function formatVouchers(vouchers, config) {
  if (!vouchers || vouchers.length === 0) {
    return ['<pre><code class="language-json">[]</code></pre>'];
  }

  let messages = [];
  let currentChunk = [];
  let currentLength = 0;

  for (let i = 0; i < vouchers.length; i++) {
    const v = vouchers[i];
    const vStr = JSON.stringify(v, null, 2) + ',';
    
    // Nếu độ dài vượt quá giới hạn 4000 ký tự của Telegram, cắt làm nhiều tin nhắn
    if (currentLength + vStr.length > MAX_MESSAGE_LENGTH - 100) {
      messages.push('<pre><code class="language-json">' + escapeHTML(JSON.stringify(currentChunk, null, 2)) + '</code></pre>');
      currentChunk = [v];
      currentLength = vStr.length;
    } else {
      currentChunk.push(v);
      currentLength += vStr.length;
    }
  }

  if (currentChunk.length > 0) {
    messages.push('<pre><code class="language-json">' + escapeHTML(JSON.stringify(currentChunk, null, 2)) + '</code></pre>');
  }

  return messages;
}
