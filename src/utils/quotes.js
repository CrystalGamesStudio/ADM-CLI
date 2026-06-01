const quotes = [
  { text: 'First, solve the problem. Then, write the code.', author: 'John Johnson' },
  { text: 'Any fool can write code that a computer can understand. Good programmers write code that humans can understand.', author: 'Martin Fowler' },
  { text: 'Code is like humor. When you have to explain it, it\'s bad.', author: 'Cory House' },
  { text: 'Make it work, make it right, make it fast.', author: 'Kent Beck' },
  { text: 'Simplicity is the soul of efficiency.', author: 'Austin Freeman' },
  { text: 'Before software can be reusable it first has to be usable.', author: 'Ralph Johnson' },
  { text: 'The best error message is the one that never shows up.', author: 'Thomas Fuchs' },
  { text: 'It\'s not a bug — it\'s an undocumented feature.', author: 'Anonymous' },
  { text: 'The most disastrous thing that you can ever learn is your first programming language.', author: 'Alan Kay' },
  { text: 'Measuring programming progress by lines of code is like measuring aircraft building progress by weight.', author: 'Bill Gates' },
  { text: 'The best way to predict the future is to implement it.', author: 'David Heinemeier Hansson' },
  { text: 'Talk is cheap. Show me the code.', author: 'Linus Torvalds' },
  { text: 'Programs must be written for people to read, and only incidentally for machines to execute.', author: 'Harold Abelson' },
  { text: 'The function of good software is to make the complex appear to be simple.', author: 'Grady Booch' },
  { text: 'Perfection is achieved not when there is nothing more to add, but when there is nothing left to take away.', author: 'Antoine de Saint-Exupery' },
];

function getRandomQuote() {
  return quotes[Math.floor(Math.random() * quotes.length)];
}

function getAllQuotes() {
  return quotes;
}

module.exports = { getRandomQuote, getAllQuotes };
