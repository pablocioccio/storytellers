import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { AbstractControl, FormControl, FormGroup, ValidatorFn, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { NgbTooltip } from '@ng-bootstrap/ng-bootstrap';
import { Subscription } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { AuthenticationService } from 'src/app/authentication/authentication.service';
import { SpinnerService } from 'src/app/spinner/spinner.service';
import { GameService } from '../game.service';
import { Game } from '../model/game';

@Component({
  selector: 'app-play',
  templateUrl: './play.component.html',
  styleUrls: ['./play.component.scss']
})
export class PlayComponent implements OnInit, OnDestroy {

  game: Game;
  gameForm = new FormGroup({
    text: new FormControl('', [Validators.required, minWordsValidator(3)]),
    lastWords: new FormControl('', [Validators.required, minWordsValidator(1)]),
    lastWordsRange: new FormControl({ value: 1, disabled: true })
  });

  currentUserId: string;

  minLastWords = 1;
  maxLastWords = 1;

  postSubmitted = false;

  gameSubscription: Subscription;
  currentUserSubscription: Subscription;
  phrasePostSubscription: Subscription;
  textChangeSubscription: Subscription;
  lastWordsCountSubscription: Subscription;

  /* Since the form is loaded after the game is retrieved, we use a seter for the @ViewChild to make sure we access the tooltip
  when it's really available (ngAfterViewInit can't guarantee that). */
  @ViewChild('lastWordsContainerTooltip', { static: false }) set lastWordsContainerTooltip(tooltip: NgbTooltip) {
    if (tooltip && !this.postSubmitted) {
      tooltip.open();
      setTimeout(() => {
        tooltip.close();
      }, 3000);
    }
  }

  constructor(
    private route: ActivatedRoute, private router: Router, public auth: AuthenticationService,
    private gameService: GameService, private spinnerService: SpinnerService) { }

  ngOnInit() {
    // Retrieve current user profile
    this.currentUserSubscription = this.auth.userProfile$.subscribe((user) => {
      this.currentUserId = user.sub;
    });

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
      if (game.completed || this.currentUserId !== game.players[game.currentPhraseNumber % game.players.length]) {
        // The game is either finished or it's not the user's turn
        this.router.navigate(['/games/dashboard']);
      }
      this.game = game;
      this.spinnerService.hide();
    });

    this.textChangeSubscription = this.gameForm.get('text').valueChanges.subscribe((text: string) => {
      const lastWordsCount: number = this.gameForm.get('lastWordsRange').value;
      this.updateLastWords(text, lastWordsCount);
    });

    this.lastWordsCountSubscription = this.gameForm.get('lastWordsRange').valueChanges.subscribe((lastWordsCount: number) => {
      const text: string = this.gameForm.get('text').value;
      this.updateLastWords(text, lastWordsCount);
    });
  }

  updateLastWords(text: string, lastWordsCount: number) {
    const words: string[] = text.split(' ').filter(word => word.length > 0);
    this.gameForm.get('lastWords').setValue(words.slice(-lastWordsCount).join(' '));
    this.maxLastWords = words.length ? Math.ceil(words.length / 3) : 1; // Keep maxLastWords to a third of the actual text
    const lastWordsRangeForm = this.gameForm.get('lastWordsRange');
    if (lastWordsCount > this.maxLastWords) { lastWordsRangeForm.setValue(this.maxLastWords); }
    if (lastWordsRangeForm.disabled && this.minLastWords !== this.maxLastWords) { lastWordsRangeForm.enable(); }
    if (lastWordsRangeForm.enabled && this.minLastWords === this.maxLastWords) { lastWordsRangeForm.disable(); }
  }

  onSubmit() {
    this.postSubmitted = true;

    // TODO: validate model
    this.phrasePostSubscription = this.gameService.postPhrase(
      this.game.id,
      this.gameForm.get('text').value,
      this.gameForm.get('lastWords').value)
      .subscribe(
        (data) => {
          console.log(data);
          this.router.navigate(['/games/dahsboard']);
        }, (error) => {
          console.log(error);
          this.postSubmitted = false;
        });
  }

  ngOnDestroy() {
    this.gameSubscription.unsubscribe();
    this.textChangeSubscription.unsubscribe();
    this.currentUserSubscription.unsubscribe();
    this.lastWordsCountSubscription.unsubscribe();
    if (this.phrasePostSubscription) { this.phrasePostSubscription.unsubscribe(); }
  }

}

export function minWordsValidator(minWords: number): ValidatorFn {
  return (control: AbstractControl): { [key: string]: any } | null => {
    const wordCount: number = control.value.split(' ').filter(word => word.length > 0).length;
    return wordCount < minWords ? { minWords: { required: minWords, current: wordCount } } : null;
  };
}
