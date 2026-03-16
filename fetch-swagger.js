const https = require('https');

https.get('https://kolve18freeswing.com/swagger/v1/swagger.json', (res) => {
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => {
    try {
      const swagger = JSON.parse(body);
      const paths = swagger.paths;
      for (const [path, methods] of Object.entries(paths)) {
        if (path.toLowerCase().includes('user') || path.toLowerCase().includes('profile')) {
          console.log(`Path: ${path}`);
          console.log(`Methods: ${Object.keys(methods).join(', ')}`);
        }
      }
    } catch(e) {
      console.log('Error parsing', e);
    }
  });
}).on('error', e => console.log('Fetch error', e));
