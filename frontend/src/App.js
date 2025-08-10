1 import React, { useState } from 'react';
    2 import axios from 'axios';
    3 import './App.css'; // Create React App incluye este archivo para estilos
    4
    5 function App() {
    6   const [query, setQuery] = useState(''); // Estado para guardar lo que el usuario escribe
    7   const [result, setResult] = useState(null); // Estado para guardar el resultado del backend
    8   const [error, setError] = useState(''); // Estado para guardar cualquier error
    9   const [loading, setLoading] = useState(false); // Estado para mostrar un mensaje de "cargando"
   10
   11   const handleSearch = async () => {
   12     if (!query) {
   13       setError('Por favor, escribe algo para buscar.');
   14       return;
   15     }
   16
   17     setLoading(true);
   18     setError('');
   19     setResult(null);
   20
   21     const backendUrl = process.env.REACT_APP_API_URL;
   22
   23     try {
   24       // Hacemos la llamada POST a la ruta /api/search de nuestro backend
   25       const response = await axios.post(`${backendUrl}/api/search`, {
   26         query: query,
   27         lang: 'es' // O el idioma que prefieras
   28       });
   29
   30       setResult(response.data); // Guardamos la respuesta del backend en el estado
   31
   32     } catch (err) {
   33       setError('Hubo un error al contactar al backend. Por favor, intenta de nuevo.');
   34       console.error(err); // Mostramos el error en la consola para depuración
   35     } finally {
   36       setLoading(false); // Dejamos de mostrar el mensaje de "cargando"
   37     }
   38   };
   39
   40   return (
   41     <div className="App">
   42       <header className="App-header">
   43         <h1>Buscador de Salud Holística</h1>
   44         <div className="search-container">
   45           <input
   46             type="text"
   47             value={query}
   48             onChange={(e) => setQuery(e.target.value)}
   49             placeholder="Escribe una hierba, suplemento, etc."
   50           />
   51           <button onClick={handleSearch} disabled={loading}>
   52             {loading ? 'Buscando...' : 'Buscar'}
   53           </button>
   54         </div>
   55
   56         {error && <p className="error-message">{error}</p>}
   57
   58         {result && (
   59           <div className="results-container">
   60             <h2>Resultados para: {result.nombre.es}</h2>
   61             <pre>
   62               {/* Usamos JSON.stringify para mostrar el objeto JSON de forma legible */}
   63               {JSON.stringify(result, null, 2)}
   64             </pre>
   65           </div>
   66         )}
   67       </header>
   68     </div>
   69   );
   70 }
   71
   72 export default App;