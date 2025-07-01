/**
 * Quick Skills Component for Thirteen Commando
 * Handles quick skill slot management, selection, and UI interactions
 */
export class QuickSkills {
    
    constructor(actor) {
        this.actor = actor;
        this.maxSlots = 6; // Number of quick skill slots available
    }

    /**
     * Get all available skills organized by category
     * @returns {Array} - Array of skill objects with key, name, total, category
     */
    getAllAvailableSkills() {
        const allSkills = [];

        // Add combat skills
        const combatSkills = {
            'heavyweapons': 'Heavy Weapons',
            'explosiveordinance': 'Explosive Ordinance',
            'grenadethrowing': 'Grenade Throwing',
            'machinegunner': 'Machine Gunner',
            'meleecombat': 'Melee Combat',
            'pistols': 'Pistols',
            'rifles': 'Rifles',
            'submachineguns': 'Submachine Guns',
            'unarmedcombat': 'Unarmed Combat'
        };

        Object.entries(combatSkills).forEach(([key, name]) => {
            allSkills.push({
                key: `combat.${key}`,
                name: name,
                total: this.getSkillTotal(`combat.${key}`),
                category: 'Combat'
            });
        });

        // Add general skills
        const generalSkills = {
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

        Object.entries(generalSkills).forEach(([key, name]) => {
            allSkills.push({
                key: `general.${key}`,
                name: name,
                total: this.getSkillTotal(`general.${key}`),
                category: 'General'
            });
        });

        // Add custom skills (only if they have names)
        Object.keys(this.actor.system.skills.custom || {}).forEach(skillKey => {
            const customSkill = this.actor.system.skills.custom[skillKey];
            if (customSkill.name) {
                allSkills.push({
                    key: `custom.${skillKey}`,
                    name: customSkill.name,
                    total: this.getSkillTotal(`custom.${skillKey}`),
                    category: 'Custom'
                });
            }
        });

        // Sort by category then name
        allSkills.sort((a, b) => {
            if (a.category !== b.category) {
                return a.category.localeCompare(b.category);
            }
            return a.name.localeCompare(b.name);
        });

        return allSkills;
    }

    /**
     * Get skill total by skill key
     * @param {string} skillKey - The skill key in format "category.skillname"
     * @returns {number} - The total skill value
     */
    getSkillTotal(skillKey) {
        if (!skillKey) return 0;

        const [category, skillName] = skillKey.split('.');
        const skill = this.actor.system.skills[category]?.[skillName];
        if (!skill) return 0;

        return (skill.breeding || 0) + (skill.commando || 0) +
            (skill.primary || 0) + (skill.secondary || 0) + (skill.tertiary || 0) +
            (skill.modifier || 0); // Include Active Effects modifier
    }

    /**
     * Get skill display name by skill key
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

    /**
     * Get current quick skills configuration
     * @returns {Object} - Quick skills data for all slots
     */
    getQuickSkillsData() {
        const quickSkills = this.actor.system.quickSkills || {};
        const quickSkillsData = {};

        for (let i = 1; i <= this.maxSlots; i++) {
            const slotKey = `slot${i}`;
            const skillKey = quickSkills[slotKey];

            if (skillKey) {
                quickSkillsData[slotKey] = {
                    skillKey: skillKey,
                    name: this.getSkillDisplayName(skillKey),
                    total: this.getSkillTotal(skillKey),
                    isEmpty: false
                };
            } else {
                quickSkillsData[slotKey] = {
                    skillKey: '',
                    name: '',
                    total: 0,
                    isEmpty: true
                };
            }
        }

        return quickSkillsData;
    }

    /**
     * Check if a skill is already selected in quick skills
     * @param {string} skillKey - The skill key to check
     * @returns {boolean} - True if skill is already selected
     */
    isSkillAlreadySelected(skillKey) {
        const quickSkills = this.actor.system.quickSkills || {};
        return Object.values(quickSkills).includes(skillKey);
    }

    /**
     * Get available skills for selection (excluding already selected)
     * @returns {Array} - Array of available skills
     */
    getAvailableSkillsForSelection() {
        const allSkills = this.getAllAvailableSkills();
        return allSkills.filter(skill => !this.isSkillAlreadySelected(skill.key));
    }

    /**
     * Create skill selection dialog HTML content
     * @param {string} slot - The slot being filled (e.g., "slot1")
     * @returns {string} - HTML content for the dialog
     */
    createSkillSelectionDialogContent(slot) {
        const allSkills = this.getAllAvailableSkills();
        const slotNumber = slot.replace('slot', '');

        const skillOptions = allSkills.map(skill => {
            const isAlreadySelected = this.isSkillAlreadySelected(skill.key);
            const disabledAttr = isAlreadySelected ? 'disabled' : '';
            const disabledText = isAlreadySelected ? ' (Already selected)' : '';
            const optionStyle = isAlreadySelected ? 
                'style="color: #777; background: #333;"' : 
                'style="color: #ecf0f1; background: #2c3e50;"';

            return `<option value="${skill.key}" ${disabledAttr} ${optionStyle}>[${skill.category}] ${skill.name} (${skill.total})${disabledText}</option>`;
        }).join('');

        return `
        <div style="padding: 20px; background: #34495e; color: #ecf0f1;">
            <h3 style="color: #d4af37; margin-bottom: 15px;">Select Skill for Quick Access</h3>
            <p style="margin-bottom: 15px;">Choose a skill to add to slot ${slotNumber}:</p>
            <select id="skill-selector" style="width: 100%; padding: 12px; margin: 10px 0; background: #2c3e50; color: #ecf0f1; border: 2px solid #95a5a6; border-radius: 6px; font-size: 14px; height: 120px;" size="8">
                <option value="" style="color: #95a5a6;">-- Select a Skill --</option>
                ${skillOptions}
            </select>
            <p style="font-size: 0.9em; color: #95a5a6; margin-top: 15px;">
                <i class="fas fa-info-circle"></i> Already selected skills are grayed out and disabled.
            </p>
        </div>`;
    }

    /**
     * Show skill selection dialog
     * @param {string} slot - The slot to fill (e.g., "slot1") 
     * @returns {Promise<string|null>} - Selected skill key or null if cancelled
     */
    async showSkillSelectionDialog(slot) {
        const content = this.createSkillSelectionDialogContent(slot);

        return new Promise((resolve) => {
            new Dialog({
                title: "Select Quick Skill",
                content: content,
                buttons: {
                    select: {
                        label: "Add to Quick Skills",
                        callback: (html) => {
                            const selectedSkill = html.find("#skill-selector").val();
                            if (selectedSkill) {
                                resolve(selectedSkill);
                            } else {
                                ui.notifications.warn("Please select a skill.");
                                resolve(null);
                            }
                        }
                    },
                    cancel: {
                        label: "Cancel",
                        callback: () => resolve(null)
                    }
                },
                default: "select"
            }).render(true);
        });
    }

    /**
     * Add a skill to a quick slot
     * @param {string} slot - The slot to fill (e.g., "slot1")
     * @param {string} skillKey - The skill key to add
     * @returns {Promise<boolean>} - Success/failure
     */
    async addSkillToSlot(slot, skillKey) {
        try {
            // Validate slot
            if (!slot.match(/^slot[1-6]$/)) {
                console.error(`Invalid slot: ${slot}`);
                return false;
            }

            // Validate skill exists
            const skillTotal = this.getSkillTotal(skillKey);
            const skillName = this.getSkillDisplayName(skillKey);
            
            if (!skillName) {
                console.error(`Invalid skill: ${skillKey}`);
                return false;
            }

            // Check if skill is already selected
            if (this.isSkillAlreadySelected(skillKey)) {
                ui.notifications.warn("This skill is already in quick access.");
                return false;
            }

            // Update actor
            await this.actor.update({
                [`system.quickSkills.${slot}`]: skillKey
            });

            ui.notifications.info(`Added ${skillName} to quick access.`);
            console.log(`Added skill ${skillKey} to ${slot}`);
            return true;

        } catch (error) {
            console.error('Failed to add skill to slot:', error);
            ui.notifications.error('Failed to add skill to quick access.');
            return false;
        }
    }

    /**
     * Remove a skill from a quick slot
     * @param {string} slot - The slot to clear (e.g., "slot1")
     * @returns {Promise<boolean>} - Success/failure
     */
    async removeSkillFromSlot(slot) {
        try {
            // Validate slot
            if (!slot.match(/^slot[1-6]$/)) {
                console.error(`Invalid slot: ${slot}`);
                return false;
            }

            // Get current skill name for notification
            const quickSkills = this.actor.system.quickSkills || {};
            const currentSkill = quickSkills[slot];
            const skillName = currentSkill ? this.getSkillDisplayName(currentSkill) : 'Unknown';

            // Update actor
            await this.actor.update({
                [`system.quickSkills.${slot}`]: ""
            });

            ui.notifications.info(`Removed ${skillName} from quick access.`);
            console.log(`Removed skill from ${slot}`);
            return true;

        } catch (error) {
            console.error('Failed to remove skill from slot:', error);
            ui.notifications.error('Failed to remove skill from quick access.');
            return false;
        }
    }

    /**
     * Handle skill selection for a slot
     * @param {string} slot - The slot to fill
     * @returns {Promise<boolean>} - Success/failure
     */
    async selectSkillForSlot(slot) {
        const selectedSkill = await this.showSkillSelectionDialog(slot);
        
        if (selectedSkill) {
            return await this.addSkillToSlot(slot, selectedSkill);
        }
        
        return false;
    }

    /**
     * Swap skills between two slots
     * @param {string} slot1 - First slot
     * @param {string} slot2 - Second slot
     * @returns {Promise<boolean>} - Success/failure
     */
    async swapSkills(slot1, slot2) {
        try {
            const quickSkills = this.actor.system.quickSkills || {};
            const skill1 = quickSkills[slot1] || "";
            const skill2 = quickSkills[slot2] || "";

            await this.actor.update({
                [`system.quickSkills.${slot1}`]: skill2,
                [`system.quickSkills.${slot2}`]: skill1
            });

            console.log(`Swapped skills between ${slot1} and ${slot2}`);
            return true;

        } catch (error) {
            console.error('Failed to swap skills:', error);
            ui.notifications.error('Failed to swap skills.');
            return false;
        }
    }

    /**
     * Clear all quick skills
     * @returns {Promise<boolean>} - Success/failure
     */
    async clearAllQuickSkills() {
        try {
            const updateData = {};
            for (let i = 1; i <= this.maxSlots; i++) {
                updateData[`system.quickSkills.slot${i}`] = "";
            }

            await this.actor.update(updateData);
            ui.notifications.info("Cleared all quick skills.");
            console.log("Cleared all quick skills");
            return true;

        } catch (error) {
            console.error('Failed to clear quick skills:', error);
            ui.notifications.error('Failed to clear quick skills.');
            return false;
        }
    }

    /**
     * Get quick skills statistics
     * @returns {Object} - Statistics about quick skills usage
     */
    getQuickSkillsStats() {
        const quickSkills = this.actor.system.quickSkills || {};
        const usedSlots = Object.values(quickSkills).filter(skill => skill).length;
        
        return {
            totalSlots: this.maxSlots,
            usedSlots: usedSlots,
            emptySlots: this.maxSlots - usedSlots,
            utilizationPercent: Math.round((usedSlots / this.maxSlots) * 100)
        };
    }

    /**
     * Auto-fill quick skills with highest skills
     * @param {number} count - Number of slots to fill (default: all empty slots)
     * @returns {Promise<boolean>} - Success/failure
     */
    async autoFillQuickSkills(count = null) {
        try {
            const stats = this.getQuickSkillsStats();
            const slotsToFill = count || stats.emptySlots;
            
            if (slotsToFill === 0) {
                ui.notifications.info("All quick skill slots are already filled.");
                return true;
            }

            // Get available skills sorted by total (highest first)
            const availableSkills = this.getAvailableSkillsForSelection()
                .sort((a, b) => b.total - a.total)
                .slice(0, slotsToFill);

            // Find empty slots
            const quickSkills = this.actor.system.quickSkills || {};
            const emptySlots = [];
            for (let i = 1; i <= this.maxSlots; i++) {
                const slotKey = `slot${i}`;
                if (!quickSkills[slotKey]) {
                    emptySlots.push(slotKey);
                }
            }

            // Fill slots with highest skills
            const updateData = {};
            for (let i = 0; i < Math.min(availableSkills.length, emptySlots.length); i++) {
                updateData[`system.quickSkills.${emptySlots[i]}`] = availableSkills[i].key;
            }

            await this.actor.update(updateData);
            
            const filledCount = Object.keys(updateData).length;
            ui.notifications.info(`Auto-filled ${filledCount} quick skill slots with highest skills.`);
            console.log(`Auto-filled ${filledCount} quick skills`);
            return true;

        } catch (error) {
            console.error('Failed to auto-fill quick skills:', error);
            ui.notifications.error('Failed to auto-fill quick skills.');
            return false;
        }
    }

    /**
     * Debug method to log quick skills information
     */
    debugQuickSkills() {
        const quickSkillsData = this.getQuickSkillsData();
        const stats = this.getQuickSkillsStats();
        const availableSkills = this.getAvailableSkillsForSelection();

        console.group(`Quick Skills Debug for ${this.actor.name}`);
        console.log('Current Quick Skills:', quickSkillsData);
        console.log('Statistics:', stats);
        console.log('Available for Selection:', availableSkills.length);
        console.groupEnd();
    }
}