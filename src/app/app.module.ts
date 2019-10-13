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
import { SearchComponent } from './users/search/search.component';
import { WelcomeComponent } from './welcome/welcome.component';
import { ServiceWorkerModule } from '@angular/service-worker';
import { environment } from '../environments/environment';


@NgModule({
  declarations: [
    AppComponent,
    NavbarComponent,
    CallbackComponent,
    ProfileComponent,
    FirebaseComponent,
    SearchComponent,
    CreateComponent,
    WelcomeComponent,
    PlayComponent,
    SpinnerComponent,
    ViewComponent,
    DashboardComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    FormsModule,
    NgbModule,
    ReactiveFormsModule,
    ServiceWorkerModule.register('ngsw-worker.js', { enabled: environment.production })
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
