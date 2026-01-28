/**
 * RoutineTemplates Component
 * Pre-built daily/weekly structures for autism predictability needs
 * Provides consistent timing and structure to reduce decision fatigue
 */

import { useState } from 'react';
import { useStore } from '@nanostores/react';
import { $settings } from '../../stores/settingsStore';
import { addTask } from '../../stores/tasksStore';
import { Button } from '../ui/Button';
import { Clock, Calendar, Coffee, Moon, Sunrise, BookOpen } from 'lucide-react';

interface RoutineTemplate {
  id: string;
  name: string;
  icon: any;
  description: string;
  category: 'morning' | 'evening' | 'work' | 'weekend';
  estimatedTime: string;
  tasks: Array<{
    title: string;
    description?: string;
    estimatedMinutes: number;
  }>;
}

const routineTemplates: RoutineTemplate[] = [
  {
    id: 'gentle-morning',
    name: 'Manhã Suave',
    icon: Sunrise,
    description: 'Rotina matinal calma e previsível',
    category: 'morning',
    estimatedTime: '45 min',
    tasks: [
      { title: 'Beber um copo de água', estimatedMinutes: 2 },
      { title: 'Respirações profundas (5 minutos)', estimatedMinutes: 5 },
      { title: 'Revisar objetivos do dia', estimatedMinutes: 10 },
      { title: 'Alongamento leve ou movimento', estimatedMinutes: 15 },
      { title: 'Preparar café ou chá mindful', estimatedMinutes: 8 },
      { title: 'Escolher roupa para o dia', estimatedMinutes: 5 }
    ]
  },
  {
    id: 'evening-wind-down',
    name: 'Relaxamento Noturno',
    icon: Moon,
    description: 'Transição suave para o descanso',
    category: 'evening',
    estimatedTime: '35 min',
    tasks: [
      { title: 'Refletir sobre o dia', description: '3 coisas boas que aconteceram', estimatedMinutes: 10 },
      { title: 'Preparar prioridades de amanhã', estimatedMinutes: 10 },
      { title: 'Atividade calma (leitura/música)', estimatedMinutes: 15 },
      { title: 'Prática de gratidão', estimatedMinutes: 5 },
      { title: 'Organizar espaço para amanhã', estimatedMinutes: 10 }
    ]
  },
  {
    id: 'focus-work-session',
    name: 'Sessão de Trabalho Focado',
    icon: BookOpen,
    description: 'Estrutura para trabalho profundo',
    category: 'work',
    estimatedTime: '90 min',
    tasks: [
      { title: 'Limpar e organizar espaço de trabalho', estimatedMinutes: 5 },
      { title: 'Revisar objetivos da sessão', estimatedMinutes: 5 },
      { title: 'Trabalho focado - Bloco 1', description: 'Pomodoro 25 min', estimatedMinutes: 25 },
      { title: 'Pausa ativa', description: 'Movimento ou respiração', estimatedMinutes: 5 },
      { title: 'Trabalho focado - Bloco 2', description: 'Pomodoro 25 min', estimatedMinutes: 25 },
      { title: 'Pausa ativa', estimatedMinutes: 5 },
      { title: 'Trabalho focado - Bloco 3', description: 'Pomodoro 25 min', estimatedMinutes: 25 },
      { title: 'Revisar e documentar progresso', estimatedMinutes: 10 }
    ]
  },
  {
    id: 'sensory-break',
    name: 'Pausa Sensorial',
    icon: Coffee,
    description: 'Reset quando sobrecarregado',
    category: 'work',
    estimatedTime: '15 min',
    tasks: [
      { title: 'Encontrar espaço calmo', estimatedMinutes: 2 },
      { title: 'Respiração quadrada (4-4-4-4)', description: '5 repetições', estimatedMinutes: 3 },
      { title: 'Atividade de grounding', description: '5 coisas que vê, 4 que ouve...', estimatedMinutes: 5 },
      { title: 'Hidratação mindful', estimatedMinutes: 3 },
      { title: 'Definir próximo passo simples', estimatedMinutes: 2 }
    ]
  },
  {
    id: 'weekend-recharge',
    name: 'Recarga de Fim de Semana',
    icon: Calendar,
    description: 'Estrutura relaxante para weekends',
    category: 'weekend',
    estimatedTime: '120 min',
    tasks: [
      { title: 'Acordar sem pressa', description: 'Sem alarme se possível', estimatedMinutes: 30 },
      { title: 'Atividade prazerosa', description: 'Hobby ou interesse especial', estimatedMinutes: 45 },
      { title: 'Movimento corporal', description: 'Caminhada, dança, esporte', estimatedMinutes: 30 },
      { title: 'Conexão social ou solidão intencional', description: 'O que você precisa hoje', estimatedMinutes: 30 },
      { title: 'Preparação suave para semana', description: 'Sem pressão, só organização básica', estimatedMinutes: 15 }
    ]
  }
];

