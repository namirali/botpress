import { afterEach, describe, expect, it, vi } from 'vitest'
import definition from '../integration.definition'
import integration from './index'
import { CompanyEnrichClient, type RequestInput } from './client'

const registered = definition.actions!
const uuid = '11111111-1111-4111-8111-111111111111'
const rich = {
  items: [{ domain: 'example.com', funding: { rounds: [{ newField: true }] } }],
  metadata: { scores: [0.9], cursor: 'next' },
  future: { nested: [1, 2] },
}
const request = () => {
  const mock = vi.fn().mockImplementation(async () => Response.json(rich))
  vi.stubGlobal('fetch', mock)
  return mock
}
afterEach(() => vi.unstubAllGlobals())

type ActionName = keyof typeof integration.actions
async function invoke(name: ActionName, input: Record<string, unknown>) {
  const parsed = registered[name].input.schema.parse(input)
  // Exercise the actual SDK Integration action registry with parsed public inputs.
  const handler = integration.actions[name] as unknown as (args: unknown) => Promise<unknown>
  const output = await handler({ ctx: { configuration: { apiKey: 'test-key' } }, input: parsed })
  return registered[name].output.schema.parse(output)
}

const core: [ActionName, Record<string, unknown>, string, string, string][] = [
  ['enrichCompany', { domain: 'example.com' }, 'GET', '/companies/enrich', 'company'],
  ['searchCompanies', { query: 'software' }, 'POST', '/companies/search', 'result'],
  ['findSimilarCompanies', { domains: ['example.com'] }, 'POST', '/companies/similar', 'result'],
  ['searchPeople', { query: 'Jane' }, 'POST', '/people/search', 'result'],
  ['lookupPerson', { email: 'jane@example.com' }, 'POST', '/people/lookup', 'result'],
  ['getCompanyWorkforce', { domain: 'example.com' }, 'GET', '/companies/workforce', 'result'],
  ['enrichCompanyByProperties', { properties: { name: 'Example' } }, 'POST', '/companies/enrich', 'result'],
  ['enrichCompaniesBatch', { domains: ['example.com'] }, 'POST', '/companies/enrich/batch', 'result'],
  ['getCompany', { id: uuid }, 'GET', '/companies', 'result'],
  ['getPerson', { id: '9223372036854775807' }, 'GET', '/people', 'result'],
  ['countCompanies', { literalQuery: 'software' }, 'POST', '/companies/search/count', 'result'],
  ['countSimilarCompanies', { domains: ['example.com'] }, 'POST', '/companies/similar/count', 'result'],
]

