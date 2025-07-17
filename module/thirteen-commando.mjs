/**
 * The Thirteen Commando game system for Foundry Virtual Tabletop
 * A tactical military RPG system featuring specialized commando operations
 * Author: Thirteen Commando Development Team
 * Software License: MIT
 */

// Import document classes.
import { ThirteenCommandoActor } from "./documents/actor.mjs";
import { ThirteenCommandoItem } from "./documents/item.mjs";
// Import sheet classes.
import { ThirteenCommandoActorSheet } from "./sheets/actor-sheet.mjs";
import { ThirteenCommandoMinionSheet } from "./sheets/minion-sheet.mjs";
import { ThirteenCommandoItemSheet } from "./sheets/item-sheet.mjs";
// Import helper/utility classes and constants.
import { preloadHandlebarsTemplates } from "./helpers/templates.mjs";
import { THIRTEEN_COMMANDO } from "./helpers/config.mjs";
// Import applications
import { EffectTemplateManager } from "./apps/effect-template-manager.mjs";
import { EffectEditorDialog } from "./apps/effect-editor-dialog.mjs";
import { WeaponAttackDialog } from './apps/weapon-attack-dialog.mjs';


/* -------------------------------------------- */
/*  Init Hook                                   */
/* -------------------------------------------- */

Hooks.once('init', async function() {

  // Register effect templates setting FIRST
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

    // In thirteen-commando.mjs - Add system setting
    game.settings.register('thirteen-commando', 'characterSheetScale', {
        name: 'Character Sheet Scale',
        hint: 'Scale character sheets for different monitor sizes (50% - 200%)',
        scope: 'client',
        config: true,
        type: Number,
        range: {
            min: 50,
            max: 200,
            step: 25
        },
        default: 100,
        onChange: () => {
            // Update all open character sheets
            Object.values(ui.windows).forEach(window => {
                if (window instanceof ThirteenCommandoActorSheet) {
                    window.render();
                }
            });
        }
    });

  // Register live movement cost settings
  game.settings.register('thirteen-commando', 'showMovementCosts', {
    name: 'Show Live Movement Costs',
    hint: 'Display real-time exertion costs in the ruler tool when measuring movement',
    scope: 'client',
    config: true,
    type: Boolean,
    default: true,
    onChange: (value) => {
      console.log(`Movement cost display ${value ? 'enabled' : 'disabled'}`);
    }
  });

  game.settings.register('thirteen-commando', 'showMovementOverlay', {
    name: 'Show Movement Range Overlay',
    hint: 'Display color-coded grid squares showing movement affordability when dragging tokens',
    scope: 'client', 
    config: true,
    type: Boolean,
    default: true,
    onChange: (value) => {
      console.log(`Movement range overlay ${value ? 'enabled' : 'disabled'}`);
      // Hide any active overlays if disabled
      if (!value) {
        for (const overlay of window.movementOverlays.values()) {
          overlay.hide();
        }
      }
    }
  });

  game.settings.register('thirteen-commando', 'overlayAnimations', {
    name: 'Animate Movement Overlay',
    hint: 'Use smooth fade-in/out animations for the movement range overlay',
    scope: 'client',
    config: true, 
    type: Boolean,
    default: true
  });

  // Register Template Manager in Game Settings Menu
  game.settings.registerMenu('thirteen-commando', 'effectTemplateManager', {
    name: 'Effect Template Manager',
    label: 'Manage Effect Templates',
    hint: 'Create, edit, and organize effect templates for the Thirteen Commando system',
    icon: 'fas fa-magic',
    type: EffectTemplateManager,
    restricted: true  // GM only
  });

    Hooks.on('combatTurn', async (combat, updateData, options) => {
        const actor = combat.combatant?.actor;
        if (actor?.resetMoraleTurnFlags) {
            await actor.resetMoraleTurnFlags();
        }
    });
  // Add utility classes to the global game object so that they're more easily
  // accessible in global contexts.
    game.thirteenCommando = {
        ThirteenCommandoActor,
        ThirteenCommandoItem,
        EffectTemplateManager,
        ThirteenCommandoMinionSheet,
        EffectEditorDialog,
        WeaponAttackDialog,
        rollItemMacro
    };

  // Add custom constants for configuration.
  CONFIG.THIRTEEN_COMMANDO = THIRTEEN_COMMANDO;

  /**
   * Set an initiative formula for the system
   * @type {String}
   */
  CONFIG.Combat.initiative = {
    formula: "1d10 + @attributes.mental.guile.value + @attributes.physical.coordination.value",
    decimals: 2
  };

  // Define custom Document classes
  CONFIG.Actor.documentClass = ThirteenCommandoActor;
  CONFIG.Item.documentClass = ThirteenCommandoItem;

  // Register sheet application classes
  Actors.unregisterSheet("core", ActorSheet);
    Actors.registerSheet("thirteencommando", ThirteenCommandoActorSheet, { makeDefault: true });
    Actors.registerSheet("thirteen-commando", ThirteenCommandoMinionSheet, { types: ["minion"], makeDefault: true });
  Items.unregisterSheet("core", ItemSheet);
  Items.registerSheet("thirteencommando", ThirteenCommandoItemSheet, { makeDefault: true });

  // Preload Handlebars templates.
  return preloadHandlebarsTemplates();
});

/* -------------------------------------------- */
/*  Handlebars Helpers                          */
/* -------------------------------------------- */

Handlebars.registerHelper('toLowerCase', function(str) {
  return str ? str.toLowerCase() : '';
});

Handlebars.registerHelper('eq', function(a, b) {
  return a === b;
});

Handlebars.registerHelper('ne', function(a, b) {
  return a !== b;
});

Handlebars.registerHelper('gt', function(a, b) {
  return a > b;
});

Handlebars.registerHelper('lt', function(a, b) {
  return a < b;
});

Handlebars.registerHelper('lte', function(a, b) {
  return a <= b;
});

Handlebars.registerHelper('gte', function(a, b) {
  return a >= b;
});

