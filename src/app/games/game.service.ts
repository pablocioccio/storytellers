import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { User } from '../users/model/user';
import { Game } from './model/game';
import { map, catchError } from 'rxjs/operators';

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

}
