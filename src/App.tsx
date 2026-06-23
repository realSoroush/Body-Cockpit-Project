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
import confetti from 'canvas-confetti';
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
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  
  return (
    <div className="relative w-32 h-32 flex items-center justify-center">
       <svg className="w-full h-full transform -rotate-90">
         <circle cx="64" cy="64" r={radius} className="stroke-zinc-100" strokeWidth="6" fill="none" />
         <circle 
           cx="64" 
           cy="64" 
           r={radius} 
           className={cn("transition-all duration-1000 ease-out", score >= 80 ? "stroke-[var(--color-accent)]" : "stroke-zinc-400")} 
           strokeWidth="6" 
           fill="none" 
           strokeDasharray={circumference}
           strokeDashoffset={offset}
           strokeLinecap="round"
         />
       </svg>
       <div className="absolute flex flex-col items-center justify-center">
         <span className="text-4xl font-display font-bold text-zinc-950 tracking-tighter">{score}</span>
         <span className="text-[9px] uppercase tracking-widest font-bold text-zinc-400 mt-1">Score</span>
       </div>
    </div>
  );
}

function ItemLongPress({ item, onClick, onEdit, children, className }: any) {
  const [isPressing, setIsPressing] = useState(false);
  const [hasLongPressed, setHasLongPressed] = useState(false);

  useEffect(() => {
    let timer: any;
    if (isPressing) {
      setHasLongPressed(false);
      timer = setTimeout(() => {
        setHasLongPressed(true);
        setIsPressing(false);
        if (navigator.vibrate) navigator.vibrate([50]);
        onEdit(item);
      }, 600);
    }
    return () => clearTimeout(timer);
  }, [isPressing, item, onEdit]);

  return (
    <div
      onPointerDown={() => setIsPressing(true)}
      onPointerUp={(e) => setIsPressing(false)}
      onPointerLeave={() => setIsPressing(false)}
      onContextMenu={(e) => e.preventDefault()}
      onClick={(e) => {
        if (hasLongPressed) {
          e.preventDefault();
          e.stopPropagation();
          return;
        }
        if (onClick) onClick(e);
      }}
      className={className}
    >
      {children}
    </div>
  );
}

function useLongPressProgress(action: () => void, ms = 1500) {
  const [isPressing, setIsPressing] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let animationFrame: number;
    let startTime: number;

    if (isPressing) {
      const animate = (time: number) => {
        if (!startTime) startTime = time;
        const elapsed = time - startTime;
        const p = Math.min(elapsed / ms, 1);
        setProgress(p);

        if (p >= 1) {
          action();
          setIsPressing(false);
          if (navigator.vibrate) navigator.vibrate([50, 50, 50]);
        } else {
          animationFrame = requestAnimationFrame(animate);
        }
      };
      animationFrame = requestAnimationFrame(animate);
    } else {
      setProgress(0);
    }

    return () => {
      if (animationFrame) cancelAnimationFrame(animationFrame);
    };
  }, [isPressing, action, ms]);

  return {
    handlers: {
      onPointerDown: () => setIsPressing(true),
      onPointerUp: () => setIsPressing(false),
      onPointerLeave: () => setIsPressing(false),
      onContextMenu: (e: any) => e.preventDefault(),
    },
    progress,
    isPressing
  };
}

