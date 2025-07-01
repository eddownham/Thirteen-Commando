/**
 * Enhanced Weapon Attack Dialog for Thirteen Commando
 * ENHANCED VERSION - Complete difficulty calculation system with cover
 */
export class WeaponAttackDialog extends Dialog {
    
    constructor(actor, weapon, target = null, distance = null, options = {}) {
        console.log("WeaponAttackDialog constructor called with:", { 
            actor: actor?.name, 
            weapon: weapon?.name, 
            target: target?.name || target?.actor?.name || target,
            distance: distance,
            targetType: typeof target
        });
        
        // FIXED: Handle both Actor objects and Token objects
        let validTarget = null;
        if (target) {
            if (target.actor) {
                // Token/TokenDocument structure
                validTarget = target;
            } else if (target.name && target.type) {
                // Direct Actor object - wrap it in a token-like structure
                validTarget = {
                    actor: target,
                    // Use provided distance or default
                    distance: distance || "Unknown"
                };
            }
        }
        
        console.log("After validation - validTarget:", validTarget?.actor?.name || "NO TARGET");
        console.log("Distance set to:", validTarget?.distance || distance);
        
        // Set dialog options
        const dialogOptions = foundry.utils.mergeObject({
            classes: ["weapon-attack-dialog"],
            width: 600,
            height: "auto",
            resizable: true,
            title: `${weapon.name} Attack`
        }, options);
        
        // Create dialog configuration
        const dialogConfig = {
            title: `${weapon.name} Attack`,
            content: "", // Will be built later
            buttons: {
                attack: {
                    icon: '<i class="fas fa-crosshairs"></i>',
                    label: "Fire!",
                    callback: () => this._executeAttack()
                },
                cancel: {
                    icon: '<i class="fas fa-times"></i>',
                    label: "Cancel",
                    callback: () => false
                }
            },
            default: "attack",
            close: () => false
        };
        
        super(dialogConfig, dialogOptions);
        
        // Store instance data with proper target handling
        this.actor = actor;
        this.weapon = weapon;
        this.target = validTarget;  // Use the validated target
        this.distance = distance;   // Store the calculated distance
        this.selectedShotType = null;
        this.selectedRange = "short";
        this.selectedCover = "none";  // NEW: Cover selection
        this.targetNumber = 6;
        
        console.log("WeaponAttackDialog instance created - final target:", this.target?.actor?.name || "NO TARGET");
        
        // Inject CSS
        this._injectCSS();
    }

