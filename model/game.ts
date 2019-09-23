export interface IGame {
    id: string;
    rounds: number;
    /* Arrays in firebase are serialized as objects with numeric keys, but they are deserialized as arrays */
    players: { [key: number]: string; } | string[];
    creator: string;
    completed: boolean;
    currentMessageNumber: number;
    firstWords: string;
    timestamp: Date;
}
