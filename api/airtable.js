// api/airtable.js
export const config = { api: { bodyParser: true } };

const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;

export default async function handler(req, res) {
  if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
    return res.status(500).json({ error: 'Faltan credenciales de Airtable en Vercel' });
  }

  const { table, action, data, recordId } = req.body;
  const baseUrl = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${table}`;
  const headers = {
    'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
    'Content-Type': 'application/json'
  };

  try {
    let result;
    switch (action) {
      case 'list':
        result = await fetch(baseUrl, { headers }).then(r => r.json());
        res.status(200).json(result.records || []);
        break;
      case 'create':
        result = await fetch(baseUrl, { method: 'POST', headers, body: JSON.stringify({ fields: data }) }).then(r => r.json());
        res.status(200).json(result);
        break;
      case 'update':
        result = await fetch(`${baseUrl}/${recordId}`, { method: 'PATCH', headers, body: JSON.stringify({ fields: data }) }).then(r => r.json());
        res.status(200).json(result);
        break;
      case 'delete':
        result = await fetch(`${baseUrl}/${recordId}`, { method: 'DELETE', headers }).then(r => r.json());
        res.status(200).json(result);
        break;
      default:
        res.status(400).json({ error: 'Acción no válida' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
