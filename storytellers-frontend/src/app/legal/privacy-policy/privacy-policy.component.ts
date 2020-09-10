import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-privacy-policy',
  templateUrl: './privacy-policy.component.html',
  styleUrls: ['./privacy-policy.component.scss']
})
export class PrivacyPolicyComponent implements OnInit {

  constructor() { }

  ngOnInit() {
  }

  navigateTo(fragment: string) {
    const fragmentElement: HTMLElement = document.body.querySelector(`#${fragment}`);
    if (fragmentElement) { fragmentElement.scrollIntoView(); }
  }

}
