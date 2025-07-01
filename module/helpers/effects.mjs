/**
 * Manage Active Effect instances through the Actor Sheet via effect control buttons.
 * @param {MouseEvent} event      The originating click event
 * @param {Actor} owner           The owning actor of this effect
 */
export async function onManageActiveEffect(event, owner) {
  event.preventDefault();
  const a = event.currentTarget;
  const li = a.closest("li");
  const effect = li.dataset.effectId ? owner.effects.get(li.dataset.effectId) : null;
  
  switch (a.dataset.action) {
    case "create":
      return owner.createEmbeddedDocuments("ActiveEffect", [{
        label: "New Effect",
        icon: "icons/svg/aura.svg",
        origin: owner.uuid,
        "duration.rounds": li.dataset.effectType === "temporary" ? 1 : undefined,
        disabled: li.dataset.effectType === "inactive"
      }]);
    case "edit":
      return effect.sheet.render(true);
    case "delete":
      return effect.delete();
    case "toggle":
      return effect.update({disabled: !effect.disabled});
  }
}

/**
 * Prepare the data structure for Active Effects which are currently applied to an Actor or Item.
 * @param {ActiveEffect[]} effects    The array of Active Effect instances to prepare sheet data for
 * @return {object}                   Data for rendering
 */
export function prepareActiveEffectCategories(effects) {
  // Define effect header categories
  const categories = {
    temporary: {
      type: "temporary",
      label: "Temporary Effects",
      effects: []
    },
    passive: {
      type: "passive", 
      label: "Passive Effects",
      effects: []
    },
    inactive: {
      type: "inactive",
      label: "Inactive Effects", 
      effects: []
    }
  };

  // Iterate over active effects, classifying them into categories
  for (let e of effects) {
    e._getSourceName = () => {
      const source = e.origin;
      if (!source) return "Unknown";
      
      // Try to get the source document
      try {
        const sourceDoc = fromUuidSync(source);
        return sourceDoc?.name || "Unknown Source";
      } catch (err) {
        return "Unknown Source";
      }
    };
    
    if (e.disabled) {
      categories.inactive.effects.push(e);
    }
    else if (e.isTemporary) {
      categories.temporary.effects.push(e);
    }
    else {
      categories.passive.effects.push(e);
    }
  }
  
  return categories;
}

/**
 * Create a new Active Effect for an Actor or Item
 * @param {Actor|Item} owner        The owning document
 * @param {object} effectData       Initial effect data
 * @returns {ActiveEffect}          The created effect
 */
export async function createActiveEffect(owner, effectData = {}) {
  const defaultData = {
    label: "New Effect",
    icon: "icons/svg/aura.svg",
    origin: owner.uuid,
    disabled: false,
    changes: [],
    duration: {
      rounds: undefined,
      seconds: undefined,
      startTime: undefined,
      startRound: undefined,
      startTurn: undefined
    },
    flags: {}
  };

  const data = foundry.utils.mergeObject(defaultData, effectData);
  return owner.createEmbeddedDocuments("ActiveEffect", [data]);
}

/**
 * Get all valid effect change keys for the system
 * @returns {object} Object containing categorized effect keys
 */
export function getEffectChangeKeys() {
  return {
    attributes: {
      "system.attributes.physical.might.value": "Might",
      "system.attributes.physical.coordination.value": "Coordination", 
      "system.attributes.physical.endurance.value": "Endurance",
      "system.attributes.mental.intelligence.value": "Intelligence",
      "system.attributes.mental.guile.value": "Guile",
      "system.attributes.mental.guts.value": "Guts",
      "system.attributes.social.bearing.value": "Bearing",
      "system.attributes.social.charm.value": "Charm",
      "system.attributes.social.composure.value": "Composure"
    },
    derived: {
      "system.totals.physical": "Physical Total",
      "system.totals.mental": "Mental Total", 
      "system.totals.social": "Social Total"
    },
    skills: {
      // Skill effects would be added here as the skill system develops
    }
  };
}

/**
 * Apply active effects to actor data
 * @param {Actor} actor The actor to apply effects to
 */
export function applyActiveEffects(actor) {
  // This would contain logic to apply active effects to actor calculations
  // For now, we'll leave this as a placeholder since effects are applied
  // automatically by Foundry's active effect system
  
  console.log(`Applying active effects to ${actor.name}`);
}

/**
 * Handle effect transfer from items to actors
 * @param {Item} item The item with effects
 * @param {Actor} actor The target actor
 */
export async function transferEffects(item, actor) {
  const effects = item.effects.filter(e => e.transfer);
  
  if (effects.length === 0) return;
  
  const effectData = effects.map(e => {
    const data = e.toObject();
    data.origin = item.uuid;
    return data;
  });
  
  return actor.createEmbeddedDocuments("ActiveEffect", effectData);
}

/**
 * Remove transferred effects when an item is removed
 * @param {Item} item The item being removed
 * @param {Actor} actor The actor to remove effects from
 */
export async function removeTransferredEffects(item, actor) {
  const effectsToRemove = actor.effects.filter(e => e.origin === item.uuid);
  const effectIds = effectsToRemove.map(e => e.id);
  
  if (effectIds.length > 0) {
    return actor.deleteEmbeddedDocuments("ActiveEffect", effectIds);
  }
}