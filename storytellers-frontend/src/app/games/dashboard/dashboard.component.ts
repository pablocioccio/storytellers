import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { SwPush } from '@angular/service-worker';
import { Channel } from 'pusher-js';
import { Subscription } from 'rxjs';
import { take } from 'rxjs/operators';
import { AuthenticationService } from 'src/app/authentication/authentication.service';
import { SpinnerService } from 'src/app/spinner/spinner.service';
import { User } from 'src/app/users/model/user';
import { UserService } from 'src/app/users/user.service';
import { GameService } from '../game.service';
import { Game } from '../model/game';

const VAPID_PUBLIC = 'BIqHGWLUlSMK1XSVsdbr8hQhpb8NySHCcVn1UKwpk_RUCJEjVkC6Y0VWw843fjqR_9h3v-jPVkigCt-e1WSiVBw';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {


  games: Game[];
  errorMessage: string;
  currentUserId: string;
  pusherChannel: Channel;
  subscription: Subscription = new Subscription();

  constructor(
    private gameService: GameService, private spinnerService: SpinnerService, private swPush: SwPush,
    public auth: AuthenticationService, private router: Router, private userService: UserService) { }

  ngOnInit() {
    // Show spinner
    this.spinnerService.show();
    // Retrieve games
    this.subscription.add(this.gameService.listGames().subscribe((games: Game[]) => {
      if (!games.length) { this.router.navigate(['/games/create']); }
      this.games = games;
      this.spinnerService.hide();
    }, (error) => {
      this.spinnerService.hide();
      this.errorMessage = error.message ? error.message : 'There was a problem listing the games';
    }));
    // Retrieve current user profile and subscribe to pusher events
    this.subscription.add(this.auth.userProfile$.subscribe((user) => {
      this.currentUserId = user.sub;
      // Remove handlers from existing pusher channel (if any) and unsubscribe
      if (this.pusherChannel) {
        this.pusherChannel.unbind();
        this.pusherChannel.unsubscribe();
      }
      // Subscribe to a pusher channel for this specific user
      this.pusherChannel = this.userService.getPusherInstance().subscribe(user.sub.replace('|', ''));
      // Subscribe to events for this user
      this.subscribeToUserEvents();
    }));
    // Offer a subscription to push notifications
    this.offerPushNotification();
  }

  subscribeToUserEvents() {
    this.pusherChannel.bind_global((eventName: string, eventData: string) => {
      if (eventData === 'GAME_UPDATED' || eventData === 'GAME_DELETED') {
        this.subscription.add(this.gameService.listGames().subscribe((games: Game[]) => {
          if (!games.length) { this.router.navigate(['/games/create']); }
          this.games = games;
        }, (error) => {
          this.errorMessage = error.message ? error.message : 'There was a problem listing the games';
        }));
      }
    });
  }

  getUserInfo(userId: string, users: User[]): User {
    return users.find((user) => user.user_id === userId);
  }

  offerPushNotification() {
    // Check if push notifications are supported
    if (!this.swPush.isEnabled) { return; }

    this.subscription.add(this.swPush.subscription.pipe(take(1)).subscribe(currentNotification => {
      // Check current notification status
      if (!currentNotification) {
        // If there's no subscription then offer one.
        this.requestPushSubscription();
      } else {
        /* If there's a subscription already, check if it is associated
        to the current user. If it's not, then notify the server. */
        const currentNotificationJSON: PushSubscriptionJSON = currentNotification.toJSON();
        this.subscription.add(this.userService
          .listPushNotificationsSubscriptions()
          .subscribe(notifications => {
            const match = notifications.find(notification =>
              notifications.keys &&
              notification.endpoint === currentNotificationJSON.endpoint &&
              notification.keys.auth === currentNotificationJSON.keys.auth &&
              notification.keys.p256dh === currentNotificationJSON.keys.p256dh);
            // If none of the stored subscriptions match, then store this one.
            if (!match) {
              this.subscription.add(this.userService.subscribeToPushNotifications(currentNotification).subscribe());
            }
          })
        );
      }
    }));
  }

  requestPushSubscription() {
    this.swPush.requestSubscription({
      serverPublicKey: VAPID_PUBLIC,
    }).then(subscription => {
      this.subscription.add(this.userService.subscribeToPushNotifications(subscription).subscribe());
    }).catch(console.error);
  }

  calculateProgressBarColor(game: Game) {
    if (game.completed) { return 'success'; }
    const percentage: number = game.currentPhraseNumber * 100 / (game.rounds * game.players.length);
    if (percentage <= 33) { return 'danger'; }
    if (33 < percentage && percentage <= 66) { return 'primary'; }
    if (percentage > 66) { return 'warning'; }
  }

  OnDestroy() {
    this.subscription.unsubscribe();
    // Remove handlers from existing pusher channel (if any) and unsubscribe
    if (this.pusherChannel) {
      this.pusherChannel.unbind_global();
      this.pusherChannel.unsubscribe();
    }
  }

}
