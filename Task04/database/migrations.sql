CREATE TABLE IF NOT EXISTS games (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    player_name TEXT NOT NULL,
    secret_number INTEGER NOT NULL,
    max_attempts INTEGER DEFAULT 10,
    attempts_count INTEGER DEFAULT 0,
    result TEXT CHECK(result IN ('win', 'loose', 'in_progress')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE IF NOT EXISTS game_attempts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    game_id INTEGER NOT NULL,
    attempt_number INTEGER NOT NULL,
    guess INTEGER NOT NULL,
    result TEXT CHECK(result IN ('more', 'less', 'win')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_games_player ON games(player_name);
CREATE INDEX IF NOT EXISTS idx_games_result ON games(result);
CREATE INDEX IF NOT EXISTS idx_attempts_game ON game_attempts(game_id);