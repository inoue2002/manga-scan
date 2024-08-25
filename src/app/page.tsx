'use client';

import { useEffect, useRef, useState } from 'react';

export default function Home() {
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);
  const [currentCamera, setCurrentCamera] = useState('user');
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [diagnosisComplete, setDiagnosisComplete] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [infoText, setInfoText] = useState('');
  const [showPolygon, setShowPolygon] = useState(false);
  const [modalHeight, setModalHeight] = useState(300); // モーダルの初期高さ
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef<number | null>(null);

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

  const handleCapture = async () => {
    if (isCameraOn && videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d');
      if (context) {
        context.drawImage(videoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height);
        const imageData = canvasRef.current.toDataURL('image/png');
        setCapturedImage(imageData);
        setIsCameraOn(false);
        setIsScanning(true);

        // APIに画像を送信
        try {
          await new Promise((resolve) => setTimeout(resolve, 5000));
          console.log('診断が完了しました');
          setDiagnosisComplete(true);
          setTimeout(() => {
            setDiagnosisComplete(false);
            setShowPolygon(true);
          }, 1000); // 診断完了メッセージを数秒表示
        } catch (err) {
          console.error('APIリクエストに失敗しました:', err);
        } finally {
          setIsScanning(false);
        }
      }
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

  const handleRetake = () => {
    setCapturedImage(null);
    setShowPolygon(false);
    handleCameraToggle();
  };

  const handlePolygonClick = (info: string) => {
    setInfoText(info);
    setShowInfoModal(true);
  };

  const handleDragStart = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    if ('touches' in e) {
      dragStartRef.current = e.touches[0].clientY;
    } else {
      dragStartRef.current = e.clientY;
    }
  };

  const handleDrag = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    if (dragStartRef.current !== null) {
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
      const deltaY = dragStartRef.current - clientY;
      const newHeight = Math.max(100, Math.min(window.innerHeight - 100, modalHeight + deltaY));
      setModalHeight(newHeight);
      dragStartRef.current = clientY;
    }
  };

  const handleDragEnd = () => {
    dragStartRef.current = null;
  };

  const handleModalOutsideClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      setShowInfoModal(false);
    }
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
        ) : capturedImage ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <img src={capturedImage} alt="Captured" className="w-full h-full object-cover" />
            {isScanning && (
              <dotlottie-player
                src="https://lottie.host/a3ed4b2e-f075-425c-995f-07e8d27a33c0/NloAEDRouH.json"
                background="transparent"
                speed="1"
                style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 }}
                loop
                autoplay
              ></dotlottie-player>
            )}
            {diagnosisComplete && !showPolygon && (
              <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 text-white text-xl">
                <iframe src="https://lottie.host/embed/9e9ac502-e8e7-4f41-b68a-b8dc054049b0/LJTQIW39uH.json"></iframe>
              </div>
            )}
            {showPolygon && (
              <svg className="absolute inset-0 w-full h-full">
                <polygon
                  points="50,50 150,50 130,150 70,150"
                  fill="rgba(255, 0, 0, 0.5)"
                  onClick={() => handlePolygonClick('部位1の説明')}
                />
                <polygon
                  points="200,50 300,50 280,150 220,150"
                  fill="rgba(0, 255, 0, 0.5)"
                  onClick={() => handlePolygonClick('部位2の説明')}
                />
                <polygon
                  points="350,50 450,50 430,150 370,150"
                  fill="rgba(0, 0, 255, 0.5)"
                  onClick={() => handlePolygonClick('部位3の説明')}
                />
              </svg>
            )}
            <div className="absolute top-4 left-1 z-10">
              <button
                onClick={handleRetake}
                className="px-6 py-3 text-white rounded-lg  focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
              >
                《
              </button>
            </div>
          </div>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">カメラがオフです</div>
        )}
      </div>
      {!capturedImage && (
        <div className="w-full flex justify-center space-x-4 mt-4">
          <button
            onClick={handleCapture}
            className={`w-16 h-16 bg-red-500 text-white rounded-full ${!isCameraOn && 'opacity-50 cursor-not-allowed'}`}
            disabled={!isCameraOn}
          >
            📸
          </button>
          <button
            onClick={handleCameraSwitch}
            className={`w-16 h-16 bg-green-500 text-white rounded-full ${
              !isCameraOn && 'opacity-50 cursor-not-allowed'
            }`}
            disabled={!isCameraOn}
          >
            🔄
          </button>
        </div>
      )}
      <canvas ref={canvasRef} className="hidden" width="640" height="480"></canvas>
      {showInfoModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black bg-opacity-50" onClick={handleModalOutsideClick}>
          <div
            ref={modalRef}
            className="bg-white rounded-t-lg shadow-lg w-full"
            style={{ height: `${modalHeight}px`, transition: 'height 0.3s ease' }}
          >
            <div
              className="flex justify-center cursor-grab"
              onMouseDown={handleDragStart}
              onMouseMove={handleDrag}
              onMouseUp={handleDragEnd}
              onMouseLeave={handleDragEnd}
              onTouchStart={handleDragStart}
              onTouchMove={handleDrag}
              onTouchEnd={handleDragEnd}
            >
              <div className="w-12 h-1.5 bg-gray-300 rounded-full my-2"></div>
            </div>
            <div className="p-6 overflow-y-auto" style={{ height: 'calc(100% - 40px)' }}>
              <h2 className="text-xl font-bold mb-4">部位の説明</h2>
              <p className="mb-4">{infoText}</p>
              <button onClick={() => setShowInfoModal(false)} className="px-4 py-2 rounded-lg text-white bg-blue-500">
                閉じる
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
