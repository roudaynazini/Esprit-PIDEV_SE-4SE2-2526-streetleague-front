import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable, TimeoutError, catchError, map, throwError, timeout } from 'rxjs';
import { ApiService } from './api.service';

export interface TeamMember {
    userId: number;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    profileImageUrl: string;
    role: 'RESPONSIBLE' | 'MEMBER' | 'ASSISTANT';
    position?: string;
    skillLevel?: number; // 0-10
    rating?: number; // 0-10
}

export interface Team {
    id: number;
    name: string;
    sport?: string;
    sportType?: string;
    level?: string;
    description?: string;
    city?: string;
    location?: string;
    logo?: string;
    status?: string;
    createdAt?: string;
    memberCount?: number;
    members?: TeamMember[];
}

export interface TeamPayload {
    name: string;
    sport: string;
    level: string;
    description?: string;
    city?: string;
    logo?: string | null;
    status?: string;
    createdAt?: string;
    createdById?: number;
    created_by_id?: number;
    createdBy?: number | { id: number };
}

export interface TeamJoinRequest {
    id?: number;
    teamId?: number;
    teamName?: string;
    playerId?: number;
    playerName?: string;
    playerEmail?: string;
    message?: string;
    status?: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED' | string;
    createdAt?: string;
    updatedAt?: string;
}

@Injectable({ providedIn: 'root' })
export class TeamService {
    private teamsBase: string;
    private readonly requestTimeoutMs = 12000;

    constructor(private http: HttpClient, private api: ApiService) {
        this.teamsBase = `${this.api.base}/teams`;
    }

    getTeams(sport?: string, city?: string, level?: string): Observable<Team[]> {
        let params = new HttpParams();
        if (sport) params = params.set('sport', sport);
        if (city) params = params.set('city', city);
        if (level) params = params.set('level', level);
        return this.http.get<any>(this.teamsBase, { params }).pipe(
            timeout(this.requestTimeoutMs),
            map((response) => this.normalizeListResponse(response)),
            catchError((error) => this.handleHttpError(error))
        );
    }

    getCategories(): Observable<any[]> {
        return this.http.get<any[]>(`${this.api.base}/categories`).pipe(
            timeout(this.requestTimeoutMs),
            catchError((error) => this.handleHttpError(error))
        );
    }

    getTeamById(id: number): Observable<Team> {
        return this.http.get<any>(`${this.teamsBase}/${id}`).pipe(
            timeout(this.requestTimeoutMs),
            map((response) => this.normalizeTeam(response)),
            catchError((error) => this.handleHttpError(error))
        );
    }

    /**
     * Get detailed team information including members
     * Calls GET /api/teams/{teamId}/details
     */
    getTeamDetails(id: number): Observable<Team> {
        return this.http.get<any>(`${this.teamsBase}/${id}/details`).pipe(
            timeout(this.requestTimeoutMs),
            map((response) => this.normalizeTeam(response)),
            catchError((error) => this.handleHttpError(error))
        );
    }

    createTeam(data: TeamPayload, userId?: number): Observable<Team> {
        const effectiveUserId = this.resolveEffectiveUserId(userId);
        const payload = this.withCreatorFallback(data, effectiveUserId);

        let params = new HttpParams();
        if (effectiveUserId) {
            params = params
                .set('userId', String(effectiveUserId))
                .set('createdById', String(effectiveUserId))
                .set('created_by_id', String(effectiveUserId));
        }

        return this.http.post<any>(this.teamsBase, payload, { params }).pipe(
            timeout(this.requestTimeoutMs),
            map((response) => this.normalizeTeam(response)),
            catchError((error) => this.handleHttpError(error))
        );
    }

