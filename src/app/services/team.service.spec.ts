import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TeamService, TeamPayload } from './team.service';
import { ApiService } from './api.service';
import { TimeoutError } from 'rxjs';

describe('TeamService', () => {
  let service: TeamService;
  let httpMock: HttpTestingController;
  const baseUrl = 'http://localhost:8085/api';

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        TeamService,
        ApiService,
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });

    service = TestBed.inject(TeamService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('loads and normalizes teams from backend', () => {
    let actual: any[] = [];

    service.getTeams().subscribe((teams) => {
      actual = teams;
    });

    const req = httpMock.expectOne(`${baseUrl}/teams`);
    expect(req.request.method).toBe('GET');
    req.flush({
      content: [
        { id: 10, name: 'Falcons', sportType: 'Football', location: 'Paris', members: [{}, {}] }
      ]
    });

    expect(actual.length).toBe(1);
    expect(actual[0].sport).toBe('Football');
    expect(actual[0].city).toBe('Paris');
    expect(actual[0].memberCount).toBe(2);
  });

  it('creates team with the expected endpoint and payload', () => {
    const payload: TeamPayload = {
      name: 'Legends',
      sport: 'Basketball',
      level: 'Intermédiaire',
      city: 'Lyon'
    };

    let createdName = '';

    service.createTeam(payload).subscribe((team) => {
      createdName = team.name;
    });

    const req = httpMock.expectOne(`${baseUrl}/teams`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(payload);
    req.flush({ id: 42, ...payload });

    expect(createdName).toBe('Legends');
  });

  it('extracts timeout errors with a user-friendly message', () => {
    const message = service.extractErrorMessage(new TimeoutError());
    expect(message).toContain('Délai dépassé');
  });
});
