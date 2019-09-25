import { IPlayer } from './player';

export interface IGame {
    id: string;
    rounds: number;
    creator: string;
    /* Arrays in firebase are serialized as objects with numeric keys, but they are deserialized as arrays.
     We might also return the full player info instead of just the ids, depending on the endpoint. */
    players: { [key: number]: string; } | string[] | IPlayer[];
    completed: boolean;
    currentPhraseNumber: number;
    firstWords: string;
    timestamp: Date;
}
