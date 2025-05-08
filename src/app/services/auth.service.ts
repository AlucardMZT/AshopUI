import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {BehaviorSubject, Observable} from 'rxjs';
import {User} from '../models/user.model';
import {UpdateUserRequest} from '../models/update-user-request.model';
import {Router, RouterLink, RouterLinkActive, RouterOutlet} from '@angular/router';

interface LoginRequest {
  email: string;
  password: string;
}

interface LoginResponse {
  token: string;
  nickname: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private apiUrl = 'http://localhost:8080/api/auth';
  private authStatus = new BehaviorSubject<boolean>(!!this.getToken());
  authStatus$ = this.authStatus.asObservable();

  constructor(private http: HttpClient, private router: Router) { }

  login(credentials: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/login`, credentials);
  }

  register(credentials: LoginRequest): Observable<string> {
    return this.http.post(this.apiUrl + '/register', credentials, { responseType: 'text' });
  }

  updateUser(data: Partial<User>): Observable<string> {
    const token = this.getToken();
    return this.http.put(`${this.apiUrl}/update/profile`, data, {
      headers: {
        Authorization: `Bearer ${token}`
      },
      responseType: 'text'
    });

  }

  saveToken(token: string) {
    localStorage.setItem('auth_token', token);
  }

  saveAuthData(token: string, nickname: string) {
    localStorage.setItem('auth_token', token);
    localStorage.setItem('nickname', nickname);
    this.authStatus.next(true);
  }

  getToken(): string | null {
    return localStorage.getItem('auth_token');
  }

  getProfile(): Observable<User> {
    const token = this.getToken();
    const headers = { Authorization: `Bearer ${token}` };
    return this.http.get<User>(`${this.apiUrl}/profile`, { headers });
  }

  getNickname(): string | null {
    return localStorage.getItem('nickname');
  }

  logout() {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('nickname');
    this.authStatus.next(false);
    this.router.navigate(['']);
  }

  getCurrentUser(): any {
    const token = this.getToken();
    if (!token) return null;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return {
        email: payload.sub,
        role: payload.role
      };
    } catch (e) {
      console.error('Error al decodificar el token:', e);
      return null;
    }
  }

  isAdmin(): boolean {
    const user = this.getCurrentUser();
    return user?.role?.toUpperCase() === 'ADMIN';
  }

  hasRole(role: string): boolean {
    const user = this.getCurrentUser();
    return user?.role?.toUpperCase() === role.toUpperCase();
  }

  checkEmailExists(email: string) {
    return this.http.get<boolean>(`http://localhost:8080/api/auth/email-exists?email=${email}`);
  }

  checkNicknameExists(nickname: string) {
    return this.http.get<boolean>(`http://localhost:8080/api/auth/nickname-exists?nickname=${nickname}`);
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  requestPasswordReset(email: string) {
    return this.http.post('/api/auth/request-password-reset', { email });
  }

  resetPassword(token: string, password: string) {
    return this.http.post('/api/auth/reset-password', { token, password });
  }

}
