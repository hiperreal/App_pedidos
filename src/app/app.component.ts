import { Component, OnInit } from '@angular/core';
import { GoogleAuth } from '@codetrix-studio/capacitor-google-auth';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  standalone: false,
})
export class AppComponent implements OnInit {
  constructor() {}

  ngOnInit() {
    GoogleAuth.initialize({
      clientId: '413328046854-s5f9rkffteev8g42rl516sb43fp71klt.apps.googleusercontent.com',
      scopes: ['profile', 'email'],
      grantOfflineAccess: true
    });
  }
}