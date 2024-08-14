import {
  // ChangeDetectorRef,
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
// import { catchError, forkJoin, of } from 'rxjs';
// import { WinnersService } from '../../shared/services/winners.service';

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
  // private winnerService = inject(WinnersService);

  // private cdr = inject(ChangeDetectorRef);
  newCarName = '';
  newCarColor = '#ff0000';
  selectedCarId: number | null = null;
  newColor: string = '#ff0000';
  newBrand: string = '';

  @ViewChildren(CarComponent) carComponents!: QueryList<CarComponent>;

  ngOnInit(): void {
    this.carsService.getCars();
  }

  startRace() {
    const carIds = this.carsService.carsSignal().map(car => car.id);
  
    // Start all engines simultaneously
    this.engineService.startsAllCarEngines(carIds).subscribe({
      next: (responses) => {
        // Start animation for each car
        this.carComponents.forEach((carComponent, index) => {
          const response = responses[index];
          const duration = Math.round(response.distance / response.velocity) / 1000;
  
          // Start animation
          const viewportWidth = window.innerWidth;
          const carRect = carComponent.car.nativeElement.getBoundingClientRect();
          const carWidth = carRect.width;
          const carCurrentX = carRect.left;
          const remainingDistance = viewportWidth - carCurrentX - carWidth - 32;
  
          carComponent.animationDuration = duration;
          carComponent.translateXValue = `${remainingDistance}px`;
          carComponent.carAnimation = true;
  
          // Send drive request
          this.driveCar(carComponent);
        });
      },
      error: (err) => console.log('Error starting engines:', err)
    });
  }
  
  driveCar(carComponent: CarComponent) {
    this.engineService.driveRequestById(carComponent.carId).subscribe({
      next: (resp) => {
        if (resp.success) {
          // Emit the winner if the car successfully completes the race
          carComponent.winner.emit(carComponent.carBrand);
        }
      },
      error: () => {
        // Stop animation on error
        const computedStyle = getComputedStyle(carComponent.car.nativeElement);
        const matrix = new DOMMatrix(computedStyle.transform);
        const currentX = matrix.m41; // The current translation on the X axis
  
        carComponent.car.nativeElement.style.transform = `translateX(${currentX}px)`;
        carComponent.carAnimation = false;
  
        console.log(`Error: Car with ID ${carComponent.carId} stopped moving.`);
      }
    });
  }
  
  resetRace() {
    this.carComponents.forEach((carComponent) => {
      carComponent.carAnimation = false;
      carComponent.translateXValue = '0';
    });
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
            `Car ID ${this.selectedCarId} color updated to ${this.newColor} ${this.newBrand}`
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
}
