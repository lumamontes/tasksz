/**
 * Onboarding Component
 * Gentle introduction for new users with neurodivergent-friendly UX
 */

import React, { useState } from 'react';
import { Button } from './ui/Button';

interface OnboardingProps {
  onComplete: (userData: { name: string; preferences: any }) => void;
}

const steps = [
  {
    title: 'Welcome to Tarefitas! 👋',
    content: (
      <div className="text-center space-y-4">
        <div className="text-6xl mb-4">🌱</div>
        <p className="text-lg text-gray-700 leading-relaxed">
          A thoughtfully designed companion for managing your daily routines and focus sessions.
        </p>
        <p className="text-gray-600">
          Built specifically with neurodivergent minds in mind.
        </p>
      </div>
    ),
  },
  {
    title: 'Tell us about yourself',
    content: (
      <div className="space-y-6">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-slate mb-2">
            What should we call you? <span className="text-gray-500">(optional)</span>
          </label>
          <input
            id="name"
            type="text"
            placeholder="Your name or nickname..."
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-300 focus:border-primary-400 outline-none transition-colors"
            maxLength={50}
          />
          <p className="mt-1 text-sm text-gray-500">
            This helps us personalize your experience. You can change this anytime.
          </p>
        </div>
      </div>
    ),
  },
  {
    title: 'What interests you most?',
    content: (
      <div className="space-y-4">
        <p className="text-gray-700 mb-6">
          Select what you'd like to explore first. You can access everything later.
        </p>
        <div className="grid gap-4">
          {[
            {
              key: 'tasks',
              emoji: '📝',
              title: 'Task Management',
              description: 'Organize your daily tasks with priorities and deadlines',
            },
            {
              key: 'focus',
              emoji: '🍅',
              title: 'Focus Sessions',
              description: 'Use the Pomodoro technique for concentrated work',
            },
            {
              key: 'routines',
              emoji: '🌅',
              title: 'Daily Routines',
              description: 'Build consistent morning and evening routines',
            },
          ].map(({ key, emoji, title, description }) => (
            <label
              key={key}
              className="flex items-start gap-4 p-4 border border-gray-200 rounded-lg hover:border-primary-300 cursor-pointer transition-colors group"
            >
              <input
                type="checkbox"
                name="interests"
                value={key}
                className="mt-1 w-4 h-4 text-primary-500 rounded border-gray-300 focus:ring-2 focus:ring-primary-300"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-2xl">{emoji}</span>
                  <span className="font-medium text-slate group-hover:text-primary-600">
                    {title}
                  </span>
                </div>
                <p className="text-sm text-gray-600">{description}</p>
              </div>
            </label>
          ))}
        </div>
      </div>
    ),
  },
  {
    title: 'You\'re all set! 🎉',
    content: (
      <div className="text-center space-y-6">
        <div className="text-6xl mb-4">🚀</div>
        <div className="space-y-4">
          <p className="text-lg text-gray-700">
            Welcome to your personal routine companion!
          </p>
          <div className="bg-secondary-50 rounded-lg p-4 text-left">
            <h3 className="font-medium text-slate mb-2">Quick tips to get started:</h3>
            <ul className="space-y-1 text-sm text-gray-700">
              <li>• Use the navigation tabs to switch between features</li>
              <li>• Start with a simple 25-minute focus session</li>
              <li>• Add your first task to stay organized</li>
              <li>• Explore settings to customize your experience</li>
            </ul>
          </div>
          <p className="text-gray-600 text-sm">
            Remember: Take things at your own pace. This app is designed to support, not overwhelm.
          </p>
        </div>
      </div>
    ),
  },
];

export function Onboarding({ onComplete }: OnboardingProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [userData, setUserData] = useState({
    name: '',
    interests: [] as string[],
  });

  const isLastStep = currentStep === steps.length - 1;
  const isFirstStep = currentStep === 0;

  const handleNext = () => {
    if (currentStep === 1) {
      // Capture name from input
      const nameInput = document.getElementById('name') as HTMLInputElement;
      setUserData(prev => ({ ...prev, name: nameInput?.value || '' }));
    }
    
    if (currentStep === 2) {
      // Capture interests from checkboxes
      const checkedBoxes = document.querySelectorAll('input[name="interests"]:checked') as NodeListOf<HTMLInputElement>;
      const interests = Array.from(checkedBoxes).map(cb => cb.value);
      setUserData(prev => ({ ...prev, interests }));
    }

    if (isLastStep) {
      onComplete({
        name: userData.name,
        preferences: {
          interests: userData.interests,
          onboardingCompleted: true,
          onboardingDate: new Date().toISOString(),
        },
      });
    } else {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    if (!isFirstStep) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleSkip = () => {
    onComplete({
      name: '',
      preferences: {
        interests: [],
        onboardingCompleted: true,
        onboardingDate: new Date().toISOString(),
        skipped: true,
      },
    });
  };

  return (
    <div className="min-h-screen bg-cream-light flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Progress indicator */}
        <div className="mb-8">
          <div className="flex justify-center space-x-2 mb-4">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`w-3 h-3 rounded-full transition-colors ${
                  index <= currentStep ? 'bg-primary-500' : 'bg-gray-300'
                }`}
              />
            ))}
          </div>
          <p className="text-center text-sm text-gray-600">
            Step {currentStep + 1} of {steps.length}
          </p>
        </div>

        {/* Content card */}
        <div className="bg-white rounded-xl border border-gray-200 p-8 shadow-sm">
          <div className="mb-8">
            <h1 className="text-2xl font-semibold text-slate text-center mb-6">
              {steps[currentStep].title}
            </h1>
            {steps[currentStep].content}
          </div>

          {/* Navigation */}
          <div className="flex flex-col-reverse sm:flex-row gap-3 justify-between items-center">
            <div className="flex gap-3">
              {!isFirstStep && (
                <Button
                  onClick={handleBack}
                  variant="ghost"
                  size="medium"
                >
                  Back
                </Button>
              )}
              
              {!isLastStep && (
                <Button
                  onClick={handleSkip}
                  variant="ghost"
                  size="medium"
                  className="text-gray-500 hover:text-gray-700"
                >
                  Skip setup
                </Button>
              )}
            </div>

            <Button
              onClick={handleNext}
              variant="primary"
              size="medium"
              className="w-full sm:w-auto sm:min-w-[120px]"
            >
              {isLastStep ? 'Get Started!' : 'Continue'}
            </Button>
          </div>
        </div>

        {/* Help text */}
        <div className="text-center mt-6">
          <p className="text-sm text-gray-600">
            Need help? Everything can be customized later in settings.
          </p>
        </div>
      </div>
    </div>
  );
}