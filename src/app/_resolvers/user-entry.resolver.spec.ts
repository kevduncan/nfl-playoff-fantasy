import { TestBed } from '@angular/core/testing';

import { UserEntryResolver } from './user-entry.resolver';

describe('UserEntryResolver', () => {
  let resolver: UserEntryResolver;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    resolver = TestBed.inject(UserEntryResolver);
  });

  it('should be created', () => {
    expect(resolver).toBeTruthy();
  });
});
