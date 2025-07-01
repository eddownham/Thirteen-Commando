/**
 * Extend the basic Item with some very simple modifications.
 * @extends {Item}
 */
export class ThirteenCommandoItem extends Item {
  /**
   * Augment the basic Item data model with additional dynamic data.
   */
  prepareData() {
    // As with the actor class, items are documents that can have their data
    // preparation methods overridden (such as prepareBaseData()).
    super.prepareData();
  }

  /**
   * Prepare a data object which is passed to any Roll formulas which are created related to this Item
   * @private
   */
  getRollData() {
    // If present, return the actor's roll data.
    if (!this.actor) return null;
    const rollData = this.actor.getRollData();
    // Grab the item's system data as well.
    rollData.item = foundry.utils.deepClone(this.system);

    return rollData;
  }

  /**
   * Handle clickable rolls.
   * @param {Event} event   The originating click event
   * @private
   */
  async roll() {
    const item = this;

    // Initialize chat data.
    const speaker = ChatMessage.getSpeaker({ actor: this.actor });
    const rollMode = game.settings.get('core', 'rollMode');
    const label = `[${item.type}] ${item.name}`;

    // If there's no roll data, send a chat message.
    if (!this.system.formula) {
      ChatMessage.create({
        speaker: speaker,
        rollMode: rollMode,
        flavor: label,
        content: item.system.description ?? ''
      });
    }
    // Otherwise, create a roll and send a chat message from it.
    else {
      // Retrieve roll data.
      const rollData = this.getRollData();

      // Invoke the roll and submit it to chat.
      const roll = new Roll(rollData.item.formula, rollData);
      // If you need to store the value first, uncomment the next line.
      // let result = await roll.evaluate();
      roll.toMessage({
        speaker: speaker,
        rollMode: rollMode,
        flavor: label,
      });
      return roll;
    }
  }

  /**
   * Roll a weapon attack
   * @param {Object} options - Roll options
   */
  async rollWeapon(options = {}) {
    if (this.type !== 'weapon') {
      ui.notifications.warn('This item is not a weapon');
      return;
    }

    const actor = this.actor;
    if (!actor) {
      ui.notifications.warn('No actor owns this weapon');
      return;
    }

    // Get the appropriate skill for this weapon
    const weaponType = this.system.weaponType;
    const proficiency = this.system.proficiency || weaponType;
    
    // Map weapon types to skills
    const skillMap = {
      'rifle': 'rifles',
      'pistol': 'pistols',
      'submachinegun': 'submachineguns',
      'machinegun': 'machinegunner',
      'heavyweapon': 'heavyweapons',
      'melee': 'meleecombat',
      'grenade': 'grenadethrowing',
      'explosive': 'explosiveordinance'
    };

    const skillKey = skillMap[proficiency] || proficiency;
    const skill = actor.getSkill(skillKey);
    
    if (!skill) {
      ui.notifications.warn(`No skill found for weapon type: ${weaponType}`);
      return;
    }

    // Create attack roll
    const rollData = actor.getRollData();
    const attackFormula = `1d20 + ${skill.total}`;
    
    const attackRoll = new Roll(attackFormula, rollData);
    await attackRoll.evaluate();

    // Create damage roll if weapon has damage
    let damageRoll = null;
    if (this.system.damage?.parts?.length > 0) {
      const damageParts = this.system.damage.parts;
      const damageFormula = damageParts.map(part => part[0]).join(' + ');
      damageRoll = new Roll(damageFormula, rollData);
      await damageRoll.evaluate();
    }

    // Create chat message
    const speaker = ChatMessage.getSpeaker({ actor: actor });
    let content = `
      <div class="thirteen-commando weapon-attack">
        <h3>${this.name} Attack</h3>
        <div class="attack-roll">
          <strong>Attack Roll:</strong> ${attackRoll.total}
          <div class="dice-roll">${attackRoll.formula} = ${attackRoll.result}</div>
        </div>
    `;

    if (damageRoll) {
      content += `
        <div class="damage-roll">
          <strong>Damage:</strong> ${damageRoll.total}
          <div class="dice-roll">${damageRoll.formula} = ${damageRoll.result}</div>
        </div>
      `;
    }

    // Add weapon properties
    if (this.system.properties) {
      const activeProperties = Object.entries(this.system.properties)
        .filter(([key, value]) => value)
        .map(([key, value]) => key.charAt(0).toUpperCase() + key.slice(1));
      
      if (activeProperties.length > 0) {
        content += `<div class="weapon-properties"><strong>Properties:</strong> ${activeProperties.join(', ')}</div>`;
      }
    }

    content += '</div>';

    ChatMessage.create({
      speaker: speaker,
      rollMode: game.settings.get('core', 'rollMode'),
      content: content,
      rolls: damageRoll ? [attackRoll, damageRoll] : [attackRoll]
    });

    return { attackRoll, damageRoll };
  }

