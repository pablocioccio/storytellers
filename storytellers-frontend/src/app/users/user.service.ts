import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class UserService {

  constructor(private http: HttpClient) { }

  subscribeToNotifications(subscription: PushSubscription) {
    return this.http.post('/api/users/notifications/subscribe', subscription);
  }

  listNotificationsSubscriptions(): Observable<PushSubscriptionJSON[]> {
    return this.http.get<PushSubscriptionJSON[]>('/api/users/notifications/list');
  }

}
