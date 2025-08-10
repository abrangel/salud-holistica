// En tu archivo de componente, por ejemplo, src/App.js

import React from 'react';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';

const Dictaphone = () => {
  const {
    transcript,
    listening,
    resetTranscript,
    browserSupportsSpeechRecognition
  } = useSpeechRecognition();

  if (!browserSupportsSpeechRecognition) {
    return <span>Lo siento, tu navegador no soporta el reconocimiento de voz.</span>;
  }

  return (
    <div>
      <p>Micrófono: {listening ? 'encendido' : 'apagado'}</p>
      <button onClick={SpeechRecognition.startListening}>Empezar a escuchar</button>
      <button onClick={SpeechRecognition.stopListening}>Parar de escuchar</button>
      <button onClick={resetTranscript}>Borrar</button>
      <p>{transcript}</p>
    </div>
  );
};
export default Dictaphone;