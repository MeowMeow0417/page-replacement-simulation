# Page Replacement Algorithms - Case Study

This project demonstrates the implementation and simulation of FIFO, LRU, and OPT (Optimal) page replacement algorithms using TypeScript and React. It includes animated visualizations, well-commented source code, and a case study document with screenshots of sample inputs/outputs.

## 📁 Project Structure

PageReplacementCaseStudy/
├── docs/
│   └── CaseStudyDocumentation.pdf         # Full report with screenshots
├── executables/
│   ├── PageReplacementApp-Windows.zip     # Windows build (zipped)
│   └── PageReplacementApp-Mac.zip         # macOS build (zipped)
├── src/
│   ├── FIFO.tsx
│   ├── LRU.tsx
│   ├── OPT.tsx
│   └── main.tsx
├── public/
│   └── assets (images, icons, etc.)
├── README.md
├── package.json
└── tsconfig.json

## 🧠 Algorithms Implemented

1. FIFO (First-In, First-Out)  
   - Evicts the page that has been in memory the longest.

2. LRU (Least Recently Used)  
   - Evicts the page that hasn't been used for the longest time.

3. OPT (Optimal Replacement)  
   - Evicts the page that will not be used for the longest time in the future.

Each algorithm is visualized in a step-by-step animated format, showing:
- 🟩 Cache hits
- 🟥 Cache misses
- 🔄 Evictions

## 💻 How to Run the Application

### Option 1: Run the Executable

1. Navigate to the `executables/` folder.
2. Download and unzip the relevant file:
   - PageReplacementApp-Windows.zip
   - PageReplacementApp-Mac.zip
3. Run the extracted `.exe` or `.dmg` file on your machine.

Note: Files are zipped to comply with GitHub's 25MB per-file limit.

### Option 2: Run From Source (Developer Mode)

Requirements:
- Node.js
- npm

Steps:
```bash
git clone https://github.com/yourusername/Page-Replacement-Algorithms-CaseStudy.git
cd Page-Replacement-Algorithms-CaseStudy
npm install
npm run dev
