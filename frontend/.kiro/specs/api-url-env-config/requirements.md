# Requirements Document

## Introduction

This specification addresses the issue of hardcoded API URLs throughout the application that cause CORS errors in production. The application is deployed on Vercel at https://bill-swift-omega.vercel.app with a backend API at https://bill-swift.onrender.com. Currently, several files contain hardcoded "http://localhost:5001" URLs which work in development but fail in production due to CORS restrictions. The solution involves replacing all hardcoded URLs with environment variable access while maintaining localhost:5001 as a fallback for local development.

## Glossary

- **API_URL**: The base URL for the backend API, configured via VITE_API_URL environment variable
- **VITE_API_URL**: Environment variable containing the production backend URL (https://bill-swift.onrender.com)
- **Fallback_URL**: The default localhost:5001 URL used when no environment variable is configured
- **CORS**: Cross-Origin Resource Sharing, a security mechanism that restricts API calls between different domains
- **Environment_Variable**: Configuration value stored in .env file and accessed via import.meta.env in Vite applications

## Requirements

### Requirement 1: Centralized API URL Configuration

**User Story:** As a developer, I want all API URLs to be configured through environment variables, so that the application can work seamlessly in both development and production environments.

#### Acceptance Criteria

1. THE Application SHALL read the API base URL from import.meta.env.VITE_API_URL
2. WHEN import.meta.env.VITE_API_URL is not defined, THE Application SHALL use "http://localhost:5001" as the fallback URL
3. THE Application SHALL use the same API URL configuration pattern across all files that make API calls
4. WHEN the environment variable is changed, THE Application SHALL use the new URL without code modifications

### Requirement 2: Update billsService.js Configuration

**User Story:** As a developer, I want the bills service to use environment variables for API URLs, so that bill operations work correctly in production.

#### Acceptance Criteria

1. THE billsService SHALL define BACKEND_BASE_URL using import.meta.env.VITE_API_URL
2. WHEN import.meta.env.VITE_API_URL is undefined, THE billsService SHALL fallback to "http://localhost:5001"
3. THE billsService SHALL use BACKEND_BASE_URL for all API endpoint calls
4. THE billsService SHALL remove any redundant environment variable checks (VITE_BACKEND_BASE_URL, VITE_API_BASE_URL)

### Requirement 3: Update SearchItemBill.jsx Configuration

**User Story:** As a developer, I want the search component to use environment variables for API URLs, so that item search and creation work correctly in production.

#### Acceptance Criteria

1. THE SearchItemBill component SHALL define API_URL using import.meta.env.VITE_API_URL
2. WHEN import.meta.env.VITE_API_URL is undefined, THE SearchItemBill component SHALL fallback to "http://localhost:5001"
3. THE SearchItemBill component SHALL use API_URL for all API endpoint calls
4. THE SearchItemBill component SHALL remove the separate BACKEND_BASE_URL variable and use API_URL consistently

### Requirement 4: Update BillTable.jsx Configuration

**User Story:** As a developer, I want the bill table component to use environment variables for API URLs, so that item updates and deletions work correctly in production.

#### Acceptance Criteria

1. THE BillTable component SHALL define API_URL using import.meta.env.VITE_API_URL
2. WHEN import.meta.env.VITE_API_URL is undefined, THE BillTable component SHALL fallback to "http://localhost:5001"
3. THE BillTable component SHALL use API_URL for all API endpoint calls (updateItem, deleteItem)
4. THE BillTable component SHALL maintain the existing API_URL constant pattern

### Requirement 5: Update BillPage.jsx Hardcoded URLs

**User Story:** As a developer, I want the bill page to use environment variables for all API calls, so that bill creation, saving, and item management work correctly in production.

#### Acceptance Criteria

1. THE BillPage component SHALL define API_URL using import.meta.env.VITE_API_URL with fallback to "http://localhost:5001"
2. WHEN creating items (line 321), THE BillPage SHALL use API_URL instead of hardcoded "http://localhost:5001"
3. WHEN saving bills (line 713), THE BillPage SHALL use API_URL instead of hardcoded "http://localhost:5001"
4. WHEN deleting items (line 777), THE BillPage SHALL use API_URL instead of hardcoded "http://localhost:5001"
5. THE BillPage SHALL use the API_URL constant for all axios calls

### Requirement 6: Maintain Development Workflow

**User Story:** As a developer, I want the application to work seamlessly in local development, so that I can develop and test features without additional configuration.

#### Acceptance Criteria

1. WHEN running the application locally without .env configuration, THE Application SHALL use "http://localhost:5001" as the API URL
2. WHEN running the application locally with VITE_API_URL configured, THE Application SHALL use the configured URL
3. THE Application SHALL not require code changes to switch between development and production environments
4. THE Application SHALL maintain backward compatibility with existing local development setups

### Requirement 7: Production Deployment Compatibility

**User Story:** As a developer, I want the application to work correctly when deployed to Vercel, so that users can access the production application without CORS errors.

#### Acceptance Criteria

1. WHEN deployed to Vercel with VITE_API_URL set to "https://bill-swift.onrender.com", THE Application SHALL use the production API URL
2. WHEN making API calls in production, THE Application SHALL not attempt to connect to localhost:5001
3. THE Application SHALL resolve all CORS errors caused by hardcoded localhost URLs
4. THE Application SHALL successfully complete all API operations (create, read, update, delete) in production

### Requirement 8: Consistent URL Pattern

**User Story:** As a developer, I want a consistent pattern for accessing API URLs across the codebase, so that the code is maintainable and easy to understand.

#### Acceptance Criteria

1. THE Application SHALL use the pattern `const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5001"` in all files that make API calls
2. THE Application SHALL not use multiple different environment variable names (VITE_BACKEND_BASE_URL, VITE_API_BASE_URL) for the same purpose
3. THE Application SHALL use the API_URL constant (not inline environment variable access) in all axios and fetch calls
4. THE Application SHALL have a single source of truth for API URL configuration in each file
