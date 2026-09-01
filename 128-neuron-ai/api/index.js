const path = require('path');
const fs = require('fs');

let state = { weights: null, biases: null };

function loadInitialState() {
  if (state.weights || state.biases) return;
  try {
    const file = path.join(process.cwd(), 'ai-state.json');
    if (fs.existsSync(file)) state = JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (_) {}
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 'no-store');

  if (req.method === 'OPTIONS') return res.status(204).end();

  loadInitialState();

  // Works both with /api/?action=state and the existing frontend /api/state URL.
  const url = new URL(req.url || '/', 'http://localhost');
  let action = (req.query && req.query.action) || url.searchParams.get('action');
  if (!action && url.pathname.endsWith('/state')) action = 'state';
  if (!action) action = 'status';

  if (req.method === 'GET' && action === 'status') {
    return res.status(200).json({
      ok: true,
      message: '128 Neuron AI serverless function is running',
      neurons: 128,
      layers: [8, 64, 48, 8],
      runtime: 'serverless'
    });
  }

  if (req.method === 'GET' && action === 'state') {
    return res.status(200).json(state);
  }

  if (req.method === 'POST' && action === 'state') {
    try {
      const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
      if (!Array.isArray(body.weights) || !Array.isArray(body.biases)) {
        return res.status(400).json({ ok: false, error: 'Invalid AI state' });
      }
      state = { weights: body.weights, biases: body.biases };
      return res.status(200).json({ ok: true, saved: true, persistent: false });
    } catch (_) {
      return res.status(400).json({ ok: false, error: 'Invalid JSON' });
    }
  }

  return res.status(404).json({ ok: false, error: 'Not found' });
};
