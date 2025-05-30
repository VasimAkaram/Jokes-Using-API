const jokeText = document.getElementById('joke-text');
const getJokeBtn = document.getElementById('get-joke-btn');
const languageToggle = document.getElementById('language-toggle');
let isHindi = true; // Default language is Hindi

// Function to update UI text based on language
const updateUILanguage = () => {
    const langText = languageToggle.querySelector('.lang-text');
    if (isHindi) {
        langText.innerHTML = '🇬🇧 Show in English';
        getJokeBtn.textContent = 'नए जोक्स दिखाएं';
    } else {
        langText.innerHTML = '🇮🇳 हिंदी में दिखाएं';
        getJokeBtn.textContent = 'Get New Jokes';
    }
};

// Function to set loading state
const setLoading = (loading) => {
    if (loading) {
        getJokeBtn.classList.add('loading');
        getJokeBtn.disabled = true;
        jokeText.textContent = isHindi ? 'नए जोक्स लोड हो रहे हैं...' : 'Loading new jokes...';
    } else {
        getJokeBtn.classList.remove('loading');
        getJokeBtn.disabled = false;
    }
};

// Hindi backup jokes
const hindiJokes = [
    "टीचर: तुम्हारा होमवर्क कहाँ है?\nस्टूडेंट: वो कुत्ता खा गया।\nटीचर: बकवास मत करो!\nस्टूडेंट: सच में मैडम, मैंने लिखा था की 2+2=5, तो कुत्ते ने सोचा गलत है और खा गया!",
    "पति (फोन पर): डार्लिंग, मैं तुम्हें एक बुरी खबर और एक अच्छी खबर देना चाहता हूं।\nपत्नी: पहले अच्छी खबर बताओ।\nपति: एयरबैग काम कर रहा था!",
    "डॉक्टर: आपको रोज सुबह उठकर एक गिलास गरम पानी पीना है।\nमरीज: मैं पिछले 6 महीने से यही कर रहा हूं।\nडॉक्टर: फिर क्या हुआ?\nमरीज: अब बाथरूम में बाल्टी नहीं भरती।",
    "संता: यार तुम इतने मोटे कैसे हो गए?\nबंता: मैं गूगल पर सर्च करता हूं।\nसंता: वो कैसे?\nबंता: हर बार गूगल कहता है कि कुकीज़ को एक्सेप्ट करो!",
    "पप्पू: डॉक्टर साहब, मैं सो नहीं पाता।\nडॉक्टर: क्यों?\nपप्पू: रात को नींद आ जाती है।",
    "टीचर: बताओ, दुनिया का सबसे बुद्धिमान जानवर कौन है?\nस्टूडेंट: मछली!\nटीचर: वो कैसे?\nस्टूडेंट: क्योंकि वो कभी अपना मुंह नहीं खोलती!"
];

// English backup jokes
const englishJokes = [
    "Why do programmers prefer dark mode? Because light attracts bugs!",
    "What did the JSON say to the JavaScript? You complete me!",
    "Why do programmers always mix up Halloween and Christmas? Because Oct 31 equals Dec 25!",
    "Why did the programmer go broke? Because he used up all his cache!",
    "What's a programmer's favorite place in the house? The function room!",
    "Why did the developer quit his job? Because he didn't get arrays!"
];

// Function to get random backup jokes
const getRandomBackupJokes = (count = 3) => {
    const jokeArray = isHindi ? hindiJokes : englishJokes;
    const shuffled = [...jokeArray].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count).map(joke => ({ joke }));
};

// Common translations mapping for fallback
const commonTranslations = {
    'en-hi': {
        'Why': 'क्यों',
        'What': 'क्या',
        'How': 'कैसे',
        'programmer': 'प्रोग्रामर',
        'developer': 'डेवलपर',
        'because': 'क्योंकि',
        'software': 'सॉफ्टवेयर',
        'computer': 'कंप्यूटर'
    },
    'hi-en': {
        'क्यों': 'Why',
        'क्या': 'What',
        'कैसे': 'How',
        'प्रोग्रामर': 'programmer',
        'डेवलपर': 'developer',
        'क्योंकि': 'because',
        'सॉफ्टवेयर': 'software',
        'कंप्यूटर': 'computer'
    }
};

