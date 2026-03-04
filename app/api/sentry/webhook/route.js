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


function extractStackInfo(error) {
  const values = error.exception?.values ?? []
  for (const exc of values) {
    const frames = exc.stacktrace?.frames
    if (!frames?.length) continue
    const appFrames = frames.filter((f) => f.in_app)
    const top = appFrames.at(-1) ?? frames.at(-1)
    return {
      file: top.filename ?? top.abs_path ?? 'unknown',
      line: top.lineno ?? null,
      function: top.function ?? null,
      type: exc.type,
      value: exc.value,
    }
  }
  return null
}

function isErrorRelevantToProject(error) {
  if (error.platform && !['javascript', 'node'].includes(error.platform)) {
    return false
  }

  const values = error.exception?.values ?? []
  const hasAnyStack = values.some((exc) => exc.stacktrace?.frames?.length > 0)
  if (!hasAnyStack) return true

  for (const exc of values) {
    const frames = exc.stacktrace?.frames
    if (!frames?.length) continue
    if (frames.some((f) => /\.(jsx?|tsx?|mjs|cjs)$/i.test(f.filename ?? f.abs_path ?? ''))) {
      return true
    }
  }

  return false
}

function formatTopFrames(error, hasSourcemaps) {
  const values = error.exception?.values ?? []
  for (const exc of values) {
    const frames = exc.stacktrace?.frames
    if (!frames?.length) continue
    const appFrames = frames.filter((f) => f.in_app)
    const topFrames = (appFrames.length ? appFrames : frames).slice(-3).reverse()
    const lines = topFrames
      .map((f) => `  ${f.filename ?? f.abs_path ?? '?'}:${f.lineno ?? '?'} in ${f.function ?? '?'}`)
    if (!hasSourcemaps) {
      lines.push('  (minified — no sourcemaps available)')
    }
    return lines.join('\n')
  }
  return null
}

function formatBreadcrumbs(error) {
  const crumbs = error.breadcrumbs?.values
  if (!crumbs?.length) return null

  const relevant = crumbs
    .filter((c) => ['fetch', 'http', 'xhr', 'ui.click', 'navigation', 'console'].includes(c.category))
    .slice(-5)
  if (!relevant.length) return null

  return relevant.map((c) => {
    if (c.category === 'fetch' || c.category === 'http' || c.category === 'xhr') {
      const method = c.data?.method ?? '?'
      const url = c.data?.url ?? '?'
      const status = c.data?.status_code
      const statusStr = status ? ` → ${status}` : ''
      return `  [${c.category}] ${method} ${url}${statusStr}`
    }
    if (c.category === 'ui.click') {
      return `  [ui.click] ${c.message ?? '?'}`
    }
    if (c.category === 'navigation') {
      return `  [navigation] ${c.data?.from ?? '?'} → ${c.data?.to ?? '?'}`
    }
    if (c.category === 'console') {
      return `  [console.${c.level ?? 'log'}] ${(c.message ?? '').slice(0, 120)}`
    }
    return `  [${c.category}] ${c.message ?? ''}`
  }).join('\n')
}

function extractPageUrl(error) {
  const tags = error.tags
  if (!Array.isArray(tags)) return null
  const urlTag = tags.find((t) => t[0] === 'url')
  return urlTag?.[1] ?? null
}

function checkSourcemaps(error) {
  const errs = error.errors
  if (!Array.isArray(errs)) return true
  return !errs.some((e) => e.type === 'js_no_source' || e.symbolicator_type === 'missing_source')
}

function buildDevinPrompt({ title, stack, topFrames, breadcrumbs, pageUrl, sentryUrl, release, transaction, environment, requestUrl, requestMethod }) {
  const errorLine = stack
    ? `${stack.type}: ${stack.value}`
    : title

  const stackSection = topFrames
    ? `stack:\n${topFrames}`
    : '(no stack trace available)'

  const breadcrumbsSection = breadcrumbs
    ? `breadcrumbs (most recent last):\n${breadcrumbs}`
    : null

  const contextLines = [
    `error: ${errorLine}`,
    transaction ? `transaction: ${transaction}` : null,
    pageUrl ? `page: ${pageUrl}` : null,
    requestMethod && requestUrl ? `request: ${requestMethod} ${requestUrl}` : null,
    environment ? `environment: ${environment}` : null,
    release ? `release: ${release}` : null,
    sentryUrl ? `sentry event: ${sentryUrl}` : null,
    '',
    breadcrumbsSection,
    '',
    stackSection,
  ].filter((line) => line != null).join('\n')

  return `You are Devin. A Sentry error was captured for tic-tac-toe.

Repo: ${REPO_URL}
Production: ${PRODUCTION_URL}

Sentry context:
${contextLines}

Tasks:
1. Root-cause the error using the stack trace, breadcrumbs, and Sentry context.
2. Implement a fix and add a small regression test or minimal check.
3. Open a PR with the fix and include a short explanation.`
}

