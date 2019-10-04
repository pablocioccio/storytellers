import { User } from 'src/app/users/model/user';
import { GameData } from './game-data';

export interface Game {
  id: string;
  rounds: number;
  /* When the game is completed, the API returns full user info. If it's not, it returns just the user ids. */
  players: string[] | User[];
  creator: string;
  completed: boolean;
  currentPhraseNumber: number;
  firstWords: string;
  timestamp: Date;
  gameData?: GameData[]; // Game data is returned when the game is finished
}
