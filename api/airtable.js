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
      const record = await base(table).create([{ fields: data }]);
      result = { id: record[0].id, ...record[0].fields };

    } else if (action === 'update') {
      if (!recordId) throw new Error('Falta recordId');
      const record = await base(table).update(recordId, { fields: data });
      result = { id: record.id, ...record.fields };

    } else if (action === 'delete') {
      if (!recordId) throw new Error('Falta recordId');
      await base(table).destroy(recordId);
      result = { success: true };

    } else {
      throw new Error('Acción no válida');
    }

    res.status(200).json(result);
  } catch (error) {
    console.error('Error en Airtable:', error.message);
    res.status(500).json({ 
      error: 'Error en Airtable', 
      message: error.message 
    });
  }
}
