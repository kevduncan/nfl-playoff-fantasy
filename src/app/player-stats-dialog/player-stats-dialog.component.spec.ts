import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PlayerStatsDialogComponent } from './player-stats-dialog.component';

describe('PlayerStatsDialogComponent', () => {
  let component: PlayerStatsDialogComponent;
  let fixture: ComponentFixture<PlayerStatsDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PlayerStatsDialogComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PlayerStatsDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
