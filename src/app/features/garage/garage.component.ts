import {
  Component,
  inject,
  OnInit,
  QueryList,
  ViewChildren,
} from '@angular/core';
import { CarsService } from '../../shared/services/cars.service';
import { CarComponent } from '../../shared/components/car/car.component';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Car } from '../../shared/types/car';
import { EngineService } from '../../shared/services/engine.service';
import { randomBrands, randomModels } from '../../shared/types/randomCars';
import { PaginationComponent } from '../../shared/components/pagination/pagination.component';
import { ActivatedRoute, Router } from '@angular/router';
import { WinnersService } from '../../shared/services/winners.service';

@Component({
  selector: 'app-garage',
  standalone: true,
  imports: [CarComponent, CommonModule, FormsModule, PaginationComponent],
  templateUrl: './garage.component.html',
  styleUrls: ['./garage.component.css'],
})
export class GarageComponent implements OnInit {
  public readonly carsService = inject(CarsService);
  private engineService = inject(EngineService);
  private winnerService = inject(WinnersService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  currentPage = 1;
  pageSize = 7;
  totalCars = 0;
  totalPages = 1;
  newCarName = '';
  newCarColor = '#ff0000';
  selectedCarId: number | null = null;
  newColor: string = '#ff0000';
  newBrand: string = '';
  raceBlockBnt: boolean = false;
  resetBlockBtn: boolean = true;
  winner: { carBrand: string; duration: number } | null = null;

  @ViewChildren(CarComponent) carComponents!: QueryList<CarComponent>;

  ngOnInit(): void {
    this.route.queryParamMap.subscribe((params) => {
      this.currentPage = +params.get('_page')! || 1;
      this.pageSize = +params.get('_limit')! || 7;
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
      error: (err) => {
        console.log(err);
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
            Math.round(response.distance / response.velocity) / 1000;
          const viewportWidth = window.innerWidth;
          const carRect =
            carComponent.car.nativeElement.getBoundingClientRect();
          const carWidth = carRect.width;
          const carCurrentX = carRect.left;
          const remainingDistance = viewportWidth - carCurrentX - carWidth - 48;

          carComponent.animationDuration = duration;
          carComponent.translateXValue = `${remainingDistance}px`;
          carComponent.carAnimation = true;

          this.driveCar(carComponent);
        });
      },
      error: (err) => console.log('Error starting engines:', err),
    });
  }

  driveCar(carComponent: CarComponent) {
    this.engineService.driveRequestById(carComponent.carId).subscribe({
      next: (resp) => {
        if (resp.success) {
          if (
            !this.winner ||
            carComponent.animationDuration < this.winner.duration
          ) {
            this.winner = {
              carBrand: carComponent.carBrand,
              duration: carComponent.animationDuration,
            };
          }
        }
      },
      error: () => {
        const computedStyle = getComputedStyle(carComponent.car.nativeElement);
        const matrix = new DOMMatrix(computedStyle.transform);
        const currentX = matrix.m41;

        carComponent.car.nativeElement.style.transform = `translateX(${currentX}px)`;
        carComponent.carAnimation = false;

        console.log(`Error: Car with ID ${carComponent.carId} stopped moving.`);
      },
      complete: () => {
        if (this.winner) {
          console.log(
            `The winner is ${this.winner.carBrand} with a time of ${this.winner.duration} seconds!`,
          );
        }
      },
    });
  }

  resetRace() {
    this.carComponents.forEach((carComponent) => {
      carComponent.carAnimation = false;
      carComponent.car.nativeElement.style.transform = `translateX(0px)`;
    });
    this.raceBlockBnt = false;
    this.resetBlockBtn = true;
  }

  selectCar(id: number) {
    this.selectedCarId = id;
    this.carsService.getCarById(id).subscribe((car: Car) => {
      this.newBrand = car.name;
    });
  }
  updateWinner(carId: number) {
    this.winnerService.getWinnerById(carId).subscribe({
      next: (resp) => {
        console.log(resp);
      },
    });
  }
  updateCar() {
    if (this.selectedCarId !== null) {
      this.carsService
        .updateCar(this.selectedCarId, this.newBrand, this.newColor)
        .subscribe(() => {
          console.log(
            `Car ID ${this.selectedCarId} color updated to ${this.newColor} ${this.newBrand}`,
          );
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
          console.log('Car added');
          this.carsService.getCars(this.currentPage, this.pageSize);
        });
    }
    this.newCarName = '';
    this.newCarColor = '#ff0000';
  }
  generateRandomCars(times: number) {
    for (let i = 0; i < times; i++) {
      const randomColor = `rgb(${this.random(256)},${this.random(256)},${this.random(256)})`;
      const randomBrand = randomBrands[this.random(randomBrands.length - 1)];
      const randomModel = randomModels[this.random(randomModels.length - 1)];
      const randomCar = `${randomBrand} ${randomModel}`;

      this.carsService.createCar(randomCar, randomColor).subscribe(() => {
        console.log(`Car added: ${randomCar} with color ${randomColor}`);
      });
    }
    this.loadCars();
  }
  random(n: number) {
    return Math.floor(Math.random() * n);
  }
  onPageChange(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.router.navigate([], {
        queryParams: { _page: page, _limit: this.pageSize },
      });
    }
    // this.loadCars();
  }
}
