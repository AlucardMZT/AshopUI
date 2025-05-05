import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConfirmacionpedidoComponent } from './confirmacionpedido.component';

describe('ConfirmacionpedidoComponent', () => {
  let component: ConfirmacionpedidoComponent;
  let fixture: ComponentFixture<ConfirmacionpedidoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConfirmacionpedidoComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ConfirmacionpedidoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
