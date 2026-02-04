# 🥗 NutriVision AI

## Multimodal Personalized Fitness & Nutrition Planner

<div align="center">

![NutriVision AI](https://img.shields.io/badge/NutriVision-AI%20Powered-22c55e?style=for-the-badge)
![Version](https://img.shields.io/badge/Version-1.0.0-blue?style=for-the-badge)
![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)

**An AI-powered nutrition and fitness platform featuring food image recognition, personalized meal plans, GI/GL tracking, and an intelligent chat assistant.**

[Features](#-features) •
[Tech Stack](#-tech-stack) •
[Quick Start](#-quick-start) •
[API Documentation](#-api-documentation) •
[Architecture](#-architecture)

</div>

---

## ✨ Features

### 🍎 AI Food Recognition
- **Smart Image Analysis**: Snap a photo of your meal and let YOLOv8 detect individual foods
- **Portion Estimation**: AI estimates portion sizes using depth estimation
- **Automatic Logging**: Detected foods are automatically calculated for calories and macros

### 📊 Comprehensive Nutrition Tracking
- **Calorie & Macro Tracking**: Monitor protein, carbs, and fats throughout the day
- **GI/GL Monitoring**: Track Glycemic Index and Glycemic Load for blood sugar management
- **Micronutrient Tracking**: Monitor vitamins and minerals for complete nutrition

### 🍽️ Personalized Meal Plans
- **AI-Generated Plans**: Get weekly meal plans tailored to your goals and preferences
- **Dietary Accommodations**: Supports vegan, vegetarian, keto, and allergy restrictions
- **Smart Grocery Lists**: Auto-generated shopping lists from your meal plan

### 💪 Workout Planning
- **Custom Routines**: AI-generated workout plans based on your fitness level
- **Goal-Oriented**: Plans optimized for fat loss, muscle gain, or maintenance
- **Progress Tracking**: Monitor strength and endurance improvements

### 💬 AI Nutrition Assistant
- **Natural Conversations**: Chat with NutriVision AI for nutrition advice
- **Context-Aware**: Responses personalized to your profile and goals
- **Quick Answers**: Get instant answers to nutrition questions

### 📈 Progress Analytics
- **Visual Charts**: Beautiful graphs showing your nutrition trends
- **Weight Tracking**: Monitor body weight and measurements over time
- **Goal Progress**: See how close you are to reaching your targets

---

## 🛠 Tech Stack

### Frontend
| Technology | Purpose |
|------------|---------|
| **React 18** | UI Framework |
| **Vite** | Build Tool |
| **Tailwind CSS** | Styling |
| **Zustand** | State Management |
| **Chart.js** | Data Visualization |
| **Framer Motion** | Animations |
| **React Router** | Routing |

### Backend
| Technology | Purpose |
|------------|---------|
| **Node.js** | Runtime |
| **Express.js** | API Framework |
| **MongoDB** | User Data & Logs |
| **PostgreSQL** | Nutrition Database |
| **Redis** | Caching & Sessions |
| **JWT** | Authentication |

### AI Service
| Technology | Purpose |
|------------|---------|
| **Python 3.11** | Runtime |
| **FastAPI** | API Framework |
| **YOLOv8** | Food Detection |
| **MiDaS** | Depth Estimation |
| **OpenAI GPT-4** | Natural Language |
| **PyTorch** | ML Framework |

### Infrastructure
| Technology | Purpose |
|------------|---------|
| **Docker** | Containerization |
| **Docker Compose** | Orchestration |
| **Nginx** | Reverse Proxy |

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+ 
- **Python** 3.11+
- **Docker** & Docker Compose (recommended)
- **OpenAI API Key** (for AI features)

### Option 1: Docker (Recommended) 🐳

```bash
# Clone the repository
git clone https://github.com/yourusername/nutrivision-ai.git
cd nutrivision-ai

# Copy environment file and configure
cp .env.example .env
# Edit .env with your API keys and secrets

# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

Access the application:
- **Frontend**: http://localhost
- **Backend API**: http://localhost:5000
- **AI Service**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs

### Option 2: Manual Setup

#### 1. Database Setup

```bash
# Start MongoDB
mongod --dbpath /data/db

# Start PostgreSQL
pg_ctl start

# Initialize PostgreSQL database
psql -U postgres -f database/init.sql

# Start Redis
redis-server
```

#### 2. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Copy and configure environment
cp .env.example .env
# Edit .env with your configuration

# Start development server
npm run dev
```

#### 3. AI Service Setup

```bash
cd ai-service

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Copy and configure environment
cp .env.example .env
# Edit .env with your OpenAI API key

# Start development server
uvicorn main:app --reload --port 8000
```

#### 4. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

---

## 📚 API Documentation

### Authentication

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/register` | POST | Register new user |
| `/api/auth/login` | POST | Login user |
| `/api/auth/refresh` | POST | Refresh access token |
| `/api/auth/logout` | POST | Logout user |

### Food Tracking

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/food/analyze` | POST | Analyze food image |
| `/api/food/log` | POST | Log food entry |
| `/api/food/daily-summary/:date` | GET | Get daily summary |
| `/api/food/weekly-summary` | GET | Get weekly summary |

### Plan Generation

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/plan/meal` | POST | Generate meal plan |
| `/api/plan/workout` | POST | Generate workout plan |

### Nutrition Database

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/nutrition/search` | GET | Search foods |
| `/api/nutrition/gi/:food` | GET | Get GI for food |
| `/api/nutrition/calculate-gl` | POST | Calculate GL |

### Chat

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/chat/conversations` | GET | List conversations |
| `/api/chat/conversation` | POST | Create conversation |
| `/api/chat/conversation/:id/message` | POST | Send message |

---

## 🏗 Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENTS                                  │
│                    (Web / Mobile App)                           │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                      NGINX (Reverse Proxy)                       │
│                     Port 80 / SSL Termination                   │
└────────────────────────────┬────────────────────────────────────┘
                             │
         ┌───────────────────┴───────────────────┐
         ▼                                       ▼
┌─────────────────────┐               ┌─────────────────────┐
│   React Frontend    │               │   Node.js Backend   │
│   (Static Files)    │               │   (Express API)     │
│                     │               │                     │
│   • Dashboard       │               │   • Auth            │
│   • Food Log        │               │   • User Profile    │
│   • Analyze         │  ──────────►  │   • Food Logging    │
│   • Meal Plan       │               │   • Plans           │
│   • Workout Plan    │               │   • Progress        │
│   • Progress        │               │                     │
│   • Chat            │               │   Port: 5000        │
└─────────────────────┘               └──────────┬──────────┘
                                                 │
                                                 ▼
                                     ┌─────────────────────┐
                                     │  Python AI Service  │
                                     │     (FastAPI)       │
                                     │                     │
                                     │   • YOLOv8 Food     │
                                     │     Recognition     │
                                     │   • MiDaS Depth     │
                                     │   • GPT-4 Chat      │
                                     │   • Meal Planning   │
                                     │                     │
                                     │   Port: 8000        │
                                     └──────────┬──────────┘
                                                │
         ┌──────────────────────────────────────┼──────────────────┐
         │                                      │                  │
         ▼                                      ▼                  ▼
┌─────────────────┐               ┌─────────────────┐    ┌─────────────────┐
│    MongoDB      │               │   PostgreSQL    │    │     Redis       │
│                 │               │                 │    │                 │
│  • Users        │               │  • Nutrition    │    │  • Sessions     │
│  • Food Logs    │               │    Database     │    │  • Rate Limit   │
│  • Weight Logs  │               │  • GI Table     │    │  • Cache        │
│  • Chat History │               │  • Workouts     │    │                 │
│                 │               │                 │    │                 │
│  Port: 27017    │               │  Port: 5432     │    │  Port: 6379     │
└─────────────────┘               └─────────────────┘    └─────────────────┘
```

---

## 📁 Project Structure

```
nutrivision-ai/
├── frontend/                 # React Frontend
│   ├── src/
│   │   ├── components/      # Reusable components
│   │   ├── pages/           # Page components
│   │   ├── stores/          # Zustand stores
│   │   ├── services/        # API services
│   │   ├── hooks/           # Custom hooks
│   │   └── utils/           # Utility functions
│   ├── package.json
│   └── Dockerfile
│
├── backend/                  # Node.js Backend
│   ├── src/
│   │   ├── config/          # Database configs
│   │   ├── middleware/      # Express middleware
│   │   ├── models/          # MongoDB & Postgres models
│   │   ├── routes/          # API routes
│   │   └── server.js        # Entry point
│   ├── package.json
│   └── Dockerfile
│
├── ai-service/              # Python AI Service
│   ├── app/
│   │   ├── routers/         # FastAPI routers
│   │   ├── services/        # AI/ML services
│   │   └── utils/           # Utilities
│   ├── main.py              # Entry point
│   ├── requirements.txt
│   └── Dockerfile
│
├── database/                # Database files
│   └── init.sql             # PostgreSQL init
│
├── docker-compose.yml       # Docker orchestration
├── .env.example             # Environment template
├── ARCHITECTURE.md          # Detailed architecture
└── README.md                # This file
```

---

## 🔐 Environment Variables

### Backend (.env)

```env
# Server
NODE_ENV=production
PORT=5000

# MongoDB
MONGODB_URI=mongodb://localhost:27017/nutrivision

# PostgreSQL
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=nutrivision_nutrition
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_password

# Redis
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=your-secret-key
JWT_REFRESH_SECRET=your-refresh-secret

# AI Service
AI_SERVICE_URL=http://localhost:8000
```

### AI Service (.env)

```env
# Server
ENVIRONMENT=production
PORT=8000

# OpenAI
OPENAI_API_KEY=sk-your-key-here

# Models
FOOD_RECOGNITION_MODEL=yolov8n.pt
DEFAULT_LLM_MODEL=gpt-4-turbo-preview
```

---

## 🧪 Testing

```bash
# Backend tests
cd backend
npm test

# AI Service tests
cd ai-service
pytest

# Frontend tests
cd frontend
npm test
```

---

## 📊 Key Formulas

### BMR (Basal Metabolic Rate) - Mifflin-St Jeor

```
Male:   BMR = 10 × weight(kg) + 6.25 × height(cm) - 5 × age(y) + 5
Female: BMR = 10 × weight(kg) + 6.25 × height(cm) - 5 × age(y) - 161
```

### TDEE (Total Daily Energy Expenditure)

```
TDEE = BMR × Activity Multiplier

Activity Multipliers:
- Sedentary (little/no exercise): 1.2
- Lightly Active (1-3 days/week): 1.375
- Moderately Active (3-5 days/week): 1.55
- Very Active (6-7 days/week): 1.725
- Extremely Active (2x per day): 1.9
```

### Glycemic Load (GL)

```
GL = (GI × Net Carbs per serving) / 100

Categories:
- Low: GL ≤ 10
- Medium: 11-19
- High: GL ≥ 20
```

---

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- [OpenAI](https://openai.com) - GPT-4 for natural language processing
- [Ultralytics](https://ultralytics.com) - YOLOv8 for object detection
- [Intel MiDaS](https://github.com/isl-org/MiDaS) - Depth estimation
- [Harvard Health](https://www.health.harvard.edu) - GI database reference

---

<div align="center">

**Built with ❤️ for healthier living**

[⬆ Back to Top](#-nutrivision-ai)

</div>
An application to devise plans for food practices and to identify the essentials in it.
