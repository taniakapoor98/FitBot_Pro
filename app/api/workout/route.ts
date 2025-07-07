import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

// Custom warmups and cooldowns
const customWarmups = [
  {
    id: 'cw1',
    name: 'Jumping Jacks',
    description: 'A full body warm-up exercise that increases heart rate.',
    category: { id: 0, name: 'Warmup' },
    equipment: 'Bodyweight',
    muscles: 'Full body',
    images: ['https://cdn.dribbble.com/userupload/23995967/file/original-b7327e47be94975940e98b26277e5ead.gif'],
    sessionType: 'warmup',
    recommendedReps: '20–30 seconds',
    recommendedSets: '2 sets',
  },
  {
    id: 'cw2',
    name: 'Arm Circles',
    description: 'Loosens shoulder joints and improves blood flow.',
    category: { id: 0, name: 'Warmup' },
    equipment: 'Bodyweight',
    muscles: 'Shoulders',
    images: ['https://static.vecteezy.com/system/resources/previews/006/417/754/non_2x/woman-doing-arm-circles-exercise-flat-illustration-isolated-on-white-background-free-vector.jpg'],
    sessionType: 'warmup',
    recommendedReps: '10 forward, 10 backward',
    recommendedSets: '2 sets',
  },
  {
    id: 'cw3',
    name: 'High Knees',
    description: 'Improves cardiovascular fitness and warms up the lower body.',
    category: { id: 0, name: 'Warmup' },
    equipment: 'Bodyweight',
    muscles: 'Legs, Core',
    images: ['https://static.vecteezy.com/system/resources/previews/006/417/644/non_2x/woman-doing-high-knees-front-knee-lifts-run-jog-on-the-spot-exercise-flat-illustration-isolated-on-white-background-free-vector.jpg'],
    sessionType: 'warmup',
    recommendedReps: '30 seconds',
    recommendedSets: '2 sets',
  },
  {
    id: 'cw4',
    name: 'Torso Twists',
    description: 'Warms up the core and improves rotational flexibility.',
    category: { id: 0, name: 'Warmup' },
    equipment: 'Bodyweight',
    muscles: 'Obliques, Lower back',
    images: ['https://osomnimedia.com/wp-content/uploads/2016/07/Upper-Torso-Twist-Stretch.jpg'],
    sessionType: 'warmup',
    recommendedReps: '15 reps each side',
    recommendedSets: '2 sets',
  },
  {
    id: 'cw5',
    name: 'Leg Swings',
    description: 'Activates hip flexors and hamstrings before lower body workouts.',
    category: { id: 0, name: 'Warmup' },
    equipment: 'Bodyweight',
    muscles: 'Hips, Hamstrings',
    images: ['https://i.pinimg.com/originals/00/4c/8a/004c8a160dc5a419a3b456e2272c8453.gif'],
    sessionType: 'warmup',
    recommendedReps: '10 forward-backward, 10 side-to-side per leg',
    recommendedSets: '2 sets',
  }
];

const customCooldowns = [
  {
    id: 'cc1',
    name: 'Standing Hamstring Stretch',
    description: 'Relieves hamstring tightness after workouts.',
    category: { id: 0, name: 'Cooldown' },
    equipment: 'Bodyweight',
    muscles: 'Hamstrings',
    images: ['https://static.vecteezy.com/system/resources/previews/034/326/039/non_2x/man-doing-standing-hamstring-stretch-exercise-vector.jpg'],
    sessionType: 'cooldown',
    recommendedReps: '15–20 seconds hold',
    recommendedSets: '2 sets',
  },
  {
    id: 'cc2',
    name: 'Child’s Pose',
    description: 'Stretches lower back and promotes relaxation.',
    category: { id: 0, name: 'Cooldown' },
    equipment: 'Bodyweight',
    muscles: 'Lower back',
    images: ['https://www.shutterstock.com/image-vector/woman-doing-childs-pose-stretch-600nw-2102646118.jpg'],
    sessionType: 'cooldown',
    recommendedReps: '30 seconds hold',
    recommendedSets: '1–2 sets',
  },
  {
    id: 'cc3',
    name: 'Seated Forward Bend',
    description: 'Stretches the spine, shoulders, and hamstrings.',
    category: { id: 0, name: 'Cooldown' },
    equipment: 'Bodyweight',
    muscles: 'Back, Hamstrings',
    images: ['https://s2.gifyu.com/images/3-Seated-forward-bend.gif'],
    sessionType: 'cooldown',
    recommendedReps: '30 seconds hold',
    recommendedSets: '1–2 sets',
  },
  {
    id: 'cc4',
    name: 'Cat-Cow Stretch',
    description: 'Improves flexibility and relieves tension in the spine.',
    category: { id: 0, name: 'Cooldown' },
    equipment: 'Bodyweight',
    muscles: 'Spine, Core',
    images: ['https://homeworkouts.org/wp-content/uploads/anim-cat-cow-pose.gif'],
    sessionType: 'cooldown',
    recommendedReps: '10 slow cycles',
    recommendedSets: '2 sets',
  },
  {
    id: 'cc5',
    name: 'Neck Rolls',
    description: 'Relaxes neck muscles and reduces stiffness.',
    category: { id: 0, name: 'Cooldown' },
    equipment: 'Bodyweight',
    muscles: 'Neck, Upper back',
    images: ['https://www.spotebi.com/wp-content/uploads/2015/03/neck-rolls-exercise-illustration.gif'],
    sessionType: 'cooldown',
    recommendedReps: '5 rolls each direction',
    recommendedSets: '2 sets',
  },
];

