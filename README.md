# Personal Diet Assistant

A zero-dependency, single-file web app for tracking daily calorie intake vs. expenditure on a calendar view — with goal tracking and BMR/TDEE tools built in.

**Live demo → [yuandesu.github.io/personal-diet-assistant](https://yuandesu.github.io/personal-diet-assistant)**

## Features

### Calendar View
- Click any date to log calories in and out
- Each day displays the net calorie difference (intake − burn)
- Color-coded: green = deficit (burning more than eating), red = surplus

### Goal Tracking
- Set a target weight loss (kg) and a deadline date
- Based on the 7,700 kcal/kg principle
- Shows cumulative deficit, remaining deficit, days left, and the daily deficit needed to stay on track

### Step Counter → Calories
- Enter your step count in the daily log modal
- Auto-converts to kcal using the ACSM formula:
  `calories = (steps ÷ 2000) × 0.57 cal/lb × body weight`
- "Add to burn" button adds the result directly to your burn field

### BMR / TDEE Calculator (separate tab)
- Uses the **Mifflin-St Jeor (1990)** equation — the most widely recommended formula by dietitian associations
  - Male: `BMR = 10W + 6.25H − 5A + 5`
  - Female: `BMR = 10W + 6.25H − 5A − 161`
- TDEE = BMR × activity multiplier (1.2 – 1.9)
- Body weight is shared with the step-to-calorie converter

## Usage

No installation needed. Open `index.html` directly in any modern browser.

All data is stored in **localStorage** — nothing leaves your device.

## Formulas & References

| Feature | Formula | Source |
|---|---|---|
| BMR | Mifflin-St Jeor equation | Mifflin et al., *JADA* 1990 |
| TDEE | BMR × activity factor | Harris-Benedict revised coefficients |
| Steps → kcal | `(steps / 2000) × 0.57 × weight_lbs` | ACSM Guidelines |
| Weight loss | 1 kg ≈ 7,700 kcal deficit | Standard clinical reference |
