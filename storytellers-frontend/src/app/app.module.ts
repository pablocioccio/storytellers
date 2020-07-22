import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { CallbackComponent } from './authentication/callback/callback.component';
import { InterceptorService } from './authentication/interceptor.service';
import { FirebaseComponent } from './firebase/firebase.component';
import { CreateComponent } from './games/create/create.component';
import { DashboardComponent } from './games/dashboard/dashboard.component';
import { PlayComponent } from './games/play/play.component';
import { ViewComponent } from './games/view/view.component';
import { NavbarComponent } from './navbar/navbar.component';
import { ProfileComponent } from './profile/profile.component';
import { SpinnerComponent } from './spinner/spinner.component';
import { WelcomeComponent } from './welcome/welcome.component';
import { ServiceWorkerModule } from '@angular/service-worker';
import { environment } from '../environments/environment';
import { UpdateComponent } from './service-worker/update/update.component';
import { InvitationComponent } from './games/invitation/invitation.component';

@NgModule({
  declarations: [
    AppComponent,
    NavbarComponent,
    CallbackComponent,
    ProfileComponent,
    FirebaseComponent,
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
