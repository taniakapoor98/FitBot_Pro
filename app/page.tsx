'use client';

import { useState, useRef, useEffect } from 'react';
import { Menu } from 'lucide-react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

export default function Home() {
  const [fitnessQuestion, setFitnessQuestion] = useState('');
  const [fitnessAnswer, setFitnessAnswer] = useState('');
  const [meal, setMeal] = useState<any>(null);
  const [workouts, setWorkouts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState<any[]>([
    {
      type: 'bot',
      text: `Hello there! 👋 I'm your AI Fitness Assistant. You can ask me questions like:
      
- "Give me a chest and back workout."
- "Suggest a protein-rich dinner."
- "Is it healthy to eat cake in the morning?"`,
    },
  ]);
  const [showSidebar, setShowSidebar] = useState(true);
  const [currentThoughtIndex, setCurrentThoughtIndex] = useState(0);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const fitnessThoughts = [
    '"The only bad workout is the one that didn’t happen."',
    '"You don’t have to be extreme, just consistent."',
    '"Discipline is choosing between what you want now and what you want most."',
    '"Take care of your body. It’s the only place you have to live."',
    '"Success starts with self-discipline."',
    '"Small steps every day lead to big changes."',
    '"Strive for progress, not perfection."',
    '"Fall in love with taking care of yourself."',
    '"It’s never too early or too late to work towards being the healthiest you."',
    '"Push yourself because no one else is going to do it for you."',
  ];
  

  const getFitnessFact = async () => {
    if (!fitnessQuestion.trim()) {
      alert('Please enter a question before submitting.');
      return;
    }

    setLoading(true);
    setFitnessAnswer('');
    setMeal(null);
    setWorkouts([]);

    setChatHistory((prev) => [...prev, { type: 'user', text: fitnessQuestion }]);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: fitnessQuestion }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        console.error('Error from /api/chat:', errorData);
        alert(errorData.error || 'An error occurred while processing your request.');
        setLoading(false);
        return;
      }

      const data = await res.json();

      if (data.type === 'workout') {
        const normalizedWorkouts = (data.workoutSession || []).map((workout: any) => ({
          id: workout.id,
          name: workout.name,
          description: workout.description,
          category: workout.category?.name || 'General',
          equipment: workout.equipment || 'Bodyweight',
          muscles: workout.muscles || 'General',
          images: workout.images || [],
          sessionType: workout.sessionType || workout.session_type,
          recommendedReps: workout.recommendedReps || workout.recommended_reps,
          recommendedSets: workout.recommendedSets || workout.recommended_sets,
        }));
        const sessionTypeOrder = { warmup: 1, main: 2, cooldown: 3 };
        const sortedWorkouts = normalizedWorkouts.sort((a: any, b: any) =>
          sessionTypeOrder[a.sessionType as keyof typeof sessionTypeOrder] - sessionTypeOrder[b.sessionType as keyof typeof sessionTypeOrder]
        );
        setWorkouts(sortedWorkouts);
      } else if (data.type === 'meal') {
        setMeal(data);
      } else {
        setFitnessAnswer(data.answer);
      }

      setChatHistory((prev) => [
        ...prev,
        { type: 'bot', text: data.type === 'meal' ? 'Here are your meal suggestions' : data.answer },
      ]);
    } catch (error) {
      console.error('Error fetching fitness fact:', error);
      alert('An error occurred. Please try again later.');
    } finally {
      setLoading(false);
      setFitnessQuestion('');
    }
  };

  // Scroll to the bottom whenever chatHistory changes
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatHistory]);

  // Cycle through thoughts every 6 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentThoughtIndex((prevIndex) => (prevIndex + 1) % fitnessThoughts.length);
    }, 6000); // Match the animation duration (6 seconds)
    return () => clearInterval(interval);
  }, []);

  return (
    <main className="flex flex-col md:flex-row min-h-screen text-gray-100 bg-black">
      {/* Sidebar */}
      {showSidebar && (
        <div className="w-full md:w-[31%] md:max-w-[360px] bg-black border-r border-gray-700 shadow-lg flex flex-col sticky top-0 h-screen">
          <div className="p-4 border-b border-gray-700 bg-black">
            <h1 className="text-2xl font-bold text-orange-400 text-center">🏋️‍♂️ FitBot Pro </h1>
          </div>

          {/* Chat Container */}
          <div
            ref={chatContainerRef}
            className="chat-container flex-1 h-[70vh] md:h-[85vh] overflow-y-auto p-4 bg-black"
          >
            {chatHistory.map((msg, index) => (
              <div key={index} className={`mb-2 ${msg.type === 'user' ? 'text-right' : 'text-left'}`}>
                <div
                  className={`inline-block p-2 rounded-lg ${
                    msg.type === 'user' ? 'bg-orange-500 text-white' : 'bg-gray-700 text-gray-200'
                  }`}
                >
                  {msg.type === 'bot' && msg.text ? (
                    <div>
                      {msg.text.split('\n').map((line: string, i: number) => (
                        <p key={i} className={line.match(/^\d+\./) || line.match(/^[-•]/) ? 'ml-4' : ''}>
                          {line}
                        </p>
                      ))}
                    </div>
                  ) : (
                    msg.text || 'Here is your workout routine.'
                  )}
                </div>
              </div>
            ))}

            {loading && (
              <div className="text-left">
                <div className="inline-block bg-gray-700 text-gray-300 rounded-lg px-3 py-2">
                  <div className="dot-typing">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Input Section */}
          <div className="p-4 border-t border-gray-700 bg-black">
            <input
              type="text"
              value={fitnessQuestion}
              onChange={(e) => setFitnessQuestion(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  getFitnessFact();
                }
              }}
              placeholder="e.g., Suggest a workout"
              className="border border-gray-600 bg-gray-800 text-gray-300 p-2 w-full rounded-md mb-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
            <button
              onClick={getFitnessFact}
              className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white py-2 rounded-md hover:from-orange-600 hover:to-orange-700 transition"
            >
              Ask
            </button>
          </div>
        </div>
      )}

      {/* Right Frame */}
      <div className="w-full md:flex-1 p-4">
        {/* Show video when no meals or workouts are loaded */}
        {!meal && !workouts.length && (
          <div className="flex justify-center items-center h-[60vh] md:h-full">
            <div className="relative w-full h-full">
              <video
                src="/utils/bg_vid.mp4"
                autoPlay
                loop
                muted
                className="w-full h-full object-cover rounded-lg shadow-lg"
              />
              <div className="absolute top-[20%] w-full text-center">
                <p className="text-gray-400 italic text-lg md:text-xl fade-animation">
                  {fitnessThoughts[currentThoughtIndex]}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Content Loaded */}
        {meal && meal.meals && (
          <div className="mt-4 h-[60vh] md:h-[88vh] overflow-y-auto">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {meal.meals.map((m: any, i: number) => (
                <div
                  key={i}
                  className="relative p-8 rounded-xl border border-gray-700 shadow-lg overflow-hidden"
                >
                  {/* Transparent Gradient Background */}
                  <div className="absolute inset-0 bg-gradient-to-br from-red-500 to-orange-500 rounded-xl" style={{ opacity: 0.5 }}></div>

                  {/* Content Layer */}
                  <div className="relative z-10">
                    <h3 className="font-medium text-lg mb-4 text-center text-orange-100">{m.strMeal}</h3>
                    <img src={m.strMealThumb} alt={m.strMeal} className="w-full rounded-lg mb-4" />
                    <div className="mb-4">
                      <h4 className="font-semibold text-gray-200">Ingredients:</h4>
                      <div className="flex flex-col space-y-1 text-gray-300">
                        {Object.keys(m)
                          .filter((key) => key.includes('strIngredient') && m[key])
                          .map((ingredientKey, index) => (
                            <span key={index}>
                              • {m[ingredientKey]} - {m[`strMeasure${ingredientKey.slice(13)}`]}
                            </span>
                          ))}
                      </div>
                    </div>
                    <div className="mb-4">
                      <h4 className="font-semibold text-gray-200">Instructions:</h4>
                      <p className="text-sm text-gray-300">{m.strInstructions}</p>
                    </div>
                    <div className="mt-2">
                      <a
                        href={m.strSource}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-orange-400 text-sm block"
                      >
                        Recipe Source
                      </a>
                    </div>
                    <div className="mt-1">
                      <a
                        href={m.strYoutube}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-orange-400 text-sm block"
                      >
                        Watch on YouTube
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {workouts.length > 0 && (
          <div className="mt-4 h-[60vh] md:h-[88vh] overflow-y-auto">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {workouts.map((workout, i) => {
                const previousWorkout = i > 0 ? workouts[i - 1] : null;
                const showHeader = i === 0 || workout.sessionType !== previousWorkout?.sessionType;

                return (
                  <>
                    {showHeader && (
                      <div className="col-span-full">
                        <h2 className="text-xl font-bold text-center text-orange-400 capitalize mb-4">
                          {workout.sessionType} Exercises
                        </h2>
                      </div>
                    )}
                    <div
                      key={i}
                      className="relative p-8 rounded-xl border border-gray-700 shadow-lg overflow-hidden bg-black/50 backdrop-blur-md"
                    >
                      {/* Transparent Gradient Background */}
                      <div className="absolute inset-0 bg-gradient-to-br from-red-500 to-orange-500 rounded-xl" style={{ opacity: 0.5 }}></div>

                      {/* Content Layer */}
                      <div className="relative z-10">
                        <h3 className="font-medium text-lg mb-4 text-center text-orange-100">{workout.name}</h3>
                        {workout.images.length > 0 ? (
                          <Swiper
                            modules={[Navigation, Pagination, Autoplay]}
                            navigation
                            pagination={{ clickable: true }}
                            autoplay={{ delay: 3000, disableOnInteraction: false }}
                            className="w-full h-180 mb-4 rounded-lg"
                          >
                            {workout.images.map((img: string, imgIndex: number) => (
                              <SwiperSlide key={`${workout.id}-${imgIndex}`}>
                                <img
                                  src={img}
                                  alt={`${workout.name} image ${imgIndex + 1}`}
                                  className="w-full h-full object-cover rounded-lg"
                                />
                              </SwiperSlide>
                            ))}
                          </Swiper>
                        ) : (
                          <div className="w-full h-180 bg-gray-700 rounded-lg mb-4 flex items-center justify-center">
                            <span className="text-gray-500">No images available</span>
                          </div>
                        )}
                        <div className="mb-4">
                          <h4 className="font-semibold text-gray-200">Description:</h4>
                          <p className="text-sm text-gray-300">{workout.description}</p>
                        </div>
                        <div className="mb-4">
                          <h4 className="font-semibold text-gray-200">Category:</h4>
                          <p className="text-sm text-gray-300">{workout.category}</p>
                        </div>
                        <div className="mb-4">
                          <h4 className="font-semibold text-gray-200">Equipment:</h4>
                          <p className="text-sm text-gray-300">{workout.equipment}</p>
                        </div>
                        <div className="mb-4">
                          <h4 className="font-semibold text-gray-200">Muscles:</h4>
                          <p className="text-sm text-gray-300">{workout.muscles}</p>
                        </div>
                        {workout.recommendedReps && (
                          <div className="mb-4">
                            <h4 className="font-semibold text-gray-200">Reps:</h4>
                            <p className="text-sm text-gray-300">{workout.recommendedReps}</p>
                          </div>
                        )}
                        {workout.recommendedSets && (
                          <div className="mb-4">
                            <h4 className="font-semibold text-gray-200">Sets:</h4>
                            <p className="text-sm text-gray-300">{workout.recommendedSets}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                );
              })}
            </div>
          </div>
        )}

        {fitnessAnswer && !meal && !workouts.length && (
          <div className="bg-gray-800 p-4 rounded-xl border border-gray-700 shadow-md h-full flex items-center">
            <p className="text-gray-300">{fitnessAnswer}</p>
          </div>
        )}
      </div>

      <style>{`
        .dot-typing {
          display: inline-block;
          position: relative;
          width: 3rem;
          height: 1rem;
        }

        .dot-typing span {
          position: absolute;
          width: 0.6rem;
          height: 0.6rem;
          background-color: #f97316;
          border-radius: 50%;
          animation: blink 1.4s infinite both;
        }

        .dot-typing span:nth-child(1) {
          left: 0;
          animation-delay: 0s;
        }

        .dot-typing span:nth-child(2) {
          left: 0.9rem;
          animation-delay: 0.2s;
        }

        .dot-typing span:nth-child(3) {
          left: 1.8rem;
          animation-delay: 0.4s;
        }

        @keyframes blink {
          0%, 80%, 100% {
            opacity: 0;
          }
          40% {
            opacity: 1;
          }
        }

        /* Custom Scrollbar for Chat History */
        .chat-container::-webkit-scrollbar {
          width: 8px;
        }

        .chat-container::-webkit-scrollbar-track {
          background: #1f2937; /* Dark gray background */
          border-radius: 4px;
        }

        .chat-container::-webkit-scrollbar-thumb {
          background: #f97316; /* Orange thumb */
          border-radius: 4px;
        }

        .chat-container::-webkit-scrollbar-thumb:hover {
          background: #fb923c; /* Lighter orange on hover */
        }

        /* For Firefox */
        .chat-container {
          scrollbar-width: thin;
          scrollbar-color: #f97316 #1f2937;
        }

        @keyframes fadeInOut {
          0%, 20% {
            opacity: 0;
            transform: translateY(10px); /* Slight downward movement */
          }
          30%, 80% {
            opacity: 1;
            transform: translateY(0); /* Reset position */
          }
          90%, 100% {
            opacity: 0;
            transform: translateY(-10px); /* Slight upward movement */
          }
        }

        .fade-animation {
          animation: fadeInOut 6s ease-in-out infinite;
        }


        @keyframes fade {
          0%, 100% {
            opacity: 0;
            transform: translateY(-10px); /* Slight upward movement */
          }
          10%, 90% {
            opacity: 1;
            transform: translateY(0); /* Reset position */
          }
        }
      `}</style>
    </main>
  );
}