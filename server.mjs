import { createServer } from 'http';
import next from 'next';

const dev = false;
const hostname = 'localhost';
const port = 3000;
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer(async (req, res) => {
    try {
      await handle(req, res);
    } catch (err) {
      console.error('Error handling request:', err);
      res.statusCode = 500;
      res.end('Internal Server Error');
    }
  });

  server.listen(port, (err) => {
    if (err) throw err;
    console.log(`> ID2950 Server listening on http://${hostname}:${port}`);
  });
}).catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

