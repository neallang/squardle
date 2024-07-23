let currentGuess = ''; 
let guessesRemaining = 15;
let validWords = [];
let yellowArrays = [[], [], [], [], []];    // Yellow letters for each word
let letterMaps = [];                        // Letter count for each word
const userGuesses = [];
let gameOver = false;
let animationFinished = false;              // To deal with setTimeout issues

// Function to get the list of words from the txt file.
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

// Function to get the 5 words for this round.
function dailyWords(words) {
    const shuffled = words.sort(() => 0.5 - Math.random()); // Shuffle the words
    const selectedWords = shuffled.slice(0, 5); // Take the first 5 words

    populateTable(selectedWords); // Populate the table with the selected words
}

// Function to initialize the game and setup the table.
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

// Function to handle key input, whether it be from physical keyboard or on-screen keyboard.
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
                    userGuesses.push(currentGuess);
                    updateUserGuesses();
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

    // Build the current guess
    else if (currentGuess.length < 5 && letter.length === 1 && letter.match(/[A-Z]/)) {   // Added conditions to deal with 'BACKS' being added to guess when backspace pressed
        currentGuess += letter;
    }

    // Display the current guess
    const firstRow = document.getElementById('guess-row');
    for (let i = 0; i < 5; i++) {
        firstRow.cells[i].textContent = currentGuess[i] || ''
    }
}

// Function called after submitting each guess. Calls logic function and checks if a user has won / lost.
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

    setTimeout(() => { 
        if (animationFinished) { // Check the flag
            if (checkWin()) {
                gameWon(true);
                return;
            }
            if (guessesRemaining === 0) {
                gameWon(false);
                return;
            }
        }
    }, 1000); 

    currentGuess = "";

}

// Function that handles the logic of the game.
function revealRow(row, rowIndex, guess) {
    const yellowLetters = yellowArrays[rowIndex];  // Use the array for the word
    let letterMap = letterMaps[rowIndex];          // Get the letter map for the word

    // First pass: Handle green letters
    for (let colIndex = 0; colIndex < 5; colIndex++) {
        const cell = row.cells[colIndex];
        const letter = cell.getAttribute('data-letter');
        const guessLetter = guess[colIndex];

        setTimeout(() => {
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

            // Animation effect
            cell.style.transform = 'scale(1.2)';
            setTimeout(() => {
                cell.style.transform = 'scale(1)';
            }, 200);
        }, colIndex * 200);
    }

    // Second pass: Handle yellow letters
    setTimeout(() => {
        for (let colIndex = 0; colIndex < 5; colIndex++) {
            const cell = row.cells[colIndex];
            const guessLetter = guess[colIndex];
            const letter = cell.getAttribute('data-letter');

            if (letterMap[guessLetter] > 0 && !yellowLetters.includes(guessLetter)) {
                yellowLetters.push(guessLetter);
            }
        }

        const yellowCell = row.cells[5];  // The last cell for yellow letters
        yellowCell.textContent = yellowLetters.join('');
        animationFinished = true;
    }, 1000);  // Delay to show yellow letters after the trickling effect
}

// Function that is called once the game is won / lost.
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

    // Display the modal once the game is over.
    modal.style.display = "block";

    closeBtn.onclick = function() {
        modal.style.display = "none";
    }

    document.querySelectorAll('.key').forEach(button => {
        button.disabled = true;
    });
    document.removeEventListener('keydown', handleKeyDown);
}

// Function that handles the logic of checking if a user has won. This function is called after each guess.
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

// Function to display the user's previous guesses. They cannot submit duplicate guesses.
function updateUserGuesses() {
    const guessList = document.getElementById('guess-list');
    guessList.innerHTML = ''; // Clear the existing list

    userGuesses.forEach(guess => {
        const listItem = document.createElement('li');
        listItem.textContent = guess;
        guessList.appendChild(listItem);
    });
}

// On-screen keyboard
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

// Call the function above when a user presses a key
document.addEventListener('keydown', handleKeyDown);

// Initialize the game and show the getting started instructions
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

