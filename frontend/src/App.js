import React, { useState, useEffect } from 'react';
import axios from 'axios';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';
import './App.css';

function App() {
  // --- Estados para el Buscador ---
  const [query, setQuery] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // --- Hook para el Reconocimiento de Voz ---
  const {
    transcript,
    listening,
    resetTranscript,
    browserSupportsSpeechRecognition
  } = useSpeechRecognition();

  // --- Efecto para actualizar el campo de búsqueda con el texto dictado ---
  // Cada vez que el 'transcript' cambia, actualizamos el estado 'query'.
  useEffect(() => {
    setQuery(transcript);
  }, [transcript]);

  // --- Función para manejar la búsqueda (cuando se presiona el botón) ---
  const handleSearch = async () => {
    if (!query) {
      setError('Por favor, escribe o dicta algo para buscar.');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);

    const backendUrl = process.env.REACT_APP_API_URL;

    try {
      const response = await axios.post(`${backendUrl}/api/search`, {
        query: query,
        lang: 'es'
      });
      setResult(response.data);
    } catch (err) {
      setError('Hubo un error al contactar al backend.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Si el navegador no soporta el reconocimiento de voz, mostramos un aviso.
  if (!browserSupportsSpeechRecognition) {
    return <span>Lo siento, tu navegador no soporta el reconocimiento de voz.</span>;
  }

  return (
    <div className="App">
      <header className="App-header">
        <h1>Buscador de Salud Holística</h1>

        {/* --- Contenedor del Buscador --- */}
        <div className="search-container">
          <input
            type="text"
            value={query} // El valor del input está conectado al estado 'query'
            onChange={(e) => setQuery(e.target.value)} // Permite escribir manualmente
            placeholder="Escribe o dicta una hierba..."
          />
          <button onClick={handleSearch} disabled={loading}>
            {loading ? 'Buscando...' : 'Buscar'}
          </button>
        </div>

        {/* --- Contenedor para los Controles del Micrófono --- */}
        <div className="mic-container">
          <p>Micrófono: {listening ? 'encendido' : 'apagado'}</p>
          <button onClick={SpeechRecognition.startListening}>Empezar</button>
          <button onClick={SpeechRecognition.stopListening}>Parar</button>
          <button onClick={() => {
            resetTranscript();
            setQuery(''); // También borramos el query del input
          }}>Borrar</button>
        </div>

        {/* --- Muestra de Errores y Resultados --- */}
        {error && <p className="error-message">{error}</p>}
        {result && (
          <div className="results-container">
            <h2>Resultados para: {result.nombre.es}</h2>
            <pre>
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}
      </header>
    </div>
  );
}

export default App;