/**
 * Equipment Component for Thirteen Commando
 * Handles all item management, equipment toggles, creation, and drag & drop
 * UPDATED: Weapon attacks now use dice pool system
 */
export class Equipment {
    
    constructor(actor) {
        this.actor = actor;
    }

    /**
     * Get all items organized by type
     * @returns {Object} - Items organized by type
     */
    getItemsByType() {
        const items = this.actor.items;
        
        return {
            all: items,
            weapons: items.filter(item => item.type === 'weapon'),
            equipment: items.filter(item => item.type === 'equipment'),
            armor: items.filter(item => item.type === 'equipment' && item.system.equipmentType === 'armor'),
            gear: items.filter(item => item.type === 'equipment' && item.system.equipmentType === 'gear'),
            consumables: items.filter(item => item.type === 'equipment' && item.system.equipmentType === 'consumable'),
            tools: items.filter(item => item.type === 'equipment' && item.system.equipmentType === 'tool'),
            communication: items.filter(item => item.type === 'equipment' && item.system.equipmentType === 'communication')
        };
    }

    /**
     * Get equipped items
     * @returns {Array} - Array of equipped items
     */
    getEquippedItems() {
        return this.actor.items.filter(item => 
            item.system.equipped === true
        );
    }

    /**
     * Get item statistics
     * @returns {Object} - Statistics about items
     */
    getItemStatistics() {
        const itemsByType = this.getItemsByType();
        const equippedItems = this.getEquippedItems();
        
        return {
            totalItems: itemsByType.all.size,
            weapons: itemsByType.weapons.length,
            equipment: itemsByType.equipment.length,
            equipped: equippedItems.length,
            unequipped: itemsByType.all.size - equippedItems.length
        };
    }

    /**
     * Create a new item
     * @param {string} type - Item type (weapon, equipment, etc.)
     * @param {Object} customData - Custom data to override defaults
     * @returns {Promise<Item|null>} - Created item or null on failure
     */
    async createItem(type = 'equipment', customData = {}) {
        try {
            const baseItemData = this._getDefaultItemData(type);
            const itemData = foundry.utils.mergeObject(baseItemData, customData);
            
            console.log(`Creating ${type} with data:`, itemData);
            
            const created = await Item.create(itemData, {parent: this.actor});
            
            if (created) {
                ui.notifications.info(`Created ${itemData.name}`);
                console.log(`Successfully created ${type}:`, created);
                return created;
            }
            
            return null;

        } catch (error) {
            console.error(`Failed to create ${type}:`, error);
            ui.notifications.error(`Failed to create ${type}`);
            return null;
        }
    }

    /**
     * Get default item data for a given type
     * @param {string} type - Item type
     * @returns {Object} - Default item data
     */
    _getDefaultItemData(type) {
        const baseData = {
            name: `New ${type.charAt(0).toUpperCase() + type.slice(1)}`,
            type: type,
            system: {}
        };

        switch (type) {
            case 'weapon':
                baseData.system = {
                    weaponType: 'rifle',
                    proficiency: 'rifles',
                    properties: {
                        automatic: false,
                        burst: false,
                        semiautomatic: true,
                        silenced: false,
                        scope: false,
                        ap: false,
                        explosive: false
                    },
                    damage: {
                        primary: { dice: '2d6', type: 'ballistic' },
                        secondary: { dice: '', type: '' }
                    },
                    ammunition: {
                        type: 'standard',
                        current: 30,
                        max: 30
                    },
                    reload: {
                        type: 'action',
                        time: 1
                    },
                    weight: 3,
                    quantity: 1
                };
            case 'equipment':
                baseData.system = {
                    equipmentType: 'gear',
                    equipped: false,
                    weight: 1,
                    quantity: 1,
                    armor: {
                        type: 'light',
                        value: 0,
                        dex: null
                    },
                    consumable: {
                        type: '',
                        uses: {
                            current: 1,
                            max: 1
                        }
                    }
                };
                break;

            default:
                baseData.system = {
                    weight: 1,
                    quantity: 1
                };
        }

        return baseData;
    }

    /**
     * Delete an item
     * @param {string} itemId - ID of item to delete
     * @returns {Promise<boolean>} - Success/failure
     */
    async deleteItem(itemId) {
        try {
            const item = this.actor.items.get(itemId);
            
            if (!item) {
                console.warn(`Item ${itemId} not found`);
                return false;
            }

            const itemName = item.name;
            await item.delete();
            
            ui.notifications.info(`Deleted ${itemName}`);
            console.log(`Deleted item: ${itemName}`);
            return true;

        } catch (error) {
            console.error(`Failed to delete item ${itemId}:`, error);
            ui.notifications.error('Failed to delete item');
            return false;
        }
    }

