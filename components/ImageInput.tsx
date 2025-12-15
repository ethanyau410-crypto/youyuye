import React, { useCallback, useRef } from 'react';
import { ViewType, PoseConfig, BackgroundType, BackgroundConfig, ImageResolution } from '../types';

interface ImageInputProps {
  previewUrl: string | null;
  onImageSelected: (file: File) => void;
  selectedView: ViewType;
  onViewChange: (view: ViewType) => void;
  poseConfig: PoseConfig;
  onPoseConfigChange: (config: PoseConfig) => void;
  backgroundConfig: BackgroundConfig;
  onBackgroundConfigChange: (config: BackgroundConfig) => void;
  resolution: ImageResolution;
  onResolutionChange: (res: ImageResolution) => void;
  customPrompt: string;
  onCustomPromptChange: (prompt: string) => void;
  fidelity: number;
  onFidelityChange: (value: number) => void;
  disabled: boolean;
}

export const ImageInput: React.FC<ImageInputProps> = ({ 
  previewUrl, 
  onImageSelected, 
  selectedView,
  onViewChange,
  poseConfig,
  onPoseConfigChange,
  backgroundConfig,
  onBackgroundConfigChange,
  resolution,
  onResolutionChange,
  customPrompt,
  onCustomPromptChange,
  fidelity,
  onFidelityChange,
  disabled 
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onImageSelected(file);
    }
  };

  const handleDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (disabled) return;
    const file = event.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      onImageSelected(file);
    }
  }, [disabled, onImageSelected]);

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  const triggerFileSelect = () => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handlePoseChange = (key: keyof PoseConfig, value: number) => {
    onPoseConfigChange({
      ...poseConfig,
      [key]: value
    });
  };

  const handleBackgroundTypeChange = (type: BackgroundType) => {
    onBackgroundConfigChange({
      ...backgroundConfig,
      type
    });
  };

  const handleBackgroundColorChange = (color: string) => {
    onBackgroundConfigChange({
      ...backgroundConfig,
      color
    });
  };

  const showPoseControls = selectedView === ViewType.FRONT || selectedView === ViewType.SHEET || selectedView === ViewType.BACK;

  return (
    <div className="flex flex-col h-full">
      <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
        <span className="bg-gray-200 text-gray-700 w-6 h-6 rounded-full flex items-center justify-center text-xs mr-2">1</span>
        Upload & Configuration
      </h2>
      
      {/* Upload Area */}
      <div 
        className={`flex-grow min-h-[250px] border-2 border-dashed rounded-xl transition-all duration-200 flex flex-col items-center justify-center overflow-hidden bg-white relative mb-4
          ${disabled ? 'opacity-50 cursor-not-allowed border-gray-200' : 'cursor-pointer hover:border-brand-500 hover:bg-brand-50 border-gray-300'}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onClick={triggerFileSelect}
      >
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileChange} 
          accept="image/*" 
          className="hidden" 
          disabled={disabled}
        />

        {previewUrl ? (
          <div className="relative w-full h-full flex items-center justify-center bg-gray-100 p-4">
            <img 
              src={previewUrl} 
              alt="Original" 
              className="max-w-full max-h-full object-contain shadow-sm rounded-lg"
            />
            <div className="absolute bottom-4 right-4 bg-black/50 text-white text-xs px-2 py-1 rounded backdrop-blur-sm">
              Tap to change
            </div>
          </div>
        ) : (
          <div className="text-center p-8">
            <div className="w-16 h-16 bg-brand-100 text-brand-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            <p className="text-gray-900 font-medium">Click to upload</p>
            <p className="text-gray-500 text-sm mt-1">or drag and drop character image</p>
          </div>
        )}
      </div>

      {/* Configuration Area */}
      <div className="mt-auto space-y-4">
        
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="view-type" className="block text-sm font-medium text-gray-700 mb-1">
              Output View
            </label>
            <div className="relative">
              <select
                id="view-type"
                value={selectedView}
                onChange={(e) => onViewChange(e.target.value as ViewType)}
                disabled={disabled}
                className="block w-full pl-2 pr-8 py-2 text-sm border-gray-300 focus:outline-none focus:ring-brand-500 focus:border-brand-500 rounded-lg border bg-white shadow-sm disabled:bg-gray-100 disabled:text-gray-500"
              >
                <option value={ViewType.SHEET}>Character Sheet</option>
                <option value={ViewType.FRONT}>Front View</option>
                <option value={ViewType.SIDE}>Side View</option>
                <option value={ViewType.BACK}>Back View</option>
                <option value={ViewType.TOP}>Top View</option>
              </select>
            </div>
          </div>
          <div>
            <label htmlFor="resolution" className="block text-sm font-medium text-gray-700 mb-1">
              Resolution
            </label>
            <div className="relative">
              <select
                id="resolution"
                value={resolution}
                onChange={(e) => onResolutionChange(e.target.value as ImageResolution)}
                disabled={disabled}
                className="block w-full pl-2 pr-8 py-2 text-sm border-gray-300 focus:outline-none focus:ring-brand-500 focus:border-brand-500 rounded-lg border bg-white shadow-sm disabled:bg-gray-100 disabled:text-gray-500"
              >
                <option value="1K">1K (1024px)</option>
                <option value="2K">2K (2048px)</option>
                <option value="4K">4K (4096px)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Fidelity Slider */}
        <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
           <div className="flex justify-between items-center mb-1">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Reference Fidelity</h3>
              <span className="text-xs text-brand-600 font-bold">{fidelity}%</span>
           </div>
           <input
             type="range"
             min="0"
             max="100"
             value={fidelity}
             onChange={(e) => onFidelityChange(parseInt(e.target.value))}
             disabled={disabled}
             className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-brand-600 disabled:opacity-50"
           />
           <div className="flex justify-between text-[10px] text-gray-400 mt-1">
             <span>Creative</span>
             <span>Balanced</span>
             <span>Strict</span>
           </div>
        </div>

        {/* Custom Instructions */}
        <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
           <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Custom Instructions</h3>
           <textarea
             value={customPrompt}
             onChange={(e) => onCustomPromptChange(e.target.value)}
             placeholder="e.g., Add a red hat, Remove the cape..."
             className="w-full text-sm p-2 border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-brand-500 focus:border-brand-500 resize-none"
             rows={2}
             disabled={disabled}
           />
        </div>

        {/* Background Selection */}
        <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
           <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Background</h3>
           <div className="flex space-x-2 mb-2">
             <button
               onClick={() => handleBackgroundTypeChange(BackgroundType.WHITE)}
               disabled={disabled}
               className={`flex-1 py-1.5 text-xs font-medium rounded-md border transition-colors ${backgroundConfig.type === BackgroundType.WHITE ? 'bg-white border-brand-500 text-brand-600 shadow-sm ring-1 ring-brand-500' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}
             >
               White
             </button>
             <button
               onClick={() => handleBackgroundTypeChange(BackgroundType.TRANSPARENT)}
               disabled={disabled}
               className={`flex-1 py-1.5 text-xs font-medium rounded-md border transition-colors ${backgroundConfig.type === BackgroundType.TRANSPARENT ? 'bg-white border-brand-500 text-brand-600 shadow-sm ring-1 ring-brand-500' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}
             >
               Transparent
             </button>
             <button
               onClick={() => handleBackgroundTypeChange(BackgroundType.CUSTOM_COLOR)}
               disabled={disabled}
               className={`flex-1 py-1.5 text-xs font-medium rounded-md border transition-colors ${backgroundConfig.type === BackgroundType.CUSTOM_COLOR ? 'bg-white border-brand-500 text-brand-600 shadow-sm ring-1 ring-brand-500' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}
             >
               Color
             </button>
           </div>
           
           {backgroundConfig.type === BackgroundType.CUSTOM_COLOR && (
             <div className="flex items-center space-x-2 mt-2">
               <input 
                 type="color" 
                 value={backgroundConfig.color}
                 onChange={(e) => handleBackgroundColorChange(e.target.value)}
                 disabled={disabled}
                 className="h-8 w-8 rounded cursor-pointer border-0 p-0"
               />
               <span className="text-xs text-gray-500 font-mono">{backgroundConfig.color}</span>
             </div>
           )}
        </div>

        {/* Pose Adjustments */}
        {showPoseControls && (
          <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Pose Adjustments</h3>
            
            <div className="mb-3">
              <div className="flex justify-between items-center mb-1">
                <label className="text-sm font-medium text-gray-700">Arm Angle</label>
                <span className="text-xs text-brand-600 font-bold">{poseConfig.armAngle}°</span>
              </div>
              <input 
                type="range" 
                min="0" 
                max="90" 
                step="5"
                value={poseConfig.armAngle}
                onChange={(e) => handlePoseChange('armAngle', parseInt(e.target.value))}
                disabled={disabled}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-brand-600 disabled:opacity-50"
              />
              <div className="flex justify-between text-[10px] text-gray-400 mt-1">
                <span>0° (Down)</span>
                <span>45° (A-Pose)</span>
                <span>90° (T-Pose)</span>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-sm font-medium text-gray-700">Leg Spread</label>
                <span className="text-xs text-brand-600 font-bold">{poseConfig.legSpread}°</span>
              </div>
              <input 
                type="range" 
                min="0" 
                max="45" 
                step="5"
                value={poseConfig.legSpread}
                onChange={(e) => handlePoseChange('legSpread', parseInt(e.target.value))}
                disabled={disabled}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-brand-600 disabled:opacity-50"
              />
              <div className="flex justify-between text-[10px] text-gray-400 mt-1">
                <span>0° (Closed)</span>
                <span>20° (Natural)</span>
                <span>45° (Wide)</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};