    /**
     * Inject CSS for the dialog
     */
    _injectCSS() {
        const cssId = 'weapon-attack-dialog-css';
        if (!document.getElementById(cssId)) {
            const style = document.createElement('style');
            style.id = cssId;
            style.textContent = `
/* Weapon Attack Dialog Styling - Enhanced */

/* Main dialog container styling */
.weapon-attack-dialog .dialog .window-content,
.dialog.weapon-attack-dialog .window-content {
    background: rgba(44, 62, 80, 0.95) !important;
    border: 2px solid #d4af37 !important;
    border-radius: 10px !important;
    padding: 20px !important;
    color: #ecf0f1 !important;
    font-family: "Roboto", sans-serif !important;
}

/* Dialog content styling */
.weapon-attack-dialog {
    --color-primary: #d4af37;
    --color-accent: #34495e;
    --color-text: #ecf0f1;
    --color-bg: #2c3e50;
    background: var(--color-bg) !important;
    color: var(--color-text) !important;
}

.weapon-attack-dialog .weapon-header {
    display: flex;
    align-items: center;
    gap: 15px;
    margin-bottom: 20px;
    padding-bottom: 15px;
    border-bottom: 2px solid var(--color-primary);
}

.weapon-attack-dialog .weapon-header img {
    width: 60px;
    height: 60px;
    border: 2px solid var(--color-primary);
    border-radius: 8px;
    object-fit: cover;
}

.weapon-attack-dialog .weapon-info h3 {
    margin: 0 0 5px 0;
    color: var(--color-primary);
    font-size: 1.3em;
    font-weight: bold;
}

.weapon-attack-dialog .weapon-type {
    margin: 0 0 5px 0;
    color: #bdc3c7;
    font-size: 0.9em;
    text-transform: capitalize;
}

.weapon-attack-dialog .ammo-status {
    margin: 0;
    color: #95a5a6;
    font-size: 0.85em;
}

/* Target Information Styling */
.weapon-attack-dialog .target-info {
    background: rgba(52, 73, 94, 0.8) !important;
    border: 2px solid var(--color-primary) !important;
    border-radius: 8px;
    padding: 15px;
    margin-bottom: 20px;
}

.weapon-attack-dialog .target-info h4 {
    color: var(--color-primary) !important;
    margin: 0 0 12px 0 !important;
    font-size: 1.1em !important;
    text-transform: uppercase;
    letter-spacing: 1px;
    border-bottom: 1px solid var(--color-primary);
    padding-bottom: 5px;
}

.weapon-attack-dialog .target-details {
    display: flex;
    align-items: center;
    gap: 12px;
}

.weapon-attack-dialog .target-details img {
    width: 40px;
    height: 40px;
    border: 2px solid var(--color-primary);
    border-radius: 6px;
    object-fit: cover;
}

.weapon-attack-dialog .target-data strong {
    color: var(--color-primary) !important;
    font-size: 1.1em;
    display: block;
    margin-bottom: 3px;
}

.weapon-attack-dialog .target-data p {
    margin: 2px 0 !important;
    color: #bdc3c7 !important;
    font-size: 0.85em;
}

.weapon-attack-dialog .no-target {
    background: rgba(231, 76, 60, 0.2);
    border: 2px solid #e74c3c;
    border-radius: 8px;
    padding: 12px;
    margin-bottom: 20px;
    text-align: center;
}

.weapon-attack-dialog .no-target .error {
    color: #e74c3c;
    font-weight: bold;
    margin: 0;
}

.weapon-attack-dialog .exertion-status {
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: rgba(52, 73, 94, 0.8) !important;
    border: 2px solid #34495e;
    border-radius: 8px;
    padding: 12px;
    margin-bottom: 20px;
}

.weapon-attack-dialog .exertion-status label {
    color: var(--color-primary) !important;
    font-weight: bold;
}

.weapon-attack-dialog .exertion-value {
    color: #2ecc71 !important;
    font-size: 1.2em;
    font-weight: bold;
}

.weapon-attack-dialog .exertion-value.low {
    color: #e74c3c !important;
}

.weapon-attack-dialog h4 {
    color: var(--color-primary) !important;
    margin: 0 0 12px 0 !important;
    font-size: 1.1em;
    text-transform: uppercase;
    letter-spacing: 1px;
    border-bottom: 1px solid var(--color-primary);
    padding-bottom: 5px;
}

.weapon-attack-dialog .shot-types-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
    gap: 10px;
    margin-bottom: 20px;
}

.weapon-attack-dialog .shot-type-btn {
    background: rgba(52, 73, 94, 0.8) !important;
    border: 2px solid #34495e !important;
    border-radius: 8px !important;
    padding: 12px !important;
    color: var(--color-text) !important;
    cursor: pointer;
    transition: all 0.3s ease;
    text-align: center;
}

.weapon-attack-dialog .shot-type-btn:hover:not(.disabled) {
    border-color: var(--color-primary) !important;
    background: rgba(212, 175, 55, 0.1) !important;
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
}

.weapon-attack-dialog .shot-type-btn.selected {
    border-color: var(--color-primary) !important;
    background: rgba(212, 175, 55, 0.2) !important;
    box-shadow: 0 0 10px rgba(212, 175, 55, 0.4);
}

.weapon-attack-dialog .shot-type-btn.disabled {
    opacity: 0.5;
    cursor: not-allowed;
    filter: grayscale(50%);
}

.weapon-attack-dialog .shot-type-name {
    font-weight: bold;
    font-size: 0.95em;
    margin-bottom: 4px;
    color: var(--color-primary) !important;
}

.weapon-attack-dialog .shot-type-cost {
    font-size: 0.85em;
    color: #f39c12 !important;
    font-weight: bold;
    margin-bottom: 4px;
}

.weapon-attack-dialog .shot-type-desc {
    font-size: 0.75em;
    color: #95a5a6 !important;
    font-style: italic;
    line-height: 1.2;
}

.weapon-attack-dialog .range-buttons,
.weapon-attack-dialog .cover-buttons {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 8px;
    margin-bottom: 20px;
}

.weapon-attack-dialog .cover-buttons {
    grid-template-columns: repeat(3, 1fr);
}

.weapon-attack-dialog .range-btn,
.weapon-attack-dialog .cover-btn {
    background: rgba(52, 73, 94, 0.8) !important;
    border: 2px solid #34495e !important;
    border-radius: 6px !important;
    padding: 10px !important;
    color: var(--color-text) !important;
    cursor: pointer;
    transition: all 0.3s ease;
    text-align: center;
}

.weapon-attack-dialog .range-btn:hover,
.weapon-attack-dialog .cover-btn:hover {
    border-color: var(--color-primary) !important;
    background: rgba(212, 175, 55, 0.1) !important;
}

.weapon-attack-dialog .range-btn.selected,
.weapon-attack-dialog .cover-btn.selected {
    border-color: var(--color-primary) !important;
    background: rgba(212, 175, 55, 0.2) !important;
    box-shadow: 0 0 8px rgba(212, 175, 55, 0.3);
}

.weapon-attack-dialog .range-name,
.weapon-attack-dialog .cover-name {
    font-weight: bold;
    font-size: 0.9em;
    color: var(--color-primary) !important;
    margin-bottom: 3px;
}

.weapon-attack-dialog .range-distance {
    font-size: 0.8em;
    color: #bdc3c7 !important;
    margin-bottom: 2px;
}

.weapon-attack-dialog .range-difficulty,
.weapon-attack-dialog .cover-difficulty {
    font-size: 0.75em;
    color: #95a5a6 !important;
    font-style: italic;
}

.weapon-attack-dialog .attack-summary {
    background: rgba(52, 73, 94, 0.8) !important;
    border: 2px solid #34495e;
    border-radius: 8px;
    padding: 15px;
    margin-bottom: 20px;
}

.weapon-attack-dialog .summary-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
}

.weapon-attack-dialog .summary-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px;
    background: rgba(44, 62, 80, 0.6) !important;
    border-radius: 5px;
}

.weapon-attack-dialog .summary-item label {
    color: var(--color-primary) !important;
    font-weight: bold;
    font-size: 0.9em;
}

.weapon-attack-dialog .summary-item span {
    color: var(--color-text) !important;
    font-weight: bold;
}

.weapon-attack-dialog .summary-item span.negative {
    color: #e74c3c !important;
}

.weapon-attack-dialog .difficulty-breakdown {
    background: rgba(44, 62, 80, 0.8) !important;
    border: 2px solid #3498db;
    border-radius: 8px;
    padding: 12px;
    margin-bottom: 20px;
}

.weapon-attack-dialog .difficulty-breakdown h4 {
    color: #3498db !important;
    border-bottom-color: #3498db;
}

.weapon-attack-dialog .breakdown-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
}

.weapon-attack-dialog .breakdown-item {
    display: flex;
    justify-content: space-between;
    padding: 4px 8px;
    background: rgba(52, 73, 94, 0.6);
    border-radius: 4px;
    font-size: 0.9em;
}

.weapon-attack-dialog .breakdown-total {
    grid-column: 1 / -1;
    background: rgba(52, 152, 219, 0.2) !important;
    border: 1px solid #3498db;
    font-weight: bold;
    color: #3498db !important;
    margin-top: 8px;
}

.weapon-attack-dialog .validation-messages {
    background: rgba(52, 73, 94, 0.6) !important;
    border-radius: 8px;
    padding: 12px;
    margin-bottom: 15px;
    min-height: 40px;
    display: flex;
    align-items: center;
}

.weapon-attack-dialog .validation-messages p {
    margin: 0 !important;
    font-weight: bold;
    text-align: center;
    width: 100%;
}

.weapon-attack-dialog .validation-messages .info {
    color: #3498db !important;
}

.weapon-attack-dialog .validation-messages .success {
    color: #2ecc71 !important;
}

.weapon-attack-dialog .validation-messages .error {
    color: #e74c3c !important;
}

/* Dialog buttons styling */
.weapon-attack-dialog .dialog-buttons,
.dialog.weapon-attack-dialog .dialog-buttons {
    background: rgba(44, 62, 80, 0.95) !important;
    border-top: 2px solid var(--color-primary) !important;
    padding: 15px 20px !important;
}

.weapon-attack-dialog .dialog-buttons button,
.dialog.weapon-attack-dialog .dialog-buttons button {
    background: rgba(52, 73, 94, 0.9) !important;
    border: 2px solid #34495e !important;
    border-radius: 6px !important;
    color: #ecf0f1 !important;
    padding: 10px 20px !important;
    font-weight: bold !important;
    cursor: pointer;
    transition: all 0.3s ease;
    margin: 0 5px !important;
}

.weapon-attack-dialog .dialog-buttons button:hover:not(:disabled),
.dialog.weapon-attack-dialog .dialog-buttons button:hover:not(:disabled) {
    border-color: #d4af37 !important;
    background: rgba(212, 175, 55, 0.2) !important;
    transform: translateY(-1px);
}

.weapon-attack-dialog .dialog-buttons button:disabled,
.dialog.weapon-attack-dialog .dialog-buttons button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    filter: grayscale(50%);
}

.weapon-attack-dialog .dialog-buttons button[data-button="attack"],
.dialog.weapon-attack-dialog .dialog-buttons button[data-button="attack"] {
    border-color: #27ae60 !important;
    background: rgba(39, 174, 96, 0.2) !important;
}

.weapon-attack-dialog .dialog-buttons button[data-button="attack"]:hover:not(:disabled),
.dialog.weapon-attack-dialog .dialog-buttons button[data-button="attack"]:hover:not(:disabled) {
    border-color: #2ecc71 !important;
    background: rgba(46, 204, 113, 0.3) !important;
    box-shadow: 0 0 8px rgba(46, 204, 113, 0.4);
}

/* Responsive design */
@media (max-width: 768px) {
    .weapon-attack-dialog .shot-types-grid {
        grid-template-columns: 1fr;
    }
    
    .weapon-attack-dialog .range-buttons {
        grid-template-columns: 1fr 1fr;
    }
    
    .weapon-attack-dialog .cover-buttons {
        grid-template-columns: 1fr;
    }
    
    .weapon-attack-dialog .summary-grid,
    .weapon-attack-dialog .breakdown-grid {
        grid-template-columns: 1fr;
    }
}
            `;
            document.head.appendChild(style);
            console.log("Dialog CSS injected successfully");
        } else {
            console.log("Dialog CSS already exists");
        }
    }

