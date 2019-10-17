import { Component, OnInit, OnDestroy, Renderer2 } from '@angular/core';
import { SwUpdate } from '@angular/service-worker';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-update',
  templateUrl: './update.component.html',
  styleUrls: ['./update.component.scss']
})
export class UpdateComponent implements OnInit, OnDestroy {

  updateAvailable = false;
  swUpdatesSubscription: Subscription;

  constructor(private swUpdate: SwUpdate) {
  }

  ngOnInit() {
    if (this.swUpdate.isEnabled) {
      this.swUpdatesSubscription = this.swUpdate.available.subscribe(event => {
        this.updateAvailable = true;
      });
      this.swUpdate.checkForUpdate();
    }
  }

  ngOnDestroy() {
    if (this.swUpdatesSubscription) { this.swUpdatesSubscription.unsubscribe(); }
  }

  rejectUpdate() {
    this.updateAvailable = false;
  }

}
