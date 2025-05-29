import { handleGetUserActivities } from './usuario.controller';

export default function handler(req, res) {
  return handleGetUserActivities(req, res);
}