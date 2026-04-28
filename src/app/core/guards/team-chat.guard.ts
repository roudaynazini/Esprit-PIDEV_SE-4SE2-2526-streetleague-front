import { inject } from '@angular/core';
import { Router, type CanActivateFn } from '@angular/router';
import { catchError, map, of } from 'rxjs';
import { TeamService } from '../../services/team.service';

function parseCurrentUserId(): number | null {
  const raw = localStorage.getItem('user_id');
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

export const teamChatGuard: CanActivateFn = (route) => {
  const router = inject(Router);
  const teamService = inject(TeamService);

  const teamId = Number(route.paramMap.get('id'));
  if (!Number.isFinite(teamId) || teamId <= 0) {
    return router.createUrlTree(['/app/team']);
  }

  const currentUserId = parseCurrentUserId();
  if (!currentUserId) {
    return router.createUrlTree(['/auth/login'], { queryParams: { returnUrl: `/app/team/${teamId}/chat` } });
  }

  return teamService.getTeamDetails(teamId).pipe(
    map((team) => {
      const members = Array.isArray(team?.members) ? team.members : [];
      const isMember = members.some((member) => member.userId === currentUserId);
      return isMember ? true : router.createUrlTree(['/app/team', teamId]);
    }),
    catchError(() => of(router.createUrlTree(['/app/team', teamId])))
  );
};
