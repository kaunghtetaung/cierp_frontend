# Bibliography Dashboard API - Complete Frontend Implementation Guide

## Table of Contents
1. [Overview](#overview)
2. [Authentication & Headers](#authentication--headers)
3. [API Endpoints](#api-endpoints)
4. [Query Parameters & Filters](#query-parameters--filters)
5. [Response Formats](#response-formats)
6. [Implementation Examples](#implementation-examples)
7. [Best Practices](#best-practices)

---

## Overview

The Bibliography Dashboard API provides comprehensive statistics and analytics for library management. It includes:
- **Dashboard Summary**: Overview statistics with aggregated data
- **Custom Statistics**: Filtered analytics based on specific criteria
- **Real-time Aggregations**: MongoDB-powered fast calculations
- **Multi-tenant Support**: Organization-based data isolation

**Base URL**: `http://localhost:3336` (or your deployed URL)

---

## Authentication & Headers

### Required Headers

All API requests **MUST** include these headers:

| Header | Type | Required | Description | Example |
|--------|------|----------|-------------|---------|
| `x-tenant-id` | string | ✅ Yes | Organization ID for multi-tenant isolation | `68d12d98e776d47ad2004f19` |
| `x-user-id` | string | ✅ Yes | User ID making the request | `12345` |
| `x-access-context` | JSON array | ✅ Yes | Access roles and permissions | `[{"Organization":"*","Department":"*","Role":"systemAdmin"}]` |
| `x-request-id` | string | ❌ Optional | Request tracking ID | `req-1730725196519` |
| `x-lang` | string | ❌ Optional | Language preference (en/mm) | `en` |
| `Accept` | string | ✅ Yes | Response format | `application/json` |
| `Content-Type` | string | ✅ Yes | Request content type | `application/json` |

### Example Header Configuration

```javascript
const headers = {
  'x-tenant-id': '68d12d98e776d47ad2004f19',
  'x-user-id': '12345',
  'x-access-context': JSON.stringify([{
    Organization: '*',
    Department: '*',
    Role: 'systemAdmin'
  }]),
  'x-request-id': `req-${Date.now()}`,
  'x-lang': 'en',
  'Accept': 'application/json',
  'Content-Type': 'application/json'
};
```

---

## API Endpoints

### 1. Dashboard Summary

**Endpoint**: `GET /bibliographies/dashboard/summary`

**Purpose**: Get comprehensive overview of library statistics including totals by catalog type, publisher, subject, accession group, year, media type, language, and recent additions.

**Query Parameters**:

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `limit` | number | ❌ No | 10 | Number of top results per category (3-20 recommended) |

**Example Requests**:

```bash
# Default (top 10)
GET /bibliographies/dashboard/summary

# Top 5
GET /bibliographies/dashboard/summary?limit=5

# Top 20
GET /bibliographies/dashboard/summary?limit=20
```

**Response Structure**:

```typescript
interface DashboardSummary {
  totalBooks: number;                    // Total unique book titles
  totalCopies: number;                   // Total physical copies
  totalByStatus: Array<{
    status: string;                      // "Active" | "Inactive"
    count: number;
  }>;
  totalByCatalogType: Array<{
    catalogTypeId: string;               // ObjectId
    catalogType: string;                 // "Book", "Thesis", "Journal", etc.
    count: number;                       // Number of unique titles
    copyCount: number;                   // Number of physical copies
  }>;
  totalByPublisher: Array<{
    publisherId: string;                 // ObjectId
    publisher: string;                   // Publisher name
    count: number;                       // Number of unique titles
    copyCount: number;                   // Number of physical copies
  }>;
  totalBySubject: Array<{
    subjectId: string;                   // ObjectId
    subject: string;                     // Subject name
    count: number;                       // Number of unique titles
    copyCount: number;                   // Number of physical copies
  }>;
  totalByAccessionGroup: Array<{
    accessionGroupId: string;            // ObjectId
    accessionGroup: string;              // Group name (e.g., "Main Collection")
    description?: string;                // Group description
    count: number;                       // Number of unique titles
    copyCount: number;                   // Number of physical copies
  }>;
  totalByYear: Array<{
    year: string;                        // Publication year
    count: number;
  }>;
  totalByMediaType: Array<{
    mediaType: string;                   // "Print", "Digital", etc.
    count: number;
  }>;
  totalByLanguage: Array<{
    languageId: string;                  // ObjectId
    language: string;                    // Language name
    count: number;
  }>;
  recentAdditions: Array<{
    _id: string;                         // Bibliography ID
    title: string;
    catalogType?: {
      id: string;
      name: string;
    };
    author?: {
      id: string;
      name: string;
    };
    createdAt?: Date;
  }>;
}
```

**Sample Response**:

```json
{
  "totalBooks": 1247,
  "totalCopies": 3521,
  "totalByStatus": [
    { "status": "Active", "count": 1200 },
    { "status": "Inactive", "count": 47 }
  ],
  "totalByCatalogType": [
    {
      "catalogTypeId": "68afbe715c7f792dd612c727",
      "catalogType": "Book",
      "count": 850,
      "copyCount": 2100
    },
    {
      "catalogTypeId": "68afbe715c7f792dd612c728",
      "catalogType": "Thesis",
      "count": 250,
      "copyCount": 890
    }
  ],
  "totalByPublisher": [
    {
      "publisherId": "68afbe715c7f792dd612c733",
      "publisher": "Academic Press",
      "count": 320,
      "copyCount": 780
    }
  ],
  "totalBySubject": [
    {
      "subjectId": "68afbe735c7f792dd6132cae",
      "subject": "Computer Science",
      "count": 450,
      "copyCount": 1200
    }
  ],
  "totalByAccessionGroup": [
    {
      "accessionGroupId": "68d14ff5125447a7a4f78364",
      "accessionGroup": "Main Collection",
      "description": "Primary library collection",
      "count": 800,
      "copyCount": 2500
    }
  ],
  "totalByYear": [
    { "year": "2024", "count": 150 },
    { "year": "2023", "count": 280 }
  ],
  "totalByMediaType": [
    { "mediaType": "Print", "count": 980 }
  ],
  "totalByLanguage": [
    {
      "languageId": "68afbe715c7f792dd612c740",
      "language": "English",
      "count": 1100
    }
  ],
  "recentAdditions": [
    {
      "_id": "68b1c2d245e71537c36fbafb",
      "title": "Advanced JavaScript Programming",
      "catalogType": {
        "id": "68afbe715c7f792dd612c727",
        "name": "Book"
      },
      "author": {
        "id": "68afbe735c7f792dd6132c56",
        "name": "John Doe"
      },
      "createdAt": "2024-01-15T10:30:00.000Z"
    }
  ]
}
```

---

### 2. Custom Statistics

**Endpoint**: `GET /bibliographies/dashboard/statistics`

**Purpose**: Get filtered statistics based on specific criteria (catalog type, publisher, subject, year, status).

**Query Parameters**:

| Parameter | Type | Required | Description | Example |
|-----------|------|----------|-------------|---------|
| `catalogTypeId` | string | ❌ No | Filter by catalog type | `68afbe715c7f792dd612c727` |
| `publisherId` | string | ❌ No | Filter by publisher | `68afbe715c7f792dd612c733` |
| `subjectId` | string | ❌ No | Filter by subject | `68afbe735c7f792dd6132cae` |
| `year` | string | ❌ No | Filter by publication year | `2023` |
| `status` | string | ❌ No | Filter by status | `Active` or `Inactive` |

**Example Requests**:

```bash
# All active books
GET /bibliographies/dashboard/statistics?status=Active

# Books from specific publisher
GET /bibliographies/dashboard/statistics?publisherId=68afbe715c7f792dd612c733

# Books in 2023
GET /bibliographies/dashboard/statistics?year=2023

# Combine filters: Active books from 2023
GET /bibliographies/dashboard/statistics?status=Active&year=2023

# All filters combined
GET /bibliographies/dashboard/statistics?catalogTypeId=68afbe715c7f792dd612c727&publisherId=68afbe715c7f792dd612c733&subjectId=68afbe735c7f792dd6132cae&year=2023&status=Active
```

**Response Structure**:

```typescript
interface CustomStatistics {
  totalBooks: number;              // Total books matching filters
  averageBooksPerYear: number;     // Average distribution per year
  mostCommonPublisher?: string;    // Most frequent publisher
  mostCommonSubject?: string;      // Most frequent subject
}
```

**Sample Response**:

```json
{
  "totalBooks": 320,
  "averageBooksPerYear": 45.71,
  "mostCommonPublisher": "Academic Press",
  "mostCommonSubject": "Computer Science"
}
```

---

### 3. Bibliography List (with Filters)

**Endpoint**: `GET /bibliographies`

**Purpose**: Get paginated list of bibliographies with advanced filtering and sorting.

**Query Parameters**:

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `page` | number | ❌ No | 1 | Page number (1-based) |
| `limit` | number | ❌ No | 50 | Items per page (max 500) |
| `sortBy` | string | ❌ No | `createdAt` | Field to sort by |
| `sortOrder` | string | ❌ No | `desc` | Sort direction: `asc` or `desc` |
| `search` | string | ❌ No | - | Search query (searches title, author, description, ISBN) |
| `searchType` | string | ❌ No | `contains` | Search type: `exact` or `contains` |
| `filter[field][operator]` | mixed | ❌ No | - | Advanced filters (see below) |

**Available Filter Fields**:

Based on the `queryAllowedFields` from MongoDB:

| Field Name | Type | Operators | Description |
|------------|------|-----------|-------------|
| `title` | String | `$eq`, `$regex` | Book title |
| `isbn` | String | `$eq` | ISBN number |
| `accessionNo` | String | `$eq` | Accession number |
| `status` | String | `$eq` | Active/Inactive |
| `catalogType.id` | String | `$eq` | Catalog type ID |
| `catalogType.name` | String | `$eq`, `$regex`, `$in` | Catalog type name |
| `author.name` | String | `$eq`, `$regex`, `$in` | Author name |
| `publisher.id` | String | `$eq` | Publisher ID |
| `publisher.name` | String | `$eq`, `$regex`, `$in` | Publisher name |
| `subjects.id` | String | `$eq` | Subject ID |
| `subjects.name` | String | `$eq`, `$regex`, `$in` | Subject name |
| `year` | Number | `$eq`, `$gte`, `$lte`, `$gt`, `$lt` | Publication year |
| `publicationYear` | Number | `$eq`, `$gte`, `$lte`, `$gt`, `$lt` | Publication year |
| `createdAt` | Date | `$eq`, `$gte`, `$lte`, `$gt`, `$lt` | Record creation date |
| `updatedAt` | Date | `$eq`, `$gte`, `$lte`, `$gt`, `$lt` | Record update date |

**Filter Syntax**:

```
filter[fieldName][operator]=value
```

**Example Requests**:

```bash
# Search for "medical" books
GET /bibliographies?search=medical&searchType=contains

# Filter by catalog type name
GET /bibliographies?filter[catalogType.name][eq]=Thesis

# Filter by year range (2020-2024)
GET /bibliographies?filter[year][gte]=2020&filter[year][lte]=2024

# Filter by publisher name (partial match)
GET /bibliographies?filter[publisher.name][regex]=Academic

# Filter by multiple subjects (using $in)
GET /bibliographies?filter[subjects.name][in]=Computer Science,Mathematics

# Complex query: Active theses from 2023, sorted by title
GET /bibliographies?page=1&limit=20&sortBy=title&sortOrder=asc&search=health&searchType=contains&filter[catalogType.name][eq]=Thesis&filter[status][eq]=Active&filter[year][eq]=2023

# Filter by author name
GET /bibliographies?filter[author.name][regex]=John

# Filter by exact catalog type ID
GET /bibliographies?filter[catalogType.id][eq]=68afbe715c7f792dd612c727

# Filter by accession number
GET /bibliographies?filter[accessionNo][eq]=P463
```

**Response Format**:

```typescript
interface PaginatedBibliographyResponse {
  data: Bibliography[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
```

---

## Query Parameters & Filters

### Special Query Parameters

These parameters are **excluded from validation** and have special handling:

| Parameter | Purpose | Example |
|-----------|---------|---------|
| `page` | Pagination - page number | `page=1` |
| `limit` | Pagination - items per page | `limit=20` |
| `sort` | Legacy sort field | `sort=title` |
| `sortBy` | Sort field | `sortBy=author` |
| `order` | Legacy sort order | `order=asc` |
| `sortOrder` | Sort direction | `sortOrder=desc` |
| `search` | Free-text search | `search=medical` |
| `searchType` | Search match type | `searchType=exact` |
| `status` | Filter by status | `status=Active` |
| `dateFrom` | Date range start | `dateFrom=2023-01-01` |
| `dateTo` | Date range end | `dateTo=2023-12-31` |
| `tags` | Filter by tags | `tags[]=tag1&tags[]=tag2` |
| `minValue` | Numeric range min | `minValue=100` |
| `maxValue` | Numeric range max | `maxValue=500` |
| `isActive` | Boolean filter | `isActive=true` |

### Advanced Filter Syntax

**Format**: `filter[field][operator]=value`

**Operators**:

| Operator | Description | Example |
|----------|-------------|---------|
| `eq` | Equals | `filter[year][eq]=2023` |
| `regex` | Regular expression match | `filter[title][regex]=Programming` |
| `in` | Value in array | `filter[catalogType.name][in]=Book,Thesis` |
| `gte` | Greater than or equal | `filter[year][gte]=2020` |
| `lte` | Less than or equal | `filter[year][lte]=2024` |
| `gt` | Greater than | `filter[year][gt]=2020` |
| `lt` | Less than | `filter[year][lt]=2024` |

### URL Encoding

When using filters in URLs, special characters must be encoded:

| Character | Encoded | Example |
|-----------|---------|---------|
| `[` | `%5B` | `filter%5Byear%5D` |
| `]` | `%5D` | `filter%5Byear%5D` |
| Space | `%20` or `+` | `Computer%20Science` |

**JavaScript Example**:

```javascript
const params = new URLSearchParams({
  page: 1,
  limit: 20,
  sortBy: 'title',
  sortOrder: 'asc',
  search: 'medical',
  'filter[catalogType.name][eq]': 'Thesis',
  'filter[year][gte]': 2020
});

const url = `/bibliographies?${params.toString()}`;
```

---

## Response Formats

### Success Response

```json
{
  "data": [...],
  "meta": {
    "total": 1247,
    "page": 1,
    "limit": 20,
    "totalPages": 63
  }
}
```

### Error Response

```json
{
  "statusCode": 400,
  "errorCode": "INVALID_QUERY_FIELD",
  "message": "Field 'invalidField' is not allowed in query.",
  "traceId": "gw_1762257196519_9ztec0t2p",
  "timestamp": "2025-11-04T11:53:16.524Z",
  "path": "/bibliographies?..."
}
```

**Common Error Codes**:

| Error Code | Status | Description |
|------------|--------|-------------|
| `INVALID_QUERY_FIELD` | 400 | Field not in queryAllowedFields |
| `INVALID_QUERY_OPERATOR` | 400 | Operator not allowed for field |
| `INVALID_QUERY_CONDITION` | 400 | Invalid condition format |
| `TENANT_ID_REQUIRED` | 400 | Missing x-tenant-id header |
| `ORGANIZATION_ID_REQUIRED` | 400 | Invalid organization ID |
| `ACCESS_DENIED` | 403 | Insufficient permissions |
| `DASHBOARD_SUMMARY_FAILED` | 500 | Internal server error |

---

## Implementation Examples

### React/TypeScript Implementation

#### 1. Setup API Client

```typescript
// api/client.ts
import axios, { AxiosInstance } from 'axios';

const API_BASE_URL = 'http://localhost:3336';

export class BibliographyAPI {
  private client: AxiosInstance;

  constructor(organizationId: string, userId: string, role: string = 'systemAdmin') {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'x-tenant-id': organizationId,
        'x-user-id': userId,
        'x-access-context': JSON.stringify([{
          Organization: '*',
          Department: '*',
          Role: role
        }]),
        'x-lang': 'en'
      }
    });
  }

  // Dashboard Summary
  async getDashboardSummary(limit: number = 10) {
    const response = await this.client.get('/bibliographies/dashboard/summary', {
      params: { limit }
    });
    return response.data;
  }

  // Custom Statistics
  async getCustomStatistics(filters: {
    catalogTypeId?: string;
    publisherId?: string;
    subjectId?: string;
    year?: string;
    status?: string;
  }) {
    const response = await this.client.get('/bibliographies/dashboard/statistics', {
      params: filters
    });
    return response.data;
  }

  // Bibliography List with Filters
  async getBibliographies(options: {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    search?: string;
    searchType?: 'exact' | 'contains';
    filters?: Record<string, any>;
  }) {
    const params = new URLSearchParams();

    if (options.page) params.append('page', options.page.toString());
    if (options.limit) params.append('limit', options.limit.toString());
    if (options.sortBy) params.append('sortBy', options.sortBy);
    if (options.sortOrder) params.append('sortOrder', options.sortOrder);
    if (options.search) params.append('search', options.search);
    if (options.searchType) params.append('searchType', options.searchType);

    // Add filters
    if (options.filters) {
      Object.entries(options.filters).forEach(([field, value]) => {
        if (typeof value === 'object') {
          Object.entries(value).forEach(([op, val]) => {
            params.append(`filter[${field}][${op}]`, String(val));
          });
        }
      });
    }

    const response = await this.client.get('/bibliographies', { params });
    return response.data;
  }
}
```

#### 2. React Hook for Dashboard

```typescript
// hooks/useDashboard.ts
import { useState, useEffect } from 'react';
import { BibliographyAPI } from '../api/client';

export interface DashboardData {
  totalBooks: number;
  totalCopies: number;
  totalByCatalogType: Array<{
    catalogTypeId: string;
    catalogType: string;
    count: number;
    copyCount: number;
  }>;
  // ... other fields
}

export const useDashboard = (organizationId: string, userId: string, limit: number = 10) => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setLoading(true);
        const api = new BibliographyAPI(organizationId, userId);
        const result = await api.getDashboardSummary(limit);
        setData(result);
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, [organizationId, userId, limit]);

  return { data, loading, error };
};
```

#### 3. Dashboard Component

```typescript
// components/Dashboard.tsx
import React from 'react';
import { useDashboard } from '../hooks/useDashboard';
import {
  BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

export const Dashboard: React.FC<{ organizationId: string; userId: string }> = ({
  organizationId,
  userId
}) => {
  const { data, loading, error } = useDashboard(organizationId, userId, 10);

  if (loading) return <div>Loading dashboard...</div>;
  if (error) return <div>Error: {error.message}</div>;
  if (!data) return null;

  return (
    <div className="dashboard">
      {/* Summary Cards */}
      <div className="summary-cards">
        <div className="card">
          <h3>Total Books</h3>
          <p className="count">{data.totalBooks.toLocaleString()}</p>
        </div>
        <div className="card">
          <h3>Total Copies</h3>
          <p className="count">{data.totalCopies.toLocaleString()}</p>
        </div>
        <div className="card">
          <h3>Average Copies per Book</h3>
          <p className="count">
            {(data.totalCopies / data.totalBooks).toFixed(2)}
          </p>
        </div>
      </div>

      {/* Catalog Type Distribution */}
      <div className="chart-section">
        <h2>Books by Catalog Type</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data.totalByCatalogType}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="catalogType" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="count" name="Unique Titles" fill="#8884d8" />
            <Bar dataKey="copyCount" name="Physical Copies" fill="#82ca9d" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Publisher Distribution */}
      <div className="chart-section">
        <h2>Top Publishers</h2>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={data.totalByPublisher}
              dataKey="count"
              nameKey="publisher"
              cx="50%"
              cy="50%"
              outerRadius={100}
              label
            >
              {data.totalByPublisher.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Recent Additions */}
      <div className="recent-additions">
        <h2>Recent Additions</h2>
        <ul>
          {data.recentAdditions.map(book => (
            <li key={book._id}>
              <strong>{book.title}</strong>
              {book.author && <span> by {book.author.name}</span>}
              {book.catalogType && <span> ({book.catalogType.name})</span>}
              {book.createdAt && (
                <span className="date">
                  {new Date(book.createdAt).toLocaleDateString()}
                </span>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];
```

#### 4. Filtered Bibliography List Component

```typescript
// components/BibliographyList.tsx
import React, { useState, useEffect } from 'react';
import { BibliographyAPI } from '../api/client';

export const BibliographyList: React.FC<{
  organizationId: string;
  userId: string;
}> = ({ organizationId, userId }) => {
  const [bibliographies, setBibliographies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    page: 1,
    limit: 20,
    sortBy: 'title',
    sortOrder: 'asc' as 'asc' | 'desc',
    search: '',
    searchType: 'contains' as 'exact' | 'contains',
    filters: {}
  });

  useEffect(() => {
    const fetchBibliographies = async () => {
      try {
        setLoading(true);
        const api = new BibliographyAPI(organizationId, userId);
        const result = await api.getBibliographies(filters);
        setBibliographies(result.data);
      } catch (err) {
        console.error('Error fetching bibliographies:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchBibliographies();
  }, [organizationId, userId, filters]);

  const handleFilterChange = (field: string, operator: string, value: any) => {
    setFilters(prev => ({
      ...prev,
      filters: {
        ...prev.filters,
        [field]: { [operator]: value }
      }
    }));
  };

  return (
    <div className="bibliography-list">
      {/* Filter Panel */}
      <div className="filters">
        <input
          type="text"
          placeholder="Search..."
          value={filters.search}
          onChange={e => setFilters({ ...filters, search: e.target.value })}
        />

        <select
          onChange={e => handleFilterChange('catalogType.name', 'eq', e.target.value)}
        >
          <option value="">All Catalog Types</option>
          <option value="Book">Book</option>
          <option value="Thesis">Thesis</option>
          <option value="Journal">Journal</option>
        </select>

        <select
          onChange={e => handleFilterChange('status', 'eq', e.target.value)}
        >
          <option value="">All Statuses</option>
          <option value="Active">Active</option>
          <option value="Inactive">Inactive</option>
        </select>

        <input
          type="number"
          placeholder="From Year"
          onChange={e => handleFilterChange('year', 'gte', e.target.value)}
        />

        <input
          type="number"
          placeholder="To Year"
          onChange={e => handleFilterChange('year', 'lte', e.target.value)}
        />
      </div>

      {/* Results */}
      <div className="results">
        {loading ? (
          <div>Loading...</div>
        ) : (
          <ul>
            {bibliographies.map((book: any) => (
              <li key={book._id}>
                <h3>{book.title}</h3>
                <p>{book.author?.name}</p>
                <p>{book.catalogType?.name} - {book.year}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};
```

---

## Best Practices

### 1. Performance Optimization

```typescript
// Use React Query for caching and automatic refetching
import { useQuery } from '@tanstack/react-query';

export const useDashboard = (organizationId: string, userId: string) => {
  return useQuery({
    queryKey: ['dashboard', organizationId],
    queryFn: async () => {
      const api = new BibliographyAPI(organizationId, userId);
      return api.getDashboardSummary(10);
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
  });
};
```

### 2. Error Handling

```typescript
try {
  const result = await api.getBibliographies(filters);
} catch (error) {
  if (axios.isAxiosError(error)) {
    const errorData = error.response?.data;

    switch (errorData?.errorCode) {
      case 'INVALID_QUERY_FIELD':
        alert('Invalid filter field. Please check your filters.');
        break;
      case 'TENANT_ID_REQUIRED':
        // Redirect to login
        break;
      case 'ACCESS_DENIED':
        alert('You do not have permission to view this data.');
        break;
      default:
        alert('An error occurred. Please try again.');
    }
  }
}
```

### 3. Pagination

```typescript
const [page, setPage] = useState(1);
const [totalPages, setTotalPages] = useState(1);

const loadPage = async (newPage: number) => {
  const result = await api.getBibliographies({
    page: newPage,
    limit: 20
  });

  setPage(newPage);
  setTotalPages(result.meta.totalPages);
};

// Render pagination
<div className="pagination">
  <button
    disabled={page === 1}
    onClick={() => loadPage(page - 1)}
  >
    Previous
  </button>

  <span>Page {page} of {totalPages}</span>

  <button
    disabled={page === totalPages}
    onClick={() => loadPage(page + 1)}
  >
    Next
  </button>
</div>
```

### 4. Real-time Updates

```typescript
// Use polling for near real-time updates
useEffect(() => {
  const interval = setInterval(() => {
    refetch(); // React Query refetch
  }, 30000); // 30 seconds

  return () => clearInterval(interval);
}, [refetch]);
```

### 5. Accessibility

```typescript
// Add ARIA labels for screen readers
<div
  className="stat-card"
  role="region"
  aria-label={`Total books: ${totalBooks}`}
>
  <h3 id="total-books-heading">Total Books</h3>
  <p aria-labelledby="total-books-heading">
    {totalBooks.toLocaleString()}
  </p>
</div>
```

---

## Testing

### Example Test Cases

```typescript
// __tests__/dashboard.test.ts
import { BibliographyAPI } from '../api/client';

describe('Dashboard API', () => {
  const api = new BibliographyAPI('test-org-id', 'test-user-id');

  it('should fetch dashboard summary', async () => {
    const result = await api.getDashboardSummary(10);

    expect(result).toHaveProperty('totalBooks');
    expect(result).toHaveProperty('totalCopies');
    expect(result.totalByCatalogType).toBeInstanceOf(Array);
  });

  it('should filter by catalog type', async () => {
    const result = await api.getBibliographies({
      filters: {
        'catalogType.name': { eq: 'Thesis' }
      }
    });

    expect(result.data.every(book =>
      book.catalogType.name === 'Thesis'
    )).toBe(true);
  });
});
```

---

## Support & Troubleshooting

### Common Issues

**Issue**: `INVALID_QUERY_FIELD` error
- **Solution**: Check that the field name matches exactly (case-sensitive) with queryAllowedFields
- **Solution**: Verify the field is in the allowed list (see Query Parameters section)

**Issue**: Empty results despite having data
- **Solution**: Check x-tenant-id matches your organization
- **Solution**: Verify access permissions in x-access-context

**Issue**: Filters not working
- **Solution**: Ensure proper URL encoding of bracket notation
- **Solution**: Use correct operator for field type (e.g., $eq for strings, $gte for numbers)

**Issue**: Slow response times
- **Solution**: Reduce limit parameter
- **Solution**: Add indexes to MongoDB for filtered fields
- **Solution**: Implement client-side caching

---

## Appendix

### Complete Query Field Reference

```typescript
interface QueryAllowedFields {
  // Text Fields
  title: { operators: ['$eq', '$regex'] };
  isbn: { operators: ['$eq'] };
  accessionNo: { operators: ['$eq'] };
  status: { operators: ['$eq'] };
  search: { operators: ['$eq', '$regex'] };
  searchType: { operators: ['$eq'] };

  // Nested Object Fields
  'catalogType.id': { operators: ['$eq'] };
  'catalogType.name': { operators: ['$eq', '$regex', '$in'] };
  'author.name': { operators: ['$eq', '$regex', '$in'] };
  'publisher.id': { operators: ['$eq'] };
  'publisher.name': { operators: ['$eq', '$regex', '$in'] };
  'subjects.id': { operators: ['$eq'] };
  'subjects.name': { operators: ['$eq', '$regex', '$in'] };

  // Numeric Fields
  year: { operators: ['$eq', '$gte', '$lte', '$gt', '$lt'] };
  publicationYear: { operators: ['$eq', '$gte', '$lte', '$gt', '$lt'] };
  version: { operators: ['$eq', '$gte', '$lte', '$gt', '$lt'] };

  // Date Fields
  createdAt: { operators: ['$eq', '$gte', '$lte', '$gt', '$lt'] };
  updatedAt: { operators: ['$eq', '$gte', '$lte', '$gt', '$lt'] };

  // Array Fields
  subjectIds: { operators: ['$eq', '$in'] };
  degreeIds: { operators: ['$eq', '$in'] };
}
```

---

**Document Version**: 1.0
**Last Updated**: November 4, 2025
**API Version**: Library Service v1.0
