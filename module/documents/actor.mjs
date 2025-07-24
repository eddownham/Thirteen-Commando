/**
 * Extend the base Actor document by defining a custom roll data structure which is ideal for the Simple system.
 * @extends {Actor}
 */
export class ThirteenCommandoActor extends Actor {

  /** @override */
  prepareData() {
    // Prepare data for the actor. Calling the super version of this executes
    // the following, in order: data reset (to clear active effects),
    // prepareBaseData(), prepareEmbeddedDocuments() (including active effects),
    // prepareDerivedData().
    super.prepareData();
  }

  /** @override */
  prepareBaseData() {
    // Data modifications in this step occur before processing embedded
    // documents or derived data.
  }

  /**
   * @override
   * Augment the basic actor data with additional dynamic data. Typically,
   * you'll want to handle most of your calculated/derived data in this step.
   *
   * Data calculated in this step should generally not exist in template.json
   * (such as ability modifiers rather than ability scores) and should be
   * available both inside and outside of character sheets (such as if an actor
   * is queried and has a roll executed directly from a macro).
   */
  prepareDerivedData() {
    const actorData = this;
    const systemData = actorData.system;
    const flags = actorData.flags.thirteencommando || {};

    // Make separate methods for each Actor type (character, npc, etc.) to keep
    // things organized.
    this._prepareCharacterData(actorData);
    this._prepareNpcData(actorData);
  }

  /**
   * Prepare Character type specific data
   */
  _prepareCharacterData(actorData) {
    if (actorData.type !== 'character') return;

    // Make modifications to data here. For example:
    const systemData = actorData.system;

    // Calculate totals for attributes
    this._calculateAttributeTotals(systemData);

    // Calculate skill totals
    this._calculateSkillTotals(systemData);

    // Calculate exertion
    this._calculateExertionTotal(systemData);

    // Update health boxes based on Guts
    this._updateHealthBoxes(systemData);

    // Apply wound effects - DISABLED: Now handled by HealthWounds component
    // this._applyWoundEffects();

    // Apply morale effects to exertion
    this._applyMoraleEffects(systemData);
  }

  /**
   * Prepare NPC type specific data.
   */
  _prepareNpcData(actorData) {
    if (actorData.type !== 'npc') return;

    // Make modifications to data here. For example:
    const systemData = actorData.system;
  }

  /**
   * Calculate totals for each attribute including breeding bonuses
   */
  _calculateAttributeTotals(systemData) {
    if (!systemData.attributes) return;

    systemData.totals = systemData.totals || {};

    // Physical attributes
    if (systemData.attributes.physical) {
      systemData.totals.might = (systemData.attributes.physical.might?.value || 0) + 
                               (systemData.attributes.physical.might?.breedingBonus || 0);
      systemData.totals.coordination = (systemData.attributes.physical.coordination?.value || 0) + 
                                      (systemData.attributes.physical.coordination?.breedingBonus || 0);
      systemData.totals.endurance = (systemData.attributes.physical.endurance?.value || 0) + 
                                   (systemData.attributes.physical.endurance?.breedingBonus || 0);
    }

    // Mental attributes
    if (systemData.attributes.mental) {
      systemData.totals.intelligence = (systemData.attributes.mental.intelligence?.value || 0) + 
                                      (systemData.attributes.mental.intelligence?.breedingBonus || 0);
      systemData.totals.guile = (systemData.attributes.mental.guile?.value || 0) + 
                               (systemData.attributes.mental.guile?.breedingBonus || 0);
      systemData.totals.guts = (systemData.attributes.mental.guts?.value || 0) + 
                              (systemData.attributes.mental.guts?.breedingBonus || 0);
    }

    // Social attributes
    if (systemData.attributes.social) {
      systemData.totals.bearing = (systemData.attributes.social.bearing?.value || 0) + 
                                 (systemData.attributes.social.bearing?.breedingBonus || 0);
      systemData.totals.charm = (systemData.attributes.social.charm?.value || 0) + 
                               (systemData.attributes.social.charm?.breedingBonus || 0);
      systemData.totals.composure = (systemData.attributes.social.composure?.value || 0) + 
                                   (systemData.attributes.social.composure?.breedingBonus || 0);
    }
  }

