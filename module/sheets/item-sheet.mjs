/**
 * Extend the basic ItemSheet with some very simple modifications
 * @extends {ItemSheet}
 */
export class ThirteenCommandoItemSheet extends ItemSheet {

  /** @override */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["thirteen-commando", "sheet", "item"],
      width: 600,
      height: 700,
      tabs: [{ navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "description" }]
    });
  }

  /** @override */
  get template() {
    const path = "systems/thirteen-commando/templates/item";
    
    // Return the appropriate template based on item type
    switch (this.item.type) {
      case "weapon":
        return `${path}/weapon-sheet.html`;
      case "equipment":
        return `${path}/item-equipment-sheet.html`;
      case "skill":
        return `${path}/item-skill-sheet.html`;
      case "talent":
        return `${path}/item-talent-sheet.html`;
      default:
        return `${path}/item.html`; // Your basic fallback template
    }
  }

  /** @override */
  getData() {
    // Retrieve base data structure.
    const context = super.getData();

    // Use a safe clone of the item data for further operations.
    const itemData = context.item;

    // Add the item's data to context for easier access
    context.system = itemData.system;
    context.flags = itemData.flags;
    
    // Add item type for conditional rendering
    context.itemType = this.item.type;
    
    // Prepare weapon-specific data
    if (this.item.type === "weapon") {
      context.weaponTypes = {
        "rifle": "Rifle",
        "pistol": "Pistol",
        "submachinegun": "Submachine Gun",
        "machinegun": "Machine Gun",
        "heavyweapon": "Heavy Weapon",
        "melee": "Melee Weapon",
        "explosive": "Explosive"
      };
      
      context.proficiencies = {
        "rifles": "Rifles",
        "pistols": "Pistols", 
        "submachineguns": "Submachine Guns",
        "machineguns": "Machine Guns",
        "heavyweapons": "Heavy Weapons",
        "meleecombat": "Melee Combat",
        "explosiveordinance": "Explosive Ordinance"
      };
    }
    
    // Prepare equipment-specific data
    if (this.item.type === "equipment") {
      context.equipmentTypes = {
        "gear": "Gear",
        "armor": "Armor",
        "consumable": "Consumable",
        "tool": "Tool",
        "communication": "Communication"
      };
      
      context.armorTypes = {
        "light": "Light",
        "medium": "Medium", 
        "heavy": "Heavy"
      };
    }
    
    console.log("Item Sheet Data:", context); // Debug log
    
    // Prepare effects data similar to actor sheet
    context.effects = this._prepareEffectsData();

    return context;
  }

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);

    // Everything below here is only needed if the sheet is editable
    if (!this.isEditable) return;

    // Roll handlers.
    html.find('.rollable').click(this._onRoll.bind(this));
    
    // Handle weapon damage part management
    html.find('.damage-part-control').click(this._onDamagePartControl.bind(this));
    
    // Handle weapon property toggles
    html.find('.property-toggle').change(this._onPropertyToggle.bind(this));
    
    // Handle equipment type changes
    html.find('select[name="system.equipmentType"]').change(this._onEquipmentTypeChange.bind(this));
    
    // Handle effect controls (if effects template is included)
    html.find('.effect-control').click(this._onEffectControl.bind(this));
  }

  /**
   * Prepare effects data for the template
   * @returns {Object} Organized effects by category
   */
  _prepareEffectsData() {
    const effects = {
      temporary: {
        label: "Temporary Effects",
        effects: []
      },
      passive: {
        label: "Passive Effects", 
        effects: []
      },
      inactive: {
        label: "Inactive Effects",
        effects: []
      }
    };

    // Get all effects from the item
    for (let effect of this.item.effects) {
      const effectData = {
        id: effect.id,
        label: effect.label || effect.name,
        icon: effect.icon || "icons/svg/aura.svg",
        disabled: effect.disabled,
        duration: effect.duration,
        changes: effect.changes,
        _getSourceName: effect.sourceName || this.item.name
      };

      // Categorize effects based on duration and status
      if (effect.disabled) {
        effects.inactive.effects.push(effectData);
      } else if (effect.duration && (effect.duration.rounds || effect.duration.seconds || effect.duration.turns)) {
        effects.temporary.effects.push(effectData);
      } else {
        effects.passive.effects.push(effectData);
      }
    }

    return effects;
  }

  /**
   * Handle clickable rolls.
   * @param {Event} event   The originating click event
   * @private
   */
  _onRoll(event) {
    event.preventDefault();
    const element = event.currentTarget;
    const dataset = element.dataset;

    // Handle rolls that supply the formula directly.
    if (dataset.roll) {
      let label = dataset.label ? `Rolling ${dataset.label}` : '';
      let roll = new Roll(dataset.roll, {});
      roll.toMessage({
        speaker: ChatMessage.getSpeaker({ actor: this.actor }),
        flavor: label,
        rollMode: game.settings.get('core', 'rollMode'),
      });
      return roll;
    }
  }

  /**
   * Handle damage part controls for weapons
   */
  async _onDamagePartControl(event) {
    event.preventDefault();
    const button = event.currentTarget;
    const action = button.dataset.action;
    const index = parseInt(button.dataset.index);
    
    const parts = this.item.system.damage?.parts || [];
    
    switch (action) {
      case "add":
        parts.push(["1d6", "ballistic"]);
        break;
      case "delete":
        if (index >= 0 && index < parts.length) {
          parts.splice(index, 1);
        }
        break;
    }
    
    await this.item.update({"system.damage.parts": parts});
  }

  /**
   * Handle weapon property toggles
   */
  async _onPropertyToggle(event) {
    event.preventDefault();
    const checkbox = event.currentTarget;
    const property = checkbox.name.split('.').pop();
    const isChecked = checkbox.checked;
    
    await this.item.update({[`system.properties.${property}`]: isChecked});
  }

  /**
   * Handle equipment type changes
   */
  async _onEquipmentTypeChange(event) {
    event.preventDefault();
    const select = event.currentTarget;
    const newType = select.value;
    
    // Initialize type-specific data when equipment type changes
    const updateData = {"system.equipmentType": newType};
    
    if (newType === "armor" && !this.item.system.armor) {
      updateData["system.armor"] = {
        type: "light",
        value: 10
      };
    }
    
    if (newType === "consumable" && !this.item.system.uses) {
      updateData["system.uses"] = {
        current: 1,
        max: 1
      };
    }
    
    await this.item.update(updateData);
  }

  /**
   * Handle effect controls
   */
  async _onEffectControl(event) {
    event.preventDefault();
    const button = event.currentTarget;
    const action = button.dataset.action;
    const effectId = button.closest('.effect-item')?.dataset.effectId;

    switch (action) {
      case "create":
        const effectData = {
          label: "New Effect",
          icon: "icons/svg/aura.svg"
        };
        await this.item.createEmbeddedDocuments("ActiveEffect", [effectData]);
        break;
      case "edit":
        if (effectId) {
          const effect = this.item.effects.get(effectId);
          if (effect) effect.sheet.render(true);
        }
        break;
      case "toggle":
        if (effectId) {
          const effect = this.item.effects.get(effectId);
          if (effect) await effect.update({disabled: !effect.disabled});
        }
        break;
      case "delete":
        if (effectId) {
          const effect = this.item.effects.get(effectId);
          if (effect) await effect.delete();
        }
        break;
    }
  }
}