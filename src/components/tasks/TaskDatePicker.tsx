/**
 * TaskDatePicker Component
 * Accessible date picker using react-day-picker (same component family as the
 * calendar view). Replaces the native <input type="date"> in the task form.
 */

import { useState } from 'react';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/style.css';
import { ptBR } from 'react-day-picker/locale/pt-BR';
import { parseDateLocal, formatDateLocal, isValidDateString } from '../../utils/dateUtils';

interface TaskDatePickerProps {
  value?: string;
  onChange: (value: string | undefined) => void;
  id?: string;
}

export function TaskDatePicker({ value, onChange, id }: TaskDatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const selected = value && isValidDateString(value) ? parseDateLocal(value) : undefined;

  const handleSelect = (day: Date | undefined) => {
    onChange(day && !Number.isNaN(day.getTime()) ? formatDateLocal(day) : undefined);
    setIsOpen(false);
  };

  return (
    <div>
      <button
        id={id}
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        className={`w-full px-4 py-3 text-left bg-theme-bg text-theme-text rounded-lg transition-colors focus:ring-2 focus:ring-theme-accent focus:border-theme-accent outline-none ${
          value ? 'border border-theme-accent' : 'border border-theme-border'
        }`}
      >
        {selected
          ? selected.toLocaleDateString('pt-BR', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })
          : 'Escolher uma data'}
      </button>

      {isOpen && (
        <div
          role="dialog"
          aria-label="Escolher data"
          aria-modal="false"
          className="mt-2 border border-theme-border rounded-xl bg-theme-sidebar p-3"
        >
          <DayPicker
            className="daypicker-root"
            mode="single"
            selected={selected}
            onSelect={handleSelect}
            locale={ptBR}
            autoFocus
            today={new Date()}
          />
          {value && (
            <button
              type="button"
              onClick={() => handleSelect(undefined)}
              className="mt-2 w-full py-2 text-sm text-theme-muted hover:text-theme-text hover:bg-theme-bg rounded-lg transition-colors focus:ring-2 focus:ring-theme-accent outline-none"
            >
              Remover data
            </button>
          )}
        </div>
      )}
    </div>
  );
}