  /**
   * Calculate skill totals including all bonuses
   */
  _calculateSkillTotals(systemData) {
    if (!systemData.skills) return;

    // Calculate combat skills
    if (systemData.skills.combat) {
      for (const [skillName, skill] of Object.entries(systemData.skills.combat)) {
        if (skill && typeof skill === 'object') {
          skill.total = (skill.breeding || 0) + (skill.commando || 0) + 
                       (skill.primary || 0) + (skill.secondary || 0) + 
                       (skill.tertiary || 0) + (skill.modifier || 0);
        }
      }
    }

    // Calculate general skills
    if (systemData.skills.general) {
      for (const [skillName, skill] of Object.entries(systemData.skills.general)) {
        if (skill && typeof skill === 'object') {
          skill.total = (skill.breeding || 0) + (skill.commando || 0) + 
                       (skill.primary || 0) + (skill.secondary || 0) + 
                       (skill.tertiary || 0) + (skill.modifier || 0);
        }
      }
    }

    // Calculate custom skills
    if (systemData.skills.custom) {
      for (const [skillName, skill] of Object.entries(systemData.skills.custom)) {
        if (skill && typeof skill === 'object') {
          skill.total = (skill.breeding || 0) + (skill.commando || 0) + 
                       (skill.primary || 0) + (skill.secondary || 0) + 
                       (skill.tertiary || 0) + (skill.modifier || 0);
        }
      }
    }
  }

  /**
   * Calculate exertion total
   */
  _calculateExertionTotal(systemData) {
    if (!systemData.exertion) return;

    // Base exertion calculation: 6 + Guile + Coordination
    const base = systemData.exertion.base || 6;
    const guile = systemData.totals?.guile || 0;
    const coordination = systemData.totals?.coordination || 0;
    const multiplier = systemData.exertion.multiplier || 1.0;

    // Calculate base maximum
    const baseMax = base + guile + coordination;
    
    // Apply multiplier (from morale effects, etc.)
    systemData.exertion.max = Math.floor(baseMax * multiplier);
    
    // Ensure current value doesn't exceed max
    if (systemData.exertion.value > systemData.exertion.max) {
      systemData.exertion.value = systemData.exertion.max;
    }
  }

  /**
   * Update health boxes based on Guts attribute
   */
  _updateHealthBoxes(systemData) {
    if (!systemData.health || !systemData.totals) return;

    const guts = systemData.totals.guts || 1;

    // Always available: bruised1, grazed1, hurt1, injured1, critical1, dead
    // Conditional boxes based on Guts:
    // bruised2, grazed2: require Guts 5+
    // hurt2: requires Guts 4+
    // injured2: requires Guts 3+
    // critical2: requires Guts 2+

    systemData.health.bruised2Available = guts >= 5;
    systemData.health.grazed2Available = guts >= 5;
    systemData.health.hurt2Available = guts >= 4;
    systemData.health.injured2Available = guts >= 3;
    systemData.health.critical2Available = guts >= 2;

    // If Guts drops below requirement, clear the unavailable health boxes
    if (guts < 5) {
      systemData.health.bruised2 = false;
      systemData.health.grazed2 = false;
    }
    if (guts < 4) {
      systemData.health.hurt2 = false;
    }
    if (guts < 3) {
      systemData.health.injured2 = false;
    }
    if (guts < 2) {
      systemData.health.critical2 = false;
    }
  }

  /**
   * Apply wound effects based on current health status
   * DISABLED: Wound effects are now handled by the HealthWounds component
   * This method is kept for compatibility but no longer creates wound effects
   */
  _applyWoundEffects() {
    // Wound effects are now handled by HealthWounds component using effect templates
    // This legacy method has been disabled to prevent duplicate wound effects
    console.log(`${this.name} - Wound effects handled by HealthWounds component (legacy method disabled)`);
    return;
  }

  /**
   * Apply morale effects to exertion and other systems
   */
  _applyMoraleEffects(systemData) {
    // Morale effects are now handled through Active Effects system
    // The exertion multiplier is automatically applied during prepareData
    // This method can be extended for additional morale-based calculations
    
    const moraleState = systemData.morale?.state || "undaunted";
    
    // Log morale state for debugging
    if (moraleState !== "undaunted") {
      console.log(`${this.name} - Morale state: ${moraleState}`);
    }
  }

  /**
   * Create wound effect - LEGACY METHOD (DISABLED)
   * This method has been disabled as wound effects are now handled by HealthWounds component
   */
  async _createWoundEffect(woundType, penalty) {
    console.log(`${this.name} - Legacy _createWoundEffect() called but disabled - HealthWounds component handles wound effects`);
    return;
  }

  /**
   * Get wound effect changes based on wound type and penalty - LEGACY METHOD (DISABLED)
   * This method has been disabled as wound effects are now handled by HealthWounds component
   */
  _getWoundEffectChanges(woundType, penalty) {
    console.log(`${this.name} - Legacy _getWoundEffectChanges() called but disabled - HealthWounds component handles wound effects`);
    return [];
  }

