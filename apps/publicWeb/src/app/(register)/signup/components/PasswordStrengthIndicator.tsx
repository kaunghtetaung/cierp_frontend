"use client";

import { useEffect, useState } from 'react';

interface PasswordStrengthIndicatorProps {
  password: string;
  onStrengthChange?: (strength: number) => void;
}

export function PasswordStrengthIndicator({ password, onStrengthChange }: PasswordStrengthIndicatorProps) {
  const [strength, setStrength] = useState(0);
  const [strengthText, setStrengthText] = useState('');
  const [strengthColor, setStrengthColor] = useState('');

  useEffect(() => {
    const calculateStrength = () => {
      let score = 0;
      
      if (!password) {
        setStrength(0);
        setStrengthText('');
        setStrengthColor('');
        onStrengthChange?.(0);
        return;
      }

      // Length check
      if (password.length >= 8) score++;
      if (password.length >= 12) score++;
      
      // Character variety checks
      if (/[a-z]/.test(password)) score++;
      if (/[A-Z]/.test(password)) score++;
      if (/[0-9]/.test(password)) score++;
      if (/[^A-Za-z0-9]/.test(password)) score++;
      
      // Set strength based on score
      let strengthValue = 0;
      let text = '';
      let color = '';
      
      if (score <= 2) {
        strengthValue = 1;
        text = 'Weak';
        color = 'red';
      } else if (score <= 4) {
        strengthValue = 2;
        text = 'Fair';
        color = 'amber';
      } else if (score <= 5) {
        strengthValue = 3;
        text = 'Good';
        color = 'yellow';
      } else {
        strengthValue = 4;
        text = 'Strong';
        color = 'green';
      }
      
      setStrength(strengthValue);
      setStrengthText(text);
      setStrengthColor(color);
      onStrengthChange?.(strengthValue);
    };

    calculateStrength();
  }, [password, onStrengthChange]);

  if (!password) return null;

  const getBarColor = (index: number) => {
    if (index >= strength) return 'bg-gray-200';
    
    switch (strengthColor) {
      case 'red':
        return 'bg-red-500';
      case 'amber':
        return 'bg-amber-500';
      case 'yellow':
        return 'bg-yellow-500';
      case 'green':
        return 'bg-green-500';
      default:
        return 'bg-gray-200';
    }
  };

  const getTextColor = () => {
    switch (strengthColor) {
      case 'red':
        return 'text-red-600';
      case 'amber':
        return 'text-amber-600';
      case 'yellow':
        return 'text-yellow-600';
      case 'green':
        return 'text-green-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className="mt-2">
      <div className="flex gap-1 mb-1">
        {[0, 1, 2, 3].map((index) => (
          <div
            key={index}
            className={`h-1 flex-1 rounded-full transition-all duration-300 ${getBarColor(index)}`}
          />
        ))}
      </div>
      {strengthText && (
        <p className={`text-xs font-medium ${getTextColor()}`}>
          Password strength: {strengthText}
        </p>
      )}
    </div>
  );
}