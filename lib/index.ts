import http from 'node:http'
import path from 'node:path'
import { readFile } from 'node:fs/promises'
import httpProxy from 'http-proxy'

export async function guessWebRoot(appDir: string): Promise<string|undefined> {
  const configPath = path.join(appDir, '../../config/config.php')
  console.log('appDir', appDir)
  console.log('configPath', configPath)
  const config = await readFile(configPath, 'utf8')
  const matches = config.match(/['"]overwritewebroot['"]\s*=>\s*['"]([^'"]*)['"]/)
  return matches?.[1] ?? undefined
}

export async function guessViteBase(appDir: string): Promise<string> {
  let webRoot = await guessWebRoot(appDir)
  if (!webRoot) {
    console.error('Failed to guess webroot! Assuming "/" ...')
    webRoot = '/'
  }

  const relativePath = path.relative(path.join(appDir, '../../'), appDir)
  return path.join(webRoot, relativePath)
}

export async function startProxy(
  appDir: string,
  vitePort: number,
  listenPort: number,
  nextcloudUrl: string = 'http://localhost:80',
) {
  // TODO: guess
  //const webroot = '/master'
  //const ncProto = 'http'
  //const ncHost = '127.0.0.1'
  //const ncPort = '8080'

  const viteBase = await guessViteBase(appDir)
  const viteUrl = `http://127.0.0.1:${vitePort}`

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

  console.log()
  //console.log('Don\'t forget to add localhost to your trusted proxies list!')
  console.log(`Proxied Nextcloud is listening at http://localhost:${listenPort}`)
}
