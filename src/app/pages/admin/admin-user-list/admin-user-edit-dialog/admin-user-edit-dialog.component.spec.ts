import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminUserEditDialogComponent } from './admin-user-edit-dialog.component';

describe('AdminUserEditDialogComponent', () => {
  let component: AdminUserEditDialogComponent;
  let fixture: ComponentFixture<AdminUserEditDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminUserEditDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdminUserEditDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
