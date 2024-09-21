import React from 'react';
import OpenAI from 'openai';
import { ChatCompletionContentPartImage, ChatCompletionMessageParam } from 'openai/resources';
import { Message, PostProcess } from '../assistantManagers/useAgent';

interface VoiceActivity {
    isVoice: boolean, 
    startTime: number, 
    endTime: number
}

export interface useImageProcessorProps {
    messages: Message[];
    isUserSpeaking: boolean;
    isScreenCapturing: boolean;
    getSnapshots: (timestamps: number[]) => string[];
    getNSnapshots: (startTime: number, endTime: number, numSnapshots: number) => string[];
    clearSnapshots: (timestamp: number) => void;
}

export const useImageProcessor = ({ messages, isUserSpeaking, isScreenCapturing, getSnapshots, getNSnapshots, clearSnapshots }: useImageProcessorProps) => {
    const voiceActivityQueue = React.useRef(new Array<VoiceActivity>());
    const voiceActivityQueueLock = React.useRef(false);

    const [silenceStartedTime, setSilenceStartedTime] = React.useState(Date.now());
    const [speakingStartedTime, setSpeakingStartedTime] = React.useState(Date.now());
    const [lastMessageProcessed, setLastMessageProcessed] = React.useState(0);

    React.useEffect(() => {
        if (isScreenCapturing) {
            if (isUserSpeaking) {
                voiceActivityQueue.current.push({
                    isVoice: false,
                    startTime: silenceStartedTime,
                    endTime: Date.now()
                })
                setSpeakingStartedTime(Date.now());

            } else {
                voiceActivityQueue.current.push({
                    isVoice: true,
                    startTime: speakingStartedTime,
                    endTime: Date.now()
                })
                setSilenceStartedTime(Date.now());
            }
        } else {
            if (voiceActivityQueue.current.length > 0 && voiceActivityQueue.current[voiceActivityQueue.current.length - 1].isVoice) {
                voiceActivityQueue.current.push({
                    isVoice: false,
                    startTime: Date.now(),
                    endTime: Date.now()
                })
            }
        }
    }, [isUserSpeaking])

    const openai = new OpenAI({ apiKey: process.env.REACT_APP_OPENAI_API_KEY, dangerouslyAllowBrowser: true });

    const parameterizeMessage = async (message: string): Promise<string | null> => {
        // Parameterize user-spoken text
        const systemInstructions1: ChatCompletionMessageParam = { role: 'system', content: `
            A user is currently pointing to some information on an interactive webpage. You are provided with the transcript of what they are saying as they reference the content of the webpage. 
            Take any occurance of a demonstrative pronoun or demonstrative adjective, such as "this", "that", "these", or "those", and wrap it with curly braces on either side.
            Take any occurance of a spatial demonstrative, such as "here" or "there", and wrap it with curly braces on either side.
            If there is anything else in the sentance that you believe refererences to some content of the webpage, wrap it in curly braces. Use your best judgement.
            You may not need to do anything to the transcript, in which case you should output the original transcript.

            Here is an example input:
            Navigate to this website, click on the dropdown here, and then you can run this query.

            Here is what you would output:
            Navigate to {this} website, click on the dropdown {here}, and then you can run {this} query.

            Here is a more complicated input where you would need to exercise judgement:
            You should run the following query to get the data.

            Here is what you would output:
            You should run {the following} query to get the data.

            Here is the transcript that you must modify:
            ${message}
            `
        };

        const response1 = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [systemInstructions1],
        });

        console.log("Parameterized:", response1.choices[0].message.content);
        return response1.choices[0].message.content;
    }
        
    const getImageTimestamps = (message: string, voiceStartTime: number, voiceEndTime: number): number[] => {
        if (!message.includes('{')) {
            return [];
        }

        // Estimate what timestamps the user was referring to an image
        const numCharacters = message.length;
        const timestamps = [];

        for (let i = 0; i < numCharacters; i++) {
            if (message[i] === '{') {
                timestamps.push(voiceStartTime + ((i / numCharacters) * (voiceEndTime - voiceStartTime)));
            }
        }
        console.log("timestamps:", timestamps);
        return timestamps;
    }

    const augmentMessage = async (message: string, images: string[]): Promise<string | null> => {

        // Ask for images to fill-in parameters
        let imageContent: ChatCompletionContentPartImage[] = [];
        for (const image of images) {
            if (!image) {
                continue;
            }
            imageContent.push({ type: "image_url", image_url: {url: image, "detail": "high"} });
        }

        const systemInstructions2: ChatCompletionMessageParam = { 
            role: 'user',
            content: [
                {
                    type: "text",
                    text: `
                    A user is currently pointing to some information on their computer screen. You have been given snapshots of the content on their screen. 
                    You have also been given a transcript of what they are saying as they reference the content of the webpage.

                    In the transcript, replace any words wrapped with curly braces with the specific content thats being displayed on the screen that those words reference.

                    Here is an example input:
                    Navigate to {this} website, click on the dropdown {here}, and then you can run {this} query.

                    Here is what you would output:
                    Navigate to https://youtube.com website, click on the dropdown under the "My Account Actions" heading, and then you can run "Activity | where userId = mine' query.

                    Here is the transcript that you must modify:
                    ${message}
                    `
                },
                ...imageContent
            ],
        };

        const response2 = await openai.chat.completions.create({
            model: 'gpt-4o',
            messages: [systemInstructions2]
        });

        // Augment the earlier message with the new one
        console.log("resolved text", response2.choices[0].message.content);
        return response2.choices[0].message.content;
    }

    const processImages = async (originalMessage: string): Promise<string> => {
        console.log(voiceActivityQueue.current);
        console.log(voiceActivityQueueLock.current);
        while (voiceActivityQueueLock.current) {
            console.log("waiting for lock");
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        voiceActivityQueueLock.current = true;

        while (voiceActivityQueue.current.length < 3) {
            console.log("waiting for queue");
            await new Promise(resolve => setTimeout(resolve, 100));
        }

        // Dequeue first two elements
        const voiceRecord1 = voiceActivityQueue.current.shift();

        if (voiceRecord1?.isVoice) {    // Occurs if user is already speaking when recording begins
            return originalMessage;
        }
            
        const voiceRecord2 = voiceActivityQueue.current.shift();    // Voice recording
        const voiceRecord3 = voiceActivityQueue.current[0];         // Silence after recording

        if (!voiceRecord1 || !voiceRecord2) {
            console.error("Tried to retrieve voice record but not in the queue");
            return "";
        }

        // release lock
        voiceActivityQueueLock.current = false;

        let newMessage = await parameterizeMessage(originalMessage);

        if (!newMessage) {
            console.error("Failed to parameterize message");
            return "";
        }

        if (!newMessage.includes('{')) {
            return originalMessage;
        }

        const images: string[] = [];
        images.push(...getNSnapshots(voiceRecord1.startTime, voiceRecord2.endTime, 2));
        images.push(...getSnapshots(getImageTimestamps(newMessage, voiceRecord2.startTime, voiceRecord2.endTime)));
        images.push(...getNSnapshots(voiceRecord3.startTime, voiceRecord3.endTime, 2));

        clearSnapshots(voiceRecord2.endTime);

        newMessage = await augmentMessage(newMessage, images);

        if (!newMessage) {
            console.error("Failed to update parameterized string with images")
            return ""
        }

        return newMessage;
    }

    React.useEffect(() => {
        for (var i = lastMessageProcessed; i < messages.length; i++) {
            const message = messages[i];
            if (message.postProcess !== PostProcess.Image) continue;
            message.postProcess = PostProcess.None;

            if (typeof(message.message.content) === "string" && message.message.content.length > 0) {
                console.log("augmenting message with images", message.message.content);
                processImages(message.message.content ?? "").then((value) => {
                    console.log("augmented message", value);
                    message.message.content = value;
                });
            }
        }
        setLastMessageProcessed(messages.length);
    }, [messages]);
}