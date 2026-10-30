import { afterEach, describe, expect, it, vi } from 'vitest'
import { CompanyEnrichClient } from './client'

afterEach(() => vi.unstubAllGlobals())

describe('CompanyEnrichClient', () => {
  it('validates credentials with the free /me endpoint', async () => {
    const request = vi.fn().mockResolvedValue(Response.json({ credits: 100 }))
    vi.stubGlobal('fetch', request)
    await new CompanyEnrichClient('test-key').verifyCredentials()
    expect(request).toHaveBeenCalledWith(
      'https://api.companyenrich.com/me',
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({ Authorization: 'Bearer test-key' }),
        redirect: 'error',
      })
    )
  })

  it('encodes enrichment input as a query parameter', async () => {
    const company = { id: 'example', domain: 'example.com', name: 'Example' }
    const request = vi.fn().mockResolvedValue(Response.json(company))
    vi.stubGlobal('fetch', request)
    expect(await new CompanyEnrichClient('test-key').enrichCompany('example.com&expand=workforce')).toEqual(company)
    expect(request.mock.calls[0]?.[0]).toBe(
      'https://api.companyenrich.com/companies/enrich?domain=example.com%26expand%3Dworkforce'
    )
  })

  it('sends search pagination in the POST body without automatic pagination', async () => {
    const request = vi.fn().mockResolvedValue(Response.json({ items: [], totalCount: 0 }))
    vi.stubGlobal('fetch', request)
    await new CompanyEnrichClient('test-key').searchCompanies('B2B software companies', 2, 10)
    expect(request).toHaveBeenCalledTimes(1)
    expect(request).toHaveBeenCalledWith(
      'https://api.companyenrich.com/companies/search',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ semanticQuery: 'B2B software companies', page: 2, pageSize: 10 }),
      })
    )
  })

  it('uses the supported domains array for lookalikes', async () => {
    const request = vi.fn().mockResolvedValue(Response.json({ items: [] }))
    vi.stubGlobal('fetch', request)
    await new CompanyEnrichClient('test-key').findSimilarCompanies(['example.com'], 1, 10)
    expect(request).toHaveBeenCalledWith(
      'https://api.companyenrich.com/companies/similar',
      expect.objectContaining({
        body: JSON.stringify({ domains: ['example.com'], page: 1, pageSize: 10 }),
      })
    )
  })

  it('rejects pagination past the documented result ceiling before requesting', async () => {
    const request = vi.fn()
    vi.stubGlobal('fetch', request)
    await expect(new CompanyEnrichClient('test-key').searchCompanies('software', 101, 100)).rejects.toThrow('10,000')
    expect(request).not.toHaveBeenCalled()
  })

  it.each([401, 402, 404, 429, 500])('reports HTTP %s without exposing response contents', async (status) => {
    const request = vi.fn().mockResolvedValue(new Response('sensitive upstream body', { status }))
    vi.stubGlobal('fetch', request)
    await expect(new CompanyEnrichClient('test-key').enrichCompany('example.com')).rejects.toThrow(`HTTP ${status}`)
    expect(request).toHaveBeenCalledTimes(1)
  })

  it('sanitizes transport errors and rejects malformed responses', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Bearer test-key')))
    await expect(new CompanyEnrichClient('test-key').verifyCredentials()).rejects.toThrow('could not be reached')
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('not JSON')))
    await expect(new CompanyEnrichClient('test-key').verifyCredentials()).rejects.toThrow('invalid JSON')
  })
})
