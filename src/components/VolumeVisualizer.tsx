import React from 'react';
import { useVolumeDetection } from '../hooks/environmentManagers/useVolumeDetection';

interface VolumeVisualizerProps {
    audioElement: HTMLAudioElement | null;
    listen: boolean;
    isSpeaking: boolean;
}

export const VolumeVisualizer = ({ audioElement, listen, isSpeaking }: VolumeVisualizerProps) => {
    const {
        inputVolume,
        outputVolume
    } = useVolumeDetection({ audioElement, listen });

    return (
        <>
            <div
                style={{
                  position: 'fixed',
                  bottom: 0,
                  left: '50%',
                  transform: 'translate(-50%, 150%)',
                  width: `80vw`,
                  height: '5vh',
                  borderRadius: '50%',
                  boxShadow: `rgba(120, 145, 250, ${isSpeaking ? inputVolume/100 : 0}) 0px -50px 60px 30px`,
                  pointerEvents: 'none'
                }}
            />
            <div
                style={{
                  position: 'fixed',
                  top: 0,
                  left: '50%',
                  transform: 'translate(-50%, -150%)',
                  width: `90vw`,
                  height: '5vh',
                  borderRadius: '50%',
                  boxShadow: `rgba(255, 140, 190, ${outputVolume/100}) 0px 50px 60px 30px`,
                  pointerEvents: 'none'
                }}
            />
        </>
    );
};
