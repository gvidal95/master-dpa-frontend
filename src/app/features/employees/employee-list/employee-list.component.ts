import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';

import { Employee } from '../../../core/models/employee.model';

@Component({
  selector: 'app-employee-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './employee-list.component.html',
  styleUrl: './employee-list.component.scss',
})
export class EmployeeListComponent {
  @Input() employees: Employee[] = [];
  @Input() loading = false;

  @Output() edit = new EventEmitter<Employee>();
  @Output() delete = new EventEmitter<Employee>();

  /** Id del empleado cuya eliminación se está confirmando en la fila, o null. */
  pendingDeleteId: string | null = null;

  trackById(_index: number, employee: Employee): string {
    return employee._id;
  }

  onEditClick(employee: Employee): void {
    this.pendingDeleteId = null;
    this.edit.emit(employee);
  }

  requestDelete(employee: Employee): void {
    this.pendingDeleteId = employee._id;
  }

  confirmDelete(employee: Employee): void {
    this.pendingDeleteId = null;
    this.delete.emit(employee);
  }

  cancelDelete(): void {
    this.pendingDeleteId = null;
  }
}
