<div align="center">
  <img src="public/favicon.ico" alt="UniRide Logo" width="100"/>
  <h1>🚗 UniRide</h1>
  <p><strong>Connect with verified university students, share rides, and make your commute better.</strong></p>
  
  [![Next.js](https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
  [![React](https://img.shields.io/badge/React-19-blue?style=for-the-badge&logo=react)](https://react.dev/)
  [![Supabase](https://img.shields.io/badge/Supabase-Database-3ECF8E?style=for-the-badge&logo=supabase)](https://supabase.com/)
  [![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
</div>

<br />

## 🎯 About UniRide

UniRide is a modern, real-time carpooling platform built specifically for university students. It solves the everyday commute problem by allowing students to easily find rides from their peers or post their own driving schedules to share empty seats. 

Built with safety and instant communication in mind, UniRide features exclusively student-verified profiles, real-time requests, and live in-app messaging.

## ✨ Key Features

*   🎓 **University Exclusive:** Secure email and profile verification ensures you only share rides with fellow verified university students.
*   ⚡ **Real-time Engine:** See new ride requests, acceptances, and messages instantly. Built on top of Supabase's powerful Realtime websocket infrastructure.
*   💬 **Live Chat Passenger & Driver:** Chat directly within the app once a ride is accepted to coordinate pickup details seamlessly.
*   🚘 **Post & Discover:** Drivers can quickly post one-off or recurring route schedules. Passengers can search, filter, and request seats instantly.
*   📱 **Responsive & Intuitive UI:** A clean, modern interface built with Tailwind CSS and Radix UI primitives, ensuring a flawless mobile and desktop experience.

## 🛠️ Tech Stack

*   **Frontend Framework:** [Next.js 15](https://nextjs.org/) (App Router, Server Actions)
*   **UI Library:** [React 19](https://react.dev/)
*   **Styling:** [Tailwind CSS](https://tailwindcss.com/) & [shadcn/ui](https://ui.shadcn.com/)
*   **Icons:** [Lucide React](https://lucide.dev/)
*   **Backend & Auth:** [Supabase](https://supabase.com/) (PostgreSQL, Row Level Security, Realtime Subscriptions)

## 🚀 Getting Started

To get a local copy up and running, follow these simple steps:

### Prerequisites

*   Node.js 18.x or later
*   npm or yarn or pnpm
*   A Supabase account and project

### Installation

1.  **Clone the repository**
    ```bash
    git clone https://github.com/AmmarK10/UniRide.git
    cd UniRide
    ```

2.  **Install dependencies**
    ```bash
    npm install
    ```

3.  **Setup Supabase Environment Variables**
    Create a `.env.local` file in the root directory and add your Supabase keys:
    ```env
    NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
    NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
    ```

4.  **Database Setup**
    Run the SQL code found in `schema.sql` and the associated `migrations/` inside your Supabase SQL Editor to generate the tables, Row Level Security (RLS) policies, and Realtime publications.

5.  **Run the application**
    ```bash
    npm run dev
    ```
    Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

## 🤝 Contributing

Contributions are what make the open-source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📧 Contact

**Ammar** - uni.ride.nine@gmail.com

Project Link: [https://github.com/AmmarK10/UniRide](https://github.com/AmmarK10/UniRide)

---
<div align="center">
  <i>Built to make the student commute better.</i>
</div>
