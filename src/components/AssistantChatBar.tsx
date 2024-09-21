import React from 'react';
import { ChatCompletionMessageParam } from 'openai/resources';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import { CSSTransition } from 'react-transition-group';
import './AssistantChatBar.css'
import { Message } from '../hooks/assistantManagers/useAgent';

export interface AssistantChatBarProps {
    open: boolean;
    messages: Array<Message>;
    isLoading: boolean;
}

export const AssitantChatBar = ({
    open,
    messages,
    isLoading,
}: AssistantChatBarProps) => {
    const [currentMessageIndex, setCurrentMessageIndex] = React.useState(0);

    React.useEffect(() => {
        if (messages.length > 0) {
            const interval = setInterval(() => {
                setCurrentMessageIndex((prevIndex) => {
                    if (prevIndex < messages.length - 1) {
                        return prevIndex + 1;
                    } else {
                        clearInterval(interval);
                        return prevIndex;
                    }
                });
            }, 5000); // 5 seconds
        }
    }, [messages]);

    return (
        <CSSTransition
            in={open}
            timeout={300}
            classNames="fade-top"
            unmountOnExit
        >
            <div>
            {messages.length > 0 && (
                messages.map((msg, index) => (
                    index >= currentMessageIndex && (
                        <CSSTransition
                            key={index}
                            in={open}
                            timeout={300}
                            classNames="fade-top"
                            unmountOnExit
                        >
                        <Typography key={index} variant="body1" sx={{ mb: 1 }}>
                            <><strong>agent:</strong> {msg.message.content ?? ""}</>
                        </Typography>
                        </CSSTransition>
                    )
                ))
            )}
            {isLoading && <CircularProgress sx={{ mt: 2 }} />}
            </div>
        </CSSTransition>
    )
}