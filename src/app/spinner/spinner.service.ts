import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { SpinnerState } from './spinner-state';

@Injectable({
  providedIn: 'root'
})
export class SpinnerService {

  private spinnerSubject = new Subject<SpinnerState>();
  spinnerState = this.spinnerSubject.asObservable();

  constructor() { }

  show() {
    this.spinnerSubject.next({ show: true } as SpinnerState);
  }

  hide() {
    this.spinnerSubject.next({ show: false } as SpinnerState);
  }

}
