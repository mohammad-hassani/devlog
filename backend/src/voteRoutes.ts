// voteRoutes.ts

import express from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const voteRouter = express.Router();

voteRouter.post('/', async (req, res) => {
  try {
    const { type, userId, postId, commentId, vote } = req.body;

    if (type !== 'post' && type !== 'comment') {
      return res.status(400).json({ error: 'Invalid vote type. Must be "post" or "comment".' });
    }

    const existingVote = await prisma.like.findFirst({
      where: {
        userId,
        postId: type === 'post' ? postId : undefined,
        commentId: type === 'comment' ? commentId : undefined,
      },
    });

    // If the user has already voted, update the vote
    if (existingVote) {
      await prisma.like.update({
        where: { id: existingVote.id },
        data: { value: vote },
      });
    } else {
      // If the user has not voted before, create a new vote
      await prisma.like.create({
        data: {
          value: vote,
          userId,
          postId: type === 'post' ? postId : undefined,
          commentId: type === 'comment' ? commentId : undefined,
        },
      });
    }

    // Update the points in the corresponding post or comment
    if (type === 'post') {
      await prisma.post.update({
        where: { id: postId },
        data: {
          points: {
            increment: vote,
          },
        },
      });
    } else {
      await prisma.comment.update({
        where: { id: commentId },
        data: {
          points: {
            increment: vote,
          },
        },
      });
    }

    return res.json({ success: true });
  } catch (error) {
    console.error('Error voting:', error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

export default voteRouter;
