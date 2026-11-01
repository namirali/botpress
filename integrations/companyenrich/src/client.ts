import { RuntimeError } from '@botpress/sdk'
import { operations, type Schema } from './catalog'

export type ApiResult = Record<string, unknown> | unknown[] | string | number | boolean | null
export type RequestInput = {
  operation: string
  body?: Record<string, unknown>
  query?: Record<string, unknown>
  path_parameters?: Record<string, unknown>
  allow_beta?: boolean
}

function fail(message: string): never {
  throw new RuntimeError(message)
}
const isObject = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === 'object' && !Array.isArray(value)

// Reject values JSON.stringify would otherwise drop, coerce, or fail on after a paid call begins.
function validateJson(value: unknown, seen = new Set<object>()): void {
  if (value === null || typeof value === 'string' || typeof value === 'boolean') return
  if (typeof value === 'number' && Number.isFinite(value)) return
  if (typeof value !== 'object' || value === null || seen.has(value))
    fail('Inputs must contain finite, acyclic JSON values.')
  const object = value as object
  if (
    !Array.isArray(value) &&
    Object.getPrototypeOf(value) !== Object.prototype &&
    Object.getPrototypeOf(value) !== null
  )
    fail('Inputs must contain plain JSON objects.')
  seen.add(object)
  for (const item of Array.isArray(value) ? value : Object.values(object)) validateJson(item, seen)
  seen.delete(object)
}

// Emit validated decimal int64 strings as JSON integer tokens only where the API schema requires them.
// Unlike Number(id), this preserves every digit of a person ID in bulk email requests.
function serializeBody(value: unknown, schema: Schema = {}): string {
  if (schema.format === 'int64' && typeof value === 'string') return value
  if (Array.isArray(value)) return `[${value.map((item) => serializeBody(item, schema.items)).join(',')}]`
  if (isObject(value))
    return `{${Object.entries(value)
      .map(([key, item]) => `${JSON.stringify(key)}:${serializeBody(item, schema.properties?.[key])}`)
      .join(',')}}`
  return JSON.stringify(value)
}

function validate(value: unknown, schema: Schema, label: string): void {
  if (value === null && schema.nullable) return
  if (schema.enum && !schema.enum.includes(value)) fail(`${label} has an unsupported value.`)
  if (schema.format === 'int64') {
    const decimal =
      typeof value === 'string' ? value : typeof value === 'number' && Number.isSafeInteger(value) ? String(value) : ''
    if (!/^[1-9]\d*$/.test(decimal) || BigInt(decimal) > 9223372036854775807n) {
      fail(`${label} must be a positive int64; use a decimal string for large IDs.`)
    }
    return
  }
  if (schema.type === 'object') {
    if (!isObject(value)) fail(`${label} must be an object.`)
    const object = value as Record<string, unknown>
    for (const required of schema.required ?? []) {
      if (object[required] === undefined || object[required] === null) fail(`${label}.${required} is required.`)
    }
    for (const [key, child] of Object.entries(schema.properties ?? {})) {
      if (object[key] !== undefined) validate(object[key], child, `${label}.${key}`)
    }
  } else if (schema.type === 'array') {
    if (!Array.isArray(value)) fail(`${label} must be an array.`)
    const array = value as unknown[]
    if (array.length < (schema.minItems ?? 0) || array.length > (schema.maxItems ?? Infinity))
      fail(`${label} has an invalid number of items.`)
    array.forEach((item, index) => {
      validate(item, schema.items ?? {}, `${label}[${index}]`)
      if (label.endsWith('.domains') && (typeof item !== 'string' || !item.trim()))
        fail('Domains must be nonempty strings.')
    })
  } else if (schema.type === 'string') {
    if (typeof value !== 'string') fail(`${label} must be a string.`)
    const string = value as string
    if (string.length < (schema.minLength ?? 0) || string.length > (schema.maxLength ?? Infinity))
      fail(`${label} has an invalid length.`)
    if (schema.format === 'uuid' && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(string))
      fail(`${label} must be a UUID.`)
  } else if (schema.type === 'integer' || schema.type === 'number') {
    if (
      typeof value !== 'number' ||
      !Number.isFinite(value) ||
      (schema.type === 'integer' && !Number.isSafeInteger(value)) ||
      value < (schema.minimum ?? -Infinity) ||
      value > (schema.maximum ?? Infinity)
    )
      fail(`${label} must be a number within the documented bounds.`)
  } else if (schema.type === 'boolean' && typeof value !== 'boolean') fail(`${label} must be a boolean.`)
}

