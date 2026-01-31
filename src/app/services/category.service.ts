import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Category } from '../models/category.model';
import {AuthService} from './auth.service';
import {environment} from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class CategoryService {
  private baseUrl = `${environment.apiUrl}/categories`;

  constructor(private http: HttpClient, private authService: AuthService) {}

  getAll(): Observable<Category[]> {
    return this.http.get<Category[]>(this.baseUrl);
  }

  getPromocionales(): Observable<Category[]> {
    return this.http.get<Category[]>(`${this.baseUrl}/promocionales`);
  }

  create(category: any): Observable<Category> {
    const token = this.authService.getToken();
    return this.http.post<Category>(this.baseUrl, category, {
      headers: { Authorization: `Bearer ${token}` }
    });
  }

  update(id: number, data: any): Observable<string> {
    const token = this.authService.getToken();
    return this.http.put(`${this.baseUrl}/${id}`, data, {
      headers: { Authorization: `Bearer ${token}` },
      responseType: 'text'
    });
  }

  delete(id: number, force: boolean = false): Observable<any> {
    const url = force ? `${this.baseUrl}/${id}?force=true` : `${this.baseUrl}/${id}`;
    const token = this.authService.getToken();
    if (token) {
      return this.http.delete(url, { headers: { Authorization: `Bearer ${token}` } });
    }
    return this.http.delete(url);
  }
}
