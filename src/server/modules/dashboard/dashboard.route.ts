import { Elysia } from 'elysia';
import { authMiddleware } from '@/server/middleware/auth';
import { db } from '@/db/drizzle';
import { jobs, userJobs } from '@/db/schema/jobs-schema';
import { interviews } from '@/db/schema/interview-schema';
import { practiceSessions, practiceQuestions } from '@/db/schema/practice-schema';
import { desc, eq, and, getTableColumns } from 'drizzle-orm';

export const dashboardRoutes = new Elysia({ prefix: '/dashboard' })
    .use(authMiddleware)
    .get('/', async ({ user }) => {
        // --- 1. JOBS DATA (Left Column) ---
        const allUserJobs = await db.select({ status: userJobs.status, relevanceScore: userJobs.relevanceScore })
            .from(userJobs)
            .where(eq(userJobs.userId, user.id));

        const totalJobs = allUserJobs.length;
        const savedJobs = allUserJobs.filter(j => j.status === 'saved').length;
        const appliedJobs = allUserJobs.filter(j => j.status === 'applied').length;

        const jobsWithScore = allUserJobs.filter(j => j.relevanceScore != null);
        const avgProfileMatch = jobsWithScore.length > 0
            ? jobsWithScore.reduce((sum, j) => sum + Number(j.relevanceScore), 0) / jobsWithScore.length
            : 0;

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { embedding, ...jobColumnsWithoutEmbedding } = getTableColumns(jobs);
        const topMatches = await db.select({
            job: jobColumnsWithoutEmbedding,
            userJob: userJobs,
        })
            .from(userJobs)
            .innerJoin(jobs, eq(userJobs.jobId, jobs.id))
            .where(eq(userJobs.userId, user.id))
            .orderBy(desc(userJobs.relevanceScore))
            .limit(3);

        // --- 2. INTERVIEW DATA (Right Column) ---
        const completedInterviews = await db.select({
            createdAt: interviews.createdAt,
            score: interviews.score,
            report: interviews.report,
        })
            .from(interviews)
            .where(and(eq(interviews.userId, user.id), eq(interviews.status, 'completed')))
            .orderBy(desc(interviews.createdAt));

        let totalInterviewScore = 0;
        let totalTechScore = 0;
        let totalCommScore = 0;
        let validReportCount = 0;

        const last5Interviews = completedInterviews.slice(0, 5);
        
        const interviewChartData = [...last5Interviews].reverse().map(int => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const report = int.report as any;
            const tech = report?.technicalScore || 0;
            const comm = report?.communicationScore || 0;
            const overall = report?.overallScore || int.score || 0;

            return {
                date: int.createdAt.toISOString().split('T')[0],
                overall,
                technical: tech,
                communication: comm
            };
        });

        last5Interviews.forEach(int => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const report = int.report as any;
            if (report) {
                totalInterviewScore += (report.overallScore || int.score || 0);
                totalTechScore += (report.technicalScore || 0);
                totalCommScore += (report.communicationScore || 0);
                validReportCount++;
            } else if (int.score) {
                totalInterviewScore += int.score;
                validReportCount++;
            }
        });

        const avgInterviewOverall = validReportCount > 0 ? totalInterviewScore / validReportCount : 0;
        const avgInterviewTech = validReportCount > 0 ? totalTechScore / validReportCount : 0;
        const avgInterviewComm = validReportCount > 0 ? totalCommScore / validReportCount : 0;

        // --- 3. PRACTICE DATA (Right Column) ---
        const completedPractice = await db.select({
            id: practiceSessions.id,
            createdAt: practiceSessions.createdAt,
        })
            .from(practiceSessions)
            .where(and(eq(practiceSessions.userId, user.id), eq(practiceSessions.status, 'completed')))
            .orderBy(desc(practiceSessions.createdAt));

        let totalPracticeScore = 0;
        let totalPracticeAccuracy = 0;
        const practiceChartData = [];
        
        const last5Practice = completedPractice.slice(0, 5);

        for (const session of last5Practice) {
            const questions = await db.select({ 
                isCorrect: practiceQuestions.isCorrect,
                userAnswer: practiceQuestions.userAnswer
            })
                .from(practiceQuestions)
                .where(eq(practiceQuestions.sessionId, session.id));

            const totalQ = questions.length;
            const attemptedQ = questions.filter(q => q.userAnswer && q.userAnswer.trim() !== '').length;
            const correctQ = questions.filter(q => q.isCorrect).length;
            
            const score = totalQ > 0 ? (correctQ / totalQ) * 100 : 0;
            const accuracy = attemptedQ > 0 ? (correctQ / attemptedQ) * 100 : 0;

            totalPracticeScore += score;
            totalPracticeAccuracy += accuracy;

            // Push to chart data (we only need the last 5, which are the first 5 in the array since it's ordered by desc)
            practiceChartData.push({
                date: session.createdAt.toISOString().split('T')[0],
                score: Math.round(score),
                accuracy: Math.round(accuracy)
            });
        }

        practiceChartData.reverse(); // chronological order for charts

        const avgPracticeScore = last5Practice.length > 0 ? totalPracticeScore / last5Practice.length : 0;
        const avgPracticeAccuracy = last5Practice.length > 0 ? totalPracticeAccuracy / last5Practice.length : 0;

        return {
            jobs: {
                total: totalJobs,
                saved: savedJobs,
                applied: appliedJobs,
                avgProfileMatch: avgProfileMatch.toFixed(2),
                topMatches: topMatches.map(m => ({ ...m.job, userJobRecord: m.userJob })),
            },
            interviews: {
                avgOverall: Math.round(avgInterviewOverall),
                avgTechnical: Math.round(avgInterviewTech),
                avgCommunication: Math.round(avgInterviewComm),
                chartData: interviewChartData,
            },
            practice: {
                avgScore: Math.round(avgPracticeScore * 10) / 10, // keep 1 decimal
                avgAccuracy: Math.round(avgPracticeAccuracy),
                chartData: practiceChartData,
            }
        };
    }, {
        auth: true
    });
