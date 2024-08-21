import {
  Component,
  ElementRef,
  EventEmitter,
  inject,
  Input,
  Output,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { CarsService } from '../../services/cars.service';
import { EngineService } from '../../services/engine.service';
import { WinnersService } from '../../services/winners.service';

const  padding =32;
const seconds = 1000;
@Component({
  selector: 'app-car',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './car.component.html',
  styleUrls: ['./car.component.css'],
})
export class CarComponent {
  private carService = inject(CarsService);

  private engineService = inject(EngineService);

  private winnerService = inject(WinnersService);


  @Input() carId: number = 0;

  @Input() carColor: string = '';

  @Input() carBrand: string = '';

  @Input() carAnimation: boolean = false;

  @Input() animationDuration: number = 0;

  @Input() translateXValue: string = '0';

  @Output() carDeleted = new EventEmitter<void>();
  
  @Output() carUpdate = new EventEmitter<{
    id: number;
    color: string;
    name: string;
  }>();
  
  @Output() winner = new EventEmitter<string>();

  @ViewChild('car', { static: true }) car!: ElementRef<SVGElement>;

  stopBlocked = true;

  startBlocked = false;

  onUpdateClick(newColor: string, carBrand: string) {
    this.carUpdate.emit({ id: this.carId, color: newColor, name: carBrand });
  }

  deleteCar() {
    this.winnerService.getWinnerById(this.carId).subscribe({
      next: () => {
        this.winnerService.deleteWinner(this.carId).subscribe(() => {
          console.log(`Winner with Car ID ${this.carId} deleted successfully.`);
          this.deleteCarRecord();
        });
      },
      error: () => {
        this.deleteCarRecord();
      },
    });
  }

  private deleteCarRecord() {
    this.carService.deleteCar(this.carId).subscribe({
      next: () => {
        console.log(`Car with ID ${this.carId} deleted successfully.`);
        this.carDeleted.emit();
      },
      error: (err) => console.log(err),
    });
  }

  startEngine(id: number) {
    this.engineService.startOrStopCarById(id, 'started').subscribe({
      next: (resp) => {
        this.startBlocked = true;
        this.stopBlocked = false;

        const duration = Math.round(resp.distance / resp.velocity) / seconds;
        const viewportWidth = window.innerWidth;
        const carRect = this.car.nativeElement.getBoundingClientRect();
        const carWidth = carRect.width;
        const carCurrentX = carRect.left;
        const remainingDistance = viewportWidth - carCurrentX - carWidth - padding;

        this.animationDuration = duration;
        this.translateXValue = `${remainingDistance}px`;
        this.carAnimation = true;
        this.driveCar();

        console.log(
          `Calculated duration: ${duration}s, Remaining Distance: ${remainingDistance}px`,
        );
      },
      error: (err) => console.log(err),
    });
  }

  stopEngine(id: number) {
    this.engineService.startOrStopCarById(id, 'stopped').subscribe({
      next: () => {
        this.startBlocked = false;
        this.stopBlocked = true;

        this.carAnimation = false;
        this.translateXValue = '0';
        this.car.nativeElement.style.transform = 'translateX(0)';

        console.log(`Car with ID ${id} stopped and reset.`);
      },
      error: (err) => console.log(err),
    });
  }

  driveCar() {
    this.engineService.driveRequestById(this.carId).subscribe({
      next: (resp) => {
        console.log(resp);
      },
      error: () => {
        this.stopBlocked = false;
        const computedStyle = getComputedStyle(this.car.nativeElement);
        const matrix = new DOMMatrix(computedStyle.transform);
        const currentX = matrix.m41;

        this.car.nativeElement.style.transform = `translateX(${currentX}px)`;
        this.carAnimation = false;

        console.log('Error: Car has stopped moving.');
      },
    });
  }
}