// Independent route fixtures cover every documented selector value, not only the core actions.
const advanced: [string, string, string, Partial<RequestInput>][] = [
  ['get_companies_enrich', 'GET', '/companies/enrich', { query: { domain: 'example.com' } }],
  ['post_companies_enrich', 'POST', '/companies/enrich', { body: { name: 'Example' } }],
  ['post_companies_enrich_batch', 'POST', '/companies/enrich/batch', { body: { domains: ['example.com'] } }],
  ['get_companies_workforce', 'GET', '/companies/workforce', { query: { domain: 'example.com' } }],
  ['get_companies_autocomplete', 'GET', '/companies/autocomplete', { query: { query: 'example' } }],
  ['post_companies_enrich_bulk', 'POST', '/companies/enrich/bulk', { body: { domains: ['example.com'] } }],
  ['get_companies_enrich_bulk_jobid', 'GET', `/companies/enrich/bulk/${uuid}`, { path_parameters: { jobId: uuid } }],
  ['get_companies_enrich_bulk_jobs', 'GET', '/companies/enrich/bulk/jobs', {}],
  ['post_companies_search', 'POST', '/companies/search', { body: { countries: ['US'] } }],
  ['post_companies_search_preview', 'POST', '/companies/search/preview', { body: { query: 'software' } }],
  ['post_companies_search_count', 'POST', '/companies/search/count', { body: { query: 'software' } }],
  ['post_companies_search_scroll', 'POST', '/companies/search/scroll', { body: { cursor: 'next' } }],
  ['get_companies', 'GET', '/companies', { query: { id: uuid } }],
  [
    'post_companies_search_async',
    'POST',
    '/companies/search/async',
    { body: { count: 10, search: { countries: ['US'] } } },
  ],
  ['get_companies_search_async_jobid', 'GET', `/companies/search/async/${uuid}`, { path_parameters: { jobId: uuid } }],
  ['get_companies_search_async_jobs', 'GET', '/companies/search/async/jobs', {}],
  ['post_companies_similar', 'POST', '/companies/similar', { body: { domains: ['example.com'] } }],
  ['post_companies_similar_preview', 'POST', '/companies/similar/preview', { body: { domains: ['example.com'] } }],
  ['post_companies_similar_count', 'POST', '/companies/similar/count', { body: { domains: ['example.com'] } }],
  [
    'post_companies_similar_scroll',
    'POST',
    '/companies/similar/scroll',
    { body: { domains: ['example.com'], cursor: 'next' } },
  ],
  ['post_people_lookup', 'POST', '/people/lookup', { body: { email: 'jane@example.com' } }],
  ['get_people', 'GET', '/people', { query: { id: '9223372036854775807' } }],
  ['post_people_search', 'POST', '/people/search', { body: { query: 'Jane' } }],
  ['post_people_search_scroll', 'POST', '/people/search/scroll', { body: { cursor: 'next' } }],
  ['get_people_email', 'GET', '/people/email', { query: { id: '123' }, allow_beta: true }],
  [
    'post_people_email_bulk',
    'POST',
    '/people/email/bulk',
    { body: { items: [{ person_id: '9223372036854775807' }] }, allow_beta: true },
  ],
  [
    'get_people_email_bulk_jobid',
    'GET',
    `/people/email/bulk/${uuid}`,
    { path_parameters: { jobId: uuid }, allow_beta: true },
  ],
  ['get_people_education', 'GET', '/people/education', { query: { id: '123' } }],
  ['post_people_search_async', 'POST', '/people/search/async', { body: { count: 10, query: 'Jane' } }],
  ['get_people_search_async_jobid', 'GET', `/people/search/async/${uuid}`, { path_parameters: { jobId: uuid } }],
  ['get_people_search_async_jobs', 'GET', '/people/search/async/jobs', {}],
  ['get_jobs', 'GET', '/jobs', {}],
  ['get_jobs_jobid', 'GET', `/jobs/${uuid}`, { path_parameters: { jobId: uuid } }],
  ['get_geo_regions', 'GET', '/geo/regions', {}],
  ['get_geo_countries_countrycode', 'GET', '/geo/countries/US', { path_parameters: { countryCode: 'US' } }],
  ['post_geo_countries', 'POST', '/geo/countries', { body: { query: 'united' } }],
  ['post_geo_states', 'POST', '/geo/states', { body: { countryCodes: ['US'] } }],
  ['post_geo_cities', 'POST', '/geo/cities', { body: { countryCodes: ['US'] } }],
  ['get_industries', 'GET', '/industries', {}],
  ['get_keywords_autocomplete', 'GET', '/keywords/autocomplete', { query: { query: 'software' } }],
  ['get_technologies_autocomplete', 'GET', '/technologies/autocomplete', { query: { query: 'react' } }],
  ['get_positions_autocomplete', 'GET', '/positions/autocomplete', { query: { query: 'engineer' } }],
]

