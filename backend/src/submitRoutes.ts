// submitRoutes.ts

import express from "express";
import { PrismaClient, PostType } from "@prisma/client";

const prisma = new PrismaClient();
const submitRouter = express.Router();

submitRouter.post("/", async (req, res) => {
  try {
    // Check if the user is authenticated
    if (!req.session.user) {
      return res
        .status(401)
        .json({ error: "Unauthorized: User not logged in." });
    }

    const { title, url, content } = req.body;
    const { id: userId, verified } = req.session.user;

    // Determine the post type based on conditions
    let type: PostType = PostType.DISCUSS; // Default type
    if (url) {
      type = PostType.LINK;
    } else if (title.startsWith("سوال:")) {
      type = PostType.ASK;
    } else if (title.startsWith("استخدام:") && verified) {
      type = PostType.JOB;
    } else if (title.startsWith("استخدام:") && !verified) {
      return res
        .status(403)
        .json({ error: "User not verified for JOB type posts." });
    }

    // Create the post in the database
    const newPost = await prisma.post.create({
      data: {
        title,
        url,
        content,
        published: true, // Adjust as needed
        authorId: userId,
        type,
      },
    });

    res.redirect('/new');
  } catch (error) {
    console.error("Error submitting post:", error);
    return res.status(500).json({ error: "Internal server error." });
  }
});

export default submitRouter;
