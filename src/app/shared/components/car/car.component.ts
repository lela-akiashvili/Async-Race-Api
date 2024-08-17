import {
  Component,
  ElementRef,
  EventEmitter,
  inject,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { CarsService } from '../../services/cars.service';
import { EngineService } from '../../services/engine.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-car',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './car.component.html',
  styleUrls: ['./car.component.css'],
})
export class CarComponent implements OnChanges {
  private carService = inject(CarsService);
  private engineService = inject(EngineService);

  @Input() carId: number = 0;
  @Input() carColor: string = 'rgb(255, 0, 115)';
  @Input() carBrand: string = 'BIRO';
  @Input() carAnimation: boolean = false; // Two-way binding property
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

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['carAnimation']) {
      this.handleAnimationChange();
    }
  }

  private handleAnimationChange() {
    if (this.carAnimation) {
      // Start animation
      this.car.nativeElement.style.setProperty(
        '--translateX',
        this.translateXValue,
      );
      this.car.nativeElement.style.animationDuration = `${this.animationDuration}s`;
      this.car.nativeElement.classList.add('car-move');
    } else {
      // Stop animation
      this.car.nativeElement.classList.remove('car-move');
      this.car.nativeElement.style.transform = 'translateX(0)';
    }
  }

  onUpdateClick(newColor: string, carBrand: string) {
    this.carUpdate.emit({ id: this.carId, color: newColor, name: carBrand });
  }

  deleteCar() {
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

        const duration = Math.round(resp.distance / resp.velocity) / 1000;
        const viewportWidth = window.innerWidth;
        const carRect = this.car.nativeElement.getBoundingClientRect();
        const carWidth = carRect.width;
        const carCurrentX = carRect.left;
        const remainingDistance = viewportWidth - carCurrentX - carWidth - 32;

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
        this.car.nativeElement.style.transform = `translateX(0)`;

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
