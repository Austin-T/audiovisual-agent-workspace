import React, { FormEvent } from 'react';
import Button from '@mui/material/Button';
import Drawer from '@mui/material/Drawer';
import { ChatCompletionMessageParam } from 'openai/resources';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import CircularProgress from '@mui/material/CircularProgress';

export interface ChatWindowProps {
    open: boolean;
    messages: Array<ChatCompletionMessageParam>;
    isLoading: boolean;
    setTextFromChat: (message: string) => void;
    closeWindow: () => void;
}

export const ChatWindow = ({
    open,
    messages,
    isLoading,
    setTextFromChat,
    closeWindow
}: ChatWindowProps) => {
    const [input, setInput] = React.useState<string>('');
    
    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        if (input.trim()) {
            setTextFromChat(input);
            setInput('');
        }
    };

    return (
        <>
            <Drawer anchor={'right'} open={open} onClose={closeWindow}>
                <Box sx={{ mb: 2, height: 400, overflowY: 'auto', border: '1px solid #ccc', borderRadius: 2, p: 2 }}>
                    {messages.map((msg, index) => (
                        <Typography key={index} variant="body1" sx={{ mb: 1 }}>
                            <><strong>{msg.role}:</strong> {msg.content ?? ""}</>
                        </Typography>
                    ))}
                </Box>
                <form onSubmit={handleSubmit}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <TextField
                        fullWidth
                        variant="outlined"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        disabled={isLoading}
                        placeholder="Type your message..."
                    />
                    <Button type="submit" variant="contained" color="primary" disabled={isLoading || !input.trim()} sx={{ ml: 2 }}>
                        Send
                    </Button>
                    </Box>
                </form>
                {isLoading && <CircularProgress sx={{ mt: 2 }} />}
            </Drawer>
        </>
    )
}