import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { Game } from './model/game';

@Injectable({
  providedIn: 'root'
})
export class GameService {

  constructor(private http: HttpClient) { }

  createGame(invitations: string[], rounds: number, title: string, description?: string): Observable<any> {
    return this.http.post('/api/games/create', {
      title,
      ...description && { description },
      rounds,
      invitations
    }).pipe(
      catchError((error) => {
        console.log(error);
        throw (error.error ? error.error : error);
      })
    );
  }

  getGame(id: string): Observable<Game> {
    return this.http.get(`/api/games/${id}`).pipe(
      map((data: Game) => data),
      catchError((error) => {
        console.log(error);
        throw (error.error ? error.error : error);
      })
    );
  }

  acceptInvitation(gameId: string, invitationId: string) {
    return this.http.post<any>(`/api/games/${gameId}/invitations/${invitationId}/accept`, {}).pipe(
      catchError((error) => {
        console.log(error);
        throw (error.error ? error.error : error);
      })
    );
  }

  rejectInvitation(gameId: string, invitationId: string) {
    return this.http.post<any>(`/api/games/${gameId}/invitations/${invitationId}/reject`, {}).pipe(
      catchError((error) => {
        console.log(error);
        throw (error.error ? error.error : error);
      })
    );
  }

  withdrawInvitation(gameId: string, invitationId: string) {
    return this.http.post<any>(`/api/games/${gameId}/invitations/${invitationId}/withdraw`, {}).pipe(
      catchError((error) => {
        console.log(error);
        throw (error.error ? error.error : error);
      })
    );
  }

  listGames(): Observable<Game[]> {
    return this.http.get('/api/games/list').pipe(
      map((data: Game[]) => data),
      catchError((error) => {
        console.log(error);
        throw (error.error ? error.error : error);
      })
    );
  }

  postPhrase(id: string, phrase: string, lastWords: string): Observable<any> {
    return this.http.post<any>(`/api/games/${id}/play`, { phrase, lastWords }).pipe(
      catchError((error) => {
        console.log(error);
        throw (error.error ? error.error : error);
      })
    );
  }

}
