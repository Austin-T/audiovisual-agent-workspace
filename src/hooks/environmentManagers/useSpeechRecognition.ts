import React from 'react'

export const useSpeechRecognition = () => {
    const [textFromVoice, setTextFromVoice] = React.useState("");
    const [isListening, setIsListening] = React.useState(false);
    const [userSpeaking, setUserSpeaking] = React.useState(false);
    const [userBeginSpeakingTime, setUserBeginSpeakingTime] = React.useState(0);
    const [userEndSpeakingTime, setUserEndSpeakingTime] = React.useState(0);
    const recognitionRef = React.useRef<SpeechRecognition | null>(null);

    React.useEffect(() => {
        const recognition = new (window.SpeechRecognition || (window as any).webkitSpeechRecognition)();
        recognition.continuous = true;
        recognition.lang = "en-US";
        recognitionRef.current = recognition;

        recognition.onspeechstart = () => {
            setUserSpeaking(true);
            setUserBeginSpeakingTime(Date.now());
        }

        recognition.onspeechend = () => {
            setUserSpeaking(false);
            setUserEndSpeakingTime(Date.now());
        }

        recognition.onresult = (event: SpeechRecognitionEvent) => {
            setTextFromVoice(event.results[0][0].transcript);
        }
    }, []);

    const startListening = () => {
        setTextFromVoice("");
        setIsListening(true);
        recognitionRef.current?.start();
    }

    const stopListening = () => {
        setIsListening(false);
        recognitionRef.current?.stop();
    }

    return { textFromVoice, userSpeaking, userBeginSpeakingTime, userEndSpeakingTime, isListening, startListening, stopListening, hasRecognitionSupport: !!recognitionRef.current }
}