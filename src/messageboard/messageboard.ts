import express from 'express';
import bodyParser from 'body-parser';
import groupsRouter from './groups';
import postsRouter from './posts';
import feedRouter from './feed';

const router = express.Router();
router.use(bodyParser.json());
router.use('/groups', groupsRouter);
router.use('/posts', postsRouter);
router.use('/feed', feedRouter);

export default router;