Handlebars.registerHelper('checked', function(value) {
  return value ? 'checked' : '';
});

Handlebars.registerHelper('selected', function(value) {
  return value ? 'selected' : '';
});

// Math helpers
Handlebars.registerHelper('sum', function(...args) {
  // Remove the last argument which is the Handlebars options object
  const values = args.slice(0, -1);
  return values.reduce((total, val) => {
    const num = Number(val);
    return total + (isNaN(num) ? 0 : num);
  }, 0);
});

Handlebars.registerHelper('add', function(a, b) {
  return (Number(a) || 0) + (Number(b) || 0);
});

Handlebars.registerHelper('multiply', function(factor1, factor2) {
  // Convert to numbers and handle edge cases
  const num1 = Number(factor1) || 0;
  const num2 = Number(factor2) || 0;
  // Perform multiplication and round to 2 decimal places
  const result = num1 * num2;
  return Math.round(result * 100) / 100;
});

Handlebars.registerHelper('divide', function (dividend, divisor, rounding) {
    const num1 = Number(dividend) || 0;
    const num2 = Number(divisor) || 1;

    // Avoid division by zero
    if (num2 === 0) {
        return 0;
    }

    // Perform division
    const result = num1 / num2;

    // Handle optional rounding parameter
    if (rounding === 'U') {
        // Round up (ceiling)
        return Math.ceil(result);
    } else if (rounding === 'D') {
        // Round down (floor)
        return Math.floor(result);
    } else {
        // Default behavior: round to 2 decimal places (backward compatible)
        return Math.round(result * 100) / 100;
    }
});

Handlebars.registerHelper('average', function(...values) {
  // Remove the last argument which is Handlebars options object
  const numbers = values.slice(0, -1).map(v => Number(v) || 0);
  if (numbers.length === 0) {
    return 0;
  }
  const sum = numbers.reduce((acc, val) => acc + val, 0);
  const average = sum / numbers.length;
  return Math.round(average * 100) / 100;
});

Handlebars.registerHelper('percentage', function(current, max) {
  const num1 = Number(current) || 0;
  const num2 = Number(max) || 1;
  if (num2 === 0) {
    return 0;
  }
  const percentage = (num1 / num2) * 100;
  return Math.round(percentage);
});

Handlebars.registerHelper('default', function(value, defaultValue) {
  return (value !== undefined && value !== null && value !== '') ? value : defaultValue;
});

Handlebars.registerHelper('safeNumber', function(value) {
  const num = Number(value);
  return isNaN(num) ? 0 : num;
});

// Conditional helpers
Handlebars.registerHelper('and', function(...args) {
  // Remove the last argument which is the Handlebars options object
  const values = args.slice(0, -1);
  return values.every(val => !!val);
});

Handlebars.registerHelper('or', function(...args) {
  // Remove the last argument which is the Handlebars options object
  const values = args.slice(0, -1);
  return values.some(val => !!val);
});

// Text helpers
Handlebars.registerHelper('capitalize', function(str) {
  if (!str || typeof str !== 'string') return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
});

Handlebars.registerHelper('localize', function(key) {
  return game.i18n.localize(key) || key;
});

Handlebars.registerHelper('lowercase', function(str) {
  if (typeof str !== 'string') return '';
  return str.toLowerCase();
});

// Debug helper
Handlebars.registerHelper('log', function(value) {
  console.log("Handlebars Debug:", value);
  return '';
});

// If you need to add Handlebars helpers, here are a few useful examples:
Handlebars.registerHelper('concat', function() {
  var outStr = '';
  for (var arg in arguments) {
    if (typeof arguments[arg] != 'object') {
      outStr += arguments[arg];
    }
  }
  return outStr;
});

// Skill helpers
Handlebars.registerHelper('getSkillTotal', function(actor, skillKey) {
  if (!actor || !skillKey) return 0;
  
  const parts = skillKey.split('.');
  if (parts.length !== 2) return 0;
  
  const [category, skill] = parts;
  const skillData = actor.system.skills?.[category]?.[skill];
  
  if (!skillData) return 0;
  
  return (skillData.breeding || 0) + 
         (skillData.commando || 0) + 
         (skillData.primary || 0) + 
         (skillData.secondary || 0) + 
         (skillData.tertiary || 0);
});

Handlebars.registerHelper('getSkillDisplayName', function(skillKey) {
  if (!skillKey) return '';
  
  const parts = skillKey.split('.');
  if (parts.length !== 2) return skillKey;
  
  const [category, skill] = parts;
  
  // Convert camelCase to display format
  return skill.replace(/([A-Z])/g, ' $1')
             .replace(/^./, str => str.toUpperCase())
             .trim();
});

Handlebars.registerHelper('skillKeyToIcon', function(skillKey) {
  const iconMap = {
    // Combat skills
    'combat.rifles': 'fas fa-crosshairs',
    'combat.pistols': 'fas fa-bullseye', 
    'combat.submachineguns': 'fas fa-spray-can',
    'combat.shotguns': 'fas fa-bomb',
    'combat.lightmachineguns': 'fas fa-retweet',
    'combat.sniperrifles': 'fas fa-eye',
    'combat.heavyweapons': 'fas fa-rocket',
    'combat.meleeweapons': 'fas fa-sword',
    'combat.throwing': 'fas fa-baseball-ball',
    
    // General skills
    'general.athletics': 'fas fa-running',
    'general.firstaid': 'fas fa-medkit',
    'general.stealth': 'fas fa-mask',
    'general.technology': 'fas fa-laptop',
    'general.driving': 'fas fa-car',
    'general.piloting': 'fas fa-plane',
    'general.electronics': 'fas fa-microchip',
    'general.demolitions': 'fas fa-bomb',
    'general.survival': 'fas fa-campground',
    'general.investigation': 'fas fa-search',
    'general.social': 'fas fa-comments',
    'general.leadership': 'fas fa-crown',
    'general.tactics': 'fas fa-chess'
  };
  
  return iconMap[skillKey] || 'fas fa-star';
});