  /**
   * Use an equipment item
   * @param {Object} options - Use options
   */
  async useEquipment(options = {}) {
    if (this.type !== 'equipment') {
      ui.notifications.warn('This item is not equipment');
      return;
    }

    const actor = this.actor;
    if (!actor) {
      ui.notifications.warn('No actor owns this equipment');
      return;
    }

    // Handle consumable items
    if (this.system.equipmentType === 'consumable') {
      const quantity = this.system.quantity || 1;
      if (quantity <= 0) {
        ui.notifications.warn('No more of this item remaining');
        return;
      }

      // Reduce quantity by 1
      await this.update({
        'system.quantity': Math.max(0, quantity - 1)
      });
    }

    // Create chat message for item use
    const speaker = ChatMessage.getSpeaker({ actor: actor });
    const content = `
      <div class="thirteen-commando equipment-use">
        <h3>Uses ${this.name}</h3>
        <div class="description">${this.system.description || 'No description available.'}</div>
      </div>
    `;

    ChatMessage.create({
      speaker: speaker,
      rollMode: game.settings.get('core', 'rollMode'),
      content: content
    });
  }

  /**
   * Activate a talent
   * @param {Object} options - Activation options
   */
  async activateTalent(options = {}) {
    if (this.type !== 'talent') {
      ui.notifications.warn('This item is not a talent');
      return;
    }

    const actor = this.actor;
    if (!actor) {
      ui.notifications.warn('No actor owns this talent');
      return;
    }

    // Create chat message for talent activation
    const speaker = ChatMessage.getSpeaker({ actor: actor });
    const content = `
      <div class="thirteen-commando talent-activation">
        <h3>${this.name}</h3>
        <div class="description">${this.system.description || 'No description available.'}</div>
        ${this.system.effects ? `<div class="effects"><strong>Effects:</strong> ${this.system.effects}</div>` : ''}
      </div>
    `;

    ChatMessage.create({
      speaker: speaker,
      rollMode: game.settings.get('core', 'rollMode'),
      content: content
    });
  }

  /**
   * Toggle equipment equipped status
   */
  async toggleEquipped() {
    if (!['weapon', 'equipment'].includes(this.type)) {
      return;
    }

    const isEquipped = this.system.equipped || false;
    await this.update({
      'system.equipped': !isEquipped
    });

    ui.notifications.info(`${this.name} ${!isEquipped ? 'equipped' : 'unequipped'}`);
  }

  /**
   * Get the total weight of this item including quantity
   */
  getTotalWeight() {
    if (!this.system.weight) return 0;
    const quantity = this.system.quantity || 1;
    return this.system.weight * quantity;
  }

  /**
   * Get the total value of this item including quantity
   */
  getTotalValue() {
    if (!this.system.price?.value) return 0;
    const quantity = this.system.quantity || 1;
    return this.system.price.value * quantity;
  }

