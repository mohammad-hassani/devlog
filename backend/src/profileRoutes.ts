// profileRoutes.ts

import express from 'express';
import multer from "multer";
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const profileRouter = express.Router();

// Set up Multer for handling file uploads
const upload = multer({ dest: 'uploads/' }); // Change 'uploads/' to your desired upload directory

// Get user profile by ID or username
profileRouter.get('/:userIdOrUsername', async (req, res) => {
  try {
    const { userIdOrUsername } = req.params;

    // Determine whether the provided parameter is a user ID or username
    const isUserId = /^\d+$/.test(userIdOrUsername);
    const user = isUserId
      ? await prisma.user.findUnique({ where: { id: parseInt(userIdOrUsername, 10) } })
      : await prisma.user.findUnique({ where: { username: userIdOrUsername } });

    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    // Remove sensitive information (password and email) before sending the user data
    const { password, email, ...userData } = user;

    return res.json(userData);
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// Edit user profile
profileRouter.put('/edit', upload.single('avatar'), async (req, res) => {
    try {
      const userId = req.session?.user?.id;
  
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized. Please log in.' });
      }
  
      const { name, about } = req.body;
      const avatar = req.file?.path; // Multer adds 'file' to the request object for uploaded files
  
      // Generate the update input for the user profile
      const updateInput = {} as any;
  
      if (name !== undefined) {
        updateInput.name = name;
      }
  
      if (about !== undefined) {
        updateInput.about = about;
      }
  
      if (avatar !== undefined) {
        updateInput.avatar = avatar;
      }
  
      // Update the user profile in the database
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: updateInput,
      });
  
      // Remove sensitive information (password and email) before sending the updated user data
      const { password, email, ...userData } = updatedUser;
  
      return res.json(userData);
    } catch (error) {
      console.error('Error editing user profile:', error);
      return res.status(500).json({ error: 'Internal server error.' });
    }
  });
  
  
export default profileRouter;