/* -------------------------------------------- */
/*  Ready Hook                                  */
/* -------------------------------------------- */

Hooks.once("ready", async function() {
  // Wait to register hotbar drop hook on ready so that modules could register earlier if they want to
  Hooks.on("hotbarDrop", (bar, data, slot) => createItemMacro(data, slot));
  
  // Register stance effect templates
  await registerStanceTemplates();
  
  // Initialize ruler integration for live movement costs
  initializeRulerIntegration();
  
  // Initialize grid overlay system for visual movement ranges
  initializeGridOverlay();
  
  console.log('Thirteen Commando | Effect Templates system ready - accessible via Game Settings');
  console.log("Thirteen Commando | System ready");
});

/* -------------------------------------------- */
/*  PHASE 1: RULER INTEGRATION                 */
/*  Live Movement Cost Calculation             */
/* -------------------------------------------- */

/**
 * Calculate movement cost for a given distance
 * @param {Actor} actor - The actor moving
 * @param {number} distance - Distance in scene units
 * @returns {number} - Exertion cost
 */
function calculateMovementCost(actor, distance) {
  if (!actor || actor.type !== 'character') return 0;
  
  // Convert scene units to grid squares, then to yards (1 yard per grid square)
  const gridSquares = distance / canvas.scene.grid.distance;
  const yards = Math.ceil(gridSquares); // 1 yard per grid square, round up
  
  // Get stance multiplier from actor
  const stanceMultiplier = actor.system.exertion.movementMultiplier || 1.0;
  
  // Calculate total cost
  return Math.ceil(yards * stanceMultiplier);
}

/**
 * Initialize ruler integration for live cost display
 */
function initializeRulerIntegration() {
  // Override ruler label method to add exertion costs
  const originalGetSegmentLabel = Ruler.prototype._getSegmentLabel;
  
  Ruler.prototype._getSegmentLabel = function(segment, totalDistance) {
    // Get the original label (distance)
    let label = originalGetSegmentLabel.call(this, segment, totalDistance);
    
    // Check if movement cost display is enabled
    if (!game.settings.get('thirteen-commando', 'showMovementCosts')) {
      return label.replace(/\bft\b/g, 'yd'); // Still convert ft to yd
    }
    
    // Only add exertion cost for character tokens
    if (this.token?.actor?.type === 'character') {
      const actor = this.token.actor;
      const cost = calculateMovementCost(actor, totalDistance);
      const currentExertion = actor.system.exertion.value;
      const affordable = cost <= currentExertion;
      
      // Convert distance to yards for display (1 yard per grid square)
      const gridSquares = totalDistance / canvas.scene.grid.distance;
      const yards = Math.ceil(gridSquares);
      
      // Create cost text with color coding
      const costText = affordable ? 
        `(${cost} exertion)` : 
        `(${cost} exertion - INSUFFICIENT)`;
      
      // Replace "ft" with "yd" in the original label and add cost
      label = label.replace(/\bft\b/g, 'yd');
      label += ` ${costText}`;
    }
    
    return label;
  };
  
  console.log('Thirteen Commando: Ruler integration initialized - live movement costs enabled');
}

/* -------------------------------------------- */
/*  PHASE 2: GRID OVERLAY SYSTEM               */
/*  Visual Movement Range Display              */
/* -------------------------------------------- */

/**
 * Movement Range Overlay Class
 * Displays color-coded grid squares showing movement affordability
 */
class MovementRangeOverlay {
  constructor(token) {
    this.token = token;
    this.actor = token.actor;
    this.graphics = null;
    this.isActive = false;
    this.isAnimating = false;
    
    // Only create for character tokens with exertion system
    if (this.actor?.type === 'character' && this.actor.system.exertion) {
      this.graphics = new PIXI.Graphics();
      this.graphics.alpha = 0; // Start transparent for fade-in
      canvas.interface.addChild(this.graphics);
    }
  }
  
  /**
   * Calculate movement ranges based on current exertion
   */
  calculateRanges() {
    if (!this.actor) return { affordable: 0, partial: 0 };
    
    const currentExertion = this.actor.system.exertion.value;
    const stanceMultiplier = this.actor.system.exertion.movementMultiplier || 1.0;
    const costPerSquare = stanceMultiplier; // 1 yard = 1 base exertion * multiplier
    
    return {
      affordable: Math.floor(currentExertion / costPerSquare), // Full squares affordable
      partial: Math.ceil(currentExertion / costPerSquare)      // Including partial square
    };
  }
  
  /**
   * Show the movement range overlay with animation
   */
  async show() {
    // Check if overlay is enabled in settings
    if (!game.settings.get('thirteen-commando', 'showMovementOverlay')) {
      return;
    }
    
    if (!this.graphics || this.isActive) return;
    
    this.isActive = true;
    this.render();
    
    // Animate fade-in if animations are enabled
    if (game.settings.get('thirteen-commando', 'overlayAnimations')) {
      await this.fadeIn();
    } else {
      this.graphics.alpha = 1;
    }
  }
  
  /**
   * Hide the movement range overlay with animation
   */
  async hide() {
    if (!this.graphics || !this.isActive) return;
    
    // Animate fade-out if animations are enabled
    if (game.settings.get('thirteen-commando', 'overlayAnimations')) {
      await this.fadeOut();
    } else {
      this.graphics.alpha = 0;
    }
    
    this.isActive = false;
    this.graphics.clear();
  }
  