export function RoutineTemplates() {
  const settings = useStore($settings);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [expandedTemplate, setExpandedTemplate] = useState<string | null>(null);

  if (!settings.ndSettings?.routineTemplates) {
    return null;
  }

  const categories = [
    { id: 'all', label: 'Todas' },
    { id: 'morning', label: 'Manhã' },
    { id: 'work', label: 'Trabalho' },
    { id: 'evening', label: 'Noite' },
    { id: 'weekend', label: 'Fim de semana' }
  ];

  const filteredTemplates = selectedCategory === 'all' 
    ? routineTemplates
    : routineTemplates.filter(t => t.category === selectedCategory);

  const handleCreateFromTemplate = (template: RoutineTemplate) => {
    // Create a master task
    const taskId = addTask({
      title: template.name,
      description: template.description,
      archived: false
    });

    // Add each routine step as a subtask
    template.tasks.forEach((step, index) => {
      const { addSubtask } = require('../../stores/tasksStore');
      addSubtask(taskId, step.title);
    });

    alert(`Rotina "${template.name}" criada com sucesso!`);
  };

  return (
    <div className="bg-theme-sidebar rounded-xl p-6">
      <h3 className="text-lg font-semibold text-theme-text mb-4">
        Rotinas Estruturadas
      </h3>
      
      <p className="text-sm text-theme-muted mb-6">
        Estruturas previsíveis para reduzir decisões e ansiedade de mudança
      </p>

      {/* Category Filter */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {categories.map(category => (
          <button
            key={category.id}
            onClick={() => setSelectedCategory(category.id)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
              settings.reduceMotion ? '' : 'duration-200'
            } ${
              selectedCategory === category.id
                ? 'bg-theme-accent text-white'
                : 'bg-theme-bg text-theme-muted hover:bg-theme-border'
            }`}
          >
            {category.label}
          </button>
        ))}
      </div>

      {/* Templates */}
      <div className="space-y-4">
        {filteredTemplates.map(template => {
          const Icon = template.icon;
          const isExpanded = expandedTemplate === template.id;

          return (
            <div
              key={template.id}
              className="border border-theme-border rounded-lg overflow-hidden"
            >
              <button
                onClick={() => setExpandedTemplate(isExpanded ? null : template.id)}
                className="w-full p-4 text-left hover:bg-theme-bg transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-5 h-5 text-theme-accent" />
                  <div className="flex-1">
                    <h4 className="font-semibold text-theme-text">{template.name}</h4>
                    <p className="text-sm text-theme-muted">{template.description}</p>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-theme-muted">
                    <Clock className="w-3 h-3" />
                    <span>{template.estimatedTime}</span>
                  </div>
                </div>
              </button>

              {isExpanded && (
                <div className="border-t border-theme-border p-4 bg-theme-bg/50">
                  <h5 className="font-medium text-theme-text mb-3">Passos da Rotina</h5>
                  <div className="space-y-2 mb-4">
                    {template.tasks.map((task, index) => (
                      <div key={index} className="flex items-center gap-3 text-sm">
                        <div className="w-6 h-6 bg-theme-accent/20 text-theme-accent rounded-full flex items-center justify-center text-xs font-medium">
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <span className="text-theme-text">{task.title}</span>
                          {task.description && (
                            <div className="text-xs text-theme-muted">{task.description}</div>
                          )}
                        </div>
                        <span className="text-xs text-theme-muted">{task.estimatedMinutes}m</span>
                      </div>
                    ))}
                  </div>
                  
                  <Button
                    onClick={() => handleCreateFromTemplate(template)}
                    size="small"
                    className="w-full"
                  >
                    Criar Rotina
                  </Button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}