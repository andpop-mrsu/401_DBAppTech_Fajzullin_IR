<?php
namespace Goodlixe\GuessNumber;

class Controller
{
    public static function startGame()
    {
        View::showIntro();
        self::playGame();
    }

    private static function playGame()
    {
        $number = rand(1, 100);
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
            
            if ($guess < $number) {
                echo "Загаданное число БОЛЬШЕ\n";
            } elseif ($guess > $number) {
                echo "Загаданное число МЕНЬШЕ\n";
            } else {
                echo "Поздравляем! Вы угадали число $number за $attempts попыток!\n";
                break;
            }
        }
    }
}
?>