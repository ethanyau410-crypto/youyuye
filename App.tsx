import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { ImageInput } from './components/ImageInput';
import { ResultDisplay } from './components/ResultDisplay';
import { generateView, analyzeStyleConsistency, generateTurnaroundVideo } from './services/geminiService';
import { AppStatus, ViewType, StyleAnalysis, PoseConfig, BackgroundConfig, BackgroundType, ImageResolution } from './types';

function App() {
  const [status, setStatus] = useState<AppStatus>(AppStatus.IDLE);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [viewType, setViewType] = useState<ViewType>(ViewType.SHEET);
  const [poseConfig, setPoseConfig] = useState<PoseConfig>({ armAngle: 90, legSpread: 10 });
  const [backgroundConfig, setBackgroundConfig] = useState<BackgroundConfig>({ type: BackgroundType.WHITE, color: '#00ff00' });
  const [resolution, setResolution] = useState<ImageResolution>('1K');
  const [customPrompt, setCustomPrompt] = useState<string>('');
  const [fidelity, setFidelity] = useState<number>(90); // Default high fidelity
  
  // Analysis State
  const [analysis, setAnalysis] = useState<StyleAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Video State
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isGeneratingVideo, setIsGeneratingVideo] = useState(false);

  // Clean up object URLs on unmount or change
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      if (videoUrl) URL.revokeObjectURL(videoUrl);
    };
  }, [previewUrl, videoUrl]);

  const handleImageSelected = (file: File) => {
    // Reset state
    setStatus(AppStatus.IDLE);
    setGeneratedImageUrl(null);
    setAnalysis(null);
    setVideoUrl(null);
    setError(null);
    setSelectedFile(file);
    
    // Create preview URL
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  };

  const checkApiKey = async () => {
     // API Key Selection Check
     const aistudio = (window as any).aistudio;
     if (aistudio && typeof aistudio.hasSelectedApiKey === 'function') {
       const hasKey = await aistudio.hasSelectedApiKey();
       if (!hasKey) {
         try {
           await aistudio.openSelectKey();
           return true;
         } catch (e) {
           console.error("Key selection failed", e);
           return false;
         }
       }
     }
     return true;
  };

  const handleGenerate = async () => {
    if (!selectedFile) return;

    // High resolution (2K/4K) requires gemini-3-pro, which requires user-selected API Key.
    if (resolution !== '1K') {
       const keySelected = await checkApiKey();
       if (!keySelected) return;
    }

    setStatus(AppStatus.PROCESSING);
    setAnalysis(null);
    setVideoUrl(null);
    setError(null);

    try {
      const resultUrl = await generateView(
        selectedFile, 
        viewType,
        poseConfig, 
        backgroundConfig, 
        resolution, 
        customPrompt,
        fidelity
      );
      setGeneratedImageUrl(resultUrl);
      setStatus(AppStatus.SUCCESS);
    } catch (err: any) {
      console.error(err);
      
      const aistudio = (window as any).aistudio;
      if (err.message && err.message.includes("Requested entity was not found") && aistudio) {
          await aistudio.openSelectKey();
          setError("API Key issue detected. Please select your key again and retry.");
      } else {
          setError(err.message || "An unexpected error occurred.");
      }
      setStatus(AppStatus.ERROR);
    }
  };

  const handleAnalyze = async () => {
    if (!selectedFile || !generatedImageUrl) return;
    
    setIsAnalyzing(true);
    try {
      const result = await analyzeStyleConsistency(selectedFile, generatedImageUrl);
      setAnalysis(result);
    } catch (err) {
      console.error("Analysis failed", err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleGenerateVideo = async () => {
    if (!generatedImageUrl) return;

    // API Key Selection Check for Veo
    const keySelected = await checkApiKey();
    if (!keySelected) return;

    setIsGeneratingVideo(true);
    setError(null);

    try {
      const resultVideoUrl = await generateTurnaroundVideo(generatedImageUrl);
      setVideoUrl(resultVideoUrl);
    } catch (err: any) {
      console.error("Video generation failed", err);
      // If error contains "Requested entity was not found", reset key selection
      const aistudio = (window as any).aistudio;
      if (err.message && err.message.includes("Requested entity was not found") && aistudio) {
          await aistudio.openSelectKey();
          setError("API Key issue detected. Please select your key again and retry.");
      } else {
          setError(err.message || "Failed to generate video.");
      }
    } finally {
      setIsGeneratingVideo(false);
    }
  };

  const handleDownload = () => {
    if (generatedImageUrl) {
      // Extract MIME type to determine correct extension
      const mimeType = generatedImageUrl.match(/data:(image\/\w+);base64/)?.[1];
      let extension = 'png'; // Default
      
      if (mimeType === 'image/jpeg') extension = 'jpg';
      if (mimeType === 'image/webp') extension = 'webp';
      
      const link = document.createElement('a');
      link.href = generatedImageUrl;
      link.download = `generated-view-${viewType.toLowerCase()}-${resolution.toLowerCase()}-${Date.now()}.${extension}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />

      <main className="flex-grow max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center max-w-3xl mx-auto mb-8">
          <h1 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
            Model View Generator
          </h1>
          <p className="mt-3 text-lg text-gray-500">
            Generate standard orthographic views for 3D modeling references.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start h-[650px] lg:h-[700px]">
          {/* Input Section */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-full flex flex-col">
            <ImageInput 
              previewUrl={previewUrl} 
              onImageSelected={handleImageSelected}
              disabled={status === AppStatus.PROCESSING || isGeneratingVideo}
              selectedView={viewType}
              onViewChange={setViewType}
              poseConfig={poseConfig}
              onPoseConfigChange={setPoseConfig}
              backgroundConfig={backgroundConfig}
              onBackgroundConfigChange={setBackgroundConfig}
              resolution={resolution}
              onResolutionChange={setResolution}
              customPrompt={customPrompt}
              onCustomPromptChange={setCustomPrompt}
              fidelity={fidelity}
              onFidelityChange={setFidelity}
            />
            
            <div className="mt-6">
               <button
                onClick={handleGenerate}
                disabled={!selectedFile || status === AppStatus.PROCESSING || isGeneratingVideo}
                className={`w-full py-4 px-6 rounded-xl font-bold text-lg transition-all duration-200 shadow-md flex justify-center items-center
                  ${!selectedFile || status === AppStatus.PROCESSING || isGeneratingVideo
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
                    : 'bg-brand-600 hover:bg-brand-700 text-white hover:shadow-lg transform hover:-translate-y-0.5 active:translate-y-0'}`}
              >
                {status === AppStatus.PROCESSING ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                    </svg>
                    Generate View
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Output Section */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-full">
            <ResultDisplay 
              status={status} 
              generatedImageUrl={generatedImageUrl} 
              onDownload={handleDownload}
              error={error}
              viewType={viewType}
              analysis={analysis}
              isAnalyzing={isAnalyzing}
              onAnalyze={handleAnalyze}
              videoUrl={videoUrl}
              isGeneratingVideo={isGeneratingVideo}
              onGenerateVideo={handleGenerateVideo}
            />
          </div>
        </div>
      </main>

      <footer className="bg-white border-t border-gray-200 py-6 mt-8">
        <div className="max-w-7xl mx-auto px-4 text-center text-gray-400 text-sm">
          Powered by Gemini 2.5 Flash Image Model & Veo 3.1
        </div>
      </footer>
    </div>
  );
}

export default App;