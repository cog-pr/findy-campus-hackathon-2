import { Hono } from 'hono'
import { agentsMiddleware } from 'hono-agents'
import { renderToReadableStream } from 'react-dom/server'
import { Script, Link, ViteClient, ReactRefresh } from 'vite-ssr-components/react'
export { GroupAgent } from './agents/group-agent'

const app = new Hono<{ Bindings: CloudflareBindings }>()

app.use('*', agentsMiddleware())

app.get('/', async (c) => {
  c.header('Content-Type', 'text/html')
  return c.body(
    await renderToReadableStream(
      <html lang="ja">
        <head>
          <meta charSet="utf-8" />
          <meta
            name="viewport"
            content="width=device-width, initial-scale=1, viewport-fit=cover, maximum-scale=1"
          />
          <meta name="theme-color" content="#0048B0" />
          <meta name="apple-mobile-web-app-capable" content="yes" />
          <meta name="apple-mobile-web-app-status-bar-style" content="default" />
          <title>WakeMate — 共有アラーム</title>
          <link rel="icon" type="image/png" href="/assets/logo-wakemate-clear.png" />
          <link rel="apple-touch-icon" href="/assets/logo-wakemate-clear.png" />
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
          <link
            href="https://fonts.googleapis.com/css2?family=Figtree:wght@500;600;700;800;900&family=Noto+Sans+JP:wght@400;500;600;700;800;900&display=swap"
            rel="stylesheet"
          />
          <ViteClient />
          <ReactRefresh />
          <Script src="/src/client/index.tsx" />
          <Link href="/src/style.css" rel="stylesheet" />
        </head>
        <body>
          <div id="root" />
        </body>
      </html>
    )
  )
})

export default app
