import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { ServiceWorkerModule } from '@angular/service-worker';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { environment } from '../environments/environment';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { CallbackComponent } from './authentication/callback/callback.component';
import { InterceptorService } from './authentication/interceptor.service';
import { CreateComponent } from './games/create/create.component';
import { DashboardComponent } from './games/dashboard/dashboard.component';
import { InvitationComponent } from './games/invitation/invitation.component';
import { PlayComponent } from './games/play/play.component';
import { ViewComponent } from './games/view/view.component';
import { NavbarComponent } from './navbar/navbar.component';
import { ProfileComponent } from './profile/profile.component';
import { UpdateComponent } from './service-worker/update/update.component';
import { SpinnerComponent } from './spinner/spinner.component';
import { WelcomeComponent } from './welcome/welcome.component';

@NgModule({
  declarations: [
    AppComponent,
    NavbarComponent,
    CallbackComponent,
    ProfileComponent,
    CreateComponent,
    WelcomeComponent,
    PlayComponent,
    SpinnerComponent,
    ViewComponent,
    DashboardComponent,
    UpdateComponent,
    InvitationComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    FormsModule,
    NgbModule,
    ReactiveFormsModule,
    ServiceWorkerModule.register('custom-ngsw-worker.js', { enabled: environment.production })
  ],
  providers: [
    {
      provide: HTTP_INTERCEPTORS,
      useClass: InterceptorService,
      multi: true
    }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