  /**
   * Fade-in animation
   */
  async fadeIn() {
    if (this.isAnimating) return;
    this.isAnimating = true;
    
    const duration = 200; // 200ms fade-in
    const startTime = Date.now();
    
    return new Promise((resolve) => {
      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Smooth easing function
        const easedProgress = 1 - Math.pow(1 - progress, 3);
        this.graphics.alpha = easedProgress;
        
        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          this.isAnimating = false;
          resolve();
        }
      };
      animate();
    });
  }
  
  /**
   * Fade-out animation
   */
  async fadeOut() {
    if (this.isAnimating) return;
    this.isAnimating = true;
    
    const duration = 150; // 150ms fade-out (slightly faster)
    const startTime = Date.now();
    const startAlpha = this.graphics.alpha;
    
    return new Promise((resolve) => {
      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Smooth easing function
        const easedProgress = Math.pow(progress, 2);
        this.graphics.alpha = startAlpha * (1 - easedProgress);
        
        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          this.isAnimating = false;
          resolve();
        }
      };
      animate();
    });
  }
  
  /**
   * Render the grid overlay
   */
  render() {
    if (!this.graphics) return;
    
    this.graphics.clear();
    
    const ranges = this.calculateRanges();
    const gridSize = canvas.grid.size;
    const tokenCenter = this.token.center;
    
    // Calculate which grid squares to analyze (limit for performance)
    const maxRange = Math.max(ranges.partial + 2, 10); // At least 10 squares radius
    const startX = Math.floor((tokenCenter.x - maxRange * gridSize) / gridSize);
    const endX = Math.ceil((tokenCenter.x + maxRange * gridSize) / gridSize);
    const startY = Math.floor((tokenCenter.y - maxRange * gridSize) / gridSize);
    const endY = Math.ceil((tokenCenter.y + maxRange * gridSize) / gridSize);
    
    // Analyze each grid square
    for (let gridX = startX; gridX <= endX; gridX++) {
      for (let gridY = startY; gridY <= endY; gridY++) {
        const squareCenter = {
          x: gridX * gridSize + gridSize / 2,
          y: gridY * gridSize + gridSize / 2
        };
        
        // Calculate distance from token to this square
        const distance = canvas.grid.measurePath([tokenCenter, squareCenter]).distance;
        const gridSquares = distance / canvas.scene.grid.distance;
        const roundedSquares = Math.ceil(gridSquares);
        
        // Skip the square the token is currently in
        if (roundedSquares === 0) continue;
        
        // Determine color based on affordability
        let color;
        let alpha = 0.3;
        
        if (roundedSquares <= ranges.affordable) {
          color = 0x00FF00; // Green - affordable
        } else if (roundedSquares <= ranges.partial) {
          color = 0xFFFF00; // Yellow - partial exertion
          alpha = 0.2;
        } else if (roundedSquares <= ranges.partial + 2) {
          color = 0xFF0000; // Red - too expensive
          alpha = 0.15;
        } else {
          continue; // Don't show squares too far away
        }
        
        // Draw the square
        this.graphics.beginFill(color, alpha);
        this.graphics.drawRect(
          gridX * gridSize,
          gridY * gridSize,
          gridSize,
          gridSize
        );
        this.graphics.endFill();
      }
    }
  }
  
  /**
   * Update the overlay (called when exertion or stance changes)
   */
  update() {
    if (this.isActive) {
      this.render();
    }
  }
  
  /**
   * Cleanup when done
   */
  async destroy() {
    if (this.graphics) {
      await this.hide();
      this.graphics.destroy();
      this.graphics = null;
    }
    this.isActive = false;
  }
}

// Global storage for active overlays
window.movementOverlays = new Map();

// Track Alt key state for temporary disable
window.altKeyPressed = false;

/**
 * Initialize grid overlay system
 */
function initializeGridOverlay() {
  // Keyboard event handlers for Alt key detection
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Alt' || event.altKey) {
      window.altKeyPressed = true;
      
      // Hide all active overlays when Alt is pressed
      for (const overlay of window.movementOverlays.values()) {
        if (overlay.isActive) {
          overlay.hide();
        }
      }
    }
  });
  
  document.addEventListener('keyup', (event) => {
    if (event.key === 'Alt' || !event.altKey) {
      window.altKeyPressed = false;
      
      // Show overlays again when Alt is released
      for (const overlay of window.movementOverlays.values()) {
        if (!overlay.isActive) {
          overlay.show();
        }
      }
    }
  });
  
  // Hook into token drag start
  const originalOnDragStart = Token.prototype._onDragStart;
  Token.prototype._onDragStart = function(event) {
    const result = originalOnDragStart.call(this, event);
    
    // Show movement overlay for character tokens (unless Alt is held)
    if (this.actor?.type === 'character' && 
        this.actor.system.exertion && 
        !window.altKeyPressed) {
      const overlay = new MovementRangeOverlay(this);
      window.movementOverlays.set(this.id, overlay);
      overlay.show();
    }
    
    return result;
  };
  
  // Hook into token drag end
  const originalOnDragEnd = Token.prototype._onDragEnd;
  Token.prototype._onDragEnd = async function(event) {
    const result = originalOnDragEnd.call(this, event);
    
    // Hide movement overlay
    const overlay = window.movementOverlays.get(this.id);
    if (overlay) {
      await overlay.destroy();
      window.movementOverlays.delete(this.id);
    }
    
    return result;
  };
  
  // Update overlays when exertion changes
  Hooks.on('updateActor', (actor, changes) => {
    if (changes.system?.exertion) {
      // Find any active overlays for this actor's tokens
      for (const [tokenId, overlay] of window.movementOverlays.entries()) {
        if (overlay.actor.id === actor.id) {
          overlay.update();
        }
      }
    }
  });
  
  // Performance monitoring hook
  let lastPerformanceCheck = Date.now();
  const performanceInterval = 5000; // Check every 5 seconds
  
  Hooks.on('canvasReady', () => {
    // Clear any orphaned overlays on scene change
    for (const overlay of window.movementOverlays.values()) {
      overlay.destroy();
    }
    window.movementOverlays.clear();
    
    // Reset performance timer
    lastPerformanceCheck = Date.now();
  });
  
  console.log('Thirteen Commando: Grid overlay system initialized - visual movement ranges enabled');
  console.log('• Alt key: Temporarily disable overlays while held');
  console.log('• Settings: Configure in Game Settings > Thirteen Commando');
}

/**
 * Hook: preUpdateToken
 * Validates movement and calculates exertion cost before token update
 */
