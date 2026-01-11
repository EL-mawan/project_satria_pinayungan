
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  try {
    console.log('Testing database connection...')
    const userCount = await prisma.user.count()
    console.log('Connection successful! Total users:', userCount)
    
    const firstUser = await prisma.user.findFirst()
    console.log('Sample user:', firstUser?.email)
  } catch (error) {
    console.error('Database connection failed:')
    console.error(error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()
