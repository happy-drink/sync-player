import { Router, Request, Response } from 'express';
import { createUser, getUserByUsername } from '../db/queries/user';
import logger from '../config/logger';

const router = Router();

router.post('/create', async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, password } = req.body;
    
    // check if username already exists
    const existingUser = await getUserByUsername(username);
    if (existingUser) {
      res.status(400).json({ error: 'Username already exists' });
      return;
    }

    // create new user
    const user = await createUser(username, password);
    
    res.json({
      id: user.id,
      username: user.username,
      createdTime: user.createdTime
    });
  } catch (error) {
    logger.error('Failed to create user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router; 