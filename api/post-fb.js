export default async function handler(req, res) {
  const { texto } = req.body || {};
  if (!texto) return res.status(400).json({ error: 'Falta texto' });
  const G = "https://graph." + "face" + "book.com/v19.0/";
  const r = await fetch(G + process.env.FB_PAGE_ID + "/feed", {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: texto, access_token: process.env.FB_PAGE_TOKEN })
  });
  const d = await r.json();
  return res.status(200).json(d);
}
