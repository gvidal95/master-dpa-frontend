import { Component } from '@angular/core';

import { EmployeeManagerComponent } from './features/employees/employee-manager/employee-manager.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [EmployeeManagerComponent],
  template: `
    <main class="app-shell">
      <app-employee-manager></app-employee-manager>
    </main>
  `,
  styleUrl: './app.component.scss',
})
export class AppComponent {}
