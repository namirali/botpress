import { CompanyEnrichClient } from './client'
import * as bp from '.botpress'

export default new bp.Integration({
  register: async ({ ctx }) => {
    await new CompanyEnrichClient(ctx.configuration.apiKey).verifyCredentials()
  },
  unregister: async () => {},
  actions: {
    enrichCompany: async ({ ctx, input }) => ({
      company: await new CompanyEnrichClient(ctx.configuration.apiKey).enrichCompany(input.domain),
    }),
    searchCompanies: async ({ ctx, input }) => ({
      result: await new CompanyEnrichClient(ctx.configuration.apiKey).searchCompanies(
        input.query,
        input.page ?? 1,
        input.pageSize ?? 10
      ),
    }),
    findSimilarCompanies: async ({ ctx, input }) => ({
      result: await new CompanyEnrichClient(ctx.configuration.apiKey).findSimilarCompanies(
        input.domains,
        input.page ?? 1,
        input.pageSize ?? 10
      ),
    }),
  },
  channels: {},
  handler: async () => {},
})
