// api/airtable.js
import Airtable from 'airtable';

const base = new Airtable({ 
  apiKey: process.env.AIRTABLE_API_KEY 
}).base(process.env.AIRTABLE_BASE_ID);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido' });

  const { table, action, data, recordId } = req.body;

  try {
    let result;

    if (action === 'list') {
      const records = await base(table).select({}).all();
      result = records.map(r => ({ id: r.id, ...r.fields }));

    } else if (action === 'create') {
      const created = await base(table).create([{ fields: data }]);
      result = { id: created[0].id, ...created[0].fields };

    } else if (action === 'update') {
      if (!recordId) throw new Error('Falta recordId');
      const updated = await base(table).update([{ id: recordId, fields: data }]);
      result = { id: updated[0].id, ...updated[0].fields };

    } else if (action === 'delete') {
      if (!recordId) throw new Error('Falta recordId');
      await base(table).destroy(recordId);
      result = { success: true };

    } else {
      throw new Error('Acción no válida');
    }

    res.status(200).json(result);
  } catch (error) {
    console.error('Error:', error.message);
    res.status(500).json({ error: 'Error en Airtable', message: error.message });
  }
}
