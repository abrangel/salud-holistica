import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import cors from 'cors';
import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs';

const app = express();
const port = 5000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const promptTemplate = fs.readFileSync('./prompt-template.txt', 'utf-8');

app.post('/api/search', async (req, res) => {
  const { query, lang, image } = req.body;

  if (!query && !image) {
    return res.status(400).json({ error: 'Query or image is required' });
  }

  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash"});

  let promptText = promptTemplate;

  if (image && query) {
    promptText += `Identifica el objeto en la imagen y proporciona información sobre él, considerando el contexto de "
      ${query}".\n`;
  } else if (image) {
    promptText += `Identifica el objeto en la imagen y proporciona información sobre él.\n`;
  } else {
    promptText += `Proporciona información sobre "${query}".\n`;
  }

  promptText += `El idioma de la respuesta debe ser ${lang}.\n`;
  promptText += 'La respuesta DEBE ser únicamente el objeto JSON, sin texto adicional, explicaciones o formato markdown.\n';
  promptText += 'El JSON debe tener la siguiente estructura:\n';
  promptText += `
        {
          "nombre": {"es": "<nombre en español>", "en": "<nombre en inglés>"},
          "publico_general": {
            "beneficios_usos": {"es": "<beneficios en español>", "en": "<beneficios en inglés>"},
            "interacciones_riesgos": {"es": "<interacciones en español>", "en": "<interacciones en inglés>"},
            "efectos_adversos": {"es": "<efectos adversos en español>", "en": "<efectos adversos en inglés>"},
            "advertencias_contraindicaciones": {"es": "<advertencias en español>", "en": "<advertencias en inglés>"}
          },
          "profesionales_salud": {
            "nombre_cientifico": "<nombre científico>",
            "resumen_clinico": {"es": "<resumen en español>", "en": "<resumen en inglés>"},
            "mecanismo_accion": {"es": "<mecanismo en español>", "en": "<mecanismo en inglés>"},
            "interacciones_hierba_medicamento": {"es": "<interacciones en español>", "en": "<interacciones en inglés>"},
            "interacciones_hierba_laboratorio": {"es": "<interacciones en español>", "en": "<interacciones en inglés>"},
            "referencias": ["<referencia 1>", "<referencia 2>"]
          },
          "calidad_certificaciones": ["<certificación 1>", "<certificación 2>"]
        },
        "presentaciones": ["<presentación 1>", "<presentación 2>"],
        "dosis_recomendada": {
          "edad": {"es": "<dosis por edad en español, incluyendo bebés, niños, adolescentes y adultos mayores>", "en":
      "<dosis por edad en inglés, including infants, children, teenagers, and older adults>"},
          "patologia": {"es": "<dosis por patología en español, si aplica>", "en": "<dosis por pathology in English, if
      applicable>"},
          "deporte": {"es": "<dosis por deporte en español, si aplica>", "en": "<dosis por deporte en inglés, if
      applicable>"}
        },
        "omega_balance_info": {"es": "<información sobre el equilibrio omega en español>", "en": "<omega balance information in English>"}
      }`;

  const textPart = { text: promptText };
  const imagePart = image ? { inlineData: { data: image, mimeType: 'image/jpeg' } } : null;

  const parts = [textPart];
  if (imagePart) {
    parts.push(imagePart);
  }

  try {
    const result = await model.generateContent({ contents: [{ parts }] });
    const response = await result.response;
    let text = response.text();

    const startIndex = text.indexOf('{');
    const endIndex = text.lastIndexOf('}');

    if (startIndex === -1 || endIndex === -1) {
      throw new Error("No se encontró un objeto JSON en la respuesta de la IA.");
    }

    const jsonString = text.substring(startIndex, endIndex + 1);

    const parsedJson = JSON.parse(jsonString);
    res.json(parsedJson);

  } catch (error) {
    console.error("Error procesando la respuesta de Gemini:", error);
    res.status(500).json({ error: 'Error al procesar la respuesta de la API de Gemini.' });
  }
});

app.post('/api/assistant', async (req, res) => {
  const { userQuestion, contextResults, lang } = req.body;

  if (!userQuestion) {
    return res.status(400).json({ error: 'User question is required' });
  }

  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  // Construct the prompt for the assistant
  let assistantPrompt = `Actúa como un robot doctor. Responde a la siguiente pregunta del usuario en ${lang}: "${userQuestion}".
  Tu respuesta debe ser concisa y directa.`;

  try {
    const result = await model.generateContent(assistantPrompt);
    const response = await result.response;
    const text = response.text();
    res.json({ response: text });
  } catch (error) {
    console.error("Error processing assistant API response:", error);
    res.status(500).json({ error: 'Error al procesar la respuesta del asistente de Gemini.' });
  }
});

app.listen(port, () => {
  console.log(`Backend server listening at http://localhost:${port}`);
});