    static async show(actor, weapon, target = null, distance = null) {
        console.log("=== DIALOG SHOW METHOD DEBUG ===");
        console.log("show() received target:", target);
        console.log("show() received distance:", distance);
        console.log("target type:", typeof target);
        console.log("target constructor:", target?.constructor?.name);
        console.log("target.actor:", target?.actor);
        console.log("target.actor.name:", target?.actor?.name);
        console.log("================================");
        
        const dialog = new WeaponAttackDialog(actor, weapon, target, distance);
        dialog._buildContent(); // Build content synchronously
        return dialog.render(true);
    }

    _buildContent() {
        console.log("_buildContent() called - this.target:", this.target?.actor?.name || "NO TARGET");
        
        const weapon = this.weapon.system;
        const actor = this.actor.system;
        
        const availableShotTypes = this._getAvailableShotTypes();
        const currentExertion = actor.exertion.value;
        const skillTotal = this._getWeaponSkillTotal();
        
        // Build the content and set it directly
        this.data.content = `
            <div class="weapon-attack-dialog">
                <div class="weapon-header">
                    <img src="${this.weapon.img}" alt="${this.weapon.name}" />
                    <div class="weapon-info">
                        <h3>${this.weapon.name}</h3>
                        <p class="weapon-type">${weapon.weaponType} • ${weapon.proficiency} skill</p>
                        <p class="ammo-status">Ammo: ${weapon.ammunition.current}/${weapon.ammunition.max}</p>
                    </div>
                </div>

                ${this.target ? `
                    <div class="target-info">
                        <h4>Target Information</h4>
                        <div class="target-details">
                            <img src="${this.target.actor.img}" alt="${this.target.actor.name}" />
                            <div class="target-data">
                                <strong>${this.target.actor.name}</strong>
                                <p>Type: ${this.target.actor.type.charAt(0).toUpperCase() + this.target.actor.type.slice(1)}</p>
                                <p>Stance: ${this._getTargetStance()}</p>
                                <p>Distance: ${this._calculateDistance()} yards</p>
                                ${this.target.actor.type === 'minion' ? 
                                    (game.user.isGM ? 
                                        `<p>Training: ${this.target.actor.system.training || 1} | Equipment: ${this.target.actor.system.equipment?.score || 1}</p>` :
                                        `<p>Health: ${this._getTargetHealthStatus()}</p>`
                                    ) :
                                    `<p>Health: ${this._getTargetHealthStatus()}</p>`
                                }
                            </div>
                        </div>
                    </div>
                ` : `
                    <div class="no-target">
                        <p class="error">No target selected!</p>
                    </div>
                `}

                <div class="exertion-status">
                    <label>Current Exertion:</label>
                    <span class="exertion-value ${currentExertion < 5 ? 'low' : ''}">${currentExertion}</span>
                </div>

                <div class="shot-type-selection">
                    <h4>Select Shot Type</h4>
                    <div class="shot-types-grid">
                        ${availableShotTypes.map(shotType => this._renderShotTypeButton(shotType, currentExertion)).join('')}
                    </div>
                </div>

                <div class="range-selection">
                    <h4>Target Range</h4>
                    <div class="range-buttons">
                        ${this._renderRangeButtons()}
                    </div>
                </div>

                <div class="cover-selection">
                    <h4>Target Cover</h4>
                    <div class="cover-buttons">
                        ${this._renderCoverButtons()}
                    </div>
                </div>

                <div class="difficulty-breakdown">
                    <h4>Difficulty Breakdown</h4>
                    <div class="breakdown-grid" id="difficulty-breakdown">
                        ${this._renderDifficultyBreakdown()}
                    </div>
                </div>

                <div class="attack-summary">
                    <h4>Attack Summary</h4>
                    <div class="summary-grid">
                        <div class="summary-item">
                            <label>Dice Pool:</label>
                            <span id="dice-pool">${skillTotal}</span>
                        </div>
                        <div class="summary-item">
                            <label>Successes Needed:</label>
                            <span id="successes-needed">${this._calculateTotalDifficulty()}</span>
                        </div>
                        <div class="summary-item">
                            <label>Exertion Cost:</label>
                            <span id="exertion-cost">-</span>
                        </div>
                        <div class="summary-item">
                            <label>Remaining Exertion:</label>
                            <span id="remaining-exertion">-</span>
                        </div>
                    </div>
                </div>

                <div class="validation-messages" id="validation-messages">
                    <p class="info">Select a shot type to continue.</p>
                </div>
            </div>
        `;
        
        console.log("Content built successfully with target:", this.target ? "YES" : "NO");
    }

