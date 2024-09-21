import React from "react";

export interface Snapshot {
    timestamp: number;
    diffToNext: number;
    imageData: string;
}

export const useScreenCapture = () => {
    const [captureStream, setCaptureStream] = React.useState<MediaStream | null>(null);
    const [isCapturing, setIsCapturing] = React.useState(false);
    const videoRef = React.useRef<HTMLVideoElement | null>(null);
    const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
    const snapshotsRef = React.useRef<Snapshot[]>([]);
    const isCapturingRef = React.useRef<boolean>(false);
    const previousImgDataRef = React.useRef<Uint8ClampedArray | null>(null);

    const getPixelDifferenceCount = (imgData1: Uint8ClampedArray, imgData2: Uint8ClampedArray) => {
        if (imgData1.length !== imgData2.length) {
            return Number.MAX_VALUE;
        }

        let diffCount = 0;

        for (let i = 0; i < imgData1.length; i += 256) { // use +4 to check every pixel
            const r1 = imgData1[i];
            const g1 = imgData1[i + 1];
            const b1 = imgData1[i + 2];
            const a1 = imgData1[i + 3];

            const r2 = imgData2[i];
            const g2 = imgData2[i + 1];
            const b2 = imgData2[i + 2];
            const a2 = imgData2[i + 3];

            if (r1 !== r2 || g1 !== g2 || b1 !== b2 || a1 !== a2) {
                diffCount++;
            }
        }

        return diffCount;
    }

    const startCapture = async () => {
        const stream = await navigator.mediaDevices.getDisplayMedia({
            video: true,
            audio: false,
        });
        setCaptureStream(stream);
        setIsCapturing(true);
        isCapturingRef.current = true;
        
        if (videoRef.current) {
            videoRef.current.srcObject = stream;
            console.log(stream);
        }
    }

    const stopCapture = () => {
        if (captureStream) {
            captureStream.getTracks().forEach(track => track.stop());
            setCaptureStream(null);
            setIsCapturing(false);
            isCapturingRef.current = false;
            if (videoRef.current) {
                videoRef.current.srcObject = null;
            }
        }
    }

    const takeSnapshot = async () => {
        if (videoRef.current && canvasRef.current) {
            const canvas = canvasRef.current;
            const video = videoRef.current;

            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const context = canvas.getContext('2d', { willReadFrequently: true });
            if (context) {
                context.drawImage(video, 0, 0, canvas.width, canvas.height);

                
                const currentImgData = context.getImageData(0, 0, canvas.width, canvas.height).data;

                let diffFromPrevious = 0;
                if (previousImgDataRef.current) {
                    diffFromPrevious = getPixelDifferenceCount(currentImgData, previousImgDataRef.current);
                    snapshotsRef.current[snapshotsRef.current.length - 1].diffToNext = diffFromPrevious;
                }
                previousImgDataRef.current = currentImgData;
                
                snapshotsRef.current.push({
                    timestamp: Date.now(),
                    diffToNext: Number.MAX_VALUE,
                    imageData: canvas.toDataURL('image/png')
                });
            }
        }
    }

    React.useEffect(() => {
        const intervalId = setInterval(() => {
            if (isCapturingRef.current) {
                takeSnapshot();
            }
        }, 1000);

        return () => clearInterval(intervalId);
    }, []);

    const getSnapshots = (timestamps: number[]): string[] => {
        const snapshots: string[] = [];

        let pointer = 0;
        while (timestamps.length > 0) {
            while (pointer < snapshotsRef.current.length && snapshotsRef.current[pointer].timestamp < timestamps[0]) {
                pointer++;
            }
            snapshots.push(snapshotsRef.current[pointer].imageData);
            timestamps.shift();
        }
        
        return snapshots;
    }

    const getNSnapshots = (startTime: number, endTime: number, numSnapshots: number): string[] => {
        const snapshots = new Array<Snapshot>();

        let pointer = 0;
        while (pointer < snapshotsRef.current.length && snapshotsRef.current[pointer].timestamp < startTime) {
            pointer++;
        }

        while (pointer < snapshotsRef.current.length && snapshotsRef.current[pointer].timestamp < endTime) {
            const snapshot = snapshotsRef.current[pointer];
            if (snapshots.length < numSnapshots) {
                snapshots.push(snapshot);
            } else {
                const index = snapshots.findIndex(snapshot => snapshot.diffToNext < snapshots[0].diffToNext);
                if (index == 0) {
                    continue;
                } else if (index == -1) {
                    snapshots.shift();
                    snapshots.push(snapshot);
                } else {
                    snapshots.splice(index, 0, snapshot);
                    snapshots.shift();
                }
            }

            pointer++;
        }

        return snapshots.map(snapshot => snapshot.imageData);
    }

    const clearSnapshots = (timestamp: number) => {
        while (snapshotsRef.current.length > 0 && snapshotsRef.current[0].timestamp < timestamp) {
            snapshotsRef.current.shift();
        }
    }

    return { videoRef, isCapturing, canvasRef, snapshots: snapshotsRef, startCapture, stopCapture, getSnapshots, getNSnapshots, clearSnapshots };
}