  /**
   * Remove wound effects - LEGACY METHOD (DISABLED)
   * This method has been disabled as wound effects are now handled by HealthWounds component
   */
  async _removeWoundEffects() {
    console.log(`${this.name} - Legacy _removeWoundEffects() called but disabled - HealthWounds component handles wound effects`);
    return;
  }

  /**
   * Calculate the initiative value for this actor
   */
  _calculateInitiative() {
    const coordination = this.system.totals?.coordination || 0;
    const guile = this.system.totals?.guile || 0;
    return coordination + guile;
  }

  /**
   * Roll initiative for this actor
   */
  async rollInitiative() {
    const baseInitiative = this._calculateInitiative();
    const roll = new Roll('1d10 + @base', { base: baseInitiative });
    await roll.evaluate();

    const chatData = {
      user: game.user.id,
      speaker: ChatMessage.getSpeaker({ actor: this }),
      content: `
        <div class="initiative-roll">
          <h3>Initiative Roll</h3>
          <p><strong>Formula:</strong> Coordination + Guile + 1d10</p>
          <p><strong>Base:</strong> ${baseInitiative} (${this.system.totals?.coordination || 0} + ${this.system.totals?.guile || 0})</p>
          <p><strong>Total:</strong> ${roll.total}</p>
        </div>
      `,
      type: CONST.CHAT_MESSAGE_TYPES.ROLL,
      roll: roll
    };

    ChatMessage.create(chatData);

    // Update combat tracker if in combat
    if (game.combat && game.combat.combatants) {
      const combatant = game.combat.combatants.find(c => c.actor.id === this.id);
      if (combatant) {
        await game.combat.setInitiative(combatant.id, roll.total);
      }
    }

    return roll.total;
  }

  // ===========================================
  // EXERTION SYSTEM METHODS
  // ===========================================

  /**
   * Calculate maximum exertion
   */
  _calculateExertion() {
    const base = this.system.exertion?.base || 6;
    const guile = this.system.totals?.guile || 0;
    const coordination = this.system.totals?.coordination || 0;
    const multiplier = this.system.exertion?.multiplier || 1.0;

    return Math.floor((base + guile + coordination) * multiplier);
  }

  /**
   * Modify exertion value
   * @param {number} amount - Amount to modify (positive or negative)
   * @param {boolean} suppressChat - Whether to suppress chat message
   */
  async modifyExertion(amount, suppressChat = false) {
    const currentValue = this.system.exertion?.value || 0;
    const maxValue = this.system.exertion?.max || 0;
    
    const newValue = Math.max(0, Math.min(currentValue + amount, maxValue));
    
    await this.update({ 'system.exertion.value': newValue }, { render: false });
    
    if (!suppressChat) {
      const verb = amount > 0 ? 'gained' : 'spent';
      const absAmount = Math.abs(amount);
      
      ChatMessage.create({
        user: game.user.id,
        speaker: ChatMessage.getSpeaker({ actor: this }),
        content: `<p>${this.name} ${verb} ${absAmount} exertion. (${currentValue} → ${newValue})</p>`
      });
    }
    
    return newValue;
  }

  /**
   * Restore exertion to maximum (for turn start)
   */
  async restoreExertion(suppressChat = false) {
    const maxValue = this.system.exertion?.max || 0;
    
    await this.update({ 'system.exertion.value': maxValue }, { render: false });
    
    if (!suppressChat) {
      ChatMessage.create({
        user: game.user.id,
        speaker: ChatMessage.getSpeaker({ actor: this }),
        content: `<p>${this.name} restored exertion to ${maxValue}.</p>`
      });
    }
    
    return maxValue;
  }

  // ===========================================
  // EFFECT TEMPLATES SYSTEM METHODS
  // ===========================================

  /**
   * Get effect templates from world settings
   * @returns {Object} Effect templates organized by category
   */
  getEffectTemplates() {
    return game.settings.get('thirteen-commando', 'effectTemplates') || {
      combat: [],
      physical: [],
      environmental: [],
      medical: [],
      custom: []
    };
  }

  /**
   * Save effect templates to world settings
   * @param {Object} templates - Templates to save
   */
  async saveEffectTemplates(templates) {
    await game.settings.set('thirteen-commando', 'effectTemplates', templates);
  }

  /**
   * Ensure the effect templates setting is registered
   * @private
   */
  _ensureTemplateSettingRegistered() {
    try {
      game.settings.get('thirteen-commando', 'effectTemplates');
    } catch (error) {
      // Setting doesn't exist, register it
      game.settings.register('thirteen-commando', 'effectTemplates', {
        name: 'Effect Templates',
        hint: 'Stores effect templates for the world',
        scope: 'world',
        config: false,
        type: Object,
        default: {
          combat: [],
          physical: [],
          environmental: [],
          medical: [],
          custom: []
        }
      });
    }
  }

