import { useState, useEffect, useMemo, ReactNode } from 'react';
import { format } from 'date-fns';
import { 
  LayoutDashboard, 
  TrendingUp, 
  UtensilsCrossed, 
  Droplets, 
  CheckCircle2, 
  RefreshCcw,
  Target,
  Clock,
  Pill,
  CheckCircle,
  Calendar as CalendarIcon,
  RotateCcw,
  Plus,
  Trash2,
  Lightbulb,
  Sparkles,
  ShoppingCart,
  User,
  Flame,
  Check,
  ChevronRight,
  ChevronDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { cn, STORAGE_KEY, AppData, WeightLog } from './lib/utils';
import { MEAL_PLAN, MOTIVATIONAL_TIPS } from './constants';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function useTehranTime() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return useMemo(() => {
    return new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Tehran',
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    }).format(time);
  }, [time]);
}

function parseTime(timeStr: string) {
  const parts = timeStr.trim().split(' ');
  if (parts.length < 2) return new Date();
  const [time, modifier] = parts;
  let [hours, minutes] = time.split(':').map(Number);
  if (modifier === 'PM' && hours < 12) hours += 12;
  if (modifier === 'AM' && hours === 12) hours = 0;
  const d = new Date();
  d.setHours(hours, minutes, 0, 0);
  return d;
}

function multiplyItem(item: string, days: number): string {
  if (days === 1) return item;
  if (item.toLowerCase().includes('few drops')) return item;
  
  const match = item.match(/^([0-9.]+)(.*)$/);
  if (match && !isNaN(parseFloat(match[1]))) {
    const qty = parseFloat(match[1]);
    return `${qty * days}${match[2]}`;
  }
  return `${item} (x${days})`;
}

function ConsistencyRing({ score }: { score: number }) {
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  
  return (
    <div className="relative w-24 h-24 flex items-center justify-center">
       <svg className="w-full h-full transform -rotate-90">
         <circle cx="48" cy="48" r={radius} className="stroke-slate-100" strokeWidth="8" fill="none" />
         <circle 
           cx="48" 
           cy="48" 
           r={radius} 
           className={cn("transition-all duration-1000 ease-out", score >= 80 ? "stroke-purple-500" : score >= 50 ? "stroke-blue-500" : "stroke-orange-500")} 
           strokeWidth="8" 
           fill="none" 
           strokeDasharray={circumference}
           strokeDashoffset={offset}
           strokeLinecap="round"
         />
       </svg>
       <div className="absolute flex flex-col items-center justify-center">
         <span className="text-2xl font-black text-slate-800">{score}</span>
         <span className="text-[8px] uppercase tracking-widest font-black text-slate-400">Score</span>
       </div>
    </div>
  );
}

