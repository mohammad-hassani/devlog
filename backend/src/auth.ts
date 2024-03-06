// auth.ts

import express from "express";
import bcrypt from "bcrypt";
import { PrismaClient } from "@prisma/client";
import "express-session"; // Import express-session to extend its types

declare module "express-session" {
  interface Session {
    user: { id: number; username: string; verified: Boolean } | undefined;
  }
}

const prisma = new PrismaClient();
export const authRouter = express.Router();

authRouter.post("/signup", async (req, res) => {
  const { username, password } = req.body;

  // Check if username or password is missing
  if (!username || !password) {
    return res
      .status(400)
      .json({ error: "Username and password are required." });
  }

  // Hash the password
  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    const check = await prisma.user.findFirst({ where: { username } });

    // If a user with that
    // username already exists, send an error
    if (check) {
      return res.status(409).json({ error: "User already exists." });
    } else {
      // Create a new user
      const user = await prisma.user.create({
        data: {
          username,
          password: hashedPassword,
        },
      });
      // You can send a verification email here if needed

      return res.json({
        userId: user.id,
        username: user.username,
        hash: hashedPassword,
      });
    }
  } catch (error) {
    console.error("Error during signup:", error);
    return res.status(500).json({ error: "Internal server error." });
  }
});

authRouter.post("/signin", async (req, res) => {
  const { username, password } = req.body;

  // Check if username or password is missing
  if (!username || !password) {
    return res
      .status(400)
      .json({ error: "Username and password are required." });
  }

  try {
    // Find the user by username
    const user = await prisma.user.findUnique({
      where: { username },
    });

    // Check if the user exists
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Hash the password
    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return res.status(401).json({
        error: "Invalid credentials",
      });
    }

    // Set the user in the session
    req.session.user = {
      id: user.id,
      username: user.username,
      verified: user.verified,
    };

    return res.json({ userId: user.id, username: user.username });
  } catch (error) {
    console.error("Error during signin:", error);
    return res.status(500).json({ error: "Internal server error." });
  }
});

authRouter.post("/logout", (req, res) => {
  // Clear the user from the session
  req.session.destroy((err) => {
    if (err) {
      console.error("Error during logout:", err);
      return res.status(500).json({ error: "Internal server error." });
    }

    return res.json({ message: "Logout successful." });
  });
});
