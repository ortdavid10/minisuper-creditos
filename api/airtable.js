const Airtable = require('airtable');

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  if (!process.env.AIRTABLE_API_KEY || !process.env.AIRTABLE_BASE_ID) {
    console.error('FALTAN VARIABLES DE ENTORNO:', {
      apiKey: !!process.env.AIRTABLE_API_KEY,
      baseId: !!process.env.AIRTABLE_BASE_ID
    });
    return res.status(500).json({ 
      error: 'Configuración del servidor incompleta', 
      details: 'Faltan AIRTABLE_API_KEY o AIRTABLE_BASE_ID' 
    });
  }

  let base;
  try {
    base = new Airtable({ 
      apiKey: process.env.AIRTABLE_API_KEY?,
      endpointUrl: 'https://api.airtable.com'
    }).base(process.env.AIRTABLE_BASE_ID);
  } catch (error) {
    console.error('ERROR INICIALIZANDO AIRTABLE:', {
      message: error.message,
      stack: error.stack
    });
    return res.status(500).json({ 
      error: 'Error inicializando Airtable', 
      details: error.message 
    });
  }

  const { table, action, data, recordId } = req.body;

  if (!table || !action) {
    return res.status(400).json({ error: 'Faltan table o action' });
  }

  try {
    console.log('Procesando:', { table, action, data, recordId });
    const airtableTable = base(table);
    switch (action) {
      case 'list':
        const records = await airtableTable.select({ maxRecords: 100 }).all();
        return res.status(200).json(records);
      case 'create':
        if (!data || Object.keys(data).length === 0) {
          return res.status(400).json({ error: 'Faltan datos para crear' });
        }
        const created = await airtableTable.create([{ fields: data }]);
        return res.status(200).json(created);
      case 'update':
        if (!recordId) return res.status(400).json({ error: 'Falta recordId' });
        if (!data) return res.status(400).json({ error: 'Faltan datos para actualizar' });
        const updated = await airtableTable.update(recordId, { fields: data });
        return res.status(200).json(updated);
      case 'delete':
        if (!recordId) return res.status(400).json({ error: 'Falta recordId' });
        await airtableTable.destroy(recordId);
        return res.status(200).json({ success: true });
      default:
        return res.status(400).json({ error: 'Acción no válida' });
    }
  } catch (error) {
    console.error('ERROR AIRTABLE:', {
      message: error.message,
      stack: error.stack,
      code: error.code,
      requestBody: req.body
    });
    return res.status(500).json({ 
      error: 'Error en Airtable', 
      details: error.message,
      code: error.code
    });
  }
}
