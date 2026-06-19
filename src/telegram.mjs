import { config } from './config.mjs';

async function callTelegramAPI(method, payload) {
  const url = `https://api.telegram.org/bot${config.TELEGRAM_BOT_TOKEN}/${method}`;
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    if (!data.ok) {
      throw new Error(`Telegram API Error: ${data.description}`);
    }
    return data;
  } catch (error) {
    console.error(`Lỗi gọi Telegram API (${method}):`, error.message);
    throw error;
  }
}

export async function sendMessage(text) {
  return await callTelegramAPI('sendMessage', {
    chat_id: config.TELEGRAM_CHAT_ID,
    text: text,
    parse_mode: 'HTML',
    disable_web_page_preview: true
  });
}

export async function editMessageText(messageId, text) {
  return await callTelegramAPI('editMessageText', {
    chat_id: config.TELEGRAM_CHAT_ID,
    message_id: messageId,
    text: text,
    parse_mode: 'HTML',
    disable_web_page_preview: true
  });
}

export async function sendOrEditMessages(messages, state) {
  let newMessageId = state.telegramMessageId;
  
  for (let i = 0; i < messages.length; i++) {
    const text = messages[i];
    
    if (i === 0 && config.TELEGRAM_MODE === 'edit' && newMessageId) {
      try {
        await editMessageText(newMessageId, text);
        console.log(`Đã sửa tin nhắn Telegram (ID: ${newMessageId})`);
        continue;
      } catch (error) {
        console.log('Không thể sửa tin nhắn, sẽ gửi tin nhắn mới...');
      }
    }
    
    const res = await sendMessage(text);
    console.log('Đã gửi tin nhắn Telegram mới.');
    
    if (i === 0) {
      newMessageId = res.result.message_id;
    }
  }
  
  return newMessageId;
}