export default function App() {
  const tehranTime = useTehranTime();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'chart' | 'meals' | 'groceries' | 'profile'>('dashboard');
  const [selectedDayIndex, setSelectedDayIndex] = useState(new Date().getDay() === 0 ? 6 : new Date().getDay() - 1);
  const [todayStr] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [showCelebration, setShowCelebration] = useState(false);
  const [now, setNow] = useState(new Date());
  const [cartDuration, setCartDuration] = useState<number>(7);
  const [isCartDropdownOpen, setIsCartDropdownOpen] = useState(false);
  
  const [confirmModal, setConfirmModal] = useState<{isOpen: boolean, message: string, action: () => void} | null>(null);
  const [waterReminderModal, setWaterReminderModal] = useState(false);
  const [weeklySummaryModal, setWeeklySummaryModal] = useState<{isOpen: boolean, hydrationAvg: number, mealAvg: number} | null>(null);
  const [editingItemModal, setEditingItemModal] = useState<{isOpen: boolean, original: string, text: string} | null>(null);

  const resetTodayProgress = useLongPressProgress(() => {
    setData(prev => ({
      ...prev,
      waterIntake: { ...prev.waterIntake, [todayStr]: 0 },
      completedMeals: { ...prev.completedMeals, [todayStr]: [] }
    }));
  }, 1000);

  const formatProgress = useLongPressProgress(() => {
    localStorage.removeItem(STORAGE_KEY);
    window.location.reload();
  }, 1500);

  useEffect(() => {
    const checkScheduledEvents = () => {
       const d = new Date();
       setNow(d);
       
       setData(prev => {
         let updated = { ...prev };
         let changed = false;
         
         const hour = d.getHours();
         if (hour >= 9 && hour <= 20) {
           const lastLog = prev.lastWaterLogTimestamp || 0;
           const hoursSinceLastLog = (d.getTime() - lastLog) / (1000 * 60 * 60);
           const lastReminder = prev.lastWaterReminderShown || 0;
           const hoursSinceLastReminder = (d.getTime() - lastReminder) / (1000 * 60 * 60);
           
           if (hoursSinceLastLog >= 3 && hoursSinceLastReminder >= 3) {
              setWaterReminderModal(true);
              updated.lastWaterReminderShown = d.getTime();
              changed = true;
           }
         }
         
         if (d.getDay() === 6) { 
            const currentDayStr = format(d, 'yyyy-MM-dd');
            if (prev.lastWeeklySummaryDate !== currentDayStr) {
               let waterSum = 0;
               let mealsSum = 0;
               for (let i = 0; i < 7; i++) {
                 const checkDate = new Date(d);
                 checkDate.setDate(checkDate.getDate() - i);
                 const checkDateStr = format(checkDate, 'yyyy-MM-dd');
                 waterSum += (prev.waterIntake[checkDateStr] || 0);
                 mealsSum += (prev.completedMeals[checkDateStr]?.length || 0);
               }
               setWeeklySummaryModal({
                 isOpen: true,
                 hydrationAvg: waterSum / 7,
                 mealAvg: mealsSum / 7
               });
               updated.lastWeeklySummaryDate = currentDayStr;
               changed = true;
               
               confetti({
                  particleCount: 150,
                  spread: 100,
                  origin: { y: 0.5 },
                  colors: ['#d93838', '#bc2f2f', '#18181b', '#f4f4f5'],
                  disableForReducedMotion: true
               });
            }
         }
         
         return changed ? updated : prev;
       });
    };
    
    checkScheduledEvents();
    const timer = setInterval(checkScheduledEvents, 60000);
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
        waterIntake: { ...prev.waterIntake, [todayStr]: Math.min(current + 250, 4000) },
        lastWaterLogTimestamp: Date.now()
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
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.6 },
          colors: ['#d93838', '#bc2f2f', '#18181b', '#f4f4f5'],
          disableForReducedMotion: true
        });
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
        if (data.deletedItems?.includes(item)) return;
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

  const chartData = useMemo(() => {
    const sorted = [...data.weights].sort((a, b) => a.timestamp - b.timestamp);
    const mapped = sorted.map(log => ({
      name: format(new Date(log.timestamp), 'dd/MM'),
      timestamp: log.timestamp,
      weight: log.weight,
      projected: null as number | null
    }));

    if (mapped.length >= 2) {
      let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
      const n = mapped.length;
      const startMs = mapped[0].timestamp;
      
      mapped.forEach(d => {
        const x = (d.timestamp - startMs) / (1000 * 60 * 60 * 24);
        const y = d.weight;
        sumX += x;
        sumY += y;
        sumXY += x * y;
        sumXX += x * x;
      });

      const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
      const intercept = (sumY - slope * sumX) / n;

      const lastTimestamp = mapped[mapped.length - 1].timestamp;
      const futureTimestamp = lastTimestamp + 30 * 24 * 60 * 60 * 1000;
      const futureX = (futureTimestamp - startMs) / (1000 * 60 * 60 * 24);
      const futureWeight = slope * futureX + intercept;
      
      mapped[mapped.length - 1].projected = mapped[mapped.length - 1].weight;
      mapped.push({
        name: format(new Date(futureTimestamp), 'dd/MM'),
        timestamp: futureTimestamp,
        weight: null,
        projected: futureWeight
      });
    }

    return mapped;
  }, [data.weights]);

  const [sevenDayWaterAvg, sevenDayMealsAvg] = useMemo(() => {
    let waterSum = 0;
    let mealsSum = 0;
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = format(d, 'yyyy-MM-dd');
      waterSum += (data.waterIntake[dateStr] || 0);
      mealsSum += (data.completedMeals[dateStr]?.length || 0);
    }
    return [waterSum / 7, mealsSum / 7];
  }, [data.waterIntake, data.completedMeals]);

  return (
    <div className="min-h-screen bg-[#F9F9F8] pb-32 font-sans text-zinc-900 select-none overflow-x-hidden selection:bg-zinc-200">
      {/* Top Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-zinc-200/50 flex flex-col">
        {/* Tehran Time Bar */}
        <div className="bg-zinc-950 text-zinc-100 py-1.5 px-6 text-[10px] uppercase tracking-widest font-mono flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Clock size={10} className="text-zinc-400" />
            <span className="truncate max-w-[200px]">{tehranTime}</span>
          </div>
          <span className="text-zinc-400 font-bold">TEHRAN, IR</span>
        </div>
        
        <div className="px-6 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-display font-extrabold tracking-tight text-zinc-950 uppercase">
            Cockpit
          </h1>
          <button 
            onClick={toggleTrainingDay}
            className="flex items-center gap-3 bg-white/50 hover:bg-white/80 active:scale-95 transition-all px-4 py-2 rounded-full border border-zinc-200/50 shadow-sm backdrop-blur-md cursor-pointer"
          >
            <span className={cn("text-[10px] font-bold uppercase tracking-widest transition-colors", !data.isTrainingDay ? "text-zinc-900" : "text-zinc-400")}>Rest</span>
            
            <div 
              className={cn(
                "relative flex items-center rounded-full p-1 w-10 h-6 transition-colors duration-300",
                data.isTrainingDay ? "bg-[var(--color-accent)]" : "bg-zinc-200"
              )}
              style={{ justifyContent: data.isTrainingDay ? "flex-end" : "flex-start" }}
            >
              <motion.div 
                layout
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                className="z-10 h-4 w-4 rounded-full bg-white shadow-sm"
              />
            </div>
            
            <span className={cn("text-[10px] font-bold uppercase tracking-widest transition-colors", data.isTrainingDay ? "text-[var(--color-accent)]" : "text-zinc-400")}>Train</span>
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
              className="space-y-8"
            >
              <div className="flex flex-col gap-1 px-1 pt-4">
                 <p className="text-zinc-500 font-mono text-[10px] uppercase tracking-widest">{getGreeting()}</p>
                 <h2 className="text-4xl font-display font-semibold tracking-tight text-zinc-950">
                    Let's <span className="text-[var(--color-accent)]">crush</span> today.
                 </h2>
              </div>

              {/* Consistency Matrix */}
              <section className="bg-white rounded-2xl p-6 shadow-sm border border-zinc-200 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2 text-zinc-500 font-mono text-[10px] uppercase tracking-widest">
                    <Target size={14} />
                    <span>Daily Discipline</span>
                  </div>
                  <p className="text-4xl font-display font-bold text-zinc-950 tracking-tighter">
                    {todayScore}<span className="text-xl text-zinc-400 font-normal">%</span>
                  </p>
                  <p className="text-sm text-zinc-500 mt-2 max-w-[160px] leading-relaxed">
                    {todayScore >= 80 ? "Flawless execution." : "Stay on the path. Complete your targets."}
                  </p>
                </div>
                <ConsistencyRing score={todayScore} />
              </section>

              {/* Next Action */}
              <section className="bg-zinc-950 rounded-2xl p-6 shadow-xl relative overflow-hidden text-zinc-100">
                <div className="absolute top-0 right-0 w-64 h-64 bg-zinc-800/30 rounded-full blur-3xl -mr-20 -mt-20" />
                <div className="flex items-center justify-between mb-6 relative z-10">
                   <div className="flex items-center gap-2 text-zinc-400 font-mono text-[10px] uppercase tracking-widest">
                     <Target size={14} className="text-zinc-100" />
                     <span>Next Objective</span>
                   </div>
                   {nextMeal && (
                      <span className={cn("font-mono text-[10px] uppercase tracking-widest px-2.5 py-1 rounded-md", getCountdown(nextMeal.time) === 'Overdue' ? 'bg-[var(--color-accent)]/20 text-[var(--color-accent)]' : 'bg-zinc-800 text-zinc-300')}>
                        {getCountdown(nextMeal.time)}
                      </span>
                   )}
                </div>
                {nextMeal ? (
                  <div className="relative z-10">
                    <div className="flex justify-between items-start mb-6">
                      <div>
                        <h2 className="text-3xl font-display font-semibold tracking-tight mb-2">{nextMeal.name}</h2>
                        <div className="flex items-center gap-2 text-zinc-400 font-mono text-xs">
                          <Clock size={12} />
                          <span>{nextMeal.time}</span>
                        </div>
                      </div>
                      <button 
                        onClick={() => toggleMealComplete(nextMeal.id)}
                        className="bg-white text-zinc-950 p-3 rounded-full hover:scale-105 active:scale-95 hover:text-[var(--color-accent)] transition-all shadow-lg"
                      >
                        <Check size={24} strokeWidth={3} />
                      </button>
                    </div>
                    
                    <div className="bg-zinc-900/50 rounded-xl p-4 border border-zinc-800">
                      <ul className="space-y-3">
                         {nextMeal.options[data.selectedOptions[nextMeal.id] || 0].items.map((item, i) => (
                           <li key={i} className="flex items-start gap-3 text-zinc-300 text-sm">
                             <div className="w-1.5 h-1.5 rounded-full bg-zinc-600 mt-1.5 shrink-0" />
                             <span className="leading-relaxed">{item}</span>
                           </li>
                         ))}
                      </ul>
                      {nextMeal.options[data.selectedOptions[nextMeal.id] || 0].medicines && (
                         <div className="mt-4 pt-4 border-t border-zinc-800">
                           <div className="flex items-center gap-2 text-zinc-500 font-mono text-[10px] uppercase tracking-widest mb-2">
                             <Pill size={12} />
                             <span>Supplements</span>
                           </div>
                           <p className="text-zinc-300 text-sm">
                             {nextMeal.options[data.selectedOptions[nextMeal.id] || 0].medicines?.join(', ')}
                           </p>
                         </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="py-10 text-center relative z-10">
                    <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/20">
                      <Check className="text-white" size={32} />
                    </div>
                    <p className="text-white font-display text-xl font-semibold">Targets Neutralized.</p>
                    <p className="text-zinc-400 text-sm mt-1">Rest and recover for tomorrow.</p>
                  </div>
                )}
              </section>

              {/* Water Tracker */}
              <section className="bg-white rounded-2xl p-6 shadow-sm border border-zinc-200">
                <div className="flex justify-between items-end mb-6">
                  <div>
                    <div className="flex items-center gap-2 text-zinc-500 font-mono text-[10px] uppercase tracking-widest mb-1">
                      <Droplets size={14} className="text-zinc-950" />
                      <span>Hydration</span>
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-display font-bold text-zinc-950 tracking-tighter">{(data.waterIntake[todayStr] || 0) / 1000}</span>
                      <span className="text-zinc-400 font-mono text-sm">/ 4L</span>
                    </div>
                  </div>
                  <button 
                    onClick={resetWater}
                    className="p-2 text-zinc-400 hover:text-zinc-950 active:rotate-180 transition-all bg-zinc-50 rounded-full"
                  >
                    <RotateCcw size={14} />
                  </button>
                </div>
                
                <div className="flex gap-1 mb-6">
                  {Array.from({ length: 16 }).map((_, i) => (
                    <div 
                      key={i} 
                      className={cn(
                        "flex-1 h-8 rounded-sm transition-all duration-500",
                        (i * 250) < (data.waterIntake[todayStr] || 0) 
                          ? "bg-[var(--color-accent)]" 
                          : "bg-zinc-100"
                      )}
                    />
                  ))}
                </div>
                <button 
                  onClick={updateWater}
                  disabled={(data.waterIntake[todayStr] || 0) >= 4000}
                  className="w-full bg-zinc-100 hover:bg-zinc-200 text-zinc-950 py-4 rounded-xl font-bold text-sm tracking-wide flex items-center justify-center gap-2 active:scale-[0.98] transition-all disabled:opacity-50 border border-zinc-200 select-none"
                >
                  <Plus size={18} />
                  Add 250ml
                </button>
              </section>

              {/* Insights */}
              <section className="grid grid-cols-2 gap-4">
                 <div className="bg-white rounded-2xl p-5 shadow-sm border border-zinc-200">
                    <div className="flex items-center gap-1.5 mb-2 text-zinc-500 font-mono text-[9px] uppercase tracking-widest">
                      <Droplets size={12} />
                      <span>7-Day Water Avg</span>
                    </div>
                    <p className="text-2xl font-display font-bold text-zinc-950 tracking-tighter">
                      {(sevenDayWaterAvg / 1000).toFixed(1)}<span className="text-base text-zinc-400 font-normal">L</span>
                    </p>
                 </div>
                 <div className="bg-white rounded-2xl p-5 shadow-sm border border-zinc-200">
                    <div className="flex items-center gap-1.5 mb-2 text-zinc-500 font-mono text-[9px] uppercase tracking-widest">
                      <Flame size={12} />
                      <span>7-Day Meals Avg</span>
                    </div>
                    <p className="text-2xl font-display font-bold text-zinc-950 tracking-tighter">
                      {sevenDayMealsAvg.toFixed(1)}<span className="text-base text-zinc-400 font-normal">/day</span>
                    </p>
                 </div>
              </section>

              {/* Tip of Today */}
              <section className="border border-zinc-200 rounded-2xl p-6 relative overflow-hidden bg-white">
                <div className="absolute -right-4 -top-4 opacity-[0.03] pointer-events-none text-zinc-900">
                   <Lightbulb size={120} />
                </div>
                <div className="flex items-center gap-2 mb-4 text-zinc-500 font-mono text-[10px] uppercase tracking-widest">
                  <Lightbulb size={14} />
                  <span>Strategic Insight</span>
                </div>
                <p className="text-zinc-900 text-lg font-medium leading-relaxed pr-8 font-display tracking-tight">
                  "{dailyTip}"
                </p>
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
              <section className="bg-white rounded-2xl p-6 shadow-sm border border-zinc-200">
                <div className="flex items-center gap-2 mb-6 text-zinc-500 font-mono text-[10px] uppercase tracking-widest">
                  <TrendingUp size={14} />
                  <span>Metrics Tracker</span>
                </div>
                <div className="h-56 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e4e4e7" />
                      <XAxis 
                        dataKey="name" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fontSize: 10, fill: '#a1a1aa', fontFamily: 'JetBrains Mono' }} 
                      />
                      <YAxis 
                        width={30}
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fontSize: 10, fill: '#a1a1aa', fontFamily: 'JetBrains Mono' }}
                        domain={['auto', 'auto']}
                      />
                      <Tooltip 
                        contentStyle={{ borderRadius: '12px', border: '1px solid #e4e4e7', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', background: '#fff' }} 
                        labelStyle={{ color: '#52525b', fontFamily: 'JetBrains Mono', fontSize: '12px', marginBottom: '4px' }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="weight" 
                        stroke="var(--color-accent)" 
                        strokeWidth={3} 
                        dot={{ r: 4, fill: 'var(--color-accent)', strokeWidth: 2, stroke: '#fff' }} 
                        activeDot={{ r: 6, strokeWidth: 0, fill: 'var(--color-accent-hover)' }} 
                        connectNulls
                      />
                      <Line 
                        type="monotone" 
                        dataKey="projected" 
                        stroke="var(--color-accent)" 
                        strokeWidth={2} 
                        strokeDasharray="4 4"
                        dot={false}
                        activeDot={false}
                        connectNulls
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </section>

              <section className="bg-white rounded-2xl p-6 shadow-sm border border-zinc-200">
                <h3 className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest mb-4">New Entry</h3>
                <div className="flex gap-3">
                  <input 
                    id="new-weight-input"
                    type="number" 
                    placeholder="00.0"
                    step="0.1"
                    className="flex-1 w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 font-mono text-xl text-zinc-950 placeholder:text-zinc-300 outline-none focus:ring-2 focus:ring-zinc-950 transition-all"
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
                    className="bg-[var(--color-accent)] text-white px-6 rounded-xl hover:bg-[var(--color-accent-hover)] active:scale-95 transition-all flex-shrink-0"
                  >
                    <Plus size={20} />
                  </button>
                </div>
              </section>

              <section className="space-y-3">
                <h3 className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest ml-1">History Log</h3>
                {data.weights.map((log) => (
                  <motion.div 
                    layout
                    key={log.id} 
                    className="bg-white rounded-xl p-4 flex justify-between items-center border border-zinc-200 group hover:border-zinc-300 transition-colors"
                  >
                    <div>
                      <p className="font-mono text-zinc-950 text-lg leading-tight">{log.weight} <span className="text-xs text-zinc-500">kg</span></p>
                      <p className="text-[10px] text-zinc-400 font-mono mt-0.5">
                        {format(new Date(log.timestamp), 'EEE, MMM dd • HH:mm')}
                      </p>
                    </div>
                    <button 
                      onClick={() => removeWeightLog(log.id)}
                      className="p-2 text-zinc-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 size={16} />
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
                        "flex-shrink-0 w-14 py-3 rounded-xl font-bold text-sm transition-all border",
                        selectedDayIndex === i 
                          ? "bg-[var(--color-accent)] text-white border-[var(--color-accent)] shadow-md" 
                          : "bg-white text-zinc-400 border-zinc-200 hover:border-zinc-300"
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
                          "bg-white rounded-2xl p-5 border transition-all duration-300 relative",
                          isCompleted ? "opacity-40 border-zinc-200 grayscale" : "border-zinc-200 shadow-sm"
                        )}
                        onClick={() => toggleMealComplete(meal.id)}
                     >
                       <div className="flex justify-between items-start mb-4">
                         <div>
                           <div className="flex items-center gap-2">
                             <h3 className="font-display font-semibold text-lg text-zinc-950">{meal.name}</h3>
                             {isCompleted && <CheckCircle2 size={18} className="text-[var(--color-accent)]" />}
                           </div>
                           <div className="flex items-center gap-1.5 text-zinc-500 font-mono text-[10px] mt-1">
                             <Clock size={10} />
                             <span>{meal.time}</span>
                           </div>
                         </div>
                         {meal.options.length > 1 && !isCompleted && (
                           <button 
                             onClick={(e) => {
                               e.stopPropagation();
                               rotateMealOption(meal.id, meal.options.length);
                             }}
                             className="p-2 bg-zinc-100 text-zinc-600 rounded-lg hover:bg-zinc-200 active:rotate-180 transition-all"
                           >
                             <RefreshCcw size={14} />
                           </button>
                         )}
                       </div>

                       <div className="space-y-2 mb-6">
                          {option.items.filter(item => !data.deletedItems?.includes(item)).map((item, i) => (
                            <ItemLongPress 
                              key={i} 
                              item={item}
                              className="flex items-start gap-3 cursor-pointer select-none group"
                              onEdit={(original: string) => setEditingItemModal({ isOpen: true, original, text: data.editedItems?.[original] || original })}
                            >
                              <div className="w-1.5 h-1.5 rounded-full bg-zinc-600 mt-1.5 shrink-0 group-hover:bg-zinc-800 transition-colors" />
                              <span className="text-zinc-700 text-sm leading-relaxed group-hover:text-zinc-950 transition-colors">{data.editedItems?.[item] || item}</span>
                            </ItemLongPress>
                          ))}
                       </div>

                       {/* Medicines */}
                       {option.medicines && (
                         <div className="mb-6 flex items-center gap-2 bg-zinc-100 text-zinc-800 px-3 py-2 rounded-lg text-xs font-mono w-fit">
                           <Pill size={12} />
                           <span>{option.medicines.join(', ')}</span>
                         </div>
                       )}

                       {/* Macros */}
                       <div className="flex gap-2 pt-4 border-t border-zinc-100">
                          <MacroBadge label="PR" value={option.p} />
                          <MacroBadge label="CB" value={option.c} />
                          <MacroBadge label="FT" value={option.f} />
                          <MacroBadge label="FB" value={option.fib} />
                       </div>
                     </div>
                   );
                 })}
               </div>
             </motion.div>
          )}
           {activeTab === 'profile' && (
             <motion.div key="profile" initial={{opacity:0, x:20}} animate={{opacity:1, x:0}} exit={{opacity:0, x:-20}} className="space-y-6">
                <section className="bg-white rounded-2xl p-6 shadow-sm border border-zinc-200 text-center">
                   <div className="w-24 h-24 bg-zinc-50 rounded-full flex items-center justify-center mx-auto mb-6 border border-zinc-200 shadow-sm">
                      <User size={40} className="text-zinc-300" />
                   </div>
                   <h2 className="text-3xl font-display font-semibold tracking-tight text-zinc-950">Athlete</h2>
                   <p className="text-xs font-mono text-zinc-400 mt-1 uppercase tracking-widest">System Ready</p>
                </section>

                <section className="grid grid-cols-2 gap-4">
                   <div className="bg-white rounded-2xl p-6 border border-zinc-200 shadow-sm flex flex-col items-center">
                      <Flame size={20} className="text-[var(--color-accent)] mb-3" />
                      <p className="text-3xl font-display font-bold text-zinc-950">
                         {Object.keys(data.completedMeals).length}
                      </p>
                      <p className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 mt-2">Active Days</p>
                   </div>
                   <div className="bg-white rounded-2xl p-6 border border-zinc-200 shadow-sm flex flex-col items-center">
                      <Droplets size={20} className="text-zinc-950 mb-3" />
                      <p className="text-3xl font-display font-bold text-zinc-950">
                         {(Object.values(data.waterIntake) as number[]).reduce((a,b)=>a+(b/1000),0).toFixed(1)}L
                      </p>
                      <p className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 mt-2">Total Vol</p>
                   </div>
                </section>
                
                <section className="bg-white rounded-2xl p-2 shadow-sm border border-zinc-200 flex flex-col gap-1">
                   <button 
                     {...resetTodayProgress.handlers}
                     className="w-full text-left px-5 py-4 text-orange-600 bg-white hover:bg-orange-50 rounded-xl font-semibold text-sm flex justify-between items-center relative overflow-hidden select-none border border-orange-100"
                   >
                     <div 
                       className="absolute left-0 top-0 bottom-0 bg-orange-100 z-0" 
                       style={{ width: `${resetTodayProgress.progress * 100}%` }} 
                     />
                     <span className="relative z-10 flex items-center gap-2">
                       Reset Today
                       {resetTodayProgress.isPressing && <span className="text-[10px] font-mono text-orange-500">HOLD</span>}
                     </span>
                     <div className="relative z-10 w-5 h-5 rounded-full border-2 border-orange-200 flex items-center justify-center">
                       {resetTodayProgress.isPressing && (
                         <svg className="w-5 h-5 absolute inset-0 -rotate-90 text-orange-500" viewBox="0 0 24 24">
                           <circle 
                             cx="12" cy="12" r="10" 
                             fill="none" 
                             stroke="currentColor" 
                             strokeWidth="4" 
                             strokeDasharray={2 * Math.PI * 10} 
                             strokeDashoffset={2 * Math.PI * 10 * (1 - resetTodayProgress.progress)} 
                           />
                         </svg>
                       )}
                       {!resetTodayProgress.isPressing && <ChevronRight size={14} className="text-orange-400" />}
                     </div>
                   </button>

                   <button 
                     {...formatProgress.handlers}
                     className="w-full text-left px-5 py-4 text-red-600 bg-white hover:bg-red-50 rounded-xl font-semibold text-sm flex justify-between items-center relative overflow-hidden select-none border border-red-100"
                   >
                     <div 
                       className="absolute left-0 top-0 bottom-0 bg-red-100 z-0" 
                       style={{ width: `${formatProgress.progress * 100}%` }} 
                     />
                     <span className="relative z-10 flex items-center gap-2">
                       Format System
                       {formatProgress.isPressing && <span className="text-[10px] font-mono text-red-500">HOLD</span>}
                     </span>
                     <div className="relative z-10 w-5 h-5 rounded-full border-2 border-red-200 flex items-center justify-center">
                       {formatProgress.isPressing && (
                         <svg className="w-5 h-5 absolute inset-0 -rotate-90 text-red-500" viewBox="0 0 24 24">
                           <circle 
                             cx="12" cy="12" r="10" 
                             fill="none" 
                             stroke="currentColor" 
                             strokeWidth="4" 
                             strokeDasharray={2 * Math.PI * 10} 
                             strokeDashoffset={2 * Math.PI * 10 * (1 - formatProgress.progress)} 
                           />
                         </svg>
                       )}
                       {!formatProgress.isPressing && <ChevronRight size={14} className="text-red-400" />}
                     </div>
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
                <div className="bg-zinc-950 rounded-2xl p-6 text-zinc-100 shadow-xl relative">
                   <div className="absolute inset-0 overflow-hidden rounded-2xl pointer-events-none z-0">
                     <div className="absolute right-0 top-0 opacity-5 transform translate-x-4 -translate-y-4 text-zinc-100">
                        <ShoppingCart size={140} />
                     </div>
                   </div>
                   <div className={cn("flex justify-between items-start relative", isCartDropdownOpen ? "z-[60]" : "z-10")}>
                     <div className="pr-4">
                       <h2 className="text-3xl font-display font-semibold tracking-tight mb-2">Logistics</h2>
                       <p className="text-zinc-400 text-sm font-mono tracking-tight">Auto-generated resupply manifest.</p>
                     </div>
                     <div className={cn("relative shrink-0", isCartDropdownOpen && "z-[60]")}>
                       <button
                         onClick={() => setIsCartDropdownOpen(!isCartDropdownOpen)}
                         className="bg-zinc-800 hover:bg-zinc-700 active:scale-95 transition-all rounded-xl px-3 py-2 flex items-center gap-2 border border-zinc-700 shadow-sm"
                       >
                         <span className="bg-transparent text-zinc-100 font-mono text-[10px] uppercase tracking-widest outline-none">{cartDuration} Days</span>
                         <ChevronDown size={12} className={cn("text-zinc-400 transition-transform duration-300", isCartDropdownOpen && "rotate-180")} />
                       </button>

                       <AnimatePresence>
                         {isCartDropdownOpen && (
                           <>
                             <div 
                               className="fixed inset-0 z-40" 
                               onClick={() => setIsCartDropdownOpen(false)} 
                             />
                             <motion.div 
                               initial={{ opacity: 0, y: -10, scale: 0.95 }}
                               animate={{ opacity: 1, y: 0, scale: 1 }}
                               exit={{ opacity: 0, y: -10, scale: 0.95 }}
                               transition={{ duration: 0.15, ease: "easeOut" }}
                               className="absolute right-0 top-full mt-2 w-36 bg-zinc-800 border border-zinc-700 rounded-xl shadow-2xl overflow-hidden z-50 origin-top-right"
                             >
                               {[7, 14, 30].map(val => (
                                 <button
                                   key={val}
                                   onClick={() => {
                                     setCartDuration(val);
                                     setIsCartDropdownOpen(false);
                                   }}
                                   className={cn(
                                     "w-full text-left px-4 py-3 font-mono text-[10px] uppercase tracking-widest transition-colors flex items-center justify-between group",
                                     cartDuration === val 
                                      ? "bg-zinc-700/50 text-[var(--color-accent)] font-bold" 
                                      : "text-zinc-300 hover:bg-zinc-700 hover:text-white"
                                   )}
                                 >
                                   {val} Days
                                   {cartDuration === val && <Check size={12} className="text-[var(--color-accent)]" />}
                                 </button>
                               ))}
                             </motion.div>
                           </>
                         )}
                       </AnimatePresence>
                     </div>
                   </div>
                </div>

                <div className="space-y-6">
                   {(Object.entries(groceryList) as [string, string[]][]).map(([category, items]) => {
                      if (items.length === 0) return null;
                      return (
                         <section key={category} className="bg-white rounded-2xl p-5 shadow-sm border border-zinc-200">
                            <h3 className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest mb-4 flex items-center justify-between">
                               {category}
                               <span className="bg-zinc-100 text-zinc-500 px-2 py-0.5 rounded text-[10px]">{items.length}</span>
                            </h3>
                            <div className="space-y-3">
                               {items.map((item, idx) => {
                                  const isChecked = data.groceryChecklist?.[item] || false;
                                  const displayItem = multiplyItem(data.editedItems?.[item] || item, cartDuration);
                                  return (
                                     <ItemLongPress 
                                        key={idx} 
                                        item={item}
                                        onEdit={(original: string) => setEditingItemModal({ isOpen: true, original, text: data.editedItems?.[original] || original })}
                                        className={cn("flex items-start gap-3 cursor-pointer group transition-all select-none", isChecked && "opacity-40 grayscale")}
                                     >
                                        <input type="checkbox" className="hidden" checked={isChecked} onChange={() => toggleGroceryItem(item)} />
                                        <div 
                                          onClick={(e) => {
                                             // we can just let it propagate to ItemLongPress's onClick
                                             // but wait, input checkbox needs to be toggled
                                             // ItemLongPress intercepts onClick and handles it
                                             // so we should just call toggleGroceryItem
                                             e.preventDefault();
                                             toggleGroceryItem(item);
                                          }}
                                          className={cn("w-5 h-5 rounded flex items-center justify-center border transition-all mt-0.5 shrink-0 pointer-events-auto", isChecked ? "bg-[var(--color-accent)] border-[var(--color-accent)]" : "border-zinc-300 bg-zinc-50 group-hover:border-zinc-500")}
                                        >
                                           {isChecked && <Check size={14} className="text-white" />}
                                        </div>
                                        <span onClick={(e) => { e.preventDefault(); toggleGroceryItem(item); }} className={cn("text-sm transition-all pointer-events-auto", isChecked ? "text-zinc-400 line-through" : "text-zinc-800")}>{displayItem}</span>
                                     </ItemLongPress>
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

      {/* Modals */}
      <AnimatePresence>
        {confirmModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-zinc-950/40 backdrop-blur-sm"
              onClick={() => setConfirmModal(null)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-3xl p-6 shadow-2xl relative w-full max-w-sm border border-zinc-200"
            >
               <h3 className="text-xl font-display font-bold text-zinc-950 mb-2">Confirm Action</h3>
               <p className="text-sm text-zinc-500 mb-6">{confirmModal.message}</p>
               <div className="flex gap-3">
                 <button 
                   onClick={() => setConfirmModal(null)}
                   className="flex-1 bg-zinc-100 text-zinc-600 font-bold py-3 rounded-xl hover:bg-zinc-200 transition-colors"
                 >
                   Cancel
                 </button>
                 <button 
                   onClick={() => {
                     confirmModal.action();
                     setConfirmModal(null);
                   }}
                   className="flex-1 bg-red-500 text-white font-bold py-3 rounded-xl hover:bg-red-600 transition-colors shadow-lg shadow-red-500/20"
                 >
                   Confirm
                 </button>
               </div>
            </motion.div>
          </div>
        )}

        {waterReminderModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-zinc-950/40 backdrop-blur-sm"
              onClick={() => setWaterReminderModal(false)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-3xl p-6 shadow-2xl relative w-full max-w-sm border border-zinc-200 text-center"
            >
               <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                 <Droplets size={32} className="text-blue-500" />
               </div>
               <h3 className="text-2xl font-display font-bold text-zinc-950 mb-2">Hydration Check</h3>
               <p className="text-sm text-zinc-500 mb-6">It's been over 3 hours since your last water log. Drink up and stay optimized.</p>
               <button 
                 onClick={() => {
                   updateWater();
                   setWaterReminderModal(false);
                 }}
                 className="w-full bg-[var(--color-accent)] text-white font-bold py-4 rounded-xl hover:bg-[var(--color-accent-hover)] transition-colors shadow-lg shadow-[var(--color-accent)]/20"
               >
                 Log 250ml Now
               </button>
               <button 
                 onClick={() => setWaterReminderModal(false)}
                 className="w-full mt-3 text-zinc-400 text-sm font-semibold py-2"
               >
                 Dismiss
               </button>
            </motion.div>
          </div>
        )}

        {weeklySummaryModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
               initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
               className="absolute inset-0 bg-zinc-950/60 backdrop-blur-md"
               onClick={() => setWeeklySummaryModal(null)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 40 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 40 }}
              className="bg-zinc-950 text-white rounded-3xl p-8 shadow-2xl relative w-full max-w-sm border border-zinc-800 text-center overflow-hidden"
            >
               <Sparkles size={48} className="text-[var(--color-accent)] mx-auto mb-6" />
               <h3 className="text-3xl font-display font-bold tracking-tight mb-2">Weekly Review</h3>
               <p className="text-zinc-400 font-mono text-xs uppercase tracking-widest mb-8">Performance Data</p>
               
               <div className="grid grid-cols-2 gap-4 mb-8">
                 <div className="bg-zinc-900 rounded-2xl p-4 border border-zinc-800">
                    <Droplets size={20} className="text-blue-400 mx-auto mb-2" />
                    <p className="text-2xl font-display font-bold">
                       {(weeklySummaryModal.hydrationAvg / 1000).toFixed(1)}<span className="text-sm font-normal text-zinc-500">L</span>
                    </p>
                    <p className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest mt-1">Avg Water</p>
                 </div>
                 <div className="bg-zinc-900 rounded-2xl p-4 border border-zinc-800">
                    <Flame size={20} className="text-[var(--color-accent)] mx-auto mb-2" />
                    <p className="text-2xl font-display font-bold">
                       {weeklySummaryModal.mealAvg.toFixed(1)}
                    </p>
                    <p className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest mt-1">Avg Meals</p>
                 </div>
               </div>

               <button 
                 onClick={() => setWeeklySummaryModal(null)}
                 className="w-full bg-white text-zinc-950 font-bold py-4 rounded-xl hover:bg-zinc-100 transition-colors"
               >
                 Acknowledge
               </button>
            </motion.div>
          </div>
        )}
        {editingItemModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
               initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
               className="absolute inset-0 bg-zinc-950/40 backdrop-blur-sm"
               onClick={() => setEditingItemModal(null)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-3xl p-6 shadow-2xl relative w-full max-w-sm border border-zinc-200"
            >
               <h3 className="text-xl font-display font-bold text-zinc-950 mb-4">Edit Item</h3>
               
               <input
                 type="text"
                 autoFocus
                 value={editingItemModal.text}
                 onChange={(e) => setEditingItemModal(prev => prev ? {...prev, text: e.target.value} : null)}
                 className="w-full bg-zinc-100 border border-zinc-200 rounded-xl px-4 py-3 text-zinc-900 font-medium mb-6 focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/50 transition-all"
               />

               <div className="flex gap-3">
                 <button 
                   onClick={() => {
                     setData(prev => ({
                       ...prev,
                       deletedItems: [...(prev.deletedItems || []), editingItemModal.original]
                     }));
                     setEditingItemModal(null);
                   }}
                   className="flex-1 bg-red-50 text-red-600 font-bold py-3 rounded-xl hover:bg-red-100 transition-colors"
                 >
                   Delete
                 </button>
                 <button 
                   onClick={() => {
                     setData(prev => ({
                       ...prev,
                       editedItems: { ...prev.editedItems, [editingItemModal.original]: editingItemModal.text }
                     }));
                     setEditingItemModal(null);
                   }}
                   className="flex-[2] bg-zinc-900 text-white font-bold py-3 rounded-xl hover:bg-zinc-800 transition-colors"
                 >
                   Save
                 </button>
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Bottom Nav */}
      <div className="fixed bottom-6 left-0 right-0 flex justify-center z-50 px-4 pointer-events-none">
        <nav className="bg-white/90 backdrop-blur-2xl border border-zinc-200/80 p-2 flex justify-between items-center rounded-3xl shadow-2xl shadow-zinc-200/50 w-full max-w-sm pointer-events-auto">
          <div className="flex gap-1">
             <NavButton 
               active={activeTab === 'chart'} 
               onClick={() => setActiveTab('chart')}
               icon={<TrendingUp size={20} />}
               label="Log"
             />
             <NavButton 
               active={activeTab === 'meals'} 
               onClick={() => setActiveTab('meals')}
               icon={<UtensilsCrossed size={20} />}
               label="Fuel"
             />
          </div>
          
          <div className="px-1">
            <button 
              id="nav-dashboard-btn"
              onClick={() => {
                if (window.navigator && window.navigator.vibrate) {
                  window.navigator.vibrate(50);
                }
                setActiveTab('dashboard');
              }}
              className={cn(
                "w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300 mx-auto",
                activeTab === 'dashboard' 
                  ? "bg-[var(--color-accent)] text-white shadow-xl shadow-[var(--color-accent)]/50 scale-110 drop-shadow-lg" 
                  : "bg-zinc-100 text-zinc-500 hover:bg-zinc-200 hover:text-zinc-950 scale-100"
              )}
            >
              <LayoutDashboard size={22} />
            </button>
          </div>

          <div className="flex gap-1">
             <NavButton 
               active={activeTab === 'groceries'} 
               onClick={() => setActiveTab('groceries')}
               icon={<ShoppingCart size={20} />}
               label="Supply"
             />
             <NavButton 
               active={activeTab === 'profile'} 
               onClick={() => setActiveTab('profile')}
               icon={<User size={20} />}
               label="Profile"
             />
          </div>
        </nav>
      </div>
    </div>
  );
}

function NavButton({ active, icon, label, onClick }: { active: boolean, icon: ReactNode, label: string, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "flex flex-col items-center justify-center w-14 h-14 rounded-2xl gap-1 transition-all duration-300",
        active ? "text-[var(--color-accent)] bg-[var(--color-accent)]/10 scale-105" : "text-zinc-400 hover:text-zinc-600 hover:bg-zinc-50"
      )}
    >
      {icon}
      <span className="text-[8px] font-mono font-bold uppercase tracking-widest">{label}</span>
    </button>
  );
}

function MacroBadge({ label, value }: { label: string, value: number }) {
  return (
    <div className="bg-zinc-50 px-2.5 py-1.5 rounded flex flex-col items-center gap-0.5 min-w-[3rem] border border-zinc-100">
      <span className="text-[9px] font-mono font-bold text-zinc-400">{label}</span>
      <span className="text-xs font-mono font-bold text-zinc-950">{value}g</span>
    </div>
  );
}
