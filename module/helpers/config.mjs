export const THIRTEEN_COMMANDO = {};

/**
 * The set of Ability Scores used within the system.
 * @type {Object}
 */
THIRTEEN_COMMANDO.attributes = {
  "physical": {
    "might": "THIRTEEN_COMMANDO.AttributeMight",
    "coordination": "THIRTEEN_COMMANDO.AttributeCoordination", 
    "endurance": "THIRTEEN_COMMANDO.AttributeEndurance"
  },
  "mental": {
    "intellect": "THIRTEEN_COMMANDO.AttributeIntellect",
    "guile": "THIRTEEN_COMMANDO.AttributeGuile",
    "guts": "THIRTEEN_COMMANDO.AttributeGuts"
  },
  "social": {
    "bearing": "THIRTEEN_COMMANDO.AttributeBearing",
    "charm": "THIRTEEN_COMMANDO.AttributeCharm",
    "composure": "THIRTEEN_COMMANDO.AttributeComposure"
  }
};

THIRTEEN_COMMANDO.attributeCategories = {
  "physical": "THIRTEEN_COMMANDO.Physical",
  "mental": "THIRTEEN_COMMANDO.Mental", 
  "social": "THIRTEEN_COMMANDO.Social"
};

THIRTEEN_COMMANDO.attributeAspects = {
  "force": "THIRTEEN_COMMANDO.Force",
  "finesse": "THIRTEEN_COMMANDO.Finesse",
  "resilience": "THIRTEEN_COMMANDO.Resilience"
};

/**
 * Breeding point allocations
 * @type {Object}
 */
THIRTEEN_COMMANDO.breeding = {
  "fivepoints": "THIRTEEN_COMMANDO.FivePoints",
  "threepoints": "THIRTEEN_COMMANDO.ThreePoints",
  "twopoints": "THIRTEEN_COMMANDO.TwoPoints"
};

/**
 * Character mindsets
 * @type {Object}
 */
THIRTEEN_COMMANDO.mindsets = {
  "force": "THIRTEEN_COMMANDO.MindsetForce",
  "finesse": "THIRTEEN_COMMANDO.MindsetFinesse", 
  "resilience": "THIRTEEN_COMMANDO.MindsetResilience"
};

/**
 * Skill categories
 * @type {Object}
 */
THIRTEEN_COMMANDO.skillCategories = {
  "combat": "THIRTEEN_COMMANDO.CombatSkills",
  "general": "THIRTEEN_COMMANDO.GeneralSkills",
  "custom": "THIRTEEN_COMMANDO.CustomSkills"
};

/**
 * Skill point sources
 * @type {Object}
 */
THIRTEEN_COMMANDO.skillSources = {
  "breeding": "THIRTEEN_COMMANDO.Breeding",
  "commando": "THIRTEEN_COMMANDO.Commando",
  "primary": "THIRTEEN_COMMANDO.Primary",
  "secondary": "THIRTEEN_COMMANDO.Secondary", 
  "tertiary": "THIRTEEN_COMMANDO.Tertiary"
};

/**
 * Combat skills
 * @type {Object}
 */
THIRTEEN_COMMANDO.combatSkills = {
  "heavyweapons": "THIRTEEN_COMMANDO.HeavyWeapons",
  "explosiveordinance": "THIRTEEN_COMMANDO.ExplosiveOrdinance",
  "grenadethrowing": "THIRTEEN_COMMANDO.GrenadeThrowing",
  "machinegunner": "THIRTEEN_COMMANDO.MachineGunner",
  "meleecombat": "THIRTEEN_COMMANDO.MeleeCombat",
  "pistols": "THIRTEEN_COMMANDO.Pistols",
  "rifles": "THIRTEEN_COMMANDO.Rifles",
  "submachineguns": "THIRTEEN_COMMANDO.SubmachineGuns",
  "unarmedcombat": "THIRTEEN_COMMANDO.UnarmedCombat"
};

/**
 * General skills
 * @type {Object}
 */
THIRTEEN_COMMANDO.generalSkills = {
  "athletics": "THIRTEEN_COMMANDO.Athletics",
  "climb": "THIRTEEN_COMMANDO.Climb",
  "concealmentcamouflage": "THIRTEEN_COMMANDO.ConcealmentCamouflage",
  "cryptography": "THIRTEEN_COMMANDO.Cryptography",
  "endurance": "THIRTEEN_COMMANDO.Endurance",
  "firstaid": "THIRTEEN_COMMANDO.FirstAid",
  "linguistics": "THIRTEEN_COMMANDO.Linguistics",
  "navigation": "THIRTEEN_COMMANDO.Navigation",
  "parachuting": "THIRTEEN_COMMANDO.Parachuting",
  "radiooperations": "THIRTEEN_COMMANDO.RadioOperations",
  "stalking": "THIRTEEN_COMMANDO.Stalking",
  "survival": "THIRTEEN_COMMANDO.Survival",
  "swimming": "THIRTEEN_COMMANDO.Swimming"
};

/**
 * Weapon types
 * @type {Object}
 */
THIRTEEN_COMMANDO.weaponTypes = {
  "rifle": "THIRTEEN_COMMANDO.Rifle",
  "pistol": "THIRTEEN_COMMANDO.Pistol",
  "submachinegun": "THIRTEEN_COMMANDO.SubmachineGun",
  "machinegun": "THIRTEEN_COMMANDO.MachineGun",
  "heavyweapon": "THIRTEEN_COMMANDO.HeavyWeapon",
  "melee": "THIRTEEN_COMMANDO.MeleeWeapon",
  "grenade": "THIRTEEN_COMMANDO.Grenade",
  "explosive": "THIRTEEN_COMMANDO.Explosive"
};

/**
 * Equipment types
 * @type {Object}
 */
THIRTEEN_COMMANDO.equipmentTypes = {
  "gear": "THIRTEEN_COMMANDO.Gear",
  "armor": "THIRTEEN_COMMANDO.Armor",
  "consumable": "THIRTEEN_COMMANDO.Consumable",
  "tool": "THIRTEEN_COMMANDO.Tool",
  "communication": "THIRTEEN_COMMANDO.Communication"
};

/**
 * Actor types
 * @type {Object}
 */
THIRTEEN_COMMANDO.actorTypes = {
  "character": "THIRTEEN_COMMANDO.Character",
  "npc": "THIRTEEN_COMMANDO.NPC"
};

/**
 * Item types
 * @type {Object}
 */
THIRTEEN_COMMANDO.itemTypes = {
  "weapon": "THIRTEEN_COMMANDO.Weapon",
  "equipment": "THIRTEEN_COMMANDO.Equipment", 
  "skill": "THIRTEEN_COMMANDO.Skill",
  "talent": "THIRTEEN_COMMANDO.Talent"
};