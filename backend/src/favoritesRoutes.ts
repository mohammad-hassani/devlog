import express from "express";
import { PrismaClient } from "@prisma/client";

const router = express.Router();
const prisma = new PrismaClient();

router.get("/", async (req, res) => {
  try {
    // Assuming you have some middleware to authenticate and get the user ID from the request
    const userId = req.session?.user?.id;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized. Please log in." });
    }

    // Retrieve the user's favorites
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Get the IDs of the user's favorite posts
    const favoritePostIds: number[] = user.favorites;

    // Retrieve the favorite posts
    const favoritePosts = await prisma.post.findMany({
      where: { id: { in: favoritePostIds } },
      include: { author: true, comments: true, likes: true },
    });

    return res.json(favoritePosts);
  } catch (error) {
    console.error("Error retrieving favorite posts:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// Add a post to user's favorites
router.post("/", async (req, res) => {
  try {
    // Assuming you have some middleware to authenticate and get the user ID from the request
    const userId = req.session?.user?.id;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized. Please log in." });
    }
    const postId: number = parseInt(req.body.postId);

    // Add the postId to the user's favorites array
    await prisma.user.update({
      where: { id: userId },
      data: { favorites: { push: postId } },
    });

    return res
      .status(200)
      .json({ message: "Post added to favorites successfully" });
  } catch (error) {
    console.error("Error adding post to favorites:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// Remove a post from user's favorites
router.delete("/", async (req, res) => {
  try {
    // Assuming you have some middleware to authenticate and get the user ID from the request
    const userId = req.session?.user?.id;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized. Please log in." });
    }

    const postId: number = parseInt(req.body.postId);

    // Remove the postId from the user's favorites array
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const updatedFavorites = user.favorites.filter((id) => id !== postId);
    await prisma.user.update({
      where: { id: userId },
      data: { favorites: updatedFavorites },
    });
    return res
      .status(200)
      .json({ message: "Post removed from favorites successfully" });
  } catch (error) {
    console.error("Error removing post from favorites:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
