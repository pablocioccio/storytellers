import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { AuthenticationService } from 'src/app/authentication/authentication.service';
import { SpinnerService } from 'src/app/spinner/spinner.service';
import { GameService } from '../game.service';
import { Game } from '../model/game';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {

  games: Game[];
  currentUserId: string;
  gamesSubscription: Subscription;
  currentUserSubscription: Subscription;

  constructor(
    private gameService: GameService, private spinnerService: SpinnerService,
    public auth: AuthenticationService, private router: Router) { }

  ngOnInit() {
    this.spinnerService.show();
    // Retrieve games
    this.gamesSubscription = this.gameService.listGames().subscribe((games: Game[]) => {
      if (!games.length) { this.router.navigate(['/games/create']); }
      this.games = games;
      this.spinnerService.hide();
    });
    // Retrieve current user profile
    this.currentUserSubscription = this.auth.userProfile$.subscribe((user) => {
      this.currentUserId = user.sub;
    });
  }

  calculateProgressBarColor(index: number) {
    switch (index % 5) {
      case 0:
        return 'success';
      case 1:
        return 'danger';
      case 2:
        return 'primary';
      case 3:
        return 'warning';
      case 4:
        return 'dark';
    }
  }

  OnDestroy() {
    this.gamesSubscription.unsubscribe();
    this.currentUserSubscription.unsubscribe();
  }

}
