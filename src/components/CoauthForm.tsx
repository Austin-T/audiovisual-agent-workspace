import React from 'react';
import { TextField, Box, Paper } from '@mui/material';
import { CSSTransition } from 'react-transition-group';

import './CoauthForm.css';

interface CoauthFormProps {
    keys: string[];
    headers: string[];
    values: string[];
    isChatOpen: boolean;
    onValueChange: (key: string, value: string) => void;
}

export const CoauthForm = ({ keys, headers, values, isChatOpen, onValueChange }: CoauthFormProps) => {
  //const [values, setValues] = useState<string[]>(Array(headers.length).fill(''));

  const handleChange = (key: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
    // const newValues = [...values];
    // newValues[index] = event.target.value;
    // setValues(newValues);
    onValueChange(key, event.target.value);
  };

  return (
    <CSSTransition
      in={isChatOpen}
      appear={true}
      timeout={300}
      classNames="resize"
    >
      <Paper sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', width: '100%', height: '100%', p: 2, overflowY: 'scroll' }}>
        {keys.map((key, index) => (
          <Box key={key} mb={2} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', width: '100%' }}>
            <TextField
              variant="standard"
              label={headers[index]}
              multiline
              fullWidth
              value={values[index]}
              onChange={handleChange(key)}
            />
          </Box>
        ))}
      </Paper>
    </CSSTransition>
  );
};