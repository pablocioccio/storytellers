import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, ParamMap, Router } from '@angular/router';
import { Channel } from 'pusher-js';
import { combineLatest, Observable, Subscription } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { AuthenticationService } from 'src/app/authentication/authentication.service';
import { SpinnerService } from 'src/app/spinner/spinner.service';
import { UserService } from 'src/app/users/user.service';
import { GameService } from '../game.service';
import { Game } from '../model/game';

@Component({
  selector: 'app-invitation',
  templateUrl: './invitation.component.html',
  styleUrls: ['./invitation.component.scss']
})
export class InvitationComponent implements OnInit, OnDestroy {

  game: Game;
  invitationId: string;
  errorMessage: string;
  pusherChannel: Channel;
  responseStatus: string;

  // We create a base subscription and use it to add children subscriptions
  subscription: Subscription = new Subscription();

  constructor(
    private route: ActivatedRoute, private auth: AuthenticationService, private gameService: GameService,
    private router: Router, private userService: UserService, private spinnerService: SpinnerService) { }

  ngOnInit() {
    /* The combineLatest() operator combines multiple observables into a single one. Every time one of the inner observables
     * emits a value, the combined observable will emit the latest value emitted by each of the inner observables.
     * It will only start emitting values once all of the inner observables have emitted at least once. */
    const userAndParams$: Observable<[any, ParamMap]> = combineLatest([this.auth.userProfile$, this.route.paramMap]);
    /* Retrieve the game and subscribe to events every time the email, the gameId or the invitationId changes */
    const game$ = userAndParams$.pipe(
      switchMap(values => {
        const email: string = values[0].email;
        const gameId: string = values[1].get('gameId');
        // Set the invitation id
        this.invitationId = values[1].get('invitationId');
        // Remove handlers from existing pusher channel (if any)
        if (this.pusherChannel) { this.pusherChannel.unbind(); }
        // Subscribe to a pusher channel for this specific email address
        this.pusherChannel = this.userService.getPusherInstance().subscribe(email);
        // Listen to events for this specific game
        this.subscribeToGameEvents(gameId);
        // Get and return the game observable
        return this.getGame(gameId);
      })
    );
    // Subscribe to game response and store the subscription
    this.subscription.add(this.subscribeToGameResponse(game$));
  }

  getGame(gameId: string): Observable<Game> {
    // Show spinner
    this.spinnerService.show();
    // Clear the existing game (if any)
    this.game = undefined;
    // Clear the existing error message (if any)
    this.errorMessage = undefined;
    // Retrieve the game that was passed by id
    return this.gameService.getGame(gameId);
  }

  subscribeToGameResponse(game$: Observable<Game>): Subscription {
    return game$.subscribe((game: Game) => {
      this.spinnerService.hide();
      /* The backend will not check the invitation id. That means that it will return the
        game as long as the user is a confirmed player or if their email address is part
        of the invitations lists. However, we need to accept/reject the invitation by sending
        its id to the server, so we will check that the one passed by parameter exists here. */
      if (!game.invitations || !Object.keys(game.invitations).includes(this.invitationId)) {
        this.errorMessage = 'The invitation does not exist';
        this.invitationId = undefined;
        return;
      }
      this.game = game;
    }, (error) => {
      this.spinnerService.hide();
      this.errorMessage = error.message ? error.message : 'There was a problem retrieving the game';
    });
  }

  subscribeToGameEvents(gameId: string) {
    this.pusherChannel.bind(gameId, (eventData: 'GAME_UPDATED' | 'GAME_DELETED') => {
      switch (eventData) {
        case 'GAME_UPDATED':
          const game$ = this.getGame(gameId);
          const sub = this.subscribeToGameResponse(game$);
          this.subscription.add(sub);
          break;
        case 'GAME_DELETED':
          this.router.navigate(['/games/dashboard']);
          break;
        default:
          console.log(`Unknown pusher event: ${eventData}`);
          break;
      }
    });
  }

  accept() {
    this.responseStatus = 'accepted';
    this.subscription.add(
      this.gameService.acceptInvitation(this.game.id, this.invitationId).subscribe(() => {
        this.router.navigate([`/games/${this.game.id}`]);
      }, (error) => {
        this.errorMessage = error.message ? error.message : 'There was problem accepting the invitation';
        setTimeout(() => this.errorMessage = null, 5000);
        this.responseStatus = null;
      })
    );
  }

  reject() {
    this.responseStatus = 'rejected';
    this.subscription.add(
      this.gameService.rejectInvitation(this.game.id, this.invitationId).subscribe(() => {
        this.router.navigate(['/games/dashboard']);
      }, (error) => {
        this.errorMessage = error.message ? error.message : 'There was a problem rejecting the invitation';
        setTimeout(() => this.errorMessage = null, 5000);
        this.responseStatus = null;
      })
    );
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
    if (this.pusherChannel) { this.pusherChannel.unbind(); }
  }

}
