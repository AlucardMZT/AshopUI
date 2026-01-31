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

  private currentUserSubject = new BehaviorSubject<any | null>(this.getCurrentUser());
  currentUser$ = this.currentUserSubject.asObservable();

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
    this.currentUserSubject.next(this.getCurrentUser());
  }

  saveAuthData(token: string, nickname: string) {
    localStorage.setItem('auth_token', token);
    localStorage.setItem('nickname', nickname);
    this.authStatus.next(true);
    this.currentUserSubject.next(this.getCurrentUser());
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
    this.currentUserSubject.next(null);
    this.router.navigateByUrl('/home', { replaceUrl: true });
  }

  getCurrentUser(): any {
    const token = this.getToken();
    if (!token) return null;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const rawRole = payload.role ?? payload.roles ?? payload.authorities ?? null;

      let roles: string[] = [];
      if (Array.isArray(rawRole)) {
        roles = rawRole.map((r: any) => {
          if (typeof r === 'string') return r;
          if (r == null) return '';
          return String(r.authority ?? r.role ?? r.name ?? r);
        }).filter(Boolean);
      } else if (rawRole != null) {
        if (typeof rawRole === 'string' && rawRole.includes(',')) {
          roles = rawRole.split(',').map(s => s.trim());
        } else {
          roles = [String(rawRole)];
        }
      }

      roles = roles.map(r => r.replace(/^ROLE_/i, '').toUpperCase());

      return {
        email: payload.sub,
        role: roles[0] ?? null,
        roles
      };
    } catch (e) {
      console.error('Error al decodificar el token:', e);
      return null;
    }
  }

  isAdmin(): boolean {
    const user = this.getCurrentUser();
    return user?.roles?.includes('ADMIN') ?? false;
  }

  hasRole(role: string): boolean {
    const user = this.getCurrentUser();
    if (!user) return false;
    const wanted = role.replace(/^ROLE_/i, '').toUpperCase();
    return (user.roles ?? []).map((r: string) => r.toUpperCase()).includes(wanted);
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }
}
