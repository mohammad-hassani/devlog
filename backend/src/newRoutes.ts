// newRoutes.ts

import express from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const newRouter = express.Router();

newRouter.get('/', async (req, res) => {
  try {
    // Extract query parameters for pagination
    const page = parseInt(req.query.page as string, 10) || 1;
    const itemsPerPage = parseInt(req.query.itemsPerPage as string, 10) || 30;

    // Calculate the skip value for pagination
    const skip = (page - 1) * itemsPerPage;

    // Fetch the latest posts with pagination
    const latestPosts = await prisma.post.findMany({
      orderBy: {
        createdAt: 'desc',
      },
      skip,
      take: itemsPerPage,
    })

    return res.json(latestPosts);
  } catch (error) {
    console.error('Error fetching latest posts:', error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

export default newRouter;
