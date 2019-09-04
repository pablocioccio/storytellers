import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class FirebaseService {

  private apiUrl: string = environment.apiUrl;

  constructor(private http: HttpClient) { }

  ping$(): Observable<any> {
    return this.http.get('/api/firebase');
  }

}