describe('Botpress action registry', () => {
  it('exposes exactly the 12 core actions and the 42-operation advanced selector', () => {
    expect(Object.keys(registered).sort()).toEqual([...core.map(([name]) => name), 'advancedOperation'].sort())
    expect(Object.keys(integration.actions).sort()).toEqual(Object.keys(registered).sort())
    expect(registered.advancedOperation.input.schema.shape.operation.options.sort()).toEqual(
      advanced.map(([name]) => name).sort()
    )
  })
  it.each(core)(
    '%s is registered, calls the core route, and preserves all fields',
    async (name, input, method, path, outputKey) => {
      const mock = request()
      expect(await invoke(name, input)).toEqual({ [outputKey]: rich })
      expect(mock).toHaveBeenCalledTimes(1)
      expect(new URL(mock.mock.calls[0]![0]).pathname).toBe(path)
      expect(mock.mock.calls[0]![1]).toMatchObject({
        method,
        redirect: 'error',
        headers: { Authorization: 'Bearer test-key' },
      })
    }
  )
  it.each(advanced)('advanced %s makes exactly one fixed-route request', async (operation, method, path, input) => {
    const mock = request()
    expect(await invoke('advancedOperation', { operation, ...input })).toEqual({ data: rich })
    expect(mock).toHaveBeenCalledTimes(1)
    const url = new URL(mock.mock.calls[0]![0])
    expect(url.origin).toBe('https://api.companyenrich.com')
    expect(url.pathname).toBe(path)
    expect(mock.mock.calls[0]![1].method).toBe(method)
    if (input.query)
      for (const [key, value] of Object.entries(input.query)) expect(url.searchParams.get(key)).toBe(String(value))
  })
  it('preserves count zero, arrays and future nested fields through host output validation', async () => {
    const mock = request()
    mock.mockImplementation(async () => Response.json(0))
    expect(await invoke('countCompanies', {})).toEqual({ result: 0 })
    expect(await invoke('countSimilarCompanies', { domains: ['example.com'] })).toEqual({ result: 0 })
    mock.mockImplementation(async () => Response.json([rich]))
    expect(await invoke('enrichCompaniesBatch', { domains: ['example.com'] })).toEqual({ result: [rich] })
    expect(await invoke('advancedOperation', { operation: 'get_industries' })).toEqual({ data: [rich] })
  })
  it('forwards full filters, expands and explicit fields with documented precedence', async () => {
    const mock = request()
    const filters = {
      countries: ['US'],
      technologies: ['React'],
      exclude: { domains: ['exclude.com'] },
      workforceGrowth: { period: 'y1', minPercent: 10 },
      future: { value: 5 },
      query: 'old',
      semanticQuery: 'old',
    }
    await invoke('searchCompanies', {
      query: 'legacy semantic',
      semanticQuery: 'new semantic',
      literalQuery: 'software',
      filters,
      expand: ['workforce'],
      page: 2,
      pageSize: 15,
    })
    expect(JSON.parse(mock.mock.calls[0]![1].body)).toEqual({
      ...filters,
      semanticQuery: 'new semantic',
      query: 'software',
      page: 2,
      pageSize: 15,
    })
    expect(new URL(mock.mock.calls[0]![0]).searchParams.getAll('expand')).toEqual(['workforce'])
    await invoke('findSimilarCompanies', {
      domains: ['one.com', 'two.com'],
      filters: { countries: ['US'], minScore: 0.5 },
      expand: ['workforce'],
      waitForEnrichment: false,
    })
    expect(JSON.parse(mock.mock.calls[1]![1].body)).toEqual({
      countries: ['US'],
      minScore: 0.5,
      domains: ['one.com', 'two.com'],
      page: 1,
      pageSize: 10,
    })
    expect(new URL(mock.mock.calls[1]![0]).searchParams.get('waitForEnrichment')).toBe('false')
    await invoke('searchPeople', {
      filters: {
        companyFilter: { domains: ['example.com'] },
        positionQuery: ['engineer'],
        education: { institutionNameQuery: ['MIT'] },
      },
      expand: ['education'],
    })
    expect(JSON.parse(mock.mock.calls[2]![1].body)).toMatchObject({
      companyFilter: { domains: ['example.com'] },
      positionQuery: ['engineer'],
      education: { institutionNameQuery: ['MIT'] },
    })
  })
  it('preserves legacy semantic searches and default pagination', async () => {
    const mock = request()
    await invoke('searchCompanies', { query: 'B2B software' })
    expect(JSON.parse(mock.mock.calls[0]![1].body)).toEqual({ semanticQuery: 'B2B software', page: 1, pageSize: 10 })
  })
  it('uses conservative page defaults for advanced page, cursor, and job-list requests', async () => {
    const mock = request()
    await invoke('advancedOperation', { operation: 'post_companies_search' })
    expect(JSON.parse(mock.mock.calls[0]![1].body)).toEqual({ page: 1, pageSize: 10 })
    await invoke('advancedOperation', { operation: 'post_people_search_scroll', body: { cursor: 'next' } })
    expect(JSON.parse(mock.mock.calls[1]![1].body)).toEqual({ cursor: 'next', pageSize: 10 })
    await invoke('advancedOperation', { operation: 'get_jobs' })
    expect(new URL(mock.mock.calls[2]![0]).searchParams.get('pageSize')).toBe('10')
  })
  it('keeps int64 IDs exact in query strings and numeric JSON tokens', async () => {
    const mock = request()
    await invoke('getPerson', { id: '9223372036854775807' })
    expect(new URL(mock.mock.calls[0]![0]).searchParams.get('id')).toBe('9223372036854775807')
    await invoke('advancedOperation', {
      operation: 'post_people_email_bulk',
      body: { items: [{ person_id: '9223372036854775807' }] },
      allow_beta: true,
    })
    expect(mock.mock.calls[1]![1].body).toBe('{"items":[{"person_id":9223372036854775807}]}')
  })
  it('encodes path parameters and never follows returned URLs or polls jobs', async () => {
    const mock = request().mockResolvedValue(
      Response.json({ status: 'pending', resultsUrl: 'https://other.example/results' })
    )
    await invoke('advancedOperation', {
      operation: 'get_geo_countries_countrycode',
      path_parameters: { countryCode: 'US/../?x=#' },
    })
    expect(mock.mock.calls[0]![0]).toBe('https://api.companyenrich.com/geo/countries/US%2F..%2F%3Fx%3D%23')
    expect(mock).toHaveBeenCalledTimes(1)
  })
  it('preserves the deprecated single domain only where documented', async () => {
    const mock = request()
    await invoke('advancedOperation', { operation: 'post_companies_similar', body: { domain: 'example.com' } })
    expect(JSON.parse(mock.mock.calls[0]![1].body)).toEqual({ domain: 'example.com', page: 1, pageSize: 10 })
  })
})

