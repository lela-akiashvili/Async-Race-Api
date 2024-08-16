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

@Component({
  selector: 'app-garage',
  standalone: true,
  imports: [CarComponent, CommonModule, FormsModule],
  templateUrl: './garage.component.html',
  styleUrls: ['./garage.component.css'],
})
export class GarageComponent implements OnInit {
  public readonly carsService = inject(CarsService);
  private engineService = inject(EngineService);

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
    this.carsService.getCars();
  }

  startRace() {
    const carIds = this.carsService.carsSignal().map((car) => car.id);
    this.engineService.startsAllCarEngines(carIds).subscribe({
      next: (responses) => {
        this.winner = null;
        this.carComponents.forEach((carComponent, index) => {
          this.raceBlockBnt = true;
          this.resetBlockBtn = false;
          const response = responses[index];
          const duration =
            Math.round(response.distance / response.velocity) / 1000;
          const viewportWidth = window.innerWidth;
          const carRect =
            carComponent.car.nativeElement.getBoundingClientRect();
          const carWidth = carRect.width;
          const carCurrentX = carRect.left;
          const remainingDistance = viewportWidth - carCurrentX - carWidth - 32;

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

  // driveCar(carComponent: CarComponent) {
  //   this.engineService.driveRequestById(carComponent.carId).subscribe({
  //     next: (resp) => {
  //       if (resp.success) {
  //         console.log(carComponent.carBrand);
  //       }
  //     },
  //     error: () => {
  //       const computedStyle = getComputedStyle(carComponent.car.nativeElement);
  //       const matrix = new DOMMatrix(computedStyle.transform);
  //       const currentX = matrix.m41;

  //       carComponent.car.nativeElement.style.transform = `translateX(${currentX}px)`;
  //       carComponent.carAnimation = false;

  //       console.log(`Error: Car with ID ${carComponent.carId} stopped moving.`);
  //     },
  //   });
  // }

  // driveCar(carComponent: CarComponent) {
  //   this.engineService
  //     .driveRequestById(carComponent.carId)
  //     .pipe(take(1))
  //     .subscribe({
  //       next: (resp) => {
  //         if (resp.success) {
  //           console.log(carComponent.carBrand);
  //         }
  //       },
  //       error: () => {
  //         const computedStyle = getComputedStyle(
  //           carComponent.car.nativeElement,
  //         );
  //         const matrix = new DOMMatrix(computedStyle.transform);
  //         const currentX = matrix.m41;

  //         carComponent.car.nativeElement.style.transform = `translateX(${currentX}px)`;
  //         carComponent.carAnimation = false;

  //         console.log(
  //           `Error: Car with ID ${carComponent.carId} stopped moving.`,
  //         );
  //       },
  //     });
  // }

  // driveCar(carComponent: CarComponent) {
  //   this.engineService
  //     .driveRequestById(carComponent.carId)
  //     .pipe(
  //       filter((resp) => resp.success),
  //       take(1),
  //     )
  //     .subscribe({
  //       next: () => {
  //         console.log(carComponent.carBrand);
  //         console.log(carComponent.carId);
  //         console.log(carComponent.animationDuration);
  //         console.log(this.winnerService.getWinnerById(carComponent.carId));
  //       },
  //       error: () => {
  //         const computedStyle = getComputedStyle(
  //           carComponent.car.nativeElement,
  //         );
  //         const matrix = new DOMMatrix(computedStyle.transform);
  //         const currentX = matrix.m41;
  //         carComponent.car.nativeElement.style.transform = `translateX(${currentX}px)`;
  //         carComponent.carAnimation = false;
  //         console.log(
  //           `Error: Car with ID ${carComponent.carId} stopped moving.`,
  //         );
  //       },
  //     });
  // }

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

  updateCar() {
    if (this.selectedCarId !== null) {
      this.carsService
        .updateCar(this.selectedCarId, this.newBrand, this.newColor)
        .subscribe(() => {
          console.log(
            `Car ID ${this.selectedCarId} color updated to ${this.newColor} ${this.newBrand}`,
          );
          this.carsService.getCars();
        });
    }
    this.newBrand = '';
  }

  addNewCar() {
    if (this.newCarColor && this.newCarName) {
      this.carsService
        .createCar(this.newCarName, this.newCarColor)
        .subscribe(() => {
          console.log('Car added');
          this.carsService.getCars();
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
  
    // Call getCars after all cars have been created
    this.carsService.getCars();
  }

  random(n: number) {
    return Math.floor(Math.random() * n);
  }
}
