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
  let result1, result2;
  try {
    console.log('imageSrc', imageSrc);
    const response1 = await fetch('http://localhost:8000/image-to-emoji', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        image: imageSrc, // Assuming `imageSrc` is a valid base64 image string or URL
      }),
    });

    // Check if the response is OK (status 200-299)
    if (!response1.ok) {
      throw new Error(`Request failed with status ${response1.status}`);
    }

    // Optionally, handle the response body if necessary
    result1 = await response1.json();
    console.log('Response1 from server:', result1);
  } catch (error1) {
    console.error('Error1 sending data:', error1);
  }

  try {
    const response2 = await fetch('http://localhost:8000/generate-emoji', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        image: imageSrc, // Assuming `imageSrc` is a valid base64 image string or URL
      }),
    });

    // Check if the response is OK (status 200-299)
    if (!response2.ok) {
      throw new Error(`Request failed with status ${response2.status}`);
    }
  } catch (error) {
    console.error('Error sending data:', error);
  }

  return [result1, result2];
};

const Popup = () => {
  const theme = useStorage(exampleThemeStorage);
  const isLight = theme === 'light';
  const [loading, setLoading] = useState(false);
  const [color] = useState('#ffffff'); // Static color for spinner, can be dynamic later if needed
  const [data, setData] = useState(null);

  // Handle webcam photo capture
  const handleCapturePhoto = async (getScreenshot: () => string | null) => {
    const imageSrc = getScreenshot();
    if (imageSrc) {
      setLoading(true);
      const result = await sendData(imageSrc);
      setData(result);
      console.log('XIAN', result);
      setLoading(false);
    }
  };

  return (
    <div className={`App`}>
      <header className={`App-header ${isLight ? 'text-gray-900' : 'text-gray-100'}`}>
        <Webcam
          audio={false}
          height={720}
          screenshotFormat="image/jpeg"
          width={1280}
          style={{ borderRadius: 5 }}
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
              <>
                {data && (
                  <div className="flex flex-row align-center justify-center">
                    <div className="mt-4 bento-container">
                      <div className="emoji-container">
                        <span className="emoji">{data.emoji}</span>
                      </div>
                    </div>
                    <div className="mt-4 bento-container">
                      <div className="emoji-container">
                        <span className="emoji">{data.emoji}</span>
                      </div>
                    </div>
                  </div>
                )}
                <button
                  aria-label="Capture photo"
                  className="capture-button w-full"
                  onClick={() => handleCapturePhoto(getScreenshot)}>
                  Capture photo
                </button>
              </>
            )
          }
        </Webcam>
      </header>
    </div>
  );
};

export default withErrorBoundary(withSuspense(Popup, <div>Loading...</div>), <div>Error occurred</div>);