  // ===========================================
  // MORALE SYSTEM METHODS
  // ===========================================

  /**
   * Get current morale state with display information
   * @returns {Object} Morale state information
   */
  getMoraleState() {
    const moraleData = this.system.morale || { state: "undaunted" };
    
    const moraleStates = {
      undaunted: {
        name: "Undaunted",
        description: "No morale effects",
        color: "#2ecc71",
        icon: "fas fa-shield-alt",
        effects: [],
        exertionMultiplier: 1.0,
        canMove: true,
        canAct: true
      },
      suppressed: {
        name: "Suppressed",
        description: "Halved Exertion",
        color: "#f39c12",
        icon: "fas fa-exclamation-triangle",
        effects: ["Halved Exertion"],
        exertionMultiplier: 0.5,
        canMove: true,
        canAct: true
      },
      pinned: {
        name: "Pinned",
        description: "Halved Exertion, Cannot Move",
        color: "#e67e22",
        icon: "fas fa-anchor",
        effects: ["Halved Exertion", "Cannot Move"],
        exertionMultiplier: 0.5,
        canMove: false,
        canAct: true
      },
      shattered: {
        name: "Shattered",
        description: "Self-preservation only",
        color: "#e74c3c",
        icon: "fas fa-skull-crossbones",
        effects: ["Self-preservation only"],
        exertionMultiplier: 0.25,
        canMove: true,
        canAct: false // Only self-preservation actions
      }
    };

    return {
      current: moraleData.state,
      data: moraleStates[moraleData.state] || moraleStates.undaunted,
      canRecover: moraleData.canRecover !== false,
      turnRecoveryUsed: moraleData.turnRecoveryUsed || false,
      lastDamageSource: moraleData.lastDamageSource || "",
      resistRoll: moraleData.resistRoll || { attempted: false, succeeded: false, difficulty: 1 }
    };
  }

  /**
   * Apply morale damage from being hit by enemy fire
   * @param {string} source - Source of the morale damage (e.g., weapon name, attacker name)
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} Result of morale damage application
   */
  async applyMoraleDamage(source = "Enemy Fire", options = {}) {
    console.log(`${this.name} - Applying morale damage from: ${source}`);
    
    const currentState = this.system.morale?.state || "undaunted";
    const isPC = this.type === "character";
    
    // Determine next morale state
    const progression = ["undaunted", "suppressed", "pinned", "shattered"];
    const currentIndex = progression.indexOf(currentState);
    const nextIndex = Math.min(currentIndex + 1, progression.length - 1);
    const nextState = progression[nextIndex];
    
    // If already at maximum morale damage, no further effect
    if (currentIndex >= progression.length - 1) {
      console.log(`${this.name} - Already at maximum morale damage (${currentState})`);
      return {
        success: false,
        reason: "Already at maximum morale damage",
        currentState,
        newState: currentState,
        resisted: false
      };
    }
    
    let result = {
      success: false,
      currentState,
      newState: nextState,
      resisted: false,
      resistRoll: null,
      source
    };
    
    // PCs can attempt to resist morale damage
    if (isPC && !options.skipResistance) {
      const resistanceResult = await this.rollMoraleResistance(source);
      result.resistRoll = resistanceResult;
      
      if (resistanceResult.success) {
        result.resisted = true;
        result.newState = currentState; // No state change
        console.log(`${this.name} - Resisted morale damage!`);
        
        // Update resistance tracking
        await this.update({
          "system.morale.resistRoll.attempted": true,
          "system.morale.resistRoll.succeeded": true,
          "system.morale.lastDamageSource": source
        }, { render: false });
        
        return result;
      }
    }
    
    // Apply morale damage
    await this._updateMoraleState(nextState, source);
    result.success = true;
    
    console.log(`${this.name} - Morale state changed: ${currentState} → ${nextState}`);
    
    return result;
  }

