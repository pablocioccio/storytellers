import { Component, EventEmitter, OnDestroy, OnInit, Output } from '@angular/core';
import { SwUpdate } from '@angular/service-worker';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-update',
  templateUrl: './update.component.html',
  styleUrls: ['./update.component.scss']
})
export class UpdateComponent implements OnInit, OnDestroy {

  @Output() swUpdateAvailable: EventEmitter<boolean> = new EventEmitter();

  updateAvailable = false;
  updateApplied = false;
  swUpdatesSubscription: Subscription;

  constructor(private swUpdate: SwUpdate) {
  }

  ngOnInit() {
    if (this.swUpdate.isEnabled) {
      this.swUpdatesSubscription = this.swUpdate.available.subscribe(event => {
        this.updateAvailable = true;
        this.swUpdateAvailable.emit(true);
      });
      this.swUpdate.checkForUpdate();
    }
  }

  applyUpdate() {
    this.updateApplied = true;
    this.swUpdate.activateUpdate()
      .then(() => {
        document.location.reload();
      })
      .catch(err => {
        console.log(`Error applying update: ${err}`);
        this.updateApplied = false;
      });
  }

  rejectUpdate() {
    this.updateAvailable = false;
    this.swUpdateAvailable.emit(false);
  }

  ngOnDestroy() {
    if (this.swUpdatesSubscription) { this.swUpdatesSubscription.unsubscribe(); }
  }

}
