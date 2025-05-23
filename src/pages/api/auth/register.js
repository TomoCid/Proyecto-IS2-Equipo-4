import { register } from '@/pages/api/auth/auth.controller';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    return register(req, res);
  }

  res.setHeader('Allow', ['POST']);
  res.status(405).end(`Method ${req.method} Not Allowed`);
}