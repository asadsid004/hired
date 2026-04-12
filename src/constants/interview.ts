import {
    CodeIcon,
    SettingDone01Icon,
    Settings02Icon,
    DatabaseIcon,
    CloudIcon,
    AiBrain04Icon,
    ProductLoadingIcon,
    SecurityLockIcon,
    Blockchain02Icon,
    GameController01Icon,
    Users,
    Link04Icon,
    BrushIcon,
    ChartLineData02Icon,
    UserAccountIcon,
    AiBeautifyIcon,
    OfficeIcon,
} from "@hugeicons/core-free-icons";
export const TEMPLATES = [
    {
        role: "Frontend Engineer",
        desc: "React, Next.js, TypeScript, CSS, web performance, and accessibility.",
        interviewType: "technical" as const,
        difficulty: "medium" as const,
        durationMinutes: 30,
        icon: CodeIcon,
        tags: ["React", "TypeScript", "CSS"],
    },
    {
        role: "Product Manager",
        desc: "Product thinking, roadmap planning, stakeholder management, prioritisation frameworks, and user research.",
        interviewType: "behavioral" as const,
        difficulty: "medium" as const,
        durationMinutes: 45,
        icon: ProductLoadingIcon,
        tags: ["Strategy", "Roadmap", "Research"],
    },
    {
        role: "Backend Engineer",
        desc: "Node.js, system design, databases, REST/GraphQL API design, and performance optimisation.",
        interviewType: "technical" as const,
        difficulty: "hard" as const,
        durationMinutes: 45,
        icon: DatabaseIcon,
        tags: ["Node.js", "System Design", "APIs"],
    },
    {
        role: "Full-Stack Engineer",
        desc: "Architecture decisions, data modelling, and end-to-end feature delivery across frontend and backend.",
        interviewType: "mixed" as const,
        difficulty: "hard" as const,
        durationMinutes: 60,
        icon: CloudIcon,
        tags: ["Architecture", "Full-Stack", "Design"],
    },
    {
        role: "ML Engineer",
        desc: "Machine learning fundamentals, model training pipelines, Python, and MLOps practices.",
        interviewType: "technical" as const,
        difficulty: "hard" as const,
        durationMinutes: 60,
        icon: AiBrain04Icon,
        tags: ["Python", "ML", "MLOps"],
    },
    {
        role: "Security Engineer",
        desc: "Focus on application and infrastructure security including authentication, authorization, and common vulnerabilities (OWASP Top 10). Covers secure coding practices, threat modeling, encryption basics, and identifying/exploiting security flaws in real-world systems.",
        interviewType: "technical" as const,
        difficulty: "hard" as const,
        durationMinutes: 45,
        icon: SecurityLockIcon,
        tags: ["Security", "Auth", "Encryption", "OWASP", "Threat Modeling"],
    },
    {
        role: "Site Reliability Engineer",
        desc: "Covers system reliability, uptime, and production incident management. Includes monitoring, alerting, SLAs/SLOs, root cause analysis, and designing highly available systems. Emphasis on balancing reliability with development velocity.",
        interviewType: "technical" as const,
        difficulty: "hard" as const,
        durationMinutes: 45,
        icon: CloudIcon,
        tags: ["SRE", "Monitoring", "Reliability", "Incidents", "Scaling"],
    },
    {
        role: "Blockchain Engineer",
        desc: "Focus on blockchain fundamentals, smart contract development, and decentralized applications. Covers Solidity basics, transaction mechanics, security vulnerabilities in smart contracts, and designing trustless systems.",
        interviewType: "technical" as const,
        difficulty: "hard" as const,
        durationMinutes: 60,
        icon: Blockchain02Icon,
        tags: ["Blockchain", "Smart Contracts", "Web3", "Solidity"],
    },
    {
        role: "Game Developer",
        desc: "Covers game development fundamentals including game loops, physics, rendering, and performance optimization. Includes problem-solving around real-time systems, memory management, and creating smooth user experiences.",
        interviewType: "technical" as const,
        difficulty: "medium" as const,
        durationMinutes: 45,
        icon: GameController01Icon,
        tags: ["Game Dev", "Graphics", "Performance", "C++", "Unity"],
    },
    {
        role: "Technical Support Engineer",
        desc: "Focus on debugging customer issues, reading logs, and identifying root causes across systems. Includes communication skills, handling ambiguity, reproducing bugs, and working with engineering teams to resolve production issues.",
        interviewType: "mixed" as const,
        difficulty: "easy" as const,
        durationMinutes: 30,
        icon: Settings02Icon,
        tags: ["Debugging", "Support", "Logs", "Customer Issues"],
    }
];

