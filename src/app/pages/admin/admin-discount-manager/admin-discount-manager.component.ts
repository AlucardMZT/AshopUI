import { Component, OnInit } from '@angular/core';
import { CommonModule, NgForOf } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import {CategoryService} from '../../../services/category.service';
import { CategoryDiscount } from '../../../models/category-discount.model';
import {Category} from '../../../models/category.model';

@Component({
  selector: 'app-admin-discount-manager',
  standalone: true,
  templateUrl: './admin-discount-manager.component.html',
  styleUrl: './admin-discount-manager.component.scss',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatExpansionModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatOptionModule,
    MatButtonModule,
    MatTableModule,
    MatIconModule
  ]
})
export class AdminDiscountManagerComponent implements OnInit {
  discountForm: FormGroup;
  discounts: CategoryDiscount[] = [];
  categories: Category[] = [];
  editingId: number | null = null;

  constructor(
    private fb: FormBuilder,
    private categoryService: CategoryService,
  ) {
    this.discountForm = this.fb.group({
      categoryId: ['', Validators.required],
      percentage: [0, Validators.required],
      description: [''],
      startDate: ['', Validators.required],
      endDate: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    this.loadCategories();
  }

  loadCategories(): void {
    this.categoryService.getAll().subscribe({
      next: cats => this.categories = cats,
      error: err => console.error('Error cargando categorías', err)
    });
  }


  editDiscount(d: CategoryDiscount): void {
    this.editingId = d.id;
    this.discountForm.patchValue({
      categoryId: d.category?.id ?? '', // ✅ segura
      percentage: d.percentage,
      description: d.description,
      startDate: d.startDate,
      endDate: d.endDate
    });
  }


  cancelDiscount(): void {
    this.discountForm.reset();
  }

  applyTodayDiscount(): void {
    const today = new Date().toISOString().substring(0, 10); // YYYY-MM-DD
    this.discountForm.patchValue({
      startDate: today,
      endDate: today
    });
  }
}