  /**
   * Roll morale resistance (PCs only)
   * @param {string} source - Source of the morale threat
   * @returns {Promise<Object>} Resistance roll result
   */
  async rollMoraleResistance(source = "Unknown") {
    console.log(`${this.name} - Rolling morale resistance against: ${source}`);
    
    // Only PCs can resist
    if (this.type !== "character") {
      return { success: false, reason: "NPCs cannot resist morale damage" };
    }
    
    const guts = this.system.attributes.mental.guts.value + 
                 (this.system.attributes.mental.guts.breedingBonus || 0);
    const composure = this.system.attributes.social.composure.value + 
                     (this.system.attributes.social.composure.breedingBonus || 0);
    
    const dicePool = guts + composure;
    const difficulty = 1; // Standard difficulty
    
    if (dicePool <= 0) {
      return { 
        success: false, 
        reason: "No dice to roll",
        dicePool: 0,
        successes: 0,
        difficulty
      };
    }
    
    // Create the roll
    const roll = new Roll(`${dicePool}d6`);
    await roll.evaluate();
    
    // Calculate successes (5-6 = success for skilled roll)
    const successes = roll.terms[0].results.reduce((count, die) => {
      return count + (die.result >= 5 ? 1 : 0);
    }, 0);
    
    const success = successes >= difficulty;
    
    // Create chat message for resistance roll
    const chatData = {
      user: game.user.id,
      speaker: ChatMessage.getSpeaker({ actor: this }),
      content: `
        <div class="morale-resistance-roll">
          <h3><i class="fas fa-shield-alt"></i> Morale Resistance Roll</h3>
          <div class="roll-details">
            <p><strong>Source:</strong> ${source}</p>
            <p><strong>Dice Pool:</strong> ${guts} Guts + ${composure} Composure = ${dicePool}d6</p>
            <p><strong>Difficulty:</strong> ${difficulty} success${difficulty !== 1 ? 'es' : ''}</p>
            <div class="dice-result">${roll.result}</div>
            <p><strong>Successes:</strong> ${successes}</p>
            <p class="result ${success ? 'success' : 'failure'}">
              <strong>${success ? 'SUCCESS' : 'FAILURE'}</strong> - 
              ${success ? 'Morale damage resisted!' : 'Morale damage takes effect.'}
            </p>
          </div>
        </div>
      `,
      type: CONST.CHAT_MESSAGE_TYPES.ROLL,
      roll: roll,
      flags: {
        "thirteen-commando": {
          type: "morale-resistance",
          actor: this.id,
          source: source
        }
      }
    };
    
    ChatMessage.create(chatData);
    
    return {
      success,
      dicePool,
      successes,
      difficulty,
      roll,
      source
    };
  }

  /**
   * Attempt morale recovery (costs 2 exertion)
   * @returns {Promise<Object>} Recovery attempt result
   */
  async attemptMoraleRecovery() {
    console.log(`${this.name} - Attempting morale recovery`);
    
    const currentMorale = this.getMoraleState();
    const currentExertion = this.system.exertion?.value || 0;
    const recoveryUsed = this.system.morale?.turnRecoveryUsed || false;
    
    // Validation checks
    if (currentMorale.current === "undaunted") {
      return { 
        success: false, 
        reason: "Already at best morale state",
        currentState: currentMorale.current
      };
    }
    
    if (currentExertion < 2) {
      return { 
        success: false, 
        reason: "Insufficient exertion (need 2)",
        currentExertion,
        required: 2
      };
    }
    
    if (recoveryUsed) {
      return { 
        success: false, 
        reason: "Recovery already attempted this turn"
      };
    }
    
    // Spend exertion first
    await this.modifyExertion(-2, true); // Spend 2 exertion, suppress chat
    
    // Mark recovery as used this turn
    await this.update({
      "system.morale.turnRecoveryUsed": true
    }, { render: false });
    
    const guts = this.system.attributes.mental.guts.value + 
                 (this.system.attributes.mental.guts.breedingBonus || 0);
    const composure = this.system.attributes.social.composure.value + 
                     (this.system.attributes.social.composure.breedingBonus || 0);
    
    const dicePool = guts + composure;
    const difficulty = 1; // Standard difficulty
    
    if (dicePool <= 0) {
      return { 
        success: false, 
        reason: "No dice to roll",
        dicePool: 0,
        exertionSpent: 2
      };
    }
    
    // Create the roll
    const roll = new Roll(`${dicePool}d6`);
    await roll.evaluate();
    
    // Calculate successes (5-6 = success for skilled roll)
    const successes = roll.terms[0].results.reduce((count, die) => {
      return count + (die.result >= 5 ? 1 : 0);
    }, 0);
    
    const success = successes >= difficulty;
    let newState = currentMorale.current;
    
    if (success) {
      // Improve morale by one stage
      const progression = ["undaunted", "suppressed", "pinned", "shattered"];
      const currentIndex = progression.indexOf(currentMorale.current);
      const newIndex = Math.max(currentIndex - 1, 0);
      newState = progression[newIndex];
      
      await this._updateMoraleState(newState, "Recovery Action");
    }
    
    // Create chat message for recovery attempt
    const chatData = {
      user: game.user.id,
      speaker: ChatMessage.getSpeaker({ actor: this }),
      content: `
        <div class="morale-recovery-roll">
          <h3><i class="fas fa-heart"></i> Morale Recovery Attempt</h3>
          <div class="roll-details">
            <p><strong>Exertion Cost:</strong> 2 points</p>
            <p><strong>Dice Pool:</strong> ${guts} Guts + ${composure} Composure = ${dicePool}d6</p>
            <p><strong>Difficulty:</strong> ${difficulty} success${difficulty !== 1 ? 'es' : ''}</p>
            <div class="dice-result">${roll.result}</div>
            <p><strong>Successes:</strong> ${successes}</p>
            <p class="result ${success ? 'success' : 'failure'}">
              <strong>${success ? 'SUCCESS' : 'FAILURE'}</strong>
            </p>
            ${success ? `<p><strong>Morale improved:</strong> ${currentMorale.data.name} → ${this.getMoraleState().data.name}</p>` : ''}
          </div>
        </div>
      `,
      type: CONST.CHAT_MESSAGE_TYPES.ROLL,
      roll: roll,
      flags: {
        "thirteen-commando": {
          type: "morale-recovery",
          actor: this.id
        }
      }
    };
    
    ChatMessage.create(chatData);
    
    return {
      success,
      dicePool,
      successes,
      difficulty,
      roll,
      currentState: currentMorale.current,
      newState,
      exertionSpent: 2
    };
  }

