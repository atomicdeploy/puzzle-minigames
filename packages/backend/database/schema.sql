-- Database schema for Puzzle Minigames

CREATE DATABASE IF NOT EXISTS puzzle_minigames;
USE puzzle_minigames;

-- Games table
CREATE TABLE IF NOT EXISTS games (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  difficulty VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Player progress table
CREATE TABLE IF NOT EXISTS player_progress (
  id INT AUTO_INCREMENT PRIMARY KEY,
  player_id VARCHAR(255) UNIQUE NOT NULL,
  discovered_puzzles JSON,
  puzzle_board JSON,
  score INT DEFAULT 0,
  completed_games INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Game sessions table
CREATE TABLE IF NOT EXISTS game_sessions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  session_id VARCHAR(255) UNIQUE NOT NULL,
  player_id VARCHAR(255) NOT NULL,
  game_id INT,
  started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP NULL,
  score INT DEFAULT 0,
  FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Indexes for performance
CREATE INDEX idx_player_id ON player_progress(player_id);
CREATE INDEX idx_score ON player_progress(score DESC);
CREATE INDEX idx_session_id ON game_sessions(session_id);
CREATE INDEX idx_session_player ON game_sessions(player_id);

-- Insert sample games
INSERT INTO games (name, description, difficulty) VALUES
('Main Puzzle', 'اینفرنال - پازل اصلی سودوکو ۳×۳', 'medium'),
('Weight Ball Mini-Game', 'بازی وزن توپ سفید', 'easy');
