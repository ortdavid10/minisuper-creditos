// api/airtable.js - Backend con fetch puro (SIN librerías)
const AIRTABLE_TOKEN = process.env.AIRTABLE_TOKEN;
const BASE_ID = 'app40Vfk0hY5I89Bd';

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    const { table, action, data, recordId } = req.body || {};

    if (!table || !action) {
      return res.status(400).json({ error: 'Faltan parámetros' });
    }

    const headers = {
      'Authorization': `Bearer ${AIRTABLE_TOKEN}`,
      'Content-Type': 'application/json'
    };

    let result;

    switch (action) {
      case 'list':
        const listRes = await fetch(`https://api.airtable.com/v0/${BASE_ID}/${table}`, { headers });
        result = await listRes.json();
        return res.json(result.records.map(r => ({ id: r.id, ...r.fields })));

      case 'create':
        const createRes = await fetch(`https://api.airtable.com/v0/${BASE_ID}/${table}`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ fields: data })
        });
        result = await createRes.json();
        return res.json({ id: result.id, ...result.fields });

      case 'update':
        if (!recordId) return res.status(400).json({ error: 'Falta recordId' });
        const updateRes = await fetch(`https://api.airtable.com/v0/${BASE_ID}/${table}/${recordId}`, {
          method: 'PATCH',
          headers,
          body: JSON.stringify({ fields: data })
        });
        result = await updateRes.json();
        return res.json({ id: result.id, ...result.fields });

      case 'delete':
        if (!recordId) return res.status(400).json({ error: 'Falta recordId' });
        await fetch(`https://api.airtable.com/v0/${BASE_ID}/${table}/${recordId}`, {
          method: 'DELETE',
          headers
        });
        return res.json({ success: true });

      default:
        return res.status(400).json({ error: 'Acción inválida' });
    }
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: error.message });
  }
}
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }

}
