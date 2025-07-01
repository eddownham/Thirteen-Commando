/**
 * Dice Rolling Component for Thirteen Commando
 * Handles all dice rolling logic and UI interactions
 * UPDATED: Now includes skill + attribute dice pools and difficulty system
 */
export class DiceRolling {
    
    constructor(actor) {
        this.actor = actor;
    }

    /**
     * Show dialog to determine if roll is skilled or unskilled
     * @param {string} attributeName - Name of the attribute being rolled
     * @returns {Promise<boolean|null>} - True for skilled, false for unskilled, null for cancelled
     */
    async showSkillDialog(attributeName) {
        return new Promise((resolve) => {
            const dialog = new Dialog({
                title: `${attributeName} Roll`,
                content: `
                    <div style="text-align: center; padding: 20px;">
                        <h3>Is this a skilled or unskilled roll?</h3>
                        <p style="margin: 15px 0; color: #666;">
                            <strong>Skilled:</strong> 5-6 count as successes<br>
                            <strong>Unskilled:</strong> Only 6 counts as success
                        </p>
                    </div>
                `,
                buttons: {
                    skilled: {
                        label: "Skilled (5-6 pass)",
                        callback: () => resolve(true),
                        icon: '<i class="fas fa-graduation-cap"></i>'
                    },
                    unskilled: {
                        label: "Unskilled (6 pass)",
                        callback: () => resolve(false),
                        icon: '<i class="fas fa-question"></i>'
                    },
                    cancel: {
                        label: "Cancel",
                        callback: () => resolve(null),
                        icon: '<i class="fas fa-times"></i>'
                    }
                },
                default: "skilled",
                close: () => resolve(null)
            });
            dialog.render(true);
        });
    }

    /**
     * Calculate successes based on dice results and skill level
     * @param {Array} diceResults - Array of dice result objects
     * @param {boolean} skilled - Whether this is a skilled roll
     * @returns {number} - Number of successes
     */
    calculateSuccesses(diceResults, skilled) {
        return diceResults.reduce((successes, die) => {
            const value = die.result;
            if (skilled) {
                // Skilled: 5 and 6 are successes
                return successes + (value >= 5 ? 1 : 0);
            } else {
                // Unskilled: only 6 is success
                return successes + (value === 6 ? 1 : 0);
            }
        }, 0);
    }

    /**
     * Format dice results for chat display with colored success/failure indicators
     * @param {Array} diceResults - Array of dice result objects
     * @param {boolean} skilled - Whether this is a skilled roll
     * @returns {string} - Formatted HTML string of dice results
     */
    formatDiceResults(diceResults, skilled) {
        return diceResults.map(die => {
            const value = die.result;
            let className = '';
            
            if (skilled && value >= 5) {
                className = 'success';
            } else if (!skilled && value === 6) {
                className = 'success';
            } else {
                className = 'failure';
            }
            
            return `<span class="die-result ${className}">${value}</span>`;
        }).join(' ');
    }

    /**
     * Determine result classification based on successes vs failures
     * @param {number} successes - Number of successes rolled
     * @param {number} totalDice - Total number of dice rolled
     * @returns {Object} - Result object with text, class, and color
     */
    determineResult(successes, totalDice) {
        const failed = totalDice - successes;
        
        if (successes === 0) {
            return {
                text: '<strong style="color: #e74c3c;">CRITICAL FAILURE</strong>',
                class: 'critical-failure',
                color: '#e74c3c'
            };
        } else if (successes >= totalDice) {
            return {
                text: '<strong style="color: #27ae60;">CRITICAL SUCCESS</strong>',
                class: 'critical-success',
                color: '#27ae60'
            };
        } else if (successes > failed) {
            return {
                text: '<strong style="color: #2ecc71;">SUCCESS</strong>',
                class: 'success',
                color: '#2ecc71'
            };
        } else {
            return {
                text: '<strong style="color: #e67e22;">FAILURE</strong>',
                class: 'failure',
                color: '#e67e22'
            };
        }
    }

