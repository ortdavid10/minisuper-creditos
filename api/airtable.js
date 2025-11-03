import Airtable from 'airtable';

const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(process.env.AIRTABLE_BASE_ID);

export default async function handler(req, res) {
  const { table, action, data, recordId } = req.body;

  try {
    const airtableTable = base(table);

    switch (action) {
      case 'list':
        const records = await airtableTable.select().all();
        return res.status(200).json(records);

      case 'create':
        const created = await airtableTable.create({ fields: data });
        return res.status(200).json(created);

      case 'update':
        if (!recordId) throw new Error('Falta recordId');
        const updated = await airtableTable.update(recordId, { fields: data });
        return res.status(200).json(updated);

      case 'delete':
        if (!recordId) throw new Error('Falta recordId');
        await airtableTable.destroy(recordId);
        return res.status(200).json({ success: true });

      default:
        return res.status(400).json({ error: 'Acción no válida' });
    }
  } catch (error) {
    console.error('Error Airtable:', error);
    return res.status(500).json({ error: error.message });
  }
}
