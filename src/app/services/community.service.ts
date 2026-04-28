import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, Subject } from 'rxjs';
import { ApiService } from './api.service';

export interface CommunitySummary {
    id: number;
    name: string;
    description?: string;
    categoryId?: number;
    categoryName?: string;
    memberCount?: number;
    teamCount?: number;
    teams?: any[];
    members?: any[];
    access?: string;
    visible?: boolean;
}

export interface CommunityDetail extends CommunitySummary {
    createdAt?: string;
    updatedAt?: string;
    category?: any;
}

@Injectable({ providedIn: 'root' })
export class CommunityService {
    private base: string;
    private readonly communityRefreshSubject = new Subject<void>();
    readonly communityRefresh$ = this.communityRefreshSubject.asObservable();

    constructor(private http: HttpClient, private api: ApiService) {
        this.base = this.api.base;
    }

    // Posts
    getGlobalPosts(page = 0, size = 10): Observable<any> {
        return this.http.get<any>(`${this.base}/posts?page=${page}&size=${size}`);
    }

    getCommunityPosts(communityId: number): Observable<any[]> {
        return this.http.get<any[]>(`${this.base}/communities/${communityId}/posts`);
    }

    createPost(data: { content: string; communityId?: number; postType?: string }): Observable<any> {
        return this.http.post<any>(`${this.base}/posts`, data);
    }

    createCommunityPost(communityId: number, data: { title: string; content: string }): Observable<any> {
        return this.http.post<any>(`${this.base}/communities/${communityId}/posts`, data);
    }

    deletePost(postId: number): Observable<void> {
        return this.http.delete<void>(`${this.base}/posts/${postId}`);
    }

    // Comments
    getComments(postId: number): Observable<any[]> {
        return this.http.get<any[]>(`${this.base}/posts/${postId}/comments`);
    }

    addComment(postId: number, data: { content: string }): Observable<any> {
        return this.http.post<any>(`${this.base}/posts/${postId}/comments`, data);
    }

    deleteComment(commentId: number): Observable<void> {
        return this.http.delete<void>(`${this.base}/comments/${commentId}`);
    }

    // Likes
    toggleLike(postId: number): Observable<void> {
        return this.http.post<void>(`${this.base}/posts/${postId}/like`, {});
    }

    // Communities
    getCommunities(): Observable<CommunitySummary[]> {
        return this.http.get<CommunitySummary[]>(`${this.base}/communities`);
    }

    getCommunityById(id: number): Observable<CommunityDetail> {
        return this.http.get<CommunityDetail>(`${this.base}/communities/${id}`);
    }

    notifyCommunityRefresh(): void {
        this.communityRefreshSubject.next();
    }


    react(postId: number, type: string): Observable<any> {
        return this.http.post<any>(`${this.base}/posts/${postId}/react`, { type });
    }

    getReactions(postId: number): Observable<any> {
        return this.http.get<any>(`${this.base}/posts/${postId}/react`);
    }


    getReactionUsers(postId: number, type?: string): Observable<any[]> {
    const url = type
        ? `${this.base}/posts/${postId}/react/users?type=${type}`
        : `${this.base}/posts/${postId}/react/users`;
    return this.http.get<any[]>(url);
}
}
