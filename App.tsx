import React, { useState, useRef, useEffect, useCallback } from 'react';
import { AppState, CanvasRef } from './types';
import DrawingCanvas from './components/DrawingCanvas';
import ResultView from './components/ResultView';
import { analyzeHTPDrawing } from './services/gemini';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.HOME);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [analysisText, setAnalysisText] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const canvasRef = useRef<CanvasRef>(null);
  
  // Responsive canvas size
  const [canvasSize, setCanvasSize] = useState({ width: 300, height: 300 });

  useEffect(() => {
    const updateSize = () => {
      // Calculate responsive width (max 500px, but responsive to container)
      const containerWidth = Math.min(window.innerWidth - 32, 500); 
      setCanvasSize({ width: containerWidth, height: containerWidth }); // Square canvas
    };
    
    window.addEventListener('resize', updateSize);
    updateSize();
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setImageSrc(event.target.result as string);
          setAppState(AppState.ANALYZING);
          performAnalysis(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDrawSubmit = () => {
    if (canvasRef.current) {
      const dataUrl = canvasRef.current.getImageData();
      if (dataUrl) {
        setImageSrc(dataUrl);
        setAppState(AppState.ANALYZING);
        performAnalysis(dataUrl);
      }
    }
  };

  const performAnalysis = async (imageData: string) => {
    try {
      setAnalysisText('');
      setError(null);
      const stream = await analyzeHTPDrawing(imageData);
      const reader = stream.getReader();
      
      setAppState(AppState.RESULT);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        setAnalysisText(prev => prev + value);
      }
    } catch (err) {
      setError("Unable to analyze the image. Please try again.");
      setAppState(AppState.ERROR);
    }
  };

  const resetApp = useCallback(() => {
    setAppState(AppState.HOME);
    setImageSrc(null);
    setAnalysisText('');
    setError(null);
    if(canvasRef.current) canvasRef.current.clear();
  }, []);

  // -- Views --

  const renderHome = () => (
    <div className="flex flex-col items-center justify-center space-y-8 animate-fade-in px-4">
      <div className="text-center max-w-2xl">
        <h1 className="text-4xl md:text-6xl font-extrabold text-brand-900 mb-6 tracking-tight">
          Mind<span className="text-brand-500">Scape</span>
        </h1>
        <p className="text-lg md:text-xl text-gray-600 leading-relaxed mb-8">
          Unlock the hidden language of your subconscious. Draw a House, a Tree, and a Person, and let our AI provide a gentle psychological reflection.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6 w-full max-w-lg">
        <button 
          onClick={() => setAppState(AppState.DRAWING)}
          className="group relative p-8 bg-white rounded-2xl shadow-md border-2 border-transparent hover:border-brand-500 transition-all duration-300 flex flex-col items-center hover:shadow-xl"
        >
          <div className="w-16 h-16 bg-brand-50 rounded-full flex items-center justify-center mb-4 group-hover:bg-brand-100 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-brand-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">Draw Here</h3>
          <p className="text-center text-gray-500 text-sm">Use our digital canvas to sketch your HTP instantly.</p>
        </button>

        <label className="group relative p-8 bg-white rounded-2xl shadow-md border-2 border-transparent hover:border-brand-500 transition-all duration-300 flex flex-col items-center hover:shadow-xl cursor-pointer">
          <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
          <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-4 group-hover:bg-blue-100 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">Upload Art</h3>
          <p className="text-center text-gray-500 text-sm">Already have a drawing? Snap a photo and upload it.</p>
        </label>
      </div>

      <div className="mt-12 text-center text-xs text-gray-400 max-w-md">
        House-Tree-Person (HTP) is a projective personality test. This tool uses Gemini AI to provide an interpretation for entertainment purposes.
      </div>
    </div>
  );

  const renderDrawing = () => (
    <div className="flex flex-col items-center justify-center min-h-[80vh] w-full px-4 animate-fade-in">
        <div className="w-full max-w-lg mb-6 flex justify-between items-center">
            <button onClick={resetApp} className="flex items-center text-gray-500 hover:text-brand-600 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                </svg>
                Back
            </button>
            <h2 className="font-bold text-gray-800">Draw H-T-P</h2>
            <button 
                onClick={() => canvasRef.current?.clear()} 
                className="text-sm text-red-500 hover:text-red-700 font-medium"
            >
                Clear
            </button>
        </div>

        <div className="mb-4 text-center">
            <p className="text-sm text-gray-500 bg-gray-100 py-2 px-4 rounded-full">
                Please draw a <strong className="text-gray-800">House</strong>, a <strong className="text-gray-800">Tree</strong>, and a <strong className="text-gray-800">Person</strong>.
            </p>
        </div>

        <DrawingCanvas 
            ref={canvasRef} 
            width={canvasSize.width} 
            height={canvasSize.height} 
        />
        
        <button
            onClick={handleDrawSubmit}
            className="mt-8 bg-brand-600 hover:bg-brand-700 text-white font-semibold py-3 px-8 rounded-full shadow-lg transform transition-all active:scale-95 flex items-center"
        >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
            </svg>
            Analyze Artwork
        </button>
    </div>
  );

  const renderLoading = () => (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center animate-fade-in">
      <div className="relative w-24 h-24 mb-8">
        <div className="absolute top-0 left-0 w-full h-full border-4 border-gray-100 rounded-full"></div>
        <div className="absolute top-0 left-0 w-full h-full border-4 border-brand-500 rounded-full border-t-transparent animate-spin"></div>
      </div>
      <h2 className="text-2xl font-bold text-gray-800 mb-2">Analyzing...</h2>
      <p className="text-gray-500 max-w-sm">The AI is observing the lines, structures, and details of your drawing to form an interpretation.</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans selection:bg-brand-100">
        {/* Simple Header */}
        <header className="fixed top-0 w-full bg-white/80 backdrop-blur-md border-b border-gray-100 z-50 h-16 flex items-center justify-between px-6">
            <div className="flex items-center cursor-pointer" onClick={resetApp}>
                 <div className="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center mr-2">
                    <span className="text-white font-bold text-lg">M</span>
                 </div>
                 <span className="font-bold text-xl tracking-tight text-gray-800">MindScape</span>
            </div>
            <div>
                 {/* Placeholder for future links */}
            </div>
        </header>

        {/* Main Content */}
        <main className="pt-24 pb-10 flex items-center justify-center min-h-screen">
            {appState === AppState.HOME && renderHome()}
            {appState === AppState.DRAWING && renderDrawing()}
            {appState === AppState.ANALYZING && renderLoading()}
            {appState === AppState.RESULT && (
                <ResultView 
                    imageSrc={imageSrc} 
                    analysisText={analysisText} 
                    isStreaming={true} // In this simple implementation, we stay in RESULT state while streaming
                    onReset={resetApp}
                />
            )}
            {appState === AppState.ERROR && (
                <div className="text-center p-8 bg-white rounded-xl shadow-lg border border-red-100 max-w-md mx-4">
                    <div className="text-red-500 text-5xl mb-4">⚠️</div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Oops! Something went wrong.</h3>
                    <p className="text-gray-600 mb-6">{error || 'An unexpected error occurred.'}</p>
                    <button onClick={resetApp} className="bg-gray-900 text-white px-6 py-2 rounded-lg hover:bg-black transition-colors">
                        Try Again
                    </button>
                </div>
            )}
        </main>
    </div>
  );
};

export default App;
