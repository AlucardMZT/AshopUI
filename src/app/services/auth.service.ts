import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { User } from '../models/user.model';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment';

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
  private baseUrl = environment.apiUrl;
  private authUrl = `${this.baseUrl}/auth`;

  private authStatus = new BehaviorSubject<boolean>(!!this.getToken());
  authStatus$ = this.authStatus.asObservable();

  constructor(private http: HttpClient, private router: Router) {}

  login(credentials: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.authUrl}/login`, credentials);
  }

  register(credentials: LoginRequest): Observable<string> {
    return this.http.post(`${this.authUrl}/register`, credentials, { responseType: 'text' });
  }

  updateUser(data: Partial<User>): Observable<string> {
    const token = this.getToken();
    return this.http.put(`${this.baseUrl}/update/profile`, data, {
      headers: { Authorization: `Bearer ${token}` },
      responseType: 'text'
    });
  }

  getProfile(): Observable<User> {
    const token = this.getToken();
    return this.http.get<User>(`${this.authUrl}/profile`, {
      headers: { Authorization: `Bearer ${token}` }
    });
  }
  getProfileByNickname(nickname: string): Observable<User> {
    return this.http.get<User>(`${this.baseUrl}/profile/${nickname}`);
  }
  checkEmailExists(email: string): Observable<boolean> {
    return this.http.get<boolean>(`${this.authUrl}/email-exists?email=${email}`);
  }

  checkNicknameExists(nickname: string): Observable<boolean> {
    return this.http.get<boolean>(`${this.authUrl}/nickname-exists?nickname=${nickname}`);
  }

  requestPasswordReset(email: string) {
    return this.http.post(`${this.authUrl}/request-password-reset`, { email });
  }

  resetPassword(token: string, password: string) {
    return this.http.post(`${this.authUrl}/reset-password`, { token, password });
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

  getNickname(): string | null {
    return localStorage.getItem('nickname');
  }

  logout() {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('nickname');
    this.authStatus.next(false);
    this.router.navigate(['home']);
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

  isLoggedIn(): boolean {
    return !!this.getToken();
  }
}
