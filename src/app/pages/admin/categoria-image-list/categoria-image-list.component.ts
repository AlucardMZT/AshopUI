import {Component, OnInit} from '@angular/core';
import {MatTableModule} from '@angular/material/table';
import {MatButtonModule} from '@angular/material/button';
import {MatInputModule} from '@angular/material/input';
import {MatFormFieldModule} from '@angular/material/form-field';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {CommonModule} from '@angular/common';
import {CategoryService} from '../../../services/category.service';
import {MatOption, MatSelect} from '@angular/material/select';
import {MatSnackBar} from '@angular/material/snack-bar';
import {MatAccordion, MatExpansionPanel, MatExpansionPanelTitle} from '@angular/material/expansion';
import {MatExpansionModule} from '@angular/material/expansion';

@Component({
  selector: 'app-categoria-image-list',
  imports: [CommonModule, MatExpansionModule, ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatTableModule, MatSelect, MatOption, MatExpansionPanel, MatExpansionPanelTitle, MatAccordion],

  templateUrl: './categoria-image-list.component.html',
  styleUrl: './categoria-image-list.component.scss'
})
export class CategoriaImageListComponent implements OnInit {
  categories: any[] = [];
  realCategories: any[] = [];
  promotionalCategories: any[] = [];
  categoryForm!: FormGroup;
  editingId: number | null = null;
  imageBase64: string = '';

  constructor(private fb: FormBuilder, private categoryService: CategoryService,  private snackBar: MatSnackBar) {}

  ngOnInit() {
    this.categoryService.getAll().subscribe(cats => {
      this.promotionalCategories = cats.filter(c => c.type === 'promocional');
      this.realCategories = cats.filter(c => c.type === 'real');
    });
    this.categoryForm = this.fb.group({
      name: ['', Validators.required],
      image: [''],
      type: ['promocional']
    });
    this.refreshCategories();
  }

  refreshCategories() {
    this.categoryService.getAll().subscribe(cats => {
      this.promotionalCategories = cats.filter(c => c.type === 'promocional');
      this.realCategories = cats.filter(c => c.type === 'real');
    });
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => this.imageBase64 = reader.result as string;
      reader.readAsDataURL(file);
    }
  }

  saveCategory() {
    const data = { ...this.categoryForm.value, image: this.imageBase64 };
    if (this.editingId) {
      this.categoryService.update(this.editingId, data).subscribe(() => {
        this.snackBar.open('✅ Categoría actualizada', 'Cerrar', { duration: 3000 });
        this.resetForm();
        this.refreshCategories();
      });
    } else {
      this.categoryService.create(data).subscribe(() => {
        this.snackBar.open('✅ Categoría creada', 'Cerrar', { duration: 3000 });
        this.resetForm();
        this.refreshCategories();
      });
    }
  }

  editCategory(cat: any) {
    this.editingId = cat.id;
    this.categoryForm.patchValue(cat);
    this.imageBase64 = cat.image;
  }

  resetForm() {
    this.editingId = null;
    this.categoryForm.reset({ type: 'promocional' });
    this.imageBase64 = '';
  }

  deleteCategory(id: number) {
    if (confirm('¿Seguro de eliminar?')) {
      this.categoryService.delete(id).subscribe(() =>  this.refreshCategories());
    }
  }
}
