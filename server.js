explicaciones o formato markdown.\n';
    43   promptText += 'El JSON debe tener la siguiente estructura:\n';
    44   promptText += `
    45         {
    46           "nombre": {"es": "<nombre en español>", "en": "<nombre en inglés>"},
    47           "publico_general": {
    48             "beneficios_usos": {"es": "<beneficios en español>", "en": "<beneficios en inglés>"
       },
    49             "interacciones_riesgos": {"es": "<interacciones en español>", "en": "<interacciones
       en inglés>"},
    50             "efectos_adversos": {"es": "<efectos adversos en español>", "en": "<efectos
       adversos en inglés>"},
    51             "advertencias_contraindicaciones": {"es": "<advertencias en español>", "en":
       "<advertencias en inglés>"}
    52           },
    53           "profesionales_salud": {
    54             "nombre_cientifico": "<nombre científico>",
    55             "resumen_clinico": {"es": "<resumen en español>", "en": "<resumen en inglés>"},
    56             "mecanismo_accion": {"es": "<mecanismo en español>", "en": "<mecanismo en inglés>"
       },
    57             "interacciones_hierba_medicamento": {"es": "<interacciones en español>", "en":
       "<interacciones en inglés>"},
    58             "interacciones_hierba_laboratorio": {"es": "<interacciones en español>", "en":
       "<interacciones en inglés>"},
    59             "referencias": ["<referencia 1>", "<referencia 2>"]
    60           },
    61           "calidad_certificaciones": ["<certificación 1>", "<certificación 2>"]
    62         },
    63         "presentaciones": ["<presentación 1>", "<presentación 2>"],
    64         "dosis_recomendada": {
    65           "edad": {"es": "<dosis por edad en español, incluyendo bebés, niños, adolescentes y
       adultos mayores>", "en":
    66       "<dosis por edad en inglés, including infants, children, teenagers, and older adults>"},
    67           "patologia": {"es": "<dosis por patología en español, si aplica>", "en": "<dosis por
       pathology in English, if
    68       applicable>"},
    69           "deporte": {"es": "<dosis por deporte en español, si aplica>", "en": "<dosis por
       deporte en inglés, if
    70       applicable>"}
    71         },
    72         "omega_balance_info": {"es": "<información sobre el equilibrio omega en español>", "en"
       : "<omega balance information in English>"}
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
   115   // Construct the prompt for the assistant
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
   130 // Ruta de health check para verificar que el servicio está en línea
   131 app.get('/', (req, res) => {
   132   res.status(200).send('Salud Holistica Backend API is running!');
   133 });
   134
   135 process.on('unhandledRejection', (reason, promise) => {
   136   console.error('Unhandled Rejection at:', promise, 'reason:', reason);
   137 });
   138
   139 process.on('uncaughtException', (error) => {
   140   console.error('Uncaught Exception:', error);
   141   // Es una buena práctica dejar que el proceso se detenga después de un error grave para que
       Render lo reinicie.
   142   // process.exit(1);
   143 });
   144
   145 app.listen(port, () => {
   146   console.log(`Backend server listening at http://localhost:${port}`);
   147 });