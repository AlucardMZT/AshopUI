import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Category } from '../models/category.model';
import {AuthService} from './auth.service';

@Injectable({ providedIn: 'root' })
export class CategoryService {
  private baseUrl = 'http://localhost:8080/api/categories';

  constructor(private http: HttpClient,private authService: AuthService) {}

  getAll(): Observable<Category[]> {
    return this.http.get<Category[]>(this.baseUrl);
  }

  getPromocionales() {
    return this.http.get<Category[]>(`${this.baseUrl}/promocionales`);
  }

  create(category: any) {
    const token = this.authService.getToken();
    return this.http.post<Category>(this.baseUrl, category, {
      headers: { Authorization: `Bearer ${token}` }
    });
  }

  update(id: number, data: any) {
    const token = this.authService.getToken();
    return this.http.put(`${this.baseUrl}/${id}`, data, {
      headers: { Authorization: `Bearer ${token}` },
      responseType: 'text'
    });
  }

  delete(id: number) {
    return this.http.delete(`${this.baseUrl}/${id}`);
  }


}
