import { IGameData } from './game-data';
import { IInvitations } from './invitations';
import { IPlayer } from './player';

export interface IGame {
    id: string;
    title: string;
    rounds: number;
    creatorId: string;
    description?: string;
    players: IPlayer[];
    invitations?: IInvitations;
    completed: boolean;
    currentPlayerId: string;
    currentPhraseNumber: number;
    firstWords?: string;
    timestamp: Date;
    gameData?: IGameData[];
}
