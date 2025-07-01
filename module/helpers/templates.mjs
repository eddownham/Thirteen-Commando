/**
 * Define a set of template paths to pre-load
 * Pre-loaded templates are compiled and cached for fast access when rendering
 * @return {Promise}
 */
export const preloadHandlebarsTemplates = async function() {
  return loadTemplates([

    // Actor partials - All integrated parts templates
    "systems/thirteen-commando/templates/actor/parts/actor-attributes.html",
    // REMOVED: "actor-skills.html" - Testing template (not used)
    "systems/thirteen-commando/templates/actor/parts/actor-combat-skills.html",
    "systems/thirteen-commando/templates/actor/parts/actor-general-skills.html",
    "systems/thirteen-commando/templates/actor/parts/actor-custom-skills.html",
    "systems/thirteen-commando/templates/actor/parts/actor-equipment.html",
    // REMOVED: "actor-weapons.html" - Unused template (replaced by equipment tabs)
    "systems/thirteen-commando/templates/actor/parts/actor-biography.html",
    "systems/thirteen-commando/templates/actor/parts/actor-breeding.html",
    "systems/thirteen-commando/templates/actor/parts/actor-mindset.html",
    "systems/thirteen-commando/templates/actor/parts/actor-fields.html",
    "systems/thirteen-commando/templates/actor/parts/actor-effects.html",

    // Item partials
    "systems/thirteen-commando/templates/item/parts/item-effects.html",
    // REMOVED: "weapon-properties.html" - Template does not exist
    // REMOVED: "weapon-damage.html" - Template does not exist
    "systems/thirteen-commando/templates/item/parts/equipment-details.html",

    // Application templates
  /*  "systems/thirteen-commando/templates/apps/weapon-attack-dialog.html",*/
  ]);
};