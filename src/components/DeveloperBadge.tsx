'use client'

import Link from 'next/link'
import { Github, BadgeCheck } from 'lucide-react'

export default function DeveloperBadge() {
    return (
        <Link
            href="https://github.com/AmmarK10"
            target="_blank"
            rel="noopener noreferrer"
            className="fixed bottom-4 right-4 z-50 group"
        >
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/90 backdrop-blur-md border border-slate-200/50 shadow-lg shadow-slate-900/5 transition-all duration-300 hover:bg-white hover:shadow-xl hover:-translate-y-1 hover:border-slate-300">
                <Github className="h-4 w-4 text-slate-600 group-hover:text-slate-900 transition-colors" />
                <span className="text-sm font-medium text-slate-700 group-hover:text-slate-900 transition-colors">
                    Made by Ammar Khan
                </span>
                <BadgeCheck className="h-4 w-4 text-blue-500" />
            </div>
        </Link>
    )
}
