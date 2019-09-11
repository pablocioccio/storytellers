import { Component, OnInit } from '@angular/core';
import { User } from 'src/app/users/model/user';
import { Subject } from 'rxjs';
import { debounceTime } from 'rxjs/operators';

@Component({
  selector: 'app-game-create',
  templateUrl: './create.component.html',
  styleUrls: ['./create.component.scss']
})
export class CreateComponent implements OnInit {

  private MAX_USERS = 5;

  users: User[] = []; // List of selected users
  errorMessage: string; // Error message used for alerts
  private errorSubject = new Subject<string>();

  constructor() { }

  ngOnInit() {
    this.errorSubject.subscribe((message) => this.errorMessage = message);
    this.errorSubject.pipe(
      debounceTime(3000)
    ).subscribe(() => this.errorMessage = null);
  }

  userSelected(user: User) {
    // Clear any previos error messages
    this.errorMessage = null;

    // Use destructuring to unpack the "id" property of User
    if (this.users.find(({ user_id }) => user_id === user.user_id)) {
      return this.errorSubject.next(`User ${user.name} already added.`);
    }

    if (this.users.length === this.MAX_USERS) {
      return this.errorSubject.next(`Only ${this.MAX_USERS} users are allowed per game.`);
    }

    this.users.push(user);
  }

  removeUser(id: string) {
    this.users.splice(this.users.findIndex(({ user_id }) => id === user_id), 1);
  }

}
