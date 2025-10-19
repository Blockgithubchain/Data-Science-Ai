import React, { useState, useEffect, useCallback } from 'react';
import { FileData, Metrics, TaskType } from '../types';
import { generateWorkflowExplanation, generateMetrics, generateSampleInput, generatePrediction } from '../services/geminiService';
import ReactMarkdown from 'react-markdown';
import { RefreshIcon, DocumentTextIcon, ChartBarIcon, BeakerIcon, ClipboardIcon, CheckIcon } from './icons';

interface ResultsDashboardProps {
  userGoal: string;
  selectedModel: string;
  fileData: FileData | null;
  taskType: TaskType;
  targetColumn: string;
}

const LoadingSkeleton: React.FC = () => (
    <div className="space-y-4 animate-pulse">
        <div className="h-8 bg-gray-700 rounded w-1/3"></div>
        <div className="h-4 bg-gray-700 rounded w-full"></div>
        <div className="h-4 bg-gray-700 rounded w-5/6"></div>
        <div className="h-4 bg-gray-700 rounded w-3/4"></div>
    </div>
);


const ResultsDashboard: React.FC<ResultsDashboardProps> = ({ userGoal, selectedModel, fileData, taskType, targetColumn }) => {
  const [explanation, setExplanation] = useState<string>('');
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [testInputValues, setTestInputValues] = useState<Record<string, string>>({});
  const [prediction, setPrediction] = useState<string>('');
  const [isLoading, setIsLoading] = useState({ explanation: true, metrics: true, prediction: false, sample: false });
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('metrics');
  const [isCopied, setIsCopied] = useState(false);


  const fetchAllData = useCallback(async () => {
    if (!fileData) return;
    
    // Fetch Explanation
    try {
      setIsLoading(prev => ({...prev, explanation: true}));
      const exp = await generateWorkflowExplanation(userGoal, selectedModel, fileData.type, fileData.headers, fileData.content);
      setExplanation(exp);
    } catch (e) {
      console.error(e);
      setError('Failed to generate workflow explanation.');
    } finally {
      setIsLoading(prev => ({...prev, explanation: false}));
    }
    
    // Fetch Metrics
    try {
      setIsLoading(prev => ({...prev, metrics: true}));
      const mets = await generateMetrics(selectedModel, userGoal, taskType);
      setMetrics(mets);
    } catch (e) {
      console.error(e);
      setError('Failed to generate model metrics.');
    } finally {
      setIsLoading(prev => ({...prev, metrics: false}));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userGoal, selectedModel, fileData, taskType]);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  useEffect(() => {
    if (fileData?.type === 'csv' && fileData.headers) {
      const initialInputs = fileData.headers
        .filter(header => header !== targetColumn)
        .reduce((acc, header) => {
            acc[header] = '';
            return acc;
        }, {} as Record<string, string>);
      setTestInputValues(initialInputs);
    }
  }, [fileData, targetColumn]);
  
  const handleGenerateSample = useCallback(async () => {
    if (fileData?.type !== 'csv' || !fileData.headers || !fileData.content) return;
    setIsLoading(prev => ({ ...prev, sample: true }));
    setPrediction('');
    try {
      const sample = await generateSampleInput(fileData.headers, fileData.content, targetColumn);
      const sampleAsStrings = Object.fromEntries(
        Object.entries(sample).map(([key, value]) => [key, String(value)])
      );
      setTestInputValues(sampleAsStrings);
    } catch (e) {
      console.error(e);
      setError('Failed to generate sample input.');
    } finally {
      setIsLoading(prev => ({ ...prev, sample: false }));
    }
  }, [fileData, targetColumn]);
  
  const handleTestModel = useCallback(async () => {
    if (Object.values(testInputValues).some(v => v.trim() === '')) {
        setError('Please fill in all input fields to test the model.');
        return;
    }
    setError(null);
    setIsLoading(prev => ({...prev, prediction: true}));
    setPrediction('');
    try {
      const pred = await generatePrediction(userGoal, selectedModel, JSON.stringify(testInputValues), fileData?.headers);
      setPrediction(pred);
    } catch (e) {
      console.error(e);
      setError('Failed to generate prediction.');
    } finally {
      setIsLoading(prev => ({...prev, prediction: false}));
    }
  }, [userGoal, selectedModel, testInputValues, fileData]);

  const renderMetrics = () => {
    if (isLoading.metrics) return <LoadingSkeleton />;
    if (!metrics) return <p className="text-gray-400">No metrics available.</p>;

    return (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {Object.entries(metrics.metrics).map(([key, value]) => (
                <div key={key} className="bg-gray-900 p-4 rounded-lg border border-gray-700">
                    <p className="text-sm text-gray-400">{key}</p>
                    <p className="text-2xl font-bold font-space-grotesk text-teal-300">
                        {typeof value === 'number' ? value.toFixed(4) : value}
                    </p>
                </div>
            ))}
            {metrics.confusion_matrix && (
                <div className="col-span-2 md:col-span-3 bg-gray-900 p-4 rounded-lg border border-gray-700">
                    <h4 className="text-lg font-semibold mb-2 text-gray-200">Confusion Matrix</h4>
                    <div className="inline-block relative">
                        <div className="absolute top-0 -left-12 w-12 text-center text-sm text-gray-400">
                            <div className="h-10 flex items-center justify-center">True</div>
                        </div>
                         <div className="absolute -top-6 left-0 w-full text-center text-sm text-gray-400 flex justify-around">
                            <span>Predicted Pos</span><span>Predicted Neg</span>
                        </div>
                        <div className="flex">
                            <div className="text-sm text-gray-400 w-8 flex flex-col justify-around text-right pr-2">
                                <div>Pos</div><div>Neg</div>
                            </div>
                            <table className="border-collapse">
                                <tbody>
                                    <tr>
                                        <td className="w-24 h-16 text-center text-xl font-bold border border-gray-600 bg-green-500/20 text-green-300">{metrics.confusion_matrix[0][0]} <span className="block text-xs font-normal">TP</span></td>
                                        <td className="w-24 h-16 text-center text-xl font-bold border border-gray-600 bg-red-500/20 text-red-300">{metrics.confusion_matrix[0][1]} <span className="block text-xs font-normal">FP</span></td>
                                    </tr>
                                    <tr>
                                        <td className="w-24 h-16 text-center text-xl font-bold border border-gray-600 bg-orange-500/20 text-orange-300">{metrics.confusion_matrix[1][0]} <span className="block text-xs font-normal">FN</span></td>
                                        <td className="w-24 h-16 text-center text-xl font-bold border border-gray-600 bg-green-500/20 text-green-300">{metrics.confusion_matrix[1][1]} <span className="block text-xs font-normal">TN</span></td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code).then(() => {
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000); // Reset after 2 seconds
    }, (err) => {
        console.error('Could not copy text: ', err);
        setError('Failed to copy code to clipboard.');
    });
  };

  const renderExplanation = () => {
    if (isLoading.explanation) return <LoadingSkeleton />;

    const CodeBlock = ({ node, inline, className, children, ...props }: any) => {
        const match = /language-(\w+)/.exec(className || '');
        const codeText = String(children).replace(/\n$/, '');

        return !inline && match ? (
            <div className="relative my-4" >
                <pre {...props} className="bg-gray-950 p-4 rounded-md overflow-x-auto text-sm font-mono" style={{paddingTop: '2.5rem'}}>
                    <code>{children}</code>
                </pre>
                <button
                    onClick={() => handleCopyCode(codeText)}
                    className="absolute top-2 right-2 flex items-center gap-1.5 bg-gray-700 hover:bg-gray-600 text-gray-300 px-2 py-1 rounded-md text-xs font-sans transition-colors"
                >
                  {isCopied ? <CheckIcon className="w-4 h-4 text-green-400" /> : <ClipboardIcon className="w-4 h-4" />}
                  {isCopied ? 'Copied!' : 'Copy Code'}
                </button>
            </div>
        ) : (
            <code className={className} {...props}>
                {children}
            </code>
        );
    };

    return (
        <div className="prose prose-invert prose-headings:font-space-grotesk prose-headings:text-teal-300 prose-a:text-blue-400 prose-strong:text-gray-100 max-w-none bg-gray-900 p-6 rounded-lg border border-gray-700">
            <ReactMarkdown components={{ code: CodeBlock }}>{explanation}</ReactMarkdown>
        </div>
    );
  };

  const renderTestBench = () => {
    if (fileData?.type === 'image') {
        return <p className="text-gray-400 text-center p-8">Image model testing is not yet implemented in this demo.</p>
    }

    const handleInputChange = (header: string, value: string) => {
        setTestInputValues(prev => ({ ...prev, [header]: value }));
    };
    
    const inputHeaders = fileData?.headers?.filter(header => header !== targetColumn) || [];
    const isTestButtonDisabled = Object.values(testInputValues).some(v => v.trim() === '') || isLoading.prediction;

    return (
        <div className="bg-gray-900 p-6 rounded-lg border border-gray-700">
            <h4 className="text-lg font-semibold mb-1 text-gray-200">Generate Sample Input</h4>
            <p className="text-sm text-gray-400 mb-4">Based on your CSV headers, we can generate a sample row of data.</p>
            <button onClick={handleGenerateSample} disabled={isLoading.sample} className="flex items-center gap-2 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 disabled:opacity-50 transition-colors">
                <RefreshIcon className={isLoading.sample ? 'animate-spin' : ''} />
                {isLoading.sample ? 'Generating...' : 'Generate Sample'}
            </button>

            <div className="mt-6">
                <h4 className="text-lg font-semibold mb-1 text-gray-200">Test Input Data</h4>
                <p className="text-sm text-gray-400 mb-4">Enter values for each feature to test the model.</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {inputHeaders.map(header => (
                    <div key={header}>
                      <label htmlFor={`input-${header}`} className="block text-sm font-medium text-gray-300 mb-1 truncate" title={header}>
                        {header}
                      </label>
                      <input
                        id={`input-${header}`}
                        type="text"
                        value={testInputValues[header] || ''}
                        onChange={(e) => handleInputChange(header, e.target.value)}
                        className="w-full p-2 bg-gray-800 border border-gray-600 rounded-md font-mono text-sm focus:ring-1 focus:ring-blue-500 focus:outline-none"
                        placeholder={`Enter value for ${header}...`}
                      />
                    </div>
                  ))}
                </div>
            </div>
            <button onClick={handleTestModel} disabled={isTestButtonDisabled} className="mt-6 w-full py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors">
                {isLoading.prediction ? 'Predicting...' : 'Test Model'}
            </button>

            {prediction && (
                <div className="mt-6 p-4 bg-teal-900/50 border border-teal-700 rounded-lg">
                    <h5 className="font-semibold text-teal-200">Model Prediction:</h5>
                    <p className="font-mono text-lg text-white">{prediction}</p>
                </div>
            )}
        </div>
    );
  };
  
  const TABS = [
      { id: 'metrics', label: 'Performance Metrics', icon: <ChartBarIcon /> },
      { id: 'explanation', label: 'Workflow Explanation', icon: <DocumentTextIcon /> },
      { id: 'test', label: 'Test Bench', icon: <BeakerIcon /> },
  ]

  return (
    <div className="w-full">
      <h2 className="text-3xl font-bold mb-2 font-space-grotesk text-center">Results for <span className="text-blue-400">{selectedModel}</span></h2>
      <p className="text-gray-400 mb-8 text-center max-w-2xl mx-auto">Here's the breakdown of the simulated model training, its performance, and how it works. You can also test it with sample data.</p>
      
       {error && <div className="bg-red-900 border border-red-700 text-red-200 p-3 rounded-lg mb-4 w-full text-center">{error}</div>}

      <div className="border-b border-gray-700 mb-6">
          <nav className="-mb-px flex space-x-6" aria-label="Tabs">
              {TABS.map(tab => (
                  <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`whitespace-nowrap flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                          activeTab === tab.id
                              ? 'border-blue-500 text-blue-400'
                              : 'border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-500'
                      }`}
                  >
                      {tab.icon}
                      {tab.label}
                  </button>
              ))}
          </nav>
      </div>

      <div>
          {activeTab === 'metrics' && renderMetrics()}
          {activeTab === 'explanation' && renderExplanation()}
          {activeTab === 'test' && renderTestBench()}
      </div>
    </div>
  );
};

export default ResultsDashboard;