// commentDetailRoutes.ts

import express from 'express';
import { PrismaClient, Comment } from '@prisma/client';

const prisma = new PrismaClient();
const commentDetailRouter = express.Router();

// Recursive function to fetch comments and their children
async function getAllComments(postId: number, parentId?: number | null): Promise<Comment[]> {
  const comments = await prisma.comment.findMany({
    where: {
      postId: postId,
      parentId: parentId,
    },
    include: {
      children: true,
    },
  });

  for (const comment of comments) {
    const childComments = await getAllComments(postId, comment.id);
    comment.children = childComments;
  }

  return comments;
}

// Get detailed information about a specific comment by its ID
commentDetailRouter.get('/:commentId', async (req, res) => {
  try {
    const { commentId } = req.params;

    // Fetch the comment with the specified ID, including author information
    const comment = await prisma.comment.findUnique({
      where: { id: parseInt(commentId, 10) },
      include: {
        author: true,
      },
    });

    if (!comment) {
      return res.status(404).json({ error: 'Comment not found.' });
    }

    // Fetch all children comments recursively
    const childrenComments = await getAllComments(parseInt(commentId, 10));

    // Combine comment data with children comments
    const commentData = {
      ...comment,
      children: childrenComments,
    };

    return res.json(commentData);
  } catch (error) {
    console.error('Error fetching comment details:', error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// Upvote or downvote a comment
commentDetailRouter.post('/:commentId/vote', async (req, res) => {
  try {
    const { commentId } = req.params;
    const { vote } = req.body;
    const userId = req.session?.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized. Please log in.' });
    }

    // Validate the vote value (1 for upvote, -1 for downvote)
    if (vote !== 1 && vote !== -1) {
      return res.status(400).json({ error: 'Invalid vote value. Use 1 for upvote, -1 for downvote.' });
    }

    // Update the points of the comment based on the vote value
    const updatedComment = await prisma.comment.update({
      where: { id: parseInt(commentId, 10) },
      data: {
        points: {
          increment: vote,
        },
      },
    });

    return res.json(updatedComment);
  } catch (error) {
    console.error('Error voting on comment:', error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

export default commentDetailRouter;
