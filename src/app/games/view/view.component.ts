import { Component, OnDestroy, OnInit, Renderer2 } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { SpinnerService } from 'src/app/spinner/spinner.service';
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
    private route: ActivatedRoute, private renderer: Renderer2,
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

  addHighlight(playerNumber: string) {
    document.body.querySelectorAll(`.game-data-${playerNumber}`).forEach((element: Element) => {
      this.renderer.addClass(element, 'bg-warning');
    });
  }

  removeHighlight(playerNumber: string) {
    document.body.querySelectorAll(`.game-data-${playerNumber}`).forEach((element: Element) => {
      this.renderer.removeClass(element, 'bg-warning');
    });
  }

  ngOnDestroy() {
    this.gameSubscription.unsubscribe();
  }

}