export const INTERVIEW_TYPES = [
    { value: "technical", label: "Technical", icon: CodeIcon },
    { value: "behavioral", label: "Behavioral", icon: Users },
    { value: "mixed", label: "Mixed", icon: SettingDone01Icon },
] as const;

export const DIFFICULTIES = [
    { value: "easy", label: "Easy" },
    { value: "medium", label: "Medium" },
    { value: "hard", label: "Hard" },
] as const;

export const DURATION_OPTIONS = [5, 10, 15, 20, 30, 45, 60, 90] as const;

export const DIFFICULTY_STYLES = {
    easy: {
        active:
            "border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
        badge:
            "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800",
    },
    medium: {
        active:
            "border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-400",
        badge:
            "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800",
    },
    hard: {
        active:
            "border-rose-500/40 bg-rose-500/10 text-rose-600 dark:text-rose-400",
        badge:
            "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800",
    },
};

export const TYPE_BADGE_STYLES: Record<string, string> = {
    technical:
        "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800",
    behavioral:
        "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-400 dark:border-purple-800",
    mixed:
        "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800/40 dark:text-slate-400 dark:border-slate-700",
};

export const ROLE_ICONS = [
    CodeIcon,
    Link04Icon,
    DatabaseIcon,
    BrushIcon,
    ChartLineData02Icon,
    CloudIcon,
    SecurityLockIcon,
    UserAccountIcon,
    AiBeautifyIcon,
    OfficeIcon,
];

export function getRoleIcon(seed: string) {
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
        hash = seed.charCodeAt(i) + ((hash << 5) - hash);
    }
    return ROLE_ICONS[Math.abs(hash) % ROLE_ICONS.length];
}

export const DIFFICULTY_CONFIG = {
    easy: {
        label: "Easy",
        className:
            "text-emerald-600 bg-emerald-50 border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-400",
    },
    medium: {
        label: "Medium",
        className:
            "text-amber-600 bg-amber-50 border-amber-200 dark:bg-amber-950/40 dark:border-amber-800 dark:text-amber-400",
    },
    hard: {
        label: "Hard",
        className:
            "text-rose-600 bg-rose-50 border-rose-200 dark:bg-rose-950/40 dark:border-rose-800 dark:text-rose-400",
    },
};

export const STATUS_CONFIG = {
    completed: {
        label: "Completed",
        dot: "bg-emerald-500",
        className:
            "text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-400",
    },
    failed: {
        label: "Failed",
        dot: "bg-rose-500",
        className:
            "text-rose-700 bg-rose-50 dark:bg-rose-950/40 dark:text-rose-400",
    },
    in_progress: {
        label: "In Progress",
        dot: "bg-blue-500 animate-pulse",
        className:
            "text-blue-700 bg-blue-50 dark:bg-blue-950/40 dark:text-blue-400",
    },
    processing: {
        label: "Processing",
        dot: "bg-orange-500 animate-pulse",
        className:
            "text-orange-700 bg-orange-50 dark:bg-orange-950/40 dark:text-orange-400",
    },
};

export const TYPE_LABELS: Record<string, string> = {
    mixed: "Mixed",
    technical: "Technical",
    behavioral: "Behavioral",
};
