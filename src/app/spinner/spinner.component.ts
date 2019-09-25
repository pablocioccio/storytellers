import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { SpinnerService } from './spinner.service';
import { SpinnerState } from './spinner-state';

@Component({
  selector: 'app-spinner',
  templateUrl: './spinner.component.html',
  styleUrls: ['./spinner.component.scss']
})
export class SpinnerComponent implements OnInit, OnDestroy {

  show = false;
  private subscription: Subscription;

  constructor(private spinnerService: SpinnerService) { }

  ngOnInit() {
    this.subscription = this.spinnerService.spinnerState
      .subscribe((state: SpinnerState) => {
        this.show = state.show;
      });
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

}
