/**
 * Le Palais Impérial de la Nutrition - Module d'internationalisation
 * Gestion des traductions FR, EN, ZH via des fichiers JSON externes
 */

// Configuration de base i18next
const initI18n = async () => {
    // Chargement des fichiers de localisation
    try {
        const languages = ['fr', 'en', 'zh'];
        const resources = {};
        
        for (const lang of languages) {
            const response = await fetch(`js/data/local/${lang}.json`);
            if (!response.ok) {
                throw new Error(`Impossible de charger la langue ${lang}`);
            }
            const translations = await response.json();
            resources[lang] = { translation: translations };
        }
        
        // Initialisation de i18next avec les ressources chargées
        await i18next.init({
            lng: 'fr', // Langue par défaut
            resources: resources,
            fallbackLng: 'fr',
            interpolation: {
                escapeValue: false // Ne pas échapper les valeurs HTML
            }
        });
        
        console.log('i18n initialisé avec succès');
        
        // Forcer une première mise à jour des traductions après initialisation
        setTimeout(() => {
            updateAllTranslations();
        }, 500);
    } catch (error) {
        console.error('Erreur lors de l\'initialisation de i18n:', error);
        // Fallback pour le développement si les fichiers ne sont pas disponibles
        fallbackInitialization();
    }
};

// Initialisation de secours avec des traductions en dur
const fallbackInitialization = () => {
    console.warn('Utilisation des traductions de secours intégrées');
    
    // Ressources de secours minimales pour le développement
    const fallbackResources = {
        fr: {
            translation: {
                'game-title': 'Le Palais Impérial de la Nutrition',
                'start-game': 'Commencer l\'aventure',
                'welcome-message': 'Bienvenue au Palais Impérial de la Nutrition!',
                'continue': 'Continuer',
                'food-protein-1': 'Poulet',
                'food-protein-2': 'Œufs',
                'food-protein-3': 'Tofu (豆腐)',
                'food-protein-4': 'Lentilles',
                'food-carbs-1': 'Pain',
                'food-carbs-2': 'Riz (米饭)',
                'food-carbs-3': 'Pommes de terre',
                'food-carbs-4': 'Nouilles (面条)',
                'food-fat-1': 'Avocat',
                'food-fat-2': 'Huile d\'olive',
                'food-fat-3': 'Noix',
                'food-fat-4': 'Sésame (芝麻)'
            }
        },
        en: {
            translation: {
                'game-title': 'The Imperial Palace of Nutrition',
                'start-game': 'Start the adventure',
                'welcome-message': 'Welcome to the Imperial Palace of Nutrition!',
                'continue': 'Continue',
                'food-protein-1': 'Chicken',
                'food-protein-2': 'Eggs',
                'food-protein-3': 'Tofu (豆腐)',
                'food-protein-4': 'Lentils',
                'food-carbs-1': 'Bread',
                'food-carbs-2': 'Rice (米饭)',
                'food-carbs-3': 'Potatoes',
                'food-carbs-4': 'Noodles (面条)',
                'food-fat-1': 'Avocado',
                'food-fat-2': 'Olive oil',
                'food-fat-3': 'Nuts',
                'food-fat-4': 'Sesame (芝麻)'
            }
        },
        zh: {
            translation: {
                'game-title': '营养皇宫',
                'start-game': '开始冒险',
                'welcome-message': '欢迎来到营养皇宫!',
                'continue': '继续',
                'food-protein-1': '鸡肉',
                'food-protein-2': '鸡蛋',
                'food-protein-3': '豆腐',
                'food-protein-4': '小扁豆',
                'food-carbs-1': '面包',
                'food-carbs-2': '米饭',
                'food-carbs-3': '土豆',
                'food-carbs-4': '面条',
                'food-fat-1': '牛油果',
                'food-fat-2': '橄榄油',
                'food-fat-3': '坚果',
                'food-fat-4': '芝麻'
            }
        }
    };
    
    // Initialiser avec les traductions de secours
    i18next.init({
        lng: 'fr',
        resources: fallbackResources,
        fallbackLng: 'fr'
    }).then(() => {
        // Forcer une mise à jour initiale
        setTimeout(() => {
            updateAllTranslations();
        }, 500);
    });
};

// Vérification de l'existence d'une clé de traduction
const exists = (key) => {
    if (!i18next) return false;
    return i18next.exists(key);
};

// Fonction pour changer de langue
const changeLang = (lang) => {
    i18next.changeLanguage(lang, (err, t) => {
        if (err) {
            console.log('Erreur lors du changement de langue:', err);
            return;
        }
        
        // Mettre à jour tous les éléments avec les nouvelles traductions
        updateAllTranslations();
        
        // Enregistrer la préférence de langue
        localStorage.setItem('nin_palace.lang', lang);
        
        // Mettre à jour les boutons de langue actifs
        document.querySelectorAll('.lang-btn').forEach(btn => {
            btn.classList.toggle('active', btn.getAttribute('data-lang') === lang);
        });
    });
};