// Translation cache and rate limiting management
const translationManager = {
    cache: new Map(),
    requestsInLastHour: 0,
    hourlyLimit: 50,
    lastReset: Date.now(),
    queue: [],
    isProcessing: false,
    lastRequestTime: 0,
    minDelayBetweenRequests: 5000, // Increased to 5 seconds minimum

    getCacheKey(text, targetLang) {
        return `${text}:${targetLang}`;
    },

    async add(text, targetLang) {
        const cacheKey = this.getCacheKey(text, targetLang);
        
        // Check cache first
        if (this.cache.has(cacheKey)) {
            console.log('Using cached translation');
            return this.cache.get(cacheKey);
        }

        return new Promise((resolve) => {
            this.queue.push({ text, targetLang, resolve });
            this.processQueue();
        });
    },

    resetHourlyCounter() {
        const now = Date.now();
        if (now - this.lastReset >= 3600000) { // 1 hour
            this.requestsInLastHour = 0;
            this.lastReset = now;
        }
    },

    async processQueue() {
        if (this.isProcessing || this.queue.length === 0) return;
        this.isProcessing = true;

        while (this.queue.length > 0) {
            this.resetHourlyCounter();
            
            // Check if we've hit the hourly limit
            if (this.requestsInLastHour >= this.hourlyLimit) {
                console.log('Hourly limit reached, using fallback translations');
                // Process remaining queue with fallback translations
                while (this.queue.length > 0) {
                    const { text, targetLang, resolve } = this.queue.shift();
                    resolve(this.getFallbackTranslation(text, targetLang));
                }
                break;
            }

            const timeSinceLastRequest = Date.now() - this.lastRequestTime;
            if (timeSinceLastRequest < this.minDelayBetweenRequests) {
                await new Promise(resolve => 
                    setTimeout(resolve, this.minDelayBetweenRequests - timeSinceLastRequest)
                );
            }

            const { text, targetLang, resolve } = this.queue.shift();
            const result = await this.executeTranslation(text, targetLang);
            
            // Cache the result
            const cacheKey = this.getCacheKey(text, targetLang);
            this.cache.set(cacheKey, result);
            
            resolve(result);
            this.lastRequestTime = Date.now();
        }

        this.isProcessing = false;
    },

    async executeTranslation(text, targetLang) {
        const maxRetries = 2; // Reduced retries
        const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
        
        for (let attempt = 0; attempt < maxRetries; attempt++) {
            try {
                // Check hourly limit before making request
                if (this.requestsInLastHour >= this.hourlyLimit) {
                    return this.getFallbackTranslation(text, targetLang);
                }

                const response = await fetch(
                    `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${targetLang === 'hi' ? 'en|hi' : 'hi|en'}`,
                    { timeout: 5000 }
                );
                
                this.requestsInLastHour++;
                
                if (response.status === 429) {
                    // If rate limited, immediately use fallback
                    return this.getFallbackTranslation(text, targetLang);
                }
                
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                
                const data = await response.json();
                
                if (data.responseStatus === 200 && data.responseData.translatedText) {
                    return data.responseData.translatedText;
                }
                
                throw new Error('Translation response not valid');
                
            } catch (error) {
                console.warn(`Translation attempt ${attempt + 1} failed:`, error);
                
                if (attempt === maxRetries - 1) {
                    return this.getFallbackTranslation(text, targetLang);
                }
                
                await delay(5000 * (attempt + 1)); // Increased delay between retries
            }
        }
        
        return this.getFallbackTranslation(text, targetLang);
    },

    getFallbackTranslation(text, targetLang) {
        const direction = targetLang === 'hi' ? 'en-hi' : 'hi-en';
        const translations = commonTranslations[direction];
        
        let fallbackText = text;
        for (const [key, value] of Object.entries(translations)) {
            fallbackText = fallbackText.replace(new RegExp(key, 'gi'), value);
        }
        
        console.log('Using fallback translation');
        return fallbackText;
    }
};

