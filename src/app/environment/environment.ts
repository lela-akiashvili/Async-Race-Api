import { InjectionToken } from '@angular/core';

export interface Environment {
  apiUrl: string;
}
export const ENVIRONMENT_DEFAULT = {
  apiUrl: 'http://127.0.0.1:3000',
};
export const ENVIRONMENT = new InjectionToken<Environment>('ENVIRONMENT', {
  providedIn: 'root',
  factory: () => ENVIRONMENT_DEFAULT,
});
