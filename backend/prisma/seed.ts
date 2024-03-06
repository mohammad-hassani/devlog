import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Seed users
  const user1 = await prisma.user.create({
    data: {
      email: 'user1@example.com',
      username: 'user1',
      password: 'password1', // In a real application, use a secure password hashing mechanism
      karma: 10,
      about: 'I am user 1.',
      avatar: 'https://example.com/avatar1.jpg',
      verified: true,
    },
  });

  const user2 = await prisma.user.create({
    data: {
      email: 'user2@example.com',
      username: 'user2',
      password: 'password2',
      karma: 5,
      about: 'I am user 2.',
      avatar: 'https://example.com/avatar2.jpg',
      verified: false,
    },
  });

  // Seed posts
  const post1 = await prisma.post.create({
    data: {
      title: 'Post 1',
      content: 'This is the content of post 1.',
      type: 'LINK',
      authorId: user1.id,
    },
  });

  const post2 = await prisma.post.create({
    data: {
      title: 'Post 2',
      content: 'This is the content of post 2.',
      type: 'DISCUSS',
      authorId: user2.id,
    },
  });

  // Seed comments
  await prisma.comment.create({
    data: {
      content: 'Comment 1 on Post 1',
      points: 5,
      authorId: user2.id,
      postId: post1.id,
    },
  });

  await prisma.comment.create({
    data: {
      content: 'Comment 2 on Post 1',
      points: 3,
      authorId: user1.id,
      postId: post1.id,
    },
  });

  await prisma.comment.create({
    data: {
      content: 'Comment 1 on Post 2',
      points: 8,
      authorId: user1.id,
      postId: post2.id,
    },
  });
}

main()
  .catch((e) => {
    throw e;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
