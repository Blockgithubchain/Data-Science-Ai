
import React, { useState, useEffect } from 'react';
import { CogIcon } from './icons';

const steps = [
  "Analyzing dataset structure...",
  "Formulating preprocessing strategy...",
  "Evaluating potential feature engineering...",
  "Identifying suitable model architectures...",
  "Generating recommendations...",
];

const ProcessingView: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStep(prev => (prev + 1) % steps.length);
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full max-w-xl mx-auto flex flex-col items-center justify-center p-12 bg-gray-800/50 border border-gray-700 rounded-2xl text-center">
      <CogIcon className="w-16 h-16 animate-spin-slow mb-6 text-blue-400" />
      <h2 className="text-2xl font-bold mb-4 font-space-grotesk">Processing your request</h2>
      <p className="text-gray-400 text-lg transition-opacity duration-500 h-8">
        {steps[currentStep]}
      </p>
    </div>
  );
};

export default ProcessingView;
