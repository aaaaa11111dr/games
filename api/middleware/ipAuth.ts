/**
 * IP-based auth middleware.
 * Same IP = same user. Extracts real IP from x-forwarded-for when behind nginx.
 */
import type { Request, Response, NextFunction } from 'express'

export interface AuthRequest extends Request {
  userIp: string
  userKey: string // sha1(ip) short form, safe for filenames
}

// Lightweight hash (no deps), returns hex string
function simpleHash(s: string): string {
  let h1 = 0xdeadbeef ^ 0
  let h2 = 0x41c6ce57 ^ 0
  for (let i = 0; i < s.length; i++) {
    const ch = s.charCodeAt(i)
    h1 = Math.imul(h1 ^ ch, 2654435761)
    h2 = Math.imul(h2 ^ ch, 1597334677)
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507)
  h1 ^= Math.imul(h2 ^ (h2 >>> 13), 3266489909)
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507)
  h2 ^= Math.imul(h1 ^ (h1 >>> 13), 3266489909)
  const out = (h2 >>> 0).toString(16).padStart(8, '0') + (h1 >>> 0).toString(16).padStart(8, '0')
  return out.substring(0, 16)
}

function extractIp(req: Request): string {
  const xff = req.headers['x-forwarded-for'] as string | undefined
  if (xff) {
    // x-forwarded-for can be comma-separated, take the first one (left-most)
    return xff.split(',')[0].trim()
  }
  const real = req.headers['x-real-ip'] as string | undefined
  if (real) return real.trim()
  const sockIp = req.socket?.remoteAddress || req.ip || 'unknown'
  // Normalize ::ffff:xxx.xxx.xxx.xxx
  if (sockIp.startsWith('::ffff:')) return sockIp.substring(7)
  return sockIp
}

export function ipAuth(req: Request, res: Response, next: NextFunction): void {
  const ip = extractIp(req)
  ;(req as AuthRequest).userIp = ip
  ;(req as AuthRequest).userKey = simpleHash(ip)
  next()
}

export function getAuth(req: Request): { ip: string; key: string } {
  return {
    ip: (req as AuthRequest).userIp || extractIp(req),
    key: (req as AuthRequest).userKey || simpleHash(extractIp(req)),
  }
}