  /**
   * Check if this item can be used by the actor
   */
  canUse() {
    if (!this.actor) return false;

    // Add any prerequisite checks here
    if (this.system.prerequisites) {
      // Implement prerequisite checking logic
      // For now, just return true
    }

    return true;
  }

  // === ENHANCED WEAPON SYSTEM METHODS ===

  /**
   * Enhanced weapon attack using dialog
   */
  async rollAttack() {
    if (this.type !== 'weapon') {
      ui.notifications.warn("Only weapons can attack.");
      return;
    }
    
    if (!this.actor) {
      ui.notifications.warn("This weapon must be equipped by an actor to attack.");
      return;
    }
    
    if (!this.system.equipped) {
      ui.notifications.warn("Weapon must be equipped to attack.");
      return;
    }
    
    console.log("Launching enhanced weapon attack dialog...");
    return game.thirteenCommando.WeaponAttackDialog.show(this.actor, this);
  }

  /**
   * Quick attack for hotbar/macros
   */
  async quickAttack() {
    if (this.type !== 'weapon' || !this.actor) {
      ui.notifications.warn("Invalid weapon or no actor.");
      return;
    }
    
    if (!this.system.equipped) {
      ui.notifications.warn("Weapon must be equipped to attack.");
      return;
    }
    
    const shotType = 'deliberateFire';
    const cost = this.system.shotTypes[shotType]?.cost || 5;
    
    if (this.actor.system.exertion.value < cost) {
      ui.notifications.error(`Insufficient exertion! Need ${cost}, have ${this.actor.system.exertion.value}.`);
      return;
    }
    
    if (this.system.ammunition.current <= 0) {
      ui.notifications.error("No ammunition remaining!");
      return;
    }
    
    try {
      await this.actor.modifyExertion(-cost, false);
      await this.update({
        'system.ammunition.current': Math.max(0, this.system.ammunition.current - 1)
      });
      
      await this._rollQuickAttack();
      
    } catch (error) {
      console.error("Quick attack failed:", error);
      ui.notifications.error("Quick attack failed!");
    }
  }

  /**
   * Private method for quick attack rolling
   */
  async _rollQuickAttack() {
    const skillTotal = this._getWeaponSkillTotal();
    const targetNumber = 6;
    
    const roll = new Roll(`${skillTotal}d6`);
    await roll.evaluate();
    
    let successes = 0;
    roll.terms[0].results.forEach(die => {
      if (die.result >= targetNumber) {
        successes++;
        die.success = true;
      }
    });
    
    const weaponName = this.name;
    const damage = this.system.damage;
    
    const content = [
      '<div class="weapon-attack-roll">',
      `<h3>${weaponName} Quick Attack</h3>`,
      '<p><strong>Shot Type:</strong> Deliberate Fire</p>',
      '<p><strong>Range:</strong> Short</p>',
      `<p><strong>Successes:</strong> ${successes}</p>`,
      successes > 0 ? 
        `<p class="success">Hit! Rolling ${damage}d6 damage...</p>` :
        '<p class="failure">Miss!</p>',
      '</div>'
    ].join('');
    
    const chatData = {
      user: game.user.id,
      speaker: ChatMessage.getSpeaker({ actor: this.actor }),
      rolls: [roll],
      content: content
    };
    
    await ChatMessage.create(chatData);
    
    if (successes > 0) {
      await this._rollDamage();
    }
  }

  /**
   * Roll weapon damage
   */
  async _rollDamage() {
    const damage = this.system.damage;
    const damageRoll = new Roll(`${damage}d6`);
    await damageRoll.evaluate();
    
    const weaponName = this.name;
    const total = damageRoll.total;
    
    const content = [
      '<div class="weapon-damage-roll">',
      `<h3>${weaponName} Damage</h3>`,
      `<p>Damage: <strong>${total}</strong></p>`,
      '</div>'
    ].join('');
    
    const chatData = {
      user: game.user.id,
      speaker: ChatMessage.getSpeaker({ actor: this.actor }),
      rolls: [damageRoll],
      content: content
    };
    
    await ChatMessage.create(chatData);
  }

