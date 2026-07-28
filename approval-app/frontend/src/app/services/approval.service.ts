import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Approval } from '../models/approval.model';

const API_BASE = 'http://localhost:8080/api';

@Injectable({ providedIn: 'root' })
export class ApprovalService {
  constructor(private http: HttpClient) {}

  list(status: Approval['status']): Observable<Approval[]> {
    return this.http.get<Approval[]>(`${API_BASE}/approvals`, { params: { status } });
  }

  create(title: string): Observable<Approval> {
    return this.http.post<Approval>(`${API_BASE}/approvals`, { title });
  }

  update(id: number, title: string): Observable<unknown> {
    return this.http.put(`${API_BASE}/approvals/${id}`, { title });
  }

  delete(id: number): Observable<unknown> {
    return this.http.delete(`${API_BASE}/approvals/${id}`);
  }

  approve(ids: number[], memo: string): Observable<unknown> {
    return this.http.post(`${API_BASE}/approvals/approve`, { ids, memo });
  }

  reject(ids: number[], memo: string): Observable<unknown> {
    return this.http.post(`${API_BASE}/approvals/reject`, { ids, memo });
  }

  mock(): Observable<unknown> {
    return this.http.post(`${API_BASE}/approvals/mock`, {});
  }

  cancel(id: number): Observable<unknown> {
    return this.http.post(`${API_BASE}/approvals/${id}/cancel`, {});
  }
}
