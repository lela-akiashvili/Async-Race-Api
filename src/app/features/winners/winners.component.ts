import { Component, inject, OnInit } from '@angular/core';
import { WinnersService } from '../../shared/services/winners.service';
import { CarsService } from '../../shared/services/cars.service';
import { AsyncPipe } from '@angular/common';

@Component({
  selector: 'app-winners',
  standalone: true,
  imports: [AsyncPipe],
  templateUrl: './winners.component.html',
  styleUrl: './winners.component.css',
})
export class WinnersComponent implements OnInit {
  public readonly winnersService = inject(WinnersService);
  public readonly carsService = inject(CarsService);

  ngOnInit(): void {
    this.winnersService.getWinnersCars();
  }
}
