import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { take } from 'rxjs/operators';
import { AuthenticationService } from 'src/app/authentication/authentication.service';
import { NotificationsService } from '../notifications.service';

@Component({
  selector: 'app-status',
  templateUrl: './status.component.html',
  styleUrls: ['./status.component.scss']
})
export class StatusComponent implements OnInit, OnDestroy {

  status: 'block' | 'allow';
  errorMessage: string;
  responseSubmitted = false;
  subscription: Subscription = new Subscription();

  constructor(private auth: AuthenticationService, private notificationsService: NotificationsService) { }

  ngOnInit() {
    // Get the notification status every time the user changes
    this.subscription.add(this.auth.userProfile$.subscribe(() => {
      this.status = null;
      this.errorMessage = null;
      this.responseSubmitted = false;
      this.subscription.add(this.notificationsService.getStatus()
        .subscribe((response: { status: 'block' | 'allow' }) => {
          this.status = response.status;
        }));
    }));
  }

  allow() {
    this.responseSubmitted = true;
    this.subscription.add(
      this.notificationsService.allow().subscribe(() => {
        this.status = 'allow';
        this.responseSubmitted = false;
      }, () => {
        this.responseSubmitted = false;
        this.errorMessage = 'An error occurred while processing your request';
      })
    );
  }

  dismissError() {
    this.errorMessage = null;
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

}
