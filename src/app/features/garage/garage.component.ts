import {
  Component,
  inject,
  OnInit,
  QueryList,
  ViewChildren,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { take } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import { randomBrands, randomModels } from '../../shared/types/randomCars';
import { PaginationComponent } from '../../shared/components/pagination/pagination.component';
import { Car } from '../../shared/types/car';
import { Winner } from '../../shared/types/winner';
import { CarsService } from '../../shared/services/cars.service';
import { EngineService } from '../../shared/services/engine.service';
import { WinnersService } from '../../shared/services/winners.service';
import { CarComponent } from '../../shared/components/car/car.component';

const randomColorRange = 256;
const DEFAULT_PAGE_SIZE = 7;
const padding = 32;
const seconds = 1000;
interface Success{
  success:boolean;
}
@Component({
  selector: 'app-garage',
  standalone: true,
  imports: [CarComponent, CommonModule, FormsModule, PaginationComponent],
  templateUrl: './garage.component.html',
  styleUrls: ['./garage.component.css'],
})
export class GarageComponent implements OnInit {
  private static readonly DEFAULT_COLOR = '#ff0000';

  public readonly carsService = inject(CarsService);

  private engineService = inject(EngineService);

  private winnerService = inject(WinnersService);

  private route = inject(ActivatedRoute);

  private router = inject(Router);

  currentPage = 1;

  totalCars = 0;

  pageSize = DEFAULT_PAGE_SIZE;

  totalPages = 1;

  newCarName = '';

  newCarColor = GarageComponent.DEFAULT_COLOR;

  selectedCarId: number | null = null;

  newColor: string = '#ff0000';

  newBrand: string = '';

  raceBlockBnt: boolean = false;

  resetBlockBtn: boolean = true;

  winner: { carBrand: string; duration: number } | null = null;

  winnerDeclared = false;

  @ViewChildren(CarComponent) carComponents!: QueryList<CarComponent>;

  ngOnInit(): void {
    this.route.queryParamMap.subscribe((params) => {
      this.currentPage = +params.get('_page')! || 1;
      this.pageSize = +params.get('_limit')! || DEFAULT_PAGE_SIZE;
      this.loadCars();
    });
  }

  loadCars() {
    this.carsService.getCars(this.currentPage, this.pageSize).subscribe({
      next: (resp) => {
        this.carsService.carsSignal.set(resp.cars);
        this.totalCars = resp.totalCount;
        this.totalPages = Math.ceil(this.totalCars / this.pageSize);

        if (this.currentPage > 1 && resp.cars.length === 0) {
          this.router.navigate([], {
            queryParams: {
              _page: this.currentPage - 1,
              _limit: this.pageSize,
            },
            queryParamsHandling: 'merge',
          });
        }
      },
    });
  }

  startRace() {
    const carIds = this.carsService.carsSignal().map((car) => car.id);
    this.engineService.startsAllCarEngines(carIds).subscribe({
      next: (responses) => {
        this.winner = null;
        this.raceBlockBnt = true;
        this.resetBlockBtn = false;
        this.carComponents.forEach((carComponent, index) => {
          const response = responses[index];
          const duration =
            Math.round(response.distance / response.velocity) / seconds;
          const viewportWidth = window.innerWidth;
          const carRect =
            carComponent.car.nativeElement.getBoundingClientRect();
          const carWidth = carRect.width;
          const carCurrentX = carRect.left;
          const remainingDistance =
            viewportWidth - carCurrentX - carWidth - padding;

          carComponent.animationDuration = duration;
          carComponent.translateXValue = `${remainingDistance}px`;
          carComponent.carAnimation = true;

          this.driveCar(carComponent);
        });
      },
    });
  }

  driveCar(carComponent: CarComponent) {
    this.engineService.driveRequestById(carComponent.carId).subscribe({
      next: (resp) => this.handleDriveSuccess(resp, carComponent),
      error: () => GarageComponent.handelDriveError(carComponent),
    });
  }

  private handleDriveSuccess(
    resp: Success,
    carComponent: CarComponent,
  ) {
    if (resp.success && this.winnerDeclared === false) {
      if (
        !this.winner ||
        carComponent.animationDuration < this.winner.duration
      ) {
        this.declareWinner(carComponent);
      }
    }
  }

  private static handelDriveError(carComponent: CarComponent) {
    const computedStyle = getComputedStyle(carComponent.car.nativeElement);
    const matrix = new DOMMatrix(computedStyle.transform);
    const currentX = matrix.m41;
    carComponent.car.nativeElement.style.transform = `translateX(${currentX}px)`;
    carComponent.carAnimation = false;
  }

  private declareWinner(carComponent: CarComponent) {
    this.winner = {
      carBrand: carComponent.carBrand,
      duration: carComponent.animationDuration,
    };
    this.winnerDeclared = true;
    this.winnerService
      .getWinnerById(carComponent.carId)
      .pipe(take(1))
      .subscribe({
        next: (winner) => this.updateWinner(winner, carComponent),
        error: () => this.createNewWinner(carComponent),
      });
  }

  private createNewWinner(carComponent: CarComponent) {
    const winnerData: Winner = {
      id: carComponent.carId,
      wins: 1,
      time: this.winner!.duration,
    };
    this.winnerService.createWinner(winnerData).pipe(take(1)).subscribe();
  }

  private updateWinner(winner: Winner, carComponent: CarComponent) {
    const newTime = Math.min(winner.time, carComponent.animationDuration);
    this.winnerService.updateWinner(winner.id, winner.wins + 1, newTime).subscribe();
  }

  resetRace() {
    this.carComponents.forEach((carComponent) => {
      const resetCarComponent = { ...carComponent }; 
      resetCarComponent.carAnimation = false;
      resetCarComponent.car.nativeElement.style.transform = 'translateX(0px)';
    });
    this.winnerDeclared = false;
    this.raceBlockBnt = false;
    this.resetBlockBtn = true;
  }

  selectCar(id: number) {
    this.selectedCarId = id;
    this.carsService.getCarById(id).subscribe((car: Car) => {
      this.newBrand = car.name;
    });
  }

  updateCar() {
    if (this.selectedCarId !== null) {
      this.carsService
        .updateCar(this.selectedCarId, this.newBrand, this.newColor)
        .subscribe(() => {
          this.carsService.getCars(this.currentPage, this.pageSize);
        });
    }
    this.newBrand = '';
  }

  onCarDeleted() {
    this.loadCars();
  }

  addNewCar() {
    if (this.newCarColor && this.newCarName) {
      this.carsService
        .createCar(this.newCarName, this.newCarColor)
        .subscribe(() => {
          this.carsService.getCars(this.currentPage, this.pageSize);
        });
    }
    this.newCarName = '';
    this.newCarColor = '#ff0000';
  }

  generateRandomCars(times: number) {
    for (let i = 0; i < times; i += 1) {
      const randomColor = `rgb(${GarageComponent.random(randomColorRange)},${GarageComponent.random(randomColorRange)},${GarageComponent.random(randomColorRange)})`;
      const randomBrand =
        randomBrands[GarageComponent.random(randomBrands.length - 1)];
      const randomModel =
        randomModels[GarageComponent.random(randomModels.length - 1)];
      const randomCar = `${randomBrand} ${randomModel}`;

      this.carsService.createCar(randomCar, randomColor).subscribe();
    }
    this.loadCars();
  }

  static random(n: number) {
    return Math.floor(Math.random() * n);
  }

  onPageChange(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.router.navigate([], {
        queryParams: { _page: page, _limit: this.pageSize },
      });
    }
  }
}
