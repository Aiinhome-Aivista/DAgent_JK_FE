import React, { useRef, useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';

interface CaptchaProps {
  onValidate: (isValid: boolean) => void;
  expireTimeMs?: number;
}

export const Captcha: React.FC<CaptchaProps> = ({ onValidate, expireTimeMs = 60000 }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [captchaText, setCaptchaText] = useState('');
  const [userInput, setUserInput] = useState('');
  const [timeLeft, setTimeLeft] = useState(expireTimeMs / 1000);

  const generateCaptcha = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'; // removed confusable characters
    let text = '';
    for (let i = 0; i < 5; i++) {
      text += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setCaptchaText(text);
    setUserInput('');
    onValidate(false);
    setTimeLeft(expireTimeMs / 1000);
    drawCaptcha(text);
  };

  const drawCaptcha = (text: string) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Background
    ctx.fillStyle = '#fdf2f2'; // light reddish bg to match screenshot style
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Add noise lines
    for (let i = 0; i < 30; i++) {
      ctx.beginPath();
      ctx.moveTo(Math.random() * canvas.width, Math.random() * canvas.height);
      ctx.lineTo(Math.random() * canvas.width, Math.random() * canvas.height);
      ctx.strokeStyle = `rgba(225, 112, 112, ${Math.random() * 0.4})`; // pinkish noise lines
      ctx.lineWidth = Math.random() * 1.5;
      ctx.stroke();
    }

    ctx.font = 'bold 32px Georgia, serif';
    ctx.fillStyle = '#b36b6b';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Draw text with some random rotation and spacing
    for (let i = 0; i < text.length; i++) {
      ctx.save();
      ctx.translate(30 + i * 25, canvas.height / 2 + (Math.random() - 0.5) * 10);
      ctx.rotate((Math.random() - 0.5) * 0.3);
      ctx.fillText(text[i], 0, 0);
      ctx.restore();
    }
  };

  useEffect(() => {
    generateCaptcha();
  }, []);

  useEffect(() => {
    if (timeLeft <= 0) {
      onValidate(false);
      return;
    }
    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setUserInput(val);
    onValidate(val === captchaText && timeLeft > 0);
  };

  return (
    <div className="flex flex-col gap-2 w-full mt-2">
      <label className="text-sm font-semibold text-[var(--text-primary)]">Enter CAPTCHA<span className="text-rose-500">*</span></label>
      <div className="flex items-center gap-3">
        <canvas 
          ref={canvasRef} 
          width="160" 
          height="50" 
          className="border border-[var(--border)] rounded-md"
        />
        <button 
          type="button" 
          onClick={generateCaptcha}
          className="p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)] rounded-lg transition-colors"
          title="Refresh CAPTCHA"
        >
          <RefreshCw className="w-5 h-5" />
        </button>
        <span className={`text-sm font-medium ${timeLeft <= 10 ? 'text-rose-500' : 'text-[var(--text-secondary)]'}`}>
          {timeLeft > 0 ? `${timeLeft}s` : 'Expired'}
        </span>
      </div>
      <input 
        type="text" 
        value={userInput}
        onChange={handleInputChange}
        placeholder="Enter captcha text"
        className="w-full px-4 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--bg)] text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)] mt-2"
        disabled={timeLeft <= 0}
      />
    </div>
  );
};
