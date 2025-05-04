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
        const tutorialNextBtn = document.getElementById('tutorial-next');
        if (tutorialNextBtn) {
            tutorialNextBtn.addEventListener('click', () => {
                showScreen('ministers-screen');
            });
        }
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
        
        // Créer et ajouter les éléments d'aliments
        shuffledFoods.forEach(food => {
            const foodElement = document.createElement('div');
            foodElement.className = 'food-item';
            foodElement.setAttribute('draggable', 'true');
            foodElement.setAttribute('data-nutrient', food.nutrient);
            foodElement.setAttribute('data-id', food.id); // Important pour la traduction
            
            // Correction: Utiliser la traduction au lieu de l'identifiant
            foodElement.textContent = window.i18n.translate(food.id);
            
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
            frontFace.textContent = window.i18n.translate(card.id);
            
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
            
            // Correction: Utiliser la traduction au lieu de l'identifiant
            foodElement.textContent = window.i18n.translate(food.id);
            
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
        
        // Configurer le
