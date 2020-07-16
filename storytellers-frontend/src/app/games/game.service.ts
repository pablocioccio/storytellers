import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { User } from '../users/model/user';
import { Game } from './model/game';

@Injectable({
  providedIn: 'root'
})
export class GameService {

  constructor(private http: HttpClient) { }

  createGame(players: string[], rounds: number, title: string, description?: string): Observable<any> {
    return this.http.post('/api/games/create', {
      title,
      ...description && { description },
      rounds,
      players
    });
  }

  getGame(id: string): Observable<Game> {
    return this.http.get(`/api/games/${id}`).pipe(
      map((data: Game) => data),
      catchError(error => {
        return throwError(`There was a problem retrieving the game: ${error}`);
      })
    );
  }

  listGames(): Observable<Game[]> {
    return this.http.get('/api/games/list').pipe(
      map((data: Game[]) => data),
      catchError(error => {
        return throwError(`There was a problem listing games: ${JSON.stringify(error)}`);
      })
    );
  }

  postPhrase(id: string, phrase: string, lastWords: string): Observable<any> {
    return this.http.post<any>(`/api/games/play/${id}`, {
      phrase,
      lastWords
    }).pipe(
      catchError(error => {
        return throwError(`There was a problem posting the prhase: ${error}`);
      })
    );

  }

}