    /**
     * Determine result vs difficulty
     * @param {number} successes - Number of successes rolled
     * @param {number} difficulty - Target difficulty
     * @returns {Object} - Result object with text, class, and color
     */
    determineResultVsDifficulty(successes, difficulty) {
        const margin = successes - difficulty;
        
        if (successes === 0) {
            return {
                text: '<strong style="color: #e74c3c;">CRITICAL FAILURE</strong>',
                class: 'critical-failure',
                color: '#e74c3c',
                margin: margin
            };
        } else if (margin >= difficulty && difficulty > 0) {
            return {
                text: '<strong style="color: #27ae60;">CRITICAL SUCCESS</strong>',
                class: 'critical-success', 
                color: '#27ae60',
                margin: margin
            };
        } else if (margin > 0) {
            return {
                text: '<strong style="color: #2ecc71;">SUCCESS</strong>',
                class: 'success',
                color: '#2ecc71',
                margin: margin
            };
        } else if (margin === 0) {
            return {
                text: '<strong style="color: #f39c12;">BARELY SUCCESS</strong>',
                class: 'barely-success',
                color: '#f39c12',
                margin: margin
            };
        } else {
            return {
                text: '<strong style="color: #e67e22;">FAILURE</strong>',
                class: 'failure',
                color: '#e67e22',
                margin: margin
            };
        }
    }

    /**
     * Get skill attribute assignment
     * @param {string} skillKey - The skill key (e.g., "combat.rifles")
     * @returns {string} - The attribute path for this skill
     */
    getSkillAttribute(skillKey) {
        if (!skillKey) return '';

        const [category, skillName] = skillKey.split('.');

        // Skill to attribute mappings
        const skillAttributeMap = {
            // Combat Skills
            'heavyweapons': 'system.attributes.physical.might.value',
            'explosiveordinance': 'system.attributes.mental.intelligence.value',
            'grenadethrowing': 'system.attributes.physical.coordination.value',
            'machinegunner': 'system.attributes.physical.coordination.value',
            'meleecombat': 'system.attributes.physical.might.value',
            'pistols': 'system.attributes.physical.coordination.value',
            'rifles': 'system.attributes.physical.coordination.value',
            'submachineguns': 'system.attributes.physical.coordination.value',
            'unarmedcombat': 'system.attributes.physical.might.value',
            
            // General Skills
            'athletics': 'system.attributes.physical.might.value',
            'climb': 'system.attributes.physical.might.value',
            'concealmentcamouflage': 'system.attributes.mental.intelligence.value',
            'cryptography': 'system.attributes.mental.intelligence.value',
            'endurance': 'system.attributes.physical.endurance.value',
            'firstaid': 'system.attributes.mental.intelligence.value',
            'linguistics': 'system.attributes.mental.intelligence.value',
            'navigation': 'system.attributes.mental.intelligence.value',
            'parachuting': 'system.attributes.physical.coordination.value',
            'radiooperations': 'system.attributes.mental.intelligence.value',
            'stalking': 'system.attributes.physical.coordination.value',
            'survival': 'system.attributes.mental.guts.value',
            'swimming': 'system.attributes.physical.endurance.value'
        };

        // Handle custom skills - default to coordination
        if (category === 'custom') {
            return 'system.attributes.physical.coordination.value';
        }

        return skillAttributeMap[skillName] || 'system.attributes.physical.coordination.value';
    }

    /**
     * Get attribute name from attribute path
     * @param {string} attributePath - The attribute path
     * @returns {string} - Human readable attribute name
     */
    getAttributeDisplayName(attributePath) {
        const attributeNames = {
            'system.attributes.physical.might.value': 'Might',
            'system.attributes.physical.coordination.value': 'Coordination',
            'system.attributes.physical.endurance.value': 'Endurance',
            'system.attributes.mental.intelligence.value': 'Intelligence',
            'system.attributes.mental.guile.value': 'Guile',
            'system.attributes.mental.guts.value': 'Guts',
            'system.attributes.social.bearing.value': 'Bearing',
            'system.attributes.social.charm.value': 'Charm',
            'system.attributes.social.composure.value': 'Composure'
        };

        return attributeNames[attributePath] || 'Unknown';
    }

    /**
     * Get skill total by skill key (helper method)
     * @param {string} skillKey - The skill key in format "category.skillname"
     * @returns {number} - The total skill value
     */
    getSkillTotal(skillKey) {
        if (!skillKey) return 0;

        const [category, skillName] = skillKey.split('.');
        const skill = this.actor.system.skills[category]?.[skillName];
        if (!skill) return 0;

        return (skill.breeding || 0) + (skill.commando || 0) +
            (skill.primary || 0) + (skill.secondary || 0) + (skill.tertiary || 0);
    }

