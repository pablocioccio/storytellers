import { Component, OnDestroy, OnInit, Renderer2 } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { AuthenticationService } from 'src/app/authentication/authentication.service';
import { SpinnerService } from 'src/app/spinner/spinner.service';
import { User } from 'src/app/users/model/user';
import { GameService } from '../game.service';
import { Game } from '../model/game';

@Component({
  selector: 'app-view',
  templateUrl: './view.component.html',
  styleUrls: ['./view.component.scss']
})
export class ViewComponent implements OnInit, OnDestroy {

  game: Game;
  gameSubscription: Subscription;

  constructor(
    private route: ActivatedRoute, public auth: AuthenticationService, private renderer: Renderer2,
    private gameService: GameService, private spinnerService: SpinnerService) { }

  ngOnInit() {
    this.gameSubscription = this.route.paramMap.pipe(
      switchMap(params => {
        // Show spinner
        this.spinnerService.show();
        // Clear the existing game (if any)
        this.game = undefined;
        // Retrieve the game that was passed by id
        return this.gameService.getGame(params.get('id'));
      })
    ).subscribe((game: Game) => {
      this.game = game;
      this.spinnerService.hide();
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

  ngOnDestroy() {
    this.gameSubscription.unsubscribe();
  }

}
