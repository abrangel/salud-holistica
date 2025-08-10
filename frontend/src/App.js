import React, { useState } from 'react';
import axios from 'axios';
import './App.css'; // Create React App incluye este archivo para estilos

function App() {
  const [query, setQuery] = useState(''); // Estado para guardar lo que el usuario escribe
  const [result, setResult] = useState(null); // Estado para guardar el resultado del backend
  const [error, setError] = useState(''); // Estado para guardar cualquier error
  const [loading, setLoading] = useState(false); // Estado para mostrar un mensaje de "cargando"

  const handleSearch = async () => {
    if (!query) {
      setError('Por favor, escribe algo para buscar.');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);

    const backendUrl = process.env.REACT_APP_API_URL;

    try {
      // Hacemos la llamada POST a la ruta /api/search de nuestro backend
      const response = await axios.post(`${backendUrl}/api/search`, {
        query: query,
        lang: 'es' // O el idioma que prefieras
      });

      setResult(response.data); // Guardamos la respuesta del backend en el estado

    } catch (err) {
      setError('Hubo un error al contactar al backend. Por favor, intenta de nuevo.');
      console.error(err); // Mostramos el error en la consola para depuración
    } finally {
      setLoading(false); // Dejamos de mostrar el mensaje de "cargando"
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>Buscador de Salud Holística</h1>
        <div className="search-container">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Escribe una hierba, suplemento, etc."
          />
          <button onClick={handleSearch} disabled={loading}>
            {loading ? 'Buscando...' : 'Buscar'}
          </button>
        </div>

        {error && <p className="error-message">{error}</p>}

        {result && (
          <div className="results-container">
            <h2>Resultados para: {result.nombre.es}</h2>
            <pre>
              {/* Usamos JSON.stringify para mostrar el objeto JSON de forma legible */}
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}
      </header>
    </div>
  );
}

export default App;