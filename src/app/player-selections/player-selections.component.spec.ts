import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PlayerSelectionsComponent } from './player-selections.component';

describe('PlayerSelectionsComponent', () => {
  let component: PlayerSelectionsComponent;
  let fixture: ComponentFixture<PlayerSelectionsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PlayerSelectionsComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PlayerSelectionsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
