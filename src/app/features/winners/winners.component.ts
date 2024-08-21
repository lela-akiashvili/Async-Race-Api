import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { WinnersService } from '../../shared/services/winners.service';
import { CarsService } from '../../shared/services/cars.service';
import { PaginationComponent } from '../../shared/components/pagination/pagination.component';

const DEFAULT_LIMIT = 10;
@Component({
  selector: 'app-winners',
  standalone: true,
  imports: [AsyncPipe, PaginationComponent],
  templateUrl: './winners.component.html',
  styleUrl: './winners.component.css',
})
export class WinnersComponent implements OnInit {
  public readonly winnersService = inject(WinnersService);

  public readonly carsService = inject(CarsService);

  currentPage = signal<number>(1);

  totalPages = computed(() =>
    Math.ceil(this.winnersService.totalWinnersCount() / DEFAULT_LIMIT),
  );

  ngOnInit(): void {
    this.loadWinners();
  }

  loadWinners() {
    this.winnersService.getWinnersCars(this.currentPage(), DEFAULT_LIMIT);
  }

  onPageChange(newPage: number) {
    if (newPage >= 1 && newPage <= this.totalPages()) {
      this.currentPage.set(newPage);
      this.loadWinners();
    }
  }
}
