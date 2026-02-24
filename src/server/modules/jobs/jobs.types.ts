export interface TheirStackJobResponse {
    metadata: {
        total_results: number;
        truncated_results: number;
        truncated_companies: number;
        total_companies: number;
    }
    data: TheirStackJob[];
}

export interface TheirStackJob {
    id: number;
    job_title: string;
    url: string;
    date_posted: string;
    has_blurred_data: boolean;
    company: string;
    final_url: string;
    source_url: string;
    location: string;
    short_location: string;
    long_location: string;
    state_code: string;
    latitude: number;
    longitude: number;
    postal_code: string;
    remote: boolean;
    hybrid: boolean;
    salary_string: string | null;
    min_annual_salary: number | null;
    min_annual_salary_usd: number | null;
    max_annual_salary: number | null;
    max_annual_salary_usd: number | null;
    avg_annual_salary_usd: number | null;
    salary_currency: string | null;
    countries: string[];
    country: string;
    country_codes: string[];
    country_code: string;
    cities: string[];
    continents: string[];
    seniority: string;
    discovered_at: string;
    company_domain: string;
    hiring_team: HiringTeamMember[];
    reposted: boolean;
    date_reposted: string | null;
    employment_statuses: string[];
    easy_apply: boolean;
    technology_slugs: string[];
    description: string;
    company_object: CompanyObject;
    locations: Location[];
    normalized_title: string;
    manager_roles: string[];
    matching_phrases: string[];
    matching_words: string[];
}

export interface HiringTeamMember {
    first_name: string;
    full_name: string;
    image_url: string;
    linkedin_url: string;
    role: string;
    thumbnail_url: string;
}

export interface CompanyObject {
    id: string;
    name: string;
    domain: string;
    industry: string;
    country: string;
    country_code: string;
    employee_count: number;
    logo: string;
    num_jobs: number;
    num_technologies: number;
    possible_domains: string[];
    url: string;
    industry_id: number;
    linkedin_url: string;
    num_jobs_last_30_days: number;
    num_jobs_found: number;
    yc_batch: string | null;
    apollo_id: string;
    linkedin_id: string;
    url_source: string;
    is_recruiting_agency: boolean;
    founded_year: number;
    annual_revenue_usd: number | null;
    annual_revenue_usd_readable: string | null;
    total_funding_usd: number | null;
    last_funding_round_date: string | null;
    last_funding_round_amount_readable: string | null;
    employee_count_range: string;
    long_description: string;
    seo_description: string;
    city: string;
    postal_code: string;
    company_keywords: string[];
    alexa_ranking: number | null;
    publicly_traded_symbol: string | null;
    publicly_traded_exchange: string | null;
    investors: string[];
    funding_stage: string | null;
    has_blurred_data: boolean;
    technology_slugs: string[];
    technology_names: string[];
}

export interface Location {
    admin1_code: string;
    admin1_name: string;
    admin2_code: string;
    admin2_name: string;
    continent: string;
    country_code: string;
    country_name: string;
    display_name: string;
    feature_code: string;
    id: number;
    latitude: number;
    longitude: number;
    name: string;
    state: string;
    state_code: string;
    type: string;
}