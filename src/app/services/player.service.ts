import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

@Injectable({ providedIn: 'root' })
export class PlayerService {
    private base: string;

    constructor(private http: HttpClient, private api: ApiService) {
        this.base = `${this.api.base}/players`;
    }

    getById(id: number): Observable<any> {
        return this.http.get<any>(`${this.base}/${id}`);
    }

    update(id: number, data: any): Observable<any> {
        return this.http.post<any>(`${this.base}/${id}`, data);
    }
}
