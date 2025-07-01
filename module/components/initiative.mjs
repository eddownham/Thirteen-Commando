/**
 * Initiative Component for Thirteen Commando
 * Handles initiative rolling, effects calculation, and combat integration
 */
export class Initiative {
    
    constructor(actor) {
        this.actor = actor;
    }

    /**
     * Calculate the base initiative value (Coordination + Guile)
     * @returns {number} - Base initiative before effects and bonuses
     */
    calculateBaseInitiative() {
        const coordination = parseInt(this.actor.system.attributes.physical.coordination.value) || 0;
        const guile = parseInt(this.actor.system.attributes.mental.guile.value) || 0;
        
        return coordination + guile;
    }

    /**
     * Calculate initiative bonuses from Active Effects
     * @returns {number} - Total initiative bonus from effects
     */
    calculateInitiativeEffects() {
        let totalBonus = 0;
        
        // Check for Active Effects that modify initiative
        const effects = this.actor.effects || [];
        
        for (const effect of effects) {
            if (effect.disabled) continue;
            
            for (const change of effect.changes || []) {
                // Look for initiative-related changes
                if (change.key === 'system.initiative.bonus' || 
                    change.key === 'system.initiative.value') {
                    
                    const value = parseInt(change.value) || 0;
                    
                    switch (change.mode) {
                        case 1: // MULTIPLY
                            // For initiative, multiply is rarely used but supported
                            totalBonus = Math.floor(totalBonus * value);
                            break;
                        case 2: // ADD
                            totalBonus += value;
                            break;
                        case 3: // DOWNGRADE (take lower)
                            totalBonus = Math.min(totalBonus, value);
                            break;
                        case 4: // UPGRADE (take higher)
                            totalBonus = Math.max(totalBonus, value);
                            break;
                        case 5: // OVERRIDE
                            totalBonus = value;
                            break;
                        default:
                            totalBonus += value;
                    }
                }
            }
        }
        
        return totalBonus;
    }

    /**
     * Get the system-defined initiative bonus
     * @returns {number} - Initiative bonus from character system
     */
    getSystemInitiativeBonus() {
        return parseInt(this.actor.system.initiative?.bonus) || 0;
    }

    /**
     * Calculate total initiative modifier (effects + system bonus)
     * @returns {number} - Total modifier to add to base initiative
     */
    calculateTotalInitiativeModifier() {
        const systemBonus = this.getSystemInitiativeBonus();
        const effectsBonus = this.calculateInitiativeEffects();
        
        return systemBonus + effectsBonus;
    }

    /**
     * Get breakdown of initiative calculation for display
     * @returns {Object} - Breakdown object with all components
     */
    getInitiativeBreakdown() {
        const coordination = parseInt(this.actor.system.attributes.physical.coordination.value) || 0;
        const guile = parseInt(this.actor.system.attributes.mental.guile.value) || 0;
        const baseInitiative = coordination + guile;
        const systemBonus = this.getSystemInitiativeBonus();
        const effectsBonus = this.calculateInitiativeEffects();
        const totalModifier = systemBonus + effectsBonus;
        
        return {
            coordination: coordination,
            guile: guile,
            base: baseInitiative,
            systemBonus: systemBonus,
            effectsBonus: effectsBonus,
            totalModifier: totalModifier,
            finalBase: baseInitiative + totalModifier
        };
    }

    /**
     * Create formatted chat content for initiative roll
     * @param {Object} rollData - Initiative roll data
     * @returns {string} - Formatted HTML chat content
     */
    createInitiativeChatContent(rollData) {
        const {
            actorName,
            breakdown,
            diceRoll,
            finalTotal
        } = rollData;

        let breakdownText = `<strong>Base:</strong> ${breakdown.coordination} (Coordination) + ${breakdown.guile} (Guile) = ${breakdown.base}`;
        
        // Add modifiers if they exist
        if (breakdown.totalModifier !== 0) {
            const modifierParts = [];
            
            if (breakdown.systemBonus !== 0) {
                modifierParts.push(`${breakdown.systemBonus} (System)`);
            }
            
            if (breakdown.effectsBonus !== 0) {
                modifierParts.push(`${breakdown.effectsBonus} (Effects)`);
            }
            
            if (modifierParts.length > 0) {
                const sign = breakdown.totalModifier >= 0 ? '+' : '';
                breakdownText += `<br><strong>Modifiers:</strong> ${sign}${breakdown.totalModifier} (${modifierParts.join(', ')})`;
                breakdownText += `<br><strong>Modified Base:</strong> ${breakdown.finalBase}`;
            }
        }

        return `
            <div class="thirteen-commando-roll initiative-roll">
                <div class="roll-header">
                    <h3>Initiative Roll</h3>
                    <p><strong>${actorName}</strong> rolls initiative</p>
                </div>
                <div class="roll-details">
                    <p>${breakdownText}</p>
                    <p><strong>Roll:</strong> ${breakdown.finalBase} + 1d10 (${diceRoll}) = <strong>${finalTotal}</strong></p>
                </div>
                <div class="roll-result">
                    <p><strong>Final Initiative: ${finalTotal}</strong></p>
                </div>
            </div>
        `;
    }

