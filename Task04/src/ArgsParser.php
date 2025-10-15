<?php
namespace Goodlixe\GuessNumber;

class ArgsParser
{
    private $args = [];

    public function parseArguments($argv)
    {
        // Режим по умолчанию
        $this->args['mode'] = 'new';
        
        for ($i = 1; $i < count($argv); $i++) {
            $arg = $argv[$i];
            
            if ($arg === '-n' || $arg === '--new') {
                $this->args['mode'] = 'new';
            } elseif ($arg === '-l' || $arg === '--list') {
                $this->args['mode'] = 'list';
                if (isset($argv[$i + 1]) && in_array($argv[$i + 1], ['win', 'loose'])) {
                    $this->args['filter'] = $argv[$i + 1];
                    $i++;
                }
            } elseif ($arg === '--top') {
                $this->args['mode'] = 'top';
            } elseif ($arg === '-r' || $arg === '--replay') {
                $this->args['mode'] = 'replay';
                if (isset($argv[$i + 1]) && is_numeric($argv[$i + 1])) {
                    $this->args['game_id'] = (int)$argv[$i + 1];
                    $i++;
                }
            } elseif ($arg === '-h' || $arg === '--help') {
                $this->args['mode'] = 'help';
            }
        }
        
        return $this->args;
    }

    public function showHelp()
    {
        echo "Игра 'Угадай число' с базой данных SQLite\n\n";
        echo "Использование:\n";
        echo "  guess-number [ПАРАМЕТРЫ]\n\n";
        echo "Параметры:\n";
        echo "  -n, --new              Новая игра (сохраняется в БД)\n";
        echo "  -l, --list [win|loose] Список всех сохраненных игр из БД\n";
        echo "  --top                  Статистика игроков из БД\n";
        echo "  -r, --replay ID        Повтор игры с указанным ID из БД\n";
        echo "  -h, --help             Показать эту справку\n";
    }

    public function getMode()
    {
        return $this->args['mode'] ?? 'new';
    }

    public function getFilter()
    {
        return $this->args['filter'] ?? null;
    }

    public function getGameId()
    {
        return $this->args['game_id'] ?? null;
    }
}
?>