    /**
     * Toggle equipment status (equipped/unequipped)
     * @param {string} itemId - ID of item to toggle
     * @param {boolean} equipped - New equipped status
     * @returns {Promise<boolean>} - Success/failure
     */
    async toggleEquipped(itemId, equipped) {
        try {
            const item = this.actor.items.get(itemId);
            
            if (!item) {
                console.warn(`Item ${itemId} not found`);
                return false;
            }

            await item.update({'system.equipped': equipped});
            
            const status = equipped ? 'equipped' : 'unequipped';
            ui.notifications.info(`${item.name} ${status}`);
            console.log(`${item.name} ${status}`);
            return true;

        } catch (error) {
            console.error(`Failed to toggle equipment ${itemId}:`, error);
            ui.notifications.error('Failed to update equipment status');
            return false;
        }
    }

    /**
     * Open item sheet for editing
     * @param {string} itemId - ID of item to edit
     * @returns {Promise<boolean>} - Success/failure
     */
    async editItem(itemId) {
        try {
            const item = this.actor.items.get(itemId);
            
            if (!item) {
                console.warn(`Item ${itemId} not found`);
                ui.notifications.warn('Item not found');
                return false;
            }

            item.sheet.render(true);
            console.log(`Opened editor for: ${item.name}`);
            return true;

        } catch (error) {
            console.error(`Failed to edit item ${itemId}:`, error);
            ui.notifications.error('Failed to open item editor');
            return false;
        }
    }

    /**
     * Handle item attack/roll
     * @param {string} itemId - ID of item to use
     * @returns {Promise<boolean>} - Success/failure
     */
    async useItem(itemId) {
        try {
            const item = this.actor.items.get(itemId);
            
            if (!item) {
                console.warn(`Item ${itemId} not found`);
                return false;
            }

            // For weapons, trigger attack roll
            if (item.type === 'weapon') {
                return await this._rollWeaponAttack(item);
            }

            // For consumables, use item
            if (item.system.equipmentType === 'consumable') {
                return await this._useConsumable(item);
            }

            // Default action
            ui.notifications.info(`Used ${item.name}`);
            console.log(`Used item: ${item.name}`);
            return true;

        } catch (error) {
            console.error(`Failed to use item ${itemId}:`, error);
            ui.notifications.error('Failed to use item');
            return false;
        }
    }

    /**
     * Roll weapon attack using dice rolling component
     * @param {Item} weapon - Weapon item
     * @returns {Promise<boolean>} - Success/failure
     */
    async _rollWeaponAttack(weapon) {
        try {
            // Get dice rolling component from actor sheet
            const sheet = this.actor.sheet;
            if (!sheet || !sheet.diceRolling) {
                ui.notifications.error('Dice rolling system not available');
                return false;
            }

            // Use dice rolling component for weapon attack
            const roll = await sheet.diceRolling.rollWeaponAttack(weapon);
            
            if (roll) {
                console.log(`${this.actor.name} attacked with ${weapon.name}`);
                return true;
            }
            
            return false;

        } catch (error) {
            console.error('Failed to roll weapon attack:', error);
            ui.notifications.error('Failed to roll weapon attack');
            return false;
        }
    }

    /**
     * Get weapon skill total
     * @param {string} proficiency - Weapon proficiency skill
     * @returns {number} - Skill total
     */
    _getWeaponSkillTotal(proficiency) {
        const skill = this.actor.system.skills?.combat?.[proficiency];
        if (!skill) return 0;

        return (skill.breeding || 0) + (skill.commando || 0) +
               (skill.primary || 0) + (skill.secondary || 0) + 
               (skill.tertiary || 0) + (skill.modifier || 0);
    }

    /**
     * Use consumable item
     * @param {Item} consumable - Consumable item
     * @returns {Promise<boolean>} - Success/failure
     */
    async _useConsumable(consumable) {
        try {
            const uses = consumable.system.consumable?.uses;
            
            if (!uses || uses.current <= 0) {
                ui.notifications.warn(`${consumable.name} has no uses remaining`);
                return false;
            }

            // Decrease uses
            const newCurrent = Math.max(0, uses.current - 1);
            await consumable.update({
                'system.consumable.uses.current': newCurrent
            });

            ui.notifications.info(`Used ${consumable.name} (${newCurrent}/${uses.max} remaining)`);
            console.log(`Used consumable: ${consumable.name}`);

            // Delete if no uses remain and it's a single-use item
            if (newCurrent === 0 && uses.max === 1) {
                await consumable.delete();
                ui.notifications.info(`${consumable.name} consumed and removed`);
            }

            return true;

        } catch (error) {
            console.error('Failed to use consumable:', error);
            ui.notifications.error('Failed to use consumable');
            return false;
        }
    }

    /**
     * Handle item sorting within the same actor
     * @param {Event} event - Drop event
     * @param {Object} itemData - Item data being sorted
     * @returns {Promise<Array>} - Updated items
     */
    async sortItem(event, itemData) {
        try {
            // Get the drag source and drop target
            const source = this.actor.items.get(itemData._id);
            const siblings = this.actor.items.filter(i => i.type === source.type);
            
            // Perform the sort
            const sortUpdates = SortingHelpers.performIntegerSort(source, {
                target: null,
                siblings: siblings
            });

            // Apply updates
            const updateData = sortUpdates.map(u => ({
                _id: u.target._id,
                sort: u.update.sort
            }));

            return await this.actor.updateEmbeddedDocuments("Item", updateData);

        } catch (error) {
            console.error('Failed to sort item:', error);
            return [];
        }
    }