export default function App() {
  const tehranTime = useTehranTime();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'chart' | 'meals' | 'groceries' | 'profile'>('dashboard');
  const [selectedDayIndex, setSelectedDayIndex] = useState(new Date().getDay() === 0 ? 6 : new Date().getDay() - 1);
  const [todayStr] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [showCelebration, setShowCelebration] = useState(false);
  const [now, setNow] = useState(new Date());
  const [cartDuration, setCartDuration] = useState<number>(7);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const [data, setData] = useState<AppData>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (!Array.isArray(parsed.weights)) parsed.weights = [];
        if (!parsed.groceryChecklist) parsed.groceryChecklist = {};
        return parsed;
      } catch (e) {
        console.error("Failed to parse appData", e);
      }
    }
    return {
      weights: [],
      waterIntake: {},
      completedMeals: {},
      selectedOptions: {},
      isTrainingDay: false,
      groceryChecklist: {}
    };
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [data]);

  const toggleTrainingDay = () => {
    setData(prev => ({ ...prev, isTrainingDay: !prev.isTrainingDay }));
  };

  const updateWater = () => {
    setData(prev => {
      const current = prev.waterIntake[todayStr] || 0;
      if (current >= 4000) return prev;
      return {
        ...prev,
        waterIntake: { ...prev.waterIntake, [todayStr]: Math.min(current + 250, 4000) }
      };
    });
  };

  const resetWater = () => {
    setData(prev => ({
      ...prev,
      waterIntake: { ...prev.waterIntake, [todayStr]: 0 }
    }));
  };

  const toggleMealComplete = (mealId: string) => {
    setData(prev => {
      const completed = prev.completedMeals[todayStr] || [];
      const isCompleted = completed.includes(mealId);
      
      if (!isCompleted) {
        setShowCelebration(true);
        setTimeout(() => setShowCelebration(false), 1500);
      }

      return {
        ...prev,
        completedMeals: {
          ...prev.completedMeals,
          [todayStr]: isCompleted 
            ? completed.filter(id => id !== mealId) 
            : [...completed, mealId]
        }
      };
    });
  };

  const addWeightLog = (weight: number) => {
    if (!weight) return;
    const newLog: WeightLog = {
      id: crypto.randomUUID(),
      weight,
      timestamp: new Date().toISOString()
    };
    setData(prev => ({
      ...prev,
      weights: [newLog, ...prev.weights].slice(0, 50) // Keep last 50
    }));
  };

  const removeWeightLog = (id: string) => {
    setData(prev => ({
      ...prev,
      weights: prev.weights.filter(w => w.id !== id)
    }));
  };

  const rotateMealOption = (mealId: string, optionsCount: number) => {
    setData(prev => {
      const currentIdx = prev.selectedOptions[mealId] || 0;
      return {
        ...prev,
        selectedOptions: {
          ...prev.selectedOptions,
          [mealId]: (currentIdx + 1) % optionsCount
        }
      };
    });
  };

  const toggleGroceryItem = (item: string) => {
    setData(prev => ({
      ...prev,
      groceryChecklist: {
        ...(prev.groceryChecklist || {}),
        [item]: !prev.groceryChecklist?.[item]
      }
    }));
  };

  const filteredMeals = useMemo(() => {
    return MEAL_PLAN.filter(meal => {
      if (meal.isWorkoutSpecific === 'training' && !data.isTrainingDay) return false;
      return true;
    });
  }, [data.isTrainingDay]);

  const nextMeal = useMemo(() => {
    const completed = data.completedMeals[todayStr] || [];
    return filteredMeals.find(m => !completed.includes(m.id));
  }, [filteredMeals, data.completedMeals, todayStr]);

  const mealsCompleted = (data.completedMeals[todayStr] || []).filter(id => MEAL_PLAN.some(m => m.id === id)).length;

  const todayScore = Math.round(
    (Math.min((data.waterIntake[todayStr] || 0) / 4000, 1) * 40) +
    (Math.min(mealsCompleted / (filteredMeals.length || 1), 1) * 60)
  );

  const dailyTip = useMemo(() => {
    const hash = todayStr.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return MOTIVATIONAL_TIPS[hash % MOTIVATIONAL_TIPS.length];
  }, [todayStr]);

  const getGreeting = () => {
    const hr = new Date().getHours();
    if (hr < 12) return 'Good Morning';
    if (hr < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  const groceryList = useMemo(() => {
    const list: Record<string, string[]> = {
      'Proteins': [],
      'Carbs & Grains': [],
      'Fruits & Veggies': [],
      'Fats & Nuts': [],
      'Beverages & Supplements': [],
      'Other': []
    };
    
    MEAL_PLAN.forEach(meal => {
      const optionIdx = data.selectedOptions[meal.id] || 0;
      const option = meal.options[optionIdx];
      option.items.forEach(item => {
        const lower = item.toLowerCase();
        let categorized = false;
        if (['chicken', 'meat', 'fish', 'egg', 'whey', 'cheese', 'soy', 'beef', 'steak'].some(k => lower.includes(k))) { list['Proteins'].push(item); categorized = true; }
        else if (['rice', 'pasta', 'potato', 'oats', 'bread', 'toast', 'macaroni'].some(k => lower.includes(k))) { list['Carbs & Grains'].push(item); categorized = true; }
        else if (['banana', 'apple', 'lettuce', 'tomato', 'carrot', 'beans', 'herbs', 'salad', 'lemon', 'spinach', 'veg'].some(k => lower.includes(k))) { list['Fruits & Veggies'].push(item); categorized = true; }
        else if (['walnut', 'peanut', 'almond', 'seeds', 'olive oil', 'butter'].some(k => lower.includes(k))) { list['Fats & Nuts'].push(item); categorized = true; }
        else if (['milk', 'water', 'tea', 'caffeine', 'coffee'].some(k => lower.includes(k))) { list['Beverages & Supplements'].push(item); categorized = true; }
        if (!categorized) list['Other'].push(item);
      });
    });
    
    Object.keys(list).forEach(key => {
      list[key] = [...new Set(list[key])];
    });
    
    return list;
  }, [data.selectedOptions]);

  const getCountdown = (timeStr: string) => {
    const target = parseTime(timeStr);
    const diffMs = target.getTime() - now.getTime();
    if (diffMs < 0) return "Overdue";
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 60) return `in ${diffMins} min`;
    const hr = Math.floor(diffMins / 60);
    const min = diffMins % 60;
    return `in ${hr}h ${min}m`;
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-24 font-sans text-slate-900 select-none overflow-x-hidden">
      {/* Top Header / Toggle */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white shadow-sm border-b border-slate-100 flex flex-col">
        {/* Tehran Time Bar */}
        <div className="bg-slate-900 text-white py-1 px-4 text-[10px] uppercase tracking-tighter font-mono flex justify-between items-center opacity-90">
          <div className="flex items-center gap-2">
            <CalendarIcon size={10} className="text-blue-400" />
            <span className="truncate max-w-[200px]">{tehranTime}</span>
          </div>
          <span className="text-blue-400 font-bold">Tehran, IR</span>
        </div>
        
        <div className="px-6 py-4 flex justify-between items-center bg-white/80 backdrop-blur-md">
          <h1 className="text-xl font-black tracking-tighter bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            BODY COCKPIT
          </h1>
          <button 
            onClick={toggleTrainingDay}
            className={cn(
              "relative w-36 h-9 rounded-full p-1 transition-all duration-300 flex items-center",
              data.isTrainingDay ? "bg-purple-600 shadow-lg shadow-purple-200" : "bg-blue-600 shadow-lg shadow-blue-200"
            )}
          >
            <div className={cn(
              "absolute inset-0 flex items-center justify-around text-[9px] font-black uppercase tracking-wider text-white px-3",
              data.isTrainingDay ? "flex-row-reverse" : "flex-row"
            )}>
              <span>Normal</span>
              <span>Training</span>
            </div>
            <motion.div 
              layout
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
              className="z-10 w-1/2 h-full bg-white rounded-full shadow-sm flex items-center justify-center font-black text-[9px] uppercase text-slate-800"
            >
              {data.isTrainingDay ? 'Training' : 'Normal'}
            </motion.div>
          </button>
        </div>
      </header>

      <main className="pt-32 px-6 max-w-lg mx-auto">
        <AnimatePresence>
          {showCelebration && (
            <motion.div 
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1.5, opacity: 1 }}
              exit={{ scale: 2, opacity: 0 }}
              className="fixed inset-0 pointer-events-none z-[100] flex items-center justify-center text-4xl"
            >
              <div className="bg-white/80 backdrop-blur-sm p-8 rounded-full shadow-2xl border border-blue-100 flex flex-col items-center">
                <CheckCircle2 size={80} className="text-blue-600 mb-2" />
                <span className="font-black text-blue-600 text-lg uppercase tracking-widest">Excellent!</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence mode="wait">
          {activeTab === 'dashboard' && (
            <motion.div 
              key="dashboard"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <div className="flex items-end justify-between px-2 pt-2">
                 <div>
                   <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">{getGreeting()}</p>
                   <h2 className="text-2xl font-black text-slate-800 mt-0.5">Let's crush today.</h2>
                 </div>
              </div>

              {/* Consistency Matrix */}
              <section className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1 text-slate-400 font-bold text-xs uppercase tracking-widest">
                    <Flame size={16} className={todayScore >= 80 ? "text-orange-500 animate-pulse" : "text-slate-300"} />
                    <span>Consistency</span>
                  </div>
                  <p className="text-3xl font-black text-slate-800">{todayScore}<span className="text-lg text-slate-400">%</span></p>
                  <p className="text-xs font-medium text-slate-500 mt-2 max-w-[150px] leading-relaxed">
                    {todayScore >= 80 ? "On fire! Keep pushing." : "Every action counts. Hydrate or eat to raise your score!"}
                  </p>
                </div>
                <ConsistencyRing score={todayScore} />
              </section>

              {/* Next Action */}
              <section className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 overflow-hidden relative">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-full -mr-16 -mt-16 blur-2xl" />
                <div className="flex items-center justify-between mb-4">
                   <div className="flex items-center gap-2 text-slate-400 font-bold text-xs uppercase tracking-widest">
                     <Target size={16} className="text-blue-500" />
                     <span>Next Action</span>
                   </div>
                   {nextMeal && (
                      <span className={cn("text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-md", getCountdown(nextMeal.time) === 'Overdue' ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600')}>
                        {getCountdown(nextMeal.time)}
                      </span>
                   )}
                </div>
                {nextMeal ? (
                  <div className="relative">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h2 className="text-2xl font-bold text-slate-800">{nextMeal.name}</h2>
                        <div className="flex items-center gap-1.5 text-blue-600 font-semibold text-sm mt-1">
                          <Clock size={14} />
                          <span>{nextMeal.time}</span>
                        </div>
                      </div>
                      <button 
                        onClick={() => toggleMealComplete(nextMeal.id)}
                        className="bg-blue-600 text-white p-2.5 rounded-2xl shadow-lg shadow-blue-200"
                      >
                        <CheckCircle2 size={24} />
                      </button>
                    </div>
                    <ul className="space-y-2">
                       {nextMeal.options[data.selectedOptions[nextMeal.id] || 0].items.map((item, i) => (
                         <li key={i} className="flex items-center gap-3 text-slate-600 text-sm">
                           <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                           {item}
                         </li>
                       ))}
                    </ul>
                    {nextMeal.options[data.selectedOptions[nextMeal.id] || 0].medicines && (
                       <div className="mt-4 pt-4 border-t border-slate-50">
                         <div className="flex items-center gap-2 text-purple-600 font-semibold text-xs uppercase tracking-widest">
                           <Pill size={14} />
                           <span>Suggested Add-ons</span>
                         </div>
                         <p className="text-slate-500 text-sm mt-1">
                           {nextMeal.options[data.selectedOptions[nextMeal.id] || 0].medicines?.join(', ')}
                         </p>
                       </div>
                    )}
                  </div>
                ) : (
                  <div className="py-8 text-center">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <CheckCircle className="text-green-600" size={32} />
                    </div>
                    <p className="text-slate-800 font-bold">All meals completed!</p>
                    <p className="text-slate-400 text-sm">Target reached for today.</p>
                  </div>
                )}
              </section>

              {/* Water Tracker - MOVED TO BOTTOM */}
              <section className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center gap-2 text-slate-400 font-bold text-xs uppercase tracking-widest">
                    <Droplets size={16} className="text-blue-500" />
                    <span>Hydration</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-black text-blue-600">{(data.waterIntake[todayStr] || 0) / 1000}L / 4L</span>
                    <button 
                      onClick={resetWater}
                      className="p-1.5 text-slate-300 hover:text-slate-400 active:rotate-180 transition-all"
                    >
                      <RotateCcw size={16} />
                    </button>
                  </div>
                </div>
                <div className="flex gap-1.5 mb-6">
                  {Array.from({ length: 16 }).map((_, i) => (
                    <div 
                      key={i} 
                      className={cn(
                        "flex-1 h-6 rounded-sm transition-all duration-700",
                        (i * 250) < (data.waterIntake[todayStr] || 0) 
                          ? "bg-gradient-to-b from-blue-400 to-blue-600 shadow-[0_2px_10px_rgba(37,99,235,0.2)]" 
                          : "bg-slate-50"
                      )}
                    />
                  ))}
                </div>
                <button 
                  onClick={updateWater}
                  disabled={(data.waterIntake[todayStr] || 0) >= 4000}
                  className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-3 active:scale-[0.98] transition-all disabled:opacity-50 shadow-lg shadow-blue-100"
                >
                  <Plus size={20} />
                  Add 250ml
                </button>
              </section>

              {/* Tip of Today */}
              <section className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                   <Sparkles size={48} className="text-purple-600" />
                </div>
                <div className="flex items-center gap-2 mb-3 text-slate-400 font-bold text-xs uppercase tracking-widest">
                  <Lightbulb size={16} className="text-yellow-500" />
                  <span>Tip of Today</span>
                </div>
                <p className="text-slate-700 font-medium leading-relaxed italic pr-8">
                  "{dailyTip}"
                </p>
                <div className="mt-4 flex items-center gap-1.5 text-[10px] font-black text-blue-600 uppercase tracking-widest">
                  <span>Keep Pushing</span>
                  <div className="w-8 h-[1px] bg-blue-100" />
                </div>
              </section>
            </motion.div>
          )}

          {activeTab === 'chart' && (
            <motion.div 
               key="chart"
               initial={{ opacity: 0, x: -20 }}
               animate={{ opacity: 1, x: 0 }}
               exit={{ opacity: 0, x: 20 }}
               className="space-y-6"
            >
              <section className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
                <div className="flex items-center gap-2 mb-6 text-slate-400 font-bold text-xs uppercase tracking-widest">
                  <TrendingUp size={16} className="text-blue-500" />
                  <span>Measures Tracker</span>
                </div>
                <div className="h-56 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={[...data.weights].reverse().map(log => ({ 
                      name: format(new Date(log.timestamp), 'dd/MM'), 
                      weight: log.weight 
                    }))}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis 
                        dataKey="name" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 700 }} 
                      />
                      <YAxis 
                        width={30}
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 700 }}
                        domain={['auto', 'auto']}
                      />
                      <Tooltip 
                        contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 40px rgba(0,0,0,0.1)', background: '#fff' }} 
                        labelStyle={{ color: '#94a3b8', fontWeight: 800, marginBottom: '4px' }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="weight" 
                        stroke="#2563eb" 
                        strokeWidth={4} 
                        dot={{ r: 5, fill: '#2563eb', strokeWidth: 3, stroke: '#fff' }} 
                        activeDot={{ r: 8, strokeWidth: 0 }} 
                        connectNulls
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </section>

              <section className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">New Measure</h3>
                <div className="flex gap-2 md:gap-3">
                  <input 
                    id="new-weight-input"
                    type="number" 
                    placeholder="00.0"
                    step="0.1"
                    className="flex-1 w-full min-w-0 bg-slate-50 border-none rounded-2xl px-4 py-3 md:p-4 text-lg md:text-xl font-black text-slate-800 placeholder:text-slate-200 outline-none focus:ring-2 focus:ring-blue-100"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        const input = e.currentTarget;
                        addWeightLog(parseFloat(input.value));
                        input.value = '';
                      }
                    }}
                  />
                  <button 
                    onClick={() => {
                      const input = document.getElementById('new-weight-input') as HTMLInputElement;
                      addWeightLog(parseFloat(input.value));
                      input.value = '';
                    }}
                    className="bg-blue-600 text-white p-3 md:p-4 rounded-2xl shadow-lg shadow-blue-100 active:scale-95 transition-all flex-shrink-0"
                  >
                    <Plus size={24} />
                  </button>
                </div>
              </section>

              <section className="space-y-3">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Weekly Log</h3>
                {data.weights.map((log) => (
                  <motion.div 
                    layout
                    key={log.id} 
                    className="bg-white rounded-2xl p-4 flex justify-between items-center border border-slate-100 group"
                  >
                    <div>
                      <p className="font-black text-slate-800 text-lg leading-tight">{log.weight} <span className="text-xs text-slate-400">kg</span></p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                        {format(new Date(log.timestamp), 'EEE, MMM dd • HH:mm')}
                      </p>
                    </div>
                    <button 
                      onClick={() => removeWeightLog(log.id)}
                      className="p-2 text-slate-200 hover:text-red-400 transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  </motion.div>
                ))}
              </section>
            </motion.div>
          )}

          {activeTab === 'meals' && (
             <motion.div 
               key="meals"
               initial={{ opacity: 0, x: 20 }}
               animate={{ opacity: 1, x: 0 }}
               exit={{ opacity: 0, x: -20 }}
               className="space-y-6"
             >
               {/* Day Selector */}
               <div className="flex gap-2 overflow-x-auto pb-4 no-scrollbar">
                 {DAYS.map((day, i) => (
                    <button 
                      key={day}
                      onClick={() => setSelectedDayIndex(i)}
                      className={cn(
                        "flex-shrink-0 w-14 py-3 rounded-2xl font-bold text-sm transition-all",
                        selectedDayIndex === i 
                          ? "bg-blue-600 text-white shadow-lg shadow-blue-200 scale-105" 
                          : "bg-white text-slate-400 border border-slate-100"
                      )}
                    >
                      {day}
                    </button>
                 ))}
               </div>

               {/* Meals List */}
               <div className="space-y-4">
                 {filteredMeals.map((meal) => {
                   const optionIdx = data.selectedOptions[meal.id] || 0;
                   const option = meal.options[optionIdx];
                   const isCompleted = (data.completedMeals[todayStr] || []).includes(meal.id);

                   return (
                     <div 
                        key={meal.id}
                        className={cn(
                          "bg-white rounded-3xl p-5 border transition-all duration-300 relative overflow-hidden",
                          isCompleted ? "opacity-30 border-slate-200 grayscale-[0.5]" : "border-slate-100 shadow-sm shadow-slate-100/50"
                        )}
                        onClick={() => toggleMealComplete(meal.id)}
                     >
                       <div className="flex justify-between items-start mb-3">
                         <div>
                           <div className="flex items-center gap-2">
                             <h3 className="font-bold text-lg text-slate-800">{meal.name}</h3>
                             {isCompleted && <CheckCircle2 size={18} className="text-blue-600" />}
                           </div>
                           <div className="flex items-center gap-1 text-slate-400 font-bold text-xs mt-0.5">
                             <Clock size={12} />
                             <span>{meal.time}</span>
                           </div>
                         </div>
                         {meal.options.length > 1 && !isCompleted && (
                           <button 
                             onClick={(e) => {
                               e.stopPropagation();
                               rotateMealOption(meal.id, meal.options.length);
                             }}
                             className="p-2 bg-slate-50 text-slate-600 rounded-xl active:rotate-180 transition-transform"
                           >
                             <RefreshCcw size={16} />
                           </button>
                         )}
                       </div>

                       <div className="space-y-1.5 mb-4">
                          {option.items.map((item, i) => (
                            <p key={i} className="text-slate-600 text-sm leading-relaxed whitespace-pre-wrap">• {item}</p>
                          ))}
                       </div>

                       {/* Medicines */}
                       {option.medicines && (
                         <div className="mb-4 flex items-center gap-2 bg-purple-50 text-purple-700 px-3 py-2 rounded-xl text-xs font-bold w-fit">
                           <Pill size={14} />
                           <span>{option.medicines.join(', ')}</span>
                         </div>
                       )}

                       {/* Macros */}
                       <div className="flex gap-2 pt-4 border-t border-slate-50">
                          <MacroBadge label="P" value={option.p} color="text-red-500" />
                          <MacroBadge label="C" value={option.c} color="text-blue-500" />
                          <MacroBadge label="F" value={option.f} color="text-orange-500" />
                          <MacroBadge label="Fib" value={option.fib} color="text-green-500" />
                       </div>
                     </div>
                   );
                 })}
               </div>
             </motion.div>
          )}
           {activeTab === 'profile' && (
             <motion.div key="profile" initial={{opacity:0, x:20}} animate={{opacity:1, x:0}} exit={{opacity:0, x:-20}} className="space-y-6">
                <section className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 text-center">
                   <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-white shadow-xl">
                      <User size={32} className="text-slate-400" />
                   </div>
                   <h2 className="text-xl font-black text-slate-800">Athlete</h2>
                   <p className="text-sm font-bold text-slate-400 mt-1">Ready to crush it</p>
                </section>

                <section className="grid grid-cols-2 gap-4">
                   <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm flex flex-col items-center">
                      <Flame size={24} className="text-orange-500 mb-2" />
                      <p className="text-2xl font-black text-slate-800">
                         {Object.keys(data.completedMeals).length}
                      </p>
                      <p className="text-[9px] uppercase tracking-widest font-bold text-slate-400 mt-1">Active Days</p>
                   </div>
                   <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm flex flex-col items-center">
                      <Droplets size={24} className="text-blue-500 mb-2" />
                      <p className="text-2xl font-black text-slate-800">
                         {(Object.values(data.waterIntake) as number[]).reduce((a,b)=>a+(b/1000),0).toFixed(1)}L
                      </p>
                      <p className="text-[9px] uppercase tracking-widest font-bold text-slate-400 mt-1">Total Hydration</p>
                   </div>
                </section>
                
                <section className="bg-white rounded-3xl p-2 shadow-sm border border-slate-100">
                   <button onClick={() => {if(confirm('Reset all progress?')) { localStorage.removeItem(STORAGE_KEY); window.location.reload(); }}} className="w-full text-left px-5 py-4 text-red-500 font-bold text-sm flex justify-between items-center active:scale-95 transition-all">
                      Reset All Data
                      <ChevronRight size={16} />
                   </button>
                </section>
             </motion.div>
          )}

          {activeTab === 'groceries' && (
             <motion.div
                key="groceries"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
             >
                <div className="bg-gradient-to-br from-blue-600 to-purple-700 rounded-3xl p-6 text-white shadow-lg shadow-purple-500/20 relative overflow-hidden">
                   <div className="absolute right-0 top-0 opacity-10 transform translate-x-4 -translate-y-4 pointer-events-none">
                      <ShoppingCart size={120} />
                   </div>
                   <div className="flex justify-between items-start relative z-10">
                     <div className="pr-4">
                       <h2 className="text-2xl font-black mb-1">Smart Cart</h2>
                       <p className="text-blue-100 text-sm font-medium">Auto-generated from your active meal plan structure.</p>
                     </div>
                     <div className="bg-white/20 backdrop-blur-md rounded-xl px-3 py-2 shrink-0 flex items-center gap-1 cursor-pointer">
                       <select 
                         value={cartDuration}
                         onChange={(e) => setCartDuration(Number(e.target.value))}
                         className="bg-transparent text-white font-bold text-sm outline-none cursor-pointer appearance-none [&>option]:text-slate-800"
                       >
                         <option value={7}>1 Week</option>
                         <option value={14}>2 Weeks</option>
                         <option value={30}>1 Month</option>
                       </select>
                       <ChevronDown size={14} className="pointer-events-none" />
                     </div>
                   </div>
                </div>

                <div className="space-y-6">
                   {(Object.entries(groceryList) as [string, string[]][]).map(([category, items]) => {
                      if (items.length === 0) return null;
                      return (
                         <section key={category} className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100">
                            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 inline-flex items-center gap-2">
                               {category}
                               <span className="bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full text-[10px]">{items.length}</span>
                            </h3>
                            <div className="space-y-3">
                               {items.map((item, idx) => {
                                  const isChecked = data.groceryChecklist?.[item] || false;
                                  const displayItem = multiplyItem(item, cartDuration);
                                  return (
                                     <label key={idx} className={cn("flex items-start gap-3 cursor-pointer group transition-all", isChecked && "opacity-50 grayscale")}>
                                        <input type="checkbox" className="hidden" checked={isChecked} onChange={() => toggleGroceryItem(item)} />
                                        <div className={cn("w-5 h-5 rounded flex items-center justify-center border transition-all mt-0.5 shrink-0", isChecked ? "bg-blue-600 border-blue-600 shadow-sm shadow-blue-200" : "border-slate-300 bg-slate-50 group-hover:border-blue-400")}>
                                           {isChecked && <Check size={14} className="text-white" />}
                                        </div>
                                        <span className={cn("text-sm font-bold transition-all", isChecked ? "text-slate-400 line-through" : "text-slate-700")}>{displayItem}</span>
                                     </label>
                                  )
                               })}
                            </div>
                         </section>
                      )
                   })}
                </div>
             </motion.div>
          )}

        </AnimatePresence>
      </main>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-t border-slate-100 px-6 py-4 flex justify-between items-center z-50 rounded-t-[32px] shadow-[0_-10px_30px_rgba(0,0,0,0.02)]">
        <div className="flex gap-4">
           <NavButton 
             active={activeTab === 'chart'} 
             onClick={() => setActiveTab('chart')}
             icon={<TrendingUp size={24} />}
             label="Measure"
           />
           <NavButton 
             active={activeTab === 'meals'} 
             onClick={() => setActiveTab('meals')}
             icon={<UtensilsCrossed size={24} />}
             label="Meals"
           />
        </div>
        <div className="relative -mt-12 px-2">
          <button 
            id="nav-dashboard-btn"
            onClick={() => setActiveTab('dashboard')}
            className={cn(
              "w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 shadow-xl mx-auto",
              activeTab === 'dashboard' 
                ? "bg-gradient-to-br from-blue-500 to-purple-600 text-white scale-110 rotate-0 shadow-blue-300" 
                : "bg-white text-slate-400 scale-100 rotate-45 shadow-slate-200"
            )}
          >
            <LayoutDashboard size={28} />
          </button>
        </div>
        <div className="flex gap-4">
           <NavButton 
             active={activeTab === 'groceries'} 
             onClick={() => setActiveTab('groceries')}
             icon={<ShoppingCart size={24} />}
             label="Cart"
           />
           <NavButton 
             active={activeTab === 'profile'} 
             onClick={() => setActiveTab('profile')}
             icon={<User size={24} />}
             label="Profile"
           />
        </div>
      </nav>
    </div>
  );
}

function NavButton({ active, icon, label, onClick }: { active: boolean, icon: ReactNode, label: string, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "flex flex-col items-center gap-1 transition-all duration-300",
        active ? "text-blue-600 scale-110" : "text-slate-300"
      )}
    >
      {icon}
      <span className="text-[10px] font-bold uppercase tracking-widest">{label}</span>
    </button>
  );
}

function MacroBadge({ label, value, color }: { label: string, value: number, color: string }) {
  return (
    <div className="bg-slate-50 px-2 py-1 rounded-lg flex items-baseline gap-0.5">
      <span className="text-[10px] font-black text-slate-400 uppercase">{label}</span>
      <span className={cn("text-xs font-black", color)}>{value}g</span>
    </div>
  );
}
