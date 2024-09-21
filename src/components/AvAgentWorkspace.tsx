import React from 'react';
import { useSpeechRecognition } from '../hooks/environmentManagers/useSpeechRecognition';
import { useScreenCapture } from '../hooks/environmentManagers/useScreenCapture';
import { useAgent } from '../hooks/assistantManagers/useAgent';
import { ChatWindow } from './ChatWindow';
import { CoauthForm } from './CoauthForm';
import { useAudioProcessor } from '../hooks/postProcessors/useAudioProcessor';
import { VolumeVisualizer } from './VolumeVisualizer';
import { UserChatBar } from './UserChatBar';
import { AssitantChatBar } from './AssistantChatBar';
import { FormComponent } from '../constants/instructions/FormComponent';
import { DocumentManager } from './DocumentManager';

import { Box, CardMedia, IconButton } from '@mui/material';
import MicIcon from '@mui/icons-material/Mic';
import MicNoneIcon from '@mui/icons-material/MicNone';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import VolumeMuteIcon from '@mui/icons-material/VolumeMute';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import MessageIcon from '@mui/icons-material/Message';
import AutorenewIcon from '@mui/icons-material/Autorenew';
import RadioButtonCheckedIcon from '@mui/icons-material/RadioButtonChecked';
import Tooltip from '@mui/material/Tooltip';
import { SaveAlt } from '@mui/icons-material';

import { SystemInstruction } from '../constants/instructions/SystemInstruction';
import { useFileExporter } from '../hooks/environmentManagers/useFileExporter';
import { useImageProcessor } from '../hooks/postProcessors/useImageProcessor';
import { useToolProcessor } from '../hooks/postProcessors/useToolProcessor';

export interface AvAgentWorkspaceProps {
    presetFormComponents: FormComponent[];
    presetSystemInstructions: SystemInstruction[];
}

