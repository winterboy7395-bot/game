const path = require('path');
const fs = require('fs');

let state = { weights: null, biases: null };

// Serverless instances may be reused, so keep a small in-memory cache.
// The frontend treats state as optional and can always continue with a fresh AI.
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

  const action = (req.query && req.query.action) || 'status';
  loadInitialState();

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
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    if (!Array.isArray(body.weights) || !Array.isArray(body.biases)) {
      return res.status(400).json({ ok: false, error: 'Invalid AI state' });
    }
    state = { weights: body.weights, biases: body.biases };
    // Do not depend on writeable disk in serverless environments.
    return res.status(200).json({ ok: true, saved: true, persistent: false });
  }

  return res.status(404).json({ ok: false, error: 'Not found' });
};
