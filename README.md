# Page Replacement Algorithms - Case Study

This project demonstrates the implementation and simulation of FIFO, LRU, and OPT (Optimal) page replacement algorithms using TypeScript and React. It includes animated visualizations, well-commented source code, and a case study document with screenshots of sample inputs/outputs.

-------
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

------

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
``bash
git clone https://github.com/MeowMeow0417/page-replacement-simulation.git 
cd Page-Replacement
npm install
npm run dev``

Then open your browser and go to: http://localhost:3000
----
📄 Documentation
The full case study with explanations and screenshots is available at:

docs/CaseStudyDocumentation.pdf

It includes:

Description of all three algorithms

Code structure and comments

Sample inputs/outputs

Screenshots from the animated simulation

Observations and conclusions
---
✨ Features
✅ Fully commented source code

✅ Animated visualizations

✅ Step-by-step simulation

✅ Custom cache size and input support

✅ Executables for both Windows and macOS
---
🛠 Tech Stack
React (with TypeScript)

Framer Motion (for animations)

Electron (for packaging the app)

Node.js + npm
---
📷 Screenshots
Screenshots are embedded in docs/CaseStudyDocumentation.pdf. These cover:

Input sequences for each algorithm

Output states of memory frames

Hits, misses, and page replacements
---
👤 Author
[Your Full Name]
GitHub: https://github.com/yourusername
Email: yourname@example.com
Created for the Final Case Study on Page Replacement Algorithms

