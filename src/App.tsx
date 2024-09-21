import React from 'react';
import logo from './logo.svg';
import './App.css';
import { AvAgentWorkspace } from './components/AvAgentWorkspace';
import { presetFormComponents } from './constants/instructions/FormComponent';
import { presetSystemInstructions } from './constants/instructions/SystemInstruction';
import { LoadingScreen } from './components/LoadingScreen';

import { createTheme, ThemeProvider } from '@mui/material/styles';

const theme = createTheme({
  typography: {
    fontSize: 10, // Set the base font size for all typography
  },
  components: {
    MuiTextField: {
      styleOverrides: {
        root: {
          fontSize: 10, // Set the font size for TextField components
        },
      },
    },
    MuiSvgIcon: {
      styleOverrides: {
        root: {
          fontSize: 24, // Set the font size for Button components
        },
      },
    },
  },
});

function App() {
  const [ready, setReady] = React.useState(false);

    return (
      <ThemeProvider theme={theme}>
        <div className="App">
            {ready ? (
              <AvAgentWorkspace presetFormComponents={presetFormComponents} presetSystemInstructions={presetSystemInstructions}/>
            ) : (
              <LoadingScreen ready={() => setReady(true)}/>
            )}
        </div>
      </ThemeProvider>
    );
}

export default App;
