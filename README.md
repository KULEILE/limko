# LUCT Faculty Reporting System

A web-based reporting application for Limkokwing University of Creative Technology (LUCT) faculty.

## Features

- Role-based authentication (Student, Lecturer, PRL, PL, FMG)
- Lecture reporting system
- Complaint management with proper escalation
- Data download functionality
- Responsive design with black and white theme

## Setup Instructions

1. Clone the repository
2. Run database initialization: `psql -f database/init.sql`
3. Install backend dependencies: `cd backend && npm install`
4. Install frontend dependencies: `cd frontend && npm install`
5. Start backend: `cd backend && npm run dev`
6. Start frontend: `cd frontend && npm start`

## Default Login Credentials

- Lecturer: lecturer1 / password123