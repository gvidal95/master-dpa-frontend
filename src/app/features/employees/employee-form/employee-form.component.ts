import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { CreateEmployeeDto, Employee, UpdateEmployeeDto } from '../../../core/models/employee.model';
import { greaterThanZeroValidator } from '../../../core/validators/greater-than-zero.validator';

/** Evento emitido al guardar una edición: id del empleado + campos modificados. */
export interface UpdateEmployeeEvent {
  id: string;
  changes: UpdateEmployeeDto;
}

@Component({
  selector: 'app-employee-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './employee-form.component.html',
  styleUrl: './employee-form.component.scss',
})
export class EmployeeFormComponent implements OnChanges {
  /** Empleado a editar. `null` indica modo alta. */
  @Input() employee: Employee | null = null;
  /** Indica si hay una operación de guardado en curso (deshabilita el formulario). */
  @Input() saving = false;
  /** Errores de validación del backend, indexados por nombre de campo. */
  @Input() fieldErrors: Record<string, string> | null = null;

  @Output() create = new EventEmitter<CreateEmployeeDto>();
  @Output() update = new EventEmitter<UpdateEmployeeEvent>();
  @Output() cancelEdit = new EventEmitter<void>();

  readonly form: ReturnType<FormBuilder['group']>;

  constructor(private readonly formBuilder: FormBuilder) {
    this.form = this.formBuilder.group({
      nombre: ['', [Validators.required, Validators.maxLength(120)]],
      cargo: ['', [Validators.required, Validators.maxLength(120)]],
      departamento: ['', [Validators.required, Validators.maxLength(120)]],
      sueldo: [null as number | null, [Validators.required, greaterThanZeroValidator]],
    });
  }

  get isEditMode(): boolean {
    return this.employee !== null;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['employee']) {
      this.resetFormWithEmployee(this.employee);
    }

    if (changes['fieldErrors'] && this.fieldErrors) {
      this.applyBackendFieldErrors(this.fieldErrors);
    }
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();
    const dto: CreateEmployeeDto = {
      nombre: value.nombre!.trim(),
      cargo: value.cargo!.trim(),
      departamento: value.departamento!.trim(),
      sueldo: Number(value.sueldo),
    };

    if (this.isEditMode && this.employee) {
      this.update.emit({ id: this.employee._id, changes: dto });
    } else {
      this.create.emit(dto);
    }
  }

  onCancel(): void {
    this.resetFormWithEmployee(null);
    this.cancelEdit.emit();
  }

  /** Mensaje de error a mostrar bajo un control, priorizando validación local y luego backend. */
  errorFor(controlName: 'nombre' | 'cargo' | 'departamento' | 'sueldo'): string | null {
    const control = this.form.get(controlName);

    if (control && control.touched && control.errors) {
      if (control.errors['required']) {
        return 'Este campo es obligatorio.';
      }
      if (control.errors['maxlength']) {
        return 'El texto es demasiado largo.';
      }
      if (control.errors['greaterThanZero']) {
        return 'El sueldo debe ser un número mayor que cero.';
      }
    }

    return this.fieldErrors?.[controlName] ?? null;
  }

  private resetFormWithEmployee(employee: Employee | null): void {
    if (employee) {
      this.form.reset({
        nombre: employee.nombre,
        cargo: employee.cargo,
        departamento: employee.departamento,
        sueldo: employee.sueldo,
      });
    } else {
      this.form.reset({ nombre: '', cargo: '', departamento: '', sueldo: null });
    }
  }

  private applyBackendFieldErrors(fieldErrors: Record<string, string>): void {
    for (const [field, message] of Object.entries(fieldErrors)) {
      const control = this.form.get(field);
      if (control) {
        control.setErrors({ ...(control.errors ?? {}), backend: true });
        control.markAsTouched();
      }
    }
    // Los mensajes en sí se muestran vía errorFor() a partir de @Input fieldErrors.
    void fieldErrors;
  }
}
