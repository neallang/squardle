let currentGuess = ''; 
let guessesRemaining = 15;
let validWords = [];
let yellowArrays = [[], [], [], [], []];    // Yellow letters for each word
let letterMaps = [];                        // Letter count for each word
const userGuesses = [];
let gameOver = false;


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
    const shuffled = words.sort(() => 0.5 - Math.random()); // Shuffle the words
    const selectedWords = shuffled.slice(0, 5); // Take the first 5 words

    console.log(selectedWords); // For debugging purposes

    populateTable(selectedWords); // Populate the table with the selected words
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
    if (gameOver) return;

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
    if (gameOver) return;

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

    if (checkWin()) {
        gameWon(true);
        return;
    }

    if (guessesRemaining === 0) {
        gameWon(false);
        return;
    }
}

function revealRow(row, rowIndex, guess) {
    const yellowLetters = yellowArrays[rowIndex];  // Use the array for the word
    let letterMap = letterMaps[rowIndex];          // Get the letter map for the word

    // First pass: Handle green letters
    for (let colIndex = 0; colIndex < 5; colIndex++) {
        const cell = row.cells[colIndex];
        const letter = cell.getAttribute('data-letter');
        const guessLetter = guess[colIndex];

        if (guessLetter === letter && cell.textContent === "") {
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
    console.log(letterMap);

    // Second pass: Handle yellow letters
    for (let colIndex = 0; colIndex < 5; colIndex++) {
        const cell = row.cells[colIndex];
        const guessLetter = guess[colIndex];
        const letter = cell.getAttribute('data-letter');

        if (letterMap[guessLetter] > 0 && !yellowLetters.includes(guessLetter)) {
            yellowLetters.push(guessLetter);
            // letterMap[guessLetter]--;
        }
    }

    const yellowCell = row.cells[5];                // The last cell for yellow letters
    yellowCell.textContent = yellowLetters.join('');
}

function gameWon(win) {
    gameOver = true;

    const modal = document.getElementById('game-modal');
    const modalMessage = document.getElementById('end-message');
    const closeBtn = modal.querySelector('.close');

    if (win) {
        let attemptsUsed = 15 - guessesRemaining;
        modalMessage.textContent = `Congratulations, you beat this puzzle in ${attemptsUsed} attempts! Refresh the page to play again.`;
    }
    else {
        modalMessage.textContent = "Game over, you ran out of guesses! Refresh the page to try again.";

        const table = document.getElementById('game-table');
        for (let rowIndex = 1; rowIndex < 6; rowIndex++) {
            const row = table.rows[rowIndex];
            for (colIndex = 0; colIndex < 5; colIndex++) {
                const cell = row.cells[colIndex];
                cell.textContent = cell.getAttribute('data-letter');
            }
        }
    }

    modal.style.display = "block";

    closeBtn.onclick = function() {
        modal.style.display = "none";
    }

    document.querySelectorAll('.key').forEach(button => {
        button.disabled = true;
    });
    document.removeEventListener('keydown', handleKeyDown);
}

function checkWin() {
    const table = document.getElementById('game-table');
    for (let rowIndex = 1; rowIndex < 6; rowIndex++) {
        const row = table.rows[rowIndex];
        for (colIndex = 0; colIndex < 5; colIndex++) {
            const cell = row.cells[colIndex];
            if (cell.style.backgroundColor !== 'green') {
                return false;
            }
        }
    }
    return true; // All cells green --> game over
}

// UI keyboard
document.querySelectorAll('.key').forEach(button => {
    button.addEventListener('click', () => {
        const letter = button.textContent;
        handleKeyInput(letter);
    });
});

// Physical keyboard
function handleKeyDown () {
    const key = event.key.toUpperCase();

    if (key === "BACKSPACE") {
        handleKeyInput("DEL");
    } else if (key === "ENTER") {
        handleKeyInput("ENTER");
    } else if (key >= 'A' && key <= 'Z') {
        handleKeyInput(key);
    }
}

document.addEventListener('keydown', handleKeyDown);

// Initialize

document.addEventListener('DOMContentLoaded', () => {
    getWords(dailyWords);
    
    const tutorialModal = document.getElementById('tutorial-modal');
    const startGameBtn = document.getElementById('start-game-btn');
    const closeTutorialBtn = tutorialModal.querySelector('.close');

    tutorialModal.style.display = "block";  // Initially show this modal

    closeTutorialBtn.onclick = function() {
        tutorialModal.style.display = "none";
    }

    startGameBtn.onclick = function() {
        tutorialModal.style.display = "none";
    }
})

