import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StatEntryComponent } from './stat-entry.component';

describe('StatEntryComponent', () => {
  let component: StatEntryComponent;
  let fixture: ComponentFixture<StatEntryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ StatEntryComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(StatEntryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
