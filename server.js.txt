1 import dotenv from 'dotenv';
     2 dotenv.config();
     3 import express from 'express';
     4 import cors from 'cors';
     5 import { GoogleGenerativeAI } from '@google/generative-ai';
     6 import fs from 'fs';
     7
     8 const app = express();
     9 const port = process.env.PORT || 5000;
    10
    11 const frontendUrl = process.env.FRONTEND_URL || 'https://salud-holistica.onrender.com';
    12 app.use(cors({
    13   origin: frontendUrl
    14 }));
    15 app.use(express.json({ limit: '50mb' }));
    16
    17 const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    18
    19 app.get('/', (req, res) => {
    20   res.status(200).send('Salud Holistica Backend API is running!');
    21 });
    22
    23 const promptTemplate = fs.readFileSync('./prompt-template.txt', 'utf-8');
    24
    25 app.post('/api/search', async (req, res) => {
    26   const { query, lang, image } = req.body;
    27
    28   if (!query && !image) {
    29     return res.status(400).json({ error: 'Query or image is required' });
    30   }
    31
    32   const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash"});
    33
    34   let promptText = promptTemplate;
    35
    36   if (image && query) {
    37     promptText += `Identifica el objeto en la imagen y proporciona información sobre él, considerando el contexto de "${query}".\n`;
    38   } else if (image) {
    39     promptText += `Identifica el objeto en la imagen y proporciona información sobre él.\n`;
    40   } else {
    41     promptText += `Proporciona información sobre "${query}".\n`;
    42   }
    43
    44   promptText += `El idioma de la respuesta debe ser ${lang}.\n`;
    45   promptText += 'La respuesta DEBE ser únicamente el objeto JSON, sin texto adicional, explicaciones o formato markdown.\n';
    46   promptText += 'El JSON debe tener la siguiente estructura:\n';
    47   promptText += `
    48         {
    49           "nombre": {"es": "<nombre en español>", "en": "<nombre en inglés>"},
    50           "publico_general": {
    51             "beneficios_usos": {"es": "<beneficios en español>", "en": "<beneficios en inglés>"},
    52             "interacciones_riesgos": {"es": "<interacciones en español>", "en": "<interacciones en inglés>"},
    53             "efectos_adversos": {"es": "<efectos adversos en español>", "en": "<efectos adversos en inglés>"},
    54             "advertencias_contraindicaciones": {"es": "<advertencias en español>", "en": "<advertencias en inglés>"}
    55           },
    56           "profesionales_salud": {
    57             "nombre_cientifico": "<nombre científico>",
    58             "resumen_clinico": {"es": "<resumen en español>", "en": "<resumen en inglés>"},
    59             "mecanismo_accion": {"es": "<mecanismo en español>", "en": "<mecanismo en inglés>"},
    60             "interacciones_hierba_medicamento": {"es": "<interacciones en español>", "en": "<interacciones en inglés>"},
    61             "interacciones_hierba_laboratorio": {"es": "<interacciones en español>", "en": "<interacciones en inglés>"},
    62             "referencias": ["<referencia 1>", "<referencia 2>"]
    63           },
    64           "calidad_certificaciones": ["<certificación 1>", "<certificación 2>"]
    65         },
    66         "presentaciones": ["<presentación 1>", "<presentación 2>"],
    67         "dosis_recomendada": {
    68           "edad": {"es": "<dosis por edad en español, incluyendo bebés, niños, adolescentes y adultos mayores>", "en": "<dosis por edad en
       inglés, including infants, children, teenagers, and older adults>"},
    69           "patologia": {"es": "<dosis por patología en español, si aplica>", "en": "<dosis por pathology in English, if applicable>"},
    70           "deporte": {"es": "<dosis por deporte en español, si aplica>", "en": "<dosis por deporte en inglés, if applicable>"}
    71         },
    72         "omega_balance_info": {"es": "<información sobre el equilibrio omega en español>", "en": "<omega balance information in English>"}
    73       }`;
    74
    75   const textPart = { text: promptText };
    76   const imagePart = image ? { inlineData: { data: image, mimeType: 'image/jpeg' } } : null;
    77
    78   const parts = [textPart];
    79   if (imagePart) {
    80     parts.push(imagePart);
    81   }
    82
    83   try {
    84     const result = await model.generateContent({ contents: [{ parts }] });
    85     const response = await result.response;
    86     let text = response.text();
    87
    88     const startIndex = text.indexOf('{');
    89     const endIndex = text.lastIndexOf('}');
    90
    91     if (startIndex === -1 || endIndex === -1) {
    92       throw new Error("No se encontró un objeto JSON en la respuesta de la IA.");
    93     }
    94
    95     const jsonString = text.substring(startIndex, endIndex + 1);
    96
    97     const parsedJson = JSON.parse(jsonString);
    98     res.json(parsedJson);
    99
   100   } catch (error) {
   101     console.error("Error procesando la respuesta de Gemini:", error);
   102     res.status(500).json({ error: 'Error al procesar la respuesta de la API de Gemini.' });
   103   }
   104 });
   105
   106 app.post('/api/assistant', async (req, res) => {
   107   const { userQuestion, contextResults, lang } = req.body;
   108
   109   if (!userQuestion) {
   110     return res.status(400).json({ error: 'User question is required' });
   111   }
   112
   113   const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
   114
   115   let assistantPrompt = `Actúa como un robot doctor. Responde a la siguiente pregunta del usuario en ${lang}: "${userQuestion}".
   116   Tu respuesta debe ser concisa y directa.`;
   117
   118   try {
   119     const result = await model.generateContent(assistantPrompt);
   120     const response = await result.response;
   121     const text = response.text();
   122     res.json({ response: text });
   123   } catch (error) {
   124     console.error("Error processing assistant API response:", error);
   125     res.status(500).json({ error: 'Error al procesar la respuesta del asistente de Gemini.' });
   126   }
   127 });
   128
   129 app.listen(port, () => {
   130   console.log(`Backend server listening at http://localhost:${port}`);
   131 });