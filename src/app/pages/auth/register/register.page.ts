import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService, UserProfile } from '../../../core/services/auth';
import { ToastController, LoadingController } from '@ionic/angular';

@Component({
  selector: 'app-register',
  standalone: false,
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.scss'],
})
export class RegisterPage {
  name: string = '';
  email: string = '';
  password: string = '';
  confirmPassword: string = '';
  role: UserProfile['role'] = 'client';

  constructor(
    private authService: AuthService,
    private toastCtrl: ToastController,
    private loadingCtrl: LoadingController,
    private router: Router
  ) {}

  async register(): Promise<void> {
    if (!this.name || !this.email || !this.password) {
      await this.showToast('Completa todos los campos');
      return;
    }
    if (this.password !== this.confirmPassword) {
      await this.showToast('Las contraseñas no coinciden');
      return;
    }
    if (this.password.length < 6) {
      await this.showToast('La contraseña debe tener al menos 6 caracteres');
      return;
    }
    const loading = await this.loadingCtrl.create({ message: 'Creando cuenta...' });
    await loading.present();
    try {
      await this.authService.register(this.email, this.password, this.name, this.role);
    } catch (e: any) {
      await this.showToast(this.getErrorMessage(e.code));
    } finally {
      await loading.dismiss();
    }
  }

  goToLogin(): void {
    this.router.navigate(['/login']);
  }

  private async showToast(msg: string): Promise<void> {
    const t = await this.toastCtrl.create({
      message: msg, duration: 2500, color: 'danger', position: 'top'
    });
    await t.present();
  }

  private getErrorMessage(code: string): string {
    switch (code) {
      case 'auth/email-already-in-use': return 'El correo ya está registrado';
      case 'auth/invalid-email':        return 'Correo inválido';
      case 'auth/weak-password':        return 'Contraseña muy débil';
      default: return 'Error al crear la cuenta';
    }
  }
}