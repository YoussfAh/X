import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import Collection from './collectionModel.js';
import Product from './productModel.js';
import User from './userModel.js';
import connectDB from '../config/db.js';

dotenv.config();

const data = {
  collections: [
    // Week 1
    {
        name: "Week 1  Push/Pull/Legs & Arms",
        description: "Full Week 1 from the Pure Bodybuilding Program by Jeff Nippard.",
        image: "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
        children: [
          {
            name: "Push #1",
            description: "Chest & triceps focus. Incorporates compound and isolation pressing.",
            image: "https://images.unsplash.com/photo-1532029837206-abbe2b7620e3?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
            products: [
              {
                name: "DB Bench Press",
                description: "Sets: 3, Reps: 6–10, Rest: ~2–3 min. Focus on explosive concentric. Alternatives: Barbell Bench Press (https://youtu.be/1yKAQLVV_XI)",
                youtubeVideo: "https://youtu.be/FMSCZYu1JhE",
                image: "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
              },
              {
                name: "Incline DB Press",
                description: "Sets: 3, Reps: ~9, Rest: ~2–3 min. Emphasize upper chest by keeping elbows 45°. Alternatives: Incline Machine Press (https://youtu.be/6lR2JdxUh7w)",
                youtubeVideo: "https://youtu.be/6lR2JdxUh7w",
                image: "https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
              },
              {
                name: "Overhead DB Press",
                description: "Sets: 3, Reps: ~10, Rest: ~1–2 min. Avoid flaring elbows past ears. Alternatives: Barbell Overhead Press (https://youtu.be/lWIEZ6NxPMk)",
                youtubeVideo: "https://youtu.be/lWIEZ6NxPMk",
                image: "https://images.unsplash.com/photo-1604480133435-25b86862d276?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
              },
              {
                name: "Cable Lateral Raise",
                description: "Sets: 3, Reps: ~12, Rest: ~1–2 min. Slight lean for better tension. Alternatives: DB Lateral Raise (https://youtu.be/uFbNtqP966A)",
                youtubeVideo: "https://youtu.be/uFbNtqP966A",
                image: "https://images.unsplash.com/photo-1581009137042-c552e485697a?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
              },
              {
                name: "Triceps Rope Pressdown",
                description: "Sets: 3, Reps: ~10, Rest: ~1–2 min. Control eccentric and split rope at bottom. Alternatives: Straight Bar Pressdown (https://youtu.be/JkY3nBTbRac)",
                youtubeVideo: "https://youtu.be/JkY3nBTbRac",
                image: "https://images.unsplash.com/photo-1530822847156-5df684ec5ee1?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
              },
              {
                name: "Overhead Cable Triceps Extension",
                description: "Sets: 3, Reps: ~12, Rest: ~1–2 min. Emphasize long head of triceps. Alternatives: DB Overhead Extension (https://youtu.be/sX4tGtcc62k)",
                youtubeVideo: "https://youtu.be/sX4tGtcc62k",
                image: "https://images.unsplash.com/photo-1584863231364-2edc166de576?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
              }
            ]
          }
        ]
      }  ,
    // Week 2
    {
      name: "Week 2 – Push/Pull/Legs & Arms",
      description: "Full Week 2 from the Pure Bodybuilding Program by Jeff Nippard.",
      image: "https://images.unsplash.com/photo-1574680178050-55c6a6a96e0a?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      children: [
        {
          name: "Push #2",
          description: "Slight incline emphasis & higher volume.",
          image: "https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
          products: [
            { name: "Incline Barbell Press", description: "Sets: 3, Reps: 8–12, Rest: ~2 min. Alternatives: DB Incline Press (https://youtu.be/PrwC-5NTCCs)", youtubeVideo: "https://youtu.be/PrwC-5NTCCs", image: "https://images.unsplash.com/photo-1534368959876-26bf04f2c947?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" },
            { name: "Flat DB Press", description: "Sets: 3, Reps: 8–10, Rest: ~2 min. Alternatives: Barbell Bench Press (https://youtu.be/1yKAQLVV_XI)", youtubeVideo: "https://youtu.be/1yKAQLVV_XI", image: "https://images.unsplash.com/photo-1584464491033-06628f3a6b11?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" },
            { name: "Machine Chest Press", description: "Sets: 3, Reps: 10–15, Rest: ~1–2 min. Alternatives: Pec Deck (https://youtu.be/WtokJfvWl-I)", youtubeVideo: "https://youtu.be/WtokJfvWl-I", image: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" },
            { name: "Cable Flye Low-to-High", description: "Sets: 3, Reps: 12–15, Rest: ~1 min. Alternatives: Dumbbell Flye (https://youtu.be/DM9YlXRDGuI)", youtubeVideo: "https://youtu.be/DM9YlXRDGuI", image: "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" },
            { name: "Overhead Triceps Extension", description: "Sets: 3, Reps: 10–12, Rest: ~1–2 min. Alternatives: Rope Extension (https://youtu.be/JkY3nBTbRac)", youtubeVideo: "https://youtu.be/JkY3nBTbRac", image: "https://images.unsplash.com/photo-1597452485669-2c7bb5fef90d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" },
            { name: "Lateral Raise Drop Set", description: "Sets: 2, Reps: 12–15 + drop, Rest: ~1 min. Alternatives: Machine Lateral Raise (https://youtu.be/fzpYiRtzmFA)", youtubeVideo: "https://youtu.be/fzpYiRtzmFA", image: "https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" }
          ]
        },
        {
          name: "Pull #2",
          description: "Mid-back focus with rowing variations.",
          image: "https://images.unsplash.com/photo-1596357395217-80de13130e92?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
          products: [
            { name: "Chest-Supported Row", description: "Sets: 3, Reps: 8–12, Rest: ~2 min. Alternatives: T-Bar Row (https://youtu.be/r8K1Fkch5go)", youtubeVideo: "https://youtu.be/r8K1Fkch5go", image: "https://images.unsplash.com/photo-1532029837206-abbe2b7620e3?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" },
            { name: "Lat Pulldown", description: "Sets: 3, Reps: 10–12, Rest: ~2 min. Alternatives: Pull-up (https://youtu.be/ijgSR2yriyg)", youtubeVideo: "https://youtu.be/ijgSR2yriyg", image: "https://images.unsplash.com/photo-1616803689943-5601631c7fec?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" },
            { name: "Seated Cable Row", description: "Sets: 3, Reps: 10–12, Rest: ~1–2 min. Alternatives: Machine Row (https://youtu.be/fbLTzgTKOR8)", youtubeVideo: "https://youtu.be/fbLTzgTKOR8", image: "https://images.unsplash.com/photo-1616803689943-5601631c7fec?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" },
            { name: "Face Pulls", description: "Sets: 3, Reps: 12–15, Rest: ~1 min. Alternatives: Reverse Flye (https://youtu.be/uFbNtqP966A)", youtubeVideo: "https://youtu.be/uFbNtqP966A", image: "https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" },
            { name: "Hammer Curl", description: "Sets: 3, Reps: 10–12, Rest: ~1–2 min. Alternatives: Cable Curl (https://youtu.be/FMSCZYu1JhE)", youtubeVideo: "https://youtu.be/FMSCZYu1JhE", image: "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" },
            { name: "Preacher Curl", description: "Sets: 3, Reps: 8–10, Rest: ~1–2 min. Alternatives: EZ-Bar Curl (https://youtu.be/6lR2JdxUh7w)", youtubeVideo: "https://youtu.be/6lR2JdxUh7w", image: "https://images.unsplash.com/photo-1581009137042-c552e485697a?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" }
          ]
        },
        {
          name: "Legs #2",
          description: "Quad & hamstring balance with compound lifts.",
          image: "https://images.unsplash.com/photo-1574680096145-d05b474e375b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
          products: [
            { name: "Back Squat", description: "Sets: 4, Reps: 6–10, Rest: ~3 min. Alternatives: Front Squat (https://youtu.be/fzpYiRtzmFA)", youtubeVideo: "https://youtu.be/fzpYiRtzmFA", image: "https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" },
            { name: "Leg Press", description: "Sets: 3, Reps: 10–12, Rest: ~2 min. Alternatives: Hack Squat (https://youtu.be/QRLGyl5-i4k)", youtubeVideo: "https://youtu.be/QRLGyl5-i4k", image: "https://images.unsplash.com/photo-1534438097545-a2c22c57f2ad?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" },
            { name: "Romanian Deadlift", description: "Sets: 3, Reps: 8–12, Rest: ~2–3 min. Alternatives: RDL with DB (https://youtu.be/S6DTPNZ_-F4)", youtubeVideo: "https://youtu.be/S6DTPNZ_-F4", image: "https://images.unsplash.com/photo-1566241142559-40e1dab266c6?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" },
            { name: "Leg Extension", description: "Sets: 3, Reps: 12–15, Rest: ~1–2 min. Alternatives: Sissy Squat (https://youtu.be/lWIEZ6NxPMk)", youtubeVideo: "https://youtu.be/lWIEZ6NxPMk", image: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" },
            { name: "Seated Leg Curl", description: "Sets: 3, Reps: 10–12, Rest: ~1–2 min. Alternatives: Lying Leg Curl (https://youtu.be/0eQQwveeQzw)", youtubeVideo: "https://youtu.be/0eQQwveeQzw", image: "https://images.unsplash.com/photo-1434608519344-49d77a699e1d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" },
            { name: "Calf Raise", description: "Sets: 4, Reps: 12–15, Rest: ~1–2 min. Alternatives: Donkey Calf Raise (https://youtu.be/3FNfi_PrP9Y)", youtubeVideo: "https://youtu.be/3FNfi_PrP9Y", image: "https://images.unsplash.com/photo-1603287681836-b174ce5074c2?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" }
          ]
        },
        {
          name: "Arms & Weak Points #2",
          description: "Focus on arms with weak-point specialization.",
          image: "https://images.unsplash.com/photo-1590507621108-433608c97823?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
          products: [
            { name: "DB Scott Curl", description: "Sets: 3, Reps: 9–10, Rest: ~1–3 min. Alternatives: Cable Curl (https://youtu.be/eWAjlO4FWPQ)", youtubeVideo: "https://youtu.be/eWAjlO4FWPQ", image: "https://images.unsplash.com/photo-1581009137042-c552e485697a?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" },
            { name: "DB Skull Crusher", description: "Sets: 3, Reps: 9–10, Rest: ~1–3 min. Alternatives: EZ-Bar Skull Crusher (https://youtu.be/fjiOCmFljDM)", youtubeVideo: "https://youtu.be/fjiOCmFljDM", image: "https://images.unsplash.com/photo-1532029837206-abbe2b7620e3?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" },
            { name: "Hammer Curl", description: "Sets: 3, Reps: 10–12, Rest: ~1–2 min. Alternatives: Reverse-Grip Curl (https://youtu.be/GhrVM-jPIEA)", youtubeVideo: "https://youtu.be/GhrVM-jPIEA", image: "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" },
            { name: "Triceps Pushdown", description: "Sets: 3, Reps: 10–12, Rest: ~1–2 min. Alternatives: Close-Grip Dip (https://youtu.be/FvekMyIs-yk)", youtubeVideo: "https://youtu.be/FvekMyIs-yk", image: "https://images.unsplash.com/photo-1595078475328-1ab05d0a6a0e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" },
            { name: "Cable Curl Drop Set", description: "Sets: 2, Reps: 12–15 + drop, Rest: ~1 min. Alternatives: Spider Curl (https://youtu.be/TZAmthQJkh8)", youtubeVideo: "https://youtu.be/TZAmthQJkh8", image: "https://images.unsplash.com/photo-1584464491033-06628f3a6b11?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" },
            { name: "Overhead Rope Extension", description: "Sets: 3, Reps: 12–15, Rest: ~1–2 min. Alternatives: Lying Triceps Extension (https://youtu.be/NPa8YvUg4CM)", youtubeVideo: "https://youtu.be/NPa8YvUg4CM", image: "https://images.unsplash.com/photo-1530822847156-5df684ec5ee1?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" }
          ]
        }
      ]
    },
    // Week 3
    {
      name: "Week 3 – Push/Pull/Legs & Arms",
      description: "Full Week 3 from the Pure Bodybuilding Program.",
      image: "https://images.unsplash.com/photo-1526506118085-60ce8714f8c5?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      children: [
        {
          name: "Push #3",
          description: "Heavy compound focus with volume taper.",
          image: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
          products: [
            { name: "Flat Barbell Press", description: "Sets: 4, Reps: 6–8, Rest: ~2–3 min. Pause 1s at bottom. Alternatives: DB Bench Press (https://youtu.be/FMSCZYu1JhE)", youtubeVideo: "https://youtu.be/FMSCZYu1JhE", image: "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" },
            { name: "Incline DB Flye", description: "Sets: 3, Reps: 10–12, Rest: ~1–2 min. Emphasize upper chest stretch. Alternatives: Cable Crossover Low-to-High (https://youtu.be/DM9YlXRDGuI)", youtubeVideo: "https://youtu.be/DM9YlXRDGuI", image: "https://images.unsplash.com/photo-1532029837206-abbe2b7620e3?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" },
            { name: "Seated Arnold Press", description: "Sets: 3, Reps: 8–10, Rest: ~2 min. Keep elbows forward. Alternatives: Military Press (https://youtu.be/lWIEZ6NxPMk)", youtubeVideo: "https://youtu.be/lWIEZ6NxPMk", image: "https://images.unsplash.com/photo-1576678927484-cc907957088c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" },
            { name: "Lateral Raise Machine", description: "Sets: 3, Reps: 12–15, Rest: ~1–2 min. Hold peak contraction. Alternatives: Cable Lateral Raise (https://youtu.be/uFbNtqP966A)", youtubeVideo: "https://youtu.be/uFbNtqP966A", image: "https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" },
            { name: "Skull Crusher", description: "Sets: 3, Reps: 8–10, Rest: ~1–2 min. Keep elbows in place. Alternatives: DB Skull Crusher (https://youtu.be/fjiOCmFljDM)", youtubeVideo: "https://youtu.be/fjiOCmFljDM", image: "https://images.unsplash.com/photo-1530822847156-5df684ec5ee1?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" },
            { name: "Triceps Dip", description: "Sets: 3, Reps: 10–12, Rest: ~1–2 min. Lean forward for chest. Alternatives: Triceps Pushdown (https://youtu.be/TZAmthQJkh8)", youtubeVideo: "https://youtu.be/TZAmthQJkh8", image: "https://images.unsplash.com/photo-1507398941214-572c25f4b1dc?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" }
          ]
        },
        {
          name: "Pull #3",
          description: "Volume-focused lat & mid-back work.",
          image: "https://images.unsplash.com/photo-1541802645635-11f2286a7482?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
          products: [
            { name: "Neutral-Grip Pullup", description: "Sets: 3, Reps: ~9, Rest: ~2–3 min. Alternatives: Lat Pulldown (https://youtu.be/ijgSR2yriyg)", youtubeVideo: "https://youtu.be/ijgSR2yriyg", image: "https://images.unsplash.com/photo-1598971639058-b208eb8304c6?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" },
            { name: "Chest-Supported T-Bar Row", description: "Sets: 3, Reps: 10–12, Rest: ~1–2 min. Alternatives: Seated Cable Row (https://youtu.be/fbLTzgTKOR8)", youtubeVideo: "https://youtu.be/fbLTzgTKOR8", image: "https://images.unsplash.com/photo-1546483875-ad9014c88eba?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" },
            { name: "Straight-Arm Pulldown", description: "Sets: 3, Reps: 12–15, Rest: ~1–2 min. Alternatives: Pull-Over Machine (https://youtu.be/S6DTPNZ_-F4)", youtubeVideo: "https://youtu.be/S6DTPNZ_-F4", image: "https://images.unsplash.com/photo-1616803689943-5601631c7fec?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" },
            { name: "Bent-Over Reverse Flye", description: "Sets: 3, Reps: 10–12, Rest: ~1–2 min. Alternatives: Face Pull (https://youtu.be/uFbNtqP966A)", youtubeVideo: "https://youtu.be/uFbNtqP966A", image: "https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" },
            { name: "Hammer Curl", description: "Sets: 3, Reps: 10–12, Rest: ~1–2 min. Alternatives: Rope Hammer Curl (https://youtu.be/r8K1Fkch5go)", youtubeVideo: "https://youtu.be/r8K1Fkch5go", image: "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" },
            { name: "Preacher Curl", description: "Sets: 3, Reps: 8–10, Rest: ~1–2 min. Alternatives: DB Scott Curl (https://youtu.be/0eQQwveeQzw)", youtubeVideo: "https://youtu.be/0eQQwveeQzw", image: "https://images.unsplash.com/photo-1581009137042-c552e485697a?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" }
          ]
        },
        {
          name: "Legs #3",
          description: "Hamstring & quad emphasis with mixed reps.",
          image: "https://images.unsplash.com/photo-1517963879433-6ad2b056d712?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
          products: [
            { name: "Romanian Deadlift", description: "Sets: 3, Reps: 8–12, Rest: ~2–3 min. Alternatives: DB RDL (https://youtu.be/S6DTPNZ_-F4)", youtubeVideo: "https://youtu.be/S6DTPNZ_-F4", image: "https://images.unsplash.com/photo-1566241142559-40e1dab266c6?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" },
            { name: "Front Squat", description: "Sets: 3, Reps: 6–10, Rest: ~3 min. Alternatives: Back Squat (https://youtu.be/fzpYiRtzmFA)", youtubeVideo: "https://youtu.be/fzpYiRtzmFA", image: "https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" },
            { name: "Leg Press", description: "Sets: 3, Reps: 10–12, Rest: ~2 min. Alternatives: Hack Squat (https://youtu.be/QRLGyl5-i4k)", youtubeVideo: "https://youtu.be/QRLGyl5-i4k", image: "https://images.unsplash.com/photo-1534438097545-a2c22c57f2ad?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" },
            { name: "Leg Extension", description: "Sets: 3, Reps: 12–15, Rest: ~1–2 min. Alternatives: Sissy Squat (https://youtu.be/lWIEZ6NxPMk)", youtubeVideo: "https://youtu.be/lWIEZ6NxPMk", image: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" },
            { name: "Seated Leg Curl", description: "Sets: 3, Reps: 10–12, Rest: ~1–2 min. Alternatives: Lying Leg Curl (https://youtu.be/0eQQwveeQzw)", youtubeVideo: "https://youtu.be/0eQQwveeQzw", image: "https://images.unsplash.com/photo-1434608519344-49d77a699e1d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" },
            { name: "Calf Raise", description: "Sets: 4, Reps: 12–15, Rest: ~1–2 min. Alternatives: Donkey Calf Raise (https://youtu.be/3FNfi_PrP9Y)", youtubeVideo: "https://youtu.be/3FNfi_PrP9Y", image: "https://images.unsplash.com/photo-1603287681836-b174ce5074c2?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" }
          ]
        },
        {
          name: "Arms & Weak Points #3",
          description: "Arms specialization with weak-point options.",
          image: "https://images.unsplash.com/photo-1583454155184-870a1f63aebc?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
          products: [
            { name: "Cable Curl", description: "Sets: 3, Reps: 9–10, Rest: ~1–3 min. Alternatives: Bayesian Curl (https://youtu.be/fjiOCmFljDM)", youtubeVideo: "https://youtu.be/fjiOCmFljDM", image: "https://images.unsplash.com/photo-1584863231364-2edc166de576?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" },
            { name: "EZ-Bar Skull Crusher", description: "Sets: 3, Reps: 8–10, Rest: ~1–3 min. Alternatives: DB Skull Crusher (https://youtu.be/fjiOCmFljDM)", youtubeVideo: "https://youtu.be/fjiOCmFljDM", image: "https://images.unsplash.com/photo-1530822847156-5df684ec5ee1?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" },
            { name: "Hammer Curl", description: "Sets: 3, Reps: 10–12, Rest: ~1–2 min. Alternatives: Reverse-Grip Curl (https://youtu.be/GhrVM-jPIEA)", youtubeVideo: "https://youtu.be/GhrVM-jPIEA", image: "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" },
            { name: "Triceps Pushdown (Rope)", description: "Sets: 3, Reps: 10–12, Rest: ~1–2 min. Alternatives: Bar Pushdown (https://youtu.be/FvekMyIs-yk)", youtubeVideo: "https://youtu.be/FvekMyIs-yk", image: "https://images.unsplash.com/photo-1595078475328-1ab05d0a6a0e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" },
            { name: "Spider Curl", description: "Sets: 2, Reps: 12–15, Rest: ~1 min. Alternatives: Preacher Curl (https://youtu.be/S6DTPNZ_-F4)", youtubeVideo: "https://youtu.be/S6DTPNZ_-F4", image: "https://images.unsplash.com/photo-1581009137042-c552e485697a?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" },
            { name: "Rope Triceps Extension", description: "Sets: 3, Reps: 12–15, Rest: ~1–2 min. Alternatives: Overhead Rope (https://youtu.be/NPa8YvUg4CM)", youtubeVideo: "https://youtu.be/NPa8YvUg4CM", image: "https://images.unsplash.com/photo-1530822847156-5df684ec5ee1?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" }
          ]
        }
      ]
    },
   
  ]
};

const run = async () => {
  await connectDB();
  const adminUser = await User.findOne({ isAdmin: true });
  if (!adminUser) {
    console.error('No admin user found.');
    process.exit(1);
  }

  for (const parent of data.collections) {
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
        const prodDoc = new Product({
          ...prod,
          category: prod.category || child.name.split(' ')[0], // Use first word of workout name as category if not provided
          user: adminUser._id,
          price: 0,
          countInStock: 999,
          rating: 5,
          numReviews: 0,
          brand: 'Fitness'
        });
        const savedProd = await prodDoc.save();
        await Collection.findByIdAndUpdate(savedChild._id, {
          $push: { products: { product: savedProd._id, displayOrder: 0 } }
        });
      }
    }
  }

  console.log('Database populated successfully!');
  process.exit();
};

run();
