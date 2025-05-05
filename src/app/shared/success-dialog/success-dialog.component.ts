import {Component, Inject} from '@angular/core';
import {MatButton} from '@angular/material/button';
import {
  MAT_DIALOG_DATA,
  MatDialogActions,
  MatDialogContent,
  MatDialogRef,
  MatDialogTitle
} from '@angular/material/dialog';
import {MatIcon} from '@angular/material/icon';

@Component({
  selector: 'app-success-dialog',
  imports: [
    MatButton,
    MatIcon
  ],
  templateUrl: './success-dialog.component.html',
  styleUrl: './success-dialog.component.scss'
})
export class SuccessDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<SuccessDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { message: string }
  ) {}

  close() {
    this.dialogRef.close();
  }
}