Hooks.on('preUpdateToken', async (document, change, options, userId) => {
  // Only process for Thirteen Commando actors
  if (!document.actor || document.actor.type !== 'character') return;
  
  // Only process movement updates (x or y coordinate changes)
  if (!change.x && !change.y) return;
  
  // Only process for the user who initiated the movement
  if (userId !== game.user.id) return;
  
  // Calculate movement distance
  const currentX = document.x;
  const currentY = document.y;
  const newX = change.x ?? currentX;
  const newY = change.y ?? currentY;
  
  // Skip if no actual movement
  if (currentX === newX && currentY === newY) return;
  
  // Calculate distance in grid units using the new v12 API
  const pathDistance = canvas.grid.measurePath([
    { x: currentX, y: currentY },
    { x: newX, y: newY }
  ]).distance;
  
  // Convert scene units to grid squares, then to meters (1 grid square = 1 meter)
  const gridSquares = pathDistance / canvas.scene.grid.distance;
  const meters = Math.ceil(gridSquares); // Round up to whole meters
  
  if (meters <= 0) return;
  
  // Get stance multiplier
    const stanceMultiplier = document.actor.system.exertion.movementMultiplier || 1.0;
  
  // Calculate total exertion cost
  const exertionCost = meters * stanceMultiplier;
  
  // Check if actor has enough exertion
  const currentExertion = document.actor.system.exertion.value;
  
  if (currentExertion < exertionCost) {
    // Prevent movement - insufficient exertion
    ui.notifications.warn(
      `Insufficient exertion! Movement requires ${exertionCost} exertion ` +
      `(${meters}m × ${stanceMultiplier}x stance), but only ${currentExertion} available.`
    );
    
    // Block the update by returning false
    return false;
  }
  
  // Store movement data for the updateToken hook
  options.thirteenCommando = {
    movementCost: exertionCost,
    distance: meters,
    stanceMultiplier: stanceMultiplier
  };
  
  console.log(`Thirteen Commando Movement: ${meters}m × ${stanceMultiplier}x = ${exertionCost} exertion`);
});

/**
 * Hook: updateToken  
 * Deducts exertion after successful movement
 */
Hooks.on('updateToken', async (document, change, options, userId) => {
  // Only process for Thirteen Commando actors
  if (!document.actor || document.actor.type !== 'character') return;
  
  // Only process if we have movement data from preUpdateToken
  if (!options.thirteenCommando?.movementCost) return;
  
  // Only process for the user who initiated the movement
  if (userId !== game.user.id) return;
  
  const { movementCost, distance, stanceMultiplier } = options.thirteenCommando;
  
  // Deduct exertion
  await document.actor.modifyExertion(-movementCost, false);
  
  // Create detailed chat message
  const stance = stanceMultiplier > 1 ? 
    (hasEffect(document.actor, 'Prone') ? 'Prone' : 'Crouched') : 'Standing';
    
  ChatMessage.create({
    user: userId,
    speaker: ChatMessage.getSpeaker({ actor: document.actor }),
    content: `
      <div class="thirteen-commando chat-card">
        <header class="card-header flexrow">
          <h3 class="item-name">Movement</h3>
        </header>
        <div class="card-content">
          <p><strong>Distance:</strong> ${distance} yards</p>
          <p><strong>Stance:</strong> ${stance} (${stanceMultiplier}x cost)</p>
          <p><strong>Exertion Cost:</strong> ${movementCost}</p>
          <p><strong>Remaining Exertion:</strong> ${document.actor.system.exertion.value}</p>
        </div>
      </div>
    `,
    type: CONST.CHAT_MESSAGE_STYLES.OTHER
  });
});

/**
 * Get stance multiplier based on active effects
 * @param {Actor} actor - The actor to check
 * @returns {number} - Multiplier (1 for standing, 2 for prone/crouched)
 */
function getStanceMultiplier(actor) {
  // Check for Prone effect first (takes priority)
  if (hasEffect(actor, 'Prone')) {
    return 2;
  }
  
  // Check for Crouched effect
  if (hasEffect(actor, 'Crouched')) {
    return 2;
  }
  
  // Default: Standing
  return 1;
}

/**
 * Check if actor has a specific active effect
 * @param {Actor} actor - The actor to check
 * @param {string} effectName - Name of the effect to check for
 * @returns {boolean} - True if effect is active
 */
function hasEffect(actor, effectName) {
  if (!actor.effects) return false;
  
  return actor.effects.some(effect => {
    return effect.name === effectName || 
           effect.getFlag('thirteen-commando', 'effectType') === effectName.toLowerCase();
  });
}

// Make functions globally available
window.getStanceMultiplier = getStanceMultiplier;
window.hasEffect = hasEffect;

/* -------------------------------------------- */
/*  STANCE EFFECT TEMPLATES                     */
/* -------------------------------------------- */

/**
 * Prone Effect Template
 * - Doubles movement cost (2x exertion per meter)
 * - Provides cover benefits (+2 to defense)
 * - Penalties to certain actions
 */
const ProneEffectTemplate = {
  name: "Prone",
  description: "Character is lying flat. Reduces visibility but restricts movement and some actions.",
  icon: "icons/svg/down.svg",
  category: "stance",
  changes: [
    {
      key: "system.attributes.physical.coordination.value",
      mode: CONST.ACTIVE_EFFECT_MODES.ADD,
      value: -1,
      priority: 20
    }
  ],
  duration: {
    permanent: true,
    rounds: undefined,
    seconds: undefined,
    combat: undefined,
    turns: undefined,
    startTime: undefined,
    startRound: undefined,
    startTurn: undefined
  },
  flags: {
    'thirteen-commando': {
      effectType: 'prone',
      movementMultiplier: 2,
      isStanceEffect: true,
      stanceType: 'prone'
    }
  },
  tint: "#8B4513", // Brown tint
  statuses: ["prone"]
};

/**
 * Crouched Effect Template  
 * - Doubles movement cost (2x exertion per meter)
 * - Provides partial cover benefits (+1 to defense)
 * - Less severe penalties than prone
 */
