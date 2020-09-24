import { Component, OnDestroy, OnInit } from '@angular/core';
import { SwUpdate } from '@angular/service-worker';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit, OnDestroy {

  title = 'Storytellers';
  subscription: Subscription = new Subscription();

  constructor(private swUpdate: SwUpdate) {
  }

  ngOnInit() {
    if (this.swUpdate.isEnabled) {
      // Subscribe to available updates
      this.subscription.add(
        this.swUpdate.available.subscribe(() => {
          // Activate update
          this.swUpdate.activateUpdate().then(() => {
            window.location.reload();
          }).catch(err => {
            console.log(`Error updating application: ${err}`);
          });
        })
      );
      // Force update check
      this.swUpdate.checkForUpdate();
    }
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

}
