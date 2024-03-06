// index.ts

import express from 'express';
import session from 'express-session';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import { authRouter } from "./auth"; // Create a separate file for authentication routes
import rootRouter from "./rootRoutes";
import submitRouter from "./submitRoutes";
import newRouter from './newRoutes';
import jobsRouter from './jobsRoutes';
import askRouter from './askRoutes';
import postDetailRouter from './postDetailRoutes';
import commentDetailRouter from './commentDetailRoutes';
import favoritesRouter from './favoritesRoutes';
import userRouter from './userRoutes';

const prisma = new PrismaClient();
const app = express();

app.use(express.json());
app.use(cors());

// Configure express-session middleware
app.use(
  session({
    secret: 'e47$Fg^2sP!cTm@8uQxZn3fFyHbKdPeS', // Change this to a strong and secure secret
    resave: false,
    saveUninitialized: true,
    cookie: { secure: process.env.NODE_ENV === 'production' }, // Set to true in production if using HTTPS
  })
);

app.use('/auth', authRouter);
app.use('/', rootRouter);
app.use('/submit', submitRouter);
app.use('/user', userRouter);
app.use('/new', newRouter);
app.use('/jobs', jobsRouter); 
app.use('/ask', askRouter);
app.use('/post', postDetailRouter);
app.use('/comment', commentDetailRouter);
app.use('/favorites', favoritesRouter); 

const server = app.listen(3001, () =>
  console.log('🚀 Server ready at: http://localhost:3001')
);