const CrouchedEffectTemplate = {
  name: "Crouched",
  description: "Character is in a low crouch. Reduces profile while maintaining mobility.",
  icon: "icons/svg/combat.svg", 
  category: "stance",
  changes: [
    // No attribute penalties for crouched (unlike prone)
  ],
  duration: {
    permanent: true,
    rounds: undefined,
    seconds: undefined,
    combat: undefined,
    turns: undefined,
    startTime: undefined,
    startRound: undefined,
    startTurn: undefined
  },
  flags: {
    'thirteen-commando': {
      effectType: 'crouched',
      movementMultiplier: 2,
      isStanceEffect: true,
      stanceType: 'crouched'
    }
  },
  tint: "#4682B4", // Steel blue tint
  statuses: ["crouched"]
};

/**
 * Apply stance effect to actor
 * @param {Actor} actor - Target actor
 * @param {string} stanceType - 'prone' or 'crouched'
 */
async function applyStanceEffect(actor, stanceType) {
  // Remove any existing stance effects first
  await removeAllStanceEffects(actor);
  
  let effectData;
  switch (stanceType.toLowerCase()) {
    case 'prone':
      effectData = ProneEffectTemplate;
      break;
    case 'crouched':
      effectData = CrouchedEffectTemplate;
      break;
    default:
      console.warn(`Unknown stance type: ${stanceType}`);
      return;
  }
  
  // Create the effect
  await actor.createEmbeddedDocuments('ActiveEffect', [effectData]);
  
  ui.notifications.info(`${actor.name} is now ${stanceType}.`);
}

/**
 * Remove all stance effects from actor
 * @param {Actor} actor - Target actor
 */
async function removeAllStanceEffects(actor) {
  const stanceEffects = actor.effects.filter(effect => 
    effect.getFlag('thirteen-commando', 'isStanceEffect')
  );
  
  if (stanceEffects.length > 0) {
    const effectIds = stanceEffects.map(effect => effect.id);
    await actor.deleteEmbeddedDocuments('ActiveEffect', effectIds);
  }
}

/**
 * Toggle stance effect (apply if not present, remove if present)
 * @param {Actor} actor - Target actor
 * @param {string} stanceType - 'prone' or 'crouched'
 */
async function toggleStanceEffect(actor, stanceType) {
  const hasStance = hasEffect(actor, stanceType);
  
  if (hasStance) {
    await removeAllStanceEffects(actor);
    ui.notifications.info(`${actor.name} is no longer ${stanceType}.`);
  } else {
    await applyStanceEffect(actor, stanceType);
  }
}

/**
 * Add stance templates to the Effect Template Manager
 * Call this during system initialization
 */
async function registerStanceTemplates() {
  if (!game.user.isGM) return;
  
  // Add safety check to ensure game.thirteenCommando exists
  if (!game.thirteenCommando) {
    console.warn('Thirteen Commando: game.thirteenCommando not initialized yet, skipping stance registration');
    return;
  }
  
  // Add quick access functions to global game object for testing
  game.thirteenCommando.stances = {
    applyProne: (actor) => applyStanceEffect(actor, 'prone'),
    applyCrouched: (actor) => applyStanceEffect(actor, 'crouched'),
    removeStances: (actor) => removeAllStanceEffects(actor),
    toggleProne: (actor) => toggleStanceEffect(actor, 'prone'),
    toggleCrouched: (actor) => toggleStanceEffect(actor, 'crouched'),
    getMultiplier: (actor) => getStanceMultiplier(actor)
  };
  
  console.log('Thirteen Commando: Stance effect system ready');
}

/* -------------------------------------------- */
/*  Effect Template Token HUD Integration       */
/* -------------------------------------------- */

/**
 * Add Effect Template magic wand to token HUD
 */
/**
 * Add Effect Template magic wand to token HUD
 * COMPLETELY REWRITTEN for Foundry VTT v13 new palette-based HUD structure
 */
Hooks.on("renderTokenHUD", (hud, html, data) => {
    // Only show for GMs
    if (!game.user.isGM) return;

    console.log("Adding effect template button to token HUD for:", hud.object.document.name);

    // Convert HTMLElement to jQuery for easier manipulation
    const $html = $(html);

    // Find the right column where we want to add our button
    const $rightCol = $html.find('.col.right');
    if ($rightCol.length === 0) {
        console.warn("Could not find right column in token HUD");
        return;
    }

    // Find the status effects button/palette area
    const $statusEffectsButton = $html.find('[data-action="togglePalette"][data-palette="effects"]');
    const $statusEffectsPalette = $html.find('.palette.status-effects');

    // Hide the existing status effects button and palette
    if ($statusEffectsButton.length > 0) {
        $statusEffectsButton.hide();
        console.log("Hidden status effects button");
    }

    if ($statusEffectsPalette.length > 0) {
        $statusEffectsPalette.hide();
        console.log("Hidden status effects palette");
    }

    // Create our effect template button with the same styling as other HUD buttons
    const $templateButton = $(`
        <button type="button" class="control-icon effect-templates" 
                data-action="effect-templates" 
                data-tooltip="Apply Effect Template" 
                aria-label="Apply Effect Template">
            <i class="fas fa-magic" style="color: #d4af37;"></i>
        </button>
    `);

    // Add click handler for template menu
    $templateButton.on('click', async (event) => {
        event.preventDefault();
        event.stopPropagation();

        console.log("Effect template button clicked");

        // Store reference to token document
        const tokenDoc = hud.object.document;

        // Show the template menu
        await _showEffectTemplateMenu(tokenDoc);
    });

    // Insert the button in the right column
    // Try to place it where the status effects button was, or at the end
    if ($statusEffectsButton.length > 0) {
        $statusEffectsButton.after($templateButton);
    } else {
        // Fallback: add to the end of the right column
        $rightCol.append($templateButton);
    }

    console.log("Template button added to token HUD");
});

