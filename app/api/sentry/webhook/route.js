import crypto from 'crypto'
import { NextResponse, after } from 'next/server'

const REPO_URL = 'https://github.com/shayanshafii/tic-tac-toe'
const PRODUCTION_URL = 'https://tic-tac-toe-psi-vert.vercel.app/'

function verifySignature(body, signature, secret) {
  const hmac = crypto.createHmac('sha256', secret)
  hmac.update(body, 'utf8')
  const digest = hmac.digest('hex')
  return crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(signature))
}

function extractStackInfo(issue) {
  const event = issue.latestEvent ?? issue.event
  if (!event?.entries) return null

  for (const entry of event.entries) {
    if (entry.type !== 'exception') continue
    const values = entry.data?.values ?? []
    for (const exc of values) {
      const frames = exc.stacktrace?.frames
      if (!frames?.length) continue
      const appFrames = frames.filter((f) => f.inApp)
      const top = appFrames.at(-1) ?? frames.at(-1)
      return {
        file: top.filename ?? top.absPath ?? 'unknown',
        line: top.lineNo ?? top.lineno ?? null,
        function: top.function ?? null,
        context: top.context ?? [],
        type: exc.type,
        value: exc.value,
      }
    }
  }
  return null
}

function formatTopFrames(issue) {
  const event = issue.latestEvent ?? issue.event
  if (!event?.entries) return null

  for (const entry of event.entries) {
    if (entry.type !== 'exception') continue
    const values = entry.data?.values ?? []
    for (const exc of values) {
      const frames = exc.stacktrace?.frames
      if (!frames?.length) continue
      const appFrames = frames.filter((f) => f.inApp)
      const topFrames = (appFrames.length ? appFrames : frames).slice(-3).reverse()
      return topFrames
        .map((f) => `  ${f.filename ?? f.absPath ?? '?'}:${f.lineNo ?? f.lineno ?? '?'} in ${f.function ?? '?'}`)
        .join('\n')
    }
  }
  return null
}

function buildDevinPrompt({ title, stack, topFrames }) {
  const errorLine = stack
    ? `${stack.type}: ${stack.value}`
    : title

  const stackSection = topFrames
    ? `stack:\n${topFrames}`
    : '(no stack trace available)'

  return `You are Devin. A Sentry issue was created for tic-tac-toe.

Repo: ${REPO_URL}
Production: ${PRODUCTION_URL}

Sentry context:
error: ${errorLine}
${stackSection}

Tasks:
1. Root-cause and fix the backend bug in app/api/move/route.js so AI always returns a valid move.
2. Harden the client in app/page.js to throw on non-2xx and invalid AI index.
3. Add a small regression test or minimal check to prevent this from reappearing.

Output: open a PR with the fix and include a short explanation.`
}

async function createDevinSession(prompt) {
  const key = process.env.DEVIN_API_KEY
  if (!key) {
    console.error('[sentry-webhook] DEVIN_API_KEY not set, skipping session creation')
    return
  }

  const res = await fetch('https://api.devin.ai/v1/sessions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ prompt, idempotent: true }),
  })

  if (!res.ok) {
    console.error('[sentry-webhook] Devin API error:', res.status, await res.text())
  } else {
    const data = await res.json()
    console.log('[sentry-webhook] Devin session created:', data.session_id ?? data.url ?? data)
  }
}

export async function POST(request) {
  const secret = process.env.SENTRY_CLIENT_SECRET
  if (!secret) {
    return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 })
  }

  const signature = request.headers.get('sentry-hook-signature')
  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 401 })
  }

  const body = await request.text()

  if (!verifySignature(body, signature, secret)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  let payload
  try {
    payload = JSON.parse(body)
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  if (payload.action !== 'created') {
    return NextResponse.json({ ok: true, skipped: 'action is not created' })
  }

  const issue = payload.data?.issue
  if (!issue) {
    return NextResponse.json({ ok: true, skipped: 'no issue data' })
  }

  const stack = extractStackInfo(issue)
  const topFrames = formatTopFrames(issue)

  const prompt = buildDevinPrompt({
    title: issue.title,
    stack,
    topFrames,
  })

  console.log(`[sentry-webhook] issue:created — ${issue.title} (${issue.shortId})`)

  after(() => createDevinSession(prompt))

  return NextResponse.json({
    ok: true,
    issue: issue.shortId,
    devinTriggered: true,
  })
}
