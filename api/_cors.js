// Middleware común para todos los api/*
export function cors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
}
export function handleOptions(req, res) {
  if (req.method === "OPTIONS") { res.status(200).end(); return true; }
  return false;
}
export function sendError(res, msg, code = 500) {
  return res.status(code).json({ ok: false, error: String(msg).slice(0, 300) });
}
