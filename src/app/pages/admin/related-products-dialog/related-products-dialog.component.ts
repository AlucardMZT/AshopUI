import { Component, Inject, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatButtonModule } from '@angular/material/button';
import { Product } from '../../../models/product.model';
import { ProductService } from '../../../services/product.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-related-products-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatTableModule, MatPaginatorModule, MatButtonModule],
  templateUrl: './related-products-dialog.component.html',
  styleUrls: ['./related-products-dialog.component.scss']
})
export class RelatedProductsDialogComponent implements OnInit, AfterViewInit {
  displayedColumns: string[] = ['name', 'price', 'category', 'actions'];
  dataSource = new MatTableDataSource<Product>([]);
  loading = true;
  error = false;

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  constructor(
    public dialogRef: MatDialogRef<RelatedProductsDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { categoryId: number; categoryName?: string },
    private productService: ProductService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadProducts();
  }

  ngAfterViewInit(): void {
    // asignar paginator después de init
    if (this.paginator) {
      this.dataSource.paginator = this.paginator;
    }
  }

  loadProducts() {
    this.loading = true;
    this.error = false;
    this.productService.getByCategory(this.data.categoryId).subscribe({
      next: products => {
        this.dataSource.data = products || [];
        this.loading = false;
      },
      error: err => {
        console.error('Error cargando productos en modal', err);
        this.error = true;
        this.loading = false;
      }
    });
  }

  editProduct(product: Product) {
    // Cerrar dialog y navegar al editor de producto con query param edit
    this.dialogRef.close();
    this.router.navigate(['/a-shop-ctrl-984-panel', 'productos'], { queryParams: { edit: product.id } });
  }

  close() {
    this.dialogRef.close();
  }
}
