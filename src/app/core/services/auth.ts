import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithCredential,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  User
} from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc } from 'firebase/firestore';
import { GoogleAuth } from '@codetrix-studio/capacitor-google-auth';

export interface UserProfile {
  uid: string;
  email: string;
  name: string;
  role: 'client' | 'restaurant' | 'delivery' | 'admin';
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private auth = getAuth();
  private db   = getFirestore();
  currentUser: UserProfile | null = null;
  private explicitLogin = false;

  constructor(private router: Router) {
    onAuthStateChanged(this.auth, async (user) => {
      if (user) {
        this.currentUser = await this.getUserProfile(user.uid);
        if (this.explicitLogin) {
          this.explicitLogin = false;
          this.redirectByRole(this.currentUser?.role);
        }
      } else {
        this.currentUser = null;
      }
    });
  }

  async register(email: string, password: string, name: string, role: UserProfile['role']): Promise<void> {
    const cred = await createUserWithEmailAndPassword(this.auth, email, password);
    const profile: UserProfile = { uid: cred.user.uid, email, name, role };
    await setDoc(doc(this.db, 'users', cred.user.uid), profile);
    this.currentUser = profile;
    this.redirectByRole(role);
  }

  async login(email: string, password: string): Promise<void> {
    this.explicitLogin = true;
    const cred = await signInWithEmailAndPassword(this.auth, email, password);
    this.currentUser = await this.getUserProfile(cred.user.uid);
    this.redirectByRole(this.currentUser?.role);
  }

  async loginWithGoogle(): Promise<void> {
    this.explicitLogin = true;
    const googleUser = await GoogleAuth.signIn();
    const credential = GoogleAuthProvider.credential(
      googleUser.authentication.idToken
    );
    const cred = await signInWithCredential(this.auth, credential);
    const existing = await this.getUserProfile(cred.user.uid);
    if (!existing) {
      const profile: UserProfile = {
        uid: cred.user.uid,
        email: cred.user.email || '',
        name: cred.user.displayName || '',
        role: 'client'
      };
      await setDoc(doc(this.db, 'users', cred.user.uid), profile);
      this.currentUser = profile;
    } else {
      this.currentUser = existing;
    }
    this.redirectByRole(this.currentUser?.role);
  }

  async logout(): Promise<void> {
    await signOut(this.auth);
    this.currentUser = null;
    this.router.navigate(['/login']);
  }

  private async getUserProfile(uid: string): Promise<UserProfile | null> {
    const snap = await getDoc(doc(this.db, 'users', uid));
    return snap.exists() ? (snap.data() as UserProfile) : null;
  }

  redirectByRole(role?: string): void {
    switch (role) {
      case 'client':     this.router.navigate(['/client/home']); break;
      case 'restaurant': this.router.navigate(['/restaurant/kds']); break;
      case 'delivery':   this.router.navigate(['/delivery/my-deliveries']); break;
      case 'admin':      this.router.navigate(['/admin/dashboard']); break;
      default:           this.router.navigate(['/login']); break;
    }
  }
}