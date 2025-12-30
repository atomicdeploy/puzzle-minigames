import express from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { dbPromise } from '../config/database.js';

const router = express.Router();

// Validation middleware
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }
  next();
};

// Get all games
router.get('/games', async (req, res) => {
  try {
    const [rows] = await dbPromise.query('SELECT * FROM games');
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error('Error fetching games:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get player progress
router.get('/players/:playerId/progress', [
  param('playerId').isString().trim().isLength({ min: 1, max: 255 }).escape()
], validate, async (req, res) => {
  try {
    const { playerId } = req.params;
    const [rows] = await dbPromise.query(
      'SELECT * FROM player_progress WHERE player_id = ?',
      [playerId]
    );
    res.json({ success: true, data: rows[0] || null });
  } catch (error) {
    console.error('Error fetching player progress:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Save player progress
router.post('/players/:playerId/progress', [
  param('playerId').isString().trim().isLength({ min: 1, max: 255 }).escape(),
  body('discoveredPuzzles').isArray(),
  body('puzzleBoard').isArray().isLength({ min: 9, max: 9 }),
  body('score').isInt({ min: 0 })
], validate, async (req, res) => {
  try {
    const { playerId } = req.params;
    const { discoveredPuzzles, puzzleBoard, score } = req.body;
    
    await dbPromise.query(
      `INSERT INTO player_progress (player_id, discovered_puzzles, puzzle_board, score, updated_at) 
       VALUES (?, ?, ?, ?, NOW()) 
       ON DUPLICATE KEY UPDATE 
       discovered_puzzles = VALUES(discovered_puzzles), 
       puzzle_board = VALUES(puzzle_board), 
       score = VALUES(score), 
       updated_at = NOW()`,
      [playerId, JSON.stringify(discoveredPuzzles), JSON.stringify(puzzleBoard), score]
    );
    
    res.json({ success: true, data: { playerId, updated: true } });
  } catch (error) {
    console.error('Error saving player progress:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get leaderboard
router.get('/leaderboard', [
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('cursor').optional().isInt({ min: 1 })
], validate, async (req, res) => {
  try {
    let limit = parseInt(req.query.limit, 10);
    if (Number.isNaN(limit)) {
      limit = 10;
    } else if (limit < 1) {
      limit = 1;
    } else if (limit > 100) {
      limit = 100;
    }
    
    const cursor = req.query.cursor ? parseInt(req.query.cursor, 10) : null;
    
    let query = 'SELECT id, player_id, score, updated_at FROM player_progress';
    const params = [];
    
    if (cursor) {
      // Cursor-based pagination: fetch records with id less than cursor
      // This works because we order by score DESC, then by id DESC for stability
      query += ' WHERE id < ?';
      params.push(cursor);
    }
    
    query += ' ORDER BY score DESC, id DESC LIMIT ?';
    params.push(limit);
    
    const [rows] = await dbPromise.query(query, params);
    
    // Determine next cursor
    const nextCursor = rows.length === limit && rows.length > 0 
      ? rows[rows.length - 1].id 
      : null;
    
    res.json({ 
      success: true, 
      data: rows,
      pagination: {
        nextCursor,
        hasMore: nextCursor !== null
      }
    });
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
