# Bibliography Search, SearchType, Sort & Limit Query Style Guide

## 1. Basic Pagination & Sorting

```bash
# Basic list with defaults
GET /bibliographies

# With pagination
GET /bibliographies?page=1&limit=10

# With sorting
GET /bibliographies?sortBy=title&sortOrder=asc
GET /bibliographies?sortBy=year&sortOrder=desc

# Combined
GET /bibliographies?page=1&limit=10&sortBy=title&sortOrder=asc
```

## 2. General Search (Keyword Search)

The `search` parameter searches across multiple fields:
- `title`, `note`, `isbn`, `issn`, `callNo`, `year`
- `author.name`, `editors.name`, `additionalAuthors.name`
- `subjects.name`, `publisher.name`
- `degrees.name` ✨ (newly added)

### A. Contains Search (Default)
Searches for partial matches (substring).

```bash
# Simple keyword search
GET /bibliographies?search=medical

# Multi-word search
GET /bibliographies?search=machine learning

# With explicit searchType
GET /bibliographies?search=test&searchType=contains

# Search with pagination
GET /bibliographies?search=data&page=1&limit=5

# Search with sorting
GET /bibliographies?search=programming&sortBy=year&sortOrder=desc

# Full combination
GET /bibliographies?search=science&page=1&limit=10&sortBy=title&sortOrder=asc
```

### B. Exact Match Search
Searches for exact matches (case-insensitive).

```bash
# Exact title match
GET /bibliographies?search=Pediatrics : pretest , self-assessment and review&searchType=exact

# Case insensitive exact match
GET /bibliographies?search=pediatrics : pretest , self-assessment and review&searchType=exact
```

## 3. Field-Specific Queries

Use MongoDB operators for precise filtering.

### A. MongoDB Query Operators

| Operator | Description | Example |
|----------|-------------|---------|
| `$eq` | Equals (exact match) | `field[$eq]=value` |
| `$regex` | Regular expression | `field[$regex]=pattern` |
| `$options` | Regex options (i=case insensitive) | `field[$options]=i` |
| `$in` | Matches any value in array | `field[$in]=val1,val2,val3` |
| `$gte` | Greater than or equal | `year[$gte]=2015` |
| `$lte` | Less than or equal | `year[$lte]=2023` |

### B. Title Queries

```bash
# Exact title
GET /bibliographies?title[$eq]=Pediatrics : pretest , self-assessment and review

# Title contains (case insensitive)
GET /bibliographies?title[$regex]=pediatrics&title[$options]=i
```

### C. Author Queries

```bash
# Exact author name
GET /bibliographies?author.name[$eq]=John Smith

# Author contains
GET /bibliographies?author.name[$regex]=smith&author.name[$options]=i

# Multiple authors (OR)
GET /bibliographies?author.name[$in]=John Smith,Jane Doe,Robert Brown
```

### D. Publisher Queries

```bash
# Exact publisher
GET /bibliographies?publisher.name[$eq]=Oxford University Press

# Publisher contains
GET /bibliographies?publisher.name[$regex]=oxford&publisher.name[$options]=i

# Multiple publishers
GET /bibliographies?publisher.name[$in]=Oxford University Press,Cambridge Press,MIT Press
```

### E. Subject Queries

```bash
# Exact subject
GET /bibliographies?subjects.name[$eq]=Medicine

# Subject contains
GET /bibliographies?subjects.name[$regex]=medical&subjects.name[$options]=i

# Multiple subjects
GET /bibliographies?subjects.name[$in]=Medicine,Surgery,Anatomy
```

### F. Degree Queries ✨

```bash
# Exact degree name
GET /bibliographies?degrees.name[$eq]=Bachelor of Science

# Degree contains
GET /bibliographies?degrees.name[$regex]=medicine&degrees.name[$options]=i

# Multiple degrees
GET /bibliographies?degrees.name[$in]=MBBS,BDS,PhD
```

### G. Year Queries

```bash
# Exact year
GET /bibliographies?year[$eq]=2020

# Year >= 2015
GET /bibliographies?year[$gte]=2015

# Year <= 2023
GET /bibliographies?year[$lte]=2023

# Year range (2015-2023)
GET /bibliographies?year[$gte]=2015&year[$lte]=2023
```

### H. Status Queries

```bash
# Active only
GET /bibliographies?status[$eq]=Active
```

## 4. Combined Queries

Combine multiple filters using query parameters.

```bash
# Author + Year range
GET /bibliographies?author.name[$regex]=smith&author.name[$options]=i&year[$gte]=2015&year[$lte]=2023

# Subject + Catalog Type
GET /bibliographies?subjects.name[$eq]=Medicine&catalogType.name[$eq]=Book

# Publisher + Status + Year
GET /bibliographies?publisher.name[$regex]=oxford&publisher.name[$options]=i&status[$eq]=Active&year[$gte]=2010

# General search + Filters + Pagination + Sorting
GET /bibliographies?search=medical&searchType=contains&year[$gte]=2010&catalogType.name[$eq]=Book&status[$eq]=Active&page=1&limit=10&sortBy=year&sortOrder=desc

# Multiple subjects + Author + Pagination
GET /bibliographies?subjects.name[$in]=Medicine,Surgery&author.name[$regex]=smith&author.name[$options]=i&page=1&limit=20&sortBy=title&sortOrder=asc
```

## 5. Complete Query Examples

```bash
# 1. Search "medical" in any field, books only, from 2010, sorted by year descending
GET /bibliographies?search=medical&searchType=contains&year[$gte]=2010&catalogType.name[$eq]=Book&status[$eq]=Active&page=1&limit=10&sortBy=year&sortOrder=desc

# 2. Search for MBBS degree books
GET /bibliographies?degrees.name[$regex]=MBBS&degrees.name[$options]=i&catalogType.name[$eq]=Book&sortBy=year&sortOrder=desc

# 3. Medicine subject books by Oxford, published after 2015
GET /bibliographies?subjects.name[$eq]=Medicine&publisher.name[$regex]=oxford&publisher.name[$options]=i&year[$gte]=2015&catalogType.name[$eq]=Book

# 4. Search "pediatrics" exactly, sorted by title
GET /bibliographies?search=pediatrics&searchType=exact&sortBy=title&sortOrder=asc&page=1&limit=20
```

## 6. Summary of Query Parameters

| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `page` | number | Page number (default: 1) | `page=1` |
| `limit` | number | Items per page (default: 50, max: 500) | `limit=10` |
| `sortBy` | string | Field to sort by | `sortBy=title` |
| `sortOrder` | string | Sort direction: `asc` or `desc` | `sortOrder=desc` |
| `search` | string | General keyword search | `search=medical` |
| `searchType` | string | Search type: `contains` or `exact` | `searchType=exact` |
| `field[$operator]` | mixed | Field-specific query | `year[$gte]=2015` |

### Search Fields (when using `search` parameter):
- `title`, `note`, `isbn`, `issn`, `callNo`, `year`
- `author.name`, `editors.name`, `additionalAuthors.name`
- `subjects.name`, `publisher.name`, `degrees.name` ✨

---

This guide shows all the query patterns supported by the bibliography module's `findAll` method with the newly added degree field search capability!
