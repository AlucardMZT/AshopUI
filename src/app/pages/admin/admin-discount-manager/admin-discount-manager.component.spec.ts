import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminDiscountManagerComponent } from './admin-discount-manager.component';

describe('AdminDiscountManagerComponent', () => {
  let component: AdminDiscountManagerComponent;
  let fixture: ComponentFixture<AdminDiscountManagerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminDiscountManagerComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdminDiscountManagerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
