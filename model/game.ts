import { IGameData } from './game-data';
import { IPlayer } from './player';

export interface IGame {
    id: string;
    title: string;
    rounds: number;
    creatorId: string;
    description?: string;
    players: IPlayer[];
    completed: boolean;
    currentPlayerId: string;
    currentPhraseNumber: number;
    firstWords?: string;
    timestamp: Date;
    gameData?: IGameData[];
}
