import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    try {
      const { activity, preferences } = req.body;
      const userId = preferences.user_id; 

      
      const newActivityId = Math.floor(Math.random() * 1000);
      console.log("Creando actividad:", activity);
      console.log("Con preferencias:", preferences, "para activity_id:", newActivityId);

      res.status(201).json({ message: 'Actividad creada con éxito', activityId: newActivityId });
    } catch (error: any) {
      console.error("Error creando actividad:", error);
      // Rollback transacción si falla
      res.status(500).json({ message: error.message || 'Error en el servidor al crear actividad' });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}