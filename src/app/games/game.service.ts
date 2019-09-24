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

  createGame(users: User[], rounds: number): Observable<any> {
    const userData = {};
    users.forEach((element: User, index: number) => {
      userData[index] = element.user_id;
    });

    return this.http.post('/api/games/create', {
      users: userData,
      rounds
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
