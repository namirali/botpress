import { RuntimeError } from '@botpress/sdk'

export class CompanyEnrichClient {
  public constructor(private readonly _apiKey: string) {}

  public async verifyCredentials(): Promise<void> {
    await this._request('/me')
  }

  public async enrichCompany(domain: string): Promise<Record<string, unknown>> {
    return this._request(`/companies/enrich?${new URLSearchParams({ domain })}`)
  }

  public async searchCompanies(query: string, page: number, pageSize: number): Promise<Record<string, unknown>> {
    this._validatePagination(page, pageSize)
    return this._request('/companies/search', { semanticQuery: query, page, pageSize })
  }

  public async findSimilarCompanies(
    domains: string[],
    page: number,
    pageSize: number
  ): Promise<Record<string, unknown>> {
    this._validatePagination(page, pageSize)
    return this._request('/companies/similar', { domains, page, pageSize })
  }

  private _validatePagination(page: number, pageSize: number): void {
    if (
      !Number.isInteger(page) ||
      !Number.isInteger(pageSize) ||
      page < 1 ||
      pageSize < 1 ||
      pageSize > 100 ||
      page * pageSize > 10000
    ) {
      throw new RuntimeError(
        'Use a positive page and page size from 1 to 100; page × page size must not exceed 10,000.'
      )
    }
  }

  private async _request(endpoint: string, body?: Record<string, unknown>): Promise<Record<string, unknown>> {
    let response: Response
    try {
      response = await fetch(`https://api.companyenrich.com${endpoint}`, {
        method: body ? 'POST' : 'GET',
        headers: { Authorization: `Bearer ${this._apiKey}`, 'Content-Type': 'application/json' },
        ...(body ? { body: JSON.stringify(body) } : {}),
        signal: AbortSignal.timeout(30000),
        redirect: 'error',
      })
    } catch {
      throw new RuntimeError('CompanyEnrich could not be reached. Check the connection and try again.')
    }
    if (!response.ok) {
      throw new RuntimeError(
        `CompanyEnrich returned HTTP ${response.status}. Check the API key, available credits, and request parameters.`
      )
    }
    let data: unknown
    try {
      data = await response.json()
    } catch {
      throw new RuntimeError('CompanyEnrich returned an invalid JSON response.')
    }
    if (!data || typeof data !== 'object' || Array.isArray(data)) {
      throw new RuntimeError('CompanyEnrich returned an unexpected response format.')
    }
    return data as Record<string, unknown>
  }
}
