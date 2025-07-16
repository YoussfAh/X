import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Collection from '../models/collectionModel.js';
import Product from '../models/productModel.js';
import User from '../models/userModel.js';
import connectDB from '../config/db.js';

dotenv.config();

const run = async () => {
  await connectDB();
  const adminUser = await User.findOne({ isAdmin: true });
  if (!adminUser) {
    console.error('No admin user found.');
    process.exit(1);
  }

  const data = {
    collections: [
      {
        name: "Strength Training Programs",
        description: "Comprehensive strength training programs for all fitness levels, from beginners to advanced athletes. Build muscle, increase strength, and improve overall physical performance.",
        image: "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?q=80&w=1000",
        children: [
          {
            name: "Beginner Strength Training",
            description: "Perfect programs for those new to strength training. Learn proper form, build a foundation of strength, and develop consistency in your workouts.",
            image: "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?q=80&w=1000",
            products: [
              {
                name: "Fundamentals of Strength Training",
                description: "A comprehensive guide to strength training basics including form, technique, and progression principles. Master the foundational movements and understand how to create sustainable progress.",
                image: "https://images.unsplash.com/photo-1574680096145-d05b474e2155?q=80&w=1000",
                category: "Guide",
                youtubeVideo: "https://www.youtube.com/watch?v=_kLBi8tF6Kk",
                workoutDetails: "Includes proper form tutorials for squats, deadlifts, bench press, rows, overhead press, and core exercises. Complete with progressive training plans for weeks 1-8.",
                nutritionTips: "Basic nutrition guidance for beginners focusing on protein intake, meal timing, and hydration."
              },
              {
                name: "4-Week Starter Strength Plan",
                description: "A perfect beginner program designed to build basic strength while learning proper form. Full workouts with sets, reps, and progression guidance.",
                image: "https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?q=80&w=1000",
                category: "Program",
                youtubeVideo: "https://www.youtube.com/watch?v=ixkQaZXVQjs",
                workoutSchedule: "3 workouts per week (Monday, Wednesday, Friday) with rest days in between.",
                workoutDetails: "Week 1: Basic bodyweight movements and machine exercises. Week 2-4: Progressive introduction to free weights and compound movements.",
                equipmentNeeded: "Basic gym equipment or adjustable dumbbells at home."
              },
              {
                name: "Home Strength Basics",
                description: "Build strength without a gym membership using minimal equipment. Perfect for beginners working out at home.",
                image: "https://images.unsplash.com/photo-1518611012118-696072aa579a?q=80&w=1000",
                category: "Program",
                youtubeVideo: "https://www.youtube.com/watch?v=vc1E5CfRfos",
                workoutSchedule: "4 workouts per week with options for different equipment levels.",
                workoutDetails: "Full-body workouts using bodyweight, resistance bands, and optional dumbbells. Progressive overload techniques without heavy weights.",
                equipmentNeeded: "Resistance bands, optional dumbbells or kettlebells."
              },
              {
                name: "Strength Foundation Mobility Program",
                description: "Improve flexibility and mobility to enhance your strength training performance and reduce injury risk.",
                image: "https://images.unsplash.com/photo-1518459031867-a89b944bffe4?q=80&w=1000",
                category: "Program",
                youtubeVideo: "https://www.youtube.com/watch?v=lbozu0DPcYI",
                workoutSchedule: "Daily 15-minute mobility routines plus 3 longer sessions per week.",
                workoutDetails: "Focus on hip, shoulder, ankle mobility and thoracic spine flexibility. Includes dynamic warm-up routines for strength training days.",
                benefitsDescription: "Improved range of motion, better lifting technique, reduced injury risk, faster recovery."
              }
            ]
          },
          {
            name: "Intermediate Strength Programs",
            description: "Take your strength to the next level with intermediate programs designed for those with 6+ months of consistent training experience.",
            image: "https://images.unsplash.com/photo-1534438097545-a2c22c57f2ad?q=80&w=1000",
            products: [
              {
                name: "5x5 Progressive Strength System",
                description: "A classic strength building program based on compound movements and progressive overload principles. Build serious strength and muscle with this time-tested approach.",
                image: "https://images.unsplash.com/photo-1526506118085-60ce8714f8c5?q=80&w=1000",
                category: "Program",
                youtubeVideo: "https://www.youtube.com/watch?v=oAuARgqS6aQ",
                workoutSchedule: "3-4 workouts per week with structured progression protocols.",
                workoutDetails: "Focus on squats, deadlifts, bench press, overhead press, and rows. Weekly progression system with deload protocols.",
                progressionStrategy: "Add 5lbs to upper body and 10lbs to lower body lifts each week with strategic deloads every 4-6 weeks."
              },
              {
                name: "Upper/Lower Power Split",
                description: "Maximize strength gains with this 4-day split focusing on upper and lower body power development. Ideal for intermediate lifters looking to break plateaus.",
                image: "https://images.unsplash.com/photo-1531917115039-583fba5c3bed?q=80&w=1000",
                category: "Program",
                youtubeVideo: "https://www.youtube.com/watch?v=RDYCnMRLVJY",
                workoutSchedule: "4 days per week: Upper Power, Lower Power, Upper Strength, Lower Strength.",
                workoutDetails: "Power days focus on explosive movements at 60-80% 1RM. Strength days focus on heavier loads at 80-90% 1RM with lower reps.",
                periodizationModel: "Undulating periodization with varying intensities throughout the week for optimal strength development."
              },
              {
                name: "Functional Strength Development",
                description: "Build real-world applicable strength with this functional fitness program combining traditional strength moves with athletic movements.",
                image: "https://images.unsplash.com/photo-1549576490-b0b4831ef60a?q=80&w=1000",
                category: "Program",
                youtubeVideo: "https://www.youtube.com/watch?v=o8QGkgS0gCU",
                workoutSchedule: "4 workouts per week with movement pattern focus rather than body part splits.",
                workoutDetails: "Combines traditional strength exercises with unilateral movements, carries, throws, and athletic development drills.",
                functionalBenefits: "Improved performance in daily activities, enhanced balance and coordination, injury prevention, and better overall movement quality."
              }
            ]
          },
          {
            name: "Advanced Strength Programs",
            description: "Specialized programs for experienced lifters looking to maximize strength, break plateaus, or prepare for competition.",
            image: "https://images.unsplash.com/photo-1574680088814-c9e8a10d8a4d?q=80&w=1000",
            products: [
              {
                name: "Powerlifting Competition Prep",
                description: "A comprehensive program designed for powerlifters preparing for competition. Maximize your total with this specific periodized approach to the squat, bench press, and deadlift.",
                image: "https://images.unsplash.com/photo-1517963879433-6ad2b056d712?q=80&w=1000",
                category: "Program",
                youtubeVideo: "https://www.youtube.com/watch?v=E_zW63P3GhE",
                workoutSchedule: "4-5 sessions per week over a 12-week competition preparation cycle.",
                workoutDetails: "Includes main lift days, variation/technique days, and specific assistance work. Complete with peaking strategy and taper protocol.",
                competitionPrep: "Meet day strategies, attempt selection guidance, equipment recommendations, and psychological preparation techniques.",
                periodizationModel: "Block periodization with hypertrophy, strength, and peaking phases."
              },
              {
                name: "Conjugate Method Strength System",
                description: "Based on the Westside Barbell methodology, this program uses the conjugate method to develop maximal strength through rotating max effort and dynamic effort training.",
                image: "https://images.unsplash.com/photo-1598268030450-7a476f602fbd?q=80&w=1000",
                category: "Program", 
                youtubeVideo: "https://www.youtube.com/watch?v=8vAT2rn9zx4",
                workoutSchedule: "4 primary training days: Max Effort Upper, Max Effort Lower, Dynamic Effort Upper, Dynamic Effort Lower.",
                workoutDetails: "Rotating exercise selection, implementation of accommodating resistance, and specialized bar usage. Comprehensive assistance exercise protocols.",
                strengthPrinciples: "Max effort method, dynamic effort method, repetition method, and conjugate sequence system explanation."
              },
              {
                name: "Strongman Training Blueprint",
                description: "Develop full-body functional strength with this strongman-style training program. Build the kind of strength that transfers to real-world performance.",
                image: "https://images.unsplash.com/photo-1532384748853-8f54a2985510?q=80&w=1000",
                category: "Program",
                youtubeVideo: "https://www.youtube.com/watch?v=p5TFn8w2Fy4",
                workoutSchedule: "3 main training sessions with 1 event day per week.",
                workoutDetails: "Focuses on movements like carries, yoke walks, stone loads, log press, and other strongman events while maintaining a foundation of traditional strength training.",
                implementationGuide: "How to modify when specific strongman implements aren't available, plus gym-friendly alternatives for each specialized movement."
              }
            ]
          }
        ]
      },
      {
        name: "Sports Performance Training",
        description: "Sport-specific training programs designed to enhance athletic performance across various sports. Develop the specific strength, power, speed, and endurance needed for your sport.",
        image: "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?q=80&w=1000",
        children: [
          {
            name: "Football/Soccer Training",
            description: "Specialized training programs for football/soccer players focusing on the specific physical demands of the sport.",
            image: "https://images.unsplash.com/photo-1579952363873-27f3bade9f55?q=80&w=1000",
            products: [
              {
                name: "Soccer Speed & Agility Program",
                description: "Develop the rapid change of direction, acceleration, and deceleration abilities essential for high-level soccer performance. Includes comprehensive cone drills, ladder work, and sprint training.",
                image: "https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?q=80&w=1000",
                category: "Program",
                youtubeVideo: "https://www.youtube.com/watch?v=3ko9kjhT-Wc",
                workoutSchedule: "3 speed sessions and 2 agility sessions per week, designed to fit around team practice and matches.",
                workoutDetails: "Progressive development of linear speed, lateral movement, change of direction, acceleration mechanics, and deceleration control.",
                sportSpecificBenefits: "Improved ability to beat defenders, faster recovery runs, better positioning, and enhanced overall field coverage."
              },
              {
                name: "Soccer Strength & Power Development",
                description: "Build the specific strength and power needed for soccer performance, focusing on lower body explosiveness, core stability, and injury prevention.",
                image: "https://images.unsplash.com/photo-1579952363873-27f3bade9f55?q=80&w=1000",
                category: "Program",
                youtubeVideo: "https://www.youtube.com/watch?v=m3EMg9a_7nM",
                workoutSchedule: "2-3 sessions per week based on in-season or off-season phase.",
                workoutDetails: "Combines Olympic lifting derivatives, plyometrics, unilateral strength work, and soccer-specific movement patterns.",
                periodizationModel: "Season-long periodization model with distinct off-season, pre-season, in-season, and recovery phases."
              },
              {
                name: "Football/Soccer Match Endurance",
                description: "Develop the specific endurance needed to maintain high intensity throughout a full 90-minute match. Interval-based conditioning that mimics the demands of match play.",
                image: "https://images.unsplash.com/photo-1517466787929-bc90951d0974?q=80&w=1000",
                category: "Program",
                youtubeVideo: "https://www.youtube.com/watch?v=3koOSz4Gt3U",
                workoutSchedule: "2-3 conditioning sessions per week, carefully periodized around team training and matches.",
                workoutDetails: "High-intensity interval training designed to mimic the specific work-to-rest ratios in soccer. Includes small-sided games, shuttle runs, and progressive interval protocols.",
                conditioningPhilosophy: "Sport-specific conditioning that develops both aerobic and anaerobic energy systems for complete match fitness."
              }
            ]
          },
          {
            name: "Basketball Performance",
            description: "Training programs designed specifically for basketball players to enhance on-court performance.",
            image: "https://images.unsplash.com/photo-1519861531473-9200262188bf?q=80&w=1000",
            products: [
              {
                name: "Vertical Jump Development",
                description: "Comprehensive program to increase your vertical leap and explosive power. Jump higher, rebound better, and finish stronger at the rim.",
                image: "https://images.unsplash.com/photo-1546519638-68e109acd27d?q=80&w=1000",
                category: "Program",
                youtubeVideo: "https://www.youtube.com/watch?v=PAXZt7NH3EM",
                workoutSchedule: "3-4 sessions per week over an 8-week development cycle.",
                workoutDetails: "Progressive plyometric training, strength development for posterior chain and quads, and specific jump technique work.",
                progressionProtocol: "Phase 1: Strength foundation. Phase 2: Power development. Phase 3: Plyometric intensification. Phase 4: Sport-specific application."
              },
              {
                name: "Basketball Speed & Agility",
                description: "Develop the first-step quickness, lateral movement, and defensive footwork essential for elite basketball performance.",
                image: "https://images.unsplash.com/photo-1519861531473-9200262188bf?q=80&w=1000",
                category: "Program",
                youtubeVideo: "https://www.youtube.com/watch?v=IWuU52rFAOg",
                workoutSchedule: "3 sessions per week with specific defensive, offensive, and general movement days.",
                workoutDetails: "Defensive slide drills, reaction training, first-step acceleration work, and full-court transition speed development.",
                basketballSpecificDrills: "Close-out technique, defensive recovery, offensive evasion moves, and screen navigation drills."
              },
              {
                name: "In-Season Basketball Maintenance",
                description: "Keep your strength, power, and conditioning at peak levels throughout the season while avoiding overtraining and managing fatigue.",
                image: "https://images.unsplash.com/photo-1608245449230-4ac17ba4c805?q=80&w=1000",
                category: "Program",
                youtubeVideo: "https://www.youtube.com/watch?v=Z9FQ7IJ4PJM",
                workoutSchedule: "2 brief but intense sessions per week, designed to work around practice and game schedules.",
                workoutDetails: "Maintenance-level strength work, brief power development, and strategic recovery protocols.",
                recoveryProtocols: "Active recovery techniques, mobility work, and nutrition strategies to maintain performance during the competitive season."
              }
            ]
          },
          {
            name: "Track & Field Training",
            description: "Event-specific training programs for sprinters, jumpers, throwers, and distance runners.",
            image: "https://images.unsplash.com/photo-1527933053326-89d1746b76b9?q=80&w=1000",
            products: [
              {
                name: "Sprint Technique & Speed Development",
                description: "Comprehensive sprint training program focusing on technique, acceleration, top-end speed, and speed endurance for 100m-400m specialists.",
                image: "https://images.unsplash.com/photo-1527933053326-89d1746b76b9?q=80&w=1000",
                category: "Program",
                youtubeVideo: "https://www.youtube.com/watch?v=mTsubxUqXjE",
                workoutSchedule: "4-5 sessions per week with specific focus days for acceleration, top speed, and speed endurance.",
                workoutDetails: "Technical drills, sprint mechanics work, block start practice, and progressive interval training.",
                technicFocus: "Start mechanics, acceleration posture, maximal velocity mechanics, and race strategy for different sprint distances."
              },
              {
                name: "Jumps Training Program",
                description: "Specialized program for long jump, triple jump, and high jump athletes focusing on approach consistency, takeoff power, and technical execution.",
                image: "https://images.unsplash.com/photo-1596813362035-3edcff0c2487?q=80&w=1000",
                category: "Program",
                youtubeVideo: "https://www.youtube.com/watch?v=9CMeKabZFQ8",
                workoutSchedule: "4 sessions per week: 2 jump-specific, 1 strength, 1 plyometric/power development.",
                workoutDetails: "Approach run development, takeoff mechanics, plyometric progressions, and event-specific technical work.",
                eventSpecificTraining: "Separate modules for long jump, triple jump, and high jump with specialized drills for each discipline."
              },
              {
                name: "Throwers Development Program",
                description: "Comprehensive training for shot put, discus, javelin, and hammer throw athletes focusing on technique, strength, power, and rotational/linear movement patterns.",
                image: "https://images.unsplash.com/photo-1603380909571-1006c6f7ee93?q=80&w=1000",
                category: "Program",
                youtubeVideo: "https://www.youtube.com/watch?v=vLyyPPdBNPY",
                workoutSchedule: "5-6 sessions per week: 3 strength/power sessions, 2-3 technical throwing sessions.",
                workoutDetails: "Heavy strength development, explosive power work, implement-specific drills, and technical refinement.",
                implementSpecificModules: "Specialized training for each throwing discipline with implement-specific technique work and strength development."
              }
            ]
          }
        ]
      },
      {
        name: "Functional Fitness & CrossFit",
        description: "Training programs focused on developing well-rounded fitness through constantly varied, high-intensity functional movements. Build strength, endurance, flexibility, power, speed, coordination, agility, balance, and accuracy.",
        image: "https://images.unsplash.com/photo-1517344884509-a0c97ec11bcc?q=80&w=1000",
        children: [
          {
            name: "CrossFit-Style Programs",
            description: "Comprehensive CrossFit-style training programs for all skill levels focusing on the 10 general physical skills.",
            image: "https://images.unsplash.com/photo-1533681904393-9ab6eee7e408?q=80&w=1000",
            products: [
              {
                name: "CrossFit Fundamentals Program",
                description: "Master the foundational movements of CrossFit with this comprehensive introduction to functional fitness. Learn proper technique for all major movements in a progressive, structured format.",
                image: "https://images.unsplash.com/photo-1533681904393-9ab6eee7e408?q=80&w=1000",
                category: "Program",
                youtubeVideo: "https://www.youtube.com/watch?v=2IN1IWnYwQ4",
                workoutSchedule: "3-4 sessions per week for 6 weeks, building progressively in complexity and intensity.",
                workoutDetails: "Structured skill development for squats, presses, deadlifts, Olympic lifts, gymnastics skills, and metabolic conditioning.",
                skillProgressions: "Step-by-step progressions for complex movements like kipping pull-ups, handstand push-ups, and Olympic lifts."
              },
              {
                name: "Garage Gym WOD Program",
                description: "A complete CrossFit-style program designed for those training with limited equipment in a home or garage gym setting.",
                image: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=1000",
                category: "Program",
                youtubeVideo: "https://www.youtube.com/watch?v=GkT9dAxLlUw",
                workoutSchedule: "5 workouts per week with minimal equipment requirements.",
                workoutDetails: "Creative programming using dumbbells, kettlebells, pull-up bars, and bodyweight movements to develop complete fitness.",
                equipmentNeeded: "Pull-up bar, dumbbells/kettlebells, jump rope, and optional box or bench."
              },
              {
                name: "Competitor Programming",
                description: "Advanced CrossFit program designed for experienced athletes looking to compete. Includes strength cycles, skill development, and competition-specific conditioning.",
                image: "https://images.unsplash.com/photo-1518611012118-696072aa579a?q=80&w=1000",
                category: "Program",
                youtubeVideo: "https://www.youtube.com/watch?v=RhNRnpcHJ10",
                workoutSchedule: "6 days per week with 2 daily sessions (strength/skill focus + conditioning).",
                workoutDetails: "Periodized strength program, advanced gymnastics skill development, metabolic conditioning, and competition strategy preparation.",
                periodizationModel: "Annual plan with off-season, pre-season, competition season, and recovery phases clearly defined."
              },
              {
                name: "Masters CrossFit Program",
                description: "Specifically designed for athletes 40+ focused on developing fitness while prioritizing longevity, recovery, and injury prevention.",
                image: "https://images.unsplash.com/photo-1579126038374-6064e9370f0f?q=80&w=1000",
                category: "Program",
                youtubeVideo: "https://www.youtube.com/watch?v=UC08e7GjVFM",
                workoutSchedule: "4-5 sessions per week with strategic recovery protocols and joint-friendly movement patterns.",
                workoutDetails: "Modified movement patterns, appropriate scaling options, and intensity management while still developing all aspects of fitness.",
                recoveryFocus: "Enhanced recovery protocols, mobility work, and training modifications to accommodate the unique needs of masters athletes."
              }
            ]
          },
          {
            name: "Functional Bodyweight Training",
            description: "Develop strength, mobility and control using just your bodyweight with these minimalist but effective programs.",
            image: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?q=80&w=1000",
            products: [
              {
                name: "Bodyweight Mastery Program",
                description: "Develop impressive strength, control, and body awareness through progressive calisthenics training. No equipment needed, just your body and gravity.",
                image: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?q=80&w=1000",
                category: "Program",
                youtubeVideo: "https://www.youtube.com/watch?v=qpKa-Iyb604",
                workoutSchedule: "4-5 sessions per week focusing on different movement patterns and skills.",
                workoutDetails: "Progressive development from basic to advanced variations of push-ups, pull-ups, squats, handstands, and more.",
                skillProgressions: "Step-by-step progressions toward advanced bodyweight skills like muscle-ups, handstand push-ups, pistol squats, and front levers."
              },
              {
                name: "Mobility & Movement Flow",
                description: "Restore natural movement patterns, improve mobility, and develop flow-state movement practice. Perfect for improving flexibility while building functional strength.",
                image: "https://images.unsplash.com/photo-1552196563-55cd4e45efb3?q=80&w=1000",
                category: "Program",
                youtubeVideo: "https://www.youtube.com/watch?v=Yt_UoCF9y3Q",
                workoutSchedule: "Daily 15-30 minute movement practices with 2 longer sessions per week.",
                workoutDetails: "Ground-based locomotion patterns, mobility flows, and movement exploration focusing on natural human movement.",
                movementPhilosophy: "Focus on reclaiming natural human movement capacity through exploration, play, and progressive challenge."
              },
              {
                name: "Travel-Ready Bodyweight HIIT",
                description: "High-intensity interval training using only your bodyweight. Stay fit anywhere with these efficient, effective workouts that require no equipment.",
                image: "https://images.unsplash.com/photo-1486218119243-13883505764c?q=80&w=1000",
                category: "Program",
                youtubeVideo: "https://www.youtube.com/watch?v=ml6cT4AZdqI",
                workoutSchedule: "3-5 sessions per week, each taking only 20-30 minutes.",
                workoutDetails: "Structured interval protocols using bodyweight exercises to develop both strength and cardiovascular capacity.",
                workoutFormats: "Tabata, EMOM, AMRAP, and circuit formats with clear scaling options for all fitness levels."
              }
            ]
          },
          {
            name: "Olympic Weightlifting",
            description: "Technical programs focused on the snatch and clean & jerk for both fitness enthusiasts and competitive weightlifters.",
            image: "https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?q=80&w=1000",
            products: [
              {
                name: "Olympic Lifting Fundamentals",
                description: "Learn the technical foundations of the snatch and clean & jerk through progressive skill development. Perfect for beginners to the Olympic lifts.",
                image: "https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?q=80&w=1000",
                category: "Program",
                youtubeVideo: "https://www.youtube.com/watch?v=AjfXHrfDEgY",
                workoutSchedule: "3 sessions per week over 8 weeks, with clear technical progressions.",
                workoutDetails: "Position-based teaching methodology for both lifts, gradually combining positions into full movements.",
                technicalFocus: "Detailed breakdown of positions, movement patterns, and common errors with correction strategies."
              },
              {
                name: "Strength Cycles for Weightlifting",
                description: "Targeted strength development specifically for improving your Olympic lifts. Focus on position-specific strength and technical proficiency.",
                image: "https://images.unsplash.com/photo-1577221084712-45b0445d2b00?q=80&w=1000",
                category: "Program",
                youtubeVideo: "https://www.youtube.com/watch?v=AYtFQCOI0Gg",
                workoutSchedule: "4 sessions per week over a 12-week cycle.",
                workoutDetails: "Heavy focus on squats, pulls, and position-specific strength plus technical work at varying intensities.",
                periodizationModel: "Volume accumulation leading to intensity peaks with regular technical assessment and modification."
              },
              {
                name: "Competition Preparation Cycle",
                description: "A complete preparation cycle for weightlifters planning to compete. Includes peaking strategy, attempt selection guidance, and competition day planning.",
                image: "https://images.unsplash.com/photo-1596111581939-41e5be365b52?q=80&w=1000",
                category: "Program",
                youtubeVideo: "https://www.youtube.com/watch?v=9s8DvM5yYDc",
                workoutSchedule: "5 sessions per week over a 16-week competition preparation cycle.",
                workoutDetails: "Progressive loading with strategic deloads, technical refinement, and competition simulation sessions.",
                competitionStrategy: "Attempt selection strategies, warm-up protocols, and mental preparation techniques for competition day."
              }
            ]
          }
        ]
      }
    ]
  };

  if (!data.collections) {
    console.error('No collections found in data file.');
    process.exit(1);
  }

  console.log('Starting to populate fitness training collections...');

  for (const parent of data.collections) {
    console.log(`Creating parent collection: ${parent.name}`);
    const parentDoc = new Collection({
      name: parent.name,
      description: parent.description,
      image: parent.image,
      user: adminUser._id,
      isPublic: true,
      requiresCode: false,
      products: []
    });
    const savedParent = await parentDoc.save();

    for (const child of parent.children || []) {
      console.log(`Creating child collection: ${child.name}`);
      const childDoc = new Collection({
        name: child.name,
        description: child.description,
        image: child.image,
        user: adminUser._id,
        parentCollection: savedParent._id,
        isPublic: true,
        requiresCode: false,
        products: []
      });
      const savedChild = await childDoc.save();

      for (const prod of child.products || []) {
        console.log(`Creating product: ${prod.name}`);
        let enhancedDescription = prod.description;
        
        // Add all available details to the description
        if (prod.workoutSchedule) enhancedDescription += ` Workout Schedule: ${prod.workoutSchedule}`;
        if (prod.workoutDetails) enhancedDescription += ` Workout Details: ${prod.workoutDetails}`;
        if (prod.equipmentNeeded) enhancedDescription += ` Equipment Needed: ${prod.equipmentNeeded}`;
        if (prod.nutritionTips) enhancedDescription += ` Nutrition Tips: ${prod.nutritionTips}`;
        if (prod.benefitsDescription) enhancedDescription += ` Benefits: ${prod.benefitsDescription}`;
        if (prod.progressionStrategy) enhancedDescription += ` Progression Strategy: ${prod.progressionStrategy}`;
        if (prod.periodizationModel) enhancedDescription += ` Periodization Model: ${prod.periodizationModel}`;
        if (prod.functionalBenefits) enhancedDescription += ` Functional Benefits: ${prod.functionalBenefits}`;
        if (prod.competitionPrep) enhancedDescription += ` Competition Preparation: ${prod.competitionPrep}`;
        if (prod.strengthPrinciples) enhancedDescription += ` Strength Principles: ${prod.strengthPrinciples}`;
        if (prod.implementationGuide) enhancedDescription += ` Implementation Guide: ${prod.implementationGuide}`;
        if (prod.sportSpecificBenefits) enhancedDescription += ` Sport-Specific Benefits: ${prod.sportSpecificBenefits}`;
        if (prod.conditioningPhilosophy) enhancedDescription += ` Conditioning Philosophy: ${prod.conditioningPhilosophy}`;
        if (prod.progressionProtocol) enhancedDescription += ` Progression Protocol: ${prod.progressionProtocol}`;
        if (prod.basketballSpecificDrills) enhancedDescription += ` Basketball-Specific Drills: ${prod.basketballSpecificDrills}`;
        if (prod.recoveryProtocols) enhancedDescription += ` Recovery Protocols: ${prod.recoveryProtocols}`;
        if (prod.technicFocus) enhancedDescription += ` Technical Focus: ${prod.technicFocus}`;
        if (prod.eventSpecificTraining) enhancedDescription += ` Event-Specific Training: ${prod.eventSpecificTraining}`;
        if (prod.implementSpecificModules) enhancedDescription += ` Implement-Specific Modules: ${prod.implementSpecificModules}`;
        if (prod.skillProgressions) enhancedDescription += ` Skill Progressions: ${prod.skillProgressions}`;
        if (prod.movementPhilosophy) enhancedDescription += ` Movement Philosophy: ${prod.movementPhilosophy}`;
        if (prod.workoutFormats) enhancedDescription += ` Workout Formats: ${prod.workoutFormats}`;
        if (prod.technicalFocus) enhancedDescription += ` Technical Focus: ${prod.technicalFocus}`;
        if (prod.competitionStrategy) enhancedDescription += ` Competition Strategy: ${prod.competitionStrategy}`;
        
        const prodDoc = new Product({
          name: prod.name,
          description: enhancedDescription,
          image: prod.image,
          category: prod.category,
          youtubeVideo: prod.youtubeVideo,
          user: adminUser._id,
          rating: 5,
          numReviews: 0,
        });
        const savedProd = await prodDoc.save();
        await Collection.findByIdAndUpdate(savedChild._id, {
          $push: { products: { product: savedProd._id, displayOrder: 0 } }
        });
      }
    }
  }

  console.log('Fitness training collections populated successfully!');
  process.exit();
};

run().catch(err => {
  console.error(`Error: ${err.message}`);
  process.exit(1);
});