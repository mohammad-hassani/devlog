// postDetailRoutes.ts

import express from 'express';
import { PrismaClient, Comment } from '@prisma/client';

const prisma = new PrismaClient();
const postDetailRouter = express.Router();

// Recursive function to fetch comments and their descendants
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

// Get detailed information about a specific post by its ID
postDetailRouter.get('/:postId', async (req, res) => {
  try {
    const { postId } = req.params;

    // Fetch the post with the specified ID, including author information
    const post = await prisma.post.findUnique({
      where: { id: parseInt(postId, 10) },
      include: {
        author: true,
      },
    });

    if (!post) {
      return res.status(404).json({ error: 'Post not found.' });
    }

    // Fetch all comments and their children recursively
    const comments = await getAllComments(parseInt(postId, 10));

    // Combine post data with comments
    const postData = {
      ...post,
      comments,
    };

    return res.json(postData);
  } catch (error) {
    console.error('Error fetching post details:', error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// Reply to a post or a comment
postDetailRouter.post('/:postId/reply', async (req, res) => {
  try {
    const { postId } = req.params;
    const { content, parentId } = req.body;
    const userId = req.session?.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized. Please log in.' });
    }

    // Create a new comment in the database
    const newComment = await prisma.comment.create({
      data: {
        content,
        points: 0, // Set initial points to 0
        authorId: userId,
        postId: parseInt(postId, 10),
        parentId: parentId ? parseInt(parentId, 10) : null,
      },
    });

    return res.json(newComment);
  } catch (error) {
    console.error('Error creating comment:', error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// Delete a post
postDetailRouter.delete('/:postId', async (req, res) => {
  try {
    // Assuming you have some middleware to authenticate and get the user ID from the request
    const userId = req.session?.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized. Please log in.' });
    }
    const postId = parseInt(req.params.postId);

    // Check if the post exists and if the requesting user is the author
    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: { authorId: true },
    });

    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    if (post.authorId !== userId) {
      return res.status(403).json({ error: 'Unauthorized: You are not the author of this post' });
    }

    // Delete the post
    await prisma.post.delete({ where: { id: postId } });

    return res.status(200).json({ message: 'Post deleted successfully' });
  } catch (error) {
    console.error('Error deleting post:', error);
    return res.status(500).json({ error: 'Internal server error'+ error });
  }
});


export default postDetailRouter;
