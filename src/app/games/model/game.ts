export interface Game {
  id: string;
  rounds: number;
  players: string[];
  creator: string;
  completed: boolean;
  currentPhraseNumber: number;
  firstWords: string;
  timestamp: Date;
}
