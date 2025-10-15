<?php
namespace Goodlixe\GuessNumber;

class GameRepository
{
    private $db;

    public function __construct(Database $db)
    {
        $this->db = $db;
    }

    public function createGame($playerName, $secretNumber, $maxAttempts = 10)
    {
        $sql = "INSERT INTO games (player_name, secret_number, max_attempts, result) 
                VALUES (?, ?, ?, 'in_progress')";
        $this->db->executeQuery($sql, [$playerName, $secretNumber, $maxAttempts]);
        return $this->db->lastInsertId();
    }

    public function saveAttempt($gameId, $attemptNumber, $guess, $result)
    {
        $sql = "INSERT INTO game_attempts (game_id, attempt_number, guess, result) 
                VALUES (?, ?, ?, ?)";
        $this->db->executeQuery($sql, [$gameId, $attemptNumber, $guess, $result]);
    }

    public function updateGameResult($gameId, $result, $attemptsCount)
    {
        $sql = "UPDATE games SET result = ?, attempts_count = ? WHERE id = ?";
        $this->db->executeQuery($sql, [$result, $attemptsCount, $gameId]);
    }

    public function getAllGames($filter = null)
    {
        $sql = "SELECT * FROM games";
        $params = [];

        if ($filter === 'win') {
            $sql .= " WHERE result = 'win'";
        } elseif ($filter === 'loose') {
            $sql .= " WHERE result = 'loose'";
        }

        $sql .= " ORDER BY created_at DESC";
        return $this->db->fetchAll($sql, $params);
    }

    public function getGameById($gameId)
    {
        $sql = "SELECT * FROM games WHERE id = ?";
        return $this->db->fetchOne($sql, [$gameId]);
    }

    public function getGameAttempts($gameId)
    {
        $sql = "SELECT * FROM game_attempts WHERE game_id = ? ORDER BY attempt_number";
        return $this->db->fetchAll($sql, [$gameId]);
    }

    public function getTopPlayers()
    {
        $sql = "SELECT 
                    player_name,
                    COUNT(*) as total_games,
                    SUM(CASE WHEN result = 'win' THEN 1 ELSE 0 END) as wins,
                    SUM(CASE WHEN result = 'loose' THEN 1 ELSE 0 END) as losses
                FROM games 
                WHERE result IN ('win', 'loose')
                GROUP BY player_name
                ORDER BY wins DESC, total_games DESC";
        return $this->db->fetchAll($sql);
    }
}
?>