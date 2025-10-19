import React, { useState, useCallback, useMemo } from 'react';
import { AppState, ModelSuggestion, Metrics, FileData, TaskType } from './types';
import FileUpload from './components/FileUpload';
import GoalInput from './components/GoalInput';
import ProcessingView from './components/ProcessingView';
import ModelSelection from './components/ModelSelection';
import ResultsDashboard from './components/ResultsDashboard';
import { generateModelSuggestions, extractTargetColumn } from './services/geminiService';
import { HeaderIcon } from './components/icons';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.FILE_UPLOAD);
  const [fileData, setFileData] = useState<FileData | null>(null);
  const [userGoal, setUserGoal] = useState<string>('');
  const [taskType, setTaskType] = useState<TaskType>(TaskType.OTHER);
  const [targetColumn, setTargetColumn] = useState<string>('');
  const [modelSuggestions, setModelSuggestions] = useState<ModelSuggestion | null>(null);
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const handleFileAccepted = useCallback((data: FileData) => {
    setFileData(data);
    setAppState(AppState.GOAL_INPUT);
    setError(null);
  }, []);

  const handleGoalSubmit = useCallback(async (goal: string) => {
    if (!fileData) return;
    setUserGoal(goal);
    setAppState(AppState.PROCESSING);
    setError(null);

    try {
      // Determine task type based on keywords
      const lowerGoal = goal.toLowerCase();
      if (lowerGoal.includes('classify') || lowerGoal.includes('categorize') || lowerGoal.includes('identify')) {
          setTaskType(TaskType.CLASSIFICATION);
      } else if (lowerGoal.includes('predict') || lowerGoal.includes('forecast') || lowerGoal.includes('estimate')) {
          setTaskType(TaskType.REGRESSION);
      } else {
          setTaskType(TaskType.OTHER);
      }

      if (fileData.type === 'csv' && fileData.headers) {
        const target = await extractTargetColumn(goal, fileData.headers);
        setTargetColumn(target);
      }

      const suggestions = await generateModelSuggestions(goal, fileData.type);
      setModelSuggestions(suggestions);
      setAppState(AppState.MODEL_SELECTION);
    } catch (e) {
      console.error(e);
      setError('Failed to get model suggestions. Please try again.');
      setAppState(AppState.GOAL_INPUT);
    }
  }, [fileData]);

  const handleModelSelect = useCallback((model: string) => {
    setSelectedModel(model);
    setAppState(AppState.RESULTS_DASHBOARD);
  }, []);

  const handleReset = () => {
    setAppState(AppState.FILE_UPLOAD);
    setFileData(null);
    setUserGoal('');
    setModelSuggestions(null);
    setSelectedModel('');
    setError(null);
    setTaskType(TaskType.OTHER);
    setTargetColumn('');
  };

  const renderContent = useMemo(() => {
    switch (appState) {
      case AppState.FILE_UPLOAD:
        return <FileUpload onFileAccepted={handleFileAccepted} />;
      case AppState.GOAL_INPUT:
        return <GoalInput fileData={fileData} onSubmit={handleGoalSubmit} />;
      case AppState.PROCESSING:
        return <ProcessingView />;
      case AppState.MODEL_SELECTION:
        return modelSuggestions && <ModelSelection suggestions={modelSuggestions} onSelect={handleModelSelect} />;
      case AppState.RESULTS_DASHBOARD:
        return <ResultsDashboard 
                  userGoal={userGoal}
                  selectedModel={selectedModel}
                  fileData={fileData}
                  taskType={taskType}
                  targetColumn={targetColumn}
                />;
      default:
        return <FileUpload onFileAccepted={handleFileAccepted} />;
    }
  }, [appState, fileData, handleFileAccepted, handleGoalSubmit, modelSuggestions, handleModelSelect, userGoal, selectedModel, taskType, targetColumn]);

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 flex flex-col items-center p-4 sm:p-6 lg:p-8 font-inter">
      <header className="w-full max-w-6xl mx-auto flex justify-between items-center mb-8">
        <div className="flex items-center gap-3">
          <HeaderIcon />
          <h1 className="text-2xl md:text-3xl font-bold font-space-grotesk text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-teal-300">
            AI Data Scientist Assistant
          </h1>
        </div>
        {appState !== AppState.FILE_UPLOAD && (
          <button
            onClick={handleReset}
            className="px-4 py-2 bg-red-500/20 text-red-300 border border-red-500/50 rounded-lg hover:bg-red-500/40 transition-colors duration-200 text-sm font-semibold"
          >
            Start Over
          </button>
        )}
      </header>
      
      <main className="w-full max-w-6xl mx-auto flex-grow flex flex-col items-center">
        {error && <div className="bg-red-900 border border-red-700 text-red-200 p-3 rounded-lg mb-4 w-full text-center">{error}</div>}
        <div className="w-full transition-all duration-500">
          {renderContent}
        </div>
      </main>

       <footer className="w-full max-w-6xl mx-auto text-center mt-12 text-gray-500 text-sm">
        <p>Powered by Gemini. For educational and demonstration purposes only.</p>
      </footer>
    </div>
  );
};

export default App;