    /**
     * Calculate dice pool for a skill (skill total + attribute value)
     * @param {string} skillKey - The skill key
     * @returns {Object} - Dice pool information
     */
    calculateSkillDicePool(skillKey) {
        const skillTotal = this.getSkillTotal(skillKey);
        const attributePath = this.getSkillAttribute(skillKey);
        const attributeValue = foundry.utils.getProperty(this.actor, attributePath) || 0;
        const attributeName = this.getAttributeDisplayName(attributePath);
        
        return {
            skillKey: skillKey,
            skillName: this.getSkillDisplayName(skillKey),
            skillTotal: skillTotal,
            attributePath: attributePath,
            attributeName: attributeName,
            attributeValue: attributeValue,
            dicePool: skillTotal + attributeValue,
            breakdown: `${skillTotal} (skill) + ${attributeValue} (${attributeName}) = ${skillTotal + attributeValue} dice`
        };
    }

    /**
     * Execute a skill roll using skill + attribute dice pool
     * @param {string} skillKey - The skill key (e.g., "combat.rifles")
     * @param {number} difficulty - Target difficulty (optional, default 0)
     * @returns {Promise<Roll|null>} - The completed roll or null if cancelled
     */
    async rollSkill(skillKey, difficulty = 0) {
        const dicePool = this.calculateSkillDicePool(skillKey);
        
        if (dicePool.dicePool <= 0) {
            ui.notifications.warn(`${dicePool.skillName} has no dice to roll.`);
            return null;
        }

        console.log(`Rolling ${dicePool.skillName}: ${dicePool.breakdown}`);

        // Show skill dialog
        const skilled = await this.showSkillDialog(dicePool.skillName);
        if (skilled === null) return null; // User cancelled

        // Create and execute the roll
        const roll = new Roll(`${dicePool.dicePool}d6`);
        await roll.evaluate();

        // Calculate successes
        const successes = this.calculateSuccesses(roll.dice[0].results, skilled);
        const failed = dicePool.dicePool - successes;

        // Determine result (with difficulty comparison if provided)
        const result = difficulty > 0 ? 
            this.determineResultVsDifficulty(successes, difficulty) :
            this.determineResult(successes, dicePool.dicePool);

        // Create roll data object
        const rollData = {
            actorName: this.actor.name,
            rollName: dicePool.skillName,
            diceCount: dicePool.dicePool,
            breakdown: dicePool.breakdown,
            skilled: skilled,
            diceResults: roll.dice[0].results,
            successes: successes,
            failed: failed,
            difficulty: difficulty,
            result: result
        };

        // Create chat content
        const chatContent = this.createSkillChatContent(rollData);

        // Send to chat
        await ChatMessage.create({
            user: game.user.id,
            speaker: ChatMessage.getSpeaker({ actor: this.actor }),
            content: chatContent,
            rolls: [roll]
        });

        return roll;
    }

    /**
     * Execute a quick skill roll using skill + attribute dice pool
     * @param {string} skillKey - The skill key (e.g., "combat.rifles")
     * @param {string} skillName - Display name for the skill (legacy parameter)
     * @param {number} skillTotal - Total skill value (legacy parameter)
     * @returns {Promise<Roll|null>} - The completed roll or null if cancelled
     */
    async rollQuickSkill(skillKey, skillName, skillTotal) {
        // Use new dice pool system instead of legacy parameters
        return await this.rollSkill(skillKey);
    }

    /**
     * Roll weapon attack using weapon's proficiency skill
     * @param {Object} weapon - Weapon item
     * @param {number} difficulty - Target difficulty (optional)
     * @returns {Promise<Roll|null>} - The completed roll or null if cancelled
     */
    async rollWeaponAttack(weapon, difficulty = 0) {
        const proficiency = weapon.system.proficiency || 'rifles';
        const skillKey = `combat.${proficiency}`;
        
        const dicePool = this.calculateSkillDicePool(skillKey);
        
        if (dicePool.dicePool <= 0) {
            ui.notifications.warn(`No skill in ${dicePool.skillName} to attack with ${weapon.name}`);
            return null;
        }

        console.log(`Rolling weapon attack with ${weapon.name}: ${dicePool.breakdown}`);

        // Show skill dialog
        const skilled = await this.showSkillDialog(`${weapon.name} Attack`);
        if (skilled === null) return null;

        // Create and execute the roll
        const roll = new Roll(`${dicePool.dicePool}d6`);
        await roll.evaluate();

        // Calculate successes
        const successes = this.calculateSuccesses(roll.dice[0].results, skilled);
        const failed = dicePool.dicePool - successes;

        // Determine result
        const result = difficulty > 0 ? 
            this.determineResultVsDifficulty(successes, difficulty) :
            this.determineResult(successes, dicePool.dicePool);

        // Create weapon attack chat content
        const chatContent = this.createWeaponAttackChatContent({
            actorName: this.actor.name,
            weaponName: weapon.name,
            skillName: dicePool.skillName,
            diceCount: dicePool.dicePool,
            breakdown: dicePool.breakdown,
            skilled: skilled,
            diceResults: roll.dice[0].results,
            successes: successes,
            failed: failed,
            difficulty: difficulty,
            result: result,
            damage: weapon.system.damage?.primary?.dice || '2d6'
        });

        // Send to chat
        await ChatMessage.create({
            user: game.user.id,
            speaker: ChatMessage.getSpeaker({ actor: this.actor }),
            content: chatContent,
            rolls: [roll]
        });

        return roll;
    }

