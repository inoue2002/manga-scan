'use client';

import { useEffect, useRef, useState } from 'react';

export default function Home() {
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);
  const [currentCamera, setCurrentCamera] = useState('environment'); // Default to external camera
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
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
          }, 2000); // 診断完了メッセージを数秒表示
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

  const [currentStep, setCurrentStep] = useState(0);

  const handleNextStep = () => {
    if(currentStep === 0) {
      setShowModal(true);
    }
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    } else {
      handleAgree();
    }
  };

  return (
    <main className="flex flex-col items-center justify-center min-h-screen p-4 bg-blue-500" onClick={currentStep === 0 ? handleNextStep : undefined}>
      {currentStep === 0 ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-blue-500">
          <h1 className="text-white text-6xl font-bold">Mangatopia</h1>
        </div>
      ) : (
        showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-blue-500">
            <div className="bg-white p-6 rounded-lg shadow-lg w-11/12 h-5/6 flex flex-col items-center justify-center">
              <div className="flex space-x-2 mb-4">
                {[...Array(4)].map((_, index) => (
                  <div
                    key={index}
                    className={`w-3 h-3 rounded-full ${currentStep > index ? 'bg-blue-500' : 'bg-gray-300'}`}
                  ></div>
                ))}
              </div>
              {currentStep === 1 && (
                <div className="flex flex-col items-center space-y-4">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 96 96"
                    stroke-width="6"
                    stroke="currentColor"
                    className="w-24 h-24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      d="M27.308 24.7A9.24 9.24 0 0 1 20.744 28.92c-1.52.216-3.028.448-4.536.7C11.996 30.32 9 34.028 9 38.296V72a9 9 0 0 0 9 9h60a9 9 0 0 0 9-9V38.296c0-4.268-3-7.976-7.208-8.477a191.46 191.46 0 0 0-4.536-.7 9.24 9.24 0 0 1-6.56-4.22l-3.288-5.264a8.768 8.768 0 0 0-6.944-4.156 195.096 195.096 0 0 0-20.928 0 8.768 8.768 0 0 0-6.944 4.156l-3.284 5.264Z"
                    />
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      d="M66 51a18 18 0 1 1-36 0 18 18 0 0 1 36 0ZM75 42h.032v.032H75V42Z"
                    />
                  </svg>

                  <p className="mb-4 text-blue-500 font-bold">Select or take a picture.</p>
                  <button onClick={handleNextStep} className="px-4 py-2 rounded-lg text-black bg-white border border-black font-bold">
                    Next
                  </button>
                </div>
              )}
              {currentStep === 2 && (
                <div className="flex flex-col items-center space-y-4">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 96 96"
                    stroke-width="6"
                    stroke="currentColor"
                    className="w-24 h-24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      d="M60.168 86.688 54.736 66.4m0 0-10.04 8.9 2.276-37.88 20.908 31.668-13.144-2.688Zm-30.072-1.068A33 33 0 1 1 81 42m-39.848 14.848A21 21 0 1 1 69 42"
                    />
                  </svg>

                  <p className="mb-4 text-blue-500 font-bold">Select Onomatopoeia.</p>
                  <button onClick={handleNextStep} className="px-4 py-2 rounded-lg text-black bg-white border border-black font-bold">
                    Next
                  </button>
                </div>
              )}
              {currentStep === 3 && (
                <div className="flex flex-col items-center space-y-4">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 96 96"
                    stroke-width="6"
                    stroke="currentColor"
                    className="w-24 h-24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      d="m84 84-20.788-20.788m0 0A30 30 0 1 0 20.784 20.784a30 30 0 0 0 42.428 42.428Z"
                    />
                  </svg>

                  <p className="mb-4 text-blue-500 font-bold text-center">Read context and visual information using AI.</p>
                  <button onClick={handleNextStep} className="px-4 py-2 rounded-lg text-black bg-white border border-black font-bold">
                    Next
                  </button>
                </div>
              )}
              {currentStep === 4 && (
                <div className="flex flex-col items-center space-y-4">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 96 96"
                    stroke-width="6"
                    stroke="currentColor"
                    className="w-24 h-24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      d="M33 30V24.432c0-4.54 3.38-8.392 7.904-8.768 1.492-.12 2.992-.228 4.492-.32M63 72h9a9 9 0 0 0 9-9V24.432c0-4.54-3.38-8.392-7.904-8.768a193.696 193.696 0 0 0-4.492-.32M63 75v-7.5a13.5 13.5 0 0 0-13.5-13.5h-6a4.5 4.5 0 0 1-4.5-4.5v-6A13.5 13.5 0 0 0 25.5 30H21m47.6-14.656A9.004 9.004 0 0 0 60 9h-6a9.004 9.004 0 0 0-8.6 6.344m23.2 0c.26.84.4 1.732.4 2.656v3h-24V18c0-.924.14-1.816.4-2.656M27 30h-7.5c-2.484 0-4.5 2.016-4.5 4.5v48c0 2.484 2.016 4.5 4.5 4.5h39c2.484 0 4.5-2.016 4.5-4.5V66a36 36 0 0 0-36-36Z"
                    />
                  </svg>

                  <p className="mb-4 text-blue-500 font-bold text-center">Get how it&apos;s used in the context.</p>
                  <button onClick={handleNextStep} className="px-4 py-2 rounded-lg text-black bg-white border border-black font-bold">
                    Next
                  </button>
                </div>
              )}
            </div>
          </div>
        )
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
        <div className="w-full flex justify-center mt-4">
          <button
            onClick={handleCapture}
            className={`w-16 h-16 bg-red-500 text-white rounded-full ${!isCameraOn && 'opacity-50 cursor-not-allowed'}`}
            disabled={!isCameraOn}
          >
            📸
          </button>
          <div className="absolute right-4">
            <button
              onClick={handleCameraSwitch}
              className={`w-16 h-16 bg-green-500 text-white rounded-full ${!isCameraOn && 'opacity-50 cursor-not-allowed'}`}
              disabled={!isCameraOn}
            >
              🔄
            </button>
          </div>
        </div>
      )}
      <canvas ref={canvasRef} className="hidden" width="640" height="480"></canvas>
      {showInfoModal && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black bg-opacity-50"
          onClick={handleModalOutsideClick}
        >
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
