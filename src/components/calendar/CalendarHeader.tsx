/**
 * CalendarHeader Component
 * Header with month/year display, navigation, and "Hoje" button
 */

import { $settings } from '../../stores/settingsStore';
import { useStore } from '@nanostores/react';

interface CalendarHeaderProps {
  year: number;
  month: number; // 0-11
  onPreviousMonth: () => void;
  onNextMonth: () => void;
  onToday: () => void;
}

const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

export function CalendarHeader({ 
  year, 
  month, 
  onPreviousMonth, 
  onNextMonth, 
  onToday 
}: CalendarHeaderProps) {
  const settings = useStore($settings);
  
  const monthName = MONTHS[month];
  const transitionClass = settings.reduceMotion ? '' : 'transition-colors duration-150';

  return (
    <div className="flex items-center justify-between mb-6">
      {/* Month/Year Display */}
      <h2 className={`text-2xl font-semibold text-theme-text ${
        settings.fontScale === 'sm' ? 'text-xl' :
        settings.fontScale === 'lg' ? 'text-3xl' :
        settings.fontScale === 'xl' ? 'text-4xl' :
        'text-2xl'
      }`}>
        {monthName} {year}
      </h2>

      {/* Navigation Controls */}
      <div className="flex items-center gap-3">
        {/* Previous/Next Month Buttons */}
        <div className="flex items-center gap-1">
          <button
            onClick={onPreviousMonth}
            className={`p-2 text-theme-muted hover:text-theme-text hover:bg-theme-sidebar rounded-lg focus:outline-none focus:ring-2 focus:ring-theme-accent ${transitionClass}`}
            aria-label="Mês anterior"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={onNextMonth}
            className={`p-2 text-theme-muted hover:text-theme-text hover:bg-theme-sidebar rounded-lg focus:outline-none focus:ring-2 focus:ring-theme-accent ${transitionClass}`}
            aria-label="Próximo mês"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* Hoje Button */}
        <button
          onClick={onToday}
          className={`px-4 py-2 text-sm font-medium text-theme-text bg-theme-sidebar hover:bg-theme-bg border border-theme-border rounded-lg focus:outline-none focus:ring-2 focus:ring-theme-accent ${transitionClass}`}
          aria-label="Ir para hoje"
        >
          Hoje
        </button>
      </div>
    </div>
  );
}
