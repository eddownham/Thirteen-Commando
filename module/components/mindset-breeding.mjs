/**
 * Mindset and Breeding Component for Thirteen Commando
 * Handles character creation elements: mindsets, breeding traits, and bonuses
 */
export class MindsetBreeding {
    
    constructor(actor) {
        this.actor = actor;
    }

    /**
     * Get available mindsets with their descriptions
     * @returns {Array} - Array of mindset objects
     */
    getAvailableMindsets() {
        return [
            {
                key: 'force',
                name: 'Force',
                description: 'Direct action and overwhelming power',
                attributes: ['Might', 'Intelligence', 'Bearing'],
                icon: 'fas fa-fist-raised'
            },
            {
                key: 'finesse',
                name: 'Finesse',
                description: 'Precision and adaptability',
                attributes: ['Coordination', 'Guile', 'Charm'],
                icon: 'fas fa-eye'
            },
            {
                key: 'resilience',
                name: 'Resilience', 
                description: 'Endurance and determination',
                attributes: ['Endurance', 'Guts', 'Composure'],
                icon: 'fas fa-shield-alt'
            }
        ];
    }

    /**
     * Get current selected mindset
     * @returns {Object|null} - Current mindset object or null
     */
    getCurrentMindset() {
        const selectedKey = this.actor.system.mindset?.selected || this.actor.system.mindset;
        if (!selectedKey) return null;

        return this.getAvailableMindsets().find(mindset => mindset.key === selectedKey);
    }

    /**
     * Set actor's mindset
     * @param {string} mindsetKey - The mindset key (force/finesse/resilience)
     * @returns {Promise<boolean>} - Success/failure
     */
    async setMindset(mindsetKey) {
        try {
            const availableMindsets = this.getAvailableMindsets();
            const mindset = availableMindsets.find(m => m.key === mindsetKey);
            
            if (!mindset) {
                console.error(`Invalid mindset: ${mindsetKey}`);
                ui.notifications.error(`Invalid mindset: ${mindsetKey}`);
                return false;
            }

            await this.actor.update({
                'system.mindset.selected': mindsetKey
            });

            ui.notifications.info(`Mindset set to ${mindset.name}`);
            console.log(`Mindset changed to: ${mindset.name}`);
            return true;

        } catch (error) {
            console.error('Failed to set mindset:', error);
            ui.notifications.error('Failed to set mindset');
            return false;
        }
    }

    /**
     * Get available breeding traits organized by category and point value
     * @returns {Object} - Breeding traits organized by point value
     */
    getAvailableBreedingTraits() {
        return {
            fivePoint: [
                { key: 'enhanced_physical', name: 'Enhanced Physical', category: 'physical', points: 5, description: 'Superior physical capabilities' },
                { key: 'tactical_genius', name: 'Tactical Genius', category: 'mental', points: 5, description: 'Exceptional strategic thinking' },
                { key: 'natural_leader', name: 'Natural Leader', category: 'social', points: 5, description: 'Inspiring presence and charisma' }
            ],
            threePoint: [
                { key: 'athletic', name: 'Athletic', category: 'physical', points: 3, description: 'Above-average physical performance' },
                { key: 'quick_learner', name: 'Quick Learner', category: 'mental', points: 3, description: 'Rapid skill acquisition' },
                { key: 'networked', name: 'Networked', category: 'social', points: 3, description: 'Extensive social connections' },
                { key: 'hardy', name: 'Hardy', category: 'physical', points: 3, description: 'Exceptional endurance and health' },
                { key: 'analytical', name: 'Analytical', category: 'mental', points: 3, description: 'Superior problem-solving abilities' },
                { key: 'persuasive', name: 'Persuasive', category: 'social', points: 3, description: 'Natural talent for influence' }
            ],
            twoPoint: [
                { key: 'fit', name: 'Fit', category: 'physical', points: 2, description: 'Good physical condition' },
                { key: 'educated', name: 'Educated', category: 'mental', points: 2, description: 'Broad knowledge base' },
                { key: 'connected', name: 'Connected', category: 'social', points: 2, description: 'Useful contacts and relationships' },
                { key: 'tough', name: 'Tough', category: 'physical', points: 2, description: 'Can take punishment' },
                { key: 'focused', name: 'Focused', category: 'mental', points: 2, description: 'Strong concentration abilities' },
                { key: 'likeable', name: 'Likeable', category: 'social', points: 2, description: 'Easy to get along with' }
            ]
        };
    }

