import { Component, OnDestroy, OnInit, Renderer2 } from '@angular/core';
import { ActivatedRoute, ParamMap, Router } from '@angular/router';
import { Channel } from 'pusher-js';
import { combineLatest, Observable, Subscription } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { AuthenticationService } from 'src/app/authentication/authentication.service';
import { SpinnerService } from 'src/app/spinner/spinner.service';
import { User } from 'src/app/users/model/user';
import { UserService } from 'src/app/users/user.service';
import { GameService } from '../game.service';
import { Game } from '../model/game';

@Component({
  selector: 'app-view',
  templateUrl: './view.component.html',
  styleUrls: ['./view.component.scss']
})
export class ViewComponent implements OnInit, OnDestroy {

  game: Game;
  errorMessage: string;
  pusherChannel: Channel;
  invitationWithdrawn: string[] = [];
  subscription: Subscription = new Subscription();

  constructor(
    private route: ActivatedRoute, public auth: AuthenticationService, private spinnerService: SpinnerService,
    private renderer: Renderer2, private router: Router, private gameService: GameService, private userService: UserService) { }

  ngOnInit() {
    /* The combineLatest() operator combines multiple observables into a single one. Every time one of the inner observables
     * emits a value, the combined observable will emit the latest value emitted by each of the inner observables.
     * It will only start emitting values once all of the inner observables have emitted at least once. */
    const userAndParams$: Observable<[any, ParamMap]> = combineLatest([this.auth.userProfile$, this.route.paramMap]);
    /* Retrieve the game and subscribe to events every time the userId or the gameId param changes */
    const game$ = userAndParams$.pipe(
      switchMap(values => {
        const userId: string = values[0].sub.replace('|', ''); // Pipes are not supported in pusher channel names
        const gameId: string = values[1].get('id');
        // Remove handlers from existing pusher channel (if any)
        if (this.pusherChannel) { this.pusherChannel.unbind(); }
        // Subscribe to a pusher channel for this specific user
        this.pusherChannel = this.userService.getPusherInstance().subscribe(userId);
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
    // Clear the error message (if any)
    this.errorMessage = undefined;
    // Retrieve the game that was passed by id
    return this.gameService.getGame(gameId);
  }

  subscribeToGameResponse(game$: Observable<Game>): Subscription {
    return game$.subscribe((game: Game) => {
      this.game = game;
      this.spinnerService.hide();
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

  getUserInfo(userId: string, users: User[]): User {
    return users.find((user) => user.user_id === userId);
  }

  addHighlight(playerNumber: number) {
    document.body.querySelectorAll(`.game-data-${playerNumber}`).forEach((element: Element) => {
      this.renderer.setStyle(element, 'border-radius', '0.25rem');
      switch (playerNumber % 5) {
        case 0:
          this.renderer.addClass(element, 'bg-warning');
          break;
        case 1:
          this.renderer.addClass(element, 'bg-success');
          this.renderer.addClass(element, 'text-white');
          break;
        case 2:
          this.renderer.addClass(element, 'bg-danger');
          this.renderer.addClass(element, 'text-white');
          break;
        case 3:
          this.renderer.addClass(element, 'bg-primary');
          this.renderer.addClass(element, 'text-white');
          break;
        case 4:
          this.renderer.addClass(element, 'bg-dark');
          this.renderer.addClass(element, 'text-white');
          break;
      }
    });
  }

  removeHighlight(playerNumber: string) {
    document.body.querySelectorAll(`.game-data-${playerNumber}`).forEach((element: Element) => {
      this.renderer.removeStyle(element, 'border-radius');
      this.renderer.removeClass(element, 'bg-success');
      this.renderer.removeClass(element, 'bg-danger');
      this.renderer.removeClass(element, 'bg-warning');
      this.renderer.removeClass(element, 'bg-primary');
      this.renderer.removeClass(element, 'bg-dark');
      this.renderer.removeClass(element, 'text-white');
    });
  }

  withdrawInvitation(invitationId: string) {
    this.invitationWithdrawn.push(invitationId);
    this.subscription.add(
      this.gameService.withdrawInvitation(this.game.id, invitationId).subscribe(() => {
        delete this.game.invitations[invitationId];
        if (!Object.keys(this.game.invitations).length) {
          if (this.game.players.length > 1) {
            this.router.navigate([`/games/${this.game.id}/play`]);
          } else {
            this.router.navigate(['/games/dashboard']);
          }
        }
      }, (error) => {
        this.invitationWithdrawn.splice(this.invitationWithdrawn.indexOf(invitationId), 1);
        this.errorMessage = error.message ? error.message : `There was a problem withdrawing the invitation`;
        setTimeout(() => this.errorMessage = null, 5000);
      })
    );
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
    if (this.pusherChannel) { this.pusherChannel.unbind(); }
  }

}
