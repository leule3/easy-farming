const axios = require('axios');

// Local fallback response engine (in case GEMINI_API_KEY is not defined or on API limits)
function getLocalResponse(message) {
    const query = message.toLowerCase();
    
    if (query.includes('teff') || query.includes('grain')) {
        return '🌾 Teff crops thrive in warm, well-drained volcanic soil. Make sure to schedule planting at the onset of the main rainy season (mid-July). Always watch out for grasshopper infestations or local moisture drops.';
    }
    if (query.includes('coffee')) {
        return '☕ Ethiopian Coffee (Arabica) demands shaded canopies and altitude. Watch out for Coffee Berry Disease (CBD). If you spot dark sunken lesions on berries, file a high severity report immediately so our specialists can intervene.';
    }
    if (query.includes('warning') || query.includes('alert')) {
        return '⚠️ Warning posts are distributed by Super Admins. They alert users of floods, locust swarms, or wildfire risks. On the dashboard, warnings are filtered to show only active threats posted within the last 7 days.';
    }
    if (query.includes('report') || query.includes('priorit') || query.includes('critical')) {
        return '🚨 I use semantic keyword matching and severity checks on all submitted reports. If a report outlines flooding, swarms, rust, or is marked critical, I flag it in the database and push instant alerts to branch admins for urgent response.';
    }
    if (query.includes('hello') || query.includes('hi ') || query.includes('hey')) {
        return '👋 Hello! I am here to help you coordinate local farming questions. Ask me about teff, coffee care, warning alerts, or reports prioritization!';
    }
    return '🤖 (Offline Fallback) Thank you for your question. I have processed your input. To protect our admins, urgent requests (e.g. including keywords like "crop failure", "disease", "flooding", or "critical") are automatically flagged for direct higher-up attention.';
}

const faqController = {
    // Generative AI chat endpoint using Gemini 1.5 Flash API
    async askAI(req, res) {
        try {
            const { message } = req.body;
            
            if (!message || message.trim() === '') {
                return res.status(400).json({ success: false, message: 'Message is required' });
            }

            const apiKey = process.env.GEMINI_API_KEY;

            if (!apiKey || apiKey.trim() === '') {
                console.log('Gemini API key is not configured. Falling back to local heuristic response.');
                const reply = getLocalResponse(message);
                return res.json({ success: true, reply, source: 'fallback' });
            }

            // Build request to Gemini 1.5 Flash API
            const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
            
            const systemInstruction = 
                "You are the AI Agro-Assistant for the 'Easy Farming' platform. " +
                "Your task is to provide highly accurate, friendly, and practical agricultural advice to farmers and specialists. " +
                "Focus your answers on crop cycles (specifically Teff grains and Highland Coffee beans), regional weather mitigation tips, " +
                "pest prevention (locust swarms, wheat rust), and help guide them on how to write clear problem reports. " +
                "Keep your answers concise, practical, and tailored to the East African context. " +
                "Act as the helpful backend intelligence for the Easy Farming application.";

            const payload = {
                contents: [
                    {
                        parts: [
                            { text: message }
                        ]
                    }
                ],
                systemInstruction: {
                    parts: [
                        { text: systemInstruction }
                    ]
                },
                generationConfig: {
                    temperature: 0.7,
                    maxOutputTokens: 500
                }
            };

            const response = await axios.post(url, payload, {
                headers: { 'Content-Type': 'application/json' },
                timeout: 8000 // 8 seconds timeout
            });

            if (response.data && response.data.candidates && response.data.candidates.length > 0) {
                const reply = response.data.candidates[0].content.parts[0].text;
                return res.json({ success: true, reply, source: 'gemini' });
            } else {
                throw new Error('Invalid response structure from Gemini API');
            }

        } catch (error) {
            console.error('Gemini API request failed:', error.message);
            // Fallback gracefully on API errors
            const reply = getLocalResponse(req.body.message || '');
            return res.json({ 
                success: true, 
                reply, 
                source: 'fallback-error',
                error: error.message 
            });
        }
    }
};

module.exports = faqController;
