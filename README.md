# nextcloud-vite-proxy

## TODO

- [ ] Handle TLS by creating a self-signed certificate
- [ ] Let users configure their nextcloud upstream via a JSON config file

## PoC: Use this in a Nextcloud app

1. Replace `http://localhost:8080` with your local Nextcloud upstream.
2. Replace `mail` in the `viteBase` string with your app id.
2. Run: `node vite-dev-proxy.mjs`
3. Navigate to the printed URL in your browser, e.g. `http://localhost:8090`.

```js
// vite-dev-proxy.mjs

import { fileURLToPath } from 'node:url'
import { randomInt } from 'node:crypto'
import { createServer } from 'vite'
import { startProxy } from 'nextcloud-vite-proxy'

const __dirname = fileURLToPath(new URL('.', import.meta.url))

const vitePort = randomInt(30000, 50000)
const viteUrl = `http://127.0.0.1:${vitePort}`
// TODO: replace "mail" with your app id
const viteBase = '/vite-dev-mail/'

// Start vite dev server
const server = await createServer({
	configFile: './vite.config.js',
	root: __dirname,
	server: {
		host: '127.0.0.1',
		port: vitePort,
	},
	base: viteBase,
})
await server.listen()

// Start dev proxy
await startProxy(viteBase, viteUrl, 8090, 'http://localhost:8080')

```
