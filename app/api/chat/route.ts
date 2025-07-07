import { NextRequest, NextResponse } from 'next/server';
import { ChatOpenAI } from 'langchain/chat_models/openai';
import { HumanMessage, AIMessage } from 'langchain/schema';
import { getUserHistory, appendToHistory } from '../../../utils/memoryStore';

// Enhanced bodyPartMap with synonyms and composite categories
const bodyPartMap: Record<string, number | number[]> = {
  chest: 11, // API: Chest = 11
  leg: 9, // API: Legs = 9
  legs: 9, // API: Legs = 9
  back: 12, // API: Back = 12
  arm: 8, // API: Arms = 8
  arms: 8, // API: Arms = 8
  shoulder: 13, // API: Shoulders = 13
  shoulders: 13, // API: Shoulders = 13
  abs: 10, // API: Abs = 10
  ab: 10, // API: Abs = 10
  abdominal: 10, // API: Abs = 10
  biceps: 1, // Custom, no API conflict
  triceps: 5, // Custom, no API conflict
  core: 10, // Aligns with Abs
  fullbody: 100, // Custom: Maps to all API categories [8, 9, 10, 11, 12, 13, 14]
  full: 100, // Alias for fullbody
  upperbody: 102, // Custom: Maps to Arms, Chest, Back, Shoulders [8, 11, 12, 13]
  lowerbody: 103, // Custom: Maps to Legs, Calves [9, 14]
  morning: 101, // Custom: Light full-body workout [8, 9, 10, 11, 12, 13, 14]
  calves: 14, // API: Calves = 14
  cardio: 104, // Custom: Bodyweight exercises with cardio keywords
  cardiovascular: 104, // Alias for cardio
  yoga: 105, // Custom: Bodyweight exercises with yoga/stretch keywords
  yogic: 105, // Alias for yoga
  hiit: 106, // Custom: Dynamic bodyweight exercises for intervals
  interval: 106, // Alias for hiit
  highintensity: 106, // Alias for hiit
};

// Map custom IDs to API category IDs or filters
const compositeBodyParts: Record<number, number[] | { categories?: number[]; equipment?: number; keywords?: string[] }> = {
  100: [8, 9, 10, 11, 12, 13, 14], // fullbody/full
  101: [8, 9, 10, 11, 12, 13, 14], // morning (lighter reps in workout.ts)
  102: [8, 11, 12, 13], // upperbody
  103: [9, 14], // lowerbody
  104: { equipment: 7, keywords: ['jump', 'run', 'jumping', 'aerobic', 'cardio', 'high knee'] }, // cardio
  105: { equipment: 7, keywords: ['yoga', 'pose', 'stretch', 'plank', 'balance'] }, // yoga
  106: { categories: [8, 9, 10, 11, 12, 13, 14], equipment: 7, keywords: ['burpee', 'mountain climber', 'squat', 'jump', 'dynamic'] }, // hiit
};

