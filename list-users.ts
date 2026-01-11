import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const users = await prisma.user.findMany({
    select: {
      email: true,
      password: true,
      role: true,
      name: true
    }
  })
  
  console.log('--- List Pengguna ---')
  console.table(users)
  await prisma.$disconnect()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
