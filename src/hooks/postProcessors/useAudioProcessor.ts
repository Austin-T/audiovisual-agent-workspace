import React from 'react';
import OpenAI from 'openai';
import { APIPromise } from 'openai/core';
import { Message, PostProcess } from '../assistantManagers/useAgent';

export interface useAudioProcessorProps {
    messages: Message[];
}

export const useAudioProcessor = ({ messages }: useAudioProcessorProps) => {
    const [lastMessageSpoken, setLastMessageSpoken] = React.useState(0);
    const [isSpeaking, setIsSpeaking] = React.useState<boolean>(false);
    const [audioElement, setAudioElement] = React.useState<HTMLAudioElement | null>(null);
    const audioBlobQueue = React.useRef(new Array<Blob>());
    const audioBlobQueueLocked = React.useRef(false);

    const openai = new OpenAI({ apiKey: process.env.REACT_APP_OPENAI_API_KEY, dangerouslyAllowBrowser: true });

    const playAudio = async () => {
        setIsSpeaking(true);

        while (audioBlobQueue.current.length > 0) {
            const blob = audioBlobQueue.current.shift();
            if (blob) {
                const url = URL.createObjectURL(blob);
                const audio = new Audio(url);
                setAudioElement(audio);
                audio.play();

                await new Promise(resolve => {
                    audio.onended = () => {
                        URL.revokeObjectURL(url);
                        resolve(null);
                    };
                });
            }
        }

        setIsSpeaking(false);
        setAudioElement(null);
    };

    React.useEffect(() => {
        const interval = setInterval(() => {
            if (audioBlobQueue.current.length > 0 && !audioBlobQueueLocked.current) {
                audioBlobQueueLocked.current = true;
                playAudio().then(() => {
                    audioBlobQueueLocked.current = false;
                });
            }
        }, 100);

        return () => clearInterval(interval);
    }, []);

    const speakText = async (message: string) => {

        try {
            // split message into sentences on '.', '?', '!', and \n
            const sentences = message.split(/[\.\?\!\n]+/);

            const responsePromises = new Array<APIPromise<Response>>();
            for (const sentence of sentences) {
                if (sentence.trim().length === 0) continue;

                const response = openai.audio.speech.create({
                    model: "tts-1",
                    voice: "alloy",
                    input: sentence,
                    response_format: "mp3"
                });

                responsePromises.push(response);
            }

            // wait for all responses
            const responses = await Promise.all(responsePromises);

            // play each response
            for (const response of responses) {
                const arrayBuffer = await response.arrayBuffer();
                const blob = new Blob([arrayBuffer], { type: "audio/mp3" });
                audioBlobQueue.current.push(blob);
            }

        } catch (error) {
            console.error('Error speaking message:', error);
        }
    };

    const playSound = async (file: string) => {

        try {
            fetch(file)
                .then(response => response.blob())
                .then(blob => {
                    audioBlobQueue.current.push(blob);
                })

        } catch (error) {
            console.error('Error speaking message:', error);
        }
    };

    // AI voice
    React.useEffect(() => {
        for (var i = lastMessageSpoken; i < messages.length; i++) {
            const message = messages[i];
            if (message.postProcess === PostProcess.Speak) {
                message.postProcess = PostProcess.None;
                if (typeof(message.message.content) === "string") {
                    console.log("speaking message", message.message.content);
                    speakText(message.message.content);
                }
            } else if (message.postProcess === PostProcess.SpeakPreloaded) {
                message.postProcess = PostProcess.None;
                if (typeof(message.message.content) === "string") {
                    console.log("speaking message preloaded", message.message.content);
                    playSound(`${process.env.PUBLIC_URL}/${message.message.content}.wav`)
                }
            }
        }
        setLastMessageSpoken(messages.length);
    }, [messages]);
    
    return { isSpeaking, audioElement, speakText, playSound };
}