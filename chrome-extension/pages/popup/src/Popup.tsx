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
  try {
    // Simulate a network request with a delay
    console.log('imageSrc', imageSrc);
    const response = await fetch('http://localhost:8000/image-to-emoji', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        image: imageSrc, // Assuming `imageSrc` is a valid base64 image string or URL
      }),
    });

    // Check if the response is OK (status 200-299)
    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}`);
    }

    // Optionally, handle the response body if necessary
    const result = await response.json();
    console.log('Response from server:', result);
  } catch (error) {
    console.error('Error sending data:', error);
  }
};

const Popup = () => {
  const theme = useStorage(exampleThemeStorage);
  const isLight = theme === 'light';
  const [loading, setLoading] = useState(false);
  const [color] = useState('#ffffff'); // Static color for spinner, can be dynamic later if needed

  // Handle webcam photo capture
  const handleCapturePhoto = async (getScreenshot: () => string | null) => {
    const imageSrc = getScreenshot();
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
                aria-label="Loading Spinner"
                color={color}
                cssOverride={{ display: 'block', margin: '0 auto' }}
                data-testid="loader"
                loading={loading}
                size={150}
              />
            ) : (
              <button
                aria-label="Capture photo"
                className="capture-button"
                onClick={() => handleCapturePhoto(getScreenshot)}>
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
