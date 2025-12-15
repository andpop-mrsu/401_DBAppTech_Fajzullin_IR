<?php
// Включаем вывод ошибок для отладки
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Заголовки для CORS и JSON
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Создаем базу данных если ее нет
$dbPath = __DIR__ . '/../../db/games.db';

try {
    $pdo = new PDO("sqlite:" . $dbPath);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
    exit;
}

// Создаем таблицы если их нет
$createTables = "
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
";

try {
    $pdo->exec($createTables);
} catch (PDOException $e) {
    // Игнорируем ошибку если таблицы уже существуют
}

// Получаем метод и путь
$method = $_SERVER['REQUEST_METHOD'];
$uri = $_SERVER['REQUEST_URI'];

// Убираем часть пути до api
$basePath = '/api';
if (strpos($uri, $basePath) === 0) {
    $uri = substr($uri, strlen($basePath));
}

// Разбираем путь
$path = trim($uri, '/');
$pathParts = explode('/', $path);

// Первая часть пути - ресурс
$resource = $pathParts[0] ?? '';
$id = $pathParts[1] ?? null;

// Читаем входные данные
$input = json_decode(file_get_contents('php://input'), true) ?? $_POST;

// Обработка запросов
try {
    switch ($resource) {
        case 'games':
            handleGames($method, $id, $input, $pdo);
            break;
            
        case 'step':
            handleStep($method, $id, $input, $pdo);
            break;
            
        case 'stats':
            handleStats($method, $pdo);
            break;
            
        case '':
            // Главная страница API
            echo json_encode([
                'api' => 'Guess Number Game API',
                'version' => '1.0',
                'endpoints' => [
                    'GET /api/games' => 'Get all games',
                    'GET /api/games/{id}' => 'Get game by ID',
                    'POST /api/games' => 'Create new game',
                    'POST /api/step/{id}' => 'Add attempt to game',
                    'GET /api/stats' => 'Get statistics',
                    'DELETE /api/games/{id}' => 'Delete game'
                ]
            ]);
            break;
            
        default:
            http_response_code(404);
            echo json_encode(['error' => 'Resource not found']);
            break;
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Server error: ' . $e->getMessage()]);
}

// Функции обработчики
function handleGames($method, $id, $input, $pdo) {
    switch ($method) {
        case 'GET':
            if ($id) {
                // Получить игру по ID
                $stmt = $pdo->prepare("SELECT * FROM games WHERE id = ?");
                $stmt->execute([$id]);
                $game = $stmt->fetch();
                
                if ($game) {
                    // Получить попытки
                    $stmt = $pdo->prepare("SELECT * FROM attempts WHERE game_id = ? ORDER BY attempt_number");
                    $stmt->execute([$id]);
                    $attempts = $stmt->fetchAll();
                    $game['attempts'] = $attempts;
                    echo json_encode($game);
                } else {
                    http_response_code(404);
                    echo json_encode(['error' => 'Game not found']);
                }
            } else {
                // Получить все игры
                $stmt = $pdo->query("SELECT * FROM games ORDER BY created_at DESC");
                $games = $stmt->fetchAll();
                echo json_encode($games);
            }
            break;
            
        case 'POST':
            // Создать новую игру
            if (empty($input['player_name']) || empty($input['secret_number'])) {
                http_response_code(400);
                echo json_encode(['error' => 'player_name and secret_number are required']);
                return;
            }
            
            $stmt = $pdo->prepare("
                INSERT INTO games (player_name, secret_number, max_attempts) 
                VALUES (?, ?, ?)
            ");
            $stmt->execute([
                $input['player_name'],
                $input['secret_number'],
                $input['max_attempts'] ?? 10
            ]);
            
            $gameId = $pdo->lastInsertId();
            echo json_encode(['id' => $gameId]);
            break;
            
        case 'DELETE':
            // Удалить игру
            if (!$id) {
                http_response_code(400);
                echo json_encode(['error' => 'Game ID is required']);
                return;
            }
            
            $stmt = $pdo->prepare("DELETE FROM attempts WHERE game_id = ?");
            $stmt->execute([$id]);
            
            $stmt = $pdo->prepare("DELETE FROM games WHERE id = ?");
            $stmt->execute([$id]);
            
            echo json_encode(['success' => true]);
            break;
            
        default:
            http_response_code(405);
            echo json_encode(['error' => 'Method not allowed']);
            break;
    }
}

function handleStep($method, $id, $input, $pdo) {
    if ($method !== 'POST') {
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
        return;
    }
    
    if (!$id) {
        http_response_code(400);
        echo json_encode(['error' => 'Game ID is required']);
        return;
    }
    
    if (empty($input['attempt_number']) || empty($input['guess']) || empty($input['result']) || empty($input['message'])) {
        http_response_code(400);
        echo json_encode(['error' => 'attempt_number, guess, result and message are required']);
        return;
    }
    
    // Добавить попытку
    $stmt = $pdo->prepare("
        INSERT INTO attempts (game_id, attempt_number, guess, result, message) 
        VALUES (?, ?, ?, ?, ?)
    ");
    $stmt->execute([
        $id,
        $input['attempt_number'],
        $input['guess'],
        $input['result'],
        $input['message']
    ]);
    
    $attemptId = $pdo->lastInsertId();
    
    // Обновить игру если она завершена
    if (isset($input['game_finished']) && $input['game_finished']) {
        $stmt = $pdo->prepare("
            UPDATE games 
            SET is_win = ?, total_attempts = ?, finished_at = CURRENT_TIMESTAMP 
            WHERE id = ?
        ");
        $stmt->execute([
            $input['is_win'] ? 1 : 0,
            $input['total_attempts'] ?? 0,
            $id
        ]);
    }
    
    echo json_encode(['id' => $attemptId]);
}

function handleStats($method, $pdo) {
    if ($method !== 'GET') {
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
        return;
    }
    
    $stats = [];
    
    // Общая статистика
    $stmt = $pdo->query("
        SELECT 
            COUNT(*) as total_games,
            SUM(is_win) as wins,
            AVG(total_attempts) as avg_attempts,
            MIN(CASE WHEN is_win = 1 THEN total_attempts END) as best_score
        FROM games
    ");
    $stats['overall'] = $stmt->fetch();
    
    // Статистика по игрокам
    $stmt = $pdo->query("
        SELECT 
            player_name,
            COUNT(*) as games_played,
            SUM(is_win) as wins,
            AVG(total_attempts) as avg_attempts,
            MIN(CASE WHEN is_win = 1 THEN total_attempts END) as best_score
        FROM games
        GROUP BY player_name
        ORDER BY games_played DESC
    ");
    $stats['players'] = $stmt->fetchAll();
    
    echo json_encode($stats);
}
?>