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
  const [image, setImage] = useState(null);

  const logo = isLight ? 'popup/logo_vertical.svg' : 'popup/logo_vertical_dark.svg';

  // Handle webcam photo capture
  const handleCapturePhoto = async (getScreenshot: () => string | null) => {
    const imageSrc = getScreenshot();
    if (imageSrc) {
      setImage(imageSrc);
      setLoading(true);
      const result = await sendData(imageSrc);
      setData(result);
      setImage(null);
      console.log('XIAN', result);
      setLoading(false);
    }
  };

  return (
    <div className={`App`}>
      <header className={`App-header ${isLight ? 'text-gray-900' : 'text-gray-100'}`}>
        <div className="flex flex-row justify-center " style={{ alignItems: 'center' }}>
          <img src={chrome.runtime.getURL(logo)} className="App-logo" alt="logo" />
          <p className="text-3xl font-bold mb-3">Omoji 📸</p>
        </div>
        {image ? (
          <div className="flex flex-col items-center">
            <img
              src={image}
              alt="captured"
              style={{
                height: '720',
                width: '1280',
              }}
            />
            <ClipLoader color={color} loading={loading} size={150} />
          </div>
        ) : (
          <Webcam
            audio={false}
            height={720}
            width={1280}
            screenshotFormat="image/jpeg"
            videoConstraints={videoConstraints}
            onUserMedia={() => console.log('User media')}
            onUserMediaError={() => console.log('User media error')}
            onScreenshot={handleCapturePhoto}>
            {({ getScreenshot }) => (
              <button
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                onClick={() => handleCapturePhoto(getScreenshot)}>
                Capture photo
              </button>
            )}
          </Webcam>
        )}
      </header>
    </div>
  );
};

export default withErrorBoundary(withSuspense(Popup, <div>Loading...</div>), <div>Error occurred</div>);
