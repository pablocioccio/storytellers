import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError, debounceTime, distinctUntilChanged, switchMap, tap } from 'rxjs/operators';
import { User } from '../model/user';
import { UserService } from '../user.service';

@Component({
  selector: 'app-user-search',
  templateUrl: './search.component.html',
  styleUrls: ['./search.component.scss']
})
export class SearchComponent implements OnInit {

  @Output() selectUser: EventEmitter<User> = new EventEmitter();

  model: any;
  searching = false;
  searchFailed = false;

  constructor(private userService: UserService) { }

  ngOnInit() {
  }

  search = (text$: Observable<string>) =>
    text$.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      tap(() => this.searching = true),
      switchMap(term =>
        this.userService.search(term).pipe(
          tap(() => this.searchFailed = false),
          catchError(() => {
            this.searchFailed = true;
            return of([]);
          }))
      ),
      tap(() => this.searching = false)
    )


  userInputFormatter(user: User) {
    return user.name;
  }

  userSelected(event: { item: User, preventDefault: () => void }) {
    // Emit an event with the selected user
    this.selectUser.emit(event.item);
    /* Prevent selection from happening, so that we can clear the input
     and avoid the asynchronous call that would populate it back again */
    event.preventDefault();
    this.model = null;
  }

}
