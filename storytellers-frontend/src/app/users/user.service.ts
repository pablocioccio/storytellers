import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import Pusher from 'pusher-js';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class UserService {

  private pusher: Pusher;

  constructor(private http: HttpClient) {
    this.pusher = new Pusher('1bc814e9f0eaaa4a21e3', { cluster: 'us3' });
  }

  subscribeToPushNotifications(subscription: PushSubscription) {
    return this.http.post('/api/users/notifications/subscribe', subscription);
  }

  listPushNotificationsSubscriptions(): Observable<PushSubscriptionJSON[]> {
    return this.http.get<PushSubscriptionJSON[]>('/api/users/notifications/list');
  }

  getPusherInstance(): Pusher {
    return this.pusher;
  }

}
