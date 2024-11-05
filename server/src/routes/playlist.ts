import { Router, Request, Response } from 'express';
import { addItemToPlaylist, queryPlaylistItems, deletePlaylistItem, clearPlaylist, updatePlaylistItem } from '../db/queries/playlist';
import logger from '../config/logger';

const router = Router();

router.post('/add', async (req: Request, res: Response) => {
  const { roomId, title, urls } = req.body;
  // validate roomId, title, urls
  if (!roomId || !title || !urls) {
    res.status(400).json({ error: 'Invalid request body' });
    return;
  }
  try {
    const playlistItemId = await addItemToPlaylist(roomId, title, urls);
    res.json({ 
      message: 'Item added to playlist',
      playlistItemId
    });
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.get('/query', async (req: Request, res: Response) => {
  const roomId = parseInt(req.query.roomId as string);
  if (isNaN(roomId)) {
    res.status(400).json({ error: 'Invalid roomId' });
    return;
  }

  let playlistItemId: number | undefined;
  if (req.query.playlistItemId) {
    playlistItemId = parseInt(req.query.playlistItemId as string);
    if (isNaN(playlistItemId)) {
      res.status(400).json({ error: 'Invalid playlistItemId' });
      return;
    }
  }

  try {
    const items = await queryPlaylistItems(roomId, playlistItemId);
    res.json(items);
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.delete('/delete', async (req: Request, res: Response) => {
  const { playlistItemId } = req.body;
  if (!playlistItemId) {
    res.status(400).json({ error: 'Invalid request body' });
    return;
  }

  try {
    // delete playlist item and its video sources
    await deletePlaylistItem(playlistItemId);
    res.json({ message: 'Item deleted from playlist' });
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.delete('/clear', async (req: Request, res: Response) => {
  const { roomId } = req.body;
  if (isNaN(roomId)) {
    res.status(400).json({ error: 'Invalid roomId' });
    return;
  }

  try {
    // clear playlist items and their video sources
    await clearPlaylist(roomId);
    res.json({ message: 'Playlist cleared' });
  } catch (error) {
    logger.error('Failed to clear playlist:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.post('/updateOrder', async (req: Request, res: Response) => {
  const { orderIndexList } = req.body;  // array of { playlistItemId: number, orderIndex: number }
  if (!Array.isArray(orderIndexList)) {
    res.status(400).json({ error: 'Invalid request body' });
    return;
  }
  try {
    orderIndexList.forEach((item: any) => {
      if (typeof item.playlistItemId !== 'number' || typeof item.orderIndex !== 'number') {
        res.status(400).json({ error: 'Invalid request body' });
        return;
      }
      updatePlaylistItem(item.playlistItemId, undefined, undefined, item.orderIndex); // update orderIndex only
    });
    res.json({ message: 'Order updated' });
  }
  catch (error) {
    logger.error('Failed to update order:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});
export default router;