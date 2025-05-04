/**
 * Le Palais Impérial de la Nutrition - Module d'accessibilité
 * Améliore l'accessibilité du jeu avec le support clavier et autres fonctionnalités
 */

(function() {
    // Configuration
    const ACCESSIBILITY_CONFIG = {
        // Taille de texte minimale (doit être ≥ 14px selon le cahier des charges)
        minFontSize: 14,
        
        // Navigation clavier
        keyboardNavigation: true,
        
        // Contraste élevé
        highContrast: false,
        
        // Sons
        soundEffects: true
    };
    
    // Référence à l'état d'accessibilité sauvegardé
    let accessibilityState = loadAccessibilitySettings();
    
    // ================================
    // INITIALISATION
    // ================================
    
    // Fonction d'initialisation du module d'accessibilité
    function initAccessibility() {
        // Initialiser la navigation clavier
        if (accessibilityState.keyboardNavigation) {
            setupKeyboardNavigation();
        }
        
        // Initialiser le mode contraste élevé si activé
        if (accessibilityState.highContrast) {
            enableHighContrast();
        }
        
        // Vérifier et ajuster la taille des textes
        enforceMinimumFontSize();
        
        // Ajouter des attributs ARIA pour les lecteurs d'écran
        setupAriaAttributes();
        
        console.log('Module d\'accessibilité initialisé');
    }
    
    // ================================
    // NAVIGATION CLAVIER
    // ================================
    
    // Configurer la navigation clavier
    function setupKeyboardNavigation() {
        // Ajouter des écouteurs d'événements pour les touches
        document.addEventListener('keydown', handleKeyDown);
        
        // Ajouter des attributs tabindex aux éléments interactifs
        makeElementsTabbable();
        
        // Ajouter les gestionnaires pour les éléments de drag-and-drop
        setupKeyboardDragAndDrop();
    }
    
    // Gestion des événements clavier
    function handleKeyDown(e) {
        // Touche Tab - déjà gérée par le navigateur pour la navigation
        // Touche Espace/Entrée - pour activer les éléments
        if ((e.key === ' ' || e.key === 'Enter') && document.activeElement) {
            // Simuler un clic sur l'élément en focus
            if (document.activeElement.classList.contains('food-item') || 
                document.activeElement.classList.contains('quiz-option')) {
                e.preventDefault(); // Empêcher le défilement avec espace
                document.activeElement.click();
            }
            
            // Gestion spéciale pour le drag-and-drop
            if (document.activeElement.classList.contains('food-item') && 
                document.activeElement.getAttribute('draggable') === 'true') {
                e.preventDefault();
                handleKeyboardDragStart(document.activeElement);
            }
        }
        
        // Flèches directionnelles
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
            // Si on est en mode déplacement d'un élément
            if (keyboardDraggedItem) {
                e.preventDefault();
                navigateDropZones(e.key);
            }
        }
    }
    
    // Rendre les éléments navigables au clavier
    function makeElementsTabbable() {
        // Ajouter tabindex aux boutons sans attribut tabindex
        document.querySelectorAll('button:not([tabindex])').forEach(btn => {
            btn.setAttribute('tabindex', '0');
        });
        
        // Ajouter tabindex aux éléments de jeu interactifs
        document.querySelectorAll('.food-item, .memory-card, .quiz-option').forEach(el => {
            el.setAttribute('tabindex', '0');
            el.classList.add('keyboard-focus');
        });
    }
    
    // ================================
    // DRAG AND DROP AU CLAVIER
    // ================================
    
    // État pour le drag-and-drop clavier
    let keyboardDraggedItem = null;
    let currentDropZoneIndex = -1;
    let availableDropZones = [];
    
    // Configuration du drag-and-drop au clavier
    function setupKeyboardDragAndDrop() {
        // Ajouter des gestionnaires pour les zones de drop
        document.querySelectorAll('.minister-drop-zone, .element-drop-zone').forEach(zone => {
            zone.setAttribute('tabindex', '0');
            zone.setAttribute('aria-dropeffect', 'move');
            
            // Permettre le drop par appui sur Espace/Entrée
            zone.addEventListener('keydown', (e) => {
                if ((e.key === ' ' || e.key === 'Enter') && keyboardDraggedItem) {
                    e.preventDefault();
                    handleKeyboardDrop(zone);
                }
            });
        });
    }
    
    // Gérer le début du drag au clavier
    function handleKeyboardDragStart(item) {
        keyboardDraggedItem = item;
        
        // Trouver toutes les zones de drop disponibles
        const currentScreen = document.querySelector('.screen.active');
        if (currentScreen.id === 'ministers-screen') {
            availableDropZones = Array.from(document.querySelectorAll('.minister-drop-zone'));
        } else if (currentScreen.id === 'balance-screen') {
            availableDropZones = Array.from(document.querySelectorAll('.element-drop-zone'));
        }
        
        // Mettre en évidence le premier drop zone
        if (availableDropZones.length > 0) {
            currentDropZoneIndex = 0;
            availableDropZones[currentDropZoneIndex].classList.add('highlight');
            availableDropZones[currentDropZoneIndex].focus();
        }
        
        // Annoncer pour les lecteurs d'écran
        announceAction(`Élément ${item.textContent} sélectionné. Utilisez les flèches pour naviguer entre les zones et Espace pour déposer.`);
        
        // Ajouter une classe visuelle
        item.classList.add('dragging');
    }
    
    // Naviguer entre les zones de drop avec les flèches
    function navigateDropZones(key) {
        // Enlever la mise en évidence actuelle
        if (currentDropZoneIndex >= 0 && availableDropZones[currentDropZoneIndex]) {
            availableDropZones[currentDropZoneIndex].classList.remove('highlight');
        }
        
        // Calculer le nouvel index
        if (key === 'ArrowRight' || key === 'ArrowDown') {
            currentDropZoneIndex = (currentDropZoneIndex + 1) % availableDropZones.length;
        } else if (key === 'ArrowLeft' || key === 'ArrowUp') {
            currentDropZoneIndex = (currentDropZoneIndex - 1 + availableDropZones.length) % availableDropZones.length;
        }
        
        // Mettre en évidence la nouvelle zone
        availableDropZones[currentDropZoneIndex].classList.add('highlight');
        availableDropZones[currentDropZoneIndex].focus();
    }
    
    // Gérer le drop au clavier
    function handleKeyboardDrop(dropZone) {
        if (!keyboardDraggedItem) return;
        
        // Simuler un événement de drop
        const currentScreen = document.querySelector('.screen.active');
        
        if (currentScreen.id === 'ministers-screen') {
            // Pour le mini-jeu des Ministres
            const foodNutrient = keyboardDraggedItem.getAttribute('data-nutrient');
            const ministerNutrient = dropZone.getAttribute('data-nutrient');
            const feedbackMessage = document.querySelector('.feedback-message');
            
            if (foodNutrient === ministerNutrient) {
                // Correct
                dropZone.appendChild(keyboardDraggedItem);
                keyboardDraggedItem.classList.remove('dragging');
                keyboardDraggedItem.setAttribute('draggable', 'false');
                
                feedbackMessage.textContent = window.i18n.translateWithVars('ministers-success', { nutrient: window.i18n.translate(foodNutrient) });
                feedbackMessage.className = 'feedback-message success';
                
                if (window.updateScore) {
                    window.updateScore(window.GAME_CONFIG.pointsPerCorrectAction, 'ministers');
                }
                
                if (window.createParticles) {
                    window.createParticles(dropZone);
                }
                
                if (window.playSound && accessibilityState.soundEffects) {
                    window.playSound('success');
                }
                
                announceAction(`Correct ! Aliment déposé avec succès.`);
            } else {
                // Incorrect
                keyboardDraggedItem.classList.remove('dragging');
                
                feedbackMessage.textContent = window.i18n.translate('ministers-error');
                feedbackMessage.className = 'feedback-message error';
                
                if (window.updateScore) {
                    window.updateScore(window.GAME_CONFIG.pointsPerError, 'ministers');
                }
                
                if (window.playSound && accessibilityState.soundEffects) {
                    window.playSound('error');
                }
                
                announceAction(`Incorrect. Cet aliment ne correspond pas à ce ministre.`);
            }
        } else if (currentScreen.id === 'balance-screen') {
            // Pour le mini-jeu de l'Équilibre
            
            // Vérifier si la zone a déjà un aliment
            if (dropZone.firstChild) {
                const oldFood = dropZone.firstChild;
                oldFood.setAttribute('draggable', 'true');
                document.querySelector('.balance-food-items').appendChild(oldFood);
            }
            
            // Placer le nouvel aliment dans la zone
            dropZone.appendChild(keyboardDraggedItem);
            keyboardDraggedItem.classList.remove('dragging');
            keyboardDraggedItem.setAttribute('draggable', 'false');
            
            if (window.playSound && accessibilityState.soundEffects) {
                window.playSound('click');
            }
            
            announceAction(`Aliment ${keyboardDraggedItem.textContent} déposé dans la zone ${dropZone.parentElement.querySelector('h3').textContent}.`);
        }
        
        // Réinitialiser l'état
        keyboardDraggedItem = null;
        
        // Nettoyer les zones
        availableDropZones.forEach(zone => {
            zone.classList.remove('highlight');
        });
        
        availableDropZones = [];
        currentDropZoneIndex = -1;
    }
    
    // ================================
    // ATTRIBUTS ARIA ET CONTENU ALTERNATIF
    // ================================
    
    // Configurer les attributs ARIA pour les lecteurs d'écran
    function setupAriaAttributes() {
        // Ajouter des rôles aux zones de jeu
        document.querySelectorAll('.screen').forEach(screen => {
            screen.setAttribute('role', 'region');
            
            // Ajouter des titres accessibles
            const heading = screen.querySelector('h2');
            if (heading) {
                screen.setAttribute('aria-labelledby', heading.id);
            }
        });
        
        // Décrire les éléments de jeu
        document.querySelectorAll('.minister').forEach(minister => {
            minister.querySelector('.minister-drop-zone').setAttribute('aria-label', 
                `Zone de dépôt pour ${minister.querySelector('h3').textContent}`);
        });
        
        document.querySelectorAll('.element').forEach(element => {
            element.querySelector('.element-drop-zone').setAttribute('aria-label', 
                `Zone de dépôt pour l'élément ${element.querySelector('h3').textContent}`);
        });
        
        // Ajouter des descriptions aux éléments interactifs
        document.querySelectorAll('.food-item').forEach(item => {
            item.setAttribute('aria-grabbed', 'false');
            item.setAttribute('role', 'button');
            item.setAttribute('aria-description', 'Appuyez sur Espace pour saisir cet aliment');
            
            // Événements pour drag and drop accessibles
            item.addEventListener('focus', () => {
                item.setAttribute('aria-grabbed', 'false');
            });
        });
        
        // Live regions pour les feedbacks
        document.querySelectorAll('.feedback-message, .balance-feedback, .invaders-feedback, .quiz-feedback').forEach(feedback => {
            feedback.setAttribute('aria-live', 'polite');
        });
    }
    
    // Fonction pour annoncer les actions avec ARIA
    function announceAction(message) {
        // Créer ou récupérer la région live
        let liveRegion = document.getElementById('accessibility-announcer');
        if (!liveRegion) {
            liveRegion = document.createElement('div');
            liveRegion.id = 'accessibility-announcer';
            liveRegion.className = 'sr-only';
            liveRegion.setAttribute('aria-live', 'assertive');
            liveRegion.setAttribute('aria-atomic', 'true');
            document.body.appendChild(liveRegion);
        }
        
        // Mettre à jour le message
        liveRegion.textContent = message;
        
        // Nettoyer après un délai
        setTimeout(() => {
            liveRegion.textContent = '';
        }, 3000);
    }
    
    // ================================
    // CONTRASTE ET TAILLE DE TEXTE
    // ================================
    
    // Vérifier et ajuster la taille des textes
    function enforceMinimumFontSize() {
        // Créer une feuille de style pour les règles d'accessibilité
        let accessibilityStyle = document.getElementById('accessibility-styles');
        if (!accessibilityStyle) {
            accessibilityStyle = document.createElement('style');
            accessibilityStyle.id = 'accessibility-styles';
            document.head.appendChild(accessibilityStyle);
        }
        
        // Appliquer la taille minimale de police
        accessibilityStyle.textContent = `
            body, button, input, textarea, select, p, li, div {
                font-size: max(${ACCESSIBILITY_CONFIG.minFontSize}px, 1em);
            }
        `;
    }
    
    // Activer le mode contraste élevé
    function enableHighContrast() {
        document.body.classList.add('high-contrast');
        
        // Ajouter une feuille de style pour le contraste élevé
        let contrastStyle = document.getElementById('high-contrast-styles');
        if (!contrastStyle) {
            contrastStyle = document.createElement('style');
            contrastStyle.id = 'high-contrast-styles';
            document.head.appendChild(contrastStyle);
        }
        
        // Règles de contraste élevé
        contrastStyle.textContent = `
            .high-contrast {
                --primary-dark: #000000;
                --primary-medium: #1a1c2c;
                --neutral-1: #ffffff;
                --neutral-2: #f0f0f0;
            }
            
            .high-contrast button,
            .high-contrast .btn-primary,
            .high-contrast .btn-secondary {
                border: 2px solid white;
                color: white;
                font-weight: bold;
            }
            
            .high-contrast .food-item,
            .high-contrast .memory-card,
            .high-contrast .quiz-option {
                border: 3px solid white;
            }
            
            .high-contrast .dialog-box {
                background-color: black;
                color: white;
                border: 2px solid white;
            }
        `;
    }
    
    // Désactiver le mode contraste élevé
    function disableHighContrast() {
        document.body.classList.remove('high-contrast');
        
        // Supprimer la feuille de style de contraste
        const contrastStyle = document.getElementById('high-contrast-styles');
        if (contrastStyle) {
            contrastStyle.remove();
        }
    }
    
    // ================================
    // GESTION DES PRÉFÉRENCES
    // ================================
    
    // Charger les préférences d'accessibilité
    function loadAccessibilitySettings() {
        const savedSettings = localStorage.getItem('nin_palace.accessibility');
        
        if (savedSettings) {
            try {
                return JSON.parse(savedSettings);
            } catch (e) {
                console.error('Erreur lors du chargement des paramètres d\'accessibilité:', e);
            }
        }
        
        // Paramètres par défaut
        return {
            keyboardNavigation: ACCESSIBILITY_CONFIG.keyboardNavigation,
            highContrast: ACCESSIBILITY_CONFIG.highContrast,
            soundEffects: ACCESSIBILITY_CONFIG.soundEffects
        };
    }
    
    // Sauvegarder les préférences d'accessibilité
    function saveAccessibilitySettings() {
        localStorage.setItem('nin_palace.accessibility', JSON.stringify(accessibilityState));
    }
    
    // Mettre à jour les préférences
    function updateAccessibilitySettings(settings) {
        accessibilityState = { ...accessibilityState, ...settings };
        
        // Appliquer les changements
        if (settings.hasOwnProperty('keyboardNavigation')) {
            if (settings.keyboardNavigation) {
                setupKeyboardNavigation();
            }
        }
        
        if (settings.hasOwnProperty('highContrast')) {
            if (settings.highContrast) {
                enableHighContrast();
            } else {
                disableHighContrast();
            }
        }
        
        // Sauvegarder les changements
        saveAccessibilitySettings();
    }
    
    // ================================
    // INTÉGRATION AU JEU
    // ================================
    
    // Créer un menu d'accessibilité
    function createAccessibilityMenu() {
        // Créer un bouton d'accessibilité
        const accessibilityBtn = document.createElement('button');
        accessibilityBtn.id = 'accessibility-btn';
        accessibilityBtn.className = 'accessibility-btn';
        accessibilityBtn.setAttribute('aria-label', 'Options d\'accessibilité');
        accessibilityBtn.innerHTML = '<span aria-hidden="true">⚙️</span>';
        
        // Créer le menu d'accessibilité
        const accessibilityMenu = document.createElement('div');
        accessibilityMenu.id = 'accessibility-menu';
        accessibilityMenu.className = 'accessibility-menu';
        accessibilityMenu.setAttribute('aria-hidden', 'true');
        
        // Ajouter les options
        accessibilityMenu.innerHTML = `
            <h3>Options d'accessibilité</h3>
            <div class="accessibility-option">
                <label for="keyboard-nav">Navigation clavier</label>
                <input type="checkbox" id="keyboard-nav" ${accessibilityState.keyboardNavigation ? 'checked' : ''}>
            </div>
            <div class="accessibility-option">
                <label for="high-contrast">Contraste élevé</label>
                <input type="checkbox" id="high-contrast" ${accessibilityState.highContrast ? 'checked' : ''}>
            </div>
            <div class="accessibility-option">
                <label for="sound-effects">Sons</label>
                <input type="checkbox" id="sound-effects" ${accessibilityState.soundEffects ? 'checked' : ''}>
            </div>
            <button id="close-accessibility">Fermer</button>
        `;
        
        // Ajouter au DOM
        document.body.appendChild(accessibilityBtn);
        document.body.appendChild(accessibilityMenu);
        
        // Gestionnaire d'événements
        accessibilityBtn.addEventListener('click', () => {
            accessibilityMenu.classList.toggle('show');
            accessibilityMenu.setAttribute('aria-hidden', accessibilityMenu.classList.contains('show') ? 'false' : 'true');
        });
        
        document.getElementById('close-accessibility').addEventListener('click', () => {
            accessibilityMenu.classList.remove('show');
            accessibilityMenu.setAttribute('aria-hidden', 'true');
        });
        
        // Gestionnaires pour les options
        document.getElementById('keyboard-nav').addEventListener('change', (e) => {
            updateAccessibilitySettings({ keyboardNavigation: e.target.checked });
        });
        
        document.getElementById('high-contrast').addEventListener('change', (e) => {
            updateAccessibilitySettings({ highContrast: e.target.checked });
        });
        
        document.getElementById('sound-effects').addEventListener('change', (e) => {
            updateAccessibilitySettings({ soundEffects: e.target.checked });
        });
        
        // Ajouter des styles pour le menu
        const accessibilityStyles = document.createElement('style');
        accessibilityStyles.textContent = `
            .accessibility-btn {
                position: fixed;
                bottom: 20px;
                right: 20px;
                width: 50px;
                height: 50px;
                border-radius: 50%;
                background-color: var(--accent-4);
                color: white;
                font-size: 20px;
                border: none;
                cursor: pointer;
                z-index: 1000;
            }
            
            .accessibility-menu {
                position: fixed;
                bottom: 80px;
                right: 20px;
                background-color: var(--neutral-1);
                color: var(--neutral-6);
                padding: 20px;
                border-radius: 10px;
                box-shadow: 0 0 10px rgba(0, 0, 0, 0.2);
                z-index: 999;
                display: none;
            }
            
            .accessibility-menu.show {
                display: block;
            }
            
            .accessibility-option {
                margin: 10px 0;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            
            .sr-only {
                position: absolute;
                width: 1px;
                height: 1px;
                padding: 0;
                margin: -1px;
                overflow: hidden;
                clip: rect(0, 0, 0, 0);
                white-space: nowrap;
                border: 0;
            }
        `;
        
        document.head.appendChild(accessibilityStyles);
    }
    
    // ================================
    // INITIALISATION AU CHARGEMENT
    // ================================
    
    // Initialiser le module au chargement de la page
    document.addEventListener('DOMContentLoaded', () => {
        // Initialiser tous les composants d'accessibilité
        initAccessibility();
        
        // Créer le menu d'accessibilité
        createAccessibilityMenu();
        
        console.log('Module d\'accessibilité chargé');
    });
    
    // ================================
    // EXPOSITION DE L'API PUBLIQUE
    // ================================
    
    // Exposer les fonctions utiles
    window.accessibility = {
        updateSettings: updateAccessibilitySettings,
        announce: announceAction,
        getSettings: () => ({ ...accessibilityState })
    };
    
})();
