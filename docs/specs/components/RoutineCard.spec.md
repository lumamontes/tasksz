# RoutineCard Component Specification

**Version**: 1.0  
**Status**: Draft  
**Author**: Tarefitas Team  
**Last Updated**: 2026-01-24

## Overview

The RoutineCard component displays routine information in a visually calming, accessible card format optimized for neurodivergent users. It serves as the primary interface element for routine selection, progress tracking, and quick actions.

## Requirements

### Functional Requirements

#### FR-RC-001: Routine Information Display
**Priority**: High  
**Description**: The RoutineCard MUST display essential routine information clearly:
- Routine name (required)
- Routine description (optional, truncated if long)
- Estimated duration with time-aware formatting
- Routine icon/emoji (optional)
- Last completed timestamp (if available)

**Acceptance Criteria**:
- Name is displayed prominently using heading-4 typography
- Description truncates after 2 lines with ellipsis
- Duration shows in human-readable format ("25 min", "1h 15m")
- Icon appears consistently positioned (top-left)
- "Last completed" shows relative time ("2 hours ago", "Yesterday")

#### FR-RC-002: Progress Visualization
**Priority**: High  
**Description**: The RoutineCard MUST show routine completion progress:
- Current step indicator (if routine is in progress)
- Overall completion percentage
- Visual progress bar
- Step count display ("3 of 7 steps")

**Acceptance Criteria**:
- Progress bar fills from left to right
- Current step highlighted with accent color
- Percentage displayed as whole numbers (0-100%)
- Progress elements hidden for non-started routines

#### FR-RC-003: Interactive States
**Priority**: High  
**Description**: The RoutineCard MUST support multiple interactive states:
- `idle` - Default state, ready to start
- `in-progress` - Routine currently being executed
- `completed` - Routine finished today
- `paused` - Routine started but temporarily stopped

**Acceptance Criteria**:
- Each state has distinct visual treatment
- State transitions are smooth and predictable
- Touch targets meet 44px minimum requirement
- State is communicated to screen readers

#### FR-RC-004: Quick Actions
**Priority**: Medium  
**Description**: The RoutineCard MUST support contextual quick actions:
- Start/Resume routine (primary action)
- Pause routine (when in progress)
- Complete routine (skip remaining steps)
- Edit routine (secondary action)

**Acceptance Criteria**:
- Primary action button prominently displayed
- Secondary actions accessible via menu/overflow
- Actions change based on current state
- All actions keyboard accessible

### Accessibility Requirements

#### AR-RC-001: Screen Reader Support
**Priority**: High  
**Description**: RoutineCard MUST provide comprehensive screen reader experience:
- Semantic structure with proper headings
- Complete routine information announced
- Current state and progress communicated
- Action availability clearly indicated

**Acceptance Criteria**:
- Uses `article` element for semantic structure
- Routine name uses heading element (h3)
- Progress information has proper labels
- State changes announced via live regions

#### AR-RC-002: Keyboard Navigation
**Priority**: High  
**Description**: RoutineCard MUST be fully keyboard accessible:
- Card focusable as single unit
- Tab navigation through interactive elements
- Enter/Space activates primary action
- Arrow keys navigate between actions

**Acceptance Criteria**:
- Card receives focus with visible indicator
- Focus management preserves tab order
- All interactive elements reachable via keyboard
- Focus indicator meets WCAG 2.2 requirements

#### AR-RC-003: High Contrast Support
**Priority**: High  
**Description**: RoutineCard MUST work in high contrast modes:
- All text meets WCAG AAA contrast (7:1)
- Progress indicators remain visible
- State differentiation maintained
- Focus indicators clearly visible

**Acceptance Criteria**:
- Card borders visible in high contrast mode
- Progress bar maintains contrast in all states
- Text readable against all background variations
- Interactive elements clearly distinguishable

### UX Requirements

#### UX-RC-001: Cognitive Load Reduction
**Priority**: High  
**Description**: RoutineCard MUST minimize cognitive processing requirements:
- Single primary action per state
- Clear visual hierarchy with adequate whitespace
- Consistent layout and positioning
- Gentle color palette from design system

**Acceptance Criteria**:
- Primary action immediately identifiable
- Visual elements follow predictable patterns
- Colors use calming earth-tone palette
- Layout remains stable across states

#### UX-RC-002: Time Awareness Support
**Priority**: High  
**Description**: RoutineCard MUST support time-blind users:
- Duration estimates prominently displayed
- Relative timestamps (not absolute times)
- Visual time indicators without pressure
- Optional time-to-completion estimates

**Acceptance Criteria**:
- Duration shown in friendly format ("about 20 minutes")
- Last completed as relative time ("3 hours ago")
- No countdown timers or pressure indicators
- Time estimates help with planning

