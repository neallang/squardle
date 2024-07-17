import requests
from bs4 import BeautifulSoup

# All 2309 Wordle words
url = "https://www.wordunscrambler.net/word-list/wordle-word-list"

try:
    response = requests.get(url)
    response.raise_for_status()  # Check if the request was successful

    soup = BeautifulSoup(response.content, 'html.parser')

    # HTML structure
    word_elements = soup.select('li.invert.light a')

    # Extract the words from the elements
    wordle_words = [element.get_text() for element in word_elements]

    with open('words.txt', 'w') as file:
        for word in wordle_words:
            file.write(word + '\n')

