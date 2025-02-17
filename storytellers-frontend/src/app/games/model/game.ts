import { User } from 'src/app/users/model/user';
import { GameData } from './game-data';

export interface Game {
  id: string;
  title: string;
  rounds: number;
  players: User[];
  invitations: { [key: string]: { email: string } };
  creatorId: string;
  completed: boolean;
  currentPlayerId: string;
  currentPhraseNumber: number;
  description?: string;
  firstWords: string;
  timestamp: Date;
  gameData?: GameData[]; // Game data is returned when the game is finished
}
