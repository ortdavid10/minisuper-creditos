// api/airtable.js - DEBUG TOTAL
const AIRTABLE_TOKEN = process.env.AIRTABLE_TOKEN;
const BASE_ID = 'app40Vfk0hY5I89Bd';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Solo POST' });

  // DEBUG: Verifica token
  if (!AIRTABLE_TOKEN) {
    return res.status(500).json({ error: 'Falta AIRTABLE_TOKEN en Vercel' });
  }

  try {
    const { table, action, data, recordId } = req.body || {};
    if (!table || !action) return res.status(400).json({ error: 'Faltan table/action' });

    const headers = {
      'Authorization': `Bearer ${AIRTABLE_TOKEN}`,
      'Content-Type': 'application/json'
    };

    let url = `https://api.airtable.com/v0/${BASE_ID}/${table}`;
    let method = 'GET';
    let body = null;

    if (action === 'list') {
      // GET
    } else if (action === 'create') {
      method = 'POST';
      body = JSON.stringify({ fields: data });
    } else if (action === 'update') {
      if (!recordId) return res.status(400).json({ error: 'Falta recordId' });
      url += `/${recordId}`;
      method = 'PATCH';
      body = JSON.stringify({ fields: data });
    } else if (action === 'delete') {
      if (!recordId) return res.status(400).json({ error: 'Falta recordId' });
      url += `/${recordId}`;
      method = 'DELETE';
    } else {
      return res.status(400).json({ error: 'Acción inválida' });
    }

    const response = await fetch(url, { method, headers, body });
    const text = await response.text();

    if (!response.ok) {
      return res.status(500).json({ 
        error: 'Airtable rechazó', 
        status: response.status, 
        message: text 
      });
    }

    const result = JSON.parse(text);

    if (action === 'list') {
      res.json(result.records?.map(r => ({ id: r.id, ...r.fields })) || []);
    } else {
      res.json({ id: result.id, ...result.fields });
    }
  } catch (error) {
    res.status(500).json({ error: 'Backend crash: ' + error.message });
  }
}
