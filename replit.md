# Overview

Skyla is a static website project built with Node.js and Express, featuring a console-style interface for demonstrating a symbolic AI agent with cryptographic verification capabilities. The site includes a minimal homepage, an interactive console demo, documentation pages, and a sign-in interface. The project emphasizes clean, minimal design with a beige color scheme and monospace typography.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Static File Serving**: All frontend assets are served from the `public/` directory using Express static middleware
- **Single-Page Design**: Each route serves a separate HTML file with inline CSS and JavaScript, avoiding external dependencies
- **Responsive Layout**: Clean, minimal design with a consistent beige (#f5f4f0) background and dark text (#1a1a1a)
- **Console Interface**: Interactive demo page featuring a terminal-style UI with real-time state transitions and logging

## Backend Architecture
- **Express.js Server**: Lightweight Node.js server using ES modules for routing and static file serving
- **Route-Based Navigation**: Clean URL structure without file extensions (/demo, /docs, /sign-in)
- **File-Based Routing**: Direct mapping between routes and HTML files in the public directory
- **404 Fallback**: All unmatched routes redirect to the homepage for graceful error handling

## Design System
- **Typography**: Monospace font stack (SF Mono, Monaco, Cascadia Code) for technical aesthetic
- **Color Palette**: Minimal beige background with dark text, console uses dark theme with syntax highlighting
- **Component Structure**: Consistent navigation, brand elements, and layout patterns across pages
- **Interactive Elements**: Console demo includes state management, input processing, and animated logging

## Console Demo Features
- **State Management**: JavaScript-based identity vector system with real-time updates
- **Symbolic Rules Engine**: Pattern matching for specific commands (spiral, daemon, build, analyze)
- **Semantic Processing**: Fallback system using regex categories and deterministic hash-based adjustments
- **Proof Generation**: Mock cryptographic proof system with timestamps and state hashing
- **Animated Logging**: Console-style output with colored log levels and syntax-highlighted JSON

# External Dependencies

## Runtime Dependencies
- **Express.js (^4.21.2)**: Web server framework for Node.js, handles routing and static file serving

## Development Stack
- **Node.js**: JavaScript runtime environment using ES modules
- **NPM**: Package manager for dependency management

## Static Assets
- **Brand Assets**: Logo images and visual elements served from public/assets/
- **No External Libraries**: All functionality implemented with vanilla JavaScript and CSS
- **Self-Contained Design**: No external fonts, frameworks, or third-party services required

## Deployment Requirements
- **Node.js Environment**: Requires Node.js runtime for Express server
- **Port Configuration**: Uses PORT environment variable with fallback to 5000
- **Static Asset Hosting**: All frontend assets must be accessible via HTTP