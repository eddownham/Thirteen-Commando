/**
 * Effect Editor Dialog
 * Provides interface for editing effect template mechanics
 */
export class EffectEditorDialog extends Dialog {

  constructor(template, options = {}) {
    const dialogData = {
      title: `Edit Template: ${template.name}`,
      content: "", // Will be set in getData
      buttons: {
        save: {
          label: "Save Changes",
          icon: '<i class="fas fa-save"></i>',
          callback: (html) => this._onSave(html)
        },
        cancel: {
          label: "Cancel",
          icon: '<i class="fas fa-times"></i>',
          callback: () => null
        }
      },
      default: "save",
      close: () => null
    };

    super(dialogData, options);
    
    this.templateData = foundry.utils.deepClone(template);
    this.resolve = null;
  }

  /** @override */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["thirteen-commando", "effect-editor"],
      width: 650,
      height: 1000,
      resizable: true
      // Removed template override - use Foundry's default Dialog template
    });
  }

  /** @override */
  async getData() {
    // Get the parent Dialog data first
    const context = await super.getData();
    
    // Generate the HTML content instead of using template
    context.content = await this._generateContentHTML();
    
    return context;
  }

  /**
   * Generate the HTML content for the dialog
   */
  async _generateContentHTML() {
    const template = this.templateData;
    
    // Render the HTML template manually
    const templatePath = "systems/thirteen-commando/templates/apps/effect-editor-dialog.html";
    return await renderTemplate(templatePath, { 
      template: template, 
      categoryOptions: this._getCategoryOptions(),
      modeOptions: this._getModeOptions() 
    });
  }

  /**
   * Get category options for the first dropdown
   */
  _getCategoryOptions() {
    return [
      { value: "attributes", label: "Attributes" },
      { value: "skills", label: "Skills" },
      { value: "combat", label: "Combat Mechanics" },
      { value: "initiative", label: "Initiative" },
      { value: "derived", label: "Derived Values" },
      { value: "custom", label: "Custom Effects" }
    ];
  }

  /**
   * Get context-sensitive options for the second dropdown based on category
   * @param {string} category - The selected category
   */
  _getTargetOptions(category) {
    switch (category) {
      case "attributes":
        return this._getAttributeOptions();
      case "skills":
        return this._getSkillOptions();
      case "combat":
        return this._getCombatOptions();
      case "initiative":
        return this._getInitiativeOptions();
      case "derived":
        return this._getDerivedOptions();
      case "custom":
        return this._getCustomOptions();
      default:
        return [];
    }
  }

  /**
   * Get available attribute options
   */
  _getAttributeOptions() {
    return [
      {
        group: "Physical Attributes",
        options: [
          { value: "system.attributes.physical.might.value", label: "Might" },
          { value: "system.attributes.physical.coordination.value", label: "Coordination" },
          { value: "system.attributes.physical.endurance.value", label: "Endurance" }
        ]
      },
      {
        group: "Mental Attributes", 
        options: [
          { value: "system.attributes.mental.intelligence.value", label: "Intelligence" },
          { value: "system.attributes.mental.guile.value", label: "Guile" },
          { value: "system.attributes.mental.guts.value", label: "Guts" }
        ]
      },
      {
        group: "Social Attributes",
        options: [
          { value: "system.attributes.social.bearing.value", label: "Bearing" },
          { value: "system.attributes.social.charm.value", label: "Charm" },
          { value: "system.attributes.social.composure.value", label: "Composure" }
        ]
      }
    ];
  }

  /**
   * Get available skill options - targeting the .modifier component for proper Active Effects
   */
  _getSkillOptions() {
    return [
      {
        group: "Combat Skills",
        options: [
          { value: "system.skills.combat.heavyweapons.modifier", label: "Heavy Weapons" },
          { value: "system.skills.combat.explosiveordinance.modifier", label: "Explosive Ordinance" },
          { value: "system.skills.combat.grenadethrowing.modifier", label: "Grenade Throwing" },
          { value: "system.skills.combat.machinegunner.modifier", label: "Machine Gunner" },
          { value: "system.skills.combat.meleecombat.modifier", label: "Melee Combat" },
          { value: "system.skills.combat.pistols.modifier", label: "Pistols" },
          { value: "system.skills.combat.rifles.modifier", label: "Rifles" },
          { value: "system.skills.combat.submachineguns.modifier", label: "Submachine Guns" },
          { value: "system.skills.combat.unarmedcombat.modifier", label: "Unarmed Combat" }
        ]
      },
      {
        group: "General Skills",
        options: [
          { value: "system.skills.general.athletics.modifier", label: "Athletics" },
          { value: "system.skills.general.climb.modifier", label: "Climb" },
          { value: "system.skills.general.concealmentcamouflage.modifier", label: "Concealment & Camouflage" },
          { value: "system.skills.general.cryptography.modifier", label: "Cryptography" },
          { value: "system.skills.general.endurance.modifier", label: "Endurance" },
          { value: "system.skills.general.firstaid.modifier", label: "First Aid" },
          { value: "system.skills.general.linguistics.modifier", label: "Linguistics" },
          { value: "system.skills.general.navigation.modifier", label: "Navigation" },
          { value: "system.skills.general.parachuting.modifier", label: "Parachuting" },
          { value: "system.skills.general.radiooperations.modifier", label: "Radio Operations" },
          { value: "system.skills.general.stalking.modifier", label: "Stalking" },
          { value: "system.skills.general.survival.modifier", label: "Survival" },
          { value: "system.skills.general.swimming.modifier", label: "Swimming" }
        ]
      },
      {
        group: "Custom Skills",
        options: [
          { value: "system.skills.custom.custom1.modifier", label: "Custom Skill 1" },
          { value: "system.skills.custom.custom2.modifier", label: "Custom Skill 2" },
          { value: "system.skills.custom.custom3.modifier", label: "Custom Skill 3" },
          { value: "system.skills.custom.custom4.modifier", label: "Custom Skill 4" },
          { value: "system.skills.custom.custom5.modifier", label: "Custom Skill 5" }
        ]
      }
    ];
  }

  /**
   * Get combat mechanics options
   * UPDATED: Added Difficulty Modifier to Combat Values group
   */
  _getCombatOptions() {
    return [
      {
        group: "Initiative",
        options: [
          { value: "system.initiative.bonus", label: "Initiative Bonus" }
        ]
      },
      {
        group: "Exertion System",
        options: [
          { value: "system.exertion.movementMultiplier", label: "Movement Exertion Multiplier" },
          { value: "system.exertion.multiplier", label: "General Exertion Multiplier" }
        ]
      },
      {
        group: "Combat Values",
        options: [
          { value: "system.combat.difficultyModifier", label: "Difficulty Modifier" }
        ]
      }
    ];
  }

  /**
   * Get initiative options
   */
  _getInitiativeOptions() {
    return [
      {
        group: "Initiative Modifiers",
        options: [
          { value: "system.initiative.bonus", label: "Initiative Bonus" }
        ]
      }
    ];
  }

  /**
   * Get derived values options
   */
  _getDerivedOptions() {
    return [
      {
        group: "Calculated Values",
        options: [
          // Future implementation placeholder
        ]
      }
    ];
  }

  /**
   * Get custom effects options
   */
  _getCustomOptions() {
    return [
      {
        group: "Custom Targets",
        options: [
          // Future: User-defined effect targets
        ]
      }
    ];
  }

  /**
   * Handle saving the template
   */
  async _onSave(html) {
    // Find the form element or create FormData from inputs
    const form = html.find('form')[0] || html[0];
    let formData;
    
    if (form && form.tagName === 'FORM') {
      formData = new FormData(form);
    } else {
      // Manually collect form data from inputs
      formData = new FormData();
      html.find('input, select, textarea').each((i, element) => {
        if (element.name) {
          if (element.type === 'checkbox') {
            if (element.checked) {
              formData.append(element.name, 'on');
            }
          } else {
            formData.append(element.name, element.value);
          }
        }
      });
    }
    
    // Update basic info
    this.templateData.name = formData.get('name') || this.templateData.name;
    this.templateData.description = formData.get('description') || this.templateData.description;
    this.templateData.icon = formData.get('icon') || this.templateData.icon;

    // Update duration
    this.templateData.duration = {
      rounds: formData.get('duration-rounds') ? parseInt(formData.get('duration-rounds')) : null,
      seconds: formData.get('duration-seconds') ? parseInt(formData.get('duration-seconds')) : null,
      permanent: formData.get('duration-permanent') === 'on'
    };

    // Update changes - handle both category and key
    this.templateData.changes = [];
    let changeIndex = 0;
    
    while (formData.has(`change-${changeIndex}-key`) || formData.has(`change-${changeIndex}-category`)) {
      const key = formData.get(`change-${changeIndex}-key`);
      const modeValue = formData.get(`change-${changeIndex}-mode`);
      
      // Only save if we have a valid key (target selected)
      if (key && key !== "" && key !== "-- Select Category First --" && key !== "-- No options available --") {
        const change = {
          key: key,
          mode: parseInt(modeValue) || 2, // Default to ADD mode if not specified
          value: formData.get(`change-${changeIndex}-value`) || "",
          priority: parseInt(formData.get(`change-${changeIndex}-priority`)) || 20
        };
        
        if (change.value !== "") {
          this.templateData.changes.push(change);
        }
      }
      
      changeIndex++;
    }

    console.log('Saved template with changes:', this.templateData.changes);
    
    if (this.resolve) {
      this.resolve(this.templateData);
    }
    
    return this.templateData;
  }

  /**
   * Add event listeners for dynamic functionality
   */
  activateListeners(html) {
    super.activateListeners(html);

    // Add change button
    html.find('.add-change').click(this._onAddChange.bind(this));
    
    // Remove change buttons
    html.find('.remove-change').click(this._onRemoveChange.bind(this));

    // Category dropdown change handlers
    html.find('.effect-category-select').change(this._onCategoryChange.bind(this));

    // Initialize existing dropdowns on render
    this._initializeDropdowns(html);
  }

  /**
   * Initialize target dropdowns based on existing data
   */
  _initializeDropdowns(html) {
    // For each effect change, populate the target dropdown based on the current key
    this.templateData.changes.forEach((change, index) => {
      if (change.key) {
        // Determine category from the key
        const category = this._getCategoryFromKey(change.key);
        
        if (category) {
          // Set the category dropdown
          const categorySelect = html.find(`#change-${index}-category`)[0];
          if (categorySelect) {
            categorySelect.value = category;
          }
          
          // Populate and set the target dropdown
          this._populateTargetDropdown(html, index, category, change.key);
        }
      }
    });
  }

  /**
   * Handle category dropdown changes
   */
  _onCategoryChange(event) {
    const categorySelect = event.currentTarget;
    const index = parseInt(categorySelect.dataset.index);
    const category = categorySelect.value;
    
    console.log(`Category changed to ${category} for effect ${index}`);
    
    // Populate the target dropdown for this effect
    this._populateTargetDropdown($(categorySelect).closest('.effect-editor-dialog'), index, category);
  }

  /**
   * Populate target dropdown based on category
   */
  _populateTargetDropdown(html, index, category, selectedKey = null) {
    const targetSelect = html.find(`#change-${index}-key`)[0];
    if (!targetSelect) return;
    
    // Clear existing options
    targetSelect.innerHTML = '';
    
    if (!category) {
      targetSelect.innerHTML = '<option value="">-- Select Category First --</option>';
      return;
    }
    
    const options = this._getTargetOptions(category);
    
    if (options.length === 0) {
      targetSelect.innerHTML = '<option value="">-- No options available --</option>';
      return;
    }
    
    // Add grouped options
    options.forEach(group => {
      if (group.options && group.options.length > 0) {
        const optgroup = document.createElement('optgroup');
        optgroup.label = group.group;
        
        group.options.forEach(option => {
          const optionElement = document.createElement('option');
          optionElement.value = option.value;
          optionElement.textContent = option.label;
          
          // Select the current key if it matches
          if (selectedKey && option.value === selectedKey) {
            optionElement.selected = true;
          }
          
          optgroup.appendChild(optionElement);
        });
        
        targetSelect.appendChild(optgroup);
      }
    });
  }

  /**
   * Determine category from a system key
   * UPDATED: Added system.combat.difficultyModifier to combat category detection
   */
  _getCategoryFromKey(key) {
    if (key.startsWith('system.attributes.')) {
      return 'attributes';
    } else if (key.startsWith('system.skills.')) {
      return 'skills';
    } else if (key.startsWith('system.combat.') || key.startsWith('system.initiative.') || key.startsWith('system.exertion.')) {
      return 'combat';
    } else if (key.startsWith('system.initiative.')) {
      return 'initiative';
    } else if (key.startsWith('system.derived.')) {
      return 'derived';
    } else {
      return 'custom';
    }
  }

  /**
   * Handle adding a new effect change
   */
  _onAddChange(event) {
    event.preventDefault();
    
    this.templateData.changes.push({
      key: "system.attributes.physical.coordination.value",
      mode: 2, // Default to ADD mode
      value: -1,
      priority: 20
    });
    
    this.render(false);
  }

  /**
   * Handle removing an effect change
   */
  _onRemoveChange(event) {
    event.preventDefault();
    
    const index = parseInt(event.currentTarget.dataset.index);
    this.templateData.changes.splice(index, 1);
    
    this.render(false);
  }

  /**
   * Get effect mode options
   */
  _getModeOptions() {
    return [
      { value: 1, label: "Multiply" },
      { value: 2, label: "Add" },
      { value: 3, label: "Downgrade" },
      { value: 4, label: "Upgrade" },
      { value: 5, label: "Override" },
      { value: 0, label: "Custom" }
    ];
  }

  static async show(template) {
    return new Promise((resolve) => {
      const editor = new EffectEditorDialog(template);
      editor.resolve = resolve;
      editor.render(true);
    });
  }
}