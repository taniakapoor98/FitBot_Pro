# 🏋️‍♀️ AI Fitness Assistant

![Next.js](https://img.shields.io/badge/Next.js-000?style=for-the-badge&logo=nextdotjs&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![OpenAI](https://img.shields.io/badge/OpenAI-412991?style=for-the-badge&logo=openai&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-38bdf8?style=for-the-badge&logo=tailwind-css&logoColor=white)

AI Fitness Assistant is a sleek, web-based application that delivers personalized **workouts**, **meal suggestions**, and **fitness advice** using intelligent APIs and OpenAI's GPT-4o mini.

---

## 🚀 Features

### 🏋️ Workout Recommendations
#### 🔗 API-Generated Workouts
- Fetches workouts from **WGER API**
- Categorized as `warmup`, `main`, or `cooldown`
- Includes:
  - Exercise name and description
  - Reps and sets
  - Equipment & muscle targets
  - Interactive image carousel

#### 🤖 AI Fallback Workouts
- Uses GPT-4o mini if WGER lacks sufficient data
- Provides basic but effective workout suggestions

---

### 🍽️ Meal Suggestions
- Fetches meals from **MealDB API**
- Displays:
  - Ingredients and measurements
  - Cooking instructions
  - Images, source links, and YouTube recipes

---

### 💬 General Fitness Advice
- Uses GPT-4o mini to answer general health and fitness queries

---

### 💡 Interactive Chat Interface
- Chat-based query input with animated typing
- Clean conversational layout with history

---

### 📱 Responsive Design
- Fully optimized for desktop and mobile
- Sidebar for chat history and navigation

---

### ⚠️ Error Handling
- Friendly messages for API or input issues
- Fallback responses ensure seamless UX

---

## 🛠️ Tech Stack

### Frontend
- **React**, **Next.js**
- **Tailwind CSS**
- **Swiper.js** for carousels

### Backend
- **Next.js API Routes**
- **OpenAI GPT-4o mini**
- **WGER API**, **MealDB API**

### Utilities
- **Axios** for API calls
- **Lucide Icons** for UI elements

---

## ⚙️ How It Works

1. **User enters a query** (e.g., _"Workout for legs"_ or _"Vegan meal suggestion"_)
2. **AI classifies intent** (`workout`, `meal`, or `general`)
3. **Fetches data**:
   - Workouts from WGER or fallback from GPT
   - Meals from MealDB
   - General advice from GPT
4. **Displays results** with tailored UI components

---

## 🧪 Installation

### Prerequisites
- Node.js (v16+)
- npm or yarn

### Setup

```bash
git clone https://github.com/your-repo/ai-fitness-assistant.git
cd ai-fitness-assistant
npm install
```

Create `.env.local`:
```env
OPENAI_API_KEY=your_openai_api_key
WGER_API_URL=https://wger.de/api/v2
```

Start the app:
```bash
npm run dev
```

Open: [http://localhost:3000](http://localhost:3000)

---

## 📁 Project Structure

```
.
├── app
│   ├── api
│   │   ├── chat/route.ts        # Chat handler (The main brain)
│   │   ├── workout/route.ts     # Workout tool
│   │   └── meal/route.ts        # Meal tool
│   └── page.tsx                 # Main UI component
├── public
│   └── placeholder-loading.gif
├── utils
│   └── memoryStore.ts           # Chat history handler
├── .env.local.example
├── README.md
```

---

## 🌟 Future Enhancements
- Add user login for personalized history
- Expand API sources (nutrition, yoga, etc.)
- Add voice input/output
- Enhance fallback intelligence

---

> Built with ❤️ by a fitness-focused developer passionate about AI and health.
