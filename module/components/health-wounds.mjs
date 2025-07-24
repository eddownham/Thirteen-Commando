/**
 * Health and Wounds Component for Thirteen Commando
 * Handles wound effects, health box management, and wound template system
 * NO FALLBACK VERSION - Requires proper effect templates
 */
export class HealthWounds {
    
    constructor(actor) {
        this.actor = actor;
        this.woundEffectsInitialized = false;
        this.woundUpdateTimeout = null;
        
        // Wound severity levels with penalties (most severe applied)
        this.woundLevels = [
            { name: 'dead', penalty: -10, label: 'Dead' },
            { name: 'critical2', penalty: -4, label: 'Critical 2' },
            { name: 'critical1', penalty: -4, label: 'Critical 1' },
            { name: 'injured2', penalty: -3, label: 'Injured 2' },
            { name: 'injured1', penalty: -3, label: 'Injured 1' },
            { name: 'hurt2', penalty: -2, label: 'Hurt 2' },
            { name: 'hurt1', penalty: -2, label: 'Hurt 1' },
            { name: 'grazed2', penalty: -1, label: 'Grazed 2' },
            { name: 'grazed1', penalty: -1, label: 'Grazed 1' },
            { name: 'bruised2', penalty: -1, label: 'Bruised 2' },
            { name: 'bruised1', penalty: -1, label: 'Bruised 1' }   
        ];
    }

    /**
     * Initialize wound effects system
     */
    initializeWoundEffects() {
        if (!this.woundEffectsInitialized) {
            this.woundEffectsInitialized = true;
            
            if (this.woundUpdateTimeout) {
                clearTimeout(this.woundUpdateTimeout);
            }
            
            this.woundUpdateTimeout = setTimeout(() => {
                this.updateWoundEffects();
            }, 100);
        }
    }

    /**
     * Update health boxes based on Guts attribute
     */
    updateHealthBoxes() {
        const guts = this.actor.system.attributes?.mental?.guts?.value || 1;
        
        // Health box requirements based on Guts
        const healthBoxes = {
            bruised1: { required: 1, available: true },
            bruised2: { required: 5, available: guts >= 5 },
            grazed1: { required: 1, available: true },
            grazed2: { required: 5, available: guts >= 5 },
            hurt1: { required: 1, available: true },
            hurt2: { required: 4, available: guts >= 4 },
            injured1: { required: 1, available: true },
            injured2: { required: 3, available: guts >= 3 },
            critical1: { required: 1, available: true },
            critical2: { required: 2, available: guts >= 2 },
            dead: { required: 1, available: true }
        };

        return healthBoxes;
    }

    /**
     * Handle health box changes
     */
    async onHealthBoxChange(event) {
        const checkbox = event.currentTarget;
        const woundType = checkbox.name;
        const isChecked = checkbox.checked;

        console.log(`Health box ${woundType} changed to: ${isChecked}`);

        // Update actor data
        await this.actor.update({
            [`system.health.${woundType}`]: isChecked
        });

        // Update wound effects after a brief delay
        setTimeout(() => {
            this.updateWoundEffects();
        }, 100);
    }

    /**
     * Get current wound severity
     */
    getCurrentWoundSeverity() {
        const health = this.actor.system.health || {};
        
        // Check each wound level from most severe to least
        for (const level of this.woundLevels) {
            if (health[level.name]) {
                return level;
            }
        }
        
        return null; // No wounds
    }

    /**
     * Update wound effects based on current health
     */
    async updateWoundEffects() {
        console.log('🔄 updateWoundEffects called');
        console.log('Stack trace:', new Error().stack);
        const currentWound = this.getCurrentWoundSeverity();
        
        // Remove all existing wound effects
        await this.removeAllWoundEffects();
        
        // Apply new wound effect if wounded
        if (currentWound) {
            await this.createWoundEffect(currentWound);
        }
    }

    /**
     * Remove all wound effects from actor
     */
    async removeAllWoundEffects() {
        const woundEffects = this.actor.effects.filter(effect => 
            effect.getFlag('thirteen-commando', 'isWoundEffect')
        );

        if (woundEffects.length > 0) {
            const effectIds = woundEffects.map(effect => effect.id);
            await this.actor.deleteEmbeddedDocuments('ActiveEffect', effectIds);
            console.log(`Removed ${effectIds.length} wound effects`);
        }
    }