    /**
     * Create formatted chat content for a dice roll
     * @param {Object} rollData - Roll data object
     * @returns {string} - Formatted HTML chat content
     */
    createChatContent(rollData) {
        const {
            actorName,
            rollName,
            diceCount,
            skilled,
            diceResults,
            successes,
            failed,
            result
        } = rollData;

        const skillType = skilled ? 'Skilled' : 'Unskilled';
        const passThreshold = skilled ? '5-6' : '6';
        
        return `
            <div class="thirteen-commando-roll">
                <div class="roll-header">
                    <h3>${rollName} Roll (${skillType})</h3>
                    <p><strong>${actorName}</strong> rolls ${diceCount}d6</p>
                </div>
                
                <div class="roll-details">
                    <p><strong>Pass on:</strong> ${passThreshold}</p>
                    <p><strong>Dice Results:</strong> ${this.formatDiceResults(diceResults, skilled)}</p>
                </div>
                
                <div class="roll-result ${result.class}">
                    <p><strong>Successes:</strong> ${successes} | <strong>Failures:</strong> ${failed}</p>
                    <p>${result.text}</p>
                </div>
            </div>
        `;
    }

    /**
     * Create formatted chat content for a skill roll
     * @param {Object} rollData - Roll data object
     * @returns {string} - Formatted HTML chat content
     */
    createSkillChatContent(rollData) {
        const {
            actorName,
            rollName,
            diceCount,
            breakdown,
            skilled,
            diceResults,
            successes,
            failed,
            difficulty,
            result
        } = rollData;

        const skillType = skilled ? 'Skilled' : 'Unskilled';
        const passThreshold = skilled ? '5-6' : '6';
        
        let difficultyText = '';
        if (difficulty > 0) {
            const margin = result.margin;
            const marginText = margin > 0 ? `+${margin}` : `${margin}`;
            difficultyText = `
                <p><strong>Target Difficulty:</strong> ${difficulty}</p>
                <p><strong>Margin:</strong> ${marginText} (${successes} successes - ${difficulty} difficulty)</p>
            `;
        }
        
        return `
            <div class="thirteen-commando-roll skill-roll">
                <div class="roll-header">
                    <h3>${rollName} Roll (${skillType})</h3>
                    <p><strong>${actorName}</strong> rolls ${diceCount}d6</p>
                </div>
                
                <div class="roll-details">
                    <p><strong>Dice Pool:</strong> ${breakdown}</p>
                    <p><strong>Pass on:</strong> ${passThreshold}</p>
                    <p><strong>Dice Results:</strong> ${this.formatDiceResults(diceResults, skilled)}</p>
                    ${difficultyText}
                </div>
                
                <div class="roll-result ${result.class}">
                    <p><strong>Successes:</strong> ${successes} | <strong>Failures:</strong> ${failed}</p>
                    <p>${result.text}</p>
                </div>
            </div>
        `;
    }