// Function to translate text
const translateText = async (text, targetLang) => {
    return translationManager.add(text, targetLang);
};

// Function to format jokes for display
const formatJokes = (jokes) => {
    return jokes.map(joke => {
        return `
            <div class="joke-item" style="margin-bottom: 25px; padding: 20px; background: #ffffff; border-radius: 12px; box-shadow: 0 3px 10px rgba(0,0,0,0.1); transition: all 0.3s ease;">
                <div style="font-size: 1.2em; color: #2d3436; line-height: 1.6;">
                    ${joke.joke}
                </div>
            </div>
        `;
    }).join('');
};

// Function to fetch and process jokes
const fetchJokes = async (count = 3) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    try {
        const promises = Array(count).fill().map(async () => {
            try {
                const response = await fetch(
                    'https://v2.jokeapi.dev/joke/Any?blacklistFlags=nsfw,religious,political,racist,sexist,explicit&type=single',
                    { signal: controller.signal }
                );

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const data = await response.json();
                const joke = data.joke || "Why did the programmer quit his job? Because he didn't get arrays!";
                
                // Translate if Hindi is selected
                return {
                    joke: isHindi ? await translateText(joke, 'hi') : joke
                };
            } catch (error) {
                console.warn('Individual joke fetch failed:', error);
                return null;
            }
        });

        const results = await Promise.all(promises);
        clearTimeout(timeoutId);
        
        return results.filter(result => result !== null);
    } catch (error) {
        clearTimeout(timeoutId);
        console.error('Fetch error:', error);
        return [];
    }
};

// Function to display jokes with animation
const displayJokes = (jokes) => {
    jokeText.innerHTML = `
        <div class="jokes-container" style="opacity: 0; transform: translateY(20px); transition: all 0.5s ease;">
            ${formatJokes(jokes)}
        </div>
    `;

    requestAnimationFrame(() => {
        const container = jokeText.querySelector('.jokes-container');
        if (container) {
            container.style.opacity = '1';
            container.style.transform = 'translateY(0)';
        }
    });
};

// Main function to get and display jokes
const getJoke = async () => {
    try {
        setLoading(true);
        let jokes = await fetchJokes(3);
        
        if (!jokes || jokes.length === 0) {
            jokes = getRandomBackupJokes(3);
        }

        displayJokes(jokes);
    } catch (error) {
        console.error('Error in joke display:', error);
        displayJokes(getRandomBackupJokes(3));
    } finally {
        setLoading(false);
    }
};

// Language toggle handler
languageToggle.addEventListener('click', async () => {
    isHindi = !isHindi;
    updateUILanguage();
    getJoke();
});

// Add hover effect to joke items using event delegation
document.addEventListener('mouseover', (e) => {
    const jokeItem = e.target.closest('.joke-item');
    if (jokeItem) {
        jokeItem.style.transform = 'translateY(-2px)';
        jokeItem.style.boxShadow = '0 5px 15px rgba(0,0,0,0.15)';
    }
}, { passive: true });

document.addEventListener('mouseout', (e) => {
    const jokeItem = e.target.closest('.joke-item');
    if (jokeItem) {
        jokeItem.style.transform = 'translateY(0)';
        jokeItem.style.boxShadow = '0 3px 10px rgba(0,0,0,0.1)';
    }
}, { passive: true });

// Add click animation to button
getJokeBtn.addEventListener('mousedown', () => {
    getJokeBtn.style.transform = 'scale(0.95)';
}, { passive: true });

getJokeBtn.addEventListener('mouseup', () => {
    getJokeBtn.style.transform = 'scale(1)';
}, { passive: true });

// Event listener for joke button
getJokeBtn.addEventListener('click', getJoke);

// Initialize UI language
updateUILanguage();

// Get initial jokes
getJoke(); 

//this code is working good  not edit it now