function pagination(input: Record<string, unknown>): void {
  if (input.page === undefined && input.pageSize === undefined) return
  const page = input.page ?? 1
  const pageSize = input.pageSize ?? 10
  if (
    typeof page !== 'number' ||
    !Number.isSafeInteger(page) ||
    page < 1 ||
    typeof pageSize !== 'number' ||
    !Number.isSafeInteger(pageSize) ||
    pageSize < 1 ||
    pageSize > 100 ||
    page * pageSize > 10000
  ) {
    fail('Use a positive page and page size from 1 to 100; page × page size must not exceed 10,000.')
  }
}

/** Dedicated action inputs take precedence over fields in the optional filter object. */
export function withFilters(
  filters: Record<string, unknown> | undefined,
  fields: Record<string, unknown>
): Record<string, unknown> {
  if (filters !== undefined && !isObject(filters)) fail('Filters must be an object.')
  return { ...filters, ...Object.fromEntries(Object.entries(fields).filter(([, value]) => value !== undefined)) }
}

export class CompanyEnrichClient {
  public constructor(private readonly _apiKey: string) {}

  public async verifyCredentials(): Promise<void> {
    await this._request('/me', 'GET') // The account response is intentionally never returned.
  }

  public async enrichCompany(domain: string, options: Record<string, unknown> = {}): Promise<Record<string, unknown>> {
    return this.execute({ operation: 'get_companies_enrich', query: { ...options, domain } }) as Promise<
      Record<string, unknown>
    >
  }

  // Preserve the original query argument's semantic meaning.
  public async searchCompanies(
    query: string | undefined,
    page: number,
    pageSize: number,
    filters?: Record<string, unknown>,
    options: Record<string, unknown> = {}
  ): Promise<Record<string, unknown>> {
    return this.execute({
      operation: 'post_companies_search',
      body: withFilters(filters, { semanticQuery: query, page, pageSize }),
      query: options,
    }) as Promise<Record<string, unknown>>
  }

  public async findSimilarCompanies(
    domains: string[],
    page: number,
    pageSize: number,
    filters?: Record<string, unknown>,
    options: Record<string, unknown> = {}
  ): Promise<Record<string, unknown>> {
    return this.execute({
      operation: 'post_companies_similar',
      body: withFilters(filters, { domains, page, pageSize }),
      query: options,
    }) as Promise<Record<string, unknown>>
  }