    /**
     * Get current breeding trait selections
     * @returns {Object} - Current breeding selections
     */
    getCurrentBreedingTraits() {
        const breeding = this.actor.system.breeding || {};
        return {
            fivePoints: breeding.fivepoints || '',
            threePoints: breeding.threepoints || '',  
            twoPoints: breeding.twopoints || ''
        };
    }

    /**
     * Set a breeding trait
     * @param {string} category - Category (fivepoints/threepoints/twopoints)
     * @param {string} traitKey - The trait key
     * @returns {Promise<boolean>} - Success/failure
     */
    async setBreedingTrait(category, traitKey) {
        try {
            const validCategories = ['fivepoints', 'threepoints', 'twopoints'];
            if (!validCategories.includes(category)) {
                console.error(`Invalid breeding category: ${category}`);
                return false;
            }

            // Validate trait exists
            const allTraits = this.getAvailableBreedingTraits();
            const categoryMap = {
                'fivepoints': 'fivePoint',
                'threepoints': 'threePoint', 
                'twopoints': 'twoPoint'
            };
            
            const traitCategory = categoryMap[category];
            const trait = allTraits[traitCategory]?.find(t => t.key === traitKey);
            
            if (!trait && traitKey !== '') {
                console.error(`Invalid trait: ${traitKey}`);
                return false;
            }

            await this.actor.update({
                [`system.breeding.${category}`]: traitKey
            });

            if (traitKey) {
                ui.notifications.info(`Set ${trait.name} as ${trait.points}-point trait`);
                console.log(`Breeding trait set: ${trait.name} (${trait.points} points)`);
            } else {
                ui.notifications.info(`Cleared ${category} trait`);
                console.log(`Cleared ${category} trait`);
            }

            // Recalculate breeding bonuses
            await this.recalculateBreedingBonuses();
            return true;

        } catch (error) {
            console.error('Failed to set breeding trait:', error);
            ui.notifications.error('Failed to set breeding trait');
            return false;
        }
    }

    /**
     * Calculate total breeding bonus for a specific attribute category
     * @param {string} category - Category (physical/mental/social)
     * @returns {number} - Total bonus for that category
     */
    calculateBreedingBonusForCategory(category) {
        const currentTraits = this.getCurrentBreedingTraits();
        const availableTraits = this.getAvailableBreedingTraits();
        let total = 0;

        // Check 5-point trait
        if (currentTraits.fivePoints) {
            const trait = availableTraits.fivePoint.find(t => t.key === currentTraits.fivePoints);
            if (trait && trait.category === category) {
                total += trait.points;
            }
        }

        // Check 3-point trait
        if (currentTraits.threePoints) {
            const trait = availableTraits.threePoint.find(t => t.key === currentTraits.threePoints);
            if (trait && trait.category === category) {
                total += trait.points;
            }
        }

        // Check 2-point trait
        if (currentTraits.twoPoints) {
            const trait = availableTraits.twoPoint.find(t => t.key === currentTraits.twoPoints);
            if (trait && trait.category === category) {
                total += trait.points;
            }
        }

        return total;
    }

    /**
     * Get all breeding bonuses by category
     * @returns {Object} - Breeding bonuses for each category
     */
    getAllBreedingBonuses() {
        return {
            physical: this.calculateBreedingBonusForCategory('physical'),
            mental: this.calculateBreedingBonusForCategory('mental'),
            social: this.calculateBreedingBonusForCategory('social')
        };
    }

