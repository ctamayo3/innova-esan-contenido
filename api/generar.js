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
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1000,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error?.message || 'Error de API');

    const raw = data.content?.[0]?.text || '';
    const clean = raw.replace(/```json|```/g, '').trim();

    let parsed;
    try {
      parsed = JSON.parse(clean);
    } catch(e) {
      const match = clean.match(/\{[\s\S]*\}/);
      if (match) parsed = JSON.parse(match[0]);
      else return res.status(500).json({ error: 'No se pudo parsear: ' + clean });
    }

    res.status(200).json(parsed);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}