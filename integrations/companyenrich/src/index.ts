import { CompanyEnrichClient, withFilters } from './client'
import * as bp from '.botpress'

const options = (fields: Record<string, unknown>) => withFilters(undefined, fields)

export default new bp.Integration({
  register: async ({ ctx }) => {
    await new CompanyEnrichClient(ctx.configuration.apiKey).verifyCredentials()
  },
  unregister: async () => {},
  actions: {
    enrichCompany: async ({ ctx, input }) => ({
      company: await new CompanyEnrichClient(ctx.configuration.apiKey).enrichCompany(
        input.domain,
        options({ expand: input.expand, waitForEnrichment: input.waitForEnrichment })
      ),
    }),
    searchCompanies: async ({ ctx, input }) => ({
      result: await new CompanyEnrichClient(ctx.configuration.apiKey).searchCompanies(
        input.semanticQuery ?? input.query,
        input.page ?? 1,
        input.pageSize ?? 10,
        withFilters(input.filters, { query: input.literalQuery }),
        options({ expand: input.expand })
      ),
    }),
    findSimilarCompanies: async ({ ctx, input }) => ({
      result: await new CompanyEnrichClient(ctx.configuration.apiKey).findSimilarCompanies(
        input.domains,
        input.page ?? 1,
        input.pageSize ?? 10,
        input.filters,
        options({ expand: input.expand, waitForEnrichment: input.waitForEnrichment })
      ),
    }),
    searchPeople: async ({ ctx, input }) => ({
      result: await new CompanyEnrichClient(ctx.configuration.apiKey).execute({
        operation: 'post_people_search',
        body: withFilters(input.filters, { query: input.query, page: input.page ?? 1, pageSize: input.pageSize ?? 10 }),
        query: options({ expand: input.expand }),
      }),
    }),
    lookupPerson: async ({ ctx, input }) => ({
      result: await new CompanyEnrichClient(ctx.configuration.apiKey).execute({
        operation: 'post_people_lookup',
        body: { email: input.email },
        query: options({ expand: input.expand }),
      }),
    }),
    getCompanyWorkforce: async ({ ctx, input }) => ({
      result: await new CompanyEnrichClient(ctx.configuration.apiKey).execute({
        operation: 'get_companies_workforce',
        query: options({ id: input.id, domain: input.domain }),
      }),
    }),
    enrichCompanyByProperties: async ({ ctx, input }) => ({
      result: await new CompanyEnrichClient(ctx.configuration.apiKey).execute({
        operation: 'post_companies_enrich',
        body: input.properties,
        query: options({ expand: input.expand }),
      }),
    }),
    enrichCompaniesBatch: async ({ ctx, input }) => ({
      result: await new CompanyEnrichClient(ctx.configuration.apiKey).execute({
        operation: 'post_companies_enrich_batch',
        body: { domains: input.domains },
        query: options({ expand: input.expand }),
      }),
    }),
    getCompany: async ({ ctx, input }) => ({
      result: await new CompanyEnrichClient(ctx.configuration.apiKey).execute({
        operation: 'get_companies',
        query: options({ id: input.id, expand: input.expand }),
      }),
    }),
    getPerson: async ({ ctx, input }) => ({
      result: await new CompanyEnrichClient(ctx.configuration.apiKey).execute({
        operation: 'get_people',
        query: options({ id: input.id, expand: input.expand }),
      }),
    }),
    countCompanies: async ({ ctx, input }) => ({
      result: await new CompanyEnrichClient(ctx.configuration.apiKey).execute({
        operation: 'post_companies_search_count',
        body: withFilters(input.filters, { query: input.literalQuery, semanticQuery: input.semanticQuery }),
      }),
    }),
    countSimilarCompanies: async ({ ctx, input }) => ({
      result: await new CompanyEnrichClient(ctx.configuration.apiKey).execute({
        operation: 'post_companies_similar_count',
        body: withFilters(input.filters, { domains: input.domains }),
        query: options({ waitForEnrichment: input.waitForEnrichment }),
      }),
    }),
    advancedOperation: async ({ ctx, input }) => ({
      data: await new CompanyEnrichClient(ctx.configuration.apiKey).execute(input),
    }),
  },
  channels: {},
  handler: async () => {},
})
