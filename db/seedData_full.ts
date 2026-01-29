/**
 * Comprehensive seed data for exercise definitions
 * This file contains a more extensive list of popular exercises organized by body part
 * and activity type, with appropriate types and units for each exercise.
 */

import { ExerciseType } from "@/types/workout";

interface ExerciseDefinition {
  id?: string;
  name: string;
  category: string;
  type: ExerciseType;
  unit: string;
  description: string;
}

/**
 * Comprehensive exercise definitions organized by category
 * Each category contains up to 20 of the most popular and mainstream exercises
 */
export const INITIAL_EXERCISE_DEFINITIONS: ExerciseDefinition[] = [
  // Chest
  {
    name: "Barbell Bench Press",
    category: "Chest",
    type: "weight_reps",
    unit: "kg",
    description:
      "Lie flat on a bench with feet planted firmly on the floor. Grip the bar slightly wider than shoulder-width, retract your shoulder blades, and press the bar up until arms are fully extended. Lower with control to mid-chest, keeping elbows tucked at roughly 45 degrees.",
  },
  {
    name: "Dumbbell Bench Press",
    category: "Chest",
    type: "weight_reps",
    unit: "kg",
    description:
      "Lie on a flat bench holding dumbbells at shoulder level, palms facing forward. Press both dumbbells up until arms are straight and dumbbells nearly touch. Lower slowly with control, feeling a stretch across the chest.",
  },
  {
    name: "Incline Bench Press",
    category: "Chest",
    type: "weight_reps",
    unit: "kg",
    description:
      "Set bench to 30-45 degree incline. Lie back with feet flat on the floor. Grip the bar and press from upper chest, extending arms fully. Lower to upper chest/clavicle area, keeping shoulder blades retracted throughout the movement.",
  },
  {
    name: "Decline Bench Press",
    category: "Chest",
    type: "weight_reps",
    unit: "kg",
    description:
      "Secure legs in decline bench set to 15-30 degrees. Grip bar slightly wider than shoulders and press from lower chest position. Lower bar to lower sternum, feeling engagement in lower pectoral muscles.",
  },
  {
    name: "Chest Fly Machine",
    category: "Chest",
    type: "weight_reps",
    unit: "kg",
    description:
      "Sit with back flat against pad, arms at 90 degrees on handles. Bring handles together in an arc motion, squeezing chest at peak contraction. Return slowly with control, feeling a deep stretch without letting weights touch down.",
  },
  {
    name: "Cable Crossover",
    category: "Chest",
    type: "weight_reps",
    unit: "kg",
    description:
      "Set cables high and stand in center with staggered stance. Lean slightly forward, keeping core tight. Bring handles down and together in front of hips, squeezing chest. Return with control, maintaining constant tension through full range of motion.",
  },
  {
    name: "Push-ups",
    category: "Chest",
    type: "reps",
    unit: "reps",
    description:
      "Start in plank position with hands slightly wider than shoulders. Lower body until chest nearly touches floor, keeping core tight. Push back to starting position, fully extending arms at top. Keep body in straight line throughout.",
  },
  {
    name: "Dips (Chest Focus)",
    category: "Chest",
    type: "reps",
    unit: "reps",
    description:
      "Use parallel bars and lean forward 30-45 degrees to emphasize chest. Lower until upper arms are parallel to floor or slightly below. Press up through palms, focusing on chest contraction rather than triceps.",
  },
  {
    name: "Incline Dumbbell Press",
    category: "Chest",
    type: "weight_reps",
    unit: "kg",
    description:
      "Set bench to 30-45 degree incline. Start with dumbbells at shoulder level, palms facing forward. Press up and slightly together, squeezing upper chest at top. Lower with control to starting position.",
  },
  {
    name: "Decline Dumbbell Press",
    category: "Chest",
    type: "weight_reps",
    unit: "kg",
    description:
      "Secure legs in decline bench. Hold dumbbells at chest level and press up, focusing on lower chest engagement. Lower slowly with control, maintaining proper spinal alignment throughout the movement.",
  },
  {
    name: "Machine Chest Press",
    category: "Chest",
    type: "weight_reps",
    unit: "kg",
    description:
      "Adjust seat so handles align with mid-chest. Sit with back flat and feet on floor. Press handles forward until arms are extended, squeezing chest. Return slowly, controlling the weight without letting plates rest.",
  },
  {
    name: "Pec Deck Machine",
    category: "Chest",
    type: "weight_reps",
    unit: "kg",
    description:
      "Adjust seat so arms are parallel to floor when gripping handles. Keep slight bend in elbows throughout. Bring handles together in front of chest, squeezing at peak. Return slowly, feeling stretch across chest.",
  },
  {
    name: "Wide Grip Push-ups",
    category: "Chest",
    type: "reps",
    unit: "reps",
    description:
      "Place hands wider than shoulder-width, fingers pointing forward. Lower chest toward floor, flaring elbows out more than standard push-ups. Push back up, focusing on chest contraction rather than triceps.",
  },
  {
    name: "Close Grip Push-ups",
    category: "Chest",
    type: "reps",
    unit: "reps",
    description:
      "Position hands directly under shoulders or slightly closer. Keep elbows tucked close to body as you lower. Push up focusing on inner chest and triceps engagement. Maintain straight body line throughout.",
  },
  {
    name: "Medicine Ball Chest Pass",
    category: "Chest",
    type: "reps",
    unit: "reps",
    description:
      "Hold medicine ball at chest level, elbows bent. Explosively push ball forward from chest, either to partner or against wall. Catch rebound and immediately repeat. Focus on explosive chest power and quick hands.",
  },
  {
    name: "Landmine Press",
    category: "Chest",
    type: "weight_reps",
    unit: "kg",
    description:
      "Anchor barbell in landmine attachment or corner. Hold end of bar at chest level with both hands. Press up and forward at 45-degree angle, extending arms fully. Lower with control to upper chest.",
  },
  {
    name: "Floor Press",
    category: "Chest",
    type: "weight_reps",
    unit: "kg",
    description:
      "Lie on floor with knees bent and feet flat. Hold barbell or dumbbells at chest level. Press up until arms lock out, limiting range of motion at bottom. Lower until upper arms touch floor, then press again.",
  },
  {
    name: "Chest Dip Machine",
    category: "Chest",
    type: "weight_reps",
    unit: "kg",
    description:
      "Select appropriate assist weight and kneel on pad. Grip handles and lower body by bending elbows, leaning slightly forward. Push up through palms until arms are extended, focusing on chest contraction.",
  },
  {
    name: "Cable Chest Press",
    category: "Chest",
    type: "weight_reps",
    unit: "kg",
    description:
      "Set cables at chest height, stand facing away from machine in split stance. Press handles forward from chest, extending arms fully. Return with control, maintaining constant tension throughout movement.",
  },
  {
    name: "Single Arm Dumbbell Press",
    category: "Chest",
    type: "weight_reps",
    unit: "kg",
    description:
      "Lie on bench holding one dumbbell at shoulder. Press up while engaging core to prevent rotation. Lower with control, feeling deep stretch in one side of chest. Complete reps, then switch arms.",
  },

  // Back
  {
    name: "Barbell Rows",
    category: "Back",
    type: "weight_reps",
    unit: "kg",
    description:
      "Bend at hips until torso is nearly parallel to floor. Grip bar with overhand grip, hands slightly wider than shoulders. Pull bar to lower chest/upper abdomen, squeezing shoulder blades together. Lower with control.",
  },
  {
    name: "Dumbbell Rows",
    category: "Back",
    type: "weight_reps",
    unit: "kg",
    description:
      "Place one knee and hand on bench for support. Hold dumbbell in other hand, arm extended. Pull dumbbell to hip, keeping elbow close to body and squeezing lat at top. Lower fully before next rep.",
  },
  {
    name: "Pull-ups",
    category: "Back",
    type: "reps",
    unit: "reps",
    description:
      "Hang from bar with overhand grip, hands shoulder-width or wider. Pull body up until chin clears bar, focusing on driving elbows down and back. Lower with control to full arm extension.",
  },
  {
    name: "Chin-ups",
    category: "Back",
    type: "reps",
    unit: "reps",
    description:
      "Hang from bar with underhand grip, hands about shoulder-width. Pull up until chin clears bar, using biceps to assist. Lower slowly with control, feeling stretch in lats at bottom position.",
  },
  {
    name: "Lat Pulldown",
    category: "Back",
    type: "weight_reps",
    unit: "kg",
    description:
      "Sit with thighs secured under pads. Grip bar wider than shoulders, palms facing forward. Pull bar to upper chest, driving elbows down and squeezing lats. Return slowly with arms fully extending.",
  },
  {
    name: "Deadlifts",
    category: "Back",
    type: "weight_reps",
    unit: "kg",
    description:
      "Stand with feet hip-width, bar over mid-foot. Hinge at hips and grip bar just outside legs. Keep back flat, chest up. Push floor away, extending hips forward to lockout. Hinge at hips to lower bar with control.",
  },
  {
    name: "T-Bar Rows",
    category: "Back",
    type: "weight_reps",
    unit: "kg",
    description:
      "Straddle bar with feet shoulder-width. Bend at hips until torso is 45 degrees. Grip handles and pull toward lower chest, squeezing shoulder blades. Keep back flat and core engaged throughout movement.",
  },
  {
    name: "Seated Cable Rows",
    category: "Back",
    type: "weight_reps",
    unit: "kg",
    description:
      "Sit at cable row station with feet on platform, knees slightly bent. Grip attachment and sit upright. Pull to abdomen, driving elbows back and squeezing shoulder blades. Return with control, feeling stretch.",
  },
  {
    name: "Face Pulls",
    category: "Back",
    type: "weight_reps",
    unit: "kg",
    description:
      "Set cable at face height with rope attachment. Pull rope toward face, flaring elbows out to sides. Rotate hands outward at end position, squeezing rear delts and upper back. Return slowly.",
  },
  {
    name: "Reverse Flyes",
    category: "Back",
    type: "weight_reps",
    unit: "kg",
    description:
      "Bend at hips holding dumbbells, palms facing each other. Raise arms out to sides until parallel to floor, squeezing rear delts. Keep slight bend in elbows. Lower with control.",
  },
  {
    name: "One Arm Cable Rows",
    category: "Back",
    type: "weight_reps",
    unit: "kg",
    description:
      "Sit facing cable machine, single handle attachment at mid-height. Pull handle to side of torso, rotating slightly and squeezing lat. Extend arm fully on return, feeling deep stretch in lat.",
  },
  {
    name: "Straight Arm Pulldown",
    category: "Back",
    type: "weight_reps",
    unit: "kg",
    description:
      "Stand facing cable machine, bar attachment set high. Keep arms straight and pull bar down to thighs using lats. Squeeze lats at bottom, then return slowly feeling stretch at top.",
  },
  {
    name: "Hyperextensions",
    category: "Back",
    type: "reps",
    unit: "reps",
    description:
      "Position hips on pad with ankles secured. Cross arms over chest or hold plate. Lower torso until nearly vertical, then raise back to parallel or slightly above. Squeeze glutes and lower back at top.",
  },
  {
    name: "Inverted Rows",
    category: "Back",
    type: "reps",
    unit: "reps",
    description:
      "Set bar at hip height in rack. Lie underneath gripping bar with overhand grip. Keep body straight and pull chest to bar, squeezing shoulder blades. Lower with control, maintaining body rigidity.",
  },
  {
    name: "Wide Grip Lat Pulldown",
    category: "Back",
    type: "weight_reps",
    unit: "kg",
    description:
      "Use wide grip attachment or grip bar wider than shoulders. Sit with thighs secured and pull bar to upper chest, focusing on lat width. Drive elbows down and squeeze lats at contraction.",
  },
  {
    name: "Close Grip Lat Pulldown",
    category: "Back",
    type: "weight_reps",
    unit: "kg",
    description:
      "Use V-bar attachment or grip bar with hands 6-12 inches apart. Pull to upper chest, focusing on lower lat engagement. Keep torso upright and squeeze lats at bottom position.",
  },
  {
    name: "Machine Row",
    category: "Back",
    type: "weight_reps",
    unit: "kg",
    description:
      "Adjust chest pad and foot platform. Grip handles and sit back against pad. Pull handles toward torso, driving elbows back and squeezing shoulder blades. Return slowly to starting position.",
  },
  {
    name: "Cable Straight Arm Pulldown",
    category: "Back",
    type: "weight_reps",
    unit: "kg",
    description:
      "Use straight bar or rope attachment set high. Step back, hinge slightly forward. Keep arms straight and pull attachment down to thighs using only lats. Feel stretch at top, squeeze at bottom.",
  },
  {
    name: "Renegade Rows",
    category: "Back",
    type: "reps",
    unit: "reps",
    description:
      "Start in plank position holding dumbbells. Row one dumbbell to hip while balancing on other. Alternate sides, keeping hips level and core tight. Control rotation throughout movement.",
  },
  {
    name: "Kroc Rows",
    category: "Back",
    type: "weight_reps",
    unit: "kg",
    description:
      "Use heavy dumbbell with straps if needed. Support body on bench with one arm and knee. Row with some body English for momentum, focusing on high reps. Squeeze lat hard at top of each rep.",
  },

  // Shoulders
  {
    name: "Overhead Press",
    category: "Shoulders",
    type: "weight_reps",
    unit: "kg",
    description:
      "Stand with bar at upper chest, grip slightly wider than shoulders. Brace core and press bar overhead until arms lock out. Lower with control to starting position, keeping bar close to face.",
  },
  {
    name: "Dumbbell Shoulder Press",
    category: "Shoulders",
    type: "weight_reps",
    unit: "kg",
    description:
      "Sit on bench with back support. Hold dumbbells at shoulder level, palms forward. Press both dumbbells up until arms extend, nearly touching at top. Lower with control to starting position.",
  },
  {
    name: "Lateral Raises",
    category: "Shoulders",
    type: "weight_reps",
    unit: "kg",
    description:
      "Stand holding dumbbells at sides with slight bend in elbows. Raise arms out to sides until parallel to floor, leading with pinky side. Lower slowly with control, resisting gravity.",
  },
  {
    name: "Front Raises",
    category: "Shoulders",
    type: "weight_reps",
    unit: "kg",
    description:
      "Hold dumbbells in front of thighs. Raise one or both arms forward and up to shoulder height. Lower with control. Keep slight bend in elbows throughout movement.",
  },
  {
    name: "Rear Delt Flyes",
    category: "Shoulders",
    type: "weight_reps",
    unit: "kg",
    description:
      "Bend at hips until torso is nearly parallel to floor. Hold dumbbells with palms facing each other. Raise arms out to sides, squeezing rear delts. Keep slight bend in elbows.",
  },
  {
    name: "Arnold Press",
    category: "Shoulders",
    type: "weight_reps",
    unit: "kg",
    description:
      "Sit holding dumbbells at shoulder height, palms facing you. Press up while rotating wrists so palms face forward at top. Reverse rotation on way down. Full range hits all three delt heads.",
  },
  {
    name: "Upright Rows",
    category: "Shoulders",
    type: "weight_reps",
    unit: "kg",
    description:
      "Hold barbell or dumbbells in front of thighs. Pull weight straight up toward chin, leading with elbows and flaring them out. Lower with control. Keep bar close to body throughout.",
  },
  {
    name: "Shrugs",
    category: "Shoulders",
    type: "weight_reps",
    unit: "kg",
    description:
      "Hold heavy dumbbells or barbell at sides. Shrug shoulders straight up toward ears, squeezing traps hard at top. Hold peak contraction briefly. Lower with control, feeling stretch at bottom.",
  },
  {
    name: "Face Pulls (Shoulders)",
    category: "Shoulders",
    type: "weight_reps",
    unit: "kg",
    description:
      "Set cable at face height with rope attachment. Stand back in athletic stance. Pull rope to face level, rotating hands outward and squeezing rear delts. Return slowly with control.",
  },
  {
    name: "Lateral Raise Machine",
    category: "Shoulders",
    type: "weight_reps",
    unit: "kg",
    description:
      "Adjust seat so pads align with elbows. Sit upright with back against pad. Raise arms out to sides using machine's pivot point. Squeeze medial delts at top, lower with control.",
  },
  {
    name: "Cable Lateral Raises",
    category: "Shoulders",
    type: "weight_reps",
    unit: "kg",
    description:
      "Set cable low, stand with working side closest to machine. Cross body and grip handle. Raise arm out to side until parallel to floor. Maintain constant tension throughout range of motion.",
  },
  {
    name: "Cable Front Raises",
    category: "Shoulders",
    type: "weight_reps",
    unit: "kg",
    description:
      "Set cable low with rope or bar attachment. Stand facing away from machine. Raise arms forward and up to shoulder height, keeping slight bend in elbows. Control the weight on the return.",
  },
  {
    name: "Cable Rear Delt Flyes",
    category: "Shoulders",
    type: "weight_reps",
    unit: "kg",
    description:
      "Set cables at shoulder height, stand in center facing machine. Cross arms grabbing opposite handles. Pull handles out and back, squeezing rear delts. Keep slight bend in elbows throughout.",
  },
  {
    name: "Push Press",
    category: "Shoulders",
    type: "weight_reps",
    unit: "kg",
    description:
      "Start with bar at shoulders. Dip by bending knees slightly, then explosively extend legs and press bar overhead in one motion. Use leg drive to help press more weight overhead.",
  },
  {
    name: "Clean and Press",
    category: "Shoulders",
    type: "weight_reps",
    unit: "kg",
    description:
      "Start with bar on floor. Explosively pull bar to shoulders in clean motion. Dip slightly, then press overhead. Lower bar to floor between reps. Full-body power movement.",
  },
  {
    name: "Single Arm Overhead Press",
    category: "Shoulders",
    type: "weight_reps",
    unit: "kg",
    description:
      "Stand holding one dumbbell at shoulder. Brace core to prevent leaning. Press dumbbell overhead until arm locks out. Lower with control. Complete reps, then switch arms.",
  },
  {
    name: "Dumbbell Front Raise",
    category: "Shoulders",
    type: "weight_reps",
    unit: "kg",
    description:
      "Stand with dumbbells in front of thighs, palms facing body. Raise arms forward and up to shoulder height, keeping slight bend in elbows. Lower slowly with control.",
  },
  {
    name: "Dumbbell Rear Delt Raise",
    category: "Shoulders",
    type: "weight_reps",
    unit: "kg",
    description:
      "Bend at hips until torso is nearly parallel to floor. Hold dumbbells with palms facing each other. Raise arms out to sides, focusing on rear delt contraction. Lower with control.",
  },
  {
    name: "Plate Raises",
    category: "Shoulders",
    type: "weight_reps",
    unit: "kg",
    description:
      "Hold weight plate at sides or front. Raise plate forward or to sides to shoulder height. Excellent for grip endurance and front delt development. Keep controlled tempo.",
  },
  {
    name: "Shoulder Dislocates",
    category: "Shoulders",
    type: "reps",
    unit: "reps",
    description:
      "Hold band or broomstick with wide grip. Slowly rotate arms overhead and behind back, then return forward. Keep arms straight throughout. Great warm-up for shoulder mobility.",
  },

  // Core
  {
    name: "Plank",
    category: "Core",
    type: "time_duration",
    unit: "seconds",
    description:
      "Support body on forearms and toes, elbows under shoulders. Keep body in straight line from head to heels. Engage core, glutes, and quads. Hold position while breathing normally.",
  },
  {
    name: "Russian Twists",
    category: "Core",
    type: "reps",
    unit: "reps",
    description:
      "Sit with knees bent and feet elevated or on floor. Lean back slightly, holding weight or clasping hands. Rotate torso side to side, touching weight to floor beside hips. Keep core engaged.",
  },
  {
    name: "Leg Raises",
    category: "Core",
    type: "reps",
    unit: "reps",
    description:
      "Lie on back with legs extended. Place hands under lower back for support. Lift legs together until perpendicular to floor, then lower with control without letting feet touch down.",
  },
  {
    name: "Bicycle Crunches",
    category: "Core",
    type: "reps",
    unit: "reps",
    description:
      "Lie on back, hands behind head. Bring opposite elbow to opposite knee while extending other leg. Rotate through torso, not just pulling with arms. Alternate sides in cycling motion.",
  },
  {
    name: "Mountain Climbers",
    category: "Core",
    type: "reps",
    unit: "reps",
    description:
      "Start in plank position on hands. Drive one knee toward chest, then quickly switch legs. Keep hips level and core tight. Move at controlled pace, focusing on core engagement.",
  },
  {
    name: "Hanging Leg Raises",
    category: "Core",
    type: "reps",
    unit: "reps",
    description:
      "Hang from pull-up bar with arms extended. Lift legs together until parallel to floor or higher, using lower abs. Control the descent without swinging. Minimize momentum.",
  },
  {
    name: "Cable Woodchoppers",
    category: "Core",
    type: "weight_reps",
    unit: "kg",
    description:
      "Set cable at top or bottom with rope or handle. Stand sideways to machine. Pull cable across body in diagonal chopping motion, rotating through torso. Keep arms straight, power from core.",
  },
  {
    name: "Medicine Ball Slams",
    category: "Core",
    type: "reps",
    unit: "reps",
    description:
      "Hold medicine ball overhead with arms extended. Explosively slam ball down in front of feet using entire body. Catch ball on bounce or pick up and repeat. Full-body power exercise.",
  },
  {
    name: "Side Plank",
    category: "Core",
    type: "time_duration",
    unit: "seconds",
    description:
      "Lie on side, prop body up on forearm with elbow under shoulder. Stack feet and lift hips off floor. Hold body in straight line, engaging obliques. Hold, then switch sides.",
  },
  {
    name: "Reverse Crunches",
    category: "Core",
    type: "reps",
    unit: "reps",
    description:
      "Lie on back with knees bent and feet off floor. Curl knees toward chest by lifting hips off floor, using lower abs. Lower with control without letting feet touch down.",
  },
  {
    name: "Ab Wheel Rollouts",
    category: "Core",
    type: "reps",
    unit: "reps",
    description:
      "Kneel holding ab wheel in front of knees. Roll forward extending body, keeping core tight. Go as far as possible without arching lower back. Pull back to starting position using abs.",
  },
  {
    name: "Cable Crunches",
    category: "Core",
    type: "weight_reps",
    unit: "kg",
    description:
      "Kneel facing cable machine with rope attachment held at head. Crunch down, bringing elbows toward knees while rounding spine. Squeeze abs at bottom, then return to starting position.",
  },
  {
    name: "Flutter Kicks",
    category: "Core",
    type: "reps",
    unit: "reps",
    description:
      "Lie on back with legs extended and hands under glutes. Lift legs slightly off floor and alternate kicking up and down in small scissor motions. Keep lower back pressed to floor.",
  },
  {
    name: "V-Ups",
    category: "Core",
    type: "reps",
    unit: "reps",
    description:
      "Lie flat on back with arms extended overhead. Simultaneously lift legs and torso, reaching hands toward feet in V position. Lower with control without letting limbs touch floor.",
  },
  {
    name: "Scissor Kicks",
    category: "Core",
    type: "reps",
    unit: "reps",
    description:
      "Lie on back with hands under glutes. Lift both legs slightly off floor. Cross one leg over the other in scissor motion, then alternate. Keep core engaged and lower back flat.",
  },
  {
    name: "Medicine Ball Russian Twists",
    category: "Core",
    type: "weight_reps",
    unit: "kg",
    description:
      "Sit holding medicine ball with knees bent and feet elevated. Lean back slightly and rotate ball side to side, touching ball to floor beside hips. Keep core tight throughout.",
  },
  {
    name: "Hanging Knee Raises",
    category: "Core",
    type: "reps",
    unit: "reps",
    description:
      "Hang from pull-up bar with arms extended. Bring knees up toward chest by curling pelvis up. Lower with control without swinging. Easier variation of hanging leg raises.",
  },
  {
    name: "Dead Bug",
    category: "Core",
    type: "reps",
    unit: "reps",
    description:
      "Lie on back with arms extended toward ceiling and knees bent at 90 degrees. Lower opposite arm and leg simultaneously, keeping lower back pressed to floor. Return and alternate sides.",
  },
  {
    name: "Bird Dog",
    category: "Core",
    type: "reps",
    unit: "reps",
    description:
      "Start on hands and knees. Extend opposite arm and leg simultaneously, keeping back flat. Hold briefly, then return to start. Focus on stability and preventing hip/shoulder rotation.",
  },
  {
    name: "Medicine Ball Woodchoppers",
    category: "Core",
    type: "weight_reps",
    unit: "kg",
    description:
      "Stand holding medicine ball at shoulder height. Rotate and bring ball diagonally across body from high to low or low to high. Pivot feet and rotate through torso. Control the movement.",
  },

  // Arms
  {
    name: "Barbell Curl",
    category: "Arms",
    type: "weight_reps",
    unit: "kg",
    description:
      "Stand holding barbell with underhand grip, hands shoulder-width. Curl bar toward shoulders, keeping elbows stationary at sides. Squeeze biceps at top, then lower with control.",
  },
  {
    name: "Dumbbell Curl",
    category: "Arms",
    type: "weight_reps",
    unit: "kg",
    description:
      "Stand or sit holding dumbbells at sides with palms facing forward. Curl both dumbbells toward shoulders, keeping elbows tucked. Rotate wrists outward as you curl. Lower slowly.",
  },
  {
    name: "Tricep Dips",
    category: "Arms",
    type: "reps",
    unit: "reps",
    description:
      "Use parallel bars or bench edge. Support body on hands with arms extended. Lower body by bending elbows until upper arms are parallel to floor. Push back up to starting position.",
  },
  {
    name: "Tricep Pushdown",
    category: "Arms",
    type: "weight_reps",
    unit: "kg",
    description:
      "Stand at cable machine with bar or rope attachment. Keep elbows tucked at sides and push bar down until arms fully extend. Squeeze triceps at bottom. Return with control.",
  },
  {
    name: "Hammer Curls",
    category: "Arms",
    type: "weight_reps",
    unit: "kg",
    description:
      "Hold dumbbells with neutral grip (palms facing each other). Curl both dumbbells toward shoulders keeping palms facing inward throughout. Targets brachialis and forearms along with biceps.",
  },
  {
    name: "Preacher Curls",
    category: "Arms",
    type: "weight_reps",
    unit: "kg",
    description:
      "Sit at preacher bench with upper arms resting on pad. Curl bar or dumbbell up, squeezing biceps at top. Lower with control feeling full stretch at bottom. Eliminates momentum.",
  },
  {
    name: "Overhead Tricep Extension",
    category: "Arms",
    type: "weight_reps",
    unit: "kg",
    description:
      "Hold dumbbell or cable handle overhead with both hands. Lower weight behind head by bending elbows. Keep upper arms close to ears. Extend arms fully, squeezing triceps at top.",
  },
  {
    name: "Concentration Curls",
    category: "Arms",
    type: "weight_reps",
    unit: "kg",
    description:
      "Sit on bench, lean forward with elbow resting on inner thigh. Curl dumbbell toward shoulder, squeezing bicep at peak. Lower with control. Isolates each arm for maximum focus.",
  },
  {
    name: "Close Grip Bench Press",
    category: "Arms",
    type: "weight_reps",
    unit: "kg",
    description:
      "Lie on bench with hands 6-8 inches apart on bar. Lower bar to lower chest, keeping elbows tucked close to body. Press up focusing on triceps rather than chest engagement.",
  },
  {
    name: "Cable Curls",
    category: "Arms",
    type: "weight_reps",
    unit: "kg",
    description:
      "Stand facing cable machine with bar attachment at low position. Curl bar toward shoulders, keeping elbows at sides. Maintain constant tension throughout full range of motion.",
  },
  {
    name: "Skull Crushers",
    category: "Arms",
    type: "weight_reps",
    unit: "kg",
    description:
      "Lie on bench holding EZ bar or dumbbells over chest. Lower weight toward forehead by bending elbows. Keep upper arms stationary. Extend arms fully, squeezing triceps hard.",
  },
  {
    name: "Reverse Curls",
    category: "Arms",
    type: "weight_reps",
    unit: "kg",
    description:
      "Hold barbell or dumbbells with overhand grip. Curl weight up while keeping wrists straight. Targets brachialis and forearm extensors. Lower with control.",
  },
  {
    name: "Cable Tricep Kickbacks",
    category: "Arms",
    type: "weight_reps",
    unit: "kg",
    description:
      "Set cable low with single handle. Bend at hips, upper arm parallel to floor. Extend arm fully behind body, squeezing triceps. Keep upper arm stationary throughout movement.",
  },
  {
    name: "Zottman Curls",
    category: "Arms",
    type: "weight_reps",
    unit: "kg",
    description:
      "Curl dumbbells with palms up, then rotate to palms down at top. Lower with overhand grip. Combines benefits of regular and reverse curls in one movement.",
  },
  {
    name: "Incline Dumbbell Curls",
    category: "Arms",
    type: "weight_reps",
    unit: "kg",
    description:
      "Set bench to 45 degree incline. Lie back holding dumbbells at full extension. Curl dumbbells up, keeping elbows back. Full stretch at bottom creates greater range of motion.",
  },
  {
    name: "Rope Tricep Pushdown",
    category: "Arms",
    type: "weight_reps",
    unit: "kg",
    description:
      "Use rope attachment at cable machine. Keep elbows tucked and push rope down. Separate rope ends at bottom, squeezing triceps hard. Return slowly with control.",
  },
  {
    name: "Spider Curls",
    category: "Arms",
    type: "weight_reps",
    unit: "kg",
    description:
      "Lie face down on incline bench holding dumbbells hanging straight down. Curl weights up without swinging. Eliminates momentum completely, isolating biceps.",
  },
  {
    name: "Diamond Push-ups",
    category: "Arms",
    type: "reps",
    unit: "reps",
    description:
      "Form diamond shape with hands directly under chest. Lower body keeping elbows tucked close to sides. Push up focusing on triceps. More challenging than standard push-ups.",
  },
  {
    name: "Wrist Curls",
    category: "Arms",
    type: "weight_reps",
    unit: "kg",
    description:
      "Sit holding barbell or dumbbells with forearms resting on thighs, palms up. Curl wrists upward, squeezing forearm flexors. Lower with control feeling stretch at bottom.",
  },
  {
    name: "Reverse Wrist Curls",
    category: "Arms",
    type: "weight_reps",
    unit: "kg",
    description:
      "Sit with forearms on thighs, palms facing down. Curl wrists upward, targeting forearm extensors. Lower slowly. Balances forearm development with wrist curls.",
  },

  // Legs
  {
    name: "Barbell Squat",
    category: "Legs",
    type: "weight_reps",
    unit: "kg",
    description:
      "Place bar on upper back/traps. Stand with feet shoulder-width or slightly wider. Brace core, sit back and down until thighs are parallel to floor. Drive through heels to stand, squeezing glutes at top.",
  },
  {
    name: "Leg Press",
    category: "Legs",
    type: "weight_reps",
    unit: "kg",
    description:
      "Sit in leg press machine with feet shoulder-width on platform. Lower platform by bending knees until 90 degrees. Push through heels to extend legs, without locking knees at top.",
  },
  {
    name: "Leg Curl",
    category: "Legs",
    type: "weight_reps",
    unit: "kg",
    description:
      "Lie face down or sit at leg curl machine. Position pad just above ankles. Curl heels toward glutes by flexing knees. Squeeze hamstrings at peak contraction. Lower with control.",
  },
  {
    name: "Leg Extension",
    category: "Legs",
    type: "weight_reps",
    unit: "kg",
    description:
      "Sit with back against pad, shins behind lower pad. Extend legs fully, squeezing quadriceps at top. Lower with control without letting weight stack touch. Great for quad isolation.",
  },
  {
    name: "Lunges",
    category: "Legs",
    type: "weight_reps",
    unit: "kg",
    description:
      "Step forward with one leg, lowering hips until both knees are 90 degrees. Back knee nearly touches floor. Push through front heel to return to standing. Alternate legs.",
  },
  {
    name: "Sumo Deadlifts",
    category: "Legs",
    type: "weight_reps",
    unit: "kg",
    description:
      "Take very wide stance with toes pointing significantly outward. Grip bar inside legs. Keep chest up and back flat as you push through feet to stand. Targets quads and adductors more than conventional.",
  },
  {
    name: "Romanian Deadlifts",
    category: "Legs",
    type: "weight_reps",
    unit: "kg",
    description:
      "Hold bar or dumbbells with slight knee bend. Hinge at hips pushing them back, lowering weight along legs. Stop when you feel hamstring stretch, usually mid-shin. Drive hips forward to stand.",
  },
  {
    name: "Walking Lunges",
    category: "Legs",
    type: "weight_reps",
    unit: "kg",
    description:
      "Step forward into lunge, lowering back knee toward floor. Push through front foot to bring back leg forward into next lunge. Continue walking forward, alternating legs with each step.",
  },
  {
    name: "Bulgarian Split Squats",
    category: "Legs",
    type: "weight_reps",
    unit: "kg",
    description:
      "Place rear foot on bench behind you. Lower into squat on front leg until thigh is parallel to floor. Push through front heel to stand. Complete reps, then switch legs. Intense single-leg exercise.",
  },
  {
    name: "Calf Raises",
    category: "Legs",
    type: "weight_reps",
    unit: "kg",
    description:
      "Stand on edge of step with balls of feet, heels hanging off. Lower heels below step level feeling stretch. Push up onto toes, squeezing calves at top. Hold peak contraction briefly.",
  },
  {
    name: "Hip Thrusts",
    category: "Legs",
    type: "weight_reps",
    unit: "kg",
    description:
      "Sit with upper back against bench, barbell across hips. Drive through heels thrusting hips upward until body is parallel to floor. Squeeze glutes hard at top. Lower with control.",
  },
  {
    name: "Step-ups",
    category: "Legs",
    type: "weight_reps",
    unit: "kg",
    description:
      "Stand facing box or bench. Step up with one foot driving through heel. Bring other foot up to meet. Step back down with same leg leading. Complete reps, then switch lead leg.",
  },
  {
    name: "Goblet Squats",
    category: "Legs",
    type: "weight_reps",
    unit: "kg",
    description:
      "Hold single dumbbell vertically at chest level. Squat down keeping chest up and elbows inside knees. Drive through heels to stand. Great for learning proper squat form.",
  },
  {
    name: "Front Squats",
    category: "Legs",
    type: "weight_reps",
    unit: "kg",
    description:
      "Rest bar on front deltoids with clean grip or arms crossed. Keep elbows high. Squat down keeping torso upright. Drive through heels to stand. More quad-dominant than back squat.",
  },
  {
    name: "Hack Squats",
    category: "Legs",
    type: "weight_reps",
    unit: "kg",
    description:
      "Position shoulders under pads, feet on platform. Lower by bending knees until thighs are parallel to platform. Push through heels to extend legs. Machine provides back support.",
  },
  {
    name: "Good Mornings",
    category: "Legs",
    type: "weight_reps",
    unit: "kg",
    description:
      "Place bar on upper back. With slight knee bend, hinge at hips pushing them back until torso is nearly parallel to floor. Keep back flat. Drive hips forward to return upright.",
  },
  {
    name: "Nordic Curls",
    category: "Legs",
    type: "reps",
    unit: "reps",
    description:
      "Kneel with ankles secured under pad or by partner. Slowly lower body forward using hamstrings to control descent. Catch yourself with hands at bottom, then push back up. Advanced hamstring exercise.",
  },
  {
    name: "Wall Sits",
    category: "Legs",
    type: "time_duration",
    unit: "seconds",
    description:
      "Lean against wall and slide down until knees are 90 degrees. Keep back flat against wall. Hold position without using hands. Feel burn in quadriceps. Great endurance exercise.",
  },
  {
    name: "Box Squats",
    category: "Legs",
    type: "weight_reps",
    unit: "kg",
    description:
      "Set box at parallel height. Squat back until sitting on box, maintaining tight core. Pause briefly without relaxing. Drive through heels to stand. Teaches proper depth and hip drive.",
  },
  {
    name: "Single Leg Press",
    category: "Legs",
    type: "weight_reps",
    unit: "kg",
    description:
      "Sit in leg press machine with one foot centered on platform. Lower weight by bending knee to 90 degrees. Push through heel to extend leg. Complete reps, then switch legs.",
  },

  // Cardio
  {
    name: "Running",
    category: "Cardio",
    type: "distance_time",
    unit: "minutes",
    description:
      "Run at steady pace on treadmill, track, or outdoors. Maintain consistent breathing rhythm. Land midfoot and maintain upright posture. Vary intensity for different training effects.",
  },
  {
    name: "Cycling",
    category: "Cardio",
    type: "distance_time",
    unit: "minutes",
    description:
      "Ride stationary bike or outdoors. Adjust resistance for desired intensity. Maintain cadence of 60-100 RPM depending on goals. Keep core engaged and back neutral.",
  },
  {
    name: "Swimming",
    category: "Cardio",
    type: "distance_time",
    unit: "minutes",
    description:
      "Swim continuous laps using preferred stroke. Focus on breathing technique and efficient form. Mix strokes for variety. Low-impact full-body cardiovascular exercise.",
  },
  {
    name: "Rowing",
    category: "Cardio",
    type: "distance_time",
    unit: "minutes",
    description:
      "Use rowing machine with proper form: push with legs, hinge at hips, pull with arms. Reverse on return. Maintain consistent stroke rate. Full-body low-impact cardio.",
  },
  {
    name: "Elliptical",
    category: "Cardio",
    type: "distance_time",
    unit: "minutes",
    description:
      "Stand on elliptical pedals and grip handles. Move in smooth elliptical motion pushing and pulling with arms. Adjust resistance and incline for intensity. Low-impact alternative to running.",
  },
  {
    name: "Stair Climber",
    category: "Cardio",
    type: "distance_time",
    unit: "minutes",
    description:
      "Use stair stepper machine or climb actual stairs. Step fully onto each stair before pushing up. Maintain upright posture. Great for legs and cardiovascular fitness.",
  },
  {
    name: "Jump Rope",
    category: "Cardio",
    type: "reps_time",
    unit: "minutes",
    description:
      "Hold rope handles with elbows at sides. Jump with both feet, clearing rope as it passes under. Stay light on balls of feet. Vary speed and technique for intensity.",
  },
  {
    name: "HIIT",
    category: "Cardio",
    type: "time_duration",
    unit: "minutes",
    description:
      "High Intensity Interval Training. Alternate short bursts of maximum effort with brief recovery periods. Can use any exercise modality. Highly efficient for fitness and fat loss.",
  },
  {
    name: "Sprints",
    category: "Cardio",
    type: "time_speed",
    unit: "seconds",
    description:
      "Run at maximum speed for short distance or time. Rest completely between sprints. Focus on explosive power and proper running mechanics. Develops speed and anaerobic capacity.",
  },
  {
    name: "Jogging",
    category: "Cardio",
    type: "distance_time",
    unit: "minutes",
    description:
      "Run at easy conversational pace. Focus on relaxation and consistent rhythm. Can be done anywhere. Great for building aerobic base and recovery.",
  },
  {
    name: "Brisk Walking",
    category: "Cardio",
    type: "distance_time",
    unit: "minutes",
    description:
      "Walk at faster than normal pace, pumping arms. Maintain posture and breathe deeply. Low-impact option suitable for all fitness levels. Accessible cardiovascular exercise.",
  },
  {
    name: "Burpees",
    category: "Cardio",
    type: "reps_time",
    unit: "minutes",
    description:
      "Drop to floor into plank, perform push-up, jump feet in, explosively jump up reaching overhead. High-intensity full-body exercise. Modify by eliminating push-up or jump if needed.",
  },
  {
    name: "Jumping Jacks",
    category: "Cardio",
    type: "reps_time",
    unit: "minutes",
    description:
      "Jump feet out while raising arms overhead, then return to start. Maintain rhythm and stay light on feet. Classic warm-up or cardio exercise suitable for all levels.",
  },
  {
    name: "Mountain Climbers (Cardio)",
    category: "Cardio",
    type: "reps_time",
    unit: "minutes",
    description:
      "From plank position, rapidly alternate driving knees to chest in running motion. Keep hips level and core tight. Move as fast as possible while maintaining form. High-intensity cardio.",
  },
  {
    name: "Battle Ropes",
    category: "Cardio",
    type: "time_duration",
    unit: "minutes",
    description:
      "Hold rope ends with arms extended. Create waves by rapidly moving arms up and down. Vary patterns: alternating, double waves, or circles. Intense upper body and cardio workout.",
  },
  {
    name: "Kettlebell Swings",
    category: "Cardio",
    type: "reps_time",
    unit: "minutes",
    description:
      "Stand with feet wide, kettlebell between legs. Hinge at hips and swing kettlebell up to chest height using hip snap. Let bell fall back between legs and repeat. Explosive hip power.",
  },
  {
    name: "Box Jumps",
    category: "Cardio",
    type: "reps_time",
    unit: "minutes",
    description:
      "Stand facing plyo box. Drop into quarter squat, then explosively jump onto box landing softly with both feet. Stand fully, then step back down. Develops explosive power.",
  },
  {
    name: "Shadow Boxing",
    category: "Cardio",
    type: "time_duration",
    unit: "minutes",
    description:
      "Assume boxing stance and throw punches at air: jabs, crosses, hooks, uppercuts. Move feet and incorporate defensive movements. Great cardio and coordination without equipment.",
  },
  {
    name: "Circuit Training",
    category: "Cardio",
    type: "time_duration",
    unit: "minutes",
    description:
      "Rotate through multiple exercises with minimal rest between. Combine strength and cardio movements. Complete entire circuit, rest briefly, then repeat. Efficient total body workout.",
  },
  {
    name: "CrossFit WOD",
    category: "Cardio",
    type: "time_duration",
    unit: "minutes",
    description:
      "Workout of the Day following CrossFit methodology. Typically combines varied functional movements performed at high intensity. Follow specific workout programming or class structure.",
  },

  // Stretching
  {
    name: "Hamstring Stretch",
    category: "Stretching",
    type: "time_duration",
    unit: "seconds",
    description:
      "Sit with one leg extended, other bent. Hinge forward at hips reaching for toes of extended leg. Feel stretch in back of thigh. Keep back straight. Hold, then switch legs.",
  },
  {
    name: "Quad Stretch",
    category: "Stretching",
    type: "time_duration",
    unit: "seconds",
    description:
      "Stand holding balance support. Bend one knee grabbing ankle pulling heel toward glute. Keep knees together and hips neutral. Feel stretch in front of thigh. Hold, switch legs.",
  },
  {
    name: "Hip Flexor Stretch",
    category: "Stretching",
    type: "time_duration",
    unit: "seconds",
    description:
      "Kneel in lunge position with back knee on floor. Shift hips forward keeping torso upright. Feel stretch in front of hip on back leg. Squeeze glute for deeper stretch. Switch sides.",
  },
  {
    name: "Chest Stretch",
    category: "Stretching",
    type: "time_duration",
    unit: "seconds",
    description:
      "Stand in doorway with arms bent at 90 degrees on frame. Step forward until stretch felt across chest. Can also clasp hands behind back and lift. Hold stretch position.",
  },
  {
    name: "Shoulder Stretch",
    category: "Stretching",
    type: "time_duration",
    unit: "seconds",
    description:
      "Bring one arm across chest. Use other arm to pull it closer to body. Feel stretch in back of shoulder. Keep shoulders down. Hold, then repeat on other side.",
  },
  {
    name: "Tricep Stretch",
    category: "Stretching",
    type: "time_duration",
    unit: "seconds",
    description:
      "Raise one arm overhead bending elbow so hand reaches down back. Use other hand to gently pull elbow back. Feel stretch along back of upper arm. Hold, switch arms.",
  },
  {
    name: "Cat-Cow Stretch",
    category: "Stretching",
    type: "reps",
    unit: "reps",
    description:
      "Start on hands and knees. Arch back up like angry cat tucking chin and tailbone. Then drop belly down lifting head and tailbone. Flow smoothly between positions warming up spine.",
  },
  {
    name: "Child's Pose",
    category: "Stretching",
    type: "time_duration",
    unit: "seconds",
    description:
      "Kneel and sit back on heels. Extend arms forward lowering chest toward floor. Rest forehead on ground. Feel stretch in back, shoulders, and hips. Relax and breathe deeply.",
  },
  {
    name: "Downward Dog",
    category: "Stretching",
    type: "time_duration",
    unit: "seconds",
    description:
      "From plank, push hips up and back forming inverted V shape. Press heels toward floor, push chest toward thighs. Feel stretch in hamstrings, calves, shoulders. Common yoga pose.",
  },
  {
    name: "Cobra Stretch",
    category: "Stretching",
    type: "time_duration",
    unit: "seconds",
    description:
      "Lie face down, hands under shoulders. Press upper body up extending arms while keeping hips on floor. Feel stretch in abdomen and lower back. Look forward or slightly up.",
  },
  {
    name: "Seated Forward Bend",
    category: "Stretching",
    type: "time_duration",
    unit: "seconds",
    description:
      "Sit with both legs extended straight. Hinge at hips reaching forward for toes. Keep back as straight as possible. Feel stretch in hamstrings and lower back. Relax into stretch.",
  },
  {
    name: "Butterfly Stretch",
    category: "Stretching",
    type: "time_duration",
    unit: "seconds",
    description:
      "Sit bringing soles of feet together with knees out to sides. Hold feet and gently press knees toward floor using elbows. Feel stretch in inner thighs and groin. Keep back straight.",
  },
  {
    name: "Figure Four Stretch",
    category: "Stretching",
    type: "time_duration",
    unit: "seconds",
    description:
      "Lie on back, cross one ankle over opposite knee creating figure four. Pull uncrossed leg toward chest. Feel deep stretch in glute and hip of crossed leg. Switch sides.",
  },
  {
    name: "Standing Side Stretch",
    category: "Stretching",
    type: "time_duration",
    unit: "seconds",
    description:
      "Stand with feet together. Raise one arm overhead and lean to opposite side. Feel stretch along side of body from hip to armpit. Keep chest open. Hold, then switch sides.",
  },
  {
    name: "Neck Stretch",
    category: "Stretching",
    type: "time_duration",
    unit: "seconds",
    description:
      "Gently tilt head to one side bringing ear toward shoulder. Use hand for gentle additional pressure if needed. Feel stretch along side of neck. Hold, then repeat on other side.",
  },
  {
    name: "Wrist Stretch",
    category: "Stretching",
    type: "time_duration",
    unit: "seconds",
    description:
      "Extend one arm with palm up. Use other hand to gently pull fingers back toward forearm. Then flip hand palm down and pull fingers toward you. Stretches wrist flexors and extensors.",
  },
  {
    name: "Ankle Stretch",
    category: "Stretching",
    type: "time_duration",
    unit: "seconds",
    description:
      "Sit or stand, extend one leg. Flex foot pulling toes toward shin. Then point foot extending toes away. Circle ankle in both directions. Improves ankle mobility and prevents injury.",
  },
  {
    name: "Thoracic Rotation",
    category: "Stretching",
    type: "reps",
    unit: "reps",
    description:
      "Start on hands and knees. Place one hand behind head. Rotate upper body opening elbow toward ceiling. Follow elbow with eyes. Return and repeat. Then switch sides. Mobilizes mid-back.",
  },
  {
    name: "Pectoral Doorway Stretch",
    category: "Stretching",
    type: "time_duration",
    unit: "seconds",
    description:
      "Stand in doorway with forearms on door frame at 90 degrees, elbows at shoulder height. Step forward until stretch felt across chest and front of shoulders. Hold position breathing deeply.",
  },
  {
    name: "Dynamic Stretching",
    category: "Stretching",
    type: "time_duration",
    unit: "minutes",
    description:
      "Perform controlled movements through full range of motion: leg swings, arm circles, walking lunges, high knees. Prepares body for activity by increasing blood flow and mobility. Do before workout.",
  },
];
