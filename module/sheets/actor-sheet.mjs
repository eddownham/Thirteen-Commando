/**
 * Complete Thirteen Commando Actor Sheet - With All Six Components + Scaling
 */

// Import components
import { DiceRolling } from '../components/dice-rolling.mjs';
import { Initiative } from '../components/initiative.mjs';
import { QuickSkills } from '../components/quick-skills.mjs';
import { MindsetBreeding } from '../components/mindset-breeding.mjs';
import { Equipment } from '../components/equipment.mjs';
import { HealthWounds } from '../components/health-wounds.mjs';

export class ThirteenCommandoActorSheet extends ActorSheet {
    
    constructor(...args) {
        super(...args);
        
        // Initialize components
        this.diceRolling = null;    // Will be initialized when actor is available
        this.initiative = null;     // Will be initialized when actor is available
        this.quickSkills = null;    // Will be initialized when actor is available
        this.mindsetBreeding = null; // Will be initialized when actor is available
        this.equipment = null;      // Will be initialized when actor is available
        this.healthWounds = null;   // Will be initialized when actor is available
    }

    /** @override */
    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            classes: ["thirteen-commando", "sheet", "actor"],
            width: 1370,
            height: 1085,
            tabs: [{
                navSelector: ".sheet-tabs",
                contentSelector: ".sheet-body",
                initial: "biography"
            }],
            scrollY: [".biography", ".items", ".attributes", ".skills"]
        });
    }

    /** @override */
    get template() {
        return `systems/thirteen-commando/templates/actor/actor-${this.actor.type}-sheet.html`;
    }

    /** @override */
    getData() {
        // Initialize components when we have access to actor
        if (!this.diceRolling) {
            this.diceRolling = new DiceRolling(this.actor);
        }
        if (!this.initiative) {
            this.initiative = new Initiative(this.actor);
        }
        if (!this.quickSkills) {
            this.quickSkills = new QuickSkills(this.actor);
        }
        if (!this.mindsetBreeding) {
            this.mindsetBreeding = new MindsetBreeding(this.actor);
        }
        if (!this.equipment) {
            this.equipment = new Equipment(this.actor);
        }
        if (!this.healthWounds) {
            this.healthWounds = new HealthWounds(this.actor);
        }

        const context = super.getData();
        const actorData = this.document.toObject(false);
        
        context.system = actorData.system;
        context.flags = actorData.flags;

        // Add enriched biography
        context.enrichedBiography = TextEditor.enrichHTML(this.object.system.biography, {
            secrets: this.object.isOwner,
            async: false
        });

        // Calculate total breeding bonuses for each category - DELEGATED TO COMPONENT
        context.totalPhysicalBonus = this.mindsetBreeding.calculateBreedingBonusForCategory('physical');
        context.totalMentalBonus = this.mindsetBreeding.calculateBreedingBonusForCategory('mental');
        context.totalSocialBonus = this.mindsetBreeding.calculateBreedingBonusForCategory('social');

        // Add mindset and breeding data - DELEGATED TO COMPONENT
        context.availableMindsets = this.mindsetBreeding.getAvailableMindsets();
        context.currentMindset = this.mindsetBreeding.getCurrentMindset();
        context.availableBreedingTraits = this.mindsetBreeding.getAvailableBreedingTraits();
        context.currentBreedingTraits = this.mindsetBreeding.getCurrentBreedingTraits();
        context.characterCreationSummary = this.mindsetBreeding.getCharacterCreationSummary();

        // Add initiative breakdown for display
        context.initiativeBreakdown = this.initiative.getInitiativeBreakdown();

        // Add items to context for equipment tab - DELEGATED TO COMPONENT
        const itemsByType = this.equipment.getItemsByType();
        context.items = itemsByType.all;
        context.weapons = itemsByType.weapons;
        context.equipment = itemsByType.equipment;
        context.itemStatistics = this.equipment.getItemStatistics();
        context.equippedItems = this.equipment.getEquippedItems();
        context.totalWeight = this.equipment.getTotalWeight();
        context.equippedWeight = this.equipment.getTotalWeight(true);

        // Prepare effects data for the effects template - FIXED DEPRECATION WARNINGS
        context.effects = this.actor.effects.map(effect => {
            return {
                id: effect.id,
                label: effect.name,
                icon: effect.img || 'icons/svg/aura.svg',
                disabled: effect.disabled,
                duration: effect.duration,
                _getSourceName: effect.sourceName || effect.parent?.name || 'Unknown',
                isWoundEffect: effect.getFlag('thirteen-commando', 'isWoundEffect') || false
            };
        });

        // Group effects by type for the template
        context.effectCategories = {
            temporary: {
                label: 'Temporary Effects',
                effects: context.effects.filter(e => e.duration && !e.duration.permanent && !e.disabled)
            },
            passive: {
                label: 'Passive Effects', 
                effects: context.effects.filter(e => (!e.duration || e.duration.permanent) && !e.disabled)
            },
            inactive: {
                label: 'Inactive Effects',
                effects: context.effects.filter(e => e.disabled)
            }
        };

        // Prepare quick skills data - DELEGATED TO COMPONENT
        context.quickSkillsData = this.quickSkills.getQuickSkillsData();

        return context;
    }

    /**
     * Apply scaling to the character sheet
     */
    _applyScaling() {
        const scale = game.settings.get('thirteen-commando', 'characterSheetScale') / 100;
        console.log('Scale factor =>', scale);
        console.log('Element exists:', !!this.element);
        console.log('Element[0] exists:', !!(this.element && this.element[0]));

        if (this.element && this.element[0]) {
            const element = this.element[0];

            console.log('Applying scale transform:', `scale(${scale})`);

            // Clear any existing scaling
            element.style.zoom = '';
            element.style.transform = '';
            element.style.width = '';
            element.style.height = '';

            // Apply zoom scaling to the content
            // The zoom property scales both the content AND the window dimensions
            element.style.zoom = scale;
            
            console.log('Applied zoom scaling - letting zoom handle window size automatically');

            // DON'T call setPosition() - the zoom property handles the window scaling
            // This was causing double scaling (zoom + setPosition)

            // Add a class for any scale-specific styling
            element.classList.toggle('scaled', scale !== 1);
            element.style.setProperty('--sheet-scale', scale);

            console.log('Scaling applied successfully');
        } else {
            console.log('Element not ready for scaling');
        }
    }

    /**
     * Add zoom controls to the sheet (optional)
     */
    _addZoomControls() {
        if (!this.actor.isOwner) return; // Only for owners
        
        const currentScale = game.settings.get('thirteen-commando', 'characterSheetScale');
        
        const zoomControl = $(`
            <div class="zoom-controls" style="
                position: absolute; 
                top: 5px; 
                right: 250px; 
                z-index: 1000;
                display: flex;
                align-items: center;
                gap: 5px;
                background: rgba(0,0,0,0.7);
                padding: 5px;
                border-radius: 4px;
            ">
                <button type="button" class="zoom-out" title="Zoom Out" style="
                    background: none;
                    border: 1px solid #ccc;
                    color: #fff;
                    padding: 2px 6px;
                    cursor: pointer;
                    border-radius: 3px;
                ">
                    <i class="fas fa-search-minus"></i>
                </button>
                <span class="zoom-level" style="
                    color: #fff;
                    font-size: 12px;
                    min-width: 35px;
                    text-align: center;
                ">${currentScale}%</span>
                <button type="button" class="zoom-in" title="Zoom In" style="
                    background: none;
                    border: 1px solid #ccc;
                    color: #fff;
                    padding: 2px 6px;
                    cursor: pointer;
                    border-radius: 3px;
                ">
                    <i class="fas fa-search-plus"></i>
                </button>
            </div>
        `);
        
        this.element.append(zoomControl);
        
        // Add event listeners
        zoomControl.find('.zoom-in').click((e) => {
            e.preventDefault();
            this._adjustZoom(5);
        });
        
        zoomControl.find('.zoom-out').click((e) => {
            e.preventDefault(); 
            this._adjustZoom(-5);
        });
    }

    /**
     * Adjust zoom level
     */
    _adjustZoom(change) {
        const currentZoom = game.settings.get('thirteen-commando', 'characterSheetScale');
        const newZoom = Math.max(50, Math.min(200, currentZoom + change));
        
        game.settings.set('thirteen-commando', 'characterSheetScale', newZoom);
        
        // Update the zoom control display
        this.element.find('.zoom-level').text(`${newZoom}%`);
    }

    /**
     * Get skill total by skill key - DELEGATED TO QUICK SKILLS COMPONENT
     */
    getSkillTotal(skillKey) {
        return this.quickSkills ? this.quickSkills.getSkillTotal(skillKey) : 0;
    }

    /**
     * Get skill display name - DELEGATED TO QUICK SKILLS COMPONENT
     */
    getSkillDisplayName(skillKey) {
        return this.quickSkills ? this.quickSkills.getSkillDisplayName(skillKey) : '';
    }

    /**
     * Handle selecting a quick skill - DELEGATED TO COMPONENT
     */
    async _onSelectQuickSkill(event) {
        console.log('⚡ QUICK SKILL SELECT CLICKED:', {
            slot: event.currentTarget.dataset.slot,
            target: event.currentTarget,
            timestamp: new Date().toISOString()
        });
        event.preventDefault();
        const slot = event.currentTarget.dataset.slot;

        // Use quick skills component
        await this.quickSkills.selectSkillForSlot(slot);
    }

    /**
     * Handle removing a quick skill - DELEGATED TO COMPONENT
     */
    async _onRemoveQuickSkill(event) {
        console.log('⚡ QUICK SKILL REMOVE CLICKED:', {
            slot: event.currentTarget.dataset.slot,
            target: event.currentTarget,
            timestamp: new Date().toISOString()
        });
        event.preventDefault();
        const slot = event.currentTarget.dataset.slot;

        // Use quick skills component
        await this.quickSkills.removeSkillFromSlot(slot);
    }

    /**
     * Check if skill is already selected - DELEGATED TO COMPONENT
     */
    isSkillAlreadySelected(skillKey) {
        return this.quickSkills ? this.quickSkills.isSkillAlreadySelected(skillKey) : false;
    }

    async render(force, options) {
        if (this.rendered && !force) {
            this._preserveScrollPosition();
        }
        
        const result = await super.render(force, options);
        
        if (this._scrollTop !== undefined) {
            setTimeout(() => {
                this._restoreScrollPosition();
            }, 150);
        }
        
        return result;
    }

    async _updateObject(event, formData) {
        this._preserveScrollPosition();
        const result = await super._updateObject(event, formData);
        
        if (this.rendered) {
            setTimeout(() => {
                this._restoreScrollPosition();
            }, 150);
        }
        
        return result;
    }

    _preserveScrollPosition() {
        if (!this.element || !this.element[0]) return;
        
        const sheetBody = this.element.find('.sheet-body')[0];
        if (sheetBody) {
            this._scrollTop = sheetBody.scrollTop;
        }
    }

    _restoreScrollPosition() {
        if (!this.element || !this.element[0] || this._scrollTop === undefined) return;
        
        const sheetBody = this.element.find('.sheet-body')[0];
        if (sheetBody && this._scrollTop > 0) {
            setTimeout(() => {
                sheetBody.scrollTop = this._scrollTop;
            }, 100);
        }
    }

    /**
     * Handle quick skill rolls - DELEGATED TO DICE COMPONENT
     */
    async _onQuickSkillRoll(event) {
        event.preventDefault();
        const element = event.currentTarget;

        const skillKey = element.dataset.skill;
        const skillTotal = parseInt(element.dataset.attribute);
        const skillName = element.dataset.label;

        // Use dice rolling component
        return this.diceRolling.rollQuickSkill(skillKey, skillName, skillTotal);
    }

    /**
     * Override activateListeners to apply scaling after sheet renders
     */
    activateListeners(html) {
        super.activateListeners(html);

        // Apply scaling after the sheet is fully rendered
        this._applyScaling();
        
        // Add zoom controls (optional)
        this._addZoomControls();

        //Damage button Handler
        html.find('.weapon-damage-btn').click(this._onWeaponDamage.bind(this));

        // Exertion system event handlers
        if (this.isEditable) {
            html.find('[data-action="modify-exertion"]').click(this._onModifyExertion.bind(this));
            html.find('[data-action="restore-exertion"]').click(this._onRestoreExertion.bind(this));
        }

        // Morale system event handlers
        if (this.isEditable) {
            html.find('[data-action="morale-recovery"]').click(this._onMoraleRecovery.bind(this));
        }

        // Quick skill management - DELEGATED TO COMPONENT
        html.find('.select-quick-skill').click(this._onSelectQuickSkill.bind(this));
        html.find('.remove-quick-skill').click(this._onRemoveQuickSkill.bind(this));

        // Handle all rollable elements with proper delegation
        html.find('.rollable').click((event) => {
            const element = event.currentTarget;
            const attributeType = element.dataset.attribute;
            const skillType = element.dataset.skill;

            if (attributeType === 'initiative') {
                this._onInitiativeRoll(event);
            } else if (element.closest('.quick-skills')) {
                this._onQuickSkillRoll(event);
            } else if (skillType) {
                // This is a skill roll - use skill rolling system
                this._onSkillRoll(event);
            } else {
                // Regular attribute roll - DELEGATED TO DICE COMPONENT
                this._onRoll(event);
            }
        });

        // === CHARACTER-SPECIFIC LISTENERS ===
        if (this.actor.type === 'character') {
            console.log("Setting up character-specific listeners");
            
            // Initialize wound effects system - DELEGATED TO HEALTH WOUNDS COMPONENT
            this.healthWounds.initializeWoundEffects();

            // Mindset selection - DELEGATED TO COMPONENT
            const mindsetOptions = html.find('.mindset-option');
            if (mindsetOptions.length > 0) {
                mindsetOptions.click(this._onMindsetSelect.bind(this));
            }

            // Guts attribute changes for health box updates
            html.find('input[name="system.attributes.mental.guts.value"], select[name="system.attributes.mental.guts.value"]').on('change input', (event) => {
                setTimeout(() => {
                    this._updateHealthBoxes(html);
                }, 100);
            });

            // Update health boxes for characters only
            this._updateHealthBoxes(html);
            
        } // End character-specific listeners

        console.log("Character-specific setup complete");

        // Health box changes (works for both character and minion)
        html.find('.health input[type="checkbox"]').change(this._onHealthChange.bind(this));

        // Equipment and Item Management - DELEGATED TO COMPONENT
        if (this.isEditable) {
            html.find('.add-item-btn, .add-weapon-btn').click(this._onItemCreate.bind(this));
            html.find('.action-btn').click(this._onItemControl.bind(this));
            html.find('.equipped-checkbox').change(this._onItemToggle.bind(this));
            html.find('.item-name, .weapon-name').click(this._onItemEdit.bind(this));
            
            const editableElements = html.find('.inline-edit');
            if (editableElements.length > 0) {
                editableElements.change(this._onSheetChange.bind(this));
            }
        }

        console.log("Equipment setup complete");

        // === WEAPON SYSTEM EVENT HANDLERS ===
        html.find('.weapon-attack-btn').click(this._onWeaponAttack.bind(this));
        html.find('.weapon-quick-btn').click(this._onWeaponQuickAttack.bind(this));
        html.find('.weapon-reload-btn').click(this._onWeaponReload.bind(this));
        html.find('.weapon-bayonet-btn').click(this._onToggleBayonet.bind(this));
        html.find('.item-edit-btn').click(this._onItemEdit.bind(this));
        html.find('.item-delete-btn').click(this._onItemDelete.bind(this));

        console.log("Weapon system setup complete");
    }

    /**
     * Handle exertion modification
     */
    async _onModifyExertion(event) {
        event.preventDefault();
        event.stopPropagation();
        
        const amount = parseInt(event.currentTarget.dataset.amount);
        
        if (this.actor && this.actor.modifyExertion) {
            try {
                const newValue = await this.actor.modifyExertion(amount);
                
                // Update display with actual current value from actor
                this._updateExertionDisplay(this.actor.system.exertion.value);
            } catch (error) {
                console.error('Error modifying exertion:', error);
                ui.notifications.error('Failed to modify exertion.');
            }
        }
    }

    /**
     * Handle exertion restoration
     */
    async _onRestoreExertion(event) {
        event.preventDefault();
        event.stopPropagation();
        
        if (this.actor && this.actor.restoreExertion) {
            try {
                const newValue = await this.actor.restoreExertion();
                
                // Update display with actual current value from actor
                this._updateExertionDisplay(this.actor.system.exertion.value);
            } catch (error) {
                console.error('Error restoring exertion:', error);
                ui.notifications.error('Failed to restore exertion.');
            }
        }
    }

    /**
     * Update the exertion display element manually
     */
    _updateExertionDisplay(newValue) {
        if (this.element) {
            const exertionDisplay = this.element.find('.exertion-current');
            if (exertionDisplay.length > 0) {
                exertionDisplay.text(newValue);
            }
        }
    }

    /**
     * Handle morale recovery
     */
    async _onMoraleRecovery(event) {
        event.preventDefault();
        event.stopPropagation();
        
        console.log("Morale recovery button clicked");
        
        if (this.actor && this.actor.attemptMoraleRecovery) {
            try {
                const result = await this.actor.attemptMoraleRecovery();
                
                // Update morale display immediately
                this._updateMoraleDisplay();
                
                // Also update exertion display since recovery costs exertion
                this._updateExertionDisplay(this.actor.system.exertion.value);
                
                console.log("Morale recovery completed:", result);
            } catch (error) {
                console.error('Error during morale recovery:', error);
                ui.notifications.error('Failed to attempt morale recovery.');
            }
        } else {
            console.error('Could not find actor or attemptMoraleRecovery method');
            ui.notifications.error('Could not attempt morale recovery - actor not found.');
        }
    }

    /**
     * Update the morale display element manually
     */
    _updateMoraleDisplay() {
        if (!this.element) return;
        
        const moraleState = this.actor.getMoraleState();
        const moraleSection = this.element.find('.morale-section');
        
        if (moraleSection.length > 0) {
            console.log("Updating morale display to:", moraleState.current);
            
            // Update the main morale state element
            const stateElement = moraleSection.find('.morale-state');
            stateElement.attr('data-state', moraleState.current);
            
            // Update state colors and border
            const colorMap = {
                'undaunted': '#2ecc71',
                'suppressed': '#f39c12', 
                'pinned': '#e67e22',
                'shattered': '#e74c3c'
            };
            
            const color = colorMap[moraleState.current] || '#95a5a6';
            stateElement.css({
                'color': color,
                'border-color': color
            });
            
            // Update the icon
            const iconMap = {
                'undaunted': 'fas fa-shield-alt',
                'suppressed': 'fas fa-exclamation-triangle',
                'pinned': 'fas fa-arrow-down', 
                'shattered': 'fas fa-heart-broken'
            };
            
            const iconElement = stateElement.find('i');
            iconElement.attr('class', iconMap[moraleState.current] || 'fas fa-question');
            
            // Update the state name text
            const stateNameElement = stateElement.find('.state-name');
            stateNameElement.text(moraleState.data.name);
            
            // Update recovery button visibility
            const recoveryBtn = moraleSection.find('.morale-recovery-btn');
            if (moraleState.current === 'undaunted' || moraleState.turnRecoveryUsed) {
                recoveryBtn.hide();
            } else {
                recoveryBtn.show();
            }
            
            console.log("Morale display updated successfully");
        } else {
            console.warn("Morale section not found in character sheet");
        }
    }

    /**
     * Handle item creation from buttons - DELEGATED TO COMPONENT
     */
    async _onItemCreate(event) {
        event.preventDefault();
        
        const button = event.currentTarget;
        const type = button.dataset.type || 'equipment';
        
        // Use equipment component
        await this.equipment.createItem(type);
    }

    /**
     * Handle item control actions - DELEGATED TO COMPONENT
     */
    async _onItemControl(event) {
        event.preventDefault();
        const button = event.currentTarget;
        const itemId = button.dataset.itemId;

        if (!itemId) return;

        if (button.classList.contains('edit-btn')) {
            // Use equipment component
            await this.equipment.editItem(itemId);
        } else if (button.classList.contains('delete-btn')) {
            // Use equipment component
            await this.equipment.deleteItem(itemId);
        } else if (button.classList.contains('attack-btn')) {
            // Use equipment component
            await this.equipment.useItem(itemId);
        }
    }

    /**
     * Handle equipment toggle - DELEGATED TO COMPONENT
     */
    async _onItemToggle(event) {
        const checkbox = event.currentTarget;
        const itemId = checkbox.dataset.itemId;
        const equipped = checkbox.checked;

        if (itemId) {
            // Use equipment component
            await this.equipment.toggleEquipped(itemId, equipped);
        }
    }

    /**
     * Handle item editing - DELEGATED TO COMPONENT
     */
    _onItemEdit(event) {
        event.preventDefault();
        const element = event.currentTarget;
        const itemId = element.dataset.itemId;
        
        if (itemId) {
            // Use equipment component
            this.equipment.editItem(itemId);
        }
    }

    /**
     * Handle weapon damage roll
     */
    async _onWeaponDamage(event) {
        event.preventDefault();
        event.stopPropagation();

        const button = event.currentTarget;
        const itemId = button.dataset.itemId;
        const item = this.actor.items.get(itemId);

        if (!item) {
            ui.notifications.error("Weapon not found!");
            return;
        }

        console.log(`Rolling damage for ${item.name}`);

        try {
            await game.thirteenCommando.WeaponAttackDialog.show(this.actor, item, target.actor);
            //await game.thirteenCommando.WeaponAttackDialog.show(this.actor, item, target.document);
        } catch (error) {
            console.error("Damage roll failed:", error);
            ui.notifications.error("Damage roll failed!");
        }
    }

    /**
     * Handle skill rolls from combat/general skill grids - DELEGATED TO DICE COMPONENT
     */
    async _onSkillRoll(event) {
        event.preventDefault();
        const element = event.currentTarget;
        const skillName = element.dataset.skill;
        
        if (!skillName) {
            console.warn('No skill name found for roll');
            return;
        }
        
        // Determine skill category and create full skill key
        let skillKey = '';
        if (element.closest('.combat-skills-grid')) {
            skillKey = `combat.${skillName}`;
        } else if (element.closest('.general-skills-grid')) {
            skillKey = `general.${skillName}`;
        } else {
            // Try to determine from context or default to general
            skillKey = `general.${skillName}`;
        }
        
        console.log(`Rolling skill: ${skillKey}`);
        
        // Use dice rolling component for skill rolls
        return this.diceRolling.rollSkill(skillKey);
    }

    /**
     * Handle rollable element clicks - DELEGATED TO DICE COMPONENT
     */
    async _onRoll(event) {
        event.preventDefault();
        const element = event.currentTarget;
        const dataset = element.dataset;

        // Get the attribute path and label
        const attributePath = dataset.attribute;
        const label = dataset.label;

        // Use dice rolling component for all attribute rolls
        return this.diceRolling.rollAttribute(attributePath, label);
    }

    /**
     * Handle initiative rolls - DELEGATED TO INITIATIVE COMPONENT
     */
    async _onInitiativeRoll(event) {
        event.preventDefault();
        
        // Use initiative component for all initiative rolling
        return this.initiative.rollInitiative();
    }

    /**
     * Handle mindset selection - DELEGATED TO COMPONENT
     */
    async _onMindsetSelect(event) {
        event.preventDefault();
        const mindset = event.currentTarget.dataset.mindset;
        
        // Clear previous selection visually
        const mindsetOptions = event.currentTarget.parentElement.querySelectorAll('.mindset-option');
        mindsetOptions.forEach(option => option.classList.remove('selected'));
        
        // Select clicked option visually
        event.currentTarget.classList.add('selected');
        
        // Use mindset-breeding component
        await this.mindsetBreeding.setMindset(mindset);
    }

    /**
     * Handle health box changes - DELEGATED TO HEALTH WOUNDS COMPONENT + MORALE
     */
    async _onHealthChange(event) {
        // Call health wounds component first (existing logic)
        const result = await this.healthWounds.onHealthBoxChange(event);
        
        // NEW: Handle morale damage when damage is taken
        const checkbox = event.currentTarget;
        if (checkbox.checked && checkbox.name.includes('system.health.')) {
            // Damage taken - apply morale damage
            const damageSource = this._determineDamageSource(event);
            await this.actor.applyMoraleDamage(damageSource);
            
            // Update morale display after damage
            this._updateMoraleDisplay();
        }
        
        return result;
    }

    /**
     * Determine damage source from context
     */
    _determineDamageSource(event) {
        // Try to determine source from combat or context
        if (game.combat?.started) {
            const currentCombatant = game.combat.combatant;
            if (currentCombatant && currentCombatant.actor.id !== this.actor.id) {
                return `${currentCombatant.actor.name}'s Attack`;
            }
            return 'Combat Damage';
        }
        return 'Enemy Fire';
    }

    /**
     * Update health boxes based on Guts - DELEGATED TO HEALTH WOUNDS COMPONENT
     */
    _updateHealthBoxes(html) {
        const gutsValue = parseInt(this.actor.system.attributes.mental.guts.value) || 1;
        
        const gutsDependent = html.find('.guts-dependent');
        
        gutsDependent.each((index, checkbox) => {
            const $checkbox = $(checkbox);
            const requiredGuts = parseInt($checkbox.data('guts-required'));
            
            if (gutsValue >= requiredGuts) {
                $checkbox.prop('disabled', false);
                $checkbox.parent().css('opacity', '1');
            } else {
                $checkbox.prop('disabled', true);
                $checkbox.parent().css('opacity', '0.4');
                
                if ($checkbox.prop('checked')) {
                    $checkbox.prop('checked', false);
                    const updateData = {};
                    updateData[checkbox.name] = false;
                    this.actor.update(updateData);
                }
            }
        });
    }

    /**
     * Calculate total breeding bonus for a category - DELEGATED TO COMPONENT
     */
    _getTotalBreedingBonus(category) {
        return this.mindsetBreeding ? this.mindsetBreeding.calculateBreedingBonusForCategory(category) : 0;
    }

    /**
     * Handle item drops - DELEGATED TO COMPONENT
     */
    async _onDropItem(event, data) {
        if (!this.actor.isOwner) return false;
        
        const item = await Item.implementation.fromDropData(data);
        const itemData = item.toObject();

        // Handle item sorting within the same actor
        if (this.actor.uuid === item.parent?.uuid) {
            return this.equipment.sortItem(event, itemData);
        }

        // Create the item on this actor - DELEGATED TO COMPONENT
        return this.equipment.createItemFromDrop(itemData);
    }

    /**
     * Handle creating a new item for the actor using item data - DELEGATED TO COMPONENT
     */
    async _onDropItemCreate(itemData) {
        // This method is now handled by the equipment component
        return this.equipment.createItemFromDrop(itemData);
    }

    // === WEAPON EVENT HANDLERS ===

    /**
     * Handle weapon attack using enhanced dialog
     */
    async _onWeaponAttack(event) {
        event.preventDefault();
        event.stopPropagation();
        
        const button = event.currentTarget;
        const itemId = button.dataset.itemId;
        const item = this.actor.items.get(itemId);
        
        if (!item) {
            ui.notifications.error("Weapon not found!");
            return;
        }
        
        if (item.type !== 'weapon') {
            ui.notifications.warn("Only weapons can attack.");
            return;
        }
        
        if (!item.system.equipped) {
            ui.notifications.warn("Weapon must be equipped to attack.");
            return;
        }
        
        // === TARGET VALIDATION ===
        const targets = Array.from(game.user.targets);
        
        if (targets.length === 0) {
            ui.notifications.warn("No target selected! Please target an enemy before attacking.");
            return;
        }
        
        if (targets.length > 1) {
            ui.notifications.warn("Multiple targets selected! Please select only one target.");
            return;
        }
        
        const target = targets[0];
        
        // Validate target has an actor
        if (!target.actor) {
            ui.notifications.error("Invalid target! Selected token has no associated actor.");
            return;
        }
        
        // Validate target is not the same as attacker
        if (target.actor.id === this.actor.id) {
            ui.notifications.warn("Cannot attack yourself!");
            return;
        }
        
        // Validate target is not friendly (optional - you might want to allow friendly fire)
        // if (target.actor.type === 'character') {
        //     ui.notifications.warn("Cannot attack friendly characters!");
        //     return;
        // }
        
        console.log(`Attacking target: ${target.actor.name} (${target.actor.type})`);
        const attackerToken = canvas.tokens.controlled[0];
        const targetToken = target;
        const distanceInSquares = canvas.grid.measureDistance(attackerToken, targetToken);
        const distanceInYards = Math.round(distanceInSquares);

        console.log(`Distance: ${distanceInYards} yards`);

        try {
            await game.thirteenCommando.WeaponAttackDialog.show(this.actor, item, target.actor, distanceInYards);
        } catch (error) {
            console.error("Failed to launch attack dialog:", error);
            ui.notifications.error("Failed to open attack dialog!");
        }
    }

    /**
     * Handle quick attack
     */
    async _onWeaponQuickAttack(event) {
        event.preventDefault();
        event.stopPropagation();
        
        const button = event.currentTarget;
        const itemId = button.dataset.itemId;
        const item = this.actor.items.get(itemId);
        
        if (!item || !item.system.equipped) {
            ui.notifications.warn("Weapon must be equipped for quick attack.");
            return;
        }
        
        console.log(`Quick attack with ${item.name}`);
        
        try {
            await item.quickAttack();
        } catch (error) {
            console.error("Quick attack failed:", error);
            ui.notifications.error("Quick attack failed!");
        }
    }

    /**
     * Handle weapon reload
     */
    async _onWeaponReload(event) {
        event.preventDefault();
        event.stopPropagation();
        
        const button = event.currentTarget;
        const itemId = button.dataset.itemId;
        const item = this.actor.items.get(itemId);
        
        if (!item) {
            ui.notifications.error("Weapon not found!");
            return;
        }
        
        console.log(`Reloading ${item.name}`);
        
        try {
            await item.reload();
        } catch (error) {
            console.error("Reload failed:", error);
            ui.notifications.error("Reload failed!");
        }
    }

    /**
     * Handle bayonet toggle
     */
    async _onToggleBayonet(event) {
        event.preventDefault();
        event.stopPropagation();
        
        const button = event.currentTarget;
        const itemId = button.dataset.itemId;
        const item = this.actor.items.get(itemId);
        
        if (!item) {
            ui.notifications.error("Weapon not found!");
            return;
        }
        
        console.log(`Toggling bayonet on ${item.name}`);
        
        try {
            await item.toggleBayonet();
        } catch (error) {
            console.error("Bayonet toggle failed:", error);
            ui.notifications.error("Bayonet toggle failed!");
        }
    }

    /**
     * Handle item delete with confirmation
     */
    async _onItemDelete(event) {
        event.preventDefault();
        event.stopPropagation();
        
        const button = event.currentTarget;
        const itemId = button.dataset.itemId;
        const item = this.actor.items.get(itemId);
        
        if (!item) {
            ui.notifications.error("Item not found!");
            return;
        }
        
        // Confirmation dialog
        const confirmed = await Dialog.confirm({
            title: "Delete Item",
            content: `<p>Are you sure you want to delete <strong>${item.name}</strong>?</p>
                      <p><em>This action cannot be undone.</em></p>`,
            yes: () => true,
            no: () => false,
            defaultYes: false
        });
        
        if (confirmed) {
            console.log(`Deleting ${item.name}`);
            await item.delete();
            ui.notifications.info(`${item.name} deleted.`);
        }
    }
}