import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { FirebaseService } from './firebase.service';

@Component({
  selector: 'app-firebase',
  templateUrl: './firebase.component.html',
  styleUrls: ['./firebase.component.scss']
})
export class FirebaseComponent implements OnInit, OnDestroy {
  responseJson: string;
  pingSub: Subscription;

  constructor(private api: FirebaseService) { }

  ngOnInit() {
  }

  pingApi() {
    this.pingSub = this.api.ping$().subscribe(
      res => this.responseJson = res
    );
  }

  ngOnDestroy() {
    if (this.pingSub) {
      this.pingSub.unsubscribe();
    }
  }

}
