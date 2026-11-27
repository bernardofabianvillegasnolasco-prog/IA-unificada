export default async function handler(req, res) {
  const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
  const prompt = (body.prompt || body.texto || "").trim().slice(0, 500) || "BF Villegas fluyendo en Phoenix";
  const seed = Math.floor(Math.random() * 1000000);
  const url = "https://image.pollinations.ai/prompt/" + encodeURIComponent(prompt) + "?width=1024&height=1024&seed=" + seed + "&model=flux&nologo=true&private=true";
  return res.status(200).json({ ok: true, imagen: url, url, prompt });
}