export async function POST(req: NextRequest) {
  const { question, userId = 'guest' } = await req.json();

  const model = new ChatOpenAI({
    openAIApiKey: process.env.OPENAI_API_KEY,
    temperature: 0.7,
    modelName: 'gpt-4o-mini', // <-- Use GPT-4o mini
  });

  const classificationPrompt = new HumanMessage(`
## BOT PERSONA: FitBot Pro

You are FitBot Pro — an energetic, supportive, and knowledgeable AI Fitness Assistant.
You help users with personalized workouts, meal suggestions, and general fitness advice, always responding in a friendly, concise, and motivating tone.

---

## TOOLS OVERVIEW

- **Meal Tool:**  
  Use this tool to fetch meal ideas, recipes, ingredients, and cooking instructions.  
  Trigger this tool if the user asks for meal recommendations, recipes, or food-related suggestions.

- **Workout Tool:**  
  Use this tool to fetch workout routines, exercise recommendations, and fitness plans.  
  **Supported workout types for the Workout Tool:**  
  chest, leg, legs, back, arm, arms, shoulder, shoulders, abs, ab, abdominal, biceps, triceps, core, fullbody, full, upperbody, lowerbody, morning, calves, cardio, cardiovascular, yoga, yogic, hiit, interval, highintensity.  
  If the user asks for a workout type outside this list, you must use the Fallback to ChatGPT for workout generation.

- **General Chat (GPT-4o mini):**  
  Use this for general health, nutrition, or fitness questions that do not require a specific meal or workout suggestion.

---

## DECISION LOGIC

- If the user asks for a meal recommendation, recipe, or food advice:  
  → Use the Meal Tool.

- If the user asks for a workout, exercise, or fitness routine:  
  → Use the Workout Tool **only if the workout type is in the supported list above**.  
  → If not, use Fallback to ChatGPT for workout generation.

- If the user asks a general health, nutrition, or fitness question:  
  → Use General Chat (GPT-4o mini).

---

## OUTPUT RULES

- Respond with only one word: "meal", "workout", or "general".
- Do not explain your reasoning.
- If the workout type is not supported, still respond "workout" (the fallback logic is handled in code).

---

## EXAMPLES

User: "Can you suggest a healthy dinner?"  
→ meal

User: "Give me a HIIT workout for legs."  
→ workout

User: "Is it okay to exercise every day?"  
→ general

User: "Give me a pilates routine."  
→ workout

---

User query: "${question}"
`);

  const pastMessages = getUserHistory(userId).map((msg) =>
    msg.role === 'user' ? new HumanMessage(msg.content) : new AIMessage(msg.content)
  );

  const intentResponse = await model.invoke([...pastMessages, classificationPrompt]);
  const intent = String(intentResponse.content).trim().toLowerCase();

  appendToHistory(userId, { role: 'user', content: question });

  const baseUrl =
    process.env.NODE_ENV === 'development'
      ? `http://${req.headers.get('host')}`
      : `https://${req.headers.get('host')}`;

  if (intent === 'meal' || intent === 'workout') {
    const endpoint = intent;

    let body: { query: string } | { bodyPart: number | object | (number | object)[]; isHIIT?: boolean } = { query: question };

    if (intent === 'workout') {
      const lowerQ = question.toLowerCase();

      // Detect multiple body parts or workout types (e.g., "cardio and yoga")
      const bodyParts = Object.keys(bodyPartMap).filter((part) =>
        lowerQ.match(new RegExp(`\\b${part}\\b|,\\s*${part}\\b|and\\s+${part}\\b`, 'i'))
      );

      if (bodyParts.length === 0) {
        // Fallback to ChatGPT for any unsupported workout type
        const fallbackPrompt = new HumanMessage(`
You are a fitness expert. The user requested a "${question}" workout, but the exercise database lacks sufficient data. Generate a workout session with 2 warmup exercises, 5 main exercises, and 2 cooldown exercises. For each exercise, provide:
- Name
- Description (short, 1-2 sentences)
- Recommended reps or timing
- Recommended sets or rounds
- Session type (warmup, main, cooldown)
Return the response as a JSON array of objects.
        `);

        const fallbackResponse = await model.invoke([...pastMessages, fallbackPrompt]);
        let workoutSession;
        try {
          const rawContent = String(fallbackResponse.content);
          const jsonStart = rawContent.indexOf('[');
          const jsonEnd = rawContent.lastIndexOf(']');
          if (jsonStart === -1 || jsonEnd === -1) {
            throw new Error('No JSON content found in ChatGPT response');
          }
          const jsonString = rawContent.slice(jsonStart, jsonEnd + 1);
          workoutSession = JSON.parse(jsonString);
        } catch (parseError) {
          return NextResponse.json(
            { error: 'Failed to generate fallback workout.' },
            { status: 500 }
          );
        }

        appendToHistory(userId, {
          role: 'assistant',
          content: `Suggested workouts: ${workoutSession.map((w: any) => w.sessionType).join(', ')}`,
        });

        return NextResponse.json({ type: intent, workoutSession });
      }

      // Map body parts to category IDs or composite objects
      const bodyPartValues: (number | object)[] = bodyParts
        .map((part) => bodyPartMap[part])
        .flat()
        .map((id) => compositeBodyParts[id] || id)
        .filter((value, index, self) =>
          self.findIndex(v => JSON.stringify(v) === JSON.stringify(value)) === index
        ); // Remove duplicates

      body = {
        bodyPart: bodyPartValues.length === 1 ? bodyPartValues[0] : bodyPartValues,
        isHIIT: bodyParts.some((part) => ['hiit', 'interval', 'highintensity'].includes(part)),
      };

      try {
        const res = await fetch(`${baseUrl}/api/workout`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });

        if (!res.ok) {
          const errorData = await res.json();
          console.error(`Error fetching workout:`, errorData.error || res.statusText);

          // Fallback to ChatGPT for workout generation
          const workoutType = bodyParts.join(' and ');
          const isHIIT = body.isHIIT;
          const isMorning = bodyParts.includes('morning');

          const fallbackPrompt = new HumanMessage(`
You are a fitness expert. The user requested a ${workoutType} workout, but the exercise database lacks sufficient data. Generate a workout session with 2 warmup exercises, 5 main exercises, and 2 cooldown exercises. For each exercise, provide:
- Name
- Description (short, 1-2 sentences)
- Recommended reps or timing
- Recommended sets or rounds
- Session type (warmup, main, cooldown)
For ${workoutType}:
${isHIIT ? '- Use HIIT format: 20s work, 10s rest, 3-4 rounds.' : ''}
${isMorning ? '- Use lighter reps/sets for a morning routine.' : ''}
${workoutType.includes('cardio') ? '- Focus on bodyweight cardio exercises like jumping jacks or high knees.' : ''}
${workoutType.includes('yoga') ? '- Focus on bodyweight yoga poses or stretches like downward dog.' : ''}
${workoutType.includes('hiit') ? '- Include dynamic, high-intensity exercises like burpees.' : ''}
Return the response as a JSON array of objects.
          `);

          const fallbackResponse = await model.invoke([...pastMessages, fallbackPrompt]);
          let workoutSession;
          try {
            const rawContent = String(fallbackResponse.content);

            // Log the raw fallback response for debugging
            console.log('Raw fallback response from ChatGPT:', rawContent);

            const jsonStart = rawContent.indexOf('[');
            const jsonEnd = rawContent.lastIndexOf(']');
            if (jsonStart === -1 || jsonEnd === -1) {
              throw new Error('No JSON content found in ChatGPT response');
            }

            const jsonString = rawContent.slice(jsonStart, jsonEnd + 1);

            // Log the extracted JSON string
            console.log('Extracted JSON string:', jsonString);

            workoutSession = JSON.parse(jsonString);
          } catch (parseError) {
            console.error('Failed to parse ChatGPT response:', parseError);
            return NextResponse.json(
              { error: 'Failed to generate fallback workout.' },
              { status: 500 }
            );
          }

          appendToHistory(userId, {
            role: 'assistant',
            content: `Suggested workouts: ${workoutSession.map((w: any) => w.sessionType).join(', ')}`,
          });

          return NextResponse.json({ type: intent, workoutSession });
        }

        const data = await res.json();

        // Log the workout response from the API
        console.log('Workout API response:', data);

        const content = `Suggested workouts: ${data.workoutSession?.map((w: any) => w.sessionType).join(', ') || 'No workouts found.'}`;

        appendToHistory(userId, { role: 'assistant', content });

        return NextResponse.json({ type: intent, ...data });
      } catch (fetchError) {
        console.error('Fetch error:', fetchError);
        return NextResponse.json(
          { error: 'An error occurred while fetching workout data.' },
          { status: 500 }
        );
      }
    }

    // Handle meal intent
    const res = await fetch(`${baseUrl}/api/${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      console.error(`Error fetching meal data:`, res.statusText);
      throw new Error(`Failed to fetch data from ${endpoint}: ${res.statusText}`);
    }

    const data = await res.json();

    const content =
      intent === 'meal'
        ? `Suggested meals: ${data.meals?.map((m: any) => m.strMeal).join(', ') || 'No meals found.'}`
        : `Suggested workouts: ${data.workoutSession?.map((w: any) => w.sessionType).join(', ') || 'No workouts found.'}`;

    appendToHistory(userId, { role: 'assistant', content });

    return NextResponse.json({ type: intent, ...data });
  }

  // Fallback to general fitness advice
  const answerResponse = await model.invoke([
    ...pastMessages,
    new HumanMessage(`
You are a friendly and helpful fitness and health expert. The user has asked the following question:

"${question}"

Please provide a concise and accurate response in no more than 100 words. Use a friendly tone and include emojis to make the response engaging.

Examples:
- "Eating cake in the morning is not ideal 🍰. It can cause energy spikes and crashes. Try a balanced breakfast like oatmeal or eggs instead! 🥣🍳"
- "Running in the morning is a great way to start your day! 🏃‍♂️ Just make sure to warm up properly and stay hydrated. 💧"

Now, respond to the user's question in the same style.
`),
  ]);

  const friendlyAnswer = String(answerResponse.content).trim().replace(/^"|"$/g, '');

  // Append the response to the chat history
  appendToHistory(userId, { role: 'assistant', content: friendlyAnswer });

  // Return the response
  return NextResponse.json({
    type: 'general',
    answer: friendlyAnswer,
  });
}