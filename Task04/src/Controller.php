<?php
namespace Goodlixe\GuessNumber;

class Controller
{
    private $gameRepo;
    private $currentGameId;

    public function __construct()
    {
        $db = new Database();
        $this->gameRepo = new GameRepository($db);
    }

    public function run($args)
    {
        $mode = $args['mode'];
        
        switch ($mode) {
            case 'new':
                $this->startNewGame();
                break;
            case 'list':
                $this->showGamesList($args['filter'] ?? null);
                break;
            case 'top':
                $this->showTopPlayers();
                break;
            case 'replay':
                $this->replayGame($args['game_id'] ?? null);
                break;
            case 'help':
                View::showHelp();
                break;
            default:
                $this->startNewGame();
        }
    }

    public function startNewGame()
    {
        View::showGameIntro();
        
        $playerName = $this->getPlayerName();
        $secretNumber = rand(1, 100);
        $maxAttempts = 10;
        
        // Сохраняем игру в БД
        $this->currentGameId = $this->gameRepo->createGame($playerName, $secretNumber, $maxAttempts);
        
        $this->playGame($secretNumber, $maxAttempts);
    }

    private function getPlayerName()
    {
        echo "Введите ваше имя: ";
        $name = trim(fgets(STDIN));
        return $name ?: 'Anonymous';
    }

    private function playGame($secretNumber, $maxAttempts)
    {
        $attempts = 0;
        
        while (true) {
            echo "Введите ваше число: ";
            $guess = trim(fgets(STDIN));
            $attempts++;
            
            if (!is_numeric($guess)) {
                echo "Пожалуйста, введите число!\n";
                continue;
            }
            
            $guess = (int)$guess;
            
            // Сохраняем попытку в БД
            if ($guess < $secretNumber) {
                $result = 'more';
                $message = "Загаданное число БОЛЬШЕ";
            } elseif ($guess > $secretNumber) {
                $result = 'less';
                $message = "Загаданное число МЕНЬШЕ";
            } else {
                $result = 'win';
                $message = "Поздравляем! Вы угадали число $secretNumber за $attempts попыток!";
                
                // Обновляем результат игры в БД
                $this->gameRepo->updateGameResult($this->currentGameId, 'win', $attempts);
            }
            
            // Сохраняем каждую попытку
            $this->gameRepo->saveAttempt($this->currentGameId, $attempts, $guess, $result);
            echo $message . "\n";
            
            if ($result === 'win') {
                break;
            }
            
            if ($attempts >= $maxAttempts) {
                echo "К сожалению, вы исчерпали все попытки. Загаданное число было: $secretNumber\n";
                $this->gameRepo->updateGameResult($this->currentGameId, 'loose', $attempts);
                break;
            }
        }
    }

    public function showGamesList($filter = null)
    {
        $games = $this->gameRepo->getAllGames($filter);
        
        if (empty($games)) {
            echo "Нет сохраненных игр.\n";
            return;
        }
        
        View::showGamesList($games, $filter);
    }

    public function showTopPlayers()
    {
        $players = $this->gameRepo->getTopPlayers();
        View::showTopPlayers($players);
    }

    public function replayGame($gameId)
    {
        if ($gameId === null) {
            echo "Ошибка: необходимо указать ID игры для повторения.\n";
            echo "Использование: guess-number --replay ID\n";
            return;
        }
        
        $game = $this->gameRepo->getGameById($gameId);
        if (!$game) {
            echo "Игра с ID $gameId не найдена.\n";
            return;
        }
        
        $attempts = $this->gameRepo->getGameAttempts($gameId);
        View::showGameReplay($game, $attempts);
    }
}
?>