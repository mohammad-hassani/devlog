import express from "express";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();
const userRouter = express.Router();

// Get user by ID
userRouter.get("/:userId", async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);

    // Fetch user by ID
    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        id: true,
        email: true,
        username: true,
        about: true,
        avatar: true,
        createdAt: true,
        favorites: true,
        status: true,
        type: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    return res.json(user);
  } catch (error) {
    console.error("Error fetching user:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// Update user by ID
userRouter.put("/:userId", async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const { email, username, about, avatar, oldPassword, password } = req.body;

    // Check if the requesting user is the same as the user being updated
    if (req?.session?.user?.id !== userId) {
      return res.status(403).json({
        error: "Unauthorized: You are not allowed to update this user",
      });
    }

    // Fetch user by ID
    const existingUser = await prisma.user.findUnique({
      where: {
        id: userId,
      },
    });

    if (!existingUser) {
      return res.status(404).json({ error: "User not found" });
    }

    let hashedPassword;
    let passwordMatch;
    if (password) {
      hashedPassword = await bcrypt.hash(password, 10);
    }
    if (oldPassword) {
      passwordMatch = await bcrypt.compare(oldPassword, existingUser.password);
    }
    if (oldPassword && password) {
      if (!passwordMatch) {
        return res.status(400).json({ error: "password not correct" });
      }
    } else if ((!oldPassword && password) || (oldPassword && !password)) {
      return res.status(400).json({ error: "must send both passwords" });
    }

    // Check if the new email is unique
    if (email && email !== existingUser.email) {
      const emailExists = await prisma.user.findFirst({
        where: {
          email: email,
          NOT: {
            id: userId,
          },
        },
      });

      if (emailExists) {
        return res.status(400).json({ error: "Email is already in use" });
      }
    }

    // Check if the new username is unique
    if (username && username !== existingUser.username) {
      const usernameExists = await prisma.user.findFirst({
        where: {
          username: username,
          NOT: {
            id: userId,
          },
        },
      });

      if (usernameExists) {
        return res.status(400).json({ error: "Username is already in use" });
      }
    }

    // Update user information
    const updatedUser = await prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        password: hashedPassword || existingUser.password,
        email: email || existingUser.email,
        username: username || existingUser.username,
        about: about || existingUser.about,
        avatar: avatar || existingUser.avatar,
      },
    });

    return res.json(updatedUser);
  } catch (error) {
    console.error("Error updating user:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default userRouter;
