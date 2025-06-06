import { handleCreatePreference, handleModifyPreference } from '../preference.controller';

export default async function handler(req, res) {
  if (req.method === 'PUT') {
    await handleModifyPreference(req, res);
  } else if (req.method === 'POST') {
    await handleCreatePreference(req, res);
  } else {
    res.setHeader('Allow', ['PUT', 'POST']);
    res.status(405).json({ error: `Método ${req.method} no permitido.` });
  }
}