export default async function handler(req, res) {
  // Cron de Vercel - corre el bot-auto cada día 8am
  // Por ahora solo registra que corrió, no aplica sin que lo veas
  return res.status(200).json({ ok: true, msg: "bot-auto cron jalando - revisa MEJORAS.md" });
}
