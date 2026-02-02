import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VerPedidoComponent } from './verpedido.component';

describe('VerPedidoComponent', () => {
  let component: VerPedidoComponent;
  let fixture: ComponentFixture<VerPedidoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VerPedidoComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(VerPedidoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
