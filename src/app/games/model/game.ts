export interface Game {
  id: string;
  rounds: number;
  players: string[];
  creator: string;
  completed: boolean;
  currentMessageNumber: number;
  firstWords: string;
  timestamp: Date;
}
