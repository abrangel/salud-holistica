... first 29 lines hidden ...
    30   if (!query && !image) {
    31     return res.status(400).json({ error: 'Query or image is required' });
    32   }
    33
    34   const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash"});
    35
    36   let promptText = promptTemplate;
    37
    38   if (image && query) {
    39     promptText += `Identifica el objeto en la imagen y proporciona información sobre él,
       considerando el contexto de "${query}".\n`;
    40   } else if (image) {
    41     promptText += `Identifica el objeto en la imagen y proporciona información sobre él.\n`;
    42   } else {
    43     promptText += `Proporciona información sobre "${query}".\n`;
    44   }
    45
    46   promptText += `El idioma de la respuesta debe ser ${lang}.\n`;
    47   promptText += 'La respuesta DEBE ser únicamente el objeto JSON, sin texto adicional,
       explicaciones o formato markdown.\n';
    48   promptText += 'El JSON debe tener la siguiente estructura:\n';
    49   promptText += `
    50         {
    51           "nombre": {"es": "<nombre en español>", "en": "<nombre en inglés>"},
    52           "publico_general": {
    53             "beneficios_usos": {"es": "<beneficios en español>", "en": "<beneficios en inglés>"
       },
    54             "interacciones_riesgos": {"es": "<interacciones en español>", "en": "<interacciones
       en inglés>"},
    55             "efectos_adversos": {"es": "<efectos adversos en español>", "en": "<efectos
       adversos en inglés>"},
    56             "advertencias_contraindicaciones": {"es": "<advertencias en español>", "en":
       "<advertencias en inglés>"}
    57           },
    58           "profesionales_salud": {
    59             "nombre_cientifico": "<nombre científico>",
    60             "resumen_clinico": {"es": "<resumen en español>", "en": "<resumen en inglés>"},
    61             "mecanismo_accion": {"es": "<mecanismo en español>", "en": "<mecanismo en inglés>"
       },
    62             "interacciones_hierba_medicamento": {"es": "<interacciones en español>", "en":
       "<interacciones en inglés>"},
    63             "interacciones_hierba_laboratorio": {"es": "<interacciones en español>", "en":
       "<interacciones en inglés>"},
    64             "referencias": ["<referencia 1>", "<referencia 2>"]
    65           },
    66           "calidad_certificaciones": ["<certificación 1>", "<certificación 2>"]
    67         },
    68         "presentaciones": ["<presentación 1>", "<presentación 2>"],
    69         "dosis_recomendada": {
    70           "edad": {"es": "<dosis por edad en español, incluyendo bebés, niños, adolescentes y
       adultos mayores>", "en": "<dosis por edad en inglés, including infants, children, teenagers,
       and older adults>"},
    71           "patologia": {"es": "<dosis por patología en español, si aplica>", "en": "<dosis por
       pathology in English, if applicable>"},
    72           "deporte": {"es": "<dosis por deporte en español, si aplica>", "en": "<dosis por
       deporte en inglés, if applicable>"}
    73         },
    74         "omega_balance_info": {"es": "<información sobre el equilibrio omega en español>", "en"
       : "<omega balance information in English>"}
    75       }`;
    76
    77   const textPart = { text: promptText };
    78   const imagePart = image ? { inlineData: { data: image, mimeType: 'image/jpeg' } } : null;
    79
    80   const parts = [textPart];
    81   if (imagePart) {
    82     parts.push(imagePart);
    83   }
    84
    85   try {
    86     const result = await model.generateContent({ contents: [{ parts }] });
    87     const response = await result.response;
    88     let text = response.text();
    89
    90     const startIndex = text.indexOf('{');
    91     const endIndex = text.lastIndexOf('}');
    92
    93     if (startIndex === -1 || endIndex === -1) {
    94       throw new Error("No se encontró un objeto JSON en la respuesta de la IA.");
    95     }
    96
    97     const jsonString = text.substring(startIndex, endIndex + 1);
    98
    99     const parsedJson = JSON.parse(jsonString);
   100     res.json(parsedJson);
   101
   102   } catch (error) {
   103     console.error("Error procesando la respuesta de Gemini:", error);
   104     res.status(500).json({ error: 'Error al procesar la respuesta de la API de Gemini.' });
   105   }
   106 });
   107
   108 app.post('/api/assistant', async (req, res) => {
   109   const { userQuestion, contextResults, lang } = req.body;
   110
   111   if (!userQuestion) {
   112     return res.status(400).json({ error: 'User question is required' });
   113   }
   114
   115   const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
   116
   117   let assistantPrompt = `Actúa como un robot doctor. Responde a la siguiente pregunta del
       usuario en ${lang}: "${userQuestion}".
   118   Tu respuesta debe ser concisa y directa.`;
   119
   120   try {
   121     const result = await model.generateContent(assistantPrompt);
   122     const response = await result.response;
   123     const text = response.text();
   124     res.json({ response: text });
   125   } catch (error) {
   126     console.error("Error processing assistant API response:", error);
   127     res.status(500).json({ error: 'Error al procesar la respuesta del asistente de Gemini.' });
   128   }
   129 });
   130
   131 app.listen(port, () => {
   132   console.log(`Backend server listening at http://localhost:${port}`);
   133 });