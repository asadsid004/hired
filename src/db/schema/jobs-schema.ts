import { pgTable, text, integer, boolean, timestamp, decimal, jsonb, pgEnum, unique, vector } from 'drizzle-orm/pg-core';
import { user } from './auth-schema';

export const jobs = pgTable('jobs', {
    id: integer("id").primaryKey(),
    embedding: vector('embedding', { dimensions: 768 }),

    jobTitle: text('job_title').notNull(),
    normalizedTitle: text('normalized_title'),
    description: text('description').notNull(),
    url: text('url').notNull(),

    company: text('company').notNull(),
    companyDomain: text('company_domain'),
    companyLogo: text('company_logo'),
    companyIndustry: text('company_industry'),
    companyEmployeeCount: integer('company_employee_count'),
    companyCountryCode: text('company_country_code'),
    companyDescription: text('company_description'),
    companyLinkedinUrl: text('company_linkedin_url'),
    companyFoundedYear: integer('company_founded_year'),
    companyTechnologySlugs: jsonb('company_technology_slugs').$type<string[]>(),

    location: text('location'),
    shortLocation: text('short_location'),
    stateCode: text('state_code'),
    countryCode: text('country_code'),
    remote: boolean('remote').default(false),
    hybrid: boolean('hybrid').default(false),

    hiringTeamFirstName: text('hiring_team_first_name'),
    hiringTeamLastName: text('hiring_team_last_name'),
    hiringTeamLinkedinUrl: text('hiring_team_linkedin_url'),

    latitude: decimal('latitude', { precision: 10, scale: 6 }),
    longitude: decimal('longitude', { precision: 10, scale: 6 }),

    salaryString: text('salary_string'),
    minAnnualSalaryUsd: integer('min_annual_salary_usd'),
    maxAnnualSalaryUsd: integer('max_annual_salary_usd'),
    avgAnnualSalaryUsd: integer('avg_annual_salary_usd'),

    seniority: text('seniority'),
    employmentStatuses: jsonb('employment_statuses').$type<string[]>(),

    reposted: boolean('reposted').default(false),
    dateReposted: timestamp('date_reposted'),
    easyApply: boolean('easy_apply').default(false),
    technologySlugs: jsonb('technology_slugs').$type<string[]>(),

    datePosted: timestamp('date_posted'),
    discoveredAt: timestamp('discovered_at'),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
        .defaultNow()
        .$onUpdate(() => new Date())
        .notNull(),
});

export const userJobStatusEnum = pgEnum('user_job_status', [
    'new',
    'viewed',
    'saved',
    'applied',
    'hidden',
    'rejected'
]);

export const userJobs = pgTable('user_jobs', {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    userId: text('user_id')
        .notNull()
        .references(() => user.id, { onDelete: 'cascade' }),
    jobId: integer('job_id')
        .notNull()
        .references(() => jobs.id, { onDelete: 'cascade' }),
    status: userJobStatusEnum('status').default('new').notNull(),
    relevanceScore: decimal('relevance_score', { precision: 4, scale: 3 }),
    matchReasons: jsonb('match_reasons'),
    preferencesHash: text('preferences_hash').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
        .defaultNow()
        .$onUpdate(() => new Date())
        .notNull(),
}, (table) => [
    unique('unique_user_job').on(table.userId, table.jobId),
]);

export type Job = typeof jobs.$inferSelect;
export type NewJob = typeof jobs.$inferInsert;
export type UserJob = typeof userJobs.$inferSelect;
export type NewUserJob = typeof userJobs.$inferInsert;