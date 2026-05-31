const axios = require('axios');
const pool = require('../config/database');

// High-fidelity fallback response engine (when DEEPSEEK_API_KEY is not defined or on API limits)
async function getLocalResponseAndNotify(message, user) {
    const query = message.toLowerCase();
    
    // Check if the user message indicates a critical problem that needs reporting
    const criticalKeywords = [
        'pest', 'locust', 'swarm', 'drought', 'flood', 'disease', 
        'infestation', 'outbreak', 'rot', 'rust', 'ruined', 'dead', 
        'crop loss', 'loss', 'water', 'scarcity', 'failure', 'die', 'dying',
        'emergency', 'critical', 'danger', 'crisis', 'urgent', 'disaster', 'damage'
    ];
    
    const hasUrgentKeyword = criticalKeywords.some(keyword => query.includes(keyword));
    
    if (hasUrgentKeyword) {
        // Automatic report insertion in fallback mode
        try {
            const title = `🚨 Auto-Alert: Farm issue reported via AI Chatbot`;
            const description = message;
            const location = 'Local woreda / region';
            const severity = 'high';
            
            // Create prioritized problem report
            const [result] = await pool.query(
                'INSERT INTO problem_reports (title, description, location, severity, is_prioritized, user_id) VALUES (?, ?, ?, ?, 1, ?)',
                [title, description, location, severity, user.id]
            );
            
            // Notify all super admins
            const [superAdmins] = await pool.query("SELECT id FROM users WHERE role = 'super_admin'");
            for (const admin of superAdmins) {
                await pool.query(
                    'INSERT INTO notifications (user_id, message) VALUES (?, ?)',
                    [admin.id, `🚨 CHATBOT AUTO-ALERT: High-priority issue reported by ${user.first_name} ${user.last_name} (${user.role}). Title: "${title}"`]
                );
            }
            
            // Notify branch admins
            if (user.branch_id) {
                const [branchAdmins] = await pool.query(
                    "SELECT id FROM users WHERE role = 'branch_admin' AND branch_id = ?",
                    [user.branch_id]
                );
                for (const admin of branchAdmins) {
                    await pool.query(
                        'INSERT INTO notifications (user_id, message) VALUES (?, ?)',
                        [admin.id, `🚨 CHATBOT AUTO-ALERT IN YOUR BRANCH: "${title}"`]
                    );
                }
            }
            
            return {
                reply: `🚨 **AI Auto-Alert Generated**: I detected a farm emergency in your message. I have automatically filed a high-priority problem report to the Super Admin and your Branch Admin. They have been notified to review this immediately. Under current conditions, we suggest isolating affected crops and monitoring local swarm/weather alerts.`,
                is_problem: true,
                report_id: result.insertId
            };
        } catch (dbError) {
            console.error('Failed to auto-create report in fallback mode:', dbError);
        }
    }
    
    // Non-emergency standard fallback responses (supporting general agricultural queries)
    let reply = `🤖 **DeepSeek AI Fallback**: Thank you for your question. I am ready to help you with anything related to East African agriculture! `;
    
    if (query.includes('teff') || query.includes('grain')) {
        reply += `🌾 **Teff Cultivation Guide**: Teff grains thrive in temperatures between 10°C and 27°C. Sowing should coincide with the beginning of the main rainy season (mid-July). Ensure the soil is fine and well-packed. For highland zones, beware of grasshoppers and waterlogging.`;
    } else if (query.includes('coffee')) {
        reply += `☕ **Highland Arabica Guide**: Ethiopian coffee grows best at altitudes between 1500m and 2200m under shaded canopies. Keep a sharp eye out for Coffee Berry Disease (dark sunken lesions). To protect yields, maintain regular organic pruning and spacing.`;
    } else if (query.includes('warning') || query.includes('alert')) {
        reply += `⚠️ **Threat Warnings**: Active warning posts are pushed directly by Super Admins. They highlight regional threats like locust swarms, sudden floods, and wildfire hazards. Warnings published within the last 7 days are featured at the top of your dashboard.`;
    } else if (query.includes('hello') || query.includes('hi') || query.includes('hey')) {
        reply = `👋 Hello ${user.first_name}! I am your DeepSeek AI Agro-Assistant. Ask me any question about highland crops (Teff, Coffee), pest management, weather alerts, or let me know if you have an active crop problem so I can alert the higher-ups immediately!`;
    } else {
        reply += `I have parsed your query: "${message}". If you are experiencing a crop failure or pest infestation, mention it here (e.g. keywords like "pest", "disease", "rust", or "damage") and I will immediately escalate it to the Super Admin.`;
    }
    
    return {
        reply,
        is_problem: false
    };
}

