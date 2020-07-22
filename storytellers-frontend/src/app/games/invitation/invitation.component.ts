import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { SpinnerService } from 'src/app/spinner/spinner.service';
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
  responseStatus: string;

  // We create a base subscription and use it to add children subscriptions
  subscription: Subscription = new Subscription();

  constructor(
    private route: ActivatedRoute, private gameService: GameService,
    private router: Router, private spinnerService: SpinnerService) { }

  ngOnInit() {
    this.subscription.add(
      this.route.paramMap.pipe(
        switchMap(params => {
          // Show spinner
          this.spinnerService.show();
          // Clear the existing game (if any)
          this.game = undefined;
          // Clear the existing invitation id (if any)
          this.invitationId = undefined;
          // Clear the existing error message (if any)
          this.errorMessage = undefined;
          // Set the invitation id
          this.invitationId = params.get('invitationId');
          // Retrieve the game that was passed by id
          return this.gameService.getGame(params.get('gameId'));
        })
      ).subscribe((game: Game) => {
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
      })
    );
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
        this.errorMessage = error.message ? error.message : 'There was problem rejecting the invitation';
        setTimeout(() => this.errorMessage = null, 5000);
        this.responseStatus = null;
      })
    );
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

}
