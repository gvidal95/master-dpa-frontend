import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject, catchError, finalize, map, tap, throwError } from 'rxjs';

import {
  ApiResponse,
  CreateEmployeeDto,
  Employee,
  OperationStatus,
  UpdateEmployeeDto,
} from '../models/employee.model';
import { normalizeApiErrors } from '../utils/api-error.util';

/** Prefijo de la API. El proxy de desarrollo lo redirige a http://localhost:3000. */
const API_BASE_URL = '/api/v1/empleados';

@Injectable({ providedIn: 'root' })
export class EmployeeService {
  // Estado privado: nadie fuera del servicio puede emitir directamente sobre estos subjects.
  private readonly employeesSubject = new BehaviorSubject<Employee[]>([]);
  private readonly loadingSubject = new BehaviorSubject<boolean>(false);
  private readonly statusSubject = new BehaviorSubject<OperationStatus | null>(null);

  /** Lista de empleados, de solo lectura para los consumidores del servicio. */
  readonly employees$: Observable<Employee[]> = this.employeesSubject.asObservable();
  /** Indica si hay una operación HTTP en curso. */
  readonly loading$: Observable<boolean> = this.loadingSubject.asObservable();
  /** Resultado (éxito/error) de la última operación realizada. */
  readonly status$: Observable<OperationStatus | null> = this.statusSubject.asObservable();

  constructor(private readonly http: HttpClient) {}

  /** Obtiene la lista completa de empleados y actualiza el estado interno. */
  loadEmployees(): Observable<Employee[]> {
    this.loadingSubject.next(true);
    return this.http.get<ApiResponse<Employee[]>>(API_BASE_URL).pipe(
      tap((response) => this.employeesSubject.next(response.data ?? [])),
      map((response) => response.data ?? []),
      catchError((error: HttpErrorResponse) => this.handleError(error)),
      finalize(() => this.loadingSubject.next(false)),
    );
  }

  /** Crea un empleado y lo agrega al final de la lista de forma inmutable. */
  createEmployee(dto: CreateEmployeeDto): Observable<Employee> {
    this.loadingSubject.next(true);
    return this.http.post<ApiResponse<Employee>>(API_BASE_URL, dto).pipe(
      tap((response) => {
        this.employeesSubject.next([...this.employeesSubject.value, response.data]);
        this.publishStatus('success', response.message || 'Empleado creado correctamente.');
      }),
      map((response) => response.data),
      catchError((error: HttpErrorResponse) => this.handleError(error)),
      finalize(() => this.loadingSubject.next(false)),
    );
  }

  /** Actualiza uno o más campos de un empleado y refresca la lista de forma inmutable. */
  updateEmployee(id: string, dto: UpdateEmployeeDto): Observable<Employee> {
    this.loadingSubject.next(true);
    return this.http.put<ApiResponse<Employee>>(`${API_BASE_URL}/${id}`, dto).pipe(
      tap((response) => {
        this.employeesSubject.next(
          this.employeesSubject.value.map((employee) =>
            employee._id === id ? { ...employee, ...response.data } : employee,
          ),
        );
        this.publishStatus('success', response.message || 'Empleado actualizado correctamente.');
      }),
      map((response) => response.data),
      catchError((error: HttpErrorResponse) => this.handleError(error)),
      finalize(() => this.loadingSubject.next(false)),
    );
  }

  /** Elimina un empleado y lo remueve de la lista de forma inmutable. */
  deleteEmployee(id: string): Observable<void> {
    this.loadingSubject.next(true);
    return this.http.delete<ApiResponse<null>>(`${API_BASE_URL}/${id}`).pipe(
      tap((response) => {
        this.employeesSubject.next(this.employeesSubject.value.filter((employee) => employee._id !== id));
        this.publishStatus('success', response.message || 'Empleado eliminado correctamente.');
      }),
      map(() => undefined),
      catchError((error: HttpErrorResponse) => this.handleError(error)),
      finalize(() => this.loadingSubject.next(false)),
    );
  }

  /** Limpia el último mensaje de estado (por ejemplo, al cerrar el aviso). */
  clearStatus(): void {
    this.statusSubject.next(null);
  }

  private publishStatus(type: OperationStatus['type'], message: string, fieldErrors: Record<string, string> = {}): void {
    this.statusSubject.next({ type, message, fieldErrors });
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    const apiResponse = error.error as ApiResponse<null> | undefined;
    const { general, ...fieldErrors } = normalizeApiErrors(apiResponse?.errors);
    let message =
      apiResponse?.message ||
      (error.status === 0
        ? 'No se pudo conectar con el servidor. Verifica que el backend esté disponible.'
        : 'Ocurrió un error al comunicarse con el servidor.');

    // Los errores no asociados a un campo del formulario se anexan al mensaje visible.
    if (general) {
      message = `${message} ${general}`;
    }

    this.publishStatus('error', message, fieldErrors);
    return throwError(() => ({ message, fieldErrors }));
  }
}
