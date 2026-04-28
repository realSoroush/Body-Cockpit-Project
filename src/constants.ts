import { Meal } from './lib/utils';

export const MEAL_PLAN: Meal[] = [
  {
    id: 'pre_breakfast',
    name: 'Morning Fasting',
    time: '07:00 AM',
    options: [
      {
        description: 'Water & Lemon',
        items: ['1 glass of warm water', 'few drops of fresh lemon'],
        p: 0, c: 1, f: 0, fib: 0
      }
    ]
  },
  {
    id: 'breakfast',
    name: 'Breakfast',
    time: '08:30 AM',
    options: [
      {
        description: 'Menu 1: Egg Whites & Toast',
        items: ['6 Egg whites', '2 Whole wheat toasts', '60g Low-fat cheese', '2 Walnuts', 'Green tea'],
        p: 35, c: 30, f: 12, fib: 4
      },
      {
        description: 'Menu 2: Oats & Peanut Butter',
        items: ['1 Banana', '50g Oats', '1 tbsp Honey', '2 Walnuts', '250ml Low-fat milk', '1 slice Barley bread', '1 tbsp Peanut butter'],
        p: 22, c: 65, f: 18, fib: 8
      }
    ]
  },
  {
    id: 'mid_morning',
    name: 'Mid-Morning Snack',
    time: '11:00 AM',
    options: [
      // Training Day Variant (index 0)
      {
        description: 'Protein Shake (Training)',
        items: ['1 scoop Whey Protein', 'Low-fat milk/yogurt'],
        p: 30, c: 10, f: 3, fib: 0
      },
      // Normal Day Variant (index 1) - We handle this via isWorkoutSpecific logic in display
      {
        description: 'Lentils & Apple (Normal)',
        items: ['Small bowl of Lentils', '1 Apple with skin'],
        p: 12, c: 35, f: 1, fib: 10
      }
    ]
  },
  {
    id: 'lunch',
    name: 'Lunch',
    time: '01:30 PM',
    options: [
      {
        description: 'Rice & Chicken',
        items: ['130g Raw Rice (3/4 plate cooked)', '200g Cooked chicken breast', 'Salad with lemon/olive oil'],
        p: 55, c: 45, f: 8, fib: 5
      },
      {
        description: 'Pasta & Soy',
        items: ['1 cup Cooked pasta', '50g Soy', 'Green veggies'],
        p: 25, c: 50, f: 4, fib: 6
      },
      {
        description: 'Grilled Fish',
        items: ['130g Raw Rice', '220g Grilled fish', 'Lemon'],
        p: 50, c: 45, f: 10, fib: 3
      }
    ]
  },
  {
    id: 'pre_workout',
    name: 'Pre-Workout',
    time: '04:00 PM',
    isWorkoutSpecific: 'training',
    options: [
      {
        description: 'Caffeine Boost',
        items: ['1 Caffeine pill (200mg)'],
        p: 0, c: 0, f: 0, fib: 0,
        medicines: ['Caffeine 200mg']
      }
    ]
  },
  {
    id: 'post_workout',
    name: 'Post-Workout / Snack 1',
    time: '06:00 PM',
    options: [
      {
        description: 'Potato & Chicken (Training)',
        items: ['1 Boiled potato', '100g Chicken breast'],
        p: 30, c: 30, f: 2, fib: 3
      },
      {
        description: 'Whey & Nuts (Normal)',
        items: ['0.5 scoop Whey Protein', 'Handful of raw nuts'],
        p: 15, c: 8, f: 12, fib: 2
      }
    ]
  },
  {
    id: 'snack_2',
    name: 'Light Snack',
    time: '07:30 PM',
    options: [
      {
        description: 'Fresh Salad',
        items: ['Lettuce', 'Tomato', 'Carrot', 'Wheat germ'],
        p: 2, c: 10, f: 0, fib: 6
      }
    ]
  },
  {
    id: 'dinner',
    name: 'Dinner',
    time: '09:30 PM',
    options: [
      {
        description: 'Chicken & Veggies',
        items: ['180g Chicken breast', '1 carrot', 'Green beans', '1 Toast'],
        p: 45, c: 20, f: 5, fib: 4
      },
      {
        description: 'Steak & Greens',
        items: ['170g Red meat', 'Low-fat cheese slice', 'Fresh herbs', '1 Toast'],
        p: 42, c: 15, f: 18, fib: 3
      },
      {
        description: 'Fish & Potato',
        items: ['200g Fish', '1 Grilled potato', 'Handful of seeds'],
        p: 48, c: 25, f: 12, fib: 3
      }
    ]
  },
  {
    id: 'bedtime',
    name: 'Before Sleep',
    time: '11:00 PM',
    options: [
      {
        description: 'Milk',
        items: ['1 glass Low-fat milk'],
        p: 8, c: 12, f: 2, fib: 0
      }
    ]
  }
];

export const MOTIVATIONAL_TIPS = [
  "Consistency is the key to all progress. If you can't be perfect, just be persistent.",
  "Your body is a high-performance machine; fuel it like one.",
  "Success is the sum of small efforts, repeated day-in and day-out.",
  "Discipline is choosing between what you want now and what you want most.",
  "A one-hour workout is only 4% of your day. No excuses.",
  "Slow progress is still progress. Don't compare your Chapter 1 to someone else's Chapter 20.",
  "Drink water like your life depends on it—because it does.",
  "The only bad workout is the one that didn't happen.",
  "Eat for the body you want, not the body you have.",
  "Focus on the feeling of accomplishment after a cold shower or a heavy set.",
  "Hydrated muscles perform better. Keep that bottle full!",
  "Sleep is your secret weapon for recovery. Aim for 7-9 hours.",
  "You don't have to be great to start, but you have to start to be great.",
  "Motivation gets you started. Habit is what keeps you going.",
  "Your transformation is a marathon, not a sprint. Enjoy the journey."
];
