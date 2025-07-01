/**
 * Health and Wounds Component for Thirteen Commando
 * Handles wound effects, health box management, and wound template system
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

        // Wound effect templates
        this.woundEffectTemplates = {
            grazed: {
                name: "Grazed Wound",
                description: "Light wound causing minor coordination penalty",
                changes: [
                    { key: "system.attributes.physical.coordination.value", mode: 2, value: -1, priority: 20 }
                ]
            },
            hurt: {
                name: "Hurt Wound", 
                description: "Moderate wound affecting physical attributes",
                changes: [
                    { key: "system.attributes.physical.might.value", mode: 2, value: -2, priority: 20 },
                    { key: "system.attributes.physical.coordination.value", mode: 2, value: -2, priority: 20 },
                    { key: "system.attributes.physical.endurance.value", mode: 2, value: -2, priority: 20 }
                ]
            },
            injured: {
                name: "Injured Wound",
                description: "Serious wound affecting physical and mental attributes", 
                changes: [
                    { key: "system.attributes.physical.might.value", mode: 2, value: -3, priority: 20 },
                    { key: "system.attributes.physical.coordination.value", mode: 2, value: -3, priority: 20 },
                    { key: "system.attributes.physical.endurance.value", mode: 2, value: -3, priority: 20 },
                    { key: "system.attributes.mental.guts.value", mode: 2, value: -1, priority: 20 }
                ]
            },
            critical: {
                name: "Critical Wound",
                description: "Life-threatening wound severely affecting all attributes",
                changes: [
                    { key: "system.attributes.physical.might.value", mode: 2, value: -4, priority: 20 },
                    { key: "system.attributes.physical.coordination.value", mode: 2, value: -4, priority: 20 },
                    { key: "system.attributes.physical.endurance.value", mode: 2, value: -4, priority: 20 },
                    { key: "system.attributes.mental.intelligence.value", mode: 2, value: -2, priority: 20 },
                    { key: "system.attributes.mental.guile.value", mode: 2, value: -2, priority: 20 },
                    { key: "system.attributes.mental.guts.value", mode: 2, value: -2, priority: 20 }
                ]
            }
        };
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
     * Create wound effect based on wound type - USES TEMPLATE SYSTEM
     */
    async createWoundEffect(woundLevel) {
        try {
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
                await this._createHardcodedWoundEffect(woundLevel);
                return;
            }
            
            const woundTemplate = templates.medical?.find(template => 
                template.name === templateName
            );
            
            if (woundTemplate) {
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
                                templateName: templateName
                            }
                        }
                    )
                };
                
                try {
                    await ActiveEffect.create(effectData, {parent: this.actor});
                } catch (error) {
                    await this.actor.createEmbeddedDocuments('ActiveEffect', [effectData]);
                }
                
                console.log(`Created wound effect: ${effectData.name}`);
                return;
            } else {
                await this._createHardcodedWoundEffect(woundLevel);
            }
            
        } catch (error) {
            console.error('Error applying wound template:', error);
            await this._createHardcodedWoundEffect(woundLevel);
        }
    }

    /**
     * Create hardcoded wound effect as fallback
     */
    async _createHardcodedWoundEffect(wound) {
        const effectData = {
            name: `Wound: ${wound.label}`,
            icon: 'icons/svg/blood.svg',
            origin: this.actor.uuid,
            disabled: false,
            duration: {
                permanent: true
            },
            description: wound.description,
            changes: [
                {
                    key: 'system.woundPenalty',
                    mode: 2,
                    value: wound.penalty,
                    priority: 20
                }
            ],
            flags: {
                'thirteen-commando': {
                    isWoundEffect: true,
                    woundLevel: wound.name,
                    woundPenalty: wound.penalty
                }
            }
        };

        if (wound.penalty <= -4) {
            effectData.changes.push(
                {
                    key: 'system.attributes.physical.might.value',
                    mode: 2,
                    value: wound.penalty,
                    priority: 20
                },
                {
                    key: 'system.attributes.physical.coordination.value', 
                    mode: 2,
                    value: wound.penalty,
                    priority: 20
                },
                {
                    key: 'system.attributes.mental.intelligence.value',
                    mode: 2,
                    value: Math.floor(wound.penalty / 2),
                    priority: 20
                }
            );
        } else if (wound.penalty <= -3) {
            effectData.changes.push(
                {
                    key: 'system.attributes.physical.might.value',
                    mode: 2,
                    value: wound.penalty,
                    priority: 20
                },
                {
                    key: 'system.attributes.physical.coordination.value',
                    mode: 2,
                    value: wound.penalty,
                    priority: 20
                },
                {
                    key: 'system.attributes.mental.intelligence.value',
                    mode: 2,
                    value: -1,
                    priority: 20
                }
            );
        } else if (wound.penalty <= -2) {
            effectData.changes.push(
                {
                    key: 'system.attributes.physical.might.value',
                    mode: 2,
                    value: wound.penalty,
                    priority: 20
                },
                {
                    key: 'system.attributes.physical.coordination.value',
                    mode: 2,
                    value: wound.penalty,
                    priority: 20
                }
            );
        } else if (wound.penalty <= -1) {
            effectData.changes.push(
                {
                    key: 'system.attributes.physical.coordination.value',
                    mode: 2,
                    value: wound.penalty,
                    priority: 20
                }
            );
        }

        try {
            await ActiveEffect.create(effectData, {parent: this.actor});
        } catch (error) {
            try {
                await this.actor.createEmbeddedDocuments('ActiveEffect', [effectData]);
            } catch (error2) {
                console.error('Alternative method also failed:', error2);
                ui.notifications.error('Failed to create wound effect. Check console for details.');
            }
        }
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
        console.log('Active Wound Effects:', woundEffects.map(e => e.name));
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
                    severity: penalty
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

    /**
     * Get wound effect templates for external use
     */
    getWoundEffectTemplates() {
        return foundry.utils.deepClone(this.woundEffectTemplates);
    }

    /**
     * Modify wound effect template
     */
    setWoundEffectTemplate(woundType, template) {
        if (this.woundEffectTemplates[woundType]) {
            this.woundEffectTemplates[woundType] = foundry.utils.mergeObject(
                this.woundEffectTemplates[woundType], 
                template
            );
            console.log(`Updated wound effect template: ${woundType}`);
        } else {
            console.warn(`Unknown wound type: ${woundType}`);
        }
    }
}