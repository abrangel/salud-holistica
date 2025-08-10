import React, { useState, useEffect } from 'react';
import axios from 'axios';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';
import './App.css';

function App() {
  // --- Estados para el Buscador ---
  const [query, setQuery] = useState('');
  const [image, setImage] = useState(null); // Estado para guardar la imagen en formato Base64
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
  useEffect(() => {
    setQuery(transcript);
  }, [transcript]);

  // --- Función para manejar la selección de una imagen ---
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) {
      setImage(null);
      return;
    }
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onloadend = () => {
      const base64String = reader.result.replace(/^data:image\/(png|jpeg|jpg);base64,/, '');
      setImage(base64String);
    };
    reader.onerror = (error) => {
      console.error("Error reading file:", error);
      setError("Error al leer el archivo de imagen.");
    }
  };

  // --- Función para manejar la búsqueda (cuando se presiona el botón) ---
  const handleSearch = async () => {
    if (!query && !image) {
      setError('Por favor, escribe, dicta o selecciona una imagen para buscar.');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);

    const backendUrl = process.env.REACT_APP_API_URL;

    try {
      const payload = {
        query: query,
        lang: 'es',
        image: image
      };

      const response = await axios.post(`${backendUrl}/api/search`, payload);
      setResult(response.data);
    } catch (err) {
      setError('Hubo un error al contactar al backend.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (!browserSupportsSpeechRecognition) {
    return <span>Lo siento, tu navegador no soporta el reconocimiento de voz.</span>;
  }

  return (
    <div className="App">
      <header className="App-header">
        <h1>Buscador de Salud Holística</h1>

        <div className="search-container">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Escribe o dicta una hierba..."
          />
          <button onClick={handleSearch} disabled={loading}>
            {loading ? 'Buscando...' : 'Buscar'}
          </button>
        </div>

        <div className="mic-container">
          <p>Micrófono: {listening ? 'encendido' : 'apagado'}</p>
          <button onClick={SpeechRecognition.startListening}>Empezar</button>
          <button onClick={SpeechRecognition.stopListening}>Parar</button>
          <button onClick={() => { resetTranscript(); setQuery(''); }}>Borrar</button>
        </div>

        <div className="image-container">
          <label htmlFor="image-upload">O busca por imagen:</label>
          <input
            id="image-upload"
            type="file"
            accept="image/png, image/jpeg"
            onChange={handleImageChange}
          />
        </div>

        {error && <p className="error-message">{error}</p>}

        {result && (
          <div className="results-container" style={{textAlign: 'left', margin: '20px'}}>
            <h1>{result.nombre.es}</h1>
            <h2>Para el Público General</h2>
            <p><strong>Beneficios y Usos:</strong> {result.publico_general.beneficios_usos.es}</p>
            <p><strong>Riesgos y Advertencias:</strong> {result.publico_general.advertencias_contraindicaciones.es}</p>
            <h2>Para Profesionales de la Salud</h2>
            <p><strong>Nombre Científico:</strong> {result.profesionales_salud.nombre_cientifico}</p>
            <p><strong>Resumen Clínico:</strong> {result.profesionales_salud.resumen_clinico.es}</p>
            <h2>Certificaciones de Calidad</h2>
            <ul>
              {result.calidad_certificaciones.map((cert, index) => (
                <li key={index}>{cert}</li>
              ))}
            </ul>
          </div>
        )}
      </header>
    </div>
  );
}

export default App;