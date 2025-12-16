<?php
class AttemptController {
    private $pdo;
    
    public function __construct($pdo) {
        $this->pdo = $pdo;
    }
    
    // Добавление попытки
    public function addAttempt($gameId, $attemptNumber, $guess, $result, $message) {
        $sql = "INSERT INTO attempts (game_id, attempt_number, guess, result, message) VALUES (?, ?, ?, ?, ?)";
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([$gameId, $attemptNumber, $guess, $result, $message]);
        
        return $this->pdo->lastInsertId();
    }
    
    // Получение попыток для игры
    public function getAttemptsByGame($gameId) {
        $sql = "SELECT * FROM attempts WHERE game_id = ? ORDER BY attempt_number";
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([$gameId]);
        
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
}
?>