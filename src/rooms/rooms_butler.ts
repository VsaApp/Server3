import express from 'express';
import { rooms } from '../utils/rooms';

export const roomsRouter = express.Router();

roomsRouter.get('/', (_, res) => {
    return res.json(rooms);
});