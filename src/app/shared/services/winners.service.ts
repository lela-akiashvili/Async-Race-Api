import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { ENVIRONMENT } from '../../environment/environment';
import { Car } from '../types/car';
import { Winner } from '../types/winner';
import { forkJoin, map, Observable, switchMap } from 'rxjs';
import { CarsService } from './cars.service';

@Injectable({
  providedIn: 'root',
})
export class WinnersService {
  private http = inject(HttpClient);
  private env = inject(ENVIRONMENT);
  private baseUrl = `${this.env.apiUrl}/winners`;
  private carService = inject(CarsService);

  winnersSignal = signal<Winner[]>([]);
  winnersCarSignal = signal<{ winner: Winner; car: Car }[]>([]);
  totalWinnersCount = signal<number>(0);

  getWinnersCars(page: number = 1, limit: number = 10): void {
    this.http
      .get<Winner[]>(`${this.baseUrl}`, {
        params: {
          _page: page,
          _limit: limit,
        },
        observe: 'response',
      })
      .pipe(
        switchMap((response) => {
          const totalCount = Number(response.headers.get('X-Total-Count'));
          this.totalWinnersCount.set(totalCount);

          const winners = response.body || [];
          return forkJoin(
            winners.map((winner) =>
              this.carService
                .getCarById(winner.id)
                .pipe(map((car) => ({ winner, car }))),
            ),
          );
        }),
      )
      .subscribe((winnerCars) => {
        this.winnersCarSignal.set(winnerCars);
      });
  }

  getWinnerById(id: number): Observable<Winner> {
    return this.http.get<Winner>(`${this.baseUrl}/${id}`);
  }

  createWinner(data: Winner): Observable<void> {
    return this.http.post<void>(
      `${this.baseUrl}`,
      { data },
      { headers: { 'Content-Type': 'application/json' } },
    );
  }
  deleteWinner(id: number) {
    this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
  updateWinner(id: number, wins: number, time: number): Observable<void> {
    return this.http.put<void>(
      `${this.baseUrl}/${id}`,
      { wins, time },
      { headers: { 'Content-Type': 'application/json' } },
    );
  }
}
