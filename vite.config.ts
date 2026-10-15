import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import crypto from 'crypto'
import fs from 'fs'
import path from 'path'

const MAX_BODY_BYTES = 16 * 1024
const isAddressOrEmpty = (v: unknown) => v === undefined || v === '' || (typeof v === 'string' && /^0x[0-9a-fA-F]{40}$/.test(v.trim()))
const isKeyOrEmpty = (v: unknown) => v === undefined || v === '' || (typeof v === 'string' && /^(0x)?[0-9a-fA-F]{64}$/.test(v.trim()))

/**
 * Dev-server only: lets /memex read and write .env and bot-config.json on this machine.
 * Every call needs ADMIN_SECRET (min 16 characters) in the x-admin-secret header, and the
 * private key is never sent back to the browser, only whether one is set.
 */
function adminSavePlugin(adminSecret: string) {
  const enabled = adminSecret.length >= 16
  const matches = (given: string) =>
    crypto.timingSafeEqual(crypto.createHash('sha256').update(given).digest(), crypto.createHash('sha256').update(adminSecret).digest())

  const deny = (req: any, res: any): boolean => {
    const send = (status: number, error: string) => {
      res.writeHead(status, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ success: false, error }))
      return true
    }
    if (!enabled) return send(403, 'Admin API is closed: set ADMIN_SECRET (min 16 characters) in .env')
    const header = req.headers['x-admin-secret']
    const given = (Array.isArray(header) ? header[0] : header) || ''
    if (!given || !matches(given)) return send(401, 'Wrong or missing admin secret')
    return false
  }

  return {
    name: 'admin-save-plugin',
    configureServer(server: any) {
      server.middlewares.use((req: any, res: any, next: any) => {
        const url = req.url || ''

        // 1. GET /api/admin/config
        if (url === '/api/admin/config' && req.method === 'GET') {
          if (deny(req, res)) return
          try {
            const envPath = path.resolve(process.cwd(), '.env')
            let tokenAddress = ''
            let hasPrivateKey = false
            let treasuryAddress = ''

            if (fs.existsSync(envPath)) {
              const envContent = fs.readFileSync(envPath, 'utf-8')
              const tokenMatch = envContent.match(/VITE_TOKEN_ADDRESS=["']?([^"'\r\n]+)["']?/)
              const keyMatch = envContent.match(/CREATOR_PRIVATE_KEY=["']?([^"'\r\n]+)["']?/)
              const treasuryMatch = envContent.match(/(?:TREASURY_ADDRESS|VITE_CREATOR_ADDRESS)=["']?([^"'\r\n]+)["']?/)
              if (tokenMatch) tokenAddress = tokenMatch[1]
              if (keyMatch) hasPrivateKey = true
              if (treasuryMatch) treasuryAddress = treasuryMatch[1]
            }

            const configPath = path.resolve(process.cwd(), 'bot-config.json')
            if (fs.existsSync(configPath)) {
              try {
                const saved = JSON.parse(fs.readFileSync(configPath, 'utf-8'))
                if (saved.tokenAddress && !tokenAddress) tokenAddress = saved.tokenAddress
                if (saved.privateKey) hasPrivateKey = true
                if (saved.treasuryAddress && !treasuryAddress) treasuryAddress = saved.treasuryAddress
              } catch (e) {}
            }

            res.writeHead(200, { 'Content-Type': 'application/json' })
            res.end(JSON.stringify({ success: true, tokenAddress, hasPrivateKey, treasuryAddress }))
            return
          } catch (err: any) {
            res.writeHead(500, { 'Content-Type': 'application/json' })
            res.end(JSON.stringify({ success: false, error: err.message }))
            return
          }
        }

        // 2. POST /api/admin/save
        if (url === '/api/admin/save' && req.method === 'POST') {
          if (deny(req, res)) {
            req.resume()
            return
          }
          let body = ''
          let tooBig = false
          req.on('data', (chunk: any) => {
            if (tooBig) return
            body += chunk
            if (body.length > MAX_BODY_BYTES) {
              tooBig = true
              res.writeHead(413, { 'Content-Type': 'application/json' })
              res.end(JSON.stringify({ success: false, error: 'Request body too large' }))
              req.destroy()
            }
          })
          req.on('end', () => {
            if (tooBig) return
            try {
              const data = JSON.parse(body || '{}')
              // only plain addresses and keys may reach .env (no quotes or newlines)
              if (!isAddressOrEmpty(data.tokenAddress) || !isAddressOrEmpty(data.treasuryAddress) || !isAddressOrEmpty(data.creatorAddress) || !isKeyOrEmpty(data.privateKey)) {
                res.writeHead(400, { 'Content-Type': 'application/json' })
                res.end(JSON.stringify({ success: false, error: 'Addresses must be 0x + 40 hex characters, the key 64 hex characters' }))
                return
              }
              for (const k of ['tokenAddress', 'treasuryAddress', 'creatorAddress', 'privateKey']) {
                if (typeof data[k] === 'string') data[k] = data[k].trim()
              }
              const envPath = path.resolve(process.cwd(), '.env')
              let envContent = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf-8') : ''

              if (data.tokenAddress !== undefined) {
                if (envContent.includes('VITE_TOKEN_ADDRESS=')) {
                  envContent = envContent.replace(/VITE_TOKEN_ADDRESS=.*/g, `VITE_TOKEN_ADDRESS="${data.tokenAddress}"`)
                } else {
                  envContent += `\nVITE_TOKEN_ADDRESS="${data.tokenAddress}"`
                }
              }

              if (data.privateKey !== undefined) {
                if (envContent.includes('CREATOR_PRIVATE_KEY=')) {
                  envContent = envContent.replace(/CREATOR_PRIVATE_KEY=.*/g, `CREATOR_PRIVATE_KEY="${data.privateKey}"`)
                } else {
                  envContent += `\nCREATOR_PRIVATE_KEY="${data.privateKey}"`
                }
              }

              if (data.treasuryAddress !== undefined) {
                if (envContent.includes('TREASURY_ADDRESS=')) {
                  envContent = envContent.replace(/TREASURY_ADDRESS=.*/g, `TREASURY_ADDRESS="${data.treasuryAddress}"`)
                } else {
                  envContent += `\nTREASURY_ADDRESS="${data.treasuryAddress}"`
                }
                if (envContent.includes('VITE_CREATOR_ADDRESS=')) {
                  envContent = envContent.replace(/VITE_CREATOR_ADDRESS=.*/g, `VITE_CREATOR_ADDRESS="${data.treasuryAddress}"`)
                } else {
                  envContent += `\nVITE_CREATOR_ADDRESS="${data.treasuryAddress}"`
                }
              }

              if (data.creatorAddress) {
                if (envContent.includes('VITE_CREATOR_ADDRESS=')) {
                  envContent = envContent.replace(/VITE_CREATOR_ADDRESS=.*/g, `VITE_CREATOR_ADDRESS="${data.creatorAddress}"`)
                } else {
                  envContent += `\nVITE_CREATOR_ADDRESS="${data.creatorAddress}"`
                }
              }

              fs.writeFileSync(envPath, envContent, 'utf-8')

              // Update bot-config.json jika ada
              const configPath = path.resolve(process.cwd(), 'bot-config.json')
              let botConfig: any = {}
              if (fs.existsSync(configPath)) {
                try {
                  botConfig = JSON.parse(fs.readFileSync(configPath, 'utf-8'))
                } catch (e) {}
              }
              if (data.tokenAddress !== undefined) botConfig.tokenAddress = data.tokenAddress
              if (data.privateKey !== undefined) botConfig.privateKey = data.privateKey
              if (data.treasuryAddress !== undefined) botConfig.treasuryAddress = data.treasuryAddress
              fs.writeFileSync(configPath, JSON.stringify(botConfig, null, 2), 'utf-8')

              res.writeHead(200, { 'Content-Type': 'application/json' })
              res.end(JSON.stringify({ success: true, message: 'Disimpan ke .env dan bot-config.json' }))
              return
            } catch (err: any) {
              res.writeHead(500, { 'Content-Type': 'application/json' })
              res.end(JSON.stringify({ success: false, error: err.message }))
              return
            }
          })
          return
        }

        next()
      })
    }
  }
}

