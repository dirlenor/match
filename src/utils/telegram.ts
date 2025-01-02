export async function sendTelegramMessage(message: string) {
  const botToken = process.env.NEXT_PUBLIC_TELEGRAM_BOT_TOKEN;
  const chatId = process.env.NEXT_PUBLIC_TELEGRAM_CHAT_ID;

  console.log('Sending Telegram message:', {
    botToken,
    chatId,
    message
  });

  if (!botToken || !chatId) {
    console.error('Telegram configuration missing:', { botToken, chatId });
    return;
  }

  try {
    const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
    console.log('Telegram API URL:', url);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'HTML',
      }),
    });

    const data = await response.json();
    console.log('Telegram API response:', data);

    if (!response.ok) {
      throw new Error(`Failed to send Telegram message: ${data.description || 'Unknown error'}`);
    }
  } catch (error) {
    console.error('Error sending Telegram message:', error);
  }
} 