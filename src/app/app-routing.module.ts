import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from './authentication/authentication.guard';
import { CallbackComponent } from './authentication/callback/callback.component';
import { FirebaseComponent } from './firebase/firebase.component';
import { CreateComponent } from './games/create/create.component';
import { ProfileComponent } from './profile/profile.component';

const routes: Routes = [
  {
    path: 'callback',
    component: CallbackComponent
  },
  {
    path: 'profile',
    component: ProfileComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'games/create',
    component: CreateComponent
  },
  {
    path: 'firebase-api',
    component: FirebaseComponent,
    canActivate: [AuthGuard]
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
