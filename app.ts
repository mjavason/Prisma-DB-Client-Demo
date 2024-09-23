import express, { Request, Response, NextFunction } from 'express';
import 'express-async-errors';
import cors from 'cors';
import axios from 'axios';
import dotenv from 'dotenv';
import morgan from 'morgan';
import { setupSwagger } from './swagger.config';
import { PrismaClient } from '@prisma/client';

//#region App Setup
const app = express();
const prisma = new PrismaClient();

dotenv.config({ path: './.env' });
const PORT = process.env.PORT || 5000;
const BASE_URL = process.env.BASE_URL || `http://localhost:${PORT}`;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(morgan('dev'));
setupSwagger(app, BASE_URL);

//#endregion App Setup

//#region Code here

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       required:
 *         - name
 *         - email
 *       properties:
 *         id:
 *           type: integer
 *           description: The auto-generated ID of the user
 *         name:
 *           type: string
 *           description: The name of the user
 *         email:
 *           type: string
 *           description: The email of the user
 *       example:
 *         id: 1
 *         name: John Doe
 *         email: john@example.com
 *     Post:
 *       type: object
 *       required:
 *         - title
 *         - authorId
 *       properties:
 *         id:
 *           type: integer
 *           description: The auto-generated ID of the post
 *         title:
 *           type: string
 *           description: The title of the post
 *         content:
 *           type: string
 *           description: The content of the post
 *         authorId:
 *           type: integer
 *           description: The ID of the author
 *       example:
 *         id: 1
 *         title: My First Post
 *         content: Hello World
 *         authorId: 1
 *     Tag:
 *       type: object
 *       required:
 *         - name
 *       properties:
 *         id:
 *           type: integer
 *           description: The auto-generated ID of the tag
 *         name:
 *           type: string
 *           description: The name of the tag
 *       example:
 *         id: 1
 *         name: Tech
 */

/**
 * @swagger
 * /users:
 *   post:
 *     summary: Create a new user
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/User'
 *     responses:
 *       200:
 *         description: The user was successfully created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       400:
 *         description: Bad request
 */
app.post('/users', async (req: Request, res: Response) => {
  const { name, email } = req.body;
  const user = await prisma.user.create({
    data: { name, email },
  });
  res.json(user);
});

/**
 * @swagger
 * /posts:
 *   post:
 *     summary: Create a new post
 *     tags: [Posts]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Post'
 *     responses:
 *       200:
 *         description: The post was successfully created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Post'
 *       400:
 *         description: Bad request
 */
app.post('/posts', async (req: Request, res: Response) => {
  const { title, content, authorId, tagIds } = req.body;

  const post = await prisma.post.create({
    data: {
      title,
      content,
      author: { connect: { id: authorId } }, // Connect to the existing author
      tags: {
        connect: tagIds.map((id: number) => ({ id })), // Connect existing tags
      },
    },
  });

  res.json(post);
});

/**
 * @swagger
 * /tags:
 *   post:
 *     summary: Create a new tag
 *     tags: [Tags]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Tag'
 *     responses:
 *       200:
 *         description: The tag was successfully created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Tag'
 *       400:
 *         description: Bad request
 */
app.post('/tags', async (req: Request, res: Response) => {
  const { name } = req.body;
  const tag = await prisma.tag.create({
    data: { name },
  });
  res.json(tag);
});

/**
 * @swagger
 * /posts:
 *   get:
 *     summary: Get all posts with their authors and tags
 *     tags: [Posts]
 *     responses:
 *       200:
 *         description: List of posts with authors and tags
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Post'
 */
app.get('/posts', async (req: Request, res: Response) => {
  const posts = await prisma.post.findMany({
    include: {
      author: true, // Include author data
      tags: true, // Include associated tags
    },
  });
  res.json(posts);
});

/**
 * @swagger
 * /users:
 *   get:
 *     summary: Get all users with their posts
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: List of users with their posts
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/User'
 */
app.get('/users', async (req: Request, res: Response) => {
  const users = await prisma.user.findMany({
    include: { posts: true }, // Include associated posts
  });
  res.json(users);
});

//#endregion Code here

//#region Server Setup

/**
 * @swagger
 * /api:
 *   get:
 *     summary: Call a demo external API (httpbin.org)
 *     description: Returns an object containing demo content
 *     tags: [Default]
 *     responses:
 *       '200':
 *         description: Successful.
 *       '400':
 *         description: Bad request.
 */
app.get('/api', async (req: Request, res: Response) => {
  try {
    const result = await axios.get('https://httpbin.org');
    return res.send({
      message: 'Demo API called (httpbin.org)',
      data: result.status,
    });
  } catch (error: any) {
    console.error('Error calling external API:', error.message);
    return res.status(500).send({ error: 'Failed to call external API' });
  }
});

/**
 * @swagger
 * /:
 *   get:
 *     summary: API Health check
 *     description: Returns an object containing demo content
 *     tags: [Default]
 *     responses:
 *       '200':
 *         description: Successful.
 *       '400':
 *         description: Bad request.
 */
app.get('/', (req: Request, res: Response) => {
  return res.send({ message: 'API is Live!' });
});

/**
 * @swagger
 * /obviously/this/route/cant/exist:
 *   get:
 *     summary: API 404 Response
 *     description: Returns a non-crashing result when you try to run a route that doesn't exist
 *     tags: [Default]
 *     responses:
 *       '404':
 *         description: Route not found
 */
app.use((req: Request, res: Response) => {
  return res
    .status(404)
    .json({ success: false, message: 'API route does not exist' });
});

app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  // throw Error('This is a sample error');
  console.log(`${'\x1b[31m'}`); // start color red
  console.log(`${err.message}`);
  console.log(`${'\x1b][0m]'}`); //stop color

  return res
    .status(500)
    .send({ success: false, status: 500, message: err.message });
});

app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);
});

// (for render services) Keep the API awake by pinging it periodically
// setInterval(pingSelf(BASE_URL), 600000);

//#endregion
