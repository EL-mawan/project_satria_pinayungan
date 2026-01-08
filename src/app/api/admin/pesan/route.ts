import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET() {
  try {
    const messages = await prisma.contactMessage.findMany({
      orderBy: { createdAt: 'desc' }
    })
    return NextResponse.json(messages)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const { id, isRead } = await request.json()
    const message = await prisma.contactMessage.update({
      where: { id },
      data: { isRead }
    })
    return NextResponse.json(message)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update message' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const id = searchParams.get('id')
        if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })

        await prisma.contactMessage.delete({ where: { id } })
        return NextResponse.json({ success: true })
    } catch (error) {
        return NextResponse.json({ error: 'Failed to delete message' }, { status: 500 })
    }
}
