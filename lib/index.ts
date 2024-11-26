import http from 'node:http'
import httpProxy from 'http-proxy'

export async function startProxy(
    viteBase: string,
    viteUrl: string,
    listenPort: number,
    nextcloudUrl: string = 'http://localhost:80',
) {
  const isViteRequest = (url: string) => url.startsWith(viteBase)

  const proxy = httpProxy.createProxyServer()

  // Handle http requests
  const server = http.createServer(function(req, res) {
    try {
      if (isViteRequest(req.url!)) {
        console.log('[vite:http]', req.url)
        proxy.web(req, res, {
          target: viteUrl,
        })
      } else {
        console.log('[nextcloud:http]', req.url)
        proxy.web(req, res, {
          target: nextcloudUrl,
          headers: {
            'X-Vite-Dev-Proxy': 'true',
          },
        })
      }
    } catch (error) {
      console.error(`Failed to proxy http: ${error}`)
      res.writeHead(500)
      res.end()
    }
  })

  // Handle ws requests
  server.on('upgrade', function(req, socket, head) {
    try {
      if (isViteRequest(req.url!)) {
        console.log('[vite:ws]', req.url)
        proxy.ws(req, socket, head, {
          target: viteUrl,
        })
      } else {
        console.log('[nextcloud:ws]', req.url)
        proxy.ws(req, socket, head, {
          target: nextcloudUrl,
        })
      }
    } catch (error) {
      console.error(`Failed to proxy ws: ${error}`)
    }
  })

  server.listen(listenPort)

  //console.log('Don\'t forget to add localhost to your trusted proxies list!')
  console.log(`Proxied Nextcloud is listening at http://0.0.0.0:${listenPort}`)
  console.log()
}
