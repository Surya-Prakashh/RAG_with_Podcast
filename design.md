# UI/UX Design System Specification (`design.md`)

## Product: The Lenny Growth Assistant
**Design Aesthetic:** Modern Dark Glassmorphism, Deep Obsidian Dark Mode, Premium Neon Accents, ChatGPT/Claude Workspace Layout.

---

## 🎨 Color Palette & Design Tokens

### 1. Dark Mode Base Colors
- **Background Root (`--bg-root`)**: `#090A0F` (Deep Space Dark)
- **Sidebar Background (`--bg-sidebar`)**: `#0E1017` (Obsidian Charcoal)
- **Card / Surface Background (`--bg-surface`)**: `rgba(18, 22, 34, 0.75)` (Glassmorphism backdrop-blur)
- **Surface Hover (`--bg-surface-hover`)**: `rgba(28, 35, 52, 0.85)`
- **Border Subtle (`--border-subtle`)**: `rgba(255, 255, 255, 0.08)`
- **Border Glowing (`--border-glow`)**: `rgba(99, 102, 241, 0.35)`

### 2. Brand & Accent Palette
- **Primary Accent (`--accent-primary`)**: `#6366F1` (Electric Indigo)
- **Primary Gradient (`--gradient-primary`)**: `linear-gradient(135deg, #6366F1 0%, #8B5CF6 50%, #EC4899 100%)`
- **Secondary Accent (`--accent-emerald`)**: `#10B981` (Emerald Spark - for Ollama Local status & Success badges)
- **Secondary Gradient (`--gradient-glow`)**: `radial-gradient(circle at top right, rgba(99, 102, 241, 0.15), transparent 60%)`
- **Text Main (`--text-main`)**: `#F3F4F6` (Cool Gray 100)
- **Text Muted (`--text-muted`)**: `#9CA3AF` (Cool Gray 400)

---

## 📐 Typography & Hierarchy

- **Font Family**: Inter, system-ui, -apple-system, sans-serif.
- **Code & Monospace**: `JetBrains Mono`, `Fira Code`, monospace.
- **Headings**:
  - `h1`: 1.75rem / 2.25rem, SemiBold (600), `-0.02em` letter-spacing.
  - `h2`: 1.35rem / 1.75rem, SemiBold (600).
  - `h3`: 1.1rem / 1.5rem, Medium (500).
- **Body Text**: 0.95rem / 1.5rem line-height for clean readability.
- **Ship30for30 Essay Styling**: Bold emphasis for high skimmability, custom callout cards, 1.65 line height for long-form reading.

---

## 🖥️ Page Layout & Workspace Structure

```
+-----------------------------------------------------------------------------------------+
|                                    TOP NAVIGATION BAR                                   |
| Logo | Lenny Assistant Badge | Model Switcher (OpenRouter / Ollama) | Settings Gear ⚙️  |
+------------------+----------------------------------+-----------------------------------+
|                  |                                  |                                   |
|     SIDEBAR      |           CHAT STREAM            |          ARTIFACT VIEWER          |
|  - New Chat Button|  - User & Assistant Messages     |  - Header: Title, Type Badge,     |
|  - Session List  |  - Citations & Podcast Badges    |    Copy Code, Download, Expand    |
|  - Mode Selector |  - Code & Artifact Buttons       |  - Sandboxed Live HTML Preview /  |
|    (Q&A / Essay) |  - Input Box with Skill Actions  |    Rich Markdown Document View   |
|                  |                                  |                                   |
+------------------+----------------------------------+-----------------------------------+
```

### 1. Left Sidebar (Collapsible, 260px)
- **"New Chat" Button**: Gradient border button with `+` icon and keyboard shortcut (`Ctrl+N`).
- **Session List**: Active session highlighted with subtle indigo left bar (`3px border-left`) and glass background.
- **Model / Provider Status Indicator**: Pill badge showing green dot for Ollama Local or purple dot for OpenRouter Cloud.

### 2. Center Chat Panel (Flex-grow)
- **Message Cards**: Distinct styling between User (right-aligned or dark bubble) and Assistant (left-aligned glass card with avatar icon).
- **Podcast Grounding Citation Cards**: Collapsible metadata blocks displaying Guest Name, Episode Title, and exact matching transcript quote.
- **Interactive Artifact Card Trigger**: Whenever assistant generates an artifact, inline button appears: `"View Interactive Artifact (HTML/CSS)"` which opens or switches the Right Panel.

### 3. Right Artifact Viewer Panel (Resizable / Split Pane, 45% width)
- **Tabs**: `Preview` (Live Sandboxed Iframe) and `Code` (Syntax Highlighted Editor).
- **Header Actions**: Copy Code to Clipboard, Download File (`.html` / `.md`), Toggle Fullscreen, Close Panel.

---

## 💫 Micro-Animations & Interactivity

1. **Pulse Loading Indicator**: Glowing gradient pulse for assistant streaming state.
2. **Glass Hover Transitions**: Smooth `transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1)` on cards, sidebar items, and action buttons.
3. **Artifact Slide-In**: Smooth horizontal transition (`transform: translateX(0)`) when artifact opens.
