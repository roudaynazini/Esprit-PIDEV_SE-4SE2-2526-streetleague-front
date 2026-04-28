import { TestBed } from '@angular/core/testing';

import { BadWordsFilterService } from './bad-words-filter-service';

describe('BadWordsFilterService', () => {
  let service: BadWordsFilterService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(BadWordsFilterService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