    /**
     * NEW: Render cover selection buttons
     */
    _renderCoverButtons() {
        const coverOptions = [
            { key: 'none', name: 'No Cover', difficulty: 0 },
            { key: 'light', name: 'Light/Partial', difficulty: 1 },
            { key: 'hard', name: 'Hard/Full', difficulty: 2 }
        ];

        return coverOptions.map(cover => `
            <button class="cover-btn ${cover.key === this.selectedCover ? 'selected' : ''}" 
                    data-cover="${cover.key}" 
                    data-difficulty="${cover.difficulty}">
                <div class="cover-name">${cover.name}</div>
                <div class="cover-difficulty">+${cover.difficulty} Difficulty</div>
            </button>
        `).join('');
    }

    /**
     * NEW: Render difficulty breakdown
     */
    _renderDifficultyBreakdown() {
        const baseDifficulty = 1;
        const rangeDifficulty = this._getRangeDifficulty();
        const stanceDifficulty = this._getStanceDifficulty();
        const coverDifficulty = this._getCoverDifficulty();
        const totalDifficulty = this._calculateTotalDifficulty();

        return `
            <div class="breakdown-item">
                <span>Base Difficulty:</span>
                <span>+${baseDifficulty}</span>
            </div>
            <div class="breakdown-item">
                <span>Range (${this.selectedRange}):</span>
                <span>+${rangeDifficulty}</span>
            </div>
            <div class="breakdown-item">
                <span>Stance (${this._getTargetStance()}):</span>
                <span>+${stanceDifficulty}</span>
            </div>
            <div class="breakdown-item">
                <span>Cover (${this._getCoverName()}):</span>
                <span>+${coverDifficulty}</span>
            </div>
            <div class="breakdown-item breakdown-total">
                <span><strong>Total Difficulty:</strong></span>
                <span><strong>${totalDifficulty}</strong></span>
            </div>
        `;
    }

