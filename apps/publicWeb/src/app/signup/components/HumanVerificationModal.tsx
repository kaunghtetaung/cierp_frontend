"use client";

import { useState, useEffect } from "react";
import { RefreshCw, CheckCircle2, AlertCircle, X } from "lucide-react";
import styles from "../styles/verification.module.css";

interface HumanVerificationProps {
  onVerified: (token: string) => void;
  onClose: () => void;
}

type Challenge = {
  question: string;
  answer: number;
  token: string;
};

export function HumanVerificationModal({ onVerified, onClose }: HumanVerificationProps) {
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [userAnswer, setUserAnswer] = useState("");
  const [error, setError] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [imageChallenge, setImageChallenge] = useState<string>("");

  // Generate math challenge
  const generateMathChallenge = (): Challenge => {
    const operations = ['+', '-', '*'];
    const operation = operations[Math.floor(Math.random() * operations.length)];
    let num1 = Math.floor(Math.random() * 20) + 1;
    let num2 = Math.floor(Math.random() * 20) + 1;
    let answer = 0;
    let question = "";

    switch (operation) {
      case '+':
        answer = num1 + num2;
        question = `${num1} + ${num2}`;
        break;
      case '-':
        // Ensure positive result
        if (num1 < num2) [num1, num2] = [num2, num1];
        answer = num1 - num2;
        question = `${num1} - ${num2}`;
        break;
      case '*':
        num1 = Math.floor(Math.random() * 10) + 1;
        num2 = Math.floor(Math.random() * 10) + 1;
        answer = num1 * num2;
        question = `${num1} × ${num2}`;
        break;
    }

    // Generate a token based on the challenge
    const token = btoa(`${question}:${answer}:${Date.now()}:${Math.random()}`);

    return { question, answer, token };
  };

  // Generate visual challenge (simple ASCII art)
  const generateImageChallenge = () => {
    const patterns = [
      { pattern: "▲ ▲ ▲", count: 3, shape: "triangles" },
      { pattern: "● ● ● ●", count: 4, shape: "circles" },
      { pattern: "■ ■ ■ ■ ■", count: 5, shape: "squares" },
      { pattern: "★ ★ ★", count: 3, shape: "stars" },
      { pattern: "♦ ♦ ♦ ♦", count: 4, shape: "diamonds" },
    ];
    
    const selected = patterns[Math.floor(Math.random() * patterns.length)];
    setImageChallenge(selected.pattern);
    
    const question = `How many ${selected.shape} do you see?`;
    const token = btoa(`visual:${selected.count}:${Date.now()}`);
    
    return { question, answer: selected.count, token };
  };

  // Initialize challenge
  useEffect(() => {
    const useVisual = Math.random() > 0.5;
    const newChallenge = useVisual ? generateImageChallenge() : generateMathChallenge();
    setChallenge(newChallenge);
  }, []);

  const refreshChallenge = () => {
    setError("");
    setUserAnswer("");
    setAttempts(0);
    const useVisual = Math.random() > 0.5;
    const newChallenge = useVisual ? generateImageChallenge() : generateMathChallenge();
    setChallenge(newChallenge);
    if (!useVisual) setImageChallenge("");
  };

  const handleVerify = () => {
    if (!challenge) return;

    setIsVerifying(true);
    setError("");
    setAttempts(attempts + 1);

    // Simulate verification delay (makes it feel more secure)
    setTimeout(() => {
      const answer = parseInt(userAnswer, 10);
      
      if (isNaN(answer)) {
        setError("Please enter a valid number");
        setIsVerifying(false);
        return;
      }

      if (answer === challenge.answer) {
        // Generate verification token with timestamp and session info
        const verificationToken = btoa(JSON.stringify({
          challengeToken: challenge.token,
          timestamp: Date.now(),
          attempts: attempts + 1,
          userAgent: navigator.userAgent,
          screenResolution: `${window.screen.width}x${window.screen.height}`,
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        }));

        onVerified(verificationToken);
        setIsVerifying(false);
      } else {
        setError("Incorrect answer. Please try again.");
        setIsVerifying(false);
        
        // Auto-refresh after 3 failed attempts
        if (attempts >= 2) {
          setTimeout(refreshChallenge, 1500);
        }
      }
    }, 500);
  };

  return (
    <>
      {/* Backdrop */}
      <div className={styles.backdrop} onClick={onClose} />
      
      {/* Modal */}
      <div className={styles.modal}>
        {/* Header */}
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>
            Human Verification Required
          </h2>
          <button
            className={styles.closeButton}
            onClick={onClose}
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className={styles.modalContent}>
          {/* Alert */}
          <div className={styles.alert}>
            <AlertCircle className={styles.alertIcon} />
            <p className={styles.alertText}>
              Please complete this challenge to verify you're human
            </p>
          </div>

          {challenge && (
            <>
              {/* Challenge Display */}
              <div className={styles.challengeBox}>
                {imageChallenge ? (
                  <>
                    <div className={styles.visualChallenge}>
                      {imageChallenge}
                    </div>
                    <p className={styles.challengeQuestion}>
                      {challenge.question}
                    </p>
                  </>
                ) : (
                  <>
                    <p className={styles.challengeLabel}>
                      Solve this math problem:
                    </p>
                    <p className={styles.mathChallenge}>
                      {challenge.question} = ?
                    </p>
                  </>
                )}
                
                {/* Refresh button */}
                <button
                  className={styles.refreshButton}
                  onClick={refreshChallenge}
                  title="Get new challenge"
                >
                  <RefreshCw size={16} />
                </button>
              </div>

              {/* Answer Input */}
              <div className={styles.inputGroup}>
                <label htmlFor="answer" className={styles.label}>
                  Your Answer
                </label>
                <input
                  id="answer"
                  type="number"
                  value={userAnswer}
                  onChange={(e) => setUserAnswer(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleVerify()}
                  placeholder="Enter your answer"
                  disabled={isVerifying}
                  autoFocus
                  className={`${styles.input} ${error ? styles.inputError : ''}`}
                />
                {error && (
                  <p className={styles.errorMessage}>{error}</p>
                )}
              </div>

              {/* Attempt Counter */}
              {attempts > 0 && (
                <p className={styles.attemptCounter}>
                  Attempt {attempts} of 3
                </p>
              )}

              {/* Action Buttons */}
              <div className={styles.buttonGroup}>
                <button
                  className={styles.cancelButton}
                  onClick={onClose}
                  disabled={isVerifying}
                >
                  Cancel
                </button>
                <button
                  className={styles.verifyButton}
                  onClick={handleVerify}
                  disabled={!userAnswer || isVerifying}
                >
                  {isVerifying ? (
                    <span className={styles.spinner} />
                  ) : (
                    <CheckCircle2 size={16} />
                  )}
                  {isVerifying ? 'Verifying...' : 'Verify'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}