import crypto from 'crypto'
import { NextResponse } from 'next/server'
import { after } from 'next/server'

function verify(body, signature, secret) {
  const hmac = crypto.createHmac('sha256', secret)
  hmac.update(body, 'utf8')
  const digest = hmac.digest('hex')
  return crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(signature))
}

async function triggerDevin(title, culprit, url) {
  const prompt = [
    `Sentry captured a new error in the tic-tac-toe app.`,
    ``,
    `**${title}**`,
    `Culprit: ${culprit}`,
    `Sentry link: ${url}`,
    ``,
    `Please investigate, find the root cause, and open a PR with a fix.`,
  ].join('\n')

  const res = await fetch('https://api.devin.ai/v1/sessions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.DEVIN_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ prompt, idempotent: true }),
  })

  if (!res.ok) {
    const text = await res.text()
    console.error('Devin API error:', res.status, text)
  } else {
    const data = await res.json()
    console.log('Devin session created:', data.session_id ?? data)
  }
}

export async function POST(request) {
  const secret = process.env.SENTRY_WEBHOOK_SECRET
  if (!secret) {
    return NextResponse.json({ error: 'not configured' }, { status: 500 })
  }

  const signature = request.headers.get('sentry-hook-signature')
  if (!signature) {
    return NextResponse.json({ error: 'missing signature' }, { status: 401 })
  }

  const body = await request.text()

  if (!verify(body, signature, secret)) {
    return NextResponse.json({ error: 'invalid signature' }, { status: 401 })
  }

  const payload = JSON.parse(body)

  // Only react to newly created issues
  if (payload.action !== 'created') {
    return NextResponse.json({ ok: true, skipped: 'not a created action' })
  }

  const issue = payload.data?.issue
  if (!issue) {
    return NextResponse.json({ ok: true, skipped: 'no issue data' })
  }

  const title = issue.title
  const culprit = issue.culprit || 'unknown'
  const url = issue.permalink || ''

  // Use after() to call Devin API *after* we return 200 to Sentry
  // This keeps us within Sentry's 1s webhook timeout
  after(() => triggerDevin(title, culprit, url))

  return NextResponse.json({ ok: true })
}
