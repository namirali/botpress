import { IntegrationDefinition, z } from '@botpress/sdk'
import { operations } from './src/catalog'

const pagination = {
  page: z.number().int().min(1).default(1).title('Page').describe('Page number, starting at 1'),
  pageSize: z.number().int().min(1).max(100).default(10).title('Page Size').describe('Maximum records per request'),
}
const filters = z
  .record(z.unknown())
  .optional()
  .title('Filters')
  .describe('Documented API body filters, preserved in full. Dedicated fields take precedence.')
const workforce = z
  .array(z.enum(['workforce']))
  .optional()
  .title('Expand')
  .describe('Optional workforce expansion can consume extra credits')
const education = z
  .array(z.enum(['education']))
  .optional()
  .title('Expand')
  .describe('Optional education expansion')
const wait = z
  .boolean()
  .optional()
  .title('Wait for Enrichment')
  .describe('Whether to wait for pending company enrichment')
const domains = z.array(z.string().min(1)).min(1).max(10).title('Domains').describe('One to ten seed company domains')
const literalQuery = z.string().max(250).optional().title('Literal Query').describe('Literal company search query')
const semanticQuery = z
  .string()
  .max(500)
  .optional()
  .title('Semantic Query')
  .describe('Natural-language company description')
const raw = z.union([z.record(z.unknown()), z.array(z.unknown()), z.number(), z.string(), z.boolean(), z.null()])
const result = {
  schema: z.object({ result: raw.title('Result').describe('Complete API response, including metadata and scores') }),
}
const objectResult = {
  schema: z.object({
    result: z.record(z.unknown()).title('Result').describe('Complete API response, including metadata and scores'),
  }),
}

