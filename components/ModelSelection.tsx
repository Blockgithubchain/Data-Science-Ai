import React from 'react';
import { ModelSuggestion } from '../types';
import { CheckBadgeIcon, StarIcon } from './icons';

interface ModelSelectionProps {
  suggestions: ModelSuggestion;
  onSelect: (model: string) => void;
}

const ModelCard: React.FC<{ model: string; isRecommended: boolean; onSelect: () => void; }> = ({ model, isRecommended, onSelect }) => {
  return (
    <button
      onClick={onSelect}
      className="relative w-full p-6 bg-gray-800 border border-gray-700 rounded-lg text-left transition-all duration-300 hover:border-blue-500 hover:bg-gray-700/50 hover:-translate-y-1 group"
    >
      {isRecommended && (
        <div className="absolute top-0 right-0 -mt-3 -mr-3 flex items-center gap-1 bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full">
          <StarIcon />
          Recommended
        </div>
      )}
      <h3 className="text-xl font-bold font-space-grotesk text-gray-100">{model}</h3>
      <p className="text-gray-400 mt-2">A robust choice for this type of problem.</p>
       <div className="absolute bottom-4 right-4 text-gray-600 group-hover:text-blue-400 transition-colors">
          <CheckBadgeIcon />
        </div>
    </button>
  );
};

const OtherModelCard: React.FC<{ model: string; onSelect: () => void; }> = ({ model, onSelect }) => (
    <button
      onClick={onSelect}
      className="w-full p-3 bg-gray-800/70 border border-gray-700 rounded-lg text-center transition-colors duration-200 hover:border-blue-600 hover:bg-gray-700/60"
    >
        <h4 className="font-medium text-gray-300 text-sm">{model}</h4>
    </button>
);

const ModelSelection: React.FC<ModelSelectionProps> = ({ suggestions, onSelect }) => {
  return (
    <div className="w-full max-w-5xl mx-auto flex flex-col items-center p-8">
      <h2 className="text-3xl font-bold mb-2 font-space-grotesk">Select a Model</h2>
      <p className="text-gray-400 mb-8 text-center">Based on your goal, here are some suggested machine learning models. We've highlighted our top recommendation.</p>

      <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {(suggestions.options || []).map((model, index) => (
          <ModelCard
            key={index}
            model={model}
            isRecommended={model === suggestions.recommended}
            onSelect={() => onSelect(model)}
          />
        ))}
      </div>
      
      {(suggestions.more_models && suggestions.more_models.length > 0) && (
        <div className="w-full mt-16">
            <div className="relative text-center mb-8">
                <div className="absolute inset-0 flex items-center" aria-hidden="true">
                    <div className="w-full border-t border-gray-700" />
                </div>
                <div className="relative flex justify-center">
                    <span className="bg-gray-900 px-4 text-lg font-medium text-gray-400">
                        Explore Other Well-Known Models
                    </span>
                </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {suggestions.more_models.map((model, index) => (
                    <OtherModelCard key={index} model={model} onSelect={() => onSelect(model)} />
                ))}
            </div>
        </div>
      )}
    </div>
  );
};

export default ModelSelection;