export async function POST(req: NextRequest) {
  const { bodyPart, isHIIT = false } = await req.json();
  let categoryIds: number[] = [];
  let equipment: number | undefined;
  let keywords: string[] = [];

  if (typeof bodyPart === 'number') {
    categoryIds = [bodyPart];
  } else if (Array.isArray(bodyPart)) {
    categoryIds = bodyPart.filter((item): item is number => typeof item === 'number');
    bodyPart.forEach((item) => {
      if (typeof item === 'object') {
        categoryIds.push(...(item.categories || []));
        equipment = item.equipment || equipment;
        keywords.push(...(item.keywords || []));
      }
    });
  } else if (typeof bodyPart === 'object') {
    categoryIds = bodyPart.categories || [];
    equipment = bodyPart.equipment;
    keywords = bodyPart.keywords || [];
  }

  if (categoryIds.length === 0 && !equipment && keywords.length === 0) {
    return NextResponse.json(
      { error: 'Invalid bodyPart or workout type specification' },
      { status: 400 }
    );
  }

  const isMorningWorkout = categoryIds.includes(101);

  const wgerBase =
    process.env.WGER_API_URL?.replace(/\/$/, '') || 'https://wger.de/api/v2';

  const fetchExercises = async (useStrictFilters: boolean, fallback = false) => {
    try {
      const exercisePromises = categoryIds.length > 0
        ? categoryIds.map(async (categoryId) => {
            const exRes = await axios.get(`${wgerBase}/exerciseinfo/`, {
              params: {
                language: 2,
                category: categoryId,
                equipment: equipment || undefined,
                limit: 200,
                status: 2,
              },
            });
            return exRes.data.results;
          })
        : [
            axios.get(`${wgerBase}/exerciseinfo/`, {
              params: {
                language: 2,
                equipment: equipment || undefined,
                limit: 200,
                status: 2,
              },
            }).then((res) => res.data.results),
          ];

      const exerciseResults = await Promise.all(exercisePromises);
      let exercises = exerciseResults.flat();

      if (keywords.length > 0) {
        exercises = exercises.filter((ex: any) =>
          keywords.some((kw) =>
            ((ex.name || '').toLowerCase() + ' ' + (ex.description || '').toLowerCase()).includes(kw.toLowerCase())
          )
        );
      }

      const uniqueExercises = Array.from(
        new Map(exercises.map((ex) => [ex.id, ex])).values()
      );

      const filtered = await Promise.all(
        uniqueExercises.map(async (ex: any) => {
          if (useStrictFilters) {
            const vidRes = await axios.get(`${wgerBase}/video/`, {
              params: { exercise: ex.id },
            });
            if ((vidRes.data.results || []).length > 0) return null;

            const imgRes = await axios.get(`${wgerBase}/exerciseimage/`, {
              params: { exercise: ex.id },
            });
            const imageUrls = (imgRes.data.results || []).map((img: any) => img.image);
            if (imageUrls.length === 0) return null;

            return {
              id: ex.id,
              name: ex.name,
              description: ex.description,
              category: ex.category,
              equipment: ex.equipment.map((eq: any) => eq.name).join(', ') || 'Bodyweight',
              muscles: ex.muscles.map((m: any) => m.name).join(', ') || 'General',
              images: imageUrls,
            };
          }

          return {
            id: ex.id,
            name: ex.name,
            description: ex.description,
            category: ex.category,
            equipment: ex.equipment.map((eq: any) => eq.name).join(', ') || 'Bodyweight',
            muscles: ex.muscles.map((m: any) => m.name).join(', ') || 'General',
            images: [],
          };
        })
      );

      return filtered.filter((ex) => ex !== null);
    } catch (err: any) {
      console.error(
        `Workout API Error (${fallback ? 'fallback' : 'primary'}):`,
        err.response?.status,
        err.response?.data ?? err.message
      );
      throw err;
    }
  };

  try {
    let available = await fetchExercises(true);

    if (available.length < 5) {
      console.warn('Not enough exercises with strict filters, trying relaxed filters...');
      available = await fetchExercises(false, true);
    }

    if (available.length < 5) {
      return NextResponse.json(
        {
          error: `Not enough exercises available for ${keywords.length > 0 ? keywords.join(', ') : 'categories ' + categoryIds.join(', ')}.`,
        },
        { status: 404 }
      );
    }

    const shuffle = (arr: any[]) => arr.sort(() => 0.5 - Math.random());
    const shuffled = shuffle(available);

    const main = shuffled.slice(0, Math.min(5, shuffled.length)).map((ex) => ({
      ...ex,
      sessionType: 'main',
      recommendedReps: isHIIT ? '20s work, 10s rest' : isMorningWorkout ? '8–10 reps' : '8–12 reps',
      recommendedSets: isHIIT ? '4 rounds' : isMorningWorkout ? '2–3 sets' : '3–4 sets',
    }));

    // Select 2-3 random warmups and cooldowns
    const randomWarmups = shuffle(customWarmups).slice(0, 3);
    const randomCooldowns = shuffle(customCooldowns).slice(0, 3);

    const workoutSession = [
      ...randomWarmups,
      ...main,
      ...randomCooldowns,
    ];

    return NextResponse.json({ workoutSession });
  } catch (err: any) {
    console.error(
      'Workout API Error:',
      err.response?.status,
      err.response?.data ?? err.message
    );
    return NextResponse.json(
      {
        error: `Failed to fetch workouts for ${keywords.length > 0 ? keywords.join(', ') : 'categories ' + categoryIds.join(', ')}`,
      },
      { status: 500 }
    );
  }
}
