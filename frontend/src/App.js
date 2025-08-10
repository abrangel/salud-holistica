import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { useSpeechRecognition } from 'react-speech-kit';
import './App.css';

const certificationLogos = {
  "NSF International": "https://upload.wikimedia.org/wikipedia/commons/a/a1/NSF_International_logo.svg",
  "USP Verified": "https://www.quality-supplements.org/images/usp-verified-mark.jpg"
};

function App() {
  const { t, i18n } = useTranslation();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [lang, setLang] = useState('es');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState(null);
  const [assistantQuery, setAssistantQuery] = useState('');
  const [assistantResponse, setAssistantResponse] = useState('');
  const [isAssistantLoading, setIsAssistantLoading] = useState(false);

  const { listen, stop, listening } = useSpeechRecognition({
    onResult: (result) => {
      setQuery(result);
    },
  });

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
    setLang(lng);
  };

  const handleSearch = async () => {
    if (query.trim() === '' && !imageFile) return;

    setIsSearching(true);
    setResults([]);
    setError(null);
    let base64Image = null;
    if (imageFile) {
      base64Image = await toBase64(imageFile);
    }

    try {
      const response = await axios.post(`https://salud-holistica.onrender.com/api/search`, { query, lang, image: base64Image });
      setResults([response.data]);
    } catch (error) {
      console.error("Error during search:", error);
      if (error.response) {
        setError(error.response.data.error);
      } else {
        setError(t('error_searching'));
      }
    }
    setIsSearching(false);
  };

  const handleAssistantQuery = async () => {
    if (assistantQuery.trim() === '' || results.length === 0) return;

    setIsAssistantLoading(true);
    setAssistantResponse('');

    try {
      const response = await axios.post(`https://salud-holistica.onrender.com/api/assistant`, {
        userQuestion: assistantQuery,
        contextResults: results,
        lang: lang
      });
      setAssistantResponse(response.data.response);
    } catch (error) {
      console.error("Error during assistant query:", error);
      setAssistantResponse(t('assistant_error'));
    }
    setIsAssistantLoading(false);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const toBase64 = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result.split(',')[1]);
    reader.onerror = error => reject(error);
  });

  const getRiskClass = (risk) => {
    if (!risk) return '';
    const riskLower = risk.toLowerCase();
    if (riskLower.includes(t('risk_high').toLowerCase())) return 'risk-high';
    if (riskLower.includes(t('risk_moderate').toLowerCase())) return 'risk-moderate';
    if (riskLower.includes(t('risk_low').toLowerCase())) return 'risk-low';
    return '';
  };

  const hasRealDosageInfo = (dosage) => {
    if (!dosage || Object.keys(dosage).length === 0) {
      return false;
    }
    const genericPhrases = [
      "no existe una dosis diaria recomendada establecida universalmente",
      "su uso debe ser moderado y siempre bajo supervisión médica",
      "la dosis debe ser individualizada y determinada por un profesional de la salud",
      "no hay evidencia científica que apoye el uso",
      "no hay evidencia que sugiera una dosis específica"
    ];

    const checkField = (field) => {
      const text = dosage[field]?.[lang]?.toLowerCase().trim();
      if (!text) return false; // Empty or null field is not real info
      return !genericPhrases.some(phrase => text.includes(phrase));
    };

    // Check if at least one field has non-generic info
    return checkField('edad') || checkField('patologia') || checkField('deporte');
  };

  const isSearchDisabled = (query.trim() === '' && !imageFile) || isSearching;

  return (
    <div className="App">
      <header className="App-header">
        <h1>{t('app_title')}</h1>
        <div className="lang-selector">
          <button onClick={() => changeLanguage('es')}>ES</button>
          <button onClick={() => changeLanguage('en')}>EN</button>
        </div>
      </header>
      <main>
        <div className="search-container">
          <input 
            type="text" 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('search_placeholder')}
            disabled={isSearching}
          />
          <button onClick={listening ? stop : listen} disabled={isSearching} className={`mic-button ${listening ? 'listening' : ''}`}>
            🎤
          </button>
          <label htmlFor="image-upload" className={`custom-file-upload ${isSearching ? 'disabled' : ''}`}>📸</label>
          <input id="image-upload" type="file" onChange={handleImageChange} accept="image/*" capture="environment" disabled={isSearching} />
          <button onClick={handleSearch} disabled={isSearchDisabled}>
            {isSearching ? t('searching_button') : t('search_button')}
          </button>
        </div>

        {imagePreview && (
          <div className="image-preview-container">
            <img src={imagePreview} alt="Vista previa" className="image-preview" />
          </div>
        )}

        <p className="disclaimer">{t('disclaimer')}</p>

        {error && <p className="error-message">{error}</p>}

        {isSearching && <div className="loader"></div>}

        <div className="assistant-container">
          <h3>{t('assistant_title')}</h3>
          <input
            type="text"
            value={assistantQuery}
            onChange={(e) => setAssistantQuery(e.target.value)}
            placeholder={t('assistant_placeholder')}
            disabled={isAssistantLoading}
          />
          <button onClick={handleAssistantQuery} disabled={isAssistantLoading || results.length === 0}>
            {isAssistantLoading ? t('assistant_loading') : t('assistant_button')}
          </button>
          {isAssistantLoading && <div className="loader small-loader"></div>}
          {assistantResponse && <div className="assistant-response">{assistantResponse}</div>}
        </div>

        <div className="results-container">
          {results.map((item, index) => (
            <div key={index} className="result-item">
              <h2>{item.nombre[lang]}</h2>
              
              <div className="section">
                <h3>{t('public_section_title')}</h3>
                <p><strong>{t('benefits_uses_title')}:</strong> {item.publico_general.beneficios_usos[lang]}</p>
                <p><strong>{t('interactions_risks_title')}:</strong> <span className={getRiskClass(item.publico_general.interacciones_riesgos[lang])}>{item.publico_general.interacciones_riesgos[lang]}</span></p>
                <p><strong>{t('adverse_effects_title')}:</strong> {item.publico_general.efectos_adversos[lang]}</p>
                <p><strong>{t('warnings_contraindications_title')}:</strong> {item.publico_general.advertencias_contraindicaciones[lang]}</p>
              </div>

              <div className="section">
                <h3>{t('professionals_section_title')}</h3>
                <p><strong>{t('scientific_name_title')}:</strong> {item.profesionales_salud.nombre_cientifico}</p>
                <p><strong>{t('clinical_summary_title')}:</strong> {item.profesionales_salud.resumen_clinico[lang]}</p>
                <p><strong>{t('mechanism_action_title')}:</strong> {item.profesionales_salud.mecanismo_accion[lang]}</p>
                <p><strong>{t('herb_drug_interactions_title')}:</strong> {item.profesionales_salud.interacciones_hierba_medicamento[lang]}</p>
                <p><strong>{t('herb_lab_interactions_title')}:</strong> {item.profesionales_salud.interacciones_hierba_laboratorio[lang]}</p>
                <p><strong>{t('references_title')}:</strong> {item.profesionales_salud.referencias.join(', ')}</p>
              </div>

              {item.calidad_certificaciones && item.calidad_certificaciones.length > 0 &&
                <div className="section">
                  <h3>{t('quality_certifications_title')}</h3>
                  <div className="cert-logos">
                    {item.calidad_certificaciones.map(cert => (
                      certificationLogos[cert] && <img key={cert} src={certificationLogos[cert]} alt={cert} className="cert-logo" />
                    ))}
                  </div>
                </div>
              }

              {item.presentaciones && item.presentaciones.length > 0 &&
                <div className="section">
                  <h3>{t('presentations_title')}</h3>
                  <p>{item.presentaciones.join(', ')}</p>
                </div>
              }

              {item.dosis_recomendada && hasRealDosageInfo(item.dosis_recomendada) && (
                <div className="section">
                  <h3>{t('recommended_dosage_title')}</h3>
                  {item.dosis_recomendada.edad && <p><strong>{t('dosage_age')}:</strong> {item.dosis_recomendada.edad[lang]}</p>}
                  {item.dosis_recomendada.patologia && <p><strong>{t('dosage_pathology')}:</strong> {item.dosis_recomendada.patologia[lang]}</p>}
                  {item.dosis_recomendada.deporte && <p><strong>{t('dosage_sport')}:</strong> {item.dosis_recomendada.deporte[lang]}</p>}
                </div>
              )}

              {item.omega_balance_info && item.omega_balance_info[lang] && (
                <div className="section">
                  <h3>{t('omega_balance_title')}</h3>
                  <p>{item.omega_balance_info[lang]}</p>
                </div>
              )}

              {item.omega_balance_info && item.omega_balance_info[lang] && (
                <div className="section">
                  <h3>{t('omega_balance_title')}</h3>
                  <p>{item.omega_balance_info[lang]}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </main>
      <footer className="App-footer">
        <p>{t('trademark')}</p>
      </footer>
    </div>
  );
}

export default App;