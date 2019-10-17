import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { SwPush } from '@angular/service-worker';
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
  currentUserId: string;
  gamesSubscription: Subscription;
  currentUserSubscription: Subscription;
  currentNotificationSubscription: Subscription;
  newNotificationRequestSubscription: Subscription;
  listNotificationsRequestSubscription: Subscription;

  constructor(
    private gameService: GameService, private spinnerService: SpinnerService, private swPush: SwPush,
    public auth: AuthenticationService, private router: Router, private userService: UserService) { }

  ngOnInit() {
    // Show spinner
    this.spinnerService.show();
    // Retrieve games
    this.gamesSubscription = this.gameService.listGames().subscribe((games: Game[]) => {
      if (!games.length) { this.router.navigate(['/games/create']); }
      this.games = games;
      this.spinnerService.hide();
    });
    // Retrieve current user profile
    this.currentUserSubscription = this.auth.userProfile$.subscribe((user) => {
      this.currentUserId = user.sub;
    });
    // Offer a subscription to push notifications
    this.offerPushNotification();
  }

  getUserInfo(userId: string, users: User[]): User {
    return users.find((user) => user.user_id === userId);
  }

  offerPushNotification() {
    // Check if push notifications are supported
    if (!this.swPush.isEnabled) { return; }

    this.currentNotificationSubscription = this.swPush.subscription.pipe(take(1)).subscribe(currentNotification => {
      // Check current notification status
      if (!currentNotification) {
        // If there's no subscription then offer one.
        this.requestPushSubscription();
      } else {
        /* If there's a subscription already, check if it is associated
        to the current user. If it's not, then notify the server. */
        const currentNotificationJSON: PushSubscriptionJSON = currentNotification.toJSON();
        this.listNotificationsRequestSubscription = this.userService
          .listNotificationsSubscriptions()
          .subscribe(notifications => {
            const match = notifications.find(notification =>
              notifications.keys &&
              notification.endpoint === currentNotificationJSON.endpoint &&
              notification.keys.auth === currentNotificationJSON.keys.auth &&
              notification.keys.p256dh === currentNotificationJSON.keys.p256dh);
            // If none of the stored subscriptions match, then store this one.
            if (!match) {
              this.newNotificationRequestSubscription = this.userService.subscribeToNotifications(currentNotification).subscribe();
            }
          });
      }
    });
  }

  requestPushSubscription() {
    this.swPush.requestSubscription({
      serverPublicKey: VAPID_PUBLIC,
    }).then(subscription => {
      this.newNotificationRequestSubscription = this.userService.subscribeToNotifications(subscription).subscribe();
    }).catch(console.error);
  }

  calculateProgressBarColor(index: number) {
    switch (index % 5) {
      case 0:
        return 'success';
      case 1:
        return 'danger';
      case 2:
        return 'primary';
      case 3:
        return 'warning';
      case 4:
        return 'dark';
    }
  }

  OnDestroy() {
    this.gamesSubscription.unsubscribe();
    this.currentUserSubscription.unsubscribe();
    if (this.currentNotificationSubscription) { this.currentNotificationSubscription.unsubscribe(); }
    if (this.newNotificationRequestSubscription) { this.newNotificationRequestSubscription.unsubscribe(); }
    if (this.listNotificationsRequestSubscription) { this.listNotificationsRequestSubscription.unsubscribe(); }
  }

}
