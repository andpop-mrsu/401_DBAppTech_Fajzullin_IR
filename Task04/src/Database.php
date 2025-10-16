<?php
namespace Goodlixe\GuessNumber;

class Database
{
    private $pdo;
    private $dbPath;

    public function __construct($dbPath = 'game_database.db')
    {
        $this->dbPath = $dbPath;
        $this->connect();
        $this->migrate();
    }

    private function connect()
    {
        try {
            $this->pdo = new \PDO("sqlite:" . $this->dbPath);
            $this->pdo->setAttribute(\PDO::ATTR_ERRMODE, \PDO::ERRMODE_EXCEPTION);
        } catch (\PDOException $e) {
            throw new \Exception("Database connection failed: " . $e->getMessage());
        }
    }

    private function migrate()
    {
        $migrationFile = __DIR__ . '/../database/migrations.sql';
        if (file_exists($migrationFile)) {
            $sql = file_get_contents($migrationFile);
            $this->pdo->exec($sql);
        }
    }

    public function getConnection()
    {
        return $this->pdo;
    }

    public function executeQuery($sql, $params = [])
    {
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute($params);
        return $stmt;
    }

    public function fetchAll($sql, $params = [])
    {
        $stmt = $this->executeQuery($sql, $params);
        return $stmt->fetchAll(\PDO::FETCH_ASSOC);
    }

    public function fetchOne($sql, $params = [])
    {
        $stmt = $this->executeQuery($sql, $params);
        return $stmt->fetch(\PDO::FETCH_ASSOC);
    }

    public function lastInsertId()
    {
        return $this->pdo->lastInsertId();
    }
}
?>