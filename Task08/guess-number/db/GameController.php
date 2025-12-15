<?php
class GameController {
    private $pdo;
    
    public function __construct($pdo) {
        $this->pdo = $pdo;
    }
    
    // Создание новой игры
    public function createGame($playerName, $secretNumber, $maxAttempts = 10) {
        $sql = "INSERT INTO games (player_name, secret_number, max_attempts) VALUES (?, ?, ?)";
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([$playerName, $secretNumber, $maxAttempts]);
        
        return $this->pdo->lastInsertId();
    }
    
    // Получение всех игр
    public function getAllGames() {
        $sql = "SELECT * FROM games ORDER BY created_at DESC";
        $stmt = $this->pdo->query($sql);
        
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
    
    // Получение игры по ID
    public function getGame($id) {
        $sql = "SELECT * FROM games WHERE id = ?";
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([$id]);
        
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }
    
    // Получение игры с попытками
    public function getGameWithAttempts($id) {
        $game = $this->getGame($id);
        if (!$game) {
            return null;
        }
        
        // Получаем попытки для этой игры
        $sql = "SELECT * FROM attempts WHERE game_id = ? ORDER BY attempt_number";
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([$id]);
        $attempts = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        $game['attempts'] = $attempts;
        
        return $game;
    }
    
    // Завершение игры
    public function finishGame($id, $isWin, $totalAttempts) {
        $sql = "UPDATE games SET is_win = ?, total_attempts = ?, finished_at = CURRENT_TIMESTAMP WHERE id = ?";
        $stmt = $this->pdo->prepare($sql);
        
        return $stmt->execute([$isWin ? 1 : 0, $totalAttempts, $id]);
    }
    
    // Удаление игры
    public function deleteGame($id) {
        // Сначала удаляем попытки (из-за каскадного удаления это не обязательно, но на всякий случай)
        $sql = "DELETE FROM attempts WHERE game_id = ?";
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([$id]);
        
        // Затем удаляем игру
        $sql = "DELETE FROM games WHERE id = ?";
        $stmt = $this->pdo->prepare($sql);
        
        return $stmt->execute([$id]);
    }
    
    // Получение статистики
    public function getStats() {
        $stats = [];
        
        // Общая статистика
        $sql = "SELECT 
                COUNT(*) as total_games,
                SUM(is_win) as wins,
                AVG(total_attempts) as avg_attempts,
                MIN(CASE WHEN is_win = 1 THEN total_attempts END) as best_score
                FROM games";
        $stmt = $this->pdo->query($sql);
        $stats['overall'] = $stmt->fetch(PDO::FETCH_ASSOC);
        
        // Статистика по игрокам
        $sql = "SELECT 
                player_name,
                COUNT(*) as games_played,
                SUM(is_win) as wins,
                AVG(total_attempts) as avg_attempts,
                MIN(CASE WHEN is_win = 1 THEN total_attempts END) as best_score
                FROM games
                GROUP BY player_name
                ORDER BY games_played DESC";
        $stmt = $this->pdo->query($sql);
        $stats['players'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        return $stats;
    }
}
?>