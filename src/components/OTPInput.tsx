'use client';

import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface OTPInputProps {
  length?: number;
  onComplete: (otp: string) => void;
  disabled?: boolean;
}

export const OTPInput = ({ length = 4, onComplete, disabled }: OTPInputProps) => {
  const [otp, setOtp] = useState<string[]>(new Array(length).fill(''));
  const inputs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    // Focus first input on mount
    if (inputs.current[0]) {
      inputs.current[0].focus();
    }
  }, []);

  const handleChange = (element: HTMLInputElement, index: number) => {
    const value = element.value;
    if (isNaN(Number(value))) return;

    const newOtp = [...otp];
    // Take only the last character entered
    newOtp[index] = value.substring(value.length - 1);
    setOtp(newOtp);

    // Move to next input if value is entered
    if (value && index < length - 1 && inputs.current[index + 1]) {
      inputs.current[index + 1]?.focus();
    }

    // Check if all fields are filled
    const otpValue = newOtp.join('');
    if (otpValue.length === length) {
      onComplete(otpValue);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Backspace') {
      if (!otp[index] && index > 0 && inputs.current[index - 1]) {
        inputs.current[index - 1]?.focus();
      }
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const data = e.clipboardData.getData('text').slice(0, length);
    if (!/^\d+$/.test(data)) return;

    const newOtp = [...otp];
    data.split('').forEach((char, index) => {
      newOtp[index] = char;
    });
    setOtp(newOtp);
    
    // Focus last input or first empty
    const lastIdx = data.length < length ? data.length : length - 1;
    inputs.current[lastIdx]?.focus();

    if (data.length === length) {
      onComplete(data);
    }
  };

  return (
    <div className="flex gap-3 md:gap-5 justify-center">
      {otp.map((data, index) => (
        <input
          key={index}
          type="text"
          maxLength={1}
          ref={(el) => (inputs.current[index] = el)}
          value={data}
          disabled={disabled}
          onChange={(e) => handleChange(e.target, index)}
          onKeyDown={(e) => handleKeyDown(e, index)}
          onPaste={handlePaste}
          className={cn(
            "w-12 h-14 md:w-16 md:h-20 text-center text-2xl md:text-4xl font-black rounded-2xl border-2 transition-all outline-none",
            data ? "border-primary bg-primary/5" : "border-muted bg-card",
            "focus:border-primary focus:ring-8 focus:ring-primary/10",
            disabled && "opacity-50 cursor-not-allowed"
          )}
        />
      ))}
    </div>
  );
};
