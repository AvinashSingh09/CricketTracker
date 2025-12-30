# Cricket Tracker 🏏

A simple, fast, and reliable cricket scoring web application designed for office cricket tournaments. Built with React + Vite, mobile-friendly, and works completely offline.

## 🚀 Quick Start

### Prerequisites
- Node.js (v18 or higher recommended)
- npm

### Installation & Running

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

The app will be available at `http://localhost:5173`

---

## 📱 How to Use

### Step 1: Add Players
1. Go to the **Players** tab
2. Enter player names one by one
3. Click "Add" to add each player to the pool
4. Edit or delete players as needed

### Step 2: Create Teams
1. Go to the **Teams** tab
2. You'll see all unassigned players at the top
3. Tap "→ A" to add a player to Team A
4. Tap "→ B" to add a player to Team B
5. Click on team names to rename them (e.g., "Sales Team" vs "Tech Team")

### Step 3: Setup Match
1. Go to the **Match** tab
2. (Optional) Enter a match name (e.g., "Office Finals 2024")
3. (Optional) Set overs limit (leave empty for unlimited overs)
4. Select which team bats first
5. Click **Start Match**

### Step 4: Score the Match
1. The app auto-navigates to the **Score** tab
2. **Select batsmen**: Tap on "Select striker..." and "Select non-striker..."
3. **Select bowler**: Tap on "Select bowler..."
4. **Score runs**: Use the large buttons:
   - **0, 1, 2, 3** - Regular runs
   - **4** (blue) - Four/Boundary
   - **6** (purple) - Six/Maximum
   - **W** (red) - Wicket
5. **Extras**: Use Wide (+1) or No Ball (+1) buttons
6. **Undo**: Made a mistake? Tap "↩ Undo"
7. **End Innings/Match**: Use buttons at the bottom when ready

### Step 5: View Summary
1. Go to the **Summary** tab (auto-navigates after ending match)
2. See final scores, batting/bowling scorecards
3. View Man of the Match (auto-calculated)
4. Start a new match or reset everything

---

## ✨ Features

- ✅ Add, edit, and delete players
- ✅ Create and name two teams
- ✅ Validate players can't be on both teams
- ✅ Set optional overs limit
- ✅ Live scoring with large touch-friendly buttons
- ✅ Track runs, balls, 4s, 6s for each batsman
- ✅ Track overs, runs, wickets for each bowler
- ✅ Handle extras (Wide, No Ball)
- ✅ Undo last ball
- ✅ Auto-rotate strike on odd runs and end of over
- ✅ Live scoreboard with current batsmen/bowler
- ✅ Match summary with scorecards
- ✅ Auto-calculate Man of the Match
- ✅ Data persists in browser (survives refresh)
- ✅ Works offline once loaded
- ✅ Mobile-first responsive design

---

## 🔧 Tech Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| React | 19.x | UI Framework |
| Vite | 7.x | Build Tool |
| Tailwind CSS | 4.x | Styling |
| LocalStorage | - | Data Persistence |

---

## 📋 Assumptions Made

1. **Single innings per match**: The app tracks one innings at a time. For a full two-innings match, end the first innings, then set up scoring again.

2. **Simple wickets**: No dismissal types (caught, bowled, LBW, etc.) - just records the wicket and credits the bowler.

3. **11 players max per team**: Standard cricket team size is assumed but not enforced.

4. **Extras count against bowler**: Wide and No-ball runs are added to the bowler's figures.

5. **Man of Match calculation**: 
   - Compares highest runs vs highest wickets × 20
   - Runs are preferred if contribution is equal

6. **No match history**: Only the current match is tracked. Starting a new match clears the previous one.

7. **Strike rotation**: 
   - Automatically rotates on 1, 3, 5 runs
   - Automatically rotates at end of over
   - Extras don't rotate strike

---

## 📂 Project Structure

```
src/
├── components/
│   └── Navigation.jsx      # Bottom navigation bar
├── context/
│   └── AppContext.jsx      # Global state management
├── pages/
│   ├── PlayersPage.jsx     # Add/edit/delete players
│   ├── TeamsPage.jsx       # Assign players to teams
│   ├── MatchSetupPage.jsx  # Configure match settings
│   ├── ScoringPage.jsx     # Live scoring interface
│   └── SummaryPage.jsx     # Match summary & stats
├── utils/
│   └── calculations.js     # Cricket math utilities
├── App.jsx                 # Main app with routing
├── main.jsx                # Entry point
└── index.css               # Global styles & design system
```

---

## 🎨 Design Decisions

- **Navy blue + Green theme**: Professional cricket feel
- **Large touch targets**: All buttons are 55-60px minimum for easy mobile use
- **Bottom navigation**: Thumb-friendly on mobile devices
- **Real-time updates**: All stats update immediately on screen
- **Minimal clicks**: Score a run in a single tap

---

## 🐛 Troubleshooting

**Data not saving?**
- Make sure localStorage is enabled in your browser
- Try in a private/incognito window to rule out extensions

**Page looks broken?**
- Hard refresh with Ctrl+Shift+R (Cmd+Shift+R on Mac)
- Clear browser cache

**Want to start fresh?**
- Click "Reset Everything" on the Summary page
- Or manually clear localStorage: `localStorage.clear()` in console

---

## 📄 License

MIT License - Free to use for your office tournaments! 🏆

---

Built with ❤️ for office cricket enthusiasts
