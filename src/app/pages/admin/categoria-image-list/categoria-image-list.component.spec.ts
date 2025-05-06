import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CategoriaImageListComponent } from './categoria-image-list.component';

describe('CategoriaImageListComponent', () => {
  let component: CategoriaImageListComponent;
  let fixture: ComponentFixture<CategoriaImageListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CategoriaImageListComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CategoriaImageListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
