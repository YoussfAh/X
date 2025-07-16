# 🎨 Custom Hero Template Guide

## Overview
The **Custom Hero Template** is a fully customizable hero section where **ALL content comes from the admin settings page**. Unlike other templates that have fixed designs, this template's content is completely editable through the admin interface.

## 🔧 How It Works

### 1. **Template Structure**
- **Fixed Design**: The visual layout and styling remain consistent
- **Dynamic Content**: All text, buttons, stats, and images are controlled from admin settings
- **Real-time Updates**: Changes in admin panel immediately reflect on the website

### 2. **Editable Elements**

#### **Text Content**
- ✅ **Title**: Main hero heading
- ✅ **Subtitle**: Descriptive text below title
- ✅ **Background Image**: Hero section background

#### **Action Buttons**
- ✅ **Primary Button**: Main call-to-action (text + link)
- ✅ **Secondary Button**: Secondary action (text + link)

#### **Statistics Cards**
- ✅ **Dynamic Stats**: Add/remove/edit statistics
- ✅ **Custom Icons**: Choose from 10+ icon options
- ✅ **Flexible Values**: Any text/numbers

## 🚀 How to Use

### Step 1: Access Admin Panel
1. Go to `http://localhost:3000/admin/system-settings`
2. Click on the **"Main Hero"** tab
3. You'll see all available templates including **"Custom Hero"**

### Step 2: Select Custom Template
1. Find the **"Custom Hero"** card
2. Click **"Selected"** to make it active
3. Click **"Edit"** to customize content

### Step 3: Customize Content
In the edit modal, you can modify:

#### **Basic Content**
```
Title: "TRANSFORM YOUR FITNESS JOURNEY"
Subtitle: "Achieve your goals with our personalized fitness programs..."
Background Image: "https://your-image-url.com/image.jpg"
```

#### **Buttons**
```
Primary Button:
- Text: "Start Your Journey"
- Link: "/workout"

Secondary Button:
- Text: "Learn More"  
- Link: "/about"
```

#### **Statistics**
```
Stat 1: Success Rate | 95% | Trophy Icon
Stat 2: Active Users | 10K+ | Fire Icon
Stat 3: Workouts | 500+ | Dumbbell Icon
```

### Step 4: Save & Enable
1. Click **"Save Template"** to save your changes
2. Toggle **"Enable Main Hero Section"** to ON
3. Your custom hero will appear on the home page!

## 🎯 Features

### **Responsive Design**
- ✅ Mobile-friendly layout
- ✅ Adaptive text sizing
- ✅ Touch-friendly buttons

### **Theme Support**
- ✅ Automatic dark/light mode
- ✅ Dynamic color schemes
- ✅ Consistent branding

### **Performance**
- ✅ Lazy loading
- ✅ Smooth animations
- ✅ Optimized rendering

### **Icon Options**
Available icons for statistics:
- 🏆 Trophy
- 🔥 Fire  
- ⚡ Bolt
- 🏅 Medal
- ⭐ Star
- 🚀 Rocket
- 🎯 Bullseye
- 💪 Dumbbell
- 💓 Heartbeat
- 📚 Layer

## 🔄 Default Content

When you first create the Custom Hero template, it comes with:

```json
{
  "title": "TRANSFORM YOUR FITNESS JOURNEY",
  "subtitle": "Achieve your goals with our personalized fitness programs designed to help you succeed.",
  "backgroundImage": "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=1200&auto=format&fit=crop&q=80",
  "primaryButton": {
    "text": "Start Your Journey",
    "link": "/workout"
  },
  "secondaryButton": {
    "text": "Learn More",
    "link": "/about"
  },
  "stats": [
    { "label": "Success Rate", "value": "95%", "icon": "trophy" },
    { "label": "Active Users", "value": "10K+", "icon": "fire" },
    { "label": "Workouts", "value": "500+", "icon": "dumbbell" }
  ]
}
```

## 🛠️ Technical Details

### **File Locations**
- **Template**: `frontend/src/components/hero/templates/CustomHeroTemplate.jsx`
- **Admin Interface**: `frontend/src/components/admin/SystemMainHeroManager.jsx`
- **Backend Controller**: `backend/controllers/systemSettingsController.js`

### **API Endpoints**
- **GET** `/api/system-settings/main-hero` - Get all hero settings
- **PUT** `/api/system-settings/main-hero` - Update hero settings
- **PUT** `/api/system-settings/main-hero/template/custom` - Update custom template

## ✅ Testing

1. **Start both servers**:
   ```bash
   # Backend
   cd backend && npm start
   
   # Frontend  
   cd frontend && npm start
   ```

2. **Access admin panel**: `http://localhost:3000/admin/system-settings`

3. **Edit Custom Hero template** and save changes

4. **View home page**: `http://localhost:3000/home` to see your changes

## 🎉 Benefits

- **No Code Required**: Content editors can update hero without touching code
- **Instant Updates**: Changes reflect immediately
- **Consistent Design**: Visual styling remains professional
- **Flexible Content**: Accommodate any business messaging
- **SEO Friendly**: Dynamic content with proper structure

The Custom Hero Template gives you the perfect balance of **design consistency** and **content flexibility**! 