    /**
     * Create wound effect based on wound type - NO FALLBACK VERSION
     */
    async createWoundEffect(woundLevel) {
        console.log(`🩸 createWoundEffect called for: ${woundLevel.name}`);
        console.log('Stack trace:', new Error().stack);
        try {
            // CHECK IF WOUND EFFECT ALREADY EXISTS
            const existingWoundEffect = this.actor.effects.find(effect => 
                effect.getFlag('thirteen-commando', 'isWoundEffect') && 
                effect.getFlag('thirteen-commando', 'woundLevel') === woundLevel.name
            );

            if (existingWoundEffect) {
                console.log(`Wound effect for ${woundLevel.name} already exists: ${existingWoundEffect.name}`);
                return; // Don't create a duplicate
            }

            const templates = this.actor.getEffectTemplates();
            
            const woundTemplateMap = {
                'dead': 'Dead',
                'critical1': 'Critical',
                'critical2': 'Critical', 
                'injured1': 'Injured',
                'injured2': 'Injured',
                'hurt1': 'Hurt', 
                'hurt2': 'Hurt',
                'grazed1': 'Grazed',
                'grazed2': 'Grazed',
                'bruised1': 'Bruised',
                'bruised2': 'Bruised'
            };
            
            const templateName = woundTemplateMap[woundLevel.name];
            
            if (!templateName) {
                // Show error dialog instead of fallback
                ui.notifications.error(`No wound template mapping found for ${woundLevel.name}`);
                this._showMissingTemplateDialog(woundLevel.name, 'Unknown');
                return;
            }
            
            const woundTemplate = templates.medical?.find(template => 
                template.name === templateName
            );
            
            if (woundTemplate) {
                console.log(`Using template: ${templateName} for wound: ${woundLevel.name}`);
                
                const effectData = {
                    name: `${woundTemplate.name} (${woundLevel.name})`,
                    icon: woundTemplate.icon,
                    origin: this.actor.uuid,
                    disabled: false,
                    duration: foundry.utils.deepClone(woundTemplate.duration),
                    description: woundTemplate.description,
                    changes: foundry.utils.deepClone(woundTemplate.changes),
                    flags: foundry.utils.mergeObject(
                        foundry.utils.deepClone(woundTemplate.flags || {}),
                        {
                            'thirteen-commando': {
                                isWoundEffect: true,
                                woundLevel: woundLevel.name,
                                templateId: woundTemplate.id,
                                templateName: templateName,
                                createdAt: Date.now()
                            }
                        }
                    )
                };
                
                await this.actor.createEmbeddedDocuments('ActiveEffect', [effectData]);
                console.log(`Created wound effect: ${effectData.name}`);
                
            } else {
                // Show error dialog instead of fallback
                console.error(`Template ${templateName} not found in medical templates`);
                this._showMissingTemplateDialog(woundLevel.name, templateName);
            }
            
        } catch (error) {
            console.error('Error applying wound template:', error);
            ui.notifications.error(`Failed to apply wound effect for ${woundLevel.name}: ${error.message}`);
        }
    }

    /**
     * Show dialog when required wound template is missing
     */
    _showMissingTemplateDialog(woundLevel, templateName) {
        new Dialog({
            title: "Missing Wound Effect Template",
            content: `
                <div style="margin-bottom: 15px;">
                    <h3 style="color: #d4af37; margin-bottom: 10px;">Required Effect Template Missing</h3>
                    <p><strong>Wound Level:</strong> ${woundLevel}</p>
                    <p><strong>Required Template:</strong> ${templateName}</p>
                    <p style="margin-top: 15px; color: #e74c3c;">
                        <i class="fas fa-exclamation-triangle"></i> 
                        You need to create this effect template before wound effects can be applied.
                    </p>
                </div>
                <div style="background: rgba(52, 73, 94, 0.3); padding: 10px; border-radius: 5px;">
                    <p><strong>To fix this:</strong></p>
                    <ol style="margin: 10px 0; padding-left: 20px;">
                        <li>Open <strong>Game Settings</strong></li>
                        <li>Click <strong>Manage Effect Templates</strong></li>
                        <li>Go to the <strong>Medical</strong> tab</li>
                        <li>Create a template named <strong>"${templateName}"</strong></li>
                        <li>Configure the appropriate attribute penalties</li>
                    </ol>
                </div>
            `,
            buttons: {
                openManager: {
                    icon: '<i class="fas fa-magic"></i>',
                    label: "Open Effect Manager",
                    callback: () => {
                        // Try to open the effect template manager
                        try {
                            game.thirteenCommando.EffectTemplateManager.show();
                        } catch (error) {
                            console.error('Could not open effect manager:', error);
                            ui.notifications.warn('Please access Effect Templates through Game Settings');
                        }
                    }
                },
                close: {
                    icon: '<i class="fas fa-times"></i>',
                    label: "Close"
                }
            },
            default: "openManager"
        }, {
            width: 500,
            classes: ["thirteen-commando", "missing-template-dialog"]
        }).render(true);
    }