    updateTeam(id: number, data: TeamPayload, userId?: number): Observable<Team> {
        const effectiveUserId = this.resolveEffectiveUserId(userId);
        const payload = this.withCreatorFallback(data, effectiveUserId);

        let params = new HttpParams();
        if (effectiveUserId) {
            params = params
                .set('userId', String(effectiveUserId))
                .set('createdById', String(effectiveUserId))
                .set('created_by_id', String(effectiveUserId));
        }

        return this.http.put<any>(`${this.teamsBase}/${id}`, payload, { params }).pipe(
            timeout(this.requestTimeoutMs),
            map((response) => this.normalizeTeam(response)),
            catchError((error) => this.handleHttpError(error))
        );
    }

    deleteTeam(id: number): Observable<void> {
        return this.http.delete<void>(`${this.teamsBase}/${id}`).pipe(
            timeout(this.requestTimeoutMs),
            catchError((error) => this.handleHttpError(error))
        );
    }

    // Backward-compatible aliases used by existing code.
    getAll(sport?: string, city?: string, level?: string): Observable<Team[]> {
        return this.getTeams(sport, city, level);
    }

    getById(id: number): Observable<Team> {
        return this.getTeamById(id);
    }

    create(data: TeamPayload): Observable<Team> {
        return this.createTeam(data);
    }

    update(id: number, data: TeamPayload): Observable<Team> {
        return this.updateTeam(id, data);
    }

    delete(id: number): Observable<void> {
        return this.deleteTeam(id);
    }

    addMember(member: any): Observable<any> {
        return this.http.post<any>(`${this.api.base}/team-members`, member);
    }

    removeMember(memberId: number): Observable<void> {
        return this.http.delete<void>(`${this.api.base}/team-members/${memberId}`).pipe(
            timeout(this.requestTimeoutMs),
            catchError((error) => this.handleHttpError(error))
        );
    }

    requestJoinTeam(teamId: number, message?: string): Observable<any> {
        const payload: { message?: string } = {};
        const trimmedMessage = message?.trim();
        if (trimmedMessage) {
            payload.message = trimmedMessage;
        }

        return this.http.post<any>(`${this.teamsBase}/${teamId}/join-requests`, payload).pipe(
            timeout(this.requestTimeoutMs),
            catchError((error) => this.handleHttpError(error))
        );
    }

    getJoinRequests(): Observable<TeamJoinRequest[]> {
        return this.http.get<any>(`${this.teamsBase}/join-requests`).pipe(
            timeout(this.requestTimeoutMs),
            map((response) => this.normalizeJoinRequestsResponse(response)),
            catchError((error) => this.handleHttpError(error))
        );
    }

    getTeamMemberRequests(): Observable<TeamJoinRequest[]> {
        return this.http.get<any>(`${this.api.base}/team-members/requests`).pipe(
            timeout(this.requestTimeoutMs),
            map((response) => this.normalizeJoinRequestsResponse(response)),
            catchError((error) => this.handleHttpError(error))
        );
    }

    approveJoinRequest(requestId: number): Observable<any> {
        return this.http.patch<any>(`${this.teamsBase}/join-requests/${requestId}/approve`, {}).pipe(
            timeout(this.requestTimeoutMs),
            catchError((error) => this.handleHttpError(error))
        );
    }

    rejectJoinRequest(requestId: number): Observable<any> {
        return this.http.post<any>(`${this.teamsBase}/join-requests/${requestId}/reject`, {}).pipe(
            timeout(this.requestTimeoutMs),
            catchError((error) => this.handleHttpError(error))
        );
    }

