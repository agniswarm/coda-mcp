# Coda MCP Server

This project implements a Model Context Protocol (MCP) server that acts as a bridge to the [Coda API v1](https://coda.io/developers/apis/v1). It exposes tools for Folders, Docs (including Permissions and Publishing), Doc Structure (Pages, Automations), Tables and Views (Tables, Columns, Rows), Formulas & Controls, Account, Analytics, and Miscellaneous.

## Features

The server mirrors the [Coda API](https://coda.io/developers/apis/v1) structure. Tools are grouped below in the same order as the official API docs.

### Folders

Folders organize docs within workspaces.

- **`coda_list_folders`**: List folders the user has access to (optional: workspace, starred, pagination).
- **`coda_create_folder`**: Create a folder in a workspace (name, workspaceId, optional description).
- **`coda_get_folder`**: Get a folder by ID.
- **`coda_update_folder`**: Update folder name or description.
- **`coda_delete_folder`**: Delete a folder (must be empty).

### Docs

#### Coda Docs

- **`coda_list_documents`**: List or search documents available to the user.
- **`coda_create_doc`**: Create a new doc (optionally copy from another). Requires Doc Maker.
- **`coda_get_doc`**: Get metadata for a doc.
- **`coda_update_doc`**: Update doc title or icon. Requires Doc Maker.
- **`coda_delete_doc`**: Delete a doc.

#### Permissions

- **`coda_get_sharing_metadata`**: Get sharing capabilities (canShare, etc.).
- **`coda_list_permissions`**: List permissions for a doc.
- **`coda_add_permission`**: Add permission (share with user or group).
- **`coda_delete_permission`**: Remove a permission.
- **`coda_search_principals`**: Search users/groups to share with.
- **`coda_get_acl_settings`**: Get ACL settings (allowCopying, etc.).
- **`coda_update_acl_settings`**: Update ACL settings.

#### Publishing

- **`coda_list_categories`**: List doc categories (for publishing).
- **`coda_publish_doc`**: Publish a doc or update publish settings.
- **`coda_unpublish_doc`**: Unpublish a doc.

### Doc Structure — Pages

- **`coda_list_pages`**: List pages in a doc with pagination.
- **`coda_create_page`**: Create a page (optionally with markdown content and parent).
- **`coda_get_page`**: Get page metadata (not full content).
- **`coda_get_page_content`**: Get page content as markdown (via export).
- **`coda_peek_page`**: Peek first N lines of a page.
- **`coda_replace_page_content`**: Replace page content with markdown.
- **`coda_append_page_content`**: Append markdown to a page.
- **`coda_duplicate_page`**: Duplicate a page with a new name.
- **`coda_rename_page`**: Rename a page.
- **`coda_delete_page`**: Delete a page.
- **`coda_begin_page_content_export`**: Start exporting page as HTML or Markdown.
- **`coda_get_page_content_export_status`**: Check export status and get download link.

### Doc Structure — Automations

- **`coda_trigger_automation`**: Trigger a webhook-invoked automation (docId, ruleId, optional JSON payload). See [Trigger automation](https://coda.io/developers/apis/v1#tag/Automations/operation/triggerWebhookAutomation).

### Tables and Views

#### Tables

- **`coda_list_tables`**: List tables and views in a doc.
- **`coda_get_table`**: Get table/view details.

#### Columns

- **`coda_list_columns`**: List columns in a table.
- **`coda_get_column`**: Get column details.

#### Rows

- **`coda_list_rows`**: List rows (with query, sort, valueFormat, pagination).
- **`coda_upsert_rows`**: Insert or upsert rows (JSON body).
- **`coda_delete_rows`**: Delete multiple rows by ID.
- **`coda_get_row`**: Get a single row.
- **`coda_update_row`**: Update a row (JSON body).
- **`coda_delete_row`**: Delete a single row.
- **`coda_push_button`**: Push a button on a row.

### Formulas & Controls

#### Formulas

- **`coda_list_formulas`**: List named formulas in a doc.
- **`coda_get_formula`**: Get a formula by ID or name (returns computed value).

### Account

- **`coda_whoami`**: Get basic info about the current user (name, email, token, workspace). Use to verify the API token.

### Analytics

- **`coda_list_doc_analytics`**: List analytics for docs per day (views, copies, likes, sessions). Optional filters: docIds, workspaceId, sinceDate, untilDate, scale, orderBy, direction.
- **`coda_list_page_analytics`**: List page analytics for a doc (Enterprise workspace): views, sessions, users per page per day.
- **`coda_get_doc_analytics_summary`**: Get summarized doc analytics (e.g. total sessions). Optional date and workspace filters.
- **`coda_get_analytics_last_updated`**: Get dates (Pacific time) when doc and Pack analytics were last updated.
- **`coda_list_pack_analytics`**: List analytics for Packs (doc installs, workspace installs, formula invocations). Optional: packIds, workspaceId, query, sinceDate, untilDate, scale, orderBy, direction, isPublished, limit, pageToken.
- **`coda_get_pack_analytics_summary`**: Get summarized Pack analytics (total doc installs, workspace installs, invocations). Optional: packIds, workspaceId, isPublished, sinceDate, untilDate.
- **`coda_list_pack_formula_analytics`**: List analytics for Pack formulas (invocations, errors, latency). Required: packId. Optional: packFormulaNames, packFormulaTypes, sinceDate, untilDate, scale, orderBy, direction, limit, pageToken.

### Miscellaneous

- **`coda_resolve_link`**: Resolve a Coda browser URL to API metadata.
- **`coda_get_mutation_status`**: Check whether an async mutation has completed (pass the `requestId` from a prior mutation response).

## Usage

Add the MCP server to Cursor/Claude Desktop/etc. in one of the following ways.

**Option 1 — npx (published package):**

```json
{
  "mcpServers": {
    "coda": {
      "command": "npx",
      "args": ["-y", "coda-mcp@latest"],
      "env": {
        "API_KEY": "..."
      }
    }
  }
}
```

**Option 2 — Local build (`dist/index.js`):**

After cloning and building (`pnpm install && pnpm build`), run the built server by path:

```json
{
  "mcpServers": {
    "coda": {
      "command": "node",
      "args": ["/path/to/coda-mcp-server/dist/index.js"],
      "env": {
        "API_KEY": "..."
      }
    }
  }
}
```

Replace `/path/to/coda-mcp-server` with the absolute path to this repository.

**Option 3 — Docker:**

```json
{
  "mcpServers": {
    "coda": {
      "command": "docker",
      "args": ["run", "-i", "--rm", "-e", "API_KEY", "reaperberri/coda-mcp:latest"],
      "env": {
        "API_KEY": "..."
      }
    }
  }
}
```

**Required environment variables** (all options):

- `API_KEY`: Your Coda API key. You can generate one from your Coda account settings.

## Local Setup

1. **Prerequisites:**

   - Node.js
   - pnpm

2. **Clone the repository:**

   ```bash
   git clone <repository-url>
   cd coda-mcp
   ```

3. **Install dependencies:**

   ```bash
   pnpm install
   ```

4. **Build the project:**

   ```bash
   pnpm build
   ```

   This compiles the TypeScript code to JavaScript in the `dist/` directory.

## Running the Server

The MCP server communicates over standard input/output (stdio). To run it, set the environment variables and run the compiled JavaScript file - `dist/index.js`.
