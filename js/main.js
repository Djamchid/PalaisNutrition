/**
 * Le Palais Impérial de la Nutrition
 * Fichier JavaScript principal
 * Contient la logique du jeu, la gestion des écrans et des mini-jeux
 */

// IIFE pour encapsuler le code et éviter les variables globales
(function() {
    // ================================
    // INITIALISATION ET CONFIGURATION
    // ================================
    
    // Configuration du jeu
    const GAME_CONFIG = {
        // Durée totale cible en secondes
        targetDuration: 900, // 15 minutes
        
        // Points
        pointsPerCorrectAction: 10,
        pointsPerError: -5,
        
        // Seuils d'étoiles par chapitre (en pourcentage)
        starThresholds: [70, 85, 95],
        
        // Audio
        audio: {
            bgMusic: 'assets/audio/background.mp3',
            success: 'assets/audio/success.mp3',
            error: 'assets/audio/error.mp3',
            click: 'assets/audio/click.mp3'
        }
    };
    
    // Exposer la configuration pour les autres modules
    window.GAME_CONFIG = GAME_CONFIG;
    
    // État du jeu
    let gameState = {
        currentScreen: 'title-screen',
        score: 0,
        chapters: {
            ministers: { completed: false, score: 0, maxScore: 0, stars: 0 },
            guardians: { completed: false, score: 0, maxScore: 0, stars: 0 },
            balance: { completed: false, score: 0, maxScore: 0, stars: 0 },
            invaders: { completed: false, score: 0, maxScore: 0, stars: 0 },
            wisdom: { completed: false, score: 0, maxScore: 0, stars: 0 }
        },
        badges: {
            ministers: false,
            guardians: false,
            balance: false,
            invaders: false,
            wisdom: false,
            bilingual: false
        },
        lang: localStorage.getItem('nin_palace.lang') || 'fr',
        completedLanguages: new Set()
    };
    
    // ================================
    // GESTION DES ÉCRANS
    // ================================
    
    // Fonction pour changer d'écran
    function showScreen(screenId) {
        // Cacher tous les écrans
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
        
        // Afficher l'écran demandé
        const screen = document.getElementById(screenId);
        if (screen) {
            screen.classList.add('active');
            gameState.currentScreen = screenId;
            
            // Initialiser l'écran si nécessaire
            switch(screenId) {
                case 'welcome-screen':
                    initWelcomeScreen();
                    break;
                case 'ministers-screen':
                    initMinistersScreen();
                    break;
                case 'guardians-screen':
                    initGuardiansScreen();
                    break;
                case 'balance-screen':
                    initBalanceScreen();
                    break;
                case 'invaders-screen':
                    initInvadersScreen();
                    break;
                case 'wisdom-screen':
                    initWisdomScreen();
                    break;
                case 'results-screen':
                    initResultsScreen();
                    break;
            }
            
            // Jouer le son de clic
            playSound('click');
        }
    }
    
    // ================================
    // AUDIO
    // ================================
    
    // Initialisation de Howler.js
    let sounds = {};
    
    // Fonction pour charger les sons
    function initSounds() {
        // Charger les sons avec Howler.js
        sounds = {
            bgMusic: new Howl({
                src: [GAME_CONFIG.audio.bgMusic],
                loop: true,
                volume: 0.5
            }),
            success: new Howl({
                src: [GAME_CONFIG.audio.success],
                volume: 0.7
            }),
            error: new Howl({
                src: [GAME_CONFIG.audio.error],
                volume: 0.7
            }),
            click: new Howl({
                src: [GAME_CONFIG.audio.click],
                volume: 0.5
            })
        };
    }
    
    // Fonction pour jouer un son
    function playSound(soundName) {
        if (sounds[soundName]) {
            sounds[soundName].play();
        }
    }
    
    // ================================
    // GESTION DU SCORE ET DES BADGES
    // ================================
    
    // Fonction pour mettre à jour le score
    function updateScore(points, chapter) {
        gameState.score += points;
        
        if (chapter && gameState.chapters[chapter]) {
            gameState.chapters[chapter].score += points;
        }
        
        // Sauvegarder le progrès
        saveProgress();
    }
    
    // Exposer la fonction updateScore pour les autres modules
    window.updateScore = updateScore;
    
    // Fonction pour calculer les étoiles
    function calculateStars(chapter) {
        if (!gameState.chapters[chapter]) return 0;
        
        const chapterState = gameState.chapters[chapter];
        const percentage = (chapterState.score / chapterState.maxScore) * 100;
        
        let stars = 0;
        for (let i = 0; i < GAME_CONFIG.starThresholds.length; i++) {
            if (percentage >= GAME_CONFIG.starThresholds[i]) {
                stars = i + 1;
            } else {
                break;
            }
        }
        
        chapterState.stars = stars;
        return stars;
    }
    
    // Fonction pour vérifier et attribuer les badges
    function checkBadges() {
        // Badge Disciple des Ministres
        gameState.badges.ministers = gameState.chapters.ministers.stars >= 2;
        
        // Badge Œil du Gardien
        gameState.badges.guardians = gameState.chapters.guardians.stars >= 2;
        
        // Badge Maître de l'Harmonie
        gameState.badges.balance = gameState.chapters.balance.stars >= 2;
        
        // Badge Protecteur du Palais
        gameState.badges.invaders = gameState.chapters.invaders.stars >= 2;
        
        // Badge Sage Érudit
        gameState.badges.wisdom = gameState.chapters.wisdom.stars >= 2;
        
        // Badge Sage Bilingue
        gameState.completedLanguages.add(gameState.lang);
        gameState.badges.bilingual = gameState.completedLanguages.size >= 2;
        
        // Sauvegarder les badges
        saveProgress();
    }
    
    // ================================
    // SAUVEGARDE ET CHARGEMENT
    // ================================
    
    // Fonction pour sauvegarder la progression
    function saveProgress() {
        const progressData = {
            chapters: gameState.chapters,
            score: gameState.score,
            badges: gameState.badges,
            completedLanguages: Array.from(gameState.completedLanguages)
        };
        
        localStorage.setItem('nin_palace.progress', JSON.stringify(progressData));
    }
    
    // Fonction pour charger la progression
    function loadProgress() {
        const savedProgress = localStorage.getItem('nin_palace.progress');
        
        if (savedProgress) {
            try {
                const progressData = JSON.parse(savedProgress);
                
                // Restaurer les données
                gameState.chapters = progressData.chapters || gameState.chapters;
                gameState.score = progressData.score || 0;
                gameState.badges = progressData.badges || gameState.badges;
                
                // Restaurer les langues complétées
                if (progressData.completedLanguages) {
                    gameState.completedLanguages = new Set(progressData.completedLanguages);
                }
                
                return true;
            } catch (e) {
                console.error('Erreur lors du chargement de la progression:', e);
                return false;
            }
        }
        
        return false;
    }
    
    // ================================
    // EXPORT CSV
    // ================================
    
    // Fonction pour exporter les résultats en CSV
    function exportResultsToCSV() {
        // Calculer les étoiles totales
        let totalStars = 0;
        for (const chapter in gameState.chapters) {
            totalStars += gameState.chapters[chapter].stars;
        }
        
        // Compter les badges obtenus
        let badgesCount = 0;
        for (const badge in gameState.badges) {
            if (gameState.badges[badge]) badgesCount++;
        }
        
        // Créer un ID anonyme basé sur le timestamp
        const anonymousId = Date.now().toString();
        
        // Créer les données CSV
        const csvData = [
            {
                userID: anonymousId,
                language: gameState.lang,
                totalScore: gameState.score,
                totalStars: totalStars,
                badgesEarned: badgesCount,
                ministersStars: gameState.chapters.ministers.stars,
                guardiansStars: gameState.chapters.guardians.stars,
                balanceStars: gameState.chapters.balance.stars,
                invadersStars: gameState.chapters.invaders.stars,
                wisdomStars: gameState.chapters.wisdom.stars
            }
        ];
        
        // Utiliser PapaParse pour convertir en CSV
        const csv = Papa.unparse(csvData);
        
        // Créer un objet Blob pour le téléchargement
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        
        // Créer un lien de téléchargement
        const link = document.createElement('a');
        link.href = url;
        
        // Format: palace_export_YYYYMMDD-HHmm.csv
        const date = new Date();
        const dateStr = date.getFullYear() +
                      ('0' + (date.getMonth() + 1)).slice(-2) +
                      ('0' + date.getDate()).slice(-2);
        const timeStr = ('0' + date.getHours()).slice(-2) +
                      ('0' + date.getMinutes()).slice(-2);
        
        link.download = `palace_export_${dateStr}-${timeStr}.csv`;
        
        // Cliquer sur le lien pour déclencher le téléchargement
        document.body.appendChild(link);
        link.click();
        
        // Nettoyer
        setTimeout(() => {
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        }, 100);
    }
    
    // ================================
    // ÉCRAN DE TITRE
    // ================================
    
    // Initialisation de l'écran titre
    function initTitleScreen() {
        const startBtn = document.getElementById('start-game');
        if (startBtn) {
            startBtn.addEventListener('click', () => {
                showScreen('welcome-screen');
            });
        }
    }
    
    // ================================
    // ÉCRAN D'ACCUEIL (TUTORIEL)
    // ================================
    
    // Initialisation de l'écran d'accueil
    function initWelcomeScreen() {
        // Initialiser le Grand Sage
        initGrandSage();
        
        const tutorialNextBtn = document.getElementById('tutorial-next');
        if (tutorialNextBtn) {
            tutorialNextBtn.addEventListener('click', () => {
                showScreen('ministers-screen');
            });
        }
    }
    
    // Fonction pour initialiser le Grand Sage
    function initGrandSage() {
        const grandSageContainer = document.getElementById('grand-sage');
        if (!grandSageContainer) return;
        
        // Charger le SVG
        fetch('grand-sage-svg.svg')
            .then(response => {
                if (!response.ok) {
                    throw new Error('Failed to load Grand Sage SVG');
                }
                return response.text();
            })
            .then(svgContent => {
                grandSageContainer.innerHTML = svgContent;
            })
            .catch(error => {
                console.error('Error loading Grand Sage:', error);
                // Fallback display
                grandSageContainer.style.backgroundColor = '#ffcd75';
                grandSageContainer.textContent = '🧙‍♂️';
            });
    }
    
    // ================================
    // CHAPITRE 1: MINISTRES (MACRONUTRIMENTS)
    // ================================
    
    // Données des aliments pour le chapitre des Ministres
    const ministersData = {
        foods: [
            { id: 'food-protein-1', nutrient: 'protein' },
            { id: 'food-protein-2', nutrient: 'protein' },
            { id: 'food-protein-3', nutrient: 'protein' },
            { id: 'food-protein-4', nutrient: 'protein' },
            { id: 'food-carbs-1', nutrient: 'carbs' },
            { id: 'food-carbs-2', nutrient: 'carbs' },
            { id: 'food-carbs-3', nutrient: 'carbs' },
            { id: 'food-carbs-4', nutrient: 'carbs' },
            { id: 'food-fat-1', nutrient: 'fat' },
            { id: 'food-fat-2', nutrient: 'fat' },
            { id: 'food-fat-3', nutrient: 'fat' },
            { id: 'food-fat-4', nutrient: 'fat' }
        ]
    };
    
    // Initialisation du chapitre des Ministres
    function initMinistersScreen() {
        // Réinitialiser le conteneur d'aliments
        const foodContainer = document.querySelector('.food-items-container');
        foodContainer.innerHTML = '';
        
        // Mélanger les aliments
        const shuffledFoods = [...ministersData.foods].sort(() => Math.random() - 0.5);
        
        // Vérifier si i18next est disponible
        if (!window.i18n || !window.i18n.translate) {
            console.error("Le module de traduction n'est pas disponible");
            return;
        }
        
        // Créer et ajouter les éléments d'aliments
        shuffledFoods.forEach(food => {
            const foodElement = document.createElement('div');
            foodElement.className = 'food-item';
            foodElement.setAttribute('draggable', 'true');
            foodElement.setAttribute('data-nutrient', food.nutrient);
            foodElement.setAttribute('data-id', food.id); // Important pour la traduction
            
            // Utiliser la traduction au lieu de l'identifiant
            // Vérifier si la traduction existe
            if (window.i18n.exists && window.i18n.exists(food.id)) {
                foodElement.textContent = window.i18n.translate(food.id);
            } else {
                // Fallback si la traduction n'existe pas
                console.warn(`Traduction non trouvée pour: ${food.id}`);
                // Extraire le nom de l'aliment depuis l'ID (food-protein-1 -> protein 1)
                const nameParts = food.id.split('-');
                if (nameParts.length >= 2) {
                    foodElement.textContent = `${nameParts[1]} ${nameParts[2] || ''}`;
                } else {
                    foodElement.textContent = food.id;
                }
            }
            
            // Ajouter les événements de drag and drop
            foodElement.addEventListener('dragstart', handleDragStart);
            
            foodContainer.appendChild(foodElement);
        });
        
        // Configurer les zones de drop
        const dropZones = document.querySelectorAll('.minister-drop-zone');
        dropZones.forEach(zone => {
            zone.addEventListener('dragover', handleDragOver);
            zone.addEventListener('dragleave', handleDragLeave);
            zone.addEventListener('drop', handleDrop);
            
            // Réinitialiser le contenu des zones
            zone.innerHTML = '';
        });
        
        // Configurer le bouton suivant
        const nextButton = document.getElementById('ministers-next');
        nextButton.addEventListener('click', () => {
            // Calculer les étoiles pour ce chapitre
            calculateStars('ministers');
            showScreen('guardians-screen');
        });
        
        // Réinitialiser le feedback
        const feedbackMessage = document.querySelector('.feedback-message');
        feedbackMessage.textContent = '';
        feedbackMessage.className = 'feedback-message';
        
        // Définir le score maximum possible pour ce chapitre
        gameState.chapters.ministers.maxScore = ministersData.foods.length * GAME_CONFIG.pointsPerCorrectAction;
        
        // Forcer une mise à jour des traductions
        if (window.i18n && window.i18n.updateAllTranslations) {
            window.i18n.updateAllTranslations();
        }
    }
    
    // Gestion du drag and drop pour le chapitre des Ministres
    let draggedItem = null;
    
    function handleDragStart(e) {
        draggedItem = e.target;
        e.dataTransfer.setData('text/plain', ''); // Nécessaire pour Firefox
        setTimeout(() => {
            draggedItem.classList.add('dragging');
        }, 0);
    }
    
    function handleDragOver(e) {
        e.preventDefault();
        e.currentTarget.classList.add('highlight');
    }
    
    function handleDragLeave(e) {
        e.currentTarget.classList.remove('highlight');
    }
    
    function handleDrop(e) {
        e.preventDefault();
        const dropZone = e.currentTarget;
        dropZone.classList.remove('highlight');
        
        if (!draggedItem) return;
        
        const foodNutrient = draggedItem.getAttribute('data-nutrient');
        const ministerNutrient = dropZone.getAttribute('data-nutrient');
        const feedbackMessage = document.querySelector('.feedback-message');
        
        // Vérifier si l'aliment correspond au bon ministre
        if (foodNutrient === ministerNutrient) {
            // Correct
            dropZone.appendChild(draggedItem);
            draggedItem.classList.remove('dragging');
            draggedItem.setAttribute('draggable', 'false');
            
            // Afficher un message de succès
            feedbackMessage.textContent = window.i18n.translateWithVars('ministers-success', { nutrient: window.i18n.translate(foodNutrient) });
            feedbackMessage.className = 'feedback-message success';
            
            // Ajouter des points
            updateScore(GAME_CONFIG.pointsPerCorrectAction, 'ministers');
            
            // Effets visuels et sonores de succès
            createParticles(dropZone);
            playSound('success');
            
        } else {
            // Incorrect
            draggedItem.classList.remove('dragging');
            
            // Afficher un message d'erreur
            feedbackMessage.textContent = window.i18n.translate('ministers-error');
            feedbackMessage.className = 'feedback-message error';
            
            // Retirer des points
            updateScore(GAME_CONFIG.pointsPerError, 'ministers');
            
            // Effet sonore d'erreur
            playSound('error');
        }
        
        draggedItem = null;
    }
    
    // Fonction pour créer des particules sur succès
    function createParticles(element) {
        const rect = element.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        
        for (let i = 0; i < 10; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';
            
            // Position aléatoire autour du centre
            const angle = Math.random() * Math.PI * 2;
            const distance = Math.random() * 50 + 20;
            const x = centerX + Math.cos(angle) * distance;
            const y = centerY + Math.sin(angle) * distance;
            
            particle.style.left = `${x}px`;
            particle.style.top = `${y}px`;
            
            document.body.appendChild(particle);
            
            // Animation
            particle.classList.add('sparkle');
            
            // Supprimer après l'animation
            setTimeout(() => {
                document.body.removeChild(particle);
            }, 600);
        }
    }
    
    // Exposer la fonction createParticles pour les autres modules
    window.createParticles = createParticles;
    
    // ================================
    // CHAPITRE 2: GARDIENS (MICRONUTRIMENTS)
    // ================================
    
    // Données des cartes pour le jeu de mémoire
    const guardiansData = {
        pairs: [
            { symptom: 'symptom-1', vitamin: 'vitamin-1' },
            { symptom: 'symptom-2', vitamin: 'vitamin-2' },
            { symptom: 'symptom-3', vitamin: 'vitamin-3' },
            { symptom: 'symptom-4', vitamin: 'vitamin-4' },
            { symptom: 'symptom-5', vitamin: 'vitamin-5' },
            { symptom: 'symptom-6', vitamin: 'vitamin-6' }
        ]
    };
    
    // Variables pour le jeu de mémoire
    let flippedCards = [];
    let matchedPairs = 0;
    let attempts = 0;
    
    // Initialisation du chapitre des Gardiens
    function initGuardiansScreen() {
        // Réinitialiser les variables
        flippedCards = [];
        matchedPairs = 0;
        attempts = 0;
        
        // Exposer les compteurs pour que i18n puisse les utiliser
        window.attemptsCount = attempts;
        window.matchesCount = matchedPairs;
        
        // Mettre à jour les compteurs
        document.getElementById('attempts').textContent = window.i18n.translateWithVars('attempts', { count: attempts });
        document.getElementById('matches').textContent = window.i18n.translateWithVars('matches', { count: matchedPairs });
        
        // Réinitialiser le conteneur de jeu
        const memoryGame = document.querySelector('.memory-game');
        memoryGame.innerHTML = '';
        
        // Créer un tableau de toutes les cartes (symptômes et vitamines)
        let cards = [];
        guardiansData.pairs.forEach(pair => {
            cards.push({
                id: pair.symptom,
                type: 'symptom',
                pairWith: pair.vitamin
            });
            cards.push({
                id: pair.vitamin,
                type: 'vitamin',
                pairWith: pair.symptom
            });
        });
        
        // Mélanger les cartes
        cards = shuffleArray(cards);
        
        // Créer et ajouter les cartes au jeu
        cards.forEach(card => {
            const cardElement = document.createElement('div');
            cardElement.className = 'memory-card';
            cardElement.setAttribute('data-id', card.id);
            cardElement.setAttribute('data-pair', card.pairWith);
            
            const frontFace = document.createElement('div');
            frontFace.className = 'memory-card-front';
            
            // Utiliser la traduction
            if (window.i18n && window.i18n.translate) {
                frontFace.textContent = window.i18n.translate(card.id);
            } else {
                frontFace.textContent = card.id;
            }
            
            const backFace = document.createElement('div');
            backFace.className = 'memory-card-back';
            
            cardElement.appendChild(frontFace);
            cardElement.appendChild(backFace);
            
            cardElement.addEventListener('click', flipCard);
            
            memoryGame.appendChild(cardElement);
        });
        
        // Configurer le bouton suivant
        const nextButton = document.getElementById('guardians-next');
        nextButton.addEventListener('click', () => {
            // Calculer les étoiles pour ce chapitre
            calculateStars('guardians');
            showScreen('balance-screen');
        });
        
        // Définir le score maximum possible
        // Score parfait = toutes les paires trouvées du premier coup
        gameState.chapters.guardians.maxScore = guardiansData.pairs.length * GAME_CONFIG.pointsPerCorrectAction;
    }
    
    // Fonction pour mélanger un tableau
    function shuffleArray(array) {
        const newArray = [...array];
        for (let i = newArray.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
        }
        return newArray;
    }
    
    // Fonction pour retourner une carte
    function flipCard() {
        const card = this;
        
        // Ne rien faire si la carte est déjà retournée ou si deux cartes sont déjà retournées
        if (card.classList.contains('flipped') || flippedCards.length >= 2) return;
        
        // Retourner la carte
        card.classList.add('flipped');
        flippedCards.push(card);
        
        playSound('click');
        
        // Si deux cartes sont retournées, vérifier si elles forment une paire
        if (flippedCards.length === 2) {
            attempts++;
            window.attemptsCount = attempts; // Mettre à jour la variable globale
            document.getElementById('attempts').textContent = window.i18n.translateWithVars('attempts', { count: attempts });
            
            const card1 = flippedCards[0];
            const card2 = flippedCards[1];
            
            const id1 = card1.getAttribute('data-id');
            const id2 = card2.getAttribute('data-id');
            const pair1 = card1.getAttribute('data-pair');
            const pair2 = card2.getAttribute('data-pair');
            
            if ((id1 === pair2 && id2 === pair1) || (id2 === pair1 && id1 === pair2)) {
                // Match trouvé
                matchedPairs++;
                window.matchesCount = matchedPairs; // Mettre à jour la variable globale
                document.getElementById('matches').textContent = window.i18n.translateWithVars('matches', { count: matchedPairs });
                
                // Ajouter des points
                updateScore(GAME_CONFIG.pointsPerCorrectAction, 'guardians');
                
                // Désactiver les cartes appariées
                card1.classList.add('matched');
                card2.classList.add('matched');
                card1.removeEventListener('click', flipCard);
                card2.removeEventListener('click', flipCard);
                
                // Effets de succès
                createParticles(card1);
                createParticles(card2);
                playSound('success');
                
                // Réinitialiser les cartes retournées
                flippedCards = [];
                
                // Vérifier si toutes les paires ont été trouvées
                if (matchedPairs === guardiansData.pairs.length) {
                    // Attribution du badge si toutes les paires sont trouvées avec peu d'erreurs
                    if (attempts <= guardiansData.pairs.length + 3) {
                        gameState.badges.guardians = true;
                        saveProgress();
                    }
                }
            } else {
                // Pas de match
                setTimeout(() => {
                    card1.classList.remove('flipped');
                    card2.classList.remove('flipped');
                    flippedCards = [];
                    
                    // Retirer des points
                    updateScore(GAME_CONFIG.pointsPerError, 'guardians');
                    
                    playSound('error');
                }, 1000);
            }
        }
    }
    
    // ================================
    // CHAPITRE 3: ÉQUILIBRE DU ROYAUME
    // ================================
    
    // Données des aliments pour le chapitre Équilibre
    const balanceData = {
        foods: [
            { id: 'element-wood-1', element: 'wood', macros: { protein: 1, carbs: 2, fat: 0 } },
            { id: 'element-wood-2', element: 'wood', macros: { protein: 0, carbs: 1, fat: 0 } },
            { id: 'element-wood-3', element: 'wood', macros: { protein: 0, carbs: 0, fat: 0 } },
            { id: 'element-fire-1', element: 'fire', macros: { protein: 0, carbs: 1, fat: 0 } },
            { id: 'element-fire-2', element: 'fire', macros: { protein: 0, carbs: 1, fat: 0 } },
            { id: 'element-fire-3', element: 'fire', macros: { protein: 0, carbs: 0, fat: 0 } },
            { id: 'element-earth-1', element: 'earth', macros: { protein: 1, carbs: 3, fat: 0 } },
            { id: 'element-earth-2', element: 'earth', macros: { protein: 1, carbs: 4, fat: 1 } },
            { id: 'element-earth-3', element: 'earth', macros: { protein: 0, carbs: 2, fat: 0 } },
            { id: 'element-metal-1', element: 'metal', macros: { protein: 0, carbs: 1, fat: 0 } },
            { id: 'element-metal-2', element: 'metal', macros: { protein: 0, carbs: 1, fat: 0 } },
            { id: 'element-metal-3', element: 'metal', macros: { protein: 0, carbs: 2, fat: 0 } },
            { id: 'element-water-1', element: 'water', macros: { protein: 1, carbs: 0, fat: 0 } },
            { id: 'element-water-2', element: 'water', macros: { protein: 5, carbs: 0, fat: 2 } },
            { id: 'element-water-3', element: 'water', macros: { protein: 3, carbs: 2, fat: 0 } }
        ]
    };
    
    // Initialisation du chapitre Équilibre
    function initBalanceScreen() {
        // Réinitialiser le conteneur d'aliments
        const foodContainer = document.querySelector('.balance-food-items');
        foodContainer.innerHTML = '';
        
        // Mélanger les aliments
        const shuffledFoods = shuffleArray(balanceData.foods);
        
        // Créer et ajouter les éléments d'aliments
        shuffledFoods.forEach(food => {
            const foodElement = document.createElement('div');
            foodElement.className = 'food-item';
            foodElement.setAttribute('draggable', 'true');
            foodElement.setAttribute('data-id', food.id);
            foodElement.setAttribute('data-element', food.element);
            
            // CORRECTION: Utiliser correctement la traduction au lieu de l'identifiant
            if (window.i18n && window.i18n.translate) {
                foodElement.textContent = window.i18n.translate(food.id);
            } else {
                // Fallback si i18n n'est pas disponible
                foodElement.textContent = food.id;
            }
            
            // Stocker les macros dans des attributs data
            foodElement.setAttribute('data-protein', food.macros.protein);
            foodElement.setAttribute('data-carbs', food.macros.carbs);
            foodElement.setAttribute('data-fat', food.macros.fat);
            
            // Ajouter les événements de drag and drop
            foodElement.addEventListener('dragstart', handleBalanceDragStart);
            
            foodContainer.appendChild(foodElement);
        });
        
        // Configurer les zones de drop
        const dropZones = document.querySelectorAll('.element-drop-zone');
        dropZones.forEach(zone => {
            zone.addEventListener('dragover', handleBalanceDragOver);
            zone.addEventListener('dragleave', handleBalanceDragLeave);
            zone.addEventListener('drop', handleBalanceDrop);
            
            // Réinitialiser le contenu des zones
            zone.innerHTML = '';
        });
        
        // Configurer le bouton de vérification d'équilibre
        const checkBalanceBtn = document.getElementById('check-balance');
        checkBalanceBtn.addEventListener('click', checkNutritionalBalance);
        
        // Configurer le bouton suivant
        const nextButton = document.getElementById('balance-next');
        nextButton.addEventListener('click', () => {
            // Calculer les étoiles pour ce chapitre
            calculateStars('balance');
            showScreen('invaders-screen');
        });
        
        // Réinitialiser le feedback
        const balanceFeedback = document.querySelector('.balance-feedback');
        balanceFeedback.textContent = '';
        
        // Définir le score maximum possible
        gameState.chapters.balance.maxScore = 100; // Valeur arbitraire pour ce mini-jeu
        
        // CORRECTION: Forcer une mise à jour des traductions APRÈS l'initialisation
        if (window.i18n && window.i18n.updateAllTranslations) {
            window.i18n.updateAllTranslations();
        }
    }
    
    // Variables pour le drag and drop du chapitre Équilibre
    let balanceDraggedItem = null;
    
    function handleBalanceDragStart(e) {
        balanceDraggedItem = e.target;
        e.dataTransfer.setData('text/plain', '');
        setTimeout(() => {
            balanceDraggedItem.classList.add('dragging');
        }, 0);
    }
    
    function handleBalanceDragOver(e) {
        e.preventDefault();
        e.currentTarget.classList.add('highlight');
    }
    
    function handleBalanceDragLeave(e) {
        e.currentTarget.classList.remove('highlight');
    }
    
    function handleBalanceDrop(e) {
        e.preventDefault();
        const dropZone = e.currentTarget;
        dropZone.classList.remove('highlight');
        
        if (!balanceDraggedItem) return;
        
        // Vérifier si la zone a déjà un aliment
        if (dropZone.firstChild) {
            // Retirer l'ancien aliment et le remettre dans le conteneur
            const oldFood = dropZone.firstChild;
            oldFood.setAttribute('draggable', 'true');
            oldFood.addEventListener('dragstart', handleBalanceDragStart);
            dropZone.removeChild(oldFood);
            document.querySelector('.balance-food-items').appendChild(oldFood);
        }
        
        // Placer le nouvel aliment dans la zone
        dropZone.appendChild(balanceDraggedItem);
        balanceDraggedItem.classList.remove('dragging');
        balanceDraggedItem.setAttribute('draggable', 'false');
        
        // Jouer un son
        playSound('click');
        
        balanceDraggedItem = null;
    }
    
    // Fonction pour vérifier l'équilibre nutritionnel
    function checkNutritionalBalance() {
        const dropZones = document.querySelectorAll('.element-drop-zone');
        const balanceFeedback = document.querySelector('.balance-feedback');
        
        // Vérifier si toutes les zones sont remplies
        let allFilled = true;
        let totalProtein = 0;
        let totalCarbs = 0;
        let totalFat = 0;
        let elementsUsed = new Set();
        
        dropZones.forEach(zone => {
            if (!zone.firstChild) {
                allFilled = false;
                return;
            }
            
            const food = zone.firstChild;
            const element = food.getAttribute('data-element');
            elementsUsed.add(element);
            
            // Additionner les macros
            totalProtein += parseInt(food.getAttribute('data-protein') || 0);
            totalCarbs += parseInt(food.getAttribute('data-carbs') || 0);
            totalFat += parseInt(food.getAttribute('data-fat') || 0);
        });
        
        if (!allFilled) {
            balanceFeedback.textContent = window.i18n.translate('balance-error');
            playSound('error');
            return;
        }
        
        // Vérifier si tous les éléments sont différents
        const allDifferentElements = elementsUsed.size === 5;
        
        // Vérifier l'équilibre des macros (ratio simplifié)
        // Idéal: Protéines 20-30%, Glucides 45-65%, Lipides 20-35%
        const totalNutrients = totalProtein + totalCarbs + totalFat;
        const proteinRatio = totalProtein / totalNutrients;
        const carbsRatio = totalCarbs / totalNutrients;
        const fatRatio = totalFat / totalNutrients;
        
        const isBalanced = (
            proteinRatio >= 0.15 && proteinRatio <= 0.35 &&
            carbsRatio >= 0.4 && carbsRatio <= 0.7 &&
            fatRatio >= 0.15 && fatRatio <= 0.4
        );
        
        if (isBalanced && allDifferentElements) {
            // Parfaitement équilibré
            balanceFeedback.textContent = window.i18n.translate('balance-success');
            updateScore(GAME_CONFIG.pointsPerCorrectAction * 5, 'balance');
            
            // Effets de succès
            dropZones.forEach(zone => createParticles(zone));
            playSound('success');
            
            // Attribuer le badge
            gameState.badges.balance = true;
            saveProgress();
        } else if (isBalanced) {
            // Macros équilibrés mais pas tous les éléments
            balanceFeedback.textContent = window.i18n.translate('balance-partial');
            updateScore(GAME_CONFIG.pointsPerCorrectAction * 2, 'balance');
            playSound('click');
        } else {
            // Déséquilibré
            balanceFeedback.textContent = window.i18n.translate('balance-error');
            playSound('error');
        }
    }
    
    // ================================
    // CHAPITRE 4: ENVAHISSEURS (ALIMENTS TRANSFORMÉS)
    // ================================
    
    // Données des aliments pour le chapitre Envahisseurs
    const invadersData = {
        foods: [
            {
                id: 'natural-yogurt',
                image: 'yogurt.png',
                ingredients: ['lait entier', 'ferments lactiques'],
                processed: false
            },
            {
                id: 'cereal-bar',
                image: 'cereal-bar.png',
                ingredients: ['sirop de glucose-fructose', 'sucre', 'huile de palme', 'farine de blé', 'arômes artificiels', 'émulsifiants E471, E472'],
                processed: true
            },
            {
                id: 'apple',
                image: 'apple.png',
                ingredients: ['pomme'],
                processed: false
            },
            {
                id: 'soda',
                image: 'soda.png',
                ingredients: ['eau gazéifiée', 'sirop de maïs à haute teneur en fructose', 'caramel (E150d)', 'acide phosphorique', 'arômes naturels', 'caféine'],
                processed: true
            },
            {
                id: 'bread',
                image: 'bread.png',
                ingredients: ['farine de blé', 'eau', 'levure', 'sel'],
                processed: false
            },
            {
                id: 'chicken-nuggets',
                image: 'chicken-nuggets.png',
                ingredients: ['viande séparée mécaniquement de poulet (45%)', 'eau', 'huile de palme', 'farine de blé', 'amidon modifié', 'sel', 'exhausteurs de goût (E621)', 'conservateurs (E450, E451)', 'arômes'],
                processed: true
            },
            {
                id: 'tofu',
                image: 'tofu.png',
                ingredients: ['soja', 'eau', 'nigari (chlorure de magnésium)'],
                processed: false
            },
            {
                id: 'instant-noodles',
                image: 'instant-noodles.png',
                ingredients: ['farine de blé', 'huile de palme', 'sel', 'stabilisants (E501, E500)', 'colorant (E100)', 'exhausteurs de goût (E621, E635)', 'arômes'],
                processed: true
            }
        ]
    };
    
    // Variables pour le chapitre Envahisseurs
    let currentFoodIndex = 0;
    let invaderScore = 0;
    
    // Initialisation du chapitre Envahisseurs
    function initInvadersScreen() {
        // Réinitialiser les variables
        currentFoodIndex = 0;
        invaderScore = 0;
        
        // Configurer les boutons
        const banButton = document.getElementById('ban-food');
        const allowButton = document.getElementById('allow-food');
        
        banButton.addEventListener('click', () => handleFoodDecision(true));
        allowButton.addEventListener('click', () => handleFoodDecision(false));
        
        // Configurer le bouton suivant
        const nextButton = document.getElementById('invaders-next');
        nextButton.addEventListener('click', () => {
            // Calculer les étoiles pour ce chapitre
            calculateStars('invaders');
            showScreen('wisdom-screen');
        });
        
        // Mélanger les aliments
        invadersData.foods = shuffleArray(invadersData.foods);
        
        // Afficher le premier aliment
        showFood(0);
        
        // Définir le score maximum possible
        gameState.chapters.invaders.maxScore = invadersData.foods.length * GAME_CONFIG.pointsPerCorrectAction;
    }
    
    // Fonction pour afficher un aliment
    function showFood(index) {
        if (index >= invadersData.foods.length) {
            // Fin du mini-jeu
            document.getElementById('invaders-next').style.display = 'block';
            document.querySelector('.decision-buttons').style.display = 'none';
            
            // Attribuer le badge si score suffisant
            if (invaderScore >= invadersData.foods.length * 0.75) {
                gameState.badges.invaders = true;
                saveProgress();
            }
            
            return;
        }
        
        const food = invadersData.foods[index];
        const foodImage = document.querySelector('.food-label-image');
        const ingredientsList = document.getElementById('ingredients-list');
        
        // Mettre à jour l'image (simulation)
        foodImage.style.backgroundColor = food.processed ? '#e88' : '#8e8';
        
        // Mettre à jour la liste d'ingrédients
        ingredientsList.innerHTML = '';
        food.ingredients.forEach(ingredient => {
            const li = document.createElement('li');
            li.textContent = ingredient;
            ingredientsList.appendChild(li);
        });
        
        // Réinitialiser le feedback
        document.querySelector('.invaders-feedback').textContent = '';
        
        // Afficher les boutons de décision
        document.querySelector('.decision-buttons').style.display = 'flex';
        document.getElementById('invaders-next').style.display = 'none';
    }
    
    // Fonction pour gérer la décision sur un aliment
    function handleFoodDecision(isBanned) {
        const food = invadersData.foods[currentFoodIndex];
        const feedback = document.querySelector('.invaders-feedback');
        
        if ((isBanned && food.processed) || (!isBanned && !food.processed)) {
            // Décision correcte
            feedback.textContent = isBanned ? window.i18n.translate('ban-success') : window.i18n.translate('allow-success');
            updateScore(GAME_CONFIG.pointsPerCorrectAction, 'invaders');
            invaderScore++;
            
            // Effets de succès
            createParticles(document.querySelector('.food-label'));
            playSound('success');
        } else {
            // Décision incorrecte
            feedback.textContent = isBanned ? window.i18n.translate('ban-error') : window.i18n.translate('allow-error');
            updateScore(GAME_CONFIG.pointsPerError, 'invaders');
            
            // Effet sonore d'erreur
            playSound('error');
        }
        
        // Passer à l'aliment suivant après un délai
        setTimeout(() => {
            currentFoodIndex++;
            showFood(currentFoodIndex);
        }, 1500);
    }
    
    // ================================
    // CHAPITRE 5: SAGESSE (QUIZ)
    // ================================
    
    // Données des questions pour le quiz
    const wisdomData = {
        questions: [
            {
                id: 'q1',
                options: ['q1-a', 'q1-b', 'q1-c'],
                correct: 'q1-correct',
                explanation: 'q1-explain'
            },
            {
                id: 'q2',
                options: ['q2-a', 'q2-b', 'q2-c'],
                correct: 'q2-correct',
                explanation: 'q2-explain'
            },
            {
                id: 'q3',
                options: ['q3-a', 'q3-b', 'q3-c'],
                correct: 'q3-correct',
                explanation: 'q3-explain'
            },
            {
                id: 'q4',
                options: ['q4-a', 'q4-b', 'q4-c'],
                correct: 'q4-correct',
                explanation: 'q4-explain'
            },
            {
                id: 'q5',
                options: ['q5-a', 'q5-b', 'q5-c'],
                correct: 'q5-correct',
                explanation: 'q5-explain'
            }
        ]
    };
    
    // Variables pour le quiz
    let currentQuestionIndex = 0;
    let wisdomScore = 0;
    
    // Initialisation du chapitre Sagesse
    function initWisdomScreen() {
        // Réinitialiser les variables
        currentQuestionIndex = 0;
        wisdomScore = 0;
        
        // Exposer pour i18n
        window.currentQuestionIndex = currentQuestionIndex;
        window.wisdomData = wisdomData;
        
        // Configurer le bouton suivant
        const nextButton = document.getElementById('wisdom-next');
        nextButton.style.display = 'none';
        nextButton.addEventListener('click', () => {
            // Calculer les étoiles pour ce chapitre
            calculateStars('wisdom');
            
            // Marquer le chapitre comme terminé
            gameState.chapters.wisdom.completed = true;
            
            // Attribuer le badge si score suffisant
            if (wisdomScore >= wisdomData.questions.length * 0.8) {
                gameState.badges.wisdom = true;
            }
            
            // Vérifier les badges
            checkBadges();
            
            // Aller à l'écran de résultats
            showScreen('results-screen');
        });
        
        // Afficher la première question
        showQuestion(0);
        
        // Définir le score maximum possible
        gameState.chapters.wisdom.maxScore = wisdomData.questions.length * GAME_CONFIG.pointsPerCorrectAction;
    }
    
    // Fonction pour afficher une question
    function showQuestion(index) {
        if (index >= wisdomData.questions.length) {
            // Fin du quiz
            document.getElementById('wisdom-next').style.display = 'block';
            document.querySelector('.quiz-question').style.display = 'none';
            document.querySelector('.quiz-progress').style.display = 'none';
            return;
        }
        
        // Mettre à jour l'index courant pour i18n
        window.currentQuestionIndex = index;
        
        const question = wisdomData.questions[index];
        const questionElement = document.getElementById('current-question');
        const optionsContainer = document.querySelector('.quiz-options');
        const progressCounter = document.getElementById('question-counter');
        
        // Mettre à jour la question
        questionElement.textContent = window.i18n.translate(question.id);
        
        // Mettre à jour les options
        optionsContainer.innerHTML = '';
        question.options.forEach((option, optIndex) => {
            const optionElement = document.createElement('div');
            optionElement.className = 'quiz-option';
            optionElement.textContent = window.i18n.translate(option);
            optionElement.setAttribute('data-option', option);
            
            optionElement.addEventListener('click', handleQuizAnswer);
            
            optionsContainer.appendChild(optionElement);
        });
        
        // Mettre à jour le compteur de progression
        progressCounter.textContent = window.i18n.translateWithVars('question-counter', { current: index + 1, total: wisdomData.questions.length });
        
        // Réinitialiser le feedback
        document.querySelector('.quiz-feedback').textContent = '';
    }
    
    // Fonction pour gérer la réponse à une question du quiz
    function handleQuizAnswer(e) {
        const selectedOption = e.target;
        const question = wisdomData.questions[currentQuestionIndex];
        const correctOptionId = window.i18n.translate(question.correct);
        const feedback = document.querySelector('.quiz-feedback');
        const options = document.querySelectorAll('.quiz-option');
        
        // Désactiver toutes les options
        options.forEach(option => {
            option.removeEventListener('click', handleQuizAnswer);
        });
        
        // Vérifier si la réponse est correcte
        const selectedOptionId = selectedOption.getAttribute('data-option');
        const isCorrect = selectedOptionId.endsWith(correctOptionId);
        
        if (isCorrect) {
            // Réponse correcte
            selectedOption.classList.add('correct');
            feedback.textContent = window.i18n.translate('correct-answer') + ' ' + window.i18n.translate(question.explanation);
            updateScore(GAME_CONFIG.pointsPerCorrectAction, 'wisdom');
            wisdomScore++;
            
            // Effets de succès
            createParticles(selectedOption);
            playSound('success');
        } else {
            // Réponse incorrecte
            selectedOption.classList.add('incorrect');
            
            // Marquer la bonne réponse
            options.forEach(option => {
                if (option.getAttribute('data-option').endsWith(correctOptionId)) {
                    option.classList.add('correct');
                }
            });
            
            feedback.textContent = window.i18n.translate('wrong-answer') + ' ' + window.i18n.translate(question.explanation);
            updateScore(GAME_CONFIG.pointsPerError, 'wisdom');
            
            // Effet sonore d'erreur
            playSound('error');
        }
        
        // Passer à la question suivante après un délai
        setTimeout(() => {
            currentQuestionIndex++;
            showQuestion(currentQuestionIndex);
        }, 3000);
    }
    
    // ================================
    // ÉCRAN DE RÉSULTATS
    // ================================
    
    // Initialisation de l'écran de résultats
    function initResultsScreen() {
        // Afficher le score final
        document.getElementById('score-value').textContent = gameState.score;
        
        // Afficher les étoiles pour chaque chapitre
        const starContainers = document.querySelectorAll('.stars');
        starContainers.forEach(container => {
            container.innerHTML = '';
            const chapter = container.getAttribute('data-chapter');
            const stars = gameState.chapters[chapter].stars;
            
            for (let i = 0; i < 3; i++) {
                const star = document.createElement('div');
                star.className = 'star' + (i < stars ? ' earned' : '');
                container.appendChild(star);
            }
        });
        
        // Afficher les badges
        const badgesContainer = document.querySelector('.badges-grid');
        badgesContainer.innerHTML = '';
        
        // Créer les badges
        const badges = [
            { id: 'ministers', key: 'badge-ministers' },
            { id: 'guardians', key: 'badge-guardians' },
            { id: 'balance', key: 'badge-balance' },
            { id: 'invaders', key: 'badge-invaders' },
            { id: 'wisdom', key: 'badge-wisdom' },
            { id: 'bilingual', key: 'badge-bilingual' }
        ];
        
        badges.forEach(badge => {
            const badgeElement = document.createElement('div');
            badgeElement.className = 'badge' + (gameState.badges[badge.id] ? ' earned' : '');
            badgeElement.title = window.i18n.translate(badge.key);
            badgeElement.textContent = badge.id.charAt(0).toUpperCase();
            
            badgesContainer.appendChild(badgeElement);
        });
        
        // Configurer le bouton d'export CSV
        const exportButton = document.getElementById('export-csv');
        exportButton.addEventListener('click', exportResultsToCSV);
        
        // Configurer le bouton de redémarrage
        const restartButton = document.getElementById('restart-game');
        restartButton.addEventListener('click', () => {
            showScreen('title-screen');
        });
        
        // Marquer le jeu comme terminé dans la langue actuelle
        gameState.completedLanguages.add(gameState.lang);
        saveProgress();
    }
    
    // ================================
    // INITIALISATION DU JEU
    // ================================
    
    // Fonction d'initialisation principale
    function init() {
        // Charger les progrès si disponibles
        loadProgress();
        
        // Initialiser les sons
        initSounds();
        
        // Initialiser les écrans
        initTitleScreen();
        
        // Afficher l'écran de titre
        showScreen('title-screen');
        
        // Démarrer la musique de fond
        // sounds.bgMusic.play();
        
        console.log('Le Palais Impérial de la Nutrition initialisé avec succès !');
    }
    
    // Lancer l'initialisation une fois le DOM chargé
    document.addEventListener('DOMContentLoaded', init);
    
    // Exposer les fonctions utiles pour les autres modules
    window.playSound = playSound;
    
})();
