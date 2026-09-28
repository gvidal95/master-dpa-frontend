import { ApiFieldError, ApiResponse } from '../models/employee.model';

/**
 * Convierte el campo `errors` de una respuesta de error del backend (que puede
 * llegar como arreglo de strings, arreglo de { field, message } o como objeto
 * { campo: mensaje }) a un mapa uniforme { campo: mensaje } para poder
 * asociar cada mensaje a su control de formulario.
 *
 * Los errores que no pueden asociarse a un campo concreto se guardan bajo la
 * clave `general`, concatenados.
 */
export function normalizeApiErrors(errors: ApiResponse<unknown>['errors']): Record<string, string> {
  const normalized: Record<string, string> = {};

  if (!errors) {
    return normalized;
  }

  const generalMessages: string[] = [];

  if (Array.isArray(errors)) {
    for (const entry of errors) {
      if (typeof entry === 'string') {
        generalMessages.push(entry);
      } else if (entry && typeof entry === 'object') {
        const fieldError = entry as ApiFieldError;
        if (fieldError.field) {
          normalized[fieldError.field] = fieldError.message;
        } else if (fieldError.message) {
          generalMessages.push(fieldError.message);
        }
      }
    }
  } else if (typeof errors === 'object') {
    for (const [field, message] of Object.entries(errors)) {
      normalized[field] = String(message);
    }
  }

  if (generalMessages.length > 0) {
    normalized['general'] = generalMessages.join(' ');
  }

  return normalized;
}
