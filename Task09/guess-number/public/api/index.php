<?php
// Task09/public/index.php

// НЕ отключаем ошибки для отладки
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

require __DIR__ . '/../vendor/autoload.php';

use Slim\Factory\AppFactory;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

$app = AppFactory::create();

// =========== MIDDLEWARE ===========

// Middleware для статических файлов - ДОБАВЬТЕ ЭТО
$app->add(function (Request $request, $handler) use ($app) {
    $uri = $request->getUri()->getPath();
    
    // Если запрос к статическому файлу (css, js, images)
    if (preg_match('/\.(css|js|png|jpg|jpeg|gif|ico)$/', $uri)) {
        $filePath = __DIR__ . $uri;
        
        if (file_exists($filePath)) {
            $response = new \Slim\Psr7\Response();
            
            // Определяем Content-Type
            $ext = pathinfo($filePath, PATHINFO_EXTENSION);
            $contentTypes = [
                'css' => 'text/css',
                'js' => 'application/javascript',
                'png' => 'image/png',
                'jpg' => 'image/jpeg',
                'jpeg' => 'image/jpeg',
                'gif' => 'image/gif',
                'ico' => 'image/x-icon',
            ];
            
            $contentType = $contentTypes[$ext] ?? 'application/octet-stream';
            
            $response->getBody()->write(file_get_contents($filePath));
            return $response->withHeader('Content-Type', $contentType);
        }
    }
    
    // Иначе передаем дальше
    return $handler->handle($request);
});

// Middleware для CORS
$app->add(function (Request $request, $handler): Response {
    $response = $handler->handle($request);
    return $response
        ->withHeader('Access-Control-Allow-Origin', '*')
        ->withHeader('Access-Control-Allow-Headers', 'Content-Type, Accept, Origin, Authorization')
        ->withHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS')
        ->withHeader('Content-Type', 'application/json; charset=utf-8');
});

// =========== МАРШРУТЫ ===========

// 1. Главная страница
$app->get('/', function (Request $request, Response $response) {
    $html = file_get_contents(__DIR__ . '/index.html');
    $response->getBody()->write($html);
    return $response->withHeader('Content-Type', 'text/html');
});

// 2. API маршруты

$app->get('/api', function (Request $request, Response $response) {
    $data = [
        'api' => 'Guess Number Game API',
        'version' => '1.0',
        'framework' => 'Slim 4',
        'endpoints' => [
            'GET /api/games' => 'Get all games',
            'GET /api/games/{id}' => 'Get game by ID',
            'POST /api/games' => 'Create new game',
            'POST /api/step/{id}' => 'Add attempt to game',
            'GET /api/stats' => 'Get statistics',
            'DELETE /api/games/{id}' => 'Delete game'
        ]
    ];
    
    $response->getBody()->write(json_encode($data, JSON_PRETTY_PRINT));
    return $response;
});

$app->get('/api/games', function (Request $request, Response $response) {
    // Тестовые данные
    $games = [
        [
            'id' => 1,
            'player_name' => 'Тестовый игрок',
            'secret_number' => 42,
            'is_win' => true,
            'total_attempts' => 5,
            'created_at' => date('Y-m-d H:i:s')
        ]
    ];
    
    $response->getBody()->write(json_encode($games, JSON_PRETTY_PRINT));
    return $response;
});

$app->post('/api/games', function (Request $request, Response $response) {
    $data = $request->getParsedBody();
    
    // Симулируем создание игры
    $gameId = rand(100, 999);
    
    $result = [
        'id' => $gameId,
        'message' => 'Game created (test mode)'
    ];
    
    $response->getBody()->write(json_encode($result, JSON_PRETTY_PRINT));
    return $response->withStatus(201);
});

$app->get('/api/stats', function (Request $request, Response $response) {
    $stats = [
        'overall' => [
            'total_games' => 1,
            'wins' => 1,
            'avg_attempts' => 5.0,
            'best_score' => 5
        ],
        'players' => [
            [
                'player_name' => 'Тестовый игрок',
                'games_played' => 1,
                'wins' => 1,
                'avg_attempts' => 5.0,
                'best_score' => 5
            ]
        ]
    ];
    
    $response->getBody()->write(json_encode($stats, JSON_PRETTY_PRINT));
    return $response;
});

// Для OPTIONS запросов (CORS)
$app->options('/{routes:.+}', function (Request $request, Response $response, array $args) {
    return $response;
});

// Запуск
$app->run();