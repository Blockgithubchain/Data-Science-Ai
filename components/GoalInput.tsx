
import React, { useState } from 'react';
import { FileData } from '../types';
import { CsvIcon, ImageIcon, SparklesIcon } from './icons';

interface GoalInputProps {
  fileData: FileData | null;
  onSubmit: (goal: string) => void;
}

const GoalInput: React.FC<GoalInputProps> = ({ fileData, onSubmit }) => {
  const [goal, setGoal] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (goal.trim()) {
      setIsLoading(true);
      onSubmit(goal.trim());
    }
  };

  const exampleGoals = fileData?.type === 'csv'
    ? ["Predict median house value based on other features", "Classify customers into churn categories", "Forecast monthly sales for the next quarter"]
    : ["Classify images of cats and dogs", "Identify objects within the uploaded images", "Detect defects in product images"];

  const handleExampleClick = (example: string) => {
    setGoal(example);
  };

  if (!fileData) return null;

  return (
    <div className="w-full max-w-3xl mx-auto flex flex-col items-center p-8 bg-gray-800/50 border border-gray-700 rounded-2xl">
      <div className="flex items-center gap-3 mb-4 p-3 bg-gray-700/50 rounded-lg">
        {fileData.type === 'csv' ? <CsvIcon /> : <ImageIcon />}
        <span className="font-mono text-blue-300">{fileData.name}</span>
        <span className="text-gray-400">loaded successfully.</span>
      </div>
      
      <h2 className="text-2xl font-bold mb-2 font-space-grotesk">What is your objective?</h2>
      <p className="text-gray-400 mb-6 text-center">Describe what you want to achieve with this dataset.</p>

      <form onSubmit={handleSubmit} className="w-full">
        <textarea
          value={goal}
          onChange={(e) => setGoal(e.target.value)}
          placeholder="e.g., Predict customer churn based on usage data"
          className="w-full h-28 p-4 bg-gray-900 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none transition-shadow text-gray-200 resize-none"
          disabled={isLoading}
        />
        <div className="mt-4 text-sm text-gray-400">
            <p className="font-semibold mb-2">Need inspiration? Try one of these:</p>
            <div className="flex flex-wrap gap-2">
                {exampleGoals.map((ex, i) => (
                    <button
                        key={i}
                        type="button"
                        onClick={() => handleExampleClick(ex)}
                        className="px-3 py-1 bg-gray-700/80 rounded-full hover:bg-blue-500/30 text-gray-300 hover:text-white transition-colors text-xs"
                        disabled={isLoading}
                    >
                        {ex}
                    </button>
                ))}
            </div>
        </div>
        <button
          type="submit"
          disabled={!goal.trim() || isLoading}
          className="mt-6 w-full flex items-center justify-center gap-2 bg-blue-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <>
              <div className="w-5 h-5 border-2 border-t-transparent border-white rounded-full animate-spin"></div>
              <span>Analyzing...</span>
            </>
          ) : (
             <>
              <SparklesIcon />
              <span>Generate Workflow</span>
             </>
          )}
        </button>
      </form>
    </div>
  );
};

export default GoalInput;