  /**
   * Get weapon skill total
   */
  _getWeaponSkillTotal() {
    const proficiency = this.system.proficiency;
    const actor = this.actor?.system;
    
    if (!actor) return 0;
    
    console.log('Getting skill total for proficiency:', proficiency);
    console.log('Actor skills:', actor.skills);
    
    const skill = actor.skills.combat[proficiency];
    if (!skill) {
      console.warn(`Skill ${proficiency} not found in combat skills`);
      return 0;
    }
    
    const total = (skill.breeding || 0) + (skill.commando || 0) + 
                 (skill.primary || 0) + (skill.secondary || 0) + 
                 (skill.tertiary || 0) + (skill.modifier || 0);
    
    console.log('Calculated skill total:', total);
    return total;
  }

  /**
   * Reload weapon ammunition
   */
  async reload() {
    if (this.type !== 'weapon') {
      ui.notifications.warn("Only weapons can be reloaded.");
      return;
    }
    
    const ammo = this.system.ammunition;
    
    if (ammo.current >= ammo.max) {
      ui.notifications.info("Weapon is already fully loaded.");
      return;
    }
    
    const reloadCost = 2;
    
    if (this.actor && this.actor.system.exertion.value < reloadCost) {
      ui.notifications.error(`Insufficient exertion to reload! Need ${reloadCost}.`);
      return;
    }
    
    try {
      if (this.actor) {
        await this.actor.modifyExertion(-reloadCost, false);
      }
      
      await this.update({
        'system.ammunition.current': ammo.max
      });
      
      const weaponName = this.name;
      const maxAmmo = ammo.max;
      const actorName = this.actor ? this.actor.name : 'Unknown';
      
      const content = [
        '<div class="weapon-reload">',
        `<h3>${weaponName} Reloaded</h3>`,
        `<p>Ammunition: ${maxAmmo}/${maxAmmo}</p>`,
        this.actor ? `<p>Exertion cost: ${reloadCost}</p>` : '',
        '</div>'
      ].join('');
      
      ChatMessage.create({
        user: game.user.id,
        speaker: this.actor ? ChatMessage.getSpeaker({ actor: this.actor }) : null,
        content: content
      });
      
      ui.notifications.info(`${weaponName} reloaded successfully!`);
      
    } catch (error) {
      console.error("Reload failed:", error);
      ui.notifications.error("Reload failed!");
    }
  }

  /**
   * Toggle bayonet attachment
   */
  async toggleBayonet() {
    if (this.type !== 'weapon') {
      ui.notifications.warn("Only weapons can have bayonets.");
      return;
    }
    
    if (!this.system.bayonet.compatible) {
      ui.notifications.warn("This weapon is not compatible with bayonets.");
      return;
    }
    
    const newState = !this.system.bayonet.attached;
    
    await this.update({
      'system.bayonet.attached': newState
    });
    
    const action = newState ? 'attached' : 'removed';
    const weaponName = this.name;
    const actionCapitalized = action.charAt(0).toUpperCase() + action.slice(1);
    const hasOrNot = newState ? 'now has' : 'no longer has';
    
    ui.notifications.info(`Bayonet ${action} ${newState ? 'to' : 'from'} ${weaponName}.`);
    
    const content = [
      '<div class="bayonet-toggle">',
      `<h3>Bayonet ${actionCapitalized}</h3>`,
      `<p><strong>${weaponName}</strong> ${hasOrNot} a bayonet attached.</p>`,
      '</div>'
    ].join('');
    
    ChatMessage.create({
      user: game.user.id,
      speaker: this.actor ? ChatMessage.getSpeaker({ actor: this.actor }) : null,
      content: content
    });
  }
}