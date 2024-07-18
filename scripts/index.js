let currentGuess = '';  // Track the current guess

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
    const today = new Date().toISOString().split('T')[0];  // YYYY-MM-DD 
    const storedWords = JSON.parse(localStorage.getItem('dailyWords'));

    if (storedWords && storedWords.date === today) {            // If they've already been on the app, localStoage will be populated. Otherwise, get 5 random words
        console.log('Using stored words:', storedWords.words);
        populateTable(storedWords.words); 
    } else {
        const shuffled = words.sort(() => 0.5 - Math.random()); // Shuffle and take the first 5 words
        const selectedWords = shuffled.slice(0, 5); 
        console.log('Generated new words:', selectedWords);

        localStorage.setItem('dailyWords', JSON.stringify({ date: today, words: selectedWords }));
        
        populateTable(selectedWords);  
    }
}

function populateTable(words) {
    const table = document.getElementById('game-table');
    words.forEach((word, rowIndex) => {
        word = word.toUpperCase()
        const row = table.rows[rowIndex + 1];  // Start from the second row (idx 1)
        word.split('').forEach((letter, colIndex) => {
            cell.setAttribute('data-letter', letter);  // Store the letter in a data attribute
            cell.textContent = '';  // Hide the letter until they guess it
        });
    });
}

function handleKeyInput(letter) {
    if (letter === "DEL") {
        currentGuess = currentGuess.slice(0, -1) // Remove last letter
    } else if (currentGuess.length < 5 && letter.length === 1 && letter.match(/[A-Z]/)) {       // Added conditions to deal with 'BACKS' being added to guess when backspace pressed
        currentGuess += letter;
    }

    const firstRow = document.getElementById('guess-row')
    for (let i = 0; i < 5; i++) {
        firstRow.cells[i].textContent = currentGuess[i] || ''
    }
}

// UI keyboard
document.querySelectorAll('.key').forEach(button => {
    button.addEventListener('click', () => {
        const letter = button.textContent
        handleKeyInput(letter)
    })
})

// Physical keyboard
document.addEventListener('keydown', (event) => {
    const key = event.key.toUpperCase()

    if (key === "BACKSPACE") {
        handleKeyInput("DEL")
    } else if (key >= 'A' && key <= 'Z') {
        handleKeyInput(key)
    }
})

getWords(dailyWords)