    /**
     * Recalculate and apply breeding bonuses to attributes
     * @returns {Promise<boolean>} - Success/failure
     */
    async recalculateBreedingBonuses() {
        try {
            const bonuses = this.getAllBreedingBonuses();
            
            // Apply bonuses to each attribute in the category
            const updateData = {};
            
            // Physical attributes
            updateData['system.attributes.physical.might.breedingBonus'] = bonuses.physical;
            updateData['system.attributes.physical.coordination.breedingBonus'] = bonuses.physical;
            updateData['system.attributes.physical.endurance.breedingBonus'] = bonuses.physical;
            
            // Mental attributes  
            updateData['system.attributes.mental.intelligence.breedingBonus'] = bonuses.mental;
            updateData['system.attributes.mental.guile.breedingBonus'] = bonuses.mental;
            updateData['system.attributes.mental.guts.breedingBonus'] = bonuses.mental;
            
            // Social attributes
            updateData['system.attributes.social.bearing.breedingBonus'] = bonuses.social;
            updateData['system.attributes.social.charm.breedingBonus'] = bonuses.social;
            updateData['system.attributes.social.composure.breedingBonus'] = bonuses.social;

            await this.actor.update(updateData);
            
            console.log('Recalculated breeding bonuses:', bonuses);
            return true;

        } catch (error) {
            console.error('Failed to recalculate breeding bonuses:', error);
            return false;
        }
    }

    /**
     * Get trait by key from all categories
     * @param {string} traitKey - The trait key to find
     * @returns {Object|null} - The trait object or null
     */
    getTraitByKey(traitKey) {
        const allTraits = this.getAvailableBreedingTraits();
        
        for (const category of Object.values(allTraits)) {
            const trait = category.find(t => t.key === traitKey);
            if (trait) return trait;
        }
        
        return null;
    }

    /**
     * Validate current breeding trait selections
     * @returns {Object} - Validation results
     */
    validateBreedingTraits() {
        const currentTraits = this.getCurrentBreedingTraits();
        const results = {
            valid: true,
            errors: [],
            warnings: []
        };

        // Check if traits exist
        if (currentTraits.fivePoints && !this.getTraitByKey(currentTraits.fivePoints)) {
            results.valid = false;
            results.errors.push(`Invalid 5-point trait: ${currentTraits.fivePoints}`);
        }

        if (currentTraits.threePoints && !this.getTraitByKey(currentTraits.threePoints)) {
            results.valid = false;
            results.errors.push(`Invalid 3-point trait: ${currentTraits.threePoints}`);
        }

        if (currentTraits.twoPoints && !this.getTraitByKey(currentTraits.twoPoints)) {
            results.valid = false;
            results.errors.push(`Invalid 2-point trait: ${currentTraits.twoPoints}`);
        }

        // Check for duplicates
        const selectedTraits = [currentTraits.fivePoints, currentTraits.threePoints, currentTraits.twoPoints]
            .filter(trait => trait);
        
        const uniqueTraits = [...new Set(selectedTraits)];
        if (selectedTraits.length !== uniqueTraits.length) {
            results.valid = false;
            results.errors.push('Duplicate traits selected');
        }

        // Check for missing selections (warnings)
        if (!currentTraits.fivePoints) {
            results.warnings.push('No 5-point trait selected');
        }
        if (!currentTraits.threePoints) {
            results.warnings.push('No 3-point trait selected');
        }
        if (!currentTraits.twoPoints) {
            results.warnings.push('No 2-point trait selected');
        }

        return results;
    }