export const AvAgentWorkspace = ({ presetFormComponents, presetSystemInstructions }: AvAgentWorkspaceProps) => {
    // setup
    const [formComponents, setFormComponents] = React.useState<FormComponent[]>(presetFormComponents);
    const [systemInstructions, setSystemInstructions] = React.useState<SystemInstruction[]>(presetSystemInstructions);

    const [textFromChat, setTextFromChat] = React.useState("");
    const [isMicMuted, setIsMicMuted] = React.useState(false);
    const [isSpeakerMuted, setIsSpeakerMuted] = React.useState(false);
    const [isChatOpen, setIsChatOpen] = React.useState(false);
    
    const [readyForUserReply, setReadyForUserReply] = React.useState(false);

    // Environment Managers
    const {
        textFromVoice,
        userSpeaking,
        userBeginSpeakingTime,
        userEndSpeakingTime,
        startListening,
        stopListening,
        isListening,
        hasRecognitionSupport
    } = useSpeechRecognition();

    const {
        videoRef,
        isCapturing,
        canvasRef,
        startCapture,
        stopCapture,
        getSnapshots,
        getNSnapshots,
        clearSnapshots
    } = useScreenCapture();

    const {
        downloadMarkdown,
        saveToCache,
        loadFromCache,
        getAllCacheKeys,
        clearCacheEntry
    } = useFileExporter();

    // Assistant Managers
    const {
        messages,
        isLoading,
        updateTools,
        sendUserMessage,
        sendUserMessageWithImages,
        sendUserMessageNoReply,
        sendSystemMessage,
        sendSystemMessageNoReply,
        sendToolMessage,
        sendToolMessageNoReply,
        setAssistantMessage,
        setAssistantMessageSpeakPreloaded
    } = useAgent();

    // Post Processors
    useImageProcessor({ 
        messages,
        isUserSpeaking: userSpeaking,
        isScreenCapturing: isCapturing,
        getSnapshots,
        getNSnapshots,
        clearSnapshots
    });

    useToolProcessor({ 
        messages,
        formComponents,
        systemInstructions,
        sendToolMessage,
        sendToolMessageNoReply,
        setFormComponent: (key: string, value: string) => {
            setFormComponents(prevFormComponents => 
                prevFormComponents.map(field => 
                    field.key === key ? { ...field, value: value } : field
                )
            );
        },
        setSystemInstruction: (key: string, completed: boolean) => {
            setSystemInstructions(prevSystemInstructions => 
                prevSystemInstructions.map(instruction => 
                    instruction.key === key ? { ...instruction, completed } : instruction
                )
            );
        }
    });

    const {
        isSpeaking,
        audioElement,
    } = useAudioProcessor({ 
        messages
    });

    // action generation
    // message from system
    React.useEffect(() => {
        console.log("in useEffect");
        const instruction = systemInstructions.find(i => !i.completed);
        if (!instruction) return;

        if (instruction.replyToInstruction) {
            sendSystemMessage(instruction.instruction);
            updateTools(instruction.tools ?? []);
            setReadyForUserReply(true);
        } else {
            sendSystemMessageNoReply(instruction.instruction);
            updateTools(instruction.tools ?? []);
            setSystemInstructions(prev => prev.map(i => i.key === instruction.key ? { ...i, completed: true } : i));
        }
    }, [systemInstructions]);

    // user voice
    React.useEffect(() => {
        if (!textFromVoice) return;

        console.log("responding to user voice input", textFromVoice);
        // check if screen capture is active
        if (isCapturing) {
            // send screen capture and text to agent
            sendUserMessageNoReply(textFromVoice);
        } else {
            // send text to agent
            sendUserMessage(textFromVoice);
        }
    }, [textFromVoice]);

    // user chat
    React.useEffect(() => {
        if (!textFromChat) return;

        console.log("responding to user chat input", textFromChat);

        if (isCapturing) {
            // send screen capture and text to agent
            // TODO: sendUserMessageWithImages(textFromChat, getTools(), getSnapshots);
            sendUserMessage(textFromChat);
        } else {
            // send text to agent
            sendUserMessage(textFromChat);
        }
    }, [textFromChat]);

    // user form input
    const handleValueChange = (key: string, value: string) => {
        setFormComponents(prevFormComponents =>
            prevFormComponents.map(field => 
                field.key === key ? { ...field, value } : field
            )
        );
        //sendSystemMessageNoReply(`User changed the content of field ${key} to ${value}`, getTools());
    };
    // React.useEffect(() => {
    //     if (formComponents.every(field => field.value === "")) return;

    //     // Clear the previous timer if bar changes
    //     if (timerRef.current) {
    //         clearTimeout(timerRef.current);
    //     }
    
    //     // Set a new timer to run foo() after 5 seconds
    //     timerRef.current = setTimeout(() => {
    //         console.log("responding to user form input")
    //         sendSystemMessage("User changed the content of fields", getTools());
    //     }, 5000);
    
    //     // Cleanup function to clear the timer if the component unmounts
    //     return () => {
    //         if (timerRef.current) {
    //             clearTimeout(timerRef.current);
    //         }
    //     };
    // }, [formComponents]);

    // user screen recording
    React.useEffect(() => {
        if (!readyForUserReply) return;

        if (isCapturing) {
            setAssistantMessage("I see you started screen capture. Please narrate the actions you are taking and use your cursor to point to elements on the screen. I'll be taking notes as you speak. When you are finished, ending the screen capture will signal that you'd like to continue with our conversation.");
        } else {
            setAssistantMessage("Thanks for showing me what you see");
        }
    }, [isCapturing]);

    // Disabling input
    React.useEffect(() => {
        if (!readyForUserReply) return;

        if (isSpeaking) {
            stopListening();
        } else {
            if (!isMicMuted) {
                startListening();
            }
        }
    }, [isSpeaking]);

    const resetSession = (formComponents: FormComponent[]) => {
        setFormComponents(prevFormComponents => prevFormComponents.map((field, index) => formComponents[index]));
        setSystemInstructions(prevSystemInstructions => prevSystemInstructions.map((inst, index) => presetSystemInstructions[index]));
    }

    return (
        <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'top', justifyContent: 'space-between', width: '100vw', height: '100vh', padding: 4, boxSizing: 'border-box', gap: 2, backgroundColor: "rgba(244, 244, 244, 0.8)"  }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '20%', height: '100%', gap: 4 }}>
                <CardMedia
                    component="img"
                    sx={{ maxWidth: "200px", objectFit: "contain" }}
                    image={`${process.env.PUBLIC_URL}/AVAgentLogo.png`}
                />
            </Box>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between', width: "50%", height: '100%', gap: 2}}>
                {/* <ChatWindow
                    open={isChatOpen}
                    messages={messages}
                    isLoading={isLoading}
                    setTextFromChat={setTextFromChat}
                    closeWindow={() => setIsChatOpen(false)}
                /> */}
                <AssitantChatBar
                    open={isChatOpen}
                    messages={messages.filter(message => message.message.role == "assistant")}
                    isLoading={isLoading}
                />
                <CoauthForm
                    keys={formComponents.map(field => field.key)} 
                    headers={formComponents.map(field => field.description)} 
                    values={formComponents.map(field => field.value)} 
                    isChatOpen={isChatOpen}
                    onValueChange={handleValueChange}
                />
                <UserChatBar 
                    open={isChatOpen}
                    isLoading={isLoading}
                    setTextFromChat={setTextFromChat}
                />
                <Box
                    sx={{
                        display: 'flex',
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                >
                    <Tooltip title={
                        !hasRecognitionSupport ? 
                            "Speech recognition is not supported on your browser" :
                            isSpeaking ? "Speech recognition is disabled while assistant is talking" :
                                isMicMuted ? "Unmute Mic" : "Mute Mic"
                    }>
                        <span>
                            <IconButton 
                                disabled={!hasRecognitionSupport || isSpeaking} 
                                color={isMicMuted ? "default" : "primary"} 
                                onClick={() => {
                                    if (isMicMuted) {
                                        setIsMicMuted(false);
                                        startListening();
                                    } else {
                                        setIsMicMuted(true);
                                        stopListening();
                                    }
                                }}
                            >
                                {isMicMuted ? <MicNoneIcon /> : <MicIcon />}
                            </IconButton>
                        </span>
                    </Tooltip>
                    <Tooltip title={isSpeakerMuted ? "Unmute Assistant" : "Mute Assistant"}>
                        <IconButton color={isSpeakerMuted ? "default" : "primary"} onClick={isSpeakerMuted ? () => setIsSpeakerMuted(false) : () => setIsSpeakerMuted(true)}>
                            {isSpeakerMuted ? <VolumeMuteIcon /> : <VolumeUpIcon />}
                        </IconButton>
                    </Tooltip>
                    <Tooltip title={isCapturing ? "Stop Screen Capture" : "Start Screen Capture"}>
                        <IconButton color={isCapturing ? "primary" : "default"} onClick={isCapturing ? stopCapture : startCapture}>
                            {isCapturing ? <FiberManualRecordIcon /> : <RadioButtonCheckedIcon />}
                        </IconButton>
                    </Tooltip>
                    <Tooltip title={isChatOpen ? "Close Chat" : "Open Chat"}>
                        <IconButton color={isChatOpen ? "primary" : "default"} onClick={isChatOpen ? () => setIsChatOpen(false) : () => setIsChatOpen(true)}>
                            <MessageIcon />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Save file">
                        <IconButton onClick={() => downloadMarkdown(formComponents)}>
                            <SaveAlt />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Restart session">
                        <IconButton onClick={() => resetSession(presetFormComponents)}>
                            <AutorenewIcon />
                        </IconButton>
                    </Tooltip>
                </Box>
                <VolumeVisualizer audioElement={audioElement} listen={isListening} isSpeaking={userSpeaking} />
                <video
                    autoPlay
                    playsInline
                    muted
                    ref={videoRef}
                    style={{ position: 'absolute', top: 0, left: 0, width: '200px', pointerEvents: 'none' }}
                />
                <canvas ref={canvasRef} style={{ display: 'none' }}/>
            </Box>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '20%', height: '100%', gap: 4 }}>
                <DocumentManager
                    formComponents={formComponents}
                    getAllCacheKeys={getAllCacheKeys} 
                    saveToCache={saveToCache} 
                    loadFromCache={loadFromCache} 
                    clearCacheEntry={clearCacheEntry}
                    updateParent={(formComponents) => resetSession(formComponents)}
                />
            </Box>
        </Box>
    )
}