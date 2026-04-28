import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { vi } from 'vitest';
import { TeamComponent } from './team.component';
import { Team, TeamService } from '../services/team.service';

describe('TeamComponent form submission', () => {
  let fixture: ComponentFixture<TeamComponent>;
  let component: TeamComponent;

  const teamServiceMock = {
    getTeams: vi.fn(() => of([] as Team[])),
    getAll: vi.fn(() => of([] as Team[])),
    getCategories: vi.fn(() => of([] as any[])),
    getTeamById: vi.fn(),
    createTeam: vi.fn(),
    updateTeam: vi.fn(),
    deleteTeam: vi.fn(),
    extractErrorMessage: vi.fn(() => 'Erreur test')
  };

  const routerMock = {
    navigate: vi.fn()
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    await TestBed.configureTestingModule({
      imports: [TeamComponent],
      providers: [
        { provide: TeamService, useValue: teamServiceMock },
        { provide: Router, useValue: routerMock }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(TeamComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('submits create flow and refreshes list after success', () => {
    const created: Team = { id: 100, name: 'Blue Stars', sport: 'Football', level: 'AMATEUR', city: 'Paris' };
    teamServiceMock.createTeam.mockReturnValue(of(created));
    teamServiceMock.getTeams.mockReturnValueOnce(of([created]));

    component.showTeamFormModal = true;
    component.teamForm = {
      name: 'Blue Stars',
      sport: 'Football',
      level: 'AMATEUR',
      city: 'Paris',
      description: 'Created from test',
      logo: null,
      status: 'ACTIVE'
    };

    component.submitTeam();

    expect(teamServiceMock.createTeam).toHaveBeenCalledWith(component.teamForm);
    expect(component.showTeamFormModal).toBe(false);
    expect(component.toast).toContain('Équipe créée avec succès');
    expect(teamServiceMock.getTeams).toHaveBeenCalled();
  });

  it('submits update flow when editingTeamId is set', () => {
    const updated: Team = { id: 12, name: 'Red Wolves', sport: 'Basketball', level: 'ADVANCED', city: 'Marseille' };
    teamServiceMock.updateTeam.mockReturnValue(of(updated));
    teamServiceMock.getTeams.mockReturnValueOnce(of([updated]));

    component.teams = [{ id: 12, name: 'Old Name', sport: 'Basketball' } as Team];
    component.editingTeamId = 12;
    component.teamForm = {
      name: 'Red Wolves',
      sport: 'Basketball',
      level: 'ADVANCED',
      city: 'Marseille',
      description: 'Updated from test',
      logo: null,
      status: 'ACTIVE'
    };

    component.submitTeam();

    expect(teamServiceMock.updateTeam).toHaveBeenCalledWith(12, component.teamForm);
    expect(component.toast).toContain('mise à jour');
    expect(component.editingTeamId).toBe(null);
  });
});
