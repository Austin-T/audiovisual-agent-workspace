import { Box, Button, Checkbox, FormControlLabel, Typography } from '@mui/material';
import React from 'react';
import { useEnvironmentStatus } from '../hooks/environmentManagers/useEnvironmentStatus';
import { Cancel, CheckCircle } from '@mui/icons-material';

interface LoadingScreenProps {
  ready: () => void;
}

export const LoadingScreen = ({ ready }: LoadingScreenProps) => {
    const {
        hasMicPermission,
        hasSpeechRecognitionSupport
    } = useEnvironmentStatus();

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100vw', height: '100vh' }}>
            <FormControlLabel
                control={
                <Checkbox
                    icon={<Cancel sx={{ color: 'red' }} />}
                    checkedIcon={<CheckCircle sx={{ color: 'green' }} />}
                    checked={hasMicPermission === true}
                    disabled
                />
                }
                label={<Typography variant="h6">Microphone has permission</Typography>}
            />
            <FormControlLabel
                control={
                <Checkbox
                    icon={<Cancel sx={{ color: 'red' }} />}
                    checkedIcon={<CheckCircle sx={{ color: 'green' }} />}
                    checked={hasSpeechRecognitionSupport}
                    disabled
                />
                }
                label={<Typography variant="h6">Browser has speech recognition support</Typography>}
            />
            <Typography variant="h6" sx={{ mb: 2 }}>Please turn your volume up!</Typography>
            <Button variant="contained" onClick={ready} disabled={!hasMicPermission || !hasSpeechRecognitionSupport}>
                I'm Ready
            </Button>
        </Box>
    );
};
