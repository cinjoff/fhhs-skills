---
name: ui-redesign
description: Change art direction and design context for your project. Updates .planning/DESIGN.md with new design guidelines, visual references, and brand direction. Use when the user says 'redesign', 'change the look', 'new art direction', 'update design system', or 'restyle'.
user-invokable: true
---

Review and update the art direction for this project. Can be used for initial setup or to change existing design direction.

## Step 1: Explore the Codebase

Before asking questions, thoroughly scan the project to discover what you can:

- **README and docs**: Project purpose, target audience, any stated goals
- **Package.json / config files**: Tech stack, dependencies, existing design libraries
- **Existing components**: Current design patterns, spacing, typography in use
- **Brand assets**: Logos, favicons, color values already defined
- **Design tokens / CSS variables**: Existing color palettes, font stacks, spacing scales
- **Any style guides or brand documentation**

Note what you've learned and what remains unclear.

If `.planning/DESIGN.md` already exists, read it first and present the current art direction. Ask the user what they want to change before proceeding to questions.

## Step 2: Ask UX-Focused Questions

{{ask_instruction}} Focus only on what you couldn't infer from the codebase:

### Users & Purpose
- Who uses this? What's their context when using it?
- What job are they trying to get done?
- What emotions should the interface evoke? (confidence, delight, calm, urgency, etc.)

### Brand & Personality
- How would you describe the brand personality in 3 words?
- Any reference sites or apps that capture the right feel? What specifically about them?
- What should this explicitly NOT look like? Any anti-references?

### Aesthetic Preferences
- Any strong preferences for visual direction? (minimal, bold, elegant, playful, technical, organic, etc.)
- Light mode, dark mode, or both?
- Any colors that must be used or avoided?

### Accessibility & Inclusion
- Specific accessibility requirements? (WCAG level, known user needs)
- Considerations for reduced motion, color blindness, or other accommodations?

Skip questions where the answer is already clear from the codebase exploration.

## Step 3: Write Design Context

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

Write this to `.planning/DESIGN.md`. If the file exists, append or update the Design Context section.

Confirm completion and summarize the key design principles that will now guide all future work.

Suggest running `/ui-critique` to evaluate existing UI against the updated art direction.
