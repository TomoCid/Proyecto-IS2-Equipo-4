import { createAgendaEntry } from '@/app/agenda/consultas-agenda';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: `Método ${req.method} no permitido` });
  }

  try {
    const entryData = req.body;

    const nuevaEntrada = await createAgendaEntry(entryData);
    res.status(201).json({ success: true, agenda: nuevaEntrada });
  } catch (error) {
    console.error('Error al crear entrada de agenda:', error);
    res.status(500).json({ error: 'No se pudo crear la entrada de agenda.' });
  }
}