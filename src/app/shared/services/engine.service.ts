import { inject, Injectable, signal } from '@angular/core';
import { forkJoin, Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { ENVIRONMENT } from '../../environment/environment';

import { Engine } from '../types/engine';


@Injectable({ providedIn: 'root' })
export class EngineService {
  private httpClient = inject(HttpClient);

  private env = inject(ENVIRONMENT);

  private baseUrl = `${this.env.apiUrl}/engine`;

  carEngineStatusSignal = signal<boolean>(false);

  startOrStopCarById(id: number, status: 'started' | 'stopped') {
    return this.httpClient.patch<Engine>(
      `${this.baseUrl}?id=${id}&status=${status}`,
      {},
    );
  }

  driveRequestById(id: number) {
    return this.httpClient.patch<{ success: boolean }>(
      `${this.baseUrl}?id=${id}&status=drive`,
      {},
    );
  }

  startsAllCarEngines(carIds: number[]): Observable<Engine[]> {
    const startRequests = carIds.map((id) =>
      this.startOrStopCarById(id, 'started'),
    );
    return forkJoin(startRequests);
  }
}
