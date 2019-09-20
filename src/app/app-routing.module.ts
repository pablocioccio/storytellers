import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from './authentication/authentication.guard';
import { CallbackComponent } from './authentication/callback/callback.component';
import { FirebaseComponent } from './firebase/firebase.component';
import { CreateComponent } from './games/create/create.component';
import { ProfileComponent } from './profile/profile.component';
import { WelcomeComponent } from './welcome/welcome.component';
import { PlayComponent } from './games/play/play.component';

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
    path: 'firebase-api',
    component: FirebaseComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'games/create',
    component: CreateComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'games/play',
    component: PlayComponent
  },
  {
    path: 'welcome',
    component: WelcomeComponent
  },
  {
    path: '',
    redirectTo: '/welcome',
    pathMatch: 'full'
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