    /**
     * NEW: Calculate total difficulty from all sources
     */
    _calculateTotalDifficulty() {
        const baseDifficulty = 1;
        const rangeDifficulty = this._getRangeDifficulty();
        const stanceDifficulty = this._getStanceDifficulty();
        const coverDifficulty = this._getCoverDifficulty();
        
        return baseDifficulty + rangeDifficulty + stanceDifficulty + coverDifficulty;
    }

    /**
     * NEW: Get range difficulty modifier
     */
    _getRangeDifficulty() {
        const rangeData = {
            'hipFire': 0,
            'short': 0,
            'medium': 1,
            'long': 2
        };
        return rangeData[this.selectedRange] || 0;
    }

    /**
     * NEW: Get stance difficulty modifier from effect templates
     */
    _getStanceDifficulty() {
        if (!this.target || !this.target.actor) return 0;
        
        const targetActor = this.target.actor;
        const effects = targetActor.effects || [];
        
        console.log("=== DEBUGGING STANCE DIFFICULTY ===");
        console.log("Target actor:", targetActor.name);
        console.log("Number of effects:", effects.length);
        
        for (const effect of effects) {
            const effectName = effect.name?.toLowerCase() || '';
            console.log(`\nChecking effect: "${effect.name}"`);
            console.log("Effect changes:", effect.changes);
            
            // Look for difficulty modifier changes in the effect
            const changes = effect.changes || [];
            for (const change of changes) {
                console.log(`  Change key: "${change.key}"`);
                console.log(`  Change value: "${change.value}"`);
                console.log(`  Change mode: "${change.mode}"`);
                
                if (change.key === 'system.combat.difficultyModifier') {
                    // Extract the numeric value from the change
                    const modifier = parseInt(change.value) || 0;
                    console.log(`*** Found difficulty modifier in effect "${effect.name}": +${modifier} ***`);
                    return modifier;
                }
            }
            
            // Also check for stance-based effects with fallback hardcoded values
            if (effectName.includes('prone')) {
                console.log("Found prone effect but no difficulty modifier change - checking for fallback");
                // If no explicit difficulty modifier found, check if this is a stance effect without the modifier
                const hasOtherChanges = changes.length > 0;
                if (hasOtherChanges) {
                    console.log("Prone effect has other changes but missing difficulty modifier - this may be the issue");
                }
            } else if (effectName.includes('crouch')) {
                console.log("Found crouch effect but no difficulty modifier change - checking for fallback");
                const hasOtherChanges = changes.length > 0;
                if (hasOtherChanges) {
                    console.log("Crouch effect has other changes but missing difficulty modifier - this may be the issue");
                }
            }
        }
        
        console.log("No difficulty modifier effects found");
        console.log("===================================");
        return 0;
    }

    /**
     * NEW: Get cover difficulty modifier
     */
    _getCoverDifficulty() {
        const coverData = {
            'none': 0,
            'light': 1,
            'hard': 2
        };
        return coverData[this.selectedCover] || 0;
    }

    /**
     * NEW: Get cover name for display
     */
    _getCoverName() {
        const coverNames = {
            'none': 'No Cover',
            'light': 'Light/Partial',
            'hard': 'Hard/Full'
        };
        return coverNames[this.selectedCover] || 'No Cover';
    }

    /**
     * Calculate distance to target in yards
     */
    _calculateDistance() {
        // Use pre-calculated distance if available
        if (this.distance !== null && this.distance !== undefined) {
            return this.distance;
        }
        
        // Fallback to target distance property
        if (this.target && this.target.distance) {
            return this.target.distance;
        }
        
        return "Unknown";
    }

    /**
     * Get target stance based on active effects
     */
    _getTargetStance() {
        if (!this.target || !this.target.actor) return "Standing";
        
        const targetActor = this.target.actor;
        
        // Check for stance effects (case-insensitive)
        const effects = targetActor.effects || [];
        
        for (const effect of effects) {
            const effectName = effect.name?.toLowerCase() || '';
            
            if (effectName.includes('prone')) {
                return "Prone";
            } else if (effectName.includes('crouch')) {
                return "Crouched";
            }
        }
        
        return "Standing";
    }

