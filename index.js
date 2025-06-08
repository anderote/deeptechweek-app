require('dotenv').config();
const express = require('express');
const axios = require('axios');
const http = require('http');
const { WebSocketServer } = require('ws');
const NodeCache = require('node-cache');
const { Low } = require('lowdb');
const { JSONFile } = require('lowdb/node');

const app = express();
app.use(express.json());
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

wss.on('connection', ws => {
  ws.on('message', msgStr => {
    try {
      const msg = JSON.parse(msgStr);
      if (msg && msg.eventId && msg.from && msg.text) {
        const chat = { from: msg.from, to: msg.to || null, eventId: msg.eventId, text: msg.text };
        messages.push(chat);
        db.data.messages.push(chat);
        saveDb();
        // broadcast to all clients of same event
        wss.clients.forEach(client => {
          if (client !== ws && client.readyState === 1) {
            client.send(JSON.stringify(chat));
          }
        });
      }
    } catch (e) {
      console.error('invalid ws message', e);
    }
  });
});

// persistent storage using lowdb
const db = new Low(new JSONFile('db.json'), { users: [], messages: [] });
async function initDb() {
  await db.read();
  db.data ||= { users: [], messages: [] };
  // populate in-memory caches
  for (const u of db.data.users) users.set(u.id, u);
  messages.push(...db.data.messages);
  await db.write();
}
initDb();

async function saveDb() {
  await db.write();
}

const cache = new NodeCache({ stdTTL: 300 });

const PORT = process.env.PORT || 3000;
const LUMA_BASE = 'https://api.getluma.com/v1';
const LUMA_API_KEY = process.env.LUMA_API_KEY;

// In-memory caches (persistent data stored in lowdb)
const users = new Map();
const messages = [];

// Helper to call Luma API
async function lumaRequest(path) {
  const url = `${LUMA_BASE}${path}`;
  const headers = LUMA_API_KEY ? { Authorization: `Bearer ${LUMA_API_KEY}` } : {};
  const response = await axios.get(url, { headers });
  return response.data;
}

async function fetchEvents() {
  let events = cache.get('events');
  if (!events) {
    try {
      events = await lumaRequest('/events');
      cache.set('events', events);
    } catch (err) {
      console.error(err.response?.data || err.message);
      events = { events: [{ id: 'sample', name: 'Sample Event' }] };
    }
  }
  return events;
}

app.get('/events', async (req, res) => {
  const events = await fetchEvents();
  res.json(events);
});

app.get('/calendar', async (req, res) => {
  const data = await fetchEvents();
  const events = data.events || [];
  let html = '<html><head><title>Event Calendar</title></head><body><h1>Events</h1><ul>';
  for (const ev of events) {
    const start = ev.start_time || ev.startTime || '';
    html += `<li><strong>${ev.name}</strong> ${start}</li>`;
  }
  html += '</ul></body></html>';
  res.send(html);
});

app.get('/events/:id', async (req, res) => {
  const { id } = req.params;
  const key = `event-${id}`;
  let event = cache.get(key);
  if (!event) {
    try {
      event = await lumaRequest(`/events/${id}`);
      cache.set(key, event);
    } catch (err) {
      console.error(err.response?.data || err.message);
      event = { id, name: 'Sample Event Detail' };
    }
  }
  res.json(event);
});

app.get('/events/:id/attendees', async (req, res) => {
  const { id } = req.params;
  const key = `attendees-${id}`;
  let attendees = cache.get(key);
  if (!attendees) {
    try {
      attendees = await lumaRequest(`/events/${id}/attendees`);
      cache.set(key, attendees);
    } catch (err) {
      console.error(err.response?.data || err.message);
      attendees = { attendees: [] };
    }
  }
  res.json(attendees);
});

app.post('/users', async (req, res) => {
  const { id, name, role, interests } = req.body;
  if (!id || !name) return res.status(400).json({ error: 'id and name required' });
  const user = { id, name, role, interests };
  users.set(id, user);
  db.data.users.push(user);
  await saveDb();
  res.status(201).json({ ok: true });
});

app.get('/users/:id', (req, res) => {
  const user = users.get(req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json(user);
});

app.put('/users/:id', async (req, res) => {
  const id = req.params.id;
  if (!users.has(id)) return res.status(404).json({ error: 'User not found' });
  const existing = users.get(id);
  const updated = { ...existing, ...req.body, id };
  users.set(id, updated);
  const idx = db.data.users.findIndex(u => u.id === id);
  db.data.users[idx] = updated;
  await saveDb();
  res.json({ ok: true });
});

app.post('/messages', async (req, res) => {
  const { from, to, eventId, text } = req.body;
  if (!from || !to || !eventId || !text) {
    return res.status(400).json({ error: 'Missing fields' });
  }
  const msg = { from, to, eventId, text };
  messages.push(msg);
  db.data.messages.push(msg);
  await saveDb();
  res.status(201).json({ ok: true });
});

app.get('/messages/:eventId', (req, res) => {
  const eventId = req.params.eventId;
  const eventMessages = messages.filter(m => m.eventId === eventId);
  res.json(eventMessages);
});

app.post('/match', (req, res) => {
  const { eventId, interest } = req.body;
  if (!eventId || !interest) return res.status(400).json({ error: 'Missing fields' });
  const attendees = [...users.values()].filter(u => u.interests?.includes(interest));
  res.json({ matches: attendees });
});

app.post('/notify', (req, res) => {
  // Placeholder for push notification logic
  console.log('Push notification:', req.body);
  res.json({ ok: true });
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