  /**
   * Update morale state and apply/remove effects
   * @param {string} newState - New morale state
   * @param {string} source - Source of the change
   * @private
   */
  async _updateMoraleState(newState, source = "Unknown") {
    console.log(`${this.name} - Updating morale state to: ${newState}`);
    
    // Update morale data
    await this.update({
      "system.morale.state": newState,
      "system.morale.lastDamageSource": source,
      "system.morale.canRecover": newState !== "undaunted"
    }, { render: false });
    
    // Remove existing morale effects
    await this._removeMoraleEffects();
    
    // Apply new morale effects if not undaunted
    if (newState !== "undaunted") {
      await this._applyMoraleEffect(newState);
    }
    
    // Update exertion multiplier based on new state
    await this._updateExertionMultiplier();
    
    // Manual sheet update to reflect changes
    if (this.sheet && this.sheet.rendered) {
      this.sheet._updateMoraleDisplay?.();
      this.sheet._updateExertionDisplay?.(this.system.exertion.value);
    }
  }

  /**
   * Apply morale effect template
   * @param {string} moraleState - Morale state to apply
   * @private
   */
  async _applyMoraleEffect(moraleState) {
    const moraleStateData = this.getMoraleState().data;
    
    const effectData = {
      name: `Morale: ${moraleStateData.name}`,
      icon: moraleStateData.icon,
      origin: this.uuid,
      duration: { 
        // Indefinite duration until recovered or combat ends
        rounds: null,
        seconds: null,
        turns: null
      },
      changes: [
        {
          key: "system.exertion.multiplier",
          mode: CONST.ACTIVE_EFFECT_MODES.MULTIPLY,
          value: moraleStateData.exertionMultiplier,
          priority: 30
        }
      ],
      disabled: false,
      transfer: false,
      flags: {
        "thirteen-commando": {
          type: "morale-effect",
          moraleState: moraleState,
          isAutoApplied: true
        }
      },
      statuses: [`morale-${moraleState}`] // For token status icons
    };
    
    // Add movement restriction for pinned state
    if (moraleState === "pinned") {
      effectData.changes.push({
        key: "system.movement.restricted",
        mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
        value: true,
        priority: 30
      });
    }
    
    await this.createEmbeddedDocuments("ActiveEffect", [effectData]);
    console.log(`${this.name} - Applied morale effect: ${moraleStateData.name}`);
  }

  /**
   * Remove existing morale effects
   * @private
   */
  async _removeMoraleEffects() {
    const moraleEffects = this.effects.filter(effect => 
      effect.getFlag("thirteen-commando", "type") === "morale-effect"
    );
    
    if (moraleEffects.length > 0) {
      const effectIds = moraleEffects.map(e => e.id);
      await this.deleteEmbeddedDocuments("ActiveEffect", effectIds);
      console.log(`${this.name} - Removed ${moraleEffects.length} morale effect(s)`);
    }
  }

  /**
   * Update exertion multiplier based on current morale and other effects
   * @private
   */
  async _updateExertionMultiplier() {
    // This will be handled by the Active Effect system
    // The exertion calculation will automatically include the multiplier
    // Force recalculation of exertion values
    const newMax = this._calculateExertion();
    const currentValue = Math.min(this.system.exertion.value, newMax);
    
    await this.update({
      "system.exertion.max": newMax,
      "system.exertion.value": currentValue
    }, { render: false });
  }

