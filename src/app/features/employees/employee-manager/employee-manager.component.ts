import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Observable, combineLatest, take } from 'rxjs';

import { CreateEmployeeDto, Employee, OperationStatus } from '../../../core/models/employee.model';
import { EmployeeService } from '../../../core/services/employee.service';
import { EmployeeFormComponent, UpdateEmployeeEvent } from '../employee-form/employee-form.component';
import { EmployeeListComponent } from '../employee-list/employee-list.component';

interface EmployeeManagerViewModel {
  employees: Employee[];
  loading: boolean;
  status: OperationStatus | null;
}

@Component({
  selector: 'app-employee-manager',
  standalone: true,
  imports: [CommonModule, EmployeeFormComponent, EmployeeListComponent],
  templateUrl: './employee-manager.component.html',
  styleUrl: './employee-manager.component.scss',
})
export class EmployeeManagerComponent implements OnInit {
  /** Empleado seleccionado para edición; null significa modo alta. Estado puramente de UI. */
  selectedEmployee: Employee | null = null;

  /** Vista combinada del estado del servicio, consumida en la plantilla con el async pipe. */
  readonly vm$: Observable<EmployeeManagerViewModel>;

  constructor(private readonly employeeService: EmployeeService) {
    this.vm$ = combineLatest({
      employees: this.employeeService.employees$,
      loading: this.employeeService.loading$,
      status: this.employeeService.status$,
    });
  }

  ngOnInit(): void {
    this.employeeService
      .loadEmployees()
      .pipe(take(1))
      .subscribe({ error: () => undefined }); // El error ya queda reflejado en status$.
  }

  handleCreate(dto: CreateEmployeeDto): void {
    this.employeeService
      .createEmployee(dto)
      .pipe(take(1))
      .subscribe({ error: () => undefined });
  }

  handleUpdate({ id, changes }: UpdateEmployeeEvent): void {
    this.employeeService
      .updateEmployee(id, changes)
      .pipe(take(1))
      .subscribe({
        next: () => (this.selectedEmployee = null),
        error: () => undefined,
      });
  }

  handleDelete(employee: Employee): void {
    this.employeeService
      .deleteEmployee(employee._id)
      .pipe(take(1))
      .subscribe({
        next: () => {
          if (this.selectedEmployee?._id === employee._id) {
            this.selectedEmployee = null;
          }
        },
        error: () => undefined,
      });
  }

  handleEdit(employee: Employee): void {
    this.selectedEmployee = employee;
  }

  handleCancelEdit(): void {
    this.selectedEmployee = null;
  }

  dismissStatus(): void {
    this.employeeService.clearStatus();
  }
}