export default defineConfig(({ mode }) => {
  const env = { ...loadEnv(mode, process.cwd(), ''), ...process.env }
  const botTarget = `http://127.0.0.1:${env.PORT || '5015'}`
  // xfwd: the bot sees each visitor's address, so its wrong-secret limit is per visitor
  const apiProxy = { '/api': { target: botTarget, changeOrigin: true, xfwd: true } }

  return {
    plugins: [react(), tailwindcss(), adminSavePlugin((env.ADMIN_SECRET || '').trim())],
    server: {
      watch: { ignored: ['**/bot-*.json', '**/bot/**/*.json', '**/.env'] },
      // the dev server can write .env, so it stays on this machine unless WEB_HOST opens it
      host: env.WEB_HOST || '127.0.0.1',
      port: parseInt(env.WEB_PORT || '3095', 10),
      proxy: apiProxy,
    },
    preview: {
      host: '0.0.0.0',
      port: parseInt(env.WEB_PORT || '3095', 10),
      allowedHosts: true,
      proxy: apiProxy,
    },
    build: {
      rollupOptions: {
        output: {
          entryFileNames: `assets/[name]-[hash]-${Date.now()}.js`,
          chunkFileNames: `assets/[name]-[hash]-${Date.now()}.js`,
          assetFileNames: `assets/[name]-[hash]-${Date.now()}.[ext]`,
        },
      },
    },
  }
})
