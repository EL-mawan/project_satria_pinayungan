import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export const dynamic = 'force-dynamic'

// GET: Fetch conversations and messages
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const withUserId = searchParams.get('withUserId')

    if (!userId) {
      return NextResponse.json({ error: 'userId required' }, { status: 400 })
    }

    // If withUserId is provided, get messages between two users
    if (withUserId) {
      const messages = await prisma.message.findMany({
        where: {
          OR: [
            { senderId: userId, receiverId: withUserId },
            { senderId: withUserId, receiverId: userId }
          ]
        },
        include: {
          sender: { select: { id: true, name: true, email: true } },
          receiver: { select: { id: true, name: true, email: true } }
        },
        orderBy: { createdAt: 'asc' }
      })

      // Mark messages as read
      await prisma.message.updateMany({
        where: {
          senderId: withUserId,
          receiverId: userId,
          isRead: false
        },
        data: { isRead: true }
      })

      return NextResponse.json({ messages })
    }

    // Otherwise, get list of conversations (users with whom current user has chatted)
    const sentMessages = await prisma.message.findMany({
      where: { senderId: userId },
      distinct: ['receiverId'],
      select: { receiverId: true }
    })

    const receivedMessages = await prisma.message.findMany({
      where: { receiverId: userId },
      distinct: ['senderId'],
      select: { senderId: true }
    })

    const userIds = [
      ...sentMessages.map(m => m.receiverId),
      ...receivedMessages.map(m => m.senderId)
    ]
    const uniqueUserIds = [...new Set(userIds)]

    const users = await prisma.user.findMany({
      where: { id: { in: uniqueUserIds } },
      select: { id: true, name: true, email: true, role: true }
    })

    // Get unread count for each user
    const conversations = await Promise.all(
      users.map(async (user) => {
        const unreadCount = await prisma.message.count({
          where: {
            senderId: user.id,
            receiverId: userId,
            isRead: false
          }
        })

        const lastMessage = await prisma.message.findFirst({
          where: {
            OR: [
              { senderId: userId, receiverId: user.id },
              { senderId: user.id, receiverId: userId }
            ]
          },
          orderBy: { createdAt: 'desc' }
        })

        return {
          user,
          unreadCount,
          lastMessage: lastMessage ? {
            content: lastMessage.content,
            createdAt: lastMessage.createdAt,
            isSentByMe: lastMessage.senderId === userId
          } : null
        }
      })
    )

    return NextResponse.json({ conversations })

  } catch (error) {
    console.error('Chat GET Error:', error)
    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 })
  }
}

// POST: Send a new message
export async function POST(request: Request) {
  try {
    const { senderId, receiverId, content, messageType, attachmentUrl, attachmentName, attachmentSize } = await request.json()

    if (!senderId || !receiverId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const message = await prisma.message.create({
      data: {
        senderId,
        receiverId,
        content: content || '',
        messageType: messageType || 'text',
        attachmentUrl,
        attachmentName,
        attachmentSize
      },
      include: {
        sender: { select: { id: true, name: true, email: true } },
        receiver: { select: { id: true, name: true, email: true } }
      }
    })

    return NextResponse.json({ message })

  } catch (error) {
    console.error('Chat POST Error:', error)
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 })
  }
}
