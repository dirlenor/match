const TELEGRAM_BOT_TOKEN = '7643053854:AAF-o9_viHYGH0FoYzbDDEEhPOMlPquthWA';
const TELEGRAM_CHAT_ID = '1182117562';

export async function POST(request: Request) {
  try {
    const { message } = await request.json();

    const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text: message,
        parse_mode: 'HTML',
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.description || 'Failed to send message');
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error('Error sending Telegram message:', error);
    return Response.json({ success: false, error: 'Failed to send message' }, { status: 500 });
  }
} 