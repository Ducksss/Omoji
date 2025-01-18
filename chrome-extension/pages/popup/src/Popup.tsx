import '@src/Popup.css';
import { useStorage, withErrorBoundary, withSuspense } from '@extension/shared';
import { exampleThemeStorage } from '@extension/storage';
import { useState } from 'react';
import Webcam from 'react-webcam';
import ClipLoader from 'react-spinners/ClipLoader';

const videoConstraints = {
  width: 1280,
  height: 720,
  facingMode: 'user',
};

const sendData = async (imageSrc: string) => {
  // Simulate a network request with a delay
  return new Promise<void>(resolve => {
    setTimeout(() => {
      console.log('Data sent:', imageSrc);
      resolve();
    }, 2000);
  });
};

const Popup = () => {
  const theme = useStorage(exampleThemeStorage);
  const isLight = theme === 'light';
  const [loading, setLoading] = useState(false);
  const [color] = useState('#ffffff'); // Static color for spinner, can be dynamic later if needed

  // Handle webcam photo capture
  const handleCapturePhoto = async (getScreenshot: () => string | null) => {
    const imageSrc = await getScreenshot();
    if (imageSrc) {
      setLoading(true);
      await sendData(imageSrc);
      setLoading(false);
    }
  };

  return (
    <div className={`App ${isLight ? 'bg-slate-50' : 'bg-gray-800'}`}>
      <header className={`App-header ${isLight ? 'text-gray-900' : 'text-gray-100'}`}>
        <Webcam
          audio={false}
          height={720}
          screenshotFormat="image/jpeg"
          width={1280}
          videoConstraints={videoConstraints}>
          {({ getScreenshot }) =>
            loading ? (
              <ClipLoader
                color={color}
                loading={loading}
                cssOverride={{ display: 'block', margin: '0 auto' }}
                size={150}
                aria-label="Loading Spinner"
                data-testid="loader"
              />
            ) : (
              <button
                onClick={() => handleCapturePhoto(getScreenshot)}
                className="capture-button"
                aria-label="Capture photo">
                Capture photo
              </button>
            )
          }
        </Webcam>
      </header>
    </div>
  );
};

export default withErrorBoundary(withSuspense(Popup, <div>Loading...</div>), <div>Error occurred</div>);
