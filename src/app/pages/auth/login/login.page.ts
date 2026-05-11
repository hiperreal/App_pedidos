import { Component } from '@angular/core';
import { AuthService } from '../../../core/services/auth';
import { ToastController, LoadingController } from '@ionic/angular';

@Component({
  selector: 'app-login',
  standalone: false,
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
})
export class LoginPage {
  email: string = '';
  password: string = '';

  constructor(
    private authService: AuthService,
    private toastCtrl: ToastController,
    private loadingCtrl: LoadingController
  ) {}

  async login(): Promise<void> {
    if (!this.email || !this.password) {
      await this.showToast('Completa todos los campos');
      return;
    }
    const loading = await this.loadingCtrl.create({ message: 'Iniciando sesión...' });
    await loading.present();
    try {
      await this.authService.login(this.email, this.password);
    } catch (e: any) {
      await this.showToast(this.getErrorMessage(e.code));
    } finally {
      await loading.dismiss();
    }
  }

  async loginWithGoogle(): Promise<void> {
    const loading = await this.loadingCtrl.create({ message: 'Conectando con Google...' });
    await loading.present();
    try {
      await this.authService.loginWithGoogle();
    } catch (e: any) {
      await this.showToast('Error al iniciar con Google');
    } finally {
      await loading.dismiss();
    }
  }

  private async showToast(msg: string): Promise<void> {
    const t = await this.toastCtrl.create({
      message: msg, duration: 2500, color: 'danger', position: 'top'
    });
    await t.present();
  }

  private getErrorMessage(code: string): string {
    switch (code) {
      case 'auth/user-not-found':   return 'Usuario no encontrado';
      case 'auth/wrong-password':   return 'Contraseña incorrecta';
      case 'auth/invalid-email':    return 'Correo inválido';
      case 'auth/too-many-requests': return 'Demasiados intentos, espera un momento';
      default: return 'Error al iniciar sesión';
    }
  }
}