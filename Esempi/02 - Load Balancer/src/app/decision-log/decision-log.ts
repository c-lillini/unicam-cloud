import { Component, inject } from '@angular/core';
import { SimulationService } from '../simulation.service';

@Component({
  selector: 'app-decision-log',
  templateUrl: './decision-log.html',
  styleUrl: './decision-log.css',
})
export class DecisionLog {
  protected readonly sim = inject(SimulationService);
}
