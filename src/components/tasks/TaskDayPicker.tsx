/**
 * TaskDayPicker Component
 * Compact month calendar used as a day navigator inside the task list.
 * Selecting a day sets the shared $selectedDay — the task list reacts.
 */

import { useState } from 'react';
import { useStore } from '@nanostores/react';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/style.css';
import { ptBR } from 'react-day-picker/locale/pt-BR';
import { $selectedDay, setSelectedDay } from '../../stores/tasksStore';
import { getTaskCountForDate } from '../../stores/tasksStore';
import { formatDateLocal, parseDateLocal, getTodayString } from '../../utils/dateUtils';

export function TaskDayPicker() {
  const selectedDay = useStore($selectedDay);
  const selected = parseDateLocal(selectedDay);
  const [month, setMonth] = useState<Date>(selected);

  const hasTasks = (date: Date) => getTaskCountForDate(formatDateLocal(date)) > 0;

  return (
    <DayPicker
      className="daypicker-root"
      mode="single"
      selected={selected}
      onSelect={(day) => {
        if (day) setSelectedDay(formatDateLocal(day));
      }}
      locale={ptBR}
      month={month}
      onMonthChange={setMonth}
      modifiers={{
        hasTasks,
        today: parseDateLocal(getTodayString()),
      }}
      modifiersClassNames={{
        hasTasks: 'daypicker-has-tasks',
      }}
    />
  );
}