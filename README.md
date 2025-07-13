# 🎮 Tank Game

A 3D tank battle game built with TypeScript and Three.js. Control your tank, destroy enemy tanks, and avoid obstacles in this game!

## 🎯 Game Overview

This is a 3D tank combat game where you control a tank and battle against AI-controlled enemy tanks. The game features:

- **3D Graphics**: Built with Three.js for immersive 3D gameplay
- **Physics-based Movement**: Realistic tank movement and collision detection
- **AI Enemies**: Smart enemy tanks that hunt and attack the player
- **Combat System**: Shoot bullets and create explosion effects
- **Dynamic Environment**: Navigate around walls and obstacles

## 🎮 How to Play

### Controls
- **Arrow Keys**: Move your tank
  - `↑` (Up Arrow): Move forward
  - `↓` (Down Arrow): Move backward
  - `←` (Left Arrow): Turn left
  - `→` (Right Arrow): Turn right
- **Spacebar**: Shoot bullets

### Objective
- Destroy enemy tanks before they destroy you
- Avoid walls and obstacles
- Survive as long as possible

### Game Mechanics
- **Health System**: Each tank has 100 HP
- **Bullet Damage**: Bullets deal 20 damage
- **Detection Range**: Enemy tanks can detect you within 12 units
- **Shooting**: Tanks can only shoot when properly aimed at the target

## 🚀 Getting Started

### Prerequisites
- **Node.js** (version 16 or higher)
- **npm** (comes with Node.js)

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repository-url>
   cd tank-game
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   Navigate to `http://localhost:5173` to play the game!

### Build for Production

To create a production build:

```bash
npm run build
```

To preview the production build:

```bash
npm run preview
```

## ��️ Project Structure
