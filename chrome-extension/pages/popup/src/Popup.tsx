import '@src/Popup.css';
import { useStorage, withErrorBoundary, withSuspense } from '@extension/shared';
import { exampleThemeStorage } from '@extension/storage';
import { useState } from 'react';
import Webcam from 'react-webcam';
import ClipLoader from 'react-spinners/ClipLoader';
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';

const videoConstraints = {
  width: 1280,
  height: 720,
  facingMode: 'user',
};

interface ApiResponse {
  emoji: string;
}

const sendData = async (
  imageSrc: string,
  setFastData: React.Dispatch<React.SetStateAction<ApiResponse | null>>,
  setSlowData: React.Dispatch<React.SetStateAction<ApiResponse | null>>,
  setLoadingFast: React.Dispatch<React.SetStateAction<boolean>>,
  setLoadingSlow: React.Dispatch<React.SetStateAction<boolean>>,
) => {
  // Fast API call
  const fastApiPromise = axios.post('http://localhost:8000/image-to-emoji', {
    image: imageSrc,
  });

  // Slow API call
  // const slowApiPromise = axios.post('http://localhost:8000/generate-emoji', {
  //   image: imageSrc,
  // });

  try {
    // Handle fast API response
    const fastResult = await fastApiPromise;
    setFastData(fastResult.data);
    setLoadingFast(false);
  } catch (error) {
    console.error('Fast API error:', error);
    setLoadingFast(false);
  }

  // try {
  //   // Handle slow API response
  //   const slowResult = await slowApiPromise;
  //   setSlowData(slowResult.data);
  //   setLoadingSlow(false);
  // } catch (error) {
  //   console.error('Slow API error:', error);
  //   setLoadingSlow(false);
  // }
};

const Popup = () => {
  const theme = useStorage(exampleThemeStorage);
  const isLight = theme === 'light';
  const [loadingFast, setLoadingFast] = useState(false);
  const [loadingSlow, setLoadingSlow] = useState(false);
  const [fastData, setFastData] = useState<ApiResponse | null>(null);
  const [slowData, setSlowData] = useState<ApiResponse | null>(null);

  // Handle webcam photo capture
  const handleCapturePhoto = async getScreenshot => {
    const imageSrc = getScreenshot();
    if (imageSrc) {
      setLoadingFast(true);
      setLoadingSlow(true);
      console.log('test');
      await sendData(imageSrc, setFastData, setSlowData, setLoadingFast, setLoadingSlow);
    }
  };
  const handleCopyToClipboard = async () => {
    if (fastData?.emoji) {
      try {
        await navigator.clipboard.writeText(fastData.emoji);
        toast.success('Copied to clipboard!', {
          position: 'top-center',
          autoClose: 3000,
        });
      } catch (error) {
        console.error('Failed to copy text to clipboard:', error);
        toast.error('Failed to copy to clipboard.', {
          position: 'top-center',
          autoClose: 3000,
        });
      }
    }
  };
  return (
    <div className={`App`}>
      <ToastContainer />
      <header className={`App-header ${isLight ? 'text-gray-900' : 'text-gray-100'}`}>
        <Webcam
          audio={false}
          height={720}
          screenshotFormat="image/jpeg"
          width={1280}
          style={{ borderRadius: 5 }}
          videoConstraints={videoConstraints}>
          {({ getScreenshot }) => (
            <>
              <div className="result-section gap-4 flex justify-center items-center w-full">
                <div className="flex w-full justify-center items-center">
                  {loadingFast && (
                    <ClipLoader className="my-4" aria-label="Loading Fast API" color="#3b3b3b" size={20} />
                  )}
                  {fastData && (
                    <div className="flex flex-col w-full">
                      <span className="fast-result-emoji-text">👦🏻</span>
                      <button className="copy-button" aria-label="Copy to clipboard" onClick={handleCopyToClipboard}>
                        Copy
                      </button>
                    </div>
                  )}
                </div>

                {/* <div className="flex w-full justify-center items-center">
                  {loadingSlow && <ClipLoader aria-label="Loading Slow API" color="#3b3b3b" size={20} />}
                  {slowData && <span>{slowData.emoji}</span>}
                </div> */}
              </div>

              <button
                aria-label="Capture photo"
                className="capture-button"
                disabled={loadingFast}
                onClick={() => handleCapturePhoto(getScreenshot)}>
                Capture Photo
              </button>
            </>
          )}
        </Webcam>
      </header>
    </div>
  );
};

export default withErrorBoundary(withSuspense(Popup, <div>Loading...</div>), <div>Error occurred</div>);
