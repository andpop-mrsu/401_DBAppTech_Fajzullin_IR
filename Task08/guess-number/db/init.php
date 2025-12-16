<?php
// Инициализация базы данных
class Database {
    private $pdo;
    
    public function __construct($dbPath = '../db/games.db') {
        try {
            $this->pdo = new PDO("sqlite:" . $dbPath);
            $this->pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            $this->createTables();
        } catch (PDOException $e) {
            die("Ошибка подключения к базе данных: " . $e->getMessage());
        }
    }
    
    private function createTables() {
        $sql = file_get_contents('schema.sql');
        $this->pdo->exec($sql);
    }
    
    public function getConnection() {
        return $this->pdo;
    }
}

// Создаем глобальную переменную с подключением к БД
$database = new Database();
$pdo = $database->getConnection();
?>