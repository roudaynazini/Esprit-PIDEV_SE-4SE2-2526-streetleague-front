import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface MatchResponse {
  id: number;
  name: string;
  score: number;
  matchDetails: string;
  distanceKm: number;
}

export interface MatchingAvailabilityInput {
  dayOfWeek: string;
  startTime: string;
  endTime: string;
}

export interface PlayerProfileMatchingRequest {
  type: 'PLAYER';
  name: string;
  sportType: string;
  skillLevel: string;
  position: string;
  city: string;
  latitude: number;
  longitude: number;
  availability: MatchingAvailabilityInput[];
  preferredPlayStyle?: string;
  rating?: number | null;
}

@Injectable({
  providedIn: 'root'
})
export class MatchingService {
  private apiUrl = `${environment.apiUrl}/matching`;

  constructor(private http: HttpClient) { }

  getBestTeamsForPlayer(playerId: number, limit: number = 5): Observable<MatchResponse[]> {
    return this.http.get<MatchResponse[]>(`${this.apiUrl}/teams/${playerId}?limit=${limit}`);
  }

  getBestPlayersForTeam(teamId: number, limit: number = 5): Observable<MatchResponse[]> {
    return this.http.get<MatchResponse[]>(`${this.apiUrl}/players/${teamId}?limit=${limit}`);
  }

  getBestTeamsForProfile(payload: PlayerProfileMatchingRequest, limit: number = 5): Observable<MatchResponse[]> {
    return this.http.post<MatchResponse[]>(`${this.apiUrl}/recommend/teams?limit=${limit}`, payload);
  }
}
