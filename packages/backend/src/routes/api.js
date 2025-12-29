import express from 'express';
import { dbPromise } from '../config/database.js';

const router = express.Router();

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
router.get('/players/:playerId/progress', async (req, res) => {
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
router.post('/players/:playerId/progress', async (req, res) => {
  try {
    const { playerId } = req.params;
    const { discoveredPuzzles, puzzleBoard, score } = req.body;
    
    const [result] = await dbPromise.query(
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
router.get('/leaderboard', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const [rows] = await dbPromise.query(
      'SELECT player_id, score, updated_at FROM player_progress ORDER BY score DESC LIMIT ?',
      [limit]
    );
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
