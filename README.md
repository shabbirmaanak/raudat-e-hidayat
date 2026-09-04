# Raudat-e-Hidayat (روضة هدايات) Search Engine & Knowledge Base

An interactive, responsive full-text search engine and digital knowledge base for the complete collection of **Raudat-e-Hidayat** (*روضة هدايات*), extracted directly from the Google Apps Script database.

---

## 🌟 Overview of Extracted Dataset

- **Total Records:** `600` sacred Kalam (Sayings)
- **Volumes Included:**
  1. **روضة هدايات 1:** 200 Kalam of **Rasulullah SA** (*رسول الله صلع*)
  2. **روضة هدايات 2:** 200 Kalam of **Amir al-Mumineen Mawlana Ali SA** (*علي ابن ابي طالب ص ع*)
  3. **روضة هدايات 3:** 200 Kalam of **Aimmat Fatimiyyeen SA & Duat Mutlaqeen RA** (*الائمة الطاهرين والدعاة المطلقين*)
- **Languages & Fields:**
  - **Arabic Text** (with full diacritics / tashkeel)
  - **Lisan al-Dawat (LD) Translation**
  - **English Translation & Commentary**
  - **Stated By** (Speaker / Personality citation)
  - **Volume & Serial Number Reference**

---

## 🚀 Key Features

### 🔍 1. Smart Full-Text Search Engine
- **Arabic Diacritic Normalization:** Search without worrying about *harakat / tashkeel* (e.g. typing `احب الاعمال` instantly matches `اَحبُّ الاعمالِ`).
- **Flexible Normalization:** Automatically handles variants of Alef (`إ`, `أ`, `آ`, `ٱ`, `ا`), Yaa (`ي`, `ى`), Taa Marbuta (`ة`, `ه`), and Hamzas.
- **Lisan al-Dawat & English Search:** Search by Gujarati Dawat phrases or English keywords.
- **Search Scopes:** Filter search specifically by *All Fields*, *Arabic Only*, *Lisan al-Dawat Only*, *English Only*, or *Speaker Only*.
- **Search Highlighting:** Exact and root matched terms are highlighted in real-time across Arabic, LD, and English text.

### 📚 2. Exploration & Filtering
- **Volume Tabs:** Instant filtering for All Volumes, Volume 1 (200), Volume 2 (200), or Volume 3 (200).
- **Speaker / Personality Filter:** Dropdown with counts for all 36 distinct speakers and authors.
- **Topic Quick Pills:** One-click shortcuts for essential themes such as *Taqwa (تقوى)*, *Ilm (علم)*, *Brotherhood (اخوة)*, *Husn al-Khuluq (حسن الخلق)*, *Charity / Sadaqah (صدقة)*, *Sabr (صبر)*, *Dua (دعاء)*, *Imaan (ايمان)*, *Niyyat (نية)*, *Halal Rizq (رزق)*, *Tawbah (توبة)*, and *Parents / Family (والدين)*.
- **Multi-criteria Sorting:** Sort by Default order, Serial Number (Asc/Desc), Arabic Alphabetical, or English Alphabetical.

### 🎨 3. Modern Islamic UI / UX
- **Card View vs Table View:** Switch seamlessly between rich visual cards and a compact spreadsheet-style table.
- **Dark Mode / Light Mode:** Built-in theme switcher with gold and emerald accents, saved to local preferences.
- **Typography:** Uses high-clarity Arabic calligraphy fonts (*Amiri*, *Noto Naskh Arabic*) and modern sans-serif (*Plus Jakarta Sans*).
- **Detail View Modal:** Click any Kalam to open an immersive reading modal with Previous/Next navigation and full text.
- **Random Kalam Generator:** Explore new wisdom with the randomizer button (`Random` or key `r`).

### 💾 4. Bookmarks, Citations & Export
- **Favorites / Bookmarking:** Bookmark Kalam with one click; saved locally in your browser (`localStorage`).
- **One-Click Formatted Citation:** Copy ready-to-share formatted citations with volume, speaker, Arabic, LD, and English translation for WhatsApp, Telegram, or research notes.
- **Export Data:** Export filtered search results to **CSV** or **JSON**.
- **Dataset Analytics:** View comprehensive breakdown of volumes, top speakers, and word counts.

### ⚡ 5. 100% Offline Capable
- Fully self-contained single-page web app with zero backend requirements. Can be run by directly opening `index.html` in any browser or hosted on any static web host.

---

## 💻 How to Run

### Option 1: Open Directly in Browser (No Server Needed)
Simply double-click [`index.html`](file:///Users/shabbirmaanak/Documents/Raudat%20e%20Hidayat/index.html) or open it in Google Chrome, Safari, Firefox, or Edge.

### Option 2: Run Local Python Server
Run the included python server script in the terminal:
```bash
python3 server.py
```
This will automatically launch `http://localhost:8000/index.html` in your default web browser.

---

## ⌨️ Keyboard Shortcuts
- `/` : Focus the search bar
- `Escape` : Clear search input / close modals
- `r` : Show a random Kalam
- `t` : Toggle Dark / Light mode
- `←` / `→` : Navigate previous / next Kalam inside the detail modal

---

## 📁 Project Structure

```
.
├── index.html            # Main search engine application
├── css/
│   └── styles.css        # Responsive styling & themes
├── js/
│   └── app.js            # Search engine logic & Arabic normalizer
├── data/
│   ├── raudat_data.json  # Complete extracted dataset (600 Kalam)
│   └── raudat_data.js    # Direct browser JavaScript data bundle
├── parse_data.py         # Script to parse & extract table rows from source HTML
├── enrich_data.py        # Normalization and dataset enrichment script
├── server.py             # Lightweight local HTTP server
└── README.md             # Documentation
```
