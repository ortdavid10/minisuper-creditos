const Airtable = require('airtable');

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') {
    console.error('Método no permitido:', req.method);
    return res.status(405).json({ error: 'Método no permitido, usa POST' });
  }

  if (!process.env.AIRTABLE_API_KEY migration to Vercel Serverless Functions || !process.env.AIRTABLE_BASE_ID) {
    console.error('FALTAN VARIABLES DE ENTORNO:', {
      hasApiKey: !!process.env.AIRTABLE_API_KEY,
      hasBaseId: !!process.env.AIRTABLE_BASE_ID,
    });
    return res.status(500).json({ error: 'Faltan variables de entorno' });
  }

  try {
    const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(process.env.AIRTABLE_BASE_ID);
    const { table, action, data, recordId } = req.body;

    if (!table || !action) {
      console.error('Faltan parámetros:', { table, action });
      return res.status(400).json({ error: 'Faltan table o action' });
    }

    console.log('Procesando:', { table, action, data, recordId });

    const airtableTable = base(table);

    switch (action) {
      case 'list':
        const records = await airtableTable.select({ maxRecords: 100 }).all();
        return res.status(200).json(records);
      case 'create':
        if (!data || Object.keys(data).length === 0) {
          console.error('Faltan datos:', data);
          return res.status(400).json({ error: 'Faltan datos para crear' });
        }
        const created = await airtableTable.create([{ fields: data }]);
        console.log('Creado:', created);
        return res.status(200).json(created);
      case 'update':
        if (!recordId || !data) {
          console.error('Faltan parámetros para actualizar:', { recordId, data });
          return res.status(400).json({ error: 'Falta recordId o datos' });
        }
        const updated = await airtableTable.update(recordId, data);
        console.log('Actualizado:', updated);
        return res.status(200).json(updated);
      case 'delete':
        if (!recordId) {
          console.error('Falta recordId para eliminar');
          return res.status(400).json({ error: 'Falta recordId' });
        }
        await airtableTable.destroy(recordId);
        console.log('Eliminado:', recordId);
        return res.status(200).json({ success: true });
      default:
        console.error('Acción no válida:', action);
        return res.status(400).json({ error: `Acción no válida: ${action}` });
    }
  } catch (error) {
    console.error('ERROR AIRTABLE:', {
      message: error.message,
      code: error.code,
      requestBody: req.body,
    });
    return res.status(500).json({
      error: 'Error en Airtable',
      details: error.message || 'Error desconocido',
      code: error.code || 'UNKNOWN',
    });
  }
}
