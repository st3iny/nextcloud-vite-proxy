# nextcloud-vite-proxy

## TODO

- [ ] Handle TLS by creating a self-signed certificate
- [ ] Let users configure their nextcloud upstream via a JSON config file

## PoC: Use this in a Nextcloud app

1. Replace `http://localhost:8080` with your local Nextcloud upstream.
2. Run: `node vite-dev-proxy.js`
3. Navigate to the printed URL in your browser.

```js
// vite-dev-proxy.js

import { startProxy, guessViteBase } from 'nextcloud-vite-proxy'
import { randomInt } from 'node:crypto'
import { fileURLToPath } from 'node:url'
import { createServer } from 'vite'

const __dirname = fileURLToPath(new URL('.', import.meta.url))

const port = randomInt(20000, 40000)

const base = await guessViteBase(__dirname)

const server = await createServer({
	configFile: './vite.config.js',
	root: __dirname,
	server: {
		host: '127.0.0.1',
		port,
	},
	base,
})
await server.listen()

await startProxy(__dirname, port, 5176, 'http://localhost:8080')
```