    _getTargetHealthStatus() {
        if (!this.target || !this.target.actor) return "Unknown";
        
        const targetActor = this.target.actor;
        if (targetActor.type === 'character') {
            // Count total health boxes checked
            const health = targetActor.system.health;
            const healthBoxes = Object.keys(health);
            const checkedBoxes = healthBoxes.filter(box => health[box]).length;
            const totalBoxes = healthBoxes.length;
            
            if (checkedBoxes === 0) return "Healthy";
            if (health.dead) return "Dead";
            if (health.critical1 || health.critical2) return "Critical";
            if (health.injured1 || health.injured2) return "Injured";
            return `${checkedBoxes}/${totalBoxes} wounds`;
        } else if (targetActor.type === 'minion') {
            const health = targetActor.system.health;
            if (health.dead) return "Dead";
            if (health.critical) return "Critical";
            if (health.bloodied) return "Bloodied";
            if (health.injured) return "Injured";
            return "Healthy";
        }
        
        return "Unknown";
    }

    _getAvailableShotTypes() {
        const shotTypes = this.weapon.system.shotTypes;
        const available = [];
        
        for (const [key, data] of Object.entries(shotTypes)) {
            if (data.available) {
                available.push({
                    key: key,
                    name: this._getShotTypeName(key),
                    cost: data.cost,
                    description: this._getShotTypeDescription(key)
                });
            }
        }
        
        return available;
    }

    _getShotTypeName(key) {
        const names = {
            'hipShot': 'Hip Shot',
            'deliberateFire': 'Deliberate Fire',
            'shortBurst': 'Short Burst',
            'fullAuto': 'Full Auto',
            'coveringFire': 'Covering Fire',
            'overwatch': 'Overwatch'
        };
        return names[key] || key;
    }

    _getShotTypeDescription(key) {
        const descriptions = {
            'hipShot': 'Quick, inaccurate shot',
            'deliberateFire': 'Careful, aimed shot',
            'shortBurst': '3-round controlled burst',
            'fullAuto': 'Sustained automatic fire',
            'coveringFire': 'Area suppression',
            'overwatch': 'Reaction fire setup'
        };
        return descriptions[key] || '';
    }

    _renderShotTypeButton(shotType, currentExertion) {
        const canAfford = currentExertion >= shotType.cost;
        const disabledClass = !canAfford ? 'disabled' : '';
        const disabledAttr = !canAfford ? 'disabled' : '';
        
        return `
            <button class="shot-type-btn ${disabledClass}" 
                    data-shot-type="${shotType.key}" 
                    data-cost="${shotType.cost}"
                    ${disabledAttr}>
                <div class="shot-type-name">${shotType.name}</div>
                <div class="shot-type-cost">${shotType.cost} Exertion</div>
                <div class="shot-type-desc">${shotType.description}</div>
            </button>
        `;
    }

    _renderRangeButtons() {
        const ranges = this.weapon.system.ranges;
        const rangeData = [
            { key: 'hipFire', name: 'Hip Fire', max: ranges.hipFire, difficulty: 0 },
            { key: 'short', name: 'Short', max: ranges.short, difficulty: 0 },
            { key: 'medium', name: 'Medium', max: ranges.medium, difficulty: 1 },
            { key: 'long', name: 'Long', max: ranges.long, difficulty: 2 }
        ];

        return rangeData.map(range => `
            <button class="range-btn ${range.key === this.selectedRange ? 'selected' : ''}" 
                    data-range="${range.key}" 
                    data-difficulty="${range.difficulty}">
                <div class="range-name">${range.name}</div>
                <div class="range-distance">${range.max}m</div>
                <div class="range-difficulty">+${range.difficulty} Difficulty</div>
            </button>
        `).join('');
    }

    _getWeaponSkillTotal() {
        const proficiency = this.weapon.system.proficiency;
        const actor = this.actor.system;
        
        console.log('Calculating skill total for:', proficiency);
        console.log('Actor skills:', actor.skills);
        
        const skill = actor.skills.combat[proficiency];
        if (!skill) {
            console.warn(`Skill ${proficiency} not found in combat skills`);
            return 0;
        }
        
        console.log('Found skill:', skill);
        
        // Calculate skill total
        const skillTotal = (skill.breeding || 0) + (skill.commando || 0) + 
                          (skill.primary || 0) + (skill.secondary || 0) + 
                          (skill.tertiary || 0) + (skill.modifier || 0);
        
        // Add governing attribute - rifles use Coordination
        let attributeValue = 0;
        if (proficiency === 'rifles' || proficiency === 'pistols' || proficiency === 'submachineguns') {
            attributeValue = actor.attributes.physical.coordination.value || 0;
        } else if (proficiency === 'heavyweapons' || proficiency === 'explosiveordinance' || proficiency === 'machinegunner') {
            attributeValue = actor.attributes.physical.might.value || 0;
        } else {
            // Default to coordination for most ranged weapons
            attributeValue = actor.attributes.physical.coordination.value || 0;
        }
        
        const totalDicePool = skillTotal + attributeValue;
        
        console.log('Skill total:', skillTotal);
        console.log('Attribute value:', attributeValue);
        console.log('Total dice pool:', totalDicePool);
        
        return totalDicePool;
    }