/**
 * Alternative approach - Replace the status effects palette entirely
 * Uncomment this version if the above doesn't work properly
 */
/*
Hooks.on("renderTokenHUD", (hud, html, data) => {
    // Only show for GMs
    if (!game.user.isGM) return;

    console.log("Adding effect template button to token HUD for:", hud.object.document.name);

    // Convert HTMLElement to jQuery
    const $html = $(html);

    // Find and replace the entire status effects section
    const $statusSection = $html.find('.palette.status-effects').parent();
    
    if ($statusSection.length > 0) {
        // Create our custom effect template section
        const $templateSection = $(`
            <div class="effect-templates-section">
                <button type="button" class="control-icon effect-templates" 
                        data-action="effect-templates" 
                        data-tooltip="Apply Effect Template" 
                        aria-label="Apply Effect Template">
                    <i class="fas fa-magic" style="color: #d4af37; font-size: 16px;"></i>
                </button>
            </div>
        `);

        // Add click handler
        $templateSection.find('.effect-templates').on('click', async (event) => {
            event.preventDefault();
            event.stopPropagation();
            
            console.log("Effect template button clicked");
            const tokenDoc = hud.object.document;
            await _showEffectTemplateMenu(tokenDoc);
        });

        // Replace the status effects section
        $statusSection.replaceWith($templateSection);
        console.log("Replaced status effects section with template button");
    } else {
        console.warn("Could not find status effects section to replace");
    }
});
*/

/**
 * Show effect template selection dialog
 */
async function _showEffectTemplateMenu(tokenDoc, event = null) {
    console.log("Opening effect template dialog for:", tokenDoc.name);

    // Get templates from the actor
    const actor = tokenDoc.actor;
    if (!actor) {
        ui.notifications.warn("No actor associated with this token");
        return;
    }

    const templates = actor.getEffectTemplates();

    // Build options HTML
    let optionsHtml = '<div class="form-group"><label>Select Effect Template:</label><select name="template">';
    let hasTemplates = false;

    // Category labels
    const categoryLabels = {
        combat: "Combat",
        physical: "Physical", 
        environmental: "Environmental",
        medical: "Medical",
        custom: "Custom"
    };

    // Add categories with templates
    for (const [category, categoryTemplates] of Object.entries(templates)) {
        if (categoryTemplates && categoryTemplates.length > 0) {
            optionsHtml += `<optgroup label="${categoryLabels[category]}">`;
            categoryTemplates.forEach(template => {
                // Check if this template is already applied to the actor
                const isApplied = actor.effects.find(e =>
                    e.name === template.name &&
                    e.getFlag('thirteen-commando', 'templateId') === template.id
                );
                
                // Add asterisk and different styling if already applied
                const displayName = isApplied ? `${template.name} *` : template.name;
                const styleAttribute = isApplied ? ' style="color: #228B22; font-weight: bold;"' : '';
                
                optionsHtml += `<option value="${template.id}"${styleAttribute}>${displayName}</option>`;
                hasTemplates = true;
            });
            optionsHtml += '</optgroup>';
        }
    }

    optionsHtml += '</select></div>';

    if (!hasTemplates) {
        ui.notifications.info("No effect templates found. Create some in the Template Manager first.");
        game.thirteenCommando.EffectTemplateManager.show();
        return;
    }

    // Show dialog with proper error handling
    try {
        const templateId = await Dialog.prompt({
            title: "Apply Effect Template",
            content: optionsHtml,
            callback: (html) => html.find('[name="template"]').val()
        });

        if (templateId) {
            // Find the selected template
            let selectedTemplate = null;
            for (const categoryTemplates of Object.values(templates)) {
                const found = categoryTemplates.find(t => t.id === templateId);
                if (found) {
                    selectedTemplate = found;
                    break;
                }
            }

            if (selectedTemplate) {
                await _applyEffectTemplate(tokenDoc, selectedTemplate);
            }
        }
    } catch (error) {
        // Handle dialog cancellation gracefully
        if (error.message === "The Dialog was closed without a choice being made.") {
            console.log("Template selection cancelled by user");
            return; // Silent cancellation
        } else {
            console.error("Error in template selection dialog:", error);
            ui.notifications.error("An error occurred with the template selection dialog");
        }
    }
}

/**
 * Apply an effect template to a token's actor
 */
async function _applyEffectTemplate(tokenDoc, template) {
    console.log(`Applying template "${template.name}" to ${tokenDoc.name}`);

    const actor = tokenDoc.actor;
    if (!actor) {
        ui.notifications.error("No actor associated with this token");
        return;
    }

    try {
        // Check if template already applied
        const existingEffect = actor.effects.find(e =>
            e.name === template.name &&
            e.getFlag('thirteen-commando', 'templateId') === template.id
        );

        if (existingEffect) {
            // Show three-option dialog for existing effects
            const choice = await new Promise((resolve) => {
                new Dialog({
                    title: "Effect Already Applied",
                    content: `
            <p><strong>${template.name}</strong> is already applied to <strong>${actor.name}</strong>.</p>
            <p>What would you like to do?</p>
          `,
                    buttons: {
                        replace: {
                            icon: '<i class="fas fa-sync"></i>',
                            label: "Replace",
                            callback: () => resolve("replace")
                        },
                        remove: {
                            icon: '<i class="fas fa-trash"></i>',
                            label: "Remove",
                            callback: () => resolve("remove")
                        },
                        cancel: {
                            icon: '<i class="fas fa-times"></i>',
                            label: "Cancel",
                            callback: () => resolve("cancel")
                        }
                    },
                    default: "replace",
                    close: () => resolve("cancel")
                }).render(true);
            });

            if (choice === "cancel") {
                return;
            } else if (choice === "remove") {
                await existingEffect.delete();
                ui.notifications.info(`Removed "${template.name}" from ${actor.name}`);
                console.log(`Removed template effect from ${actor.name}`);
                return;
            } else if (choice === "replace") {
                await existingEffect.delete();
                ui.notifications.info(`Replacing "${template.name}" on ${actor.name}`);
            }
        }

        // Create the Active Effect from template (for new application or replacement)
        const effectData = {
            name: template.name,
            icon: template.icon || "icons/svg/aura.svg",
            origin: actor.uuid,
            duration: template.duration || {},
            changes: template.changes || [],
            disabled: false,
            transfer: template.transfer !== false,
            statuses: [template.id], // Add this line for token icons
            flags: {
                "thirteen-commando": {
                    templateId: template.id,
                    templateCategory: template.category,
                    isFromTemplate: true
                }
            }
        };

        // Apply the effect
        await actor.createEmbeddedDocuments("ActiveEffect", [effectData]);

        // Show success notification
        ui.notifications.info(`Applied "${template.name}" to ${actor.name}`);

        console.log(`Successfully applied template effect to ${actor.name}`);

    } catch (error) {
        console.error("Failed to apply effect template:", error);
        ui.notifications.error(`Failed to apply effect template: ${error.message}`);
    }
}

