---
name: fh:ui-branding
description: Establish or update the design direction for your project. First run gathers design context and creates DESIGN.md. Use --update (or run again when DESIGN.md exists) to review and update existing design direction.
user-invocable: true
---

Gather or update design context for this project, then persist it for all future sessions.

## Entry Point: Detect Mode

Check whether `.planning/DESIGN.md` exists:

- **If it does NOT exist** (or `--update` was NOT passed): run **Establish Mode** — gather design context from scratch.
- **If it DOES exist** OR the user passed `--update`: run **Update Mode** — review current direction and interview for changes.

---

## Establish Mode (first run / no DESIGN.md)

### Step 1: Explore the Codebase

Before asking questions, thoroughly scan the project to discover what you can:

- **README and docs**: Project purpose, target audience, any stated goals
- **Package.json / config files**: Tech stack, dependencies, existing design libraries
- **Existing components**: Current design patterns, spacing, typography in use
- **Brand assets**: Logos, favicons, color values already defined
- **Design tokens / CSS variables**: Existing color palettes, font stacks, spacing scales
- **Any style guides or brand documentation**

Note what you've learned and what remains unclear.

### Step 2: Ask UX-Focused Questions

STOP and call the AskUserQuestionTool to clarify. Focus only on what you couldn't infer from the codebase:

#### Users & Purpose
- Who uses this? What's their context when using it?
- What job are they trying to get done?
- What emotions should the interface evoke? (confidence, delight, calm, urgency, etc.)

#### Brand & Personality
- How would you describe the brand personality in 3 words?
- Any reference sites or apps that capture the right feel? What specifically about them?
- What should this explicitly NOT look like? Any anti-references?

#### Aesthetic Preferences
- Any strong preferences for visual direction? (minimal, bold, elegant, playful, technical, organic, etc.)
- Light mode, dark mode, or both?
- Any colors that must be used or avoided?

#### Accessibility & Inclusion
- Specific accessibility requirements? (WCAG level, known user needs)
- Considerations for reduced motion, color blindness, or other accommodations?

Skip questions where the answer is already clear from the codebase exploration.

### Step 3: Write Design Context

Synthesize your findings and the user's answers into a `## Design Context` section:

```markdown
---
created: YYYY-MM-DD
type: design-context
---

## Design Context

### Users
[Who they are, their context, the job to be done]

### Brand Personality
[Voice, tone, 3-word personality, emotional goals]

### Aesthetic Direction
[Visual tone, references, anti-references, theme]

### Design Principles
[3-5 principles derived from the conversation that should guide all design decisions]
```

Write this to `.planning/DESIGN.md`.

Confirm completion and summarize the key design principles that will now guide all future work.

---

## Update Mode (--update flag OR DESIGN.md already exists)

### Step 1: Explore the Codebase

Thoroughly scan the project to understand the current state:

- **README and docs**: Project purpose, target audience, any stated goals
- **Package.json / config files**: Tech stack, dependencies, existing design libraries
- **Existing components**: Current design patterns, spacing, typography in use
- **Brand assets**: Logos, favicons, color values already defined
- **Design tokens / CSS variables**: Existing color palettes, font stacks, spacing scales
- **Any style guides or brand documentation**

Then read `.planning/DESIGN.md` and present the current art direction to the user. Summarize:
- Current brand personality and aesthetic direction
- Existing design principles
- What has been implemented vs. what may have drifted

Ask the user: "What would you like to change about the current design direction?"

### Step 2: Interview for Changes

STOP and call the AskUserQuestionTool. Focus on what the user wants to shift. You may re-ask any of the original questions where the answers are changing:

#### What's Changing
- Which aspects of the current direction feel off or outdated?
- Any new references or anti-references to add?
- Any principles that should be dropped, revised, or added?

#### Users & Purpose (if changing)
- Has the target audience or their context shifted?
- Are there new jobs to be done or emotional goals?

#### Brand & Personality (if changing)
- New personality words or tone shifts?
- New or removed reference sites?

#### Aesthetic Preferences (if changing)
- Changes to visual direction, color palette, or theme?

Skip questions where the existing answers still apply.

### Step 3: Update Design Context

Synthesize the new direction and update `.planning/DESIGN.md`, preserving the `created` date and adding an `updated` field. Revise only the sections that changed; keep unchanged sections intact.

Confirm completion and summarize what changed and what the updated design principles are.

Suggest running `/fh:ui-critique` to evaluate existing UI against the updated art direction.
