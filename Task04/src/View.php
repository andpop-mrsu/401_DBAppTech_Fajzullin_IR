<?php
namespace Goodlixe\GuessNumber;

class View
{
    public static function showGameIntro()
    {
        echo "============================\n";
        echo "      УГАДАЙ ЧИСЛО\n";
        echo "============================\n";
        echo "Компьютер загадал число от 1 до 100.\n";
        echo "У вас есть 10 попыток чтобы угадать его!\n";
        echo "============================\n\n";
    }

    public static function showHelp()
    {
        $argsParser = new ArgsParser();
        $argsParser->showHelp();
    }

    public static function showGamesList($games, $filter = null)
    {
        echo "Список сохраненных игр";
        if ($filter === 'win') {
            echo " (только выигранные)";
        } elseif ($filter === 'loose') {
            echo " (только проигранные)";
        }
        echo ":\n\n";
        
        echo "ID  | Игрок          | Число | Попытки | Результат | Дата\n";
        echo "----|----------------|-------|---------|-----------|-------------------\n";
        
        foreach ($games as $game) {
            printf(
                "%-3d | %-14s | %-5d | %-7d | %-9s | %s\n",
                $game['id'],
                $game['player_name'],
                $game['secret_number'],
                $game['attempts_count'],
                self::translateResult($game['result']),
                $game['created_at']
            );
        }
        echo "\n";
    }

    public static function showTopPlayers($players)
    {
        echo "Статистика игроков:\n\n";
        echo "Игрок          | Игр | Побед | Поражений | % побед\n";
        echo "----------------|-----|-------|-----------|---------\n";
        
        foreach ($players as $player) {
            $winRate = $player['total_games'] > 0 
                ? round(($player['wins'] / $player['total_games']) * 100, 1)
                : 0;
                
            printf(
                "%-14s | %-3d | %-5d | %-9d | %-6.1f%%\n",
                $player['player_name'],
                $player['total_games'],
                $player['wins'],
                $player['losses'],
                $winRate
            );
        }
        echo "\n";
    }

    public static function showGameReplay($game, $attempts)
    {
        echo "Повтор игры #{$game['id']}\n";
        echo "Игрок: {$game['player_name']}\n";
        echo "Загаданное число: {$game['secret_number']}\n";
        echo "Результат: " . self::translateResult($game['result']) . "\n";
        echo "Попыток: {$game['attempts_count']}\n\n";
        
        echo "Ход игры:\n";
        echo "Попытка | Число | Результат\n";
        echo "--------|-------|-----------\n";
        
        foreach ($attempts as $attempt) {
            printf(
                "%-7d | %-5d | %s\n",
                $attempt['attempt_number'],
                $attempt['guess'],
                self::translateAttemptResult($attempt['result'])
            );
        }
    }

    private static function translateResult($result)
    {
        switch ($result) {
            case 'win': return 'Победа';
            case 'loose': return 'Поражение';
            case 'in_progress': return 'В процессе';
            default: return $result;
        }
    }

    private static function translateAttemptResult($result)
    {
        switch ($result) {
            case 'more': return 'Больше';
            case 'less': return 'Меньше';
            case 'win': return 'Угадал!';
            default: return $result;
        }
    }
}
?>