export default new IntegrationDefinition({
  name: 'companyenrich',
  version: '0.1.0',
  title: 'CompanyEnrich',
  description: 'Enrich companies and people, discover accounts, and run documented data operations.',
  readme: 'hub.md',
  icon: 'icon.svg',
  configuration: {
    schema: z.object({
      apiKey: z.string().min(1).title('API Key').describe('Your CompanyEnrich API key without the Bearer prefix'),
    }),
  },
  actions: {
    enrichCompany: {
      title: 'Enrich Company',
      description: 'Retrieve a company profile by domain. This action can consume CompanyEnrich credits.',
      input: {
        schema: z.object({
          domain: z.string().min(1).max(1024).title('Domain').describe('Company domain, for example stripe.com'),
          expand: workforce,
          waitForEnrichment: wait,
        }),
      },
      output: {
        schema: z.object({
          company: z.record(z.unknown()).title('Company').describe('Complete CompanyEnrich company profile'),
        }),
      },
    },
    searchCompanies: {
      title: 'Search Companies',
      description:
        'Find companies with semantic or literal queries and structured filters. Results can consume credits.',
      input: {
        schema: z.object({
          query: z
            .string()
            .min(1)
            .max(500)
            .optional()
            .title('Query')
            .describe('Legacy natural-language query; semanticQuery takes precedence'),
          literalQuery,
          semanticQuery,
          filters,
          expand: workforce,
          ...pagination,
        }),
      },
      output: objectResult,
    },
    findSimilarCompanies: {
      title: 'Find Similar Companies',
      description: 'Discover companies similar to seed domains with optional filters. Results can consume credits.',
      input: { schema: z.object({ domains, filters, expand: workforce, waitForEnrichment: wait, ...pagination }) },
      output: objectResult,
    },
    searchPeople: {
      title: 'Search People',
      description: 'Search people using names, roles, company filters, and education criteria. Can consume credits.',
      input: {
        schema: z.object({
          query: z.string().max(250).optional().title('Query').describe('Person search query'),
          filters,
          expand: education,
          ...pagination,
        }),
      },
      output: result,
    },
    lookupPerson: {
      title: 'Lookup Person by Email',
      description: 'Retrieve a person and company from an email address. Can consume credits.',
      input: {
        schema: z.object({
          email: z.string().email().title('Email').describe('Email address to look up'),
          expand: education,
        }),
      },
      output: result,
    },
    getCompanyWorkforce: {
      title: 'Get Company Workforce',
      description: 'Retrieve workforce data using exactly one company ID or domain. Can consume credits.',
      input: {
        schema: z.object({
          id: z.string().uuid().optional().title('Company ID').describe('Company UUID; omit when supplying domain'),
          domain: z.string().min(1).optional().title('Domain').describe('Company domain; omit when supplying ID'),
        }),
      },
      output: result,
    },
    enrichCompanyByProperties: {
      title: 'Enrich Company by Properties',
      description: 'Match a company by name or documented social properties. Can consume credits.',
      input: {
        schema: z.object({
          properties: z
            .record(z.unknown())
            .title('Properties')
            .describe(
              'At least one of name, linkedinUrl, linkedinId, twitterUrl, facebookUrl, instagramUrl, or youTubeUrl'
            ),
          expand: workforce,
        }),
      },
      output: result,
    },
    enrichCompaniesBatch: {
      title: 'Batch Enrich Companies',
      description: 'Enrich one to fifty domains in one request. Can consume credits per domain.',
      input: {
        schema: z.object({
          domains: z.array(z.string().min(1)).min(1).max(50).title('Domains').describe('One to fifty company domains'),
          expand: workforce,
        }),
      },
      output: result,
    },
    getCompany: {
      title: 'Get Company by ID',
      description: 'Retrieve a company by UUID. Can consume credits.',
      input: {
        schema: z.object({ id: z.string().uuid().title('Company ID').describe('Company UUID'), expand: workforce }),
      },
      output: result,
    },
    getPerson: {
      title: 'Get Person by ID',
      description: 'Retrieve a person by positive int64 ID. Can consume credits.',
      input: {
        schema: z.object({
          id: z
            .string()
            .regex(/^[1-9]\d*$/)
            .title('Person ID')
            .describe('Positive decimal ID as a string to preserve int64 precision'),
          expand: education,
        }),
      },
      output: result,
    },
    countCompanies: {
      title: 'Count Matching Companies',
      description: 'Return the company count for a search, including zero. API credit rules apply.',
      input: { schema: z.object({ literalQuery, semanticQuery, filters }) },
      output: result,
    },
    countSimilarCompanies: {
      title: 'Count Similar Companies',
      description: 'Return the company count for one to ten seed domains and optional filters. API credit rules apply.',
      input: { schema: z.object({ domains, filters, waitForEnrichment: wait }) },
      output: result,
    },
    advancedOperation: {
      title: 'Advanced CompanyEnrich Operation',
      description:
        'Make one allowlisted API request: discovery, previews, scroll, taxonomies, or job operations. Email operations are Beta and require explicit opt-in. Can consume credits.',
      input: {
        schema: z.object({
          operation: z
            .enum(operations.map((entry) => entry.operation) as [string, ...string[]])
            .title('Operation')
            .describe(
              'Fixed API operation; get_people_email, post_people_email_bulk, and get_people_email_bulk_jobid are Beta'
            ),
          body: z
            .record(z.unknown())
            .optional()
            .title('Body')
            .describe('Documented JSON request body; export jobs require an explicit count of 1–50,000'),
          query: z
            .record(z.unknown())
            .optional()
            .title('Query Parameters')
            .describe('Documented URL query parameters only'),
          path_parameters: z
            .record(z.unknown())
            .optional()
            .title('Path Parameters')
            .describe('Documented path parameters, such as jobId or countryCode'),
          allow_beta: z
            .boolean()
            .default(false)
            .title('Allow Beta')
            .describe('Explicit opt-in to Beta email operations'),
        }),
      },
      output: {
        schema: z.object({
          data: raw.title('Data').describe('Unmodified response; returned job or download URLs are not followed'),
        }),
      },
    },
  },
  attributes: { category: 'Data & Analytics', repo: 'botpress' },
})
