import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-pagination',
  standalone: true,
  imports: [],
  template: `
  <div>
       <button (click)="prevPage()" [disabled]="currentPage === 1">
      <i class="bi bi-caret-left"></i>
    </button>
    <p>PAGE #{{ currentPage }}/{{ totalPages }}</p>
    <button (click)="nextPage()" [disabled]="currentPage === totalPages || totalPages ===0">
      <i class="bi bi-caret-right"></i>
    </button>
  </div>
 
  `,
  styleUrl: './pagination.component.css',
})
export class PaginationComponent {
  @Input() currentPage = 1;
  @Input() totalPages = 1;
  @Output() pageChange = new EventEmitter<number>();
 
  prevPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.pageChange.emit(this.currentPage);
    }
  }
  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.pageChange.emit(this.currentPage);
    }
  }
}
