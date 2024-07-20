let currentGuess = ''; 
let guessesRemaining = 15;
let validWords = [];
let yellowArrays = [[], [], [], [], []] // Yellow letters for each word

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
        word.split('').forEach((letter, colIndex) => {
            const cell = row.cells[colIndex];
            cell.setAttribute('data-letter', letter);  // Store the letter in a data attribute
            cell.textContent = '';  // Hide the letter until they guess it
        });
    });
}

function handleKeyInput(letter) {
    if (letter === "DEL") {
        currentGuess = currentGuess.slice(0, -1); // Remove last letter
    } 
    else if (letter == "ENTER") {
        if (currentGuess.length === 5) {
            submitGuess(); 
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
    const errorMessage = document.getElementById("error-message");
    if (!validWords.includes(currentGuess)) {
        const errorMessage = document.getElementById("error-message");
        errorMessage.textContent = 'Not a valid word';
        return;
    }
    errorMessage.textContent = ''

    guessesRemaining -= 1;
    document.getElementById('guesses-remaining').textContent = `${guessesRemaining} guesses`;

    // Clear their guess
    const firstRow = document.getElementById("guess-row")
    for (let i = 0; i < 5; i++) {
        firstRow.cells[i].textContent = '';
    }

    // Reveal green letters
    const table = document.getElementById("game-table")
        for (let rowIndex = 1; rowIndex <= 5; rowIndex++) {
            const row = table.rows[rowIndex];

            revealRow(row, rowIndex, currentGuess);
        }
        currentGuess = "";
}

function revealRow(row, rowIndex, guess) {
    const yellowLetters = yellowArrays[rowIndex]
    for (let colIndex = 0; colIndex < 6; colIndex++) {
        const cell = row.cells[colIndex];
        
        setTimeout(() => {
            // Green condition
            if (guess[colIndex] === cell.getAttribute('data-letter')) {
                cell.textContent = guess[colIndex];
                cell.style.backgroundColor = 'green';
            }
            // Yellow condition
            else if (yellowCase(cell, guess[colIndex], row, guess)) {
                if (!yellowLetters.includes(guess[colIndex]))
                yellowLetters.push(guess[colIndex])
            }
            cell.style.transform = 'scale(1.2)';
            setTimeout(() => {
                cell.style.transform = 'scale(1)';
            }, 200);
        }, colIndex * 200);
    }
    setTimeout(() => {
        const yellowCell = row.cells[5];
        yellowCell.textContent = yellowLetters.join('');
    }, 1100);
}

function yellowCase(cell, letter, row, guess) {
    let letterCountInWord = 0;
    let letterCountInGuess = 0;
    // Count occurrences of letter in word and guess
    for (let i = 0; i < 5; i++) {
        if (row.cells[i].getAttribute('data-letter') === letter) {
            letterCountInWord++;
        }
            if (guess[i] === letter) {
                letterCountInGuess++;    
        }
    }
    let correctPositionCount = 0;

    // Count occurrences of letter in correct position
    for (let i = 0; i < 5; i++) {
        if (guess[i] === row.cells[i].getAttribute('data-letter') && guess[i] === letter) {
            correctPositionCount++;
        }
    }

    return letterCountInWord > correctPositionCount;
}


// UI keyboard
document.querySelectorAll('.key').forEach(button => {
    button.addEventListener('click', () => {
        const letter = button.textContent;
        handleKeyInput(letter);
    })
})

// Physical keyboard
document.addEventListener('keydown', (event) => {
    const key = event.key.toUpperCase();

    if (key === "BACKSPACE") {
        handleKeyInput("DEL");
    } 
    else if (key === "ENTER") {
        handleKeyInput("ENTER");
    } 
    else if (key >= 'A' && key <= 'Z') {
        handleKeyInput(key);
    }
})

getWords(dailyWords);