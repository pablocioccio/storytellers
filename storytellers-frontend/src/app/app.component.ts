import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'Storytellers';
  swUpdateAvailable = false;

  blurBackground(value: boolean) {
    this.swUpdateAvailable = value;
  }

}
