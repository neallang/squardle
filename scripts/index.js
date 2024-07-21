let currentGuess = ''; 
let guessesRemaining = 15;
let validWords = [];
let yellowArrays = [[], [], [], [], []];    // Yellow letters for each word
let letterMaps = [];                        // Letter count for each word
const userGuesses = [];

function getWords(callback) {
    fetch('utils/words.txt')
        .then(response => response.text())
        .then(data => {
            const words = data.split('\n').map(word => word.trim());
            validWords = words;
            callback(words);
        })
        .catch(error => console.error('Error fetching word list:'))
}

function dailyWords(words) {
    const today = new Date().toISOString().split('T')[0];  // YYYY-MM-DD 
    const storedWords = JSON.parse(localStorage.getItem('dailyWords'));

    if (storedWords && storedWords.date === today) {            // If they've already been on the app, localStoage will be populated. Otherwise, get 5 random words
        console.log(storedWords) // Remove when done
        populateTable(storedWords.words); 
    } else {
        const shuffled = words.sort(() => 0.5 - Math.random()); // Shuffle and take the first 5 words
        const selectedWords = shuffled.slice(0, 5); 

        console.log(selectedWords)  // Remove when done

        localStorage.setItem('dailyWords', JSON.stringify({ date: today, words: selectedWords }));
        
        populateTable(selectedWords);  
    }
}

function populateTable(words) {
    const table = document.getElementById('game-table');
    words.forEach((word, rowIndex) => {
        const row = table.rows[rowIndex + 1];  // Start from the second row (idx 1)
        let letterMap = {};                    // Initialize letter map for each word
        word.split('').forEach((letter, colIndex) => {
            const cell = row.cells[colIndex];
            cell.setAttribute('data-letter', letter);  // Store the letter in a data attribute
            cell.textContent = '';                     // Hide the letter until they guess it
            letterMap[letter] = (letterMap[letter] || 0) + 1;  // Count the letters in the word
        });
        letterMaps[rowIndex] = letterMap;  // Store the letter map for this row
    });
}

function handleKeyInput(letter) {
    if (letter === "DEL") {
        currentGuess = currentGuess.slice(0, -1); // Remove last letter
    } 
    else if (letter == "ENTER") {
        const errorMessage = document.getElementById("error-message");

        if (currentGuess.length === 5) {
            if (validWords.includes(currentGuess)) {
                // Valid guess case
                if (!userGuesses.includes(currentGuess)) {
                    userGuesses.push(currentGuess)
                    submitGuess(); 
                    errorMessage.textContent = "";
                }
                // Duplicate guess case
                else {
                    errorMessage.textContent = "You've already guessed this word."
                }
            }
            // Invalid guess case
            else {
                errorMessage.textContent = 'Not a valid word.';
            }
        } 
        // < 5 letters guess case
        else {
            errorMessage.textContent = "Guess must be 5 letters."
        }
    }
    
    else if (currentGuess.length < 5 && letter.length === 1 && letter.match(/[A-Z]/)) {   // Added conditions to deal with 'BACKS' being added to guess when backspace pressed
        currentGuess += letter;
    }

    const firstRow = document.getElementById('guess-row');
    for (let i = 0; i < 5; i++) {
        firstRow.cells[i].textContent = currentGuess[i] || ''
    }
}

function submitGuess() {
    guessesRemaining -= 1;
    document.getElementById('guesses-remaining').textContent = `${guessesRemaining} guesses`;

    // Clear their guess
    const firstRow = document.getElementById("guess-row")
    for (let i = 0; i < 5; i++) {
        firstRow.cells[i].textContent = '';
    }

    // Reveal green / yellow letters
    const table = document.getElementById("game-table");
    for (let rowIndex = 1; rowIndex < 6; rowIndex++) {
        const row = table.rows[rowIndex];

        revealRow(row, rowIndex - 1, currentGuess);
    }
    currentGuess = "";
}

function revealRow(row, rowIndex, guess) {
    const yellowLetters = yellowArrays[rowIndex];  // Use the array for the word
    let letterMap = letterMaps[rowIndex];          // Get the letter map for the word

    // First pass: Handle green letters
    for (let colIndex = 0; colIndex < 5; colIndex++) {
        const cell = row.cells[colIndex];
        const letter = cell.getAttribute('data-letter');
        const guessLetter = guess[colIndex];

        if (guessLetter === letter) {
            cell.textContent = guessLetter;
            cell.style.backgroundColor = 'green';
            letterMap[letter]--;                   

            // Remove the letter from yellow letters if it's correctly guessed
            const yellowIndex = yellowLetters.indexOf(guessLetter);
            if (yellowIndex > -1) {
                yellowLetters.splice(yellowIndex, 1);
            }
        }
    }

    // Second pass: Handle yellow letters
    for (let colIndex = 0; colIndex < 5; colIndex++) {
        const cell = row.cells[colIndex];
        const guessLetter = guess[colIndex];
        const letter = cell.getAttribute('data-letter');

        if (guessLetter !== letter && letterMap[guessLetter] > 0 && !yellowLetters.includes(guessLetter)) {
            yellowLetters.push(guessLetter);
            letterMap[guessLetter]--;
        }
    }

    const yellowCell = row.cells[5];                // The last cell for yellow letters
    yellowCell.textContent = yellowLetters.join('');
}

// UI keyboard
document.querySelectorAll('.key').forEach(button => {
    button.addEventListener('click', () => {
        const letter = button.textContent;
        handleKeyInput(letter);
    });
});

// Physical keyboard
document.addEventListener('keydown', (event) => {
    const key = event.key.toUpperCase();

    if (key === "BACKSPACE") {
        handleKeyInput("DEL");
    } else if (key === "ENTER") {
        handleKeyInput("ENTER");
    } else if (key >= 'A' && key <= 'Z') {
        handleKeyInput(key);
    }
});

// Initialize
getWords(dailyWords);