  public async execute(input: RequestInput): Promise<ApiResult> {
    const operation = operations.find((entry) => entry.operation === input.operation)
    if (!operation) fail('Choose a supported CompanyEnrich operation.')
    if (input.allow_beta !== undefined && typeof input.allow_beta !== 'boolean') fail('allow_beta must be a boolean.')
    if (operation.beta && input.allow_beta !== true)
      fail('This email operation is Beta. Set allow_beta to true to opt in.')
    const suppliedBody = input.body ?? {}
    const suppliedQuery = input.query ?? {}
    const pathParameters = input.path_parameters ?? {}
    for (const value of [suppliedBody, suppliedQuery, pathParameters])
      if (!isObject(value)) fail('Body, query, and path_parameters must be objects.')
    // Do not accept null as a substitute for an object, even when the input bypasses the host schema.
    if (input.body === null || input.query === null || input.path_parameters === null)
      fail('Body, query, and path_parameters must be objects.')
    for (const value of [suppliedBody, suppliedQuery, pathParameters]) validateJson(value)
    const body = { ...suppliedBody }
    const query = { ...suppliedQuery }
    for (const [name, fallback] of [
      ['page', 1],
      ['pageSize', 10],
    ] as const) {
      if (operation.body.properties?.[name] && body[name] === undefined) body[name] = fallback
      if (
        operation.parameters.some((parameter) => parameter.in === 'query' && parameter.name === name) &&
        query[name] === undefined
      )
        query[name] = fallback
    }
    let path = operation.path
    const parameters = new URLSearchParams()
    for (const [location, values] of [
      ['query', query],
      ['path', pathParameters],
    ] as const) {
      const allowed = operation.parameters.filter((entry) => entry.in === location)
      if (Object.keys(values).some((key) => !allowed.some((entry) => entry.name === key)))
        fail('Unknown query or path parameter.')
      for (const parameter of allowed) {
        const value = values[parameter.name]
        if (value === undefined) {
          if (parameter.required) fail(`Missing ${parameter.name} parameter.`)
          continue
        }
        validate(value, parameter.schema, parameter.name)
        if (typeof value === 'string' && !value.trim()) fail(`${parameter.name} must not be empty.`)
        if (location === 'path') {
          if (value === '.' || value === '..') fail('Invalid path parameter.')
          path = path.replace(`{${parameter.name}}`, encodeURIComponent(String(value)))
        } else if (Array.isArray(value)) value.forEach((item) => parameters.append(parameter.name, String(item)))
        else if (value !== null) parameters.set(parameter.name, String(value))
      }
    }
    if (operation.method === 'GET' && Object.keys(body).length) fail('GET operations do not accept a body.')
    validate(body, operation.body, 'body')
    pagination(query)
    pagination(body)
    if (
      operation.operation === 'get_companies_workforce' &&
      Number(query.id !== undefined) + Number(query.domain !== undefined) !== 1
    )
      fail('Provide exactly one company id or domain.')
    if (operation.operation === 'post_companies_enrich') {
      const properties = Object.keys(operation.body.properties ?? {})
      if (!properties.some((key) => typeof body[key] === 'string' && (body[key] as string).trim()))
        fail('Provide at least one company name or social property.')
    }
    if (operation.path.startsWith('/companies/similar'))
      this._validateSeeds(body, operation.operation === 'post_companies_similar')
    if (operation.operation === 'post_companies_search_async' && isObject(body.similar))
      this._validateSeeds(body.similar, false)
    if (
      operation.operation === 'post_people_lookup' &&
      (typeof body.email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email))
    )
      fail('Provide a nonempty email address.')
    const suffix = parameters.toString()
    return this._request(
      `${path}${suffix ? `?${suffix}` : ''}`,
      operation.method,
      operation.method === 'POST' ? serializeBody(body, operation.body) : undefined
    )
  }

  private _validateSeeds(body: Record<string, unknown>, allowLegacyDomain: boolean): void {
    if (body.domains === undefined && !(allowLegacyDomain && typeof body.domain === 'string' && body.domain.trim()))
      fail('Provide one to ten seed domains.')
  }

  private async _request(endpoint: string, method: 'GET' | 'POST', body?: string): Promise<ApiResult> {
    let response: Response
    try {
      response = await fetch(`https://api.companyenrich.com${endpoint}`, {
        method,
        headers: { Authorization: `Bearer ${this._apiKey}`, 'Content-Type': 'application/json' },
        ...(body ? { body } : {}),
        signal: AbortSignal.timeout(30000),
        redirect: 'error',
      })
    } catch {
      throw new RuntimeError('CompanyEnrich could not be reached. Check the connection and try again.')
    }
    if (!response.ok)
      throw new RuntimeError(
        `CompanyEnrich returned HTTP ${response.status}. Check the API key, available credits, and request parameters.`
      )
    try {
      return (await response.json()) as ApiResult
    } catch {
      throw new RuntimeError('CompanyEnrich returned an invalid JSON response.')
    }
  }
}
