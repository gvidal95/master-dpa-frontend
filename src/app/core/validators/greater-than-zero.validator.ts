import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

/** Valida que el valor sea un número estrictamente mayor que cero. */
export const greaterThanZeroValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  const value = control.value;

  if (value === null || value === undefined || value === '') {
    return null; // El validador `required` se encarga de los valores vacíos.
  }

  const numericValue = Number(value);

  if (Number.isNaN(numericValue) || numericValue <= 0) {
    return { greaterThanZero: true };
  }

  return null;
};
