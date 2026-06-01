export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido' });

  const { contexto, tono, hashtags } = req.body;

  if (!contexto) return res.status(400).json({ error: 'Falta el contexto del evento' });

  const tonoDesc = {
    inspirador: 'inspirador, emotivo y motivador',
    informativo: 'informativo, claro y directo',
    celebratorio: 'celebratorio, energético y emocionante',
    profesional: 'profesional, institucional y formal'
  }[tono] || 'inspirador, emotivo y motivador';

  const prompt = `Eres el community manager de Innova ESAN, el centro de emprendimiento e innovación de la Universidad ESAN en Lima, Perú.

Contexto del evento: ${contexto}
Tono deseado: ${tonoDesc}
Hashtags fijos: ${hashtags || '#InnovaESAN #Emprendimiento #ESAN'}

Responde ÚNICAMENTE con un objeto JSON válido, sin texto adicional, sin markdown:
{"instagram":"copy con emojis, máx 120 palabras, hashtags fijos + 3-4 relevantes","linkedin":"copy profesional sin emojis, máx 100 palabras, solo hashtags fijos al final","whatsapp":"copy breve máx 50 palabras, conversacional, sin hashtags, 1-2 emojis"}`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash-001:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.8 }
        })
      }
    );

    const data = await response.json();

    if (!response.ok) throw new Error(data.error?.message || 'Error de Gemini');

    const raw = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const clean = raw.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(clean);

    res.status(200).json(parsed);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}