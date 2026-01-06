import { NextRequest } from 'next/server'
import { db } from './db'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

export async function verifyAuth(request: Request | NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null
  }

  const token = authHeader.substring(7)
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any
    const user = await db.user.findUnique({
      where: { id: decoded.userId },
      include: { anggota: true }
    })
    
    if (!user) return null
    
    return {
      id: user.id,
      email: user.email,
      role: user.role,
      anggota: user.anggota
    }
  } catch (error) {
    return null
  }
}
