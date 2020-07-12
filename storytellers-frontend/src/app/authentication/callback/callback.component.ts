import { Component, OnInit, OnDestroy } from '@angular/core';
import { AuthenticationService } from '../authentication.service';
import { SpinnerService } from '../../spinner/spinner.service';

@Component({
  selector: 'app-callback',
  templateUrl: './callback.component.html',
  styleUrls: ['./callback.component.scss']
})
export class CallbackComponent implements OnInit, OnDestroy {

  constructor(private auth: AuthenticationService, private spinnerService: SpinnerService) { }

  ngOnInit() {
    this.spinnerService.show();
    this.auth.handleAuthCallback();
  }

  ngOnDestroy() {
    this.spinnerService.hide();
  }

}