  /**
   * Reset turn-based morale flags (called at start of turn)
   */
  async resetMoraleTurnFlags() {
    console.log(`${this.name} - Resetting morale turn flags`);
    
    await this.update({
      "system.morale.turnRecoveryUsed": false,
      "system.morale.resistRoll.attempted": false,
      "system.morale.resistRoll.succeeded": false
    }, { render: false });
  }

  /**
   * Check if actor can perform specific actions based on morale state
   * @param {string} actionType - Type of action (move, attack, recovery, etc.)
   * @returns {Object} Action availability information
   */
  canPerformAction(actionType) {
    const moraleState = this.getMoraleState();
    
    const restrictions = {
      undaunted: {},
      suppressed: {},
      pinned: {
        move: false
      },
      shattered: {
        attack: false,
        nonSelfPreservation: false
      }
    };
    
    const currentRestrictions = restrictions[moraleState.current] || {};
    
    return {
      allowed: !currentRestrictions[actionType],
      restriction: currentRestrictions[actionType] || null,
      moraleState: moraleState.current,
      reason: currentRestrictions[actionType] ? 
             `Action restricted due to ${moraleState.data.name} morale state` : null
    };
  }

  // ===========================================
  // DICE ROLLING METHODS
  // ===========================================

  /**
   * Show skill selection dialog and roll based on choice
   * @param {string} attributeName - Name of the attribute being rolled
   * @param {number} attributeValue - Value of the attribute
   * @returns {Promise<Object>} Roll result
   */
  async rollAttribute(attributeName, attributeValue) {
    // Show dialog to choose skilled vs unskilled
    const skilled = await this._showSkillDialog(attributeName);
    
    // Perform the roll
    return this._performAttributeRoll(attributeName, attributeValue, skilled);
  }

  /**
   * Show dialog for skilled vs unskilled roll choice
   * @param {string} attributeName - Name of the attribute
   * @returns {Promise<boolean>} True for skilled, false for unskilled
   * @private
   */
  async _showSkillDialog(attributeName) {
    return new Promise((resolve) => {
      const dialog = new Dialog({
        title: `${attributeName.charAt(0).toUpperCase() + attributeName.slice(1)} Roll`,
        content: `
          <div class="skill-choice-dialog">
            <p>Choose your roll type for <strong>${attributeName}</strong>:</p>
            <div class="choice-buttons">
              <button type="button" class="skilled-btn" data-choice="true">
                <i class="fas fa-star"></i> Skilled (5-6 pass)
              </button>
              <button type="button" class="unskilled-btn" data-choice="false">
                <i class="fas fa-circle"></i> Unskilled (6 pass)
              </button>
            </div>
          </div>
          <style>
            .skill-choice-dialog { text-align: center; padding: 20px; }
            .choice-buttons { display: flex; gap: 10px; justify-content: center; margin-top: 15px; }
            .choice-buttons button { 
              padding: 10px 20px; 
              border: 2px solid #d4af37; 
              background: rgba(52, 73, 94, 0.8);
              color: #ecf0f1;
              border-radius: 5px;
              cursor: pointer;
              transition: all 0.3s;
            }
            .choice-buttons button:hover { 
              background: rgba(212, 175, 55, 0.2);
              transform: translateY(-2px);
            }
          </style>
        `,
        buttons: {},
        render: (html) => {
          html.find('[data-choice]').click((event) => {
            const choice = event.currentTarget.dataset.choice === "true";
            dialog.close();
            resolve(choice);
          });
        },
        close: () => resolve(false) // Default to unskilled if closed
      });
      dialog.render(true);
    });
  }

  /**
   * Perform the actual attribute roll
   * @param {string} attributeName - Name of the attribute
   * @param {number} attributeValue - Value of the attribute
   * @param {boolean} skilled - Whether this is a skilled roll
   * @returns {Promise<Object>} Roll result
   * @private
   */
  async _performAttributeRoll(attributeName, attributeValue, skilled) {
    const diceCount = Math.max(1, attributeValue);
    const roll = new Roll(`${diceCount}d6`);
    await roll.evaluate();
    
    // Calculate successes
    const successes = this._calculateSuccesses(roll.terms[0].results, skilled);
    const failures = diceCount - successes;
    
    // Determine result
    const result = successes > failures ? "Success" : "Failure";
    const resultClass = result.toLowerCase();
    
    // Create chat message
    const chatData = {
      user: game.user.id,
      speaker: ChatMessage.getSpeaker({ actor: this }),
      content: `
        <div class="attribute-roll">
          <h3>${attributeName.charAt(0).toUpperCase() + attributeName.slice(1)} Roll</h3>
          <div class="roll-details">
            <p><strong>Type:</strong> ${skilled ? 'Skilled (5-6 pass)' : 'Unskilled (6 pass)'}</p>
            <p><strong>Dice Pool:</strong> ${diceCount}d6</p>
            <div class="dice-result">${roll.result}</div>
            <p><strong>Successes:</strong> ${successes}</p>
            <p><strong>Failures:</strong> ${failures}</p>
            <p class="result ${resultClass}"><strong>${result}</strong></p>
          </div>
        </div>
      `,
      type: CONST.CHAT_MESSAGE_TYPES.ROLL,
      roll: roll,
      flags: {
        "thirteen-commando": {
          type: "attribute-roll",
          attribute: attributeName,
          skilled: skilled,
          successes: successes,
          failures: failures,
          result: result
        }
      }
    };
    
    ChatMessage.create(chatData);
    
    return {
      roll,
      successes,
      failures,
      result,
      skilled,
      attribute: attributeName
    };
  }

