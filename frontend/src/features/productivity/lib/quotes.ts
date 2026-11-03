// A small rotating set of motivational quotes. The quote is chosen
// deterministically from the date key so it stays stable for a whole day.

export interface Quote {
  text: string;
  author: string;
}

const QUOTES: readonly Quote[] = [
  { text: "Small steps every day add up to big results.", author: "Unknown" },
  { text: "Discipline is choosing between what you want now and what you want most.", author: "Abraham Lincoln" },
  { text: "You do not rise to the level of your goals. You fall to the level of your systems.", author: "James Clear" },
  { text: "The secret of getting ahead is getting started.", author: "Mark Twain" },
  { text: "Well done is better than well said.", author: "Benjamin Franklin" },
  { text: "Motivation gets you going, but habit keeps you growing.", author: "John C. Maxwell" },
  { text: "It always seems impossible until it’s done.", author: "Nelson Mandela" },
  { text: "Focus on being productive instead of busy.", author: "Tim Ferriss" },
  { text: "Success is the sum of small efforts repeated day in and day out.", author: "Robert Collier" },
  { text: "What gets measured gets managed.", author: "Peter Drucker" },
  { text: "The best way to predict the future is to create it.", author: "Peter Drucker" },
  { text: "Do something today that your future self will thank you for.", author: "Sean Patrick Flanery" },
];

/** Stable non-negative hash of a string. */
function hashString(value: string): number {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(index);
    hash |= 0; // force 32-bit
  }
  return Math.abs(hash);
}

export function getDailyQuote(dateKey: string): Quote {
  return QUOTES[hashString(dateKey) % QUOTES.length];
}
