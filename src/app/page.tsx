'use client';

import { useEffect, useRef, useState } from 'react';

export default function Home() {
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);
  const [currentCamera, setCurrentCamera] = useState('user');
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    requestCameraPermission();
  }, []);

  useEffect(() => {
    if (isCameraOn) {
      startCamera();
    } else {
      stopCamera();
    }
  }, [isCameraOn, currentCamera]);

  const requestCameraPermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      setHasPermission(true);
      stream.getTracks().forEach((track) => track.stop());
    } catch (err) {
      console.error('カメラの権限が拒否されました:', err);
      setHasPermission(false);
    }
  };

  const startCamera = async () => {
    setIsLoading(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: currentCamera },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setError(null);
    } catch (err) {
      console.error('カメラの起動に失敗しました:', err);
      setError('エラーが発生しました');
    } finally {
      setIsLoading(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach((track) => track.stop());
    }
    setError(null);
  };

  const handleCameraToggle = () => {
    if (hasPermission) {
      setIsCameraOn(!isCameraOn);
    } else {
      requestCameraPermission();
    }
  };

  const handleCapture = () => {
    if (isCameraOn) {
      console.log('写真を撮影しました');
      // ここに実際の写真撮影のロジックを追加します
    }
  };

  const handleCameraSwitch = () => {
    console.log('カメラを切り替えました');
    setCurrentCamera(currentCamera === 'user' ? 'environment' : 'user');
  };

  const handleAgree = () => {
    setShowModal(false);
    handleCameraToggle();
  };

  return (
    <main className="flex flex-col items-center justify-center min-h-screen p-4">
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h2 className="text-xl font-bold mb-4">利用規約</h2>
            <p className="mb-4">ここに利用規約の内容が入ります。</p>
            <button
              onClick={handleAgree}
              className={`px-4 py-2 rounded-lg text-white ${!hasPermission ? 'bg-gray-500' : 'bg-blue-500'}`}
              disabled={!hasPermission}
            >
              {!hasPermission ? '読み込み中...' : '同意する'}
            </button>
          </div>
        </div>
      )}
      <div className="relative w-full h-full flex-1 bg-gray-200 rounded-lg overflow-hidden">
        {isCameraOn ? (
          error ? (
            <div className="absolute inset-0 flex items-center justify-center text-red-500">{error}</div>
          ) : (
            <video ref={videoRef} autoPlay playsInline className="absolute inset-0 w-full h-full object-cover" />
          )
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">カメラがオフです</div>
        )}
      </div>
      <div className="w-full flex justify-center space-x-4 mt-4">
        <button
          onClick={handleCameraSwitch}
          className={`w-10 h-10 text-white ${!isCameraOn && 'opacity-50 cursor-not-allowed'}`}
          disabled={!isCameraOn}
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-4.553a1 1 0 00-1.414-1.414L13 8.586V4a1 1 0 00-2 0v6a1 1 0 001 1h6a1 1 0 000-2h-4.586l4.553-4.553a1 1 0 00-1.414-1.414L15 10z" />
          </svg>
        </button>
        <button
          onClick={handleCapture}
          className={`w-16 h-16 bg-red-500 text-white rounded-full ${!isCameraOn && 'opacity-50 cursor-not-allowed'}`}
          disabled={!isCameraOn}
        >
          📸
        </button>
      </div>
    </main>
  );
}
