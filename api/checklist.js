import { kv } from '@vercel/kv';
import { timingSafeEqual } from 'crypto';

const KEY = 'seul-2026-checklist';

function isAuthorized(req) {
  const expected = process.env.DASHBOARD_TOKEN;
  if (!expected) return false; // sin token configurado, denegar por defecto (fail closed)

  const provided = req.query?.t;
  if (typeof provided !== 'string' || provided.length !== expected.length) return false;

  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  return timingSafeEqual(a, b);
}

export default async function handler(req, res) {
  if (!isAuthorized(req)) {
    return res.status(401).json({ ok: false, error: 'No autorizado' });
  }

  if (req.method === 'GET') {
    const data = await kv.get(KEY);
    return res.status(200).json(data || {});
  }

  if (req.method === 'POST') {
    try {
      const body = req.body || {};
      await kv.set(KEY, body);
      return res.status(200).json({ ok: true });
    } catch (err) {
      return res.status(500).json({ ok: false, error: 'No se pudo guardar' });
    }
  }

  res.setHeader('Allow', ['GET', 'POST']);
  res.status(405).end(`Método ${req.method} no permitido`);
}
