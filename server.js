... first 28 lines hidden ...
    29   if (!query && !image) {
    30     return res.status(400).json({ error: 'Query or image is required' });
    31   }
    32
    33   const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash"});
    34
    35   let promptText = promptTemplate;
    36
    37   if (image && query) {
    38     promptText += `Identifica el objeto en la imagen y proporciona información sobre él,
       considerando el contexto de "${query}".\n`;
    39   } else if (image) {
    40     promptText += `Identifica el objeto en la imagen y proporciona información sobre él.\n`;
    41   } else {
    42     promptText += `Proporciona información sobre "${query}".\n`;
    43   }
    44
    45   promptText += `El idioma de la respuesta debe ser ${lang}.\n`;
    46   promptText += 'La respuesta DEBE ser únicamente el objeto JSON, sin texto adicional,
       explicaciones o formato markdown.\n';
    47   promptText += 'El JSON debe tener la siguiente estructura:\n';
    48   promptText += `
    49         {
    50           "nombre": {"es": "<nombre en español>", "en": "<nombre en inglés>"},
    51           "publico_general": {
    52             "beneficios_usos": {"es": "<beneficios en español>", "en": "<beneficios en inglés>"
       },
    53             "interacciones_riesgos": {"es": "<interacciones en español>", "en": "<interacciones
       en inglés>"},
    54             "efectos_adversos": {"es": "<efectos adversos en español>", "en": "<efectos
       adversos en inglés>"},
    55             "advertencias_contraindicaciones": {"es": "<advertencias en español>", "en":
       "<advertencias en inglés>"}
    56           },
    57           "profesionales_salud": {
    58             "nombre_cientifico": "<nombre científico>",
    59             "resumen_clinico": {"es": "<resumen en español>", "en": "<resumen en inglés>"},
    60             "mecanismo_accion": {"es": "<mecanismo en español>", "en": "<mecanismo en inglés>"
       },
    61             "interacciones_hierba_medicamento": {"es": "<interacciones en español>", "en":
       "<interacciones en inglés>"},
    62             "interacciones_hierba_laboratorio": {"es": "<interacciones en español>", "en":
       "<interacciones en inglés>"},
    63             "referencias": ["<referencia 1>", "<referencia 2>"]
    64           },
    65           "calidad_certificaciones": ["<certificación 1>", "<certificación 2>"]
    66         },
    67         "presentaciones": ["<presentación 1>", "<presentación 2>"],
    68         "dosis_recomendada": {
    69           "edad": {"es": "<dosis por edad en español, incluyendo bebés, niños, adolescentes y
       adultos mayores>", "en": "<dosis por edad en inglés, including infants, children, teenagers,
       and older adults>"},
    70           "patologia": {"es": "<dosis por patología en español, si aplica>", "en": "<dosis por
       pathology in English, if applicable>"},
    71           "deporte": {"es": "<dosis por deporte en español, si aplica>", "en": "<dosis por
       deporte en inglés, if applicable>"}
    72         },
    73         "omega_balance_info": {"es": "<información sobre el equilibrio omega en español>", "en"
       : "<omega balance information in English>"}
    74       }`;
    75
    76   const textPart = { text: promptText };
    77   const imagePart = image ? { inlineData: { data: image, mimeType: 'image/jpeg' } } : null;
    78
    79   const parts = [textPart];
    80   if (imagePart) {
    81     parts.push(imagePart);
    82   }
    83
    84   try {
    85     const result = await model.generateContent({ contents: [{ parts }] });
    86     const response = await result.response;
    87     let text = response.text();
    88
    89     const startIndex = text.indexOf('{');
    90     const endIndex = text.lastIndexOf('}');
    91
    92     if (startIndex === -1 || endIndex === -1) {
    93       throw new Error("No se encontró un objeto JSON en la respuesta de la IA.");
    94     }
    95
    96     const jsonString = text.substring(startIndex, endIndex + 1);
    97
    98     const parsedJson = JSON.parse(jsonString);
    99     res.json(parsedJson);
   100
   101   } catch (error) {
   102     console.error("Error procesando la respuesta de Gemini:", error);
   103     res.status(500).json({ error: 'Error al procesar la respuesta de la API de Gemini.' });
   104   }
   105 });
   106
   107 app.post('/api/assistant', async (req, res) => {
   108   const { userQuestion, contextResults, lang } = req.body;
   109
   110   if (!userQuestion) {
   111     return res.status(400).json({ error: 'User question is required' });
   112   }
   113
   114   const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
   115
   116   let assistantPrompt = `Actúa como un robot doctor. Responde a la siguiente pregunta del
       usuario en ${lang}: "${userQuestion}".
   117   Tu respuesta debe ser concisa y directa.`;
   118
   119   try {
   120     const result = await model.generateContent(assistantPrompt);
   121     const response = await result.response;
   122     const text = response.text();
   123     res.json({ response: text });
   124   } catch (error) {
   125     console.error("Error processing assistant API response:", error);
   126     res.status(500).json({ error: 'Error al procesar la respuesta del asistente de Gemini.' });
   127   }
   128 });
   129
   130 app.listen(port, () => {
   131   console.log(`Backend server listening at http://localhost:${port}`);
   132 });