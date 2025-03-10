import React, { useState, useEffect } from 'react';
import Button from "@mui/material/Button";
import CancelIcon from "@mui/icons-material/Cancel";
import VolumeMuteIcon from '@mui/icons-material/VolumeMute';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';

const TextToSpeech = ({ response }) => {
  const [speaking, setSpeaking] = useState(false);
  const [voices, setVoices] = useState([]);
  const [utterance, setUtterance] = useState(null);

  useEffect(() => {
    const loadVoices = () => {
      let voiceList = window.speechSynthesis.getVoices();
      setVoices(voiceList);
    };

    loadVoices();

    if ('speechSynthesis' in window) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }

    return () => {
      if (window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
      }
      if ('speechSynthesis' in window) {
        window.speechSynthesis.onvoiceschanged = null;
      }
    };
  }, []);

  useEffect(() => {
    if (response && !speaking) {
      const newUtterance = new SpeechSynthesisUtterance(response);
      newUtterance.rate = 1;
      newUtterance.pitch = 1;
      newUtterance.onend = () => {
        setSpeaking(false);
      };
      newUtterance.onerror = (event) => {
        console.error('Speech Synthesis Error', event);
        setSpeaking(false);
      };
      setUtterance(newUtterance);
    }
  }, [response, speaking]);

  const handleSpeak = () => {
    if (response && !speaking) {
      setSpeaking(true);
      const chunks = response.split('\n\n');

      const speakChunks = (index) => {
        if (index < chunks.length) {
          let chunk = chunks[index].replace(/[*`\-_#]+/g, '');
          chunk = chunk.trim();

          if (chunk) {
            const utterance = new SpeechSynthesisUtterance(chunk);
            utterance.rate = 1;
            utterance.pitch = 1;

            utterance.onend = () => {
              speakChunks(index + 1);
            };

            utterance.onerror = (event) => {
              console.error('Speech Synthesis Error', event);
              setSpeaking(false);
            };

            try {
              window.speechSynthesis.speak(utterance);
            } catch (e) {
              console.error('error in window.speechSynthesis.speak()', e);
              setSpeaking(false);
            }
          } else {
            speakChunks(index + 1);
          }
        } else {
          setSpeaking(false);
        }
      };

      speakChunks(0);
    }
  };

  const handleCancel = () => {
    if (speaking) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
    }
  };

  return (
    response && (
      <div className='pwpew'>
        <Button
          sx={{
            fontSize: "16px",
            fontWeight: "500",
            color: "#fc323b",
            borderColor: "#fc323b",
            "&:hover": {
              backgroundColor: "#fc323b",
              borderColor: "#fc323b",
              color: "#fff",
            },
          }}
          variant="outlined"
          className="analyzeButton button"
          endIcon={!speaking ? <VolumeUpIcon /> : <VolumeUpIcon />}
          onClick={handleSpeak}
          disabled={speaking || !response}
        >
          {speaking ? 'Speaking...' : 'Speak Text'}
        </Button>
        <Button
          sx={{
            fontSize: "16px",
            fontWeight: "500",
            color: "#fc323b",
            borderColor: "#fc323b",
            "&:hover": {
              backgroundColor: "#fc323b",
              borderColor: "#fc323b",
              color: "#fff",
            },
          }}
          variant="outlined"
          className="analyzeButton button"
          endIcon={<CancelIcon />}
          onClick={handleCancel}
          disabled={!speaking}
        >
          Cancel
        </Button>
      </div>
    )
  );
};

export default TextToSpeech;