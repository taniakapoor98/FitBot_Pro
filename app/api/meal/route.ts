import { NextRequest, NextResponse } from 'next/server';
import { ChatOpenAI } from 'langchain/chat_models/openai';
import { HumanMessage } from 'langchain/schema';

const MEALDB_BASE = 'https://www.themealdb.com/api/json/v1/1';

// Step 1: Get all valid categories from MealDB
async function fetchAllCategories() {
  const res = await fetch(`${MEALDB_BASE}/list.php?c=list`);
  const data = await res.json();
  return data.meals.map((c: any) => c.strCategory);
}

async function fetchMealsByCategory(category: string) {
  const res = await fetch(`${MEALDB_BASE}/filter.php?c=${category}`);
  const data = await res.json();
  return data.meals || [];
}

interface Meal {
  idMeal: string;
  strMeal: string;
  [key: string]: any; // Add this to allow additional properties
}

async function fetchMealDetailsById(id: string) {
  const res = await fetch(`${MEALDB_BASE}/lookup.php?i=${id}`);
  const data = await res.json();
  return data.meals ? data.meals[0] : null;
}

export async function POST(req: NextRequest) {
  const { query } = await req.json();

  const model = new ChatOpenAI({
    openAIApiKey: process.env.OPENAI_API_KEY,
    temperature: 0.7,
    modelName: 'gpt-3.5-turbo',
  });

  const validCategories = await fetchAllCategories();

  // Step 2: Try to extract category from user query using GPT
  const categoryPrompt = `
The user wants a meal based on the prompt: "${query}".

Which one category from this list best fits the user's request?

${validCategories.join(', ')}

Return only the category name (exactly as is), or "unknown" if none matches.
`;

  const categoryResponse = await model.call([new HumanMessage(categoryPrompt)]);
  const chosenCategory = typeof categoryResponse.content === 'string' ? categoryResponse.content.trim() : '';

  let candidateMeals = [];

  if (validCategories.includes(chosenCategory)) {
    // GPT returned a valid category
    const shuffleArray = (array: any[]) => {
      for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
      }
      return array;
    };

    candidateMeals = shuffleArray(await fetchMealsByCategory(chosenCategory)).slice(0, 3);
  } else {
    // Fallback: use multiple categories
    const fallbackCategories = ['Beef', 'Chicken', 'Dessert', 'Lamb', 'Pasta', 'Pork', 'Seafood', 'Side', 'Vegan', 'Vegetarian', 'Breakfast'];
    for (const category of fallbackCategories) {
      const meals = await fetchMealsByCategory(category);
      candidateMeals.push(...meals);
    }

    // Deduplicate
    const uniqueMap = new Map();
    candidateMeals.forEach((m) => uniqueMap.set(m.idMeal, m));
    candidateMeals = Array.from(uniqueMap.values());

    // Shuffle and pick random 3 meals
    const shuffleArray = (array: any[]) => {
      for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
      }
      return array;
    };

    candidateMeals = shuffleArray(candidateMeals).slice(0, 3);
  }

  // Step 4: Fetch full recipe details
  const recipes = await Promise.all(
    candidateMeals.map((meal: Meal) => fetchMealDetailsById(meal.idMeal))
  );

  return NextResponse.json({
    message: 'Here are meal suggestions based on your query.',
    meals: recipes.filter(Boolean),
  });
}