    /**
     * Handle creating item from drop data
     * @param {Object} itemData - Item data from drop
     * @returns {Promise<Array>} - Created items
     */
    async createItemFromDrop(itemData) {
        try {
            // Ensure proper system data structure
            if (!itemData.system) {
                itemData.system = {};
            }

            // Type-specific handling
            const processedData = this._processDroppedItemData(itemData);
            
            const created = await this.actor.createEmbeddedDocuments("Item", [processedData]);
            
            if (created.length > 0) {
                ui.notifications.info(`Added ${processedData.name} to inventory`);
                console.log('Created item from drop:', created[0]);
            }
            
            return created;

        } catch (error) {
            console.error('Failed to create item from drop:', error);
            ui.notifications.error('Failed to add item to inventory');
            return [];
        }
    }

    /**
     * Process dropped item data to ensure proper format
     * @param {Object} itemData - Raw item data
     * @returns {Object} - Processed item data
     */
    _processDroppedItemData(itemData) {
        const type = itemData.type;
        const processedData = foundry.utils.deepClone(itemData);

        switch (type) {
            case 'weapon':
                // Ensure weapon has required properties
                if (!processedData.system.weaponType) {
                    processedData.system.weaponType = 'rifle';
                }
                if (!processedData.system.proficiency) {
                    processedData.system.proficiency = 'rifles';
                }
                if (!processedData.system.damage) {
                    processedData.system.damage = {
                        primary: { dice: '2d6', type: 'ballistic' },
                        secondary: { dice: '', type: '' }
                    };
                }
                if (!processedData.system.properties) {
                    processedData.system.properties = {
                        automatic: false,
                        burst: false,
                        semiautomatic: true,
                        silenced: false,
                        scope: false,
                        ap: false,
                        explosive: false
                    };
                }
                break;

            case 'equipment':
                // Ensure equipment has required properties
                if (!processedData.system.equipmentType) {
                    processedData.system.equipmentType = 'gear';
                }
                if (processedData.system.equipped === undefined) {
                    processedData.system.equipped = false;
                }
                if (!processedData.system.weight) {
                    processedData.system.weight = 1;
                }
                if (!processedData.system.quantity) {
                    processedData.system.quantity = 1;
                }
                break;
        }

        return processedData;
    }

    /**
     * Bulk equip/unequip items
     * @param {Array} itemIds - Array of item IDs
     * @param {boolean} equipped - New equipped status
     * @returns {Promise<number>} - Number of items updated
     */
    async bulkToggleEquipped(itemIds, equipped) {
        let updated = 0;
        
        for (const itemId of itemIds) {
            const success = await this.toggleEquipped(itemId, equipped);
            if (success) updated++;
        }

        const action = equipped ? 'equipped' : 'unequipped';
        ui.notifications.info(`Bulk ${action} ${updated} items`);
        console.log(`Bulk ${action} ${updated} items`);
        
        return updated;
    }

    /**
     * Get total weight of all items
     * @param {boolean} equippedOnly - Only count equipped items
     * @returns {number} - Total weight
     */
    getTotalWeight(equippedOnly = false) {
        const items = equippedOnly ? this.getEquippedItems() : Array.from(this.actor.items);
        
        return items.reduce((total, item) => {
            const weight = item.system.weight || 0;
            const quantity = item.system.quantity || 1;
            return total + (weight * quantity);
        }, 0);
    }

    /**
     * Find items by name or type
     * @param {string} searchTerm - Search term
     * @param {string} searchType - 'name' or 'type'
     * @returns {Array} - Matching items
     */
    findItems(searchTerm, searchType = 'name') {
        return Array.from(this.actor.items).filter(item => {
            switch (searchType) {
                case 'name':
                    return item.name.toLowerCase().includes(searchTerm.toLowerCase());
                case 'type':
                    return item.type === searchTerm;
                case 'equipped':
                    return item.system.equipped === true;
                case 'unequipped':
                    return item.system.equipped === false;
                default:
                    return false;
            }
        });
    }

    /**
     * Get item by ID with error handling
     * @param {string} itemId - Item ID
     * @returns {Item|null} - Item or null if not found
     */
    getItem(itemId) {
        const item = this.actor.items.get(itemId);
        if (!item) {
            console.warn(`Item ${itemId} not found on actor ${this.actor.name}`);
        }
        return item;
    }

    /**
     * Debug method to log equipment information
     */
    debugEquipment() {
        const itemsByType = this.getItemsByType();
        const stats = this.getItemStatistics();
        const equipped = this.getEquippedItems();
        const totalWeight = this.getTotalWeight();
        const equippedWeight = this.getTotalWeight(true);

        console.group(`Equipment Debug for ${this.actor.name}`);
        console.log('Items by Type:', itemsByType);
        console.log('Statistics:', stats);
        console.log('Equipped Items:', equipped);
        console.log('Total Weight:', totalWeight);
        console.log('Equipped Weight:', equippedWeight);
        console.groupEnd();
    }
}