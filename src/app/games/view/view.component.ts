import { Component, OnDestroy, OnInit, Renderer2 } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
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
    private route: ActivatedRoute, private router: Router, private renderer: Renderer2,
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
      if (!game.completed) { this.router.navigate(['/games/dashboard']); }
      this.game = game;
      this.spinnerService.hide();
    });
  }

  addHighlight(playerNumber: number) {
    document.body.querySelectorAll(`.game-data-${playerNumber}`).forEach((element: Element) => {
      this.renderer.addClass(element, 'badge');
      switch (playerNumber % 5) {
        case 0:
          this.renderer.addClass(element, 'badge-success');
          break;
        case 1:
          this.renderer.addClass(element, 'badge-danger');
          break;
        case 2:
          this.renderer.addClass(element, 'badge-primary');
          break;
        case 3:
          this.renderer.addClass(element, 'badge-warning');
          break;
        case 4:
          this.renderer.addClass(element, 'badge-dark');
          break;
      }
    });
  }

  removeHighlight(playerNumber: string) {
    document.body.querySelectorAll(`.game-data-${playerNumber}`).forEach((element: Element) => {
      this.renderer.removeClass(element, 'badge');
      this.renderer.removeClass(element, 'badge-success');
      this.renderer.removeClass(element, 'badge-danger');
      this.renderer.removeClass(element, 'badge-warning');
      this.renderer.removeClass(element, 'badge-primary');
      this.renderer.removeClass(element, 'badge-dark');
    });
  }

  ngOnDestroy() {
    this.gameSubscription.unsubscribe();
  }

}
