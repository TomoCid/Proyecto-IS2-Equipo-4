import { getData } from '../../app/actions'; 

export default async function handler(req, res) {
  try {
    const data = await getData();
    res.status(200).json(data);
  } catch (error) {
    console.error("API Error fetching data:", error);
    res.status(500).json({ error: 'Failed to fetch data' });
  }
}