/**
 * Empleado tal como lo devuelve el backend.
 */
export interface Employee {
  _id: string;
  nombre: string;
  cargo: string;
  departamento: string;
  sueldo: number;
}

/** Campos editables de un empleado (sin identificador). */
export type EmployeeFormFields = Omit<Employee, '_id'>;

/** Datos necesarios para crear un empleado. */
export type CreateEmployeeDto = EmployeeFormFields;

/** Datos para actualizar un empleado: uno o más campos. */
export type UpdateEmployeeDto = Partial<EmployeeFormFields>;

/** Un error de validación asociado (opcionalmente) a un campo del formulario. */
export interface ApiFieldError {
  field?: string;
  message: string;
}

/** Forma de las respuestas del backend, exitosas o con error. */
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  errors?: ApiFieldError[] | Record<string, string> | string[];
}

/** Resultado de una operación CRUD, para mostrar feedback en la interfaz. */
export interface OperationStatus {
  type: 'success' | 'error';
  message: string;
  /** Errores de validación indexados por nombre de campo, cuando aplica. */
  fieldErrors: Record<string, string>;
}
