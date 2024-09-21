import React, { FormEvent } from 'react';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import SendIcon from '@mui/icons-material/Send';
import { CSSTransition } from 'react-transition-group';
import './UserChatBar.css'

export interface UserChatBarProps {
    open: boolean;
    isLoading: boolean;
    setTextFromChat: (message: string) => void;
}

export const UserChatBar = ({
    open,
    isLoading,
    setTextFromChat,
}: UserChatBarProps) => {
    const [lastDeliveredMessage, setLastDeliveredMessage] = React.useState<string>('');
    const [input, setInput] = React.useState<string>('');
    
    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        if (input.trim()) {
            setTextFromChat(input);
            setLastDeliveredMessage(input);
            setInput('');
        }
    };

    return (
        <CSSTransition
            in={open}
            timeout={300}
            classNames="fade-bottom"
            unmountOnExit
        >
            <div style={{ width: '100%' }}>
                {lastDeliveredMessage && (
                    <Typography variant="body1" sx={{ mb: 1 }}>
                        <><strong>You:</strong> {lastDeliveredMessage}</>
                    </Typography>
                )}
                <form onSubmit={handleSubmit} >
                    <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                    <TextField
                        fullWidth
                        variant="outlined"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        disabled={isLoading}
                        placeholder="Send a message to the agent..."
                    />
                    <Button type="submit" variant="contained" color="primary" disabled={isLoading || !input.trim()} sx={{ ml: 2 }} >
                        <SendIcon />
                    </Button>
                    </Box>
                </form>
            </div>
        </CSSTransition>
    )
}