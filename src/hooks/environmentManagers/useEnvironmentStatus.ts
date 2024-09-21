import { useState, useEffect } from 'react';

export const useEnvironmentStatus = () => {
  const [hasMicPermission, setHasMicPermission] = useState<boolean>(false);

  const hasSpeechRecognitionSupport =  typeof (window.SpeechRecognition || (window as any).webkitSpeechRecognition) !== 'undefined';

  useEffect(() => {
    const checkMicrophonePermission = async () => {
      try {
        if (!hasMicPermission) {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          setHasMicPermission(true);
          stream.getTracks().forEach(track => track.stop());
        }
      } catch (error) {
        setHasMicPermission(false);
      }
    };

    checkMicrophonePermission();

    // repeated checks
    const intervalId = setInterval(() => {
        checkMicrophonePermission();
    }, 3000);

    return () => clearInterval(intervalId);
  }, []);

  return { hasMicPermission, hasSpeechRecognitionSupport };
};