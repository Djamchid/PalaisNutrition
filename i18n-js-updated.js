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
            const response = await fetch(`js/data/locales/${lang}.json`);
            if (!response.ok) {
                throw new Error(`Impossible de charger la langue ${lang}`);
            }
            const translations = await response.json();
            resources[lang] = { translation: translations };
        }
        
        // Initialisation de i18next avec les ressources chargées
        i18next.init({
            lng: 'fr', // Langue par défaut
            resources: resources,
            fallbackLng: 'fr',
            interpolation: {
                escapeValue: false // Ne pas échapper les valeurs HTML
            }
        });
        
        console.log('i18n initialisé avec succès');
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
                'continue': 'Continuer'
                // Traductions minimales...
            }
        },
        en: {
            translation: {
                'game-title': 'The Imperial Palace of Nutrition',
                'start-game': 'Start the adventure',
                'welcome-message': 'Welcome to the Imperial Palace of Nutrition!',
                'continue': 'Continue'
                // Traductions minimales...
            }
        },
        zh: {
            translation: {
                'game-title': '营养皇宫',
                'start-game': '开始冒险',
                'welcome-message': '欢迎来到营养皇宫!',
                'continue': '继续'
                // Traductions minimales...
            }
        }
    };
    
    i18next.init({
        lng: 'fr',
        resources: fallbackResources,
        fallbackLng: 'fr'
    });
};

// Fonction pour changer de langue
const changeLang = (lang) => {
    i18next.changeLanguage(lang, (err, t) => {
        if (err) return console.log('Erreur lors du changement de langue:', err);
        
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
    // Mettre à jour les éléments avec l'attribut id correspondant à une clé de traduction
    document.querySelectorAll('[id]').forEach(el => {
        const translationKey = el.id;
        if (i18next.exists(translationKey)) {
            el.textContent = i18next.t(translationKey);
        }
    });
    
    // Mettre à jour les boutons
    document.querySelectorAll('button[id]').forEach(btn => {
        const translationKey = btn.id;
        if (i18next.exists(translationKey)) {
            btn.textContent = i18next.t(translationKey);
        }
    });
    
    // Mettre à jour d'autres éléments spécifiques si nécessaire
    updateSpecificElements();
};

// Fonction pour mettre à jour des éléments spécifiques
const updateSpecificElements = () => {
    // Mise à jour des ministres
    document.querySelectorAll('.minister h3').forEach(el => {
        const minister = el.parentElement.id.split('-')[0];
        el.textContent = i18next.t(`${minister}-minister`);
    });
    
    // Mise à jour des éléments
    document.querySelectorAll('.element h3').forEach(el => {
        const element = el.parentElement.getAttribute('data-element');
        el.textContent = i18next.t(element);
    });
    
    // Tutoriel
    const tutorialText = document.getElementById('tutorial-text');
    if (tutorialText) {
        tutorialText.textContent = i18next.t('welcome-message');
    }
    
    // Mise à jour des aliments dans l'interface
    document.querySelectorAll('.food-item').forEach(el => {
        const foodId = el.getAttribute('data-id');
        if (foodId && i18next.exists(foodId)) {
            el.textContent = i18next.t(foodId);
        }
    });
};

// Fonction pour traduire dynamiquement avec des variables
const translateWithVars = (key, vars) => {
    return i18next.t(key, vars);
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
});

// Exporter les fonctions utiles
window.i18n = {
    changeLang,
    translate: i18next.t,
    translateWithVars,
    updateAllTranslations
};
