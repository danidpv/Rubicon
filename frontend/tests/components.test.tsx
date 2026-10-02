// @vitest-environment jsdom
import { describe, expect, it, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { useState } from 'react';
import { McqForm } from '../src/components/cases/mcq-form';
import { EvaluationView } from '../src/components/cases/evaluation';
afterEach(cleanup);
describe('respuestas y corrección', () => {
  it('permite elegir una opción y volver a blanco', () => {
    function Form() { const [answers, setAnswers] = useState<Record<string, number | null>>({}); return <McqForm questions={[{ id: 'q', prompt: '¿Cómo actuar?', options: ['Justificar', 'Suponer'] }]} answers={answers} onChange={setAnswers} />; }
    render(<Form />); const radio = screen.getByLabelText('Justificar') as HTMLInputElement; fireEvent.click(radio); expect(radio.checked).toBe(true); fireEvent.click(screen.getByText('Dejar en blanco')); expect(radio.checked).toBe(false);
  });
  it('muestra refuerzo específico después de entregar', () => { render(<EvaluationView score={0} evaluation={{ score: 0, correct: 0, wrong: 1, blank: 0, details: [{ id: 'q', prompt: 'Pregunta', options: ['A', 'B'], correctAnswer: 1, selected: 0, isCorrect: false, explanation: 'Explicación editorial', recommendation: 'Revisa la competencia antes de proponer la medida.' }] }} />); expect(screen.getByText('Explicación editorial')).toBeTruthy(); expect(screen.getByText('Revisa la competencia antes de proponer la medida.')).toBeTruthy(); });
});