/* -------------------------------------------- */
/*  Token Context Menu Integration              */
/* -------------------------------------------- */

/**
 * Add Effect Template options to token context menu
 */
Hooks.on('getTokenHUD', (hud, html, data) => {
  // Only show for GMs and for Thirteen Commando actors
  if (!game.user.isGM) return;
  if (!hud.object.actor || hud.object.actor.type !== 'character') return;
  
  // Add magic wand button for effect templates
  const effectButton = $(`
    <div class="control-icon" title="Apply Effect Templates">
      <i class="fas fa-magic"></i>
    </div>
  `);
  
  effectButton.click(async (event) => {
    event.preventDefault();
    event.stopPropagation();
    
    const actor = hud.object.actor;
    if (!actor) return;
    
    // Get available templates
    const templates = await actor.getEffectTemplates();
    
    if (templates.length === 0) {
      ui.notifications.warn("No effect templates available. Create some in the Effect Template Manager first.");
      return;
    }
    
    // Group templates by category
    const categorizedTemplates = templates.reduce((acc, template) => {
      const category = template.category || 'general';
      if (!acc[category]) acc[category] = [];
      acc[category].push(template);
      return acc;
    }, {});
    
    // Create selection dialog
    let dialogContent = '<div style="max-height: 400px; overflow-y: auto;">';
    
    for (const [category, categoryTemplates] of Object.entries(categorizedTemplates)) {
      dialogContent += `<h3 style="border-bottom: 1px solid #ccc; padding-bottom: 5px; margin-bottom: 10px;">${category.charAt(0).toUpperCase() + category.slice(1)}</h3>`;
      
      for (const template of categoryTemplates) {
        dialogContent += `
          <div class="template-option" style="margin-bottom: 10px; padding: 8px; border: 1px solid #ccc; border-radius: 4px; cursor: pointer;" data-template-name="${template.name}">
            <div style="display: flex; align-items: center;">
              <img src="${template.icon}" style="width: 24px; height: 24px; margin-right: 8px;"/>
              <div>
                <div style="font-weight: bold;">${template.name}</div>
                <div style="font-size: 0.9em; color: #666;">${template.description}</div>
              </div>
            </div>
          </div>
        `;
      }
    }
    
    dialogContent += '</div>';
    
    new Dialog({
      title: `Apply Effect Template to ${actor.name}`,
      content: dialogContent,
      buttons: {
        cancel: {
          label: "Cancel"
        }
      },
      render: (html) => {
        html.find('.template-option').click(async (event) => {
          const templateName = event.currentTarget.dataset.templateName;
          const template = templates.find(t => t.name === templateName);
          
          if (template) {
            // Apply the template as an Active Effect
            await actor.createEmbeddedDocuments('ActiveEffect', [template]);
            ui.notifications.info(`Applied "${template.name}" to ${actor.name}`);
          }
          
          // Close the dialog
          event.target.closest('.dialog').querySelector('.dialog-button[data-button="cancel"]').click();
        });
        
        // Add hover effect
        html.find('.template-option').hover(
          function() { $(this).css('background-color', '#f0f0f0'); },
          function() { $(this).css('background-color', ''); }
        );
      }
    }).render(true);
  });
  
  html.find('.col.right').append(effectButton);
});

/* -------------------------------------------- */
/*  Hotbar Macros                               */
/* -------------------------------------------- */

/**
 * Create a Macro from an Item drop.
 * Get an existing item macro if one exists, otherwise create a new one.
 * @param {Object} data     The dropped data
 * @param {number} slot     The hotbar slot to use
 * @returns {Promise}
 */
async function createItemMacro(data, slot) {
  // First, determine if this is a valid owned item.
  if (data.type !== "Item") return;
  if (!data.uuid.includes('Actor.') && !data.uuid.includes('Token.')) {
    return ui.notifications.warn("You can only create macro buttons for owned Items");
  }
  // If it is, retrieve it based on the uuid.
  const item = await Item.fromDropData(data);

  // Create the macro command
  const command = `game.thirteencommando.rollItemMacro("${item.name}");`;
  let macro = game.macros.find(m => (m.name === item.name) && (m.command === command));
  if (!macro) {
    macro = await Macro.create({
      name: item.name,
      type: "script",
      img: item.img,
      command: command,
      flags: { "thirteencommando.itemMacro": true }
    });
  }
  game.user.assignHotbarMacro(macro, slot);
  return false;
}

/**
 * Create a Macro from an Item drop.
 * Get an existing item macro if one exists, otherwise create a new one.
 * @param {string} itemName
 * @return {Promise}
 */
function rollItemMacro(itemName) {
  const speaker = ChatMessage.getSpeaker();
  let actor;
  if (speaker.token) actor = game.actors.tokens[speaker.token];
  if (!actor) actor = game.actors.get(speaker.actor);
  const item = actor ? actor.items.find(i => i.name === itemName) : null;
  if (!item) return ui.notifications.warn(`Your controlled Actor does not have an item named ${itemName}`);

  // Trigger the item roll
  return item.roll();
}