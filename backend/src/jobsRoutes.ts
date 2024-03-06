// jobsRoutes.ts

import express from 'express';
import { PrismaClient, PostType } from '@prisma/client';

const prisma = new PrismaClient();
const jobsRouter = express.Router();

jobsRouter.get('/', async (req, res) => {
  try {
    // Extract query parameters for pagination
    const page = parseInt(req.query.page as string, 10) || 1;
    const itemsPerPage = parseInt(req.query.itemsPerPage as string, 10) || 30;

    // Calculate the skip value for pagination
    const skip = (page - 1) * itemsPerPage;

    // Fetch posts with type JOB, ordered by createdAt with pagination
    const jobPosts = await prisma.post.findMany({
      where: {
        type: PostType.JOB,
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip,
      take: itemsPerPage,
    });

    return res.json(jobPosts);
  } catch (error) {
    console.error('Error fetching job posts:', error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

export default jobsRouter;
