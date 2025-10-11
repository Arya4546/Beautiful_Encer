import { PrismaClient, Role, Gender } from '@prisma/client';
import { faker } from '@faker-js/faker';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Start seeding...');

  // --- Seed Influencers ---
  console.log('Seeding influencers...');
  for (let i = 0; i < 30; i++) {
    const hashedPassword = await bcrypt.hash('password123', 10);
    await prisma.user.create({
      data: {
        name: faker.person.fullName(),
        email: faker.internet.email({ provider: 'example.com' }).toLowerCase(),
        password: hashedPassword,
        role: Role.INFLUENCER,
        influencer: {
          create: {
            phoneNo: faker.phone.number(),
            bio: faker.person.bio(),
            profilePic: faker.image.avatar(),
            emailVerified: true,
            categories: faker.helpers.arrayElements(
              ['Fashion', 'Beauty', 'Lifestyle', 'Travel', 'Food', 'Fitness'],
              { min: 1, max: 3 }
            ),
            region: faker.location.country(),
            age: faker.number.int({ min: 18, max: 40 }),
            gender: faker.helpers.enumValue(Gender),
          },
        },
      },
    });
  }
  console.log('Influencers seeded.');

  // --- Seed Salons ---
  console.log('Seeding salons...');
  for (let i = 0; i < 30; i++) {
    const hashedPassword = await bcrypt.hash('password123', 10);
    await prisma.user.create({
      data: {
        name: faker.company.name(),
        email: faker.internet.email({ provider: 'salon.example.com' }).toLowerCase(),
        password: hashedPassword,
        role: Role.SALON,
        salon: {
          create: {
            businessName: `${faker.company.name()} Salon`,
            description: faker.lorem.paragraph(),
            phoneNo: faker.phone.number(),
            website: faker.internet.url(),
            profilePic: faker.image.avatar(),
            emailVerified: true,
            preferredCategories: faker.helpers.arrayElements(['Beauty', 'Lifestyle'], { min: 1, max: 2 }),
          },
        },
      },
    });
  }
  console.log('Salons seeded.');

  console.log('Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });