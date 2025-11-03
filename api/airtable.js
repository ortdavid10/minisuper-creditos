const Airtable = require('airtable');

export default async function handler(req, res) {
  // Configura CORS para permitir solicitudes desde el frontend
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Maneja solicitudes OPTIONS (preflight)
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Solo permite POST
  if (req.method !== 'POST') {
    console.error('Método no permitido:', req.method);
    return res.status(405).json({ error: 'Método no permitido, usa POST' });
  }

  // Verifica variables de entorno
  if (!process.env.AIRTABLE_API_KEY || !process.env.AIRTABLE_BASE_ID) {
    console.error('FALTAN VARIABLES DE ENTORNO:', {
      hasApiKey: !!process.env.AIRTABLE_API_KEY,
      hasBaseId: !!process.env.AIRTABLE_BASE_ID,
    });
    return res.status(500).json({ error: 'Faltan variables de entorno (AIRTABLE_API_KEY o AIRTABLE_BASE_ID)' });
  }

  try {
    // Inicializa Airtable
    const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(process.env.AIRTABLE_BASE_ID);
    const { table, action, data, recordId } = req.body;

    // Valida la solicitud
    if (!table || !action) {
      console.error('Faltan parámetros en la solicitud:', { table, action });
      return res.status(400).json({ error: 'Faltan parámetros table o action' });
    }

    console.log('Procesando solicitud:', { table, action, data, recordId });

    const airtableTable = base(table);

    // Maneja las acciones
    switch (action) {
      case 'list':
        const records = await airtableTable.select({ maxRecords: 100 }).all();
        return res.status(200).json(records);

      case 'create':
        if (!data || Object.keys(data).length === 0) {
          console.error('Faltan datos para crear:', data);
          return res.status(400).json({ error: 'Faltan datos para crear' });
        }
        const created = await airtableTable.create([{ fields: data }]);
        console.log('Registro creado:', created);
        return res.status(200).json(created);

      case 'update':
        if (!recordId) {
          console.error('Falta recordId para actualizar');
          return res.status(400).json({ error: 'Falta recordId' });
        }
        if (!data) {
          console.error('Faltan datos para actualizar');
          return res.status(400).json({ error: 'Faltan datos para actualizar' });
        }
        const updated = await airtableTable.update(recordId, data);
        console.log('Registro actualizado:', updated);
        return res.status(200).json(updated);

      case 'delete':
        if (!recordId) {
          console.error('Falta recordId para eliminar');
          return res.status(400).json({ error: 'Falta recordId' });
        }
        await airtableTable.destroy(recordId);
        console.log('Registro eliminado:', recordId);
        return res.status(200).json({ success: true });

      default:
        console.error('Acción no válida:', action);
        return res.status(400).json({ error: `Acción no válida: ${action}` });
    }
  } catch (error) {
    console.error('ERROR AIRTABLE:', {
      message: error.message,
      stack: error.stack,
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