    /**
     * Update combat tracker with initiative result
     * @param {number} initiativeTotal - The final initiative total
     * @returns {Promise<boolean>} - Success/failure of combat update
     */
    async updateCombatTracker(initiativeTotal) {
        const combat = game.combat;
        
        if (!combat) {
            console.log('No active combat');
            ui.notifications.info(`Initiative rolled: ${initiativeTotal} (no active combat)`);
            return false;
        }

        const combatant = combat.combatants.find(c => c.actor.id === this.actor.id);
        
        if (!combatant) {
            console.log('Actor not found in current combat');
            ui.notifications.info(`Initiative rolled: ${initiativeTotal} (not in combat)`);
            return false;
        }

        try {
            await combat.setInitiative(combatant.id, initiativeTotal);
            console.log(`Updated initiative for ${this.actor.name}: ${initiativeTotal}`);
            ui.notifications.info(`Initiative updated: ${initiativeTotal}`);
            return true;
        } catch (error) {
            console.error('Failed to update combat initiative:', error);
            ui.notifications.warn('Failed to update combat tracker');
            return false;
        }
    }

    /**
     * Execute a complete initiative roll with all calculations and updates
     * @returns {Promise<Roll>} - The completed initiative roll
     */
    async rollInitiative() {
        // Get initiative breakdown
        const breakdown = this.getInitiativeBreakdown();
        
        console.log(`Rolling initiative for ${this.actor.name}:`, breakdown);

        // Create and execute the 1d10 roll
        const roll = new Roll(`${breakdown.finalBase} + 1d10`);
        await roll.evaluate();

        // Extract the d10 result for display
        const diceRoll = roll.terms[2]?.results?.[0]?.result || 0;
        const finalTotal = roll.total;

        // Create roll data for chat
        const rollData = {
            actorName: this.actor.name,
            breakdown: breakdown,
            diceRoll: diceRoll,
            finalTotal: finalTotal
        };

        // Create chat content
        const chatContent = this.createInitiativeChatContent(rollData);

        // Send to chat
        await ChatMessage.create({
            user: game.user.id,
            speaker: ChatMessage.getSpeaker({ actor: this.actor }),
            content: chatContent,
            rolls: [roll]
        });

        // Update combat tracker
        await this.updateCombatTracker(finalTotal);

        return roll;
    }

    /**
     * Get all active initiative effects for display/debugging
     * @returns {Array} - Array of active initiative effects
     */
    getActiveInitiativeEffects() {
        const initiativeEffects = [];
        const effects = this.actor.effects || [];
        
        for (const effect of effects) {
            if (effect.disabled) continue;
            
            const relevantChanges = effect.changes.filter(change => 
                change.key === 'system.initiative.bonus' || 
                change.key === 'system.initiative.value'
            );
            
            if (relevantChanges.length > 0) {
                initiativeEffects.push({
                    name: effect.name,
                    icon: effect.img,
                    changes: relevantChanges,
                    origin: effect.origin
                });
            }
        }
        
        return initiativeEffects;
    }

    /**
     * Debug method to log initiative calculation details
     */
    debugInitiative() {
        const breakdown = this.getInitiativeBreakdown();
        const activeEffects = this.getActiveInitiativeEffects();
        
        console.group(`Initiative Debug for ${this.actor.name}`);
        console.log('Breakdown:', breakdown);
        console.log('Active Effects:', activeEffects);
        console.log('System Initiative Data:', this.actor.system.initiative);
        console.groupEnd();
    }

    /**
     * Manual method to set initiative bonus (for items, spells, etc.)
     * @param {number} bonus - Bonus to set
     * @param {string} source - Source of the bonus for tracking
     */
    async setInitiativeBonus(bonus, source = 'Manual') {
        await this.actor.update({
            'system.initiative.bonus': bonus
        });
        
        console.log(`Set initiative bonus for ${this.actor.name}: ${bonus} (${source})`);
    }

    /**
     * Create a temporary initiative effect
     * @param {string} name - Name of the effect
     * @param {number} bonus - Initiative bonus
     * @param {Object} duration - Duration object (rounds, seconds, etc.)
     * @param {string} icon - Icon for the effect
     */
    async createInitiativeEffect(name, bonus, duration = {}, icon = 'icons/svg/lightning.svg') {
        const effectData = {
            name: name,
            icon: icon,
            origin: this.actor.uuid,
            disabled: false,
            duration: duration,
            changes: [
                {
                    key: 'system.initiative.bonus',
                    mode: 2, // ADD mode
                    value: bonus,
                    priority: 20
                }
            ],
            flags: {
                'thirteen-commando': {
                    isInitiativeEffect: true,
                    bonus: bonus
                }
            }
        };

        try {
            await ActiveEffect.create(effectData, {parent: this.actor});
            console.log(`Created initiative effect "${name}" with ${bonus} bonus`);
            ui.notifications.info(`Applied ${name}: ${bonus >= 0 ? '+' : ''}${bonus} initiative`);
        } catch (error) {
            console.error('Failed to create initiative effect:', error);
            ui.notifications.error('Failed to create initiative effect');
        }
    }
}