async function createDevinSession(prompt, issueId) {
  const key = process.env.DEVIN_API_KEY
  if (!key) {
    console.error('[sentry-webhook] DEVIN_API_KEY not set, skipping Devin session for', issueId)
    return
  }

  console.log('[sentry-webhook] Calling Devin API', {
    issueId,
    endpoint: 'https://api.devin.ai/v1/sessions',
    promptLength: prompt.length,
    prompt,
  })

  const startTime = Date.now()
  const res = await fetch('https://api.devin.ai/v1/sessions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ prompt, idempotent: true }),
  })
  const durationMs = Date.now() - startTime

  if (!res.ok) {
    const errorBody = await res.text()
    console.error('[sentry-webhook] Devin API error', {
      issueId,
      status: res.status,
      durationMs,
      body: errorBody,
    })
  } else {
    const data = await res.json()
    console.log('[sentry-webhook] Devin session created', {
      issueId,
      sessionId: data.session_id,
      url: data.url,
      durationMs,
    })
  }
}

export async function POST(request) {
  console.log('[sentry-webhook] Incoming webhook received', {
    method: request.method,
    url: request.url,
    resource: request.headers.get('sentry-hook-resource'),
  })

  const secret = process.env.SENTRY_CLIENT_SECRET
  if (!secret) {
    console.error('[sentry-webhook] SENTRY_CLIENT_SECRET not set')
    return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 })
  }

  const signature = request.headers.get('sentry-hook-signature')
  if (!signature) {
    console.warn('[sentry-webhook] Request missing sentry-hook-signature header')
    return NextResponse.json({ error: 'Missing signature' }, { status: 401 })
  }

  const body = await request.text()

  if (!verifySignature(body, signature, secret)) {
    console.warn('[sentry-webhook] Signature verification failed')
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  console.log('[sentry-webhook] Signature verified successfully')

  let payload
  try {
    payload = JSON.parse(body)
  } catch {
    console.error('[sentry-webhook] Failed to parse request body as JSON')
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  console.log('[sentry-webhook] Payload received', JSON.stringify(payload, null, 2))

  if (payload.action !== 'created') {
    console.log(`[sentry-webhook] Skipping — action is "${payload.action}", not "created"`)
    return NextResponse.json({ ok: true, skipped: 'action is not created' })
  }

  const error = payload.data?.error
  if (!error) {
    console.log('[sentry-webhook] Skipping — no error data in payload')
    return NextResponse.json({ ok: true, skipped: 'no error data' })
  }

  if (!isErrorRelevantToProject(error)) {
    console.log('[sentry-webhook] Skipping — error is not relevant to the project', {
      platform: error.platform,
      title: error.title,
    })
    return NextResponse.json({ ok: true, skipped: 'error not relevant to project' })
  }

  const eventId = error.event_id
  console.log('[sentry-webhook] Error event received', {
    eventId,
    title: error.title,
    level: error.level,
    platform: error.platform,
    culprit: error.culprit,
    transaction: error.transaction,
    environment: error.environment,
    release: error.release,
    sentryUrl: error.web_url,
  })

  const stack = extractStackInfo(error)
  const hasSourcemaps = checkSourcemaps(error)
  const topFrames = formatTopFrames(error, hasSourcemaps)
  const breadcrumbs = formatBreadcrumbs(error)
  const pageUrl = extractPageUrl(error)

  const prompt = buildDevinPrompt({
    title: error.title,
    stack,
    topFrames,
    breadcrumbs,
    pageUrl,
    sentryUrl: error.web_url,
    release: error.release,
    transaction: error.transaction ?? error.culprit,
    environment: error.environment,
    requestUrl: error.request?.url,
    requestMethod: error.request?.method,
  })

  console.log('[sentry-webhook] Triggering Devin session for event', eventId)

  after(() => createDevinSession(prompt, eventId))

  return NextResponse.json({
    ok: true,
    eventId,
    devinTriggered: true,
  })
}
