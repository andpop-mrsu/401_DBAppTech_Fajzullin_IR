-- Создание таблицы игр
CREATE TABLE IF NOT EXISTS games (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    player_name TEXT NOT NULL,
    secret_number INTEGER NOT NULL,
    max_attempts INTEGER DEFAULT 10,
    is_win BOOLEAN DEFAULT 0,
    total_attempts INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    finished_at DATETIME
);

-- Создание таблицы попыток
CREATE TABLE IF NOT EXISTS attempts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    game_id INTEGER NOT NULL,
    attempt_number INTEGER NOT NULL,
    guess INTEGER NOT NULL,
    result TEXT NOT NULL,
    message TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE
);

-- Создание индексов для ускорения запросов
CREATE INDEX IF NOT EXISTS idx_games_player ON games(player_name);
CREATE INDEX IF NOT EXISTS idx_games_created ON games(created_at);
CREATE INDEX IF NOT EXISTS idx_attempts_game ON attempts(game_id);