  /**
   * Calculate successes from dice results
   * @param {Array} diceResults - Array of dice results
   * @param {boolean} skilled - Whether this is a skilled roll
   * @returns {number} Number of successes
   * @private
   */
  _calculateSuccesses(diceResults, skilled) {
    return diceResults.reduce((successes, die) => {
      const value = die.result;
      if (skilled) {
        return successes + (value >= 5 ? 1 : 0);
      } else {
        return successes + (value === 6 ? 1 : 0);
      }
    }, 0);
  }

  /**
   * Roll a skill check
   * @param {string} skillKey - Skill key in format "category.skillname"
   * @param {string} attributeName - Associated attribute name
   * @returns {Promise<Object>} Roll result
   */
  async rollSkill(skillKey, attributeName) {
    const [category, skillName] = skillKey.split('.');
    const skill = this.system.skills[category]?.[skillName];
    
    if (!skill) {
      ui.notifications.error(`Skill ${skillKey} not found`);
      return null;
    }
    
    const skillTotal = (skill.breeding || 0) + (skill.commando || 0) + 
                      (skill.primary || 0) + (skill.secondary || 0) + 
                      (skill.tertiary || 0) + (skill.modifier || 0);
    
    const attributeValue = this.system.totals?.[attributeName] || 0;
    const totalDice = attributeValue + skillTotal;
    
    // Skills are always considered "skilled" rolls
    return this._performSkillRoll(skillKey, skillName, totalDice, attributeValue, skillTotal);
  }

  /**
   * Perform skill roll
   * @param {string} skillKey - Skill key
   * @param {string} skillName - Display name of skill
   * @param {number} totalDice - Total dice to roll
   * @param {number} attributeValue - Attribute contribution
   * @param {number} skillTotal - Skill contribution
   * @returns {Promise<Object>} Roll result
   * @private
   */
  async _performSkillRoll(skillKey, skillName, totalDice, attributeValue, skillTotal) {
    const diceCount = Math.max(1, totalDice);
    const roll = new Roll(`${diceCount}d6`);
    await roll.evaluate();
    
    // Skills are always skilled rolls (5-6 = success)
    const successes = this._calculateSuccesses(roll.terms[0].results, true);
    const failures = diceCount - successes;
    
    // Determine result
    const result = successes > failures ? "Success" : "Failure";
    const resultClass = result.toLowerCase();
    
    // Create chat message
    const chatData = {
      user: game.user.id,
      speaker: ChatMessage.getSpeaker({ actor: this }),
      content: `
        <div class="skill-roll">
          <h3>${skillName} Roll</h3>
          <div class="roll-details">
            <p><strong>Type:</strong> Skilled (5-6 pass)</p>
            <p><strong>Total Dice:</strong> ${attributeValue} (attribute) + ${skillTotal} (skill) = ${diceCount}d6</p>
            <div class="dice-result">${roll.result}</div>
            <p><strong>Successes:</strong> ${successes}</p>
            <p><strong>Failures:</strong> ${failures}</p>
            <p class="result ${resultClass}"><strong>${result}</strong></p>
          </div>
        </div>
      `,
      type: CONST.CHAT_MESSAGE_TYPES.ROLL,
      roll: roll,
      flags: {
        "thirteen-commando": {
          type: "skill-roll",
          skill: skillKey,
          skillName: skillName,
          totalDice: diceCount,
          attributeValue: attributeValue,
          skillTotal: skillTotal,
          successes: successes,
          failures: failures,
          result: result
        }
      }
    };
    
    ChatMessage.create(chatData);
    
    return {
      roll,
      successes,
      failures,
      result,
      skill: skillKey,
      skillName,
      totalDice: diceCount
    };
  }
}