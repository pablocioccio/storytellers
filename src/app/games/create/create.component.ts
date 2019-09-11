import { Component, OnInit } from '@angular/core';
import { User } from 'src/app/users/model/user';

@Component({
  selector: 'app-game-create',
  templateUrl: './create.component.html',
  styleUrls: ['./create.component.scss']
})
export class CreateComponent implements OnInit {

  users: User[] = [];

  constructor() { }

  ngOnInit() {
  }

  userSelected(user: User) {
    // Use destructuring to unpack the "id" property of User
    if (!this.users.find(({ user_id }) => user_id === user.user_id)) {
      this.users.push(user);
    }
  }

  removeUser(id: string) {
    this.users.splice(this.users.findIndex(({ user_id }) => id === user_id), 1);
  }

}
