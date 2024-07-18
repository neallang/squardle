function getWords(callback) {
    fetch('utils/words.txt')
        .then(response => response.text())
        .then(data => {
            const words = data.split('\n').map(word => word.trim());
            callback(words)
        })
        .catch(error => console.error('Error fetching word list:'))
}

function dailyWords(words) {
    const shuffled = words.sort(() => 0.5 - Math.random()) // random order
    const selectedWords = shuffled.slice(0, 5);
    populateTable(selectedWords)
}

function populateTable(words) {
    const table = document.getElementById('game-table');
    words.forEach((word, rowIndex) => {
        word = word.toUpperCase()
        const row = table.rows[rowIndex + 1];  // Start from the second row (idx 1)
        word.split('').forEach((letter, colIndex) => {
            const cell = row.cells[colIndex];
            cell.textContent = letter; 
        });
    });
}

getWords(dailyWords)