import { TestBed } from '@angular/core/testing';

import { PreOpenGuard } from './pre-open.guard';

describe('PreOpenGuard', () => {
  let guard: PreOpenGuard;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    guard = TestBed.inject(PreOpenGuard);
  });

  it('should be created', () => {
    expect(guard).toBeTruthy();
  });
});
