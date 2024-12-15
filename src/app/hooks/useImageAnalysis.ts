import { useState } from 'react';

interface UploadResponse {
  fileId: string;
  codnat?: number[][];
  convertedimg?: string;
  message?: string;
}

interface ChatResponse {
  explanation: string;
}

interface CoordinatesData {
  fileId: string;
  codnat: number[][];
}

interface ResponseType {
  explanation: string
}

export const useImageUpload = () => {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const uploadImage = async (imageFile: File): Promise<string | null> => {
    setIsUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('image', imageFile);
      
      const coordinates: CoordinatesData = {
        fileId: "",
        codnat: [[0, 0], [1000, 1000]]
      };

      const coordinatesBlob = new Blob([JSON.stringify(coordinates)], { 
        type: 'application/json' 
      });
      formData.append('coordinates', coordinatesBlob, 'coordinates.json');

      const response = await fetch('https://mangatopia-mangatopia.up.railway.app/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Upload failed');
      }

      const data: UploadResponse = await response.json();
      return data.fileId;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload image');
      console.error('Upload error:', err);
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  return { uploadImage, isUploading, error };
};

export const useChat = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getChatResponse = async (fileId: string): Promise<ResponseType | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`https://mangatopia-mangatopia.up.railway.app/chat?fileId=${fileId}`, {
        method: 'GET',
      });

      if (!response.ok) {
        throw new Error('Chat request failed');
      }

      const data: ChatResponse = await response.json();
      return {
        explanation : data.explanation
      };
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get chat response');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return { getChatResponse, isLoading, error };
};