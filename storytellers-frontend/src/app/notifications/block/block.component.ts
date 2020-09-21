import { HttpBackend, HttpClient } from '@angular/common/http';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, ParamMap, Router } from '@angular/router';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-block',
  templateUrl: './block.component.html',
  styleUrls: ['./block.component.scss']
})
export class BlockComponent implements OnInit, OnDestroy {

  id: string;
  errorMessage: string;
  responseStatus: string;
  subscription: Subscription = new Subscription();
  private http: HttpClient;

  constructor(private route: ActivatedRoute, private router: Router, handler: HttpBackend) {
    // Use HttlBackend to prevent the request from being intercepted by the interceptor service
    this.http = new HttpClient(handler);
  }

  ngOnInit() {
    this.subscription.add(
      this.route.paramMap.subscribe((params: ParamMap) => {
        this.id = params.get('id');
        this.errorMessage = null;
        this.responseStatus = null;
      })
    );
  }

  accept() {
    this.responseStatus = 'yes';
    this.subscription.add(
      this.http.post(`/api/notifications/${this.id}/block`, {})
        .subscribe(() => {
          this.errorMessage = null;
          this.responseStatus = null;
          this.router.navigate(['welcome']);
        }, () => {
          this.responseStatus = null;
          this.errorMessage = 'There was problem unsubscribing from email notifications';
          setTimeout(() => this.errorMessage = null, 10000);
        })
    );
  }

  reject() {
    this.router.navigate(['welcome']);
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

}
