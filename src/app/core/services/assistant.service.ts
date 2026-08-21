import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiResponse } from '../models';
import { StoreContextService } from './store-context.service';
import { withHttpErrorFallback } from '../utils/http-error.util';
import { AssistantAnswer } from '../models/assistant.model';

@Injectable({ providedIn: 'root' })
export class AssistantService {
  private readonly http = inject(HttpClient);
  private readonly store = inject(StoreContextService);
  private readonly apiUrl = this.store.apiUrl('assistant');

  ask(query: string): Observable<AssistantAnswer | null> {
    return this.http.post<ApiResponse<AssistantAnswer>>(`${this.apiUrl}/ask`, { query }, {
      params: this.store.storeParams()
    }).pipe(
      map((response) => response.data),
      withHttpErrorFallback<AssistantAnswer | null>('ask', null)
    );
  }
}
