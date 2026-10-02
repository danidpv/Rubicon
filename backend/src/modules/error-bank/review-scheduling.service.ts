import { Injectable } from '@nestjs/common';
export const reviewIntervals = { SEVERE: 1, ERROR: 2, DOUBT: 3, CORRECT: 5, MASTERED: 10 } as const;
@Injectable()
export class ReviewSchedulingService { next(rating: keyof typeof reviewIntervals, now = new Date()) { return new Date(now.getTime() + reviewIntervals[rating] * 86400000); } }
export const updateMastery = (previous: number, result: number) => previous * .75 + result * .25;
