import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from './authentication/authentication.guard';
import { CallbackComponent } from './authentication/callback/callback.component';
import { CreateComponent } from './games/create/create.component';
import { DashboardComponent } from './games/dashboard/dashboard.component';
import { InvitationComponent } from './games/invitation/invitation.component';
import { PlayComponent } from './games/play/play.component';
import { ViewComponent } from './games/view/view.component';
import { PrivacyPolicyComponent } from './legal/privacy-policy/privacy-policy.component';
import { ProfileComponent } from './profile/profile.component';
import { WelcomeComponent } from './welcome/welcome.component';

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
    path: 'games/dashboard',
    component: DashboardComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'games/create',
    component: CreateComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'games/:id',
    component: ViewComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'games/:id/play',
    component: PlayComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'games/:gameId/invitation/:invitationId',
    component: InvitationComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'welcome',
    component: WelcomeComponent
  },
  {
    path: 'legal/privacy-policy',
    component: PrivacyPolicyComponent
  },
  {
    path: '',
    redirectTo: '/welcome',
    pathMatch: 'full'
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes, {
    scrollPositionRestoration: 'enabled'
  })],
  exports: [RouterModule]
})
export class AppRoutingModule { }
