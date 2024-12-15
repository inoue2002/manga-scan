import { useState } from 'react';

interface Point {
  x: number;
  y: number;
}

interface AnalysisResponse {
  explanation: string;
}

export const useImageAnalysis = () => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);

  const analyzeImageRegion = async (
    fileId: string,
    points: [Point, Point]
  ): Promise<AnalysisResponse | null> => {
    setIsAnalyzing(true);
    setAnalysisError(null);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileId,
          points: points.map(p => [p.x, p.y]),
        }),
      });

      if (!response.ok) {
        throw new Error('Analysis failed');
      }

      const data = await response.json();
      setAnalysisResult(data.explanation);
      return data;
    } catch (error) {
      setAnalysisError(error instanceof Error ? error.message : 'Failed to analyze image');
      return null;
    } finally {
      setIsAnalyzing(false);
    }
  };

  return {
    analyzeImageRegion,
    isAnalyzing,
    analysisError,
    analysisResult,
  };
};