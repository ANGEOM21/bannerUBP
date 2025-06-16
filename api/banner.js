import http from 'http';
import https from 'https';

const PORT = 3333;

const server = http.createServer((req, res) => {
  if (req.url === '/banner') {
    // Step 1: Fetch URL gambar dulu
    https.get('https://api-gateway.ubpkarawang.ac.id/apps/dashboard/banner-akademik', (apiRes) => {
      let data = '';
      apiRes.on('data', (chunk) => {
        data += chunk;
      });

      apiRes.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          const imageUrl = parsed?.data;

          if (!imageUrl) {
            res.writeHead(500);
            res.end('URL gambar tidak ditemukan');
            return;
          }

          // Step 2: Fetch gambar dan stream ke client
          https.get(imageUrl, (imgRes) => {
            res.writeHead(200, {
              'Content-Type': imgRes.headers['content-type'],
              'Cache-Control': 'no-store',
            });
            imgRes.pipe(res);
          }).on('error', (err) => {
            console.error('Error fetch gambar:', err);
            res.writeHead(500);
            res.end('Gagal ambil gambar');
          });

        } catch (err) {
          console.error('Parsing JSON gagal:', err);
          res.writeHead(500);
          res.end('Response tidak valid');
        }
      });
    }).on('error', (err) => {
      console.error('Error fetch metadata:', err);
      res.writeHead(500);
      res.end('Gagal ambil data banner');
    });
  } else {
    res.writeHead(404);
    res.end('Not found');
  }
});

server.listen(PORT, () => {
  console.log(`🔥 Server proxy jalan di http://localhost:${PORT}/banner`);
});