    extractErrorMessage(error: unknown): string {
        if (error instanceof TimeoutError) {
            return 'Délai dépassé : le serveur est trop lent. Réessayez.';
        }

        const httpError = error as HttpErrorResponse;
        if (httpError?.status === 0) {
            if (typeof navigator !== 'undefined' && navigator.onLine === false) {
                return 'Vous êtes hors ligne. Vérifiez votre connexion Internet.';
            }
            return 'Impossible de joindre le serveur. Vérifiez votre connexion réseau.';
        }

        const backendError = httpError?.error;
        if (typeof backendError === 'string') {
            try {
                const parsed = JSON.parse(backendError);
                return parsed?.message || parsed?.error || backendError;
            } catch {
                return backendError;
            }
        }

        if (backendError?.message) {
            return backendError.message;
        }

        if (backendError?.error) return backendError.error;

        if (httpError?.status === 400) {
            return 'Requête invalide. Vérifiez le message saisi et réessayez.';
        }

        if (httpError?.status === 401) {
            return 'Session expirée ou non authentifiée. Veuillez vous reconnecter.';
        }

        if (httpError?.status === 403) {
            return 'Accès refusé pour cette opération. Vérifiez les permissions du compte.';
        }

        if (httpError?.status === 409) {
            return 'Une demande existe déjà pour cette équipe. Elle est déjà en attente.';
        }

        if (httpError?.status === 404) {
            return 'Équipe introuvable.';
        }

        if (httpError?.status) {
            return `Erreur ${httpError.status}: ${httpError.statusText || 'Erreur serveur'}`;
        }

        return 'Une erreur inattendue est survenue.';
    }

    private normalizeListResponse(response: any): Team[] {
        const list = Array.isArray(response)
            ? response
            : Array.isArray(response?.content)
                ? response.content
                : Array.isArray(response?.items)
                    ? response.items
                    : Array.isArray(response?.data)
                        ? response.data
                        : [];

        return list.map((item: any) => this.normalizeTeam(item));
    }

    private normalizeTeam(team: any): Team {
        return {
            ...team,
            id: Number(team?.id || 0),
            name: team?.name || 'Équipe sans nom',
            sport: team?.sport || team?.sportType,
            city: team?.city || team?.location,
            description: team?.description || '',
            logo: team?.logo || '',
            status: team?.status || 'UNKNOWN',
            createdAt: team?.createdAt || '',
            memberCount: team?.memberCount ?? team?.members?.length ?? 0
        };
    }

    private normalizeJoinRequestsResponse(response: any): TeamJoinRequest[] {
        const list = Array.isArray(response)
            ? response
            : Array.isArray(response?.content)
                ? response.content
                : Array.isArray(response?.items)
                    ? response.items
                    : Array.isArray(response?.data)
                        ? response.data
                        : [];

        return list.map((item: any) => ({
            id: Number(item?.id || item?.requestId || 0),
            teamId: Number(item?.teamId || item?.team?.id || 0) || undefined,
            teamName: item?.teamName || item?.team?.name || item?.team?.teamName || '',
            playerId: Number(item?.playerId || item?.userId || item?.requesterId || 0) || undefined,
            playerName: item?.playerName || item?.requesterName || item?.userName || item?.player?.name || '',
            message: item?.message || item?.note || '',
            status: item?.status || 'PENDING',
            createdAt: item?.createdAt || item?.requestedAt || item?.dateCreated || '',
            updatedAt: item?.updatedAt || ''
        }));
    }

    private handleHttpError(error: unknown) {
        return throwError(() => error);
    }

    private resolveEffectiveUserId(userId?: number): number | undefined {
        if (Number.isFinite(userId) && (userId as number) > 0) {
            return userId as number;
        }

        const localUserId = Number(localStorage.getItem('user_id'));
        if (Number.isFinite(localUserId) && localUserId > 0) {
            return localUserId;
        }

        const tokenPayload = this.api.decodeToken();
        const tokenIdCandidates = [
            tokenPayload?.id,
            tokenPayload?.userId,
            tokenPayload?.uid,
            tokenPayload?.user_id,
            tokenPayload?.createdById,
            tokenPayload?.created_by_id,
            tokenPayload?.sub
        ];

        for (const candidate of tokenIdCandidates) {
            const parsed = Number(candidate);
            if (Number.isFinite(parsed) && parsed > 0) {
                localStorage.setItem('user_id', String(parsed));
                return parsed;
            }
        }

        return undefined;
    }

    private withCreatorFallback(data: TeamPayload, creatorId?: number): TeamPayload {
        if (!creatorId) {
            return { ...data };
        }

        return {
            ...data,
            createdById: data.createdById ?? creatorId,
            created_by_id: data.created_by_id ?? creatorId,
            createdBy: data.createdBy ?? creatorId
        };
    }

}
