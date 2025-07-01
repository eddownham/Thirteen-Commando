/**
 * Effect Template Manager Application
 * Provides interface for creating, editing, and organizing effect templates
 * FIXED: Now extends FormApplication for proper settings integration
 */
export class EffectTemplateManager extends FormApplication {

  constructor(options = {}) {
    super({}, options);
  }

  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      id: "effect-template-manager",
      title: "Effect Template Manager",
      template: "systems/thirteen-commando/templates/apps/effect-template-manager.html",
      classes: ["thirteen-commando", "template-manager"],
      width: 800,
      height: 900,
      resizable: true,
      tabs: [{ navSelector: ".template-tabs", contentSelector: ".template-tab-content", initial: "combat" }],
      submitOnChange: false,
      submitOnClose: false,
      closeOnSubmit: false
    });
  }

  async getData() {
    const context = await super.getData();
    
    const actor = game.actors.contents[0];
    if (!actor) {
      ui.notifications.error("No actors found. Please create a character first.");
      return context;
    }

    const templates = actor.getEffectTemplates();
    
    context.templates = templates;
    context.woundTemplates = {};
    
    // FIXED: Added environmental category to match your actual data
    context.categories = [
      { key: "combat", label: "Combat", icon: "fas fa-sword" },
      { key: "physical", label: "Physical", icon: "fas fa-lightning" },
      { key: "environmental", label: "Environmental", icon: "fas fa-mountain" },
      { key: "medical", label: "Medical", icon: "fas fa-heart-pulse" },
      { key: "custom", label: "Custom", icon: "fas fa-star" }
    ];

    context.categories.forEach(cat => {
      cat.count = templates[cat.key]?.length || 0;
    });

    context.isGM = game.user.isGM;

    console.log('Template Manager Data:', context);
    return context;
  }

  // ADDED: Required FormApplication method
  async _updateObject(event, formData) {
    // This method is required for FormApplication but we don't need it for our template manager
    // All updates are handled by the button click handlers
    return;
  }

  activateListeners(html) {
    super.activateListeners(html);

    if (!game.user.isGM) {
      html.find('button').prop('disabled', true);
      return;
    }

    html.find('.template-tab-button').on('click', (event) => {
      this._onTabClick(event);
    });

    html.find('.create-template').on('click', (event) => {
      this._onCreateTemplate(event);
    });

    html.find('.edit-template').on('click', (event) => {
      this._onEditTemplate(event);
    });

    html.find('.duplicate-template').on('click', (event) => {
      this._onDuplicateTemplate(event);
    });

    html.find('.delete-template').on('click', (event) => {
      this._onDeleteTemplate(event);
    });

    html.find('.import-templates').on('click', (event) => {
      this._onImportTemplates(event);
    });

    html.find('.export-templates').on('click', (event) => {
      this._onExportTemplates(event);
    });

    console.log('Template Manager listeners activated');
  }

  async _onTabClick(event) {
    event.preventDefault();
    const tab = event.currentTarget.dataset.templateTab;

    console.log(`Switching to template tab: ${tab}`);

    const html = this.element;
    html.find('.template-tab-button').removeClass('active');
    html.find('.template-tab-content').removeClass('active');

    event.currentTarget.classList.add('active');
    html.find(`[data-template-tab-content="${tab}"]`).addClass('active');
  }

  async _onCreateTemplate(event) {
    event.preventDefault();
    const category = event.currentTarget.dataset.category;

    console.log(`Creating new template in category: ${category}`);

    const newTemplate = {
      id: `template_${Date.now()}`,
      name: "New Template",
      category: category,
      icon: this._getDefaultIcon(category),
      description: `A new ${category} effect template`,
      changes: [
        {
          key: "system.attributes.physical.coordination.value",
          mode: 2,
          value: -1,
          priority: 20
        }
      ],
      duration: {
        rounds: null,
        seconds: null,
        startTime: null,
        startRound: null,
        startTurn: null
      },
      transfer: true,
      disabled: false,
      flags: {
        "thirteen-commando": {
          isTemplate: true,
          templateCategory: category,
          showOnToken: true
        }
      }
    };

    const actor = game.actors.contents[0];
    const templates = actor.getEffectTemplates();

    if (!templates[category]) {
      templates[category] = [];
    }

    templates[category].push(newTemplate);

    await actor.saveEffectTemplates(templates);

    this.render(false);

    ui.notifications.info(`New template created in ${category} category`);
  }

  async _onEditTemplate(event) {
    event.preventDefault();
    const templateId = event.currentTarget.dataset.templateId;
    const category = event.currentTarget.dataset.category;

    console.log(`Editing template: ${templateId} in category: ${category}`);

    const actor = game.actors.contents[0];
    const templates = actor.getEffectTemplates();
    
    const template = templates[category]?.find(t => t.id === templateId);

    if (!template) {
      ui.notifications.error("Template not found");
      return;
    }

    try {
      const updatedTemplate = await game.thirteenCommando.EffectEditorDialog.show(template);

      if (updatedTemplate) {
        const templateIndex = templates[category].findIndex(t => t.id === templateId);
        if (templateIndex !== -1) {
          templates[category][templateIndex] = updatedTemplate;
          await actor.saveEffectTemplates(templates);
        } else {
          ui.notifications.error("Could not find template to update");
          return;
        }

        this.render(false);

        ui.notifications.info(`Template "${updatedTemplate.name}" updated successfully`);
        console.log("Template updated:", updatedTemplate);
      }
    } catch (error) {
      if (error && error.message !== "The Dialog was closed without a choice being made.") {
        console.error("Error editing template:", error);
        ui.notifications.error("Failed to edit template");
      }
    }
  }

  async _onDuplicateTemplate(event) {
    event.preventDefault();
    const templateId = event.currentTarget.dataset.templateId;
    const category = event.currentTarget.dataset.category;
    
    console.log(`Duplicating template: ${templateId}`);
    
    const actor = game.actors.contents[0];
    const templates = actor.getEffectTemplates();
    
    const originalTemplate = templates[category]?.find(t => t.id === templateId);
    if (!originalTemplate) {
      ui.notifications.error("Template not found");
      return;
    }
    
    const duplicate = foundry.utils.deepClone(originalTemplate);
    duplicate.id = `template_${Date.now()}`;
    duplicate.name = `${duplicate.name} (Copy)`;
    
    if (!templates[category]) {
      templates[category] = [];
    }
    
    templates[category].push(duplicate);
    await actor.saveEffectTemplates(templates);
    
    this.render(false);
    ui.notifications.info("Template duplicated");
  }

  async _onDeleteTemplate(event) {
    event.preventDefault();
    const templateId = event.currentTarget.dataset.templateId;
    const category = event.currentTarget.dataset.category;
    
    console.log(`Deleting template: ${templateId}`);
    
    const confirmed = await Dialog.confirm({
      title: "Delete Template",
      content: "<p>Are you sure you want to delete this template? This action cannot be undone.</p>",
      yes: () => true,
      no: () => false
    });
    
    if (!confirmed) return;
    
    const actor = game.actors.contents[0];
    const templates = actor.getEffectTemplates();
    
    if (templates[category]) {
      templates[category] = templates[category].filter(t => t.id !== templateId);
      await actor.saveEffectTemplates(templates);
    }
    
    this.render(false);
    ui.notifications.info("Template deleted");
  }

  async _onImportTemplates(event) {
    event.preventDefault();
    
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      
      try {
        const text = await file.text();
        const importedTemplates = JSON.parse(text);
        
        const actor = game.actors.contents[0];
        const currentTemplates = actor.getEffectTemplates();
        
        for (const [category, templates] of Object.entries(importedTemplates)) {
          if (!currentTemplates[category]) currentTemplates[category] = [];
          currentTemplates[category].push(...templates);
        }
        
        await actor.saveEffectTemplates(currentTemplates);
        this.render(false);
        ui.notifications.info("Templates imported successfully");
        
      } catch (error) {
        console.error("Import error:", error);
        ui.notifications.error("Failed to import templates");
      }
    };
    
    input.click();
  }

  async _onExportTemplates(event) {
    event.preventDefault();
    
    const actor = game.actors.contents[0];
    const templates = actor.getEffectTemplates();
    
    const dataStr = JSON.stringify(templates, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `thirteen-commando-templates-${game.world.id}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    ui.notifications.info("Templates exported to file");
  }

  _getDefaultIcon(category) {
    const icons = {
      combat: "icons/svg/combat.svg",
      physical: "icons/svg/lightning.svg",
      environmental: "icons/svg/hazard.svg",
      medical: "icons/svg/blood.svg",
      custom: "icons/svg/aura.svg"
    };
    return icons[category] || "icons/svg/mystery-man.svg";
  }

  static async show() {
    const manager = new EffectTemplateManager();
    return manager.render(true);
  }
}