    /**
     * Create formatted chat content for weapon attacks
     * @param {Object} rollData - Weapon attack roll data
     * @returns {string} - Formatted HTML chat content
     */
    createWeaponAttackChatContent(rollData) {
        const {
            actorName,
            weaponName,
            skillName,
            diceCount,
            breakdown,
            skilled,
            diceResults,
            successes,
            failed,
            difficulty,
            result,
            damage
        } = rollData;

        const skillType = skilled ? 'Skilled' : 'Unskilled';
        const passThreshold = skilled ? '5-6' : '6';
        
        let difficultyText = '';
        if (difficulty > 0) {
            const margin = result.margin;
            const marginText = margin > 0 ? `+${margin}` : `${margin}`;
            difficultyText = `
                <p><strong>Target Difficulty:</strong> ${difficulty}</p>
                <p><strong>Margin:</strong> ${marginText}</p>
            `;
        }
        
        return `
            <div class="thirteen-commando-roll weapon-attack-roll">
                <div class="roll-header">
                    <h3>🎯 ${weaponName} Attack</h3>
                    <p><strong>${actorName}</strong> attacks with ${weaponName}</p>
                </div>
                
                <div class="roll-details">
                    <p><strong>Skill:</strong> ${skillName} (${skillType})</p>
                    <p><strong>Dice Pool:</strong> ${breakdown}</p>
                    <p><strong>Pass on:</strong> ${passThreshold}</p>
                    <p><strong>Dice Results:</strong> ${this.formatDiceResults(diceResults, skilled)}</p>
                    ${difficultyText}
                </div>
                
                <div class="roll-result ${result.class}">
                    <p><strong>Successes:</strong> ${successes} | <strong>Failures:</strong> ${failed}</p>
                    <p>${result.text}</p>
                    ${successes > 0 ? `<p><strong>Damage:</strong> ${damage}</p>` : ''}
                </div>
            </div>
        `;
    }

    /**
     * Execute a complete attribute roll with UI and chat output
     * @param {string} attributePath - Path to the attribute (e.g., "system.attributes.physical.might.value")
     * @param {string} label - Display name for the roll
     * @returns {Promise<Roll|null>} - The completed roll or null if cancelled
     */
    async rollAttribute(attributePath, label) {
        // Get the current attribute value
        const attributeValue = foundry.utils.getProperty(this.actor, attributePath);
        
        if (!attributeValue || attributeValue <= 0) {
            ui.notifications.warn(`${label} has no value to roll.`);
            return null;
        }

        console.log(`Preparing to roll ${label}: ${attributeValue}d6`);

        // Show skill dialog
        const skilled = await this.showSkillDialog(label);
        if (skilled === null) return null; // User cancelled

        // Create and execute the roll
        const roll = new Roll(`${attributeValue}d6`);
        await roll.evaluate();

        // Calculate successes based on skilled/unskilled
        const successes = this.calculateSuccesses(roll.dice[0].results, skilled);
        const failed = attributeValue - successes;

        // Determine result
        const result = this.determineResult(successes, attributeValue);

        // Create roll data object
        const rollData = {
            actorName: this.actor.name,
            rollName: label,
            diceCount: attributeValue,
            skilled: skilled,
            diceResults: roll.dice[0].results,
            successes: successes,
            failed: failed,
            result: result
        };

        // Create chat content
        const chatContent = this.createChatContent(rollData);

        // Send to chat
        await ChatMessage.create({
            user: game.user.id,
            speaker: ChatMessage.getSpeaker({ actor: this.actor }),
            content: chatContent,
            rolls: [roll]
        });

        return roll;
    }

    /**
     * Get skill display name (helper method for quick skills)
     * @param {string} skillKey - The skill key in format "category.skillname"
     * @returns {string} - The display name for the skill
     */
    getSkillDisplayName(skillKey) {
        if (!skillKey) return '';

        const [category, skillName] = skillKey.split('.');

        // Handle custom skills
        if (category === 'custom') {
            const customSkill = this.actor.system.skills.custom[skillName];
            return customSkill?.name || `Custom ${skillName.slice(-1)}`;
        }

        // Handle all predefined skills
        const skillNames = {
            'heavyweapons': 'Heavy Weapons',
            'explosiveordinance': 'Explosive Ordinance',
            'grenadethrowing': 'Grenade Throwing',
            'machinegunner': 'Machine Gunner',
            'meleecombat': 'Melee Combat',
            'pistols': 'Pistols',
            'rifles': 'Rifles',
            'submachineguns': 'Submachine Guns',
            'unarmedcombat': 'Unarmed Combat',
            'athletics': 'Athletics',
            'climb': 'Climb',
            'concealmentcamouflage': 'Concealment & Camouflage',
            'cryptography': 'Cryptography',
            'endurance': 'Endurance',
            'firstaid': 'First Aid',
            'linguistics': 'Linguistics',
            'navigation': 'Navigation',
            'parachuting': 'Parachuting',
            'radiooperations': 'Radio Operations',
            'stalking': 'Stalking',
            'survival': 'Survival',
            'swimming': 'Swimming'
        };

        return skillNames[skillName] || skillName;
    }
}