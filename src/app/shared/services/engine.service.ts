import { ENVIRONMENT } from '../../environment/environment';
import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { Engine } from '../types/engine';
// import { WinnersService } from './winners.service';
import { forkJoin, Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class EngineService {
  // private winnerService = inject(WinnersService);
  private httpClient = inject(HttpClient);
  private env = inject(ENVIRONMENT);
  private baseUrl = `${this.env.apiUrl}/engine`;

  carEngineStatusSignal = signal<boolean>(false);

  startOrStopCarById(id: number, status: 'started' | 'stopped') {
    return this.httpClient.patch<Engine>(
      `${this.baseUrl}?id=${id}&status=${status}`,
      {}
    );
  }


  driveRequestById(id: number) {
    return this.httpClient.patch<{ success: boolean }>(
      `${this.baseUrl}?id=${id}&status=drive`,
      {}
    );
  }

  startsAllCarEngines(carIds: number[]): Observable<Engine[]> {
    const startRequests = carIds.map(id => this.startOrStopCarById(id, 'started'));
    return forkJoin(startRequests);
  }
}
  // startOrStopCarEngineById(id: number, status: 'started' | 'stopped') {
  //   return this.httpClient
  //     .patch<Engine>(`${this.baseUrl}?id=${id}&status=${status}`, {})
  //     .subscribe({
  //       next: (resp) => {
  //         if (status === 'started') {
  //           console.log(resp);
  //           const duration = Math.round(resp.distance / resp.velocity) / 1000;
  //           console.log(duration);
  //         } else {
  //           resp.distance = 0;
  //           console.log('car stopped', resp.distance);
  //         }
  //       },
  //       error: (err) => {
  //         console.error(err.message);
  //       },
  //       complete: () => {
  //         this.winnerService.getWinnerById(id).pipe();
  //       },
  //     });
  // }