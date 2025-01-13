import { NextResponse } from 'next/server'
import * as cheerio from 'cheerio'

// Simple in-memory rate limiting
const RATE_LIMIT_WINDOW = 60 * 1000 // 1 minute
const MAX_REQUESTS = 10 // requests per window
const requests = new Map<string, number[]>()

function isRateLimited(ip: string): boolean {
  const now = Date.now()
  const userRequests = requests.get(ip) || []
  
  // Remove old requests
  const recentRequests = userRequests.filter(time => time > now - RATE_LIMIT_WINDOW)
  
  if (recentRequests.length >= MAX_REQUESTS) {
    return true
  }
  
  // Update requests
  recentRequests.push(now)
  requests.set(ip, recentRequests)
  return false
}

export async function GET(request: Request) {
  const ip = request.headers.get('x-forwarded-for') || 'unknown'
  
  if (isRateLimited(ip)) {
    return NextResponse.json(
      { error: 'Too many requests' },
      { status: 429, headers: { 'Retry-After': '60' } }
    )
  }

  const { searchParams } = new URL(request.url)
  const url = searchParams.get('url')

  if (!url) {
    return NextResponse.json({ error: 'URL is required' }, { status: 400 })
  }

  try {
    const response = await fetch(url)
    const html = await response.text()
    const $ = cheerio.load(html)
    const title = $('title').text().trim()

    return NextResponse.json({ title })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch title' }, { status: 500 })
  }
} 