describe('preflight validation and request safety', () => {
  const bad: unknown[] = [
    { operation: 'get_me' },
    { operation: 'https://evil.example' },
    { operation: 'get_companies_enrich', query: { domain: '' } },
    { operation: 'get_companies_enrich', query: { domain: '  ' } },
    { operation: 'get_companies_enrich', query: { domain: 'example.com', expand: ['education'] } },
    { operation: 'get_companies_enrich', query: { domain: 'example.com', waitForEnrichment: 'false' } },
    { operation: 'get_companies_enrich', query: { domain: 'example.com', url: 'https://evil.example' } },
    { operation: 'get_companies_workforce' },
    { operation: 'get_companies_workforce', query: { id: uuid, domain: 'example.com' } },
    { operation: 'get_companies', query: { id: 'wrong' } },
    { operation: 'get_people', query: { id: true } },
    { operation: 'get_people', query: { id: 0 } },
    { operation: 'get_people', query: { id: 9007199254740992 } },
    { operation: 'get_people', query: { id: '9223372036854775808' } },
    { operation: 'post_companies_enrich', body: {} },
    { operation: 'post_companies_enrich', body: { name: ' ' } },
    { operation: 'post_companies_enrich_batch', body: { domains: [] } },
    { operation: 'post_companies_enrich_batch', body: { domains: Array(51).fill('example.com') } },
    { operation: 'post_companies_enrich_batch', body: { domains: [' '] } },
    { operation: 'post_companies_similar', body: { domains: Array(11).fill('example.com') } },
    { operation: 'post_companies_similar_count', body: { domain: 'example.com' } },
    { operation: 'post_people_lookup', body: { email: 'no-email' } },
    { operation: 'post_people_search', body: { page: true } },
    { operation: 'post_people_search', body: { pageSize: 101 } },
    { operation: 'post_companies_search', body: { page: 101, pageSize: 100 } },
    { operation: 'post_companies_search', body: { page: 1.5 } },
    { operation: 'post_companies_search', body: { query: 'x'.repeat(251) } },
    { operation: 'post_companies_search', body: { semanticQuery: 'x'.repeat(501) } },
    { operation: 'post_companies_search', body: { future: Infinity } },
    { operation: 'post_companies_search', body: { future: NaN } },
    { operation: 'post_companies_search', body: { future: () => 1 } },
    { operation: 'post_companies_search', body: { future: undefined } },
    { operation: 'post_companies_search', body: [] },
    { operation: 'post_companies_search', body: null },
    { operation: 'post_companies_search_async', body: { search: {} } },
    { operation: 'post_people_search_async', body: { count: 50001 } },
    { operation: 'post_companies_search_async', body: { count: true } },
    { operation: 'post_companies_enrich_bulk', body: { domains: [] } },
    { operation: 'post_people_email_bulk', allow_beta: true, body: { items: [] } },
    { operation: 'post_people_email_bulk', allow_beta: true, body: { items: [{}] } },
    { operation: 'get_geo_countries_countrycode', path_parameters: { countryCode: '.' } },
    { operation: 'get_geo_countries_countrycode', path_parameters: { countryCode: '..' } },
    { operation: 'get_jobs_jobid', path_parameters: { jobId: uuid, extra: 'x' } },
    { operation: 'get_jobs_jobid', path_parameters: {} },
    { operation: 'get_jobs', query: { status: 'invalid' } },
    { operation: 'get_jobs', body: { query: 'invalid' } },
    { operation: 'get_jobs', allow_beta: 'true' },
  ]
  it.each(bad)('rejects invalid input before network: %j', async (input) => {
    const mock = request()
    await expect(new CompanyEnrichClient('test-key').execute(input as RequestInput)).rejects.toThrow()
    expect(mock).not.toHaveBeenCalled()
  })
  it('rejects cyclic JSON before network', async () => {
    const mock = request()
    const body: Record<string, unknown> = {}
    body.self = body
    await expect(
      new CompanyEnrichClient('test-key').execute({ operation: 'post_companies_search', body })
    ).rejects.toThrow('JSON')
    expect(mock).not.toHaveBeenCalled()
  })
  it.each(
    advanced.filter(([name]) =>
      ['get_people_email', 'post_people_email_bulk', 'get_people_email_bulk_jobid'].includes(name)
    )
  )('requires explicit Beta consent for %s', async (operation, _method, _path, input) => {
    const mock = request()
    await expect(invoke('advancedOperation', { operation, ...input, allow_beta: false })).rejects.toThrow('Beta')
    expect(mock).not.toHaveBeenCalled()
  })
  it('returns no account payload from registration', async () => {
    const mock = request().mockResolvedValue(Response.json({ apiKey: 'sensitive', credits: 100 }))
    const register = integration.register as unknown as (args: unknown) => Promise<unknown>
    expect(await register({ ctx: { configuration: { apiKey: 'test-key' } } })).toBeUndefined()
    expect(mock).toHaveBeenCalledTimes(1)
    expect(mock.mock.calls[0]![0]).toBe('https://api.companyenrich.com/me')
  })
  it.each([401, 402, 429, 500])('does not retry paid HTTP %s or expose credentials/upstream body', async (status) => {
    const mock = request().mockResolvedValue(new Response('Bearer test-key private response', { status }))
    const error = await invoke('advancedOperation', { operation: 'post_companies_search' }).catch(
      (value: Error) => value
    )
    expect(String(error)).toContain(`HTTP ${status}`)
    expect(String(error)).not.toMatch(/test-key|private response/)
    expect(mock).toHaveBeenCalledTimes(1)
  })
})