// Fonction pour mettre à jour toutes les traductions
const updateAllTranslations = () => {
    if (!i18next) {
        console.error("i18next n'est pas initialisé.");
        return;
    }
    
    // Mettre à jour les éléments avec l'attribut id correspondant à une clé de traduction
    document.querySelectorAll('[id]').forEach(el => {
        const translationKey = el.id;
        if (exists(translationKey)) {
            el.textContent = i18next.t(translationKey);
        }
    });
    
    // Mettre à jour les boutons
    document.querySelectorAll('button[id]').forEach(btn => {
        const translationKey = btn.id;
        if (exists(translationKey)) {
            btn.textContent = i18next.t(translationKey);
        }
    });
    
    // Mise à jour spécifique et prioritaire des éléments food-item
    document.querySelectorAll('.food-item').forEach(el => {
        const foodId = el.getAttribute('data-id');
        if (foodId && exists(foodId)) {
            el.textContent = i18next.t(foodId);
        }
    });
    
    // Mettre à jour d'autres éléments spécifiques
    updateSpecificElements();
    
    console.log('Traductions mises à jour dans la langue:', i18next.language);
};

// Fonction pour mettre à jour des éléments spécifiques
const updateSpecificElements = () => {
    // Mise à jour des ministres
    document.querySelectorAll('.minister h3').forEach(el => {
        const minister = el.parentElement.id.split('-')[0];
        const translationKey = `${minister}-minister`;
        if (exists(translationKey)) {
            el.textContent = i18next.t(translationKey);
        }
    });
    
    // Mise à jour des éléments
    document.querySelectorAll('.element h3').forEach(el => {
        const element = el.parentElement.getAttribute('data-element');
        if (element && exists(element)) {
            el.textContent = i18next.t(element);
        }
    });
    
    // Tutoriel
    const tutorialText = document.getElementById('tutorial-text');
    if (tutorialText && exists('welcome-message')) {
        tutorialText.textContent = i18next.t('welcome-message');
    }
    
    // Double vérification pour les aliments - c'est là que se situe le bug principal
    document.querySelectorAll('.food-item').forEach(el => {
        const foodId = el.getAttribute('data-id');
        if (foodId && exists(foodId)) {
            // Forcer la mise à jour du texte avec la traduction
            const translatedText = i18next.t(foodId);
            if (el.textContent !== translatedText) {
                el.textContent = translatedText;
                console.log(`Élément mis à jour: ${foodId} -> ${translatedText}`);
            }
        }
    });
    
    // Mise à jour des compteurs pour le jeu de mémoire
    const attempts = document.getElementById('attempts');
    const matches = document.getElementById('matches');
    
    if (attempts && typeof window.attemptsCount !== 'undefined') {
        attempts.textContent = i18next.t('attempts', { count: window.attemptsCount });
    }
    
    if (matches && typeof window.matchesCount !== 'undefined') {
        matches.textContent = i18next.t('matches', { count: window.matchesCount, total: 6 });
    }
};

// Fonction pour traduire dynamiquement avec des variables
const translateWithVars = (key, vars) => {
    if (!i18next) return key;
    return i18next.t(key, vars);
};

// Fonction de traduction simple (wrapper pour i18next.t)
const translate = (key) => {
    if (!i18next) return key;
    return i18next.t(key);
};

// Initialiser i18n au chargement de la page
document.addEventListener('DOMContentLoaded', async () => {
    // Initialiser i18next
    await initI18n();
    
    // Charger la langue enregistrée ou utiliser la langue par défaut
    const savedLang = localStorage.getItem('nin_palace.lang') || 'fr';
    changeLang(savedLang);
    
    // Ajouter des écouteurs d'événements pour les boutons de langue
    document.querySelectorAll('.lang-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            changeLang(btn.getAttribute('data-lang'));
        });
    });
    
    // Observer le DOM pour les nouveaux éléments food-item
    const observer = new MutationObserver((mutations) => {
        let needsUpdate = false;
        
        mutations.forEach(mutation => {
            if (mutation.type === 'childList') {
                mutation.addedNodes.forEach(node => {
                    if (node.nodeType === 1 && 
                        (node.classList.contains('food-item') || 
                         node.querySelectorAll('.food-item').length > 0)) {
                        needsUpdate = true;
                    }
                });
            }
        });
        
        if (needsUpdate) {
            // Mettre à jour les traductions pour les nouveaux éléments
            updateAllTranslations();
        }
    });
    
    // Démarrer l'observation sur le corps du document
    observer.observe(document.body, { 
        childList: true, 
        subtree: true 
    });
});

// Exporter les fonctions utiles
window.i18n = {
    changeLang,
    translate,
    translateWithVars,
    updateAllTranslations,
    exists
};
