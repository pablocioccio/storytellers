import { Component, OnDestroy, OnInit } from '@angular/core';
import { AbstractControl, FormControl, ValidatorFn, Validators } from '@angular/forms';
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
  players: string[] = []; // List of players' emails

  title = new FormControl(null, [notBlank()]);
  description = new FormControl(null, []);
  email = new FormControl(null, [Validators.email]);
  numberOfRounds = new FormControl(this.MIN_ROUNDS, [Validators.min(this.MIN_ROUNDS), Validators.max(this.MAX_ROUNDS)]);

  errorMessage: string; // Error message used for alerts
  private errorSubject = new Subject<string>();

  // We create a base subscription and use it to add children subscriptions
  subscription: Subscription = new Subscription();

  gameCreationSubmitted = false;

  constructor(public auth: AuthenticationService, private gameService: GameService, private router: Router) { }

  ngOnInit() {
    // Get the current user
    this.subscription.add(this.auth.userProfile$.subscribe((user: any) => {
      this.currentUser = { user_id: user.sub, name: user.name, email: user.email, picture: user.picture };
    }));
    // Subscribe to the error subject, so that the error message is updated every time it emits a value
    this.subscription.add(this.errorSubject.subscribe((message) => this.errorMessage = message));
    // Subscribe again to the error subject, but adding a 10000 ms delay before the previous error message is cleared
    this.subscription.add(
      this.errorSubject.pipe(
        debounceTime(10000)
      ).subscribe(() => this.errorMessage = null)
    );
  }

  addPlayer() {
    // Clear any previous error messages
    this.errorMessage = null;

    if (this.email.invalid) {
      return this.errorSubject.next(`Invalid email address.`);
    }

    if (!this.email.value || !this.email.value.trim()) {
      return this.errorSubject.next(`Email address cannot be blank.`);
    }

    if (this.currentUser.email === this.email.value.trim()) {
      return this.errorSubject.next(`That's your own email address!`);
    }

    if (this.players.find((value) => this.email.value.trim() === value)) {
      return this.errorSubject.next(`Email '${this.email.value}' was already added.`);
    }

    this.players.push(this.email.value.trim());
    this.email.reset();
  }

  removePlayer(playerEmail: string) {
    this.players.splice(this.players.findIndex((value) => playerEmail === value), 1);
  }

  createGame() {
    this.gameCreationSubmitted = true;
    this.subscription.add(
      this.gameService.createGame(
        this.players, this.numberOfRounds.value, this.title.value.trim(), this.description.value
      ).subscribe((data) => {
        if (data && data.id) {
          this.router.navigate([`/games/${data.id}`]);
        } else {
          this.router.navigate(['/games/dashboard']);
        }
      }, (error) => {
        this.errorMessage = null;
        this.errorSubject.next(error.message ? error.message : 'There was a problem creating the game.');
        this.gameCreationSubmitted = false;
      })
    );
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

}

export function notBlank(): ValidatorFn {
  return (control: AbstractControl): { [key: string]: any } | null => {
    return control.value && control.value.trim() ? null : {
      notBlank: { valid: false }
    };
  };
}
