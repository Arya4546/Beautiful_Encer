/**
 * Password Strength Indicator Component
 * Shows visual feedback for password strength
 */

import React from 'react';
import { getPasswordStrength } from '../../utils/validation';

interface PasswordStrengthIndicatorProps {
  password: string;
  show?: boolean;
}

export const PasswordStrengthIndicator: React.FC<PasswordStrengthIndicatorProps> = ({ 
  password, 
  show = true 
}) => {
  if (!show || !password) return null;

  const { level, feedback } = getPasswordStrength(password);

  const colors = {
    weak: 'bg-red-500',
    medium: 'bg-yellow-500',
    strong: 'bg-green-500',
    'very-strong': 'bg-emerald-600',
  };

  const widths = {
    weak: 'w-1/4',
    medium: 'w-2/4',
    strong: 'w-3/4',
    'very-strong': 'w-full',
  };

  const textColors = {
    weak: 'text-red-600',
    medium: 'text-yellow-600',
    strong: 'text-green-600',
    'very-strong': 'text-emerald-600',
  };

  return (
    <div className="mt-2 space-y-2">
      <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full transition-all duration-300 ${colors[level]} ${widths[level]}`}
        />
      </div>
      <p className={`text-sm ${textColors[level]}`}>
        {feedback}
      </p>
      {level === 'weak' && (
        <ul className="text-xs text-gray-600 space-y-1 ml-4 list-disc">
          <li>At least 8 characters</li>
          <li>Include uppercase and lowercase letters</li>
          <li>Add numbers and special characters</li>
        </ul>
      )}
    </div>
  );
};
