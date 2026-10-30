import { IntegrationDefinition, z } from '@botpress/sdk'

const pagination = {
  page: z.number().int().min(1).default(1).title('Page').describe('Page number, starting at 1'),
  pageSize: z.number().int().min(1).max(100).default(10).title('Page Size').describe('Maximum companies per request'),
}

export default new IntegrationDefinition({
  name: 'companyenrich',
  version: '0.1.0',
  title: 'CompanyEnrich',
  description: 'Enrich companies, search for accounts, and discover similar companies.',
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
          domain: z.string().min(1).title('Domain').describe('Company domain, for example stripe.com'),
        }),
      },
      output: {
        schema: z.object({ company: z.record(z.unknown()).title('Company').describe('CompanyEnrich company profile') }),
      },
    },
    searchCompanies: {
      title: 'Search Companies',
      description: 'Find companies using a natural-language business description. Results can consume credits.',
      input: {
        schema: z.object({
          query: z.string().min(1).max(500).title('Query').describe('A description of the companies to find'),
          ...pagination,
        }),
      },
      output: {
        schema: z.object({
          result: z.record(z.unknown()).title('Result').describe('Companies and pagination metadata'),
        }),
      },
    },
    findSimilarCompanies: {
      title: 'Find Similar Companies',
      description: 'Discover companies similar to seed domains. Results can consume CompanyEnrich credits.',
      input: {
        schema: z.object({
          domains: z
            .array(z.string().min(1))
            .min(1)
            .max(10)
            .title('Domains')
            .describe('One to ten seed company domains'),
          ...pagination,
        }),
      },
      output: {
        schema: z.object({
          result: z.record(z.unknown()).title('Result').describe('Similar companies and pagination metadata'),
        }),
      },
    },
  },
  attributes: { category: 'Data & Analytics', repo: 'botpress' },
})
