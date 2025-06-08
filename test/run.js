const { spawn } = require('child_process');
const http = require('http');

function request(path, method = 'GET', data) {
  const opts = { host: 'localhost', port: 3000, path, method, headers: {} };
  if (data) {
    const buf = Buffer.from(data);
    opts.headers['Content-Type'] = 'application/json';
    opts.headers['Content-Length'] = buf.length;
  }
  return new Promise((resolve, reject) => {
    const req = http.request(opts, res => {
      let body = '';
      res.on('data', c => body += c);
      res.on('end', () => resolve({ status: res.statusCode, data: body }));
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

async function delay(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function main() {
  let server = spawn('node', ['index.js'], { env: { ...process.env, PORT: 3000 } });
  await delay(1000);

  let res = await request('/events').catch(() => null);
  if (!res || res.status !== 200) {
    console.error('Events endpoint failed');
    server.kill();
    process.exit(1);
  }

  res = await request('/calendar').catch(() => null);
  if (!res || res.status !== 200) {
    console.error('Calendar page failed');
    server.kill();
    process.exit(1);
  }

  await request('/users', 'POST', JSON.stringify({ id: 'test', name: 'Test' }));
  server.kill();
  await delay(500);

  server = spawn('node', ['index.js'], { env: { ...process.env, PORT: 3000 } });
  await delay(1000);
  res = await request('/users/test').catch(() => null);
  server.kill();

  if (!res || res.status !== 200) {
    console.error('User persistence failed');
    process.exit(1);
  }

  console.log('Server tests passed');
}

main();
