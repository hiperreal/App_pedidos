import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { getAuth } from 'firebase/auth';

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {
  constructor(private router: Router) {}

  async canActivate(): Promise<boolean> {
    const auth = getAuth();
    await auth.authStateReady();
    const user = auth.currentUser;
    if (user) return true;
    this.router.navigate(['/login']);
    return false;
  }
}