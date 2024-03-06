// rootRoutes.ts

import express from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const rootRouter = express.Router();

rootRouter.get('/', async (req, res) => {
  try {
    // Extract query parameters for pagination
    const page = parseInt(req.query.page as string, 10) || 1;
    const itemsPerPage = parseInt(req.query.itemsPerPage as string, 10) || 30;

    // Calculate the skip value for pagination
    const skip = (page - 1) * itemsPerPage;

    // Calculate the date 24 hours ago
    const last24Hours = new Date();
    last24Hours.setHours(last24Hours.getHours() - 24);

    // Fetch posts created in the last 24 hours
    const posts = await prisma.post.findMany({
      where: {
        createdAt: {
          gte: last24Hours,
        },
      },
      skip,
      take: itemsPerPage,
      include: {
        author: {
          select: {
            username: true,
          },
        },
      },
    });

    // Fetch the count of likes for each post
    const postLikesCounts = await Promise.all(
      posts.map(async (post) => {
        const likesCount = await prisma.like.count({
          where: {
            postId: post.id,
          },
        });
        return { postId: post.id, likesCount };
      })
    );

    // Sort posts based on likes count
    posts.sort((a, b) => {
      const likesCountA = postLikesCounts.find((item) => item.postId === a.id)?.likesCount || 0;
      const likesCountB = postLikesCounts.find((item) => item.postId === b.id)?.likesCount || 0;
      return likesCountB - likesCountA;
    });

    return res.json(posts);
  } catch (error) {
    console.error('Error fetching posts:', error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

export default rootRouter;
