import React from 'react';

interface useVolumeDetectionProps {
  audioElement: HTMLAudioElement | null;
  listen: boolean;
}

export const useVolumeDetection = ({ audioElement, listen }: useVolumeDetectionProps) => {
  const [inputVolume, setInputVolume] = React.useState(0);
  const [outputVolume, setOutputVolume] = React.useState(0);
  const audioContextRef = React.useRef<AudioContext | null>(null);
  const inputAnalyserRef = React.useRef<AnalyserNode | null>(null);
  const outputAnalyserRef = React.useRef<AnalyserNode | null>(null);
  const inputDataArrayRef = React.useRef<Uint8Array | null>(null);
  const outputDataArrayRef = React.useRef<Uint8Array | null>(null);
  const mediaStreamRef = React.useRef<MediaStream | null>(null);

  React.useEffect(() => {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    audioContextRef.current = audioContext;

    const inputAnalyser = audioContext.createAnalyser();
    inputAnalyser.fftSize = 256;
    inputAnalyserRef.current = inputAnalyser;

    const outputAnalyser = audioContext.createAnalyser();
    outputAnalyser.fftSize = 256;
    outputAnalyserRef.current = outputAnalyser;

    const inputDataArray = new Uint8Array(inputAnalyser.frequencyBinCount);
    inputDataArrayRef.current = inputDataArray;

    const outputDataArray = new Uint8Array(outputAnalyser.frequencyBinCount);
    outputDataArrayRef.current = outputDataArray;

    return () => {
      audioContext.close();
    };
  }, []);

  const visualizeInput = () => {
    if (inputAnalyserRef.current && inputDataArrayRef.current) {
      inputAnalyserRef.current.getByteFrequencyData(inputDataArrayRef.current);
      const volume = inputDataArrayRef.current.reduce((a, b) => a + b) / inputDataArrayRef.current.length;
      setInputVolume(volume);
      requestAnimationFrame(visualizeInput);
    }
  };

  const visualizeOutput = () => {
    if (outputAnalyserRef.current && outputDataArrayRef.current) {
      outputAnalyserRef.current.getByteFrequencyData(outputDataArrayRef.current);
      const volume = outputDataArrayRef.current.reduce((a, b) => a + b) / outputDataArrayRef.current.length;
      setOutputVolume(volume);
      requestAnimationFrame(visualizeOutput);
    }
  };

  React.useEffect(() => {
    if (listen) {
      try {
        const getUserMedia = navigator.mediaDevices.getUserMedia({ audio: true });
        getUserMedia.then((stream) => {
          if (!audioContextRef.current || !inputAnalyserRef.current) return;

          mediaStreamRef.current = stream;

          const inputSource = audioContextRef.current.createMediaStreamSource(stream);
          inputSource.connect(inputAnalyserRef.current);
          visualizeInput();
        });
      } catch (error) {
        console.log("Unable to access microphone");
      }
    } else {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
        mediaStreamRef.current = null;
      }
    }

  }, [listen]);

  React.useEffect(() => {
    if (audioElement) {
      if (!audioContextRef.current || !outputAnalyserRef.current) return;

      const outputSource = audioContextRef.current.createMediaElementSource(audioElement);
      outputSource.connect(outputAnalyserRef.current);
      outputSource.connect(audioContextRef.current.destination);
      visualizeOutput();
    }
  }, [audioElement]);

  return { inputVolume, outputVolume };
};