    /**
     * Get character creation summary
     * @returns {Object} - Summary of character creation choices
     */
    getCharacterCreationSummary() {
        const mindset = this.getCurrentMindset();
        const breedingTraits = this.getCurrentBreedingTraits();
        const breedingBonuses = this.getAllBreedingBonuses();
        
        const selectedTraitObjects = {
            fivePoint: this.getTraitByKey(breedingTraits.fivePoints),
            threePoint: this.getTraitByKey(breedingTraits.threePoints),
            twoPoint: this.getTraitByKey(breedingTraits.twoPoints)
        };

        return {
            mindset: mindset,
            breedingTraits: selectedTraitObjects,
            breedingBonuses: breedingBonuses,
            validation: this.validateBreedingTraits()
        };
    }

    /**
     * Reset all character creation choices
     * @returns {Promise<boolean>} - Success/failure
     */
    async resetCharacterCreation() {
        try {
            const updateData = {
                'system.mindset.selected': '',
                'system.breeding.fivepoints': '',
                'system.breeding.threepoints': '',
                'system.breeding.twopoints': ''
            };

            await this.actor.update(updateData);
            await this.recalculateBreedingBonuses();
            
            ui.notifications.info('Reset all character creation choices');
            console.log('Character creation reset');
            return true;

        } catch (error) {
            console.error('Failed to reset character creation:', error);
            ui.notifications.error('Failed to reset character creation');
            return false;
        }
    }

    /**
     * Auto-recommend traits based on mindset
     * @returns {Object} - Recommended traits for current mindset
     */
    getRecommendedTraitsForMindset() {
        const mindset = this.getCurrentMindset();
        if (!mindset) return null;

        const allTraits = this.getAvailableBreedingTraits();
        const recommendations = {
            fivePoint: null,
            threePoint: null,
            twoPoint: null
        };

        // Recommend traits that match the mindset's primary category
        const categoryMap = {
            'force': 'physical',
            'finesse': 'physical', // Coordination focus
            'resilience': 'physical' // Endurance focus
        };

        const preferredCategory = categoryMap[mindset.key] || 'physical';

        // Find best trait in each point category for the preferred attribute category
        recommendations.fivePoint = allTraits.fivePoint.find(t => t.category === preferredCategory);
        recommendations.threePoint = allTraits.threePoint.find(t => t.category === preferredCategory);
        recommendations.twoPoint = allTraits.twoPoint.find(t => t.category === preferredCategory);

        return {
            mindset: mindset,
            preferredCategory: preferredCategory,
            recommendations: recommendations
        };
    }

    /**
     * Apply recommended traits for current mindset
     * @returns {Promise<boolean>} - Success/failure
     */
    async applyRecommendedTraits() {
        const recommendations = this.getRecommendedTraitsForMindset();
        if (!recommendations) {
            ui.notifications.warn('No mindset selected for recommendations');
            return false;
        }

        try {
            const updateData = {};
            
            if (recommendations.recommendations.fivePoint) {
                updateData['system.breeding.fivepoints'] = recommendations.recommendations.fivePoint.key;
            }
            if (recommendations.recommendations.threePoint) {
                updateData['system.breeding.threepoints'] = recommendations.recommendations.threePoint.key;
            }
            if (recommendations.recommendations.twoPoint) {
                updateData['system.breeding.twopoints'] = recommendations.recommendations.twoPoint.key;
            }

            await this.actor.update(updateData);
            await this.recalculateBreedingBonuses();

            ui.notifications.info(`Applied recommended traits for ${recommendations.mindset.name} mindset`);
            console.log('Applied recommended traits:', recommendations);
            return true;

        } catch (error) {
            console.error('Failed to apply recommended traits:', error);
            ui.notifications.error('Failed to apply recommended traits');
            return false;
        }
    }

    /**
     * Debug method to log character creation information
     */
    debugCharacterCreation() {
        const summary = this.getCharacterCreationSummary();
        const recommendations = this.getRecommendedTraitsForMindset();

        console.group(`Character Creation Debug for ${this.actor.name}`);
        console.log('Summary:', summary);
        console.log('Recommendations:', recommendations);
        console.log('Raw System Data:', {
            mindset: this.actor.system.mindset,
            breeding: this.actor.system.breeding
        });
        console.groupEnd();
    }
}