    activateListeners(html) {
        super.activateListeners(html);
        
        html.find('.shot-type-btn').click(this._onShotTypeSelect.bind(this));
        html.find('.range-btn').click(this._onRangeSelect.bind(this));
        html.find('.cover-btn').click(this._onCoverSelect.bind(this)); // NEW: Cover selection
        
        this._updateValidation(html);
    }

    _onShotTypeSelect(event) {
        const button = event.currentTarget;
        const shotType = button.dataset.shotType;
        const cost = parseInt(button.dataset.cost);
        
        if (button.disabled) return;
        
        this.selectedShotType = shotType;
        
        const html = this.element;
        html.find('.shot-type-btn').removeClass('selected');
        button.classList.add('selected');
        
        this._updateSummary(html, cost);
        this._updateDifficultyBreakdown(html);
        this._updateValidation(html);
    }

    _onRangeSelect(event) {
        const button = event.currentTarget;
        const range = button.dataset.range;
        
        this.selectedRange = range;
        
        const html = this.element;
        html.find('.range-btn').removeClass('selected');
        button.classList.add('selected');
        
        this._updateDifficultyBreakdown(html);
        this._updateSummary(html);
        this._updateValidation(html);
    }

    /**
     * NEW: Handle cover selection
     */
    _onCoverSelect(event) {
        const button = event.currentTarget;
        const cover = button.dataset.cover;
        
        this.selectedCover = cover;
        
        const html = this.element;
        html.find('.cover-btn').removeClass('selected');
        button.classList.add('selected');
        
        this._updateDifficultyBreakdown(html);
        this._updateSummary(html);
        this._updateValidation(html);
    }

    /**
     * NEW: Update difficulty breakdown display
     */
    _updateDifficultyBreakdown(html) {
        const breakdownElement = html.find('#difficulty-breakdown');
        breakdownElement.html(this._renderDifficultyBreakdown());
        
        // Update successes needed in summary
        const totalDifficulty = this._calculateTotalDifficulty();
        html.find('#successes-needed').text(totalDifficulty);
    }

    _updateSummary(html, cost = null) {
        if (cost === null && this.selectedShotType) {
            cost = this.weapon.system.shotTypes[this.selectedShotType].cost;
        }
        
        if (cost !== null) {
            const currentExertion = this.actor.system.exertion.value;
            const remaining = currentExertion - cost;
            
            html.find('#exertion-cost').text(cost);
            html.find('#remaining-exertion').text(remaining).toggleClass('negative', remaining < 0);
        }
    }

    _updateValidation(html) {
        const messages = html.find('#validation-messages');
        const attackButton = html.find('[data-button="attack"]');
        
        messages.empty();
        
        if (!this.selectedShotType) {
            messages.append('<p class="info">Select a shot type to continue.</p>');
            attackButton.prop('disabled', true);
            return;
        }
        
        const cost = this.weapon.system.shotTypes[this.selectedShotType].cost;
        const currentExertion = this.actor.system.exertion.value;
        
        if (currentExertion < cost) {
            messages.append('<p class="error">Insufficient exertion for this shot type!</p>');
            attackButton.prop('disabled', true);
            return;
        }
        
        const ammo = this.weapon.system.ammunition;
        if (ammo.current <= 0) {
            messages.append('<p class="error">No ammunition remaining!</p>');
            attackButton.prop('disabled', true);
            return;
        }
        
        const totalDifficulty = this._calculateTotalDifficulty();
        messages.append(`<p class="success">Ready to fire! Need ${totalDifficulty} successes to hit.</p>`);
        attackButton.prop('disabled', false);
    }

    async _executeAttack() {
        if (!this.selectedShotType) {
            ui.notifications.warn("Please select a shot type.");
            return;
        }
        
        const shotType = this.weapon.system.shotTypes[this.selectedShotType];
        const cost = shotType.cost;
        
        if (this.actor.system.exertion.value < cost) {
            ui.notifications.error("Insufficient exertion!");
            return;
        }
        
        if (this.weapon.system.ammunition.current <= 0) {
            ui.notifications.error("No ammunition!");
            return;
        }
        
        try {
            await this.actor.modifyExertion(-cost, false);
            
            const newAmmo = Math.max(0, this.weapon.system.ammunition.current - 1);
            await this.weapon.update({
                'system.ammunition.current': newAmmo
            });
            
            await this._rollAttack();
            
            this.close();
            
        } catch (error) {
            console.error("Attack execution failed:", error);
            ui.notifications.error("Attack failed to execute!");
        }
    }

