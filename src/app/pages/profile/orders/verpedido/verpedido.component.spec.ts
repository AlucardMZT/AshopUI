import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VerpedidoComponent } from './verpedido.component';

describe('VerpedidoComponent', () => {
  let component: VerpedidoComponent;
  let fixture: ComponentFixture<VerpedidoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VerpedidoComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(VerpedidoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
