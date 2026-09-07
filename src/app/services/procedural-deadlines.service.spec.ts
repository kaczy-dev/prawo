import { TestBed } from '@angular/core/testing';
import { ProceduralDeadlinesService } from './procedural-deadlines.service';

describe('ProceduralDeadlinesService', () => {
  let service: ProceduralDeadlinesService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ProceduralDeadlinesService],
    });
    service = TestBed.inject(ProceduralDeadlinesService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should calculate standard 7 days deadline (art. 422 k.p.k.)', () => {
    // 2026-09-01 (wtorek) + 7 dni = 2026-09-08 (wtorek - dzień roboczy)
    const result = service.calculateDeadline('uzasadnienie_wyroku', '2026-09-01');
    expect(result).not.toBeNull();
    expect(result?.startDate).toBe('2026-09-01');
    expect(result?.rawEndDate).toBe('2026-09-08');
    expect(result?.adjustedEndDate).toBe('2026-09-08');
    expect(result?.isExtendedByWeekendOrHoliday).toBe(false);
  });

  it('should shift deadline falling on Saturday to Monday (art. 123 § 3 k.p.k.)', () => {
    // 2026-09-05 to sobota. Jeśli wyrok ogłoszono 2026-08-29 (sobota) + 7 dni = 2026-09-05 (sobota)
    // Powinno przesunąć na poniedziałek 2026-09-07
    const result = service.calculateDeadline('uzasadnienie_wyroku', '2026-08-29');
    expect(result).not.toBeNull();
    expect(result?.rawEndDate).toBe('2026-09-05');
    expect(result?.adjustedEndDate).toBe('2026-09-07');
    expect(result?.isExtendedByWeekendOrHoliday).toBe(true);
    expect(result?.adjustmentReason).toContain('art. 123 § 3 k.p.k.');
  });

  it('should detect Polish public holidays like November 1 (Wszystkich Świętych)', () => {
    const nov1 = new Date(2026, 10, 1); // 1 listopada
    expect(service.isPolishPublicHoliday(nov1)).toBe(true);
  });
});