#### UX-RC-003: Executive Function Support
**Priority**: Medium  
**Description**: RoutineCard MUST support executive function challenges:
- Clear next steps indicated
- Progress preservation across sessions
- Gentle completion encouragement
- Flexible routine timing

**Acceptance Criteria**:
- Current step clearly highlighted
- Progress saved automatically
- Positive reinforcement for completion
- No strict timing requirements

## API Specification

### Props Interface
```typescript
interface RoutineCardProps {
  // Core routine data
  routine: {
    id: string;
    name: string;
    description?: string;
    icon?: string;
    estimatedDuration: number; // minutes
    steps: Array<{
      id: string;
      name: string;
      estimatedDuration: number;
      completed?: boolean;
    }>;
  };
  
  // Progress state
  progress?: {
    currentStepIndex: number;
    completedSteps: number;
    totalSteps: number;
    startedAt?: Date;
    lastActiveAt?: Date;
    completedAt?: Date;
  };
  
  // Component state
  state: 'idle' | 'in-progress' | 'completed' | 'paused';
  
  // Event handlers
  onStart?: (routineId: string) => void;
  onResume?: (routineId: string) => void;
  onPause?: (routineId: string) => void;
  onComplete?: (routineId: string) => void;
  onEdit?: (routineId: string) => void;
  
  // Accessibility
  'aria-label'?: string;
  'aria-describedby'?: string;
  
  // Styling
  className?: string;
  priority?: 'high' | 'normal' | 'low'; // Visual prominence
}
```

### State Behavior
```typescript
type StateTransitions = {
  idle: ['in-progress']; // Can start
  'in-progress': ['paused', 'completed']; // Can pause or complete
  paused: ['in-progress', 'completed']; // Can resume or complete
  completed: ['idle']; // Can reset (new day)
};
```

## Visual Specifications

### Layout Structure
```css
.routine-card {
  /* Container */
  min-height: 140px;
  padding: 20px;
  border-radius: 16px;
  background: white;
  border: 1px solid #E5E7EB;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
  
  /* Grid layout */
  display: grid;
  grid-template-areas:
    "icon header actions"
    "icon content actions"
    "progress progress progress";
  grid-template-columns: auto 1fr auto;
  grid-template-rows: auto 1fr auto;
  gap: 12px;
}

.routine-icon {
  grid-area: icon;
  width: 48px;
  height: 48px;
  font-size: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #F2CEA2;
  border-radius: 12px;
}

.routine-header {
  grid-area: header;
  min-width: 0; /* Allows text truncation */
}

.routine-content {
  grid-area: content;
  min-width: 0;
}

.routine-actions {
  grid-area: actions;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.routine-progress {
  grid-area: progress;
  margin-top: 8px;
}
```

### State-Specific Styling
```css
/* Idle State */
.routine-card[data-state="idle"] {
  border-color: #E5E7EB;
  background: white;
}

/* In Progress State */
.routine-card[data-state="in-progress"] {
  border-color: #D99F6C;
  background: linear-gradient(135deg, #FFFBF7 0%, white 100%);
  box-shadow: 0 4px 12px 0 rgba(217, 159, 108, 0.15);
}

/* Completed State */
.routine-card[data-state="completed"] {
  border-color: #22C55E;
  background: linear-gradient(135deg, #F0FDF4 0%, white 100%);
}

/* Paused State */
.routine-card[data-state="paused"] {
  border-color: #F59E0B;
  background: linear-gradient(135deg, #FFFBEB 0%, white 100%);
}
```

### Progress Bar Styling
```css
.progress-bar {
  height: 8px;
  background: #E5E7EB;
  border-radius: 4px;
  overflow: hidden;
  position: relative;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #D99F6C 0%, #A66844 100%);
  border-radius: 4px;
  transition: width 300ms ease-in-out;
  width: var(--progress-percentage);
}

/* Animated progress for in-progress state */
.routine-card[data-state="in-progress"] .progress-fill {
  background: linear-gradient(90deg, #D99F6C 0%, #A66844 100%);
  position: relative;
}

.routine-card[data-state="in-progress"] .progress-fill::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.3) 50%, transparent 100%);
  animation: progress-shimmer 2s infinite ease-in-out;
}

@keyframes progress-shimmer {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}
```

## Interactive Behavior

### Touch/Click Areas
```css
.routine-card {
  cursor: pointer;
  user-select: none;
  touch-action: manipulation;
}

.routine-card:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px 0 rgba(0, 0, 0, 0.15);
  transition: transform 150ms ease-out, box-shadow 150ms ease-out;
}

.routine-card:focus {
  outline: none;
  box-shadow: 0 0 0 3px rgba(95, 109, 115, 0.3);
}

/* Respect reduced motion */
@media (prefers-reduced-motion: reduce) {
  .routine-card:hover {
    transform: none;
    transition: none;
  }
  
  .progress-fill {
    transition: none;
  }
  
  .progress-shimmer {
    animation: none;
  }
}
```

