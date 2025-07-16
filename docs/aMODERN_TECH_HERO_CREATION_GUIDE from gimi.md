# Guide: Creating the "Modern Tech Hero" Template

This document outlines the complete process used to create and integrate the **"Modern Tech Hero"** template into your application. It serves as a practical, real-world example of applying the principles from the main documentation.

## 1. The Goal: A Modern, Tech-Inspired Hero

The objective was to create a new hero section based on a user-provided image. The design was dark, futuristic, and visually rich, requiring a combination of modern CSS techniques and dynamic data.

**Key Design Features:**
- Dark, space-themed background with a central color glow.
- Animated, sparkling stars for a sense of depth.
- Floating, animated cards to display key statistics.
- A prominent, large-type title and a descriptive subtitle.
- Dual call-to-action buttons (primary and secondary).
- A small, styled "top text" element above the main title.

## 2. Step-by-Step Implementation

Following the process laid out in `CREATE_NEW_HERO_TEMPLATE_GUIDE.md`, here are the exact steps that were taken:

### Step 1: Create the React Component

A new file was created at `frontend/src/components/hero/templates/ModernTechHeroTemplate.jsx`.

**Component Breakdown:**
- **Structure**: It's a `memo`-ized React functional component to optimize performance.
- **Props**: It accepts `templateData`, `userInfo`, and `forceRefreshKey` as props.
- **Styling**: All styles are self-contained using inline CSS-in-JS for portability. This includes:
    - A main container with a black background and `overflow: hidden`.
    - A `backgroundGlow` element using a `radial-gradient` to create the purple nebula effect.
    - An array of `star` elements, positioned randomly with random animation delays to create a sparkling effect.
- **Animations**:
    - The floating stat cards use a CSS `float` animation.
    - The stars use a `sparkle` animation for a twinkling effect.
- **Icons**: It uses `react-icons/fa` for the stat cards, ensuring a consistent look with your app's existing icons.
- **Content**: All text, button links, and stats are dynamically rendered from the `templateData` prop, with sensible fallbacks.

### Step 2: Integrate with the Backend

The new template was registered in the backend by editing `backend/controllers/systemSettingsController.js`.

A new entry, `'modern-tech'`, was added to the `getDefaultTemplates` function. This provides the default structure and content for the template, ensuring it works immediately upon selection.

```javascript
// backend/controllers/systemSettingsController.js

'modern-tech': {
    code: 'modern-tech',
    name: 'Modern Tech Hero',
    description: 'A dark, modern hero section with a tech-inspired design...',
    content: {
        topText: 'Ignite Your Full Potential ->',
        title: 'Forge Your Ultimate Physique',
        subtitle: 'Explore personalized workout plans where cutting-edge technology merges with elite fitness expertise.',
        primaryButton: { text: 'Start Workout', link: '/workout' },
        secondaryButton: { text: 'Learn More', link: '/about' },
        showStats: true,
        stats: [
            { label: 'Workouts', value: '1,200+', icon: 'dumbbell' },
            { label: 'Members', value: '5,000+', icon: 'users' },
            { label: 'Programs', value: '50+', icon: 'list-check' },
            { label: 'Experts', value: '15+', icon: 'user-tie' }
        ]
    }
}
```

### Step 3: Integrate with the Frontend

To make the template selectable, `frontend/src/components/hero/MainHeroSection.jsx` was updated.

1.  The new component was imported using `React.lazy` for efficient code-splitting:
    ```javascript
    const ModernTechHeroTemplate = lazy(() => import('./templates/ModernTechHeroTemplate'));
    ```
2.  A `case` was added to the `switch` statement to render our new component when `selectedTemplate` is `'modern-tech'`:
    ```javascript
    case 'modern-tech':
      return ModernTechHeroTemplate;
    ```

### Step 4: Enhance the Admin Panel

To make the new `topText` field editable, the admin interface at `frontend/src/components/admin/SystemMainHeroManager.jsx` was modified.

A conditional `Form.Group` was added to the editor modal. It only appears when the template being edited is `'modern-tech'`, allowing the admin to change the `topText` value.

```javascript
{editingTemplate.code === 'modern-tech' && (
  <Form.Group className="mb-3">
    <Form.Label>Top Text</Form.Label>
    <Form.Control
      type="text"
      value={editingTemplate.content.topText || ''}
      onChange={(e) => handleTemplateFieldChange('content.topText', e.target.value)}
    />
  </Form.Group>
)}
```

## 3. Troubleshooting and Fixes

During development, two issues arose:

1.  **Invalid Icon Import**: The initial attempt used an icon (`FaListCheck`) that wasn't available in your version of `react-icons`.
    -   **Fix**: The import was corrected to use a valid icon, `FaTasks`.
2.  **React Rules of Hooks Violation**: The `useMemo` hook was called after a conditional `return` statement.
    -   **Fix**: The hook was moved to the top of the component, before any conditional returns, to ensure it's called on every render.

These fixes were applied to `ModernTechHeroTemplate.jsx` to ensure it functions correctly.

## 4. Reusable AI Prompt for Future Templates

You can use the following prompt to create similar templates. This is the same thought process I used, captured in a prompt you can give to an AI assistant like me.

---

### **AI Prompt: Create a Custom Hero Template**

**Your Goal:** I need you to create a new, production-ready hero template for my React application. The design should be based on the following visual inspiration and technical requirements.

**Visual Inspiration:**
*   **Design Style**: [e.g., Modern Tech, Minimalist, Corporate, etc.]
*   **Color Palette**: [e.g., Dark theme with purple accents, Light and airy, etc.]
*   **Key Visual Elements**: [Describe the main features, e.g., "A glowing background nebula, animated stars, and floating stat cards."]
*   **Typography**: [e.g., Bold, large-type title; smaller, lighter subtitle.]

**(Optional: If you have an image, mention it here: "The design should be inspired by the attached image.")**

**Content Requirements:**
The template must be fully editable from an admin panel. It needs to support the following dynamic content fields:
*   `topText`: A small line of text above the main title.
*   `title`: The main H1 heading.
*   `subtitle`: The paragraph below the title.
*   `primaryButton`: An object with `text` and `link`.
*   `secondaryButton`: An object with `text` and `link`.
*   `showStats`: A boolean to show or hide the stats section.
*   `stats`: An array of objects, where each object has a `label`, `value`, and `icon`.

**Technical Requirements:**
1.  **File Name**: Create the component in a new file named `[YourTemplateName]HeroTemplate.jsx`.
2.  **Framework**: Use React with functional components and hooks.
3.  **Performance**: The component must be wrapped in `React.memo`.
4.  **Styling**: Use self-contained, inline CSS-in-JS for all styles. Do not use external CSS files.
5.  **Responsiveness**: The template must be fully responsive and use modern CSS like `clamp()` for fluid typography.
6.  **Icons**: Use icons from the `react-icons/fa` library.
7.  **Props**: The component will receive `templateData`, `userInfo`, and `forceRefreshKey` as props.
8.  **Error Handling**: It should handle cases where `templateData` is not yet available and show a simple loading state.

**Provide the following deliverables:**
1.  The complete, production-ready code for the `[YourTemplateName]HeroTemplate.jsx` file.
2.  The default JSON object for this template to be added to the backend `getDefaultTemplates` function.
3.  A list of any new, specific content fields (like `topText`) that need to be added to the admin panel editor.

---
This guide and prompt should empower you to create any new hero template you envision. 