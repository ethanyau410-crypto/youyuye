import React, { useState } from 'react';
import { AppStatus, ViewType, StyleAnalysis } from '../types';

interface ResultDisplayProps {
  status: AppStatus;
  generatedImageUrl: string | null;
  onDownload: () => void;
  error?: string | null;
  viewType: ViewType;
  analysis: StyleAnalysis | null;
  isAnalyzing: boolean;
  onAnalyze: () => void;
  videoUrl: string | null;
  isGeneratingVideo: boolean;
  onGenerateVideo: () => void;
}

export const ResultDisplay: React.FC<ResultDisplayProps> = ({ 
  status, 
  generatedImageUrl, 
  onDownload, 
  error, 
  viewType,
  analysis,
  isAnalyzing,
  onAnalyze,
  videoUrl,
  isGeneratingVideo,
  onGenerateVideo
}) => {
  const [activeTab, setActiveTab] = useState<'image' | 'video'>('image');
  
  const getViewTitle = () => {
    switch(viewType) {
      case ViewType.SHEET: return "Character Sheet";
      case ViewType.FRONT: return "Front View (T-Pose)";
      case ViewType.SIDE: return "Side View";
      case ViewType.BACK: return "Back View";
      case ViewType.TOP: return "Top View";
      default: return "Generated View";
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 8) return 'bg-green-500 text-green-700';
    if (score >= 5) return 'bg-yellow-500 text-yellow-700';
    return 'bg-red-500 text-red-700';
  };

  // Switch to video tab automatically when video is ready
  React.useEffect(() => {
    if (videoUrl) {
      setActiveTab('video');
    }
  }, [videoUrl]);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-800 flex items-center">
          <span className="bg-brand-100 text-brand-700 w-6 h-6 rounded-full flex items-center justify-center text-xs mr-2">2</span>
          Result
        </h2>
        
        {/* View Toggle */}
        <div className="flex bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => setActiveTab('image')}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
              activeTab === 'image' 
                ? 'bg-white text-gray-900 shadow-sm' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Image
          </button>
          <button
            onClick={() => setActiveTab('video')}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
              activeTab === 'video' 
                ? 'bg-white text-gray-900 shadow-sm' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Turnaround
          </button>
        </div>
      </div>

      <div className="flex-grow bg-white border border-gray-200 rounded-xl overflow-hidden flex flex-col relative shadow-sm min-h-[400px]">
        {/* Main Content Area */}
        <div className="relative flex-grow bg-gray-50 overflow-hidden flex flex-col">
          
          {/* Loading States */}
          {(status === AppStatus.PROCESSING || isGeneratingVideo) && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-white/90 backdrop-blur-sm">
              <div className="relative w-20 h-20">
                <div className="absolute top-0 left-0 w-full h-full border-4 border-brand-200 rounded-full animate-pulse"></div>
                <div className="absolute top-0 left-0 w-full h-full border-4 border-transparent border-t-brand-600 rounded-full animate-spin"></div>
              </div>
              <p className="mt-4 text-brand-700 font-medium animate-pulse">
                {isGeneratingVideo ? "Generating Turnaround Video..." : "Analyzing structure..."}
              </p>
              <p className="text-gray-400 text-sm mt-1">
                {isGeneratingVideo ? "This may take a minute" : `Generating ${getViewTitle().toLowerCase()}`}
              </p>
            </div>
          )}

          {/* Error State */}
          {status === AppStatus.ERROR && (
            <div className="flex-grow flex flex-col items-center justify-center p-8 text-center text-red-500">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mb-3 opacity-80" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="font-medium">{error || "Something went wrong"}</p>
              <p className="text-sm mt-2 opacity-75">Please try a different image or try again later.</p>
            </div>
          )}

          {/* Empty State */}
          {!generatedImageUrl && status !== AppStatus.PROCESSING && status !== AppStatus.ERROR && (
            <div className="flex-grow flex flex-col items-center justify-center text-gray-400 p-8 text-center bg-gray-50/50">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mb-4 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p>Generated content will appear here</p>
            </div>
          )}

          {/* Content Display */}
          {generatedImageUrl && (
            <>
              {activeTab === 'image' ? (
                <div className="relative flex-grow flex items-center justify-center bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] p-4">
                  <img 
                    src={generatedImageUrl} 
                    alt={`Generated ${getViewTitle()}`} 
                    className={`max-w-full max-h-full object-contain shadow-lg rounded-lg transition-all duration-300 ${analysis ? 'mb-40' : ''}`}
                  />
                  
                  {/* Analysis Overlay */}
                  {analysis && (
                    <div className="absolute bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-gray-200 p-4 transition-transform duration-300 max-h-[50%] overflow-y-auto shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-bold text-gray-800 flex items-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-brand-600" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                          </svg>
                          Style Analysis
                        </h3>
                        <div className="flex items-center">
                          <span className="text-sm font-medium mr-2 text-gray-500">Score:</span>
                          <span className={`px-2 py-0.5 rounded text-sm font-bold ${getScoreColor(analysis.score).replace('text-', 'bg-opacity-20 text-')}`}>
                            {analysis.score}/10
                          </span>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">{analysis.summary}</p>
                      <div className="grid grid-cols-2 gap-4 text-xs">
                        <div>
                          <h4 className="font-semibold text-green-700 mb-1 flex items-center">Preserved</h4>
                          <ul className="list-disc list-inside text-gray-500 space-y-0.5">
                            {analysis.strengths.slice(0, 3).map((s, i) => <li key={i} className="truncate" title={s}>{s}</li>)}
                          </ul>
                        </div>
                        <div>
                          <h4 className="font-semibold text-orange-700 mb-1 flex items-center">Differences</h4>
                          <ul className="list-disc list-inside text-gray-500 space-y-0.5">
                            {analysis.improvements.slice(0, 3).map((s, i) => <li key={i} className="truncate" title={s}>{s}</li>)}
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="relative flex-grow flex items-center justify-center bg-black p-4">
                  {videoUrl ? (
                    <video 
                      src={videoUrl} 
                      controls 
                      autoPlay 
                      loop
                      className="max-w-full max-h-full rounded-lg shadow-lg"
                    />
                  ) : (
                    <div className="text-center text-gray-400">
                      <p className="mb-4">No video generated yet.</p>
                      <button 
                         onClick={onGenerateVideo}
                         className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-white text-sm"
                      >
                        Generate Video
                      </button>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
        
        {/* Footer Actions */}
        {generatedImageUrl && (
          <div className="p-4 border-t border-gray-100 bg-white flex justify-between items-center relative z-30">
            <div className="flex items-center space-x-2">
              {/* Analysis Button */}
              {!analysis && activeTab === 'image' && (
                <button
                  onClick={onAnalyze}
                  disabled={isAnalyzing}
                  className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-brand-600 bg-brand-50 hover:bg-brand-100 transition-colors disabled:opacity-50"
                >
                  {isAnalyzing ? (
                    <>
                      <svg className="animate-spin h-4 w-4 text-brand-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Checking...</span>
                    </>
                  ) : (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>Check Style Match</span>
                    </>
                  )}
                </button>
              )}
              
              {/* Generate Video Button */}
              {!videoUrl && !isGeneratingVideo && (
                <button
                  onClick={onGenerateVideo}
                  className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-purple-600 bg-purple-50 hover:bg-purple-100 transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  <span>Generate Turnaround</span>
                </button>
              )}
            </div>

            <button 
              onClick={onDownload}
              className="flex items-center space-x-2 bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-sm"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              <span>Download</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};