export default async function handler(req, res) {
  if (req.method === 'GET') {
    if (req.query['hub.verify_token'] === process.env.FB_VERIFY_TOKEN) return res.status(200).send(req.query['hub.challenge']);
    return res.status(403).send('Error');
  }
  if (req.method === 'POST') {
    const b = req.body;
    if (b.object === 'page') {
      for (const e of b.entry) {
        for (const m of e.messaging || []) {
          if (m.message?.text) {
            await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ chat_id: process.env.TELEGRAM_CHAT_ID, text: `FB -> TG\nDe: ${m.sender.id}\nMsg: ${m.message.text}` })
            });
          }
        }
      }
    }
    return res.status(200).send('OK');
  }
}
