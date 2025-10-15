#!/usr/bin/env php
<?php
require_once __DIR__ . '/../vendor/autoload.php';

use Goodlixe\GuessNumber\ArgsParser;
use Goodlixe\GuessNumber\Controller;

try {
    $argsParser = new ArgsParser();
    $args = $argsParser->parseArguments($argv);
    
    $controller = new Controller();
    $controller->run($args);
} catch (Exception $e) {
    echo "Ошибка: " . $e->getMessage() . "\n";
    echo "Используйте --help для просмотра справки.\n";
}
?>