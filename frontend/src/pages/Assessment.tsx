import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../api/client';
import { useStore } from '../store/useStore';

interface Question {
  id: string;
  text: string;
  options: string[];
  selectedOpt: number | null;
}

export default function Assessment() {
  const navigate = useNavigate();
  const { candidateId, setSessionId, sessionId } = useStore();
  
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState(45 * 60); // 45 minutes
  const [markedForReview, setMarkedForReview] = useState<Set<number>>(new Set());
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!candidateId) {
      navigate('/');
      return;
    }

    const startAssessment = async () => {
      try {
        const response = await api.post('/assessment/start', { candidateId });
        setSessionId(response.data.sessionId);
        setQuestions(response.data.questions);
        
        const start = new Date(response.data.startTime).getTime();
        const now = new Date().getTime();
        const elapsedSeconds = Math.floor((now - start) / 1000);
        const remaining = Math.max((45 * 60) - elapsedSeconds, 0);
        setTimeLeft(remaining);

        if (remaining <= 0) {
          submitAssessment(response.data.sessionId);
        }
      } catch (error: any) {
        const message = error.response?.data?.error || error.message || 'Failed to start assessment';
        setErrorMsg(message);
        toast.error(message);
        if (error.response?.status === 403) {
          navigate('/result');
        }
      } finally {
        setLoading(false);
      }
    };

    startAssessment();
  }, [candidateId, navigate]);

  useEffect(() => {
    if (!loading && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            submitAssessment(sessionId!);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [loading, sessionId]);

  const submitAssessment = useCallback(async (sId: string) => {
    try {
      const response = await api.post('/assessment/submit', { sessionId: sId });
      toast.success('Assessment submitted successfully');
      navigate('/result', { state: { score: response.data.score } });
    } catch (error) {
      toast.error('Failed to submit assessment');
    }
  }, [navigate]);

  // Ref to persist violation count across renders
  const violationCountRef = useRef(0);

  // Anti-Cheating Logic
  useEffect(() => {
    if (loading || timeLeft <= 0) return;

    const MAX_VIOLATIONS = 3;

    const handleViolation = (reason: string) => {
      violationCountRef.current += 1;
      const currentCount = violationCountRef.current;
      
      // Log violation to backend
      api.post('/assessment/violation', { sessionId, type: reason });

      if (currentCount >= MAX_VIOLATIONS) {
        toast.error('Assessment terminated due to excessive violations.');
        submitAssessment(sessionId!);
      } else {
        toast.warning(`Warning ${currentCount}/${MAX_VIOLATIONS}: ${reason}. Your assessment will be terminated after 3 warnings.`);
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        handleViolation('Tab switched or minimized');
      }
    };

    const handleBlur = () => {
      handleViolation('Lost focus from the assessment window');
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent Ctrl+C, Ctrl+V, Ctrl+X, Ctrl+P, Ctrl+S, F12, etc.
      if (
        (e.ctrlKey && ['c', 'v', 'x', 'p', 's', 'a', 'u'].includes(e.key.toLowerCase())) ||
        e.key === 'F12' ||
        (e.ctrlKey && e.shiftKey && ['i', 'j', 'c'].includes(e.key.toLowerCase()))
      ) {
        e.preventDefault();
        toast.warning('Keyboard shortcuts are disabled during the assessment.');
      }
    };

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      toast.warning('Right-click is disabled.');
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('contextmenu', handleContextMenu);

    // Try to request fullscreen
    try {
      document.documentElement.requestFullscreen().catch(() => {
        console.warn('Fullscreen request denied by browser');
      });
    } catch (e) {}

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('contextmenu', handleContextMenu);
    };
  }, [loading, sessionId, timeLeft, submitAssessment]);



  const handleOptionSelect = async (optIndex: number) => {
    const currentQ = questions[currentIndex];
    
    // Optimistic UI update
    setQuestions(prev => {
      const newQs = [...prev];
      newQs[currentIndex] = { ...currentQ, selectedOpt: optIndex };
      return newQs;
    });

    try {
      await api.post('/assessment/save-answer', {
        sessionId,
        questionId: currentQ.id,
        selectedOpt: optIndex
      });
    } catch (error) {
      toast.error('Failed to save answer');
    }
  };

  const toggleReview = () => {
    setMarkedForReview(prev => {
      const newSet = new Set(prev);
      if (newSet.has(currentIndex)) newSet.delete(currentIndex);
      else newSet.add(currentIndex);
      return newSet;
    });
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-secondaryBg">Loading Assessment...</div>;
  if (errorMsg) return <div className="min-h-screen flex items-center justify-center bg-secondaryBg text-error font-bold p-4 text-center">Error: {errorMsg}</div>;
  if (questions.length === 0) return <div className="min-h-screen flex items-center justify-center bg-secondaryBg">No questions available.</div>;

  const currentQ = questions[currentIndex];

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-secondaryBg">
      {/* Main Question Area */}
      <div className="flex-1 flex flex-col p-3 md:p-8 w-full max-w-full">
        {/* Header bar - Sticky on Mobile */}
        <div className="sticky top-2 z-10 bg-white p-4 rounded-xl shadow-md mb-6 flex justify-between items-center border border-border">
          <div className="font-semibold text-textPrimary text-base md:text-lg">
            Question {currentIndex + 1} of {questions.length}
          </div>
          <div className="text-lg md:text-xl font-mono font-bold text-error flex items-center gap-1 md:gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 md:h-6 md:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {formatTime(timeLeft)}
          </div>
        </div>

        {/* Question content */}
        <div className="flex-1 bg-white p-4 md:p-6 rounded-xl shadow-sm border border-border flex flex-col w-full">
          <h2 className="text-xl font-medium text-textPrimary mb-8 leading-relaxed">
            {currentQ.text}
          </h2>

          <div className="space-y-4 flex-1">
            {currentQ.options.map((opt, idx) => (
              <div 
                key={idx}
                onClick={() => handleOptionSelect(idx)}
                className={`p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                  currentQ.selectedOpt === idx 
                    ? 'border-primary bg-blue-50' 
                    : 'border-border hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    currentQ.selectedOpt === idx ? 'border-primary' : 'border-gray-400'
                  }`}>
                    {currentQ.selectedOpt === idx && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
                  </div>
                  <span className="text-textPrimary text-lg">{opt}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="mt-8 flex justify-between items-center pt-6 border-t border-border">
            <button
              onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
              disabled={currentIndex === 0}
              className="px-6 py-2 rounded-lg font-medium text-textSecondary bg-gray-100 hover:bg-gray-200 disabled:opacity-50 transition"
            >
              Previous
            </button>
            <button
              onClick={toggleReview}
              className={`px-6 py-2 rounded-lg font-medium transition ${
                markedForReview.has(currentIndex) ? 'bg-warning text-white' : 'bg-gray-100 text-textSecondary hover:bg-gray-200'
              }`}
            >
              {markedForReview.has(currentIndex) ? 'Unmark Review' : 'Mark for Review'}
            </button>
            <button
              onClick={() => setCurrentIndex(prev => Math.min(questions.length - 1, prev + 1))}
              disabled={currentIndex === questions.length - 1}
              className="px-6 py-2 rounded-lg font-medium text-white bg-primary hover:bg-blue-700 disabled:opacity-50 transition"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Right side Palette */}
      <div className="w-full md:w-80 bg-white p-4 md:p-6 shadow-sm border-l border-border flex flex-col">
        <h3 className="font-bold text-lg mb-6 text-textPrimary">Question Navigator</h3>
        <div className="grid grid-cols-5 gap-2 mb-auto overflow-y-auto pr-2 pb-4">
          {questions.map((q, idx) => {
            let bgColor = 'bg-gray-100';
            let textColor = 'text-textPrimary';
            let borderColor = 'border-transparent';

            if (currentIndex === idx) {
              borderColor = 'border-primary';
            }

            if (q.selectedOpt !== null) {
              bgColor = 'bg-success';
              textColor = 'text-white';
            }
            if (markedForReview.has(idx)) {
              bgColor = 'bg-warning';
              textColor = 'text-white';
            }

            return (
              <button
                key={q.id}
                onClick={() => setCurrentIndex(idx)}
                className={`w-10 h-10 flex items-center justify-center rounded-md font-medium border-2 transition ${bgColor} ${textColor} ${borderColor}`}
              >
                {idx + 1}
              </button>
            );
          })}
        </div>
        
        {/* Legend */}
        <div className="mt-4 border-t border-border pt-4 text-sm space-y-2 mb-6">
          <div className="flex items-center gap-2"><div className="w-4 h-4 rounded bg-success"></div> Answered</div>
          <div className="flex items-center gap-2"><div className="w-4 h-4 rounded bg-warning"></div> Marked for Review</div>
          <div className="flex items-center gap-2"><div className="w-4 h-4 rounded bg-gray-100 border border-gray-300"></div> Unanswered</div>
        </div>

        <button 
          onClick={() => {
            if (window.confirm('Are you sure you want to submit the assessment?')) {
              submitAssessment(sessionId!);
            }
          }}
          className="w-full py-3 rounded-lg font-bold text-white bg-error hover:bg-red-700 shadow-md transition"
        >
          Submit Assessment
        </button>
      </div>
    </div>
  );
}
