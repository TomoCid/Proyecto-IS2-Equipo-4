import { handleCreateAgendaEntry, handleGetUserAgenda } from './agenda.controller';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    await handleCreateAgendaEntry(req, res);
  } else if (req.method === 'GET') {
    await handleGetUserAgenda(req, res);
  } else {
    res.setHeader('Allow', ['GET', 'POST']);
    res.status(405).json({ error: `Método ${req.method} no permitido.` });
  }
}