    /**
     * Get wound statistics
     */
    getWoundStatistics() {
        const health = this.actor.system.health || {};
        const currentWound = this.getCurrentWoundSeverity();
        
        const stats = {
            currentWound: currentWound ? currentWound.label : 'Healthy',
            currentPenalty: currentWound ? currentWound.penalty : 0,
            totalWounds: 0,
            woundsByType: {
                bruised: 0,
                grazed: 0, 
                hurt: 0,
                injured: 0,
                critical: 0
            }
        };

        // Count wounds by type
        Object.keys(health).forEach(woundType => {
            if (health[woundType]) {
                stats.totalWounds++;
                
                if (woundType.includes('bruised')) stats.woundsByType.bruised++;
                else if (woundType.includes('grazed')) stats.woundsByType.grazed++;
                else if (woundType.includes('hurt')) stats.woundsByType.hurt++;
                else if (woundType.includes('injured')) stats.woundsByType.injured++;
                else if (woundType.includes('critical')) stats.woundsByType.critical++;
            }
        });

        return stats;
    }

    /**
     * Heal wounds of specific type
     */
    async healWounds(woundType = 'all') {
        const health = this.actor.system.health || {};
        const updates = {};

        if (woundType === 'all') {
            // Heal all wounds
            Object.keys(health).forEach(key => {
                if (health[key] && key !== 'dead') {
                    updates[`system.health.${key}`] = false;
                }
            });
        } else {
            // Heal specific wound type
            Object.keys(health).forEach(key => {
                if (health[key] && key.includes(woundType)) {
                    updates[`system.health.${key}`] = false;
                }
            });
        }

        if (Object.keys(updates).length > 0) {
            await this.actor.update(updates);
            ui.notifications.info(`Healed ${Object.keys(updates).length} wounds`);
            
            // Update effects
            setTimeout(() => {
                this.updateWoundEffects();
            }, 100);
        } else {
            ui.notifications.warn(`No ${woundType === 'all' ? '' : woundType + ' '}wounds to heal`);
        }
    }

    /**
     * Apply damage (mark wounds)
     */
    async applyDamage(severity = 'grazed') {
        const health = this.actor.system.health || {};
        const healthBoxes = this.updateHealthBoxes();
        
        // Find first available wound box of specified severity
        const woundKeys = Object.keys(health).filter(key => 
            key.includes(severity) && healthBoxes[key]?.available && !health[key]
        );
        
        if (woundKeys.length > 0) {
            const woundKey = woundKeys[0];
            await this.actor.update({
                [`system.health.${woundKey}`]: true
            });
            
            ui.notifications.info(`Applied ${severity} wound: ${woundKey}`);
            
            // Update effects
            setTimeout(() => {
                this.updateWoundEffects();
            }, 100);
        } else {
            ui.notifications.warn(`No available ${severity} wound boxes (check Guts requirement)`);
        }
    }

    /**
     * Get health box data for template rendering
     */
    getHealthBoxData() {
        const health = this.actor.system.health || {};
        const healthBoxes = this.updateHealthBoxes();
        
        return Object.keys(healthBoxes).map(key => ({
            key: key,
            checked: health[key] || false,
            available: healthBoxes[key].available,
            required: healthBoxes[key].required,
            label: key.charAt(0).toUpperCase() + key.slice(1).replace(/(\d)/, ' $1'),
            disabled: !healthBoxes[key].available
        }));
    }

    /**
     * Debug wound system
     */
    debugWoundSystem() {
        const stats = this.getWoundStatistics();
        const healthBoxes = this.updateHealthBoxes();
        const woundEffects = this.actor.effects.filter(e => e.getFlag('thirteen-commando', 'isWoundEffect'));
        
        console.group('🩸 Wound System Debug');
        console.log('Current Status:', stats.currentWound, `(${stats.currentPenalty})`);
        console.log('Total Wounds:', stats.totalWounds);
        console.log('Wounds by Type:', stats.woundsByType);
        console.log('Available Health Boxes:', Object.keys(healthBoxes).filter(k => healthBoxes[k].available));
        console.log('Active Wound Effects:', woundEffects.map(e => ({
            name: e.name,
            id: e.id,
            createdAt: e.getFlag('thirteen-commando', 'createdAt')
        })));
        console.log('Guts Value:', this.actor.system.attributes?.mental?.guts?.value);
        console.groupEnd();
        
        return {
            stats,
            healthBoxes,
            woundEffects: woundEffects.length,
            guts: this.actor.system.attributes?.mental?.guts?.value
        };
    }

    /**
     * Create custom wound effect
     */
    async createCustomWoundEffect(name, penalty, changes, duration = null) {
        const effectData = {
            name: `${name} (${penalty})`,
            icon: "icons/svg/blood.svg", 
            description: `Custom wound effect: ${name}`,
            changes: changes,
            flags: {
                'thirteen-commando': {
                    isWoundEffect: true,
                    customWound: true,
                    severity: penalty,
                    createdAt: Date.now()
                }
            },
            disabled: false,
            transfer: false
        };

        if (duration) {
            effectData.duration = duration;
        }

        await this.actor.createEmbeddedDocuments('ActiveEffect', [effectData]);
        console.log(`Created custom wound effect: ${name}`);
    }
}