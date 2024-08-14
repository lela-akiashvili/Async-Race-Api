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

  // Using Signals To Fetch and Display Combined Data

  // getWinners() {
  //   this.http.get<Winner[]>(`${this.baseUrl}`).subscribe((winners) => {
  //     this.winnersSignal.set(winners);
  //     console.log(winners);
  //   });
  // }

  // getWinnersCars() {
  //   const winnerCarsRequest = this.winnersSignal().map((winner) =>
  //     this.carService
  //       .getCarById(winner.id)
  //       .pipe(map((car) => ({ winner, car })))
  //   );
  //   forkJoin(winnerCarsRequest).subscribe((winnerCars) => {
  //     this.winnersCarSignal.set(winnerCars);
  //   });
  // }

  getWinnersCars(): void {
    this.http
      .get<Winner[]>(`${this.baseUrl}`)
      .pipe(
        switchMap((winners) =>
          forkJoin(
            winners.map((winner) =>
              this.carService
                .getCarById(winner.id)
                .pipe(map((car) => ({ winner, car })))
            )
          )
        )
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
      { headers: { 'Content-Type': 'application/json' } }
    );
  }
  deleteWinner(id: number) {
    this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
  updateWinner(id: number, wins: number, time: number): Observable<void> {
    return this.http.put<void>(
      `${this.baseUrl}/${id}`,
      { wins, time },
      { headers: { 'Content-Type': 'application/json' } }
    );
  }
}
