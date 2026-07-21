// Local development CORS proxy, mirroring the behavior of https://cors.stirante.com
// Proxies any request of the form http://localhost:3000/<host>/<path> to https://<host>/<path>
// (unlike @isomorphic-git/cors-proxy, which only allows git requests).
// Usage: npm run proxy

const http = require('http');
const https = require('https');

const PORT = process.env.PORT || 3000;

const STRIP_REQUEST_HEADERS = ['host', 'origin', 'referer', 'connection'];
const STRIP_RESPONSE_HEADERS = ['connection', 'transfer-encoding', 'access-control-allow-origin'];

http.createServer((req, res) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': req.headers['access-control-request-headers'] || '*',
    'Access-Control-Expose-Headers': '*'
  };

  if (req.method === 'OPTIONS') {
    res.writeHead(204, corsHeaders);
    res.end();
    return;
  }

  let target = req.url.slice(1);
  if (target.startsWith('https://')) {
    // already a full URL, use as is
  } else if (target.startsWith('http://')) {
    // use as is
  } else {
    target = 'https://' + target;
  }

  let targetUrl;
  try {
    targetUrl = new URL(target);
  } catch (e) {
    res.writeHead(400, corsHeaders);
    res.end('Invalid proxy URL: ' + target);
    return;
  }

  const headers = {...req.headers};
  for (const header of STRIP_REQUEST_HEADERS) {
    delete headers[header];
  }
  headers.host = targetUrl.host;

  const client = targetUrl.protocol === 'http:' ? http : https;
  const proxyReq = client.request(targetUrl, {method: req.method, headers}, proxyRes => {
    const responseHeaders = {...proxyRes.headers};
    for (const header of STRIP_RESPONSE_HEADERS) {
      delete responseHeaders[header];
    }
    // Keep redirects going through the proxy
    if (responseHeaders.location && /^https?:\/\//.test(responseHeaders.location)) {
      responseHeaders.location = '/' + responseHeaders.location.replace(/^https?:\/\//, '');
    }
    res.writeHead(proxyRes.statusCode, {...responseHeaders, ...corsHeaders});
    proxyRes.pipe(res);
  });

  proxyReq.on('error', err => {
    console.error(req.method + ' ' + target + ' failed: ' + err.message);
    if (!res.headersSent) {
      res.writeHead(502, corsHeaders);
    }
    res.end('Proxy error: ' + err.message);
  });

  req.pipe(proxyReq);
}).listen(PORT, () => {
  console.log('CORS proxy listening on http://localhost:' + PORT);
});
