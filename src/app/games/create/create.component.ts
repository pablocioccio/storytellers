import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, Subscription } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { AuthenticationService } from 'src/app/authentication/authentication.service';
import { User } from 'src/app/users/model/user';
import { GameService } from '../game.service';

@Component({
  selector: 'app-game-create',
  templateUrl: './create.component.html',
  styleUrls: ['./create.component.scss']
})
export class CreateComponent implements OnInit, OnDestroy {

  MAX_PLAYERS = 4; // Without considering the current user
  MIN_ROUNDS = 3;
  MAX_ROUNDS = 20;

  currentUser: User; // The current user is always part of the game
  users: User[] = []; // List of selected users
  numberOfRounds = new FormControl(this.MIN_ROUNDS);


  errorMessage: string; // Error message used for alerts
  private errorSubject = new Subject<string>();

  currentUserSubscription: Subscription;
  gameCreationSubscription: Subscription;

  gameCreationSubmitted = false;

  constructor(public auth: AuthenticationService, private gameService: GameService, private router: Router) { }

  ngOnInit() {
    this.errorSubject.subscribe((message) => this.errorMessage = message);
    this.errorSubject.pipe(
      debounceTime(3000)
    ).subscribe(() => this.errorMessage = null);
    this.currentUserSubscription = this.auth.userProfile$.subscribe((user: any) => {
      this.currentUser = { user_id: user.sub, name: user.name, email: user.email, picture: user.picture };
    });
  }

  userSelected(user: User) {
    // Clear any previous error messages
    this.errorMessage = null;

    // Use destructuring to unpack the "id" property of User
    if (this.currentUser.user_id === user.user_id || this.users.find(({ user_id }) => user_id === user.user_id)) {
      return this.errorSubject.next(`Player '${user.name}' was already added.`);
    }

    if (this.users.length === this.MAX_PLAYERS) {
      return this.errorSubject.next(`Only ${this.MAX_PLAYERS + 1} players are allowed per game.`);
    }

    this.users.push(user);
  }

  removeUser(id: string) {
    this.users.splice(this.users.findIndex(({ user_id }) => id === user_id), 1);
  }

  createGame() {
    this.gameCreationSubmitted = true;

    // TODO: validate model
    this.gameCreationSubscription = this.gameService.createGame([this.currentUser, ...this.users], this.numberOfRounds.value).subscribe(
      (data) => {
        console.log(data);
        this.router.navigate(['/welcome']);
      },
      (error) => {
        // Clear any previous error messages
        console.log(error);
        this.errorMessage = null;
        this.errorSubject.next('There was an error creating the game.');
        this.gameCreationSubmitted = false;
      });
  }

  ngOnDestroy() {
    this.currentUserSubscription.unsubscribe();
    if (this.gameCreationSubscription) { this.gameCreationSubscription.unsubscribe(); }
  }

}
