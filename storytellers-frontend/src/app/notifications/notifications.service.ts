import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class NotificationsService {

  constructor(private http: HttpClient) { }

  public getStatus(): Observable<{ status: 'block' | 'allow' }> {
    return this.http.get('/api/notifications/status').pipe(
      map((data: { status: 'block' | 'allow' }) => data),
      catchError((error) => {
        console.log(error);
        throw (error.error ? error.error : error);
      })
    );
  }

  public allow(): Observable<{}> {
    return this.http.post('/api/notifications/allow', {}).pipe(
      catchError((error) => {
        console.log(error);
        throw (error.error ? error.error : error);
      })
    );
  }

}
