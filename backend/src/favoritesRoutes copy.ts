// favoritesRoutes.ts

import express from 'express';
import { Prisma, PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const favoritesRouter = express.Router();

const ITEMS_PER_PAGE = 10;

// Get user's favorite posts with pagination
favoritesRouter.get('/', async (req, res) => {
  try {
    const userId = req.session?.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized. Please log in.' });
    }

    const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
    const skip = (page - 1) * ITEMS_PER_PAGE;

    // Fetch user's favorite posts with pagination
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        favorites: {
          take: ITEMS_PER_PAGE,
          skip,
          orderBy: {
            createdAt: 'desc',
          },
        },
      } as Prisma.UserInclude,
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    if (!user.favorites) {
      return res.json({ error: 'not found.' });
    }

    return res.json(user.favorites);
  } catch (error) {
    console.error('Error fetching user favorites:', error);
    return res.status(500).json({ error: 'Internal server error.'+ error });
  }
});

export default favoritesRouter;
