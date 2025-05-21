import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { activityId } = req.query;
  const userId = 1; 

  if (req.method === 'PUT') {
    try {
      const formData = req.body; 
      console.log(`Actualizando actividad ${activityId} para usuario ${userId}:`, formData);
      


      res.status(200).json({ message: 'Actividad actualizada con éxito' });
    } catch (error: any) {
      console.error(`Error actualizando actividad ${activityId}:`, error);
      res.status(500).json({ message: error.message || 'Error en el servidor al actualizar actividad' });
    }
  } else {
    res.setHeader('Allow', ['PUT']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}