import { Component, OnInit, OnDestroy, ViewChild, AfterViewInit } from '@angular/core';
import { FormControl, FormGroup, Validators, AbstractControl, ValidatorFn } from '@angular/forms';
import { Subscription, Observable } from 'rxjs';
import { NgbTooltip } from '@ng-bootstrap/ng-bootstrap';
import { GameService } from '../game.service';
import { ParamMap, ActivatedRoute } from '@angular/router';
import { switchMap } from 'rxjs/operators';
import { Game } from '../model/game';

@Component({
  selector: 'app-play',
  templateUrl: './play.component.html',
  styleUrls: ['./play.component.scss']
})
export class PlayComponent implements OnInit, AfterViewInit, OnDestroy {

  game$: Observable<Game>;

  @ViewChild('lastWordsContainer', { static: false }) public lastWordsContainerTooltip: NgbTooltip;

  minLastWords = 1;
  maxLastWords = 1;

  gameForm = new FormGroup({
    text: new FormControl('', [Validators.required, minWordsValidator(3)]),
    lastWords: new FormControl('', [Validators.required, minWordsValidator(1)]),
    lastWordsRange: new FormControl({ value: 1, disabled: true })
  });

  textChangeSubscription: Subscription;
  lastWordsCountSubscription: Subscription;

  constructor(private gameService: GameService, private route: ActivatedRoute) { }

  ngOnInit() {
    this.game$ = this.route.paramMap.pipe(
      switchMap((params: ParamMap) =>
        this.gameService.getGame(params.get('id')))
    );

    this.textChangeSubscription = this.gameForm.get('text').valueChanges.subscribe((text: string) => {
      const lastWordsCount: number = this.gameForm.get('lastWordsRange').value;
      this.updateLastWords(text, lastWordsCount);
    });

    this.lastWordsCountSubscription = this.gameForm.get('lastWordsRange').valueChanges.subscribe((lastWordsCount: number) => {
      const text: string = this.gameForm.get('text').value;
      this.updateLastWords(text, lastWordsCount);
    });
  }

  ngAfterViewInit() {
    this.lastWordsContainerTooltip.open();
    setTimeout(() => {
      this.lastWordsContainerTooltip.close();
    }, 3000);
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
    console.warn(this.gameForm.value);
  }

  ngOnDestroy() {
    this.textChangeSubscription.unsubscribe();
    this.lastWordsCountSubscription.unsubscribe();
  }

}

export function minWordsValidator(minWords: number): ValidatorFn {
  return (control: AbstractControl): { [key: string]: any } | null => {
    const wordCount: number = control.value.split(' ').filter(word => word.length > 0).length;
    return wordCount < minWords ? { minWords: { required: minWords, current: wordCount } } : null;
  };
}