    /**
     * ENHANCED: Roll attack with proper difficulty calculation
     */
    async _rollAttack() {
        const skillTotal = this._getWeaponSkillTotal();
        const weaponName = this.weapon.name;
        const shotTypeName = this._getShotTypeName(this.selectedShotType);
        const rangeName = this.selectedRange;
        const coverName = this._getCoverName();
        const proficiency = this.weapon.system.proficiency;
        
        // Calculate total difficulty
        const totalDifficulty = this._calculateTotalDifficulty();
        const baseDifficulty = 1;
        const rangeDifficulty = this._getRangeDifficulty();
        const stanceDifficulty = this._getStanceDifficulty();
        const coverDifficulty = this._getCoverDifficulty();
        
        const roll = new Roll(`${skillTotal}d6`);
        await roll.evaluate();
        
        let successes = 0;
        let failures = 0;
        const diceResults = [];
        
        // Count successes (5-6 on d6)
        roll.terms[0].results.forEach(die => {
            diceResults.push(die.result);
            if (die.result >= 5) {  // 5-6 are successes
                successes++;
                die.success = true;
            } else {
                failures++;
            }
        });
        
        // Determine hit/miss based on difficulty threshold
        const isHit = successes >= totalDifficulty;
        
        // Create detailed chat message with target information
        const chatData = {
            user: game.user.id,
            speaker: ChatMessage.getSpeaker({ actor: this.actor }),
            rolls: [roll],
            content: `
                <div class="weapon-attack-roll">
                    <h3>${weaponName} Attack</h3>
                    ${this.target ? `<p><strong>Target:</strong> ${this.target.actor.name} (${this.target.actor.type})</p>` : ''}
                    <p><strong>Skill:</strong> ${proficiency} (${skillTotal} dice)</p>
                    <p><strong>Shot Type:</strong> ${shotTypeName}</p>
                    <p><strong>Range:</strong> ${rangeName}</p>
                    <p><strong>Cover:</strong> ${coverName}</p>
                    ${this.target ? `<p><strong>Distance:</strong> ${this._calculateDistance()} yards</p>` : ''}
                    <p><strong>Stance:</strong> ${this._getTargetStance()}</p>
                    
                    <div style="margin: 10px 0; padding: 8px; background: rgba(52, 152, 219, 0.2); border: 1px solid #3498db; border-radius: 4px;">
                        <strong>Difficulty Breakdown:</strong><br>
                        Base: +${baseDifficulty} | Range: +${rangeDifficulty} | Stance: +${stanceDifficulty} | Cover: +${coverDifficulty}<br>
                        <strong>Total Difficulty: ${totalDifficulty}</strong>
                    </div>
                    
                    <p><strong>Dice Results:</strong> [${diceResults.join(', ')}]</p>
                    <p><strong>Successes:</strong> ${successes} | <strong>Needed:</strong> ${totalDifficulty}</p>
                    ${isHit ? 
                        `<p class="success"><strong>HIT!</strong> Click weapon damage button to roll damage.</p>` :
                        `<p class="failure"><strong>MISS!</strong> (${successes} successes vs ${totalDifficulty} needed)</p>`
                    }
                </div>
            `
        };
        
        await ChatMessage.create(chatData);
        
        // Don't automatically roll damage - let user click damage button
        if (isHit) {
            ui.notifications.info(`Hit! Use weapon damage button to roll ${this.weapon.system.damage}d6 damage.`);
        } else {
            ui.notifications.warn(`Miss! Only ${successes} successes vs ${totalDifficulty} needed.`);
        }
    }

    async _rollDamage() {
        const damage = this.weapon.system.damage;
        const damageRoll = new Roll(`${damage}d6`);
        await damageRoll.evaluate();
        
        const diceResults = damageRoll.terms[0].results.map(die => die.result);
        
        const chatData = {
            user: game.user.id,
            speaker: ChatMessage.getSpeaker({ actor: this.actor }),
            rolls: [damageRoll],
            content: `
                <div class="weapon-damage-roll">
                    <h3>${this.weapon.name} Damage</h3>
                    <p><strong>Damage Dice:</strong> ${damage}d6</p>
                    <p><strong>Dice Results:</strong> [${diceResults.join(', ')}]</p>
                    <p><strong>Total Damage:</strong> ${damageRoll.total}</p>
                </div>
            `
        };
        
        await ChatMessage.create(chatData);
    }

    /**
     * Public method to roll damage separately
     */
    static async rollDamage(weapon, actor) {
        const damage = weapon.system.damage;
        const damageRoll = new Roll(`${damage}d6`);
        await damageRoll.evaluate();
        
        const diceResults = damageRoll.terms[0].results.map(die => die.result);
        
        const chatData = {
            user: game.user.id,
            speaker: ChatMessage.getSpeaker({ actor: actor }),
            rolls: [damageRoll],
            content: `
                <div class="weapon-damage-roll">
                    <h3>${weapon.name} Damage</h3>
                    <p><strong>Damage Dice:</strong> ${damage}d6</p>
                    <p><strong>Dice Results:</strong> [${diceResults.join(', ')}]</p>
                    <p><strong>Total Damage:</strong> ${damageRoll.total}</p>
                </div>
            `
        };
        
        await ChatMessage.create(chatData);
        return damageRoll;
    }
}