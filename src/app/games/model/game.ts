import { User } from 'src/app/users/model/user';
import { GameData } from './game-data';

export interface Game {
  id: string;
  title: string;
  rounds: number;
  players: User[];
  creator: string;
  completed: boolean;
  currentPlayerId: string;
  currentPhraseNumber: number;
  firstWords: string;
  timestamp: Date;
  gameData?: GameData[]; // Game data is returned when the game is finished
}
