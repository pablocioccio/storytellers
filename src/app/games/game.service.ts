import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { User } from '../users/model/user';

@Injectable({
  providedIn: 'root'
})
export class GameService {

  constructor(private http: HttpClient) { }

  createGame(users: User[]): Observable<any> {
    // return this.http.post('/api/games/create', {});
    return this.http.get('/api/test', { responseType: 'text' });
  }
}
