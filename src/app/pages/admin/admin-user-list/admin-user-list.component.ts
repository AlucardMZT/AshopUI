import {Component, OnInit, ViewChild} from '@angular/core';
import { AuthService } from '../../../services/auth.service';
import { User } from '../../../models/user.model';
import {MatList, MatListItem} from '@angular/material/list';
import {FormsModule} from '@angular/forms';
import {MatFormField, MatInput, MatLabel} from '@angular/material/input';
import {MatCard, MatCardTitle} from '@angular/material/card';
import {MatIcon} from '@angular/material/icon';
import {NgForOf} from '@angular/common';
import * as XLSX from 'xlsx';
import FileSaver, { saveAs } from 'file-saver';
import {OrderByNamePipe} from '../../../shared/orderByName.pipe';
import {MatButton, MatIconButton} from '@angular/material/button';
import {
  MatCell, MatCellDef,
  MatColumnDef,
  MatHeaderCell,
  MatHeaderCellDef,
  MatHeaderRow,
  MatHeaderRowDef, MatRow, MatRowDef,
  MatTable, MatTableDataSource
} from '@angular/material/table';
import {MatPaginator} from '@angular/material/paginator';
import {MatSort} from '@angular/material/sort';
import {Router} from '@angular/router';
import {AdminUserEditDialogComponent} from './admin-user-edit-dialog/admin-user-edit-dialog.component';
import {MatDialog} from '@angular/material/dialog';

@Component({
  selector: 'app-admin-user-list',
  templateUrl: './admin-user-list.component.html',
  imports: [
    MatLabel,
    FormsModule,
    MatFormField,
    MatCardTitle,
    MatIcon,
    MatCard,
    MatInput,
    MatPaginator,
    MatButton,
    MatHeaderRow,
    MatHeaderRowDef,
    MatHeaderCellDef,
    MatColumnDef,
    MatHeaderCell,
    MatTable,
    MatSort,
    MatCell,
    MatCellDef,
    MatRowDef,
    MatRow,
    MatIconButton
  ],
  styleUrls: ['./admin-user-list.component.scss']
})
export class AdminUserListComponent implements OnInit {
  users: User[] = [];
  search = '';
  displayedColumns: string[] = ['name', 'nickname', 'email', 'phone', 'acciones'];
  dataSource = new MatTableDataSource<User>([]);

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(private authService: AuthService, private dialog: MatDialog) {}

  ngOnInit(): void {
    this.authService.getAllUsers().subscribe({
      next: (users) => {
        this.dataSource.data = users;
        this.dataSource.paginator = this.paginator;
      },
      error: err => console.error('❌ Error al cargar usuarios:', err)
    });
    this.cargarUsuarios();
  }

  cargarUsuarios() {
    this.authService.getAllUsers().subscribe({
      next: (users) => {
        this.users = users;
        this.dataSource.data = users;
        this.dataSource.paginator = this.paginator;
        this.dataSource.sort = this.sort;
      },
      error: err => console.error('❌ Error al cargar usuarios:', err)
    });
  }

  filtrarUsuarios() {
    this.dataSource.filter = this.search.trim().toLowerCase();
  }

  get filteredUsers(): User[] {
    const q = this.search.toLowerCase();
    return this.users.filter(u =>
      u.name?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      u.nickname?.toLowerCase().includes(q)
    );
  }

  exportarExcel(): void {
    const ws = XLSX.utils.json_to_sheet(this.dataSource.filteredData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Usuarios');
    const excelBuffer: any = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    FileSaver.saveAs(new Blob([excelBuffer]), 'usuarios.xlsx');
  }

  editarUsuario(user: User) {
    const dialogRef = this.dialog.open(AdminUserEditDialogComponent, {
      width: '400px',
      data: { ...user }
    });

    dialogRef.afterClosed().subscribe((wasUpdated: boolean) => {
      if (wasUpdated) {
        this.cargarUsuarios(); // Recarga la lista, no vuelve a guardar
      }
    });
  }
  eliminarUsuario(user: User) {
    const confirmDelete = confirm(`¿Seguro que deseas eliminar a ${user.nickname}?`);
    if (!confirmDelete) return;

    this.authService.deleteUser(user.id!).subscribe({
      next: () => {
        alert(`✅ Usuario eliminado correctamente: ${user.nickname}`);
        this.cargarUsuarios(); // Recarga la lista de usuarios
      },
      error: err => {
        console.error('❌ Error al eliminar usuario:', err);
        alert('No se pudo eliminar el usuario');
      }
    });
  }
}
