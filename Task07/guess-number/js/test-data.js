// Тестовые данные для демонстрации
async function addTestData() {
    if (!window.app || !window.app.db) {
        console.warn('Приложение не инициализировано');
        return;
    }
    
    const testGames = [
        {
            playerName: "Иван",
            secretNumber: 42,
            attempts: [
                { attemptNumber: 1, guess: 50, result: "less", message: "Загаданное число МЕНЬШЕ" },
                { attemptNumber: 2, guess: 25, result: "more", message: "Загаданное число БОЛЬШЕ" },
                { attemptNumber: 3, guess: 37, result: "more", message: "Загаданное число БОЛЬШЕ" },
                { attemptNumber: 4, guess: 42, result: "win", message: "Поздравляем! Вы угадали число!" }
            ],
            totalAttempts: 4,
            isWin: true,
            maxAttempts: 10,
            timestamp: new Date(Date.now() - 86400000).toISOString(),
            date: new Date(Date.now() - 86400000).toLocaleDateString('ru-RU'),
            time: new Date(Date.now() - 86400000).toLocaleTimeString('ru-RU')
        },
        {
            playerName: "Мария",
            secretNumber: 73,
            attempts: [
                { attemptNumber: 1, guess: 50, result: "more", message: "Загаданное число БОЛЬШЕ" },
                { attemptNumber: 2, guess: 75, result: "less", message: "Загаданное число МЕНЬШЕ" },
                { attemptNumber: 3, guess: 63, result: "more", message: "Загаданное число БОЛЬШЕ" },
                { attemptNumber: 4, guess: 69, result: "more", message: "Загаданное число БОЛЬШЕ" },
                { attemptNumber: 5, guess: 72, result: "more", message: "Загаданное число БОЛЬШЕ" },
                { attemptNumber: 6, guess: 73, result: "win", message: "Поздравляем! Вы угадали число!" }
            ],
            totalAttempts: 6,
            isWin: true,
            maxAttempts: 10,
            timestamp: new Date(Date.now() - 172800000).toISOString(),
            date: new Date(Date.now() - 172800000).toLocaleDateString('ru-RU'),
            time: new Date(Date.now() - 172800000).toLocaleTimeString('ru-RU')
        }
    ];
    
    try {
        for (const game of testGames) {
            await window.app.db.saveGame(game);
        }
        console.log('✅ Тестовые данные добавлены');
        alert('Тестовые данные добавлены в базу данных');
    } catch (error) {
        console.error('Ошибка добавления тестовых данных:', error);
    }
}

// Добавить кнопку для загрузки тестовых данных
document.addEventListener('DOMContentLoaded', () => {
    const dbControls = document.querySelector('.database-controls');
    if (dbControls) {
        const testButton = document.createElement('button');
        testButton.className = 'btn btn-db';
        testButton.textContent = '🧪 Тестовые данные';
        testButton.onclick = addTestData;
        dbControls.querySelector('.db-buttons').appendChild(testButton);
    }
});