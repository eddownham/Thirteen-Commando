import { ThirteenCommandoActorSheet } from "./actor-sheet.mjs";

/**
 * Extend the basic ActorSheet with some very simple modifications
 * @extends {ThirteenCommandoActorSheet}
 */
export class ThirteenCommandoMinionSheet extends ThirteenCommandoActorSheet {

  /** @override */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["thirteen-commando", "sheet", "actor", "minion"],
      template: "systems/thirteen-commando/templates/actor/actor-minion-sheet.html",
      width: 400,
      height: 500,
      tabs: [{ navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "main" }]
    });
  }

  /* -------------------------------------------- */

  /** @override */
    /** @override */
    getData() {
        console.log("Building minion context without super.getData()");

        // Get basic context WITHOUT calling super.getData() to avoid attribute access
        const context = {};

        // Use a safe clone of the actor data for further operations.
        const actorData = this.actor.toObject(false);
        console.log("Got actor data");

        // Add the actor's data to context for easier access
        context.actor = actorData;
        context.system = actorData.system;
        context.flags = actorData.flags;
        context.rollData = this.actor.getRollData();
        console.log("Set basic context properties");

        // Calculate derived values for minions
        context.system.derived = this._calculateDerivedValues(context.system);
        console.log("Calculated derived values");

        // Add combat status
        context.inCombat = game.combat?.combatants?.find(c => c.actor?.id === this.actor.id) !== undefined;

        // Add sheet configuration
        context.cssClass = this.actor.isOwner ? "editable" : "locked";
        context.editable = this.isEditable;
        context.limited = this.actor.limited;
        context.options = this.options;
        context.owner = this.actor.isOwner;
        context.title = this.title;

        console.log("Minion getData completed successfully");
        return context;
    }

  /* -------------------------------------------- */

  /**
   * Calculate derived values for minions
   * @param {Object} system - The actor's system data
   * @returns {Object} - Calculated derived values
   */
  _calculateDerivedValues(system) {
    const derived = {
      dicePool: 0,
      healthModifier: 0,
      effectiveDicePool: 0
    };

    // Base dice pool = training + equipment score
    derived.dicePool = (system.training || 1) + (system.equipment?.score || 1);

    // Calculate health modifier based on checked health boxes
      derived.healthModifier = this._getHealthModifier(system.health || {});

    // Effective dice pool = base dice pool + health modifier (modifier is negative)
    derived.effectiveDicePool = Math.max(0, derived.dicePool + derived.healthModifier);

    return derived;
  }

  /* -------------------------------------------- */

  /**
   * Get the current health modifier based on checked health boxes
   * @param {Object} health - The health data
   * @returns {number} - The health modifier (negative value)
   */
  _getHealthModifier(health) {
    if (health.dead) return -10;
    if (health.critical) return -3;
    if (health.bloodied) return -2;
    if (health.injured) return -1;
    return 0;
  }
    /**
   * Override wound effects initialization for minions
   * Minions use a simplified health system, so we skip the complex wound effects
   * @override
   */
    async initializeWoundEffects() {
        // Minions don't use the complex wound effects system
        // They have their own simplified health penalties
        console.log("Skipping wound effects initialization for minion");
        return;
    }

  /* -------------------------------------------- */

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);

    // Everything below here is only needed if the sheet is editable
    if (!this.isEditable) return;

    // Add action button listeners
    html.find('.action-btn[data-action="attack"]').click(this._onAttack.bind(this));
    html.find('.action-btn[data-action="initiative"]').click(this._onInitiative.bind(this));
    html.find('.action-btn[data-action="heal"]').click(this._onHeal.bind(this));

    // Health checkbox listeners with automatic derived value updates
    html.find('.health-checkbox').change(this._onHealthChange.bind(this));

    // Training and equipment input listeners
    html.find('.training-input, .equipment-input').change(this._onStatChange.bind(this));
  }

  /* -------------------------------------------- */

  /**
   * Handle health checkbox changes and update derived values
   * @param {Event} event - The originating click event
   * @private
   */
  async _onHealthChange(event) {
    event.preventDefault();
    const checkbox = event.currentTarget;
    const healthType = checkbox.name.split('.').pop(); // Extract health type from name
    const isChecked = checkbox.checked;

    // Handle mutually exclusive health states
    if (isChecked) {
      const healthUpdate = {
        'system.health.injured': healthType === 'injured',
        'system.health.bloodied': healthType === 'bloodied', 
        'system.health.critical': healthType === 'critical',
        'system.health.dead': healthType === 'dead'
      };

      // If checking a more severe state, uncheck less severe ones
      if (healthType === 'dead') {
        // Dead overrides all
      } else if (healthType === 'critical') {
        healthUpdate['system.health.dead'] = false;
      } else if (healthType === 'bloodied') {
        healthUpdate['system.health.dead'] = false;
        healthUpdate['system.health.critical'] = false;
      } else if (healthType === 'injured') {
        healthUpdate['system.health.dead'] = false;
        healthUpdate['system.health.critical'] = false;
        healthUpdate['system.health.bloodied'] = false;
      }

      await this.actor.update(healthUpdate, { render: false });
    } else {
      // Just uncheck this specific health state
      await this.actor.update({ [`system.health.${healthType}`]: false }, { render: false });
    }

    // Update the display immediately
    this._updateDerivedDisplays();
  }

  /* -------------------------------------------- */

  /**
   * Handle training/equipment stat changes
   * @param {Event} event - The originating change event
   * @private
   */
  async _onStatChange(event) {
    event.preventDefault();
    const input = event.currentTarget;
    const value = parseInt(input.value) || 1;

    // Ensure value is within bounds (1-5)
    const clampedValue = Math.min(5, Math.max(1, value));
    
    if (value !== clampedValue) {
      input.value = clampedValue;
    }

    // Update the actor data
    await this.actor.update({ [input.name]: clampedValue }, { render: false });

    // Update derived value displays
    this._updateDerivedDisplays();
  }

  /* -------------------------------------------- */

  /**
   * Update derived value displays without full re-render
   * @private
   */
  _updateDerivedDisplays() {
    if (!this.element) return;

    const system = this.actor.system;
    const derived = this._calculateDerivedValues(system);

    // Update dice pool display
    const dicePoolDisplay = this.element.find('.dice-pool-display');
    if (dicePoolDisplay.length > 0) {
      dicePoolDisplay.text(derived.dicePool);
    }

    // Update modifier display
    const modifierDisplay = this.element.find('.modifier-display');
    if (modifierDisplay.length > 0) {
      modifierDisplay.text(derived.healthModifier);
      modifierDisplay.removeClass('negative positive');
      if (derived.healthModifier < 0) {
        modifierDisplay.addClass('negative');
      } else if (derived.healthModifier > 0) {
        modifierDisplay.addClass('positive');
      }
    }

    // Update effective dice pool
    const effectiveDisplay = this.element.find('.effective-pool');
    if (effectiveDisplay.length > 0) {
      effectiveDisplay.text(derived.effectiveDicePool);
      effectiveDisplay.removeClass('reduced normal');
      if (derived.effectiveDicePool < derived.dicePool) {
        effectiveDisplay.addClass('reduced');
      } else {
        effectiveDisplay.addClass('normal');
      }
    }
  }

  /* -------------------------------------------- */

  /**
   * Handle attack button click
   * @param {Event} event - The originating click event
   * @private
   */
  async _onAttack(event) {
    event.preventDefault();
    event.stopPropagation();

    const system = this.actor.system;
    const derived = this._calculateDerivedValues(system);
    const weaponName = system.equipment?.weaponName || "Unknown Weapon";

    if (derived.effectiveDicePool <= 0) {
      ui.notifications.warn(`${this.actor.name} cannot attack - no effective dice pool!`);
      return;
    }

    // Show attack dialog for skilled/unskilled choice
    const isSkilled = await this._showSkillDialog("Attack");
    if (isSkilled === null) return; // Dialog was cancelled

    // Roll the attack
    const roll = new Roll(`${derived.effectiveDicePool}d6`);
    await roll.evaluate();

      // Calculate successes - Updated to handle Foundry v12 dice results
      const diceResults = roll.dice[0]?.results || roll.terms[0]?.results || [];
      const successes = this._calculateSuccesses(diceResults, isSkilled);
      const failures = derived.effectiveDicePool - successes;

      // Format individual dice results for display
      const diceResultsText = diceResults.map(die => {
          const value = die.result || die.value || die;
          const isSuccess = isSkilled ? (value >= 5) : (value === 6);
          return `<span class="${isSuccess ? 'success' : 'failure'}">${value}</span>`;
      }).join(', ');

      // Create chat message
      const chatData = {
          user: game.user.id,
          speaker: ChatMessage.getSpeaker({ actor: this.actor }),
          content: `
    <div class="weapon-attack-roll">
      <h3>${this.actor.name} attacks with ${weaponName}</h3>
      <p><strong>Dice Pool:</strong> ${derived.effectiveDicePool}d6 (${isSkilled ? 'Skilled' : 'Unskilled'})</p>
      <p><strong>Individual Dice:</strong> [${diceResultsText}]</p>
      <p><strong>Successes:</strong> <span class="success">${successes}</span></p>
      <p><strong>Failures:</strong> <span class="failure">${failures}</span></p>
      ${derived.healthModifier < 0 ? `<p><em>Health penalty: ${derived.healthModifier}</em></p>` : ''}
    </div>
  `,
          sound: CONFIG.sounds.dice
      };

    ChatMessage.create(chatData);
  }

  /* -------------------------------------------- */

  /**
   * Handle initiative button click
   * @param {Event} event - The originating click event
   * @private
   */
  async _onInitiative(event) {
    event.preventDefault();
    event.stopPropagation();

    const system = this.actor.system;
    const training = system.training || 1;

    // Roll initiative (Training + 1d10)
    const roll = new Roll(`${training} + 1d10`);
    await roll.evaluate();

    const initiativeValue = roll.total;

    // Update actor's initiative
    await this.actor.update({ 
      'system.combat.initiative': initiativeValue,
      'system.combat.lastInitiative': initiativeValue 
    }, { render: false });

    // If in combat, update the combat tracker
    if (game.combat) {
      const combatant = game.combat.combatants.find(c => c.actor?.id === this.actor.id);
      if (combatant) {
        await game.combat.setInitiative(combatant.id, initiativeValue);
      }
    }

    // Create chat message
    const chatData = {
      user: game.user.id,
      speaker: ChatMessage.getSpeaker({ actor: this.actor }),
      content: `
        <div class="initiative-roll">
          <h3>${this.actor.name} Initiative</h3>
          <p><strong>Formula:</strong> Training (${training}) + 1d10</p>
          <p><strong>Roll:</strong> ${roll.result}</p>
          <p><strong>Initiative:</strong> <span class="success">${initiativeValue}</span></p>
        </div>
      `,
      sound: CONFIG.sounds.dice
    };

    ChatMessage.create(chatData);

    // Update initiative display
    this._updateInitiativeDisplay(initiativeValue);
  }

  /* -------------------------------------------- */

  /**
   * Handle heal/reset health button click
   * @param {Event} event - The originating click event
   * @private
   */
  async _onHeal(event) {
    event.preventDefault();
    event.stopPropagation();

    // Reset all health checkboxes to false
    await this.actor.update({
      'system.health.injured': false,
      'system.health.bloodied': false,
      'system.health.critical': false,
      'system.health.dead': false
    }, { render: false });

    // Update derived displays
    this._updateDerivedDisplays();

    // Show notification
    ui.notifications.info(`${this.actor.name} health reset to full`);

    // Create chat message
    const chatData = {
      user: game.user.id,
      speaker: ChatMessage.getSpeaker({ actor: this.actor }),
      content: `
        <div class="heal-action">
          <h3>${this.actor.name} Healed</h3>
          <p><em>Health reset to full - all penalties removed</em></p>
        </div>
      `
    };

    ChatMessage.create(chatData);
  }

  /* -------------------------------------------- */

  /**
   * Update initiative display without full re-render
   * @param {number} initiative - The new initiative value
   * @private
   */
  _updateInitiativeDisplay(initiative) {
    if (!this.element) return;

    const initiativeDisplay = this.element.find('.initiative-display');
    if (initiativeDisplay.length > 0) {
      initiativeDisplay.text(initiative);
    }
  }

  /* -------------------------------------------- */

  /**
   * Show skill selection dialog
   * @param {string} actionName - Name of the action for dialog title
   * @returns {Promise<boolean|null>} - True for skilled, false for unskilled, null for cancelled
   * @private
   */
  async _showSkillDialog(actionName) {
    return new Promise((resolve) => {
      const dialog = new Dialog({
        title: `${actionName} Roll`,
        content: `
          <div class="skill-dialog">
            <p>Choose skill level for <strong>${actionName}</strong>:</p>
          </div>
        `,
        buttons: {
          skilled: {
            icon: '<i class="fas fa-star"></i>',
            label: "Skilled (5-6 pass)",
            callback: () => resolve(true)
          },
          unskilled: {
            icon: '<i class="fas fa-circle"></i>',
            label: "Unskilled (6 pass)",
            callback: () => resolve(false)
          }
        },
        default: "skilled",
        close: () => resolve(null)
      });
      dialog.render(true);
    });
  }

  /* -------------------------------------------- */

    /**
   * Calculate successes from dice results
   * @param {Array} diceResults - Array of dice result objects
   * @param {boolean} skilled - Whether this is a skilled roll
   * @returns {number} - Number of successes
   * @private
   */
    _calculateSuccesses(diceResults, skilled) {
        if (!diceResults || !Array.isArray(diceResults)) {
            console.warn('Invalid dice results provided to _calculateSuccesses');
            return 0;
        }

        return diceResults.reduce((successes, die) => {
            // Handle different possible die result formats
            const value = die.result || die.value || die;

            if (skilled) {
                return successes + (value >= 5 ? 1 : 0);
            } else {
                return successes + (value === 6 ? 1 : 0);
            }
        }, 0);
    }
}