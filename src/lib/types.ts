export interface User {
  id: string
  email: string
  name: string | null
  height_cm: number | null
  birth_date: string | null
  gender: 'male' | 'female' | 'other' | null
  timezone: string
  created_at: string
}

export interface BodyMetric {
  id: number
  user_id: string
  measured_at: string
  weight_kg: number | null
  fat_pct: number | null
  muscle_kg: number | null
  bmi: number | null
  source: 'manual' | 'garmin_scale'
}

export type TimeOfDayBucket = 'morning' | 'midday' | 'evening'

export function getTimeOfDayBucket(iso: string): TimeOfDayBucket {
  const h = new Date(iso).getHours()
  if (h >= 5 && h < 10) return 'morning'
  if (h >= 10 && h < 16) return 'midday'
  return 'evening'
}

export interface DailySummary {
  id: number
  user_id: string
  date: string
  bmr_kcal: number
  active_kcal: number
  steps_kcal: number
  consumed_kcal: number
  protein_g: number
  carbs_g: number
  fat_g: number
  net_balance: number
}

export interface NutritionEntry {
  id: number
  user_id: string
  logged_at: string
  food_name: string
  grams: number | null
  kcal: number
  protein_g: number | null
  carbs_g: number | null
  fat_g: number | null
  entry_method: 'photo' | 'text' | 'manual'
  raw_input: string | null
  ai_model_used: string | null
}

export interface ExerciseSet {
  reps: number
  weight_kg: number
  notes: string | null
}

export interface Exercise {
  name: string
  sets: ExerciseSet[]
}

export interface Workout {
  id: number
  user_id: string
  jefit_log_id: string | null
  workout_date: string
  plan_name: string | null
  duration_min: number | null
  total_volume_kg: number | null
  exercises: Exercise[]
}

export interface Activity {
  id: number
  user_id: string
  garmin_activity_id: number | null
  activity_type: string
  started_at: string
  duration_seconds: number | null
  distance_meters: number | null
  calories: number | null
  hr_avg: number | null
  hr_max: number | null
  hr_zones: {
    z1_pct: number
    z2_pct: number
    z3_pct: number
    z4_pct: number
    z5_pct: number
  } | null
  cadence_avg: number | null
  pace_avg_sec_km: number | null
  vo2max_estimate: number | null
}

export interface HealthMetric {
  id: number
  user_id: string
  recorded_at: string
  metric_type: 'hr_resting' | 'hrv' | 'stress' | 'spo2' | 'steps' | 'vo2max' | 'fitness_age'
  value: number
  unit: string | null
}

export interface PersonalRecord {
  id: number
  user_id: string
  exercise_name: string
  record_type: string
  value: number
  achieved_at: string | null
}

export interface AiInsight {
  id: number
  user_id: string
  insight_date: string
  model_used: string | null
  content: string
}

export interface ChatMessage {
  id: number
  user_id: string
  session_id: string | null
  role: 'user' | 'assistant' | 'system'
  content: string
  model_used: string | null
  created_at: string
}
