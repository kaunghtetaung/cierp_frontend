"use client";

import { useState, useEffect } from 'react';
import { X, Shield, CheckCircle, AlertCircle } from 'lucide-react';

interface HumanVerificationModalProps {
  onComplete: (token: string) => void;
  onClose: () => void;
}

export function HumanVerificationModal({ onComplete, onClose }: HumanVerificationModalProps) {
  const [challenge, setChallenge] = useState({ num1: 0, num2: 0, operator: '+', answer: 0 });
  const [userAnswer, setUserAnswer] = useState('');
  const [error, setError] = useState('');
  const [attempts, setAttempts] = useState(0);

  useEffect(() => {
    generateChallenge();
  }, []);

  const generateChallenge = () => {
    const num1 = Math.floor(Math.random() * 10) + 1;
    const num2 = Math.floor(Math.random() * 10) + 1;
    const operators = ['+', '-', '*'];
    const operator = operators[Math.floor(Math.random() * operators.length)];
    
    let answer = 0;
    switch (operator) {
      case '+':
        answer = num1 + num2;
        break;
      case '-':
        answer = num1 - num2;
        break;
      case '*':
        answer = num1 * num2;
        break;
    }
    
    setChallenge({ num1, num2, operator, answer });
    setUserAnswer('');
    setError('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const userAnswerNum = parseInt(userAnswer, 10);
    
    if (isNaN(userAnswerNum)) {
      setError('Please enter a valid number');
      return;
    }
    
    if (userAnswerNum === challenge.answer) {
      // Generate a properly formatted JSON token
      const tokenData = {
        timestamp: Date.now(),
        challenge: `${challenge.num1}${challenge.operator}${challenge.num2}`,
        answer: challenge.answer,
        random: Math.random()
      };
      const token = btoa(JSON.stringify(tokenData));
      onComplete(token);
    } else {
      setAttempts(attempts + 1);
      if (attempts >= 2) {
        setError('Too many failed attempts. Generating new challenge...');
        setTimeout(() => {
          generateChallenge();
          setAttempts(0);
        }, 2000);
      } else {
        setError('Incorrect answer. Please try again.');
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="w-6 h-6 text-white" />
            <h3 className="text-lg font-semibold text-white">Human Verification</h3>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-gray-600 mb-6">
            Please solve this simple math problem to verify you're human:
          </p>

          {/* Challenge */}
          <div className="bg-gray-50 rounded-lg p-6 mb-6 text-center">
            <div className="text-3xl font-bold text-gray-900">
              {challenge.num1} {challenge.operator} {challenge.num2} = ?
            </div>
          </div>

          {/* Answer Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="answer" className="block text-sm font-medium text-gray-700 mb-2">
                Your Answer
              </label>
              <input
                id="answer"
                type="number"
                value={userAnswer}
                onChange={(e) => setUserAnswer(e.target.value)}
                className={`
                  w-full px-4 py-3 border rounded-lg
                  transition-all duration-200
                  ${error 
                    ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
                    : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                  }
                  focus:outline-none focus:ring-2 focus:ring-opacity-50
                `}
                placeholder="Enter your answer"
                autoFocus
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="flex items-center gap-2 text-red-600">
                <AlertCircle className="w-4 h-4" />
                <p className="text-sm">{error}</p>
              </div>
            )}

            {/* Buttons */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={generateChallenge}
                className="flex-1 px-4 py-3 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors font-medium"
              >
                New Challenge
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-3 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center justify-center gap-2"
              >
                <CheckCircle className="w-4 h-4" />
                Verify
              </button>
            </div>
          </form>

          {/* Info */}
          <p className="text-xs text-gray-500 mt-4 text-center">
            This helps us prevent automated signups
          </p>
        </div>
      </div>
    </div>
  );
}