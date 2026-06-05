# Claude Design Prompt — RefinerIQ

Copy the prompt below in full and paste it into Claude Design.

---

## PROMPT START

Design a complete UI design system and screen set for **RefinerIQ** — an AI-powered document intelligence platform for oil & gas refinery staff.

---

### Product Context

RefinerIQ is a single-tenant enterprise web app. The primary interface is an AI chat window where refinery staff ask questions and get answers grounded in their internal documents (SOPs, HR policies, maintenance manuals). Every AI response includes citations showing which document and page the answer came from.

Users are refinery professionals — operators, HR staff, managers. The product must feel serious, trusted, and efficient. Not consumer. Not playful.

---

### Design Direction

**Style**: Minimal, clean, professional enterprise. High information density without clutter.

**Theme**: Dark mode primary. Deep navy/slate background with crisp white text. Subtle electric blue or teal as the primary accent color for interactive elements and AI components.

**AI Glimmer Effects**: Apply a subtle animated shimmer/gradient glow to AI-specific elements only:
- The AI response text while it is streaming (typing animation + soft shimmer underlay)
- The send button while waiting for a response (pulsing glow)
- The citation chips/tags (soft iridescent border)
- The document indexing status badge (gentle shimmer while processing)
- Do NOT apply glimmer to navigation, buttons, or static UI — only AI-active states

**Typography**: Inter or Geist. Mono font for citations and code. Clear hierarchy: 14px base, comfortable line height.

**Design System**: Define a reusable component library including: color tokens, typography scale, button variants (primary, ghost, danger), input styles, card styles, badge/chip variants, sidebar nav, avatar, toast/notification, empty states, loading skeletons.

---

### Screens to Design

Design all of the following screens in desktop resolution (1440px wide):

#### 1. Login Page
- Email + password form
- "Forgot password" link
- RefinerIQ logo / wordmark
- Subtle dark background with a very faint industrial/grid texture or refinery silhouette
- No social login

#### 2. Chat Interface (Main Screen — End User view)
This is the hero screen. It must feel like a premium AI product.
- Left sidebar: conversation history list, "New Chat" button, user avatar + name at bottom
- Main area: chat thread with streamed AI responses
- AI messages: avatar icon, response text with streaming shimmer, citation chips below the response (e.g. `📄 SOP-022 · Page 4`)
- User messages: right-aligned, clean bubble
- Input bar at bottom: text area, file attach icon, send button with AI glow state
- Department selector chip at top of chat (HR / Operations)
- Empty state: suggested starter questions ("What is the leave policy?", "Show me the shutdown SOP")

#### 3. Document Library (shared across Manager + Admin)
- Filter bar: department selector, file type filter, date range, search input
- Document grid or list toggle
- Each document card: filename, department badge, uploaded by, date, indexing status badge (Processing / Ready)
- Upload button (drag and drop zone)
- Bulk select + delete

#### 4. Dashboard — Admin View
- Stats row: Total Queries Today · Active Users · Token Usage · Documents Indexed
- Line chart: queries over last 7 days
- Top 5 most-queried documents (ranked list)
- Recent audit log (table: user, action, timestamp)
- System health cards: Ollama status (online/offline), Elasticsearch status

#### 5. Dashboard — Manager View
- Same layout as Admin but scoped to one department
- No audit log, no system health
- Shows department query count, top docs, user activity in dept

#### 6. Admin Panel — User Management
- Table of users: name, email, role badge, department, last active, status (active/inactive)
- Invite user button → slide-over panel: email, role selector, department selector
- Row actions: edit role, deactivate

#### 7. Admin Panel — Audit Log
- Table: timestamp, user, action, resource, department
- Filter bar: date range, user, action type
- Export button (CSV)

#### 8. Settings / Profile Page
- User profile: name, email, department, role (read-only)
- Change password form
- Notification preferences (simple toggles)
- Theme toggle (dark/light — dark default)

---

### Component Specifications

Design these components in a component panel:

- **Citation Chip**: Small pill tag showing `📄 filename · Page N`. Iridescent/glimmer border. Clickable to preview doc.
- **AI Response Card**: Message bubble with shimmer overlay during streaming. Confidence badge (High/Medium/Low).
- **Department Badge**: Color-coded pill — HR = teal, Operations = amber.
- **Role Badge**: Admin = purple, Manager = blue, End User = gray.
- **Indexing Status Badge**: Processing = shimmer amber, Ready = solid green.
- **Token Usage Bar**: Thin progress bar showing daily token consumption.
- **Empty State**: Illustration + heading + subtext + CTA button. Friendly but professional.
- **Loading Skeleton**: For chat history, document list, dashboard stats.

---

### Navigation Structure

```
Sidebar (left, collapsible):
├── Chat (default landing)
├── Documents
├── Dashboard
├── Admin Panel (Admin only)
│   ├── Users
│   ├── Audit Log
│   └── System
└── [User avatar + name + Settings]
```

---

### Responsive Note
Design for desktop (1440px) only. Mobile is out of scope.

---

### Deliverables Expected from Claude Design
1. Full design system (color tokens, typography, components)
2. All 8 screens at 1440px
3. Component variants (hover, active, loading, empty states)
4. Annotation of AI glimmer effect usage

## PROMPT END