### Action Button Styling
```css
.routine-card-action-primary {
  min-height: 36px;
  padding: 8px 16px;
  font-size: 14px;
  font-weight: 500;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  transition: background-color 150ms ease-in-out;
}

/* State-specific primary actions */
.routine-card[data-state="idle"] .routine-card-action-primary {
  background: #5F6D73;
  color: white;
}

.routine-card[data-state="in-progress"] .routine-card-action-primary {
  background: #F59E0B;
  color: white;
}

.routine-card[data-state="paused"] .routine-card-action-primary {
  background: #22C55E;
  color: white;
}

.routine-card[data-state="completed"] .routine-card-action-primary {
  background: #E5E7EB;
  color: #6B7280;
  cursor: default;
}
```

## Test Requirements

### Unit Tests
- [ ] Renders routine information correctly
- [ ] Shows appropriate actions for each state
- [ ] Calculates progress percentage correctly
- [ ] Handles missing/optional props gracefully
- [ ] Triggers correct event handlers
- [ ] Displays time estimates properly

### Accessibility Tests
- [ ] Screen reader announces all content
- [ ] Keyboard navigation works correctly
- [ ] Focus management is logical
- [ ] Color contrast meets WCAG AAA
- [ ] High contrast mode support
- [ ] Reduced motion preferences respected

### Visual Tests
- [ ] All state variations render correctly
- [ ] Progress bar animations work smoothly
- [ ] Hover/focus states appear properly
- [ ] Text truncation works as expected
- [ ] Layout remains stable across content lengths

### Integration Tests
- [ ] State transitions work correctly
- [ ] Event handlers fire at right times
- [ ] Progress updates reflect in UI
- [ ] Works within list/grid containers
- [ ] Responsive behavior on different screen sizes

## Usage Examples

### Basic Usage
```tsx
<RoutineCard
  routine={{
    id: "morning-routine",
    name: "Morning Routine",
    description: "Start your day with intention and energy",
    icon: "🌅",
    estimatedDuration: 30,
    steps: [
      { id: "wake-up", name: "Wake up ritual", estimatedDuration: 5 },
      { id: "hygiene", name: "Personal hygiene", estimatedDuration: 15 },
      { id: "breakfast", name: "Breakfast prep", estimatedDuration: 10 }
    ]
  }}
  state="idle"
  onStart={handleStart}
  onEdit={handleEdit}
/>
```

### In Progress State
```tsx
<RoutineCard
  routine={routine}
  state="in-progress"
  progress={{
    currentStepIndex: 1,
    completedSteps: 1,
    totalSteps: 3,
    startedAt: new Date(),
    lastActiveAt: new Date()
  }}
  onPause={handlePause}
  onComplete={handleComplete}
/>
```

### Accessibility Example
```tsx
<RoutineCard
  routine={routine}
  state="completed"
  aria-label={`${routine.name} - Completed today`}
  aria-describedby="completion-message"
  onStart={handleRestart}
/>
<div id="completion-message" className="sr-only">
  Great job! You completed your morning routine today.
</div>
```

## Implementation Notes

### Performance Considerations
- Memoize routine data to prevent unnecessary re-renders
- Virtualize routine lists for performance with many cards
- Optimize progress bar animations for 60fps
- Use CSS transforms for hover effects (GPU acceleration)

### State Management Integration
```typescript
// Example with Nanostores
import { useStore } from '@nanostores/react';
import { routineProgress } from '../stores/routines';

function RoutineCardContainer({ routineId }: { routineId: string }) {
  const progress = useStore(routineProgress);
  const routineProgress = progress[routineId];
  
  return (
    <RoutineCard
      routine={routine}
      state={routineProgress?.state || 'idle'}
      progress={routineProgress}
      onStart={() => startRoutine(routineId)}
      onPause={() => pauseRoutine(routineId)}
    />
  );
}
```

### Responsive Behavior
```css
/* Mobile optimization */
@media (max-width: 640px) {
  .routine-card {
    grid-template-areas:
      "icon header"
      "content content"
      "progress actions";
    grid-template-columns: auto 1fr;
    grid-template-rows: auto auto auto;
    min-height: 120px;
  }
  
  .routine-actions {
    flex-direction: row;
    justify-content: flex-end;
  }
}
```

## Validation Criteria

### Definition of Done
- [ ] All functional requirements implemented and tested
- [ ] Accessibility audit passes with WCAG AAA compliance
- [ ] Visual design matches specification exactly
- [ ] Performance benchmarks met (< 16ms render time)
- [ ] Cross-browser testing completed
- [ ] Screen reader testing verified
- [ ] Unit test coverage > 95%
- [ ] Integration with state management working
- [ ] Documentation complete and examples working