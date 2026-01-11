import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

import { verifyAuth } from '@/lib/auth'
const prisma = new PrismaClient()

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const notifications: any[] = []

    // 1. Unread Messages
    const unreadMessages = await prisma.contactMessage.findMany({
      where: { isRead: false },
      orderBy: { createdAt: 'desc' },
      take: 20
    })
    
    notifications.push(...unreadMessages.map(msg => ({
      id: msg.id,
      type: 'PESAN',
      title: 'Pesan Baru',
      description: `Dari ${msg.name}: ${msg.subject || 'Tanpa Subjek'}`,
      time: msg.createdAt,
      link: '/admin/pesan'
    })))

    // 2. Pending Surat
    const pendingSurat = await prisma.suratKeluar.findMany({
      where: { status: 'MENUNGGU_VALIDASI' },
      orderBy: { createdAt: 'desc' },
      take: 20,
      include: { user: true }
    })

    notifications.push(...pendingSurat.map(surat => ({
      id: surat.id,
      type: 'SURAT',
      title: 'Validasi Surat',
      description: `${surat.jenis}: ${surat.perihal} (Oleh: ${surat.user.name})`,
      time: surat.createdAt,
      link: '/admin/surat'
    })))

    // 3. Pending LPJ
    const pendingLPJ = await prisma.lPJ.findMany({
      where: { status: 'DIAJUKAN' },
      orderBy: { createdAt: 'desc' },
      take: 20,
      include: { user: true }
    })

    notifications.push(...pendingLPJ.map(lpj => ({
      id: lpj.id,
      type: 'LPJ',
      title: 'Validasi LPJ',
      description: `${lpj.periode} - Total: Rp ${lpj.totalPengeluaran.toLocaleString('id-ID')}`,
      time: lpj.createdAt,
      link: '/admin/lpj'
    })))

    // Authenticate
    const user = await verifyAuth(request)
    
    // Calculate counts
    const unreadCount = await prisma.contactMessage.count({ where: { isRead: false } })
    const suratCount = await prisma.suratKeluar.count({ where: { status: 'MENUNGGU_VALIDASI' } })
    const lpjCount = await prisma.lPJ.count({ where: { status: 'DIAJUKAN' } })
    const unreadChatCount = await prisma.message.count({ where: { isRead: false } })

    // Filter notifications array based on role if logged in
    let filteredNotifications = [...notifications]
    let total = unreadCount + unreadChatCount

    if (user) {
        if (user.role === 'MASTER_ADMIN' || user.role === 'KETUA') {
            total += suratCount + lpjCount
        } else if (user.role === 'SEKRETARIS') {
            total += suratCount
            filteredNotifications = filteredNotifications.filter(n => n.type !== 'LPJ')
        } else if (user.role === 'BENDAHARA') {
            total += lpjCount
            filteredNotifications = filteredNotifications.filter(n => n.type !== 'SURAT' && n.type !== 'PESAN')
        }
    }
    
    // Sort by time desc
    filteredNotifications.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())

    return NextResponse.json({
      counts: {
        unreadMessages: unreadCount,
        pendingSurat: suratCount,
        pendingLPJ: lpjCount,
        unreadChatMessages: unreadChatCount,
        totalNotifications: total
      },
      notifications: filteredNotifications
    })

  } catch (error) {
    console.error('Notification API Error:', error)
    return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 })
  }
}

export async function POST() {
    try {
        // Mark all messages as read
        await prisma.contactMessage.updateMany({
            where: { isRead: false },
            data: { isRead: true }
        })
        return NextResponse.json({ success: true })
    } catch (error) {
        return NextResponse.json({ error: 'Failed' }, { status: 500 })
    }
}
