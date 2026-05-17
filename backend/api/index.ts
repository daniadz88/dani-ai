app.enableCors({
    origin: ["https://dani-ai-one.vercel.app", "https://dani-ai-olive.vercel.app", "http://localhost:5173"],
    methods: ["GET", "POST", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
});
