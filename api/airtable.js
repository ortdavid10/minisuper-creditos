// api/airtable.js
import Airtable from 'airtable';

const base = new Airtable({ 
  apiKey: process.env.AIRTABLE_TOKEN 
}).base('app40Vfk0hY5I89Bd');

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const { table, action, data, recordId } = req.body || {};

    if (!table || !action) {
      return res.status(400).json({ error: 'Faltan parámetros' });
    }

    let result;

    switch (action) {
      case 'list':
        result = await base(table).select().all();
        return res.json(result.map(r => ({ id: r.id, ...r.fields })));

      case 'create':
        result = await base(table).create(data);
        return res.json({ id: result.id, ...result.fields });

      case 'update':
        if (!recordId) return res.status(400).json({ error: 'Falta recordId' });
        result = await base(table).update(recordId, data);
        return res.json({ id: result.id, ...result.fields });

      case 'delete':
        if (!recordId) return res.status(400).json({ error: 'Falta recordId' });
        await base(table).destroy(recordId);
        return res.json({ success: true });

      default:
        return res.status(400).json({ error: 'Acción no válida' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
}