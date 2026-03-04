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

function buildDevinPrompt({ title, culprit, level, permalink }) {
  const contextLines = [
    `title: ${title}`,
    culprit ? `culprit: ${culprit}` : null,
    level ? `level: ${level}` : null,
    permalink ? `sentry issue: ${permalink}` : null,
  ].filter(Boolean).join('\n')

  return `You are Devin. A Sentry issue was created for tic-tac-toe.

Repo: ${REPO_URL}
Production: ${PRODUCTION_URL}

Sentry issue:
${contextLines}

Tasks:
1. Open the Sentry issue link, inspect the latest event, and root-cause the error.
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

  const issue = payload.data?.issue
  if (!issue) {
    console.log('[sentry-webhook] Skipping — no issue data in payload')
    return NextResponse.json({ ok: true, skipped: 'no issue data' })
  }

  const issueId = issue.id
  console.log('[sentry-webhook] New issue received', {
    issueId,
    title: issue.title,
    level: issue.level,
    platform: issue.platform,
    culprit: issue.culprit,
    permalink: issue.permalink,
  })

  const prompt = buildDevinPrompt({
    title: issue.title,
    culprit: issue.culprit,
    level: issue.level,
    permalink: issue.permalink,
  })

  console.log('[sentry-webhook] Triggering Devin session for issue', issueId)

  after(() => createDevinSession(prompt, issueId))

  return NextResponse.json({
    ok: true,
    issueId,
    devinTriggered: true,
  })
}
