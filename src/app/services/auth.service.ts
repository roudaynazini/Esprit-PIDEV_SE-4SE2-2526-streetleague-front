import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';

export interface AuthResponse {
    token: string;
    user: any; // We can type this later if needed
}

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    private apiUrl = `${environment.apiUrl}/auth`;

    constructor(private http: HttpClient) { }

    login(credentials: { email: string, password: string }): Observable<any> {
        return this.http.post<any>(`${this.apiUrl}/login`, credentials).pipe(
            tap(res => {
                if (res && res.token) {
                    localStorage.setItem('auth_token', res.token);

                    // Store user_id as early as possible when token contains a numeric claim.
                    const tokenPayload = this.decodeJwtPayload(res.token);
                    const tokenUserId = this.extractUserId(tokenPayload);
                    if (tokenUserId) {
                        localStorage.setItem('user_id', String(tokenUserId));
                    }
                }
                if (res && res.role) {
                    localStorage.setItem('user_type', res.role);
                }
                if (res && res.email) {
                    localStorage.setItem('user_email', res.email);
                }

                // Some backends return user id directly in login response.
                const responseUserId = this.extractUserId(res?.user) || this.extractUserId(res);
                if (responseUserId) {
                    localStorage.setItem('user_id', String(responseUserId));
                }

                // Fetch user details to get the ID (needed for user-specific API calls)
                if (res && res.email) {
                    this.http.get<any>(`${environment.apiUrl}/users/email/${encodeURIComponent(res.email)}`, {
                        headers: { 'Authorization': `Bearer ${res.token}` }
                    }).subscribe({
                        next: (user: any) => {
                            if (user?.id) localStorage.setItem('user_id', String(user.id));
                            if (user?.firstName) localStorage.setItem('user_name', `${user.firstName} ${user.lastName || ''}`.trim());
                        },
                        error: () => {} // Non-blocking
                    });
                }
            })
        );
    }

    register(data: any): Observable<any> {
        return this.http.post(`${this.apiUrl}/register`, data, { responseType: 'text' }).pipe(
            tap(res => {
                console.log('Register response:', res);
            })
        );
    }

    getErrorMessage(err: any): string {
        if (err?.error) {
            if (typeof err.error === 'string') {
                // Try to parse JSON error body from Spring Boot
                try {
                    const parsed = JSON.parse(err.error);
                    return parsed.message || parsed.error || err.error;
                } catch {
                    return err.error;
                }
            }
            if (err.error?.message) return err.error.message;
        }
        return 'Erreur inconnue.';
    }

    logout(): void {
        // Clear all auth-related localStorage items
        ['auth_token', 'user_name', 'user_email', 'user_type', 'user_id'].forEach(k => 
            localStorage.removeItem(k)
        );
    }

    requestPasswordReset(email: string) {
    return this.http.post(`${environment.apiUrl}/auth/password/forgot-password`, { email });
}

    private decodeJwtPayload(token: string): any | null {
        try {
            const payload = token.split('.')[1];
            return JSON.parse(atob(payload));
        } catch {
            return null;
        }
    }

    private extractUserId(source: any): number | null {
        if (!source || typeof source !== 'object') return null;

        const candidates = [source.id, source.userId, source.uid, source.sub];
        for (const value of candidates) {
            const n = Number(value);
            if (Number.isFinite(n) && n > 0) {
                return n;
            }
        }

        return null;
    }
}
