import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { of } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class UserService {

  constructor(private http: HttpClient) { }

  wikiSearch(term: string) {
    if (term === '') {
      return of([]);
    }

    return this.http
      .get('/api/wikipedia/search', { params: { term } }).pipe(
        map(response => response[1])
      );
  }
}
