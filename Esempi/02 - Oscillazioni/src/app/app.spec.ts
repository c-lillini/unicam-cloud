import { TestBed } from '@angular/core/testing';
import { App } from './app';
import { SimulationService } from './sim/simulation.service';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
    }).compileComponents();
  });

  it('should render title', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h1')?.textContent).toContain('isteresi e cool-down');
  });

  it('should render two autoscaler panels with charts after advancing the simulation', async () => {
    const fixture = TestBed.createComponent(App);
    TestBed.inject(SimulationService).advance(300);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelectorAll('app-scaler-panel').length).toBe(2);
    expect(compiled.querySelectorAll('path.series').length).toBeGreaterThan(0);
    expect(compiled.querySelectorAll('.log li.ev').length).toBeGreaterThan(0);
  });
});
