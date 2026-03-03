import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
 Dumbbell, Heart, Activity, TrendingUp, MessageCircle,
 ChevronDown, ChevronRight, Check, Clock, Play, Pause,
 RotateCcw, Flame, Zap, Star, AlertTriangle, X, Send,
 Settings, Moon, Sun, Trophy, Target, Plus, Minus, Info,
 Download, Upload, Trash2, ChevronUp, Database, FileText,
 Calendar, Loader, Scale, Utensils, Ruler, Lock, Eye, EyeOff,
 Shuffle, BookOpen, ArrowRight, SkipForward, Replace, XCircle, ChevronLeft
} from 'lucide-react';
import { T, css } from '@/design/tokens';
import { LEVELS, XP_REWARDS, BODY_XP } from '@/data/levels';
import { DEFAULT_SETTINGS, DEFAULT_NUTRITION_CONFIG, DEFAULT_CALIBRATION, DEFAULT_BODY_LOG, DEFAULT_STREAKS } from '@/data/defaults';
import { DAILY_REHAB } from '@/data/dailyRehab';
import { CARDIO_OPTIONS } from '@/data/cardioOptions';


// ============================================================
// EXERCISE DATABASE (Full — 102 exercises, enhanced schema)
// ============================================================

const EXERCISES = [
 {id:'CH-01',name:'Flat Dumbbell Press',category:'chest',subcategory:'horizontal_press',muscles:{primary:{pec_major_sternal:80,pec_major_clavicular:45,anterior_deltoid:55},secondary:{triceps_lateral_head:45,triceps_medial_head:50,triceps_long_head:40,serratus_anterior:25}},equipment:['dumbbells','bench_flat'],location:{gym:true,home:true,work:false},tier:2,phase:{acute:{s:'suitable',p:3,n:'Use neutral grip, 45° elbows, RPE 7. Start with floor press variant if any anterior shoulder discomfort.'},subacute:{s:'suitable',p:4,n:'Full ROM, can introduce pronated grip if scapular control solid. RPE 8.'},maintenance:{s:'suitable',p:4,n:'Full loading, paused and single-arm variants.'}},sets:3,reps:'8-12',rest:90,tempo:'2-1-2-0',cues:['Retract and depress scapulae BEFORE lifting. Squeeze shoulder blades together and DOWN into your back pockets.','Lower with elbows at 45° from torso. 2-3 second descent. Dumbbells travel in a slight arc.',`At bottom, upper arms roughly parallel to floor. Don't go deeper than shoulder allows.`,'Press up driving dumbbells together in a slight arc. Exhale on press.',`Maintain scapular retraction throughout — don't let shoulders roll forward at lockout.`],mistakes:[{m:'Loss of scapular retraction',f:'Think \'proud chest\' throughout. If retraction fails, weight too heavy.'},{m:'Elbow flare to 90°',f:'Keep elbows at 45°. Imagine arrows from elbows pointing toward hip bones.'},{m:'Lumbar hyperextension',f:'Feet flat, brace abs. No fist between lower back and bench.'},{m:'Bouncing at bottom',f:'2-second descent, brief pause, controlled press.'}],why:'Dumbbells allow each arm to find natural path (unlike barbell). 45° tuck protects anterior shoulder. Core engagement needed helps anti-extension training.',benefits:['scapular_stability'],subs:['CH-04','CH-06','CH-10'],movementPattern:'horizontal_push',primaryMuscleGroup:'chest',secondaryMuscleGroups:['triceps','front_delts'],mechanic:'compound',exerciseTier:'foundation',sfrRating:3,repRanges:{strength:{min:3,max:6,rest:180},hypertrophy:{min:8,max:12,rest:120},endurance:{min:15,max:20,rest:60}},recoveryImpact:{chest:0.8,triceps:0.4,shoulders:0.3},progressionIds:['CH-02','CH-11'],regressionIds:['CH-06','CH-12','CH-04','CH-05','CH-10']},
 {id:'CH-02',name:'Incline Dumbbell Press',category:'chest',subcategory:'incline_press',muscles:{primary:{pec_major_clavicular:80,anterior_deltoid:65},secondary:{pec_major_sternal:40,triceps_lateral_head:45,triceps_medial_head:50,serratus_anterior:30}},equipment:['dumbbells','bench_adjustable'],location:{gym:true,home:true,work:false},tier:2,phase:{acute:{s:'caution',p:2,n:'30° ONLY, neutral grip, moderate load. Drop to 15° or flat if any anterior shoulder discomfort.'},subacute:{s:'suitable',p:4,n:'30° with pronated grip OK.'},maintenance:{s:'suitable',p:4,n:'Can explore 30-45° with full loading.'}},sets:3,reps:'8-12',rest:90,tempo:'2-1-2-0',cues:['Set bench to 30° (one notch above flat). Higher is NOT better for chest.','Same scapular retraction setup — blades squeezed and depressed against bench.',`Press in slight arc converging at top. Path is more 'up and in' than flat.`,'Lower with elbows at 45°, controlled 2-sec descent. Feel stretch across upper chest near clavicle.','Do NOT let bench angle push shoulders into elevation (shrugging). Actively depress scapulae.'],mistakes:[{m:'Bench angle too high (>45°)',f:'30° is sufficient. When in doubt, go lower.'},{m:'Butt lifting off bench',f:'Plant feet, drive into floor, keep glutes on bench.'},{m:'Shoulders rolling forward at lockout',f:'Exaggerate retraction. Press chest UP toward ceiling.'}],why:'Clavicular head needs direct work for balanced development. 30° angle is the minimum effective dose with acceptable shoulder risk.',benefits:[],subs:['CH-03','CH-01'],movementPattern:'horizontal_push',primaryMuscleGroup:'chest',secondaryMuscleGroups:['triceps','front_delts'],mechanic:'compound',exerciseTier:'foundation',sfrRating:3,repRanges:{strength:{min:3,max:6,rest:180},hypertrophy:{min:8,max:12,rest:120},endurance:{min:15,max:20,rest:60}},recoveryImpact:{chest:0.8,triceps:0.4,shoulders:0.3},progressionIds:[],regressionIds:['CH-01']},
 {id:'CH-03',name:'Low-to-High Cable Fly',category:'chest',subcategory:'fly_isolation',muscles:{primary:{pec_major_clavicular:85},secondary:{pec_major_sternal:35,anterior_deltoid:40,biceps_short_head:15,serratus_anterior:25}},equipment:['cable_machine'],location:{gym:true,home:false,work:false},tier:2,phase:{acute:{s:'suitable',p:3,n:'Light weight, focus on squeeze. Constant cable tension easier to control than free weights.'},subacute:{s:'suitable',p:4,n:'Progressive loading. Single-arm variant OK.'},maintenance:{s:'suitable',p:4,n:'Full loading, all variations.'}},sets:3,reps:'12-15',rest:60,tempo:'2-1-2-0',cues:['Set cables at LOWEST position. Stand centered, staggered stance.','Slight elbow bend (15-20°), LOCK this angle — should not change during movement.','Drive hands up and together, meeting at chin to upper chest height. Imagine scooping up and hugging a barrel.','Squeeze 1 full second at top. Feel contraction across upper chest near collarbone.',`Lower under control (2-sec eccentric). Don't let cables yank arms back.`],mistakes:[{m:'Arms straightening under load',f:'If elbow angle changes, weight too heavy. Drop 50%.'},{m:'Using momentum/swinging',f:'Staggered stance, only arms move. Torso stationary.'},{m:'Going too heavy',f:'Should hold peak contraction 1 full second. If you can\'t, too heavy.'}],why:'Among highest clavicular head activators. Cable provides constant tension. Standing engages anti-extension core. No spinal loading.',benefits:[],subs:['CH-08','CH-07'],movementPattern:'isolation_upper',primaryMuscleGroup:'chest',secondaryMuscleGroups:['front_delts'],mechanic:'isolation',exerciseTier:'assistance',sfrRating:5,repRanges:{strength:{min:6,max:10,rest:120},hypertrophy:{min:10,max:15,rest:90},endurance:{min:15,max:25,rest:45}},recoveryImpact:{chest:0.5,shoulders:0.3},progressionIds:['CH-09'],regressionIds:['CH-12']},
 {id:'CH-04',name:'Machine Chest Press (Seated)',category:'chest',subcategory:'horizontal_press',muscles:{primary:{pec_major_sternal:75,pec_major_clavicular:40},secondary:{anterior_deltoid:50,triceps_lateral_head:50,triceps_medial_head:50,serratus_anterior:15}},equipment:['chest_press_machine'],location:{gym:true,home:false,work:false},tier:1,phase:{acute:{s:'suitable',p:5,n:'One of BEST acute choices. Fixed path, back pad helps retraction, very light loading possible. Use neutral grip.'},subacute:{s:'suitable',p:4,n:'Full ROM, increasing load.'},maintenance:{s:'suitable',p:3,n:'Finisher after free-weight work.'}},sets:3,reps:'10-12',rest:75,tempo:'2-1-2-0',cues:['Adjust seat so handles align with mid-to-lower chest (nipple line).','Back flat against pad. Retract and depress scapulae against backrest.','Use neutral grip if available. Moderate grip strength.',`Press forward, don't fully lock elbows — stop just short to maintain tension.`,'Return slowly (2-3 sec). Stop BEFORE shoulders are pulled forward off pad.'],mistakes:[{m:'Seat height wrong',f:'Handles at nipple line. Take 10 seconds to adjust.'},{m:'Going past safe stretch',f:'Set ROM limiter. Stop when shoulder blades start to separate from pad.'},{m:'Pushing with shoulders',f:'Drive through chest. Squeeze imaginary coin between shoulder blades throughout.'}],why:'Fixed path reduces stabilization demand. Back pad enforces retraction. Safest way to build pressing strength in acute phase.',benefits:['scapular_stability'],subs:['CH-01','CH-06'],movementPattern:'horizontal_push',primaryMuscleGroup:'chest',secondaryMuscleGroups:['triceps','front_delts'],mechanic:'compound',exerciseTier:'supplemental',sfrRating:4,repRanges:{strength:{min:3,max:6,rest:180},hypertrophy:{min:8,max:12,rest:120},endurance:{min:15,max:20,rest:60}},recoveryImpact:{chest:0.8,triceps:0.4,shoulders:0.3},progressionIds:['CH-01'],regressionIds:['CH-12']},
 {id:'CH-05',name:'Push-Up Variations',category:'chest',subcategory:'horizontal_press',muscles:{primary:{pec_major_sternal:70,anterior_deltoid:55},secondary:{triceps_lateral_head:50,triceps_medial_head:50,serratus_anterior:40,rectus_abdominis:30,external_obliques:25}},equipment:['bodyweight'],location:{gym:true,home:true,work:true},tier:2,phase:{acute:{s:'suitable',p:5,n:'Wall/incline variations. One of BEST exercises — simultaneously trains chest, anti-extension core, and serratus anterior. Always include \'plus\' at top.'},subacute:{s:'suitable',p:4,n:'Progress to standard push-ups with plus. Tempo variants.'},maintenance:{s:'suitable',p:3,n:'Banded, deficit, weighted.'}},sets:3,reps:'8-15',rest:60,tempo:'2-1-2-0',cues:['Hands shoulder-width, fingers slightly turned out. Wrist under shoulder.','BEFORE starting: squeeze glutes, brace core, tuck pelvis to posterior tilt. Abs engaged.','Lower as a UNIT. Elbows at 45°. 2-second descent.',`Touch chest to floor (or surface). Don't sag hips or lead with chin.`,`Press up, then at TOP: PUSH FLOOR AWAY. Protract scapulae (upper back rounds slightly). This is the 'plus' — it activates serratus anterior. Then retract as you descend.`],mistakes:[{m:'Hips sagging (banana back)',f:'Squeeze glutes HARD. Pull belt buckle toward chin. Regress to incline if needed.'},{m:'Neck protruding forward',f:'Gaze at floor 6 inches ahead. Pack chin slightly.'},{m:'No \'plus\' at top',f:'Consciously push floor away at top of every rep.'}],why:'Triple benefit: chest training + anti-extension core + serratus anterior activation. The only chest exercise that directly improves scapular control.',benefits:['scapular_stability','anterior_pelvic_tilt','anti_extension_core'],subs:['CH-04','CH-12'],movementPattern:'horizontal_push',primaryMuscleGroup:'chest',secondaryMuscleGroups:['triceps','front_delts'],mechanic:'compound',exerciseTier:'foundation',sfrRating:3,repRanges:{strength:{min:3,max:6,rest:180},hypertrophy:{min:8,max:12,rest:120},endurance:{min:15,max:20,rest:60}},recoveryImpact:{chest:0.8,triceps:0.4,shoulders:0.3},progressionIds:['CH-01','CH-11','TR-05'],regressionIds:[]},
 {id:'CH-06',name:'Dumbbell Floor Press',category:'chest',subcategory:'horizontal_press',muscles:{primary:{pec_major_sternal:65,triceps_lateral_head:55,triceps_medial_head:60,triceps_long_head:55},secondary:{anterior_deltoid:45,pec_major_clavicular:35}},equipment:['dumbbells'],location:{gym:true,home:true,work:false},tier:2,phase:{acute:{s:'suitable',p:5,n:'HIGHLY RECOMMENDED. Perhaps safest pressing exercise. Limited ROM protects anterior shoulder. Floor gives lumbar feedback. Dead-stop teaches control.'},subacute:{s:'suitable',p:3,n:'Supplemental to bench press.'},maintenance:{s:'suitable',p:3,n:'Heavy lockout work.'}},sets:3,reps:'8-12',rest:90,tempo:'2-1-2-0',cues:['Lie on floor, knees bent, feet flat. Press lower back INTO floor (direct feedback on lumbar position).','Hold DBs at lockout, scapulae retracted against floor.','Lower slowly until ELBOWS gently touch floor. Pause 1 second (dead-stop).','Press back up explosively. Exhale.','Can often use slightly heavier DBs than bench press due to reduced ROM.'],mistakes:[{m:'Elbows crashing to floor',f:'2-second descent. GENTLY touch elbows to floor.'},{m:'Bridging off floor',f:'Keep glutes on floor. Knees bent helps posterior tilt.'},{m:'Using stretch reflex (bouncing)',f:'Full pause, let weight settle, then press.'}],why:'Safest pressing movement. ROM limitation protects anterior shoulder. Floor provides lumbar feedback. Dead-stop builds honest strength.',benefits:['anterior_humeral_glide'],subs:['CH-04','CH-01'],movementPattern:'horizontal_push',primaryMuscleGroup:'chest',secondaryMuscleGroups:['triceps','front_delts'],mechanic:'compound',exerciseTier:'foundation',sfrRating:3,repRanges:{strength:{min:3,max:6,rest:180},hypertrophy:{min:8,max:12,rest:120},endurance:{min:15,max:20,rest:60}},recoveryImpact:{chest:0.8,triceps:0.4,shoulders:0.3},progressionIds:['CH-01','TR-03'],regressionIds:['CH-12']},
 {id:'CH-07',name:'Flat Dumbbell Fly',category:'chest',subcategory:'fly_isolation',muscles:{primary:{pec_major_sternal:85,pec_major_clavicular:50},secondary:{anterior_deltoid:40,biceps_short_head:15}},equipment:['dumbbells','bench_flat'],location:{gym:true,home:true,work:false},tier:2,phase:{acute:{s:'caution',p:2,n:'Deep stretch position is highest risk for the shoulder. Use only if limited to parallel depth, light weight, no shoulder discomfort. Cable flies (CH-03) are safer.'},subacute:{s:'suitable',p:3,n:'Controlled depth, moderate load.'},maintenance:{s:'suitable',p:4,n:'Full loading, can explore deeper ROM.'}},sets:3,reps:'12-15',rest:60,tempo:'3-0-2-1',cues:['Bench setup with scapulae retracted and depressed.','Hold DBs at lockout with SLIGHT elbow bend (15-20°). Lock this angle.','Open arms in wide arc. 3-second descent.','STOP when upper arms parallel to floor OR when you feel pec stretch — whichever FIRST. Do NOT go deeper.','Squeeze DBs back together using pecs. Imagine hugging a large tree.'],mistakes:[{m:'Going too deep',f:'Hard stop at parallel. If unsure, use cables instead.'},{m:'Arms straightening',f:'Lock elbow angle. If it changes, weight too heavy.'},{m:'Using too much weight',f:'Use 50-60% of DB press weight. Ego check.'}],why:'Highest pec isolation. BUT high shoulder strain risk at stretch. Use cables (CH-03) or pec deck (CH-08) preferentially in acute phase.',benefits:[],subs:['CH-03','CH-08'],movementPattern:'isolation_upper',primaryMuscleGroup:'chest',secondaryMuscleGroups:['front_delts'],mechanic:'isolation',exerciseTier:'assistance',sfrRating:3,repRanges:{strength:{min:6,max:10,rest:120},hypertrophy:{min:10,max:15,rest:90},endurance:{min:15,max:25,rest:45}},recoveryImpact:{chest:0.5,shoulders:0.3},progressionIds:[],regressionIds:['CH-08']},
 {id:'CH-08',name:'Pec Deck / Machine Fly',category:'chest',subcategory:'fly_isolation',muscles:{primary:{pec_major_sternal:80,pec_major_clavicular:45},secondary:{anterior_deltoid:35,serratus_anterior:15}},equipment:['pec_deck_machine'],location:{gym:true,home:false,work:false},tier:1,phase:{acute:{s:'suitable',p:4,n:'Machine controls path, safer than free-weight flies. SET ROM LIMITER. Light weight, squeeze focus.'},subacute:{s:'suitable',p:4,n:'Full ROM within comfort.'},maintenance:{s:'suitable',p:4,n:'Heavy isolation work.'}},sets:3,reps:'12-15',rest:60,tempo:'2-1-2-1',cues:['Adjust seat: handles/pads at chest height. Elbows ~90° at start.','Back flat against pad. Retract scapulae.','Drive elbows (pad version) or hands (handle version) together.','Squeeze peak contraction 1-2 seconds.','Return slowly (3 sec). Stop at comfortable stretch, NOT when stack bottoms out.'],mistakes:[{m:'ROM limiter not set',f:'Set starting position so hands start at chest level, not behind back.'},{m:'Leaning forward off pad',f:'Back stays on pad throughout.'},{m:'Shrugging',f:'Depress before each set.'}],why:'Machine controls path — safer than free-weight flies for sensitive shoulders. ROM limiter prevents dangerous deep stretch.',benefits:[],subs:['CH-03','CH-07'],movementPattern:'isolation_upper',primaryMuscleGroup:'chest',secondaryMuscleGroups:['front_delts'],mechanic:'isolation',exerciseTier:'assistance',sfrRating:5,repRanges:{strength:{min:6,max:10,rest:120},hypertrophy:{min:10,max:15,rest:90},endurance:{min:15,max:25,rest:45}},recoveryImpact:{chest:0.5,shoulders:0.3},progressionIds:['CH-07'],regressionIds:['CH-12']},
 {id:'CH-09',name:'Cable Crossover (Mid-Height)',category:'chest',subcategory:'fly_isolation',muscles:{primary:{pec_major_sternal:80},secondary:{pec_major_clavicular:40,anterior_deltoid:35,rectus_abdominis:20}},equipment:['cable_machine'],location:{gym:true,home:false,work:false},tier:2,phase:{acute:{s:'suitable',p:3,n:'Light weight, controlled ROM. Standing engages anti-extension core.'},subacute:{s:'suitable',p:4,n:'Cross hands over midline OK.'},maintenance:{s:'suitable',p:4,n:'Full loading.'}},sets:3,reps:'12-15',rest:60,tempo:'2-1-2-1',cues:['Set cables at shoulder height. Stand centered, staggered stance, slight forward lean (~15°).','Arms out with slight elbow bend. Feel stretch across chest.','Drive hands together in horizontal arc in front of chest.','Squeeze at midpoint. Can cross one hand slightly over other.',`Control return. Don't let cables snap arms back.`],mistakes:[{m:'Too much forward lean',f:'15° max lean.'},{m:'Shrugging during squeeze',f:'Depress scapulae before starting. Drop weight if neck tenses.'}],why:'Pure sternal head isolation with constant tension. Standing position engages anti-extension core.',benefits:['anti_extension_core'],subs:['CH-03','CH-08'],movementPattern:'isolation_upper',primaryMuscleGroup:'chest',secondaryMuscleGroups:['front_delts'],mechanic:'isolation',exerciseTier:'assistance',sfrRating:5,repRanges:{strength:{min:6,max:10,rest:120},hypertrophy:{min:10,max:15,rest:90},endurance:{min:15,max:25,rest:45}},recoveryImpact:{chest:0.5,shoulders:0.3},progressionIds:[],regressionIds:['CH-03']},
 {id:'CH-10',name:'Dumbbell Squeeze Press',category:'chest',subcategory:'horizontal_press',muscles:{primary:{pec_major_sternal:75,pec_major_clavicular:55},secondary:{anterior_deltoid:35,triceps_lateral_head:40,serratus_anterior:25}},equipment:['dumbbells','bench_flat'],location:{gym:true,home:true,work:false},tier:1,phase:{acute:{s:'suitable',p:5,n:'HIGHLY RECOMMENDED. Light weight, minimal shoulder stress, constant pec activation. Teaches mind-muscle connection.'},subacute:{s:'suitable',p:3,n:'Moderate loading.'},maintenance:{s:'suitable',p:2,n:'Warm-up or burnout.'}},sets:3,reps:'12-15',rest:60,tempo:'2-1-2-0',cues:['Lie on bench. Hold two hex DBs pressed together at chest, palms facing, flat sides touching.','BEFORE pressing: squeeze DBs INTO each other as hard as possible. Pecs fire immediately.','Press up while maintaining squeeze. The squeeze is the exercise, the press is secondary.',`Lower slowly, still squeezing. Don't let DBs separate.`,'Light weight is correct. 15-25 lb DBs. This is about contraction quality.'],mistakes:[{m:'Not actually squeezing',f:'The squeeze should feel like crushing something. Pecs should burn from constant tension.'},{m:'Going too heavy',f:'Start with 15 lb DBs.'}],why:'Teaches pec activation with zero injury risk. Light weight, no wide stretch position. Builds mind-muscle connection foundation.',benefits:[],subs:['CH-12'],movementPattern:'horizontal_push',primaryMuscleGroup:'chest',secondaryMuscleGroups:['triceps','front_delts'],mechanic:'compound',exerciseTier:'supplemental',sfrRating:3,repRanges:{strength:{min:3,max:6,rest:180},hypertrophy:{min:8,max:12,rest:120},endurance:{min:15,max:20,rest:60}},recoveryImpact:{chest:0.8,triceps:0.4,shoulders:0.3},progressionIds:['CH-01'],regressionIds:[]},
 {id:'CH-11',name:'Chest Dip (Forward Lean)',category:'chest',subcategory:'dip',muscles:{primary:{pec_major_sternal:80,pec_major_costal:70},secondary:{anterior_deltoid:60,triceps_lateral_head:60,triceps_medial_head:55,triceps_long_head:60}},equipment:['dip_station'],location:{gym:true,home:false,work:false},tier:3,phase:{acute:{s:'avoid',p:0,n:'AVOID. Forward lean + depth + bodyweight = substantial shoulder stress. Requires adequate scapular control for safe execution.'},subacute:{s:'caution',p:2,n:'Machine-assisted only (reduce BW 40-50%). Strict 90° depth. Upright torso. Only if shoulder mobility benchmarks met.'},maintenance:{s:'suitable',p:3,n:'Forward lean OK. Full BW or weighted. Still respect 90° depth.'}},sets:3,reps:'8-12',rest:120,tempo:'3-0-2-0',cues:['Grip bars shoulder-width. Arms straight, shoulders DEPRESSED (not shrugged).','Lean forward 20-30°. Cross feet behind.','Lower slowly (3 sec). Elbows 30-45° from torso. Lower until shoulders reach elbow level — NO DEEPER.',`Press up by driving hands INTO bars. Think 'squeeze bars together.'`,'Lock out without shrugging. Scapulae depressed and slightly protracted.'],mistakes:[{m:'Going too deep',f:'Hard stop at 90°. If you can\'t control depth, don\'t do dips.'},{m:'Shoulder shrugging',f:'Depress before descending.'},{m:'Swinging/kipping',f:'Slow reps. Use assisted machine if needed.'}],why:'Best lower pec activator BUT highest shoulder risk. Reserved for maintenance phase only.',benefits:[],subs:['CH-01','CH-04'],movementPattern:'horizontal_push',primaryMuscleGroup:'chest',secondaryMuscleGroups:['triceps','front_delts'],mechanic:'compound',exerciseTier:'foundation',sfrRating:3,repRanges:{strength:{min:3,max:6,rest:180},hypertrophy:{min:8,max:12,rest:120},endurance:{min:15,max:20,rest:60}},recoveryImpact:{chest:0.8,triceps:0.4,shoulders:0.3},progressionIds:[],regressionIds:['CH-05','CH-01']},
 {id:'CH-12',name:'Band / Isometric Chest Work',category:'chest',subcategory:'band_bodyweight',muscles:{primary:{pec_major_sternal:60,pec_major_clavicular:50},secondary:{anterior_deltoid:35,triceps_lateral_head:40}},equipment:['resistance_bands','bodyweight'],location:{gym:true,home:true,work:true},tier:1,phase:{acute:{s:'suitable',p:4,n:'Very low risk. Good for work mode. Isometric squeeze teaches pec activation.'},subacute:{s:'suitable',p:2,n:'Supplementary. Heavier bands.'},maintenance:{s:'suitable',p:1,n:'Maintenance between gym sessions.'}},sets:3,reps:'15-20 (or 20-30 sec holds for isometric)',rest:45,tempo:'2-0-2-0',cues:['BAND PRESS: Wrap band around upper back. Grip ends. Stand tall, brace core, retract scapulae.','Press forward at chest height. Band resistance increases as you extend.',`Control return — don't let band snap arms back.`,'ISOMETRIC SQUEEZE: Press palms together at chest height, elbows out at 90°.','Squeeze as hard as possible. Hold 20-30 seconds. Can do at desk between work.'],mistakes:[{m:'Band snapping back',f:'Always control the return.'}],why:'Zero equipment option for work mode. Isometric squeeze builds mind-muscle connection. Better than nothing principle.',benefits:[],subs:['CH-05'],movementPattern:'horizontal_push',primaryMuscleGroup:'chest',secondaryMuscleGroups:['triceps','front_delts'],mechanic:'compound',exerciseTier:'supplemental',sfrRating:4,repRanges:{strength:{min:3,max:6,rest:180},hypertrophy:{min:8,max:12,rest:120},endurance:{min:15,max:20,rest:60}},recoveryImpact:{chest:0.8,triceps:0.4,shoulders:0.3},progressionIds:['CH-04','CH-06','CH-01','CH-03','CH-08'],regressionIds:[]},
 {id:'SH-01',name:'Half-Kneeling Landmine Press',category:'shoulders',subcategory:'overhead_press_alternative',muscles:{primary:{anterior_deltoid:70,pec_major_clavicular:40,triceps_lateral_head:45},secondary:{serratus_anterior:50,lower_trapezius:35,external_obliques:30,gluteus_maximus:20}},equipment:['barbell','landmine_attachment'],location:{gym:true,home:false,work:false},tier:2,phase:{acute:{s:'suitable',p:5,n:'GOLD STANDARD overhead press substitute. Arc stays below impingement zone. Half-kneeling stretches hip flexors (addresses APT). Serratus activation improves scapular control. This is a 3-for-1 exercise.'},subacute:{s:'suitable',p:5,n:'Increase loading. Can progress to standing split-stance. Add brief overhead hold at lockout.'},maintenance:{s:'suitable',p:4,n:'Heavy loading. Standing bilateral version. Still safer than barbell OHP for shoulder-conscious training.'}},sets:3,reps:'8-12',rest:90,tempo:'2-1-2-0',cues:['Half-kneel with INSIDE knee down (same side as pressing arm). Rear foot tucked under. Tuck pelvis into posterior tilt — feel hip flexor stretch in rear leg.','Hold barbell end at shoulder height with one hand, elbow tight to ribs. Slight forward lean into the arc.',`Press up and slightly forward following the bar's natural arc. Exhale at lockout. Full arm extension but don't shrug at top.`,'CRITICAL: Depress shoulder blade throughout — imagine pulling shoulder blade into back pocket. If you feel upper trap firing, reset.',`Lower with 2-second control. Elbow returns tight to ribs. Don't let bar drift wide.`],mistakes:[{m:'Lumbar hyperextension at lockout',f:'Squeeze glute of rear (down) leg HARD. Ribs stay down. If back arches, the weight is too heavy or the angle is too steep.'},{m:'Upper trap hiking at top',f:'CUE: \'Press up, shoulder blade goes DOWN.\' Practice without weight first.'},{m:'Elbow flaring wide',f:'Elbow stays within 30° of torso. Imagine pressing along a wall beside you.'},{m:'Rear knee lifting off ground',f:'Press rear knee gently into floor. Slow the rep down.'}],why:'THE primary pressing movement for shoulder-conscious training. Arc path avoids impingement zone. Half-kneeling simultaneously stretches tight hip flexors (posture and core stability), demands anti-extension core (posture and core stability), and trains serratus anterior. Unilateral work addresses left-right imbalances.',benefits:['scapular_stability','anterior_pelvic_tilt','anti_extension_core'],subs:['SH-08','CH-02'],movementPattern:'vertical_push',primaryMuscleGroup:'shoulders',secondaryMuscleGroups:['triceps','chest'],mechanic:'compound',exerciseTier:'supplemental',sfrRating:3,repRanges:{strength:{min:3,max:6,rest:180},hypertrophy:{min:8,max:12,rest:120},endurance:{min:15,max:20,rest:60}},recoveryImpact:{shoulders:0.8,triceps:0.4,chest:0.4},progressionIds:['SH-08'],regressionIds:['SH-07']},
 {id:'SH-02',name:'Face Pull (Kneeling / High Angle)',category:'shoulders',subcategory:'horizontal_pull_corrective',muscles:{primary:{posterior_deltoid:70,middle_trapezius:55,lower_trapezius:50,infraspinatus:45,teres_minor:40},secondary:{rhomboids:40,external_obliques:15,biceps_long_head:20}},equipment:['cable_machine','cable_rope'],location:{gym:true,home:false,work:false},tier:1,phase:{acute:{s:'suitable',p:5,n:'Recommended exercise. Directly trains the lower/mid trap. Must be kneeling or high-angle to prevent upper trap takeover (confirmed by clinical testing). Light weight, 15-20 reps, squeeze focus.'},subacute:{s:'suitable',p:5,n:'Increase weight gradually. Still kneeling preferred. Can add pause at peak contraction.'},maintenance:{s:'suitable',p:5,n:'Should remain a permanent fixture regardless of phase. Foundation of shoulder health.'}},sets:3,reps:'15-20',rest:60,tempo:'2-2-2-0',cues:['Kneel facing cable. Rope attached at highest position (above head level). Tall kneeling posture — squeeze glutes, tuck pelvis.','Grip rope ends with thumbs pointing back. Start with arms extended toward cable at ~45° upward angle.','Pull rope toward face — split rope ends to either side of head. Elbows HIGH, wide, and BACK.','At peak: externally rotate — thumbs point behind you, like showing your armpits to the ceiling. HOLD 2 seconds. Feel mid-back muscles squeeze.','CUE for lower trap: imagine pulling shoulder blades INTO your back pockets while pulling rope apart. Depression + retraction simultaneously.'],mistakes:[{m:'Upper trap shrugging / neck tension',f:'Kneel (removes lower body cheating). High cable angle forces depression. If neck tenses, weight is too heavy — drop 30%.'},{m:'No external rotation at end',f:'Think \'double bicep pose\' at peak. Thumbs rotate backward.'},{m:'Using momentum / rowing toward chest',f:'Pull to FACE, not chest. Slow, controlled, light weight.'},{m:'Standing with feet together',f:'Kneeling is recommended in early phases for better scapular control.'}],why:'Excellent exercise for shoulder health. Directly trains the lower and mid trapezius for better scapular control. External rotation component builds rotator cuff strength. Kneeling or high-angle variation helps prevent upper trap compensation.',benefits:['scapular_stability','anterior_humeral_glide'],subs:['SH-05','SH-04'],movementPattern:'horizontal_pull',primaryMuscleGroup:'rear_delts',secondaryMuscleGroups:['back','rear_delts'],mechanic:'compound',exerciseTier:'supplemental',sfrRating:4,repRanges:{strength:{min:3,max:6,rest:180},hypertrophy:{min:8,max:12,rest:120},endurance:{min:15,max:20,rest:60}},recoveryImpact:{shoulders:0.8,back:0.4},progressionIds:[],regressionIds:['SH-05','SH-06']},
 {id:'SH-03',name:'Cable Lateral Raise',category:'shoulders',subcategory:'lateral_deltoid_isolation',muscles:{primary:{lateral_deltoid:80,supraspinatus:40},secondary:{anterior_deltoid:25,upper_trapezius:30,serratus_anterior:15}},equipment:['cable_machine'],location:{gym:true,home:false,work:false},tier:2,phase:{acute:{s:'caution',p:3,n:'Light weight only. Cable from behind body, stop at shoulder height. Lean forward 10-15° to reduce supraspinatus compression. If ANY anterior shoulder discomfort, switch to SH-07 (lateral raise machine). Monitor for upper trap hiking.'},subacute:{s:'suitable',p:4,n:'Moderate loading. Full ROM to shoulder height.'},maintenance:{s:'suitable',p:4,n:'Full loading. Can explore slight pause at peak.'}},sets:3,reps:'12-15',rest:60,tempo:'2-1-2-0',cues:['Stand sideways to cable, handle in FAR hand (cable runs behind your body). Slight forward lean 10-15° — lean from hips, not back.','Start with arm at side, slight elbow bend (15-20°). Lock this angle.','Raise arm out to side, leading with ELBOW not wrist. Stop when arm reaches shoulder height — NOT higher.',`Thumb stays neutral or slightly UP (pinky does NOT lead). 'Pouring water' cue creates impingement.`,`2-second lower. Don't let cable snap arm down. Maintain scapular depression — shoulder blade stays in back pocket.`],mistakes:[{m:'Raising above shoulder height',f:'Hard stop at shoulder height. Set a visual marker.'},{m:'Pouring water (internal rotation at top)',f:'Thumb neutral or slightly UP. Imagine holding a cup upright.'},{m:'Upper trap hiking (ear meets shoulder)',f:'CUE: \'Create maximum distance between ear and shoulder.\' Drop weight significantly if neck tenses.'},{m:'Swinging / momentum',f:'2-sec up, 2-sec down. If momentum needed, weight too heavy.'}],why:'Cables provide constant tension through the full range (dumbbells have zero tension at bottom). Behind-body path increases effective ROM. Forward lean reduces shoulder impingement risk. Better joint-friendliness than dumbbell lateral raises for shoulder-conscious training.',benefits:[],subs:['SH-07','SH-09'],movementPattern:'isolation_upper',primaryMuscleGroup:'side_delts',secondaryMuscleGroups:[],mechanic:'isolation',exerciseTier:'assistance',sfrRating:5,repRanges:{strength:{min:6,max:10,rest:120},hypertrophy:{min:10,max:15,rest:90},endurance:{min:15,max:25,rest:45}},recoveryImpact:{shoulders:0.5},progressionIds:[],regressionIds:['SH-07','SH-09']},
 {id:'SH-04',name:'Reverse Cable Fly / Rear Delt Fly',category:'shoulders',subcategory:'posterior_deltoid_isolation',muscles:{primary:{posterior_deltoid:80,middle_trapezius:45,rhomboids:40},secondary:{infraspinatus:30,teres_minor:25,lower_trapezius:30}},equipment:['cable_machine'],location:{gym:true,home:false,work:false},tier:2,phase:{acute:{s:'suitable',p:4,n:'Light weight, high reps. Focus on posterior deltoid and mid trap squeeze. Addresses anterior/posterior deltoid imbalance from desk posture. Cables at shoulder height.'},subacute:{s:'suitable',p:4,n:'Moderate loading. Can explore different cable heights.'},maintenance:{s:'suitable',p:4,n:'Full loading. Pair with pressing as superset.'}},sets:3,reps:'15-20',rest:60,tempo:'2-1-2-0',cues:['Set cables at shoulder height. Cross cables — hold LEFT handle with RIGHT hand and vice versa. Stand centered.','Arms extended in front at shoulder height with slight elbow bend (15-20°). Lock this angle.','Pull arms apart in wide arc. Squeeze shoulder blades together at peak. Hold 1-2 seconds.','Focus on DEPRESSION throughout — shoulder blades retract AND depress, not just retract.','Control return. Arms back to start without cables pulling you forward.'],mistakes:[{m:'Shrugging at peak contraction',f:'Depress scapulae BEFORE pulling. \'Shoulder blades in back pockets.\' If neck tenses, weight too heavy.'},{m:'Arms too high (above shoulder)',f:'Keep at shoulder height. Movement is HORIZONTAL, not vertical.'},{m:'Straight arms (locked elbows)',f:'Soft bend at elbow, locked throughout.'}],why:'Corrects anterior deltoid dominance caused by desk posture and pressing bias. Strengthens posterior shoulder stabilizers (infraspinatus, teres minor). Cables provide constant tension and controlled path.',benefits:['scapular_stability'],subs:['SH-05','SH-06'],movementPattern:'isolation_upper',primaryMuscleGroup:'rear_delts',secondaryMuscleGroups:[],mechanic:'isolation',exerciseTier:'assistance',sfrRating:5,repRanges:{strength:{min:6,max:10,rest:120},hypertrophy:{min:10,max:15,rest:90},endurance:{min:15,max:25,rest:45}},recoveryImpact:{shoulders:0.5},progressionIds:[],regressionIds:['SH-05']},
 {id:'SH-05',name:'Band Pull-Apart',category:'shoulders',subcategory:'scapular_corrective',muscles:{primary:{posterior_deltoid:60,middle_trapezius:55,rhomboids:50},secondary:{lower_trapezius:40,infraspinatus:35,teres_minor:30}},equipment:['resistance_bands'],location:{gym:true,home:true,work:true},tier:1,phase:{acute:{s:'suitable',p:5,n:'DAILY exercise. Can do at desk between work. Directly trains scapular retraction + depression. Underhand grip at forehead height for maximum lower trap bias. Light band, high reps.'},subacute:{s:'suitable',p:4,n:'Thicker band. Pair with face pulls.'},maintenance:{s:'suitable',p:3,n:'Warm-up, between sets of pressing, or at work. Permanent fixture.'}},sets:3,reps:'15-25',rest:30,tempo:'1-2-1-0',cues:[`Hold band at arms' length, slightly above eye level (forehead height). Shoulder-width grip or slightly wider.`,'BEFORE pulling: depress scapulae (shoulders away from ears). This is the most important cue.','Pull band apart by driving elbows back and OUT. Band touches upper chest or chin at full spread.','HOLD peak contraction 2 full seconds. Feel muscles between shoulder blades SQUEEZING.','Underhand grip (palms up) reduces upper trap dominance — use this grip until scapular control improves.'],mistakes:[{m:'Neck tension / upper trap activation',f:'Underhand grip, forehead height, DEPRESSION CUE before pulling. If neck tenses, band too heavy.'},{m:'Rushing reps',f:'2-second hold at peak. Every rep. No exceptions.'},{m:'Band at hip/waist level',f:'Arms at forehead to chin height.'}],why:'Most accessible scapular stability exercise. Zero equipment barrier (bands are $10, travel-sized). Can do 50+ reps/day at desk. Directly counteracts the posture of prolonged screen work. Underhand grip at forehead height specifically targets the lower trapezius.',benefits:['scapular_stability','anterior_humeral_glide'],subs:['SH-02','SH-04'],movementPattern:'corrective',primaryMuscleGroup:'rear_delts',secondaryMuscleGroups:['back'],mechanic:'isolation',exerciseTier:'assistance',sfrRating:4,repRanges:{strength:{min:8,max:12,rest:60},hypertrophy:{min:12,max:15,rest:45},endurance:{min:15,max:25,rest:30}},recoveryImpact:{shoulders:0.5,back:0.4},progressionIds:['SH-02','SH-04'],regressionIds:[]},
 {id:'SH-06',name:'Prone Y-T-W Raises',category:'shoulders',subcategory:'scapular_corrective',muscles:{primary:{lower_trapezius:65,middle_trapezius:55,posterior_deltoid:45},secondary:{infraspinatus:35,rhomboids:40,serratus_anterior:30,supraspinatus:25}},equipment:['bench_adjustable','dumbbells'],location:{gym:true,home:true,work:false},tier:1,phase:{acute:{s:'suitable',p:5,n:' Start bodyweight only (no dumbbells). Y-raise is the progression marker: 15+ reps without anterior shoulder pain = ready for subacute. Monitor for lat compensation in T-raise.'},subacute:{s:'suitable',p:4,n:'Add 2-5 lb dumbbells. Y-raise should reach 15+ reps. T-raise should reach 20+ reps.'},maintenance:{s:'suitable',p:3,n:'5-10 lb dumbbells. Warm-up before pressing.'}},sets:2,reps:'8-12 each position',rest:60,tempo:'2-2-2-0',cues:['Lie face down on incline bench (30-45°). Arms hanging straight down. Thumbs pointing UP for all positions.','Y-RAISE: Lift arms at 45° above shoulder line (Y-shape). Lead with thumbs. Squeeze lower traps — feel muscles below shoulder blades. HOLD 2 seconds at top.','T-RAISE: Lift arms straight out to sides (T-shape). Squeeze between shoulder blades. WATCH for lat compensation (arms pulling backward instead of lifting). HOLD 2 seconds.',`W-RAISE: Elbows bent 90°, lift elbows to shoulder height while externally rotating (hands rotate toward ceiling). Looks like a 'W' from behind. HOLD 2 seconds.`,'If anterior shoulder pain during Y-raise: STOP. Reduce to bodyweight. Pain during Y-raise may indicate the shoulder needs more time to heal.'],mistakes:[{m:'Lat compensation on T-raise',f:'Lighter weight or bodyweight. Focus on LIFTING, not PULLING BACK. Shoulder blades retract, arms float up.'},{m:'Y-raise causing anterior shoulder pain',f:'Reduce ROM. Stay bodyweight. If pain persists below 10 reps, avoid Y-position temporarily and focus on T and W.'},{m:'Lifting too heavy',f:'Bodyweight or 2-3 lb dumbbells initially. Ego check. Track your Y-raise rep count to monitor progress.'},{m:'Rushing through holds',f:'2-second hold MINIMUM at peak of every rep. Count out loud if needed.'}],why:'This exercise IS the effective scapular control exercise. Y-raise endurance is a progression milestone (15+ reps without pain = acute→subacute). Every rep is simultaneously assessment and improvement. T and W positions fill in middle trapezius and rotator cuff gaps.',benefits:['scapular_stability','anterior_humeral_glide'],subs:['SH-05','SH-02'],movementPattern:'corrective',primaryMuscleGroup:'rear_delts',secondaryMuscleGroups:['back'],mechanic:'isolation',exerciseTier:'assistance',sfrRating:3,repRanges:{strength:{min:8,max:12,rest:60},hypertrophy:{min:12,max:15,rest:45},endurance:{min:15,max:25,rest:30}},recoveryImpact:{shoulders:0.5,back:0.4},progressionIds:['SH-02'],regressionIds:[]},
 {id:'SH-07',name:'Lateral Raise Machine',category:'shoulders',subcategory:'lateral_deltoid_isolation',muscles:{primary:{lateral_deltoid:80,supraspinatus:35},secondary:{anterior_deltoid:20,upper_trapezius:25}},equipment:['cable_machine'],location:{gym:true,home:false,work:false},tier:1,phase:{acute:{s:'suitable',p:4,n:'Machine controls the path — safer than free weights for sensitive shoulders. Set ROM to stop at shoulder height. Light weight, focus on deltoid contraction without upper trap compensation.'},subacute:{s:'suitable',p:4,n:'Moderate loading. Full ROM to shoulder height.'},maintenance:{s:'suitable',p:3,n:'Moderate to heavy. Finisher after presses.'}},sets:3,reps:'12-15',rest:60,tempo:'2-1-2-0',cues:[`Adjust seat so pads sit just above elbows. Shoulder joint aligned with machine's axis of rotation.`,'Before lifting: depress shoulders. Create max distance between ears and shoulders.','Lift by pressing ELBOWS out, not hands. Think about driving elbows toward walls.','Stop at shoulder height. HOLD 1 second. Feel lateral deltoid burning.',`Lower slowly (2-3 sec). Don't let weight stack crash — maintain tension.`],mistakes:[{m:'Seat too high or too low',f:'Shoulder joint (acromion) should align with machine\'s rotation axis. Take 10 seconds to adjust.'},{m:'Upper trap hiking',f:'Depress before each rep. Lighter weight. Forced holds at peak with depression focus.'},{m:'Using momentum',f:'2-sec up, 1-sec hold, 2-sec down. SLOW.'}],why:'Machine controls movement path, making it safer for shoulder-friendly training than free-weight lateral raises. ROM limiter prevents going above impingement zone. Easier to isolate deltoid without upper trap compensation vs dumbbells.',benefits:[],subs:['SH-03','SH-09'],movementPattern:'isolation_upper',primaryMuscleGroup:'side_delts',secondaryMuscleGroups:[],mechanic:'isolation',exerciseTier:'assistance',sfrRating:5,repRanges:{strength:{min:6,max:10,rest:120},hypertrophy:{min:10,max:15,rest:90},endurance:{min:15,max:25,rest:45}},recoveryImpact:{shoulders:0.5},progressionIds:['SH-03','SH-01'],regressionIds:['SH-09']},
 {id:'SH-08',name:'Half-Kneeling Single-Arm DB Press',category:'shoulders',subcategory:'overhead_press_alternative',muscles:{primary:{anterior_deltoid:70,triceps_lateral_head:50,triceps_medial_head:50},secondary:{lateral_deltoid:30,upper_trapezius:25,serratus_anterior:40,external_obliques:35,transverse_abdominis:25}},equipment:['dumbbells'],location:{gym:true,home:true,work:false},tier:3,phase:{acute:{s:'avoid',p:0,n:'AVOID. True overhead pressing is not recommended until scapular control is established. Use landmine press (SH-01) instead.'},subacute:{s:'caution',p:3,n:'ONLY if: Y-raise 15+ reps pain-free, single-leg balance 45+ sec, no increase in baseline shoulder pain for 4 weeks. Start very light (10-15 lbs). Neutral grip ONLY. Stop 10° short of full lockout.'},maintenance:{s:'suitable',p:4,n:'Full ROM, moderate loading. Neutral grip still preferred but pronated grip permissible if pain-free. Can progress to seated or standing.'}},sets:3,reps:'8-10',rest:90,tempo:'2-1-2-0',cues:['Half-kneel: same-side knee down as pressing arm. Tuck pelvis. Squeeze rear glute.','Hold DB at shoulder height, NEUTRAL GRIP (palm facing inward). Elbow directly under wrist.','Press up and slightly forward. Stop 10° short of full lockout in subacute phase. Full lockout in maintenance if pain-free.','CRITICAL: Ribs stay DOWN. No back arch. The half-kneeling position PREVENTS this if glute is engaged.',`Lower slowly (2 sec). DB returns to shoulder. Don't let elbow drift behind torso on descent.`],mistakes:[{m:'Pressing before scapular control criteria met',f:'Must pass: Y-raise 15+ reps, pain-free face pulls, floor slides with full depression. If not met, use landmine press.'},{m:'Pronated grip (palm forward)',f:'Neutral grip (palm in) is recommended to reduce shoulder stress.'},{m:'Back arching / rib flare',f:'Squeeze rear glute. Draw ribs toward pelvis. If arching is involuntary, ROM is too deep — stop press earlier.'},{m:'Elbow flaring wide',f:'Elbow stays in line with ear. Slight forward position is fine. Not wide.'}],why:'True overhead pressing — the end-goal progression from landmine press. Unlocks only after scapular control milestones are met. Half-kneeling position maintains hip flexor stretch and anti-extension core benefits. Single-arm addresses side-to-side asymmetry. Neutral grip is non-negotiable for shoulder-conscious training.',benefits:['anti_extension_core'],subs:['SH-01'],movementPattern:'vertical_push',primaryMuscleGroup:'shoulders',secondaryMuscleGroups:['triceps','chest'],mechanic:'compound',exerciseTier:'supplemental',sfrRating:3,repRanges:{strength:{min:3,max:6,rest:180},hypertrophy:{min:8,max:12,rest:120},endurance:{min:15,max:20,rest:60}},recoveryImpact:{shoulders:0.8,triceps:0.4,chest:0.4},progressionIds:[],regressionIds:['SH-01']},
 {id:'SH-09',name:'Band / DB Lateral Raise (Home/Work)',category:'shoulders',subcategory:'lateral_deltoid_isolation',muscles:{primary:{lateral_deltoid:75,supraspinatus:35},secondary:{anterior_deltoid:25,upper_trapezius:30}},equipment:['dumbbells','resistance_bands'],location:{gym:true,home:true,work:true},tier:1,phase:{acute:{s:'caution',p:3,n:'Light weight ONLY. Seated preferred to eliminate momentum. Stop at shoulder height. Band version safer for work mode. If any anterior shoulder discomfort, skip.'},subacute:{s:'suitable',p:3,n:'Moderate DB weight. Standing OK.'},maintenance:{s:'suitable',p:3,n:'Full loading. Partials and drop sets OK.'}},sets:3,reps:'12-15',rest:60,tempo:'2-1-2-0',cues:['DB: Stand or sit with DBs at sides, slight elbow bend. Lean forward 10-15° from hips.','BAND: Stand on band, hold ends. Same lean, same arm path.','Raise arms to sides, leading with ELBOWS. Thumbs neutral or slightly up (NO pouring water).','Stop at shoulder height. HOLD 1 second. Lower 2 seconds.','Depress shoulders before every rep. Ears and shoulders stay far apart.'],mistakes:[{m:'Using too much weight / swinging',f:'Use a weight you can hold at peak for 2 seconds without shaking. For most people, this is 10-15 lbs.'},{m:'Internal rotation at top (pouring water)',f:'Thumbs stay up or neutral. Imagine holding cups of water upright.'},{m:'Going above shoulder height',f:'Hard stop at 90° abduction. Set a visual cue like a door frame.'}],why:'Accessible lateral deltoid option for home/work mode. Band version requires zero heavy equipment. Seated variant controls for momentum, important with a tendency to compensate with upper trap.',benefits:[],subs:['SH-03','SH-07'],movementPattern:'isolation_upper',primaryMuscleGroup:'side_delts',secondaryMuscleGroups:[],mechanic:'isolation',exerciseTier:'assistance',sfrRating:4,repRanges:{strength:{min:6,max:10,rest:120},hypertrophy:{min:10,max:15,rest:90},endurance:{min:15,max:25,rest:45}},recoveryImpact:{shoulders:0.5},progressionIds:['SH-07','SH-03'],regressionIds:[]},
 {id:'BK-01',name:'Chest-Supported Dumbbell Row',category:'back',subcategory:'horizontal_pull',muscles:{primary:{latissimus_dorsi:65,middle_trapezius:55,rhomboids:50,posterior_deltoid:45},secondary:{lower_trapezius:40,biceps_short_head:35,biceps_long_head:30,brachialis:25,teres_major:40,infraspinatus:20}},equipment:['dumbbells','bench_adjustable'],location:{gym:true,home:true,work:false},tier:2,phase:{acute:{s:'suitable',p:5,n:'GOLD STANDARD rowing exercise. Chest support eliminates lumbar loading. Removes momentum and lat-dominance cheating. Can bias toward mid/lower trap with wider elbow position. Every rowing rep supports shoulder health.'},subacute:{s:'suitable',p:5,n:'Moderate to heavy loading. Explore elbow positions. Paused reps at peak.'},maintenance:{s:'suitable',p:4,n:'Heavy loading. Can progress to unsupported rows.'}},sets:3,reps:'8-12',rest:90,tempo:'2-2-2-0',cues:['Set adjustable bench to 30-45°. Lie face down, chest on pad, feet on floor or braced. Dumbbells hanging straight down.','BEFORE rowing: depress scapulae. Pull shoulder blades DOWN and slightly together. This is the start position.',`Row DBs up by driving ELBOWS toward ceiling. Think 'elbows to hip bones' for lat focus, 'elbows wide to ceiling' for mid trap focus.`,'SQUEEZE at peak for 2 full seconds. This is where the benefit happens — full scapular retraction under load.',`Lower with 2-second control. Let shoulder blades protract SLIGHTLY at bottom (don't just drop). Full stretch → full contraction.`],mistakes:[{m:'Lat-dominant pulling (elbows too tight, no scapular squeeze)',f:'Elbows at 45-60° angle. Focus on squeezing BETWEEN shoulder blades, not just pulling hands up. 2-sec peak hold.'},{m:'Lifting chest off pad',f:'Press chest INTO pad throughout. If chest lifts, weight too heavy.'},{m:'Shrugging at top',f:'Depress BEFORE rowing. At peak: shoulder blade goes BACK and DOWN, not UP.'},{m:'Wrist curling at top',f:'Wrists stay neutral. Think of hands as hooks. Drive through elbows.'}],why:'Three-in-one benefit: (1) rowing motion builds posterior shoulder strength, (2) wider-elbow variant biases mid/lower trap to improve scapular control, (3) chest support eliminates lumbar loading. The 2-second peak squeeze is where all the benefit occurs.',benefits:['scapular_stability','anterior_humeral_glide','back_protection'],subs:['BK-04','BK-05'],movementPattern:'horizontal_pull',primaryMuscleGroup:'back',secondaryMuscleGroups:['biceps','rear_delts'],mechanic:'compound',exerciseTier:'foundation',sfrRating:4,repRanges:{strength:{min:3,max:6,rest:180},hypertrophy:{min:8,max:12,rest:120},endurance:{min:15,max:20,rest:60}},recoveryImpact:{back:0.8,biceps:0.4,shoulders:0.2},progressionIds:['BK-05','BK-04','BK-08'],regressionIds:['BK-06','BK-09']},
 {id:'BK-02',name:'Lat Pulldown (Neutral Grip)',category:'back',subcategory:'vertical_pull',muscles:{primary:{latissimus_dorsi:80,teres_major:55},secondary:{lower_trapezius:40,rhomboids:35,posterior_deltoid:30,biceps_long_head:40,biceps_short_head:35,brachialis:30,infraspinatus:15}},equipment:['lat_pulldown_machine'],location:{gym:true,home:false,work:false},tier:2,phase:{acute:{s:'suitable',p:4,n:'Neutral grip ONLY. Shoulder-width or slightly narrower. Machine controls path. Initiate with scapular depression, not arm pull. Light to moderate load.'},subacute:{s:'suitable',p:4,n:'Moderate loading. Can explore supinated grip. Still no wide pronated grip.'},maintenance:{s:'suitable',p:4,n:'Full loading. Can explore wider grips if pain-free. Still neutral preferred.'}},sets:3,reps:'8-12',rest:90,tempo:'2-1-2-0',cues:['Attach neutral grip (V-bar or parallel handles). Thighs under pads. Sit tall, slight lean back (10-15°).','INITIATE with scapular depression — pull shoulder blades DOWN first, then pull with arms. This 2-step sequence is critical for training lower trap.','Pull handles toward upper chest. Elbows drive DOWN and BACK toward hips.','Squeeze at bottom — shoulder blades depressed and retracted. Hold 1 second.','Return slowly (2-3 sec). Let arms extend fully. Allow scapulae to elevate and protract slightly at top for full stretch.'],mistakes:[{m:'Pulling with arms first (no scapular initiation)',f:'2-phase pull: (1) shoulder blades DOWN, (2) THEN bend elbows. Practice scapular-only pulldowns with straight arms.'},{m:'Wide pronated grip',f:'Neutral grip, shoulder-width. NEVER behind neck.'},{m:'Excessive lean-back',f:'10-15° lean MAX. Torso stays relatively upright.'},{m:'Using momentum / kipping',f:'If you need momentum, weight is too heavy. 2-sec descent, full stop at top.'}],why:'Vertical pulling is essential for lat development and scapular depression training. Neutral grip eliminates the anterior shoulder stress that pronated/wide grips cause. Machine path controls the movement. Scapular depression initiation cue directly trains a common weak link.',benefits:['scapular_stability'],subs:['BK-07','BK-06'],movementPattern:'vertical_pull',primaryMuscleGroup:'back',secondaryMuscleGroups:['biceps'],mechanic:'compound',exerciseTier:'foundation',sfrRating:4,repRanges:{strength:{min:3,max:6,rest:180},hypertrophy:{min:8,max:12,rest:120},endurance:{min:15,max:20,rest:60}},recoveryImpact:{back:0.8,biceps:0.4},progressionIds:[],regressionIds:['BK-06']},
 {id:'BK-03',name:'Decline Dumbbell Pullover',category:'back',subcategory:'pullover',muscles:{primary:{latissimus_dorsi:70,teres_major:55,pec_major_sternal:40},secondary:{triceps_long_head:35,serratus_anterior:45,posterior_deltoid:20,rhomboids:20}},equipment:['dumbbells','bench_adjustable'],location:{gym:true,home:true,work:false},tier:2,phase:{acute:{s:'caution',p:2,n:'Overhead stretch position can stress anterior capsule. Use moderate elbow bend (30-45°) to reduce lever arm. LIGHT weight. Monitor for anterior shoulder symptoms. If uncomfortable, avoid until subacute.'},subacute:{s:'suitable',p:4,n:'Moderate loading. Slight decline. Full ROM if pain-free.'},maintenance:{s:'suitable',p:4,n:'Full loading. Can use straighter arms for more stretch.'}},sets:3,reps:'10-12',rest:75,tempo:'3-0-2-1',cues:['Lie on slight decline (15-20°). Hold single DB with both hands, diamond grip on inner plate. Arms extended above chest.','ELBOW BEND: keep elbows bent 30-45° throughout. This is a lat exercise, not a straight-arm stretch.','Lower DB behind head in arc. 3-second descent. Stop when you feel lat stretch — NOT when shoulders protest.',`Pull DB back over chest by squeezing lats. Think 'pull elbows toward hips.' Squeeze at top for 1 second.`,'Serratus fires throughout this movement — feel the muscles on the sides of your rib cage working.'],mistakes:[{m:'Going too deep / too much shoulder extension',f:'ROM limited by comfort, not ambition. When you feel a deep lat stretch, that\'s deep enough. Stop.'},{m:'Straight arms (locked elbows)',f:'30-45° elbow bend throughout. Weight stays close to face, not far behind head.'},{m:'Back arching on bench',f:'Press lower back INTO bench. Tuck pelvis. If back arches, DB went too deep.'},{m:'Rib flare',f:'Draw ribs DOWN toward pelvis as DB goes overhead. Exhale on the pull-back phase.'}],why:'Unique lat training angle that also activates serratus anterior — training scapular control from a different angle than rows. Decline position increases lat stretch. The pull-over motion trains shoulder extension with scapular control, building the movement pattern needed for overhead activities.',benefits:['scapular_stability'],subs:['BK-07'],movementPattern:'vertical_pull',primaryMuscleGroup:'back',secondaryMuscleGroups:['biceps'],mechanic:'compound',exerciseTier:'foundation',sfrRating:3,repRanges:{strength:{min:3,max:6,rest:180},hypertrophy:{min:8,max:12,rest:120},endurance:{min:15,max:20,rest:60}},recoveryImpact:{back:0.8,biceps:0.4},progressionIds:[],regressionIds:['BK-07']},
 {id:'BK-04',name:'Seated Cable Row',category:'back',subcategory:'horizontal_pull',muscles:{primary:{latissimus_dorsi:70,middle_trapezius:55,rhomboids:50},secondary:{lower_trapezius:40,posterior_deltoid:40,teres_major:40,biceps_long_head:35,biceps_short_head:30,erector_spinae:20}},equipment:['cable_machine','seated_row_machine'],location:{gym:true,home:false,work:false},tier:2,phase:{acute:{s:'suitable',p:4,n:'Very safe. Seated = no standing balance demand. Pad supports chest on some machines. Use V-bar or neutral grip. Moderate weight, focus on scapular squeeze.'},subacute:{s:'suitable',p:4,n:'Moderate to heavy. Explore wide grip for more mid trap.'},maintenance:{s:'suitable',p:4,n:'Heavy loading. Various grips.'}},sets:3,reps:'8-12',rest:90,tempo:'2-1-2-0',cues:['Sit with feet on platforms, knees slightly bent. Grab handle, sit upright with slight natural arch.','Start with arms extended, scapulae PROTRACTED (reach forward). Feel stretch across mid-back.','Initiate pull by retracting scapulae — pull shoulder blades together FIRST, then pull with arms.','Row handle to lower chest / upper abdomen. Elbows pass torso slightly. Squeeze 1-2 seconds.',`Return slowly (2 sec). Let scapulae protract at stretch. Controlled lengthening. Don't let cable yank you forward.`],mistakes:[{m:'Excessive forward lean at stretch',f:'Lean forward ONLY 10-15° from upright at full stretch. If you feel it in your lower back, you\'ve gone too far.'},{m:'Pulling with arms only / no scapular retraction',f:'2-phase: scapulae together THEN arms. Practice scapular-only rows with light weight.'},{m:'Jerking / using momentum',f:'Smooth pull. If you need a body swing, weight is too heavy.'},{m:'Shrugging at peak',f:'Shoulder blades go BACK and DOWN at peak. Not up toward ears.'}],why:'Seated position reduces lumbar loading vs bent-over rows (easier on the lower back). Cable provides constant tension through full ROM. Scapular protraction at stretch → retraction at peak cycles the full scapular motion needed for scapular control improvement.',benefits:['scapular_stability'],subs:['BK-01','BK-05'],movementPattern:'horizontal_pull',primaryMuscleGroup:'back',secondaryMuscleGroups:['biceps','rear_delts'],mechanic:'compound',exerciseTier:'foundation',sfrRating:4,repRanges:{strength:{min:3,max:6,rest:180},hypertrophy:{min:8,max:12,rest:120},endurance:{min:15,max:20,rest:60}},recoveryImpact:{back:0.8,biceps:0.4,shoulders:0.2},progressionIds:['BK-05'],regressionIds:['BK-06','BK-01']},
 {id:'BK-05',name:'Single-Arm Dumbbell Row',category:'back',subcategory:'horizontal_pull',muscles:{primary:{latissimus_dorsi:75,middle_trapezius:50,rhomboids:45,teres_major:50},secondary:{posterior_deltoid:40,lower_trapezius:35,biceps_long_head:35,biceps_short_head:30,external_obliques:25,erector_spinae:20}},equipment:['dumbbells','bench_flat'],location:{gym:true,home:true,work:false},tier:2,phase:{acute:{s:'suitable',p:3,n:'Good option but requires more spinal control than chest-supported row (BK-01). Support hand on bench. Neutral grip. Minimal trunk rotation. Light to moderate weight.'},subacute:{s:'suitable',p:4,n:'Moderate to heavy loading. Good for identifying L/R strength differences.'},maintenance:{s:'suitable',p:4,n:'Heavy loading. Can allow slight controlled rotation.'}},sets:3,reps:'8-12 each side',rest:75,tempo:'2-1-2-0',cues:['Non-rowing hand on bench, same-side knee on bench (or staggered stance with hand on bench). Back flat, parallel to floor.','DB hangs straight down. Shoulder blade starts protracted (reach toward floor).',`Row DB toward lower ribs. Drive ELBOW toward ceiling. Think 'start a lawnmower' but slow and controlled.`,'At peak: scapula fully retracted. Hold 1 second. Feel the squeeze between spine and shoulder blade.','Lower 2 seconds. Let shoulder blade protract at bottom. Full stretch. MINIMAL trunk rotation — torso stays parallel to floor.'],mistakes:[{m:'Excessive trunk rotation',f:'Imagine balancing a cup of water on your lower back. If it would spill, you\'re rotating too much. Reduce weight.'},{m:'Rowing to shoulder instead of ribs',f:'Row to lower ribs. Elbow stops when wrist reaches torso.'},{m:'Rounding lower back',f:'Flat back. Hinge at hips. If back rounds, weight too heavy or flexibility limiting.'},{m:'Jerking the weight',f:'2-sec up, 1-sec hold, 2-sec down. If momentum needed, drop weight 20%.'}],why:'Unilateral work identifies and corrects L/R strength imbalances. Hand support reduces lumbar demand vs bent-over barbell row. Allows heavier loading than chest-supported row per side. Anti-rotation core demand from unilateral loading.',benefits:['scapular_stability'],subs:['BK-01','BK-04'],movementPattern:'horizontal_pull',primaryMuscleGroup:'back',secondaryMuscleGroups:['biceps','rear_delts'],mechanic:'compound',exerciseTier:'foundation',sfrRating:3,repRanges:{strength:{min:3,max:6,rest:180},hypertrophy:{min:8,max:12,rest:120},endurance:{min:15,max:20,rest:60}},recoveryImpact:{back:0.8,biceps:0.4,shoulders:0.2},progressionIds:['BK-08'],regressionIds:['BK-01','BK-04']},
 {id:'BK-06',name:'Inverted Row',category:'back',subcategory:'horizontal_pull',muscles:{primary:{latissimus_dorsi:60,middle_trapezius:55,rhomboids:50,posterior_deltoid:45},secondary:{biceps_long_head:35,biceps_short_head:30,lower_trapezius:40,rectus_abdominis:25,gluteus_maximus:20}},equipment:['pull_up_bar','smith_machine'],location:{gym:true,home:true,work:false},tier:2,phase:{acute:{s:'suitable',p:5,n:'EXCELLENT entry-level row. Bodyweight, scalable difficulty by adjusting angle. Anti-extension core demand (holds plank position). Teaches scapular retraction under bodyweight.'},subacute:{s:'suitable',p:4,n:'Progress to more horizontal angle. Feet elevated.'},maintenance:{s:'suitable',p:3,n:'Weighted vest. Feet elevated. Paused reps.'}},sets:3,reps:'8-15',rest:75,tempo:'2-1-2-0',cues:['Set bar (smith machine or barbell in rack) at waist to chest height. Lower bar = harder. Higher = easier.','Hang underneath, overhand grip, body straight from ankles to shoulders. SQUEEZE GLUTES. Tuck pelvis. Anti-extension engaged.','Pull chest TO bar by driving elbows back. Shoulder blades retract and depress.','Touch chest to bar (or as high as current strength allows). Hold 1 second.',`Lower with 2-sec control. Full arm extension at bottom. Don't sag hips on descent.`],mistakes:[{m:'Hips sagging (banana body)',f:'Squeeze glutes HARD. Imagine a straight line from ear to ankle. If hips sag, raise bar height to reduce difficulty.'},{m:'Only pulling with arms (no scapular retraction)',f:'Initiate by squeezing shoulder blades together. Think \'proud chest to bar.\''},{m:'Neck protruding forward',f:'Pack chin. Look at ceiling. Let CHEST reach bar, not chin.'}],why:'Bodyweight pulling — no equipment barrier at home. Scalable from very easy (45° angle) to very hard (feet elevated). Simultaneously trains anti-extension core (like push-ups). Teaches scapular retraction under load. Natural rowing motion supports shoulder health.',benefits:['scapular_stability','anti_extension_core'],subs:['BK-01','BK-04'],movementPattern:'horizontal_pull',primaryMuscleGroup:'back',secondaryMuscleGroups:['biceps','rear_delts'],mechanic:'compound',exerciseTier:'foundation',sfrRating:4,repRanges:{strength:{min:3,max:6,rest:180},hypertrophy:{min:8,max:12,rest:120},endurance:{min:15,max:20,rest:60}},recoveryImpact:{back:0.8,biceps:0.4,shoulders:0.2},progressionIds:['BK-01','BK-02','BK-04'],regressionIds:['BK-09']},
 {id:'BK-07',name:'Straight-Arm Cable Pulldown',category:'back',subcategory:'lat_isolation',muscles:{primary:{latissimus_dorsi:80,teres_major:50},secondary:{posterior_deltoid:25,triceps_long_head:30,lower_trapezius:30,serratus_anterior:25,rectus_abdominis:20}},equipment:['cable_machine','cable_bar'],location:{gym:true,home:false,work:false},tier:2,phase:{acute:{s:'suitable',p:3,n:'Safe lat isolation. No overhead stretch risk (unlike pullovers). Standing engages anti-extension core. Light weight, focus on lat-mind-muscle connection. Good for learning to FEEL lats contract.'},subacute:{s:'suitable',p:4,n:'Moderate loading. Pair with pulldowns for lat superset.'},maintenance:{s:'suitable',p:3,n:'Full loading. Pre-exhaust before rows/pulldowns.'}},sets:3,reps:'12-15',rest:60,tempo:'2-1-2-0',cues:['Face cable, bar or rope at high position. Step back 1-2 feet. Slight hip hinge (15-20°). Knees soft.','Start with arms extended above (roughly 45° above horizontal). Slight elbow bend — LOCK this angle.',`Pull bar down toward thighs in a wide arc. Think 'push the bar into your pockets.' LATS do the work, not arms.`,'At bottom: bar touches front of thighs. Squeeze lats HARD for 1 second. Feel them contracting along your sides.',`Return slowly (2 sec). Don't let cable yank arms up. Control through full ROM.`],mistakes:[{m:'Bending elbows (turning it into a pulldown)',f:'Lock elbow angle. If elbows bend, weight too heavy. This is a LIGHT exercise.'},{m:'Using momentum / body swing',f:'Fixed hip hinge. Only arms move. Torso stationary.'},{m:'Standing too upright with heavy weight',f:'Slight hip hinge. Core braced. Moderate weight.'}],why:'Best lat isolation without bicep involvement. Teaches the lat mind-muscle connection that many beginners lack. Standing position engages anti-extension core. No overhead stretch risk unlike DB pullovers. Safe for shoulder-friendly training because arms never go behind torso plane.',benefits:['anti_extension_core'],subs:['BK-03'],movementPattern:'isolation_upper',primaryMuscleGroup:'back',secondaryMuscleGroups:[],mechanic:'isolation',exerciseTier:'assistance',sfrRating:5,repRanges:{strength:{min:6,max:10,rest:120},hypertrophy:{min:10,max:15,rest:90},endurance:{min:15,max:25,rest:45}},recoveryImpact:{back:0.5},progressionIds:['BK-03'],regressionIds:[]},
 {id:'BK-08',name:'Landmine Row (T-Bar Alternative)',category:'back',subcategory:'horizontal_pull',muscles:{primary:{latissimus_dorsi:75,middle_trapezius:50,rhomboids:50,teres_major:45},secondary:{posterior_deltoid:40,lower_trapezius:35,biceps_long_head:35,erector_spinae:30}},equipment:['barbell','landmine_attachment'],location:{gym:true,home:false,work:false},tier:3,phase:{acute:{s:'caution',p:2,n:'Requires spinal stabilization during hip hinge. Less supported than chest-supported row. Use only if BK-01 is unavailable AND good hip hinge mechanics are established. Light weight.'},subacute:{s:'suitable',p:3,n:'Moderate loading. Good for progressing row strength when chest-support becomes limiting.'},maintenance:{s:'suitable',p:4,n:'Heavy loading. Meadows row variant for unilateral work.'}},sets:3,reps:'8-12',rest:90,tempo:'2-1-2-0',cues:['Straddle barbell with end in landmine. Hip hinge: flat back, chest over bar end, knees slightly bent.','Grip: V-handle around bar OR towel through plate OR cup both hands around bar end. Neutral grip preferred.','Row bar end to lower chest. Elbows drive past torso. Squeeze scapulae at peak.','Hold 1 second at top. Control descent 2 seconds.','CRITICAL: maintain flat back throughout. Do NOT round lower back. If you feel lumbar strain, chest-supported row (BK-01) is better for you.'],mistakes:[{m:'Lumbar rounding',f:'If you can\'t maintain flat back, this exercise isn\'t appropriate yet. Use chest-supported row instead.'},{m:'Too much hip extension (standing up with the row)',f:'Hinge angle stays FIXED. Only arms move. Torso stays parallel-ish.'},{m:'Shrugging at peak',f:'Depress before rowing. Shoulder blades retract and go DOWN.'}],why:'Barbell loading allows heavier rowing than dumbbells. Arc path of landmine is joint-friendly. Once sufficient lumbar stability is developed in subacute/maintenance, this provides a progression path for rowing strength beyond chest-supported work.',benefits:['scapular_stability'],subs:['BK-01','BK-04'],movementPattern:'horizontal_pull',primaryMuscleGroup:'back',secondaryMuscleGroups:['biceps','rear_delts'],mechanic:'compound',exerciseTier:'foundation',sfrRating:3,repRanges:{strength:{min:3,max:6,rest:180},hypertrophy:{min:8,max:12,rest:120},endurance:{min:15,max:20,rest:60}},recoveryImpact:{back:0.8,biceps:0.4,shoulders:0.2},progressionIds:[],regressionIds:['BK-01','BK-05']},
 {id:'BK-09',name:'Band / Bodyweight Back Work',category:'back',subcategory:'band_bodyweight',muscles:{primary:{middle_trapezius:50,rhomboids:45,posterior_deltoid:40,latissimus_dorsi:40},secondary:{lower_trapezius:40,infraspinatus:30,biceps_long_head:20}},equipment:['resistance_bands','bodyweight'],location:{gym:true,home:true,work:true},tier:1,phase:{acute:{s:'suitable',p:4,n:'Work mode and travel option. Band rows can be done at desk with door anchor. Prone floor work supplements mobility routine. Low barrier to entry.'},subacute:{s:'suitable',p:2,n:'Supplementary. Heavier bands.'},maintenance:{s:'suitable',p:1,n:'Active recovery days. Warm-up. Work breaks.'}},sets:3,reps:'15-20',rest:30,tempo:'2-1-2-0',cues:['BAND ROW: Anchor band at chest height (door anchor or wrap around pole). Sit or stand facing anchor.','Pull band toward lower chest. Elbows back, squeeze shoulder blades. Hold peak 2 seconds.',`Control return. Don't let band snap forward.`,'PRONE FLOOR PULLS: Lie face down. Arms at sides. Lift arms 2-3 inches off floor, squeeze shoulder blades. Hold 5 seconds.','Can combine with Y-T-W (SH-06) positions for comprehensive scapular work. Do during work breaks every 1-2 hours.'],mistakes:[{m:'Band too light (no resistance at peak)',f:'Use band that provides meaningful resistance at full arm extension AND at peak contraction.'},{m:'Rushing through reps',f:'2-second holds at peak. Every rep.'}],why:'Zero-barrier back training for work mode. Band in a desk drawer = scapular retraction training between work meetings. Combats the postural deterioration of prolonged sitting. Better than nothing principle applied to the most important muscle group for posture.',benefits:['scapular_stability'],subs:['BK-06','SH-05'],movementPattern:'horizontal_pull',primaryMuscleGroup:'back',secondaryMuscleGroups:['biceps','rear_delts'],mechanic:'compound',exerciseTier:'supplemental',sfrRating:4,repRanges:{strength:{min:3,max:6,rest:180},hypertrophy:{min:8,max:12,rest:120},endurance:{min:15,max:20,rest:60}},recoveryImpact:{back:0.8,biceps:0.4,shoulders:0.2},progressionIds:['BK-01','BK-06'],regressionIds:[]},
 {id:'TR-01',name:'Overhead Cable Tricep Extension (Rope)',category:'triceps',subcategory:'overhead_extension',muscles:{primary:{triceps_long_head:80,triceps_medial_head:50,triceps_lateral_head:45},secondary:{serratus_anterior:15,rectus_abdominis:15}},equipment:['cable_machine','cable_rope'],location:{gym:true,home:false,work:false},tier:2,phase:{acute:{s:'caution',p:3,n:'Overhead position requires adequate shoulder flexion mobility. Face-away version only if no anterior shoulder discomfort. Face-toward (high cable) version is safer — shorter ROM, less shoulder demand. Light weight, focus on long head stretch.'},subacute:{s:'suitable',p:4,n:'Full ROM. Face-away variant OK if shoulder milestones met. Moderate loading.'},maintenance:{s:'suitable',p:5,n:'Primary long head builder. Heavy loading.'}},sets:3,reps:'10-15',rest:75,tempo:'2-1-2-0',cues:['FACE-TOWARD (safer): Set cable high. Grab rope, step back slightly, hinge forward 15-20°. Elbows point forward beside head.','FACE-AWAY (more stretch): Set cable low. Grab rope, step forward, arms overhead. Elbows point to ceiling. Stagger stance for stability.','For both: elbows stay FIXED in position. Only forearms move. Extend rope overhead until arms are straight.','At lockout: split rope ends apart (supinate wrists outward). Squeeze triceps 1 second.',`Lower slowly (2 sec). Feel the stretch in the back of your upper arms (long head). Elbows DON'T move forward or flare out.`],mistakes:[{m:'Elbows flaring out',f:'Elbows stay beside head, pointing forward/up. If they flare, weight too heavy.'},{m:'Moving elbows (turning into a press)',f:'LOCK elbow position. Only forearm moves. Imagine elbows are bolted in place.'},{m:'Back arching during face-away version',f:'Brace core. Stagger stance. If back arches, shoulder mobility isn\'t ready — use face-toward version.'},{m:'Using too much weight / momentum',f:'Controlled 2-sec reps. Should be able to pause at full stretch without pain.'}],why:'Only tricep movement that fully loads the long head through its complete ROM. The long head (crossing the shoulder joint) only achieves full stretch when the arm is overhead. For maximum tricep development, overhead work is non-negotiable. Face-toward version accommodates acute-phase shoulder limitations.',benefits:[],subs:['TR-04','TR-06'],movementPattern:'isolation_upper',primaryMuscleGroup:'triceps',secondaryMuscleGroups:[],mechanic:'isolation',exerciseTier:'assistance',sfrRating:5,repRanges:{strength:{min:6,max:10,rest:120},hypertrophy:{min:10,max:15,rest:90},endurance:{min:15,max:25,rest:45}},recoveryImpact:{triceps:0.5},progressionIds:['TR-04'],regressionIds:['TR-06','TR-02']},
 {id:'TR-02',name:'Cable Pushdown (Rope)',category:'triceps',subcategory:'pushdown',muscles:{primary:{triceps_lateral_head:75,triceps_medial_head:70},secondary:{triceps_long_head:45,anconeus:20}},equipment:['cable_machine','cable_rope'],location:{gym:true,home:false,work:false},tier:1,phase:{acute:{s:'suitable',p:5,n:'Safest tricep isolation. Zero shoulder stress (arms stay at sides). Cable provides constant tension. Perfect for building tricep base. Can go very light with high reps.'},subacute:{s:'suitable',p:5,n:'Moderate to heavy. Explore different attachments.'},maintenance:{s:'suitable',p:4,n:'Heavy loading. Drop sets, supersets with curls.'}},sets:3,reps:'10-15',rest:60,tempo:'2-1-2-0',cues:['Stand facing cable, rope at high position. Grab rope ends with neutral grip. Slight forward lean (10-15°).','Pin elbows to sides. This is the anchor point — elbows DO NOT move forward or backward throughout the set.','Extend forearms down, pushing rope toward floor. At bottom: split rope ends apart, rotate wrists outward (pronation).','Squeeze triceps at full lockout for 1 second. Feel the horseshoe shape pop.',`Return slowly (2 sec). Control the eccentric. Stop when forearms reach ~90° — don't let hands come up to chest.`],mistakes:[{m:'Elbows drifting forward at top',f:'Pin elbows to ribs. If they drift, weight is too heavy.'},{m:'Leaning over the weight (using bodyweight)',f:'10-15° lean MAX. Body stays still. Only forearms move.'},{m:'Not splitting rope at bottom',f:'At lockout, PULL rope ends apart. Palms rotate to face the floor.'},{m:'Half reps (not locking out)',f:'Full extension every rep. Lockout and squeeze.'}],why:'Safest and most accessible tricep isolation. Zero shoulder demand — arms stay at sides the entire time. Cable provides constant tension. Rope allows pronation at lockout for peak lateral head activation. Should be a staple regardless of phase.',benefits:[],subs:['TR-06'],movementPattern:'isolation_upper',primaryMuscleGroup:'triceps',secondaryMuscleGroups:[],mechanic:'isolation',exerciseTier:'assistance',sfrRating:5,repRanges:{strength:{min:6,max:10,rest:120},hypertrophy:{min:10,max:15,rest:90},endurance:{min:15,max:25,rest:45}},recoveryImpact:{triceps:0.5},progressionIds:['TR-01','TR-03'],regressionIds:['TR-06']},
 {id:'TR-03',name:'Close-Grip Bench Press',category:'triceps',subcategory:'compound_press',muscles:{primary:{triceps_lateral_head:65,triceps_medial_head:65,triceps_long_head:55,pec_major_sternal:50},secondary:{anterior_deltoid:45,pec_major_clavicular:30,serratus_anterior:15}},equipment:['barbell','bench_flat'],location:{gym:true,home:false,work:false},tier:3,phase:{acute:{s:'caution',p:2,n:'Barbell pressing demands shoulder stabilization that may not be adequate in acute phase. Use DB floor press close-grip (CH-06) or machine press with close grip instead. Only if those are unavailable.'},subacute:{s:'suitable',p:3,n:'Moderate loading. Shoulder-width grip. Paused reps to build control. Scapular retraction throughout.'},maintenance:{s:'suitable',p:4,n:'Heavy compound tricep builder. Can progressively overload.'}},sets:3,reps:'8-10',rest:120,tempo:'2-1-2-0',cues:['Shoulder-width grip on barbell (NOT ultra-narrow — that wrecks wrists). Ring fingers on smooth/knurl transition.','Setup: retract and depress scapulae. Feet flat. Slight natural arch. Unrack.','Lower bar to nipple line. Elbows at 30° from torso (tighter than standard bench). 2-second descent.',`Touch chest, brief pause, press up by driving through triceps. Think 'push the bar toward your face' (slight arc).`,'Lockout fully. Squeeze triceps at top. Do NOT lose scapular retraction.'],mistakes:[{m:'Grip too narrow (hands touching)',f:'Shoulder-width grip. Not narrower. The tricep focus comes from elbow tuck, not grip width.'},{m:'Elbow flare at 90°',f:'30° elbow angle. Elbows point toward hips, not walls.'},{m:'Bouncing off chest',f:'Gentle touch, pause, controlled press. No bounce.'},{m:'Loss of scapular retraction',f:'Squeeze shoulder blades together before unracking. Maintain throughout.'}],why:'Heaviest-loading tricep exercise available. Compound pressing = more total muscle recruitment. Reserved primarily for subacute/maintenance when shoulder stability is established. Floor press variant is the safer acute-phase option if compound tricep pressing is desired.',benefits:[],subs:['CH-06','TR-02'],movementPattern:'horizontal_push',primaryMuscleGroup:'triceps',secondaryMuscleGroups:['chest','front_delts'],mechanic:'compound',exerciseTier:'foundation',sfrRating:3,repRanges:{strength:{min:3,max:6,rest:180},hypertrophy:{min:8,max:12,rest:120},endurance:{min:15,max:20,rest:60}},recoveryImpact:{triceps:0.8,chest:0.4,shoulders:0.3},progressionIds:['TR-07'],regressionIds:['CH-06','TR-02','TR-05']},
 {id:'TR-04',name:'Single-Arm Overhead DB Extension',category:'triceps',subcategory:'overhead_extension',muscles:{primary:{triceps_long_head:80,triceps_medial_head:45},secondary:{triceps_lateral_head:35,serratus_anterior:10}},equipment:['dumbbells'],location:{gym:true,home:true,work:false},tier:2,phase:{acute:{s:'caution',p:2,n:'Overhead position challenges shoulder. Lighter weight than cable version. Only if cable overhead extension (TR-01) isn\'t available. Seated, light DB, stop short of full depth if anterior shoulder uncomfortable.'},subacute:{s:'suitable',p:3,n:'Moderate loading. Identifies L/R tricep differences. Seated preferred.'},maintenance:{s:'suitable',p:4,n:'Full loading. Standing version OK.'}},sets:3,reps:'10-12 each arm',rest:60,tempo:'2-1-2-0',cues:['Seated on bench with back support. Hold DB in one hand, press overhead to lockout.',`Upper arm stays VERTICAL (elbow points to ceiling). Free hand can support the working arm's elbow if needed for stability.`,'Lower DB behind head by bending elbow. 2-second descent. Feel tricep long head stretch.','Extend back to lockout. Squeeze at top 1 second.','Keep upper arm still — only forearm moves. If upper arm drifts forward, DB is too heavy.'],mistakes:[{m:'Elbow flaring outward',f:'Elbow points straight up at all times. Use free hand to check position.'},{m:'Back arching',f:'Sit on bench with back support. Brace core. If arching is involuntary, try cable version (TR-01) instead.'},{m:'Going too heavy',f:'This is a 10-15 lb exercise for most people. Ego check.'},{m:'Rushing the eccentric',f:'2-second lower. Pause briefly at full stretch.'}],why:'Dumbbell version of overhead extension for home training. Unilateral work identifies L/R tricep imbalance. The long head stretch is non-negotiable for full tricep development. Home option when no cables available.',benefits:[],subs:['TR-01','TR-06'],movementPattern:'isolation_upper',primaryMuscleGroup:'triceps',secondaryMuscleGroups:[],mechanic:'isolation',exerciseTier:'assistance',sfrRating:3,repRanges:{strength:{min:6,max:10,rest:120},hypertrophy:{min:10,max:15,rest:90},endurance:{min:15,max:25,rest:45}},recoveryImpact:{triceps:0.5},progressionIds:[],regressionIds:['TR-01','TR-06']},
 {id:'TR-05',name:'Diamond Push-Up',category:'triceps',subcategory:'compound_press',muscles:{primary:{triceps_lateral_head:70,triceps_medial_head:70,triceps_long_head:55},secondary:{pec_major_sternal:50,anterior_deltoid:45,serratus_anterior:35,rectus_abdominis:30,external_obliques:20}},equipment:['bodyweight'],location:{gym:true,home:true,work:true},tier:2,phase:{acute:{s:'suitable',p:4,n:'Incline version (hands on counter/bench). Hands 4-6 inches apart, not true diamond (reduces wrist stress). Include \'plus\' at top for serratus. Demands anti-extension core. Work mode option.'},subacute:{s:'suitable',p:4,n:'Floor version. Can progress to standard diamond width.'},maintenance:{s:'suitable',p:3,n:'Decline, weighted, or deficit. Advanced bodyweight option.'}},sets:3,reps:'8-15',rest:60,tempo:'2-1-2-0',cues:['Hands close together, 4-6 inches apart (NOT thumbs-and-index touching unless comfortable). Fingers forward or slightly turned out.','BEFORE starting: squeeze glutes, brace core, tuck pelvis to posterior tilt. Same setup as standard push-up (CH-05).','Lower slowly (2 sec). Elbows track BACKWARD along body (not out to sides). Hands beneath lower chest.','Touch chest to hands (or as close as strength allows). Press up through triceps.',`At TOP: push floor away (protract scapulae). Same 'plus' as standard push-up. Serratus anterior fires.`],mistakes:[{m:'Hips sagging',f:'Squeeze glutes. Pull belt buckle toward chin. Regress to incline if core fails before triceps.'},{m:'Elbows flaring to sides',f:'Elbows track backward along rib cage. Think \'elbows to hips.\''},{m:'Hands too close (true diamond)',f:'4-6 inches between hands. Still maximal tricep activation with safer wrist position.'},{m:'No \'plus\' at top',f:'Push floor away at lockout. Upper back rounds slightly. Then descend.'}],why:'Highest tricep EMG activation of any push-up variation (research-confirmed). Bodyweight = work/home accessible. Includes anti-extension core demand AND serratus training via \'plus\' at top. Triple benefit: tricep + core + scapular correction in one exercise.',benefits:['scapular_stability','anti_extension_core'],subs:['TR-02','TR-06'],movementPattern:'horizontal_push',primaryMuscleGroup:'triceps',secondaryMuscleGroups:['chest','front_delts'],mechanic:'compound',exerciseTier:'foundation',sfrRating:3,repRanges:{strength:{min:3,max:6,rest:180},hypertrophy:{min:8,max:12,rest:120},endurance:{min:15,max:20,rest:60}},recoveryImpact:{triceps:0.8,chest:0.4,shoulders:0.3},progressionIds:['TR-03','TR-07'],regressionIds:['CH-05']},
 {id:'TR-06',name:'Band Tricep Extension',category:'triceps',subcategory:'band_bodyweight',muscles:{primary:{triceps_lateral_head:60,triceps_medial_head:55},secondary:{triceps_long_head:40}},equipment:['resistance_bands'],location:{gym:true,home:true,work:true},tier:1,phase:{acute:{s:'suitable',p:4,n:'Work/home mode tricep option. Band pushdown version is zero shoulder stress. Overhead version may challenge shoulder — use pushdown style first. Low resistance, high reps.'},subacute:{s:'suitable',p:2,n:'Supplementary. Heavier bands.'},maintenance:{s:'suitable',p:1,n:'Travel/work only. Supplementary to cables and compounds.'}},sets:3,reps:'15-25',rest:30,tempo:'1-1-1-0',cues:['PUSHDOWN STYLE: Anchor band above head (door top, pull-up bar). Face anchor. Grab band ends.','Pin elbows to sides. Extend forearms down against band resistance. Squeeze at lockout.','OVERHEAD STYLE: Hold band behind head. One end anchored by lower hand behind back, other end in overhead hand.','Extend overhead hand until arm straight. Lower slowly.',`Both versions: controlled reps, pause at lockout, don't rush.`],mistakes:[{m:'Band too light',f:'Should feel challenging in last 5 reps of set. If easy at 25 reps, need heavier band.'},{m:'Elbow drift on pushdown',f:'Pin elbows to ribs throughout.'},{m:'Band snapping on eccentric',f:'Control return. 1-second eccentric minimum.'}],why:'Zero-barrier tricep training for work/home mode. Band in a desk drawer = tricep training during work breaks. Ascending resistance of bands actually matches the tricep strength curve better than free weights. Better than nothing principle.',benefits:[],subs:['TR-02','TR-05'],movementPattern:'isolation_upper',primaryMuscleGroup:'triceps',secondaryMuscleGroups:[],mechanic:'isolation',exerciseTier:'assistance',sfrRating:4,repRanges:{strength:{min:6,max:10,rest:120},hypertrophy:{min:10,max:15,rest:90},endurance:{min:15,max:25,rest:45}},recoveryImpact:{triceps:0.5},progressionIds:['TR-02','TR-01','TR-04'],regressionIds:[]},
 {id:'TR-07',name:'Dips (Upright / Tricep Focus)',category:'triceps',subcategory:'compound_press',muscles:{primary:{triceps_lateral_head:70,triceps_medial_head:65,triceps_long_head:60},secondary:{anterior_deltoid:45,pec_major_sternal:40,pec_major_costal:30}},equipment:['dip_station'],location:{gym:true,home:false,work:false},tier:3,phase:{acute:{s:'avoid',p:0,n:'AVOID. Bodyweight at depth loads anterior shoulder capsule. Requires adequate scapular control for safe execution. Even upright version carries risk. Use pushdowns (TR-02) and push-ups (TR-05) instead.'},subacute:{s:'caution',p:2,n:'Machine-assisted only (reduce BW 40-50%). UPRIGHT torso only. Strict 90° depth max. Only after Y-raise 15+ reps and face pull form mastered.'},maintenance:{s:'suitable',p:4,n:'Full bodyweight. Can add weight. Still upright, still 90° depth max for shoulder-conscious training.'}},sets:3,reps:'8-12',rest:120,tempo:'3-0-2-0',cues:['Grip bars shoulder-width. Arms straight, shoulders DEPRESSED (not shrugged). UPRIGHT torso — do NOT lean forward.','Lower slowly (3 sec). Elbows track BACKWARD (not out to sides). Torso stays vertical.','Stop when elbows reach 90° bend. NO DEEPER. This is the hard limit for shoulder-conscious training.',`Press up by straightening arms. Think 'push hands INTO bars.' Full lockout.`,'At top: scapulae depressed. No shrugging. If shoulders creep toward ears, weight too heavy or fatigue reached — stop set.'],mistakes:[{m:'Going too deep',f:'Hard 90° limit. Have someone watch or use a mirror. If you can\'t control depth, use assisted machine.'},{m:'Forward lean',f:'UPRIGHT. Straight line from head to hips. Cross feet behind.'},{m:'Shoulder shrugging',f:'Depress BEFORE descending. At top of every rep, check: ears far from shoulders.'},{m:'Bench dips',f:'Use parallel bar dips with assistance, or pushdowns. Avoid bench dips. Use parallel bars with assistance instead.'}],why:'Highest-loading bodyweight tricep exercise. The upright position makes it a tricep-dominant movement (vs forward-lean chest dip CH-11). Reserved for later phases after shoulder stability established. Machine-assisted version provides a progressive bridge from isolation work to full bodyweight compound pressing.',benefits:[],subs:['TR-02','TR-03','TR-05'],movementPattern:'horizontal_push',primaryMuscleGroup:'triceps',secondaryMuscleGroups:['chest','front_delts'],mechanic:'compound',exerciseTier:'foundation',sfrRating:3,repRanges:{strength:{min:3,max:6,rest:180},hypertrophy:{min:8,max:12,rest:120},endurance:{min:15,max:20,rest:60}},recoveryImpact:{triceps:0.8,chest:0.4,shoulders:0.3},progressionIds:[],regressionIds:['TR-05','TR-03']},
 {id:'BI-01',name:'Incline Dumbbell Curl',category:'biceps',subcategory:'long_head_curl',muscles:{primary:{biceps_long_head:85,biceps_short_head:50,brachialis:30},secondary:{brachioradialis:25,forearm_flexors:15}},equipment:['dumbbells','bench_incline'],location:{gym:true,home:true,work:false},tier:2,phase:{acute:{s:'caution',p:3,n:'Shoulder extension in incline position CAN stress anterior capsule. Use 55-60° incline (less extension) in acute phase. Stop immediately if anterior shoulder discomfort. Light weight only. Do NOT let arms swing behind body at bottom. If any shoulder discomfort, switch to hammer curl (BI-02).'},subacute:{s:'suitable',p:4,n:'Can progress to 45° incline if shoulder milestones met. Controlled eccentric (3 sec). Moderate loading.'},maintenance:{s:'suitable',p:5,n:'Primary long head builder. Full ROM, heavy loading. Can use 30° for maximum stretch if shoulder allows.'}},sets:3,reps:'10-12',rest:60,tempo:'2-1-3-0',cues:['Set bench to 55-60° incline (acute phase). Sit back, shoulder blades retracted into bench. Head supported.','Arms hang straight down at sides, palms forward (supinated). This is the starting stretch position — feel the long head lengthen.','Curl both dumbbells simultaneously. Elbows stay PINNED at your sides — do NOT let them drift forward.','Squeeze at the top for 1 second. Slow 3-second descent back to full extension. Control the stretch.','KEY: Do not swing arms behind body at the bottom. Stop at straight arms. Swinging behind adds anterior shoulder stress.'],mistakes:[{m:'Elbows drifting forward during curl',f:'Pin elbows to your sides. Imagine your upper arm is glued to the bench. Only forearms move.'},{m:'Letting arms swing behind body at bottom',f:'Stop at straight arms hanging perpendicular to floor. Do not let momentum carry arms backward.'},{m:'Using momentum / swinging',f:'3-second eccentric. If you can\'t control the descent, weight is too heavy. Drop 20%.'},{m:'Bench angle too flat (below 45°) in acute phase',f:'Keep bench at 55-60° in acute phase. Only flatten once shoulder stability milestones met.'}],why:'Only curl that loads the biceps long head in its fully stretched position (shoulder extension + elbow extension). The long head crosses the shoulder joint, so it MUST be trained with the arm behind the body for full development. However, this shoulder extension is the reason for the \'caution\' tag in acute phase — monitor for shoulder discomfort. Use steep incline (55-60°) initially.',benefits:[],subs:['BI-02','BI-05'],movementPattern:'isolation_upper',primaryMuscleGroup:'biceps',secondaryMuscleGroups:['forearms'],mechanic:'isolation',exerciseTier:'assistance',sfrRating:3,repRanges:{strength:{min:6,max:10,rest:120},hypertrophy:{min:10,max:15,rest:90},endurance:{min:15,max:25,rest:45}},recoveryImpact:{biceps:0.5,forearms:0.2},progressionIds:['BI-04'],regressionIds:['BI-05','BI-06']},
 {id:'BI-02',name:'Hammer Curl',category:'biceps',subcategory:'brachialis_curl',muscles:{primary:{brachialis:75,brachioradialis:70,biceps_long_head:50},secondary:{biceps_short_head:35,forearm_extensors:20}},equipment:['dumbbells'],location:{gym:true,home:true,work:false},tier:1,phase:{acute:{s:'suitable',p:5,n:'One of the safest bicep curl variations. Neutral grip eliminates the supination torque that loads the anterior shoulder. No shoulder strain risk. First-line bicep exercise in acute phase. RPE 7.'},subacute:{s:'suitable',p:4,n:'Progressive loading. Can introduce cross-body variant for more brachialis emphasis.'},maintenance:{s:'suitable',p:4,n:'Maintain as staple alongside supinated curls. Heavy loading for brachialis/forearm development.'}},sets:3,reps:'10-12',rest:60,tempo:'2-1-2-0',cues:['Stand or sit upright. Dumbbells at sides, palms facing each other (neutral grip). Thumbs pointing forward.','Curl both dumbbells keeping palms facing each other throughout. Wrist stays NEUTRAL — do NOT rotate.',`Elbows pinned at sides. Upper arms don't move. Only forearms curl up.`,'Squeeze at top for 1 second. Controlled 2-second descent to full extension.','CROSS-BODY VARIANT: Curl dumbbell across body toward opposite shoulder. More brachialis, less brachioradialis.'],mistakes:[{m:'Wrist rotating during curl (turning into regular curl)',f:'Lock wrist neutral. Thumb stays pointing UP throughout entire rep. Imagine holding a hammer — hence the name.'},{m:'Swinging / using momentum',f:'Seated version eliminates body English. If standing, back against wall. Controlled 2-sec tempo.'},{m:'Elbows drifting forward',f:'Pin upper arms to torso. If elbows move, weight is too heavy.'}],why:'Neutral grip is the SAFEST grip for shoulder comfort. Zero supination torque on the shoulder. Trains the brachialis (the deeper, stronger elbow flexor) which is often underdeveloped when only supinated curls are done. Brachioradialis training supports grip strength for rows and deadlifts. First-line bicep exercise in acute phase.',benefits:[],subs:['BI-06','BI-05'],movementPattern:'isolation_upper',primaryMuscleGroup:'biceps',secondaryMuscleGroups:['forearms'],mechanic:'isolation',exerciseTier:'assistance',sfrRating:3,repRanges:{strength:{min:6,max:10,rest:120},hypertrophy:{min:10,max:15,rest:90},endurance:{min:15,max:25,rest:45}},recoveryImpact:{biceps:0.5,forearms:0.2},progressionIds:['BI-01','BI-04'],regressionIds:['BI-06']},
 {id:'BI-03',name:'Preacher Curl (DB or Machine)',category:'biceps',subcategory:'short_head_curl',muscles:{primary:{biceps_short_head:85,biceps_long_head:55,brachialis:40},secondary:{brachioradialis:25,forearm_flexors:20}},equipment:['dumbbells','preacher_bench'],location:{gym:true,home:false,work:false},tier:2,phase:{acute:{s:'suitable',p:4,n:'Preacher pad ELIMINATES momentum and cheating — forces strict isolation. The pad prevents shoulder movement, protecting anterior capsule. Machine version preferred in acute (fixed path). DB version acceptable. Light weight, controlled eccentrics. Do NOT hyperextend elbow at bottom.'},subacute:{s:'suitable',p:4,n:'Progressive loading. Full ROM with controlled eccentrics. Can use EZ-bar version.'},maintenance:{s:'suitable',p:4,n:'Heavy loading. Primary short head builder. Pair with incline curl for complete biceps development.'}},sets:3,reps:'10-12',rest:60,tempo:'2-1-3-0',cues:['Adjust preacher bench so armpit sits at the top of the pad. Chest against pad. Feet flat on floor.','Arms fully supported on pad from armpit to wrist. Start at full extension (arms straight, not hyperextended).','Curl weight up, squeezing biceps. The pad does ALL the stabilization — just focus on the contraction.','SLOW 3-second descent. This is the money phase — eccentric loading in the stretched position is where growth happens.','Do NOT slam into full extension at bottom. Stop just short of lockout to maintain tension and protect the elbow.'],mistakes:[{m:'Lifting butt off seat / leaning back',f:'Stay seated. Chest pressed into pad. If you need to lean back, weight is too heavy.'},{m:'Hyperextending elbow at bottom',f:'Stop just short of full lockout. Maintain slight bend at the bottom. Never \'hang\' at full extension.'},{m:'Rushing the eccentric (dropping the weight)',f:'3-second descent minimum. If you can\'t control it, weight is too heavy.'},{m:'Wrists flexing/extending during curl',f:'Wrist stays neutral/slightly extended. Don\'t curl your wrists — only the elbows flex.'}],why:'The preacher pad is a form-enforcement device — it physically prevents the momentum and cheating that distraction causes during curls. By eliminating compensation, every rep is a quality rep. Short head emphasis complements the incline curl\'s long head bias for complete biceps development. Machine version is the safest joint-wise.',benefits:[],subs:['BI-05','BI-04'],movementPattern:'isolation_upper',primaryMuscleGroup:'biceps',secondaryMuscleGroups:['forearms'],mechanic:'isolation',exerciseTier:'assistance',sfrRating:5,repRanges:{strength:{min:6,max:10,rest:120},hypertrophy:{min:10,max:15,rest:90},endurance:{min:15,max:25,rest:45}},recoveryImpact:{biceps:0.5,forearms:0.2},progressionIds:['BI-04'],regressionIds:['BI-05','BI-02']},
 {id:'BI-04',name:'Cable Curl',category:'biceps',subcategory:'constant_tension_curl',muscles:{primary:{biceps_short_head:70,biceps_long_head:70,brachialis:35},secondary:{brachioradialis:30,forearm_flexors:20}},equipment:['cable_machine'],location:{gym:true,home:false,work:false},tier:2,phase:{acute:{s:'suitable',p:4,n:'Cable\'s smooth resistance curve is joint-friendly. Fixed path reduces compensation. Use straight bar or EZ-bar attachment. Low cable position. Light to moderate weight, controlled tempo. Excellent proprioceptive feedback.'},subacute:{s:'suitable',p:4,n:'Progressive loading. Can introduce high cable curl and single-arm variants.'},maintenance:{s:'suitable',p:5,n:'Primary finisher exercise. High volume, constant tension. Drop sets and 21s work well here.'}},sets:3,reps:'12-15',rest:60,tempo:'2-1-2-0',cues:['Set cable to lowest position. Attach straight bar, EZ-bar, or rope. Stand facing the cable, 1 step back.','Arms fully extended, slight forward lean. Elbows pinned at sides.','Curl bar toward shoulders. Keep elbows FIXED — only forearms move. Squeeze at the top for 1 second.',`Slow 2-second descent. Maintain tension — don't let the stack crash. Feel the cable pulling throughout.`,'KEY ADVANTAGE: Unlike dumbbells, you have tension at EVERY point in the ROM. No rest at top or bottom.'],mistakes:[{m:'Standing too close to cable',f:'Step 1-2 feet back from the cable column. You should feel the cable pulling your arms forward/down.'},{m:'Elbows moving forward during curl',f:'Pin elbows to your rib cage. If they drift forward, drop weight.'},{m:'Using body momentum (rocking/swinging)',f:'Stagger stance for stability. Or perform kneeling cable curls to eliminate body English entirely.'}],why:'Constant tension throughout full ROM makes cables uniquely effective for biceps hypertrophy. No \'dead zone\' at top or bottom like dumbbells. Smooth cable resistance is joint-friendly — a joint-friendly option. Excellent as a finisher exercise after compound pulling movements. Machine-guided path reduces form breakdown from distraction.',benefits:[],subs:['BI-01','BI-03'],movementPattern:'isolation_upper',primaryMuscleGroup:'biceps',secondaryMuscleGroups:['forearms'],mechanic:'isolation',exerciseTier:'assistance',sfrRating:5,repRanges:{strength:{min:6,max:10,rest:120},hypertrophy:{min:10,max:15,rest:90},endurance:{min:15,max:25,rest:45}},recoveryImpact:{biceps:0.5,forearms:0.2},progressionIds:[],regressionIds:['BI-02','BI-03','BI-01']},
 {id:'BI-05',name:'Concentration Curl',category:'biceps',subcategory:'isolation_curl',muscles:{primary:{biceps_short_head:80,biceps_long_head:60,brachialis:35},secondary:{brachioradialis:20,forearm_flexors:15}},equipment:['dumbbells'],location:{gym:true,home:true,work:false},tier:1,phase:{acute:{s:'suitable',p:4,n:'Seated, braced position is extremely safe for the shoulder. Zero momentum = zero compensation. Elbow braced against thigh prevents shoulder involvement entirely. Light weight, focus on mind-muscle connection. Excellent for acute phase because strict form is mechanically enforced.'},subacute:{s:'suitable',p:3,n:'Progressive loading. Full ROM with slow eccentrics. Can pair with compound exercises.'},maintenance:{s:'suitable',p:3,n:'Finisher exercise. High reps, slow tempo, maximum pump.'}},sets:3,reps:'12-15',rest:45,tempo:'2-1-3-0',cues:['Sit on bench, legs spread wide. Lean forward slightly. Brace back of upper arm (triceps) against inner thigh.','Arm hangs straight down with dumbbell. Palm facing away from thigh (supinated).','Curl dumbbell toward shoulder. Upper arm stays LOCKED against thigh — this is your anchor. Only forearm moves.','Squeeze hard at the top. Rotate pinky slightly toward ceiling for peak contraction.','SLOW 3-second descent. Fight gravity on the way down. This is where the growth stimulus is.'],mistakes:[{m:'Elbow not properly braced against thigh',f:'Press triceps firmly into inner thigh. The thigh is your preacher pad. Arm doesn\'t move.'},{m:'Rotating torso to lift weight',f:'Torso stays still. If you need to twist to lift it, weight is too heavy.'},{m:'Rushing reps',f:'2-sec up, 3-sec down minimum. Each rep should take 5+ seconds.'}],why:'Highest EMG biceps activation of any curl variant because the braced position eliminates ALL other muscle involvement. The single-arm focus and physical brace against the thigh create an external structure that forces concentration — you literally cannot cheat. Home-friendly (only needs one dumbbell). Zero shoulder stress due to braced position.',benefits:[],subs:['BI-03','BI-06'],movementPattern:'isolation_upper',primaryMuscleGroup:'biceps',secondaryMuscleGroups:['forearms'],mechanic:'isolation',exerciseTier:'assistance',sfrRating:3,repRanges:{strength:{min:6,max:10,rest:120},hypertrophy:{min:10,max:15,rest:90},endurance:{min:15,max:25,rest:45}},recoveryImpact:{biceps:0.5,forearms:0.2},progressionIds:['BI-01','BI-03'],regressionIds:['BI-06']},
 {id:'BI-06',name:'Band Curl',category:'biceps',subcategory:'ascending_resistance_curl',muscles:{primary:{biceps_short_head:65,biceps_long_head:65,brachialis:30},secondary:{brachioradialis:25,forearm_flexors:15}},equipment:['resistance_band'],location:{gym:true,home:true,work:true},tier:1,phase:{acute:{s:'suitable',p:4,n:'Bands are inherently joint-friendly — lightest tension at the most vulnerable position (full extension). No risk of dropping weights. Portable for work mode. Use medium band, controlled tempo. Can use hammer grip for maximum shoulder safety.'},subacute:{s:'suitable',p:3,n:'Heavier bands or double-looped. Can combine with dumbbells for accommodating resistance.'},maintenance:{s:'suitable',p:2,n:'Supplementary. Use as warm-up, finisher, or travel/work option. Not a primary hypertrophy tool at this phase.'}},sets:3,reps:'15-20',rest:45,tempo:'2-1-2-0',cues:['Stand on center of band with both feet. Shoulder-width stance. Grab ends of band with palms forward.',`Start with arms extended. You'll feel light tension — this is the easy part. Curl up.`,'As you curl, resistance INCREASES. Squeeze HARD at the top — this is where bands are toughest.','Hold peak contraction 1-2 seconds. The peak squeeze is the main stimulus with bands.',`Lower controlled (2 sec). Don't let band snap arms down. Fight the descent even though it gets easier.`],mistakes:[{m:'Letting band snap arms to full extension',f:'Control the descent throughout. Lower in 2 seconds minimum.'},{m:'Not squeezing at the top',f:'Hold peak contraction for 1-2 seconds every single rep. Squeeze as hard as possible.'},{m:'Too narrow stance (not enough resistance)',f:'Widen stance to increase starting tension. Or double-loop the band around hands. Or use heavier band.'}],why:'The only biceps exercise available in \'work mode.\' Resistance bands are portable, joint-friendly, and provide ascending resistance that peaks at contraction. Lightest at full extension protects the elbow joint and anterior shoulder. Perfect for travel days, office workouts, or as a warm-up/finisher. Low barrier to entry supports executive function — zero setup friction.',benefits:[],subs:['BI-02','BI-05'],movementPattern:'isolation_upper',primaryMuscleGroup:'biceps',secondaryMuscleGroups:['forearms'],mechanic:'isolation',exerciseTier:'assistance',sfrRating:4,repRanges:{strength:{min:6,max:10,rest:120},hypertrophy:{min:10,max:15,rest:90},endurance:{min:15,max:25,rest:45}},recoveryImpact:{biceps:0.5,forearms:0.2},progressionIds:['BI-02','BI-05'],regressionIds:[]},
 {id:'QD-01',name:'Goblet Squat (Heels Elevated)',category:'quads',subcategory:'squat',muscles:{primary:{rectus_femoris:65,vastus_lateralis:80,vastus_medialis:75,vastus_intermedius:75,gluteus_maximus:60},secondary:{gluteus_medius:30,erector_spinae:25,rectus_abdominis:35,transverse_abdominis:30,hip_adductors:25}},equipment:['dumbbells','weight_plate'],location:{gym:true,home:true,work:false},tier:2,phase:{acute:{s:'suitable',p:5,n:'An accessible and joint-friendly squat pattern. Heels elevated on plates or wedge (1-2 inches). Goblet hold teaches upright torso and anti-extension bracing. Start with light DB (15-25 lbs). Depth: parallel or slightly above — no deep squat until comfortable.'},subacute:{s:'suitable',p:5,n:'Progressive loading. Can deepen ROM if comfortable. Maintain heel elevation.'},maintenance:{s:'suitable',p:4,n:'Heavy goblet or transition to front-loaded barbell alternatives. Heel elevation optional based on ankle mobility progress.'}},sets:3,reps:'8-12',rest:90,tempo:'3-1-2-0',cues:['Place heels on 1-2 inch elevation (small plates, squat wedge, or folded towel). Feet shoulder-width, toes out 15-20°.','Hold DB vertically at chest with both hands (goblet position). Elbows pointing DOWN. DB acts as a counterbalance keeping you upright.',`BEFORE descending: brace core, posteriorly tilt pelvis. Think 'ribs down, belt buckle up.' Maintain this pelvic position throughout.`,'Sit DOWN between your heels. Knees track over 2nd-3rd toe — watch for valgus. 3-second descent. Go to parallel or just above.','Drive through FULL foot (heel emphasis). Push the floor apart with your feet (activates glute med). Stand tall, squeeze glutes at top.'],mistakes:[{m:'Anterior pelvic tilt at bottom (butt wink reversal)',f:'Don\'t go deeper than where pelvis starts to tuck under. Reduce depth. Heel elevation helps maintain neutral pelvis to greater depths.'},{m:'Knee valgus (knees caving in)',f:'\'Push the floor apart.\' If valgus persists, glute med not yet ready for squatting. Regress to leg press or wall sit.'},{m:'Rising onto toes',f:'Heel elevation should prevent this. If still rising, increase elevation OR reduce depth.'},{m:'Forward lean / chest dropping',f:'Goblet hold IS the fix. If chest drops, DB is too heavy. Push elbows between knees at bottom.'}],why:'Replaces not recommended heavy barbell back squat. Goblet hold forces upright torso (anti-extension). Heel elevation reduces forefoot load — reduces forefoot load — AND reduces ankle dorsiflexion demand. Front-loading creates anti-extension core demand that promotes good posture and core stability. Self-limiting — when DB gets too heavy to hold, it naturally caps loading (protects lumbar discs).',benefits:['anterior_pelvic_tilt','anti_extension_core'],subs:['QD-02','QD-06'],movementPattern:'squat',primaryMuscleGroup:'quads',secondaryMuscleGroups:['glutes','core'],mechanic:'compound',exerciseTier:'foundation',sfrRating:3,repRanges:{strength:{min:3,max:6,rest:180},hypertrophy:{min:8,max:12,rest:120},endurance:{min:15,max:20,rest:60}},recoveryImpact:{quads:0.8,glutes:0.4,core:0.4},progressionIds:['QD-02','QD-05','QD-07'],regressionIds:['QD-06','QD-08']},
 {id:'QD-02',name:'Leg Press',category:'quads',subcategory:'machine_compound',muscles:{primary:{rectus_femoris:55,vastus_lateralis:85,vastus_medialis:80,vastus_intermedius:80,gluteus_maximus:50},secondary:{biceps_femoris:25,semitendinosus:20,hip_adductors:25}},equipment:['leg_press_machine'],location:{gym:true,home:false,work:false},tier:2,phase:{acute:{s:'suitable',p:4,n:'Machine eliminates balance demand and controls path. NO axial spinal loading. Feet mid-to-high on platform. Moderate depth only — stop before lower back rounds off pad. Start light.'},subacute:{s:'suitable',p:5,n:'Primary quad overloading exercise. Progressive loading. Can go heavier than squat safely.'},maintenance:{s:'suitable',p:5,n:'Heavy loading. Various foot positions for targeting. Single-leg variant.'}},sets:3,reps:'10-12',rest:90,tempo:'3-1-2-0',cues:['Feet shoulder-width, MID-TO-HIGH on platform (reduces knee joint compression). Toes 15° out.',`Lower back FLAT against pad. Grab side handles for stability. Don't place hands on knees.`,'Release safety catches. Lower sled slowly (3 sec). Knees track over toes — NO valgus.','Descend until knees reach ~90° OR until lower back starts to lift off pad — whichever comes FIRST.',`Drive through HEELS. Push sled away. Don't lock knees at top — stop just short of full extension.`],mistakes:[{m:'Lower back rounding off pad at bottom',f:'STOP before back lifts. If you can place a hand behind your lower back and it\'s firmly pressed at bottom, depth is fine.'},{m:'Feet too low on platform',f:'Mid-to-high position. Higher = safer for knees. Slight quad emphasis trade-off is worth the joint protection.'},{m:'Locking knees at top',f:'Stop 5° short of full extension. Maintain quad tension throughout.'},{m:'Knee valgus under load',f:'Push knees OUT actively. If valgus persists even with conscious effort, reduce weight.'}],why:'Heavy quad loading without axial spinal compression — replaces not recommended barbell back squat, protecting the lower back. Machine controls path. No balance demand required. Foot position adjustable to optimize for knee safety — mid-to-high placement reduces the knee joint compression on the knee.',benefits:[],subs:['QD-01','QD-05'],movementPattern:'squat',primaryMuscleGroup:'quads',secondaryMuscleGroups:['glutes','core'],mechanic:'compound',exerciseTier:'foundation',sfrRating:4,repRanges:{strength:{min:3,max:6,rest:180},hypertrophy:{min:8,max:12,rest:120},endurance:{min:15,max:20,rest:60}},recoveryImpact:{quads:0.8,glutes:0.4,core:0.4},progressionIds:[],regressionIds:['QD-01']},
 {id:'QD-03',name:'Leg Extension (Machine)',category:'quads',subcategory:'knee_extension',muscles:{primary:{rectus_femoris:85,vastus_lateralis:80,vastus_medialis:80,vastus_intermedius:80},secondary:{tibialis_anterior:15}},equipment:['leg_extension_machine'],location:{gym:true,home:false,work:false},tier:1,phase:{acute:{s:'caution',p:3,n:'PARTIAL ROM ONLY — top 60° of extension (avoid deep flexion where knee joint compression peaks). Light weight. Toes slightly out for VMO emphasis. Excellent for quad activation without squatting mechanics.'},subacute:{s:'suitable',p:4,n:'Gradually increase ROM if comfortable or pain. Moderate loading. VMO focus.'},maintenance:{s:'suitable',p:4,n:'Full ROM if tolerated. Heavy loading. Drop sets for finisher.'}},sets:3,reps:'12-15',rest:60,tempo:'2-2-2-0',cues:['Adjust machine: knee joint aligns with machine pivot. Back flat against pad. Pad on lower shin, just above ankle.','Slight toe turnout (10-15° external rotation) to bias VMO recruitment.','For acute phase: START from ~60° flexion (not full flexion). Extend to full lockout. Focus on SQUEEZING VMO at lockout — feel the inside of the kneecap area contract.','Hold peak contraction 2 seconds. This is where VMO activation is highest.',`Lower slowly (2 sec). Don't go past 90° flexion — stop at 60° and reverse. Protect the knee joint joint.`],mistakes:[{m:'Full ROM into deep flexion',f:'Top 60° of ROM only in acute phase. Set ROM limiter if machine allows. Gradually increase over months.'},{m:'Using momentum/swinging',f:'Smooth, controlled. 2-sec up, 2-sec hold, 2-sec down. Every rep identical.'},{m:'Butt lifting off seat',f:'Stay seated. If butt lifts, weight too heavy.'},{m:'Gripping seat too tightly',f:'Light hand contact on handles. Quads do the work, not your death grip.'}],why:'Only true quad isolation exercise. VMO targeting with toe-out cue addresses the knee joint tracking dysfunction contributing to knee tracking issues. Partial ROM strategy (top 60° only in acute phase) allows quad training while respecting knee joint compression limits. No spinal loading. Seated eliminates balance demand.',benefits:[],subs:['QD-04','QD-06'],movementPattern:'isolation_lower',primaryMuscleGroup:'quads',secondaryMuscleGroups:[],mechanic:'isolation',exerciseTier:'assistance',sfrRating:5,repRanges:{strength:{min:6,max:10,rest:120},hypertrophy:{min:10,max:15,rest:90},endurance:{min:15,max:25,rest:45}},recoveryImpact:{quads:0.5},progressionIds:[],regressionIds:[]},
 {id:'QD-04',name:'Peterson Step-Up',category:'quads',subcategory:'single_leg_quad',muscles:{primary:{vastus_medialis:90,vastus_lateralis:55,vastus_intermedius:60},secondary:{rectus_femoris:40,gluteus_medius:55,gluteus_maximus:35,gastrocnemius:15}},equipment:['weight_plate','bodyweight'],location:{gym:true,home:true,work:false},tier:2,phase:{acute:{s:'suitable',p:5,n:'KEY REHAB EXERCISE. 4-6 inch platform ONLY. Bodyweight. Targets VMO weakness contributing to knee joint issues. Monitor knee valgus — if present, glute med not ready. One of the phase transition test exercises (15 reps/side without valgus).'},subacute:{s:'suitable',p:5,n:'Can increase platform height to 6-8 inches. Light DB in goblet hold if bodyweight is easy.'},maintenance:{s:'suitable',p:4,n:'Warm-up activation drill. Light loading. Maintain VMO competence.'}},sets:3,reps:'12-15 each side',rest:60,tempo:'2-1-2-0',cues:['Stand on a 4-6 inch platform/step. Place working foot so HEEL is on the edge, TOES HANGING OFF. Weight entirely through the heel.',`Non-working leg hangs off the side of the platform. This is the leg you're lowering with control.`,'Slowly lower the non-working foot toward the floor by bending the working knee. 2-second descent. Control is everything.',`Lightly tap the floor with the non-working heel, then drive up through the working leg's HEEL.`,'Watch the working knee — must track over 2nd-3rd toe. NO inward collapse. This is a glute med + VMO coordination test.'],mistakes:[{m:'Weight shifting to toes',f:'Toes must hang off edge. Heel is the only contact point. Wiggle toes at any point to confirm they\'re unloaded.'},{m:'Knee valgus during descent',f:'If valgus occurs, keep doing clamshells and side-lying abduction. Return to Peterson step-ups weekly to re-test.'},{m:'Using momentum to come back up',f:'Tap floor lightly — don\'t bounce. Pause 1 second at bottom before driving up.'},{m:'Platform too high',f:'4-6 inches for acute. Never exceed 8 inches.'}],why:'Highest VMO activation of any exercise studied. Targets knee joint tracking. Can also reveal knee valgus if glute med remains weak. Progression milestone: 15 reps/side without valgus.',benefits:['glute_med_activation','knee joint_pain'],subs:['QD-03','QD-06'],movementPattern:'lunge',primaryMuscleGroup:'quads',secondaryMuscleGroups:['glutes','core'],mechanic:'compound',exerciseTier:'supplemental',sfrRating:2,repRanges:{strength:{min:3,max:6,rest:180},hypertrophy:{min:8,max:12,rest:120},endurance:{min:15,max:20,rest:60}},recoveryImpact:{quads:0.8,glutes:0.4,core:0.4},progressionIds:['GL-07'],regressionIds:[]},
 {id:'QD-05',name:'Bulgarian Split Squat',category:'quads',subcategory:'single_leg_squat',muscles:{primary:{rectus_femoris:65,vastus_lateralis:80,vastus_medialis:75,vastus_intermedius:75,gluteus_maximus:70},secondary:{gluteus_medius:55,biceps_femoris:25,hip_adductors:30,rectus_abdominis:30}},equipment:['dumbbells','bench_flat'],location:{gym:true,home:true,work:false},tier:3,phase:{acute:{s:'caution',p:2,n:'High balance demand makes this risky in acute phase. Only if goblet squat is solid AND single-leg balance ≥30 sec. Bodyweight first. Hold rack for support. Monitor knee valgus.'},subacute:{s:'suitable',p:5,n:'Primary single-leg exercise. Light DBs. Heel elevation on front foot if ankle dorsiflexion limited. Rear foot elevation stretches hip flexor — beneficial dual benefit.'},maintenance:{s:'suitable',p:5,n:'Heavy loading. Front foot flat (ankle mobility should be adequate). Key hypertrophy exercise.'}},sets:3,reps:'8-10 each side',rest:90,tempo:'3-1-2-0',cues:['Rear foot laces-down on bench behind you. Front foot ~2 feet in front of bench. Optional: front foot on slight heel elevation.','Hold DBs at sides (or bodyweight, or hold rack for balance in acute phase).','Lower straight DOWN by bending front knee. Torso stays upright — slight forward lean is OK. 3-second descent.','Front knee tracks over 2nd-3rd toe. Descend until front thigh is parallel or rear knee lightly taps floor.',`Drive through front HEEL to stand. Squeeze glute at top. Posterior tilt throughout — don't let pelvis dump forward.`],mistakes:[{m:'Front foot too close to bench',f:'At bottom, front shin should be roughly vertical or slightly forward. Adjust distance accordingly.'},{m:'Losing balance laterally',f:'Acute phase: one hand on rack. Subacute: no support but near rack if needed. Use fixed bench, not unstable surface.'},{m:'Anterior pelvic tilt (butt sticking out)',f:'Posterior tilt cue. The rear leg position naturally stretches hip flexor ONLY if pelvis is posteriorly tilted.'},{m:'Knee valgus on front leg',f:'Push knee out toward pinky toe. If valgus persists, regress to goblet squat.'}],why:'Dual beneficial benefit: trains front leg quads+glutes while stretching rear leg hip flexors. Single-leg loading naturally trains glute med stabilization. Builds hip stability, glute strength, and quad strength simultaneously. No axial spinal loading.',benefits:['anterior_pelvic_tilt','glute_med_activation'],subs:['QD-01','QD-02'],movementPattern:'lunge',primaryMuscleGroup:'quads',secondaryMuscleGroups:['glutes','core'],mechanic:'compound',exerciseTier:'supplemental',sfrRating:2,repRanges:{strength:{min:3,max:6,rest:180},hypertrophy:{min:8,max:12,rest:120},endurance:{min:15,max:20,rest:60}},recoveryImpact:{quads:0.8,glutes:0.4,core:0.4},progressionIds:[],regressionIds:['QD-01','GL-07','QD-07']},
 {id:'QD-06',name:'Wall Sit',category:'quads',subcategory:'isometric',muscles:{primary:{vastus_lateralis:70,vastus_medialis:70,vastus_intermedius:70},secondary:{rectus_femoris:45,gluteus_maximus:25,rectus_abdominis:20}},equipment:['bodyweight'],location:{gym:true,home:true,work:true},tier:1,phase:{acute:{s:'suitable',p:4,n:'Isometric = zero joint movement = lowest knee shear. Hold at 45-60° knee angle, NOT 90° (too much PF compression). Band around knees optional for glute med. Great for work mode. 3-4 holds of 20-30 seconds.'},subacute:{s:'suitable',p:3,n:'Progress to deeper angle (60-75°). Longer holds (45-60 sec). Add DB on thighs for load.'},maintenance:{s:'suitable',p:2,n:'Warm-up or work-mode option. Dynamic exercises replace as primary.'}},sets:3,reps:'20-45 sec holds',rest:60,tempo:'hold',cues:['Back flat against wall. Walk feet out until you can slide down to desired angle (start at 45-60° knee bend, NOT full 90°).','Feet hip-width, toes forward, HEELS on floor (not rising onto toes). Shins approximately vertical.','Press entire back flat against wall — upper back, lower back, glutes all in contact. This enforces neutral spine.',`Hold position. Breathe. Don't hold your breath. Quads should burn progressively.`,'Optional: place mini band around knees and gently push out to activate glute med simultaneously.'],mistakes:[{m:'Going too deep (90° right away)',f:'Start shallow (45°). Progress 10° deeper per week as tolerated. 90° is a long-term goal, not day one.'},{m:'Heels lifting off floor',f:'Walk feet out further from wall. Heels must stay DOWN.'},{m:'Lower back arching off wall',f:'Press lower back INTO wall. This is built-in anti-extension feedback.'},{m:'Holding breath',f:'Breathe normally throughout. Count breaths to maintain rhythm.'}],why:'Isometric quad training with ZERO joint movement — lowest possible knee shear force, safest option for knee comfort. Wall provides back support and direct anti-extension tactile feedback (lower back pressed into wall promotes good posture and core stability). Zero equipment. Can be done anywhere including work. Banded variant simultaneously trains the glute medius.',benefits:['knee joint_pain'],subs:['QD-03','QD-01'],movementPattern:'squat',primaryMuscleGroup:'quads',secondaryMuscleGroups:['glutes','core'],mechanic:'compound',exerciseTier:'supplemental',sfrRating:3,repRanges:{strength:{min:3,max:6,rest:180},hypertrophy:{min:8,max:12,rest:120},endurance:{min:15,max:20,rest:60}},recoveryImpact:{quads:0.8,glutes:0.4,core:0.4},progressionIds:['QD-01','QD-08'],regressionIds:[]},
 {id:'QD-07',name:'Front Foot Elevated Split Squat',category:'quads',subcategory:'single_leg_squat',muscles:{primary:{rectus_femoris:60,vastus_lateralis:75,vastus_medialis:70,vastus_intermedius:70,gluteus_maximus:65},secondary:{gluteus_medius:50,biceps_femoris:20,hip_adductors:25,rectus_abdominis:25}},equipment:['dumbbells','weight_plate'],location:{gym:true,home:true,work:false},tier:2,phase:{acute:{s:'suitable',p:3,n:'More stable than Bulgarian split squat (rear foot on ground). Introduces single-leg pattern with manageable balance demand. Bodyweight first. Hold rack if needed.'},subacute:{s:'suitable',p:4,n:'Light DBs. Key bridge to Bulgarian split squat.'},maintenance:{s:'suitable',p:3,n:'Supplemental or warm-up. BSS replaces as primary.'}},sets:3,reps:'10-12 each side',rest:75,tempo:'3-1-2-0',cues:['Place front foot on 2-4 inch elevation (plate, step). Rear foot on floor behind, staggered stance. ~2 foot split between feet.','Torso upright. DBs at sides or bodyweight. Brace core.','Lower by bending both knees. Front knee tracks over toes. Rear knee descends toward floor.','Descend until rear knee lightly touches floor or front thigh reaches parallel. 3-second descent.','Drive through front foot HEEL to stand. Full hip extension at top with glute squeeze.'],mistakes:[{m:'Stance too narrow (front-to-back)',f:'At bottom, front shin should be near vertical. Lengthen stance if knee is past toes.'},{m:'Weight shifting to rear leg',f:'Think \'front leg does the work, back leg is just a kickstand.\''},{m:'Torso collapsing forward',f:'Chest up, shoulders back. Goblet hold helps if this is persistent.'}],why:'Bridge exercise between bilateral goblet squat and unilateral Bulgarian split squat. Introduces single-leg pattern with rear foot on ground (MUCH more stable). Less balance demand than BSS = safer entry point for balance challenges. Still gets hip flexor stretch on rear leg.',benefits:['anterior_pelvic_tilt','glute_med_activation'],subs:['QD-05','QD-01'],movementPattern:'lunge',primaryMuscleGroup:'quads',secondaryMuscleGroups:['glutes','core'],mechanic:'compound',exerciseTier:'supplemental',sfrRating:2,repRanges:{strength:{min:3,max:6,rest:180},hypertrophy:{min:8,max:12,rest:120},endurance:{min:15,max:20,rest:60}},recoveryImpact:{quads:0.8,glutes:0.4,core:0.4},progressionIds:['QD-05'],regressionIds:['QD-01']},
 {id:'QD-08',name:'Spanish Squat (Banded)',category:'quads',subcategory:'squat',muscles:{primary:{vastus_lateralis:80,vastus_medialis:80,vastus_intermedius:80},secondary:{rectus_femoris:50,gluteus_maximus:35,rectus_abdominis:25}},equipment:['resistance_bands'],location:{gym:true,home:true,work:false},tier:2,phase:{acute:{s:'suitable',p:4,n:'Band deloads the knee joint joint — allows quad training with LESS compression than bodyweight squat. Excellent for knee-friendly training. Start with light band, moderate depth.'},subacute:{s:'suitable',p:4,n:'Heavier band. Deeper ROM as tolerated. Can hold DB for additional load.'},maintenance:{s:'suitable',p:3,n:'Warm-up or supplemental. Leg press/squat replaces for loading.'}},sets:3,reps:'12-15',rest:60,tempo:'3-1-2-0',cues:['Loop heavy band around a squat rack post or solid anchor at knee height. Step into band so it sits in the crease behind BOTH knees.','Walk back until band is taut. Feet shoulder-width, slight toe-out. The band pulls your tibias backward — lean INTO this.','Sit back and down into a squat. The band allows you to keep shins more vertical than a normal squat, which is the beneficial mechanism.','Descend to comfort — the band reduces knee stress so you may tolerate deeper positions than a regular squat.','Drive up through full foot. Squeeze quads at top. Band will pull you forward — brace core.'],mistakes:[{m:'Band too light (no tibial pull)',f:'Use a band heavy enough to noticeably pull you forward. You should have to lean back slightly against it.'},{m:'Standing too close to anchor',f:'Walk back until band is taut at the START of the movement.'},{m:'Losing balance backward',f:'Arms extended forward as counterbalance. Practice with light band first.'}],why:'Band deloads the knee joint joint by pulling tibias backward — reduces the compression on the knee. Allows quad training at greater ROM than would otherwise be comfortable without the band. Therapeutic tool specifically designed for knee-focused training. No axial spinal loading (protects the lower back).',benefits:['knee joint_pain'],subs:['QD-06','QD-03'],movementPattern:'squat',primaryMuscleGroup:'quads',secondaryMuscleGroups:['glutes','core'],mechanic:'compound',exerciseTier:'foundation',sfrRating:4,repRanges:{strength:{min:3,max:6,rest:180},hypertrophy:{min:8,max:12,rest:120},endurance:{min:15,max:20,rest:60}},recoveryImpact:{quads:0.8,glutes:0.4,core:0.4},progressionIds:['QD-01'],regressionIds:['QD-06']},
 {id:'HM-01',name:'Dumbbell Romanian Deadlift',category:'hamstrings',subcategory:'hip_hinge',muscles:{primary:{biceps_femoris:80,semitendinosus:75,semimembranosus:70,gluteus_maximus:65},secondary:{erector_spinae:45,lower_trapezius:20,middle_trapezius:20,rectus_abdominis:25,forearm_flexors:30}},equipment:['dumbbells'],location:{gym:true,home:true,work:false},tier:2,phase:{acute:{s:'suitable',p:4,n:'Dumbbells ONLY (not barbell — less axial loading on lumbar). Light weight. Focus on hip hinge pattern, not loading. 15-20° knee bend. ROM limited to where hamstring stretch is felt, not maximum depth.'},subacute:{s:'suitable',p:5,n:'Progressive loading. Full hamstring stretch ROM. Single-leg variant introduced.'},maintenance:{s:'suitable',p:5,n:'Heavy loading. Barbell RDL can be introduced if back remains asymptomatic. Deficit variant available.'}},sets:3,reps:'8-12',rest:90,tempo:'3-0-2-0',cues:['Stand with feet hip-width, slight toe-out. Hold DBs in front of thighs, palms facing body. Slight knee bend (~15-20°) — LOCK this angle.',`Brace core. Think 'belt buckle to spine.' Shoulder blades retracted and depressed (upper back engaged).`,'Push hips BACK (not down). DBs slide down thighs, then in front of shins. Back stays neutral — chest proud.',`Lower until you feel a strong hamstring stretch OR DBs reach mid-shin — whichever comes FIRST. Don't chase depth.`,'Drive hips FORWARD to return. Squeeze glutes at top. Posterior pelvic tilt at lockout. 3-second descent on every rep.'],mistakes:[{m:'Rounding lower back',f:'If back rounds, you\'ve gone too deep. Reduce ROM. If it rounds with light weight, master cable pull-through first (GL-05).'},{m:'Knee bend increasing during descent',f:'Lock knee angle at the start. Think \'knees are frozen in place.\' Push butt BACK.'},{m:'Hyperextending at lockout',f:'Finish at neutral or slight posterior tilt. NEVER lean back past vertical.'},{m:'DBs drifting away from body',f:'DBs should SLIDE against your legs. If they\'re 2+ inches from your body, they\'re too far.'}],why:'Primary hamstring lengthening exercise. DBs instead of barbell drastically reduces axial spinal loading — easier on the lower back. Hip hinge pattern directly counteracts the quad-dominant movement strategy reinforced by poor posture. Teaches hip dissociation from lumbar motion, ',benefits:['anterior_pelvic_tilt'],subs:['GL-05','HM-02'],movementPattern:'hip_hinge',primaryMuscleGroup:'hamstrings',secondaryMuscleGroups:['glutes','back'],mechanic:'compound',exerciseTier:'foundation',sfrRating:2,repRanges:{strength:{min:3,max:6,rest:180},hypertrophy:{min:8,max:12,rest:120},endurance:{min:15,max:20,rest:60}},recoveryImpact:{hamstrings:0.8,glutes:0.4,back:0.4},progressionIds:['HM-05'],regressionIds:['GL-05','HM-04']},
 {id:'HM-02',name:'Seated Leg Curl (Machine)',category:'hamstrings',subcategory:'knee_flexion',muscles:{primary:{biceps_femoris:75,semitendinosus:80,semimembranosus:75},secondary:{gastrocnemius:30,popliteus:15}},equipment:['leg_curl_machine'],location:{gym:true,home:false,work:false},tier:1,phase:{acute:{s:'suitable',p:5,n:'Safe substitute for Nordic curls (not recommended). Machine controls path. Seated = no spinal loading. Start light, focus on mind-muscle connection. Keep toes dorsiflexed.'},subacute:{s:'suitable',p:4,n:'Progressive loading. Tempo eccentrics. Single-leg variant.'},maintenance:{s:'suitable',p:4,n:'Heavy loading. Isometric holds. Drop sets.'}},sets:3,reps:'10-12',rest:75,tempo:'2-1-3-0',cues:['Adjust pad so it sits just above Achilles tendon, NOT on calf muscle. Back of knee at edge of seat.',`Sit upright, hold handles lightly for stability. Don't pull yourself down with handles.`,'Pull toes toward shins (dorsiflexion) — this reduces calf assistance and isolates hamstrings.','Curl weight by pulling heels toward butt. Squeeze at full contraction 1 second.',`SLOW eccentric: 3-second return. This is where the growth stimulus is. Control the weight back — don't let it slam.`],mistakes:[{m:'Using momentum/jerking',f:'Smooth, controlled movement. If you need momentum, weight is too heavy.'},{m:'Lifting butt off seat',f:'Stay seated. If butt lifts, reduce weight. Hamstrings should do all the work.'},{m:'Fast eccentric (dropping weight)',f:'MINIMUM 3-second lowering phase. Count it out. Feel the stretch on return.'},{m:'Plantarflexion (pointing toes)',f:'Actively dorsiflex (toes toward shins) throughout. This is a deliberate cue, not passive.'}],why:'Replaces Nordic curls (not recommended due to extreme knee joint compression loading the knee joint). Machine controls path — zero spinal loading, zero balance demand. Seated position lengthens hamstrings at the hip for greater activation. Eccentric emphasis builds hamstring resilience that protects against strains.',benefits:[],subs:['HM-03','HM-04'],movementPattern:'isolation_lower',primaryMuscleGroup:'hamstrings',secondaryMuscleGroups:[],mechanic:'isolation',exerciseTier:'assistance',sfrRating:5,repRanges:{strength:{min:6,max:10,rest:120},hypertrophy:{min:10,max:15,rest:90},endurance:{min:15,max:25,rest:45}},recoveryImpact:{hamstrings:0.5},progressionIds:['HM-03'],regressionIds:['HM-06']},
 {id:'HM-03',name:'Lying Leg Curl (Machine)',category:'hamstrings',subcategory:'knee_flexion',muscles:{primary:{biceps_femoris:80,semitendinosus:70,semimembranosus:70},secondary:{gastrocnemius:25,popliteus:15}},equipment:['leg_curl_machine'],location:{gym:true,home:false,work:false},tier:1,phase:{acute:{s:'caution',p:3,n:'Prone position can trigger lumbar extension (a common compensation). Must actively brace core and maintain neutral/posterior tilt throughout. If extension cannot be controlled, use seated curl (HM-02) exclusively.'},subacute:{s:'suitable',p:4,n:'Good complement to seated curl. Core control should be adequate by now.'},maintenance:{s:'suitable',p:4,n:'Full loading. Both curls programmed for complete hamstring development.'}},sets:3,reps:'10-12',rest:75,tempo:'2-1-3-0',cues:['Lie face down. Pad just above Achilles. Kneecaps just past edge of bench pad.','BEFORE curling: brace core, slightly tuck pelvis to flatten lower back against pad. This prevents extension.','Pull toes toward shins (dorsiflex). Curl heels toward glutes.',`Squeeze at peak contraction 1 second. Don't lift hips off pad at any point.`,`3-second lowering phase. Full extension at bottom — don't stop short.`],mistakes:[{m:'Hips lifting off pad (hyperextension)',f:'Reduce weight drastically. Focus on core brace. If hips keep lifting, switch to seated curl.'},{m:'Incomplete ROM at bottom',f:'Full extension at bottom. If cramping prevents this, reduce weight.'},{m:'Cervical extension (looking up)',f:'Forehead on hands or look straight down at pad. Neutral cervical spine.'}],why:'Complements seated curl by training hamstrings at a different hip angle (length-tension relationship changes). Prone position provides lumbar decompression when executed correctly — but requires vigilance against the pelvis pulling into anterior tilt. Monitor for lumbar hyperextension, which is a common compensatory pattern.',benefits:[],subs:['HM-02','HM-04'],movementPattern:'isolation_lower',primaryMuscleGroup:'hamstrings',secondaryMuscleGroups:[],mechanic:'isolation',exerciseTier:'assistance',sfrRating:5,repRanges:{strength:{min:6,max:10,rest:120},hypertrophy:{min:10,max:15,rest:90},endurance:{min:15,max:25,rest:45}},recoveryImpact:{hamstrings:0.5},progressionIds:[],regressionIds:['HM-02']},
 {id:'HM-04',name:'Glute-Ham Bridge (Floor Slider)',category:'hamstrings',subcategory:'knee_flexion',muscles:{primary:{biceps_femoris:75,semitendinosus:75,semimembranosus:70,gluteus_maximus:55},secondary:{gastrocnemius:25,rectus_abdominis:30,erector_spinae:20}},equipment:['bodyweight'],location:{gym:true,home:true,work:false},tier:2,phase:{acute:{s:'suitable',p:4,n:'Safe Nordic curl alternative (no knee joint compression). Bodyweight only. Use towel on smooth floor or furniture sliders. Start with partial ROM if full extension causes cramping.'},subacute:{s:'suitable',p:4,n:'Full ROM. Single-leg progression if bilateral is 3×10 at RPE 7.'},maintenance:{s:'suitable',p:3,n:'Warm-up or home workout option. Single-leg for challenge.'}},sets:3,reps:'8-10',rest:75,tempo:'3-0-2-0',cues:['Lie on back, heels on sliders (or towel on smooth floor). Knees bent ~90°, arms at sides.','Bridge hips up — squeeze glutes. Posterior pelvic tilt. This is the starting position.','WHILE MAINTAINING bridge height, slowly SLIDE heels away from body. Extend legs as far as you can control — 3-second extension.',`At full extension (or wherever you feel you'd lose the bridge), PULL heels back in by curling hamstrings.`,'Hips should NOT drop during the slide-out. If they drop, hamstrings failed. Reduce ROM.'],mistakes:[{m:'Hips dropping during slide-out',f:'Reduce slide distance. Only go as far as hips can stay elevated. Build ROM over weeks.'},{m:'Hamstring cramping',f:'Reduce ROM. Pre-activate glutes with bridges. Stay hydrated. Cramping usually resolves as strength improves.'},{m:'Using arms to push',f:'Arms across chest for full challenge, or light floor contact for balance only.'}],why:'Nordic curl alternative without the knee joint compression that loads the knee joint. Trains both hamstring functions (hip extension + knee flexion) simultaneously. Zero equipment needed. Teaches hamstring-glute co-contraction that is impaired by the weak glute medius.',benefits:['anterior_pelvic_tilt','anti_extension_core'],subs:['HM-02','HM-03'],movementPattern:'isolation_lower',primaryMuscleGroup:'hamstrings',secondaryMuscleGroups:[],mechanic:'isolation',exerciseTier:'assistance',sfrRating:3,repRanges:{strength:{min:6,max:10,rest:120},hypertrophy:{min:10,max:15,rest:90},endurance:{min:15,max:25,rest:45}},recoveryImpact:{hamstrings:0.5},progressionIds:['HM-01'],regressionIds:['GL-02']},
 {id:'HM-05',name:'Single-Leg Romanian Deadlift',category:'hamstrings',subcategory:'hip_hinge',muscles:{primary:{biceps_femoris:80,semitendinosus:75,semimembranosus:70,gluteus_maximus:70,gluteus_medius:65},secondary:{erector_spinae:35,rectus_abdominis:30,external_obliques:30,gastrocnemius:15,soleus:15,tibialis_anterior:20}},equipment:['dumbbells'],location:{gym:true,home:true,work:false},tier:3,phase:{acute:{s:'caution',p:2,n:'Only if bilateral DB RDL is solid (3×12 at RPE 7 without back rounding). Start BODYWEIGHT. Hold onto rack or wall for balance. Balance may be challenging at first. Don\'t rush.'},subacute:{s:'suitable',p:5,n:'Light DB. Contralateral hold. Key exercise for integrating glute med, hamstring, and ankle proprioception training.'},maintenance:{s:'suitable',p:5,n:'Moderate to heavy DB. Freestanding (no support). Core stability should be well-developed.'}},sets:3,reps:'8-10 each side',rest:90,tempo:'3-1-2-0',cues:['Stand on one leg, slight knee bend (15-20°). DB in opposite hand (contralateral loading). Other hand free or lightly touching rack for balance (acute phase).','Hinge at hip — free leg extends behind you as a counterbalance. Torso and rear leg should form a straight line as you descend.','Lower DB toward floor, keeping it close to standing leg. 3-second descent. Feel hamstring of standing leg stretch.','Go as deep as hamstring flexibility allows while maintaining neutral spine. Mid-shin is typical.','Drive standing hip FORWARD to return. Squeeze glute at top. Rear leg returns to standing. Posterior tilt at top.'],mistakes:[{m:'Wobbling/loss of balance',f:'Start with rack or wall support. Bodyweight only. Progress to unsupported as balance improves. This IS the ankle rehab.'},{m:'Hip opening (rotating outward)',f:'Imagine headlights on your hipbones — both pointing straight down throughout. Free leg tracks directly behind, not out to side.'},{m:'Rounding back to reach floor',f:'Don\'t chase depth. Stop where spine rounds. Hamstring flexibility will improve over time.'},{m:'Knee of standing leg locking out',f:'Maintain soft knee bend (~15°) throughout. Never fully lock out standing leg.'}],why:'Multi-system exercise: hamstring strength + glute med stabilization + ankle proprioception + anti-rotation core — all in one movement. Multi-benefit compound movement. Contralateral loading maximizes glute med demand on stance leg.',benefits:['glute_med_activation','ankle_instability','anterior_pelvic_tilt'],subs:['HM-01','GL-05'],movementPattern:'hip_hinge',primaryMuscleGroup:'hamstrings',secondaryMuscleGroups:['glutes','back'],mechanic:'compound',exerciseTier:'foundation',sfrRating:2,repRanges:{strength:{min:3,max:6,rest:180},hypertrophy:{min:8,max:12,rest:120},endurance:{min:15,max:20,rest:60}},recoveryImpact:{hamstrings:0.8,glutes:0.4,back:0.4},progressionIds:[],regressionIds:['HM-01']},
 {id:'HM-06',name:'Band Hamstring Curl (Prone)',category:'hamstrings',subcategory:'knee_flexion',muscles:{primary:{biceps_femoris:60,semitendinosus:65,semimembranosus:60},secondary:{gastrocnemius:20,gluteus_maximus:15}},equipment:['resistance_bands'],location:{gym:true,home:true,work:true},tier:1,phase:{acute:{s:'suitable',p:3,n:'HOME and WORK alternative when no leg curl machine available. Light band. Maintain core brace to avoid lumbar extension.'},subacute:{s:'suitable',p:2,n:'Supplementary to machine curls. Travel-friendly.'},maintenance:{s:'suitable',p:1,n:'Maintenance option when traveling or between gym sessions.'}},sets:3,reps:'15-20',rest:45,tempo:'1-1-2-0',cues:['Anchor band to low point (door anchor, rack base, heavy furniture). Loop around ankles. Lie face down.','Brace core, posteriorly tilt pelvis to flatten lower back. Maintain throughout.','Curl both heels toward glutes against band resistance. Squeeze at top.','Slowly return (2-sec eccentric). Full extension at bottom.','Higher reps (15-20) compensate for lower resistance. Focus on contraction quality.'],mistakes:[{m:'Band slipping off ankles',f:'Secure loop around ankle bones, not over shoes. Consider ankle strap attachment.'},{m:'Lumbar extension during curl',f:'If back arches, pause and re-brace. Consider supine floor slider curl (HM-04) instead.'}],why:'Zero-machine hamstring curl option. Available in all locations including work. Better than nothing principle — even light band curls maintain hamstring activation on non-gym days. Prone position requires the same anti-extension vigilance as lying leg curl (HM-03) to prevent compensatory patterns.',benefits:[],subs:['HM-02','HM-04'],movementPattern:'isolation_lower',primaryMuscleGroup:'hamstrings',secondaryMuscleGroups:[],mechanic:'isolation',exerciseTier:'assistance',sfrRating:4,repRanges:{strength:{min:6,max:10,rest:120},hypertrophy:{min:10,max:15,rest:90},endurance:{min:15,max:25,rest:45}},recoveryImpact:{hamstrings:0.5},progressionIds:['HM-02'],regressionIds:[]},
 {id:'GL-01',name:'Barbell Hip Thrust',category:'glutes',subcategory:'hip_extension',muscles:{primary:{gluteus_maximus:95,gluteus_medius:35},secondary:{biceps_femoris:40,semitendinosus:35,vastus_lateralis:20,rectus_abdominis:25,erector_spinae:20}},equipment:['barbell','bench_flat','weight_plate','hip_thrust_bench'],location:{gym:true,home:false,work:false},tier:3,phase:{acute:{s:'caution',p:2,n:'Start with bodyweight glute bridge (GL-02) first. If 3×15 glute bridge at RPE 7 achieved, introduce barbell hip thrust with light weight. Pad essential. Monitor for lumbar hyperextension at lockout.'},subacute:{s:'suitable',p:5,n:'Primary glute builder. Progressive loading. Band around knees for glute med co-activation. RPE 7-8.'},maintenance:{s:'suitable',p:5,n:'Heavy loading. Paused and banded variants. Single-leg progression.'}},sets:3,reps:'8-12',rest:90,tempo:'2-2-1-0',cues:['Sit on floor with upper back (bottom of shoulder blades) against bench edge. Roll barbell over hips with pad.','Feet flat, hip-width, roughly under knees at lockout. Slight toe-out (15-20°). Heels are the primary drive point.','BEFORE lifting: posteriorly tilt pelvis — tuck tailbone under, flatten lower back. Maintain this throughout.','Drive through heels, squeeze glutes to full hip extension. At top, shins should be vertical. Hold 2 seconds — HARD glute squeeze.','Chin should tuck toward chest at lockout (prevents cervical extension). Gaze follows — look at barbell at top, not ceiling.'],mistakes:[{m:'Lumbar hyperextension at lockout',f:'Think \'belt buckle to chin\' at lockout. If ribs flare, weight too heavy. Posterior tilt is the cue that matters most.'},{m:'Pushing through toes instead of heels',f:'Wiggle toes at top to confirm — if you can\'t, weight is in toes. Actively think \'drive heels through floor.\''},{m:'Feet too far out (hamstring cramping)',f:'Shins vertical at lockout. Feet too far = hamstring dominance. Feet too close = quad dominance. Adjust until you feel glutes working.'},{m:'Neck hyperextension (looking at ceiling)',f:'Chin tucked. Gaze travels with hips — look at barbell at lockout, look forward at bottom.'}],why:'Highest glute max activator in research. Horizontal force vector = no axial spinal loading (protects lumbar discs). Lockout position is pure hip extension with posterior tilt bias — promotes posterior pelvic control. Banded variant simultaneously trains weak glute medius.',benefits:['glute_med_activation','anterior_pelvic_tilt'],subs:['GL-02','GL-05'],movementPattern:'hip_hinge',primaryMuscleGroup:'glutes',secondaryMuscleGroups:['hamstrings'],mechanic:'compound',exerciseTier:'foundation',sfrRating:2,repRanges:{strength:{min:3,max:6,rest:180},hypertrophy:{min:8,max:12,rest:120},endurance:{min:15,max:20,rest:60}},recoveryImpact:{glutes:0.8,hamstrings:0.4},progressionIds:[],regressionIds:['GL-02','GL-08']},
 {id:'GL-02',name:'Glute Bridge',category:'glutes',subcategory:'hip_extension',muscles:{primary:{gluteus_maximus:80,gluteus_medius:30},secondary:{biceps_femoris:35,semitendinosus:30,rectus_abdominis:20,erector_spinae:15}},equipment:['bodyweight'],location:{gym:true,home:true,work:true},tier:1,phase:{acute:{s:'suitable',p:5,n:'FOUNDATIONAL exercise. Start bodyweight. Master posterior tilt at lockout before any progression. Daily practice is fine — low CNS demand.'},subacute:{s:'suitable',p:3,n:'Add DB on hips. Progress to single-leg. Band around knees.'},maintenance:{s:'suitable',p:2,n:'Warm-up before hip thrusts. Single-leg as activation drill.'}},sets:3,reps:'12-15',rest:60,tempo:'2-2-1-0',cues:['Lie on back, knees bent ~90°, feet flat hip-width apart, arms at sides palms down.','Press lower back INTO floor — posterior pelvic tilt. This is home base.','Drive through heels, squeeze glutes, lift hips until body forms straight line from shoulders to knees. NOT higher — no arching.','Hold top 2 seconds. HARD glute squeeze. You should feel glutes, not lower back.',`Lower slowly (2 sec). Touch down briefly, then repeat. Don't rest on floor between reps.`],mistakes:[{m:'Arching past neutral at top',f:'Stop at straight line. \'Belt buckle to chin.\' If you feel it in low back, you\'ve gone too far.'},{m:'Hamstring cramping',f:'Move feet slightly closer. Pre-activate with clamshells (GL-04). Contract glutes FIRST, then lift.'},{m:'Knees falling inward',f:'Band around knees. Push knees out gently as you bridge. Don\'t let knees cave.'}],why:'Zero-equipment glute activation drill. Teaches posterior tilt under load — promotes posterior pelvic control. Zero spinal compression (protects the lower back). Can be done daily. Foundational pattern for hip thrust. Banded variant simultaneously activates the glute medius.',benefits:['glute_med_activation','anterior_pelvic_tilt','anti_extension_core'],subs:['GL-01','GL-05'],movementPattern:'hip_hinge',primaryMuscleGroup:'glutes',secondaryMuscleGroups:['hamstrings'],mechanic:'compound',exerciseTier:'supplemental',sfrRating:3,repRanges:{strength:{min:3,max:6,rest:180},hypertrophy:{min:8,max:12,rest:120},endurance:{min:15,max:20,rest:60}},recoveryImpact:{glutes:0.8,hamstrings:0.4},progressionIds:['GL-01','HM-04','GL-05','GL-07','GL-08'],regressionIds:[]},
 {id:'GL-03',name:'Side-Lying Hip Abduction',category:'glutes',subcategory:'hip_abduction',muscles:{primary:{gluteus_medius:85,gluteus_minimus:70},secondary:{tfl:25,external_obliques:15}},equipment:['bodyweight'],location:{gym:true,home:true,work:true},tier:1,phase:{acute:{s:'suitable',p:5,n:'Excellent glute medius exercise. Can be included in every session. Bodyweight first. Slow, controlled, high reps.'},subacute:{s:'suitable',p:5,n:'Add ankle weight (2-5 lbs). Maintain high reps. Progress to standing cable abduction.'},maintenance:{s:'suitable',p:4,n:'Warm-up activation drill. Cable or machine for loading.'}},sets:3,reps:'15-20',rest:45,tempo:'2-2-2-0',cues:['Lie on side, bottom arm under head, hips stacked vertically. Slight forward body tilt (~10°).','Top leg SLIGHTLY behind body plane (5-10° hip extension). This is critical — biases posterior glute med fibers over TFL.','Rotate top foot slightly inward (toes pointing 15° down). This further reduces TFL contribution.','Lift top leg ~30-40° — no higher. Controlled 2-sec lift. Hold at top 2 seconds. 2-sec lower.','Should feel burn deep in side of hip (glute med), NOT in front of hip (TFL). If you feel front of hip, adjust position.'],mistakes:[{m:'Hip rolling backward during lift',f:'Place hand on front of hip — if you feel it flex, you\'re rolling. Keep hips stacked. Slight forward tilt of body helps.'},{m:'Lifting too high (>45°)',f:'Less is more. Think \'controlled small range\' not \'kick high.\''},{m:'Leg drifting forward during lift',f:'Keep leg slightly behind body throughout. Imagine someone is pulling your heel backward.'},{m:'Using momentum/swinging',f:'Pause at top and bottom. If you can\'t hold 2 sec at top, slow down.'}],why:'Directly targets the primary dysfunction — weak glute medius with compensatory TFL compensation causing dynamic valgus. Side-lying position eliminates compensatory strategies. Extension + internal rotation cues preferentially recruit glute med over TFL. Can be included in every session.',benefits:['glute_med_activation'],subs:['GL-04','GL-06'],movementPattern:'isolation_lower',primaryMuscleGroup:'glutes',secondaryMuscleGroups:[],mechanic:'isolation',exerciseTier:'assistance',sfrRating:3,repRanges:{strength:{min:6,max:10,rest:120},hypertrophy:{min:10,max:15,rest:90},endurance:{min:15,max:25,rest:45}},recoveryImpact:{glutes:0.5},progressionIds:['GL-06','GL-07'],regressionIds:['GL-04','GL-06']},
 {id:'GL-04',name:'Clamshell',category:'glutes',subcategory:'hip_external_rotation',muscles:{primary:{gluteus_medius:75,gluteus_minimus:55},secondary:{piriformis:40,obturator_internus:30,gluteus_maximus:20}},equipment:['bodyweight','resistance_bands'],location:{gym:true,home:true,work:true},tier:1,phase:{acute:{s:'suitable',p:5,n:'Essential activation drill. Perform before any lower body compound. Start bodyweight, progress to banded. Teaches glute med to fire before TFL.'},subacute:{s:'suitable',p:4,n:'Banded. Warm-up activation.'},maintenance:{s:'suitable',p:3,n:'Warm-up only. Standing cable abduction replaces as primary.'}},sets:2,reps:'15-20',rest:30,tempo:'1-2-1-0',cues:['Side-lying, hips and knees both bent ~45°. Feet together, stacked. Head resting on bottom arm.','Keep feet together as a hinge point. Open top knee like a clamshell — pure external rotation at hip.','Open to ~45° or until you feel pelvis wanting to roll backward — STOP before that happens.','Hold open position 2 seconds. Feel the burn deep in side/back of hip.',`Close slowly (1 sec). Don't let gravity slam the knee down.`],mistakes:[{m:'Pelvis rolling backward',f:'Place back against wall. If back lifts off wall during rotation, ROM is too much.'},{m:'Going too fast',f:'2-second hold at top. Think activation, not reps.'},{m:'Only feeling it in front of hip',f:'Scoot feet slightly behind body. Reduce ROM. Focus on squeezing back of hip.'}],why:'External rotation component targets deep rotators alongside glute med. Easier to isolate than side-lying abduction — excellent starting point when glute med is very weak. Low CNS demand allows daily use.',benefits:['glute_med_activation'],subs:['GL-03','GL-06'],movementPattern:'isolation_lower',primaryMuscleGroup:'glutes',secondaryMuscleGroups:[],mechanic:'isolation',exerciseTier:'assistance',sfrRating:4,repRanges:{strength:{min:6,max:10,rest:120},hypertrophy:{min:10,max:15,rest:90},endurance:{min:15,max:25,rest:45}},recoveryImpact:{glutes:0.5},progressionIds:['GL-03','GL-06'],regressionIds:[]},
 {id:'GL-05',name:'Cable Pull-Through',category:'glutes',subcategory:'hip_hinge',muscles:{primary:{gluteus_maximus:80,biceps_femoris:55,semitendinosus:45},secondary:{erector_spinae:30,rectus_abdominis:20,semimembranosus:40}},equipment:['cable_machine','cable_rope'],location:{gym:true,home:false,work:false},tier:2,phase:{acute:{s:'suitable',p:4,n:'Excellent hip hinge teacher. Cable direction provides constant feedback — if you lose position, cable pulls you backward. Safer than any barbell hip hinge. Light to moderate weight.'},subacute:{s:'suitable',p:4,n:'Progressive loading. Add pause at top for glute squeeze emphasis.'},maintenance:{s:'suitable',p:3,n:'Warm-up or burnout after heavy hip thrust/RDL work.'}},sets:3,reps:'12-15',rest:75,tempo:'2-1-2-0',cues:['Set cable at lowest position. Rope attachment. Face AWAY from machine, straddle cable, walk out 2-3 steps.','Feet slightly wider than hip-width, slight toe-out. Hold rope between legs with both hands.','Hinge at hips — push butt BACK toward cable stack. Slight knee bend (15-20°). Feel stretch in hamstrings and glutes. Keep chest up, neutral spine.','Drive hips FORWARD by squeezing glutes HARD. Stand tall. Posterior pelvic tilt at lockout — squeeze glutes, tuck pelvis.',`Arms are just hooks — don't pull with arms. The movement is entirely at the hip joint.`],mistakes:[{m:'Squatting instead of hinging',f:'Shins should stay nearly vertical. Push butt BACK, not DOWN. Imagine closing a car door with your butt.'},{m:'Rounding lower back',f:'Chest up, slight arch in upper back. If back rounds, hinge is too deep — reduce ROM.'},{m:'Hyperextending at lockout',f:'Finish with posterior pelvic tilt. Think about tucking tailbone UNDER at the top.'},{m:'Pulling with arms',f:'Locked elbows, relaxed arms. Arms are ropes connecting hips to cable.'}],why:'Safest hip hinge pattern — cable direction provides self-correcting feedback. Zero axial spinal loading (protects the lower back). Teaches posterior tilt at lockout — promotes posterior pelvic control. Bridges the gap between glute bridge and barbell hip hinge movements.',benefits:['anterior_pelvic_tilt','glute_med_activation'],subs:['GL-01','HM-01'],movementPattern:'hip_hinge',primaryMuscleGroup:'glutes',secondaryMuscleGroups:['hamstrings'],mechanic:'compound',exerciseTier:'foundation',sfrRating:4,repRanges:{strength:{min:3,max:6,rest:180},hypertrophy:{min:8,max:12,rest:120},endurance:{min:15,max:20,rest:60}},recoveryImpact:{glutes:0.8,hamstrings:0.4},progressionIds:['HM-01'],regressionIds:['GL-02']},
 {id:'GL-06',name:'Banded Lateral Walk',category:'glutes',subcategory:'hip_abduction',muscles:{primary:{gluteus_medius:80,gluteus_minimus:60},secondary:{tfl:30,vastus_lateralis:20,gluteus_maximus:25}},equipment:['resistance_bands'],location:{gym:true,home:true,work:true},tier:1,phase:{acute:{s:'suitable',p:5,n:'Band ABOVE KNEES initially. Essential glute med functional drill. 2-3 sets of 10-15 steps each direction.'},subacute:{s:'suitable',p:4,n:'Progress band to ankles if ankle stability improved. Heavier band resistance.'},maintenance:{s:'suitable',p:3,n:'Warm-up activation drill before leg day.'}},sets:3,reps:'12-15 steps each direction',rest:45,tempo:'controlled',cues:['Band above knees (acute phase) or around ankles (subacute+). Feet hip-width, slight squat position (quarter squat), chest up.',`Step laterally with lead foot — push OUT against band. Don't let trailing foot snap in — control it.`,'Maintain constant tension on band — feet never come fully together. Always some outward pressure.',`Stay LOW in quarter squat throughout. Don't bob up and down. Hips stay level — no hip drop.`,'Complete all steps in one direction before reversing. Equal reps each way.'],mistakes:[{m:'Feet snapping together',f:'Trail foot SLOWLY follows. Maintain band tension even at narrowest point.'},{m:'Upper body swaying side to side',f:'Hands on hips, torso stays centered. Think \'hips move laterally, shoulders don\'t.\''},{m:'Standing too tall',f:'Quarter-squat depth. Knees tracking over toes (not caving inward).'},{m:'Band around ankles too early',f:'Start above knees. Progress to ankles only when single-leg balance hits 45+ seconds.'}],why:'Functional glute med training in standing position. Directly mimics demands of walking/stairs where hip stability matters. Band provides external cue to push against. Can be done anywhere with a $5 band.',benefits:['glute_med_activation'],subs:['GL-03','GL-04'],movementPattern:'isolation_lower',primaryMuscleGroup:'glutes',secondaryMuscleGroups:[],mechanic:'isolation',exerciseTier:'assistance',sfrRating:4,repRanges:{strength:{min:6,max:10,rest:120},hypertrophy:{min:10,max:15,rest:90},endurance:{min:15,max:25,rest:45}},recoveryImpact:{glutes:0.5},progressionIds:['GL-03'],regressionIds:['GL-04','GL-03']},
 {id:'GL-07',name:'Step-Up (Low Platform)',category:'glutes',subcategory:'single_leg_compound',muscles:{primary:{gluteus_maximus:70,gluteus_medius:65,vastus_medialis:60,vastus_lateralis:55},secondary:{rectus_femoris:40,biceps_femoris:30,gastrocnemius:20,soleus:15}},equipment:['weight_plate','bodyweight'],location:{gym:true,home:true,work:false},tier:2,phase:{acute:{s:'caution',p:3,n:'4-6 inch platform ONLY. Bodyweight first. Monitor for knee valgus (dynamic valgus is a known dysfunction). If valgus occurs, regress to side-lying abduction until glute med stronger.'},subacute:{s:'suitable',p:4,n:'6-8 inch platform. Light DBs. Peterson variant for VMO.'},maintenance:{s:'suitable',p:4,n:'Up to 8 inch maximum. Moderate loading. Full control.'}},sets:3,reps:'10-12 each side',rest:75,tempo:'2-1-2-0',cues:['Place ENTIRE foot on low platform (4-6 inches). Not just toes — full foot contact to distribute load.','Lean torso slightly forward (~15°) to bias glutes over quads.',`Drive through the HEEL of the working leg. Push the platform DOWN, don't pull yourself UP.`,'Watch your knee — it MUST track over your 2nd-3rd toe. No inward collapse. This is THE test.',`Lower yourself slowly (2 sec) by sitting back. Trailing foot taps floor gently, don't crash down.`],mistakes:[{m:'Knee valgus (knee caving inward)',f:'STOP exercise if valgus visible. Regress to clamshells and side-lying abduction. Return to step-ups when glute med can prevent valgus.'},{m:'Pushing off trailing leg',f:'Trail leg should be completely passive. Touch floor for balance only, don\'t push.'},{m:'Platform too high (>8")',f:'Never exceed 8 inches. 4-6 inches is beneficial range for acute phase.'},{m:'Weight shifting to forefoot at top',f:'Drive through heel. Full foot contact. If ball of foot burns, adjust.'}],why:'Tests and builds glute med function (can it prevent valgus?) and trains it. Single-leg work addresses L/R asymmetry. Low platform respects knee joint limitations. Peterson variant targets VMO specifically.',benefits:['glute_med_activation','ankle_instability'],subs:['QD-05','QD-01'],movementPattern:'lunge',primaryMuscleGroup:'glutes',secondaryMuscleGroups:['quads'],mechanic:'compound',exerciseTier:'supplemental',sfrRating:2,repRanges:{strength:{min:3,max:6,rest:180},hypertrophy:{min:8,max:12,rest:120},endurance:{min:15,max:20,rest:60}},recoveryImpact:{glutes:0.8,quads:0.4},progressionIds:['QD-05'],regressionIds:['GL-02','GL-03','QD-04']},
 {id:'GL-08',name:'Half-Kneeling Cable Hip Extension',category:'glutes',subcategory:'hip_extension',muscles:{primary:{gluteus_maximus:75,gluteus_medius:45},secondary:{biceps_femoris:30,rectus_abdominis:25,iliopsoas:-10}},equipment:['cable_machine'],location:{gym:true,home:false,work:false},tier:2,phase:{acute:{s:'suitable',p:4,n:'DOUBLE BENEFIT: trains glute of front leg while stretching hip flexor of rear leg. Half-kneeling is inherently anti-extension. Light cable.'},subacute:{s:'suitable',p:4,n:'Moderate loading. Focus on posterior tilt throughout.'},maintenance:{s:'suitable',p:3,n:'Supplemental to hip thrust work.'}},sets:3,reps:'10-12 each side',rest:60,tempo:'2-2-1-0',cues:['Half-kneeling facing away from cable. Cable attached at ankle of front (working) leg. Rear knee on pad.',`Before starting: posteriorly tilt pelvis. You should feel a stretch in the rear leg's hip flexor. MAINTAIN this tilt throughout.`,'From this position, drive front foot into ground and extend hip against cable resistance. Squeeze glute at end range.','Hold 2 seconds at full extension. The glute should be maximally contracted, pelvis still posteriorly tilted.',`Return slowly. Don't let cable yank leg forward. Core stays braced.`],mistakes:[{m:'Losing posterior tilt',f:'\'Belt buckle to chin\' throughout. If tilt is lost, weight is too heavy.'},{m:'Leaning backward to compensate',f:'Torso stays vertical. Movement is ONLY at the hip joint of the front leg.'},{m:'Rushing reps',f:'Minimum 2-sec hold at extension. This is a mobility exercise that doubles as a strength exercise.'}],why:'Dual beneficial mechanism: (1) trains glute extension of working leg, (2) stretches hip flexor of kneeling leg. Half-kneeling position forces posterior tilt and anti-extension core engagement. Addresses both glute activation and hip flexor tightness.',benefits:['anterior_pelvic_tilt','glute_med_activation','anti_extension_core'],subs:['GL-05','GL-02'],movementPattern:'hip_hinge',primaryMuscleGroup:'glutes',secondaryMuscleGroups:['hamstrings'],mechanic:'compound',exerciseTier:'foundation',sfrRating:4,repRanges:{strength:{min:3,max:6,rest:180},hypertrophy:{min:8,max:12,rest:120},endurance:{min:15,max:20,rest:60}},recoveryImpact:{glutes:0.8,hamstrings:0.4},progressionIds:['GL-01'],regressionIds:['GL-02']},
 {id:'GL-09',name:'Side-Lying Hip Adduction',category:'glutes',subcategory:'hip_adduction',muscles:{primary:{hip_adductors:85},secondary:{vastus_medialis:20,gluteus_medius:10}},equipment:['bodyweight'],location:{gym:true,home:true,work:true},tier:1,phase:{acute:{s:'suitable',p:4,n:'Foundational adductor activation. Bodyweight. Start here — zero risk, teaches adductor contraction. Pairs well with side-lying abduction (GL-03) in same position.'},subacute:{s:'suitable',p:3,n:'Add ankle weight. Higher reps. Supplementary to compound work.'},maintenance:{s:'suitable',p:2,n:'Warm-up only. Machine or cable replaces for loading.'}},sets:2,reps:'15-20',rest:30,tempo:'2-1-2-0',cues:['Lie on side. Top leg bent with foot on floor in front of you (or resting on a bench/step for more ROM).','Bottom leg is the working leg — extended straight, slight external rotation (heel leads, toes slightly back).','Lift bottom leg toward ceiling against gravity. Pure adduction — only inner thigh moves.',`Hold at top 1 second. Squeeze inner thigh. Lower slowly (2 sec). Don't let it crash down.`,'Superset with side-lying abduction (GL-03) — same position, flip which leg works. Efficient use of time.'],mistakes:[{m:'Rolling hips backward',f:'Hips stacked vertically. Hand on hip to monitor. If hip rolls, reduce ROM.'},{m:'Lifting too high',f:'Moderate lift — feel inner thigh, not hip flexor.'},{m:'Rushing through reps',f:'Controlled tempo. Pause at top. 15-20 reps minimum.'}],why:'Entry-level adductor activation. Adductors co-stabilize the pelvis with glute med — weak adductors compound the existing pelvic instability. Zero equipment, pairs naturally with side-lying abduction in the same session. Teaches mind-muscle connection in inner thigh.',benefits:['glute_med_activation'],subs:['GL-10','GL-11'],movementPattern:'isolation_lower',primaryMuscleGroup:'glutes',secondaryMuscleGroups:[],mechanic:'isolation',exerciseTier:'assistance',sfrRating:3,repRanges:{strength:{min:6,max:10,rest:120},hypertrophy:{min:10,max:15,rest:90},endurance:{min:15,max:25,rest:45}},recoveryImpact:{glutes:0.5},progressionIds:['GL-10','GL-11','GL-12'],regressionIds:[]},
 {id:'GL-10',name:'Cable Hip Adduction',category:'glutes',subcategory:'hip_adduction',muscles:{primary:{hip_adductors:85},secondary:{vastus_medialis:15,rectus_abdominis:20,external_obliques:20}},equipment:['cable_machine'],location:{gym:true,home:false,work:false},tier:2,phase:{acute:{s:'caution',p:2,n:'Standing single-leg balance is the limiting factor, not the adduction itself. Only if single-leg balance ≥30 sec. Hold rack with free hand for support. Light cable.'},subacute:{s:'suitable',p:4,n:'Freestanding. Moderate cable. Both training adductors AND challenging ankle/hip stability.'},maintenance:{s:'suitable',p:4,n:'Heavier loading. Full freestanding. Both directions in one set.'}},sets:3,reps:'12-15 each side',rest:60,tempo:'2-1-2-0',cues:['Cable at lowest position. Ankle strap on working leg (leg closest to cable). Stand sideways to machine.','Stance leg is the leg AWAY from cable. Slight knee bend on stance leg. Hold rack or machine frame for balance (acute/subacute).','Pull working leg across body (past midline) against cable resistance. Keep leg mostly straight, slight knee bend.','Controlled squeeze at end range 1 second. Feel inner thigh of working leg contract.',`Return slowly (2 sec). Don't let cable snap leg back. Notice: your STANCE leg is also working hard to stabilize — this is a 2-for-1 exercise.`],mistakes:[{m:'Leaning away from cable to cheat ROM',f:'Torso stays vertical. If you need to lean, weight is too heavy.'},{m:'Swinging/momentum',f:'Smooth, controlled arc. 2 seconds each way. If you can\'t control it, reduce weight.'},{m:'Stance leg knee caving',f:'Actively push stance knee out. If valgus persists, continue prioritizing glute med work.'},{m:'Hip hiking (lifting hip of working leg)',f:'Hips stay level throughout. Working leg moves, pelvis doesn\'t.'}],why:'Dual training effect: adductor strengthening on working leg PLUS glute med/ankle stabilization challenge on stance leg. Standing single-leg position is functional — mimics demands of walking and stair climbing. Cable provides constant tension through full ROM.',benefits:['glute_med_activation','ankle_instability'],subs:['GL-11','GL-09'],movementPattern:'isolation_lower',primaryMuscleGroup:'glutes',secondaryMuscleGroups:[],mechanic:'isolation',exerciseTier:'assistance',sfrRating:5,repRanges:{strength:{min:6,max:10,rest:120},hypertrophy:{min:10,max:15,rest:90},endurance:{min:15,max:25,rest:45}},recoveryImpact:{glutes:0.5},progressionIds:[],regressionIds:['GL-09']},
 {id:'GL-11',name:'Adductor Machine',category:'glutes',subcategory:'hip_adduction',muscles:{primary:{hip_adductors:90},secondary:{vastus_medialis:15}},equipment:['cable_machine'],location:{gym:true,home:false,work:false},tier:1,phase:{acute:{s:'suitable',p:4,n:'Machine controls everything — zero balance demand, zero spinal load. Pure adductor isolation. Start with moderate ROM setting. Light to moderate weight. Safe from day one.'},subacute:{s:'suitable',p:4,n:'Progressive loading. Full ROM. Can go heavy.'},maintenance:{s:'suitable',p:4,n:'Heavy isolation. Drop sets for finisher.'}},sets:3,reps:'12-15',rest:60,tempo:'2-1-2-0',cues:['Adjust starting width to a comfortable stretch — not maximum. Increase over sessions as flexibility improves.','Sit with back against pad. Knees against pads. Hands on handles lightly.','Squeeze legs together against pads. Focus on inner thigh contraction, not pushing with hands.',`Hold squeezed position 1 second. Then slowly release (2 sec) — DON'T let pads snap open.`,'The eccentric (opening) is where groin strains happen — always control the return.'],mistakes:[{m:'Starting too wide',f:'Start conservative. If you feel a sharp stretch, the ROM is too wide. Narrow it.'},{m:'Letting pads snap open',f:'2-second controlled return. Every rep. Highly recommended.'},{m:'Rounding forward to generate force',f:'Stay upright against backrest. If you need to lean forward, weight is too heavy.'}],why:'Highest safe loading for adductors. Machine eliminates all compensation — pure isolation. Zero balance demand means it can be loaded heavily from early in the program. Adductors co-stabilize the pelvis with glute med — weak adductors compound the weak glute medius and contribute to the dynamic valgus and lateral hip instabilitys.',benefits:[],subs:['GL-10','GL-09'],movementPattern:'isolation_lower',primaryMuscleGroup:'glutes',secondaryMuscleGroups:[],mechanic:'isolation',exerciseTier:'assistance',sfrRating:5,repRanges:{strength:{min:6,max:10,rest:120},hypertrophy:{min:10,max:15,rest:90},endurance:{min:15,max:25,rest:45}},recoveryImpact:{glutes:0.5},progressionIds:[],regressionIds:['GL-09']},
 {id:'GL-12',name:'Copenhagen Side Plank (Regression)',category:'glutes',subcategory:'hip_adduction',muscles:{primary:{hip_adductors:80,external_obliques:65,internal_obliques:60},secondary:{gluteus_medius:45,rectus_abdominis:40,transverse_abdominis:35}},equipment:['bench_flat','bodyweight'],location:{gym:true,home:true,work:false},tier:3,phase:{acute:{s:'caution',p:2,n:'Full Copenhagen is advanced. Use KNEE REGRESSION only — top leg\'s inner knee on bench, bottom leg free. Short holds (10-15 sec). Builds adductor + oblique synergy. NOTE: this is a side plank variant, NOT a standard plank (standard planks can reinforce poor posture — but side planks are acceptable because they train LATERAL stability, not anti-extension).'},subacute:{s:'suitable',p:4,n:'Progress from knee to ankle. Dynamic reps (lower and lift hips). 15-20 sec holds or 8-10 reps.'},maintenance:{s:'suitable',p:4,n:'Full Copenhagen with ankle on bench. Weighted or longer holds.'}},sets:2,reps:'10-15 sec holds × 3 each side (or 8-10 dynamic reps)',rest:45,tempo:'hold or 2-1-2-0 dynamic',cues:[`REGRESSION: Lie on side, elbow under shoulder. Top leg's INNER KNEE rests on bench (not ankle). Bottom leg hangs free.`,'Lift hips off ground by pushing inner knee into bench and engaging obliques. Body forms a straight line.','Hold this position — feel adductors of top leg and obliques of bottom side firing together.','For dynamic version: lower hips to floor, then lift back up. Each lift = 1 rep.',`KEY DIFFERENCE from standard plank: side plank trains LATERAL core, not anti-extension. Safe because it doesn't load the sagittal plane.`],mistakes:[{m:'Hips rotating forward or backward',f:'Hips stacked. Belly button points forward throughout. Film yourself from behind to check.'},{m:'Shoulder elevation (shrugging supporting arm)',f:'Actively DEPRESS the supporting shoulder. Push floor away with elbow. Shoulder blade slides down.'},{m:'Starting with full Copenhagen (ankle on bench)',f:'ALWAYS start with knee on bench regression. Progress to ankle only when knee version is 3×15 sec holds easily.'},{m:'Holding breath',f:'Breathe normally. Count breaths to maintain rhythm.'}],why:'Only exercise that trains adductors AND lateral core (obliques) simultaneously. Research shows strong groin injury prevention effect. Side plank position is safe — unlike standard planks, side planks train LATERAL stability. Builds the adductor-oblique sling that stabilizes the pelvis in the frontal plane — beneficial for the lateral hip instability from weak glute medius.',benefits:['glute_med_activation','anterior_pelvic_tilt'],subs:['GL-09','GL-11'],movementPattern:'isolation_lower',primaryMuscleGroup:'glutes',secondaryMuscleGroups:[],mechanic:'isolation',exerciseTier:'assistance',sfrRating:3,repRanges:{strength:{min:6,max:10,rest:120},hypertrophy:{min:10,max:15,rest:90},endurance:{min:15,max:25,rest:45}},recoveryImpact:{glutes:0.5},progressionIds:[],regressionIds:['GL-09']},
 {id:'CV-01',name:'Seated Calf Raise',category:'calves',subcategory:'plantar_flexion',muscles:{primary:{soleus:90,gastrocnemius:25},secondary:{tibialis_posterior:20,peroneus_longus:15}},equipment:['calf_raise_machine'],location:{gym:true,home:false,work:false},tier:1,phase:{acute:{s:'suitable',p:5,n:'A joint-friendly calf exercise. Seated position eliminates forefoot load under bodyweight. Knee bent reduces gastrocnemius contribution. Light weight, slow tempo, moderate range. Avoid aggressive forefoot load — stop short of maximum plantar flexion if metatarsal pain occurs.'},subacute:{s:'suitable',p:4,n:'Progressive loading. Full ROM (deep stretch at bottom, full contraction at top). Higher reps (15-20).'},maintenance:{s:'suitable',p:4,n:'Heavy loading. Paired with standing calf raise for complete development.'}},sets:3,reps:'15-20',rest:45,tempo:'2-2-3-0',cues:['Sit in machine. Pad on lower thighs just above knees. Balls of feet on platform edge, heels hanging off.','Toes pointing straight or slight outward turn. Feet hip-width.','Lower heels slowly (3-second descent) into a deep stretch. Feel the soleus lengthen. Go as deep as comfortable.','Drive up by pushing through balls of feet. Full plantar flexion — rise as high as possible. Hold peak 2 seconds.','Calves are endurance muscles — they respond to VOLUME. 15-20 reps minimum. The burn is the stimulus.'],mistakes:[{m:'Bouncing at bottom',f:'3-second descent into full stretch. No bounce. Pause at bottom for 1 second if possible.'},{m:'Partial ROM (not going deep enough)',f:'Full ROM: deep stretch at bottom, full squeeze at top. If machine limits stretch, add a platform to stand on.'},{m:'Going too heavy with short ROM',f:'Drop weight 50%. Full ROM, slow tempo. If you can\'t pause at top for 2 sec, too heavy.'},{m:'Pain at metatarsal heads',f:'Reduce weight. Widen foot placement on platform so pressure is across full ball of foot, not concentrated. If pain persists, switch to eccentric-only or toe raises standing.'}],why:'Seated position removes bodyweight from the forefoot — reduces forefoot loading. Soleus isolation (gastrocnemius slack when knee is bent). Soleus is the postural calf muscle, beneficial for forward weight distribution. Safest calf training option in acute phase.',benefits:['forefoot_overload'],subs:['CV-03'],movementPattern:'isolation_lower',primaryMuscleGroup:'calves',secondaryMuscleGroups:[],mechanic:'isolation',exerciseTier:'assistance',sfrRating:5,repRanges:{strength:{min:6,max:10,rest:120},hypertrophy:{min:10,max:15,rest:90},endurance:{min:15,max:25,rest:45}},recoveryImpact:{calves:0.5},progressionIds:['CV-02','CV-03'],regressionIds:[]},
 {id:'CV-02',name:'Standing Calf Raise',category:'calves',subcategory:'plantar_flexion',muscles:{primary:{gastrocnemius:85,soleus:50},secondary:{tibialis_posterior:20,peroneus_longus:20}},equipment:['calf_raise_machine','smith_machine'],location:{gym:true,home:false,work:false},tier:2,phase:{acute:{s:'caution',p:2,n:'Full bodyweight on forefoot is the concern. Standing calf raises concentrate load on metatarsal heads — which concentrates load on the forefoot. Delay until seated calf raise is well-tolerated and forefoot symptoms stable. Start LIGHT on machine.'},subacute:{s:'suitable',p:4,n:'Introduce if forefoot is asymptomatic with seated raise. Light machine weight initially. Monitor metatarsal symptoms. Full ROM — deep stretch, full contraction.'},maintenance:{s:'suitable',p:4,n:'Full loading. Both standing and seated for complete calf development.'}},sets:3,reps:'12-15',rest:60,tempo:'2-2-3-0',cues:['Machine or Smith machine. Pad on shoulders (machine) or bar on upper traps (Smith). Balls of feet on platform edge.','Feet hip-width, toes straight or slight out. Knees STRAIGHT but not hyperextended — soft lock.','Lower heels slowly (3 sec) into FULL stretch below platform. This is where gastrocnemius is maximally loaded.','Drive up through balls of feet to maximum plantar flexion. Hold peak squeeze 2 seconds.','Moderate reps (12-15). Gastrocnemius is more fast-twitch than soleus — responds to moderate reps and heavier load (compared to seated).'],mistakes:[{m:'Bending knees during movement',f:'Knees locked in slight soft extension throughout. Only ankle moves.'},{m:'Bouncing/using momentum',f:'3-sec descent, 2-sec hold at top. If you can\'t control the tempo, reduce weight.'},{m:'Not going through full ROM',f:'Heels BELOW platform at bottom. Full rise at top. Calves need full ROM more than almost any other muscle.'},{m:'Forefoot pain during exercise',f:'Return to seated raises. Try wider foot placement. If pain persists, avoid standing calf raises and rely on seated + single-leg balance for calf development.'}],why:'Primary gastrocnemius builder. Straight knee maximizes gastrocnemius stretch-shortening. Needed for complete calf development (seated hits soleus, standing hits gastrocnemius). DELAYED introduction due to forefoot load concerns — only after seated raise is well-tolerated.',benefits:[],subs:['CV-01','CV-03'],movementPattern:'isolation_lower',primaryMuscleGroup:'calves',secondaryMuscleGroups:[],mechanic:'isolation',exerciseTier:'assistance',sfrRating:5,repRanges:{strength:{min:6,max:10,rest:120},hypertrophy:{min:10,max:15,rest:90},endurance:{min:15,max:25,rest:45}},recoveryImpact:{calves:0.5},progressionIds:['CV-03'],regressionIds:['CV-01']},
 {id:'CV-03',name:'Single-Leg Calf Raise (Bodyweight)',category:'calves',subcategory:'plantar_flexion',muscles:{primary:{gastrocnemius:75,soleus:60},secondary:{tibialis_anterior:20,peroneus_longus:25,tibialis_posterior:20}},equipment:['bodyweight'],location:{gym:true,home:true,work:true},tier:2,phase:{acute:{s:'caution',p:2,n:'Full bodyweight on one forefoot. Only introduce if seated calf raise well-tolerated AND single-leg balance ≥30 sec. Start on flat ground (not off an edge — less forefoot load at bottom). Hold wall for support.'},subacute:{s:'suitable',p:4,n:'Progress to off-edge (stair) for full ROM. Ankle stability should support this by now.'},maintenance:{s:'suitable',p:4,n:'Home and work maintenance. Add backpack weight for progression.'}},sets:3,reps:'10-15 each side',rest:45,tempo:'2-2-3-0',cues:['Stand on one leg near wall or rack for balance. Other foot slightly off ground (crossed behind ankle or knee bent).','Acute phase: flat ground (not off an edge). Subacute+: ball of foot on stair edge, heel hanging off.',`Rise up to full plantar flexion. Hold 2 seconds at top. Focus on BALANCE — don't sway.`,'Lower slowly (3 sec). On edge: go below horizontal for full stretch. On flat ground: just lower heel to floor.','Notice if one side is significantly weaker — this identifies calf L/R imbalances.'],mistakes:[{m:'Wobbling excessively',f:'Keep wall contact with fingertips. Progress to no support only when stable for full set.'},{m:'Rushing reps',f:'Slow tempo is non-negotiable. 2 up, 2 hold, 3 down. Every rep.'},{m:'Inversion/eversion during rise',f:'Watch foot: ankle should rise straight up without tilting. If tilting occurs, strengthen peroneals (band eversion exercise) before progressing.'}],why:'Dual purpose: calf strength + ankle proprioception training. Single-leg stance directly challenges the ankle stability deficit from recurrent sprains. Zero equipment needed. Identifies L/R asymmetry. Can be done anywhere.',benefits:['ankle_instability'],subs:['CV-01','CV-02'],movementPattern:'isolation_lower',primaryMuscleGroup:'calves',secondaryMuscleGroups:[],mechanic:'isolation',exerciseTier:'assistance',sfrRating:3,repRanges:{strength:{min:6,max:10,rest:120},hypertrophy:{min:10,max:15,rest:90},endurance:{min:15,max:25,rest:45}},recoveryImpact:{calves:0.5},progressionIds:[],regressionIds:['CV-01','CV-02']},
 {id:'CV-04',name:'Tibialis Raise',category:'calves',subcategory:'dorsiflexion',muscles:{primary:{tibialis_anterior:90},secondary:{peroneus_tertius:30,extensor_digitorum_longus:25}},equipment:['bodyweight'],location:{gym:true,home:true,work:true},tier:1,phase:{acute:{s:'suitable',p:4,n:'Often neglected but critical for ankle stability and forefoot protection. Strengthens the muscle that lifts the toes/foot — beneficial for ankle stability and gait mechanics. Bodyweight is sufficient challenge. Can be done sitting at work.'},subacute:{s:'suitable',p:3,n:'Progress reps. Standing variant off edge for full ROM.'},maintenance:{s:'suitable',p:3,n:'Maintenance. Continued ankle health.'}},sets:3,reps:'15-25',rest:30,tempo:'2-1-2-0',cues:['STANDING VERSION: Lean back against wall, feet ~12 inches from wall. Heels on floor. Arms relaxed.','Lift toes and balls of feet off floor toward shins. Pull ALL toes up. You should feel the front of your shin contract.','Hold peak contraction 1 second. Lower slowly (2 sec). Full ROM — toes touch floor gently before next rep.','SEATED VERSION: Sit in chair, heels on floor. Same motion — lift toes up, lower down. Can place weight on top of feet for resistance.','High reps (15-25). Tibialis anterior is endurance-oriented. Burn in the front of the shin is the target sensation.'],mistakes:[{m:'Using hip flexors to lift foot',f:'Only the ankle moves. Heel stays planted. If doing seated, knee doesn\'t move.'},{m:'Partial ROM',f:'Full toe lift at top, full toe contact at bottom. Through the entire available range.'}],why:'Addresses the overlooked antagonist to the calf. Weak tibialis anterior can contribute to poor ankle stability, poor foot control during gait, and shin splints. Training this muscle improves ankle stability — a common concern — from the opposite direction as calf training.',benefits:['ankle_instability','forefoot_overload'],subs:[],movementPattern:'isolation_lower',primaryMuscleGroup:'calves',secondaryMuscleGroups:[],mechanic:'isolation',exerciseTier:'assistance',sfrRating:3,repRanges:{strength:{min:6,max:10,rest:120},hypertrophy:{min:10,max:15,rest:90},endurance:{min:15,max:25,rest:45}},recoveryImpact:{calves:0.5},progressionIds:[],regressionIds:[]},
 {id:'CO-01',name:'Dead Bug (Bodyweight → Banded → Weighted)',category:'core',subcategory:'anti_extension',muscles:{primary:{transverse_abdominis:75,rectus_abdominis:60,internal_obliques:55},secondary:{external_obliques:40,iliopsoas:25,rectus_femoris:15}},equipment:['bodyweight','resistance_bands'],location:{gym:true,home:true,work:true},tier:1,phase:{acute:{s:'suitable',p:5,n:'Already included in daily mobility routine (RH-03). Foundation anti-extension exercise. Bodyweight first. Focus on maintaining lower back flush with floor throughout. If back arches at any point, ROM was too deep — reduce limb extension.'},subacute:{s:'suitable',p:5,n:'Add band around feet and hands. Increase tempo (3-sec extensions). Full contralateral extension if maintaining floor contact.'},maintenance:{s:'suitable',p:4,n:'Weighted (ankle weights, holding DB overhead). Band-resisted. Still a staple warm-up.'}},sets:2,reps:'8-10 each side',rest:45,tempo:'2-1-2-1',cues:['Lie on back. Arms to ceiling, knees at 90° (tabletop). Press LOWER BACK INTO FLOOR — this is the non-negotiable. Flatten any gap between lumbar spine and floor.','Slowly extend RIGHT arm overhead and LEFT leg straight out. Both hover 1-2 inches above floor at full extension. BREATHE OUT during extension.','The ONLY thing that matters: does your lower back stay pressed into the floor? If it peels up even slightly, you went too far. Reduce ROM.','Return to start. Repeat opposite side. 2-second extension, 1-second hold, 2-second return, 1-second reset.','PROGRESSION MARKER: When you can do 2×10 each side with full contralateral extension, zero back arch, zero breath holding → ready for banded progression and subacute core work.'],mistakes:[{m:'Lower back lifting off floor',f:'Reduce ROM. Extend limbs only 50% of the way. Over weeks, gradually increase range while maintaining floor contact. Quality over range.'},{m:'Holding breath',f:'Exhale DURING extension. Inhale on return. If you can\'t breathe while stabilizing, reduce the challenge.'},{m:'Moving too fast',f:'2-second extension minimum. Each rep should take 6+ seconds total.'},{m:'Neck straining / chin jutting',f:'Head rests on floor. Slight chin tuck. If neck tenses, you\'re trying too hard — regress.'}],why:'A foundational core stability exercise. Directly retrains the brain to resist lumbar extension under load — the exact movement pattern that\'s dysfunctional (posture and core stability). Supine position gives immediate tactile feedback (floor contact = success). Already in daily mobility routine. Phase transition marker built in.',benefits:['anterior_pelvic_tilt','anti_extension_core','back_protection'],subs:['CO-03'],movementPattern:'core_anti_extension',primaryMuscleGroup:'core',secondaryMuscleGroups:[],mechanic:'isolation',exerciseTier:'supplemental',sfrRating:4,repRanges:{strength:{min:6,max:10,rest:90},hypertrophy:{min:10,max:15,rest:60},endurance:{min:15,max:20,rest:45}},recoveryImpact:{core:0.5},progressionIds:['CO-06','CO-12'],regressionIds:[]},
 {id:'CO-02',name:'Pallof Press',category:'core',subcategory:'anti_rotation',muscles:{primary:{internal_obliques:70,external_obliques:65,transverse_abdominis:60},secondary:{rectus_abdominis:40,gluteus_medius:25,hip_adductors:20}},equipment:['cable_machine','resistance_bands'],location:{gym:true,home:true,work:true},tier:1,phase:{acute:{s:'suitable',p:5,n:'Recommended plank alternative. Trains anti-rotation without spinal flexion or extension loading. Band version works at home/work. Half-kneeling version adds hip flexor stretch. Light resistance, focus on ZERO torso rotation.'},subacute:{s:'suitable',p:5,n:'Moderate resistance. Standing. Add overhead press-out variant.'},maintenance:{s:'suitable',p:4,n:'Heavy cable. Dynamic variants (alphabet, circles). Warm-up before rotational sports.'}},sets:3,reps:'8-10 each side (or 20-30 sec holds)',rest:45,tempo:'2-2-2-0',cues:['Stand (or half-kneel) sideways to cable/band anchor at chest height. Hold handle at chest with both hands stacked.',`BRACE: exhale, draw ribs down, squeeze glutes. Entire torso is locked — imagine you're encased in concrete from hips to shoulders.`,'Press hands straight forward to full arm extension. This is where the rotational force is MAXIMAL. Hold 2 seconds.',`ZERO TORSO ROTATION. Hips face forward, shoulders face forward, arms face forward. The cable is PULLING you to rotate — your core's job is to say NO.`,'Return hands to chest (2 seconds). Repeat. Complete all reps on one side, then switch. The side facing the anchor is harder.'],mistakes:[{m:'Allowing torso to rotate toward cable',f:'Reduce resistance. Belt buckle, sternum, and nose all point the same direction throughout. Have a mirror or training partner verify.'},{m:'Shrugging during press-out',f:'Depress shoulders before pressing out. Arms extend from a stable, depressed shoulder position.'},{m:'Leaning away from cable (lateral compensation)',f:'Stand tall. If you need to lean, resistance is too high.'},{m:'Holding breath',f:'Exhale during press-out. Inhale on return. Continuous breathing during holds.'}],why:'THE plank replacement. Trains the anti-rotation reflexes that protect lumbar discs from torsional injury. Zero spinal flexion or extension loading. Half-kneeling variant simultaneously stretches hip flexors (posture and core stability). Band version available everywhere — zero barrier to daily practice.',benefits:['anterior_pelvic_tilt','anti_extension_core','back_protection'],subs:['CO-07'],movementPattern:'core_anti_rotation',primaryMuscleGroup:'core',secondaryMuscleGroups:[],mechanic:'isolation',exerciseTier:'supplemental',sfrRating:4,repRanges:{strength:{min:6,max:10,rest:90},hypertrophy:{min:10,max:15,rest:60},endurance:{min:15,max:20,rest:45}},recoveryImpact:{core:0.5},progressionIds:['CO-07','CO-08'],regressionIds:[]},
 {id:'CO-03',name:'Bird Dog',category:'core',subcategory:'anti_extension',muscles:{primary:{transverse_abdominis:65,internal_obliques:55,erector_spinae:50,gluteus_maximus:45},secondary:{external_obliques:40,rectus_abdominis:30,posterior_deltoid:25,hamstrings:20}},equipment:['bodyweight','resistance_bands'],location:{gym:true,home:true,work:true},tier:1,phase:{acute:{s:'suitable',p:5,n:'Complements dead bug (CO-01). Quadruped position challenges anti-extension from a different angle (gravity pulling spine DOWN vs dead bug where floor provides feedback). Bodyweight only. Focus on keeping spine neutral — no sag, no arch.'},subacute:{s:'suitable',p:4,n:'Add band. Add pause holds (5+ seconds). Can add light ankle/wrist weights.'},maintenance:{s:'suitable',p:3,n:'Warm-up. Band-resisted. Progression to bear crawl holds (CO-10).'}},sets:2,reps:'8-10 each side',rest:30,tempo:'2-3-2-1',cues:['All fours: hands under shoulders, knees under hips. Spine NEUTRAL — not arched, not rounded. Imagine a glass of water balanced on your lower back.',`BRACE core — draw belly button to spine gently. Don't hold breath. Maintain this brace throughout every rep.`,'Slowly extend RIGHT arm forward and LEFT leg backward. Full extension, thumb UP, toe pointed DOWN. 2-second extension.',`HOLD at full extension for 3 seconds. The glass of water must not spill. If hips shift, rock, or rotate — you've exceeded your current capacity.`,'Return to start slowly (2 seconds). Brief reset (1 second). Opposite side. Each rep is slow, deliberate, controlled.'],mistakes:[{m:'Lumbar sag (belly drops toward floor)',f:'Brace harder. Reduce ROM (only extend limbs 50%). Imagine the glass of water on your back.'},{m:'Hip rotation / shift when leg extends',f:'Keep hips LEVEL. Someone behind you should see both hip bones at the same height. Reduce leg extension ROM if needed.'},{m:'Head dropping or lifting',f:'Gaze at floor between hands. Neutral neck throughout. Head is just an extension of the spine.'},{m:'Rushing through reps',f:'3-second holds minimum at full extension. Slower = harder = better.'}],why:'Complements dead bug by training the same anti-extension principle from a gravity-challenged position. The quadruped position also demands anti-rotation (when contralateral limbs extend, rotation force is created). Glute activation in hip extension builds glute medius strength. Zero equipment. Can do anywhere.',benefits:['anterior_pelvic_tilt','anti_extension_core','back_protection','glute_med_activation'],subs:['CO-01'],movementPattern:'core_anti_extension',primaryMuscleGroup:'core',secondaryMuscleGroups:[],mechanic:'isolation',exerciseTier:'supplemental',sfrRating:4,repRanges:{strength:{min:6,max:10,rest:90},hypertrophy:{min:10,max:15,rest:60},endurance:{min:15,max:20,rest:45}},recoveryImpact:{core:0.5},progressionIds:['CO-10','CO-06','CO-12'],regressionIds:[]},
 {id:'CO-04',name:'Suitcase Carry',category:'core',subcategory:'anti_lateral_flexion',muscles:{primary:{internal_obliques:70,external_obliques:70,transverse_abdominis:60,erector_spinae:55},secondary:{gluteus_medius:45,hip_adductors:30,forearm_flexors:40,upper_trapezius:25}},equipment:['dumbbells','kettlebell'],location:{gym:true,home:true,work:false},tier:2,phase:{acute:{s:'suitable',p:4,n:'Moderate weight. Focus on keeping shoulders LEVEL — no lateral lean toward weight. Short distance (30-40 steps per side). Barefoot option if on safe surface for ankle proprioception bonus.'},subacute:{s:'suitable',p:4,n:'Heavier weight. Longer distance. Can add rack carry variant.'},maintenance:{s:'suitable',p:4,n:'Heavy loading. Combination carries. Walking lunges with suitcase hold.'}},sets:2,reps:'30-40 steps each side (or 30-40 sec each side)',rest:60,tempo:'slow deliberate steps',cues:['Hold one DB/KB at your side. Stand TALL. Free hand at side (not on hip — that cheats the core demand).','BEFORE walking: brace core, squeeze glutes, pull shoulders level. The shoulder on the loaded side MUST NOT drop.','Walk slowly with controlled steps. Imagine balancing a tray of water on your head. Zero lateral lean.',`Breathe normally throughout. If you can't breathe, the weight is too heavy.`,'BONUS CUE: Do barefoot if safe surface. Each step challenges ankle proprioception. One exercise → two rehab targets.'],mistakes:[{m:'Leaning toward the weight',f:'Lighter weight. Check in mirror: shoulders must stay level. If anything, lean SLIGHTLY away from weight.'},{m:'Rushing / speed walking',f:'Slow, deliberate steps. Each footfall is controlled.'},{m:'Holding breath',f:'Breathe in through nose, out through mouth. Count steps to pace breathing.'},{m:'Shoulder hiking on loaded side',f:'Depress both shoulders before starting. Loaded shoulder stays DOWN and BACK.'}],why:'The most functional core exercise — training the exact demand of carrying something heavy in one hand (groceries, child, luggage). Directly strengthens the lateral stabilizers that prevent hip drop during single-leg stance. Barefoot option doubles as ankle proprioception training. Anti-lateral flexion is the most neglected core function — this fills the gap.',benefits:['anti_extension_core','glute_med_activation','ankle_instability'],subs:['CO-05','CO-09'],movementPattern:'carry',primaryMuscleGroup:'core',secondaryMuscleGroups:['forearms','shoulders'],mechanic:'compound',exerciseTier:'supplemental',sfrRating:3,repRanges:{strength:{min:3,max:6,rest:180},hypertrophy:{min:8,max:12,rest:120},endurance:{min:15,max:20,rest:60}},recoveryImpact:{core:0.8,forearms:0.2,shoulders:0.4},progressionIds:['CO-09'],regressionIds:['CO-05']},
 {id:'CO-05',name:'Modified Side Plank',category:'core',subcategory:'anti_lateral_flexion',muscles:{primary:{internal_obliques:75,external_obliques:70,transverse_abdominis:55},secondary:{gluteus_medius:50,gluteus_minimus:35,erector_spinae:35,hip_adductors:25}},equipment:['bodyweight'],location:{gym:true,home:true,work:true},tier:1,phase:{acute:{s:'suitable',p:4,n:'From KNEES initially (bent-knee side plank). Modified position reduces load to ~40% BW vs full side plank. Excellent for glute med co-activation. Does NOT reinforce poor posture unlike front planks.'},subacute:{s:'suitable',p:4,n:'Progress to full side plank from feet. Add hip abduction hold. 30-45 second holds.'},maintenance:{s:'suitable',p:3,n:'Copenhagen adductor variation. Thread-the-needle. 60+ second holds.'}},sets:2,reps:'20-30 sec each side',rest:30,tempo:'isometric hold',cues:['MODIFIED (acute): Lie on side. Bottom elbow under shoulder. KNEES bent 90°. Lift hips off floor creating straight line from knees to shoulders.','FULL: Bottom elbow under shoulder. Legs straight, feet stacked or staggered (top foot forward for stability). Lift hips. Straight line from ankle to shoulder.',`CRITICAL: Hips stay STACKED. Don't rotate forward or backward. Top hip directly above bottom hip.`,'Bottom shoulder stays DEPRESSED — elbow pushes into floor, shoulder blade pulls down and back. This prevents upper trap hiking.',`Breathe normally. If you can't maintain form for the target time, break into shorter holds (e.g., 3×10 sec with 5-sec rest between).`],mistakes:[{m:'Hips dropping toward floor',f:'Drive bottom hip UP toward ceiling. Think of creating a slight UPWARD curve. Regress to knees if hips drop.'},{m:'Rotating forward (converting to partial front plank)',f:'Top hip stacks directly over bottom hip. Have someone check from behind.'},{m:'Shoulder shrugging on bottom arm',f:'Push elbow INTO floor and pull shoulder blade DOWN. Maximum distance between ear and shoulder.'},{m:'Holding breath',f:'Count breaths. Aim for 6-8 slow breaths per 30-sec hold.'}],why:'The APPROVED plank. Unlike front planks (which can reinforce poor posture, side planks train lateral stability without extension loading. The glute med co-activation directly targets glute medius strength. Hip abduction variant is a 2-for-1 benefit. Bodyweight, zero equipment, any location.',benefits:['glute_med_activation','anti_extension_core'],subs:['CO-04'],movementPattern:'core_anti_rotation',primaryMuscleGroup:'core',secondaryMuscleGroups:[],mechanic:'isolation',exerciseTier:'supplemental',sfrRating:4,repRanges:{strength:{min:6,max:10,rest:90},hypertrophy:{min:10,max:15,rest:60},endurance:{min:15,max:20,rest:45}},recoveryImpact:{core:0.5},progressionIds:['CO-04'],regressionIds:[]},
 {id:'CO-06',name:'Body Saw / Stability Ball Rollout',category:'core',subcategory:'anti_extension',muscles:{primary:{rectus_abdominis:80,transverse_abdominis:70,internal_obliques:60},secondary:{external_obliques:50,serratus_anterior:40,latissimus_dorsi:30,anterior_deltoid:25}},equipment:['bodyweight'],location:{gym:true,home:true,work:false},tier:3,phase:{acute:{s:'avoid',p:0,n:'AVOID. Too advanced for current anti-extension capacity. If dead bug causes ANY back arching, this exercise is not ready. Master dead bug (CO-01) and bird dog (CO-03) first.'},subacute:{s:'caution',p:3,n:'Ball rollout from knees ONLY if dead bug and bird dog are fully mastered (zero back arch, full ROM). Very small range of motion initially. Stop IMMEDIATELY if lower back arches.'},maintenance:{s:'suitable',p:5,n:'Primary anti-extension progressive overload. Ball rollout → body saw → ab wheel rollout progression.'}},sets:3,reps:'6-10',rest:90,tempo:'3-1-2-0',cues:['BALL ROLLOUT: Kneel in front of stability ball. Forearms on ball, elbows bent 90°. Core braced, posterior pelvic tilt LOCKED IN.','Slowly roll ball forward by extending arms. The further you go, the harder it gets. STOP the instant you feel your lower back wanting to arch.',`THAT'S your current range. Mark it mentally. Over weeks, it will increase.`,'Return by pulling elbows back toward knees. Exhale hard on the return (tightens core).','BODY SAW (advanced): Elbows on floor, feet on sliders/towel. Push body backward with arms (feet slide). Same principle, higher difficulty.'],mistakes:[{m:'Going too far / back arching',f:'STOP before arch. Your effective range might be 6 inches initially. That\'s fine. It grows. Never sacrifice form for range.'},{m:'Hips piking up (butt rising)',f:'Straight line from knees (or feet) to shoulders. Glutes squeezed. No piking.'},{m:'Rushing the eccentric (rolling out fast)',f:'3-second rollout MINIMUM. Controlled at all times.'},{m:'Shoulders shrugging during rollout',f:'Depress shoulders throughout. Push into ball/floor, shoulder blades DOWN.'}],why:'The graduation exercise for anti-extension. Provides progressive overload that dead bugs and bird dogs can\'t — by increasing lever arm, the challenge increases continuously. Necessary for long-term core development. But ONLY after foundation is established (dead bug mastery is prerequisite).',benefits:['anti_extension_core'],subs:['CO-01'],movementPattern:'core_anti_extension',primaryMuscleGroup:'core',secondaryMuscleGroups:[],mechanic:'isolation',exerciseTier:'supplemental',sfrRating:4,repRanges:{strength:{min:6,max:10,rest:90},hypertrophy:{min:10,max:15,rest:60},endurance:{min:15,max:20,rest:45}},recoveryImpact:{core:0.5},progressionIds:[],regressionIds:['CO-01','CO-03']},
 {id:'CO-07',name:'Half-Kneeling Cable Chop (High-to-Low)',category:'core',subcategory:'rotational_control',muscles:{primary:{internal_obliques:70,external_obliques:70,transverse_abdominis:55},secondary:{rectus_abdominis:40,serratus_anterior:30,anterior_deltoid:25,hip_adductors:20,gluteus_medius:20}},equipment:['cable_machine','cable_rope'],location:{gym:true,home:false,work:false},tier:2,phase:{acute:{s:'caution',p:3,n:'Light weight only. Half-kneeling mandatory (prevents lumbar rotation cheating). Focus on thoracic rotation with ZERO lumbar motion. If any lower back discomfort → too heavy or too much lumbar rotation → reduce weight and ROM.'},subacute:{s:'suitable',p:4,n:'Moderate loading. Full ROM. Can explore standing split-stance.'},maintenance:{s:'suitable',p:4,n:'Full loading. Standing. Can pair with lifts (CO-08) for complete rotational training.'}},sets:3,reps:'8-10 each side',rest:60,tempo:'2-1-2-0',cues:['Half-kneel sideways to cable. OUTSIDE knee down (knee furthest from cable). Cable at high position with rope or handle.','Hold rope with BOTH hands. Start position: arms extended toward cable anchor (rotated toward cable). Hips face forward, shoulders rotated toward cable.','CHOP diagonally: pull rope from high (cable side) to low (opposite hip). Rotate SHOULDERS AND THORACIC SPINE, but hips and knees DO NOT MOVE. This is the critical skill — thoracic rotation with lumbar stability.',`Arms guide the rope but CORE does the rotation work. Don't just arm-pull.`,'Return slowly (2 sec) to start position. Controlled deceleration. This eccentric phase trains the anti-rotation capacity.'],mistakes:[{m:'Hips rotating (whole body turning)',f:'Hips face FORWARD throughout. Belt buckle points the same direction from start to finish. Only shoulders turn. Half-kneeling position helps enforce this but must be conscious.'},{m:'All arms, no core',f:'Think about rotating your RIB CAGE, not pulling with your arms. Arms are just the delivery system.'},{m:'Too fast / ballistic',f:'2-second chop, 2-second return. Controlled throughout. This is an anti-rotation exercise disguised as a rotation exercise.'},{m:'Shrugging during chop',f:'Depress shoulders before starting. Maintain depression throughout.'}],why:'Trains the most critical movement skill for spinal health: thoracic rotation with lumbar stability. Users with thoracic rigidity — chops teach the thoracic spine to rotate independently, reducing compensatory lumbar rotation that threatens lumbar discs. Half-kneeling adds hip flexor stretch (posture and core stability).',benefits:['anti_extension_core','anterior_pelvic_tilt'],subs:['CO-02'],movementPattern:'core_anti_rotation',primaryMuscleGroup:'core',secondaryMuscleGroups:[],mechanic:'isolation',exerciseTier:'supplemental',sfrRating:4,repRanges:{strength:{min:6,max:10,rest:90},hypertrophy:{min:10,max:15,rest:60},endurance:{min:15,max:20,rest:45}},recoveryImpact:{core:0.5},progressionIds:[],regressionIds:['CO-02','NK-04']},
 {id:'CO-08',name:'Half-Kneeling Cable Lift (Low-to-High)',category:'core',subcategory:'rotational_control',muscles:{primary:{external_obliques:70,internal_obliques:65,transverse_abdominis:55},secondary:{rectus_abdominis:40,serratus_anterior:35,anterior_deltoid:30,gluteus_medius:25}},equipment:['cable_machine','cable_rope'],location:{gym:true,home:false,work:false},tier:2,phase:{acute:{s:'caution',p:2,n:'Same principles as chop (CO-07). Light weight, half-kneeling, focus on thoracic-lumbar dissociation. Slightly more shoulder demand at top of lift — monitor anterior shoulder in the overhead-reaching phase.'},subacute:{s:'suitable',p:4,n:'Moderate loading. Pair with chops for complete rotational training.'},maintenance:{s:'suitable',p:4,n:'Full loading. Standing. Superset with chops.'}},sets:3,reps:'8-10 each side',rest:60,tempo:'2-1-2-0',cues:['Half-kneel sideways to cable. INSIDE knee down (knee closest to cable). Cable at lowest position with rope or handle.','Hold rope with both hands at outside hip (toward cable). Hips face forward.','LIFT diagonally: drive rope from low (cable-side hip) to high (opposite shoulder). Rotate thoracic spine — shoulders turn but hips DO NOT.',`At top of lift: arms extended toward ceiling at ~45° above opposite shoulder. Don't go full overhead if anterior shoulder protests.`,'Return slowly to hip. Controlled. Every rep: thoracic spine rotates, lumbar spine stays neutral.'],mistakes:[{m:'Hip rotation / rising off back knee',f:'Inside knee stays DOWN and still. Belt buckle faces forward throughout.'},{m:'Arching back at top of lift (reaching too high)',f:'Stop at 45° above shoulder. No full overhead in acute. Ribs stay down.'},{m:'Leading with arms instead of core',f:'Initiate from the rib cage. Arms follow the torso. Power comes from obliques, not deltoids.'}],why:'Completes the rotational training pair with chops (CO-07). Chops train posterior oblique sling, lifts train anterior oblique sling. Together they build the rotational force PRODUCTION (thoracic) and RESISTANCE (lumbar) patterns needed for spinal health. The anterior oblique sling (internal oblique → adductors) also contributes to pelvic stability during single-leg stance — building glute medius strength.',benefits:['anti_extension_core'],subs:['CO-07'],movementPattern:'core_anti_rotation',primaryMuscleGroup:'core',secondaryMuscleGroups:[],mechanic:'isolation',exerciseTier:'supplemental',sfrRating:4,repRanges:{strength:{min:6,max:10,rest:90},hypertrophy:{min:10,max:15,rest:60},endurance:{min:15,max:20,rest:45}},recoveryImpact:{core:0.5},progressionIds:[],regressionIds:['CO-02','NK-04']},
 {id:'CO-09',name:'Farmer\'s Carry (Bilateral)',category:'core',subcategory:'integrated_stability',muscles:{primary:{transverse_abdominis:65,internal_obliques:60,external_obliques:60,erector_spinae:60},secondary:{upper_trapezius:50,forearm_flexors:55,gluteus_medius:35,gastrocnemius:20,soleus:20}},equipment:['dumbbells','kettlebell'],location:{gym:true,home:true,work:false},tier:2,phase:{acute:{s:'suitable',p:3,n:'Moderate weight (30-40% BW total). Focus on posture: tall, shoulders depressed, pelvis neutral. Short distance. Monitor lumbar symptoms — axial loading can aggravate lower back symptoms. If any radiating pain, STOP and avoid.'},subacute:{s:'suitable',p:4,n:'Heavier loading (50-70% BW). Longer distance. Can alternate with suitcase carry (CO-04).'},maintenance:{s:'suitable',p:4,n:'Heavy loading (70-100% BW). Grip development. Trap/forearm growth.'}},sets:2,reps:'40-60 steps (or 45-60 sec)',rest:90,tempo:'slow deliberate steps',cues:['Deadlift two DBs/KBs from floor (hip hinge, flat back, brace). Stand tall.','POSTURE: ears over shoulders over hips over ankles. Shoulders DEPRESSED and BACK. Core braced. Posterior pelvic tilt bias.','Walk with controlled, deliberate steps. No shuffling. Each step is a single-leg stance micro-challenge.','Breathe normally. Grip hard but relax face and neck. If neck tenses, upper traps are compensating — lighter weight.','TALL posture throughout. The moment you start hunching or leaning, the set is over regardless of distance.'],mistakes:[{m:'Forward lean / hunching',f:'Chest up, shoulders back. If posture fails, weight is too heavy. Set ends when posture degrades.'},{m:'Lumbar hyperextension (arching back)',f:'Slight posterior pelvic tilt. Glutes gently squeezed. Ribs down.'},{m:'Neck tension / shrugging',f:'Actively depress shoulders away from ears. If neck tenses = too heavy.'},{m:'Too heavy too soon',f:'Start at 30-40% BW (55-75 lbs total). Increase by 10 lbs every 2 weeks if no symptoms.'}],why:'The most functional exercise in the entire program. Trains every core function simultaneously. Develops grip strength (relevant for all other exercises). Each step is a single-leg stability challenge. Teaches upright loaded posture — the antidote to prolonged sitting posture. Widely regarded as one of the best exercises for general health.',benefits:['anti_extension_core','glute_med_activation'],subs:['CO-04'],movementPattern:'carry',primaryMuscleGroup:'core',secondaryMuscleGroups:['forearms','shoulders'],mechanic:'compound',exerciseTier:'supplemental',sfrRating:3,repRanges:{strength:{min:3,max:6,rest:180},hypertrophy:{min:8,max:12,rest:120},endurance:{min:15,max:20,rest:60}},recoveryImpact:{core:0.8,forearms:0.2,shoulders:0.4},progressionIds:[],regressionIds:['CO-04']},
 {id:'CO-10',name:'Bear Crawl Hold (Static)',category:'core',subcategory:'integrated_stability',muscles:{primary:{transverse_abdominis:70,rectus_abdominis:60,internal_obliques:60,external_obliques:55,serratus_anterior:55},secondary:{anterior_deltoid:40,quadriceps:30,hip_adductors:25}},equipment:['bodyweight'],location:{gym:true,home:true,work:false},tier:2,phase:{acute:{s:'caution',p:2,n:'Only if bird dog (CO-03) is fully mastered (zero sag, zero hip shift). Start with 10-15 sec holds. VERY demanding on core. If back arches or shoulders shrug, not ready — return to bird dog.'},subacute:{s:'suitable',p:4,n:'20-30 sec holds. Add limb lifts (hand or foot off floor).'},maintenance:{s:'suitable',p:4,n:'30-45 sec holds. Bear crawl movement (forward/backward). Band-resisted.'}},sets:3,reps:'15-30 sec holds',rest:45,tempo:'isometric hold',cues:['All fours: hands under shoulders, knees under hips. This is the bird dog starting position.','Tuck toes under. BRACE core hard — posterior pelvic tilt, ribs DOWN, belly button toward spine.',`Lift KNEES 1-2 inches off floor. That's it. Hold this position. Knees hover. Shins parallel to floor.`,'Breathe normally (this is incredibly hard to do while holding). Every exhale, re-brace.','If back sags, shoulders shrug, or hips rise — the set is over. Quality of position is everything.'],mistakes:[{m:'Hips rising too high (pike position)',f:'Hips stay at SAME height as bird dog. Just knees lift. Shins hover parallel to floor.'},{m:'Back sagging into lordosis',f:'Shorten hold duration. 10 seconds with perfect form beats 30 seconds with sag.'},{m:'Shoulder shrugging',f:'Push floor AWAY (serratus activation). Shoulder blades flat on rib cage, not winging.'},{m:'Holding breath',f:'Count breaths. Aim for 4-6 controlled breaths per hold.'}],why:'The functional plank replacement. Trains anti-extension from a position the body actually uses (getting up from floor, crawling with children, etc.). More serratus anterior activation than standard planks (hands in closed chain, pushing). Progression from bird dog that provides substantially more challenge without adding spinal flexion or extension loading.',benefits:['anti_extension_core','scapular_stability'],subs:['CO-03'],movementPattern:'carry',primaryMuscleGroup:'core',secondaryMuscleGroups:['forearms','shoulders'],mechanic:'compound',exerciseTier:'supplemental',sfrRating:3,repRanges:{strength:{min:3,max:6,rest:180},hypertrophy:{min:8,max:12,rest:120},endurance:{min:15,max:20,rest:60}},recoveryImpact:{core:0.8,forearms:0.2,shoulders:0.4},progressionIds:[],regressionIds:['CO-03','CO-12']},
 {id:'CO-11',name:'McGill Curl-Up',category:'core',subcategory:'safe_flexion',muscles:{primary:{rectus_abdominis:70},secondary:{internal_obliques:30,external_obliques:30}},equipment:['bodyweight'],location:{gym:true,home:true,work:true},tier:1,phase:{acute:{s:'suitable',p:3,n:'Light inclusion. This is the ONLY safe way to train rectus abdominis through controlled flexion. Small ROM. Hands under lower back monitor position. Can skip if anti-extension work is sufficient volume.'},subacute:{s:'suitable',p:3,n:'Standard inclusion. 2-3 sets. Can add light hold (plate on chest).'},maintenance:{s:'suitable',p:3,n:'Part of comprehensive core routine. Still light loading — this is never a heavy exercise.'}},sets:2,reps:'8-10 (with 5-sec holds)',rest:30,tempo:'1-5-1-1',cues:['Lie on back. ONE knee bent (foot flat on floor), OTHER leg straight. This asymmetric position naturally locks lumbar spine into neutral.','Slide both hands under your lower back, palms down. These are SENSORS — they monitor lumbar position. Your back should press lightly into your hands throughout. If pressure changes, lumbar spine moved.',`Brace core. Lift HEAD AND SHOULDERS only 2-3 inches off floor. NOT a full sit-up. Barely a crunch. Think 'chin toward ceiling, not toward knees.'`,'HOLD the raised position for 5 full seconds. Breathe. Then lower slowly.','SWITCH which knee is bent halfway through the set. This prevents asymmetric loading.'],mistakes:[{m:'Curling too high (full crunch ROM)',f:'2-3 inches of head/shoulder lift only. If you feel lower back moving (hands detect pressure change), you went too high.'},{m:'Pulling on neck with hands',f:'Hands stay under lumbar spine. They are monitoring tools, not movement assistors.'},{m:'Both legs bent or both legs straight',f:'One bent, one straight. Switch halfway through set.'},{m:'Not holding at top',f:'5-second hold at top of EVERY rep. Count out loud.'}],why:'The only safe spinal flexion exercise to reduce lower back loading. Research has specifically demonstrated that this trains the rectus abdominis WITHOUT the excessive lumbar flexion of traditional crunches/sit-ups. The hand-under-back tactile feedback is genius — you immediately know if form has broken. Addresses the rectus abdominis gap that pure anti-extension work doesn\'t fully cover.',benefits:['back_protection'],subs:[],movementPattern:'core_flexion',primaryMuscleGroup:'core',secondaryMuscleGroups:[],mechanic:'isolation',exerciseTier:'supplemental',sfrRating:4,repRanges:{strength:{min:6,max:10,rest:90},hypertrophy:{min:10,max:15,rest:60},endurance:{min:15,max:20,rest:45}},recoveryImpact:{core:0.5},progressionIds:[],regressionIds:[]},
 {id:'CO-12',name:'Plank Shoulder Tap / Hand Walkout',category:'core',subcategory:'anti_extension',muscles:{primary:{transverse_abdominis:65,rectus_abdominis:55,internal_obliques:55,external_obliques:55},secondary:{serratus_anterior:50,anterior_deltoid:40,gluteus_maximus:30,gluteus_medius:30}},equipment:['bodyweight'],location:{gym:true,home:true,work:true},tier:2,phase:{acute:{s:'caution',p:2,n:'ONLY as a DYNAMIC plank alternative, not a standard hold. The dynamic nature (tapping, moving) makes this more engagement-friendly than static planks. Use incline if needed. Wide foot stance. Only if push-up plank position is comfortable.'},subacute:{s:'suitable',p:3,n:'Standard plank position taps. Narrow stance. Add walkout.'},maintenance:{s:'suitable',p:3,n:'Weighted vest. Narrow stance. Extended walkouts.'}},sets:2,reps:'6-8 taps each side (or 4-6 walkouts)',rest:45,tempo:'2-1-2-0',cues:['SHOULDER TAP: Start in push-up position (hands under shoulders, body straight). Wide foot stance for stability. Brace core.','Slowly lift RIGHT hand and tap LEFT shoulder. 2-second lift, 1-second tap, 2-second return. ZERO HIP ROTATION — hips stay level.','Alternate sides. Each tap is a controlled anti-rotation challenge.','HAND WALKOUT: Stand tall. Hinge at hips, place hands on floor. Walk hands out to full plank position. Pause. Walk hands back. Stand.','Both versions: glutes squeezed, posterior pelvic tilt, no back sag. Dynamic movement keeps you engaged better than static holds.'],mistakes:[{m:'Hip rotation during taps (shifting/rocking)',f:'Wider foot stance. Slower taps. Place a water bottle on lower back — if it falls, you\'re rotating.'},{m:'Back sagging during plank position',f:'Squeeze glutes. Posterior tilt. If sag occurs, use incline plank position.'},{m:'Rushing through taps',f:'Each tap takes 5 seconds (2 up, 1 tap, 2 down). No rushing.'}],why:'Dynamic core exercise. Movement-based variations (tapping, walking) are more engaging than static holds and help maintain focus. Combines anti-extension and anti-rotation in one exercise. The movement-based nature provides implicit feedback (did you wobble? did you rotate?) that static planks lack.',benefits:['anti_extension_core','scapular_stability'],subs:['CO-10'],movementPattern:'core_anti_extension',primaryMuscleGroup:'core',secondaryMuscleGroups:[],mechanic:'isolation',exerciseTier:'supplemental',sfrRating:4,repRanges:{strength:{min:6,max:10,rest:90},hypertrophy:{min:10,max:15,rest:60},endurance:{min:15,max:20,rest:45}},recoveryImpact:{core:0.5},progressionIds:['CO-10'],regressionIds:['CO-01','CO-03']},
 {id:'NK-01',name:'Deep Cervical Flexor Activation (Chin Tuck)',category:'neck',subcategory:'deep_stabilizer_activation',muscles:{primary:{longus_colli:75,longus_capitis:70},secondary:{sternocleidomastoid:20,deep_cervical_flexors:65}},equipment:['bodyweight'],location:{gym:true,home:true,work:true},tier:1,phase:{acute:{s:'suitable',p:5,n:'DAILY exercise. Can do at desk every 30-60 minutes. Deep cervical flexor activation is the foundation of cervical rehab. Start supine (easiest), progress to seated/standing. This directly addresses cervical instability by retraining the muscles that SHOULD stabilize the cervical spine but are underactive.'},subacute:{s:'suitable',p:4,n:'Seated/standing. Add light resistance (fingertips on forehead). Progress to sustained holds.'},maintenance:{s:'suitable',p:3,n:'Permanent maintenance. Desk break exercise. Postural reset.'}},sets:3,reps:'10-12 (with 5-10 sec holds)',rest:15,tempo:'1-5-1-1',cues:['SUPINE: Lie on back, no pillow. Gently draw chin STRAIGHT BACK toward floor — imagine making a double chin. This is a SMALL motion (1-2 inches). NOT nodding or looking down.','The motion is RETRACTION (backward), not FLEXION (forward). Imagine someone pushing your forehead straight back into the pillow.','HOLD 5-10 seconds. You should feel deep muscles at the FRONT of your neck working, NOT the muscles at the BACK.','SEATED/STANDING: Same chin retraction. Draw chin straight backward. Ears slide back over shoulders. Can use wall behind head as reference — gently push back of head into wall.','DESK CUE: Every 30-60 minutes, do 5 chin tucks with 5-second holds. Takes 30 seconds. Resets cervical posture.'],mistakes:[{m:'Nodding chin down instead of retracting',f:'Think HORIZONTAL glide backward, not downward nod. Imagine sliding your head backward on a shelf.'},{m:'Using excessive force / straining',f:'Gentle 30-40% effort. Should feel like deep front-of-neck engagement, not straining.'},{m:'Holding breath',f:'Breathe normally throughout holds.'},{m:'Forgetting to do them at work',f:'Set a phone timer for every 60 minutes. 5 chin tucks per alarm. Takes 30 seconds.'}],why:'Foundational cervical stability exercise. Deep cervical flexors (longus colli/capitis) are the \'rotator cuff\' of the neck — small stabilizers that can become underactive. When underactive, the superficial muscles compensate, Reactivating these deep flexors is step one. TIP: Every dead bug (CO-01) and bird dog (CO-03) should include a gentle chin tuck cue — this integrates cervical training into core work for zero additional time cost.',benefits:['scapular_stability'],subs:[],movementPattern:'corrective',primaryMuscleGroup:'neck',secondaryMuscleGroups:[],mechanic:'isolation',exerciseTier:'assistance',sfrRating:5,repRanges:{strength:{min:8,max:12,rest:60},hypertrophy:{min:12,max:15,rest:45},endurance:{min:15,max:25,rest:30}},recoveryImpact:{},progressionIds:['NK-02','NK-05'],regressionIds:[]},
 {id:'NK-02',name:'Cervical Isometric Series (4-Way)',category:'neck',subcategory:'isometric_strengthening',muscles:{primary:{deep_cervical_flexors:55,sternocleidomastoid:45,upper_trapezius:40,splenius_capitis:45,levator_scapulae:35,scalenes:35},secondary:{longus_colli:40,semispinalis_capitis:40}},equipment:['bodyweight'],location:{gym:true,home:true,work:true},tier:1,phase:{acute:{s:'suitable',p:4,n:'Start with 20-30% effort isometrics. 5-second holds. All 4 directions. Zero movement — purely pushing into hand. If any direction recreates radicular symptoms or spasm, SKIP that direction. Flexion is most important (deep flexor training).'},subacute:{s:'suitable',p:4,n:'40-60% effort. 10-second holds. All 4 directions.'},maintenance:{s:'suitable',p:3,n:'60-80% effort. Can add band resistance for more loading. Warm-up before training.'}},sets:2,reps:'5-8 each direction (with 5-10 sec holds)',rest:15,tempo:'ramp up 2 sec, hold 5-10 sec, ramp down 2 sec',cues:[`FLEXION: Place palm on forehead. Gently push forehead INTO hand. Hand resists — no movement occurs. Chin stays neutral (don't tuck or extend). Hold 5-10 seconds at 30% effort.`,`EXTENSION: Interlace fingers behind head. Push head BACKWARD into hands. Hands resist — head doesn't move. Hold 5-10 seconds. Feel muscles at back of neck engage.`,'LEFT LATERAL: Place right hand on right side of head (above ear). Push head INTO hand toward right shoulder. Hand blocks all movement. Hold 5-10 seconds. Switch sides.','ALL DIRECTIONS: Ramp force up slowly (2 sec), hold at target effort (5-10 sec), ramp down slowly (2 sec). Never sudden force. Never maximum effort in acute phase.','ROTATION (optional 5th direction): Place hand on side of chin. Try to turn head into hand. Hand blocks. Trains rotational stability. Only if comfortable.'],mistakes:[{m:'Using too much force (>50% effort in acute)',f:'30% effort maximum in acute. Should feel like gentle engagement, not straining. Progress force by 10% every 2 weeks.'},{m:'Allowing movement (not truly isometric)',f:'Hand is an IMMOVABLE WALL. Neck pushes, hand blocks. If head moves, hand wasn\'t firm enough.'},{m:'Sudden force application',f:'Always RAMP UP over 2 seconds. Never sudden. Think of gradually turning a dial from 0 to 30%.'},{m:'Extension direction causing pain',f:'If extension causes any radiating symptoms, skip extension direction entirely. Focus on flexion and lateral flexion.'}],why:'Builds cervical stability in all planes without the movement that can trigger spasm. The isometric nature is specifically chosen for cervical safety — it strengthens without moving through ranges that provoke symptoms. Balanced 4-way training prevents asymmetric cervical muscle activation. TIP: Improved cervical stability means less compensatory upper trap guarding during all overhead and pulling exercises.',benefits:[],subs:['NK-01'],movementPattern:'corrective',primaryMuscleGroup:'neck',secondaryMuscleGroups:[],mechanic:'isolation',exerciseTier:'assistance',sfrRating:5,repRanges:{strength:{min:8,max:12,rest:60},hypertrophy:{min:12,max:15,rest:45},endurance:{min:15,max:25,rest:30}},recoveryImpact:{},progressionIds:[],regressionIds:['NK-01']},
 {id:'NK-03',name:'Upper Trap / Levator Scapulae Active Stretch',category:'neck',subcategory:'muscle_lengthening',muscles:{primary:{upper_trapezius:0,levator_scapulae:0},secondary:{splenius_capitis:0,scalenes:0}},equipment:['bodyweight'],location:{gym:true,home:true,work:true},tier:1,phase:{acute:{s:'suitable',p:5,n:'DAILY. Multiple times per day if sedentary. Especially important BEFORE and AFTER shoulder exercises. Gentle active stretch — no aggressive pulling. Hold 30 seconds. If stretch provokes spasm or radiating symptoms, reduce intensity or skip.'},subacute:{s:'suitable',p:4,n:'Continue daily. Can add gentle overpressure. Pair with face pulls (SH-02) — stretch overactive muscles, then strengthen their antagonists.'},maintenance:{s:'suitable',p:3,n:'Permanent maintenance. Desk break ritual. Part of warm-up before upper body work.'}},sets:2,reps:'30 sec hold each side, each position',rest:0,tempo:'static hold',cues:['UPPER TRAP STRETCH: Sit tall. Reach LEFT hand behind back (or sit on left hand). Tilt RIGHT ear toward RIGHT shoulder. Feel stretch on LEFT side of neck/upper shoulder. Gently use RIGHT hand on LEFT side of head for light overpressure. 30 seconds. Switch sides.','LEVATOR SCAPULAE STRETCH: Sit tall. Reach LEFT hand behind back. Rotate head 45° to the RIGHT, then look DOWN toward your RIGHT armpit. Feel stretch on the LEFT side, deeper than upper trap — between neck and shoulder blade. Light overpressure with RIGHT hand on back-left of head. 30 seconds. Switch.','CRITICAL DISTINCTION: Upper trap = ear to shoulder (lateral flexion). Levator = nose to armpit (rotation + flexion). These are DIFFERENT stretches for DIFFERENT muscles.','ACTIVE DEPRESSION: During both stretches, actively PULL the shoulder blade of the stretched side DOWN toward your back pocket. This increases the stretch AND reinforces the depression movement pattern.','DESK PROTOCOL: Do both stretches every 2 hours during workday. Takes 2 minutes total. Prevents the accumulation of upper trap/levator tension.'],mistakes:[{m:'Aggressive overpressure / bouncing',f:'Gentle, sustained, 30-second holds. The stretch should feel like a 4/10 intensity — mild tension, never pain.'},{m:'Not differentiating upper trap from levator stretch',f:'Upper trap: ear to shoulder (pure lateral flexion). Levator: nose to armpit (rotation + flexion combined). Two separate stretches.'},{m:'Holding breath / tensing during stretch',f:'Breathe slowly. On each exhale, let the muscle soften slightly. The stretch should deepen naturally with breathing.'},{m:'Only stretching one side',f:'Always stretch BOTH sides. May hold longer on the tighter/symptomatic side.'}],why:'DIRECTLY addresses the muscle imbalance driving cervical symptoms. Upper trap and levator scapulae tend to be overactive — they\'re compensating for weak lower/mid trap, and pulling on the cervical spine as a result. Stretching them reduces tonic cervical compression. TIP: Do BEFORE face pulls (SH-02) and pull-aparts (SH-05) — lengthen the overactive muscles first, then strengthen their antagonists. This stretch-then-strengthen sequence is the foundation of muscle balance improvement.',benefits:['scapular_stability'],subs:[],movementPattern:'corrective',primaryMuscleGroup:'neck',secondaryMuscleGroups:[],mechanic:'isolation',exerciseTier:'assistance',sfrRating:5,repRanges:{strength:{min:8,max:12,rest:60},hypertrophy:{min:12,max:15,rest:45},endurance:{min:15,max:25,rest:30}},recoveryImpact:{},progressionIds:[],regressionIds:[]},
 {id:'NK-04',name:'Thoracic Extension / Rotation Mobility',category:'neck',subcategory:'thoracic_mobility',muscles:{primary:{erector_spinae:0,intercostals:0},secondary:{lower_trapezius:20,serratus_anterior:15}},equipment:['foam_roller','bodyweight'],location:{gym:true,home:true,work:false},tier:1,phase:{acute:{s:'suitable',p:4,n:'Gentle thoracic mobility work. Foam roller extension: small range, pause at each segment. Open book rotations. No forced end-range. Perform as warm-up before upper body training.'},subacute:{s:'suitable',p:4,n:'Deeper ranges. Add quadruped rotation with breathing. Pair with chops/lifts (CO-07/CO-08).'},maintenance:{s:'suitable',p:3,n:'Permanent warm-up. Extended rotation ranges. Can use with heavier breathing protocols.'}},sets:2,reps:'8-10 each direction / 5 extensions per segment',rest:0,tempo:'slow, breath-driven',cues:['FOAM ROLLER EXTENSION: Lie on foam roller positioned horizontally across mid-back (T6-T8 area). Hands behind head supporting neck. Gently extend OVER the roller — small range, 5 reps. Move roller up one segment. Repeat. Work from T4 to T10.','IMPORTANT: This is THORACIC extension, not lumbar extension. Keep core braced and ribs down. The movement happens at the roller contact point only.','OPEN BOOK ROTATION: Lie on side, knees bent 90°, arms stacked in front. Slowly rotate top arm and shoulder toward ceiling/behind you. Follow hand with eyes. Hold end-range 3-5 breaths. Feel thoracic spine rotate while hips stay stacked.',`QUADRUPED THORACIC ROTATION: All fours. One hand behind head. Rotate elbow of that arm toward opposite elbow (closing down), then rotate elbow toward ceiling (opening up). Hips DON'T move.`,'All thoracic mobility work should be BREATH-DRIVEN. Exhale into the stretch. Each breath should allow slightly more range. No forcing.'],mistakes:[{m:'Lumbar extension substituting for thoracic extension',f:'Core braced. Ribs down. The foam roller should create a FULCRUM — only the segment at the roller extends. Everything below stays neutral.'},{m:'Forcing rotation ROM',f:'Gentle, breath-driven. Accept today\'s range. It will improve. No bouncing or pushing.'},{m:'Skipping this because it doesn\'t \'feel like exercise\'',f:'Include as the first 3-5 minutes of every upper body session. Strongly recommended warm-up.'},{m:'Doing only extension OR only rotation',f:'Both components every session. 2-3 min extension + 2-3 min rotation = complete.'}],why:'Addresses the ROOT CAUSE of compensatory cervical and lumbar overload. Thoracic rigidity forces the cervical spine to hyper-rotate and the lumbar spine to hyper-extend/rotate — creating unwanted cervical and lumbar compensation. TIP: Improved thoracic extension is necessary before overhead pressing can be safe (SH-08). Improved thoracic rotation makes chops/lifts (CO-07/CO-08) more effective. This is the keystone mobility exercise.',benefits:['scapular_stability','back_protection'],subs:[],movementPattern:'corrective',primaryMuscleGroup:'neck',secondaryMuscleGroups:[],mechanic:'isolation',exerciseTier:'assistance',sfrRating:3,repRanges:{strength:{min:8,max:12,rest:60},hypertrophy:{min:12,max:15,rest:45},endurance:{min:15,max:25,rest:30}},recoveryImpact:{},progressionIds:['CO-07','CO-08'],regressionIds:[]},
 {id:'NK-05',name:'Cervical Retraction with Rotation',category:'neck',subcategory:'movement_control',muscles:{primary:{longus_colli:55,deep_cervical_flexors:50,splenius_capitis:40},secondary:{sternocleidomastoid:30,multifidus_cervical:45,semispinalis_capitis:35}},equipment:['bodyweight'],location:{gym:true,home:true,work:true},tier:1,phase:{acute:{s:'suitable',p:3,n:'Only after chin tuck (NK-01) is comfortable. Gentle rotation — stop well before end-range. Should feel smooth and pain-free. If ANY catching, clicking, or pain in rotation → reduce range or skip rotation and continue chin tucks only.'},subacute:{s:'suitable',p:3,n:'Fuller rotation range. Add overpressure at end-range rotation. Gentle.'},maintenance:{s:'suitable',p:2,n:'Warm-up. Cervical ROM maintenance. Desk break.'}},sets:2,reps:'6-8 each direction',rest:0,tempo:'2-2-2-2',cues:['Step 1: RETRACT first. Perform a chin tuck (NK-01 pattern). Draw chin straight backward. Hold this retracted position.','Step 2: From the retracted position, slowly ROTATE head to one side. Turn as far as comfortable — NOT to pain or end-range. Hold 2 seconds.','Step 3: Return to center (still retracted). Hold 2 seconds.','Step 4: Rotate to the other side. Hold 2 seconds. Return to center.',`THE KEY PRINCIPLE: Retract FIRST, then rotate. Never rotate from a forward-head position. This 'retract-then-move' pattern is a healthy cervical rotation pattern.`],mistakes:[{m:'Rotating WITHOUT retracting first',f:'ALWAYS chin tuck first. Rotation ONLY from retracted position. Make it a rule: retract → rotate → center → retract → rotate other side.'},{m:'Forcing end-range rotation',f:'Rotate to 80% of available range. Leave a buffer. Range will naturally increase as cervical muscles relax over weeks.'},{m:'Speed — whipping the head around',f:'2-second rotation each way. Deliberate, controlled, like turning a dial slowly.'},{m:'Losing retraction during rotation',f:'Maintain chin tuck THROUGHOUT rotation. Think double-chin first, then turn.'}],why:'Trains a healthy cervical rotation pattern. The retract-then-rotate sequence ensures cervical rotation occurs from a safe, protected position. Over time, this becomes automatic — the brain learns to retract before rotating during daily activities (checking mirrors while driving, turning to talk to someone, looking over shoulder). This reflex is what prevents future episodes. TIP: This movement pattern should be cued during any exercise involving looking to the side — including unilateral rows, cable work, and even checking form in mirrors.',benefits:[],subs:['NK-01'],movementPattern:'corrective',primaryMuscleGroup:'neck',secondaryMuscleGroups:[],mechanic:'isolation',exerciseTier:'assistance',sfrRating:5,repRanges:{strength:{min:8,max:12,rest:60},hypertrophy:{min:12,max:15,rest:45},endurance:{min:15,max:25,rest:30}},recoveryImpact:{},progressionIds:[],regressionIds:['NK-01']},
 {id:'RH-01',name:'True Couch Stretch',category:'rehab',subcategory:'hip_flexor_mobility',muscles:{primary:{rectus_femoris:-90,iliopsoas:-85},secondary:{vastus_lateralis:-20,tfl:-15}},equipment:['bodyweight'],location:{gym:true,home:true,work:true},tier:1,phase:{acute:{s:'suitable',p:5,n:'DAILY. HIGHLY RECOMMENDED. Targets posture and core stability (tight hip flexors → anterior pelvic tilt). 2 minutes each side minimum. This is the single most important mobility exercise in the entire program.'},subacute:{s:'suitable',p:5,n:'Continue daily. May be able to deepen position. Arms overhead progression.'},maintenance:{s:'suitable',p:5,n:'Lifelong maintenance. Sedentary occupation means hip flexors will chronically tighten. Daily is ideal, minimum 4×/week.'}},sets:1,reps:'2 min each side',rest:0,tempo:'sustained hold',cues:['Kneel facing away from wall or couch. Place rear foot/shin up against the wall (toes pointing up). The closer your knee is to the wall, the more intense the stretch.','Front foot flat on floor, front knee at 90°. Hands on front knee for support initially.',`THE CUE THAT MATTERS: posteriorly tilt your pelvis. Tuck your tailbone UNDER you. Think 'belt buckle to chin.' You should feel the stretch DRAMATICALLY increase in the front of your rear hip and thigh.`,'Squeeze the GLUTE of the rear leg. This uses reciprocal inhibition — the glute contracts, the hip flexor reflexively relaxes deeper into the stretch.',`Hold 2 full minutes. Don't bounce. Breathe into the stretch. The first 30 seconds are the worst — it gets easier as the tissue relaxes.`],mistakes:[{m:'Anterior pelvic tilt during stretch (arching low back)',f:'Posterior tilt FIRST. If you can\'t maintain tilt, move knee further from wall. It\'s better to do a shallow stretch with proper pelvic position than a deep stretch with anterior tilt.'},{m:'Bouncing or pulsing',f:'Static hold. Breathe. Let gravity and time do the work. 2 minutes is the minimum for connective tissue remodeling.'},{m:'Holding for less than 90 seconds',f:'Set a timer. 2 minutes minimum. The first 60 seconds barely touch the fascia.'},{m:'Compensating with lumbar extension to \'deepen\' the stretch',f:'Depth is NOT the goal. Posterior tilt is. A shallow stretch with posterior tilt is worth 10x more than a deep stretch with arched back.'}],why:'Targets tight rectus femoris and psoas. The posteriorly tilted position is the beneficial mechanism — without it, the stretch is useless. Daily compliance is what produces lasting tissue change. Users who sit 8+ hours/day find hip flexors will re-tighten without daily intervention.',benefits:['anterior_pelvic_tilt'],subs:[],movementPattern:'corrective',primaryMuscleGroup:'rehab',secondaryMuscleGroups:[],mechanic:'isolation',exerciseTier:'assistance',sfrRating:5,repRanges:{strength:{min:8,max:12,rest:60},hypertrophy:{min:12,max:15,rest:45},endurance:{min:15,max:25,rest:30}},recoveryImpact:{},progressionIds:[],regressionIds:[]},
 {id:'RH-02',name:'Supine Floor Slides',category:'rehab',subcategory:'scapular_motor_control',muscles:{primary:{lower_trapezius:75,serratus_anterior:65},secondary:{middle_trapezius:50,upper_trapezius:-20,latissimus_dorsi:-15}},equipment:['bodyweight'],location:{gym:true,home:true,work:true},tier:1,phase:{acute:{s:'suitable',p:5,n:'Excellent for building scapular control. Retrains lower/middle trapezius to upwardly rotate scapula without upper trap takeover. Floor provides tactile feedback. 2×10 reps.'},subacute:{s:'suitable',p:5,n:'Continue daily. Should notice arms staying flatter against floor. Add band resistance for light loading.'},maintenance:{s:'suitable',p:4,n:'Warm-up before pressing/overhead work. Motor pattern should be automatic by now.'}},sets:2,reps:'10',rest:30,tempo:'3-1-3-0',cues:['Lie on back, knees bent, feet flat. Press ENTIRE lower back into floor (posterior tilt). This locks ribcage down.',`Arms in 'goalpost' position: upper arms at 90° from body on floor, elbows bent 90°, backs of hands on floor. Everything touching floor.`,'SLOWLY slide arms overhead while keeping EVERYTHING in contact with floor — hands, wrists, elbows, upper arms. 3-second slide up.',`Go as far overhead as you can while maintaining full floor contact. The moment ANYTHING lifts off floor, STOP — that's your current range.`,`Slide back to goalpost position. Throughout: think 'shoulder blades sliding DOWN into back pockets' — this is lower trap depression cue.`],mistakes:[{m:'Arms lifting off floor during slide',f:'Reduce range. Only slide as far as arms stay flat. Range will increase over weeks as lower trap/serratus get stronger.'},{m:'Ribs flaring at end range',f:'Keep lower back pressed into floor. If ribs flare, you\'ve gone too far. Reduce overhead range.'},{m:'Shrugging shoulders toward ears during slide',f:'DEPRESS scapulae throughout. Think \'shoulder blades to back pockets.\' If shoulders shrug, restart the rep.'},{m:'Going too fast',f:'3-second slide up, pause, 3-second slide down. This is meditation speed.'}],why:'Directly retrains the scapular movement pattern needed for scapular control. Floor provides tactile feedback that no other surface can — you KNOW immediately if compensation occurs. Supine position eliminates gravity\'s pull on the scapula, making it easier to find the correct lower trap activation. Combined with posterior tilt, this also reinforces anti-extension positioning.',benefits:['scapular_stability'],subs:[],movementPattern:'corrective',primaryMuscleGroup:'rehab',secondaryMuscleGroups:[],mechanic:'isolation',exerciseTier:'assistance',sfrRating:5,repRanges:{strength:{min:8,max:12,rest:60},hypertrophy:{min:12,max:15,rest:45},endurance:{min:15,max:25,rest:30}},recoveryImpact:{},progressionIds:['RH-05'],regressionIds:[]},
 {id:'RH-03',name:'Dead Bug (Progressive)',category:'rehab',subcategory:'anti_extension_core',muscles:{primary:{transverse_abdominis:85,rectus_abdominis:60,internal_obliques:65,external_obliques:55},secondary:{iliopsoas:30,rectus_femoris:20}},equipment:['bodyweight','resistance_bands'],location:{gym:true,home:true,work:true},tier:1,phase:{acute:{s:'suitable',p:5,n:'DAILY. Replaces planks (not recommended — reinforce extension) and sit-ups (not recommended — hip flexor dominant). This is An excellent core stability exercise. Start with bodyweight, arms-only extension if full contralateral is too hard. Lower back MUST stay pressed to floor.'},subacute:{s:'suitable',p:5,n:'Full contralateral extension. Add band. Slower tempo. This becomes the core warm-up before every session.'},maintenance:{s:'suitable',p:4,n:'Banded. Weighted (hold light DB). Foundation before advancing to Pallof press and other loaded anti-extension work.'}},sets:2,reps:'8 each side',rest:45,tempo:'3-1-3-0',cues:[`Lie on back. Arms straight to ceiling. Hips and knees both at 90° — 'tabletop' position.`,'FIRST: press lower back INTO floor. Flatten it. No gap between lumbar spine and floor. THIS IS THE EXERCISE. Everything else is just making this harder.','Slowly extend RIGHT arm overhead and LEFT leg out straight — 3-second extension. Opposite limbs. The arm reaches toward the wall behind you, the heel reaches toward the wall in front.',`THE ENTIRE TIME: lower back stays pressed to floor. The MOMENT your back arches, you've gone too far. Stop, return, and note that range.`,'Return to start. Switch sides. Each rep should be slow and deliberate. Quality over quantity.'],mistakes:[{m:'Lower back arching off floor',f:'REDUCE RANGE. Extend limbs only as far as back stays flat. For some people starting out, this might be barely any extension at all. That\'s fine. Range increases as core control improves.'},{m:'Holding breath',f:'Breathe OUT during extension (exhale as limbs go out). Inhale on return. The exhale assists TVA contraction.'},{m:'Moving too fast',f:'3 seconds to extend, pause, 3 seconds to return. If this is too easy, extend further — don\'t speed up.'},{m:'Only doing leg extensions (skipping arms)',f:'Full contralateral: opposite arm AND leg every rep. If too hard, do arms-only first as a regression.'}],why:'Replaces BOTH not recommended standard planks (which can reinforce poor posture) and sit-ups (hip flexor dominant + lumbar flexion loading the lower back). The only core exercise that trains anti-extension in a supine position with floor tactile feedback. Directly promotes better posture. Progression milestone: full contralateral extension without back arch = core is ready for more challenging positions.',benefits:['anterior_pelvic_tilt','anti_extension_core','back_protection'],subs:[],movementPattern:'core_anti_extension',primaryMuscleGroup:'rehab',secondaryMuscleGroups:[],mechanic:'isolation',exerciseTier:'assistance',sfrRating:4,repRanges:{strength:{min:8,max:12,rest:60},hypertrophy:{min:12,max:15,rest:45},endurance:{min:15,max:25,rest:30}},recoveryImpact:{},progressionIds:['RH-11','RH-12'],regressionIds:[]},
 {id:'RH-04',name:'Single-Leg Balance (Barefoot)',category:'rehab',subcategory:'ankle_proprioception',muscles:{primary:{tibialis_anterior:40,peroneus_longus:55,peroneus_brevis:50},secondary:{gluteus_medius:50,soleus:30,gastrocnemius:20,tibialis_posterior:35}},equipment:['bodyweight'],location:{gym:true,home:true,work:true},tier:1,phase:{acute:{s:'suitable',p:5,n:'DAILY. Ankle proprioception retraining, and compensates for previous ankle concerns. Barefoot. Eyes open. Hard flat floor. 30 sec each × 2 sets. Progression milestone: 45+ sec eyes open.'},subacute:{s:'suitable',p:5,n:'Progress to eyes closed. Soft surface. Head turns. Duration increasing.'},maintenance:{s:'suitable',p:4,n:'Eyes closed on soft surface. Lifelong ankle maintenance exercise.'}},sets:2,reps:'30-45 sec each side',rest:15,tempo:'sustained hold',cues:['BAREFOOT on hard, flat floor. Remove shoes and socks. Your foot needs to feel the ground.','Stand on one leg. Slight knee bend (10-15°). DO NOT lock the knee. Arms relaxed at sides or on hips.','Find your CENTER OF PRESSURE — weight should be distributed across the entire foot. Not toes, not heels. Mid-foot center.','Eyes on a fixed point across the room (focal point stabilizes visual system). Breathe normally.','Notice the constant micro-adjustments at your ankle — that IS the exercise. Your ankle is relearning how to stabilize. The wobbling is the work.'],mistakes:[{m:'Wearing shoes',f:'Always barefoot. Always.'},{m:'Locking the knee',f:'Soft knee bend. Slight. Just enough that the knee isn\'t locked.'},{m:'Looking at foot',f:'Eyes on fixed point at eye level across the room.'},{m:'Touching down immediately when wobbling',f:'Ride the wobble. Let the ankle correct. Only touch down if you\'re about to fall. The wobble gets smaller over weeks — that\'s progress.'}],why:'Directly retrains ankle proprioception lost from recurrent sprains and functional forefoot load. Barefoot contact is non-negotiable for sensory input. Also trains glute med (stance hip stabilization) and foot intrinsics. Progression milestone: 45+ sec eyes open = ankle is stable enough for more demanding single-leg exercises.',benefits:['ankle_instability','forefoot_overload','glute_med_activation'],subs:[],movementPattern:'corrective',primaryMuscleGroup:'rehab',secondaryMuscleGroups:[],mechanic:'isolation',exerciseTier:'assistance',sfrRating:5,repRanges:{strength:{min:8,max:12,rest:60},hypertrophy:{min:12,max:15,rest:45},endurance:{min:15,max:25,rest:30}},recoveryImpact:{},progressionIds:[],regressionIds:[]},
 {id:'RH-05',name:'Scapular Push-Up (Push-Up Plus)',category:'rehab',subcategory:'scapular_motor_control',muscles:{primary:{serratus_anterior:90,lower_trapezius:40},secondary:{pec_major_sternal:20,anterior_deltoid:15,rectus_abdominis:35}},equipment:['bodyweight'],location:{gym:true,home:true,work:true},tier:1,phase:{acute:{s:'suitable',p:5,n:'Key exercise for scapular control development. This is not primarily a chest/tricep exercise — it\'s a SERRATUS ANTERIOR activation drill. Wall version is fine. The protraction at the top is what matters, not the push-up depth.'},subacute:{s:'suitable',p:5,n:'Progress to incline, then floor. Increase protraction range and hold time.'},maintenance:{s:'suitable',p:4,n:'Warm-up before pressing. Full push-up plus with band.'}},sets:2,reps:'10-12',rest:45,tempo:'2-0-2-2',cues:['Start in push-up position (wall, incline, or floor depending on phase). Hands shoulder-width. Arms straight.',`Without bending elbows, push the surface AWAY from you. Shoulder blades separate and spread apart (protraction). Upper back rounds slightly. THIS is the 'plus.'`,'HOLD the protracted position 2 seconds. Feel serratus anterior engage around the side of your ribcage (armpit area).','Let shoulder blades glide back together (retraction). Then repeat the protraction push.','This is NOT a push-up for chest. Keep arms straight. The ONLY movement is scapulae protracting and retracting on the ribcage.'],mistakes:[{m:'Bending elbows (turning it into a push-up)',f:'Lock elbows straight. The only joints moving are the scapulothoracic joints (shoulder blades on ribcage).'},{m:'Shrugging at the top',f:'DEPRESS scapulae (pull them down) while protracting (pushing apart). Depression + protraction = serratus. Elevation + protraction = upper trap.'},{m:'Hips sagging (during floor version)',f:'Squeeze glutes, brace core. If hips sag, use wall or incline version.'},{m:'Insufficient protraction range',f:'Push until upper back is visibly rounded. Imagine trying to make your chest touch the ceiling if you were face up.'}],why:'Highest serratus anterior activator available. Serratus anterior is a key scapular stabilizer. This exercise directly retrains upward rotation and protraction under load. Once this pattern is solid, it integrates into every push-up rep via the \'plus\' at the top.',benefits:['scapular_stability'],subs:[],movementPattern:'corrective',primaryMuscleGroup:'rehab',secondaryMuscleGroups:[],mechanic:'isolation',exerciseTier:'assistance',sfrRating:5,repRanges:{strength:{min:8,max:12,rest:60},hypertrophy:{min:12,max:15,rest:45},endurance:{min:15,max:25,rest:30}},recoveryImpact:{},progressionIds:[],regressionIds:['RH-02']},
 {id:'RH-06',name:'Thoracic Rotation (Side-Lying)',category:'rehab',subcategory:'thoracic_mobility',muscles:{primary:{internal_obliques:40,external_obliques:40},secondary:{erector_spinae:20,latissimus_dorsi:-30,pec_major_sternal:-25}},equipment:['bodyweight','lacrosse_ball'],location:{gym:true,home:true,work:true},tier:1,phase:{acute:{s:'suitable',p:5,n:'DAILY. Addresses the \'thoracic rigidity\' component of poor posture. Poor thoracic rotation forces the cervical spine to compensate and the lumbar spine to compensate. Side-lying version is safest.'},subacute:{s:'suitable',p:5,n:'Continue daily. May notice improved rotation range. Add quadruped thread-the-needle.'},maintenance:{s:'suitable',p:4,n:'Warm-up before pressing/overhead work. Lifelong maintenance for sedentary worker.'}},sets:1,reps:'8-10 each side',rest:0,tempo:'3-3-3-0',cues:['Lie on side, knees stacked and bent to 90°. Bottom arm extended in front at chest height. Top arm stacked on bottom arm.',`LOCK your knees together — they don't separate. This locks the lumbar spine and pelvis, forcing rotation through the thoracic spine only.`,'Slowly open the top arm in an arc over your body, like opening a book. Follow your hand with your eyes. 3-second rotation.','Rotate as far as the thoracic spine allows — ideally top shoulder touches the floor behind you. BREATHE deeply at end range (3 seconds). Each breath expands the ribcage into restricted tissue.','Return slowly to start (3 sec). Knees stayed together the ENTIRE time. If knees separated, lumbar spine rotated instead of thoracic — reset.'],mistakes:[{m:'Knees separating during rotation',f:'Squeeze a pillow or ball between knees. If knees separate, the range is coming from the wrong place.'},{m:'Forcing range with momentum',f:'Go to your available range, breathe there, come back. Range increases over weeks.'},{m:'Not breathing at end range',f:'3 deep breaths at end range. Feel the ribcage expand on the restricted side.'},{m:'Cervical extension (looking at ceiling)',f:'Follow hand with eyes but keep head supported by floor when possible. Don\'t crank the neck.'}],why:'Unlocks the thoracic rigidity that is a key component of poor posture. Poor thoracic rotation forces compensation at the cervical spine — triggering cervical compensation. Also forces compensation at the lumbar spine — additional stress on the lower back. Side-lying position mechanically locks the lumbar spine, ensuring rotation comes from the correct thoracic segments. The breathing component drives ribcage and fascial remodeling.',benefits:['scapular_stability','back_protection'],subs:[],movementPattern:'corrective',primaryMuscleGroup:'rehab',secondaryMuscleGroups:[],mechanic:'isolation',exerciseTier:'assistance',sfrRating:3,repRanges:{strength:{min:8,max:12,rest:60},hypertrophy:{min:12,max:15,rest:45},endurance:{min:15,max:25,rest:30}},recoveryImpact:{},progressionIds:[],regressionIds:[]},
 {id:'RH-07',name:'Ankle Alphabet',category:'rehab',subcategory:'ankle_mobility',muscles:{primary:{tibialis_anterior:50,peroneus_longus:45,peroneus_brevis:45},secondary:{gastrocnemius:20,soleus:20,tibialis_posterior:35,extensor_digitorum_longus:30}},equipment:['bodyweight'],location:{gym:true,home:true,work:true},tier:1,phase:{acute:{s:'suitable',p:4,n:'Gentle active ROM exercise. Pumps fluid through the joint, maintains mobility, activates all ankle musculature through full ROM. Can be done seated at work. Perfect for daily maintenance.'},subacute:{s:'suitable',p:3,n:'Continue as warm-up. Band around foot adds resistance.'},maintenance:{s:'suitable',p:2,n:'Warm-up before leg day. Lifelong ankle health.'}},sets:1,reps:'Full alphabet (A-Z) each foot',rest:0,tempo:'controlled',cues:['Sit with one leg crossed over the other (ankle on knee) or leg extended with foot off the edge of a surface.','Using ONLY your ankle (not your knee or hip), trace each letter of the alphabet in the air with your big toe.','Make the letters LARGE — exaggerate every movement. Use the full range of your ankle in every direction.','Go through the entire alphabet: A-B-C. all the way to Z. Then switch feet.',`This should take 2-3 minutes per foot. If any direction feels restricted or painful, note it — that's where the deficit is.`],mistakes:[{m:'Moving the whole leg instead of just the ankle',f:'Stabilize the shin with your hand if needed. Only the foot moves.'},{m:'Making letters too small',f:'Exaggerate. Capital letters. Use the entire range.'},{m:'Skipping painful directions',f:'Move GENTLY through restricted ranges. Not forcing, but not avoiding. Pain that increases = stop. Mild discomfort that resolves = push through gently.'}],why:'Active ROM through every plane of ankle motion. Addresses the multi-directional instability from recurrent sprains. Each letter is a unique combination of dorsiflexion/plantarflexion/inversion/eversion, training the ankle in unpredictable patterns — exactly what real-world ankle stability requires. Zero equipment, can be done at a desk.',benefits:['ankle_instability'],subs:['RH-08'],movementPattern:'corrective',primaryMuscleGroup:'rehab',secondaryMuscleGroups:[],mechanic:'isolation',exerciseTier:'assistance',sfrRating:5,repRanges:{strength:{min:8,max:12,rest:60},hypertrophy:{min:12,max:15,rest:45},endurance:{min:15,max:25,rest:30}},recoveryImpact:{},progressionIds:['RH-08'],regressionIds:[]},
 {id:'RH-08',name:'Band 4-Way Ankle (Eversion/Inversion/DF/PF)',category:'rehab',subcategory:'ankle_strengthening',muscles:{primary:{peroneus_longus:80,peroneus_brevis:75,tibialis_anterior:70,tibialis_posterior:65},secondary:{gastrocnemius:25,soleus:25,extensor_digitorum_longus:30}},equipment:['resistance_bands'],location:{gym:true,home:true,work:true},tier:1,phase:{acute:{s:'suitable',p:5,n:'HIGH PRIORITY. Peroneal weakness is the primary risk factor for recurrent ankle sprains. Light band. Eversion and dorsiflexion are the critical directions — inversion and plantarflexion are secondary. 2×15 each direction.'},subacute:{s:'suitable',p:4,n:'Heavier band. All four directions. Can combine with single-leg balance work.'},maintenance:{s:'suitable',p:3,n:'Warm-up before leg day. Lifelong ankle sprain prevention.'}},sets:2,reps:'15 each direction, each foot',rest:15,tempo:'2-1-2-0',cues:['Sit with leg extended, foot off edge of surface (or seated with foot on floor). Loop band around forefoot.','EVERSION (most important): Anchor band to inside, pull foot OUTWARD against resistance. Feel the muscles on the outside of your shin/ankle fire. 2-sec hold.','INVERSION: Anchor band to outside, pull foot INWARD. Feel inside ankle muscles. Controlled.','DORSIFLEXION: Anchor band in front, pull toes toward shin. Feel front of shin.','PLANTARFLEXION: Anchor behind foot, push toes away. Feel calf engage. Light resistance — this direction is already strong from walking.'],mistakes:[{m:'Rotating the whole leg instead of just the foot',f:'Stabilize shin with hand or against a surface. Only the foot/ankle moves.'},{m:'Skipping eversion',f:'If you only do one direction, make it eversion. Double the volume on eversion compared to other directions if time-limited.'},{m:'Band too heavy (compensating with hip)',f:'Light band. The ankle should be able to complete 15 reps with controlled 2-sec holds. If not, lighter band.'},{m:'Fast, uncontrolled reps',f:'2-second movement, 1-second hold, 2-second return. Every rep identical.'}],why:'Directly strengthens the muscles that prevent ankle sprains (peroneals). Recurrent ankle sprains indicate peroneal weakness or delayed activation. Band work rebuilds this strength in a controlled, progressive way. 4-way approach ensures all ankle stabilizers are addressed, not just the obvious ones.',benefits:['ankle_instability'],subs:['RH-07'],movementPattern:'corrective',primaryMuscleGroup:'rehab',secondaryMuscleGroups:[],mechanic:'isolation',exerciseTier:'assistance',sfrRating:4,repRanges:{strength:{min:8,max:12,rest:60},hypertrophy:{min:12,max:15,rest:45},endurance:{min:15,max:25,rest:30}},recoveryImpact:{},progressionIds:[],regressionIds:['RH-07']},
 {id:'RH-09',name:'Prone Y/T/W Raise',category:'rehab',subcategory:'scapular_strengthening',muscles:{primary:{lower_trapezius:85,middle_trapezius:80,rhomboids:50},secondary:{infraspinatus:40,teres_minor:35,posterior_deltoid:45,serratus_anterior:30}},equipment:['bodyweight'],location:{gym:true,home:true,work:false},tier:1,phase:{acute:{s:'suitable',p:5,n:' Y-raise endurance (15+ reps without anterior shoulder pain) and T-raise (20+ reps without compensation) are PHASE TRANSITION CRITERIA. Start prone on incline bench to reduce gravitational demand. Thumbs UP.'},subacute:{s:'suitable',p:5,n:'Should be passing Y-raise test by now. Add light weight (1-3 lbs). All three positions each session.'},maintenance:{s:'suitable',p:4,n:'Warm-up before pressing. Light weight. 5-8 lb max. Moderate reps.'}},sets:2,reps:'10-15 each position',rest:30,tempo:'2-2-2-0',cues:['Lie face down on incline bench (30-45°) or flat on floor with forehead on towel. Arms hanging straight down.','Y-RAISE: Thumbs UP. Lift arms to ~120° angle (Y shape). Focus on squeezing lower traps (bottom of shoulder blades toward spine). Hold 2 sec at top.','T-RAISE: Thumbs UP. Lift arms to 90° (T shape). Squeeze middle traps (shoulder blades together). Hold 2 sec. Do NOT shrug — depress throughout.','W-RAISE: Elbows bent 90°, pull elbows back and squeeze shoulder blades together + externally rotate (fists rotate outward). This is scapular retraction + external rotation combined.','All three: THUMBS UP orientation. This externally rotates the humerus, creating more shoulder space (reduces impingement risk). Thumbs down = impingement risk.'],mistakes:[{m:'Shrugging (upper trap firing)',f:'Depress scapulae BEFORE lifting. Think \'shoulder blades into back pockets.\' If you feel neck muscles engaging, weight is too heavy (even bodyweight — use incline bench to reduce load).'},{m:'Anterior shoulder pain during Y-raise',f:'REDUCE ROM (don\'t go as high). Use incline bench to reduce gravitational load. If pain persists, skip Y-raise temporarily and focus on T and W until shoulder stabilizers improve.'},{m:'Using momentum',f:'2-sec raise, 2-sec hold, 2-sec lower. Every rep. No swinging.'},{m:'Lat compensation on T-raise',f:'Thumbs UP forces external rotation, reducing lat ability to contribute. If you feel lats firing (muscles under your armpit), reduce ROM or switch to W-raise.'}],why:'Simultaneously Failed Y-raise (11 reps, anterior pain) and T-raise (15 reps, lat compensation) build the scapular endurance needed for progression. Phase transition criteria are directly tied to performance on these exact movements.',benefits:['scapular_stability'],subs:[],movementPattern:'corrective',primaryMuscleGroup:'rehab',secondaryMuscleGroups:[],mechanic:'isolation',exerciseTier:'assistance',sfrRating:5,repRanges:{strength:{min:8,max:12,rest:60},hypertrophy:{min:12,max:15,rest:45},endurance:{min:15,max:25,rest:30}},recoveryImpact:{},progressionIds:[],regressionIds:[]},
 {id:'RH-10',name:'Band Pull-Apart (Retraction Focus)',category:'rehab',subcategory:'scapular_strengthening',muscles:{primary:{middle_trapezius:75,rhomboids:70,posterior_deltoid:60},secondary:{lower_trapezius:45,infraspinatus:35,teres_minor:30}},equipment:['resistance_bands'],location:{gym:true,home:true,work:true},tier:1,phase:{acute:{s:'suitable',p:5,n:'Key scapular retraction drill. Retrains mid/lower trap to fire without upper trap compensation. Light band. High reps. With DEPRESSION cue. Can be done between sets of pressing exercises as a superset.'},subacute:{s:'suitable',p:4,n:'Heavier band. Integrate into pressing supersets.'},maintenance:{s:'suitable',p:3,n:'Warm-up and inter-set activation. Lifelong maintenance for desk worker.'}},sets:3,reps:'15-20',rest:30,tempo:'2-2-2-0',cues:['Stand tall. Hold band at chest height, arms extended in front, shoulder-width grip. Light band.','BEFORE pulling: DEPRESS scapulae (shoulder blades DOWN, not just back). This is the critical pre-set cue.','Pull band apart by squeezing shoulder blades TOGETHER and DOWN. Arms move laterally, elbows stay nearly straight.','At full retraction: shoulder blades are squeezed together, chest is open, shoulders are DOWN (not shrugged). Hold 2 seconds.',`Return slowly (2 sec) — don't let band snap arms forward. Maintain depression even during the return phase.`],mistakes:[{m:'Shrugging during the pull (upper trap firing)',f:'DEPRESS before, during, and after. Think \'put shoulder blades in back pockets while squeezing them together.\' If neck muscles engage, reduce band tension.'},{m:'Using elbow flexion (rowing the band)',f:'Arms stay nearly straight. Only very slight elbow bend. Movement comes entirely from scapulae.'},{m:'Band too heavy',f:'LIGHT band. Should easily do 15-20 reps with perfect form. If you can\'t hold 2-sec squeeze at end range, too heavy.'},{m:'Forward head posture during exercise',f:'Pack chin slightly. Stand against wall if needed to maintain head position.'}],why:'Scapular retraction + depression retraining with minimal equipment. Can be done between ANY exercise as an inter-set activation drill. The depression cue specifically targets the lower/middle trap over upper trap — directly counteracting the demonstrated dominance pattern. Desk workers should do these multiple times per day.',benefits:['scapular_stability'],subs:['RH-09'],movementPattern:'corrective',primaryMuscleGroup:'rehab',secondaryMuscleGroups:[],mechanic:'isolation',exerciseTier:'assistance',sfrRating:4,repRanges:{strength:{min:8,max:12,rest:60},hypertrophy:{min:12,max:15,rest:45},endurance:{min:15,max:25,rest:30}},recoveryImpact:{},progressionIds:[],regressionIds:[]},
 {id:'RH-11',name:'Pallof Press (Anti-Rotation)',category:'rehab',subcategory:'anti_rotation_core',muscles:{primary:{transverse_abdominis:80,internal_obliques:75,external_obliques:75},secondary:{rectus_abdominis:40,gluteus_medius:30,hip_adductors:20}},equipment:['cable_machine','resistance_bands'],location:{gym:true,home:true,work:false},tier:2,phase:{acute:{s:'suitable',p:4,n:'Progress from dead bugs (RH-03) to this once anti-extension is solid. Half-kneeling version preferred — adds hip flexor stretch. Light cable/band. Replaces any rotational core exercise (Russian twists, etc.).'},subacute:{s:'suitable',p:5,n:'Standing version. Moderate resistance. Key functional core exercise.'},maintenance:{s:'suitable',p:5,n:'Heavy cable. All positions. Core cornerstone exercise.'}},sets:3,reps:'10-12 each side (or 20-30 sec holds)',rest:45,tempo:'2-3-2-0',cues:['Cable or band at chest height. Stand (or half-kneel) sideways to anchor point. Hold handle at chest with both hands.','HALF-KNEELING (preferred): inside knee down, outside knee up. Tuck pelvis into posterior tilt. Feel hip flexor of down-leg stretch.',`Press hands straight out from chest. As arms extend, the rotational pull INCREASES (longer lever arm). Your core resists — don't let your torso rotate.`,`Hold extended position 3 seconds. Shoulders and hips stay SQUARE (facing forward). The cable tries to pull you — you don't move.`,`Return hands to chest slowly (2 sec). That's one rep. All reps one side, then switch.`],mistakes:[{m:'Allowing rotation (twisting toward cable)',f:'Lighter weight. Square your belt buckle to the wall in front of you. It stays there.'},{m:'Compensating with arms instead of core',f:'Lock shoulders in place. The press-out increases core demand, not arm demand. Arms straight, core braced.'},{m:'Anterior pelvic tilt in half-kneeling',f:'Posterior tilt FIRST. Squeeze down-leg glute. Then begin pressing. If tilt is lost, cable is too heavy.'},{m:'Holding breath',f:'Breathe normally during the 3-sec hold. This is HARDER but more functional than breath-holding.'}],why:'Anti-rotation is the most functionally relevant core training pattern. Replaces Russian twists (spinal rotation under load = disc risk). Half-kneeling version simultaneously trains core anti-rotation AND stretches hip flexor — two benefits in one. Progression from dead bugs (anti-extension) to Pallof (anti-rotation) builds comprehensive core stability.',benefits:['anterior_pelvic_tilt','anti_extension_core','back_protection'],subs:['RH-03'],movementPattern:'core_anti_rotation',primaryMuscleGroup:'rehab',secondaryMuscleGroups:[],mechanic:'isolation',exerciseTier:'assistance',sfrRating:4,repRanges:{strength:{min:8,max:12,rest:60},hypertrophy:{min:12,max:15,rest:45},endurance:{min:15,max:25,rest:30}},recoveryImpact:{},progressionIds:[],regressionIds:['RH-03']},
 {id:'RH-12',name:'Bird Dog',category:'rehab',subcategory:'anti_extension_core',muscles:{primary:{transverse_abdominis:70,erector_spinae:55,gluteus_maximus:50},secondary:{rectus_abdominis:35,posterior_deltoid:30,lower_trapezius:30,gluteus_medius:40}},equipment:['bodyweight'],location:{gym:true,home:true,work:true},tier:1,phase:{acute:{s:'suitable',p:4,n:'Complements dead bugs. Dead bugs are supine anti-extension; bird dogs are quadruped anti-extension + anti-rotation. Start with arm-only or leg-only if full contralateral is too challenging. Monitor for lumbar sagging.'},subacute:{s:'suitable',p:4,n:'Full contralateral extension. Hold longer (5 sec). Band around foot.'},maintenance:{s:'suitable',p:3,n:'Warm-up. Banded or weighted.'}},sets:2,reps:'8-10 each side',rest:30,tempo:'3-3-3-0',cues:['Quadruped (hands and knees). Hands under shoulders, knees under hips. Spine neutral — imagine a glass of water on your lower back.',`Brace core gently — like preparing to be poked in the stomach. Don't hold breath.`,'SLOWLY extend right arm forward and left leg back simultaneously. 3-second extension. Thumb up on extending hand (external rotation cue).',`At full extension: arm, torso, and leg form ONE straight line. HOLD 3 seconds. Don't let lower back sag or hips rotate.`,`Return to quadruped slowly (3 sec). Switch sides. The glass of water never spills — pelvis doesn't move.`],mistakes:[{m:'Lower back sagging into extension',f:'Brace abs. Think about pulling belly button toward spine. If back sags, reduce limb extension range.'},{m:'Pelvis rotating during leg extension',f:'Imagine the glass of water on your back. Both hip bones stay pointing down at the floor. If hips rotate, strengthen glute med more before progressing bird dogs.'},{m:'Rushing through reps',f:'3-sec extend, 3-sec HOLD, 3-sec return. This is deliberately slow.'},{m:'Neck hyperextension (looking forward)',f:'Gaze at floor directly below face. Neutral cervical spine.'}],why:'Quadruped anti-extension and anti-rotation combined — directly promotes good posture and core stability. Complements supine dead bugs by training the same core stability in a different position. The contralateral limb movement pattern mimics walking mechanics — training the core to stabilize during reciprocal limb movement. Glute fires during leg extension, reinforcing glute activation. Anti-rotation component trains the obliques that stabilize against the lateral hip instability.',benefits:['anterior_pelvic_tilt','anti_extension_core','glute_med_activation'],subs:['RH-03'],movementPattern:'core_anti_extension',primaryMuscleGroup:'rehab',secondaryMuscleGroups:[],mechanic:'isolation',exerciseTier:'assistance',sfrRating:5,repRanges:{strength:{min:8,max:12,rest:60},hypertrophy:{min:12,max:15,rest:45},endurance:{min:15,max:25,rest:30}},recoveryImpact:{},progressionIds:[],regressionIds:['RH-03']},
];

// ============================================================
// YOUTUBE VIDEO LINKS — extracted from verified audit PDF
// Direct YouTube links mapped from 102-exercise audit
// ============================================================
const VIDEO_URLS = {
 // === CHEST ===
 'CH-01': 'https://www.youtube.com/watch?v=Y_7aHq13HG8', // Flat DB Press (Scott Herman 3:30)
 'CH-02': 'https://www.youtube.com/watch?v=8iPEnn-ltC8', // Incline DB Press (Scott Herman 2:55)
 'CH-03': 'https://www.youtube.com/watch?v=M2T-1M7M7R8', // Low-to-High Cable Fly (Scott Herman 2:30)
 'CH-04': 'https://www.youtube.com/watch?v=rT7DgCr-3pg', // Machine/Barbell Bench Press (Scott Herman 4:15)
 'CH-05': 'https://www.youtube.com/watch?v=IODxDxX7oi4', // Push Up (Calisthenicmovement 3:45)
 'CH-06': 'https://www.youtube.com/watch?v=Y_7aHq13HG8', // Floor Press → uses Flat DB Press form
 'CH-07': 'https://www.youtube.com/watch?v=Iwe6AmxVf7o', // Flat DB Fly → Cable Fly H2L (similar fly pattern)
 'CH-08': 'https://www.youtube.com/watch?v=O-On_K76cjo', // Pec Deck Machine (Scott Herman 2:10)
 'CH-09': 'https://www.youtube.com/watch?v=Iwe6AmxVf7o', // Cable Crossover → Cable Fly H2L (Scott Herman 2:45)
 'CH-10': 'https://www.youtube.com/watch?v=6_HCp_2Fv4I', // Squeeze/Hex Press (Scott Herman 2:00)
 'CH-11': 'https://www.youtube.com/watch?v=2z8JmcrW-As', // Chest Dip (Scott Herman 3:15)
 'CH-12': 'https://www.youtube.com/watch?v=F488k67btNo', // Dumbbell Pullover Chest Focus (Scott Herman)

 // === SHOULDERS ===
 'SH-01': 'https://www.youtube.com/watch?v=I02Xf51g7ms', // Landmine Press (Scott Herman 2:40)
 'SH-02': 'https://www.youtube.com/watch?v=eIq5CB9SsZQ', // Face Pull (Scott Herman 3:45)
 'SH-03': 'https://www.youtube.com/watch?v=3VcKaXpzqRo', // Cable Lateral Raise (Scott Herman 2:51)
 'SH-04': 'https://www.youtube.com/watch?v=0G38Jc7JjZk', // Reverse Cable Fly (Scott Herman 2:35)
 'SH-05': 'https://www.youtube.com/watch?v=fo35J2f8s1I', // Band Pull-Apart (Scott Herman)
 'SH-06': 'https://www.youtube.com/watch?v=QdGTI4Lshg4', // Prone YTW (Rehab Science)
 'SH-07': 'https://www.youtube.com/watch?v=3VcKaXpzqRo', // Lateral Raise Machine → Lateral Raise form (Scott Herman 2:51)
 'SH-08': 'https://www.youtube.com/watch?v=qEwKCR5JCog', // HK DB Press → Seated DB Press form (Scott Herman 2:45)
 'SH-09': 'https://www.youtube.com/watch?v=3VcKaXpzqRo', // Band/DB Lateral Raise → Lateral Raise (Scott Herman 2:51)

 // === BACK ===
 'BK-01': 'https://www.youtube.com/watch?v=pYcpY20QaE8', // Chest-Supported Row → Single Arm DB Row (Scott Herman 2:40)
 'BK-02': 'https://www.youtube.com/watch?v=CAwf7n6Luuc', // Lat Pulldown (Scott Herman 2:45)
 'BK-03': 'https://www.youtube.com/watch?v=GjYyrNbdHUE', // Pullover → Straight Arm Pulldown (Scott Herman 2:15)
 'BK-04': 'https://www.youtube.com/watch?v=f_r95UajQcg', // Seated Cable Row (Scott Herman 2:23)
 'BK-05': 'https://www.youtube.com/watch?v=pYcpY20QaE8', // Single-Arm DB Row (Scott Herman 2:40)
 'BK-06': 'https://www.youtube.com/watch?v=VO-pt_XgFho', // Inverted Row (Scott Herman 2:33)
 'BK-07': 'https://www.youtube.com/watch?v=GjYyrNbdHUE', // Straight-Arm Cable Pulldown (Scott Herman 2:15)
 'BK-08': 'https://www.youtube.com/watch?v=j3Igk5nyZE4', // Landmine Row → T-Bar Row (Scott Herman 2:55)
 'BK-09': 'https://www.youtube.com/watch?v=VO-pt_XgFho', // Band/BW Back → Inverted Row (Scott Herman 2:33)

 // === TRICEPS ===
 'TR-01': 'https://www.youtube.com/watch?v=YbX7Wd8jQ-Q', // Overhead Cable Ext → OH Extension DB (Scott Herman 2:50)
 'TR-02': 'https://www.youtube.com/watch?v=-xa-6cQaZKY', // Cable Pushdown Rope (Scott Herman 2:30)
 'TR-03': 'https://www.youtube.com/watch?v=OYoc93qAAEY', // Close-Grip Bench (Scott Herman 3:15)
 'TR-04': 'https://www.youtube.com/watch?v=YbX7Wd8jQ-Q', // Single-Arm OH DB Ext (Scott Herman 2:50)
 'TR-05': 'https://www.youtube.com/watch?v=IODxDxX7oi4', // Diamond Push-Up → Push Up form (Calisthenicmovement 3:45)
 'TR-06': 'https://www.youtube.com/watch?v=qMQwM1Fv8gM', // Cross-Body Cable Extension
 'TR-07': 'https://www.youtube.com/watch?v=2z8JmcrW-As', // Dips Tricep → Dips (Scott Herman 3:15)

 // === BICEPS ===
 'BI-01': 'https://www.youtube.com/watch?v=ykJmrZ5v0Oo', // Incline DB Curl → DB Curl Supinating (Scott Herman 2:55)
 'BI-02': 'https://www.youtube.com/watch?v=XOEL4MgekYE', // Hammer Curl (Scott Herman 2:37)
 'BI-03': 'https://www.youtube.com/watch?v=fIWP-FRFNU0', // Preacher Curl (Scott Herman 2:45)
 'BI-04': 'https://www.youtube.com/watch?v=NFzTWp2qpiE', // Cable Curl (Scott Herman 2:15)
 'BI-05': 'https://www.youtube.com/watch?v=0AUGkch3tzc', // Concentration Curl (Scott Herman 2:20)
 'BI-06': 'https://www.youtube.com/watch?v=kwG2ipFRgfo', // Band Curl → Barbell Curl form (Scott Herman 3:00)

 // === QUADS ===
 'QD-01': 'https://www.youtube.com/watch?v=MeIiIdhvXT4', // Goblet Squat (Scott Herman 2:40)
 'QD-02': 'https://www.youtube.com/watch?v=IZxyjW7MPJQ', // Leg Press (Scott Herman 3:00)
 'QD-03': 'https://www.youtube.com/watch?v=YyvSfVjQeL0', // Leg Extension (Scott Herman 2:10)
 'QD-04': 'https://www.youtube.com/watch?v=dQqApCGd5Ss', // Peterson Step-Up → Step Up (Scott Herman 2:30)
 'QD-05': 'https://www.youtube.com/watch?v=2C-uNgKwPLE', // Bulgarian Split Squat (Scott Herman 3:15)
 'QD-06': 'https://www.youtube.com/watch?v=M2_o3s9_6M8', // Sissy Squat (Scott Herman)
 'QD-07': 'https://www.youtube.com/watch?v=2C-uNgKwPLE', // FFE Split Squat → Bulgarian form (Scott Herman 3:15)
 'QD-08': 'https://www.youtube.com/watch?v=PZilDfWpxWQ', // Pistol Squat Progression (Squat University)

 // === HAMSTRINGS ===
 'HM-01': 'https://www.youtube.com/watch?v=JCXUYuzwNrM', // DB Romanian Deadlift (Scott Herman 3:45)
 'HM-02': 'https://www.youtube.com/watch?v=F488k67BTNo', // Seated Leg Curl (Scott Herman 2:15)
 'HM-03': 'https://www.youtube.com/watch?v=1Tq3QdYUuHs', // Lying Leg Curl (Scott Herman 2:20)
 'HM-04': 'https://www.youtube.com/watch?v=R1OXPHRqehw', // Glute-Ham Bridge → Glute Bridge (Scott Herman 2:25)
 'HM-05': 'https://www.youtube.com/watch?v=7g9s6fK4gO0', // Single-Leg RDL (Scott Herman 2:55)
 'HM-06': 'https://www.youtube.com/watch?v=1Tq3QdYUuHs', // Band Ham Curl → Lying Leg Curl form (Scott Herman 2:20)

 // === GLUTES ===
 'GL-01': 'https://www.youtube.com/watch?v=pF17m_CXfL0', // Hip Thrust (Scott Herman 3:30)
 'GL-02': 'https://www.youtube.com/watch?v=R1OXPHRqehw', // Glute Bridge (Scott Herman 2:25)
 'GL-03': 'https://www.youtube.com/watch?v=G_8L4M8J9tE', // Side-Lying Hip Abd → Hip Abduction Machine (Scott Herman 2:00)
 'GL-04': 'https://www.youtube.com/watch?v=mD0VjjD5H1U', // Clamshell (Rehab Science)
 'GL-05': 'https://www.youtube.com/watch?v=ki_gJdfuAjs', // Cable Pull-Through (Scott Herman 2:40)
 'GL-06': 'https://www.youtube.com/watch?v=G_8L4M8J9tE', // Banded Lateral Walk → Hip Abduction (Scott Herman 2:00)
 'GL-07': 'https://www.youtube.com/watch?v=dQqApCGd5Ss', // Step-Up Low Platform (Scott Herman 2:30)
 'GL-08': 'https://www.youtube.com/watch?v=NLzC0x4a0tY', // HK Cable Hip Ext → Cable Kickback (Scott Herman 2:30)
 'GL-09': 'https://www.youtube.com/watch?v=Du6tU5B6a9Q', // Kas Glute Bridge (Coach Mark Carroll)
 'GL-10': 'https://www.youtube.com/watch?v=C_BcdF0OceM', // B-Stance RDL (Squat University)
 'GL-11': 'https://www.youtube.com/watch?v=ZeI0Yd3s3k8', // Reverse Hyperextension on bench (Athlean-X)
 'GL-12': 'https://www.youtube.com/watch?v=op9kVnSso6Q', // Cable Pull Through (Scott Herman)

 // === CALVES ===
 'CV-01': 'https://www.youtube.com/watch?v=JbyjNymZOtI', // Seated Calf Raise (Scott Herman 2:15)
 'CV-02': 'https://www.youtube.com/watch?v=qPd73snQfUs', // Standing Calf Raise (Scott Herman 2:10)
 'CV-03': 'https://www.youtube.com/watch?v=qPd73snQfUs', // Single-Leg Calf → Standing Calf (Scott Herman 2:10)
 'CV-04': 'https://www.youtube.com/watch?v=84D98J5c5ms', // Standing Calf Raise Smith Machine (Scott Herman)

 // === CORE ===
 'CO-01': 'https://www.youtube.com/watch?v=I5xbsA71v1A', // Dead Bug (Squat University)
 'CO-02': 'https://www.youtube.com/watch?v=5_Zk2hO22uY', // Pallof Press (Scott Herman 2:30)
 'CO-03': 'https://www.youtube.com/watch?v=wiFNA3sqjCA', // Bird Dog (Squat University)
 'CO-04': 'https://www.youtube.com/watch?v=5_qMHj81XAI', // Pallof Press (Scott Herman)
 'CO-05': 'https://www.youtube.com/watch?v=ynUw0YsrmSg', // Side Plank → Plank (Scott Herman 2:30)
 'CO-06': 'https://www.youtube.com/watch?v=I5T0c2b2Jt8', // Body Saw/Rollout → Ab Wheel (Scott Herman 3:00)
 'CO-07': 'https://www.youtube.com/watch?v=pqlU0aF9q9E', // Cable Chop → Woodchopper (Scott Herman 2:40)
 'CO-08': 'https://www.youtube.com/watch?v=pqlU0aF9q9E', // Cable Lift → Woodchopper reverse (Scott Herman 2:40)
 'CO-09': 'https://www.youtube.com/watch?v=hdng3xm1xbs', // Hanging Leg Raise (Calisthenicmovement)
 'CO-10': 'https://www.youtube.com/watch?v=rqIiYL-7U6c', // Ab Wheel Rollout (Scott Herman)
 'CO-11': 'https://www.youtube.com/watch?v=iCqpUv_7h1s', // Stomach Vacuum
 'CO-12': 'https://www.youtube.com/watch?v=ynUw0YsrmSg', // Plank Shoulder Tap → Plank (Scott Herman 2:30)

 // === NECK ===
 'NK-01': 'https://www.youtube.com/watch?v=S0T8o2R70fM', // Chin Tuck → Neck Flexion (Scott Herman)
 'NK-02': 'https://www.youtube.com/watch?v=tT83n9pT_V8', // Cervical Isometrics → Lateral Neck Flexion (Rehab Science)
 'NK-03': 'https://www.youtube.com/watch?v=cJRVDUqo6Co', // Upper Trap Stretch → Shrugs (Scott Herman)
 'NK-04': 'https://www.youtube.com/watch?v=Lq1zNq450ts', // Thoracic Extension (Rehab Science)
 'NK-05': 'https://www.youtube.com/watch?v=S0T8o2R70fM', // Cervical Retraction → Neck Flexion (Scott Herman)

 // === REHAB ===
 'RH-01': 'https://www.youtube.com/watch?v=Nn7M4O8R1oY', // Couch Stretch → Hip 90/90 mobility (Squat University)
 'RH-02': 'https://www.youtube.com/watch?v=d6V2Exzb324', // Floor Slides → Wall Slide (Squat University)
 'RH-03': 'https://www.youtube.com/watch?v=I5xbsA71v1A', // Dead Bug Progressive (Squat University)
 'RH-04': 'https://www.youtube.com/watch?v=eIq5CB9SsZQ', // Face Pull for Rehab (Scott Herman 3:45)
 'RH-05': 'https://www.youtube.com/watch?v=hojO6PJ8j8j', // Scapular Push-Up → Scapular Pull Up (Calisthenicmovement)
 'RH-06': 'https://www.youtube.com/watch?v=Lq1zNq450ts', // Thoracic Rotation → Thoracic Extension (Rehab Science)
 'RH-07': 'https://www.youtube.com/watch?v=IikP_ScSyd4', // Ankle Alphabet → Ankle Dorsiflexion (Squat University)
 'RH-08': 'https://www.youtube.com/watch?v=IikP_ScSyd4', // Band 4-Way Ankle → Ankle Dorsiflexion (Squat University)
 'RH-09': 'https://www.youtube.com/watch?v=QdGTI4Lshg4', // Prone Y/T/W Raise (Rehab Science)
 'RH-10': 'https://www.youtube.com/watch?v=fo35J2f8s1I', // Band Pull-Apart (Scott Herman)
 'RH-11': 'https://www.youtube.com/watch?v=5_Zk2hO22uY', // Pallof Press (Scott Herman 2:30)
 'RH-12': 'https://www.youtube.com/watch?v=wiFNA3sqjCA', // Bird Dog (Squat University)
};

// All 102 exercises now have direct YouTube video links — no search fallbacks needed
const SEARCH_FALLBACKS = {};

function getVideoUrl(exerciseId, exerciseName) {
 const direct = VIDEO_URLS[exerciseId];
 if (direct) return direct;
 const q = SEARCH_FALLBACKS[exerciseId] || `${exerciseName} form tutorial how to`;
 return `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`;
}



const UPPER_CATEGORIES = new Set(['chest', 'shoulders', 'back', 'triceps', 'biceps']);

// ============================================================
// VOLUME LANDMARKS (sets/week, intermediate defaults)
// ============================================================

const VOLUME_LANDMARKS = {
 chest: { mv: 3, mev: 5, mavLow: 6, mavHigh: 16, mrv: 22, freq: [1.5, 3], subgroups: null },
 back: { mv: 4, mev: 7, mavLow: 8, mavHigh: 20, mrv: 25, freq: [2, 4], subgroups: {
 horizontal_pull: { targetPct: 0.5 }, vertical_pull: { targetPct: 0.5 }
 }},
 quads: { mv: 5, mev: 7, mavLow: 8, mavHigh: 18, mrv: 23, freq: [1.5, 3], subgroups: null },
 hamstrings: { mv: 3, mev: 5, mavLow: 6, mavHigh: 14, mrv: 20, freq: [2, 3], subgroups: {
 hip_hinge: { targetPct: 0.5 }, isolation_lower: { targetPct: 0.5 }
 }},
 glutes: { mv: 0, mev: 1, mavLow: 2, mavHigh: 12, mrv: 16, freq: [2, 3], subgroups: null },
 side_delts: { mv: 4, mev: 7, mavLow: 8, mavHigh: 24, mrv: 30, freq: [2, 6], subgroups: null },
 rear_delts: { mv: 0, mev: 2, mavLow: 4, mavHigh: 12, mrv: 20, freq: [2, 6], subgroups: null },
 shoulders: { mv: 0, mev: 0, mavLow: 4, mavHigh: 8, mrv: 12, freq: [1, 2], subgroups: null },
 biceps: { mv: 3, mev: 5, mavLow: 8, mavHigh: 20, mrv: 26, freq: [2, 6], subgroups: null },
 triceps: { mv: 3, mev: 5, mavLow: 6, mavHigh: 14, mrv: 18, freq: [2, 4], subgroups: null },
 calves: { mv: 5, mev: 7, mavLow: 8, mavHigh: 16, mrv: 20, freq: [2, 4], subgroups: null },
 core: { mv: 0, mev: 1, mavLow: 4, mavHigh: 16, mrv: 25, freq: [3, 5], subgroups: {
 core_anti_extension: { targetPct: 0.4 }, core_anti_rotation: { targetPct: 0.3 }, core_flexion: { targetPct: 0.3 }
 }},
};

function getAdjustedLandmarks(muscle, experienceLevel = 'intermediate') {
 const base = VOLUME_LANDMARKS[muscle];
 if (!base) return null;
 if (experienceLevel === 'intermediate') return base;
 const shift = experienceLevel === 'beginner'
 ? { mev: -3, mavLow: -2, mavHigh: -3, mrv: -5 }
 : { mev: 3, mavLow: 2, mavHigh: 3, mrv: 3 };
 return {
.base,
 mev: Math.max(base.mv, base.mev + shift.mev),
 mavLow: Math.max(base.mv + 1, base.mavLow + shift.mavLow),
 mavHigh: Math.max(base.mavLow, base.mavHigh + shift.mavHigh),
 mrv: Math.max(base.mavHigh, base.mrv + shift.mrv),
 };
}

// ============================================================
// MUSCLE BALANCE ANALYSIS
// ============================================================

const EXERCISE_MAP = {};
EXERCISES.forEach(e => { EXERCISE_MAP[e.id] = e; });

function computeWeightedMuscleVolume(settings) {
 const result = {};
 const now = new Date;
 const firstDay = settings?.firstDayOfWeek ?? 0;
 const weekStart = new Date(now);
 const currentDay = weekStart.getDay;
 const daysBack = (currentDay - firstDay + 7) % 7;
 weekStart.setDate(weekStart.getDate - daysBack);
 weekStart.setHours(0, 0, 0, 0);

 const keys = LS.keys('workout:');
 for (const key of keys) {
 const dateStr = key.replace('workout:', '');
 if (new Date(dateStr) < weekStart) continue;
 const exercises = getWorkoutExercises(LS.get(key, null));
 for (const ex of exercises) {
 const doneSets = (ex.logSets || []).filter(s => s.done).length;
 if (doneSets === 0) continue;
 const def = EXERCISE_MAP[ex.id];
 if (!def?.muscles) continue;
 const allMuscles = {.(def.muscles.primary || {}),.(def.muscles.secondary || {}) };
 for (const [muscle, pct] of Object.entries(allMuscles)) {
 if (!result[muscle]) result[muscle] = { weightedSets: 0, rawSets: 0, exerciseContributions: [] };
 const weighted = doneSets * (pct / 100);
 result[muscle].weightedSets += weighted;
 result[muscle].rawSets += doneSets;
 result[muscle].exerciseContributions.push({ id: ex.id, name: def.name, sets: doneSets, pct });
 }
 }
 }
 // Round for display
 for (const m of Object.values(result)) m.weightedSets = Math.round(m.weightedSets * 10) / 10;
 return result;
}

const MUSCLE_PAIRS = [
 { name: 'Front vs Rear Delts', muscleA: ['anterior_deltoid'], muscleB: ['posterior_deltoid'], labelA: 'Front Delts', labelB: 'Rear Delts', threshold: 2.5 },
 { name: 'Chest vs Upper Back', muscleA: ['pec_major_sternal', 'pec_major_clavicular'], muscleB: ['middle_trapezius', 'rhomboids', 'lower_trapezius'], labelA: 'Chest', labelB: 'Upper Back', threshold: 2 },
 { name: 'Biceps vs Triceps', muscleA: ['biceps_long_head', 'biceps_short_head', 'brachialis'], muscleB: ['triceps_long_head', 'triceps_lateral_head', 'triceps_medial_head'], labelA: 'Biceps', labelB: 'Triceps', threshold: 2 },
 { name: 'Quads vs Hamstrings', muscleA: ['rectus_femoris', 'vastus_lateralis', 'vastus_medialis', 'vastus_intermedius'], muscleB: ['biceps_femoris', 'semitendinosus', 'semimembranosus'], labelA: 'Quads', labelB: 'Hamstrings', threshold: 2.5 },
 { name: 'Lateral Deltoid', muscleA: ['lateral_deltoid'], muscleB: null, labelA: 'Side Delts', labelB: null, threshold: null },
];

function sumWeighted(vol, muscles) {
 return muscles.reduce((s, m) => s + (vol[m]?.weightedSets || 0), 0);
}

function analyzeMuscleBalance(weightedVolume) {
 const pairs = [];
 const undertrained = [];

 for (const pair of MUSCLE_PAIRS) {
 const valA = sumWeighted(weightedVolume, pair.muscleA);

 // Standalone muscle check (e.g., lateral deltoid)
 if (!pair.muscleB) {
 if (valA < 2) {
 undertrained.push({ muscle: pair.labelA, weightedSets: valA, recommendation: findRecommendation(pair.muscleA) });
 }
 continue;
 }

 const valB = sumWeighted(weightedVolume, pair.muscleB);
 const max = Math.max(valA, valB);
 const min = Math.max(valA, valB) === valA ? valB : valA;
 const ratio = min > 0 ? Math.round((max / min) * 10) / 10 : (max > 0 ? Infinity : 1);
 const dominant = valA >= valB ? 'A' : 'B';
 const balanced = ratio <= pair.threshold;

 let recommendation = '';
 if (!balanced) {
 const weakLabel = dominant === 'A' ? pair.labelB : pair.labelA;
 const weakMuscles = dominant === 'A' ? pair.muscleB : pair.muscleA;
 recommendation = `${weakLabel} undertrained — ${findRecommendation(weakMuscles)}`;
 }

 pairs.push({
 name: pair.name, labelA: pair.labelA, labelB: pair.labelB,
 valA: Math.round(valA * 10) / 10, valB: Math.round(valB * 10) / 10,
 ratio, dominant, balanced, recommendation,
 });
 }

 return { pairs, undertrained };
}

function findRecommendation(targetMuscles) {
 const suggestions = [];
 for (const ex of EXERCISES) {
 if (!ex.muscles?.primary) continue;
 for (const m of targetMuscles) {
 if ((ex.muscles.primary[m] || 0) >= 50) {
 suggestions.push(ex.name);
 break;
 }
 }
 if (suggestions.length >= 3) break;
 }
 return suggestions.length > 0 ? `try ${suggestions.join(', ')}` : 'add isolation work';
}


// ============================================================
// STORAGE HELPERS
// ============================================================

const _memoryStore = {};
const _lsAvailable = ( => {
 try { localStorage.setItem('__test__', '1'); localStorage.removeItem('__test__'); return true; }
 catch { return false; }
});

const LS = {
 get(key, fallback) {
 try {
 if (_lsAvailable) {
 const v = localStorage.getItem(key);
 return v ? JSON.parse(v) : fallback;
 }
 return key in _memoryStore ? JSON.parse(_memoryStore[key]) : fallback;
 } catch { return fallback; }
 },
 set(key, value) {
 try {
 const json = JSON.stringify(value);
 if (_lsAvailable) localStorage.setItem(key, json);
 else _memoryStore[key] = json;
 return true;
 } catch(e) {
 console.error('Storage error:', e);
 // Surface quota errors so the app can warn the user
 if (e.name === 'QuotaExceededError' || e.code === 22) {
 LS._quotaExceeded = true;
 }
 return false;
 }
 },
 _quotaExceeded: false,
 getUsageKB {
 try {
 if (_lsAvailable) {
 let t = 0;
 for (let i = 0; i < localStorage.length; i++) {
 t += (localStorage.getItem(localStorage.key(i)) || '').length;
 }
 return Math.round(t / 1024);
 }
 let t = 0;
 for (const v of Object.values(_memoryStore)) t += (v || '').length;
 return Math.round(t / 1024);
 } catch { return 0; }
 },
 keys(prefix='') {
 const out = [];
 if (_lsAvailable) {
 for (let i = 0; i < localStorage.length; i++) {
 const k = localStorage.key(i);
 if (k.startsWith(prefix)) out.push(k);
 }
 } else {
 for (const k of Object.keys(_memoryStore)) {
 if (k.startsWith(prefix)) out.push(k);
 }
 }
 return out;
 }
};

const today = => new Date.toISOString.split('T')[0];
const dayKey = (prefix) => `${prefix}:${today}`;
const subtractDays = (dateStr, n) => {
 const d = new Date(dateStr + 'T12:00:00');
 d.setDate(d.getDate - n);
 return d.toISOString.split('T')[0];
};

// ============================================================
// BODY TRACKING ALGORITHMS
// ============================================================

/** Load all body logs from localStorage, sorted by date ascending */
function loadBodyLogs {
 const keys = LS.keys('bodyLog:');
 return keys
.map(k => ({ date: k.replace('bodyLog:', ''),.LS.get(k, {}) }))
.filter(l => l.date && l.weight && Number(l.weight) > 0 && isFinite(Number(l.weight)))
.sort((a, b) => a.date.localeCompare(b.date));
}

/** Load all body logs (including those without weight, for nutrition chart) */
function loadAllBodyLogs {
 const keys = LS.keys('bodyLog:');
 return keys
.map(k => ({ date: k.replace('bodyLog:', ''),.LS.get(k, {}) }))
.filter(l => l.date)
.sort((a, b) => a.date.localeCompare(b.date));
}

// --- Weight Smoothing ---

/** Exponential weighted moving average (EWMA) (α=0.05, ~20-day window) */
function smoothEWMA(logs, alpha = 0.05) {
 if (logs.length === 0) return [];
 // Fill gaps with linear interpolation first
 const filled = interpolateMissing(logs);
 const result = [];
 let trend = filled[0].weight;
 for (const entry of filled) {
 trend = alpha * entry.weight + (1 - alpha) * trend;
 result.push({ date: entry.date, raw: entry.weight, trend: Math.round(trend * 100) / 100 });
 }
 return result;
}

/** Bidirectional smoothing */
function smoothHappyScale(logs, alpha = 0.05) {
 if (logs.length === 0) return [];
 const filled = interpolateMissing(logs);
 // Forward EMA
 const forward = [];
 let fTrend = filled[0].weight;
 for (const entry of filled) {
 fTrend = alpha * entry.weight + (1 - alpha) * fTrend;
 forward.push(fTrend);
 }
 // Backward EMA
 const backward = [];
 let bTrend = filled[filled.length - 1].weight;
 for (let i = filled.length - 1; i >= 0; i--) {
 bTrend = alpha * filled[i].weight + (1 - alpha) * bTrend;
 backward.unshift(bTrend);
 }
 // Weighted average: 60% forward, 40% backward
 return filled.map((entry, i) => ({
 date: entry.date,
 raw: entry.weight,
 trend: Math.round((forward[i] * 0.6 + backward[i] * 0.4) * 100) / 100,
 }));
}

/** Time-adaptive EMA */
function smoothTimeAdaptive(logs, smoothingDays = 7) {
 if (logs.length === 0) return [];
 const MS_PER_DAY = 86400000;
 const result = [];
 let trend = logs[0].weight;
 let prevDate = new Date(logs[0].date + 'T12:00:00').getTime;
 result.push({ date: logs[0].date, raw: logs[0].weight, trend: Math.round(trend * 100) / 100 });
 for (let i = 1; i < logs.length; i++) {
 const curDate = new Date(logs[i].date + 'T12:00:00').getTime;
 const timeDelta = curDate - prevDate;
 const alpha = 1 - Math.exp(-timeDelta / (smoothingDays * MS_PER_DAY));
 trend = alpha * logs[i].weight + (1 - alpha) * trend;
 result.push({ date: logs[i].date, raw: logs[i].weight, trend: Math.round(trend * 100) / 100 });
 prevDate = curDate;
 }
 return result;
}

/** Fill date gaps via linear interpolation for EWMA algorithms */
function interpolateMissing(logs) {
 if (logs.length < 2) return logs.map(l => ({ date: l.date, weight: Number(l.weight) }));
 const result = [];
 for (let i = 0; i < logs.length; i++) {
 result.push({ date: logs[i].date, weight: Number(logs[i].weight) });
 if (i < logs.length - 1) {
 const d1 = new Date(logs[i].date + 'T12:00:00');
 const d2 = new Date(logs[i + 1].date + 'T12:00:00');
 const gap = Math.round((d2 - d1) / 86400000);
 if (gap > 1) {
 const w1 = Number(logs[i].weight), w2 = Number(logs[i + 1].weight);
 for (let g = 1; g < gap; g++) {
 const d = new Date(d1); d.setDate(d.getDate + g);
 result.push({
 date: d.toISOString.split('T')[0],
 weight: Math.round((w1 + (w2 - w1) * (g / gap)) * 100) / 100,
 });
 }
 }
 }
 }
 return result;
}

/** Get smoothed weight data using selected method */
function getSmoothedWeights(logs, config) {
 const method = config?.smoothingMethod || 'ewma';
 switch (method) {
 case 'bidirectional': return smoothHappyScale(logs);
 case 'timeadaptive': return smoothTimeAdaptive(logs, config?.adaptiveSmoothingDays || 7);
 default: return smoothEWMA(logs);
 }
}

// --- Body Fat Calibration ---

function recalcCalibration(cal) {
 if (!cal.points || cal.points.length === 0) return cal;
 const pts = cal.points;
 // Simple offset: average of (dexa - bia)
 const offsets = pts.map(p => p.dexaValue - p.biaValue);
 const avgOffset = offsets.reduce((a, b) => a + b, 0) / offsets.length;
 const updated = {.cal, offset: Math.round(avgOffset * 100) / 100 };

 // Linear regression (2+ points)
 if (pts.length >= 2) {
 const n = pts.length;
 const sumX = pts.reduce((a, p) => a + p.biaValue, 0);
 const sumY = pts.reduce((a, p) => a + p.dexaValue, 0);
 const sumXY = pts.reduce((a, p) => a + p.biaValue * p.dexaValue, 0);
 const sumX2 = pts.reduce((a, p) => a + p.biaValue * p.biaValue, 0);
 const denom = n * sumX2 - sumX * sumX;
 if (denom !== 0) {
 const slope = (n * sumXY - sumX * sumY) / denom;
 const intercept = (sumY - slope * sumX) / n;
 // R² calculation
 const meanY = sumY / n;
 const ssRes = pts.reduce((a, p) => a + (p.dexaValue - (intercept + slope * p.biaValue)) ** 2, 0);
 const ssTot = pts.reduce((a, p) => a + (p.dexaValue - meanY) ** 2, 0);
 updated.slope = Math.round(slope * 1000) / 1000;
 updated.intercept = Math.round(intercept * 100) / 100;
 updated.rSquared = ssTot > 0 ? Math.round((1 - ssRes / ssTot) * 1000) / 1000 : null;
 }
 }

 // EWMA offset (2+ points)
 if (pts.length >= 2) {
 const alpha = cal.ewmaAlpha || 0.6;
 let ewma = offsets[0];
 for (let i = 1; i < offsets.length; i++) {
 ewma = alpha * offsets[i] + (1 - alpha) * ewma;
 }
 updated.ewmaOffset = Math.round(ewma * 100) / 100;
 }

 // Bayesian (prior + data)
 const prior = cal.prior || { mean: 3.0, precision: 0.5 };
 const dataMean = avgOffset;
 const dataPrecision = pts.length * 0.8; // each point adds ~0.8 precision
 const postPrecision = prior.precision + dataPrecision;
 const postMean = (prior.precision * prior.mean + dataPrecision * dataMean) / postPrecision;
 updated.posterior = {
 mean: Math.round(postMean * 100) / 100,
 precision: Math.round(postPrecision * 100) / 100,
 };

 updated.lastCalibrationDate = pts.length > 0 ? pts[pts.length - 1].date : null;
 return updated;
}

function getCalibratedBodyFat(rawBIA, cal) {
 if (!cal || !cal.points || cal.points.length === 0) {
 return { value: rawBIA, calibrated: false, confidence: 'uncalibrated' };
 }
 const raw = Number(rawBIA);
 switch (cal.method) {
 case 'linear_regression':
 if (cal.points.length >= 2 && cal.slope != null) {
 return {
 value: Math.round((cal.intercept + cal.slope * raw) * 10) / 10,
 calibrated: true,
 confidence: cal.rSquared > 0.9 ? 'high' : 'medium',
 };
 }
 return { value: Math.round((raw + cal.offset) * 10) / 10, calibrated: true, confidence: 'low' };
 case 'rolling_weighted':
 if (cal.points.length >= 2 && cal.ewmaOffset != null) {
 return {
 value: Math.round((raw + cal.ewmaOffset) * 10) / 10,
 calibrated: true,
 confidence: cal.points.length >= 3 ? 'high' : 'medium',
 };
 }
 return { value: Math.round((raw + cal.offset) * 10) / 10, calibrated: true, confidence: 'low' };
 case 'bayesian':
 if (cal.posterior?.mean != null) {
 return {
 value: Math.round((raw + cal.posterior.mean) * 10) / 10,
 calibrated: true,
 confidence: cal.posterior.precision > 2 ? 'high' : 'medium',
 };
 }
 return { value: Math.round((raw + cal.offset) * 10) / 10, calibrated: true, confidence: 'low' };
 default: // simple_offset
 return {
 value: Math.round((raw + cal.offset) * 10) / 10,
 calibrated: true,
 confidence: cal.points.length === 1 ? 'low' : 'medium',
 };
 }
}

// --- Adaptive TDEE Algorithm (EWMA-based) ---

function linearRegressionSlope(points) {
 // points: [{x, y}] — returns slope (y/x change per unit x)
 const n = points.length;
 if (n < 2) return 0;
 const sumX = points.reduce((a, p) => a + p.x, 0);
 const sumY = points.reduce((a, p) => a + p.y, 0);
 const sumXY = points.reduce((a, p) => a + p.x * p.y, 0);
 const sumX2 = points.reduce((a, p) => a + p.x * p.x, 0);
 const denom = n * sumX2 - sumX * sumX;
 return denom !== 0 ? (n * sumXY - sumX * sumY) / denom : 0;
}

function updateExpenditure(bodyLogs, nutritionConfig) {
 const cfg = nutritionConfig || {};
 const alpha = cfg.expenditureAlpha || 0.05;
 const prevTDEE = cfg.estimatedTDEE || cfg.initialTDEE || 2500;

 // Need enough data
 const logsWithCals = bodyLogs.filter(l => l.weight && l.calories);
 if (logsWithCals.length < (cfg.minDaysForAdjustment || 7)) {
 return { tdee: prevTDEE, confidence: 'low' };
 }

 // Get smoothed trend weights
 const smoothed = smoothEWMA(logsWithCals);
 const recent = smoothed.slice(-14);
 if (recent.length < 7) return { tdee: prevTDEE, confidence: 'low' };

 // Rate of weight change (lbs/day) via linear regression on trend
 const trendPoints = recent.map((d, i) => ({ x: i, y: d.trend }));
 const weightChangePerDay = linearRegressionSlope(trendPoints);

 // Convert to daily calorie equivalent (3500 kcal/lb, 7700 kcal/kg)
 const isKg = (cfg.weightUnit || 'lbs') === 'kg';
 const calPerUnit = isKg ? 7700 : 3500;
 const dailyStorageChange = weightChangePerDay * calPerUnit;

 // Average intake over the window
 const recentLogs = logsWithCals.slice(-14);
 const avgIntake = recentLogs.reduce((a, l) => a + Number(l.calories), 0) / recentLogs.length;

 // Solve for expenditure
 const rawExpenditure = avgIntake - dailyStorageChange;

 // EWMA smoothing
 const smoothedTDEE = alpha * rawExpenditure + (1 - alpha) * prevTDEE;

 // Clamp: max 2% change per day
 const maxChange = prevTDEE * 0.02;
 const clampedTDEE = Math.round(Math.max(
 prevTDEE - maxChange,
 Math.min(prevTDEE + maxChange, smoothedTDEE)
 ));

 // Confidence based on data volume
 const totalDays = logsWithCals.length;
 const confidence = totalDays >= 30 ? 'high' : totalDays >= 14 ? 'medium' : 'low';

 return { tdee: clampedTDEE, confidence };
}

function computeCalorieTarget(nutritionConfig, bodyWeightLbs) {
 const cfg = nutritionConfig || {};
 const tdee = cfg.estimatedTDEE || 2500;
 const goal = cfg.goal || 'maintain';
 const rate = cfg.weeklyRatePercent || 0.5;
 const weight = bodyWeightLbs || 185;
 // Weekly deficit/surplus in kcal
 const weeklyChange = (rate / 100) * weight * 3500;
 const dailyAdjustment = weeklyChange / 7;
 if (goal === 'lose') return Math.round(tdee - dailyAdjustment);
 if (goal === 'gain') return Math.round(tdee + dailyAdjustment);
 return Math.round(tdee);
}

// --- Streak System ---

function updateStreaks(streaks, logType, dateStr) {
 const s = {.(streaks || DEFAULT_STREAKS) };
 const streak = {.(s[logType] || { current: 0, best: 0, lastDate: null }) };
 const yesterday = subtractDays(dateStr, 1);

 if (streak.lastDate === dateStr) return s; // already logged today

 if (streak.lastDate === yesterday || streak.lastDate === null) {
 streak.current += 1;
 } else {
 streak.current = 1;
 }
 streak.best = Math.max(streak.best, streak.current);
 streak.lastDate = dateStr;
 s[logType] = streak;
 return s;
}

function checkCombinedStreak(streaks, dateStr) {
 const s = {.streaks };
 if (s.weightLog?.lastDate === dateStr && s.nutritionLog?.lastDate === dateStr) {
 const combined = {.(s.combined || { current: 0, best: 0, lastDate: null }) };
 const yesterday = subtractDays(dateStr, 1);
 if (combined.lastDate === dateStr) return s;
 if (combined.lastDate === yesterday || combined.lastDate === null) {
 combined.current += 1;
 } else {
 combined.current = 1;
 }
 combined.best = Math.max(combined.best, combined.current);
 combined.lastDate = dateStr;
 s.combined = combined;
 }
 return s;
}


// ============================================================
// WORKOUT NORMALIZATION (backward compat for flat arrays)
// ============================================================

function normalizeWorkout(stored) {
 if (!stored) return null;
 if (Array.isArray(stored)) return { exercises: stored, version: 1, splitDay: 'full_body' };
 if (stored.exercises) return stored;
 return null;
}

function getWorkoutExercises(stored) {
 const w = normalizeWorkout(stored);
 return w ? w.exercises : [];
}

// ============================================================
// SPLIT SELECTION
// ============================================================

const SPLIT_TEMPLATES = {
 full_body: {
 name: 'Full Body',
 days: [{ name: 'Full Body', slots: ['chest','back','shoulders','quads','hamstrings','glutes','core','calves','triceps','biceps','neck'] }],
 },
 upper_lower: {
 name: 'Upper / Lower',
 days: [
 { name: 'Upper', slots: ['chest','back','shoulders','triceps','biceps'] },
 { name: 'Lower', slots: ['quads','hamstrings','glutes','calves','core'] },
 ],
 },
 ppl: {
 name: 'Push / Pull / Legs',
 days: [
 { name: 'Push', slots: ['chest','shoulders','triceps','core'] },
 { name: 'Pull', slots: ['back','biceps','rear_delts','core'] },
 { name: 'Legs', slots: ['quads','hamstrings','glutes','calves','core'] },
 ],
 },
};

function selectSplit(daysPerWeek, experienceLevel) {
 if (daysPerWeek >= 6) return 'ppl';
 if (daysPerWeek >= 5) return experienceLevel === 'beginner' ? 'upper_lower' : 'ppl';
 if (daysPerWeek >= 4) return 'upper_lower';
 return 'full_body'; // 2-3 days
}

function getSplitDay(split, dayIndex) {
 const template = SPLIT_TEMPLATES[split];
 if (!template) return SPLIT_TEMPLATES.full_body.days[0];
 return template.days[dayIndex % template.days.length];
}

// ============================================================
// PROGRESSIVE OVERLOAD ENGINE
// ============================================================

function estimate1RM(weight, reps) {
 if (!weight || !reps || reps <= 0) return 0;
 if (reps === 1) return weight;
 if (reps > 12) return weight * (1 + reps / 30); // Epley approx for high reps
 return weight * (36 / (37 - reps)); // Brzycki
}

// Volume helper: warm-up sets don't count toward working volume
function isWorkingVolume(set) {
 return set.setType !== 'warmup';
}

// ============================================================
// PR DETECTION & STORAGE
// ============================================================

function getPRData(exerciseId) {
 return LS.get(`pr:${exerciseId}`, { weightPR: null, volumePR: null, e1rmPR: null, repPRs: {} });
}

function savePRData(exerciseId, prData) {
 LS.set(`pr:${exerciseId}`, prData);
}

function detectPRs(exerciseId, currentSets) {
 // currentSets: array of { weight, reps, done } from the ACTIVE workout
 const completedSets = currentSets.filter(s => s.done && (parseFloat(s.weight) > 0 || parseInt(s.reps) > 0));
 if (completedSets.length === 0) return [];

 // Get ALL previous history (not including current session)
 const history = getExerciseHistory(exerciseId, 50);
 const prs = [];
 const today = new Date.toISOString.slice(0, 10);

 // Compute current session stats
 const currentWeights = completedSets.map(s => parseFloat(s.weight) || 0);
 const currentMaxWeight = Math.max(.currentWeights);
 const currentVolume = completedSets.reduce((sum, s) => sum + (parseFloat(s.weight) || 0) * (parseInt(s.reps) || 0), 0);
 const currentBestE1RM = Math.max(.completedSets
.filter(s => parseFloat(s.weight) > 0 && parseInt(s.reps) > 0 && parseInt(s.reps) <= 12)
.map(s => estimate1RM(parseFloat(s.weight), parseInt(s.reps))), 0);
 const isBodyweight = currentMaxWeight === 0;

 // Compute historical bests
 let historicalMaxWeight = 0;
 let historicalMaxVolume = 0;
 let historicalBestE1RM = 0;
 const historicalRepPRs = {}; // weight -> maxReps

 for (const session of history) {
 let sessionVolume = 0;
 for (const set of session.sets) {
 if (set.weight > historicalMaxWeight) historicalMaxWeight = set.weight;
 sessionVolume += set.weight * set.reps;
 if (set.weight > 0 && set.reps > 0 && set.reps <= 12) {
 const e1rm = estimate1RM(set.weight, set.reps);
 if (e1rm > historicalBestE1RM) historicalBestE1RM = e1rm;
 }
 // Track rep PRs per weight tier
 const wKey = String(set.weight);
 if (!historicalRepPRs[wKey] || set.reps > historicalRepPRs[wKey]) {
 historicalRepPRs[wKey] = set.reps;
 }
 }
 if (sessionVolume > historicalMaxVolume) historicalMaxVolume = sessionVolume;
 }

 // Only detect PRs if there's at least one previous session to compare against
 if (history.length === 0) return [];

 // 1. Weight PR (skip for bodyweight)
 if (!isBodyweight && currentMaxWeight > historicalMaxWeight) {
 prs.push({ type: 'weight', value: currentMaxWeight, previousBest: historicalMaxWeight, improvement: currentMaxWeight - historicalMaxWeight });
 }

 // 2. Volume PR
 if (currentVolume > historicalMaxVolume && currentVolume > 0) {
 prs.push({ type: 'volume', value: currentVolume, previousBest: historicalMaxVolume, improvement: currentVolume - historicalMaxVolume });
 }

 // 3. Estimated 1RM PR (skip for bodyweight)
 if (!isBodyweight && currentBestE1RM > historicalBestE1RM && currentBestE1RM > 0) {
 prs.push({ type: 'e1rm', value: Math.round(currentBestE1RM * 10) / 10, previousBest: Math.round(historicalBestE1RM * 10) / 10, improvement: Math.round((currentBestE1RM - historicalBestE1RM) * 10) / 10 });
 }

 // 4. Rep PRs (per weight tier — for bodyweight exercises: weight=0 tier)
 for (const set of completedSets) {
 const w = parseFloat(set.weight) || 0;
 const r = parseInt(set.reps) || 0;
 const wKey = String(w);
 const prevBest = historicalRepPRs[wKey] || 0;
 if (r > prevBest && r > 0) {
 // Only add one rep PR per weight tier (highest)
 if (!prs.find(p => p.type === 'reps' && p.weightTier === w)) {
 prs.push({ type: 'reps', value: r, previousBest: prevBest, improvement: r - prevBest, weightTier: w });
 }
 }
 }

 // Persist PR data
 if (prs.length > 0) {
 const prData = getPRData(exerciseId);
 for (const pr of prs) {
 if (pr.type === 'weight') prData.weightPR = { value: pr.value, date: today, reps: completedSets.find(s => parseFloat(s.weight) === pr.value)?.reps };
 if (pr.type === 'volume') prData.volumePR = { value: pr.value, date: today };
 if (pr.type === 'e1rm') prData.e1rmPR = { value: pr.value, date: today };
 if (pr.type === 'reps') { if (!prData.repPRs) prData.repPRs = {}; prData.repPRs[String(pr.weightTier)] = { reps: pr.value, date: today }; }
 }
 savePRData(exerciseId, prData);
 }

 return prs;
}

function getExerciseHistory(exerciseId, maxSessions = 5) {
 const keys = LS.keys('workout:');
 const sessions = [];
 const sortedKeys = keys.sort((a, b) => b.localeCompare(a));
 for (const key of sortedKeys) {
 if (sessions.length >= maxSessions) break;
 const raw = LS.get(key, null);
 const exs = getWorkoutExercises(raw);
 for (const ex of exs) {
 if (ex.id === exerciseId) {
 const doneSets = (ex.logSets || []).filter(s => s.done && (s.weight || s.reps));
 if (doneSets.length > 0) {
 sessions.push({
 date: key.replace('workout:', ''),
 sets: doneSets.map(s => ({
 weight: parseFloat(s.weight) || 0,
 reps: parseInt(s.reps) || 0,
 rpe: parseFloat(s.rpe) || 0,
 })),
 });
 }
 }
 }
 }
 return sessions;
}

function prescribeNextSession(exerciseId, trainingGoal = 'hypertrophy', settings = {}) {
 const exercise = EXERCISES.find(e => e.id === exerciseId);
 if (!exercise) return null;

 const history = getExerciseHistory(exerciseId, 5);
 if (history.length === 0) return null;

 const isUpper = UPPER_CATEGORIES.has(exercise.category);
 const increment = isUpper
 ? (settings.weightIncrementUpper || 5)
 : (settings.weightIncrementLower || 10);

 const repRange = exercise.repRanges?.[trainingGoal] || exercise.repRanges?.hypertrophy || { min: 8, max: 12 };
 const { min: repLow, max: repHigh } = repRange;

 const lastSession = history[0];
 const lastSets = lastSession.sets;
 const lastWeight = lastSets.reduce((max, s) => Math.max(max, s.weight), 0);
 const lastAvgReps = Math.round(lastSets.reduce((sum, s) => sum + s.reps, 0) / lastSets.length);
 const isBodyweight = lastWeight === 0;

 let prescribedWeight, prescribedReps, action;

 if (isBodyweight) {
 // BW: only track reps
 const allAboveHigh = lastSets.every(s => s.reps >= repHigh);
 const consecutiveHigh = history.slice(0, 3).every(sess =>
 sess.sets.every(s => s.reps >= repHigh)
 );
 if (consecutiveHigh && history.length >= 3 && exercise.progressionIds?.length > 0) {
 action = 'progress_exercise';
 prescribedWeight = 0;
 prescribedReps = repLow;
 } else if (allAboveHigh) {
 action = 'add_rep';
 prescribedWeight = 0;
 prescribedReps = Math.min(lastAvgReps + 1, repHigh + 5);
 } else {
 action = 'maintain';
 prescribedWeight = 0;
 prescribedReps = Math.min(lastAvgReps + 1, repHigh);
 }
 } else {
 const allAboveHigh = lastSets.every(s => s.reps >= repHigh);
 const anyBelowLow = lastSets.some(s => s.reps < repLow);

 if (allAboveHigh) {
 action = 'increase_weight';
 prescribedWeight = lastWeight + increment;
 prescribedReps = repLow;
 } else if (anyBelowLow) {
 action = 'decrease_weight';
 prescribedWeight = Math.max(0, lastWeight - increment);
 prescribedReps = repLow;
 } else {
 action = 'add_rep';
 prescribedWeight = lastWeight;
 prescribedReps = Math.min(lastAvgReps + 1, repHigh);
 }
 }

 // Check for stall → suggest regression if available
 const stallStatus = detectStall(exerciseId);
 if (stallStatus.stalled && exercise.regressionIds?.length > 0 && action !== 'progress_exercise') {
 action = 'regress_exercise';
 }

 // Compute rolling e1RM
 const recent1RMs = history.slice(0, 3).flatMap(s =>
 s.sets.filter(set => set.weight > 0 && set.reps > 0 && set.reps <= 12).map(set => estimate1RM(set.weight, set.reps))
 );
 const avg1RM = recent1RMs.length > 0 ? Math.round(recent1RMs.reduce((a, b) => a + b, 0) / recent1RMs.length) : 0;

 return {
 prescribedWeight,
 prescribedReps,
 action, // 'increase_weight' | 'decrease_weight' | 'add_rep' | 'maintain' | 'progress_exercise' | 'regress_exercise'
 lastWeight,
 lastAvgReps,
 repRange: { low: repLow, high: repHigh },
 rest: repRange.rest,
 estimated1RM: avg1RM,
 historyLength: history.length,
 progressionExercise: action === 'progress_exercise'
 ? EXERCISES.find(e => e.id === exercise.progressionIds?.[0])?.name
 : null,
 progressionIds: exercise.progressionIds || [],
 regressionExercise: action === 'regress_exercise'
 ? EXERCISES.find(e => e.id === exercise.regressionIds?.[0])?.name
 : null,
 regressionIds: exercise.regressionIds || [],
 };
}

// ============================================================
// STALL DETECTION
// ============================================================

function detectStall(exerciseId) {
 const history = getExerciseHistory(exerciseId, 5);
 if (history.length < 3) return { stalled: false, fatigued: false };

 const recent3 = history.slice(0, 3);

 // Check weight+reps stall: unchanged for 3 sessions
 const weights = recent3.map(s => Math.max(.s.sets.map(x => x.weight)));
 const avgReps = recent3.map(s => Math.round(s.sets.reduce((sum, x) => sum + x.reps, 0) / s.sets.length));
 const weightStall = weights.every(w => w === weights[0]);
 const repStall = avgReps.every(r => r === avgReps[0]);
 const stalled = weightStall && repStall;

 // Check RPE fatigue: trending up
 const avgRPEs = recent3.map(s => {
 const rpes = s.sets.filter(x => x.rpe > 0).map(x => x.rpe);
 return rpes.length > 0 ? rpes.reduce((a, b) => a + b, 0) / rpes.length : 0;
 }).filter(r => r > 0);

 let fatigued = false;
 if (avgRPEs.length >= 3) {
 // oldest to newest
 const reversed = [.avgRPEs].reverse;
 const trend = reversed[reversed.length - 1] - reversed[0];
 fatigued = trend >= 1.0; // RPE rising by 1+ over 3 sessions at same load
 }

 return { stalled, fatigued };
}

// ============================================================
// WORKOUT GENERATION (Split-Aware)
// ============================================================

function generateWorkout(phase, location, history = [], settings = {}, overrides = {}) {
 const pool = EXERCISES.filter(ex => {
 const phaseData = ex.phase?.[phase];
 if (!phaseData || phaseData.s === 'avoid') return false;
 if (!ex.location?.[location]) return false;
 return true;
 });

 // Determine split — user override takes priority
 const daysPerWeek = settings.daysPerWeek || 3;
 const experienceLevel = settings.experienceLevel || 'beginner';
 const trainingGoal = settings.trainingGoal || 'hypertrophy';
 const split = overrides.forceSplit || selectSplit(daysPerWeek, experienceLevel);
 
 // Figure out which day index we're on based on recent history (or user override)
 const template = SPLIT_TEMPLATES[split];
 let dayIndex = 0;

 if (overrides.forceDayIndex != null && template) {
 dayIndex = overrides.forceDayIndex;
 } else {
 const recentSplitDays = history
.map(h => normalizeWorkout(h))
.filter(Boolean)
.map(w => w.splitDay || 'full_body');
 if (template && recentSplitDays.length > 0) {
 const lastDay = recentSplitDays[0];
 const lastIdx = template.days.findIndex(d => d.name.toLowerCase.replace(/\s+/g, '_') === lastDay);
 dayIndex = lastIdx >= 0 ? (lastIdx + 1) % template.days.length : 0;
 }
 }
 const splitDay = template ? template.days[dayIndex % template.days.length] : SPLIT_TEMPLATES.full_body.days[0];
 const splitDayName = splitDay.name.toLowerCase.replace(/\s+/g, '_');
 const targetCategories = new Set(splitDay.slots);

 // Build a lookup of last-used weight/reps per exercise ID from recent history
 const lastUsed = {};
 const lastSessionSetsMap = {}; // exerciseId -> array of {weight, reps} from last session
 for (const pastWorkout of history) {
 const exs = getWorkoutExercises(pastWorkout);
 for (const ex of exs) {
 if (lastUsed[ex.id]) continue;
 const doneSets = (ex.logSets || []).filter(s => s.done && (s.weight || s.reps));
 if (doneSets.length > 0) {
 const last = doneSets[doneSets.length - 1];
 lastUsed[ex.id] = { weight: last.weight || '', reps: last.reps || '', rpe: last.rpe || '' };
 lastSessionSetsMap[ex.id] = doneSets.map(s => ({ weight: s.weight || 0, reps: s.reps || 0 }));
 }
 }
 }

 // Avoid repeating same exercise from last session
 const lastWorkout = history[0];
 const lastExs = getWorkoutExercises(lastWorkout);
 const lastIds = new Set(lastExs.map(e => e.id));

 // For full body, use the original slot system for best results
 if (split === 'full_body') {
 const slots = [
 { role: 'Chest Press', cats: ['chest'], patternFilter: ['horizontal_push'], mandatory: true },
 { role: 'Horizontal Row', cats: ['back'], patternFilter: ['horizontal_pull'], mandatory: true },
 { role: 'Shoulder Press', cats: ['shoulders'], patternFilter: ['vertical_push'], mandatory: true },
 { role: 'Lower Compound', cats: ['quads'], patternFilter: ['squat','lunge'], mandatory: true },
 { role: 'Hip Hinge', cats: ['hamstrings'], patternFilter: ['hip_hinge'], mandatory: true },
 { role: 'Glute', cats: ['glutes'], mandatory: true },
 { role: 'Core', cats: ['core'], mandatory: true },
 { role: 'Scapular Corrective', cats: ['back','shoulders','neck'], patternFilter: ['corrective'], mandatory: true },
 { role: 'Glute Med', cats: ['glutes'], patternFilter: ['isolation_lower'], mandatory: true },
 { role: 'Triceps', cats: ['triceps'], mandatory: false },
 { role: 'Biceps', cats: ['biceps'], mandatory: false },
 { role: 'Calves', cats: ['calves'], mandatory: false },
 { role: 'Neck', cats: ['neck'], mandatory: false },
 ];

 return buildWorkoutFromSlots(slots, pool, lastIds, lastUsed, lastSessionSetsMap, phase, trainingGoal, settings, splitDayName);
 }

 // For upper/lower/PPL, build slots dynamically from split day
 const slots = [];
 const catSlotMap = {
 chest: [{ role: 'Chest Press', patternFilter: ['horizontal_push'], mandatory: true },
 { role: 'Chest Isolation', patternFilter: ['isolation_upper'], mandatory: false }],
 back: [{ role: 'Horizontal Row', patternFilter: ['horizontal_pull'], mandatory: true },
 { role: 'Vertical Pull', patternFilter: ['vertical_pull'], mandatory: true }],
 shoulders: [{ role: 'Shoulder Press', patternFilter: ['vertical_push'], mandatory: true },
 { role: 'Side Delt', patternFilter: ['isolation_upper'], mandatory: false }],
 rear_delts:[{ role: 'Rear Delt', patternFilter: ['horizontal_pull','isolation_upper','corrective'], mandatory: false }],
 triceps: [{ role: 'Triceps', mandatory: false }],
 biceps: [{ role: 'Biceps', mandatory: false }],
 quads: [{ role: 'Quad Compound', patternFilter: ['squat','lunge'], mandatory: true },
 { role: 'Quad Isolation', patternFilter: ['isolation_lower'], mandatory: false }],
 hamstrings:[{ role: 'Hip Hinge', patternFilter: ['hip_hinge'], mandatory: true },
 { role: 'Ham Curl', patternFilter: ['isolation_lower'], mandatory: false }],
 glutes: [{ role: 'Glute', mandatory: true }],
 calves: [{ role: 'Calves', mandatory: false }],
 core: [{ role: 'Core', mandatory: false }],
 neck: [{ role: 'Neck', mandatory: false }],
 };

 for (const cat of splitDay.slots) {
 const catSlots = catSlotMap[cat] || [{ role: cat, mandatory: false }];
 for (const s of catSlots) {
 slots.push({.s, cats: [cat === 'rear_delts' ? 'shoulders' : cat] });
 }
 }

 return buildWorkoutFromSlots(slots, pool, lastIds, lastUsed, lastSessionSetsMap, phase, trainingGoal, settings, splitDayName);
}

function buildWorkoutFromSlots(slots, pool, lastIds, lastUsed, lastSessionSetsMap, phase, trainingGoal, settings, splitDayName) {
 const used = new Set;
 const workout = [];

 for (const slot of slots) {
 let candidates = pool.filter(ex =>
 slot.cats.includes(ex.category) && !used.has(ex.id)
 );

 // Filter by movement pattern if specified
 if (slot.patternFilter) {
 const patternFiltered = candidates.filter(ex => slot.patternFilter.includes(ex.movementPattern));
 if (patternFiltered.length > 0) candidates = patternFiltered;
 }

 // Prefer not repeating from last session
 const fresh = candidates.filter(ex => !lastIds.has(ex.id));
 if (fresh.length > 0) candidates = fresh;

 // Deprioritize stalled exercises — prefer non-stalled alternatives
 const nonStalled = candidates.filter(ex => {
 const s = detectStall(ex.id);
 return !s.stalled;
 });
 if (nonStalled.length > 0) candidates = nonStalled;

 // Sort by: SFR rating (prefer higher), then phase priority
 candidates.sort((a, b) => {
 const ap = a.phase?.[phase]?.p || 0;
 const bp = b.phase?.[phase]?.p || 0;
 if (bp !== ap) return bp - ap;
 return (b.sfrRating || 3) - (a.sfrRating || 3);
 });

 if (candidates.length > 0) {
 const topN = candidates.slice(0, Math.min(3, candidates.length));
 const weights = topN.map((_, i) => topN.length - i);
 const totalWeight = weights.reduce((a, b) => a + b, 0);
 let roll = Math.random * totalWeight;
 let pickIdx = 0;
 for (let i = 0; i < weights.length; i++) {
 roll -= weights[i];
 if (roll <= 0) { pickIdx = i; break; }
 }
 const pick = topN[pickIdx];
 used.add(pick.id);

 // Get prescription if progressive overload is enabled
 const prescription = settings.enableProgressiveOverload !== false
 ? prescribeNextSession(pick.id, trainingGoal, settings)
 : null;

 const prev = lastUsed[pick.id];
 const repRange = pick.repRanges?.[trainingGoal] || pick.repRanges?.hypertrophy;
 const restTime = repRange?.rest || pick.rest || 90;
 const numSets = pick.sets || 3;

 workout.push({
.pick,
 slot: slot.role,
 mandatory: slot.mandatory,
 rest: restTime,
 prescription,
 lastSessionSets: lastSessionSetsMap[pick.id] || null,
 logSets: Array.from({length: numSets}, => ({
 weight: prescription?.prescribedWeight ?? prev?.weight ?? '',
 reps: prescription?.prescribedReps ?? prev?.reps ?? '',
 rpe: prev?.rpe || '',
 done: false,
 })),
 });
 }
 }

 // Wrap in v2 schema
 workout._splitDay = splitDayName;
 return workout;
}

// ============================================================
// COMPONENTS
// ============================================================

function GlassCard({ children, style, onClick, animate = true, className = '' }) {
 return (
 <div onClick={onClick} className={className} style={{
 background: T.bgCard,
 backdropFilter: 'blur(20px)',
 WebkitBackdropFilter: 'blur(20px)',
 border: `1px solid ${T.border}`,
 borderRadius: T.radius,
 padding: '16px',
 animation: animate ? 'fadeUp 0.4s ease-out both' : 'none',
 transition: 'background 0.2s, transform 0.15s',
 cursor: onClick ? 'pointer' : 'default',
.style
 }}>
 {children}
 </div>
 );
}

function CircularTimer({ duration, timeLeft, size = 56, strokeWidth = 3 }) {
 const radius = (size - strokeWidth) / 2;
 const circumference = 2 * Math.PI * radius;
 const progress = duration > 0 ? (timeLeft / duration) : 0;
 const dashoffset = circumference * (1 - progress);

 return (
 <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }} aria-hidden="true">
 <circle cx={size/2} cy={size/2} r={radius} stroke={T.border} strokeWidth={strokeWidth} fill="none" />
 <circle cx={size/2} cy={size/2} r={radius} stroke={timeLeft > 10 ? T.teal : T.accent}
 strokeWidth={strokeWidth} fill="none" strokeDasharray={circumference} strokeDashoffset={dashoffset}
 strokeLinecap="round" style={{ transition: 'stroke-dashoffset 1s linear, stroke 0.3s' }} />
 </svg>
 );
}

function WorkoutTimerBar({ startedAt }) {
 const [elapsed, setElapsed] = useState(0);
 useEffect( => {
 if (!startedAt) return;
 setElapsed(Math.floor((Date.now - startedAt) / 1000));
 const iv = setInterval( => setElapsed(Math.floor((Date.now - startedAt) / 1000)), 1000);
 return => clearInterval(iv);
 }, [startedAt]);
 if (!startedAt) return null;
 const mins = Math.floor(elapsed / 60);
 const secs = elapsed % 60;
 const display = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
 return (
 <div style={{
 height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
 background: 'rgba(78,205,196,0.08)', borderBottom: `1px solid ${T.border}`,
 position: 'sticky', top: 0, zIndex: 25, backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
 }}>
 <Clock size={14} style={{ color: T.teal }} />
 <span style={{ fontFamily: T.mono, fontSize: '14px', fontWeight: 600, color: T.teal, letterSpacing: '0.5px' }}>
 {display}
 </span>
 </div>
 );
}

function RestTimer({ endTime, duration, onComplete, onPauseState, vibrate = true }) {
 // Timestamp-based timer: survives unmount/remount because endTime is in parent state
 const [now, setNow] = useState(Date.now);
 const [paused, setPaused] = useState(false);
 const [pausedRemaining, setPausedRemaining] = useState(null); // ms remaining when paused
 const [finished, setFinished] = useState(false);
 const completedRef = useRef(false);

 useEffect( => {
 if (paused || finished) return;
 const tick = setInterval( => setNow(Date.now), 250); // 250ms for smoother visual
 return => clearInterval(tick);
 }, [paused, finished]);

 const timeLeftMs = paused ? (pausedRemaining || 0) : Math.max(0, endTime - now);
 const timeLeft = Math.ceil(timeLeftMs / 1000);

 useEffect( => {
 if (timeLeft <= 0 && !finished && !paused && !completedRef.current) {
 completedRef.current = true;
 setFinished(true);
 if (vibrate && navigator.vibrate) {
 try { navigator.vibrate([150, 80, 150]); } catch(e) {}
 }
 setTimeout( => { onComplete?.; }, 3000);
 }
 }, [timeLeft, finished, paused, onComplete, vibrate]);

 const handlePause = => {
 if (paused) {
 // Resume: tell parent to set a new endTime
 const newEndTime = Date.now + (pausedRemaining || 0);
 setPaused(false);
 setPausedRemaining(null);
 onPauseState?.(newEndTime); // parent updates endTime
 } else {
 // Pause: capture remaining time
 const remaining = Math.max(0, endTime - Date.now);
 setPaused(true);
 setPausedRemaining(remaining);
 }
 };

 const handleReset = => {
 const newEndTime = Date.now + duration * 1000;
 setPaused(false);
 setPausedRemaining(null);
 setFinished(false);
 completedRef.current = false;
 onPauseState?.(newEndTime);
 };

 const min = Math.floor(timeLeft / 60);
 const sec = timeLeft % 60;

 return (
 <div style={{ display:'flex', alignItems:'center', gap:'12px', padding:'12px 16px',
 background: finished ? 'rgba(0,230,118,0.08)' : T.bgCard,
 borderRadius: T.radiusSm, border:`1px solid ${finished ? 'rgba(0,230,118,0.25)' : T.border}`,
 transition:'all 0.4s ease', animation: finished ? 'timerPulse 1.5s ease-in-out 2' : 'none',
 }} role="timer" aria-live="polite" aria-label={finished ? 'Rest complete' : `Rest timer: ${min}:${sec.toString.padStart(2,'0')} remaining`}>
 <div style={{ position:'relative', width:48, height:48, display:'flex', alignItems:'center', justifyContent:'center' }}>
 <CircularTimer duration={duration} timeLeft={timeLeft} size={48} />
 <span style={{ position:'absolute', fontSize:'11px', fontFamily:T.mono,
 color: finished ? T.success : timeLeft > 10 ? T.teal : T.accent,
 fontWeight: finished ? 700 : 400 }}>
 {finished ? '✓' : `${min}:${sec.toString.padStart(2,'0')}`}
 </span>
 </div>
 <span style={{ fontSize:'13px', color: finished ? T.success : T.text2, flex:1, fontWeight: finished ? 600 : 400 }}>
 {finished ? 'Rest complete' : paused ? 'Paused' : 'Rest'}
 </span>
 {!finished && (
 <>
 <button onClick={handlePause} aria-label={paused ? 'Resume timer' : 'Pause timer'} style={{ background:'none', border:'none', color:T.teal, cursor:'pointer', padding:'8px' }}>
 {paused ? <Play size={18} /> : <Pause size={18} />}
 </button>
 <button onClick={handleReset} aria-label="Reset timer"
 style={{ background:'none', border:'none', color:T.text3, cursor:'pointer', padding:'8px' }}>
 <RotateCcw size={16} />
 </button>
 </>
 )}
 {finished && (
 <button onClick={ => onComplete?.} aria-label="Dismiss rest timer" style={{ background:'none', border:'none', color:T.text3, cursor:'pointer', padding:'8px', fontSize:'12px' }}>
 Dismiss
 </button>
 )}
 </div>
 );
}

function StepperField({ value, onChange, step, min = 0, max = 9999, unit, placeholder, done, color }) {
 const [editing, setEditing] = useState(false);
 const inputRef = useRef(null);
 const numVal = parseFloat(value) || 0;

 useEffect( => {
 if (editing && inputRef.current) {
 inputRef.current.focus;
 inputRef.current.select;
 }
 }, [editing]);

 const increment = => onChange(String(Math.min(max, +(numVal + step).toFixed(1))));
 const decrement = => onChange(String(Math.max(min, +(numVal - step).toFixed(1))));

 // Clamp value to min/max on blur
 const handleBlur = => {
 const num = parseFloat(value);
 if (!isNaN(num)) {
 const clamped = Math.max(min, Math.min(max, num));
 if (clamped !== num) onChange(String(+(clamped).toFixed(1)));
 }
 setEditing(false);
 };

 const btnStyle = (side) => ({
 width: 44, height: 44, minWidth: 44,
 display: 'flex', alignItems: 'center', justifyContent: 'center',
 background: done ? 'rgba(0,230,118,0.08)' : 'rgba(255,255,255,0.04)',
 border: `1px solid ${done ? 'rgba(0,230,118,0.15)' : T.border}`,
 borderRadius: side === 'left' ? '12px 0 0 12px' : '0 12px 12px 0',
 cursor: 'pointer', color: done ? T.success : T.text2,
 transition: 'all 0.15s', flexShrink: 0,
 WebkitTapHighlightColor: 'transparent',
 });

 const fieldLabel = unit || placeholder || 'value';

 if (editing) {
 return (
 <input ref={inputRef} type="number" inputMode="decimal" value={value}
 aria-label={`Edit ${fieldLabel}`}
 onChange={e => onChange(e.target.value)}
 onBlur={handleBlur}
 onKeyDown={e => { if (e.key === 'Enter') handleBlur; }}
 style={{
 width: '100%', height: 44, background: 'rgba(255,255,255,0.06)',
 border: `2px solid ${T.accent}`, borderRadius: '12px',
 padding: '0 8px', textAlign: 'center', color: T.text,
 fontSize: '16px', fontWeight: 700, fontFamily: T.mono, outline: 'none',
 }}
 />
 );
 }

 return (
 <div style={{ display: 'flex', alignItems: 'center', width: '100%' }} role="group" aria-label={`${fieldLabel} stepper`}>
 <button onClick={decrement} aria-label={`Decrease ${fieldLabel}`} style={btnStyle('left')}>
 <Minus size={16} strokeWidth={2.5} />
 </button>
 <button onClick={ => setEditing(true)} aria-label={`${value || 'empty'} ${fieldLabel}, tap to edit`} style={{
 flex: 1, height: 44, minWidth: 56,
 display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
 background: done ? 'rgba(0,230,118,0.06)' : 'rgba(255,255,255,0.02)',
 borderTop: `1px solid ${done ? 'rgba(0,230,118,0.15)' : T.border}`,
 borderBottom: `1px solid ${done ? 'rgba(0,230,118,0.15)' : T.border}`,
 cursor: 'pointer', padding: 0,
 WebkitTapHighlightColor: 'transparent',
 }}>
 <span style={{
 fontSize: '16px', fontWeight: 700, fontFamily: T.mono,
 color: value ? (done ? T.success : (color || T.text)) : T.text3,
 lineHeight: 1,
 }}>
 {value || placeholder || '—'}
 </span>
 {unit && <span style={{ fontSize: '10px', color: T.text3, marginTop: '1px', lineHeight: 1 }}>{unit}</span>}
 </button>
 <button onClick={increment} aria-label={`Increase ${fieldLabel}`} style={btnStyle('right')}>
 <Plus size={16} strokeWidth={2.5} />
 </button>
 </div>
 );
}

function SetRow({ index, set, reps, onUpdate, onToggle, onSetType, weightUnit = 'lbs', showRPE = true, weightIncrement = 5, category = '', prescription = null }) {
 const prescWeight = prescription?.prescribedWeight;
 const prescReps = prescription?.prescribedReps;
 const showTarget = prescription && !set.done && index === 0;

 const SET_TYPES = ['working', 'warmup', 'drop', 'failure', 'amrap'];
 const SET_TYPE_META = {
 working: { label: null, color: null },
 warmup: { label: 'W', color: T.text3, bg: 'rgba(255,255,255,0.08)' },
 drop: { label: 'D', color: T.accent, bg: T.accentSoft },
 failure: { label: 'F', color: T.danger, bg: 'rgba(255,82,82,0.12)' },
 amrap: { label: 'A', color: T.teal, bg: T.tealGlow },
 };
 const currentType = set.setType || 'working';
 const typeMeta = SET_TYPE_META[currentType];

 const cycleType = => {
 const idx = SET_TYPES.indexOf(currentType);
 const next = SET_TYPES[(idx + 1) % SET_TYPES.length];
 onSetType?.(index, next);
 };

 return (
 <div style={{
 display: 'flex', flexDirection: 'column', gap: '8px',
 padding: '12px', marginBottom: '8px',
 background: set.done ? 'rgba(0,230,118,0.04)' : currentType === 'warmup' ? 'rgba(255,255,255,0.01)' : 'rgba(255,255,255,0.015)',
 borderRadius: '12px', border: `1px solid ${set.done ? 'rgba(0,230,118,0.1)' : 'rgba(255,255,255,0.03)'}`,
 animation: `fadeUp 0.3s ease-out ${index * 0.05}s both`,
 transition: 'all 0.2s',
 }}>
 {/* Row label + check button */}
 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
 <span style={{
 fontSize: '11px', fontWeight: 700, color: set.done ? T.success : T.text3,
 textTransform: 'uppercase', letterSpacing: '0.5px',
 display: 'flex', alignItems: 'center', gap: '6px',
 }}>
 {/* Set type badge — tap to cycle */}
 {typeMeta.label ? (
 <button onClick={(e) => { e.stopPropagation; cycleType; }}
 title={`Set type: ${currentType}. Tap to change.`}
 aria-label={`Set type: ${currentType}. Tap to cycle through types.`}
 style={{
 width: 28, height: 28, minWidth: 28, borderRadius: '7px', border: 'none',
 background: typeMeta.bg, color: typeMeta.color, fontSize: '11px', fontWeight: 800,
 cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
 fontFamily: T.mono, padding: '8px', lineHeight: 1, boxSizing: 'content-box',
 }}>
 {typeMeta.label}
 </button>
 ) : (
 <button onClick={(e) => { e.stopPropagation; cycleType; }}
 title="Working set. Tap to change type."
 aria-label="Working set. Tap to cycle through set types."
 style={{
 width: 28, height: 28, minWidth: 28, borderRadius: '7px',
 border: `1px dashed rgba(255,255,255,0.1)`, background: 'transparent',
 color: T.text3, fontSize: '11px', fontWeight: 600, cursor: 'pointer',
 display: 'flex', alignItems: 'center', justifyContent: 'center',
 fontFamily: T.mono, padding: '8px', opacity: 0.4, boxSizing: 'content-box',
 }}>
 {index + 1}
 </button>
 )}
 Set {index + 1}
 {set.done && <Check size={11} style={{ marginLeft: 4, verticalAlign: 'middle' }} />}
 {/* Show delta after completing */}
 {set.done && prescWeight > 0 && parseFloat(set.weight) > 0 && (
 <span style={{ marginLeft: 6, fontSize: '10px', fontWeight: 500,
 color: parseFloat(set.weight) > prescWeight ? T.success : parseFloat(set.weight) < prescWeight ? T.warn : T.text3
 }}>
 {parseFloat(set.weight) > prescWeight ? `↑${(parseFloat(set.weight) - prescWeight)} ${weightUnit}` :
 parseFloat(set.weight) < prescWeight ? `↓${(prescWeight - parseFloat(set.weight))} ${weightUnit}` : '→ on target'}
 </span>
 )}
 </span>
 <button onClick={ => onToggle(index)}
 aria-label={set.done ? `Unmark set ${index + 1} as done` : `Mark set ${index + 1} as done${!set.weight && !set.reps ? ' (enter weight or reps first)' : ''}`}
 style={{
 width: 48, height: 48, minWidth: 48, borderRadius: '14px',
 border: set.done ? 'none' : `2px solid ${set.weight || set.reps ? T.accent : T.text3}`,
 background: set.done
 ? T.success
 : (set.weight || set.reps)
 ? `linear-gradient(135deg, ${T.accent}, #FF8C42)`
 : 'rgba(255,255,255,0.03)',
 display: 'flex', alignItems: 'center', justifyContent: 'center',
 cursor: 'pointer', transition: 'all 0.2s',
 boxShadow: set.done ? `0 4px 16px rgba(0,230,118,0.25)` : (set.weight || set.reps) ? `0 4px 16px ${T.accentGlow}` : 'none',
 }}>
 <Check size={22} color={set.done ? '#07070E' : (set.weight || set.reps ? '#fff' : T.text3)} strokeWidth={3} />
 </button>
 </div>

 {/* Stepper fields row */}
 <div style={{ display: 'grid', gridTemplateColumns: showRPE ? '1fr 1fr 0.8fr' : '1fr 1fr', gap: '8px' }}>
 <div>
 <div style={{ fontSize: '10px', color: T.text3, textTransform: 'uppercase', letterSpacing: '0.3px',
 marginBottom: '4px', textAlign: 'center', fontWeight: 600 }}>Weight</div>
 <StepperField
 value={set.weight} onChange={v => onUpdate(index, 'weight', v)}
 step={weightIncrement} min={0} max={999}
 unit={weightUnit} placeholder="0" done={set.done}
 />
 </div>
 <div>
 <div style={{ fontSize: '10px', color: T.text3, textTransform: 'uppercase', letterSpacing: '0.3px',
 marginBottom: '4px', textAlign: 'center', fontWeight: 600 }}>Reps</div>
 <StepperField
 value={set.reps} onChange={v => onUpdate(index, 'reps', v)}
 step={1} min={0} max={100}
 placeholder={reps || '—'} done={set.done} color={T.teal}
 />
 </div>
 {showRPE && (
 <div>
 <div style={{ fontSize: '10px', color: T.text3, textTransform: 'uppercase', letterSpacing: '0.3px',
 marginBottom: '4px', textAlign: 'center', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '3px' }}>
 RPE
 <span title="Rate of Perceived Exertion (1-10).&#10;6 = Could do 4+ more reps&#10;7 = Could do 3 more&#10;8 = Could do 2 more&#10;9 = Could do 1 more&#10;10 = Max effort (avoid)"
 style={{ cursor: 'help', opacity: 0.7, display: 'inline-flex' }}>
 <Info size={10} />
 </span>
 </div>
 <StepperField
 value={set.rpe} onChange={v => onUpdate(index, 'rpe', v)}
 step={0.5} min={1} max={10}
 placeholder="—" done={set.done} color={T.warn}
 />
 </div>
 )}
 </div>
 </div>
 );
}

function ExerciseCard({ exercise, onUpdate, onSwapExercise, onRemoveExercise, stats, weightUnit = 'lbs', defaultRestTimer = 90, showRPE = true, goToSettings, autoStartTimer = true, timerVibrate = true, weightIncrementUpper = 5, weightIncrementLower = 10, trainingGoal = 'hypertrophy', enableProgressiveOverload = true, restEndTime = null, onRestTimerChange, onPRDetected }) {
 const [expanded, setExpanded] = useState(false);
 const [showCues, setShowCues] = useState(false);
 const [showSwapPanel, setShowSwapPanel] = useState(false);
 const [sessionPRs, setSessionPRs] = useState([]);
 
 const completedSets = exercise.logSets?.filter(s => s.done).length || 0;
 const totalSets = exercise.logSets?.length || 0;
 const allDone = completedSets === totalSets && totalSets > 0;
 const phaseData = exercise.phase?.[stats?.phase || 'acute'] || {};

 const isUpper = UPPER_CATEGORIES.has(exercise.category);
 const weightIncrement = isUpper ? weightIncrementUpper : weightIncrementLower;

 // Progressive overload data
 const prescription = exercise.prescription || null;
 const stall = enableProgressiveOverload ? detectStall(exercise.id) : { stalled: false, fatigued: false };
 const e1RM = prescription?.estimated1RM || 0;

 const updateSet = (idx, field, value) => {
 // Sanitize numeric fields: reject negative values
 let sanitized = value;
 if ((field === 'weight' || field === 'reps') && value !== '') {
 const num = parseFloat(value);
 if (!isNaN(num) && num < 0) sanitized = '0';
 }
 if (field === 'rpe' && value !== '') {
 const num = parseFloat(value);
 if (!isNaN(num)) sanitized = String(Math.max(1, Math.min(10, num)));
 }
 const newSets = [.exercise.logSets];
 newSets[idx] = {.newSets[idx], [field]: sanitized };
 onUpdate({.exercise, logSets: newSets });
 };

 const updateSetType = (idx, type) => {
 const newSets = [.exercise.logSets];
 newSets[idx] = {.newSets[idx], setType: type };
 onUpdate({.exercise, logSets: newSets });
 };

 const toggleSet = (idx) => {
 const newSets = [.exercise.logSets];
 const wasDone = newSets[idx].done;
 // Prevent marking done if both weight and reps are empty (avoids zero-volume logs)
 if (!wasDone && !newSets[idx].weight && !newSets[idx].reps) {
 return; // Don't toggle — require at least reps to be entered
 }
 newSets[idx] = {.newSets[idx], done: !wasDone };
 onUpdate({.exercise, logSets: newSets });
 // Auto-start rest timer when marking a set as done (not when un-marking)
 if (!wasDone && autoStartTimer) {
 const restDuration = exercise.rest || defaultRestTimer || 90;
 onRestTimerChange?.(Date.now + restDuration * 1000);
 }
 // PR detection on set completion
 if (!wasDone) {
 try {
 const prs = detectPRs(exercise.id, newSets);
 if (prs.length > 0) {
 setSessionPRs(prs);
 onPRDetected?.(exercise.id, prs);
 }
 } catch(e) { /* silent */ }
 }
 };

 return (
 <div style={{
 background: allDone ? T.successSoft : T.bgCard,
 backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
 border: `1px solid ${allDone ? 'rgba(0,230,118,0.15)' : T.border}`,
 borderRadius: T.radius, marginBottom: '12px', overflow: 'hidden',
 transition: 'all 0.3s',
 }}>
 {/* Header */}
 <div onClick={ => setExpanded(!expanded)}
 role="button" tabIndex={0} aria-expanded={expanded}
 aria-label={`${exercise.name}, ${completedSets} of ${totalSets} sets completed${allDone ? ', exercise complete' : ''}. ${expanded ? 'Collapse' : 'Expand'} details.`}
 onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault; setExpanded(!expanded); } }}
 style={{
 padding: '16px', display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer',
 }}>
 <div style={{
 width: 40, height: 40, borderRadius: '12px',
 background: allDone ? T.successSoft : T.accentSoft,
 display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
 }}>
 {allDone ? <Check size={20} color={T.success} /> : <Dumbbell size={18} color={T.accent} />}
 </div>
 <div style={{ flex: 1, minWidth: 0 }}>
 <div style={{ fontSize: '15px', fontWeight: 600, lineHeight: 1.3 }}>{exercise.name}</div>
 <div style={{ display: 'flex', gap: '6px', alignItems: 'center', marginTop: '2px', flexWrap: 'wrap' }}>
 <span style={{ fontSize: '12px', color: T.text3 }}>{exercise.sets}×{exercise.reps}</span>
 {e1RM > 0 && (
 <span style={{ fontSize: '10px', color: T.teal, background: T.tealGlow, padding: '1px 6px', borderRadius: '4px' }}>
 e1RM: {e1RM} {weightUnit}
 </span>
 )}
 {prescription?.action === 'increase_weight' && (
 <span style={{ fontSize: '10px', color: T.success, background: T.successSoft, padding: '1px 6px', borderRadius: '4px' }}>
 ↑ Progress
 </span>
 )}
 {prescription?.action === 'decrease_weight' && (
 <span style={{ fontSize: '10px', color: T.warn, background: T.warnSoft, padding: '1px 6px', borderRadius: '4px' }}>
 ↓ Deload
 </span>
 )}
 {prescription?.action === 'progress_exercise' && (
 <span style={{ fontSize: '10px', color: T.success, background: T.successSoft, padding: '1px 6px', borderRadius: '4px' }}>
 🚀 Ready to advance
 </span>
 )}
 {prescription?.action === 'regress_exercise' && (
 <span style={{ fontSize: '10px', color: T.warn, background: T.warnSoft, padding: '1px 6px', borderRadius: '4px' }}
 title={`Stalled — consider switching to ${prescription.regressionExercise || 'easier variant'}`}>
 ↓ Try easier variant
 </span>
 )}
 {stall.stalled && (
 <span style={{ fontSize: '10px', color: T.danger, background: 'rgba(255,82,82,0.1)', padding: '1px 6px', borderRadius: '4px' }}
 title="Weight and reps unchanged for 3+ sessions">
 ⚠ Stalled
 </span>
 )}
 {stall.fatigued && !stall.stalled && (
 <span style={{ fontSize: '10px', color: T.warn, background: T.warnSoft, padding: '1px 6px', borderRadius: '4px' }}
 title="RPE trending upward at same load">
 ⚡ Fatigue
 </span>
 )}
 {phaseData.s === 'caution' && (
 <span style={{ fontSize: '10px', color: T.warn, background: T.warnSoft, padding: '1px 6px', borderRadius: '4px' }}>
 ⚠ caution
 </span>
 )}
 {!exercise.mandatory && (
 <span style={{ fontSize: '10px', color: T.teal, background: T.tealGlow, padding: '1px 6px', borderRadius: '4px' }}>
 bonus
 </span>
 )}
 </div>
 </div>
 <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
 <div
 onClick={(e) => { e.stopPropagation; window.open(getVideoUrl(exercise.id, exercise.name), '_blank'); }}
 role="button" tabIndex={0} aria-label="Watch form tutorial video"
 onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault; e.stopPropagation; window.open(getVideoUrl(exercise.id, exercise.name), '_blank'); } }}
 style={{
 width: 32, height: 32, borderRadius: '8px',
 background: 'rgba(255,0,0,0.12)',
 display: 'flex', alignItems: 'center', justifyContent: 'center',
 flexShrink: 0, cursor: 'pointer', transition: 'background 0.2s',
 padding: '6px',
 }}
 onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,0,0,0.25)'}
 onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,0,0,0.12)'}
 title="Watch form tutorial"
 >
 <Play size={14} color="#FF4444" fill="#FF4444" />
 </div>
 <span aria-label={`${completedSets} of ${totalSets} sets completed`} style={{ fontSize: '13px', fontFamily: T.mono, color: allDone ? T.success : T.text2 }}>
 {completedSets}/{totalSets}
 </span>
 <ChevronDown size={18} color={T.text3} style={{ transform: expanded ? 'rotate(180deg)' : 'none', transition: '0.2s' }} aria-hidden="true" />
 </div>
 </div>

 {/* Progress bar */}
 <div role="progressbar" aria-valuenow={completedSets} aria-valuemin={0} aria-valuemax={totalSets}
 aria-label={`${exercise.name} progress`}
 style={{ height: '2px', background: 'rgba(255,255,255,0.04)' }}>
 <div style={{ height: '100%', width: `${(completedSets/totalSets)*100}%`, 
 background: allDone ? T.success : `linear-gradient(90deg, ${T.accent}, ${T.teal})`,
 transition: 'width 0.4s ease-out', borderRadius: '2px' }} />
 </div>

 {/* Expanded content */}
 {expanded && (
 <div style={{ padding: '0 16px 16px', animation: 'fadeUp 0.2s ease-out' }}>
 {/* Phase note */}
 {phaseData.n && (
 <div style={{ fontSize: '12px', color: T.text2, padding: '10px 12px', margin: '12px 0 8px',
 background: 'rgba(255,255,255,0.02)', borderRadius: '8px', borderLeft: `3px solid ${T.accent}` }}>
 {phaseData.n}
 </div>
 )}

 {/* Prescription target */}
 {enableProgressiveOverload && prescription && (
 <div style={{
 padding: '10px 12px', margin: '8px 0', borderRadius: '8px',
 background: prescription.action === 'increase_weight' ? 'rgba(0,230,118,0.05)'
 : prescription.action === 'decrease_weight' ? 'rgba(255,183,77,0.05)'
 : 'rgba(78,205,196,0.05)',
 border: `1px solid ${prescription.action === 'increase_weight' ? 'rgba(0,230,118,0.1)'
 : prescription.action === 'decrease_weight' ? 'rgba(255,183,77,0.1)'
 : 'rgba(78,205,196,0.08)'}`,
 }}>
 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
 <div>
 <div style={{ fontSize: '11px', fontWeight: 600, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.3px', marginBottom: '2px' }}>Target</div>
 <div style={{ fontSize: '14px', fontWeight: 700, fontFamily: T.mono, color: T.text }}>
 {prescription.prescribedWeight > 0 ? `${prescription.prescribedWeight} ${weightUnit} × ${prescription.prescribedReps}` : `${prescription.prescribedReps} reps`}
 </div>
 </div>
 <div style={{ textAlign: 'right' }}>
 {prescription.lastWeight > 0 && (
 <div style={{ fontSize: '11px', color: T.text3 }}>
 Last: {prescription.lastWeight} × {prescription.lastAvgReps}
 </div>
 )}
 <div style={{ fontSize: '11px', color:
 prescription.action === 'increase_weight' ? T.success
 : prescription.action === 'decrease_weight' ? T.warn
 : T.teal,
 fontWeight: 600
 }}>
 {prescription.action === 'increase_weight' && `↑ +${(prescription.prescribedWeight - prescription.lastWeight)} ${weightUnit}`}
 {prescription.action === 'decrease_weight' && `↓ Deload -${(prescription.lastWeight - prescription.prescribedWeight)} ${weightUnit}`}
 {prescription.action === 'add_rep' && '→ Add rep'}
 {prescription.action === 'maintain' && '→ Maintain'}
 {prescription.action === 'progress_exercise' && `🚀 → ${prescription.progressionExercise}`}
 </div>
 </div>
 </div>
 {prescription.action === 'progress_exercise' && prescription.progressionExercise && onSwapExercise && (
 <button
 onClick={(e) => { e.stopPropagation; onSwapExercise(exercise.id, prescription.progressionIds?.[0] || null); }}
 style={{
 marginTop: '8px', width: '100%', padding: '8px', borderRadius: '8px', border: `1px solid rgba(0,230,118,0.2)`,
 background: 'rgba(0,230,118,0.08)', color: T.success, fontSize: '12px', fontWeight: 600,
 cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
 }}
 >
 🚀 Swap to {prescription.progressionExercise}
 </button>
 )}
 </div>
 )}

 {/* Per-set last session display */}
 {exercise.lastSessionSets && exercise.lastSessionSets.length > 0 && ( => {
 const setsText = exercise.lastSessionSets.map((s, i) => {
 const lbl = s.weight > 0 ? (s.weight + '\u00D7' + s.reps) : (s.reps + ' reps');
 const isLast = i === exercise.lastSessionSets.length - 1;
 return isLast ? lbl : lbl + ', ';
 }).join('');
 return (
 <div style={{ fontSize: '11px', color: T.text3, fontFamily: T.mono, padding: '6px 0 2px', display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap' }}>
 <RotateCcw size={10} style={{ opacity: 0.5, flexShrink: 0 }} />
 <span style={{ opacity: 0.6 }}>{'Last: '}</span>
 <span>{setsText}</span>
 </div>
 );
 })}
 {!exercise.lastSessionSets && !prescription && (
 <div style={{ fontSize: '11px', color: T.text3, padding: '4px 0 2px', opacity: 0.5, fontStyle: 'italic' }}>
 {'First time \u2014 no previous data'}
 </div>
 )}

 {/* PR badges */}
 {sessionPRs.length > 0 && (
 <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', padding: '6px 0' }}>
 {sessionPRs.map((pr, i) => {
 let label = '';
 if (pr.type === 'weight') label = 'Weight PR! ' + pr.value + ' ' + weightUnit;
 if (pr.type === 'volume') label = 'Volume PR! ' + pr.value.toLocaleString + ' ' + weightUnit;
 if (pr.type === 'e1rm') label = 'e1RM PR! ' + pr.value + ' ' + weightUnit;
 if (pr.type === 'reps') label = 'Rep PR! ' + pr.value + ' reps' + (pr.weightTier > 0 ? (' @ ' + pr.weightTier + weightUnit) : '');
 return (
 <div key={i} style={{
 display: 'inline-flex', alignItems: 'center', gap: '4px',
 background: 'rgba(255,215,0,0.1)', border: '1px solid rgba(255,215,0,0.25)',
 borderRadius: '8px', padding: '3px 8px', fontSize: '11px', fontWeight: 600,
 color: '#FFD700', animation: 'fadeUp 0.3s ease-out both',
 }}>
 <Trophy size={11} />
 {label}
 </div>
 );
 })}
 </div>
 )}

 {/* Set header */}
 {exercise.logSets?.length > 0 && (
 <div style={{ fontSize:'11px', color:T.text3, padding:'8px 0 4px', fontWeight:600,
 display:'flex', justifyContent:'space-between', alignItems:'center' }}>
 <span>
 {completedSets}/{totalSets} sets · {weightIncrement}{weightUnit}/step
 </span>
 {exercise.logSets.some(s => s.weight || s.reps) && !allDone && (
 <span style={{ fontSize:'10px', color:T.accent, fontWeight:500 }}>
 Pre-filled from last session
 </span>
 )}
 </div>
 )}

 {/* Sets */}
 {exercise.logSets?.map((set, i) => (
 <SetRow key={i} index={i} set={set} reps={exercise.reps} onUpdate={updateSet} onToggle={toggleSet} onSetType={updateSetType}
 weightUnit={weightUnit} showRPE={showRPE} weightIncrement={weightIncrement} category={exercise.category}
 prescription={enableProgressiveOverload ? prescription : null} />
 ))}

 {/* Rest timer */}
 {restEndTime && !allDone && (
 <div style={{ marginTop: '12px', position:'relative' }}>
 <RestTimer endTime={restEndTime} duration={exercise.rest || defaultRestTimer} onComplete={ => onRestTimerChange?.(null)} onPauseState={(newEnd) => onRestTimerChange?.(newEnd)} vibrate={timerVibrate} />
 {goToSettings && (
 <button onClick={(e) => { e.stopPropagation; goToSettings('workout'); }}
 title="Timer settings"
 style={{ position:'absolute', top:'10px', right:'0px', background:'none', border:'none',
 color:T.text3, cursor:'pointer', padding:'10px', opacity:0.4, zIndex:2, minWidth:'44px', minHeight:'44px',
 display:'flex', alignItems:'center', justifyContent:'center' }}>
 <Settings size={14} />
 </button>
 )}
 </div>
 )}

 {/* Skip / Swap Exercise Panel */}
 <div style={{ display:'flex', gap:'8px', marginTop:'12px' }}>
 <button onClick={(e) => { e.stopPropagation; setShowSwapPanel(!showSwapPanel); }}
 style={{ background: showSwapPanel ? 'rgba(255,82,82,0.1)' : 'rgba(255,255,255,0.04)', 
 border:`1px solid ${showSwapPanel ? 'rgba(255,82,82,0.2)' : T.border}`, 
 borderRadius:'8px', color: showSwapPanel ? T.danger : T.text3, fontSize:'12px',
 cursor:'pointer', display:'flex', alignItems:'center', gap:'4px', padding:'10px 14px',
 transition:'all 0.2s', fontWeight:500, minHeight:'44px' }}>
 <Shuffle size={13} /> {showSwapPanel ? 'Cancel' : 'Swap / Skip'}
 </button>
 </div>

 {showSwapPanel && ( => {
 const currentPhase = stats?.phase || 'acute';
 const currentLocation = stats?.location || 'gym';
 // Build alternatives: exercise.subs first, then same-category exercises
 const subsFromDb = (exercise.subs || [])
.map(id => EXERCISES.find(e => e.id === id))
.filter(e => e && e.phase?.[currentPhase]?.s !== 'avoid' && e.location?.[currentLocation]);
 
 const sameCategoryAlts = EXERCISES.filter(e => 
 e.category === exercise.category && 
 e.id !== exercise.id && 
 !subsFromDb.find(s => s.id === e.id) &&
 e.phase?.[currentPhase]?.s !== 'avoid' && 
 e.location?.[currentLocation]
 ).sort((a, b) => (b.phase?.[currentPhase]?.p || 0) - (a.phase?.[currentPhase]?.p || 0))
.slice(0, 5);

 const primarySub = subsFromDb[0] || null;
 const secondaryAlts = [.subsFromDb.slice(1),.sameCategoryAlts].slice(0, 6);

 return (
 <div style={{ marginTop:'8px', padding:'12px', background:'rgba(255,82,82,0.04)', 
 borderRadius:'10px', border:`1px solid rgba(255,82,82,0.1)`, animation:'fadeUp 0.2s ease-out' }}>
 <div style={{ fontSize:'11px', fontWeight:600, color:T.text3, textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:'10px' }}>
 Replace "{exercise.name}"
 </div>

 {/* Primary suggestion */}
 {primarySub && (
 <button onClick={(e) => { e.stopPropagation; onSwapExercise(exercise.id, primarySub.id); setShowSwapPanel(false); }}
 style={{
 width:'100%', padding:'10px 12px', marginBottom:'8px', borderRadius:'10px',
 background:`linear-gradient(135deg, rgba(0,230,118,0.08), rgba(78,205,196,0.06))`,
 border:`1px solid rgba(0,230,118,0.15)`, cursor:'pointer', textAlign:'left',
 display:'flex', alignItems:'center', gap:'10px', transition:'all 0.2s',
 }}
 onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,230,118,0.12)'}
 onMouseLeave={e => e.currentTarget.style.background = 'linear-gradient(135deg, rgba(0,230,118,0.08), rgba(78,205,196,0.06))'}
 >
 <div style={{ width:28, height:28, borderRadius:'8px', background:T.successSoft, 
 display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
 <Star size={14} color={T.success} />
 </div>
 <div style={{ flex:1 }}>
 <div style={{ fontSize:'13px', fontWeight:600, color:T.text }}>{primarySub.name}</div>
 <div style={{ fontSize:'11px', color:T.text3 }}>
 Suggested · {primarySub.sets}×{primarySub.reps} · {primarySub.phase?.[currentPhase]?.s || 'suitable'}
 </div>
 </div>
 <ArrowRight size={14} color={T.success} />
 </button>
 )}

 {/* Secondary alternatives */}
 {secondaryAlts.length > 0 && (
 <div style={{ marginBottom:'8px' }}>
 <div style={{ fontSize:'10px', color:T.text3, marginBottom:'4px', paddingLeft:'2px' }}>Other options:</div>
 <div style={{ display:'flex', flexDirection:'column', gap:'4px' }}>
 {secondaryAlts.map(alt => (
 <button key={alt.id} onClick={(e) => { e.stopPropagation; onSwapExercise(exercise.id, alt.id); setShowSwapPanel(false); }}
 style={{
 padding:'10px 12px', borderRadius:'8px', background:T.bgCard, border:`1px solid ${T.border}`,
 cursor:'pointer', textAlign:'left', display:'flex', alignItems:'center', gap:'8px',
 transition:'all 0.15s', color:T.text, fontSize:'12px', minHeight:'44px',
 }}
 onMouseEnter={e => e.currentTarget.style.background = T.bgCardHover}
 onMouseLeave={e => e.currentTarget.style.background = T.bgCard}
 >
 <Dumbbell size={12} color={T.text3} />
 <span style={{ flex:1 }}>{alt.name}</span>
 <span style={{ fontSize:'10px', color:T.text3 }}>{alt.sets}×{alt.reps}</span>
 </button>
 ))}
 </div>
 </div>
 )}

 {/* Remove entirely */}
 {onRemoveExercise && (
 <button onClick={(e) => { e.stopPropagation; onRemoveExercise(exercise.id); setShowSwapPanel(false); }}
 style={{
 width:'100%', padding:'12px', borderRadius:'8px',
 background:'rgba(255,82,82,0.06)', border:`1px solid rgba(255,82,82,0.12)`,
 cursor:'pointer', display:'flex', alignItems:'center', gap:'8px', justifyContent:'center',
 color:T.danger, fontSize:'12px', fontWeight:500, transition:'all 0.15s', minHeight:'44px',
 }}
 onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,82,82,0.12)'}
 onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,82,82,0.06)'}
 >
 <XCircle size={13} /> Remove from today's workout
 </button>
 )}
 </div>
 );
 })}

 {/* Cues toggle */}
 <button onClick={(e) => { e.stopPropagation; setShowCues(!showCues); }}
 style={{ marginTop:'12px', background:'none', border:'none', color:T.teal, fontSize:'13px',
 cursor:'pointer', display:'flex', alignItems:'center', gap:'6px', padding:'10px 0', minHeight:'44px' }}>
 <Info size={14} /> {showCues ? 'Hide cues' : 'Show cues & tips'}
 </button>

 {showCues && (
 <div style={{ marginTop:'8px', animation:'fadeUp 0.2s ease-out' }}>
 <div style={{ marginBottom:'8px' }}>
 <div style={{ fontSize:'11px', fontWeight:600, color:T.teal, textTransform:'uppercase',
 letterSpacing:'0.5px', marginBottom:'6px' }}>Cues</div>
 {exercise.cues?.map((c,i) => (
 <div key={i} style={{ fontSize:'12px', color:T.text2, padding:'4px 0', paddingLeft:'12px',
 borderLeft:`2px solid ${T.teal}`, marginBottom:'4px' }}>{c}</div>
 ))}
 </div>
 {exercise.mistakes?.length > 0 && (
 <div>
 <div style={{ fontSize:'11px', fontWeight:600, color:T.warn, textTransform:'uppercase',
 letterSpacing:'0.5px', marginBottom:'6px' }}>Avoid</div>
 {exercise.mistakes.map((m,i) => (
 <div key={i} style={{ fontSize:'12px', color:T.text2, padding:'4px 0', paddingLeft:'12px',
 borderLeft:`2px solid ${T.warn}`, marginBottom:'4px' }}>
 <strong style={{color:T.text}}>{m.m}</strong> — {m.f}
 </div>
 ))}
 </div>
 )}
 {exercise.why && (
 <div style={{ marginTop:'8px', fontSize:'12px', color:T.text3, fontStyle:'italic' }}>
 💡 {exercise.why}
 </div>
 )}
 </div>
 )}
 </div>
 )}
 </div>
 );
}

function Toast({ message, xp }) {
 return (
 <div role="alert" aria-live="assertive" style={{
 position: 'fixed', bottom: '80px', left: '50%', transform: 'translateX(-50%)',
 background: 'rgba(255,107,53,0.95)', color: 'white', padding: '10px 20px',
 borderRadius: '24px', fontSize: '14px', fontWeight: 600, zIndex: 1000,
 animation: 'toast 2.5s ease-out forwards', display: 'flex', alignItems: 'center', gap: '8px',
 boxShadow: '0 8px 32px rgba(255,107,53,0.3)',
 }}>
 <Zap size={16} /> {message} {xp && <span style={{opacity:0.8}}>+{xp} XP</span>}
 </div>
 );
}

function MuscleMap({ recentMuscles }) {
 // Simplified front/back body SVG with muscle group regions
 const muscles = {
 chest: { x:45, y:22, w:10, label:'Chest' },
 shoulders: { x:33, y:18, w:8, label:'Shoulders' },
 back: { x:45, y:25, w:10, label:'Back' },
 biceps: { x:30, y:30, w:6, label:'Biceps' },
 triceps: { x:60, y:30, w:6, label:'Triceps' },
 core: { x:45, y:35, w:8, label:'Core' },
 quads: { x:40, y:52, w:8, label:'Quads' },
 hamstrings: { x:50, y:52, w:8, label:'Hamstrings' },
 glutes: { x:45, y:45, w:8, label:'Glutes' },
 calves: { x:45, y:68, w:6, label:'Calves' },
 };

 const getColor = (cat) => {
 // Merge sub-muscle-group hours into display groups
 let hours = recentMuscles?.[cat];
 if (cat === 'shoulders') {
 const variants = ['shoulders', 'side_delts', 'rear_delts', 'front_delts'];
 const found = variants.map(k => recentMuscles?.[k]).filter(v => v !== undefined);
 if (found.length > 0) hours = Math.min(.found);
 }
 if (!hours && hours !== 0) return 'rgba(255,255,255,0.06)';
 if (hours < 48) return T.success;
 if (hours < 96) return T.warn;
 return T.danger;
 };

 return (
 <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:'6px' }}>
 {Object.entries(muscles).map(([key, m]) => (
 <div key={key} style={{
 background: getColor(key), borderRadius:'8px', padding:'10px 4px',
 textAlign:'center', fontSize:'10px', color:T.text, fontWeight:500,
 transition:'all 0.3s', border:`1px solid ${T.border}`,
 }}>
 {m.label}
 </div>
 ))}
 </div>
 );
}

function CalendarHeatmap({ history, onDayClick }) {
 const now = new Date;
 const [monthOffset, setMonthOffset] = useState(0);
 const viewDate = new Date(now.getFullYear, now.getMonth + monthOffset, 1);
 const daysInMonth = new Date(viewDate.getFullYear, viewDate.getMonth + 1, 0).getDate;
 const startDay = viewDate.getDay;
 const monthStr = viewDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
 const yymm = `${viewDate.getFullYear}-${String(viewDate.getMonth+1).padStart(2,'0')}`;

 return (
 <GlassCard animate={false} style={{ padding:'16px' }}>
 <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'12px' }}>
 <button onClick={ => setMonthOffset(m => m-1)} aria-label="Previous month" style={{ background:'none', border:'none', color:T.text2, cursor:'pointer', padding:'8px' }}>‹</button>
 <span style={{ fontSize:'14px', fontWeight:600 }}>{monthStr}</span>
 <button onClick={ => setMonthOffset(m => Math.min(m+1, 0))} aria-label="Next month" style={{ background:'none', border:'none', color:T.text2, cursor:'pointer', padding:'8px' }}>›</button>
 </div>
 <div role="grid" aria-label={`Activity calendar for ${monthStr}`} style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:'4px', textAlign:'center' }}>
 {['S','M','T','W','T','F','S'].map((d,i) => (
 <div key={i} style={{ fontSize:'10px', color:T.text3, padding:'4px 0', fontWeight:600 }}>{d}</div>
 ))}
 {Array(startDay).fill(null).map((_,i) => <div key={`p${i}`} />)}
 {Array.from({length:daysInMonth}, (_,i) => {
 const d = i+1;
 const dateStr = `${yymm}-${String(d).padStart(2,'0')}`;
 const acts = history[dateStr] || [];
 const hasWorkout = acts.includes('workout');
 const hasRehab = acts.includes('rehab');
 const hasCardio = acts.includes('cardio');
 const hasAny = acts.length > 0;
 const isToday = dateStr === today;

 let bg = 'rgba(255,255,255,0.03)';
 if (hasWorkout) bg = T.accent;
 else if (hasRehab || hasCardio) bg = T.teal;

 const activityDesc = [hasWorkout && 'workout', hasRehab && 'rehab', hasCardio && 'cardio'].filter(Boolean).join(', ') || 'no activity';
 const fullDate = new Date(viewDate.getFullYear, viewDate.getMonth, d).toLocaleDateString('en-US', { weekday:'long', month:'long', day:'numeric' });

 return (
 <div key={d} role="gridcell"
 aria-label={`${fullDate}${isToday ? ' (today)' : ''}, ${activityDesc}`}
 tabIndex={hasAny ? 0 : -1}
 onClick={ => hasAny && onDayClick?.(dateStr)}
 onKeyDown={(e) => { if (hasAny && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault; onDayClick?.(dateStr); } }}
 style={{
 aspectRatio:'1', borderRadius:'8px', display:'flex', alignItems:'center', justifyContent:'center',
 fontSize:'12px', fontWeight: hasAny ? 600 : 400,
 color: hasAny ? '#fff' : T.text3, background:bg,
 border: isToday ? `2px solid ${T.accent}` : '1px solid transparent',
 transition:'all 0.2s', cursor: hasAny ? 'pointer' : 'default',
 }}>{d}</div>
 );
 })}
 </div>
 <div style={{ display:'flex', gap:'16px', justifyContent:'center', marginTop:'12px', fontSize:'10px', color:T.text3 }}>
 <div style={{ display:'flex', alignItems:'center', gap:'4px' }}>
 <div style={{ width:8, height:8, borderRadius:'3px', background:T.accent }} /> Workout
 </div>
 <div style={{ display:'flex', alignItems:'center', gap:'4px' }}>
 <div style={{ width:8, height:8, borderRadius:'3px', background:T.teal }} /> Rehab/Cardio
 </div>
 </div>
 </GlassCard>
 );
}

// ============================================================
// BODY LOG: Daily Entry Card
// ============================================================

function DailyLogCard({ settings, nutritionConfig, calibration, profile, onSave, onAddXP }) {
 const [selectedDate, setSelectedDate] = useState(today);
 const existing = LS.get(`bodyLog:${selectedDate}`, null);
 const prevLog = LS.get(`bodyLog:${subtractDays(selectedDate, 1)}`, null);

 const [weight, setWeight] = useState(existing?.weight != null ? String(existing.weight) : (prevLog?.weight ? String(prevLog.weight) : ''));
 const [calories, setCalories] = useState(existing?.calories != null ? String(existing.calories) : '');
 const [protein, setProtein] = useState(existing?.protein != null ? String(existing.protein) : '');
 const [bfValue, setBfValue] = useState(existing?.bodyFat?.value != null ? String(existing.bodyFat.value) : '');
 const [bfSource, setBfSource] = useState(existing?.bodyFat?.source ?? 'bia');
 const [waist, setWaist] = useState(existing?.waistCircumference != null ? String(existing.waistCircumference) : '');
 const [sleepHrs, setSleepHrs] = useState(existing?.sleep?.hours != null ? String(existing.sleep.hours) : '');
 const [sleepQuality, setSleepQuality] = useState(existing?.sleep?.quality ?? null);
 const [hrv, setHrv] = useState(existing?.sleep?.hrv != null ? String(existing.sleep.hrv) : '');
 const [notes, setNotes] = useState(existing?.notes ?? '');
 const [showMore, setShowMore] = useState(false);
 const [dexaBiaValue, setDexaBiaValue] = useState('');
 const [saved, setSaved] = useState(!!existing);

 // Reset form when date changes
 useEffect( => {
 const log = LS.get(`bodyLog:${selectedDate}`, null);
 const prev = LS.get(`bodyLog:${subtractDays(selectedDate, 1)}`, null);
 setWeight(log?.weight != null ? String(log.weight) : (prev?.weight ? String(prev.weight) : ''));
 setCalories(log?.calories != null ? String(log.calories) : '');
 setProtein(log?.protein != null ? String(log.protein) : '');
 setBfValue(log?.bodyFat?.value != null ? String(log.bodyFat.value) : '');
 setBfSource(log?.bodyFat?.source ?? 'bia');
 setWaist(log?.waistCircumference != null ? String(log.waistCircumference) : '');
 setSleepHrs(log?.sleep?.hours != null ? String(log.sleep.hours) : '');
 setSleepQuality(log?.sleep?.quality ?? null);
 setHrv(log?.sleep?.hrv != null ? String(log.sleep.hrv) : '');
 setNotes(log?.notes ?? '');
 setSaved(!!log);
 setDexaBiaValue('');
 }, [selectedDate]);

 const calibrated = bfValue && calibration?.points?.length > 0
 ? getCalibratedBodyFat(Number(bfValue), calibration) : null;

 const streaks = profile?.streaks || DEFAULT_STREAKS;
 const combinedStreak = streaks.combined?.current || 0;

 const handleSave = => {
 // Sanitize numeric inputs: reject non-positive weight, clamp calories
 const parsedWeight = weight ? Number(weight) : null;
 const parsedCals = calories ? Number(calories) : null;
 const parsedProtein = protein ? Number(protein) : null;
 const validWeight = (parsedWeight && parsedWeight > 0 && isFinite(parsedWeight)) ? parsedWeight : null;
 const validCals = (parsedCals && parsedCals > 0 && isFinite(parsedCals)) ? parsedCals : null;
 const validProtein = (parsedProtein && parsedProtein >= 0 && isFinite(parsedProtein)) ? parsedProtein : null;

 // Warn on suspiciously low/high calorie values
 if (validCals && (validCals < 200 || validCals > 15000)) {
 if (!window.confirm(`Calorie value of ${validCals} looks unusual. Save anyway?`)) return;
 }

 const log = {
 date: selectedDate,
 weight: validWeight,
 calories: validCals,
 protein: validProtein,
 bodyFat: bfValue ? {
 value: Number(bfValue),
 source: bfSource,
 device: calibration?.deviceId || '',
 calibratedValue: calibrated?.calibrated ? calibrated.value : null,
 } : null,
 waistCircumference: waist ? Number(waist) : null,
 sleep: (sleepHrs || sleepQuality || hrv) ? {
 hours: sleepHrs ? Number(sleepHrs) : null,
 quality: sleepQuality,
 hrv: hrv ? Number(hrv) : null,
 } : null,
 notes: notes || '',
 timestamp: Date.now,
 };

 // If DEXA source and we have a BIA reading too, auto-add calibration point
 const calPoint = (bfSource === 'dexa' && dexaBiaValue)
 ? { date: selectedDate, biaValue: Number(dexaBiaValue), dexaValue: Number(bfValue), weight: weight ? Number(weight) : null }
 : null;

 onSave(log, calPoint);
 setSaved(true);
 };

 const wUnit = settings?.weightUnit || 'lbs';
 const waistUnit = nutritionConfig?.waistUnit || 'in';
 const isToday = selectedDate === today;
 const isYesterday = selectedDate === subtractDays(today, 1);

 const InputField = ({ icon, label, value, onChange, unit, inputMode = 'decimal', placeholder }) => (
 <div style={{ display:'flex', alignItems:'center', gap:'10px', padding:'8px 0', borderBottom:`1px solid ${T.border}` }}>
 <span style={{ fontSize:'16px', width:'24px', textAlign:'center' }} aria-hidden="true">{icon}</span>
 <span style={{ fontSize:'13px', color:T.text2, width:'70px', flexShrink:0 }}>{label}</span>
 <input
 type="text" inputMode={inputMode} placeholder={placeholder || '—'}
 value={value} onChange={e => onChange(e.target.value)}
 aria-label={`${label}${unit ? ` (${unit})` : ''}`}
 style={{
 flex:1, background:'rgba(255,255,255,0.04)', border:`1px solid ${T.border}`,
 borderRadius:'8px', padding:'8px 10px', color:T.text, fontSize:'16px',
 fontFamily:T.mono, outline:'none', textAlign:'right', minWidth:0,
 }}
 />
 {unit && <span style={{ fontSize:'12px', color:T.text3, width:'32px', flexShrink:0 }} aria-hidden="true">{unit}</span>}
 {value && <Check size={14} color={T.teal} style={{ flexShrink:0 }} aria-hidden="true" />}
 </div>
 );

 return (
 <GlassCard style={{ marginBottom:'16px', padding:'16px' }}>
 {/* Header with date navigation */}
 <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'12px' }}>
 <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
 <Scale size={18} color={T.accent} />
 <span style={{ fontSize:'15px', fontWeight:600 }}>Daily Log</span>
 </div>
 <div style={{ display:'flex', gap:'4px', alignItems:'center' }}>
 <button onClick={ => setSelectedDate(subtractDays(selectedDate, 1))}
 aria-label="Previous day"
 style={{ padding:'8px', borderRadius:'6px', border:'none', fontSize:'14px', cursor:'pointer',
 background:'rgba(255,255,255,0.04)', color:T.text3, lineHeight:1, minWidth:'44px', minHeight:'44px',
 display:'flex', alignItems:'center', justifyContent:'center' }}>
 <ChevronLeft size={14} />
 </button>
 <div style={{ position:'relative' }}>
 <input type="date" value={selectedDate}
 max={today}
 onChange={e => { if (e.target.value) setSelectedDate(e.target.value); }}
 aria-label="Select log date"
 style={{
 background:'rgba(255,255,255,0.04)', border:`1px solid ${T.border}`, borderRadius:'6px',
 padding:'4px 8px', color:T.text, fontSize:'16px', fontFamily:T.mono, outline:'none',
 cursor:'pointer', colorScheme:'dark', width:'130px',
 }} />
 </div>
 {!isToday && (
 <button onClick={ => setSelectedDate(today)}
 style={{ padding:'8px 12px', borderRadius:'6px', border:'none', fontSize:'11px', fontWeight:600,
 cursor:'pointer', background:T.accentSoft, color:T.accent, minHeight:'36px' }}>Today</button>
 )}
 {selectedDate !== subtractDays(today, 1) && !isToday && (
 <button onClick={ => setSelectedDate(subtractDays(today, 1))}
 style={{ padding:'8px 12px', borderRadius:'6px', border:'none', fontSize:'11px', fontWeight:500,
 cursor:'pointer', background:'rgba(255,255,255,0.04)', color:T.text3, minHeight:'36px' }}>Yest.</button>
 )}
 </div>
 </div>

 {/* Date context label */}
 {!isToday && (
 <div style={{ fontSize:'11px', color: isYesterday ? T.teal : T.warn, marginBottom:'8px', 
 padding:'4px 8px', borderRadius:'6px',
 background: isYesterday ? 'rgba(78,205,196,0.06)' : 'rgba(255,183,77,0.06)' }}>
 {isYesterday ? '📝 Logging for yesterday' : `📝 Logging for ${new Date(selectedDate + 'T12:00:00').toLocaleDateString('en-US', { weekday:'short', month:'short', day:'numeric', year: new Date(selectedDate).getFullYear !== new Date.getFullYear ? 'numeric' : undefined })}`}
 </div>
 )}

 {/* Core fields */}
 <InputField icon="⚖️" label="Weight" value={weight} onChange={setWeight} unit={wUnit} placeholder={prevLog?.weight ? String(prevLog.weight) : '—'} />
 <InputField icon="🔥" label="Calories" value={calories} onChange={setCalories} unit="kcal" inputMode="numeric" />
 <InputField icon="🥩" label="Protein" value={protein} onChange={setProtein} unit="g" inputMode="numeric" />

 {/* Body fat with source selector */}
 <div style={{ display:'flex', alignItems:'center', gap:'10px', padding:'8px 0', borderBottom:`1px solid ${T.border}` }}>
 <span style={{ fontSize:'16px', width:'24px', textAlign:'center' }}>📐</span>
 <span style={{ fontSize:'13px', color:T.text2, width:'70px', flexShrink:0 }}>Body Fat</span>
 <input
 type="text" inputMode="decimal" placeholder="—"
 value={bfValue} onChange={e => setBfValue(e.target.value)}
 aria-label="Body fat percentage"
 style={{
 flex:1, background:'rgba(255,255,255,0.04)', border:`1px solid ${T.border}`,
 borderRadius:'8px', padding:'8px 10px', color:T.text, fontSize:'14px',
 fontFamily:T.mono, outline:'none', textAlign:'right', minWidth:0,
 }}
 />
 <span style={{ fontSize:'12px', color:T.text3, width:'8px' }} aria-hidden="true">%</span>
 <select value={bfSource} onChange={e => setBfSource(e.target.value)} aria-label="Body fat measurement source" style={{
 background:'rgba(255,255,255,0.06)', border:`1px solid ${T.border}`, borderRadius:'6px',
 padding:'4px 6px', color:T.text2, fontSize:'11px', outline:'none',
 }}>
 <option value="bia">BIA</option>
 <option value="dexa">DEXA</option>
 <option value="calipers">Calipers</option>
 <option value="visual">Visual</option>
 <option value="manual">Manual</option>
 </select>
 </div>

 {/* Calibrated value display */}
 {bfValue && calibrated?.calibrated && (
 <div style={{ padding:'6px 0 6px 34px', fontSize:'12px', color:T.text3 }}>
 Calibrated: <span style={{ color:T.teal, fontWeight:600, fontFamily:T.mono }}>{calibrated.value}%</span>
 <span style={{ marginLeft:'6px', opacity:0.6 }}>({calibrated.confidence})</span>
 </div>
 )}

 {/* DEXA source: prompt for home scale reading */}
 {bfSource === 'dexa' && bfValue && (
 <div style={{ padding:'8px 12px', margin:'4px 0 4px 34px', background:'rgba(78,205,196,0.06)',
 borderRadius:'8px', border:`1px solid rgba(78,205,196,0.15)`, fontSize:'12px', color:T.text2 }}>
 <div style={{ marginBottom:'6px' }}>This will be used as a calibration point. Enter your home scale BIA reading from today (if available):</div>
 <input type="text" inputMode="decimal" placeholder="BIA reading" value={dexaBiaValue}
 onChange={e => setDexaBiaValue(e.target.value)}
 aria-label="BIA reading for calibration"
 style={{
 width:'100%', background:'rgba(255,255,255,0.04)', border:`1px solid ${T.border}`,
 borderRadius:'6px', padding:'6px 8px', color:T.text, fontSize:'13px', fontFamily:T.mono, outline:'none',
 }} />
 </div>
 )}

 {/* Expandable optional fields */}
 <button onClick={ => setShowMore(!showMore)} aria-expanded={showMore} style={{
 background:'none', border:'none', color:T.text3, fontSize:'13px', cursor:'pointer',
 padding:'12px 8px', display:'flex', alignItems:'center', gap:'6px', width:'100%',
 minHeight:'44px',
 }}>
 {showMore ? <ChevronUp size={14} aria-hidden="true" /> : <ChevronDown size={14} aria-hidden="true" />}
 {showMore ? 'Less' : 'More'} (waist, sleep, notes)
 </button>

 {showMore && (
 <div style={{ animation:'fadeIn 0.2s ease-out' }}>
 <InputField icon="📏" label="Waist" value={waist} onChange={setWaist} unit={waistUnit} />
 <div style={{ display:'flex', alignItems:'center', gap:'10px', padding:'8px 0', borderBottom:`1px solid ${T.border}` }}>
 <span style={{ fontSize:'16px', width:'24px', textAlign:'center' }}>😴</span>
 <span style={{ fontSize:'13px', color:T.text2, width:'70px', flexShrink:0 }}>Sleep</span>
 <input type="text" inputMode="decimal" placeholder="hrs" value={sleepHrs}
 onChange={e => setSleepHrs(e.target.value)}
 aria-label="Sleep hours"
 style={{
 flex:1, background:'rgba(255,255,255,0.04)', border:`1px solid ${T.border}`,
 borderRadius:'8px', padding:'8px 10px', color:T.text, fontSize:'14px',
 fontFamily:T.mono, outline:'none', textAlign:'right', minWidth:0,
 }} />
 <span style={{ fontSize:'12px', color:T.text3 }}>hrs</span>
 </div>
 <div style={{ display:'flex', gap:'6px', padding:'8px 0 8px 34px' }} role="group" aria-label="Sleep quality">
 {['poor','fair','good','excellent'].map(q => (
 <button key={q} onClick={ => setSleepQuality(sleepQuality === q ? null : q)} aria-pressed={sleepQuality === q} aria-label={`Sleep quality: ${q}`} style={{
 padding:'8px 12px', borderRadius:'6px', fontSize:'11px', fontWeight:500, border:'none', cursor:'pointer',
 background: sleepQuality === q ? T.tealGlow : 'rgba(255,255,255,0.04)',
 color: sleepQuality === q ? T.teal : T.text3,
 }}>{q}</button>
 ))}
 </div>
 <InputField icon="💓" label="HRV" value={hrv} onChange={setHrv} unit="ms" inputMode="numeric" />
 <div style={{ padding:'8px 0' }}>
 <textarea placeholder="Notes." value={notes} onChange={e => setNotes(e.target.value)}
 aria-label="Daily notes"
 style={{
 width:'100%', background:'rgba(255,255,255,0.04)', border:`1px solid ${T.border}`,
 borderRadius:'8px', padding:'8px 10px', color:T.text, fontSize:'13px',
 fontFamily:T.font, outline:'none', resize:'vertical', minHeight:'48px', boxSizing:'border-box',
 }} />
 </div>
 </div>
 )}

 {/* Save button */}
 <button onClick={handleSave} style={{
 width:'100%', padding:'12px', marginTop:'8px',
 background: saved ? T.tealGlow : `linear-gradient(135deg, ${T.accent}, #FF8C42)`,
 border: saved ? `1px solid rgba(78,205,196,0.3)` : 'none',
 borderRadius:'10px', color: saved ? T.teal : '#fff',
 fontWeight:600, fontSize:'14px', cursor:'pointer',
 display:'flex', alignItems:'center', justifyContent:'center', gap:'8px',
 transition:'all 0.2s',
 }}>
 {saved ? <><Check size={16} /> Saved</> : 'Save'}
 </button>

 {/* Streak display */}
 {combinedStreak > 0 && (
 <div style={{
 textAlign:'center', marginTop:'10px', fontSize:'13px', fontWeight:600,
 color:T.accent, display:'flex', alignItems:'center', justifyContent:'center', gap:'6px',
 }}>
 <Flame size={16} style={{ animation: combinedStreak > 7 ? 'pulse 2s infinite' : 'none' }} />
 Logging streak: {combinedStreak} day{combinedStreak !== 1 ? 's' : ''}
 <Flame size={16} style={{ animation: combinedStreak > 7 ? 'pulse 2s infinite' : 'none' }} />
 </div>
 )}
 </GlassCard>
 );
}

// ============================================================
// CHART: Weight Trend (inline SVG)
// ============================================================

function WeightTrendChart({ settings, nutritionConfig, goToToday, bodyLogs }) {
 const [range, setRange] = useState('1M');
 const [hoverIdx, setHoverIdx] = useState(null);
 const allLogs = useMemo( => bodyLogs || loadBodyLogs, [bodyLogs]);
 const smoothed = useMemo( => getSmoothedWeights(allLogs, nutritionConfig), [allLogs, nutritionConfig]);

 // Filter by time range
 const filteredData = useMemo( => {
 if (smoothed.length === 0) return [];
 const now = new Date;
 const ranges = { '1W': 7, '1M': 30, '3M': 90, '6M': 180, '1Y': 365, 'All': 730 };
 const days = ranges[range] || 30;
 const cutoff = new Date(now);
 cutoff.setDate(cutoff.getDate - days);
 const cutoffStr = cutoff.toISOString.split('T')[0];
 const filtered = smoothed.filter(d => d.date >= cutoffStr);
 // Limit data points for rendering performance
 if (filtered.length > 365) {
 const step = Math.ceil(filtered.length / 365);
 const sampled = filtered.filter((_, i) => i % step === 0 || i === filtered.length - 1);
 return sampled;
 }
 return filtered;
 }, [smoothed, range]);

 // Delta indicators
 const deltas = useMemo( => {
 if (smoothed.length < 2) return [];
 const latest = smoothed[smoothed.length - 1]?.trend;
 return [3, 7, 14, 30, 90].map(d => {
 const cutoff = subtractDays(today, d);
 const past = smoothed.find(s => s.date >= cutoff);
 if (!past) return null;
 const delta = Math.round((latest - past.trend) * 10) / 10;
 return { label: `${d}d`, delta };
 }).filter(Boolean);
 }, [smoothed]);

 if (allLogs.length === 0) {
 return (
 <GlassCard style={{ padding:'20px', textAlign:'center', marginBottom:'16px' }}>
 <Scale size={24} color={T.text3} style={{ marginBottom:'8px' }} />
 <div style={{ fontSize:'14px', color:T.text2, marginBottom:'4px' }}>No weight data yet</div>
 <div style={{ fontSize:'12px', color:T.text3 }}>Log your weight on the Today tab to see trends</div>
 <div style={{ fontSize:'11px', color:T.accent, marginTop:'8px', cursor:'pointer', opacity:0.7 }}
 onClick={goToToday} role="button" tabIndex={0}>← Switch to Today to start logging</div>
 </GlassCard>
 );
 }

 if (filteredData.length < 2) {
 return (
 <GlassCard style={{ padding:'20px', textAlign:'center', marginBottom:'16px' }}>
 <div style={{ fontSize:'13px', color:T.text3 }}>Need at least 2 data points for this range</div>
 </GlassCard>
 );
 }

 // Chart dimensions
 const W = 420, H = 180, PAD = { top: 10, right: 10, bottom: 28, left: 44 };
 const cW = W - PAD.left - PAD.right;
 const cH = H - PAD.top - PAD.bottom;

 const raws = filteredData.map(d => d.raw);
 const trends = filteredData.map(d => d.trend);
 const allVals = [.raws,.trends];
 const minW = Math.floor(Math.min(.allVals) - 2);
 const maxW = Math.ceil(Math.max(.allVals) + 2);
 const yRange = maxW - minW || 1;

 const x = (i) => PAD.left + (i / Math.max(filteredData.length - 1, 1)) * cW;
 const y = (v) => PAD.top + (1 - (v - minW) / yRange) * cH;

 // Trend line path
 const trendPath = filteredData.map((d, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(d.trend).toFixed(1)}`).join(' ');
 // Area fill path
 const areaPath = trendPath + ` L${x(filteredData.length - 1).toFixed(1)},${(PAD.top + cH).toFixed(1)} L${PAD.left},${(PAD.top + cH).toFixed(1)} Z`;

 // Y-axis labels
 const ySteps = 5;
 const yLabels = Array.from({ length: ySteps + 1 }, (_, i) => {
 const v = minW + (yRange * i) / ySteps;
 return { v: Math.round(v * 10) / 10, py: y(v) };
 });

 // X-axis labels (smart density)
 const xLabelCount = Math.min(filteredData.length, range === '1W' ? 7 : range === '1M' ? 6 : 5);
 const xStep = Math.max(1, Math.floor((filteredData.length - 1) / Math.max(xLabelCount - 1, 1)));

 // Goal line
 const goalWeight = settings?.bodyWeight ? Number(settings.bodyWeight) : null;

 const wUnit = settings?.weightUnit || 'lbs';

 return (
 <div style={{ marginBottom:'16px' }}>
 <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'10px' }}>
 <h3 style={{ fontSize:'15px', fontWeight:600 }}>Weight Trend</h3>
 <div style={{ display:'flex', gap:'3px' }}>
 {['1W','1M','3M','6M','1Y','All'].map(r => (
 <button key={r} onClick={ => setRange(r)} style={{
 padding:'6px 10px', borderRadius:'6px', border:'none', fontSize:'10px', fontWeight:600, cursor:'pointer', minHeight:'32px',
 background: range === r ? T.accentSoft : 'transparent',
 color: range === r ? T.accent : T.text3,
 }}>{r}</button>
 ))}
 </div>
 </div>

 <GlassCard animate={false} style={{ padding:'12px 8px 8px', overflow:'hidden' }}>
 <svg key={range} className="chart-svg" viewBox={`0 0 ${W} ${H}`} style={{ width:'100%', height:'auto', display:'block' }}
 role="img" aria-label={`Weight trend chart showing ${pts.length} data points over ${range}`}
 onMouseLeave={ => setHoverIdx(null)} onTouchEnd={ => setHoverIdx(null)}>
 <defs>
 <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
 <stop offset="0%" stopColor={T.accent} stopOpacity="0.15" />
 <stop offset="100%" stopColor={T.accent} stopOpacity="0" />
 </linearGradient>
 </defs>

 {/* Grid lines */}
 {yLabels.map((l, i) => (
 <g key={i}>
 <line x1={PAD.left} y1={l.py} x2={W - PAD.right} y2={l.py}
 stroke={T.border} strokeWidth="0.5" />
 <text x={PAD.left - 6} y={l.py + 3.5} fill={T.text3}
 fontSize="9" fontFamily={T.mono} textAnchor="end">{l.v}</text>
 </g>
 ))}

 {/* Goal line */}
 {goalWeight && goalWeight >= minW && goalWeight <= maxW && (
 <line x1={PAD.left} y1={y(goalWeight)} x2={W - PAD.right} y2={y(goalWeight)}
 stroke={T.teal} strokeWidth="1" strokeDasharray="4,3" opacity="0.5" />
 )}

 {/* Area fill */}
 <path d={areaPath} fill="url(#trendGrad)" />

 {/* Trend line */}
 <path d={trendPath} fill="none" stroke={T.accent} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

 {/* Raw data dots */}
 {filteredData.map((d, i) => (
 <circle key={i} cx={x(i)} cy={y(d.raw)} r="2.5"
 fill={T.text3} opacity="0.4"
 onMouseEnter={ => setHoverIdx(i)}
 onTouchStart={ => setHoverIdx(i)} />
 ))}

 {/* X-axis labels */}
 {filteredData.filter((_, i) => i % xStep === 0 || i === filteredData.length - 1).map((d) => {
 const i = filteredData.indexOf(d);
 const label = d.date.slice(5); // MM-DD
 return (
 <text key={d.date} x={x(i)} y={H - 4} fill={T.text3}
 fontSize="8.5" fontFamily={T.mono} textAnchor="middle">{label}</text>
 );
 })}

 {/* Hover crosshair */}
 {hoverIdx !== null && filteredData[hoverIdx] && (
 <g>
 <line x1={x(hoverIdx)} y1={PAD.top} x2={x(hoverIdx)} y2={PAD.top + cH}
 stroke={T.text2} strokeWidth="0.5" strokeDasharray="3,2" />
 <circle cx={x(hoverIdx)} cy={y(filteredData[hoverIdx].trend)} r="4"
 fill={T.accent} stroke={T.bg} strokeWidth="1.5" />
 <rect x={Math.max(2, Math.min(x(hoverIdx) - 50, W - 102))} y={PAD.top - 2} width="100" height="30" rx="4"
 fill={T.bgGlass} stroke={T.border} strokeWidth="0.5" />
 <text x={Math.max(52, Math.min(x(hoverIdx), W - 52))} y={PAD.top + 10} fill={T.text} fontSize="9" fontFamily={T.mono} textAnchor="middle">
 {filteredData[hoverIdx].date.slice(5)} {filteredData[hoverIdx].trend} {wUnit}
 </text>
 <text x={Math.max(52, Math.min(x(hoverIdx), W - 52))} y={PAD.top + 22} fill={T.text3} fontSize="8" fontFamily={T.mono} textAnchor="middle">
 raw: {filteredData[hoverIdx].raw}
 </text>
 </g>
 )}
 </svg>

 {/* Delta indicators */}
 {deltas.length > 0 && (
 <div style={{ display:'flex', gap:'6px', padding:'8px 4px 0', flexWrap:'wrap' }}>
 {deltas.map(d => {
 const goal = nutritionConfig?.goal || 'lose';
 const isGood = (goal === 'lose' && d.delta < 0) || (goal === 'gain' && d.delta > 0) || (goal === 'maintain' && Math.abs(d.delta) < 0.5);
 return (
 <div key={d.label} style={{
 padding:'3px 8px', borderRadius:'6px', fontSize:'10px', fontFamily:T.mono,
 background: isGood ? 'rgba(78,205,196,0.08)' : 'rgba(255,255,255,0.04)',
 color: isGood ? T.teal : T.text2,
 }}>
 {d.label}: {d.delta > 0 ? '+' : ''}{d.delta} {wUnit}
 </div>
 );
 })}
 </div>
 )}
 </GlassCard>
 </div>
 );
}

// ============================================================
// CHART: BODY FAT TREND
// ============================================================

function BodyFatChart({ settings, nutritionConfig, goToToday, allBodyLogs }) {
 const [range, setRange] = useState('3M');
 const [hoverIdx, setHoverIdx] = useState(null);

 const cal = useMemo( => LS.get('bfCalibration', DEFAULT_CALIBRATION), []);

 const chartData = useMemo( => {
 const logs = (allBodyLogs || loadAllBodyLogs).filter(l => l.bodyFat?.value);
 return logs.map(l => {
 const rawBF = Number(l.bodyFat.value);
 const calibrated = getCalibratedBodyFat(rawBF, cal);
 const isDEXA = l.bodyFat.source === 'dexa';
 return { date: l.date, raw: rawBF, calibrated: calibrated.value, confidence: calibrated.confidence, isDEXA, isCal: calibrated.calibrated };
 });
 }, [cal, allBodyLogs]);

 const filteredData = useMemo( => {
 if (chartData.length === 0) return [];
 const ranges = { '1W': 7, '1M': 30, '3M': 90, '6M': 180, '1Y': 365, 'All': 99999 };
 const days = ranges[range] || 90;
 const cutoff = subtractDays(today, days);
 return chartData.filter(d => d.date >= cutoff);
 }, [chartData, range]);

 if (chartData.length === 0) {
 return (
 <GlassCard style={{ padding: '20px', textAlign: 'center', marginBottom: '16px' }}>
 <Activity size={24} color={T.text3} style={{ marginBottom: '8px' }} />
 <div style={{ fontSize: '14px', color: T.text2, marginBottom: '4px' }}>No body fat data yet</div>
 <div style={{ fontSize: '12px', color: T.text3 }}>Log body fat % on the Today tab to track composition</div>
 <div style={{ fontSize:'11px', color:T.accent, marginTop:'8px', cursor:'pointer', opacity:0.7 }}
 onClick={goToToday} role="button" tabIndex={0}>← Switch to Today to start logging</div>
 </GlassCard>
 );
 }
 if (filteredData.length < 2) {
 return (
 <GlassCard style={{ padding: '20px', textAlign: 'center', marginBottom: '16px' }}>
 <div style={{ fontSize: '13px', color: T.text3 }}>Need at least 2 body fat entries for this range</div>
 </GlassCard>
 );
 }

 const W = 420, H = 180, PAD = { top: 10, right: 10, bottom: 28, left: 44 };
 const cW = W - PAD.left - PAD.right;
 const cH = H - PAD.top - PAD.bottom;

 const allVals = [.filteredData.map(d => d.raw),.filteredData.map(d => d.calibrated)];
 const minV = Math.floor(Math.min(.allVals) - 2);
 const maxV = Math.ceil(Math.max(.allVals) + 2);
 const yRange = maxV - minV || 1;

 const xPos = (i) => PAD.left + (i / Math.max(filteredData.length - 1, 1)) * cW;
 const yPos = (v) => PAD.top + (1 - (v - minV) / yRange) * cH;

 // Calibrated line path
 const calPath = filteredData.map((d, i) => `${i === 0 ? 'M' : 'L'}${xPos(i).toFixed(1)},${yPos(d.calibrated).toFixed(1)}`).join(' ');

 // Confidence band (wider with fewer calibration points)
 const calPts = cal.points?.length || 0;
 const bandWidth = calPts === 0 ? 3 : calPts === 1 ? 2 : calPts >= 3 ? 0.8 : 1.2;
 const bandTop = filteredData.map((d, i) => `${i === 0 ? 'M' : 'L'}${xPos(i).toFixed(1)},${yPos(d.calibrated + bandWidth).toFixed(1)}`).join(' ');
 const bandBot = [.filteredData].reverse.map((d, i) => {
 const origIdx = filteredData.length - 1 - i;
 return `L${xPos(origIdx).toFixed(1)},${yPos(d.calibrated - bandWidth).toFixed(1)}`;
 }).join(' ');
 const bandPath = bandTop + ' ' + bandBot + ' Z';

 // Y-axis labels
 const ySteps = 5;
 const yLabels = Array.from({ length: ySteps + 1 }, (_, i) => {
 const v = minV + (yRange * i) / ySteps;
 return { v: Math.round(v * 10) / 10, py: yPos(v) };
 });

 const xLabelCount = Math.min(filteredData.length, range === '1W' ? 7 : range === '1M' ? 6 : 5);
 const xStep = Math.max(1, Math.floor((filteredData.length - 1) / Math.max(xLabelCount - 1, 1)));

 return (
 <div style={{ marginBottom: '16px' }}>
 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
 <h3 style={{ fontSize: '15px', fontWeight: 600 }}>Body Fat Trend</h3>
 <div style={{ display: 'flex', gap: '3px' }}>
 {['1W', '1M', '3M', '6M', '1Y', 'All'].map(r => (
 <button key={r} onClick={ => setRange(r)} style={{
 padding: '6px 10px', borderRadius: '6px', border: 'none', fontSize: '10px', fontWeight: 600, cursor: 'pointer', minHeight: '32px',
 background: range === r ? T.accentSoft : 'transparent',
 color: range === r ? T.accent : T.text3,
 }}>{r}</button>
 ))}
 </div>
 </div>

 <GlassCard animate={false} style={{ padding: '12px 8px 8px', overflow: 'hidden' }}>
 <svg key={range} className="chart-svg" viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto', display: 'block' }}
 role="img" aria-label={`Body fat percentage chart over ${range}`}
 onMouseLeave={ => setHoverIdx(null)} onTouchEnd={ => setHoverIdx(null)}>
 <defs>
 <linearGradient id="bfBandGrad" x1="0" y1="0" x2="0" y2="1">
 <stop offset="0%" stopColor={T.teal} stopOpacity="0.12" />
 <stop offset="100%" stopColor={T.teal} stopOpacity="0.03" />
 </linearGradient>
 </defs>

 {/* Grid */}
 {yLabels.map((l, i) => (
 <g key={i}>
 <line x1={PAD.left} y1={l.py} x2={W - PAD.right} y2={l.py} stroke={T.border} strokeWidth="0.5" />
 <text x={PAD.left - 6} y={l.py + 3.5} fill={T.text3} fontSize="9" fontFamily={T.mono} textAnchor="end">{l.v}%</text>
 </g>
 ))}

 {/* Confidence band */}
 {cal.points?.length > 0 && <path d={bandPath} fill="url(#bfBandGrad)" />}

 {/* Calibrated line */}
 <path d={calPath} fill="none" stroke={T.teal} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

 {/* Raw BIA dots */}
 {filteredData.map((d, i) => d.isDEXA ? (
 <g key={i} onMouseEnter={ => setHoverIdx(i)} onTouchStart={ => setHoverIdx(i)}>
 <polygon points={`${xPos(i)},${yPos(d.raw) - 6} ${xPos(i) + 5},${yPos(d.raw)} ${xPos(i)},${yPos(d.raw) + 6} ${xPos(i) - 5},${yPos(d.raw)}`}
 fill={T.warn} stroke={T.bg} strokeWidth="1" />
 <text x={xPos(i)} y={yPos(d.raw) - 9} fill={T.warn} fontSize="7" fontFamily={T.mono} textAnchor="middle">DEXA</text>
 </g>
 ) : (
 <circle key={i} cx={xPos(i)} cy={yPos(d.raw)} r="2.5" fill={T.text3} opacity="0.4"
 onMouseEnter={ => setHoverIdx(i)} onTouchStart={ => setHoverIdx(i)} />
 ))}

 {/* X-axis labels */}
 {filteredData.filter((_, i) => i % xStep === 0 || i === filteredData.length - 1).map((d) => {
 const i = filteredData.indexOf(d);
 return <text key={d.date} x={xPos(i)} y={H - 4} fill={T.text3} fontSize="8.5" fontFamily={T.mono} textAnchor="middle">{d.date.slice(5)}</text>;
 })}

 {/* Hover */}
 {hoverIdx !== null && filteredData[hoverIdx] && (
 <g>
 <line x1={xPos(hoverIdx)} y1={PAD.top} x2={xPos(hoverIdx)} y2={PAD.top + cH} stroke={T.text2} strokeWidth="0.5" strokeDasharray="3,2" />
 <circle cx={xPos(hoverIdx)} cy={yPos(filteredData[hoverIdx].calibrated)} r="4" fill={T.teal} stroke={T.bg} strokeWidth="1.5" />
 <rect x={Math.max(2, Math.min(xPos(hoverIdx) - 55, W - 112))} y={PAD.top - 2} width="110" height="30" rx="4"
 fill={T.bgGlass} stroke={T.border} strokeWidth="0.5" />
 <text x={Math.max(57, Math.min(xPos(hoverIdx), W - 57))} y={PAD.top + 10} fill={T.text} fontSize="9" fontFamily={T.mono} textAnchor="middle">
 {filteredData[hoverIdx].date.slice(5)} {filteredData[hoverIdx].calibrated}%
 </text>
 <text x={Math.max(57, Math.min(xPos(hoverIdx), W - 57))} y={PAD.top + 22} fill={T.text3} fontSize="8" fontFamily={T.mono} textAnchor="middle">
 raw: {filteredData[hoverIdx].raw}%{filteredData[hoverIdx].isDEXA ? ' (DEXA)' : ''}
 </text>
 </g>
 )}
 </svg>

 {/* Legend */}
 <div style={{ display: 'flex', gap: '12px', padding: '6px 4px 0', fontSize: '10px' }}>
 <span style={{ color: T.text3 }}>● BIA</span>
 <span style={{ color: T.teal }}>● Calibrated</span>
 <span style={{ color: T.warn }}>◆ DEXA</span>
 </div>
 </GlassCard>
 </div>
 );
}

// ============================================================
// CHART: NUTRITION (CALORIES + PROTEIN)
// ============================================================

function NutritionChart({ nutritionConfig, goToToday, allBodyLogs }) {
 const [range, setRange] = useState('1M');
 const [hoverIdx, setHoverIdx] = useState(null);
 const cfg = nutritionConfig || DEFAULT_NUTRITION_CONFIG;

 const chartData = useMemo( => {
 return (allBodyLogs || loadAllBodyLogs).filter(l => l.calories).map(l => ({
 date: l.date,
 calories: Number(l.calories),
 protein: l.protein ? Number(l.protein) : null,
 }));
 }, [allBodyLogs]);

 const filteredData = useMemo( => {
 if (chartData.length === 0) return [];
 const ranges = { '1W': 7, '1M': 30, '3M': 90, '6M': 180, '1Y': 365, 'All': 99999 };
 const cutoff = subtractDays(today, ranges[range] || 30);
 return chartData.filter(d => d.date >= cutoff);
 }, [chartData, range]);

 // 7-day rolling average
 const rollingAvg = useMemo( => {
 if (chartData.length < 2) return [];
 return filteredData.map((d, i) => {
 // Look back 7 days in the full dataset
 const cutoff = subtractDays(d.date, 7);
 const window = chartData.filter(c => c.date > cutoff && c.date <= d.date);
 if (window.length === 0) return null;
 return { date: d.date, avg: Math.round(window.reduce((s, w) => s + w.calories, 0) / window.length) };
 }).filter(Boolean);
 }, [chartData, filteredData]);

 if (chartData.length === 0) {
 return (
 <GlassCard style={{ padding: '20px', textAlign: 'center', marginBottom: '16px' }}>
 <Utensils size={24} color={T.text3} style={{ marginBottom: '8px' }} />
 <div style={{ fontSize: '14px', color: T.text2, marginBottom: '4px' }}>No nutrition data yet</div>
 <div style={{ fontSize: '12px', color: T.text3 }}>Log calories on the Today tab to see trends</div>
 <div style={{ fontSize:'11px', color:T.accent, marginTop:'8px', cursor:'pointer', opacity:0.7 }}
 onClick={goToToday} role="button" tabIndex={0}>← Switch to Today to start logging</div>
 </GlassCard>
 );
 }
 if (filteredData.length < 2) {
 return (
 <GlassCard style={{ padding: '20px', textAlign: 'center', marginBottom: '16px' }}>
 <div style={{ fontSize: '13px', color: T.text3 }}>Need at least 2 nutrition entries for this range</div>
 </GlassCard>
 );
 }

 const W = 420, H = 200, PAD = { top: 10, right: 40, bottom: 28, left: 44 };
 const cW = W - PAD.left - PAD.right;
 const cH = H - PAD.top - PAD.bottom;

 const calTarget = cfg.dailyCalorieTarget || 2200;
 const protTarget = cfg.dailyProteinTarget || 165;
 const tdee = cfg.estimatedTDEE || 2500;

 // Y-axis for calories
 const allCals = [.filteredData.map(d => d.calories), calTarget, tdee];
 const minCal = Math.floor((Math.min(.allCals) - 100) / 100) * 100;
 const maxCal = Math.ceil((Math.max(.allCals) + 100) / 100) * 100;
 const calRange = maxCal - minCal || 1;

 // Protein secondary Y-axis
 const prots = filteredData.filter(d => d.protein != null).map(d => d.protein);
 const minProt = prots.length > 0 ? Math.floor(Math.min(.prots, protTarget) / 10) * 10 - 10 : 0;
 const maxProt = prots.length > 0 ? Math.ceil(Math.max(.prots, protTarget) / 10) * 10 + 10 : 200;
 const protRange = maxProt - minProt || 1;

 const xPos = (i) => PAD.left + (i / Math.max(filteredData.length - 1, 1)) * cW;
 const yCal = (v) => PAD.top + (1 - (v - minCal) / calRange) * cH;
 const yProt = (v) => PAD.top + (1 - (v - minProt) / protRange) * cH;

 const barW = Math.max(2, Math.min(12, (cW / filteredData.length) * 0.65));

 // Color coding (adherence-neutral)
 const barColor = (cal) => {
 const ratio = cal / calTarget;
 if (ratio >= 0.95 && ratio <= 1.05) return T.teal;
 if (ratio > 1.05) return T.warn;
 return T.text2;
 };

 // Protein line
 const protData = filteredData.filter(d => d.protein != null);
 const protPath = protData.length >= 2 ? protData.map((d, pi) => {
 const i = filteredData.indexOf(d);
 return `${pi === 0 ? 'M' : 'L'}${xPos(i).toFixed(1)},${yProt(d.protein).toFixed(1)}`;
 }).join(' ') : '';

 // 7-day average band
 const avgBandPath = rollingAvg.length >= 2 ? ( => {
 const top = rollingAvg.map((r, ri) => {
 const fi = filteredData.findIndex(d => d.date === r.date);
 if (fi < 0) return null;
 return `${ri === 0 ? 'M' : 'L'}${xPos(fi).toFixed(1)},${yCal(r.avg).toFixed(1)}`;
 }).filter(Boolean).join(' ');
 return top;
 }) : '';

 // Y-axis labels (calories)
 const ySteps = 5;
 const yLabels = Array.from({ length: ySteps + 1 }, (_, i) => {
 const v = minCal + (calRange * i) / ySteps;
 return { v: Math.round(v), py: yCal(v) };
 });

 // Right Y-axis labels (protein)
 const yProtLabels = prots.length > 0 ? Array.from({ length: 4 }, (_, i) => {
 const v = minProt + (protRange * i) / 3;
 return { v: Math.round(v), py: yProt(v) };
 }) : [];

 const xLabelCount = Math.min(filteredData.length, range === '1W' ? 7 : range === '1M' ? 6 : 5);
 const xStep = Math.max(1, Math.floor((filteredData.length - 1) / Math.max(xLabelCount - 1, 1)));

 return (
 <div style={{ marginBottom: '16px' }}>
 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
 <h3 style={{ fontSize: '15px', fontWeight: 600 }}>Nutrition</h3>
 <div style={{ display: 'flex', gap: '3px' }}>
 {['1W', '1M', '3M', '6M', '1Y', 'All'].map(r => (
 <button key={r} onClick={ => setRange(r)} style={{
 padding: '6px 10px', borderRadius: '6px', border: 'none', fontSize: '10px', fontWeight: 600, cursor: 'pointer', minHeight: '32px',
 background: range === r ? T.accentSoft : 'transparent',
 color: range === r ? T.accent : T.text3,
 }}>{r}</button>
 ))}
 </div>
 </div>

 <GlassCard animate={false} style={{ padding: '12px 8px 8px', overflow: 'hidden' }}>
 <svg key={range} className="chart-svg" viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto', display: 'block' }}
 role="img" aria-label={`Nutrition tracking chart showing calories and protein over ${range}`}
 onMouseLeave={ => setHoverIdx(null)} onTouchEnd={ => setHoverIdx(null)}>

 {/* Grid */}
 {yLabels.map((l, i) => (
 <g key={i}>
 <line x1={PAD.left} y1={l.py} x2={W - PAD.right} y2={l.py} stroke={T.border} strokeWidth="0.5" />
 <text x={PAD.left - 6} y={l.py + 3.5} fill={T.text3} fontSize="9" fontFamily={T.mono} textAnchor="end">{l.v}</text>
 </g>
 ))}

 {/* Right Y-axis labels (protein) */}
 {yProtLabels.map((l, i) => (
 <text key={i} x={W - PAD.right + 6} y={l.py + 3.5} fill={T.accent} fontSize="8" fontFamily={T.mono} textAnchor="start" opacity="0.6">{l.v}g</text>
 ))}

 {/* Calorie target line */}
 <line x1={PAD.left} y1={yCal(calTarget)} x2={W - PAD.right} y2={yCal(calTarget)}
 stroke={T.teal} strokeWidth="1" strokeDasharray="5,3" opacity="0.5" />

 {/* TDEE line */}
 {tdee >= minCal && tdee <= maxCal && (
 <line x1={PAD.left} y1={yCal(tdee)} x2={W - PAD.right} y2={yCal(tdee)}
 stroke={T.warn} strokeWidth="1" strokeDasharray="3,4" opacity="0.4" />
 )}

 {/* Protein target line */}
 {protTarget >= minProt && protTarget <= maxProt && (
 <line x1={PAD.left} y1={yProt(protTarget)} x2={W - PAD.right} y2={yProt(protTarget)}
 stroke={T.accent} strokeWidth="0.8" strokeDasharray="2,3" opacity="0.35" />
 )}

 {/* 7-day rolling average */}
 {avgBandPath && <path d={avgBandPath} fill="none" stroke={T.teal} strokeWidth="1.5" strokeDasharray="1,2" opacity="0.45" />}

 {/* Calorie bars */}
 {filteredData.map((d, i) => (
 <rect key={i} x={xPos(i) - barW / 2} y={Math.min(yCal(d.calories), yCal(0))}
 width={barW} height={Math.abs(yCal(d.calories) - yCal(minCal > 0 ? minCal : 0))}
 fill={barColor(d.calories)} opacity="0.55" rx="1"
 onMouseEnter={ => setHoverIdx(i)} onTouchStart={ => setHoverIdx(i)} />
 ))}

 {/* Protein line */}
 {protPath && <path d={protPath} fill="none" stroke={T.accent} strokeWidth="1.8" strokeLinecap="round" opacity="0.75" />}

 {/* X-axis labels */}
 {filteredData.filter((_, i) => i % xStep === 0 || i === filteredData.length - 1).map((d) => {
 const i = filteredData.indexOf(d);
 return <text key={d.date} x={xPos(i)} y={H - 4} fill={T.text3} fontSize="8.5" fontFamily={T.mono} textAnchor="middle">{d.date.slice(5)}</text>;
 })}

 {/* Hover tooltip */}
 {hoverIdx !== null && filteredData[hoverIdx] && (
 <g>
 <line x1={xPos(hoverIdx)} y1={PAD.top} x2={xPos(hoverIdx)} y2={PAD.top + cH} stroke={T.text2} strokeWidth="0.5" strokeDasharray="3,2" />
 <rect x={Math.max(2, Math.min(xPos(hoverIdx) - 55, W - 112))} y={PAD.top - 2} width="110" height="38" rx="4"
 fill={T.bgGlass} stroke={T.border} strokeWidth="0.5" />
 <text x={Math.max(57, Math.min(xPos(hoverIdx), W - 57))} y={PAD.top + 10} fill={T.text} fontSize="9" fontFamily={T.mono} textAnchor="middle">
 {filteredData[hoverIdx].date.slice(5)} {filteredData[hoverIdx].calories} kcal
 </text>
 <text x={Math.max(57, Math.min(xPos(hoverIdx), W - 57))} y={PAD.top + 22} fill={T.text3} fontSize="8" fontFamily={T.mono} textAnchor="middle">
 {filteredData[hoverIdx].protein != null ? `protein: ${filteredData[hoverIdx].protein}g` : 'no protein logged'}
 </text>
 {rollingAvg.find(r => r.date === filteredData[hoverIdx].date) && (
 <text x={Math.max(57, Math.min(xPos(hoverIdx), W - 57))} y={PAD.top + 33} fill={T.teal} fontSize="7.5" fontFamily={T.mono} textAnchor="middle">
 7d avg: {rollingAvg.find(r => r.date === filteredData[hoverIdx].date)?.avg} kcal
 </text>
 )}
 </g>
 )}
 </svg>

 {/* Legend */}
 <div style={{ display: 'flex', gap: '10px', padding: '6px 4px 0', fontSize: '10px', flexWrap: 'wrap' }}>
 <span style={{ color: T.text2 }}>▮ Calories</span>
 <span style={{ color: T.accent, opacity: 0.75 }}>― Protein</span>
 <span style={{ color: T.teal }}>┈ Target</span>
 <span style={{ color: T.warn, opacity: 0.6 }}>┈ TDEE</span>
 <span style={{ color: T.teal, opacity: 0.5 }}>┈ 7d avg</span>
 </div>
 </GlassCard>
 </div>
 );
}

// ============================================================
// CHART: TDEE TREND
// ============================================================

function TDEETrendChart({ nutritionConfig }) {
 const [range, setRange] = useState('3M');
 const [hoverIdx, setHoverIdx] = useState(null);
 const cfg = nutritionConfig || DEFAULT_NUTRITION_CONFIG;

 const chartData = useMemo( => {
 const hist = cfg.tdeeHistory || [];
 return hist.filter(h => h.date && h.tdee).sort((a, b) => a.date.localeCompare(b.date));
 }, [cfg.tdeeHistory]);

 const filteredData = useMemo( => {
 if (chartData.length === 0) return [];
 const ranges = { '1M': 30, '3M': 90, '6M': 180, '1Y': 365, 'All': 99999 };
 const cutoff = subtractDays(today, ranges[range] || 90);
 return chartData.filter(d => d.date >= cutoff);
 }, [chartData, range]);

 // Delta (adaptation detection)
 const delta30 = useMemo( => {
 if (chartData.length < 2) return null;
 const cutoff = subtractDays(today, 30);
 const recent = chartData.filter(d => d.date >= cutoff);
 if (recent.length < 2) return null;
 const diff = recent[recent.length - 1].tdee - recent[0].tdee;
 return Math.round(diff);
 }, [chartData]);

 if (chartData.length < 3) {
 return (
 <GlassCard style={{ padding: '20px', textAlign: 'center', marginBottom: '16px' }}>
 <TrendingUp size={24} color={T.text3} style={{ marginBottom: '8px' }} />
 <div style={{ fontSize: '14px', color: T.text2, marginBottom: '4px' }}>TDEE tracking needs more data</div>
 <div style={{ fontSize: '12px', color: T.text3 }}>Log weight + calories for 7+ days to see adaptive TDEE</div>
 </GlassCard>
 );
 }
 if (filteredData.length < 3) {
 return (
 <GlassCard style={{ padding: '20px', textAlign: 'center', marginBottom: '16px' }}>
 <div style={{ fontSize: '13px', color: T.text3 }}>Need at least 3 TDEE data points for this range</div>
 </GlassCard>
 );
 }

 const W = 420, H = 160, PAD = { top: 10, right: 10, bottom: 28, left: 48 };
 const cW = W - PAD.left - PAD.right;
 const cH = H - PAD.top - PAD.bottom;

 const vals = filteredData.map(d => d.tdee);
 const minT = Math.floor((Math.min(.vals) - 50) / 50) * 50;
 const maxT = Math.ceil((Math.max(.vals) + 50) / 50) * 50;
 const yRange = maxT - minT || 1;

 const xPos = (i) => PAD.left + (i / Math.max(filteredData.length - 1, 1)) * cW;
 const yPos = (v) => PAD.top + (1 - (v - minT) / yRange) * cH;

 const linePath = filteredData.map((d, i) => `${i === 0 ? 'M' : 'L'}${xPos(i).toFixed(1)},${yPos(d.tdee).toFixed(1)}`).join(' ');
 const areaPath = linePath + ` L${xPos(filteredData.length - 1).toFixed(1)},${(PAD.top + cH).toFixed(1)} L${PAD.left},${(PAD.top + cH).toFixed(1)} Z`;

 // Confidence shading (wider early, narrower later)
 const totalDays = chartData.length;
 const confWidth = totalDays < 14 ? 100 : totalDays < 30 ? 50 : 25;
 const confTopPath = filteredData.map((d, i) => `${i === 0 ? 'M' : 'L'}${xPos(i).toFixed(1)},${yPos(d.tdee + confWidth).toFixed(1)}`).join(' ');
 const confBotPath = [.filteredData].reverse.map((d, i) => {
 const origIdx = filteredData.length - 1 - i;
 return `L${xPos(origIdx).toFixed(1)},${yPos(d.tdee - confWidth).toFixed(1)}`;
 }).join(' ');
 const confPath = confTopPath + ' ' + confBotPath + ' Z';

 const ySteps = 4;
 const yLabels = Array.from({ length: ySteps + 1 }, (_, i) => {
 const v = minT + (yRange * i) / ySteps;
 return { v: Math.round(v), py: yPos(v) };
 });

 const xLabelCount = Math.min(filteredData.length, 5);
 const xStep = Math.max(1, Math.floor((filteredData.length - 1) / Math.max(xLabelCount - 1, 1)));

 return (
 <div style={{ marginBottom: '16px' }}>
 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
 <div>
 <h3 style={{ fontSize: '15px', fontWeight: 600, display: 'inline' }}>Estimated TDEE</h3>
 {delta30 !== null && (
 <span style={{
 fontSize: '11px', fontFamily: T.mono, marginLeft: '8px',
 color: Math.abs(delta30) < 20 ? T.text3 : delta30 < 0 ? T.warn : T.teal,
 }}>
 TDEE {delta30 > 0 ? '↑' : delta30 < 0 ? '↓' : '→'}{Math.abs(delta30)} kcal / 30d
 </span>
 )}
 </div>
 <div style={{ display: 'flex', gap: '3px' }}>
 {['1M', '3M', '6M', '1Y', 'All'].map(r => (
 <button key={r} onClick={ => setRange(r)} style={{
 padding: '6px 10px', borderRadius: '6px', border: 'none', fontSize: '10px', fontWeight: 600, cursor: 'pointer', minHeight: '32px',
 background: range === r ? T.accentSoft : 'transparent',
 color: range === r ? T.accent : T.text3,
 }}>{r}</button>
 ))}
 </div>
 </div>

 <GlassCard animate={false} style={{ padding: '12px 8px 8px', overflow: 'hidden' }}>
 <svg key={range} className="chart-svg" viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto', display: 'block' }}
 role="img" aria-label={`TDEE trend chart over ${range}`}
 onMouseLeave={ => setHoverIdx(null)} onTouchEnd={ => setHoverIdx(null)}>
 <defs>
 <linearGradient id="tdeeGrad" x1="0" y1="0" x2="0" y2="1">
 <stop offset="0%" stopColor={T.teal} stopOpacity="0.12" />
 <stop offset="100%" stopColor={T.teal} stopOpacity="0" />
 </linearGradient>
 </defs>

 {/* Grid */}
 {yLabels.map((l, i) => (
 <g key={i}>
 <line x1={PAD.left} y1={l.py} x2={W - PAD.right} y2={l.py} stroke={T.border} strokeWidth="0.5" />
 <text x={PAD.left - 6} y={l.py + 3.5} fill={T.text3} fontSize="9" fontFamily={T.mono} textAnchor="end">{l.v}</text>
 </g>
 ))}

 {/* Confidence band */}
 <path d={confPath} fill={T.tealGlow} opacity="0.3" />

 {/* Area fill */}
 <path d={areaPath} fill="url(#tdeeGrad)" />

 {/* TDEE line */}
 <path d={linePath} fill="none" stroke={T.teal} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />

 {/* Data dots */}
 {filteredData.map((d, i) => (
 <circle key={i} cx={xPos(i)} cy={yPos(d.tdee)} r="2" fill={T.teal} opacity="0.5"
 onMouseEnter={ => setHoverIdx(i)} onTouchStart={ => setHoverIdx(i)} />
 ))}

 {/* X-axis */}
 {filteredData.filter((_, i) => i % xStep === 0 || i === filteredData.length - 1).map((d) => {
 const i = filteredData.indexOf(d);
 return <text key={d.date} x={xPos(i)} y={H - 4} fill={T.text3} fontSize="8.5" fontFamily={T.mono} textAnchor="middle">{d.date.slice(5)}</text>;
 })}

 {/* Hover */}
 {hoverIdx !== null && filteredData[hoverIdx] && (
 <g>
 <line x1={xPos(hoverIdx)} y1={PAD.top} x2={xPos(hoverIdx)} y2={PAD.top + cH} stroke={T.text2} strokeWidth="0.5" strokeDasharray="3,2" />
 <circle cx={xPos(hoverIdx)} cy={yPos(filteredData[hoverIdx].tdee)} r="4" fill={T.teal} stroke={T.bg} strokeWidth="1.5" />
 <rect x={Math.max(2, Math.min(xPos(hoverIdx) - 50, W - 102))} y={PAD.top - 2} width="100" height="22" rx="4"
 fill={T.bgGlass} stroke={T.border} strokeWidth="0.5" />
 <text x={Math.max(52, Math.min(xPos(hoverIdx), W - 52))} y={PAD.top + 13} fill={T.text} fontSize="9" fontFamily={T.mono} textAnchor="middle">
 {filteredData[hoverIdx].date.slice(5)} {filteredData[hoverIdx].tdee} kcal
 </text>
 </g>
 )}
 </svg>
 </GlassCard>
 </div>
 );
}

// ============================================================
// CHART: WAIST CIRCUMFERENCE
// ============================================================

function WaistChart({ settings, nutritionConfig, allBodyLogs }) {
 const [range, setRange] = useState('3M');
 const [hoverIdx, setHoverIdx] = useState(null);
 const waistUnit = nutritionConfig?.waistUnit || 'in';

 const chartData = useMemo( => {
 return (allBodyLogs || loadAllBodyLogs).filter(l => l.waistCircumference).map(l => ({
 date: l.date,
 waist: Number(l.waistCircumference),
 }));
 }, [allBodyLogs]);

 const filteredData = useMemo( => {
 if (chartData.length === 0) return [];
 const ranges = { '1W': 7, '1M': 30, '3M': 90, '6M': 180, '1Y': 365, 'All': 99999 };
 const cutoff = subtractDays(today, ranges[range] || 90);
 return chartData.filter(d => d.date >= cutoff);
 }, [chartData, range]);

 // Waist-to-height ratio
 const heightInches = settings?.heightInches ? Number(settings.heightInches) : null;
 const whrText = useMemo( => {
 if (!heightInches || chartData.length === 0) return null;
 const latest = chartData[chartData.length - 1].waist;
 const heightCm = heightInches * 2.54; // heightInches is always stored in inches
 const waistCm = waistUnit === 'cm' ? latest : latest * 2.54;
 const ratio = (waistCm / (heightCm || 1)).toFixed(2);
 const risk = ratio < 0.5 ? 'healthy' : ratio < 0.6 ? 'elevated' : 'high';
 return { ratio, risk };
 }, [chartData, heightInches, waistUnit]);

 if (chartData.length === 0) {
 return null; // Don't show empty waist chart — less important than weight/bf/nutrition
 }
 if (filteredData.length < 2) {
 return (
 <GlassCard style={{ padding: '20px', textAlign: 'center', marginBottom: '16px' }}>
 <div style={{ fontSize: '13px', color: T.text3 }}>Need at least 2 waist entries for this range</div>
 </GlassCard>
 );
 }

 const W = 420, H = 150, PAD = { top: 10, right: 10, bottom: 28, left: 44 };
 const cW = W - PAD.left - PAD.right;
 const cH = H - PAD.top - PAD.bottom;

 const vals = filteredData.map(d => d.waist);
 const minW = Math.floor(Math.min(.vals) - 1);
 const maxW = Math.ceil(Math.max(.vals) + 1);
 const yRange = maxW - minW || 1;

 const xPos = (i) => PAD.left + (i / Math.max(filteredData.length - 1, 1)) * cW;
 const yPos = (v) => PAD.top + (1 - (v - minW) / yRange) * cH;

 const linePath = filteredData.map((d, i) => `${i === 0 ? 'M' : 'L'}${xPos(i).toFixed(1)},${yPos(d.waist).toFixed(1)}`).join(' ');
 const areaPath = linePath + ` L${xPos(filteredData.length - 1).toFixed(1)},${(PAD.top + cH).toFixed(1)} L${PAD.left},${(PAD.top + cH).toFixed(1)} Z`;

 const ySteps = 4;
 const yLabels = Array.from({ length: ySteps + 1 }, (_, i) => {
 const v = minW + (yRange * i) / ySteps;
 return { v: Math.round(v * 10) / 10, py: yPos(v) };
 });

 const xLabelCount = Math.min(filteredData.length, 5);
 const xStep = Math.max(1, Math.floor((filteredData.length - 1) / Math.max(xLabelCount - 1, 1)));

 // Deltas
 const deltas = useMemo( => {
 if (chartData.length < 2) return [];
 const latest = chartData[chartData.length - 1].waist;
 return [7, 30, 90].map(d => {
 const cutoff = subtractDays(today, d);
 const past = chartData.find(s => s.date >= cutoff);
 if (!past) return null;
 const delta = Math.round((latest - past.waist) * 10) / 10;
 return { label: `${d}d`, delta };
 }).filter(Boolean);
 }, [chartData]);

 return (
 <div style={{ marginBottom: '16px' }}>
 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
 <div>
 <h3 style={{ fontSize: '15px', fontWeight: 600, display: 'inline' }}>Waist</h3>
 {whrText && (
 <span style={{
 fontSize: '11px', marginLeft: '8px',
 color: whrText.risk === 'healthy' ? T.teal : whrText.risk === 'elevated' ? T.warn : T.danger,
 }}>
 W:H ratio {whrText.ratio} ({whrText.risk})
 </span>
 )}
 </div>
 <div style={{ display: 'flex', gap: '3px' }}>
 {['1M', '3M', '6M', '1Y', 'All'].map(r => (
 <button key={r} onClick={ => setRange(r)} style={{
 padding: '6px 10px', borderRadius: '6px', border: 'none', fontSize: '10px', fontWeight: 600, cursor: 'pointer', minHeight: '32px',
 background: range === r ? T.accentSoft : 'transparent',
 color: range === r ? T.accent : T.text3,
 }}>{r}</button>
 ))}
 </div>
 </div>

 <GlassCard animate={false} style={{ padding: '12px 8px 8px', overflow: 'hidden' }}>
 <svg key={range} className="chart-svg" viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto', display: 'block' }}
 role="img" aria-label={`Waist measurement trend chart over ${range}`}
 onMouseLeave={ => setHoverIdx(null)} onTouchEnd={ => setHoverIdx(null)}>
 <defs>
 <linearGradient id="waistGrad" x1="0" y1="0" x2="0" y2="1">
 <stop offset="0%" stopColor={T.accent} stopOpacity="0.12" />
 <stop offset="100%" stopColor={T.accent} stopOpacity="0" />
 </linearGradient>
 </defs>

 {/* Grid */}
 {yLabels.map((l, i) => (
 <g key={i}>
 <line x1={PAD.left} y1={l.py} x2={W - PAD.right} y2={l.py} stroke={T.border} strokeWidth="0.5" />
 <text x={PAD.left - 6} y={l.py + 3.5} fill={T.text3} fontSize="9" fontFamily={T.mono} textAnchor="end">{l.v}</text>
 </g>
 ))}

 {/* Area + Line */}
 <path d={areaPath} fill="url(#waistGrad)" />
 <path d={linePath} fill="none" stroke={T.accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />

 {/* Dots */}
 {filteredData.map((d, i) => (
 <circle key={i} cx={xPos(i)} cy={yPos(d.waist)} r="2.5" fill={T.text3} opacity="0.4"
 onMouseEnter={ => setHoverIdx(i)} onTouchStart={ => setHoverIdx(i)} />
 ))}

 {/* X-axis */}
 {filteredData.filter((_, i) => i % xStep === 0 || i === filteredData.length - 1).map((d) => {
 const i = filteredData.indexOf(d);
 return <text key={d.date} x={xPos(i)} y={H - 4} fill={T.text3} fontSize="8.5" fontFamily={T.mono} textAnchor="middle">{d.date.slice(5)}</text>;
 })}

 {/* Hover */}
 {hoverIdx !== null && filteredData[hoverIdx] && (
 <g>
 <line x1={xPos(hoverIdx)} y1={PAD.top} x2={xPos(hoverIdx)} y2={PAD.top + cH} stroke={T.text2} strokeWidth="0.5" strokeDasharray="3,2" />
 <circle cx={xPos(hoverIdx)} cy={yPos(filteredData[hoverIdx].waist)} r="4" fill={T.accent} stroke={T.bg} strokeWidth="1.5" />
 <rect x={Math.max(2, Math.min(xPos(hoverIdx) - 50, W - 102))} y={PAD.top - 2} width="100" height="22" rx="4"
 fill={T.bgGlass} stroke={T.border} strokeWidth="0.5" />
 <text x={Math.max(52, Math.min(xPos(hoverIdx), W - 52))} y={PAD.top + 13} fill={T.text} fontSize="9" fontFamily={T.mono} textAnchor="middle">
 {filteredData[hoverIdx].date.slice(5)} {filteredData[hoverIdx].waist} {waistUnit}
 </text>
 </g>
 )}
 </svg>

 {/* Deltas */}
 {deltas.length > 0 && (
 <div style={{ display: 'flex', gap: '6px', padding: '8px 4px 0', flexWrap: 'wrap' }}>
 {deltas.map(d => {
 const isGood = d.delta < 0; // smaller waist = good
 return (
 <div key={d.label} style={{
 padding: '3px 8px', borderRadius: '6px', fontSize: '10px', fontFamily: T.mono,
 background: isGood ? 'rgba(78,205,196,0.08)' : d.delta > 0 ? 'rgba(255,183,77,0.08)' : 'rgba(255,255,255,0.04)',
 color: isGood ? T.teal : d.delta > 0 ? T.warn : T.text2,
 }}>
 {d.label}: {d.delta > 0 ? '+' : ''}{d.delta} {waistUnit}
 </div>
 );
 })}
 </div>
 )}
 </GlassCard>
 </div>
 );
}

// ============================================================
// CHART: MULTI-METRIC OVERLAY
// ============================================================

const OVERLAY_METRICS = [
 { key: 'weight', label: 'Weight (trend)', unit: 'lbs', color: '#FF6B35' },
 { key: 'bodyFat', label: 'Body Fat %', unit: '%', color: '#4ECDC4' },
 { key: 'calories', label: 'Calories', unit: 'kcal', color: '#FFB74D' },
 { key: 'protein', label: 'Protein', unit: 'g', color: '#00E676' },
 { key: 'tdee', label: 'TDEE', unit: 'kcal', color: '#FF5252' },
 { key: 'waist', label: 'Waist', unit: 'in', color: '#AB47BC' },
 { key: 'sleep', label: 'Sleep Hours', unit: 'hr', color: '#42A5F5' },
 { key: 'hrv', label: 'HRV', unit: 'ms', color: '#EF5350' },
];

// Standalone pill-button dropdown for choosing an overlay metric
const MetricPicker = ({ value, onChange, exclude }) => {
 const [open, setOpen] = useState(false);
 const ref = useRef(null);
 const selected = OVERLAY_METRICS.find(m => m.key === value) || OVERLAY_METRICS[0];
 const options = OVERLAY_METRICS.filter(m => m.key !== exclude);

 useEffect( => {
 if (!open) return;
 const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
 document.addEventListener('mousedown', handler);
 return => document.removeEventListener('mousedown', handler);
 }, [open]);

 return (
 <div ref={ref} style={{ position: 'relative', display: 'inline-block' }}>
 <button onClick={ => setOpen(o => !o)} style={{
 display: 'flex', alignItems: 'center', gap: '5px',
 background: open ? 'rgba(255,255,255,0.10)' : 'rgba(255,255,255,0.06)',
 border: `1px solid ${open ? T.tealGlow : T.border}`, borderRadius: '16px',
 color: T.text, fontSize: '11px', padding: '5px 10px 5px 8px', cursor: 'pointer',
 fontFamily: T.font, transition: 'all 0.15s', outline: 'none', whiteSpace: 'nowrap',
 }}>
 <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: selected.color, flexShrink: 0 }} />
 <span style={{ fontWeight: 500 }}>{selected.label}</span>
 <ChevronDown size={11} style={{ opacity: 0.5, transition: 'transform 0.15s', transform: open ? 'rotate(180deg)' : 'none' }} />
 </button>
 {open && (
 <div style={{
 position: 'absolute', top: 'calc(100% + 4px)', left: 0, zIndex: 100,
 background: 'rgba(22,22,30,0.97)', backdropFilter: 'blur(16px)',
 border: `1px solid ${T.border}`, borderRadius: '10px',
 padding: '4px', minWidth: '150px', boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
 }}>
 {options.map(m => (
 <button key={m.key} onClick={ => { onChange(m.key); setOpen(false); }} style={{
 display: 'flex', alignItems: 'center', gap: '8px', width: '100%',
 padding: '7px 10px', border: 'none', borderRadius: '7px', cursor: 'pointer',
 background: m.key === value ? 'rgba(78,205,196,0.12)' : 'transparent',
 color: T.text, fontSize: '11px', fontFamily: T.font, textAlign: 'left',
 transition: 'background 0.12s',
 }}
 onMouseEnter={e => { if (m.key !== value) e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}
 onMouseLeave={e => { if (m.key !== value) e.currentTarget.style.background = 'transparent'; }}
 >
 <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: m.color, flexShrink: 0 }} />
 <span style={{ flex: 1, fontWeight: m.key === value ? 600 : 400 }}>{m.label}</span>
 <span style={{ fontSize: '9px', color: T.text3, fontFamily: T.mono }}>{m.unit}</span>
 </button>
 ))}
 </div>
 )}
 </div>
 );
};

function MultiMetricOverlay({ settings, nutritionConfig, allBodyLogs, bodyLogs }) {
 const [primaryKey, setPrimaryKey] = useState('weight');
 const [secondaryKey, setSecondaryKey] = useState('calories');
 const [range, setRange] = useState('1M');
 const [hoverIdx, setHoverIdx] = useState(null);
 const cfg = nutritionConfig || DEFAULT_NUTRITION_CONFIG;
 const weightUnit = cfg.weightUnit || 'lbs';
 const waistUnit = cfg.waistUnit || 'in';

 // Build all metric series from body logs and TDEE history
 const allSeries = useMemo( => {
 const logs = allBodyLogs || loadAllBodyLogs;
 const weightLogs = bodyLogs || logs.filter(l => l.weight);
 const smoothed = weightLogs.length >= 2 ? smoothEWMA(weightLogs) : [];

 // Build TDEE lookup from history
 const tdeeHist = (cfg.tdeeHistory || []).reduce((m, e) => { m[e.date] = e.value; return m; }, {});

 const series = {};

 // Weight trend
 series.weight = smoothed.map(s => ({ date: s.date, value: s.trend }));

 // Body fat (calibrated or raw)
 series.bodyFat = logs.filter(l => l.bodyFat?.value || l.bodyFat?.calibratedValue).map(l => ({
 date: l.date,
 value: Number(l.bodyFat.calibratedValue || l.bodyFat.value),
 })).filter(d => d.value > 0);

 // Calories
 series.calories = logs.filter(l => l.calories).map(l => ({ date: l.date, value: Number(l.calories) }));

 // Protein
 series.protein = logs.filter(l => l.protein).map(l => ({ date: l.date, value: Number(l.protein) }));

 // TDEE
 series.tdee = Object.entries(tdeeHist).map(([date, value]) => ({ date, value })).sort((a, b) => a.date.localeCompare(b.date));

 // Waist
 series.waist = logs.filter(l => l.waistCircumference).map(l => ({ date: l.date, value: Number(l.waistCircumference) }));

 // Sleep
 series.sleep = logs.filter(l => l.sleep?.hours).map(l => ({ date: l.date, value: Number(l.sleep.hours) }));

 // HRV
 series.hrv = logs.filter(l => l.sleep?.hrv).map(l => ({ date: l.date, value: Number(l.sleep.hrv) }));

 return series;
 }, [cfg.tdeeHistory, allBodyLogs, bodyLogs]);

 // Filter by time range and align dates
 const { primaryData, secondaryData, alignedDates } = useMemo( => {
 const ranges = { '1W': 7, '1M': 30, '3M': 90, '6M': 180, '1Y': 365, 'All': 99999 };
 const cutoff = subtractDays(today, ranges[range] || 30);

 const pRaw = (allSeries[primaryKey] || []).filter(d => d.date >= cutoff);
 const sRaw = (allSeries[secondaryKey] || []).filter(d => d.date >= cutoff);

 // Build union of all dates, sorted
 const dateSet = new Set([.pRaw.map(d => d.date),.sRaw.map(d => d.date)]);
 const dates = [.dateSet].sort;

 // Build lookup maps
 const pMap = pRaw.reduce((m, d) => { m[d.date] = d.value; return m; }, {});
 const sMap = sRaw.reduce((m, d) => { m[d.date] = d.value; return m; }, {});

 return {
 primaryData: dates.map(d => ({ date: d, value: pMap[d] ?? null })),
 secondaryData: dates.map(d => ({ date: d, value: sMap[d] ?? null })),
 alignedDates: dates,
 };
 }, [allSeries, primaryKey, secondaryKey, range]);

 const primaryMeta = OVERLAY_METRICS.find(m => m.key === primaryKey) || OVERLAY_METRICS[0];
 const secondaryMeta = OVERLAY_METRICS.find(m => m.key === secondaryKey) || OVERLAY_METRICS[1];

 // Update unit labels based on settings
 const pUnit = primaryKey === 'weight' ? weightUnit : primaryKey === 'waist' ? waistUnit : primaryMeta.unit;
 const sUnit = secondaryKey === 'weight' ? weightUnit : secondaryKey === 'waist' ? waistUnit : secondaryMeta.unit;

 // Pearson correlation coefficient (only when 14+ overlapping data points)
 const correlation = useMemo( => {
 const paired = primaryData
.map((p, i) => ({ p: p.value, s: secondaryData[i]?.value }))
.filter(d => d.p != null && d.s != null);
 if (paired.length < 14) return null;
 const n = paired.length;
 const sumP = paired.reduce((a, d) => a + d.p, 0);
 const sumS = paired.reduce((a, d) => a + d.s, 0);
 const sumPP = paired.reduce((a, d) => a + d.p * d.p, 0);
 const sumSS = paired.reduce((a, d) => a + d.s * d.s, 0);
 const sumPS = paired.reduce((a, d) => a + d.p * d.s, 0);
 const num = n * sumPS - sumP * sumS;
 const den = Math.sqrt((n * sumPP - sumP * sumP) * (n * sumSS - sumS * sumS));
 if (den === 0) return null;
 const r = num / den;
 const absR = Math.abs(r);
 const strength = absR >= 0.7 ? 'strong' : absR >= 0.4 ? 'moderate' : 'weak';
 const direction = r > 0 ? '' : 'inverse ';
 return { r: r.toFixed(2), strength, direction, absR };
 }, [primaryData, secondaryData]);

 if (alignedDates.length < 2) {
 return (
 <GlassCard style={{ padding: '20px', textAlign: 'center', marginBottom: '16px' }}>
 <Activity size={24} color={T.text3} style={{ marginBottom: '8px' }} />
 <div style={{ fontSize: '14px', color: T.text2, marginBottom: '4px' }}>Multi-Metric Overlay</div>
 <div style={{ fontSize: '12px', color: T.text3 }}>Select two metrics with overlapping data to see correlations</div>
 </GlassCard>
 );
 }

 const W = 420, H = 200, PAD = { top: 10, right: 44, bottom: 28, left: 44 };
 const cW = W - PAD.left - PAD.right;
 const cH = H - PAD.top - PAD.bottom;

 // Independent Y-axes
 const pVals = primaryData.filter(d => d.value != null).map(d => d.value);
 const sVals = secondaryData.filter(d => d.value != null).map(d => d.value);

 const pMin = pVals.length > 0 ? Math.min(.pVals) : 0;
 const pMax = pVals.length > 0 ? Math.max(.pVals) : 1;
 const pPad = (pMax - pMin) * 0.08 || 1;

 const sMin = sVals.length > 0 ? Math.min(.sVals) : 0;
 const sMax = sVals.length > 0 ? Math.max(.sVals) : 1;
 const sPad = (sMax - sMin) * 0.08 || 1;

 const pMinY = pMin - pPad, pMaxY = pMax + pPad, pRange = pMaxY - pMinY || 1;
 const sMinY = sMin - sPad, sMaxY = sMax + sPad, sRange = sMaxY - sMinY || 1;

 const n = alignedDates.length;
 const xPos = (i) => PAD.left + (i / Math.max(n - 1, 1)) * cW;
 const yPri = (v) => PAD.top + (1 - (v - pMinY) / pRange) * cH;
 const ySec = (v) => PAD.top + (1 - (v - sMinY) / sRange) * cH;

 // Build SVG paths (skip null gaps)
 const buildPath = (data, yFn) => {
 let path = '';
 let started = false;
 data.forEach((d, i) => {
 if (d.value == null) { started = false; return; }
 path += `${started ? 'L' : 'M'}${xPos(i).toFixed(1)},${yFn(d.value).toFixed(1)} `;
 started = true;
 });
 return path;
 };

 const priPath = buildPath(primaryData, yPri);
 const secPath = buildPath(secondaryData, ySec);

 // Y-axis label generation
 const makeYLabels = (minV, maxV, steps = 4) => {
 const range = maxV - minV;
 return Array.from({ length: steps + 1 }, (_, i) => {
 const v = minV + (i / steps) * range;
 return { value: v, label: v >= 1000 ? (v / 1000).toFixed(1) + 'k' : v < 10 ? v.toFixed(1) : Math.round(v) };
 });
 };

 const pLabels = makeYLabels(pMinY, pMaxY);
 const sLabels = makeYLabels(sMinY, sMaxY);

 // X-axis date labels
 const xStep = Math.max(1, Math.floor(n / 6));

 return (
 <div style={{ marginBottom: '16px' }}>
 <GlassCard animate={false} style={{ padding: '12px' }}>
 {/* Header */}
 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap', gap: '6px' }}>
 <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
 <Activity size={16} color={T.text2} />
 <span style={{ fontSize: '14px', fontWeight: 600, color: T.text }}>Metric Overlay</span>
 </div>
 <div style={{ display: 'flex', gap: '3px' }}>
 {['1W','1M','3M','6M','1Y','All'].map(r => (
 <button key={r} onClick={ => setRange(r)} style={{
 padding: '3px 7px', borderRadius: '6px', fontSize: '10px', fontFamily: T.mono,
 border: 'none', cursor: 'pointer', transition: 'all 0.2s',
 background: range === r ? T.accentSoft : 'rgba(255,255,255,0.04)',
 color: range === r ? T.accent : T.text3,
 }}>{r}</button>
 ))}
 </div>
 </div>

 {/* Metric selectors */}
 <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap' }}>
 <MetricPicker value={primaryKey} onChange={setPrimaryKey} exclude={secondaryKey} />
 <span style={{ fontSize: '11px', color: T.text3 }}>vs</span>
 <MetricPicker value={secondaryKey} onChange={setSecondaryKey} exclude={primaryKey} />
 </div>

 {/* Correlation badge */}
 {correlation && (
 <div style={{
 display: 'inline-flex', alignItems: 'center', gap: '6px', marginBottom: '10px',
 padding: '4px 10px', borderRadius: '12px',
 background: correlation.absR >= 0.7 ? 'rgba(78,205,196,0.1)' : 'rgba(255,255,255,0.04)',
 border: `1px solid ${correlation.absR >= 0.7 ? T.tealGlow : T.border}`,
 }}>
 <span style={{ fontSize: '11px', fontFamily: T.mono, fontWeight: 600,
 color: correlation.absR >= 0.7 ? T.teal : correlation.absR >= 0.4 ? T.text2 : T.text3 }}>
 r = {correlation.r}
 </span>
 <span style={{ fontSize: '10px', color: T.text3 }}>
 {correlation.strength} {correlation.direction}correlation
 </span>
 </div>
 )}

 {/* SVG Chart */}
 <svg key={`${range}-${primaryKey}-${secondaryKey}`} className="chart-svg" viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', overflow: 'visible', userSelect: 'none' }}
 role="img" aria-label={`Multi-metric overlay chart comparing ${primaryKey} and ${secondaryKey || 'single metric'} over ${range}`}
 onMouseMove={(e) => {
 const rect = e.currentTarget.getBoundingClientRect;
 const x = ((e.clientX - rect.left) / rect.width) * W;
 const idx = Math.round(((x - PAD.left) / cW) * (n - 1));
 setHoverIdx(Math.max(0, Math.min(n - 1, idx)));
 }}
 onMouseLeave={ => setHoverIdx(null)}
 onTouchMove={(e) => {
 const rect = e.currentTarget.getBoundingClientRect;
 const x = ((e.touches[0].clientX - rect.left) / rect.width) * W;
 const idx = Math.round(((x - PAD.left) / cW) * (n - 1));
 setHoverIdx(Math.max(0, Math.min(n - 1, idx)));
 }}
 onTouchEnd={ => setHoverIdx(null)}
 >
 {/* Grid lines */}
 {pLabels.map((l, i) => (
 <line key={`pg${i}`} x1={PAD.left} y1={yPri(l.value)} x2={W - PAD.right} y2={yPri(l.value)}
 stroke={T.border} strokeWidth="0.5" />
 ))}

 {/* Left Y-axis labels (primary) */}
 {pLabels.map((l, i) => (
 <text key={`pl${i}`} x={PAD.left - 4} y={yPri(l.value) + 3} fill={primaryMeta.color}
 fontSize="8.5" fontFamily={T.mono} textAnchor="end" opacity="0.8">{l.label}</text>
 ))}

 {/* Right Y-axis labels (secondary) */}
 {sLabels.map((l, i) => (
 <text key={`sl${i}`} x={W - PAD.right + 4} y={ySec(l.value) + 3} fill={secondaryMeta.color}
 fontSize="8.5" fontFamily={T.mono} textAnchor="start" opacity="0.8">{l.label}</text>
 ))}

 {/* Primary line */}
 {priPath && <path d={priPath} fill="none" stroke={primaryMeta.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />}

 {/* Secondary line */}
 {secPath && <path d={secPath} fill="none" stroke={secondaryMeta.color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="6,3" />}

 {/* X-axis date labels */}
 {alignedDates.map((d, i) => {
 if (i % xStep !== 0 && i !== n - 1) return null;
 return <text key={d} x={xPos(i)} y={H - 4} fill={T.text3} fontSize="8.5" fontFamily={T.mono} textAnchor="middle">{d.slice(5)}</text>;
 })}

 {/* Hover crosshair + tooltip */}
 {hoverIdx !== null && (
 <g>
 <line x1={xPos(hoverIdx)} y1={PAD.top} x2={xPos(hoverIdx)} y2={PAD.top + cH}
 stroke={T.text2} strokeWidth="0.5" strokeDasharray="3,2" />
 {primaryData[hoverIdx]?.value != null && (
 <circle cx={xPos(hoverIdx)} cy={yPri(primaryData[hoverIdx].value)} r="3.5"
 fill={primaryMeta.color} stroke={T.bg} strokeWidth="1.5" />
 )}
 {secondaryData[hoverIdx]?.value != null && (
 <circle cx={xPos(hoverIdx)} cy={ySec(secondaryData[hoverIdx].value)} r="3.5"
 fill={secondaryMeta.color} stroke={T.bg} strokeWidth="1.5" />
 )}
 {/* Tooltip */}
 <rect x={Math.max(2, Math.min(xPos(hoverIdx) - 65, W - 132))} y={PAD.top - 2}
 width="130" height="34" rx="4" fill={T.bgGlass} stroke={T.border} strokeWidth="0.5" />
 <text x={Math.max(67, Math.min(xPos(hoverIdx), W - 67))} y={PAD.top + 10}
 fill={T.text} fontSize="8.5" fontFamily={T.mono} textAnchor="middle">
 {alignedDates[hoverIdx]?.slice(5)}
 </text>
 <text x={Math.max(67, Math.min(xPos(hoverIdx), W - 67))} y={PAD.top + 22}
 fill={T.text2} fontSize="8" fontFamily={T.mono} textAnchor="middle">
 {primaryData[hoverIdx]?.value != null ? `${primaryData[hoverIdx].value.toFixed(1)} ${pUnit}` : '—'}
 {' · '}
 {secondaryData[hoverIdx]?.value != null ? `${secondaryData[hoverIdx].value.toFixed(1)} ${sUnit}` : '—'}
 </text>
 </g>
 )}
 </svg>

 {/* Legend */}
 <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginTop: '6px', fontSize: '10px' }}>
 <span style={{ color: primaryMeta.color }}>━ {primaryMeta.label} ({pUnit})</span>
 <span style={{ color: secondaryMeta.color }}>╌ {secondaryMeta.label} ({sUnit})</span>
 </div>
 </GlassCard>
 </div>
 );
}

// ============================================================
// WEEKLY CHECK-IN CARD
// ============================================================

function WeeklyCheckInCard({ nutritionConfig, onUpdateNutritionConfig, settings, allBodyLogs }) {
 const [dismissed, setDismissed] = useState(false);
 const cfg = nutritionConfig || DEFAULT_NUTRITION_CONFIG;

 const checkInData = useMemo( => {
 const lastCheckIn = cfg.lastCheckInDate;
 const allLogs = allBodyLogs || loadAllBodyLogs;
 const logsWithWeight = allLogs.filter(l => l.weight);
 const logsWithCals = allLogs.filter(l => l.calories);

 // Must have 7+ days of data
 if (logsWithWeight.length < 7 && logsWithCals.length < 7) return null;

 // Check if 7+ days since last check-in
 const todayStr = today;
 
 // Check snooze
 if (cfg.snoozeUntilDate && todayStr < cfg.snoozeUntilDate) return null;
 
 if (lastCheckIn) {
 const daysSince = Math.floor((new Date(todayStr + 'T12:00:00') - new Date(lastCheckIn + 'T12:00:00')) / 86400000);
 if (daysSince < 7) return null;
 } else {
 // No check-in ever — need 7+ days of data
 const firstDate = [.logsWithWeight,.logsWithCals].sort((a, b) => a.date.localeCompare(b.date))[0]?.date;
 if (!firstDate) return null;
 const daysSinceFirst = Math.floor((new Date(todayStr + 'T12:00:00') - new Date(firstDate + 'T12:00:00')) / 86400000);
 if (daysSinceFirst < 7) return null;
 }

 // Weight trend last 7 days (smoothed)
 const recentWeight = logsWithWeight.slice(-14);
 let weightTrend = null;
 if (recentWeight.length >= 3) {
 const smoothed = smoothEWMA(recentWeight);
 const last7 = smoothed.slice(-7);
 if (last7.length >= 2) {
 const startW = last7[0].trend;
 const endW = last7[last7.length - 1].trend;
 weightTrend = {
 start: startW,
 end: endW,
 delta: Math.round((endW - startW) * 100) / 100,
 direction: endW > startW ? 'up' : endW < startW ? 'down' : 'flat',
 };
 }
 }

 // Average intake last 7 days
 const cutoff7 = subtractDays(todayStr, 7);
 const recentCals = logsWithCals.filter(l => l.date >= cutoff7);
 const avgIntake = recentCals.length > 0
 ? Math.round(recentCals.reduce((a, l) => a + Number(l.calories), 0) / recentCals.length)
 : null;

 const calTarget = cfg.dailyCalorieTarget || 2200;
 const adherencePct = avgIntake ? Math.round((avgIntake / calTarget) * 100) : null;
 const onTarget = adherencePct && adherencePct >= 90 && adherencePct <= 110;
 const overTarget = adherencePct && adherencePct > 110;

 // TDEE
 const tdee = cfg.estimatedTDEE || 2500;
 const confidence = cfg.tdeeConfidence || 'low';

 // Compute proposed new target
 const goal = cfg.goal || 'maintain';
 const rate = cfg.weeklyRatePercent || 0.5;
 const latestWeight = logsWithWeight.length > 0 ? Number(logsWithWeight[logsWithWeight.length - 1].weight) : 185;
 const isKg = (cfg.weightUnit || 'lbs') === 'kg';
 const calPerUnit = isKg ? 7700 : 3500;
 const weeklyChange = (rate / 100) * latestWeight * calPerUnit;
 const dailyAdj = weeklyChange / 7;

 let newTarget;
 if (goal === 'lose') newTarget = Math.round(tdee - dailyAdj);
 else if (goal === 'gain') newTarget = Math.round(tdee + dailyAdj);
 else newTarget = Math.round(tdee);

 // Decision logic
 let recommendation = 'none'; // 'adjust' | 'adherence' | 'none'
 let message = '';

 if (overTarget) {
 recommendation = 'adherence';
 message = `Intake averaged ${adherencePct}% of target (above target). Current targets are kept — focus on hitting the daily target more consistently.`;
 } else if (onTarget && goal !== 'maintain') {
 // Check if weight is moving in the right direction
 const goalDir = goal === 'lose' ? 'down' : 'up';
 if (weightTrend && weightTrend.direction !== goalDir && weightTrend.direction !== 'flat') {
 recommendation = 'adjust';
 message = `Intake was on-target (${adherencePct}%), but weight moved ${weightTrend.direction} instead of ${goalDir}. TDEE estimate may need adjustment.`;
 } else if (weightTrend && weightTrend.direction === 'flat' && goal !== 'maintain') {
 recommendation = 'adjust';
 message = `Intake was on-target (${adherencePct}%), but weight hasn't changed. TDEE estimate may need adjustment.`;
 } else {
 recommendation = 'none';
 message = `On track! Intake at ${adherencePct}% of target and weight is trending ${weightTrend?.direction || 'as expected'}.`;
 }
 } else if (avgIntake && adherencePct < 90 && goal === 'gain') {
 recommendation = 'adherence';
 message = `Intake averaged ${adherencePct}% of target (below target). Try to hit the daily target more consistently for weight gain.`;
 } else {
 recommendation = 'none';
 message = avgIntake
 ? `Intake averaged ${adherencePct}% of target. Keep logging for more accurate recommendations.`
 : 'Not enough calorie data for a detailed recommendation yet.';
 }

 return {
 tdee, confidence, weightTrend, avgIntake, adherencePct, calTarget,
 newTarget, recommendation, message, onTarget,
 currentTarget: calTarget,
 latestWeight,
 };
 }, [cfg, allBodyLogs]);

 if (!checkInData || dismissed) return null;

 const { tdee, confidence, weightTrend, avgIntake, adherencePct, newTarget, recommendation, message, currentTarget } = checkInData;
 const showAdjust = recommendation === 'adjust' && newTarget !== currentTarget;
 const weightUnit = cfg.weightUnit || 'lbs';

 const handleAccept = => {
 onUpdateNutritionConfig({
.cfg,
 dailyCalorieTarget: newTarget,
 lastCheckInDate: today,
 });
 setDismissed(true);
 };

 const handleDismiss = => {
 onUpdateNutritionConfig({
.cfg,
 lastCheckInDate: today,
 });
 setDismissed(true);
 };

 const handleSnooze = => {
 const snoozeDate = new Date;
 snoozeDate.setDate(snoozeDate.getDate + 3);
 onUpdateNutritionConfig({
.cfg,
 snoozeUntilDate: snoozeDate.toISOString.split('T')[0],
 });
 setDismissed(true);
 };

 return (
 <GlassCard animate={false} style={{
 padding: '16px', marginBottom: '16px',
 border: `1px solid ${T.tealGlow}`,
 background: `linear-gradient(135deg, rgba(78,205,196,0.04), rgba(255,107,53,0.02))`,
 }}>
 <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
 <Target size={18} color={T.teal} />
 <span style={{ fontSize: '15px', fontWeight: 700, color: T.text }}>Weekly Check-In</span>
 </div>

 {/* Stats row */}
 <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '12px' }}>
 {/* TDEE */}
 <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: T.radiusSm, padding: '8px', textAlign: 'center' }}>
 <div style={{ fontSize: '10px', color: T.text3, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '2px' }}>TDEE</div>
 <div style={{ fontSize: '16px', fontWeight: 700, fontFamily: T.mono, color: T.accent }}>{tdee.toLocaleString}</div>
 <div style={{
 fontSize: '9px', marginTop: '2px',
 color: confidence === 'high' ? T.teal : confidence === 'medium' ? T.warn : T.text3,
 }}>
 {confidence} confidence
 </div>
 </div>
 {/* Weight trend */}
 <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: T.radiusSm, padding: '8px', textAlign: 'center' }}>
 <div style={{ fontSize: '10px', color: T.text3, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '2px' }}>7d Weight</div>
 {weightTrend ? (
 <>
 <div style={{ fontSize: '16px', fontWeight: 700, fontFamily: T.mono,
 color: weightTrend.direction === 'down' ? T.teal : weightTrend.direction === 'up' ? T.warn : T.text2 }}>
 {weightTrend.delta > 0 ? '+' : ''}{weightTrend.delta} {weightUnit}
 </div>
 <div style={{ fontSize: '9px', color: T.text3, marginTop: '2px' }}>
 {weightTrend.direction === 'flat' ? '→ flat' : weightTrend.direction === 'down' ? '↓ decreasing' : '↑ increasing'}
 </div>
 </>
 ) : (
 <div style={{ fontSize: '12px', color: T.text3, marginTop: '4px' }}>—</div>
 )}
 </div>
 {/* Avg intake */}
 <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: T.radiusSm, padding: '8px', textAlign: 'center' }}>
 <div style={{ fontSize: '10px', color: T.text3, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '2px' }}>Avg Intake</div>
 {avgIntake ? (
 <>
 <div style={{ fontSize: '16px', fontWeight: 700, fontFamily: T.mono, color: T.text }}>{avgIntake.toLocaleString}</div>
 <div style={{
 fontSize: '9px', marginTop: '2px',
 color: adherencePct >= 90 && adherencePct <= 110 ? T.teal : T.warn,
 }}>
 {adherencePct}% of target
 </div>
 </>
 ) : (
 <div style={{ fontSize: '12px', color: T.text3, marginTop: '4px' }}>—</div>
 )}
 </div>
 </div>

 {/* Message */}
 <div style={{ fontSize: '12px', color: T.text2, lineHeight: 1.5, marginBottom: '12px', padding: '0 2px' }}>
 {message}
 </div>

 {/* Adjustment proposal */}
 {showAdjust && (
 <div style={{
 background: 'rgba(255,255,255,0.04)', borderRadius: T.radiusSm, padding: '10px',
 marginBottom: '12px', border: `1px solid ${T.border}`,
 }}>
 <div style={{ fontSize: '11px', color: T.text3, marginBottom: '6px' }}>Suggested Target Adjustment</div>
 <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}>
 <div style={{ textAlign: 'center' }}>
 <div style={{ fontSize: '10px', color: T.text3 }}>Current</div>
 <div style={{ fontSize: '16px', fontFamily: T.mono, color: T.text2, fontWeight: 600 }}>
 {currentTarget.toLocaleString}
 </div>
 </div>
 <ChevronRight size={16} color={T.teal} />
 <div style={{ textAlign: 'center' }}>
 <div style={{ fontSize: '10px', color: T.teal }}>Proposed</div>
 <div style={{ fontSize: '16px', fontFamily: T.mono, color: T.teal, fontWeight: 700 }}>
 {newTarget.toLocaleString}
 </div>
 </div>
 <span style={{ fontSize: '10px', color: T.text3 }}>kcal/day</span>
 </div>
 </div>
 )}

 {/* Action buttons */}
 <div style={{ display: 'flex', gap: '8px' }}>
 {showAdjust && (
 <button onClick={handleAccept} style={{
 flex: 1, padding: '10px', borderRadius: T.radiusSm, border: 'none', cursor: 'pointer',
 background: `linear-gradient(135deg, ${T.teal}, ${T.teal}cc)`, color: T.bg,
 fontSize: '13px', fontWeight: 700, transition: 'all 0.2s',
 }}>
 Accept New Target
 </button>
 )}
 <button onClick={handleSnooze} style={{
 flex: 0, padding: '10px', borderRadius: T.radiusSm, cursor: 'pointer',
 background: 'rgba(255,255,255,0.04)', border: `1px solid ${T.border}`,
 color: T.text3, fontSize: '11px', fontWeight: 500, transition: 'all 0.2s',
 minWidth: '70px', whiteSpace: 'nowrap',
 }}>
 In 3 days
 </button>
 <button onClick={handleDismiss} style={{
 flex: showAdjust ? 0 : 1, padding: '10px', borderRadius: T.radiusSm, cursor: 'pointer',
 background: 'rgba(255,255,255,0.04)', border: `1px solid ${T.border}`,
 color: T.text2, fontSize: '13px', fontWeight: 500, transition: 'all 0.2s',
 minWidth: showAdjust ? '80px' : undefined,
 }}>
 {showAdjust ? 'Dismiss' : 'Got it'}
 </button>
 </div>
 </GlassCard>
 );
}

// ============================================================
// JOURNAL CARD
// ============================================================

function JournalCard({ workout }) {
 const [isOpen, setIsOpen] = useState(false);
 const [newEntry, setNewEntry] = useState('');
 const [recentEntries, setRecentEntries] = useState([]);
 const [showAll, setShowAll] = useState(false);

 // Load recent entries on mount/open
 useEffect( => {
 if (!isOpen) return;
 const entries = [];
 const keys = LS.keys('journal:');
 const sortedKeys = keys.sort((a, b) => b.localeCompare(a)).slice(0, 14); // Last 2 weeks
 for (const key of sortedKeys) {
 const dayEntries = LS.get(key, []);
 if (Array.isArray(dayEntries)) {
 entries.push(.dayEntries.map(e => ({.e, _date: key.replace('journal:', '') })));
 }
 }
 entries.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
 setRecentEntries(entries);
 }, [isOpen, newEntry]); // re-load after adding

 const getCurrentContext = => {
 const ctx = { phase: null, splitDay: null, exerciseName: null, exerciseId: null };
 if (workout?.exercises) {
 ctx.splitDay = workout.splitDay?.replace(/_/g, ' ') || null;
 // Find the last exercise that has any completed sets (current exercise being worked on)
 const inProgress = workout.exercises.find(ex => {
 const done = ex.logSets?.filter(s => s.done).length || 0;
 const total = ex.logSets?.length || 0;
 return done > 0 && done < total;
 });
 const lastDone = [.(workout.exercises || [])].reverse.find(ex => 
 ex.logSets?.some(s => s.done)
 );
 const current = inProgress || lastDone;
 if (current) {
 ctx.exerciseName = current.name;
 ctx.exerciseId = current.id;
 }
 }
 return ctx;
 };

 const handleAdd = => {
 if (!newEntry.trim) return;
 const todayStr = today;
 const ctx = getCurrentContext;
 const entry = {
 id: `j_${Date.now}`,
 timestamp: Date.now,
 text: newEntry.trim,
 tags: {
 splitDay: ctx.splitDay || null,
 exerciseName: ctx.exerciseName || null,
 exerciseId: ctx.exerciseId || null,
 time: new Date.toLocaleTimeString('en-US', { hour:'numeric', minute:'2-digit' }),
 },
 };
 const existing = LS.get(`journal:${todayStr}`, []);
 const updated = Array.isArray(existing) ? [.existing, entry] : [entry];
 LS.set(`journal:${todayStr}`, updated);
 setNewEntry('');
 };

 const handleDelete = (entryId, dateStr) => {
 const dayEntries = LS.get(`journal:${dateStr}`, []);
 const filtered = dayEntries.filter(e => e.id !== entryId);
 if (filtered.length > 0) {
 LS.set(`journal:${dateStr}`, filtered);
 } else {
 localStorage.removeItem(`journal:${dateStr}`);
 }
 setRecentEntries(prev => prev.filter(e => e.id !== entryId));
 };

 const ctx = getCurrentContext;
 const displayEntries = showAll ? recentEntries : recentEntries.slice(0, 4);

 return (
 <GlassCard style={{ marginBottom:'16px', padding: isOpen ? '16px' : '0', overflow:'hidden' }}>
 <button onClick={ => setIsOpen(!isOpen)} style={{
 width:'100%', padding: isOpen ? '0 0 12px' : '14px 16px', background:'none', border:'none',
 display:'flex', alignItems:'center', gap:'8px', cursor:'pointer', color:T.text,
 }}>
 <BookOpen size={18} color={T.teal} />
 <span style={{ fontSize:'15px', fontWeight:600, flex:1, textAlign:'left' }}>Journal</span>
 {recentEntries.length > 0 && isOpen && (
 <span style={{ fontSize:'11px', color:T.text3, fontFamily:T.mono }}>{recentEntries.length}</span>
 )}
 <ChevronDown size={16} color={T.text3} style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition:'0.2s' }} />
 </button>

 {isOpen && (
 <div style={{ animation:'fadeUp 0.2s ease-out' }}>
 {/* Auto-tag context */}
 {ctx.exerciseName && (
 <div style={{ display:'flex', gap:'6px', flexWrap:'wrap', marginBottom:'8px' }}>
 {ctx.splitDay && (
 <span style={{ fontSize:'10px', padding:'2px 8px', borderRadius:'6px', background:T.accentSoft, color:T.accent, fontWeight:600 }}>
 {ctx.splitDay}
 </span>
 )}
 <span style={{ fontSize:'10px', padding:'2px 8px', borderRadius:'6px', background:T.tealGlow, color:T.teal, fontWeight:600 }}>
 {ctx.exerciseName}
 </span>
 </div>
 )}

 {/* New entry input */}
 <div style={{ display:'flex', gap:'8px', marginBottom:'12px' }}>
 <textarea
 placeholder="How's the session going? Note form cues, pain, energy."
 value={newEntry} onChange={e => setNewEntry(e.target.value)}
 onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault; handleAdd; } }}
 rows={2} aria-label="Workout journal entry"
 style={{
 flex:1, background:'rgba(255,255,255,0.04)', border:`1px solid ${T.border}`,
 borderRadius:'10px', padding:'10px 12px', color:T.text, fontSize:'13px',
 fontFamily:T.font, outline:'none', resize:'none', lineHeight:1.4,
 }}
 />
 <button onClick={handleAdd} disabled={!newEntry.trim}
 style={{
 width:'40px', borderRadius:'10px', border:'none', cursor: newEntry.trim ? 'pointer' : 'default',
 background: newEntry.trim ? T.tealGlow : 'rgba(255,255,255,0.02)',
 color: newEntry.trim ? T.teal : T.text3,
 display:'flex', alignItems:'center', justifyContent:'center', transition:'all 0.2s', flexShrink:0,
 }}>
 <Send size={16} />
 </button>
 </div>

 {/* Recent entries */}
 {displayEntries.length > 0 && (
 <div style={{ borderTop:`1px solid ${T.border}`, paddingTop:'10px' }}>
 <div style={{ fontSize:'10px', fontWeight:600, color:T.text3, textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:'8px' }}>
 Recent Entries
 </div>
 {displayEntries.map((entry, i) => {
 const entryDate = new Date(entry.timestamp);
 const isEntryToday = entry._date === today;
 const dateLabel = isEntryToday ? 'Today' : 
 entry._date === subtractDays(today, 1) ? 'Yesterday' :
 entryDate.toLocaleDateString('en-US', { month:'short', day:'numeric' });

 return (
 <div key={entry.id || i} style={{ 
 padding:'8px 0', borderBottom: i < displayEntries.length - 1 ? `1px solid ${T.border}` : 'none',
 display:'flex', gap:'8px', alignItems:'flex-start',
 }}>
 <div style={{ flex:1 }}>
 <div style={{ fontSize:'13px', color:T.text, lineHeight:1.4, marginBottom:'4px' }}>
 {entry.text}
 </div>
 <div style={{ display:'flex', gap:'6px', flexWrap:'wrap', alignItems:'center' }}>
 <span style={{ fontSize:'10px', color:T.text3, fontFamily:T.mono }}>
 {dateLabel} {entry.tags?.time || ''}
 </span>
 {entry.tags?.splitDay && (
 <span style={{ fontSize:'10px', padding:'2px 6px', borderRadius:'4px', background:'rgba(255,107,53,0.08)', color:T.accent }}>
 {entry.tags.splitDay}
 </span>
 )}
 {entry.tags?.exerciseName && (
 <span style={{ fontSize:'10px', padding:'2px 6px', borderRadius:'4px', background:'rgba(78,205,196,0.08)', color:T.teal }}>
 {entry.tags.exerciseName}
 </span>
 )}
 </div>
 </div>
 <button onClick={ => handleDelete(entry.id, entry._date)} style={{
 background:'none', border:'none', cursor:'pointer', padding:'10px',
 color:T.text3, opacity:0.5, flexShrink:0, minWidth:'44px', minHeight:'44px',
 display:'flex', alignItems:'center', justifyContent:'center',
 }}>
 <X size={14} />
 </button>
 </div>
 );
 })}
 {recentEntries.length > 4 && (
 <button onClick={ => setShowAll(!showAll)} style={{
 background:'none', border:'none', color:T.teal, fontSize:'12px', cursor:'pointer',
 padding:'12px 0', width:'100%', textAlign:'center', minHeight:'44px',
 }}>
 {showAll ? 'Show less' : `Show all ${recentEntries.length} entries`}
 </button>
 )}
 </div>
 )}

 {displayEntries.length === 0 && (
 <div style={{ textAlign:'center', padding:'12px 0', color:T.text3, fontSize:'12px' }}>
 No entries yet. Journal during your workout — entries are auto-tagged with your current exercise.
 </div>
 )}
 </div>
 )}
 </GlassCard>
 );
}

// ============================================================
// TAB: TODAY
// ============================================================

function TodayTab({ profile, workout, onGenerateWorkout, onUpdateExercise, onSessionMeta, onAddXP, settings, goToSettings, nutritionConfig, calibration, onSaveBodyLog, onRemoveExercise, isGeneratingWorkout = false, restTimers = {}, onRestTimerChange }) {
 // Extract exercises from v2 format
 const exercises = workout?.exercises || (Array.isArray(workout) ? workout : null);
 const splitLabel = workout?.splitDay?.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase) || 'Full Body';

 // Split selector state
 const [selectedSplit, setSelectedSplit] = useState(null); // null = auto
 const [selectedDayIdx, setSelectedDayIdx] = useState(0);

 const handleSwapExercise = useCallback((currentId, newId) => {
 if (!newId || !workout?.exercises) return;
 const newExercise = EXERCISES.find(e => e.id === newId);
 if (!newExercise) return;
 const current = workout.exercises.find(e => e.id === currentId);
 if (!current) return;
 const trainingGoal = settings?.trainingGoal || 'hypertrophy';
 const repRange = newExercise.repRanges?.[trainingGoal] || newExercise.repRanges?.hypertrophy;
 const restTime = repRange?.rest || newExercise.rest || 90;
 const numSets = newExercise.sets || 3;
 const swapped = {
.newExercise,
 slot: current.slot, mandatory: current.mandatory, rest: restTime, prescription: null,
 logSets: Array.from({ length: numSets }, => ({ weight: '', reps: '', rpe: '', done: false })),
 };
 onUpdateExercise(swapped, currentId);
 }, [workout, settings, onUpdateExercise]);

 // PR tracking state (must be declared before early return per Rules of Hooks)
 const [sessionPRCount, setSessionPRCount] = useState(0);
 const sessionPRsRef = useRef({});
 const handlePRDetected = useCallback((exerciseId, prs) => {
 sessionPRsRef.current[exerciseId] = prs;
 const total = Object.values(sessionPRsRef.current).reduce((sum, arr) => sum + arr.length, 0);
 setSessionPRCount(total);
 if (prs.length > 0 && onAddXP) onAddXP(XP_REWARDS.pr || 100, '🏆 PR! +' + (XP_REWARDS.pr || 100) + ' XP');
 }, [onAddXP]);

 // Workout Summary Modal state
 const [showSummary, setShowSummary] = useState(false);
 const handleSaveSessionNotes = useCallback((notes) => {
 if (onSessionMeta) onSessionMeta({ sessionNotes: notes });
 }, [onSessionMeta]);

 if (!exercises) {
 const autoSplit = selectSplit(settings?.daysPerWeek || 3, settings?.experienceLevel || 'beginner');
 const activeSplit = selectedSplit || autoSplit;
 const activeTemplate = SPLIT_TEMPLATES[activeSplit];
 const splitOptions = Object.entries(SPLIT_TEMPLATES);

 return (
 <div style={{ animation:'fadeIn 0.5s ease-out' }}>
 <DailyLogCard settings={settings} nutritionConfig={nutritionConfig} calibration={calibration}
 profile={profile} onSave={onSaveBodyLog} onAddXP={onAddXP} />
 
 {/* Journal Card */}
 <JournalCard workout={workout} />

 {/* Scroll hint for workout section below */}
 <div style={{
 textAlign:'center', padding:'16px 0 8px', display:'flex',
 alignItems:'center', gap:'10px', justifyContent:'center',
 }}>
 <div style={{ height:'1px', flex:1, background:T.border }} />
 <span style={{ fontSize:'11px', color:T.text3, fontWeight:600, textTransform:'uppercase',
 letterSpacing:'1px', display:'flex', alignItems:'center', gap:'4px' }}>
 <Dumbbell size={12} /> Today's Workout
 </span>
 <div style={{ height:'1px', flex:1, background:T.border }} />
 </div>

 <div style={{ textAlign:'center', paddingTop:'24px' }}>
 <div style={{
 width:80, height:80, borderRadius:'24px', background:T.accentSoft,
 display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 24px',
 }}>
 <Dumbbell size={36} color={T.accent} />
 </div>
 <h2 style={{ fontSize:'22px', fontWeight:700, marginBottom:'8px' }}>Ready to train?</h2>
 <p style={{ color:T.text2, fontSize:'14px', marginBottom:'24px', lineHeight:1.5 }}>
 Choose your split and day, or let the app decide.
 </p>

 {/* Split Type Selector */}
 <div style={{ marginBottom:'16px' }}>
 <div style={{ fontSize:'11px', color:T.text3, fontWeight:600, textTransform:'uppercase', letterSpacing:'1px', marginBottom:'8px' }}>
 Split Type
 </div>
 <div style={{ display:'flex', gap:'8px', justifyContent:'center', flexWrap:'wrap' }}>
 {splitOptions.map(([key, tmpl]) => {
 const isActive = activeSplit === key;
 const isAuto = !selectedSplit && key === autoSplit;
 return (
 <button key={key} onClick={ => { setSelectedSplit(key); setSelectedDayIdx(0); }}
 style={{
 padding:'10px 16px', borderRadius:'12px', border:`1px solid ${isActive ? T.accent : T.border}`,
 background: isActive ? T.accentSoft : T.bgCard, color: isActive ? T.accent : T.text2,
 fontSize:'13px', fontWeight: isActive ? 700 : 500, cursor:'pointer',
 transition:'all 0.2s', position:'relative',
 }}>
 {tmpl.name}
 {isAuto && !selectedSplit && (
 <span style={{ position:'absolute', top:'-6px', right:'-4px', fontSize:'8px', background:T.teal,
 color:'#000', padding:'1px 5px', borderRadius:'6px', fontWeight:700 }}>AUTO</span>
 )}
 </button>
 );
 })}
 </div>
 </div>

 {/* Day Selector (only show if split has multiple days) */}
 {activeTemplate && activeTemplate.days.length > 1 && (
 <div style={{ marginBottom:'24px' }}>
 <div style={{ fontSize:'11px', color:T.text3, fontWeight:600, textTransform:'uppercase', letterSpacing:'1px', marginBottom:'8px' }}>
 Today's Focus
 </div>
 <div style={{ display:'flex', gap:'8px', justifyContent:'center', flexWrap:'wrap' }}>
 {activeTemplate.days.map((day, idx) => {
 const isActive = selectedDayIdx === idx;
 return (
 <button key={idx} onClick={ => setSelectedDayIdx(idx)}
 style={{
 padding:'10px 20px', borderRadius:'12px', border:`1px solid ${isActive ? T.teal : T.border}`,
 background: isActive ? T.tealGlow : T.bgCard, color: isActive ? T.teal : T.text2,
 fontSize:'13px', fontWeight: isActive ? 700 : 500, cursor:'pointer', transition:'all 0.2s',
 }}>
 {day.name}
 <div style={{ fontSize:'10px', color: isActive ? 'rgba(78,205,196,0.7)' : T.text3, marginTop:'2px' }}>
 {day.slots.slice(0, 4).map(s => s.charAt(0).toUpperCase + s.slice(1)).join(', ')}
 {day.slots.length > 4 ? ` +${day.slots.length - 4}` : ''}
 </div>
 </button>
 );
 })}
 </div>
 </div>
 )}

 <button
 disabled={isGeneratingWorkout}
 onClick={ => !isGeneratingWorkout && onGenerateWorkout({ forceSplit: activeSplit, forceDayIndex: selectedDayIdx })} style={{
 padding:'16px 40px', background: isGeneratingWorkout ? 'rgba(255,255,255,0.1)' : `linear-gradient(135deg, ${T.accent}, #FF8C42)`,
 border:'none', borderRadius:'16px', color:'white', fontWeight:700, fontSize:'16px',
 cursor: isGeneratingWorkout ? 'default' : 'pointer', boxShadow: isGeneratingWorkout ? 'none' : `0 8px 32px ${T.accentGlow}`,
 transition:'transform 0.15s', letterSpacing:'-0.01em',
 opacity: isGeneratingWorkout ? 0.6 : 1,
 }}
 onMouseDown={e => !isGeneratingWorkout && (e.target.style.transform='scale(0.97)')}
 onMouseUp={e => e.target.style.transform='scale(1)'}
 onMouseLeave={e => e.target.style.transform='scale(1)'}
 >
 {isGeneratingWorkout ? 'Generating.' : `Generate ${activeTemplate?.days[selectedDayIdx]?.name || 'Full Body'} Workout`}
 </button>
 <p style={{ color:T.text3, fontSize:'12px', marginTop:'16px' }}>
 {activeTemplate?.name || 'Full Body'} · ~45 min · {EXERCISES.filter(e => e.phase?.[profile.phase]?.s !== 'avoid' && e.location?.[profile.location]).length} exercises available
 </p>
 </div>
 </div>
 );
 }

 const mandatory = exercises.filter(e => e.mandatory);
 const bonus = exercises.filter(e => !e.mandatory);
 const allMandatoryDone = mandatory.every(e => e.logSets?.every(s => s.done));
 const allDone = exercises.every(e => e.logSets?.every(s => s.done));
 const hasAnyDone = exercises.some(e => e.logSets?.some(s => s.done));

 return (
 <div style={{ animation:'fadeIn 0.3s ease-out' }}>
 <DailyLogCard settings={settings} nutritionConfig={nutritionConfig} calibration={calibration}
 profile={profile} onSave={onSaveBodyLog} onAddXP={onAddXP} />
 
 {/* Journal Card */}
 <JournalCard workout={workout} />

 {/* Workout Duration Timer */}
 {hasAnyDone && <WorkoutTimerBar startedAt={workout?.startedAt} />}

 <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'16px' }}>
 <div>
 <h2 style={{ fontSize:'20px', fontWeight:700, letterSpacing:'-0.02em' }}>
 {"Today's Workout"}
 {sessionPRCount > 0 ? (
 <span style={{ marginLeft: '8px', fontSize: '13px', color: '#FFD700', fontWeight: 600, verticalAlign: 'middle' }}>
 {'\uD83C\uDFC6 ' + sessionPRCount + ' PR' + (sessionPRCount !== 1 ? 's' : '')}
 </span>
 ) : null}
 </h2>
 <p style={{ fontSize:'12px', color:T.text3, marginTop:'2px' }}>
 {splitLabel} · {exercises.length} exercises · {mandatory.length} mandatory
 </p>
 </div>
 <button disabled={isGeneratingWorkout} onClick={ => !isGeneratingWorkout && onGenerateWorkout} style={{
 background:T.bgCard, border:`1px solid ${T.border}`, borderRadius:'10px',
 padding:'8px 12px', color:T.text2, fontSize:'12px', cursor: isGeneratingWorkout ? 'default' : 'pointer',
 display:'flex', alignItems:'center', gap:'4px',
 opacity: isGeneratingWorkout ? 0.5 : 1,
 }}>
 <RotateCcw size={14} /> {isGeneratingWorkout ? '.' : 'New'}
 </button>
 </div>

 {/* Mandatory exercises */}
 {mandatory.map(ex => (
 <ExerciseCard key={ex.id} exercise={ex} onUpdate={onUpdateExercise} onSwapExercise={handleSwapExercise}
 onRemoveExercise={onRemoveExercise} stats={profile}
 weightUnit={settings?.weightUnit} defaultRestTimer={settings?.defaultRestTimer}
 showRPE={settings?.showRPE !== false} goToSettings={goToSettings}
 autoStartTimer={settings?.autoStartTimer !== false}
 timerVibrate={settings?.timerVibrate !== false}
 weightIncrementUpper={settings?.weightIncrementUpper || 5}
 weightIncrementLower={settings?.weightIncrementLower || 10}
 trainingGoal={settings?.trainingGoal || 'hypertrophy'}
 enableProgressiveOverload={settings?.enableProgressiveOverload !== false}
 restEndTime={restTimers[ex.id] || null}
 onRestTimerChange={(endTime) => onRestTimerChange?.(ex.id, endTime)}
 onPRDetected={handlePRDetected} />
 ))}

 {/* Bonus section */}
 {bonus.length > 0 && (
 <>
 <div style={{ display:'flex', alignItems:'center', gap:'8px', margin:'20px 0 12px' }}>
 <div style={{ height:'1px', flex:1, background:T.border }} />
 <span style={{ fontSize:'11px', color:T.text3, fontWeight:600, textTransform:'uppercase', letterSpacing:'1px' }}>
 Bonus
 </span>
 <div style={{ height:'1px', flex:1, background:T.border }} />
 </div>
 {bonus.map(ex => (
 <ExerciseCard key={ex.id} exercise={ex} onUpdate={onUpdateExercise} onSwapExercise={handleSwapExercise}
 onRemoveExercise={onRemoveExercise} stats={profile}
 weightUnit={settings?.weightUnit} defaultRestTimer={settings?.defaultRestTimer}
 showRPE={settings?.showRPE !== false} goToSettings={goToSettings}
 autoStartTimer={settings?.autoStartTimer !== false}
 timerVibrate={settings?.timerVibrate !== false}
 weightIncrementUpper={settings?.weightIncrementUpper || 5}
 weightIncrementLower={settings?.weightIncrementLower || 10}
 trainingGoal={settings?.trainingGoal || 'hypertrophy'}
 enableProgressiveOverload={settings?.enableProgressiveOverload !== false}
 restEndTime={restTimers[ex.id] || null}
 onRestTimerChange={(endTime) => onRestTimerChange?.(ex.id, endTime)}
 onPRDetected={handlePRDetected} />
 ))}
 </>
 )}

 {/* Completion banner with session feedback */}
 {allMandatoryDone && (
 <SessionFeedbackCard
 allDone={allDone}
 exercises={exercises}
 workout={workout}
 weightUnit={settings?.weightUnit || 'lbs'}
 sessionRPE={workout?.sessionRPE}
 durationMinutes={workout?.durationMinutes}
 onSessionMeta={onSessionMeta}
 sessionPRCount={sessionPRCount}
 />
 )}

 {/* Finish Workout button — shows after at least one set is done */}
 {hasAnyDone && (
 <button onClick={ => setShowSummary(true)} style={{
 width:'100%', padding:'14px', borderRadius:'14px', border:'none', marginTop:'12px',
 background: allDone
 ? `linear-gradient(135deg, ${T.success}, #00C853)`
 : `linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0.04))`,
 color: allDone ? '#07070E' : T.text2, fontSize:'14px', fontWeight:700, cursor:'pointer',
 display:'flex', alignItems:'center', justifyContent:'center', gap:'8px',
 boxShadow: allDone ? '0 8px 24px rgba(0,230,118,0.2)' : 'none',
 transition:'all 0.3s',
 }}>
 <Trophy size={16} />
 {allDone ? 'View Workout Summary' : 'Finish Workout Early'}
 </button>
 )}

 {/* Workout Summary Modal */}
 {showSummary && (
 <WorkoutSummaryModal
 exercises={exercises}
 workout={workout}
 weightUnit={settings?.weightUnit || 'lbs'}
 sessionPRCount={sessionPRCount}
 onClose={ => setShowSummary(false)}
 onSaveNotes={handleSaveSessionNotes}
 />
 )}
 </div>
 );
}

function SessionFeedbackCard({ allDone, exercises, workout, weightUnit = 'lbs', sessionRPE, durationMinutes, onSessionMeta, sessionPRCount = 0 }) {
 const [localRPE, setLocalRPE] = useState(sessionRPE || null);
 const [localDuration, setLocalDuration] = useState(durationMinutes || '');
 const [saved, setSaved] = useState(sessionRPE !== null);
 const rpeLabels = { 1:'Very Easy', 2:'Easy', 3:'Moderate', 4:'Somewhat Hard', 5:'Hard',
 6:'Harder', 7:'Very Hard', 8:'Extremely Hard', 9:'Near Max', 10:'Max Effort' };
 const rpeColor = (v) => v <= 3 ? T.success : v <= 6 ? T.teal : v <= 8 ? T.warn : T.danger;

 // ---- Compute session summary ----
 const summary = useMemo( => {
 if (!exercises) return null;
 let totalVolume = 0, setsCompleted = 0, totalSets = 0, exercisesCompleted = 0;
 const exerciseNames = [];
 const muscleGroups = new Set;
 for (const ex of exercises) {
 const sets = ex.logSets || [];
 totalSets += sets.length;
 const doneSets = sets.filter(s => s.done);
 setsCompleted += doneSets.length;
 if (doneSets.length === sets.length && sets.length > 0) exercisesCompleted++;
 for (const s of doneSets) {
 if (!isWorkingVolume(s)) continue; // warm-up sets excluded from volume
 const w = parseFloat(s.weight) || 0;
 const r = parseInt(s.reps) || 0;
 totalVolume += w * r;
 }
 if (doneSets.length > 0) {
 exerciseNames.push(ex.name);
 if (ex.primaryMuscleGroup) muscleGroups.add(ex.primaryMuscleGroup);
 }
 }
 // Auto-compute duration from startedAt
 const autoMinutes = workout?.startedAt ? Math.round((Date.now - workout.startedAt) / 60000) : null;
 return { totalVolume, setsCompleted, totalSets, exercisesCompleted, totalExercises: exercises.length, autoMinutes, exerciseNames, muscleGroups: [.muscleGroups] };
 }, [exercises, workout?.startedAt]);

 // ---- Compare to last session of same split ----
 const comparison = useMemo( => {
 if (!workout?.splitDay || !summary) return null;
 try {
 const todayStr = today;
 const keys = LS.keys('workout:').sort((a, b) => b.localeCompare(a));
 for (const key of keys) {
 const dateStr = key.replace('workout:', '');
 if (dateStr === todayStr) continue;
 const raw = LS.get(key, null);
 const prev = normalizeWorkout(raw);
 if (!prev || prev.splitDay !== workout.splitDay) continue;
 // Found last session of same split — compute its volume
 const prevExercises = prev.exercises || [];
 let prevVolume = 0, prevSets = 0;
 for (const ex of prevExercises) {
 for (const s of (ex.logSets || []).filter(s => s.done && isWorkingVolume(s))) {
 prevVolume += (parseFloat(s.weight) || 0) * (parseInt(s.reps) || 0);
 prevSets++;
 }
 }
 if (prevVolume === 0 && prevSets === 0) continue;
 const volDelta = summary.totalVolume - prevVolume;
 const volPct = prevVolume > 0 ? Math.round((volDelta / prevVolume) * 100) : 0;
 return { prevVolume, prevSets, volDelta, volPct, date: dateStr };
 }
 } catch(e) {}
 return null;
 }, [workout?.splitDay, summary]);

 // Pre-fill auto duration
 useEffect( => {
 if (summary?.autoMinutes && !localDuration && !durationMinutes) {
 setLocalDuration(String(summary.autoMinutes));
 }
 }, [summary?.autoMinutes]); // eslint-disable-line react-hooks/exhaustive-deps

 const handleSave = => {
 if (onSessionMeta) {
 onSessionMeta({ sessionRPE: localRPE, durationMinutes: localDuration ? Number(localDuration) : null });
 setSaved(true);
 }
 };

 const fmtVol = (v) => v >= 10000 ? `${(v/1000).toFixed(1)}k` : v.toLocaleString;

 return (
 <GlassCard style={{
 background: allDone ? 'rgba(0,230,118,0.08)' : 'rgba(255,107,53,0.08)',
 border: `1px solid ${allDone ? 'rgba(0,230,118,0.15)' : 'rgba(255,107,53,0.15)'}`,
 textAlign: 'center', marginTop: '16px',
 }}>
 <div style={{ fontSize:'24px', marginBottom:'8px' }}>{allDone ? '🎉' : '💪'}</div>
 <h3 style={{ fontSize:'16px', fontWeight:700, marginBottom:'4px' }}>
 {allDone ? 'Workout Complete!' : 'Mandatory Complete!'}
 </h3>
 <p style={{ fontSize:'13px', color:T.text2, marginBottom:'16px' }}>
 {allDone ? (saved ? 'Great work. Rest up and recover.' : 'Here\'s what you did.') : 'Bonus exercises remaining if you have energy.'}
 </p>

 {/* ---- Session Summary Stats ---- */}
 {summary && (summary.setsCompleted > 0) && (
 <div style={{ marginBottom:'16px' }}>
 <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'8px', marginBottom:'12px' }}>
 {[
 { label: 'Volume', value: fmtVol(summary.totalVolume), sub: weightUnit },
 { label: 'Sets', value: `${summary.setsCompleted}/${summary.totalSets}`, sub: 'completed' },
 { label: 'Duration', value: summary.autoMinutes ? `${summary.autoMinutes}` : '—', sub: summary.autoMinutes ? 'min' : '' },
 ].map((stat, i) => (
 <div key={i} style={{
 background:'rgba(255,255,255,0.04)', borderRadius:'10px', padding:'10px 6px',
 border:`1px solid rgba(255,255,255,0.04)`,
 }}>
 <div style={{ fontSize:'18px', fontWeight:700, fontFamily:T.mono, color:T.text, lineHeight:1 }}>
 {stat.value}
 </div>
 <div style={{ fontSize:'9px', color:T.text3, marginTop:'2px', textTransform:'uppercase', letterSpacing:'0.5px' }}>
 {stat.sub && <span style={{ fontWeight:400 }}>{stat.sub} · </span>}{stat.label}
 </div>
 </div>
 ))}
 </div>

 {/* Exercises completed list */}
 <div style={{ fontSize:'12px', color:T.text3, lineHeight:1.6, marginBottom: (comparison || sessionPRCount > 0) ? '12px' : '0' }}>
 {summary.exercisesCompleted}/{summary.totalExercises} exercises: {summary.exerciseNames.slice(0, 4).join(', ')}{summary.exerciseNames.length > 4 ? ` +${summary.exerciseNames.length - 4} more` : ''}
 </div>

 {/* Session PRs */}
 {sessionPRCount > 0 ? (
 <div style={{
 display:'flex', alignItems:'center', justifyContent:'center', gap:'6px',
 padding:'8px 12px', borderRadius:'8px', marginBottom: comparison ? '12px' : '0',
 background: 'rgba(255,215,0,0.06)', border: '1px solid rgba(255,215,0,0.15)',
 }}>
 <Trophy size={14} style={{ color: '#FFD700' }} />
 <span style={{ fontSize:'13px', color:'#FFD700', fontWeight:600 }}>
 {sessionPRCount + ' Personal Record' + (sessionPRCount !== 1 ? 's' : '') + ' today!'}
 </span>
 </div>
 ) : null}

 {/* Comparison to last session */}
 {comparison && comparison.prevVolume > 0 && (
 <div style={{
 display:'flex', alignItems:'center', justifyContent:'center', gap:'6px',
 padding:'8px 12px', borderRadius:'8px',
 background: comparison.volDelta >= 0 ? 'rgba(0,230,118,0.06)' : 'rgba(255,107,53,0.06)',
 border: `1px solid ${comparison.volDelta >= 0 ? 'rgba(0,230,118,0.12)' : 'rgba(255,107,53,0.12)'}`,
 }}>
 <span style={{ fontSize:'13px', color: comparison.volDelta >= 0 ? T.success : T.accent, fontWeight:600 }}>
 {comparison.volDelta >= 0 ? '↑' : '↓'} {Math.abs(comparison.volPct)}% volume
 </span>
 <span style={{ fontSize:'11px', color:T.text3 }}>
 vs last {workout?.splitDay?.replace(/_/g, ' ')} ({fmtVol(comparison.prevVolume)} {weightUnit})
 </span>
 </div>
 )}
 </div>
 )}

 {/* ---- RPE & Duration Input ---- */}
 {!saved && allDone && (
 <div style={{ textAlign:'left', borderTop:`1px solid rgba(255,255,255,0.06)`, paddingTop:'16px' }}>
 <div style={{ marginBottom:'12px' }}>
 <div style={{ fontSize:'11px', fontWeight:600, color:T.text3, textTransform:'uppercase', letterSpacing:'0.3px', marginBottom:'8px' }}>Session RPE</div>
 <div style={{ display:'flex', gap:'4px', flexWrap:'wrap', justifyContent:'center' }}>
 {[1,2,3,4,5,6,7,8,9,10].map(v => (
 <button key={v} onClick={ => setLocalRPE(v)} style={{
 width:'40px', height:'40px', borderRadius:'8px', border:'none', cursor:'pointer',
 fontSize:'13px', fontWeight:700, fontFamily:T.mono, transition:'all 0.15s',
 background: localRPE === v ? rpeColor(v) : 'rgba(255,255,255,0.04)',
 color: localRPE === v ? '#fff' : T.text3,
 transform: localRPE === v ? 'scale(1.1)' : 'scale(1)',
 }}>{v}</button>
 ))}
 </div>
 {localRPE && (
 <div style={{ textAlign:'center', marginTop:'4px', fontSize:'11px', color:rpeColor(localRPE), fontWeight:600 }}>{rpeLabels[localRPE]}</div>
 )}
 </div>
 <div style={{ marginBottom:'16px' }}>
 <div style={{ fontSize:'11px', fontWeight:600, color:T.text3, textTransform:'uppercase', letterSpacing:'0.3px', marginBottom:'6px' }}>
 Duration (minutes){summary?.autoMinutes ? ' · auto-tracked' : ''}
 </div>
 <input type="number" value={localDuration} onChange={e => setLocalDuration(e.target.value)}
 placeholder="e.g. 45" min="1" max="300" aria-label="Workout duration in minutes"
 style={{ width:'100%', padding:'10px 12px', borderRadius:'8px', border:`1px solid ${T.border}`,
 background:'rgba(255,255,255,0.04)', color:T.text, fontSize:'16px', fontFamily:T.mono, outline:'none', textAlign:'center' }} />
 </div>
 <button onClick={handleSave} disabled={!localRPE}
 style={{ width:'100%', padding:'12px', borderRadius:'10px', border:'none',
 background: localRPE ? `linear-gradient(135deg, ${T.accent}, #FF8C42)` : 'rgba(255,255,255,0.06)',
 color: localRPE ? '#fff' : T.text3, fontSize:'14px', fontWeight:600,
 cursor: localRPE ? 'pointer' : 'default' }}>
 {localRPE ? 'Save Session Feedback' : 'Select RPE to save'}
 </button>
 </div>
 )}
 {saved && sessionRPE && (
 <div style={{ borderTop:`1px solid rgba(255,255,255,0.06)`, paddingTop:'10px' }}>
 <div style={{ display:'flex', justifyContent:'center', gap:'16px' }}>
 <span style={{ fontSize:'12px', color:T.text3 }}>RPE: <strong style={{ color:rpeColor(sessionRPE) }}>{sessionRPE}</strong></span>
 {durationMinutes && <span style={{ fontSize:'12px', color:T.text3 }}>Duration: <strong>{durationMinutes} min</strong></span>}
 </div>
 </div>
 )}
 </GlassCard>
 );
}

// ============================================================
// WORKOUT SUMMARY MODAL (Full-screen overlay)
// ============================================================

function WorkoutSummaryModal({ exercises, workout, weightUnit = 'lbs', sessionPRCount = 0, onClose, onSaveNotes }) {
 const dialogRef = useRef(null);
 const [sessionNotes, setSessionNotes] = useState(workout?.sessionNotes || '');

 useEffect( => {
 const el = dialogRef.current;
 if (!el) return;
 const focusable = el.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
 focusable[0]?.focus;
 }, []);

 const summary = useMemo( => {
 if (!exercises) return null;
 let totalVolume = 0, warmupVolume = 0, setsCompleted = 0, totalSets = 0, exercisesCompleted = 0;
 const muscleGroups = new Set;
 const exerciseNames = [];
 for (const ex of exercises) {
 const sets = ex.logSets || [];
 totalSets += sets.length;
 const doneSets = sets.filter(s => s.done);
 setsCompleted += doneSets.length;
 if (doneSets.length === sets.length && sets.length > 0) exercisesCompleted++;
 for (const s of doneSets) {
 const w = parseFloat(s.weight) || 0;
 const r = parseInt(s.reps) || 0;
 const vol = w * r;
 if (isWorkingVolume(s)) totalVolume += vol;
 else warmupVolume += vol;
 }
 if (doneSets.length > 0) {
 exerciseNames.push(ex.name);
 if (ex.primaryMuscleGroup) muscleGroups.add(ex.primaryMuscleGroup);
 for (const sec of (ex.secondaryMuscleGroups || [])) muscleGroups.add(sec);
 }
 }
 const autoMinutes = workout?.startedAt ? Math.round((Date.now - workout.startedAt) / 60000) : null;
 const durationMin = workout?.durationMinutes || autoMinutes;
 return { totalVolume, warmupVolume, setsCompleted, totalSets, exercisesCompleted, totalExercises: exercises.length, muscleGroups: [.muscleGroups], exerciseNames, durationMin };
 }, [exercises, workout]);

 if (!summary) return null;

 const fmtVol = (v) => v >= 10000 ? `${(v/1000).toFixed(1)}k` : v.toLocaleString;

 const muscleColors = {
 chest: T.accent, back: T.teal, shoulders: '#B39DDB', triceps: '#FF8A65',
 biceps: '#4FC3F7', legs: T.success, core: T.warn, glutes: '#F06292',
 forearms: '#A1887F', 'front_delts': '#B39DDB', 'rear_delts': '#B39DDB',
 };

 const handleClose = => {
 if (sessionNotes.trim && onSaveNotes) onSaveNotes(sessionNotes.trim);
 onClose;
 };

 return (
 <div onClick={handleClose} onKeyDown={(e) => { if (e.key === 'Escape') handleClose; }}
 style={{
 position:'fixed', inset:0, zIndex:1100, background:'rgba(0,0,0,0.7)',
 backdropFilter:'blur(12px)', WebkitBackdropFilter:'blur(12px)',
 display:'flex', alignItems:'center', justifyContent:'center', padding:'20px',
 animation:'fadeIn 0.3s ease-out',
 }}>
 <div ref={dialogRef} role="dialog" aria-modal="true" aria-label="Workout Summary"
 onClick={e => e.stopPropagation} style={{
 width:'100%', maxWidth:'400px', maxHeight:'85vh', overflow:'auto',
 borderRadius:'24px', background:`linear-gradient(180deg, rgba(15,15,30,0.98), rgba(7,7,14,0.98))`,
 border:`1px solid ${T.border}`, boxShadow:'0 32px 64px rgba(0,0,0,0.6)',
 padding: '32px 24px',
 }}>

 {/* Header */}
 <div style={{ textAlign:'center', marginBottom:'24px' }}>
 <div style={{ fontSize:'48px', marginBottom:'8px', animation:'pulse 0.6s ease-out' }}>
 {sessionPRCount > 0 ? '🏆' : '🎉'}
 </div>
 <h2 style={{ fontSize:'22px', fontWeight:800, letterSpacing:'-0.02em', marginBottom:'4px',
 background:`linear-gradient(135deg, ${T.accent}, ${T.teal})`,
 WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>
 Workout Complete!
 </h2>
 {workout?.splitDay && (
 <div style={{ fontSize:'13px', color:T.text3, textTransform:'capitalize' }}>
 {workout.splitDay.replace(/_/g, ' ')}
 </div>
 )}
 </div>

 {/* Stats grid */}
 <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px', marginBottom:'20px' }}>
 {[
 { label:'Total Volume', value: fmtVol(summary.totalVolume), sub: weightUnit, big: summary.totalVolume >= 10000 },
 { label:'Duration', value: summary.durationMin ? `${summary.durationMin}` : '—', sub: summary.durationMin ? 'min' : '' },
 { label:'Sets', value: `${summary.setsCompleted}/${summary.totalSets}` },
 { label:'Exercises', value: `${summary.exercisesCompleted}/${summary.totalExercises}` },
 ].map((stat, i) => (
 <div key={i} style={{
 background:'rgba(255,255,255,0.04)', borderRadius:'14px', padding:'14px 12px', textAlign:'center',
 border: stat.big ? `1px solid rgba(255,107,53,0.15)` : `1px solid rgba(255,255,255,0.04)`,
 animation: `fadeUp 0.3s ease-out ${0.1 + i * 0.05}s both`,
 }}>
 <div style={{ fontSize:'24px', fontWeight:800, fontFamily:T.mono, color: stat.big ? T.accent : T.text, lineHeight:1 }}>
 {stat.value}
 </div>
 <div style={{ fontSize:'10px', color:T.text3, marginTop:'4px', textTransform:'uppercase', letterSpacing:'0.5px' }}>
 {stat.sub ? `${stat.sub} · ` : ''}{stat.label}
 </div>
 </div>
 ))}
 </div>

 {/* PRs */}
 {sessionPRCount > 0 && (
 <div style={{
 display:'flex', alignItems:'center', justifyContent:'center', gap:'8px',
 padding:'12px 16px', borderRadius:'12px', marginBottom:'16px',
 background:'rgba(255,215,0,0.08)', border:'1px solid rgba(255,215,0,0.2)',
 animation: 'fadeUp 0.3s ease-out 0.25s both',
 }}>
 <Trophy size={18} style={{ color:'#FFD700' }} />
 <span style={{ fontSize:'15px', color:'#FFD700', fontWeight:700 }}>
 {sessionPRCount} Personal Record{sessionPRCount !== 1 ? 's' : ''}!
 </span>
 </div>
 )}

 {/* Muscle groups */}
 {summary.muscleGroups.length > 0 && (
 <div style={{ marginBottom:'16px', animation:'fadeUp 0.3s ease-out 0.3s both' }}>
 <div style={{ fontSize:'10px', color:T.text3, textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:'8px', fontWeight:600 }}>
 Muscles Hit
 </div>
 <div style={{ display:'flex', flexWrap:'wrap', gap:'6px' }}>
 {summary.muscleGroups.map(mg => (
 <span key={mg} style={{
 padding:'4px 10px', borderRadius:'8px', fontSize:'11px', fontWeight:600,
 background:`${muscleColors[mg] || T.accent}18`,
 color: muscleColors[mg] || T.accent,
 border:`1px solid ${muscleColors[mg] || T.accent}30`,
 textTransform:'capitalize',
 }}>
 {mg.replace(/_/g, ' ')}
 </span>
 ))}
 </div>
 </div>
 )}

 {/* Session RPE */}
 {workout?.sessionRPE && (
 <div style={{ display:'flex', justifyContent:'center', gap:'16px', marginBottom:'16px',
 fontSize:'13px', color:T.text2, animation:'fadeUp 0.3s ease-out 0.35s both' }}>
 <span>Session RPE: <strong style={{ color: workout.sessionRPE <= 5 ? T.success : workout.sessionRPE <= 7 ? T.teal : workout.sessionRPE <= 8 ? T.warn : T.danger }}>{workout.sessionRPE}</strong></span>
 {summary.warmupVolume > 0 && (
 <span>Warm-up: <strong>{fmtVol(summary.warmupVolume)} {weightUnit}</strong></span>
 )}
 </div>
 )}

 {/* Session notes */}
 <div style={{ marginBottom:'20px', animation:'fadeUp 0.3s ease-out 0.4s both' }}>
 <div style={{ fontSize:'10px', color:T.text3, textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:'6px', fontWeight:600 }}>
 How did it feel?
 </div>
 <textarea
 value={sessionNotes} onChange={e => setSessionNotes(e.target.value)}
 placeholder="Optional notes about this workout."
 rows={2} maxLength={500}
 style={{
 width:'100%', padding:'10px 12px', borderRadius:'10px',
 border:`1px solid ${T.border}`, background:'rgba(255,255,255,0.04)',
 color:T.text, fontSize:'14px', fontFamily:T.font, outline:'none',
 resize:'vertical', minHeight:'48px',
 }}
 onFocus={e => e.target.style.borderColor = T.accent}
 onBlur={e => e.target.style.borderColor = T.border}
 />
 </div>

 {/* Close button */}
 <button onClick={handleClose} style={{
 width:'100%', padding:'14px', borderRadius:'14px', border:'none',
 background:`linear-gradient(135deg, ${T.accent}, #FF8C42)`,
 color:'#fff', fontSize:'15px', fontWeight:700, cursor:'pointer',
 boxShadow:`0 8px 24px ${T.accentGlow}`,
 animation:'fadeUp 0.3s ease-out 0.45s both',
 }}>
 Done
 </button>
 </div>
 </div>
 );
}

// ============================================================
// WORKOUT HISTORY DETAIL MODAL
// ============================================================

function WorkoutDetailModal({ date, onClose }) {
 const dialogRef = useRef(null);
 const workoutRaw = LS.get(`workout:${date}`, null);
 const workout = normalizeWorkout(workoutRaw);
 const rehabRaw = LS.get(`rehab:${date}`, null);
 const cardioRaw = LS.get(`cardio:${date}`, null);

 // Focus trap: keep focus inside modal
 useEffect( => {
 const el = dialogRef.current;
 if (!el) return;
 const focusable = el.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
 const first = focusable[0];
 const last = focusable[focusable.length - 1];
 first?.focus;
 const trap = (e) => {
 if (e.key !== 'Tab') return;
 if (e.shiftKey) {
 if (document.activeElement === first) { e.preventDefault; last?.focus; }
 } else {
 if (document.activeElement === last) { e.preventDefault; first?.focus; }
 }
 };
 el.addEventListener('keydown', trap);
 return => el.removeEventListener('keydown', trap);
 }, []);

 const formatted = ( => {
 try {
 const d = new Date(date + 'T12:00:00');
 return d.toLocaleDateString('en-US', { weekday:'short', month:'short', day:'numeric', year:'numeric' });
 } catch { return date; }
 });

 const exercises = workout?.exercises || [];
 const totalVolume = exercises.reduce((sum, ex) => {
 return sum + (ex.logSets || []).filter(s => s.done && isWorkingVolume(s)).reduce((sv, s) => sv + (parseFloat(s.weight) || 0) * (parseInt(s.reps) || 0), 0);
 }, 0);
 const totalSets = exercises.reduce((sum, ex) => sum + (ex.logSets || []).filter(s => s.done).length, 0);
 const totalSetsAll = exercises.reduce((sum, ex) => sum + (ex.logSets || []).length, 0);

 const hasAnyData = workout || rehabRaw || cardioRaw;

 return (
 <div onClick={onClose} onKeyDown={(e) => { if (e.key === 'Escape') onClose; }} style={{
 position:'fixed', inset:0, zIndex:1000, background:'rgba(0,0,0,0.6)',
 backdropFilter:'blur(8px)', WebkitBackdropFilter:'blur(8px)',
 display:'flex', alignItems:'center', justifyContent:'center', padding:'20px',
 animation:'fadeIn 0.2s ease-out',
 }}>
 <div ref={dialogRef} role="dialog" aria-modal="true" aria-label={`Workout details for ${formatted}`} onClick={e => e.stopPropagation} style={{
 width:'100%', maxWidth:'440px', maxHeight:'80vh', overflow:'auto',
 borderRadius:'18px', background:T.bgGlass, border:`1px solid ${T.border}`,
 boxShadow:'0 24px 48px rgba(0,0,0,0.4)',
 }}>
 {/* Header */}
 <div style={{
 display:'flex', justifyContent:'space-between', alignItems:'center',
 padding:'18px 20px 14px', borderBottom:`1px solid ${T.border}`, position:'sticky', top:0,
 background:T.bgGlass, zIndex:1, borderRadius:'18px 18px 0 0',
 }}>
 <div>
 <div style={{ fontSize:'16px', fontWeight:700, color:T.text }}>{formatted}</div>
 {workout?.splitDay && (
 <div style={{ fontSize:'12px', color:T.accent, fontWeight:600, marginTop:'2px', textTransform:'capitalize' }}>
 {workout.splitDay.replace(/_/g, ' ')}
 </div>
 )}
 </div>
 <button onClick={onClose} aria-label="Close workout details" style={{
 background:'rgba(255,255,255,0.06)', border:'none', borderRadius:'10px',
 width:34, height:34, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer',
 }}>
 <X size={16} color={T.text2} />
 </button>
 </div>

 <div style={{ padding:'16px 20px 20px' }}>
 {!hasAnyData && (
 <div style={{ textAlign:'center', padding:'32px 16px', color:T.text3, fontSize:'13px' }}>
 No data recorded for this date.
 </div>
 )}

 {/* Session meta */}
 {workout && (
 <div style={{ display:'flex', gap:'10px', marginBottom:'16px', flexWrap:'wrap' }}>
 {workout.sessionRPE && (
 <div style={{ padding:'6px 12px', borderRadius:'8px', background:'rgba(255,107,53,0.1)', fontSize:'12px', fontWeight:600 }}>
 RPE {workout.sessionRPE}
 </div>
 )}
 {workout.durationMinutes && (
 <div style={{ padding:'6px 12px', borderRadius:'8px', background:'rgba(78,205,196,0.1)', fontSize:'12px', fontWeight:600, color:T.teal }}>
 <Clock size={12} style={{ verticalAlign:'middle', marginRight:'4px' }} />
 {workout.durationMinutes} min
 </div>
 )}
 <div style={{ padding:'6px 12px', borderRadius:'8px', background:'rgba(255,255,255,0.04)', fontSize:'12px', fontWeight:600, color:T.text2 }}>
 {totalSets}/{totalSetsAll} sets
 </div>
 {totalVolume > 0 && (
 <div style={{ padding:'6px 12px', borderRadius:'8px', background:'rgba(255,255,255,0.04)', fontSize:'12px', fontWeight:600, color:T.text2, fontFamily:T.mono }}>
 {totalVolume.toLocaleString} vol
 </div>
 )}
 </div>
 )}

 {/* Exercises */}
 {exercises.map((ex, i) => {
 const doneSets = (ex.logSets || []).filter(s => s.done);
 if ((ex.logSets || []).length === 0) return null;
 return (
 <div key={i} style={{
 marginBottom:'12px', padding:'12px', borderRadius:'12px',
 background:'rgba(255,255,255,0.03)', border:`1px solid ${T.border}`,
 }}>
 <div style={{ fontSize:'13px', fontWeight:600, marginBottom:'8px', color:T.text }}>
 {ex.name || ex.id}
 </div>
 <div style={{ display:'grid', gridTemplateColumns:'auto 1fr 1fr 1fr', gap:'4px 12px', fontSize:'11px' }}>
 <div style={{ color:T.text3, fontWeight:600 }}>Set</div>
 <div style={{ color:T.text3, fontWeight:600 }}>Weight</div>
 <div style={{ color:T.text3, fontWeight:600 }}>Reps</div>
 <div style={{ color:T.text3, fontWeight:600 }}>RPE</div>
 {(ex.logSets || []).map((s, j) => (
 <React.Fragment key={j}>
 <div style={{ color: s.done ? T.text : T.text3, fontFamily:T.mono, display:'flex', alignItems:'center', gap:'3px' }}>
 {s.setType && s.setType !== 'working' && (
 <span style={{
 fontSize:'8px', fontWeight:800, padding:'1px 3px', borderRadius:'3px',
 background: s.setType === 'warmup' ? 'rgba(255,255,255,0.08)' : s.setType === 'drop' ? T.accentSoft : s.setType === 'failure' ? 'rgba(255,82,82,0.12)' : T.tealGlow,
 color: s.setType === 'warmup' ? T.text3 : s.setType === 'drop' ? T.accent : s.setType === 'failure' ? T.danger : T.teal,
 }}>{s.setType === 'warmup' ? 'W' : s.setType === 'drop' ? 'D' : s.setType === 'failure' ? 'F' : 'A'}</span>
 )}
 {j+1}
 </div>
 <div style={{ color: s.done ? T.text : T.text3, fontFamily:T.mono, opacity: s.done ? 1 : 0.4 }}>
 {s.weight || '—'}
 </div>
 <div style={{ color: s.done ? T.text : T.text3, fontFamily:T.mono, opacity: s.done ? 1 : 0.4 }}>
 {s.reps || '—'}
 </div>
 <div style={{ color: s.done ? T.text : T.text3, fontFamily:T.mono, opacity: s.done ? 1 : 0.4 }}>
 {s.rpe || '—'}
 </div>
 </React.Fragment>
 ))}
 </div>
 {doneSets.length > 0 && (
 <div style={{ fontSize:'10px', color:T.text3, marginTop:'6px', fontFamily:T.mono }}>
 Vol: {doneSets.filter(s => isWorkingVolume(s)).reduce((v,s) => v + (parseFloat(s.weight)||0)*(parseInt(s.reps)||0), 0).toLocaleString}
 {doneSets.some(s => s.setType === 'warmup') && <span style={{ opacity:0.5 }}> (excl. warm-up)</span>}
 </div>
 )}
 </div>
 );
 })}

 {/* Rehab data */}
 {rehabRaw && (
 <div style={{ marginTop:'12px', padding:'12px', borderRadius:'12px', background:'rgba(78,205,196,0.06)', border:`1px solid rgba(78,205,196,0.15)` }}>
 <div style={{ fontSize:'12px', fontWeight:600, color:T.teal, marginBottom:'6px', display:'flex', alignItems:'center', gap:'6px' }}>
 <Heart size={14} /> Rehab
 </div>
 <div style={{ fontSize:'12px', color:T.text2 }}>
 {typeof rehabRaw === 'object' ? (
 Object.entries(rehabRaw).filter(([,v]) => v).map(([k]) => (
 <span key={k} style={{ display:'inline-block', padding:'3px 8px', borderRadius:'6px', background:'rgba(78,205,196,0.1)', marginRight:'6px', marginBottom:'4px', fontSize:'11px' }}>
 {k.replace(/_/g, ' ')}
 </span>
 ))
 ) : 'Completed'}
 </div>
 </div>
 )}

 {/* Cardio data */}
 {cardioRaw && (
 <div style={{ marginTop:'12px', padding:'12px', borderRadius:'12px', background:'rgba(255,107,53,0.06)', border:`1px solid rgba(255,107,53,0.15)` }}>
 <div style={{ fontSize:'12px', fontWeight:600, color:T.accent, marginBottom:'6px', display:'flex', alignItems:'center', gap:'6px' }}>
 <Activity size={14} /> Cardio
 </div>
 <div style={{ fontSize:'12px', color:T.text2 }}>
 {typeof cardioRaw === 'object' ? (
 <>
 {cardioRaw.type && <span style={{ textTransform:'capitalize' }}>{cardioRaw.type}</span>}
 {cardioRaw.duration && <span> — {cardioRaw.duration} min</span>}
 {cardioRaw.distance && <span> — {cardioRaw.distance} mi</span>}
 </>
 ) : 'Completed'}
 </div>
 </div>
 )}
 </div>
 </div>
 </div>
 );
}

// ============================================================
// TAB: REHAB
// ============================================================

function RehabTab({ rehabStatus, onToggle }) {
 const completed = DAILY_REHAB.filter(r => rehabStatus[r.id]).length;
 const total = DAILY_REHAB.length;
 const allDone = completed === total;

 return (
 <div style={{ animation:'fadeIn 0.3s ease-out' }}>
 <div style={{ marginBottom:'20px' }}>
 <h2 style={{ fontSize:'20px', fontWeight:700, letterSpacing:'-0.02em' }}>Daily Rehab Protocol</h2>
 <p style={{ fontSize:'13px', color:T.text2, marginTop:'4px' }}>
 Do these every day. Consistency is the medicine.
 </p>
 <p style={{ fontSize:'11px', color:T.text3, marginTop:'4px', fontStyle:'italic' }}>
 These are separate from the rehab exercises in your workout. This checklist covers daily mobility and corrective work.
 </p>
 </div>

 {/* Progress ring */}
 <GlassCard animate={false} style={{ display:'flex', alignItems:'center', gap:'16px', marginBottom:'16px' }}>
 <div style={{ position:'relative', width:52, height:52 }}>
 <CircularTimer duration={total} timeLeft={total-completed} size={52} strokeWidth={4} />
 <span style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center',
 fontSize:'14px', fontWeight:700, color: allDone ? T.success : T.text }}>
 {completed}/{total}
 </span>
 </div>
 <div>
 <div style={{ fontSize:'14px', fontWeight:600, color: allDone ? T.success : T.text }}>
 {allDone ? 'All done! ✓' : `${total - completed} remaining`}
 </div>
 <div style={{ fontSize:'12px', color:T.text3 }}>+{XP_REWARDS.rehab} XP when complete</div>
 </div>
 </GlassCard>

 {DAILY_REHAB.map((item, i) => {
 const done = rehabStatus[item.id];
 return (
 <div key={item.id} onClick={ => onToggle(item.id)}
 role="checkbox" aria-checked={done} tabIndex={0}
 aria-label={`${item.name}: ${done ? 'completed' : 'not completed'}`}
 onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault; onToggle(item.id); } }}
 style={{
 background: done ? T.successSoft : T.bgCard, border: `1px solid ${done ? 'rgba(0,230,118,0.15)' : T.border}`,
 borderRadius: T.radius, padding:'16px', marginBottom:'10px', cursor:'pointer',
 display:'flex', alignItems:'center', gap:'14px', transition:'all 0.2s',
 animation: `fadeUp 0.3s ease-out ${i * 0.06}s both`,
 }}>
 <div style={{
 width:28, height:28, borderRadius:'50%',
 border:`2px solid ${done ? T.success : T.text3}`,
 background: done ? T.success : 'transparent',
 display:'flex', alignItems:'center', justifyContent:'center',
 transition:'all 0.2s', flexShrink:0,
 }}>
 {done && <Check size={14} color="#07070E" strokeWidth={3} />}
 </div>
 <div style={{ flex:1 }}>
 <div style={{ fontSize:'14px', fontWeight:600, color: done ? T.success : T.text }}>{item.name}</div>
 <div style={{ fontSize:'12px', color:T.text3, marginTop:'2px' }}>{item.detail}</div>
 </div>
 </div>
 );
 })}
 </div>
 );
}

// ============================================================
// TAB: CARDIO
// ============================================================

function CardioTab({ cardioLog, onLogCardio, settings, goToSettings }) {
 const [duration, setDuration] = useState(30);
 const [hr, setHr] = useState('');
 const hrMin = settings?.zone2HRMin || 120;
 const hrMax = settings?.zone2HRMax || 145;
 const weeklyTarget = settings?.cardioWeeklyTarget || 5;
 const weekLogs = cardioLog.filter(l => {
 const d = new Date(l.date);
 const now = new Date;
 const diff = (now - d) / (1000*60*60*24);
 return diff < 7;
 });

 return (
 <div style={{ animation:'fadeIn 0.3s ease-out' }}>
 <div style={{ marginBottom:'20px' }}>
 <h2 style={{ fontSize:'20px', fontWeight:700 }}>Cardio</h2>
 <p style={{ fontSize:'13px', color:T.text2, marginTop:'4px' }}>
 Zone 2 · <button onClick={ => goToSettings?.('recovery')} style={{ background:'none', border:'none',
 color:T.text2, cursor:'pointer', fontSize:'13px', padding:0, textDecoration:'underline',
 textDecorationStyle:'dotted', textUnderlineOffset:'3px' }}>{hrMin}-{hrMax} bpm</button> · <button
 onClick={ => goToSettings?.('recovery')} style={{ background:'none', border:'none', color:T.text2,
 cursor:'pointer', fontSize:'13px', padding:0, textDecoration:'underline', textDecorationStyle:'dotted',
 textUnderlineOffset:'3px' }}>{weeklyTarget}×/week</button> 
 </p>
 </div>

 {/* Weekly progress */}
 <GlassCard animate={false} style={{ marginBottom:'16px', textAlign:'center' }}>
 <div style={{ fontSize:'12px', color:T.text3, marginBottom:'8px', textTransform:'uppercase', letterSpacing:'0.5px' }}>
 This Week
 </div>
 <div style={{ display:'flex', justifyContent:'center', gap:'8px', marginBottom:'8px' }}>
 {Array.from({length: weeklyTarget}, (_, i) => (
 <div key={i} style={{
 width:32, height:32, borderRadius:'50%',
 background: i < weekLogs.length ? T.teal : 'rgba(255,255,255,0.04)',
 border: `2px solid ${i < weekLogs.length ? T.teal : T.border}`,
 display:'flex', alignItems:'center', justifyContent:'center',
 fontSize:'12px', fontWeight:600, color: i < weekLogs.length ? '#07070E' : T.text3,
 transition:'all 0.3s',
 }}>
 {i < weekLogs.length ? '✓' : i+1}
 </div>
 ))}
 </div>
 <div style={{ fontSize:'13px', color: weekLogs.length >= weeklyTarget ? T.success : T.text2 }}>
 {weekLogs.length}/{weeklyTarget} sessions
 </div>
 </GlassCard>

 {/* Duration / HR inputs */}
 <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px', marginBottom:'16px' }}>
 <GlassCard animate={false} style={{ padding:'12px' }}>
 <div style={{ fontSize:'10px', color:T.text3, textTransform:'uppercase', marginBottom:'6px' }}>Duration</div>
 <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
 <button onClick={ => setDuration(d => Math.max(10, d-5))} aria-label="Decrease duration by 5 minutes" style={{ background:'none', border:'none', color:T.text2, cursor:'pointer', padding:'10px', minWidth:'44px', minHeight:'44px', display:'flex', alignItems:'center', justifyContent:'center' }}><Minus size={18} /></button>
 <span style={{ fontSize:'20px', fontWeight:700, fontFamily:T.mono, flex:1, textAlign:'center' }} aria-live="polite">{duration}</span>
 <button onClick={ => setDuration(d => Math.min(90, d+5))} aria-label="Increase duration by 5 minutes" style={{ background:'none', border:'none', color:T.text2, cursor:'pointer', padding:'10px', minWidth:'44px', minHeight:'44px', display:'flex', alignItems:'center', justifyContent:'center' }}><Plus size={18} /></button>
 </div>
 <div style={{ fontSize:'10px', color:T.text3, textAlign:'center' }}>minutes</div>
 </GlassCard>
 <GlassCard animate={false} style={{ padding:'12px' }}>
 <div style={{ fontSize:'10px', color:T.text3, textTransform:'uppercase', marginBottom:'6px' }}>Avg HR</div>
 <input type="number" inputMode="numeric" placeholder="bpm" value={hr}
 onChange={e => setHr(e.target.value)} aria-label="Average heart rate (BPM)"
 style={{ width:'100%', background:'transparent', border:'none', textAlign:'center',
 fontSize:'20px', fontWeight:700, fontFamily:T.mono, color:T.text, outline:'none' }} />
 <div style={{ fontSize:'10px', color:T.text3, textAlign:'center' }}>
 {hr && hr >= hrMin && hr <= hrMax ? '✓ Zone 2' : hr ? '⚠ Check zone' : 'bpm'}
 </div>
 </GlassCard>
 </div>

 {/* Cardio options */}
 <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px' }}>
 {CARDIO_OPTIONS.map((c, i) => (
 <button key={c.id} onClick={ => onLogCardio(c, duration, hr)}
 style={{
 background: T.bgCard, border:`1px solid ${T.border}`, borderRadius:T.radius,
 padding:'16px 12px', textAlign:'left', cursor:'pointer', transition:'all 0.2s',
 animation: `fadeUp 0.3s ease-out ${i * 0.06}s both`,
 }}
 onMouseDown={e => e.currentTarget.style.transform='scale(0.97)'}
 onMouseUp={e => e.currentTarget.style.transform='scale(1)'}
 onMouseLeave={e => e.currentTarget.style.transform='scale(1)'}
 >
 <div style={{ fontSize:'20px', marginBottom:'6px' }}>{c.icon}</div>
 <div style={{ fontSize:'13px', fontWeight:600, color:T.text, marginBottom:'2px' }}>{c.name}</div>
 <div style={{ fontSize:'11px', color:T.text3 }}>{c.settings}</div>
 </button>
 ))}
 </div>
 </div>
 );
}

// ============================================================
// TAB: PROGRESS
// ============================================================

// ============================================================
// VOLUME TRACKER COMPONENT
// ============================================================

function VolumeTracker({ history, settings }) {
 const [expandedMuscle, setExpandedMuscle] = useState(null);

 // Compute weekly completed sets per primaryMuscleGroup
 const weeklyVolume = useMemo( => {
 const volume = {};
 const now = new Date;
 const firstDay = settings?.firstDayOfWeek ?? 0;
 const weekStart = new Date(now);
 const currentDay = weekStart.getDay;
 const daysBack = (currentDay - firstDay + 7) % 7;
 weekStart.setDate(weekStart.getDate - daysBack);
 weekStart.setHours(0, 0, 0, 0);

 const keys = LS.keys('workout:');
 for (const key of keys) {
 const dateStr = key.replace('workout:', '');
 const date = new Date(dateStr);
 if (date < weekStart) continue;

 const raw = LS.get(key, null);
 const exercises = getWorkoutExercises(raw);
 for (const ex of exercises) {
 const doneSets = (ex.logSets || []).filter(s => s.done && isWorkingVolume(s));
 if (doneSets.length === 0) continue;

 const muscle = ex.primaryMuscleGroup || ex.category;
 if (!volume[muscle]) volume[muscle] = { total: 0, byPattern: {} };
 volume[muscle].total += doneSets.length;

 if (ex.movementPattern) {
 if (!volume[muscle].byPattern[ex.movementPattern]) volume[muscle].byPattern[ex.movementPattern] = 0;
 volume[muscle].byPattern[ex.movementPattern] += doneSets.length;
 }
 }
 }
 return volume;
 }, [history, settings]);

 const muscleGroups = Object.keys(VOLUME_LANDMARKS).filter(m => m !== 'shoulders'); // front delts usually covered by pressing

 const getZoneColor = (sets, landmark) => {
 if (sets <= 0) return T.text3;
 if (sets < landmark.mv) return T.text3; // Below MV
 if (sets < landmark.mev) return T.warn; // MV-MEV (maintaining)
 if (sets <= landmark.mavHigh) return T.success; // MEV-MAV (optimal)
 if (sets <= landmark.mrv) return T.accent; // MAV-MRV (high volume)
 return T.danger; // Above MRV
 };

 const getZoneLabel = (sets, landmark) => {
 if (sets <= 0) return 'None';
 if (sets < landmark.mv) return 'Below MV';
 if (sets < landmark.mev) return 'Maintaining';
 if (sets <= landmark.mavHigh) return 'Optimal';
 if (sets <= landmark.mrv) return 'High';
 return 'Over MRV';
 };

 return (
 <div style={{ marginBottom: '20px' }}>
 <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
 <Target size={16} color={T.teal} /> Weekly Volume
 </h3>
 <GlassCard animate={false} style={{ padding: '12px' }}>
 {/* Legend */}
 <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginBottom: '12px', fontSize: '9px', color: T.text3 }}>
 <span>● Below MV</span>
 <span style={{ color: T.warn }}>● Maintaining</span>
 <span style={{ color: T.success }}>● Optimal</span>
 <span style={{ color: T.accent }}>● High</span>
 <span style={{ color: T.danger }}>● Over MRV</span>
 </div>

 {muscleGroups.map(muscle => {
 const landmark = getAdjustedLandmarks(muscle, settings?.experienceLevel || 'intermediate');
 if (!landmark) return null;
 const vol = weeklyVolume[muscle] || { total: 0, byPattern: {} };
 const sets = vol.total;
 const maxBar = landmark.mrv + 4;
 const barPct = Math.min((sets / maxBar) * 100, 100);
 const mevPct = (landmark.mev / maxBar) * 100;
 const mavHighPct = (landmark.mavHigh / maxBar) * 100;
 const mrvPct = (landmark.mrv / maxBar) * 100;
 const color = getZoneColor(sets, landmark);
 const hasSubgroups = landmark.subgroups && Object.keys(vol.byPattern).length > 0;
 const isExpanded = expandedMuscle === muscle;

 return (
 <div key={muscle} style={{ marginBottom: '6px' }}>
 <div
 onClick={ => hasSubgroups && setExpandedMuscle(isExpanded ? null : muscle)}
 style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: hasSubgroups ? 'pointer' : 'default', padding: '4px 0' }}
 >
 <div style={{ width: '72px', fontSize: '11px', fontWeight: 600, color: T.text2, textTransform: 'capitalize', flexShrink: 0 }}>
 {muscle.replace(/_/g, ' ')}
 {hasSubgroups && <ChevronRight size={10} style={{ marginLeft: 2, transform: isExpanded ? 'rotate(90deg)' : 'none', transition: '0.2s' }} />}
 </div>
 <div style={{ flex: 1, height: '14px', background: 'rgba(255,255,255,0.04)', borderRadius: '7px', overflow: 'hidden', position: 'relative' }}>
 {/* Zone markers */}
 <div style={{ position: 'absolute', left: `${mevPct}%`, top: 0, bottom: 0, width: '1px', background: 'rgba(255,255,255,0.1)' }} />
 <div style={{ position: 'absolute', left: `${mavHighPct}%`, top: 0, bottom: 0, width: '1px', background: 'rgba(255,255,255,0.1)' }} />
 <div style={{ position: 'absolute', left: `${mrvPct}%`, top: 0, bottom: 0, width: '1px', background: 'rgba(255,82,82,0.2)' }} />
 {/* Filled bar */}
 <div style={{
 height: '100%', width: `${barPct}%`, borderRadius: '7px',
 background: color, opacity: 0.7, transition: 'width 0.4s ease-out',
 }} />
 </div>
 <div style={{ width: '40px', fontSize: '11px', fontFamily: T.mono, color, textAlign: 'right', fontWeight: 600 }}>
 {sets}
 </div>
 </div>
 {/* Subgroup breakdown */}
 {isExpanded && landmark.subgroups && (
 <div style={{ paddingLeft: '80px', animation: 'fadeUp 0.2s ease-out' }}>
 {Object.entries(landmark.subgroups).map(([pattern, info]) => {
 const subSets = vol.byPattern[pattern] || 0;
 const targetSets = info.targetPct ? Math.round(sets * info.targetPct) : (info.fixed || 0);
 return (
 <div key={pattern} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '2px 0' }}>
 <span style={{ width: '90px', fontSize: '10px', color: T.text3, textTransform: 'capitalize' }}>
 {pattern.replace(/_/g, ' ')}
 </span>
 <div style={{ flex: 1, height: '6px', background: 'rgba(255,255,255,0.03)', borderRadius: '3px', overflow: 'hidden' }}>
 <div style={{ height: '100%', width: `${targetSets > 0 ? Math.min((subSets / targetSets) * 100, 150) : 0}%`,
 background: T.teal, opacity: 0.6, borderRadius: '3px' }} />
 </div>
 <span style={{ fontSize: '10px', fontFamily: T.mono, color: T.text3, width: '24px', textAlign: 'right' }}>{subSets}</span>
 </div>
 );
 })}
 </div>
 )}
 </div>
 );
 })}
 </GlassCard>
 </div>
 );
}

// ============================================================
// PER-EXERCISE STRENGTH PROGRESS CHART
// ============================================================

function ExerciseProgressChart({ settings }) {
 const [selectedExId, setSelectedExId] = useState(null);
 const [hoverIdx, setHoverIdx] = useState(null);
 const wUnit = settings?.weightUnit || 'lbs';

 // Build a list of exercises the user has history for, sorted by most recently trained
 const exerciseList = useMemo( => {
 const exMap = {};
 const keys = LS.keys('workout:').sort((a, b) => b.localeCompare(a));
 for (const key of keys) {
 const raw = LS.get(key, null);
 const exercises = getWorkoutExercises(raw);
 const dateStr = key.replace('workout:', '');
 for (const ex of exercises) {
 const doneSets = (ex.logSets || []).filter(s => s.done && (s.weight || s.reps));
 if (doneSets.length === 0) continue;
 if (!exMap[ex.id]) {
 exMap[ex.id] = { id: ex.id, name: ex.name || ex.id, sessions: 0, lastDate: dateStr };
 }
 exMap[ex.id].sessions++;
 }
 }
 return Object.values(exMap).sort((a, b) => b.lastDate.localeCompare(a.lastDate));
 }, []);

 // Get data for the selected exercise
 const chartData = useMemo( => {
 if (!selectedExId) return [];
 const history = getExerciseHistory(selectedExId, 20);
 if (!history || history.length === 0) return [];
 return history.map(session => {
 const sets = session.sets || [];
 let maxWeight = 0, bestE1RM = 0, totalVolume = 0, maxReps = 0;
 for (const s of sets) {
 const w = parseFloat(s.weight) || 0;
 const r = parseInt(s.reps) || 0;
 if (w > maxWeight) maxWeight = w;
 if (r > maxReps) maxReps = r;
 totalVolume += w * r;
 const e = estimate1RM(w, r);
 if (e > bestE1RM) bestE1RM = Math.round(e);
 }
 return { date: session.date, maxWeight, bestE1RM, totalVolume, maxReps, sets: sets.length };
 }).reverse; // Chronological order
 }, [selectedExId]);

 // All-time stats
 const stats = useMemo( => {
 if (chartData.length === 0) return null;
 return {
 bestWeight: Math.max(.chartData.map(d => d.maxWeight)),
 bestE1RM: Math.max(.chartData.map(d => d.bestE1RM)),
 bestVolume: Math.max(.chartData.map(d => d.totalVolume)),
 totalSessions: chartData.length,
 firstDate: chartData[0]?.date,
 lastDate: chartData[chartData.length - 1]?.date,
 };
 }, [chartData]);

 if (exerciseList.length === 0) return null;

 // Auto-select first exercise if none selected
 const activeExId = selectedExId || exerciseList[0]?.id;
 const activeData = selectedExId ? chartData : [];

 // Chart rendering
 const W = 420, H = 200, PAD = { top: 16, right: 14, bottom: 32, left: 44 };
 const cW = W - PAD.left - PAD.right;
 const cH = H - PAD.top - PAD.bottom;

 const data = activeData;
 const hasData = data.length >= 1;

 // Scales
 const weights = data.map(d => d.maxWeight);
 const e1rms = data.map(d => d.bestE1RM);
 const volumes = data.map(d => d.totalVolume);
 const allYVals = [.weights,.e1rms].filter(v => v > 0);
 const minY = allYVals.length > 0 ? Math.floor(Math.min(.allYVals) * 0.9) : 0;
 const maxY = allYVals.length > 0 ? Math.ceil(Math.max(.allYVals) * 1.05) : 100;
 const yRange = maxY - minY || 1;
 const maxVol = Math.max(.volumes, 1);

 const xPos = (i) => PAD.left + (data.length > 1 ? (i / (data.length - 1)) * cW : cW / 2);
 const yPos = (v) => PAD.top + (1 - (v - minY) / yRange) * cH;
 const volH = (v) => (v / maxVol) * cH * 0.5; // Volume bars — half height

 // Line paths
 const weightPath = data.length > 1
 ? data.map((d, i) => `${i === 0 ? 'M' : 'L'}${xPos(i).toFixed(1)},${yPos(d.maxWeight).toFixed(1)}`).join(' ')
 : '';
 const e1rmPath = data.length > 1
 ? data.filter(d => d.bestE1RM > 0).map((d, i) => {
 const idx = data.indexOf(d);
 return `${i === 0 ? 'M' : 'L'}${xPos(idx).toFixed(1)},${yPos(d.bestE1RM).toFixed(1)}`;
 }).join(' ')
 : '';

 // Y-axis labels
 const ySteps = 4;
 const yLabels = Array.from({ length: ySteps + 1 }, (_, i) => {
 const v = minY + (yRange * i) / ySteps;
 return { v: Math.round(v), py: yPos(v) };
 });

 // X-axis labels
 const xLabelStep = Math.max(1, Math.floor((data.length - 1) / Math.max(4, 1)));

 return (
 <div style={{ marginBottom:'20px' }}>
 <h3 style={{ fontSize:'15px', fontWeight:600, marginBottom:'12px' }}>Exercise Progress</h3>
 <GlassCard animate={false} style={{ padding:'16px' }}>
 {/* Exercise selector */}
 <div style={{ marginBottom:'14px' }}>
 <select
 value={activeExId || ''}
 onChange={e => setSelectedExId(e.target.value)}
 aria-label="Select exercise to view progress"
 style={{
 width:'100%', padding:'10px 12px', borderRadius:'10px',
 border:`1px solid ${T.border}`, background:'rgba(255,255,255,0.04)',
 color:T.text, fontSize:'14px', fontFamily:T.font, outline:'none',
 cursor:'pointer', appearance:'none',
 backgroundImage:`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='rgba(255,255,255,0.5)' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
 backgroundRepeat:'no-repeat', backgroundPosition:'right 12px center',
 }}>
 {exerciseList.map(ex => (
 <option key={ex.id} value={ex.id} style={{ background:T.bg, color:T.text }}>
 {ex.name} ({ex.sessions} session{ex.sessions !== 1 ? 's' : ''})
 </option>
 ))}
 </select>
 </div>

 {!hasData && (
 <div style={{ textAlign:'center', padding:'24px 16px', color:T.text3, fontSize:'13px' }}>
 {selectedExId ? 'Select an exercise above to see progress' : 'Select an exercise to view strength trends'}
 </div>
 )}

 {hasData && data.length === 1 && (
 <div style={{ textAlign:'center', padding:'16px', color:T.text3, fontSize:'13px' }}>
 <Dumbbell size={20} style={{ marginBottom:'8px', opacity:0.5 }} />
 <div>1 session logged. Train again to see trends.</div>
 <div style={{ marginTop:'8px', fontSize:'12px', fontFamily:T.mono }}>
 Max: {data[0].maxWeight} {wUnit} · e1RM: {data[0].bestE1RM} {wUnit} · Vol: {data[0].totalVolume.toLocaleString}
 </div>
 </div>
 )}

 {hasData && data.length >= 2 && (
 <>
 {/* Legend */}
 <div style={{ display:'flex', gap:'12px', marginBottom:'8px', fontSize:'10px', flexWrap:'wrap' }}>
 <span style={{ display:'flex', alignItems:'center', gap:'4px' }}>
 <span style={{ width:12, height:3, borderRadius:2, background:T.accent, display:'inline-block' }} />
 <span style={{ color:T.text3 }}>Top Weight</span>
 </span>
 <span style={{ display:'flex', alignItems:'center', gap:'4px' }}>
 <span style={{ width:12, height:3, borderRadius:2, background:T.teal, display:'inline-block' }} />
 <span style={{ color:T.text3 }}>Est. 1RM</span>
 </span>
 <span style={{ display:'flex', alignItems:'center', gap:'4px' }}>
 <span style={{ width:12, height:8, borderRadius:2, background:'rgba(255,255,255,0.08)', display:'inline-block' }} />
 <span style={{ color:T.text3 }}>Volume</span>
 </span>
 </div>

 {/* SVG Chart */}
 <svg className="chart-svg" viewBox={`0 0 ${W} ${H}`} style={{ width:'100%', height:'auto', display:'block' }}
 role="img" aria-label={`Strength progress chart for selected exercise`}
 onMouseLeave={ => setHoverIdx(null)} onTouchEnd={ => setHoverIdx(null)}>

 <defs>
 <linearGradient id="exWeightGrad" x1="0" y1="0" x2="0" y2="1">
 <stop offset="0%" stopColor={T.accent} stopOpacity="0.12" />
 <stop offset="100%" stopColor={T.accent} stopOpacity="0" />
 </linearGradient>
 </defs>

 {/* Grid lines */}
 {yLabels.map((l, i) => (
 <g key={i}>
 <line x1={PAD.left} y1={l.py} x2={W - PAD.right} y2={l.py}
 stroke={T.border} strokeWidth="0.5" />
 <text x={PAD.left - 6} y={l.py + 3.5} fill={T.text3}
 fontSize="9" fontFamily={T.mono} textAnchor="end">{l.v}</text>
 </g>
 ))}

 {/* Volume bars */}
 {data.map((d, i) => {
 const barW = Math.max(6, (cW / data.length) * 0.5);
 const barH = volH(d.totalVolume);
 return (
 <rect key={`vol-${i}`}
 x={xPos(i) - barW / 2} y={PAD.top + cH - barH}
 width={barW} height={barH}
 fill="rgba(255,255,255,0.06)" rx="2"
 onMouseEnter={ => setHoverIdx(i)}
 onTouchStart={ => setHoverIdx(i)}
 style={{ cursor:'pointer' }}
 />
 );
 })}

 {/* Weight line + area */}
 {weightPath && (
 <>
 <path d={weightPath + ` L${xPos(data.length - 1).toFixed(1)},${(PAD.top + cH).toFixed(1)} L${PAD.left},${(PAD.top + cH).toFixed(1)} Z`}
 fill="url(#exWeightGrad)" />
 <path d={weightPath} fill="none" stroke={T.accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
 </>
 )}

 {/* e1RM line */}
 {e1rmPath && (
 <path d={e1rmPath} fill="none" stroke={T.teal} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
 strokeDasharray="6,3" />
 )}

 {/* Data points */}
 {data.map((d, i) => (
 <g key={`dots-${i}`}>
 <circle cx={xPos(i)} cy={yPos(d.maxWeight)} r="3.5"
 fill={T.accent} stroke={T.bg} strokeWidth="1"
 onMouseEnter={ => setHoverIdx(i)}
 onTouchStart={ => setHoverIdx(i)}
 style={{ cursor:'pointer' }} />
 {d.bestE1RM > 0 && (
 <circle cx={xPos(i)} cy={yPos(d.bestE1RM)} r="3"
 fill={T.teal} stroke={T.bg} strokeWidth="1"
 onMouseEnter={ => setHoverIdx(i)}
 onTouchStart={ => setHoverIdx(i)}
 style={{ cursor:'pointer' }} />
 )}
 </g>
 ))}

 {/* X-axis labels */}
 {data.filter((_, i) => i % xLabelStep === 0 || i === data.length - 1).map((d) => {
 const i = data.indexOf(d);
 const parts = d.date.split('-');
 const label = parts.length >= 3
 ? new Date(d.date + 'T12:00:00').toLocaleDateString('en-US', { month:'short', day:'numeric' })
 : d.date.slice(5);
 return (
 <text key={d.date} x={xPos(i)} y={H - 4} fill={T.text3}
 fontSize="8" fontFamily={T.mono} textAnchor="middle">{label}</text>
 );
 })}

 {/* Hover tooltip */}
 {hoverIdx !== null && data[hoverIdx] && ( => {
 const d = data[hoverIdx];
 const tx = Math.max(60, Math.min(xPos(hoverIdx), W - 60));
 return (
 <g>
 <line x1={xPos(hoverIdx)} y1={PAD.top} x2={xPos(hoverIdx)} y2={PAD.top + cH}
 stroke={T.text2} strokeWidth="0.5" strokeDasharray="3,2" />
 <rect x={tx - 56} y={PAD.top - 4} width="112" height="44" rx="6"
 fill={T.bgGlass} stroke={T.border} strokeWidth="0.5" />
 <text x={tx} y={PAD.top + 8} fill={T.text} fontSize="9" fontFamily={T.mono} textAnchor="middle" fontWeight="600">
 {d.maxWeight} {wUnit} · e1RM {d.bestE1RM}
 </text>
 <text x={tx} y={PAD.top + 20} fill={T.text3} fontSize="8" fontFamily={T.mono} textAnchor="middle">
 Vol: {d.totalVolume.toLocaleString} · {d.sets} sets
 </text>
 <text x={tx} y={PAD.top + 32} fill={T.text3} fontSize="8" fontFamily={T.mono} textAnchor="middle">
 {new Date(d.date + 'T12:00:00').toLocaleDateString('en-US', { month:'short', day:'numeric', year:'2-digit' })}
 </text>
 </g>
 );
 })}
 </svg>
 </>
 )}

 {/* Stats summary */}
 {stats && data.length >= 2 && (
 <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'8px', marginTop:'12px' }}>
 {[
 { label:'Best Weight', value:`${stats.bestWeight}`, sub:wUnit, color:T.accent },
 { label:'Best e1RM', value:`${stats.bestE1RM}`, sub:wUnit, color:T.teal },
 { label:'Best Volume', value: stats.bestVolume >= 10000 ? `${(stats.bestVolume/1000).toFixed(1)}k` : stats.bestVolume.toLocaleString, sub:wUnit, color:T.text2 },
 ].map((s, i) => (
 <div key={i} style={{
 background:'rgba(255,255,255,0.03)', borderRadius:'10px', padding:'10px 8px', textAlign:'center',
 }}>
 <div style={{ fontSize:'16px', fontWeight:700, fontFamily:T.mono, color:s.color, lineHeight:1 }}>
 {s.value}
 </div>
 <div style={{ fontSize:'9px', color:T.text3, marginTop:'3px', textTransform:'uppercase', letterSpacing:'0.5px' }}>
 {s.sub} · {s.label}
 </div>
 </div>
 ))}
 </div>
 )}
 {stats && (
 <div style={{ fontSize:'11px', color:T.text3, marginTop:'8px', display:'flex', justifyContent:'space-between', flexWrap:'wrap', gap:'4px' }}>
 <span>{stats.totalSessions} session{stats.totalSessions !== 1 ? 's' : ''} logged</span>
 {stats.firstDate && (
 <span>Since {new Date(stats.firstDate + 'T12:00:00').toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' })}</span>
 )}
 </div>
 )}
 </GlassCard>
 </div>
 );
}

// ============================================================
// MUSCLE BALANCE CARD
// ============================================================

function MuscleBalanceCard({ settings }) {
 const [expanded, setExpanded] = useState(false);

 const analysis = useMemo( => {
 const vol = computeWeightedMuscleVolume(settings);
 return { weighted: vol,.analyzeMuscleBalance(vol) };
 }, [settings]);

 const imbalanceCount = analysis.pairs.filter(p => !p.balanced).length + analysis.undertrained.length;
 const hasData = analysis.pairs.some(p => p.valA > 0 || p.valB > 0);

 if (!hasData) return null;

 return (
 <div style={{ marginBottom: '20px' }}>
 <div
 onClick={ => setExpanded(!expanded)}
 style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', marginBottom: '10px' }}
 >
 <h3 style={{ fontSize: '15px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
 🎯 Muscle Balance
 {imbalanceCount > 0 && (
 <span style={{
 fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '10px',
 background: T.warnSoft, color: T.warn,
 }}>
 {imbalanceCount} imbalance{imbalanceCount > 1 ? 's' : ''}
 </span>
 )}
 {imbalanceCount === 0 && (
 <span style={{
 fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '10px',
 background: T.successSoft, color: T.success,
 }}>
 Balanced
 </span>
 )}
 </h3>
 <ChevronDown size={16} color={T.text3} style={{ transform: expanded ? 'rotate(180deg)' : 'none', transition: '0.2s' }} />
 </div>

 {expanded && (
 <GlassCard animate={false} style={{ padding: '12px' }}>
 {analysis.pairs.map(pair => {
 const total = pair.valA + pair.valB;
 if (total === 0) return null;
 const pctA = total > 0 ? (pair.valA / total) * 100 : 50;
 const barColor = pair.balanced ? T.success : T.warn;

 return (
 <div key={pair.name} style={{ marginBottom: '10px' }}>
 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
 <span style={{ fontSize: '11px', fontWeight: 600, color: T.text2 }}>{pair.labelA}</span>
 <span style={{ fontSize: '9px', color: pair.balanced ? T.text3 : T.warn, fontFamily: T.mono }}>
 {pair.valA} : {pair.valB}{!pair.balanced && pair.ratio !== Infinity ? ` (${pair.ratio}:1)` : !pair.balanced ? ' (∞)' : ''}
 </span>
 <span style={{ fontSize: '11px', fontWeight: 600, color: T.text2 }}>{pair.labelB}</span>
 </div>
 {/* Balance bar */}
 <div style={{ height: '8px', borderRadius: '4px', background: 'rgba(255,255,255,0.04)', position: 'relative', overflow: 'hidden' }}>
 {/* Left side (A) */}
 <div style={{
 position: 'absolute', left: 0, top: 0, bottom: 0,
 width: `${pctA}%`, borderRadius: '4px 0 0 4px',
 background: pair.dominant === 'A' && !pair.balanced
 ? `linear-gradient(90deg, ${barColor}, ${barColor}88)` : `linear-gradient(90deg, ${T.teal}88, ${T.teal}44)`,
 transition: 'width 0.4s ease-out',
 }} />
 {/* Right side (B) */}
 <div style={{
 position: 'absolute', right: 0, top: 0, bottom: 0,
 width: `${100 - pctA}%`, borderRadius: '0 4px 4px 0',
 background: pair.dominant === 'B' && !pair.balanced
 ? `linear-gradient(270deg, ${barColor}, ${barColor}88)` : `linear-gradient(270deg, ${T.teal}88, ${T.teal}44)`,
 transition: 'width 0.4s ease-out',
 }} />
 {/* Center marker */}
 <div style={{ position: 'absolute', left: '50%', top: '-1px', bottom: '-1px', width: '2px', background: 'rgba(255,255,255,0.15)', transform: 'translateX(-1px)' }} />
 </div>
 {/* Recommendation */}
 {!pair.balanced && pair.recommendation && (
 <div style={{ fontSize: '10px', color: T.warn, marginTop: '4px', lineHeight: 1.4, paddingLeft: '4px' }}>
 ⚠ {pair.recommendation}
 </div>
 )}
 </div>
 );
 })}

 {/* Undertrained standalone muscles */}
 {analysis.undertrained.map(u => (
 <div key={u.muscle} style={{ marginBottom: '6px', padding: '6px 8px', background: T.warnSoft, borderRadius: T.radiusSm }}>
 <div style={{ fontSize: '11px', fontWeight: 600, color: T.warn }}>{u.muscle}: {u.weightedSets} weighted sets</div>
 <div style={{ fontSize: '10px', color: T.text2, marginTop: '2px' }}>⚠ {u.recommendation}</div>
 </div>
 ))}
 </GlassCard>
 )}
 </div>
 );
}

function ProgressTab({ profile, history, goToSettings, coachEnabled, settings, coachCfg, nutritionConfig, onUpdateNutritionConfig, goToToday }) {
 const [historyDetailDate, setHistoryDetailDate] = useState(null);
 const level = LEVELS.find((l, i) => (LEVELS[i+1]?.xp || Infinity) > profile.xp) || LEVELS[0];
 const nextLevel = LEVELS[LEVELS.indexOf(level) + 1];
 const xpInLevel = profile.xp - level.xp;
 const xpForNext = nextLevel ? nextLevel.xp - level.xp : 1;
 const progressPct = nextLevel ? Math.min((xpInLevel / xpForNext) * 100, 100) : 100;

 const recentMuscles = useMemo( => {
 const muscleHours = {};
 const now = Date.now;
 const keys = LS.keys('workout:');
 const sortedKeys = keys.sort((a, b) => b.localeCompare(a));
 for (const key of sortedKeys) {
 const dateStr = key.replace('workout:', '');
 const date = new Date(dateStr + 'T12:00:00');
 const hoursSince = (now - date.getTime) / (1000 * 60 * 60);
 if (hoursSince > 168) break;
 const raw = LS.get(key, null);
 const exercises = getWorkoutExercises(raw);
 for (const ex of exercises) {
 const doneSets = (ex.logSets || []).filter(s => s.done);
 if (doneSets.length === 0) continue;
 const muscle = ex.primaryMuscleGroup || ex.category;
 if (muscle && !(muscle in muscleHours)) muscleHours[muscle] = hoursSince;
 for (const sec of (ex.secondaryMuscleGroups || [])) {
 if (sec && !(sec in muscleHours)) muscleHours[sec] = hoursSince;
 }
 }
 }
 return muscleHours;
 }, [history]);

 // Lift body log loading to avoid redundant localStorage reads in every chart component
 const bodyLogs = useMemo( => loadBodyLogs, []);
 const allBodyLogs = useMemo( => loadAllBodyLogs, []);

 return (
 <div style={{ animation:'fadeIn 0.3s ease-out' }}>
 {/* Level card */}
 <GlassCard style={{
 background: `linear-gradient(135deg, rgba(255,107,53,0.08), rgba(78,205,196,0.05))`,
 textAlign:'center', marginBottom:'16px', padding:'24px 16px',
 }}>
 <div style={{ fontSize:'48px', fontWeight:800, background:`linear-gradient(135deg, ${T.accent}, ${T.teal})`,
 WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', lineHeight:1 }}>
 {level.level}
 </div>
 <div style={{ fontSize:'16px', fontWeight:600, marginTop:'4px' }}>{level.name}</div>
 <div style={{ fontSize:'13px', color:T.text2, marginTop:'2px' }}>{profile.xp.toLocaleString} XP</div>
 
 {/* XP bar */}
 <div style={{ marginTop:'16px', background:'rgba(255,255,255,0.06)', height:'6px',
 borderRadius:'3px', overflow:'hidden' }}>
 <div style={{ width:`${progressPct}%`, height:'100%',
 background:`linear-gradient(90deg, ${T.accent}, ${T.teal})`,
 transition:'width 0.5s ease-out', borderRadius:'3px' }} />
 </div>
 {nextLevel && (
 <div style={{ display:'flex', justifyContent:'space-between', marginTop:'6px', fontSize:'11px', color:T.text3 }}>
 <span>Lvl {level.level}</span>
 <span>{nextLevel.xp - profile.xp} XP to Lvl {nextLevel.level}</span>
 </div>
 )}
 </GlassCard>

 {/* Stats row */}
 <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'10px', marginBottom:'16px' }}>
 {[
 { label:'Streak', value: profile.streak, icon:<Flame size={18} color={profile.streak > 0 ? T.accent : T.text3} />, color: profile.streak > 0 ? T.accent : T.text3 },
 { label:'Workouts', value: Object.values(history).filter(a => a.includes('workout')).length, icon:<Dumbbell size={18} color={T.teal} />, color:T.teal },
 { label:'Active Days', value: Object.keys(history).length, icon:<Activity size={18} color={T.success} />, color:T.success },
 ].map((s,i) => (
 <GlassCard key={i} animate={false} style={{ textAlign:'center', padding:'14px 8px' }}>
 <div style={{ marginBottom:'6px' }}>{s.icon}</div>
 <div style={{ fontSize:'20px', fontWeight:700, color:s.color, fontFamily:T.mono }}>{s.value}</div>
 <div style={{ fontSize:'10px', color:T.text3, textTransform:'uppercase', letterSpacing:'0.5px' }}>{s.label}</div>
 </GlassCard>
 ))}
 </div>

 {/* Calendar */}
 <h3 style={{ fontSize:'15px', fontWeight:600, marginBottom:'12px' }}>Consistency</h3>
 <CalendarHeatmap history={history} onDayClick={setHistoryDetailDate} />
 {historyDetailDate && <WorkoutDetailModal date={historyDetailDate} onClose={ => setHistoryDetailDate(null)} />}

 {/* Weekly Check-In */}
 {onUpdateNutritionConfig && (
 <WeeklyCheckInCard nutritionConfig={nutritionConfig} onUpdateNutritionConfig={onUpdateNutritionConfig} settings={settings} allBodyLogs={allBodyLogs} />
 )}

 {/* Weight Trend Chart */}
 <WeightTrendChart settings={settings} nutritionConfig={nutritionConfig} goToToday={goToToday} bodyLogs={bodyLogs} />

 {/* Body Fat Chart */}
 <BodyFatChart settings={settings} nutritionConfig={nutritionConfig} goToToday={goToToday} allBodyLogs={allBodyLogs} />

 {/* Nutrition Chart */}
 <NutritionChart nutritionConfig={nutritionConfig} goToToday={goToToday} allBodyLogs={allBodyLogs} />

 {/* TDEE Trend Chart */}
 <TDEETrendChart nutritionConfig={nutritionConfig} />

 {/* Waist Chart */}
 <WaistChart settings={settings} nutritionConfig={nutritionConfig} allBodyLogs={allBodyLogs} />

 {/* Multi-Metric Overlay */}
 <MultiMetricOverlay settings={settings} nutritionConfig={nutritionConfig} allBodyLogs={allBodyLogs} bodyLogs={bodyLogs} />

 {/* Volume Tracker */}
 <VolumeTracker history={history} settings={settings} />

 {/* Exercise Strength Progress */}
 <ExerciseProgressChart settings={settings} />

 {/* Muscle Balance */}
 <MuscleBalanceCard settings={settings} />

 {/* Muscle Map */}
 <h3 style={{ fontSize:'15px', fontWeight:600, margin:'20px 0 12px' }}>Muscle Coverage</h3>
 <GlassCard animate={false}>
 <MuscleMap recentMuscles={recentMuscles} />
 <div style={{ display:'flex', gap:'12px', justifyContent:'center', marginTop:'12px', fontSize:'10px' }}>
 <span style={{ color:T.success }}>● &lt;48hr</span>
 <span style={{ color:T.warn }}>● 48-96hr</span>
 <span style={{ color:T.danger }}>● &gt;96hr</span>
 <span style={{ color:T.text3 }}>● Never</span>
 </div>
 </GlassCard>

 {/* AI Reports */}
 {settings?.reportsEnabled && (
 <ProgressReports profile={profile} history={history} settings={settings || {}}
 coachCfg={coachCfg || {}} goToSettings={goToSettings} />
 )}

 {/* Quick Settings Link */}
 <button onClick={ => goToSettings?.('training')} style={{
 width:'100%', padding:'14px 16px', background:T.bgCard, border:`1px solid ${T.border}`,
 borderRadius:T.radius, cursor:'pointer', display:'flex', alignItems:'center', gap:'12px',
 marginTop:'16px', transition:'all 0.2s',
 }}>
 <Settings size={18} color={T.text3} />
 <div style={{ flex:1, textAlign:'left' }}>
 <div style={{ fontSize:'14px', fontWeight:600, color:T.text }}>Settings</div>
 <div style={{ fontSize:'11px', color:T.text3, marginTop:'1px' }}>
 {profile.phase} · {profile.location} · units, timers, recovery{coachEnabled ? ', AI coach' : ''}{settings?.reportsEnabled ? ', reports' : ''}
 </div>
 </div>
 <ChevronRight size={16} color={T.text3} />
 </button>
 </div>
 );
}

// ============================================================
// TAB: COACH — Multi-Provider LLM with Full Settings
// ============================================================

const DEFAULT_SYSTEM_PROMPT = `You are a fitness and mobility coach. Be concise (<120 words unless asked for detail). Reference clinical context when relevant. Never recommend exercises that conflict with any listed precautions.`;

const DEFAULT_PATIENT_PROFILE = `PATIENT: [Configure in settings]
DX: [Add diagnoses in settings]
GENETICS: [Add genetic markers in settings]
PRECAUTIONS: [Configure based on your conditions]
SUBS: [Configure based on your precautions]`;

// --- Provider / Model Registry ---

const PROVIDERS = {
 anthropic: {
 name: 'Anthropic',
 models: [
 { id:'claude-haiku-4-5-20251001', label:'Haiku 4.5', cost:{in:0.80,out:4.00,cached:0.08} },
 { id:'claude-sonnet-4-5-20250929', label:'Sonnet 4.5', cost:{in:3.00,out:15.00,cached:0.30} },
 { id:'claude-opus-4-6', label:'Opus 4.6', cost:{in:15.00,out:75.00,cached:1.50} },
 ],
 keyPlaceholder: 'sk-ant-.',
 },
 openrouter: {
 name: 'OpenRouter',
 models: [
 { id:'anthropic/claude-haiku-4-5-20251001', label:'Haiku 4.5', cost:{in:0.80,out:4.00,cached:0.08} },
 { id:'anthropic/claude-sonnet-4-5-20250929', label:'Sonnet 4.5', cost:{in:3.00,out:15.00,cached:0.30} },
 { id:'anthropic/claude-opus-4-6', label:'Opus 4.6', cost:{in:15.00,out:75.00,cached:1.50} },
 { id:'google/gemini-2.5-flash-preview', label:'Gemini 2.5 Flash', cost:{in:0.15,out:0.60,cached:0.04} },
 { id:'google/gemini-2.5-pro-preview', label:'Gemini 2.5 Pro', cost:{in:1.25,out:10.00,cached:0.31} },
 { id:'deepseek/deepseek-chat-v3-0324', label:'DeepSeek V3', cost:{in:0.27,out:1.10,cached:0.07} },
 { id:'meta-llama/llama-4-maverick', label:'Llama 4 Maverick', cost:{in:0.20,out:0.60,cached:0.05} },
 { id:'__custom__', label:'Other', cost:{in:0,out:0,cached:0} },
 ],
 keyPlaceholder: 'sk-or-.',
 },
 gemini: {
 name: 'Google Gemini',
 models: [
 { id:'gemini-2.5-flash-preview-05-20', label:'Gemini 2.5 Flash', cost:{in:0.15,out:0.60,cached:0.04} },
 { id:'gemini-2.5-pro-preview-05-06', label:'Gemini 2.5 Pro', cost:{in:1.25,out:10.00,cached:0.31} },
 ],
 keyPlaceholder: 'AIza.',
 },
};

const DEFAULT_COACH_CONFIG = {
 provider: 'anthropic',
 model: 'claude-haiku-4-5-20251001',
 customModel: '', // for OpenRouter "Other" option
 keys: { anthropic:'', openrouter:'', gemini:'' },
 maxHistory: 4,
 maxTokens: 250,
 temperature: 0.7,
 systemPrompt: DEFAULT_SYSTEM_PROMPT,
 patientProfile: DEFAULT_PATIENT_PROFILE,
 includePatientProfile: true,
 includeSessionContext: true,
 includeCurrentWorkout: true,
 includeRecentActivity: true,
 includeBodyMetrics: true,
};

// --- Token helpers ---

const estimateTokens = (text) => Math.ceil((text || '').length / 4);

function estimateCost(usage, modelInfo) {
 if (!usage || !modelInfo?.cost) return null;
 const r = modelInfo.cost; // rates per 1M tokens
 const cached = usage.cached || 0;
 const uncached = (usage.input || 0) - cached;
 const cost = (uncached * r.in / 1e6) + (cached * r.cached / 1e6) + ((usage.output || 0) * r.out / 1e6);
 return { cost: cost < 0.0001 ? '<$0.0001' : `$${cost.toFixed(4)}`,.usage,
 pctCached: usage.input > 0 ? Math.round((cached / usage.input) * 100) : 0 };
}

// --- Context builders ---

function buildSessionContext(profile, workout, rehabStatus, cardioLog, history, cfg) {
 const parts = [];

 if (cfg.includeSessionContext) {
 parts.push(`Phase:${profile.phase} Loc:${profile.location} XP:${profile.xp} Streak:${profile.streak}d`);
 }

 if (cfg.includeCurrentWorkout) {
 const wExercises = workout?.exercises || (Array.isArray(workout) ? workout : []);
 if (wExercises.length > 0) {
 const splitDay = workout?.splitDay || 'full_body';
 const summary = wExercises.map(e => {
 const sets = e.logSets || [];
 const done = sets.filter(s => s.done);
 if (done.length === 0) return e.name;
 const logged = done.map(s => `${s.weight||'?'}×${s.reps||'?'}`).join(',');
 return `${e.name}(${logged})`;
 });
 const doneCount = wExercises.filter(e => e.logSets?.every(s => s.done)).length;
 parts.push(`Today[${splitDay}][${doneCount}/${wExercises.length}]: ${summary.join('; ')}`);
 const prescriptions = wExercises.filter(e => e.prescription?.action).map(e => `${e.name.split(' ')[0]}:${e.prescription.action}`).slice(0, 5);
 if (prescriptions.length > 0) parts.push(`Rx: ${prescriptions.join(',')}`);
 const stallWarnings = wExercises.map(e => { const s = detectStall(e.id); if (s.stalled) return `${e.name.split(' ')[0]}:stalled`; if (s.fatigued) return `${e.name.split(' ')[0]}:fatigued`; return null; }).filter(Boolean);
 if (stallWarnings.length > 0) parts.push(`Alerts: ${stallWarnings.join(',')}`);
 if (workout.sessionRPE) parts.push(`SessionRPE:${workout.sessionRPE}`);
 }
 }

 if (cfg.includeSessionContext && rehabStatus && Object.keys(rehabStatus).length > 0) {
 const done = DAILY_REHAB.filter(r => rehabStatus[r.id]).map(r => r.name.split(' ')[0]);
 if (done.length > 0) parts.push(`Rehab: ${done.join(',')}`);
 }

 if (cfg.includeSessionContext && cardioLog?.length > 0) {
 const l = cardioLog[cardioLog.length - 1];
 parts.push(`Cardio: ${l.name} ${l.duration}m${l.hr ? ' HR'+l.hr : ''}`);
 }

 if (cfg.includeRecentActivity) {
 const last7 = Object.entries(history || {}).filter(([d]) =>
 (Date.now - new Date(d).getTime) / 864e5 < 7
 );
 if (last7.length > 0) {
 const wk = last7.filter(([,a]) => a.includes('workout')).length;
 const rh = last7.filter(([,a]) => a.includes('rehab')).length;
 const cd = last7.filter(([,a]) => a.includes('cardio')).length;
 parts.push(`7d: ${wk}W ${rh}R ${cd}C`);
 }
 }

 // Muscle balance summary (compact)
 try {
 const wv = computeWeightedMuscleVolume(null);
 const bal = analyzeMuscleBalance(wv);
 const balParts = bal.pairs.filter(p => p.valA > 0 || p.valB > 0)
.map(p => `${p.labelA}:${p.valA}/${p.labelB}:${p.valB}(${p.balanced ? 'OK' : 'IMBAL'})`);
 if (balParts.length > 0) parts.push(`MuscBal: ${balParts.join(', ')}`);
 } catch(e) { /* skip on error */ }

 return parts.length > 0 ? parts.join(' | ') : '';
}

function buildFullSystemPrompt(cfg) {
 let sys = cfg.systemPrompt || '';
 if (cfg.includePatientProfile && cfg.patientProfile) {
 sys += '\n\n' + cfg.patientProfile;
 }
 if (cfg.includeBodyMetrics) {
 try {
 const parts = [];
 const logs = loadBodyLogs;
 const allLogs = loadAllBodyLogs;
 const nCfg = LS.get('nutritionConfig', DEFAULT_NUTRITION_CONFIG);
 const cal = LS.get('bfCalibration', DEFAULT_CALIBRATION);
 const profile = LS.get('profile', {});
 // Weight trend (7d)
 if (logs.length >= 2) {
 const smoothed = getSmoothedWeights(logs, nCfg);
 const latest = smoothed[smoothed.length - 1];
 const cutoff7 = subtractDays(today, 7);
 const past7 = smoothed.find(s => s.date >= cutoff7);
 const wUnit = nCfg.weightUnit || 'lbs';
 if (latest && past7) {
 const delta = Math.round((latest.trend - past7.trend) * 10) / 10;
 parts.push(`Weight trend: ${past7.trend}→${latest.trend} (7d, ${delta > 0 ? '+' : ''}${delta} ${wUnit})`);
 } else if (latest) {
 parts.push(`Weight: ${latest.trend} ${wUnit}`);
 }
 }
 // TDEE
 if (nCfg.estimatedTDEE) {
 parts.push(`TDEE est: ${nCfg.estimatedTDEE} kcal (${nCfg.tdeeConfidence || 'low'} conf)`);
 }
 // Avg intake 7d
 const recentNutrition = allLogs.filter(l => l.calories && l.date >= subtractDays(today, 7));
 if (recentNutrition.length > 0) {
 const avgCal = Math.round(recentNutrition.reduce((s, l) => s + Number(l.calories), 0) / recentNutrition.length);
 const protLogs = recentNutrition.filter(l => l.protein);
 const avgProt = protLogs.length > 0 ? Math.round(protLogs.reduce((s, l) => s + Number(l.protein), 0) / protLogs.length) : null;
 parts.push(`Avg intake 7d: ${avgCal} kcal${avgProt ? ', ' + avgProt + 'g protein' : ''}`);
 }
 // Body fat
 const bfLogs = allLogs.filter(l => l.bodyFat?.value);
 if (bfLogs.length > 0) {
 const latest = bfLogs[bfLogs.length - 1];
 const rawBF = Number(latest.bodyFat.value);
 const calibrated = getCalibratedBodyFat(rawBF, cal);
 const methodLabel = cal.method === 'simple_offset' ? `simple offset +${cal.offset}%` : cal.method?.replace(/_/g, ' ');
 parts.push(`BF: ${calibrated.value}% ${calibrated.calibrated ? 'calibrated (' + methodLabel + ')' : 'uncalibrated'}`);
 }
 // Streak
 const streaks = profile.streaks || DEFAULT_STREAKS;
 if (streaks.combined?.current > 0) {
 parts.push(`Logging streak: ${streaks.combined.current}d`);
 }
 if (parts.length > 0) {
 sys += '\n\nBODY: ' + parts.join(' | ');
 }
 } catch (e) { /* skip body metrics on error */ }
 }
 return sys;
}

function trimHistory(messages, maxExchanges) {
 const api = messages.filter(m => !m.local);
 if (api.length <= maxExchanges * 2) return api;
 const keep = api.slice(-(maxExchanges * 2));
 const dropped = api.slice(0, -(maxExchanges * 2));
 const topics = dropped.filter(m => m.role === 'user').map(m => m.content.slice(0, 40)).join('; ');
 return [
 { role:'user', content:`[Prior topics: ${topics}]` },
 { role:'assistant', content:'Understood, continuing from here.' },
.keep,
 ];
}

// --- Provider API dispatchers ---

// Helper: resolve actual model ID (handles __custom__)
const resolveModel = (cfg) => cfg.model === '__custom__' ? (cfg.customModel || cfg.model) : cfg.model;

async function callAnthropic(cfg, systemPrompt, apiMessages) {
 const key = cfg.keys.anthropic;
 if (!key) throw new Error('No Anthropic API key set');
 const res = await fetch('https://api.anthropic.com/v1/messages', {
 method:'POST',
 headers:{ 'Content-Type':'application/json', 'x-api-key':key, 'anthropic-version':'2023-06-01', 'anthropic-dangerous-direct-browser-access':'true' },
 body:JSON.stringify({ model:resolveModel(cfg), max_tokens:cfg.maxTokens, temperature:cfg.temperature, system:systemPrompt, messages:apiMessages }),
 });
 const data = await res.json;
 if (data.error) throw new Error(data.error.message || JSON.stringify(data.error));
 return {
 text: data.content?.[0]?.text || '',
 usage: { input:data.usage?.input_tokens||0, output:data.usage?.output_tokens||0, cached:data.usage?.cache_read_input_tokens||0 },
 };
}

async function callOpenRouter(cfg, systemPrompt, apiMessages) {
 const key = cfg.keys.openrouter;
 if (!key) throw new Error('No OpenRouter API key set');
 const msgs = [{ role:'system', content:systemPrompt },.apiMessages];
 const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
 method:'POST',
 headers:{ 'Content-Type':'application/json', 'Authorization':`Bearer ${key}`, 'HTTP-Referer':'https://neurorehab.app', 'X-Title':'NeuroRehab Coach' },
 body:JSON.stringify({ model:resolveModel(cfg), max_tokens:cfg.maxTokens, temperature:cfg.temperature, messages:msgs }),
 });
 const data = await res.json;
 if (data.error) throw new Error(data.error.message || JSON.stringify(data.error));
 return {
 text: data.choices?.[0]?.message?.content || '',
 usage: { input:data.usage?.prompt_tokens||0, output:data.usage?.completion_tokens||0, cached:0 },
 };
}

async function callGemini(cfg, systemPrompt, apiMessages) {
 const key = cfg.keys.gemini;
 if (!key) throw new Error('No Gemini API key set');
 const contents = apiMessages.map(m => ({
 role: m.role === 'assistant' ? 'model' : 'user',
 parts:[{ text:m.content }],
 }));
 const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${resolveModel(cfg)}:generateContent?key=${key}`, {
 method:'POST',
 headers:{ 'Content-Type':'application/json' },
 body:JSON.stringify({
 system_instruction:{ parts:[{ text:systemPrompt }] },
 contents,
 generationConfig:{ maxOutputTokens:cfg.maxTokens, temperature:cfg.temperature },
 }),
 });
 const data = await res.json;
 if (data.error) throw new Error(data.error.message || JSON.stringify(data.error));
 const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
 const u = data.usageMetadata || {};
 return {
 text,
 usage: { input:u.promptTokenCount||0, output:u.candidatesTokenCount||0, cached:u.cachedContentTokenCount||0 },
 };
}

const DISPATCH = { anthropic:callAnthropic, openrouter:callOpenRouter, gemini:callGemini };

// ============================================================
// PROGRESS REPORTS — LLM-generated weekly/monthly summaries
// ============================================================

const REPORT_SYSTEM_PROMPT = `You are an insightful fitness and rehab coach who writes progress reports. Your job is to analyze workout history data and produce encouraging, personalized reports.

Guidelines:
- Be warm, specific, and encouraging — reference actual exercises and numbers from the data
- Spot subtle patterns the user may have missed (volume trends, consistency patterns, exercise preferences, recovery adherence, strength progressions or plateaus)
- Make 2-3 concrete, actionable recommendations based on the data
- Note what's going well and what could improve — keep criticism constructive and gentle
- End with genuine encouragement tied to something specific you noticed
- Reference the user profile if provided for personalized insights
- Use the selected weight unit consistently`;

function getWeekId(date = new Date) {
 const d = new Date(date);
 d.setHours(0,0,0,0);
 d.setDate(d.getDate + 3 - (d.getDay + 6) % 7);
 const week1 = new Date(d.getFullYear, 0, 4);
 const weekNum = 1 + Math.round(((d - week1) / 86400000 - 3 + (week1.getDay + 6) % 7) / 7);
 return `${d.getFullYear}-W${String(weekNum).padStart(2, '0')}`;
}

function getMonthId(date = new Date) {
 return `${date.getFullYear}-${String(date.getMonth + 1).padStart(2, '0')}`;
}

function buildReportData(history, daysBack, weightUnit = 'lbs') {
 const now = new Date;
 const cutoff = new Date(now.getTime - daysBack * 86400000);
 const cutoffStr = cutoff.toISOString.split('T')[0];

 // Gather all dates in range
 const datesInRange = Object.entries(history || {})
.filter(([d]) => d >= cutoffStr)
.sort((a, b) => a[0].localeCompare(b[0]));

 const workoutDates = datesInRange.filter(([, acts]) => acts.includes('workout'));
 const rehabDates = datesInRange.filter(([, acts]) => acts.includes('rehab'));
 const cardioDates = datesInRange.filter(([, acts]) => acts.includes('cardio'));

 // Load actual workout data
 const workoutDetails = [];
 const exerciseStats = {}; // { exerciseId: { name, category, sessions: [{ date, sets: [{w,r,rpe}] }] } }

 for (const [date] of workoutDates) {
 const raw = LS.get(`workout:${date}`, null);
 const w = getWorkoutExercises(raw);
 if (w.length === 0) continue;

 const dayExercises = [];
 for (const ex of w) {
 const doneSets = (ex.logSets || []).filter(s => s.done);
 if (doneSets.length === 0) continue;

 const sets = doneSets.map(s => ({
 weight: parseFloat(s.weight) || 0,
 reps: parseInt(s.reps) || 0,
 rpe: parseFloat(s.rpe) || 0,
 }));

 const totalVolume = sets.reduce((sum, s) => sum + s.weight * s.reps, 0);
 const maxWeight = Math.max(.sets.map(s => s.weight));
 const avgRPE = sets.filter(s => s.rpe > 0).length > 0
 ? (sets.filter(s => s.rpe > 0).reduce((s, x) => s + x.rpe, 0) / sets.filter(s => s.rpe > 0).length).toFixed(1)
 : null;

 dayExercises.push({
 name: ex.name, category: ex.category, setsCompleted: doneSets.length,
 totalSets: (ex.logSets || []).length, maxWeight, totalVolume, avgRPE,
 });

 if (!exerciseStats[ex.id]) {
 exerciseStats[ex.id] = { name: ex.name, category: ex.category, sessions: [] };
 }
 exerciseStats[ex.id].sessions.push({ date, sets, totalVolume, maxWeight });
 }

 if (dayExercises.length > 0) {
 workoutDetails.push({ date, exercises: dayExercises });
 }
 }

 // Load cardio details
 const cardioDetails = [];
 for (const [date] of cardioDates) {
 const logs = LS.get(`cardio:${date}`, []);
 if (Array.isArray(logs)) {
 for (const l of logs) {
 cardioDetails.push({ date: l.date || date, name: l.name, duration: l.duration, hr: l.hr });
 }
 }
 }

 // Build progression summaries for exercises done 2+ times
 const progressions = [];
 for (const [, stat] of Object.entries(exerciseStats)) {
 if (stat.sessions.length >= 2) {
 const first = stat.sessions[0];
 const last = stat.sessions[stat.sessions.length - 1];
 const weightDelta = last.maxWeight - first.maxWeight;
 const volDelta = last.totalVolume - first.totalVolume;
 progressions.push({
 name: stat.name, category: stat.category,
 sessions: stat.sessions.length,
 firstMax: first.maxWeight, lastMax: last.maxWeight, weightDelta,
 firstVol: first.totalVolume, lastVol: last.totalVolume, volDelta,
 });
 }
 }

 // Body tracking summary
 const bodyLogs = loadBodyLogs.filter(l => l.date >= cutoffStr);
 const allBodyLogs = loadAllBodyLogs.filter(l => l.date >= cutoffStr);
 const nCfg = LS.get('nutritionConfig', DEFAULT_NUTRITION_CONFIG);
 const bfCal = LS.get('bfCalibration', DEFAULT_CALIBRATION);
 const bodyTracking = {};

 if (bodyLogs.length >= 2) {
 const smoothed = getSmoothedWeights(bodyLogs, nCfg);
 const first = smoothed[0], last = smoothed[smoothed.length - 1];
 bodyTracking.weightTrend = { start: first.trend, end: last.trend, delta: Math.round((last.trend - first.trend) * 10) / 10, unit: weightUnit };
 bodyTracking.avgWeight = Math.round(smoothed.reduce((s, d) => s + d.trend, 0) / smoothed.length * 10) / 10;
 }

 const calLogs = allBodyLogs.filter(l => l.calories);
 if (calLogs.length > 0) {
 const avgCal = Math.round(calLogs.reduce((s, l) => s + Number(l.calories), 0) / calLogs.length);
 const target = nCfg.dailyCalorieTarget || 2200;
 bodyTracking.avgCalories = avgCal;
 bodyTracking.calorieTarget = target;
 bodyTracking.adherencePct = Math.round((avgCal / target) * 100);
 }

 if (nCfg.estimatedTDEE) {
 bodyTracking.tdee = nCfg.estimatedTDEE;
 bodyTracking.tdeeConfidence = nCfg.tdeeConfidence || 'low';
 const hist = nCfg.tdeeHistory || [];
 const recentHist = hist.filter(h => h.date >= cutoffStr);
 if (recentHist.length >= 2) {
 bodyTracking.tdeeTrend = recentHist[recentHist.length - 1].tdee - recentHist[0].tdee;
 }
 }

 const bfLogs = allBodyLogs.filter(l => l.bodyFat?.value);
 if (bfLogs.length >= 2) {
 const first = getCalibratedBodyFat(Number(bfLogs[0].bodyFat.value), bfCal);
 const last = getCalibratedBodyFat(Number(bfLogs[bfLogs.length - 1].bodyFat.value), bfCal);
 bodyTracking.bodyFatTrend = { start: first.value, end: last.value, delta: Math.round((last.value - first.value) * 10) / 10 };
 }

 return {
 period: `${cutoffStr} to ${now.toISOString.split('T')[0]}`,
 totalActiveDays: datesInRange.length,
 workoutCount: workoutDates.length,
 rehabCount: rehabDates.length,
 cardioCount: cardioDates.length,
 workoutDetails,
 cardioDetails,
 progressions,
 weightUnit,
 bodyTracking,
 };
}

function buildReportPrompt(type, data, profile, settings) {
 const isWeekly = type === 'weekly';
 const wordTarget = isWeekly ? '150-250 words' : '400-600 words';
 const period = isWeekly ? 'past 7 days' : 'past 30 days';

 let prompt = `Generate a ${isWeekly ? 'short weekly' : 'detailed monthly'} progress report (${wordTarget}) for the ${period}.\n\n`;
 prompt += `USER CONTEXT: Phase: ${profile.phase}, Location: ${profile.location}, XP: ${profile.xp}, Streak: ${profile.streak}d, Weight unit: ${data.weightUnit}\n\n`;
 prompt += `ACTIVITY SUMMARY:\n`;
 prompt += `- Active days: ${data.totalActiveDays}\n`;
 prompt += `- Workouts completed: ${data.workoutCount}\n`;
 prompt += `- Rehab sessions: ${data.rehabCount}\n`;
 prompt += `- Cardio sessions: ${data.cardioCount}\n\n`;

 // Body tracking section
 if (data.bodyTracking && Object.keys(data.bodyTracking).length > 0) {
 const bt = data.bodyTracking;
 prompt += `BODY TRACKING:\n`;
 if (bt.weightTrend) {
 prompt += `- Weight: ${bt.weightTrend.start}→${bt.weightTrend.end} ${bt.weightTrend.unit} (${bt.weightTrend.delta > 0 ? '+' : ''}${bt.weightTrend.delta}), avg ${bt.avgWeight}\n`;
 }
 if (bt.avgCalories) {
 prompt += `- Avg daily calories: ${bt.avgCalories} kcal (target: ${bt.calorieTarget}, adherence: ${bt.adherencePct}%)\n`;
 }
 if (bt.tdee) {
 prompt += `- TDEE estimate: ${bt.tdee} kcal (${bt.tdeeConfidence} confidence)${bt.tdeeTrend ? ', trend: ' + (bt.tdeeTrend > 0 ? '+' : '') + Math.round(bt.tdeeTrend) + ' kcal' : ''}\n`;
 }
 if (bt.bodyFatTrend) {
 prompt += `- Body fat: ${bt.bodyFatTrend.start}%→${bt.bodyFatTrend.end}% (${bt.bodyFatTrend.delta > 0 ? '+' : ''}${bt.bodyFatTrend.delta}%)\n`;
 }
 prompt += '\n';
 }

 if (data.workoutDetails.length > 0) {
 prompt += `WORKOUT LOG:\n`;
 for (const day of data.workoutDetails) {
 prompt += `${day.date}: `;
 prompt += day.exercises.map(e =>
 `${e.name} (${e.setsCompleted}/${e.totalSets} sets, max ${e.maxWeight}${data.weightUnit}, vol ${e.totalVolume}${data.weightUnit}${e.avgRPE ? ', RPE ' + e.avgRPE : ''})`
 ).join('; ');
 prompt += '\n';
 }
 prompt += '\n';
 }

 if (data.progressions.length > 0) {
 prompt += `EXERCISE PROGRESSIONS (exercises done 2+ times):\n`;
 for (const p of data.progressions) {
 const arrow = p.weightDelta > 0 ? '↑' : p.weightDelta < 0 ? '↓' : '→';
 prompt += `- ${p.name}: ${p.firstMax}→${p.lastMax}${data.weightUnit} (${arrow}${Math.abs(p.weightDelta)}), volume ${p.firstVol}→${p.lastVol} over ${p.sessions} sessions\n`;
 }
 prompt += '\n';
 }

 if (data.cardioDetails.length > 0) {
 prompt += `CARDIO LOG:\n`;
 for (const c of data.cardioDetails) {
 prompt += `- ${c.name}: ${c.duration}min${c.hr ? ', HR ' + c.hr + 'bpm' : ''}\n`;
 }
 prompt += '\n';
 }

 if (!isWeekly) {
 prompt += `For the monthly report, please also include:\n`;
 prompt += `- Overall training consistency analysis\n`;
 prompt += `- Muscle group balance observations\n`;
 prompt += `- Recovery and rehab compliance trends\n`;
 prompt += `- Specific strength progression highlights\n`;
 prompt += `- 3 prioritized recommendations for next month\n`;
 }

 return prompt;
}

function ProgressReports({ profile, history, settings, coachCfg, goToSettings }) {
 const [weeklyReport, setWeeklyReport] = useState( => LS.get(`report:weekly:${getWeekId}`, null));
 const [monthlyReport, setMonthlyReport] = useState( => LS.get(`report:monthly:${getMonthId}`, null));
 const [generating, setGenerating] = useState(null); // 'weekly' | 'monthly' | null
 const [error, setError] = useState(null);
 const [expandedReport, setExpandedReport] = useState(null); // 'weekly' | 'monthly' | null

 const cfg = coachCfg;
 const hasKey = !!(cfg.keys?.[cfg.provider]);

 const generateReport = async (type) => {
 if (!hasKey || generating) return;
 setGenerating(type);
 setError(null);

 try {
 const daysBack = type === 'weekly' ? 7 : 30;
 const data = buildReportData(history, daysBack, settings.weightUnit);

 if (data.workoutCount === 0 && data.rehabCount === 0 && data.cardioCount === 0) {
 setError(`No activity data found for the past ${daysBack} days.`);
 setGenerating(null);
 return;
 }

 const systemPrompt = buildFullSystemPrompt({
.cfg,
 systemPrompt: REPORT_SYSTEM_PROMPT,
 });
 const userPrompt = buildReportPrompt(type, data, profile, settings);

 const dispatcher = DISPATCH[cfg.provider];
 if (!dispatcher) throw new Error(`Unknown provider: ${cfg.provider}`);

 const overrideCfg = {.cfg, maxTokens: type === 'weekly' ? 400 : 800 };
 const result = await dispatcher(overrideCfg, systemPrompt, [{ role: 'user', content: userPrompt }]);

 const report = {
 text: result.text,
 generatedAt: new Date.toISOString,
 type,
 period: type === 'weekly' ? getWeekId : getMonthId,
 stats: { workouts: data.workoutCount, rehab: data.rehabCount, cardio: data.cardioCount, activeDays: data.totalActiveDays },
 };

 const key = type === 'weekly' ? `report:weekly:${getWeekId}` : `report:monthly:${getMonthId}`;
 LS.set(key, report);

 if (type === 'weekly') setWeeklyReport(report);
 else setMonthlyReport(report);

 setExpandedReport(type);
 } catch (e) {
 setError(e.message);
 }
 setGenerating(null);
 };

 const formatDate = (iso) => {
 if (!iso) return '';
 const d = new Date(iso);
 return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
 };

 const ReportCard = ({ report, type, label, icon }) => {
 const isExpanded = expandedReport === type;
 const hasReport = !!report;
 const isGenerating = generating === type;

 return (
 <div style={{
 background: T.bgCard, border: `1px solid ${hasReport ? 'rgba(78,205,196,0.15)' : T.border}`,
 borderRadius: T.radius, overflow: 'hidden', marginBottom: '10px', transition: 'all 0.3s',
 }}>
 {/* Header */}
 <div style={{
 display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 16px', cursor: 'pointer',
 }} onClick={ => hasReport && setExpandedReport(isExpanded ? null : type)}
 role={hasReport ? 'button' : undefined} tabIndex={hasReport ? 0 : undefined}
 aria-expanded={hasReport ? isExpanded : undefined}
 onKeyDown={(e) => { if (hasReport && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault; setExpandedReport(isExpanded ? null : type); } }}
 >
 <div style={{
 width: 36, height: 36, borderRadius: '10px',
 background: hasReport ? T.tealGlow : 'rgba(255,255,255,0.03)',
 display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
 }}>
 {icon}
 </div>
 <div style={{ flex: 1, minWidth: 0 }}>
 <div style={{ fontSize: '14px', fontWeight: 600, color: T.text }}>{label}</div>
 <div style={{ fontSize: '11px', color: T.text3, marginTop: '1px' }}>
 {hasReport
 ? `Generated ${formatDate(report.generatedAt)} · ${report.stats.workouts}W ${report.stats.rehab}R ${report.stats.cardio}C`
 : 'No report yet'
 }
 </div>
 </div>
 {hasReport ? (
 <ChevronDown size={16} color={T.text3} style={{ transform: isExpanded ? 'rotate(180deg)' : 'none', transition: '0.2s' }} />
 ) : (
 <button
 onClick={(e) => { e.stopPropagation; generateReport(type); }}
 disabled={!hasKey || isGenerating}
 style={{
 padding: '8px 14px', borderRadius: '10px', border: 'none', fontSize: '12px', fontWeight: 600,
 cursor: hasKey && !isGenerating ? 'pointer' : 'default',
 background: hasKey ? `linear-gradient(135deg, ${T.accent}, #FF8C42)` : 'rgba(255,255,255,0.04)',
 color: hasKey ? '#fff' : T.text3,
 display: 'flex', alignItems: 'center', gap: '6px',
 opacity: isGenerating ? 0.7 : 1, transition: 'all 0.2s',
 }}
 >
 {isGenerating ? <><Loader size={12} style={{ animation: 'pulse 1s infinite' }} /> Generating.</> : 'Generate'}
 </button>
 )}
 </div>

 {/* Expanded report content */}
 {isExpanded && report && (
 <div style={{ padding: '0 16px 16px', animation: 'fadeUp 0.2s ease-out' }}>
 <div style={{
 padding: '14px', background: 'rgba(255,255,255,0.02)', borderRadius: '10px',
 border: `1px solid ${T.border}`, fontSize: '13px', color: T.text2,
 lineHeight: 1.7, whiteSpace: 'pre-wrap',
 }}>
 {report.text}
 </div>
 <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
 <button
 onClick={ => generateReport(type)}
 disabled={!hasKey || isGenerating}
 style={{
 padding: '8px 14px', borderRadius: '8px', fontSize: '11px', fontWeight: 600,
 border: `1px solid ${T.border}`, background: 'rgba(255,255,255,0.03)',
 color: T.text2, cursor: hasKey ? 'pointer' : 'default',
 display: 'flex', alignItems: 'center', gap: '5px',
 }}
 >
 <RotateCcw size={12} /> {isGenerating ? 'Generating.' : 'Regenerate'}
 </button>
 </div>
 </div>
 )}
 </div>
 );
 };

 if (!settings.reportsEnabled) return null;

 return (
 <div style={{ marginTop: '20px' }}>
 <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
 <FileText size={16} color={T.teal} /> AI Progress Reports
 </h3>

 {!hasKey && (
 <GlassCard animate={false} style={{ padding: '14px', marginBottom: '12px', textAlign: 'center' }}>
 <div style={{ fontSize: '13px', color: T.text2, marginBottom: '8px' }}>
 Configure an AI provider to generate reports
 </div>
 <button onClick={ => goToSettings?.('coach')} style={{
 padding: '8px 16px', borderRadius: '10px', border: 'none',
 background: T.teal, color: '#07070E', fontWeight: 600, fontSize: '12px', cursor: 'pointer',
 }}>
 Set Up AI Provider
 </button>
 </GlassCard>
 )}

 <ReportCard
 report={weeklyReport} type="weekly" label="Weekly Report"
 icon={<Calendar size={18} color={weeklyReport ? T.teal : T.text3} />}
 />
 <ReportCard
 report={monthlyReport} type="monthly" label="Monthly Report"
 icon={<FileText size={18} color={monthlyReport ? T.teal : T.text3} />}
 />

 {error && (
 <div style={{
 padding: '10px 14px', borderRadius: '10px', fontSize: '12px',
 background: 'rgba(255,82,82,0.08)', border: '1px solid rgba(255,82,82,0.15)',
 color: T.danger, marginTop: '8px',
 }}>
 {error}
 </div>
 )}

 <button onClick={ => goToSettings?.('coach')} style={{
 width: '100%', padding: '8px', background: 'none', border: 'none',
 color: T.text3, fontSize: '11px', cursor: 'pointer', marginTop: '4px',
 }}>
 Reports use your AI Coach provider · Tap to configure
 </button>
 </div>
 );
}

// --- Collapsible Section ---

function CalibrationPointForm({ onAdd }) {
 const [show, setShow] = useState(false);
 const [date, setDate] = useState(today);
 const [bia, setBia] = useState('');
 const [dexa, setDexa] = useState('');
 
 if (!show) {
 return (
 <button onClick={ => setShow(true)} style={{
 display:'flex', alignItems:'center', gap:'6px', padding:'8px 12px',
 background:'rgba(255,255,255,0.04)', border:`1px solid ${T.border}`, borderRadius:'8px',
 color:T.text2, fontSize:'12px', cursor:'pointer', width:'100%',
 }}>
 <Plus size={14} /> Add calibration point
 </button>
 );
 }

 return (
 <div style={{ padding:'10px 12px', background:'rgba(255,255,255,0.03)', borderRadius:'8px',
 border:`1px solid ${T.border}`, animation:'fadeIn 0.2s ease-out' }}>
 <div style={{ display:'flex', gap:'8px', marginBottom:'8px' }}>
 <div style={{ flex:1 }}>
 <span style={{ fontSize:'10px', color:T.text3, display:'block', marginBottom:'2px' }}>Date</span>
 <input type="date" value={date} onChange={e => setDate(e.target.value)}
 aria-label="Calibration date"
 style={{ width:'100%', padding:'6px', background:'rgba(255,255,255,0.04)', border:`1px solid ${T.border}`,
 borderRadius:'6px', color:T.text, fontSize:'12px', outline:'none' }} />
 </div>
 <div style={{ flex:1 }}>
 <span style={{ fontSize:'10px', color:T.text3, display:'block', marginBottom:'2px' }}>BIA %</span>
 <input type="text" inputMode="decimal" value={bia} onChange={e => setBia(e.target.value)}
 placeholder="18.5" aria-label="BIA body fat percentage" style={{ width:'100%', padding:'6px', background:'rgba(255,255,255,0.04)',
 border:`1px solid ${T.border}`, borderRadius:'6px', color:T.text, fontSize:'12px',
 fontFamily:T.mono, outline:'none', boxSizing:'border-box' }} />
 </div>
 <div style={{ flex:1 }}>
 <span style={{ fontSize:'10px', color:T.text3, display:'block', marginBottom:'2px' }}>DEXA %</span>
 <input type="text" inputMode="decimal" value={dexa} onChange={e => setDexa(e.target.value)}
 placeholder="22.8" aria-label="DEXA body fat percentage" style={{ width:'100%', padding:'6px', background:'rgba(255,255,255,0.04)',
 border:`1px solid ${T.border}`, borderRadius:'6px', color:T.text, fontSize:'12px',
 fontFamily:T.mono, outline:'none', boxSizing:'border-box' }} />
 </div>
 </div>
 <div style={{ display:'flex', gap:'6px' }}>
 <button onClick={ => {
 if (bia && dexa) {
 onAdd({ date, biaValue: Number(bia), dexaValue: Number(dexa), weight: null });
 setBia(''); setDexa(''); setShow(false);
 }
 }} style={{
 flex:1, padding:'8px', background:T.accentSoft, border:'none', borderRadius:'6px',
 color:T.accent, fontWeight:600, fontSize:'12px', cursor:'pointer',
 }}>Add</button>
 <button onClick={ => setShow(false)} style={{
 padding:'8px 12px', background:'rgba(255,255,255,0.04)', border:`1px solid ${T.border}`,
 borderRadius:'6px', color:T.text3, fontSize:'12px', cursor:'pointer',
 }}>Cancel</button>
 </div>
 </div>
 );
}

function SettingsSection({ id, title, icon: Icon, children, sectionRef, defaultOpen = false, autoOpen = false }) {
 const [open, setOpen] = useState(defaultOpen || autoOpen);

 // Force open when deep-linked
 useEffect( => {
 if (autoOpen) setOpen(true);
 }, [autoOpen]);
 return (
 <div ref={sectionRef} style={{ marginBottom:'4px' }}>
 <button onClick={ => setOpen(!open)} aria-expanded={open} aria-controls={`settings-section-${id}`} style={{
 width:'100%', display:'flex', alignItems:'center', gap:'12px', padding:'14px 16px',
 background:T.bgCard, border:`1px solid ${T.border}`, borderRadius: open ? '14px 14px 0 0' : '14px',
 cursor:'pointer', transition:'all 0.2s',
 }}>
 <Icon size={18} color={T.teal} aria-hidden="true" />
 <span style={{ flex:1, textAlign:'left', fontSize:'14px', fontWeight:600, color:T.text }}>{title}</span>
 <ChevronDown size={16} color={T.text3} style={{ transform: open ? 'rotate(180deg)' : 'none', transition:'0.2s' }} aria-hidden="true" />
 </button>
 {open && (
 <div id={`settings-section-${id}`} role="region" aria-label={title} style={{ padding:'16px', background:T.bgCard, border:`1px solid ${T.border}`, borderTop:'none',
 borderRadius:'0 0 14px 14px', animation:'fadeIn 0.15s ease-out' }}>
 {children}
 </div>
 )}
 </div>
 );
}

// ============================================================
// PROGRAM OVERVIEW CARD
// ============================================================

function ProgramOverviewCard({ settings, profile }) {
 const daysPerWeek = settings.daysPerWeek || 3;
 const experienceLevel = settings.experienceLevel || 'beginner';
 const splitKey = selectSplit(daysPerWeek, experienceLevel);
 const template = SPLIT_TEMPLATES[splitKey];
 const [expandedDay, setExpandedDay] = useState(null);

 if (!template) return null;

 // Figure out which day was last trained to highlight the "next" day
 const recentKeys = LS.keys('workout:').sort((a, b) => b.localeCompare(a));
 let lastSplitDay = null;
 for (const key of recentKeys) {
 const raw = LS.get(key, null);
 const w = normalizeWorkout(raw);
 if (w?.splitDay) { lastSplitDay = w.splitDay; break; }
 }
 const lastIdx = lastSplitDay ? template.days.findIndex(d => d.name.toLowerCase.replace(/\s+/g, '_') === lastSplitDay) : -1;
 const nextIdx = lastIdx >= 0 ? (lastIdx + 1) % template.days.length : 0;

 // Slot display name mapping
 const slotLabels = {
 chest: 'Chest', back: 'Back', shoulders: 'Shoulders', quads: 'Quads',
 hamstrings: 'Hamstrings', glutes: 'Glutes', core: 'Core', calves: 'Calves',
 triceps: 'Triceps', biceps: 'Biceps', neck: 'Neck', rear_delts: 'Rear Delts',
 };

 // Get available exercises per slot (filtered by phase/location)
 const getExercisesForSlot = (slotName) => {
 return EXERCISES.filter(e => {
 if (e.category !== (slotName === 'rear_delts' ? 'shoulders' : slotName)) return false;
 const phaseData = e.phase?.[profile.phase];
 if (!phaseData || phaseData.s === 'avoid') return false;
 if (!e.location?.[profile.location]) return false;
 return true;
 });
 };

 return (
 <div style={{ marginTop:'12px' }}>
 <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'12px' }}>
 <div style={{ fontSize:'13px', fontWeight:700, color:T.text }}>{template.name}</div>
 <div style={{ fontSize:'11px', color:T.text3 }}>•</div>
 <div style={{ fontSize:'11px', color:T.text3 }}>{daysPerWeek} days/week</div>
 </div>
 {template.days.map((day, dayIdx) => {
 const isNext = dayIdx === nextIdx;
 const isExpanded = expandedDay === dayIdx;
 return (
 <div key={dayIdx} style={{
 marginBottom:'8px', borderRadius:'12px', overflow:'hidden',
 border: isNext ? `1px solid rgba(255,107,53,0.3)` : `1px solid ${T.border}`,
 background: isNext ? 'rgba(255,107,53,0.04)' : 'rgba(255,255,255,0.02)',
 }}>
 <button onClick={ => setExpandedDay(isExpanded ? null : dayIdx)} style={{
 width:'100%', display:'flex', alignItems:'center', gap:'10px', padding:'12px 14px',
 background:'none', border:'none', cursor:'pointer', textAlign:'left',
 }}>
 <div style={{
 width:28, height:28, borderRadius:'8px', display:'flex', alignItems:'center', justifyContent:'center',
 fontSize:'12px', fontWeight:700, fontFamily:T.mono,
 background: isNext ? T.accent : 'rgba(255,255,255,0.06)',
 color: isNext ? '#fff' : T.text3,
 }}>
 {dayIdx + 1}
 </div>
 <div style={{ flex:1 }}>
 <div style={{ fontSize:'13px', fontWeight:600, color:T.text }}>{day.name}</div>
 <div style={{ display:'flex', gap:'4px', flexWrap:'wrap', marginTop:'4px' }}>
 {day.slots.map(slot => (
 <span key={slot} style={{
 padding:'2px 7px', borderRadius:'5px', fontSize:'10px', fontWeight:500,
 background:'rgba(78,205,196,0.08)', color:T.teal,
 }}>
 {slotLabels[slot] || slot}
 </span>
 ))}
 </div>
 </div>
 {isNext && (
 <span style={{ fontSize:'10px', fontWeight:600, color:T.accent, textTransform:'uppercase', letterSpacing:'0.5px' }}>
 Next
 </span>
 )}
 <ChevronDown size={14} color={T.text3} style={{ transform: isExpanded ? 'rotate(180deg)' : 'none', transition:'0.2s' }} />
 </button>
 {isExpanded && (
 <div style={{ padding:'0 14px 14px', borderTop:`1px solid ${T.border}`, animation:'fadeIn 0.15s ease-out' }}>
 {day.slots.map(slot => {
 const exs = getExercisesForSlot(slot);
 return (
 <div key={slot} style={{ marginTop:'10px' }}>
 <div style={{ fontSize:'11px', fontWeight:600, color:T.text3, textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:'4px' }}>
 {slotLabels[slot] || slot} ({exs.length})
 </div>
 <div style={{ display:'flex', flexWrap:'wrap', gap:'4px' }}>
 {exs.slice(0, 8).map(ex => (
 <span key={ex.id} style={{
 padding:'3px 8px', borderRadius:'6px', fontSize:'11px',
 background:'rgba(255,255,255,0.04)', color:T.text2,
 border:`1px solid ${T.border}`,
 }}>
 {ex.name}
 </span>
 ))}
 {exs.length > 8 && (
 <span style={{ padding:'3px 8px', fontSize:'11px', color:T.text3 }}>
 +{exs.length - 8} more
 </span>
 )}
 {exs.length === 0 && (
 <span style={{ fontSize:'11px', color:T.text3, fontStyle:'italic' }}>No exercises available</span>
 )}
 </div>
 </div>
 );
 })}
 </div>
 )}
 </div>
 );
 })}
 </div>
 );
}

// --- Full Settings Tab ---

function SettingsTab({ settings, onUpdateSettings, profile, updateProfile, coachCfg, onUpdateCoachCfg, history, scrollToSection, nutritionConfig, onUpdateNutritionConfig, calibration, onUpdateCalibration }) {
 const trainingRef = useRef(null);
 const programmingRef = useRef(null);
 const unitsRef = useRef(null);
 const workoutRef = useRef(null);
 const recoveryRef = useRef(null);
 const bodyTrackingRef = useRef(null);
 const calibrationRef = useRef(null);
 const coachRef = useRef(null);
 const dataRef = useRef(null);

 const refs = { training: trainingRef, programming: programmingRef, units: unitsRef, workout: workoutRef, recovery: recoveryRef, bodyTracking: bodyTrackingRef, calibration: calibrationRef, coach: coachRef, data: dataRef };

 useEffect( => {
 if (scrollToSection && refs[scrollToSection]?.current) {
 setTimeout( => {
 refs[scrollToSection].current.scrollIntoView({ behavior:'smooth', block:'start' });
 }, 150);
 }
 }, [scrollToSection]);

 const upd = (key, val) => onUpdateSettings({.settings, [key]: val });
 const updCoach = (key, val) => onUpdateCoachCfg({.coachCfg, [key]: val });
 const setCoachKey = (prov, val) => onUpdateCoachCfg({.coachCfg, keys:{.coachCfg.keys, [prov]: val } });

 const coachProvider = PROVIDERS[coachCfg.provider] || PROVIDERS.anthropic;
 const currentModel = coachCfg.model === '__custom__'
 ? { id:'__custom__', label:'Other', cost:{in:0,out:0,cached:0} }
 : (coachProvider.models.find(m => m.id === coachCfg.model) || coachProvider.models[0]);

 const S = {
 label: { fontSize:'11px', fontWeight:600, color:T.text3, textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:'8px', display:'block' },
 input: { width:'100%', padding:'10px 12px', background:'rgba(255,255,255,0.04)', border:`1px solid ${T.border}`, borderRadius:'10px', color:T.text, fontSize:'13px', outline:'none', fontFamily:T.font },
 textarea: { width:'100%', padding:'10px 12px', background:'rgba(255,255,255,0.04)', border:`1px solid ${T.border}`, borderRadius:'10px', color:T.text, fontSize:'12px', outline:'none', fontFamily:T.mono, lineHeight:1.5, resize:'vertical', minHeight:'80px', boxSizing:'border-box' },
 pill: (active) => ({ padding:'10px 14px', borderRadius:'8px', border:'none', fontSize:'12px', fontWeight:600, cursor:'pointer', transition:'all 0.2s', background:active ? T.accent : 'rgba(255,255,255,0.04)', color:active ? '#fff' : T.text3, minHeight:'40px', display:'inline-flex', alignItems:'center' }),
 pillTeal: (active) => ({ padding:'10px 14px', borderRadius:'8px', border:'none', fontSize:'12px', fontWeight:600, cursor:'pointer', transition:'all 0.2s', background:active ? T.teal : 'rgba(255,255,255,0.04)', color:active ? '#07070E' : T.text3, minHeight:'40px', display:'inline-flex', alignItems:'center' }),
 toggle: (on) => ({ width:44, height:26, borderRadius:13, border:'none', cursor:'pointer', position:'relative', transition:'all 0.2s', background:on ? T.teal : 'rgba(255,255,255,0.1)', padding:'2px 0' }),
 toggleDot: (on) => ({ position:'absolute', top:3, left:on?24:3, width:20, height:20, borderRadius:10, background:'#fff', transition:'left 0.2s' }),
 row: { display:'flex', justifyContent:'space-between', alignItems:'center', padding:'8px 0' },
 rowBorder: { display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 0', borderBottom:`1px solid ${T.border}` },
 slider: { flex:1, marginLeft:'12px', accentColor:T.accent },
 val: { fontSize:'13px', fontFamily:T.mono, color:T.text, minWidth:'36px', textAlign:'right' },
 sub: { marginBottom:'16px' },
 };

 const [confirmReset, setConfirmReset] = useState(false);

 // Data management helpers
 const exportData = => {
 const data = {};
 const allKeys = LS.keys('');
 for (const k of allKeys) { data[k] = LS.get(k, null); }
 const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
 const url = URL.createObjectURL(blob);
 const a = document.createElement('a'); a.href = url; a.download = `neurorehab-backup-${today}.json`;
 a.click; URL.revokeObjectURL(url);
 };

 const importData = => {
 const input = document.createElement('input'); input.type = 'file'; input.accept = '.json';
 input.onchange = async (e) => {
 const file = e.target.files[0]; if (!file) return;
 if (file.size > 10 * 1024 * 1024) { alert('File too large. Maximum import size is 10MB.'); return; }
 try {
 const text = await file.text;
 const data = JSON.parse(text);

 // Schema validation: must be a plain object with string keys
 if (!data || typeof data !== 'object' || Array.isArray(data)) {
 throw new Error('Invalid format: expected a JSON object.');
 }

 // Validate critical keys if present
 if ('profile' in data && (data.profile === null || typeof data.profile !== 'object')) {
 throw new Error('Invalid profile data: expected a non-null object.');
 }
 if ('profile' in data) {
 const p = data.profile;
 // Ensure essential profile fields exist and are valid to prevent render crashes
 if (typeof p.xp !== 'number' || !isFinite(p.xp) || p.xp < 0) p.xp = 0;
 const validPhases = ['acute', 'subacute', 'maintenance'];
 if (!validPhases.includes(p.phase)) p.phase = 'acute';
 const validLocations = ['gym', 'home', 'work'];
 if (!validLocations.includes(p.location)) p.location = 'gym';
 if (typeof p.streak !== 'number' || !isFinite(p.streak) || p.streak < 0) p.streak = 0;
 if (!p.streaks || typeof p.streaks !== 'object') p.streaks = {};
 data.profile = p;
 }

 // Validate appSettings enum fields if present
 if ('appSettings' in data && data.appSettings && typeof data.appSettings === 'object') {
 const s = data.appSettings;
 const validUnits = ['lbs', 'kg'];
 if (!validUnits.includes(s.weightUnit)) s.weightUnit = 'lbs';
 const validGoals = ['strength', 'hypertrophy', 'endurance'];
 if (!validGoals.includes(s.trainingGoal)) s.trainingGoal = 'hypertrophy';
 const validLevels = ['beginner', 'intermediate', 'advanced'];
 if (!validLevels.includes(s.experienceLevel)) s.experienceLevel = 'beginner';
 if (typeof s.daysPerWeek !== 'number' || s.daysPerWeek < 2 || s.daysPerWeek > 6) s.daysPerWeek = 3;
 data.appSettings = s;
 }

 // Validate that history entries are arrays (not random strings)
 if ('history' in data && typeof data.history !== 'object') {
 throw new Error('Invalid history data: expected an object.');
 }

 // Validate workout entries are objects
 const workoutKeys = Object.keys(data).filter(k => k.startsWith('workout:'));
 for (const wk of workoutKeys) {
 if (data[wk] !== null && typeof data[wk] !== 'object') {
 throw new Error(`Invalid workout data for key "${wk}".`);
 }
 }

 // Validate bodyLog entries are objects
 const bodyLogKeys = Object.keys(data).filter(k => k.startsWith('bodyLog:'));
 for (const bk of bodyLogKeys) {
 if (data[bk] !== null && typeof data[bk] !== 'object') {
 throw new Error(`Invalid body log data for key "${bk}".`);
 }
 }

 // Confirm before overwriting
 const keyCount = Object.keys(data).length;
 if (!window.confirm(`Import ${keyCount} data entries? This will overwrite existing data.`)) return;

 Object.entries(data).forEach(([k, v]) => LS.set(k, v));
 window.location.reload;
 } catch(err) { alert('Failed to import: ' + err.message); }
 };
 input.click;
 };

 const clearAllData = => {
 try { if (_lsAvailable) localStorage.clear; } catch { /* ignore */ }
 Object.keys(_memoryStore).forEach(k => delete _memoryStore[k]);
 window.location.reload;
 };

 const storageUsed = ( => {
 try {
 if (_lsAvailable) { let t=0; for(let i=0;i<localStorage.length;i++){t+=(localStorage.getItem(localStorage.key(i))||'').length;} return (t/1024).toFixed(1); }
 let t=0; for(const v of Object.values(_memoryStore)) t+=(v||'').length; return (t/1024).toFixed(1);
 } catch { return '0.0'; }
 });

 return (
 <div style={{ animation:'fadeIn 0.3s ease-out', paddingBottom:'40px' }}>
 <h2 style={{ fontSize:'22px', fontWeight:700, marginBottom:'16px', letterSpacing:'-0.02em' }}>Settings</h2>

 {/* =============== TRAINING =============== */}
 <SettingsSection id="training" title="Training Profile" icon={Dumbbell} sectionRef={trainingRef}
 autoOpen={scrollToSection === 'training'}>
 <div style={S.sub}>
 <span style={S.label}>Rehab Phase</span>
 <div style={{ display:'flex', gap:'8px' }}>
 {['acute','subacute','maintenance'].map(p => (
 <button key={p} onClick={ => updateProfile({ phase: p })} style={S.pill(profile.phase === p)}>
 {p.charAt(0).toUpperCase + p.slice(1)}
 </button>
 ))}
 </div>
 </div>
 <div style={S.sub}>
 <span style={S.label}>Equipment / Location</span>
 <div style={{ display:'flex', gap:'8px' }}>
 {['gym','home','work'].map(l => (
 <button key={l} onClick={ => updateProfile({ location: l })} style={S.pillTeal(profile.location === l)}>
 {l.charAt(0).toUpperCase + l.slice(1)}
 </button>
 ))}
 </div>
 <div style={{ fontSize:'10px', color:T.text3, marginTop:'6px' }}>
 Changing phase or location regenerates your next workout.
 </div>
 </div>
 <div style={S.sub}>
 <span style={S.label}>Preferred Training Time</span>
 <div style={{ display:'flex', gap:'8px' }}>
 {['morning','afternoon','evening'].map(t => (
 <button key={t} onClick={ => upd('trainingTime', t)} style={S.pillTeal(settings.trainingTime === t)}>
 {t.charAt(0).toUpperCase + t.slice(1)}
 </button>
 ))}
 </div>
 <div style={{ fontSize:'10px', color:T.text3, marginTop:'6px' }}>
 AM exercise may be beneficial optimization.
 </div>
 </div>
 </SettingsSection>

 {/* =============== PROGRAMMING =============== */}
 <SettingsSection id="programming" title="Programming" icon={Target} sectionRef={programmingRef}
 autoOpen={scrollToSection === 'programming'}>
 <div style={S.sub}>
 <span style={S.label}>Days Per Week</span>
 <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
 <input type="range" min={2} max={6} value={settings.daysPerWeek || 3}
 onChange={e => upd('daysPerWeek', parseInt(e.target.value))}
 aria-label="Days per week" aria-valuetext={`${settings.daysPerWeek || 3} days`}
 style={S.slider} />
 <span style={S.val}>{settings.daysPerWeek || 3}</span>
 </div>
 <div style={{ fontSize: '10px', color: T.text3, marginTop: '4px' }}>
 Split: {SPLIT_TEMPLATES[selectSplit(settings.daysPerWeek || 3, settings.experienceLevel || 'beginner')]?.name || 'Full Body'}
 </div>
 </div>
 <div style={S.sub}>
 <span style={S.label}>Experience Level</span>
 <div style={{ display: 'flex', gap: '8px' }}>
 {['beginner', 'intermediate', 'advanced'].map(lvl => (
 <button key={lvl} onClick={ => upd('experienceLevel', lvl)}
 aria-pressed={(settings.experienceLevel || 'beginner') === lvl}
 style={S.pill((settings.experienceLevel || 'beginner') === lvl)}>
 {lvl.charAt(0).toUpperCase + lvl.slice(1)}
 </button>
 ))}
 </div>
 </div>
 <div style={S.sub}>
 <span style={S.label}>Training Goal</span>
 <div style={{ display: 'flex', gap: '8px' }}>
 {['strength', 'hypertrophy', 'endurance'].map(goal => (
 <button key={goal} onClick={ => upd('trainingGoal', goal)}
 aria-pressed={(settings.trainingGoal || 'hypertrophy') === goal}
 style={S.pillTeal((settings.trainingGoal || 'hypertrophy') === goal)}>
 {goal.charAt(0).toUpperCase + goal.slice(1)}
 </button>
 ))}
 </div>
 <div style={{ fontSize: '10px', color: T.text3, marginTop: '6px' }}>
 Affects prescribed rep ranges and rest periods.
 </div>
 </div>
 <div style={S.row}>
 <span style={{ fontSize: '13px', color: T.text2 }}>Progressive overload</span>
 <button onClick={ => upd('enableProgressiveOverload', !settings.enableProgressiveOverload)}
 role="switch" aria-checked={settings.enableProgressiveOverload !== false}
 style={S.toggle(settings.enableProgressiveOverload !== false)}>
 <div style={S.toggleDot(settings.enableProgressiveOverload !== false)} />
 </button>
 </div>
 <div style={{ fontSize: '10px', color: T.text3, marginTop: '-4px' }}>
 Auto-prescribe weight and reps based on your recent performance.
 </div>
 <ProgramOverviewCard settings={settings} profile={profile} />
 </SettingsSection>

 {/* =============== UNITS =============== */}
 <SettingsSection id="units" title="Units & Display" icon={Target} sectionRef={unitsRef}
 autoOpen={scrollToSection === 'units'}>
 <div style={S.sub}>
 <span style={S.label}>Weight Unit</span>
 <div style={{ display:'flex', gap:'8px' }}>
 {[{id:'lbs',label:'Pounds (lbs)'},{id:'kg',label:'Kilograms (kg)'}].map(u => (
 <button key={u.id} onClick={ => upd('weightUnit', u.id)} style={S.pill(settings.weightUnit === u.id)}>
 {u.label}
 </button>
 ))}
 </div>
 </div>
 <div>
 <span style={S.label}>First Day of Week</span>
 <div style={{ display:'flex', gap:'8px' }}>
 {[{id:0,label:'Sun'},{id:1,label:'Mon'},{id:6,label:'Sat'}].map(d => (
 <button key={d.id} onClick={ => upd('firstDayOfWeek', d.id)}
 style={S.pillTeal(settings.firstDayOfWeek === d.id)}>
 {d.label}
 </button>
 ))}
 </div>
 </div>
 </SettingsSection>

 {/* =============== WORKOUT =============== */}
 <SettingsSection id="workout" title="Workout Behavior" icon={Clock} sectionRef={workoutRef}
 autoOpen={scrollToSection === 'workout'}>
 <div style={S.row}>
 <span style={{ fontSize:'13px', color:T.text2 }}>Default rest timer</span>
 <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
 <input type="range" min="15" max="300" step="15" value={settings.defaultRestTimer}
 onChange={e => upd('defaultRestTimer', parseInt(e.target.value))} aria-label="Default rest timer" aria-valuetext={`${settings.defaultRestTimer} seconds`} style={S.slider} />
 <span style={S.val}>{settings.defaultRestTimer}s</span>
 </div>
 </div>
 <div style={S.rowBorder}>
 <span style={{ fontSize:'13px', color:T.text2 }}>Auto-start timer on set complete</span>
 <button onClick={ => upd('autoStartTimer', !settings.autoStartTimer)} role="switch" aria-checked={settings.autoStartTimer} style={S.toggle(settings.autoStartTimer)}>
 <div style={S.toggleDot(settings.autoStartTimer)} />
 </button>
 </div>
 <div style={S.rowBorder}>
 <span style={{ fontSize:'13px', color:T.text2 }}>Vibrate when rest timer ends</span>
 <button onClick={ => upd('timerVibrate', !settings.timerVibrate)} role="switch" aria-checked={settings.timerVibrate !== false} style={S.toggle(settings.timerVibrate !== false)}>
 <div style={S.toggleDot(settings.timerVibrate !== false)} />
 </button>
 </div>
 <div style={S.rowBorder}>
 <span style={{ fontSize:'13px', color:T.text2 }}>Keep screen awake during workout</span>
 <button onClick={ => upd('keepAwake', !settings.keepAwake)} role="switch" aria-checked={settings.keepAwake} style={S.toggle(settings.keepAwake)}>
 <div style={S.toggleDot(settings.keepAwake)} />
 </button>
 </div>
 <div style={S.rowBorder}>
 <span style={{ fontSize:'13px', color:T.text2 }}>Show RPE column</span>
 <button onClick={ => upd('showRPE', !settings.showRPE)} role="switch" aria-checked={settings.showRPE} style={S.toggle(settings.showRPE)}>
 <div style={S.toggleDot(settings.showRPE)} />
 </button>
 </div>
 <div style={S.row}>
 <span style={{ fontSize:'13px', color:T.text2 }}>Weight increment (upper)</span>
 <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
 <input type="range" min="1" max="20" step="0.5" value={settings.weightIncrementUpper}
 onChange={e => upd('weightIncrementUpper', parseFloat(e.target.value))} aria-label="Weight increment for upper body" aria-valuetext={`${settings.weightIncrementUpper} ${settings.weightUnit}`} style={S.slider} />
 <span style={S.val}>{settings.weightIncrementUpper}{settings.weightUnit}</span>
 </div>
 </div>
 <div style={S.row}>
 <span style={{ fontSize:'13px', color:T.text2 }}>Weight increment (lower)</span>
 <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
 <input type="range" min="1" max="20" step="0.5" value={settings.weightIncrementLower}
 onChange={e => upd('weightIncrementLower', parseFloat(e.target.value))} aria-label="Weight increment for lower body" aria-valuetext={`${settings.weightIncrementLower} ${settings.weightUnit}`} style={S.slider} />
 <span style={S.val}>{settings.weightIncrementLower}{settings.weightUnit}</span>
 </div>
 </div>
 <div style={S.rowBorder}>
 <span style={{ fontSize:'13px', color:T.text2 }}>Count warmup sets in stats</span>
 <button onClick={ => upd('countWarmupInStats', !settings.countWarmupInStats)} role="switch" aria-checked={settings.countWarmupInStats} style={S.toggle(settings.countWarmupInStats)}>
 <div style={S.toggleDot(settings.countWarmupInStats)} />
 </button>
 </div>
 </SettingsSection>

 {/* =============== RECOVERY =============== */}
 <SettingsSection id="recovery" title="Recovery & Programming" icon={Heart} sectionRef={recoveryRef}
 autoOpen={scrollToSection === 'recovery'}>
 <div style={S.row}>
 <span style={{ fontSize:'13px', color:T.text2 }}>Muscle recovery window</span>
 <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
 <input type="range" min="24" max="96" step="12" value={settings.recoveryWindow}
 onChange={e => upd('recoveryWindow', parseInt(e.target.value))} aria-label="Muscle recovery window" aria-valuetext={`${settings.recoveryWindow} hours`} style={S.slider} />
 <span style={S.val}>{settings.recoveryWindow}hr</span>
 </div>
 </div>
 <div style={{ fontSize:'10px', color:T.text3, marginBottom:'8px', marginTop:'-4px' }}>
 48hr minimum recommended (adjust based on recovery needs). Controls muscle map color thresholds.
 </div>
 <div style={S.row}>
 <span style={{ fontSize:'13px', color:T.text2 }}>Cardio sessions/week target</span>
 <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
 <input type="range" min="1" max="7" step="1" value={settings.cardioWeeklyTarget}
 onChange={e => upd('cardioWeeklyTarget', parseInt(e.target.value))} aria-label="Cardio sessions per week target" aria-valuetext={`${settings.cardioWeeklyTarget} sessions`} style={S.slider} />
 <span style={S.val}>{settings.cardioWeeklyTarget}</span>
 </div>
 </div>
 <div style={S.row}>
 <span style={{ fontSize:'13px', color:T.text2 }}>Max RPE cap</span>
 <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
 <input type="range" min="7" max="10" step="0.5" value={settings.maxRPE}
 onChange={e => upd('maxRPE', parseFloat(e.target.value))} aria-label="Maximum RPE cap" aria-valuetext={`RPE ${settings.maxRPE}`} style={S.slider} />
 <span style={S.val}>{settings.maxRPE}</span>
 </div>
 </div>
 <div style={{ fontSize:'10px', color:T.text3, marginBottom:'8px', marginTop:'-4px' }}>
 Consider avoiding RPE 10 / training to failure. Default cap: 9.
 </div>
 <div style={S.row}>
 <span style={{ fontSize:'13px', color:T.text2 }}>Zone 2 HR range (min)</span>
 <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
 <input type="range" min="90" max="160" step="5" value={settings.zone2HRMin}
 onChange={e => upd('zone2HRMin', parseInt(e.target.value))} aria-label="Zone 2 heart rate minimum" aria-valuetext={`${settings.zone2HRMin} BPM`} style={S.slider} />
 <span style={S.val}>{settings.zone2HRMin}</span>
 </div>
 </div>
 <div style={S.row}>
 <span style={{ fontSize:'13px', color:T.text2 }}>Zone 2 HR range (max)</span>
 <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
 <input type="range" min="100" max="180" step="5" value={settings.zone2HRMax}
 onChange={e => upd('zone2HRMax', parseInt(e.target.value))} aria-label="Zone 2 heart rate maximum" aria-valuetext={`${settings.zone2HRMax} BPM`} style={S.slider} />
 <span style={S.val}>{settings.zone2HRMax}</span>
 </div>
 </div>
 {/* Body measurements */}
 <div style={{ borderTop:`1px solid ${T.border}`, paddingTop:'12px', marginTop:'8px' }}>
 <span style={S.label}>Body Measurements</span>
 <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px' }}>
 <div>
 <div style={{ fontSize:'10px', color:T.text3, marginBottom:'4px' }}>Body Weight</div>
 <div style={{ display:'flex', alignItems:'center', gap:'4px' }}>
 <input type="number" inputMode="decimal" value={settings.bodyWeight} placeholder="—"
 onChange={e => upd('bodyWeight', e.target.value)}
 aria-label={`Body weight (${settings.weightUnit})`}
 style={{.S.input, textAlign:'center', padding:'8px' }} />
 <span style={{ fontSize:'11px', color:T.text3 }}>{settings.weightUnit}</span>
 </div>
 </div>
 <div>
 <div style={{ fontSize:'10px', color:T.text3, marginBottom:'4px' }}>Body Fat</div>
 <div style={{ display:'flex', alignItems:'center', gap:'4px' }}>
 <input type="number" inputMode="decimal" value={settings.bodyFatPct} placeholder="—"
 onChange={e => upd('bodyFatPct', e.target.value)}
 aria-label="Body fat percentage"
 style={{.S.input, textAlign:'center', padding:'8px' }} />
 <span style={{ fontSize:'11px', color:T.text3 }}>%</span>
 </div>
 </div>
 </div>
 </div>
 </SettingsSection>

 {/* =============== AI COACH =============== */}
 <SettingsSection id="coach" title="AI Coach" icon={MessageCircle} sectionRef={coachRef}
 autoOpen={scrollToSection === 'coach'}>
 {/* Enable/disable toggle */}
 <div style={{.S.rowBorder, paddingTop:0 }}>
 <div>
 <span style={{ fontSize:'14px', fontWeight:600, color:T.text }}>Enable AI Coach</span>
 <div style={{ fontSize:'10px', color:T.text3, marginTop:'2px' }}>
 {settings.coachEnabled ? 'Coach tab visible in bottom nav' : 'Coach tab hidden — enable to use'}
 </div>
 </div>
 <button onClick={ => upd('coachEnabled', !settings.coachEnabled)} role="switch" aria-checked={settings.coachEnabled} style={S.toggle(settings.coachEnabled)}>
 <div style={S.toggleDot(settings.coachEnabled)} />
 </button>
 </div>

 {/* Progress Reports toggle */}
 <div style={{.S.rowBorder }}>
 <div>
 <span style={{ fontSize:'14px', fontWeight:600, color:T.text }}>Progress Reports</span>
 <div style={{ fontSize:'10px', color:T.text3, marginTop:'2px' }}>
 {settings.reportsEnabled
 ? 'Weekly & monthly AI reports in Progress tab'
 : 'Reports hidden — enable to generate'}
 </div>
 </div>
 <button onClick={ => upd('reportsEnabled', !settings.reportsEnabled)} role="switch" aria-checked={settings.reportsEnabled} style={S.toggle(settings.reportsEnabled)}>
 <div style={S.toggleDot(settings.reportsEnabled)} />
 </button>
 </div>

 {settings.coachEnabled && (<>
 {/* Provider */}
 <div style={{.S.sub, marginTop:'12px' }}>
 <span style={S.label}>Provider</span>
 <div style={{ display:'flex', gap:'8px', flexWrap:'wrap' }}>
 {Object.entries(PROVIDERS).map(([key, prov]) => (
 <button key={key} onClick={ => {
 const firstModel = PROVIDERS[key].models[0].id;
 onUpdateCoachCfg({.coachCfg, provider:key, model:firstModel });
 }} style={S.pill(coachCfg.provider === key)}>
 {prov.name}
 </button>
 ))}
 </div>
 </div>
 {/* API Key */}
 <div style={S.sub}>
 <span style={S.label}>{coachProvider.name} API Key</span>
 <input type="password" value={coachCfg.keys[coachCfg.provider] || ''} placeholder={coachProvider.keyPlaceholder}
 onChange={e => setCoachKey(coachCfg.provider, e.target.value)} aria-label={`${coachProvider.name} API key`} style={S.input} />
 <div style={{ fontSize:'10px', color:T.text3, marginTop:'4px' }}>
 Stored locally. Sent only to {coachProvider.name}.
 </div>
 {/* Other keys indicator */}
 {Object.entries(PROVIDERS).filter(([k]) => k !== coachCfg.provider && coachCfg.keys[k]).map(([key, prov]) => (
 <div key={key} style={{ fontSize:'10px', color:T.success, marginTop:'4px' }}>✓ {prov.name} key saved</div>
 ))}
 </div>
 {/* Model */}
 <div style={S.sub}>
 <span style={S.label}>Model</span>
 <div style={{ display:'flex', gap:'6px', flexWrap:'wrap' }}>
 {coachProvider.models.map(m => (
 <button key={m.id} onClick={ => updCoach('model', m.id)}
 style={{.S.pill(coachCfg.model === m.id), fontSize:'11px', padding:'5px 10px' }}>
 {m.label}
 {m.id !== '__custom__' && (
 <span style={{ fontSize:'9px', opacity:0.6, marginLeft:'4px' }}>
 ${m.cost.in}/{m.cost.out}
 </span>
 )}
 </button>
 ))}
 </div>
 {/* Custom model input for OpenRouter "Other" */}
 {coachCfg.model === '__custom__' && (
 <div style={{ marginTop:'8px' }}>
 <input type="text" value={coachCfg.customModel || ''} placeholder="org/model-name (e.g. mistralai/mistral-large)"
 onChange={e => updCoach('customModel', e.target.value)}
 aria-label="Custom model ID"
 style={{.S.input, fontFamily:T.mono, fontSize:'12px' }} />
 <div style={{ fontSize:'10px', color:T.text3, marginTop:'4px' }}>
 Enter any model ID from <span style={{ color:T.teal }}>openrouter.ai/models</span>
 </div>
 </div>
 )}
 {coachCfg.model !== '__custom__' && (
 <div style={{ fontSize:'10px', color:T.text3, marginTop:'4px' }}>$/Mtok input/output</div>
 )}
 </div>
 {/* Generation */}
 <div style={S.sub}>
 <span style={S.label}>Generation</span>
 <div style={S.row}>
 <span style={{ fontSize:'13px', color:T.text2 }}>Max tokens</span>
 <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
 <input type="range" min="50" max="16000" step="50"
 value={Math.min(coachCfg.maxTokens, 16000)}
 onChange={e => updCoach('maxTokens', parseInt(e.target.value))} aria-label="Max tokens" aria-valuetext={`${coachCfg.maxTokens} tokens`} style={S.slider} />
 <input type="number" inputMode="numeric" value={coachCfg.maxTokens}
 onChange={e => { const v = parseInt(e.target.value); if (!isNaN(v) && v > 0) updCoach('maxTokens', v); }}
 aria-label="Max tokens value"
 style={{ width:'64px', padding:'4px 6px', background:'rgba(255,255,255,0.04)', border:`1px solid ${T.border}`,
 borderRadius:'6px', color:T.text, fontSize:'12px', fontFamily:T.mono, textAlign:'center', outline:'none' }} />
 </div>
 </div>
 <div style={S.row}>
 <span style={{ fontSize:'13px', color:T.text2 }}>Temperature</span>
 <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
 <input type="range" min="0" max="1" step="0.05" value={coachCfg.temperature}
 onChange={e => updCoach('temperature', parseFloat(e.target.value))} style={S.slider} />
 <span style={S.val}>{coachCfg.temperature}</span>
 </div>
 </div>
 <div style={S.row}>
 <span style={{ fontSize:'13px', color:T.text2 }}>History exchanges</span>
 <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
 <input type="range" min="1" max="50" step="1"
 value={Math.min(coachCfg.maxHistory, 50)}
 onChange={e => updCoach('maxHistory', parseInt(e.target.value))} style={S.slider} />
 <input type="number" inputMode="numeric" value={coachCfg.maxHistory}
 onChange={e => { const v = parseInt(e.target.value); if (!isNaN(v) && v > 0) updCoach('maxHistory', v); }}
 style={{ width:'52px', padding:'4px 6px', background:'rgba(255,255,255,0.04)', border:`1px solid ${T.border}`,
 borderRadius:'6px', color:T.text, fontSize:'12px', fontFamily:T.mono, textAlign:'center', outline:'none' }} />
 </div>
 </div>
 </div>
 {/* Context toggles */}
 <div style={S.sub}>
 <span style={S.label}>Context Sent Each Message</span>
 {[
 ['includePatientProfile', 'Patient profile (diagnoses, genetics)'],
 ['includeSessionContext', 'Session state (phase, XP, streak)'],
 ['includeCurrentWorkout', 'Current workout (logged sets)'],
 ['includeRecentActivity', 'Recent activity (7-day summary)'],
 ['includeBodyMetrics', 'Body metrics (weight, TDEE, intake, BF%)'],
 ].map(([key, label]) => (
 <div key={key} style={S.rowBorder}>
 <span style={{ fontSize:'13px', color:T.text2, flex:1 }}>{label}</span>
 <button onClick={ => updCoach(key, !coachCfg[key])} role="switch" aria-checked={coachCfg[key]} style={S.toggle(coachCfg[key])}>
 <div style={S.toggleDot(coachCfg[key])} />
 </button>
 </div>
 ))}
 </div>
 {/* System prompt */}
 <div style={S.sub}>
 <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'8px' }}>
 <span style={{.S.label, marginBottom:0 }}>System Prompt</span>
 <span style={{ fontSize:'10px', color:T.text3, fontFamily:T.mono }}>~{estimateTokens(coachCfg.systemPrompt)} tok</span>
 </div>
 <textarea value={coachCfg.systemPrompt} onChange={e => updCoach('systemPrompt', e.target.value)}
 rows={4} style={S.textarea} />
 <button onClick={ => updCoach('systemPrompt', DEFAULT_SYSTEM_PROMPT)}
 style={{ fontSize:'11px', color:T.teal, background:'none', border:'none', cursor:'pointer', marginTop:'4px', padding:0 }}>
 Reset to default
 </button>
 </div>
 {/* Patient profile */}
 <div style={S.sub}>
 <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'8px' }}>
 <span style={{.S.label, marginBottom:0 }}>Patient Profile</span>
 <span style={{ fontSize:'10px', color:T.text3, fontFamily:T.mono }}>~{estimateTokens(coachCfg.patientProfile)} tok</span>
 </div>
 <textarea value={coachCfg.patientProfile} onChange={e => updCoach('patientProfile', e.target.value)}
 rows={6} style={{.S.textarea, minHeight:'120px' }} />
 <button onClick={ => updCoach('patientProfile', DEFAULT_PATIENT_PROFILE)}
 style={{ fontSize:'11px', color:T.teal, background:'none', border:'none', cursor:'pointer', marginTop:'4px', padding:0 }}>
 Reset to default
 </button>
 </div>
 {/* Cost estimate */}
 <div style={{ padding:'10px 12px', background:'rgba(255,255,255,0.02)', borderRadius:'10px' }}>
 <div style={{ fontSize:'10px', color:T.text3, marginBottom:'4px', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.5px' }}>
 Estimated Per-Message Cost
 </div>
 <div style={{ fontSize:'12px', color:T.text2, lineHeight:1.6 }}>
 System+profile: ~{estimateTokens(buildFullSystemPrompt(coachCfg))} tok ·
 Model: {currentModel.label}{currentModel.id !== '__custom__' ? ` ($${currentModel.cost.in}/${currentModel.cost.out}/Mtok)` : ` (${coachCfg.customModel || 'not set'})`}
 </div>
 </div>
 </>)}
 </SettingsSection>

 {/* =============== BODY TRACKING =============== */}
 <SettingsSection id="bodyTracking" title="Body Tracking" icon={Scale} sectionRef={bodyTrackingRef}
 autoOpen={scrollToSection === 'bodyTracking'}>
 
 {/* Units */}
 <div style={S.sub}>
 <span style={S.label}>Units</span>
 <div style={{ display:'flex', gap:'12px', flexWrap:'wrap' }}>
 <div style={{ flex:1, minWidth:'100px' }}>
 <span style={{ fontSize:'11px', color:T.text3, display:'block', marginBottom:'4px' }}>Weight</span>
 <div style={{ display:'flex', gap:'4px' }}>
 {['lbs','kg'].map(u => (
 <button key={u} onClick={ => upd('weightUnit', u)} style={S.pill(settings.weightUnit === u)}>{u}</button>
 ))}
 </div>
 </div>
 <div style={{ flex:1, minWidth:'100px' }}>
 <span style={{ fontSize:'11px', color:T.text3, display:'block', marginBottom:'4px' }}>Waist</span>
 <div style={{ display:'flex', gap:'4px' }}>
 {['in','cm'].map(u => (
 <button key={u} onClick={ => onUpdateNutritionConfig({.nutritionConfig, waistUnit: u })}
 style={S.pill(nutritionConfig.waistUnit === u)}>{u}</button>
 ))}
 </div>
 </div>
 </div>
 {/* Height (for waist-to-height ratio) */}
 <div style={{ marginTop: '10px' }}>
 <span style={{ fontSize:'11px', color:T.text3, display:'block', marginBottom:'4px' }}>
 Height {settings.weightUnit === 'kg' ? '(cm)' : '(inches)'} — used for waist-to-height ratio
 </span>
 <input type="text" inputMode="numeric" value={settings.heightInches || ''}
 onChange={e => upd('heightInches', e.target.value ? Number(e.target.value) : '')}
 placeholder={settings.weightUnit === 'kg' ? 'e.g. 178' : 'e.g. 70'}
 style={{
 width: '100px', padding: '6px 10px', background: 'rgba(255,255,255,0.04)',
 border: `1px solid ${T.border}`, borderRadius: '8px', color: T.text,
 fontSize: '13px', fontFamily: T.mono, outline: 'none',
 }} />
 </div>
 </div>

 {/* Weight Smoothing */}
 <div style={S.sub}>
 <span style={S.label}>Weight Smoothing Algorithm</span>
 {[
 { key:'ewma', label:'Exponential (20-day EWMA)', desc:'Best for TDEE calculation' },
 { key:'bidirectional', label:'Bidirectional smoothing', desc:'Psychologically motivating' },
 { key:'timeadaptive', label:'Time-adaptive EMA', desc:'Great for irregular weigh-ins' },
 ].map(m => (
 <div key={m.key} style={{ display:'flex', alignItems:'flex-start', gap:'10px', padding:'6px 0',
 cursor:'pointer' }} onClick={ => onUpdateNutritionConfig({.nutritionConfig, smoothingMethod: m.key })}>
 <div style={{
 width:18, height:18, borderRadius:'50%', border:`2px solid ${nutritionConfig.smoothingMethod === m.key ? T.accent : T.text3}`,
 display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, marginTop:'1px',
 }}>
 {nutritionConfig.smoothingMethod === m.key && (
 <div style={{ width:10, height:10, borderRadius:'50%', background:T.accent }} />
 )}
 </div>
 <div>
 <div style={{ fontSize:'13px', fontWeight:nutritionConfig.smoothingMethod === m.key ? 600 : 400,
 color: nutritionConfig.smoothingMethod === m.key ? T.text : T.text2 }}>{m.label}</div>
 <div style={{ fontSize:'11px', color:T.text3 }}>{m.desc}</div>
 </div>
 </div>
 ))}
 {nutritionConfig.smoothingMethod === 'timeadaptive' && (
 <div style={{ display:'flex', alignItems:'center', gap:'10px', padding:'8px 0 0 28px' }}>
 <span style={{ fontSize:'12px', color:T.text2 }}>Smoothing days:</span>
 <input type="range" min={2} max={90} value={nutritionConfig.adaptiveSmoothingDays || 7}
 onChange={e => onUpdateNutritionConfig({.nutritionConfig, adaptiveSmoothingDays: Number(e.target.value) })}
 style={{ flex:1, accentColor:T.accent }} />
 <span style={S.val}>{nutritionConfig.adaptiveSmoothingDays || 7}</span>
 </div>
 )}
 </div>

 {/* Nutrition Goal */}
 <div style={S.sub}>
 <span style={S.label}>Nutrition Goal</span>
 <div style={{ display:'flex', gap:'6px', marginBottom:'10px' }}>
 {[{ key:'lose', label:'Lose' },{ key:'maintain', label:'Maintain' },{ key:'gain', label:'Gain' }].map(g => (
 <button key={g.key} onClick={ => onUpdateNutritionConfig({.nutritionConfig, goal: g.key })}
 style={S.pill(nutritionConfig.goal === g.key)}>{g.label}</button>
 ))}
 </div>
 {nutritionConfig.goal !== 'maintain' && (
 <div style={{ marginBottom:'10px' }}>
 <span style={{ fontSize:'11px', color:T.text3, display:'block', marginBottom:'4px' }}>
 Rate: {nutritionConfig.weeklyRatePercent || 0.5}% / week
 </span>
 <div style={{ display:'flex', gap:'4px' }}>
 {[0.25, 0.5, 0.75, 1.0].map(r => (
 <button key={r} onClick={ => onUpdateNutritionConfig({.nutritionConfig, weeklyRatePercent: r })}
 style={S.pill(nutritionConfig.weeklyRatePercent === r)}>{r}%</button>
 ))}
 </div>
 </div>
 )}
 <div style={S.rowBorder}>
 <span style={{ fontSize:'13px', color:T.text2 }}>Daily calorie target</span>
 <div style={{ display:'flex', alignItems:'center', gap:'6px' }}>
 <input type="text" inputMode="numeric" value={nutritionConfig.dailyCalorieTarget || ''}
 onChange={e => onUpdateNutritionConfig({.nutritionConfig, dailyCalorieTarget: Number(e.target.value) || 0 })}
 style={{.S.input, width:'80px', textAlign:'right', fontFamily:T.mono }} />
 <span style={{ fontSize:'12px', color:T.text3 }}>kcal</span>
 </div>
 </div>
 <div style={S.rowBorder}>
 <span style={{ fontSize:'13px', color:T.text2 }}>Daily protein target</span>
 <div style={{ display:'flex', alignItems:'center', gap:'6px' }}>
 <input type="text" inputMode="numeric" value={nutritionConfig.dailyProteinTarget || ''}
 onChange={e => onUpdateNutritionConfig({.nutritionConfig, dailyProteinTarget: Number(e.target.value) || 0 })}
 style={{.S.input, width:'60px', textAlign:'right', fontFamily:T.mono }} />
 <span style={{ fontSize:'12px', color:T.text3 }}>g</span>
 </div>
 </div>
 </div>

 {/* Weekly Calorie Budget — Day Multipliers */}
 <div style={S.sub}>
 <span style={S.label}>Weekly Calorie Budget</span>
 <div style={{ fontSize:'11px', color:T.text3, marginBottom:'8px' }}>
 Adjust per-day calories. Higher on training/weekend days. Weekly total stays constant.
 </div>
 {['mon','tue','wed','thu','fri','sat','sun'].map(day => {
 const mult = nutritionConfig.dayMultipliers?.[day] ?? 1.0;
 const dayCals = Math.round((nutritionConfig.dailyCalorieTarget || 2200) * mult);
 return (
 <div key={day} style={{ display:'flex', alignItems:'center', gap:'8px', padding:'4px 0' }}>
 <span style={{ fontSize:'12px', color:T.text2, width:'30px', textTransform:'capitalize' }}>{day}</span>
 <input type="range" min={0.7} max={1.4} step={0.05} value={mult}
 onChange={e => {
 const newMult = Number(e.target.value);
 const mults = {.(nutritionConfig.dayMultipliers || {mon:1,tue:1,wed:1,thu:1,fri:1,sat:1,sun:1}) };
 const oldMult = mults[day];
 mults[day] = newMult;
 // Rebalance other days to keep sum = 7
 const otherDays = Object.keys(mults).filter(d => d !== day);
 const otherSum = otherDays.reduce((a, d) => a + mults[d], 0);
 const targetOtherSum = 7 - newMult;
 if (otherSum > 0 && targetOtherSum > 0) {
 const scale = targetOtherSum / otherSum;
 otherDays.forEach(d => {
 mults[d] = Math.max(0.5, Math.round(mults[d] * scale * 100) / 100);
 });
 // Correct rounding drift: adjust largest multiplier day
 const currentSum = Object.values(mults).reduce((a, v) => a + v, 0);
 const drift = 7 - currentSum;
 if (Math.abs(drift) > 0.01) {
 const largestOther = otherDays.reduce((best, d) => mults[d] > mults[best] ? d : best, otherDays[0]);
 mults[largestOther] = Math.max(0.5, Math.round((mults[largestOther] + drift) * 100) / 100);
 }
 }
 onUpdateNutritionConfig({.nutritionConfig, dayMultipliers: mults });
 }}
 style={{ flex:1, accentColor:T.accent }} />
 <span style={{ fontSize:'12px', fontFamily:T.mono, color:T.text, width:'55px', textAlign:'right' }}>
 {dayCals.toLocaleString}
 </span>
 </div>
 );
 })}
 <div style={{ fontSize:'11px', color:T.text3, textAlign:'right', padding:'4px 0' }}>
 Weekly: {Math.round((nutritionConfig.dailyCalorieTarget || 2200) * 7).toLocaleString} kcal
 </div>
 </div>

 {/* Adaptive TDEE */}
 <div style={S.sub}>
 <span style={S.label}>Adaptive TDEE</span>
 <div style={S.row}>
 <span style={{ fontSize:'13px', color:T.text2 }}>Current estimate</span>
 <span style={{ fontSize:'14px', fontFamily:T.mono, fontWeight:600, color:T.accent }}>
 {(nutritionConfig.estimatedTDEE || 2500).toLocaleString} kcal/day
 </span>
 </div>
 <div style={S.row}>
 <span style={{ fontSize:'13px', color:T.text2 }}>Confidence</span>
 <span style={{ fontSize:'13px', color:
 nutritionConfig.tdeeConfidence === 'high' ? T.teal :
 nutritionConfig.tdeeConfidence === 'medium' ? T.warn : T.text3 }}>
 {(nutritionConfig.tdeeConfidence || 'low').charAt(0).toUpperCase + (nutritionConfig.tdeeConfidence || 'low').slice(1)}
 {' '}
 {nutritionConfig.tdeeConfidence === 'high' ? '●●●●●' :
 nutritionConfig.tdeeConfidence === 'medium' ? '●●●○○' : '●○○○○'}
 </span>
 </div>
 <button onClick={ => {
 onUpdateNutritionConfig({.nutritionConfig, estimatedTDEE: nutritionConfig.initialTDEE || 2500, tdeeConfidence: 'low', tdeeHistory: [] });
 }} style={{
 marginTop:'8px', padding:'8px 14px', background:'rgba(255,255,255,0.04)',
 border:`1px solid ${T.border}`, borderRadius:'8px', color:T.text2, fontSize:'12px', cursor:'pointer',
 }}>
 Reset TDEE estimate
 </button>
 </div>
 </SettingsSection>

 {/* =============== CALIBRATION =============== */}
 <SettingsSection id="calibration" title="Body Composition Calibration" icon={Target} sectionRef={calibrationRef}
 autoOpen={scrollToSection === 'calibration'}>
 
 {/* Device */}
 <div style={S.sub}>
 <span style={S.label}>Scale Device</span>
 <input type="text" value={calibration.deviceId || ''} placeholder="e.g. "
 onChange={e => onUpdateCalibration({.calibration, deviceId: e.target.value })}
 style={S.input} />
 </div>

 {/* Calibration Method */}
 <div style={S.sub}>
 <span style={S.label}>Calibration Method</span>
 {[
 { key:'simple_offset', label:'Simple offset', req:1 },
 { key:'linear_regression', label:'Linear regression', req:2 },
 { key:'rolling_weighted', label:'Rolling weighted avg', req:2 },
 { key:'bayesian', label:'Bayesian', req:1 },
 ].map(m => {
 const locked = (calibration.points?.length || 0) < m.req;
 return (
 <div key={m.key} style={{ display:'flex', alignItems:'center', gap:'10px', padding:'6px 0',
 cursor: locked ? 'default' : 'pointer', opacity: locked ? 0.4 : 1,
 }} onClick={ => !locked && onUpdateCalibration(recalcCalibration({.calibration, method: m.key }))}>
 <div style={{
 width:18, height:18, borderRadius:'50%', border:`2px solid ${calibration.method === m.key && !locked ? T.accent : T.text3}`,
 display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0,
 }}>
 {calibration.method === m.key && !locked && (
 <div style={{ width:10, height:10, borderRadius:'50%', background:T.accent }} />
 )}
 </div>
 <span style={{ fontSize:'13px', color: locked ? T.text3 : T.text2 }}>{m.label}</span>
 {locked && <Lock size={12} color={T.text3} />}
 {locked && <span style={{ fontSize:'10px', color:T.text3 }}>({m.req}+ DEXA)</span>}
 </div>
 );
 })}
 </div>

 {/* Calibration Points */}
 <div style={S.sub}>
 <span style={S.label}>Calibration Points</span>
 {(calibration.points || []).map((pt, i) => (
 <div key={i} style={{
 padding:'8px 12px', background:'rgba(255,255,255,0.03)', borderRadius:'8px',
 border:`1px solid ${T.border}`, marginBottom:'6px', fontSize:'12px',
 }}>
 <div style={{ display:'flex', justifyContent:'space-between', color:T.text2 }}>
 <span>{pt.date}</span>
 <button onClick={ => {
 const pts = [.(calibration.points || [])];
 pts.splice(i, 1);
 onUpdateCalibration(recalcCalibration({.calibration, points: pts }));
 }} style={{ background:'none', border:'none', cursor:'pointer', padding:'10px',
 minWidth:'44px', minHeight:'44px', display:'flex', alignItems:'center', justifyContent:'center' }}>
 <X size={14} color={T.text3} />
 </button>
 </div>
 <div style={{ display:'flex', gap:'12px', marginTop:'4px', fontFamily:T.mono }}>
 <span>BIA: <span style={{ color:T.text }}>{pt.biaValue}%</span></span>
 <span>DEXA: <span style={{ color:T.teal }}>{pt.dexaValue}%</span></span>
 <span style={{ color:T.text3 }}>Offset: +{(pt.dexaValue - pt.biaValue).toFixed(1)}%</span>
 </div>
 </div>
 ))}

 {/* Add calibration point form */}
 <CalibrationPointForm onAdd={(pt) => {
 const pts = [.(calibration.points || []), pt];
 pts.sort((a, b) => a.date.localeCompare(b.date));
 onUpdateCalibration(recalcCalibration({.calibration, points: pts }));
 }} />
 </div>

 {/* Active Model Display */}
 {(calibration.points?.length || 0) > 0 && (
 <div style={S.sub}>
 <span style={S.label}>Active Model</span>
 <div style={{ padding:'10px 12px', background:'rgba(78,205,196,0.04)', borderRadius:'8px',
 border:`1px solid rgba(78,205,196,0.1)`, fontSize:'12px' }}>
 <div style={{ color:T.text2, marginBottom:'4px' }}>
 Method: <span style={{ color:T.text, fontWeight:600 }}>{calibration.method?.replace(/_/g, ' ')}</span>
 </div>
 <div style={{ color:T.text2, marginBottom:'4px', fontFamily:T.mono }}>
 {calibration.method === 'simple_offset' && `BF% = BIA + ${calibration.offset || 0}%`}
 {calibration.method === 'linear_regression' && calibration.slope != null && `BF% = ${calibration.intercept} + ${calibration.slope} × BIA (R²=${calibration.rSquared})`}
 {calibration.method === 'linear_regression' && calibration.slope == null && `BF% = BIA + ${calibration.offset || 0}% (fallback)`}
 {calibration.method === 'rolling_weighted' && `BF% = BIA + ${calibration.ewmaOffset || calibration.offset || 0}%`}
 {calibration.method === 'bayesian' && calibration.posterior?.mean != null && `BF% = BIA + ${calibration.posterior.mean}% (posterior)`}
 </div>
 <div style={{ color:T.text3 }}>
 Last calibrated: {calibration.lastCalibrationDate || 'never'}
 </div>
 </div>
 </div>
 )}

 {/* Staleness warning */}
 {calibration.lastCalibrationDate && ( => {
 const daysSince = Math.floor((Date.now - new Date(calibration.lastCalibrationDate + 'T12:00:00').getTime) / 86400000);
 return daysSince > (calibration.stalenessWarningDays || 180) ? (
 <div style={{ padding:'8px 12px', background:T.warnSoft, borderRadius:'8px',
 border:`1px solid rgba(255,183,77,0.2)`, fontSize:'12px', color:T.warn }}>
 <AlertTriangle size={14} style={{ verticalAlign:'middle', marginRight:'6px' }} />
 Last calibration was {daysSince} days ago. Consider getting a new DEXA scan.
 </div>
 ) : null;
 })}
 </SettingsSection>

 {/* =============== DATA =============== */}
 <SettingsSection id="data" title="Data Management" icon={Database} sectionRef={dataRef}
 autoOpen={scrollToSection === 'data'}>
 <div style={{ fontSize:'12px', color:T.text2, marginBottom:'12px' }}>
 Storage used: <span style={{ fontFamily:T.mono, color:T.text }}>{storageUsed} KB</span> · {LS.keys('').length} keys
 </div>
 <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
 <button onClick={exportData} style={{
 display:'flex', alignItems:'center', gap:'10px', padding:'12px 16px',
 background:'rgba(255,255,255,0.04)', border:`1px solid ${T.border}`, borderRadius:'10px',
 cursor:'pointer', color:T.text, fontSize:'13px', fontWeight:500,
 }}>
 <Download size={16} color={T.teal} />
 Export all data (JSON)
 </button>
 <button onClick={importData} style={{
 display:'flex', alignItems:'center', gap:'10px', padding:'12px 16px',
 background:'rgba(255,255,255,0.04)', border:`1px solid ${T.border}`, borderRadius:'10px',
 cursor:'pointer', color:T.text, fontSize:'13px', fontWeight:500,
 }}>
 <Upload size={16} color={T.teal} />
 Import data (JSON)
 </button>
 {!confirmReset ? (
 <button onClick={ => setConfirmReset(true)} style={{
 display:'flex', alignItems:'center', gap:'10px', padding:'12px 16px',
 background:'rgba(255,82,82,0.06)', border:`1px solid rgba(255,82,82,0.15)`, borderRadius:'10px',
 cursor:'pointer', color:T.danger, fontSize:'13px', fontWeight:500,
 }}>
 <Trash2 size={16} />
 Clear all data
 </button>
 ) : (
 <div style={{ padding:'12px 16px', background:'rgba(255,82,82,0.08)', borderRadius:'10px',
 border:`1px solid rgba(255,82,82,0.2)` }}>
 <div style={{ fontSize:'13px', color:T.danger, fontWeight:600, marginBottom:'8px' }}>
 ⚠ This will permanently delete all data including workouts, settings, and API keys.
 </div>
 <div style={{ display:'flex', gap:'8px' }}>
 <button onClick={clearAllData} style={{
 flex:1, padding:'10px', background:T.danger, border:'none', borderRadius:'8px',
 color:'#fff', fontWeight:600, fontSize:'12px', cursor:'pointer',
 }}>Yes, delete everything</button>
 <button onClick={ => setConfirmReset(false)} style={{
 flex:1, padding:'10px', background:'rgba(255,255,255,0.04)', border:`1px solid ${T.border}`,
 borderRadius:'8px', color:T.text2, fontWeight:600, fontSize:'12px', cursor:'pointer',
 }}>Cancel</button>
 </div>
 </div>
 )}
 </div>
 </SettingsSection>

 {/* Version */}
 <div style={{ textAlign:'center', marginTop:'20px', fontSize:'11px', color:T.text3 }}>
 NeuroFit v0.5 · Data stored locally
 <div style={{ marginTop:'8px', padding:'10px', background:'rgba(128,128,128,0.08)', borderRadius:'8px', fontSize:'10px', color:T.text3 }}>
 <strong>Disclaimer:</strong> This app is for informational purposes only and does not constitute medical advice, diagnosis, or treatment. Consult a physician and/or physical therapist before starting any exercise program. The creators assume no liability for injuries or damages resulting from use of this app.
 <br/><br/>
 <strong>Privacy:</strong> All data is stored locally on your device. If you use the AI Coach, your data is sent directly to your selected API provider and is subject to their privacy policy.
 </div>
 </div>
 </div>
 );
}

// --- Main Coach Component ---

function CoachTab({ profile, workout, rehabStatus, cardioLog, history, coachCfg, goToSettings }) {
 const [messages, setMessages] = useState([
 { role:'assistant', content:"Hey! I'm your AI coach. Ask me about exercises, form, programming, or recovery. Tap ⚙ to configure provider and model in Settings.", local:true }
 ]);
 const [input, setInput] = useState('');
 const [loading, setLoading] = useState(false);
 const [lastUsage, setLastUsage] = useState(null);
 const chatRef = useRef(null);

 const cfg = coachCfg;
 const provider = PROVIDERS[cfg.provider] || PROVIDERS.anthropic;
 const currentModel = cfg.model === '__custom__'
 ? { id:'__custom__', label: cfg.customModel || 'Custom', cost:{in:0,out:0,cached:0} }
 : (provider.models.find(m => m.id === cfg.model) || provider.models[0]);
 const hasKey = !!(cfg.keys[cfg.provider]);

 const scrollToBottom = => {
 setTimeout( => chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight, behavior:'smooth' }), 100);
 };

 const sendMessage = async => {
 if (!input.trim || !hasKey || loading) return;
 const userMsg = { role:'user', content: input.trim };
 const newMsgs = [.messages, userMsg];
 setMessages(newMsgs);
 setInput('');
 setLoading(true);
 scrollToBottom;

 try {
 const systemPrompt = buildFullSystemPrompt(cfg);
 const ctx = buildSessionContext(profile, workout, rehabStatus, cardioLog, history, cfg);
 const trimmed = trimHistory(newMsgs, cfg.maxHistory);

 // Inject dynamic context into last user message
 const apiMessages = trimmed.map((m, i) => {
 if (i === trimmed.length - 1 && m.role === 'user') {
 const prefix = ctx ? `[CTX: ${ctx}]\n` : '';
 return { role:'user', content: prefix + m.content };
 }
 return { role:m.role, content:m.content };
 });

 const dispatcher = DISPATCH[cfg.provider];
 if (!dispatcher) throw new Error(`Unknown provider: ${cfg.provider}`);

 const result = await dispatcher(cfg, systemPrompt, apiMessages);
 setLastUsage(result.usage);
 setMessages(prev => [.prev, { role:'assistant', content: result.text || 'Empty response.' }]);
 } catch(e) {
 setMessages(prev => [.prev, { role:'assistant', content: `Error: ${e.message}`, local:true }]);
 }
 setLoading(false);
 scrollToBottom;
 };

 const costInfo = useMemo( => estimateCost(lastUsage, currentModel), [lastUsage, currentModel]);

 // --- No key: show setup prompt ---
 if (!hasKey) {
 return (
 <div style={{ animation:'fadeIn 0.3s ease-out', paddingTop:'40px', textAlign:'center' }}>
 <div style={{ width:64, height:64, borderRadius:'20px', background:T.tealGlow,
 display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 20px' }}>
 <MessageCircle size={28} color={T.teal} />
 </div>
 <h2 style={{ fontSize:'20px', fontWeight:700, marginBottom:'8px' }}>AI Coach</h2>
 <p style={{ fontSize:'13px', color:T.text2, marginBottom:'24px', lineHeight:1.5 }}>
 Get personalized advice about exercises,<br/>form, recovery, and programming.
 </p>
 <button onClick={ => goToSettings?.('coach')}
 style={{ padding:'14px 32px', background:T.teal, border:'none', borderRadius:'12px',
 color:'#07070E', fontWeight:600, fontSize:'14px', cursor:'pointer' }}>
 Configure Provider & API Key
 </button>
 </div>
 );
 }

 // --- Chat view ---
 return (
 <div style={{ display:'flex', flexDirection:'column', height:'calc(100vh - 140px)', animation:'fadeIn 0.3s ease-out' }}>
 {/* Header */}
 <div style={{ marginBottom:'8px' }}>
 <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'4px' }}>
 <h2 style={{ fontSize:'20px', fontWeight:700 }}>AI Coach</h2>
 <button onClick={ => goToSettings?.('coach')}
 style={{ background:'none', border:'none', color:T.text3, cursor:'pointer', padding:'8px', display:'flex', alignItems:'center', gap:'4px' }}>
 <Settings size={16} />
 </button>
 </div>

 {/* Model pill + cost */}
 <div style={{ display:'flex', alignItems:'center', gap:'8px', flexWrap:'wrap' }}>
 <span style={{ fontSize:'11px', fontWeight:600, color:T.teal, background:T.tealGlow,
 padding:'3px 8px', borderRadius:'6px' }}>
 {provider.name} · {currentModel.label}
 </span>
 {costInfo && (
 <span style={{ fontSize:'10px', color:T.text3, fontFamily:T.mono }}>
 {costInfo.cost} · {costInfo.input}in/{costInfo.output}out
 {costInfo.pctCached > 0 && <span style={{ color:T.teal }}> · {costInfo.pctCached}%cached</span>}
 </span>
 )}
 </div>
 </div>

 {/* Messages */}
 <div ref={chatRef} role="log" aria-live="polite" aria-label="Chat messages" style={{ flex:1, overflowY:'auto', marginBottom:'12px', paddingRight:'4px' }}>
 {messages.map((msg, i) => (
 <div key={i} style={{
 display:'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
 marginBottom:'10px', animation:'fadeUp 0.2s ease-out',
 }}>
 <div style={{
 maxWidth:'85%', padding:'12px 16px', borderRadius:'16px',
 background: msg.role === 'user' ? T.accent : T.bgCard,
 border: msg.role === 'user' ? 'none' : `1px solid ${T.border}`,
 color: msg.role === 'user' ? '#fff' : T.text,
 fontSize:'14px', lineHeight:1.5, whiteSpace:'pre-wrap',
 }}>
 {msg.content}
 </div>
 </div>
 ))}
 {loading && (
 <div style={{ display:'flex', justifyContent:'flex-start', marginBottom:'10px' }}>
 <div style={{ padding:'12px 16px', borderRadius:'16px', background:T.bgCard,
 border:`1px solid ${T.border}`, fontSize:'14px', color:T.text3 }}>
 Thinking.
 </div>
 </div>
 )}
 </div>

 {/* Input */}
 <div style={{ display:'flex', gap:'8px' }}>
 <input value={input} onChange={e => setInput(e.target.value)}
 onKeyDown={e => e.key === 'Enter' && sendMessage}
 placeholder="Ask about exercises, form, recovery."
 aria-label="Message to AI coach"
 style={{ flex:1, padding:'14px 16px', background:T.bgCard, border:`1px solid ${T.border}`,
 borderRadius:'14px', color:T.text, fontSize:'14px', outline:'none' }} />
 <button onClick={sendMessage} disabled={loading || !input.trim} aria-label="Send message"
 style={{ width:48, height:48, borderRadius:'14px', border:'none',
 background: input.trim ? T.teal : 'rgba(255,255,255,0.04)',
 display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer',
 transition:'all 0.2s', opacity: input.trim ? 1 : 0.5 }}>
 <Send size={18} color={input.trim ? '#07070E' : T.text3} />
 </button>
 </div>
 </div>
 );
}

// ============================================================
// MAIN APP
// ============================================================

export default function App {
 const [tab, setTab] = useState('today');
 const [restTimers, setRestTimers] = useState({}); // { exerciseId: endTimeMs } — lives in App so it survives tab switches
 const [settingsSection, setSettingsSection] = useState(null);
 const [profile, setProfile] = useState( => LS.get('profile', { phase:'acute', location:'gym', xp:0, streak:0, lastActive:'' }));
 const [settings, setSettings] = useState( => LS.get('appSettings', DEFAULT_SETTINGS));
 const [workout, setWorkout] = useState( => {
 const raw = LS.get(dayKey('workout'), null);
 if (!raw) return null;
 return normalizeWorkout(raw);
 });
 const [rehabStatus, setRehabStatus] = useState( => LS.get(dayKey('rehab'), {}));
 const [cardioLog, setCardioLog] = useState( => LS.get(dayKey('cardio'), []));
 const [history, setHistory] = useState( => LS.get('history', {}));
 const [toast, setToast] = useState(null);
 const [coachCfg, setCoachCfg] = useState( => LS.get('coachCfg', DEFAULT_COACH_CONFIG));
 const [nutritionConfig, setNutritionConfig] = useState( => LS.get('nutritionConfig', DEFAULT_NUTRITION_CONFIG));
 const [calibration, setCalibration] = useState( => LS.get('bfCalibration', DEFAULT_CALIBRATION));
 const [disclaimerAccepted, setDisclaimerAccepted] = useState( => LS.get('disclaimerAccepted', false));

 // Persist
 useEffect( => { LS.set('profile', profile); }, [profile]);
 useEffect( => { LS.set('appSettings', settings); }, [settings]);
 useEffect( => { LS.set(dayKey('workout'), workout); }, [workout]);
 useEffect( => { LS.set(dayKey('rehab'), rehabStatus); }, [rehabStatus]);
 useEffect( => { LS.set(dayKey('cardio'), cardioLog); }, [cardioLog]);
 useEffect( => { LS.set('history', history); }, [history]);
 useEffect( => { LS.set('coachCfg', coachCfg); }, [coachCfg]);
 useEffect( => { LS.set('nutritionConfig', nutritionConfig); }, [nutritionConfig]);
 useEffect( => { LS.set('bfCalibration', calibration); }, [calibration]);
 useEffect( => { LS.set('disclaimerAccepted', disclaimerAccepted); }, [disclaimerAccepted]);

 // Cross-tab sync: detect when another tab modifies critical data
 useEffect( => {
 const handleStorageChange = (e) => {
 // Only react to workout or profile changes from other tabs
 const criticalKeys = [dayKey('workout'), 'profile', 'history'];
 if (e.key && criticalKeys.includes(e.key) && e.newValue !== e.oldValue) {
 // Check if current tab has unsaved work
 const hasWork = workout?.exercises?.some(ex => ex.logSets?.some(s => s.done));
 if (hasWork) {
 showToast('Another tab updated your data. Refresh to sync.', 0);
 } else {
 // No active work — safe to auto-reload state
 try {
 if (e.key === dayKey('workout')) {
 const raw = e.newValue ? JSON.parse(e.newValue) : null;
 setWorkout(raw ? normalizeWorkout(raw) : null);
 } else if (e.key === 'profile') {
 setProfile(e.newValue ? JSON.parse(e.newValue) : profile);
 }
 } catch { /* ignore parse errors */ }
 }
 }
 };
 window.addEventListener('storage', handleStorageChange);
 return => window.removeEventListener('storage', handleStorageChange);
 }, [workout]); // eslint-disable-line react-hooks/exhaustive-deps

 // Migration: ensure profile has streaks, populate nutritionConfig from existing settings
 useEffect( => {
 // Ensure streaks exist on profile
 if (!profile.streaks) {
 setProfile(p => ({.p, streaks: p.streaks || DEFAULT_STREAKS }));
 }
 // Migrate body weight / body fat from settings to nutritionConfig defaults
 if (settings.bodyWeight && nutritionConfig === DEFAULT_NUTRITION_CONFIG) {
 const bw = Number(settings.bodyWeight);
 if (bw > 0) {
 const isLbs = (settings.weightUnit || 'lbs') === 'lbs';
 const bwLbs = isLbs ? bw : bw * 2.205;
 // Estimate TDEE as bodyweight × 15 (rough maintenance multiplier)
 const estTDEE = Math.round(bwLbs * 15);
 setNutritionConfig(prev => ({
.prev,
 initialTDEE: prev.initialTDEE === 2500 ? estTDEE : prev.initialTDEE,
 estimatedTDEE: prev.estimatedTDEE === 2500 ? estTDEE : prev.estimatedTDEE,
 weightUnit: settings.weightUnit || prev.weightUnit,
 }));
 }
 }
 }, []); // eslint-disable-line react-hooks/exhaustive-deps

 // Deep-link to settings: sets both tab and section, clears section after scroll
 const goToSettings = useCallback((section) => {
 setSettingsSection(section || null);
 setTab('settings');
 }, []);

 // Clear section marker when leaving settings
 useEffect( => {
 if (tab !== 'settings') setSettingsSection(null);
 }, [tab]);

 // Redirect away from coach tab if coach gets disabled
 useEffect( => {
 if (tab === 'coach' && !settings.coachEnabled) setTab('today');
 }, [tab, settings.coachEnabled]);

 // Streak management
 useEffect( => {
 const t = today;
 if (profile.lastActive && profile.lastActive !== t) {
 const last = new Date(profile.lastActive);
 const now = new Date(t);
 const diff = Math.floor((now - last) / (1000*60*60*24));
 if (diff > 1) {
 setProfile(p => ({.p, streak: 0 }));
 }
 }
 }, []);

 const showToast = (message, xp) => {
 setToast({ message, xp });
 setTimeout( => setToast(null), 2500);
 };

 const addXP = (amount, message) => {
 setProfile(p => ({.p, xp: p.xp + amount, lastActive: today }));
 showToast(message, amount);
 };

 const markActive = (type) => {
 const t = today;
 setHistory(prev => {
 const acts = prev[t] || [];
 if (!acts.includes(type)) return {.prev, [t]: [.acts, type] };
 return prev;
 });
 // Update streak
 setProfile(p => {
 if (p.lastActive !== t) {
 const last = new Date(p.lastActive || t);
 const now = new Date(t);
 const diff = Math.floor((now - last) / (1000*60*60*24));
 const newStreak = diff <= 1 ? p.streak + 1 : 1;
 return {.p, streak: newStreak, lastActive: t };
 }
 return p;
 });
 };

 const [isGeneratingWorkout, setIsGeneratingWorkout] = useState(false);

 const handleGenerateWorkout = (overrides = {}) => {
 if (isGeneratingWorkout) return; // Prevent double-click

 // Warn before overwriting a workout with logged data
 const currentExercises = workout?.exercises || [];
 const hasLoggedSets = currentExercises.some(e => e.logSets?.some(s => s.done));
 if (hasLoggedSets) {
 if (!window.confirm('You have logged sets in your current workout. Generating a new workout will discard this data. Continue?')) {
 return;
 }
 }

 setIsGeneratingWorkout(true);
 const recentWorkouts = Object.entries(history)
.filter(([date, acts]) => acts.includes('workout'))
.sort((a, b) => b[0].localeCompare(a[0]))
.slice(0, 3)
.map(([date]) => LS.get(`workout:${date}`, null))
.filter(Boolean);
 
 const w = generateWorkout(profile.phase, profile.location, recentWorkouts, settings, overrides);
 const splitDayName = w._splitDay || 'full_body';
 // Filter to just exercise objects (strip _splitDay meta property)
 const exercises = [.w].filter(ex => ex && ex.id);
 
 setWorkout({
 date: today,
 splitDay: splitDayName,
 weekId: getWeekId,
 exercises,
 sessionRPE: null,
 durationMinutes: null,
 version: 2,
 });
 // Re-enable after a short delay to prevent rapid re-clicks
 setTimeout( => setIsGeneratingWorkout(false), 500);
 };

 const handleUpdateExercise = (updatedEx, replaceId) => {
 if (!workout?.exercises) return;
 const matchId = replaceId || updatedEx.id;
 const newExercises = workout.exercises.map(ex => ex.id === matchId ? updatedEx : ex);
 // Auto-track workout start time on first set completion
 const hadAnyDone = workout.exercises.some(e => e.logSets?.some(s => s.done));
 const hasAnyDone = newExercises.some(e => e.logSets?.some(s => s.done));
 const startedAt = (!hadAnyDone && hasAnyDone && !workout.startedAt) ? Date.now : workout.startedAt;
 const newWorkout = {.workout, exercises: newExercises, startedAt };
 setWorkout(newWorkout);
 if (replaceId && replaceId !== updatedEx.id) return;
 const oldEx = workout.exercises.find(e => e.id === updatedEx.id);
 const oldDone = oldEx?.logSets?.filter(s => s.done).length || 0;
 const newDone = updatedEx.logSets?.filter(s => s.done).length || 0;
 if (newDone > oldDone) { addXP(XP_REWARDS.set, 'Set complete!'); }
 const wasComplete = oldEx?.logSets?.every(s => s.done);
 const isComplete = updatedEx.logSets?.every(s => s.done);
 if (!wasComplete && isComplete) {
 addXP(XP_REWARDS.exercise, `${updatedEx.name} done!`);
 markActive('workout');
 }
 };

 const handleSessionMeta = ({ sessionRPE, durationMinutes, sessionNotes }) => {
 if (!workout) return;
 const update = {.workout };
 if (sessionRPE !== undefined) update.sessionRPE = sessionRPE;
 if (durationMinutes !== undefined) update.durationMinutes = durationMinutes;
 if (sessionNotes !== undefined) update.sessionNotes = sessionNotes;
 setWorkout(update);
 };

 const handleRemoveExercise = (exerciseId) => {
 if (!workout?.exercises) return;
 const newExercises = workout.exercises.filter(ex => ex.id !== exerciseId);
 setWorkout({.workout, exercises: newExercises });
 };

 const handleToggleRehab = (id) => {
 const newStatus = {.rehabStatus, [id]: !rehabStatus[id] };
 setRehabStatus(newStatus);
 
 if (!rehabStatus[id]) {
 const allDone = DAILY_REHAB.every(r => r.id === id ? true : newStatus[r.id]);
 if (allDone) {
 addXP(XP_REWARDS.rehab, 'Rehab complete!');
 }
 markActive('rehab');
 }
 };

 const handleLogCardio = (cardio, duration, hr) => {
 const entry = { id: cardio.id, name: cardio.name, duration, hr, date: new Date.toISOString };
 setCardioLog(prev => [.prev, entry]);
 addXP(XP_REWARDS.cardio, `${cardio.name} logged!`);
 markActive('cardio');
 };

 const handleSaveBodyLog = (log, calPoint) => {
 // Save the body log
 LS.set(`bodyLog:${log.date}`, log);
 markActive('bodyLog');

 // Update streaks
 setProfile(p => {
 let streaks = {.(p.streaks || DEFAULT_STREAKS) };
 let xpToAdd = 0;
 
 if (log.weight) {
 streaks = updateStreaks(streaks, 'weightLog', log.date);
 xpToAdd += BODY_XP.weightLog;
 }
 if (log.calories && log.protein) {
 streaks = updateStreaks(streaks, 'nutritionLog', log.date);
 xpToAdd += BODY_XP.nutritionFull;
 }
 if (log.weight && log.calories) {
 streaks = checkCombinedStreak(streaks, log.date);
 }
 // Bonus XP for all fields
 if (log.weight && log.calories && log.protein && log.bodyFat) {
 xpToAdd += BODY_XP.allFields;
 }
 // Streak milestones
 const combined = streaks.combined?.current || 0;
 if (combined === 7) xpToAdd += BODY_XP.streak7;
 if (combined === 30) xpToAdd += BODY_XP.streak30;

 return {.p, streaks, xp: p.xp + xpToAdd, lastActive: today };
 });

 if (log.weight || (log.calories && log.protein)) {
 showToast('Body log saved!', BODY_XP.weightLog);
 }

 // Auto-add calibration point if DEXA
 if (calPoint) {
 setCalibration(prev => {
 const pts = [.(prev.points || []), calPoint];
 pts.sort((a, b) => a.date.localeCompare(b.date));
 return recalcCalibration({.prev, points: pts });
 });
 }

 // Update TDEE if we have enough data
 const allLogs = loadBodyLogs;
 const { tdee, confidence } = updateExpenditure(allLogs, nutritionConfig);
 if (tdee !== nutritionConfig.estimatedTDEE) {
 setNutritionConfig(prev => ({
.prev,
 estimatedTDEE: tdee,
 tdeeConfidence: confidence,
 tdeeHistory: [.(prev.tdeeHistory || []), { date: log.date, value: tdee }].slice(-365),
 }));
 }
 };

 const updateProfile = (updates) => {
 setProfile(p => ({.p,.updates }));
 if (updates.phase || updates.location) {
 setWorkout(null); // Reset workout when settings change
 }
 };

 const level = LEVELS.find((l, i) => (LEVELS[i+1]?.xp || Infinity) > profile.xp) || LEVELS[0];

 const tabs = [
 { id:'today', icon:Dumbbell, label:'Train' },
 { id:'rehab', icon:Heart, label:'Rehab' },
 { id:'cardio', icon:Activity, label:'Cardio' },
 { id:'progress', icon:TrendingUp, label:'Progress' },
.(settings.coachEnabled ? [{ id:'coach', icon:MessageCircle, label:'Coach' }] : []),
 ];

 return (
 <>
 <style>{css}</style>
 {!disclaimerAccepted && (
 <div style={{ position:'fixed', inset:0, zIndex:99999, background:'rgba(0,0,0,0.7)', display:'flex', alignItems:'center', justifyContent:'center', padding:'20px' }}>
 <div style={{ background:T.bg, borderRadius:'16px', padding:'24px', maxWidth:'400px', width:'100%', maxHeight:'80vh', overflow:'auto' }}>
 <div style={{ fontSize:'20px', fontWeight:700, marginBottom:'12px', textAlign:'center', color:T.text }}>Welcome to NeuroFit</div>
 <div style={{ fontSize:'13px', lineHeight:'1.6', color:T.text2, marginBottom:'16px' }}>
 <p style={{ marginBottom:'10px' }}><strong style={{ color:T.text }}>Medical Disclaimer:</strong> This app is for <strong>informational purposes only</strong> and does not constitute medical advice, diagnosis, or treatment.</p>
 <p style={{ marginBottom:'10px' }}>Please <strong>consult a physician and/or licensed physical therapist</strong> before beginning any exercise program, especially if you have pre-existing injuries or medical conditions.</p>
 <p style={{ marginBottom:'10px' }}>The creators of this app <strong>assume no liability</strong> for any injuries or damages resulting from its use.</p>
 <p style={{ marginBottom:'10px' }}><strong style={{ color:T.text }}>Privacy:</strong> All data is stored locally on your device. If you enable the AI Coach, your data is transmitted directly to your selected API provider and is subject to their privacy policy.</p>
 </div>
 <button onClick={() => setDisclaimerAccepted(true)} style={{ width:'100%', padding:'14px', background:T.accent, color:'#fff', border:'none', borderRadius:'12px', fontSize:'15px', fontWeight:600, cursor:'pointer' }}>
 I Understand \u2014 Continue
 </button>
 </div>
 </div>
 )}

 <div style={{
 maxWidth:'480px', margin:'0 auto', minHeight:'100vh', position:'relative',
 background:T.bg, paddingBottom:'80px', paddingTop:'env(safe-area-inset-top, 0px)',
 }}>
 {/* HEADER */}
 <div style={{
 position:'sticky', top:0, zIndex:50, padding:'16px 20px 12px',
 background:`linear-gradient(180deg, ${T.bg} 60%, transparent)`,
 backdropFilter:'blur(16px)', WebkitBackdropFilter:'blur(16px)',
 }}>
 <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
 <div>
 <h1 style={{ fontSize:'22px', fontWeight:800, letterSpacing:'-0.03em',
 background:`linear-gradient(135deg, ${T.text}, ${T.text2})`,
 WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>
 NeuroRehab
 </h1>
 <button onClick={ => goToSettings('training')} style={{
 fontSize:'11px', color:T.text3, marginTop:'1px', textTransform:'uppercase', letterSpacing:'0.5px',
 background:'none', border:'none', cursor:'pointer', padding:0,
 }}>
 {profile.phase} · {profile.location}
 </button>
 </div>
 <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
 {profile.streak > 0 && (
 <div style={{ display:'flex', alignItems:'center', gap:'4px' }}>
 <Flame size={16} color={T.accent} style={{ animation: profile.streak > 7 ? 'pulse 2s infinite' : 'none' }} />
 <span style={{ fontSize:'13px', fontWeight:700, fontFamily:T.mono, color:T.accent }}>{profile.streak}</span>
 </div>
 )}
 <div style={{ display:'flex', alignItems:'center', gap:'6px', background:T.bgCard,
 padding:'4px 10px 4px 8px', borderRadius:'20px', border:`1px solid ${T.border}` }}>
 <Zap size={14} color={T.accent} />
 <span style={{ fontSize:'12px', fontWeight:600, fontFamily:T.mono }}>{profile.xp}</span>
 </div>
 <button onClick={ => goToSettings} style={{
 background:tab === 'settings' ? T.accentSoft : 'none', border:'none', cursor:'pointer',
 padding:'6px', borderRadius:'8px', display:'flex', alignItems:'center', transition:'all 0.2s',
 }}>
 <Settings size={18} color={tab === 'settings' ? T.accent : T.text3} />
 </button>
 </div>
 </div>
 </div>

 {/* STORAGE WARNING */}
 {(LS._quotaExceeded || LS.getUsageKB > 4000) && (
 <div style={{
 margin:'0 20px 8px', padding:'10px 14px', borderRadius:T.radiusSm,
 background:'rgba(255,82,82,0.08)', border:'1px solid rgba(255,82,82,0.2)',
 display:'flex', alignItems:'center', gap:'8px', fontSize:'12px', color:T.danger,
 }}>
 <AlertTriangle size={16} />
 <div style={{ flex:1 }}>
 <strong>{LS._quotaExceeded ? 'Storage full!' : 'Storage nearly full'}</strong>
 {' — '}({LS.getUsageKB}KB used). Export your data in Settings to avoid data loss.
 </div>
 <button onClick={ => goToSettings('data')} style={{
 background:'none', border:`1px solid ${T.danger}`, borderRadius:'6px',
 padding:'4px 10px', color:T.danger, fontSize:'11px', fontWeight:600, cursor:'pointer',
 }}>Export</button>
 </div>
 )}

 {/* CONTENT */}
 <main role="main" style={{ padding:'0 20px 80px' }}>
 {tab === 'today' && (
 <TodayTab profile={profile} workout={workout} settings={settings}
 onGenerateWorkout={handleGenerateWorkout} onUpdateExercise={handleUpdateExercise}
 onRemoveExercise={handleRemoveExercise}
 onSessionMeta={handleSessionMeta} onAddXP={addXP} goToSettings={goToSettings}
 nutritionConfig={nutritionConfig} calibration={calibration} onSaveBodyLog={handleSaveBodyLog}
 isGeneratingWorkout={isGeneratingWorkout}
 restTimers={restTimers} onRestTimerChange={(exId, endTime) => setRestTimers(prev => endTime ? {.prev, [exId]: endTime } : ( => { const n = {.prev }; delete n[exId]; return n; }))} />
 )}
 {tab === 'rehab' && (
 <RehabTab rehabStatus={rehabStatus} onToggle={handleToggleRehab} />
 )}
 {tab === 'cardio' && (
 <CardioTab cardioLog={cardioLog} onLogCardio={handleLogCardio} settings={settings} goToSettings={goToSettings} />
 )}
 {tab === 'progress' && (
 <ProgressTab profile={profile} history={history} goToSettings={goToSettings}
 coachEnabled={settings.coachEnabled} settings={settings} coachCfg={coachCfg}
 nutritionConfig={nutritionConfig} onUpdateNutritionConfig={setNutritionConfig}
 goToToday={ => setTab('today')} />
 )}
 {tab === 'coach' && settings.coachEnabled && (
 <CoachTab profile={profile} workout={workout} rehabStatus={rehabStatus} cardioLog={cardioLog}
 history={history} coachCfg={coachCfg} goToSettings={goToSettings} />
 )}
 {tab === 'settings' && (
 <SettingsTab settings={settings} onUpdateSettings={setSettings} profile={profile}
 updateProfile={updateProfile} coachCfg={coachCfg} onUpdateCoachCfg={setCoachCfg}
 history={history} scrollToSection={settingsSection}
 nutritionConfig={nutritionConfig} onUpdateNutritionConfig={setNutritionConfig}
 calibration={calibration} onUpdateCalibration={setCalibration} />
 )}
 </main>

 {/* BOTTOM NAV */}
 <nav role="navigation" aria-label="Main navigation" style={{
 position:'fixed', bottom:0, left:'50%', transform:'translateX(-50%)',
 width:'100%', maxWidth:'480px',
 background:T.bgGlass, backdropFilter:'blur(24px)', WebkitBackdropFilter:'blur(24px)',
 borderTop:`1px solid ${T.border}`,
 display:'flex', justifyContent:'space-around', padding:'8px 0 calc(12px + env(safe-area-inset-bottom, 0px))',
 zIndex:100,
 }}>
 {tabs.map(t_item => {
 const Icon = t_item.icon;
 const active = tab === t_item.id;
 return (
 <button key={t_item.id} onClick={ => setTab(t_item.id)}
 aria-label={`${t_item.label} tab`}
 aria-current={active ? 'page' : undefined}
 style={{
 background:'none', border:'none', display:'flex', flexDirection:'column',
 alignItems:'center', gap:'3px', cursor:'pointer', padding:'8px 14px',
 transition:'all 0.2s', position:'relative', minHeight:'48px',
 }}>
 {active && (
 <div style={{ position:'absolute', top:'-8px', width:'20px', height:'3px',
 borderRadius:'2px', background:T.accent, transition:'all 0.3s' }} />
 )}
 <Icon size={22} color={active ? T.accent : T.text3} strokeWidth={active ? 2.5 : 1.8} />
 <span style={{ fontSize:'10px', fontWeight: active ? 600 : 400,
 color: active ? T.accent : T.text3 }}>{t_item.label}</span>
 </button>
 );
 })}
 </nav>

 {/* TOAST */}
 {toast && <Toast message={toast.message} xp={toast.xp} />}
 </div>
 </>
 );
}