const faqController = {
    // Generative AI chat endpoint using DeepSeek API
    async askAI(req, res) {
        try {
            const { message } = req.body;
            
            if (!message || message.trim() === '') {
                return res.status(400).json({ success: false, message: 'Message is required' });
            }

            const apiKey = process.env.DEEPSEEK_API_KEY;

            if (!apiKey || apiKey.trim() === '') {
                console.log('DeepSeek API key is not configured. Falling back to local heuristic response.');
                const result = await getLocalResponseAndNotify(message, req.user);
                return res.json({ 
                    success: true, 
                    reply: result.reply, 
                    is_problem: result.is_problem,
                    source: 'fallback' 
                });
            }

            // Build request to DeepSeek Chat Completions API
            const url = 'https://api.deepseek.com/chat/completions';
            
            const systemInstruction = 
                "You are the DeepSeek AI Agro-Assistant for the 'Easy Farming' platform. " +
                "Your task is to provide highly accurate, friendly, and practical agricultural and general advice to farmers and specialists. " +
                "You can answer any questions, including general queries, crop sciences, local tips, and platform instructions. " +
                "\n\n" +
                "CRITICAL SYSTEM CAPABILITY: EMERGENCY AUTO-ALERT\n" +
                "If the user is describing or reporting an active agricultural issue, problem, disaster, crop failure, disease outbreak (e.g., rust, rot, coffee berry disease), pest infestation (e.g., locust swarm, grasshoppers), or requests to report an issue, you MUST trigger an emergency alert. " +
                "In these cases, you must return a strictly formatted JSON object:\n" +
                "{\n" +
                "  \"reply\": \"A helpful conversational reply answering their concern and clearly confirming that you have logged a high-priority report for the Super Admins to review and intervene.\",\n" +
                "  \"is_problem\": true,\n" +
                "  \"problem_details\": {\n" +
                "    \"title\": \"A short, clean, descriptive title of the issue (e.g., 'Locust Swarm in Highland Woreda')\",\n" +
                "    \"description\": \"A professional and clear description of the problem extracted from the user's input.\",\n" +
                "    \"location\": \"The location or woreda if mentioned, or 'Unknown' otherwise.\",\n" +
                "    \"severity\": \"one of 'low', 'medium', 'high', 'critical'\"\n" +
                "  }\n" +
                "}\n" +
                "\n" +
                "If the user is NOT describing an active crop issue or reporting a farm problem, return a JSON object:\n" +
                "{\n" +
                "  \"reply\": \"Your rich, helpful conversational reply answering their question...\",\n" +
                "  \"is_problem\": false\n" +
                "}\n" +
                "\n" +
                "ALWAYS respond with a VALID JSON object in this exact schema, and nothing else. Do not wrap it in markdown code blocks like ```json ... ```.";

            const payload = {
                model: 'deepseek-chat',
                messages: [
                    { role: 'system', content: systemInstruction },
                    { role: 'user', content: message }
                ],
                temperature: 0.7,
                max_tokens: 800
            };

            const response = await axios.post(url, payload, {
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                timeout: 10000 // 10 seconds timeout
            });

            if (response.data && response.data.choices && response.data.choices.length > 0) {
                let responseText = response.data.choices[0].message.content.trim();
                
                // Strip markdown JSON wrappers if present
                if (responseText.startsWith('```')) {
                    responseText = responseText
                        .replace(/^```json\s*/i, '')
                        .replace(/^```\s*/, '')
                        .replace(/\s*```$/, '');
                }
                
                let parsedResult;
                try {
                    parsedResult = JSON.parse(responseText);
                } catch (parseErr) {
                    console.error('Failed to parse DeepSeek response as JSON. Treating as raw text.', parseErr);
                    parsedResult = {
                        reply: responseText,
                        is_problem: false
                    };
                }

                if (parsedResult.is_problem && parsedResult.problem_details) {
                    const { title, description, location, severity } = parsedResult.problem_details;
                    
                    // Create prioritized problem report in DB
                    const [result] = await pool.query(
                        'INSERT INTO problem_reports (title, description, location, severity, is_prioritized, user_id) VALUES (?, ?, ?, ?, 1, ?)',
                        [title || 'AI Chatbot Alert', description || message, location || 'Unknown', severity || 'high', req.user.id]
                    );

                    // Notify all super admins
                    const [superAdmins] = await pool.query("SELECT id FROM users WHERE role = 'super_admin'");
                    for (const admin of superAdmins) {
                        await pool.query(
                            'INSERT INTO notifications (user_id, message) VALUES (?, ?)',
                            [admin.id, `🚨 CHATBOT AUTO-ALERT: High-priority issue reported by ${req.user.first_name} ${req.user.last_name} (${req.user.role}). Title: "${title}"`]
                        );
                    }

                    // Notify branch admins
                    if (req.user.branch_id) {
                        const [branchAdmins] = await pool.query(
                            "SELECT id FROM users WHERE role = 'branch_admin' AND branch_id = ?",
                            [req.user.branch_id]
                        );
                        for (const admin of branchAdmins) {
                            await pool.query(
                                'INSERT INTO notifications (user_id, message) VALUES (?, ?)',
                                [admin.id, `🚨 CHATBOT AUTO-ALERT IN YOUR BRANCH: "${title}"`]
                            );
                        }
                    }

                    return res.json({
                        success: true,
                        reply: parsedResult.reply,
                        is_problem: true,
                        report_id: result.insertId,
                        source: 'deepseek'
                    });
                }

                return res.json({ 
                    success: true, 
                    reply: parsedResult.reply, 
                    is_problem: false,
                    source: 'deepseek' 
                });

            } else {
                throw new Error('Invalid response structure from DeepSeek API');
            }

        } catch (error) {
            console.error('DeepSeek API request failed:', error.message);
            // Fallback gracefully on API errors
            const result = await getLocalResponseAndNotify(req.body.message || '', req.user);
            return res.json({ 
                success: true, 
                reply: result.reply, 
                is_problem: result.is_problem,
                source: 'fallback-error',
                error: error.message 
            });
        }
    }
};

module.exports = faqController;
