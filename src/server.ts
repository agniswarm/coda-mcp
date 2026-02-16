import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import z from "zod";
import packageJson from "../package.json";
import { getPageContent } from "./client/helpers";
import {
  addPermission,
  beginPageContentExport,
  createDoc,
  createFolder,
  createPage,
  deleteDoc,
  deleteFolder,
  deletePage,
  deletePermission,
  deleteRow,
  deleteRows,
  getAnalyticsLastUpdated,
  getAclSettings,
  getColumn,
  getDoc,
  getFolder,
  getFormula,
  getMutationStatus,
  getPage,
  getPageContentExportStatus,
  getPermissions,
  getRow,
  getSharingMetadata,
  getTable,
  listCategories,
  listColumns,
  listDocAnalytics,
  listDocAnalyticsSummary,
  listDocs,
  listFolders,
  listFormulas,
  listPackAnalytics,
  listPackAnalyticsSummary,
  listPackFormulaAnalytics,
  listPageAnalytics,
  listPages,
  listRows,
  listTables,
  publishDoc,
  pushButton,
  resolveBrowserLink,
  searchPrincipals,
  triggerWebhookAutomation,
  unpublishDoc,
  updateAclSettings,
  updateDoc,
  updateFolder,
  updatePage,
  updateRow,
  upsertRows,
  whoami,
} from "./client/sdk.gen";

export const server = new McpServer({
  name: "coda",
  version: packageJson.version,
  capabilities: {
    resources: {},
    tools: {},
  },
});

server.tool(
  "coda_list_documents",
  "List or search available documents",
  {
    query: z.string().optional().describe("The query to search for documents by - optional"),
  },
  async ({ query }): Promise<CallToolResult> => {
    try {
      const resp = await listDocs({ query: { query }, throwOnError: true });

      return { content: [{ type: "text", text: JSON.stringify(resp.data) }] };
    } catch (error) {
      return { content: [{ type: "text", text: `Failed to list documents: ${error}` }], isError: true };
    }
  },
);

server.tool(
  "coda_list_pages",
  "List pages in the current document with pagination",
  {
    docId: z.string().describe("The ID of the document to list pages from"),
    limit: z.number().int().positive().optional().describe("The number of pages to return - optional, defaults to 25"),
    nextPageToken: z
      .string()
      .optional()
      .describe(
        "The token need to get the next page of results, returned from a previous call to this tool - optional",
      ),
  },
  async ({ docId, limit, nextPageToken }): Promise<CallToolResult> => {
    try {
      const listLimit = nextPageToken ? undefined : limit;

      const resp = await listPages({
        path: { docId },
        query: { limit: listLimit, pageToken: nextPageToken ?? undefined },
        throwOnError: true,
      });

      return {
        content: [{ type: "text", text: JSON.stringify(resp.data) }],
      };
    } catch (error) {
      return {
        content: [{ type: "text", text: `Failed to list pages: ${error}` }],
        isError: true,
      };
    }
  },
);

server.tool(
  "coda_create_page",
  "Create a page in the current document",
  {
    docId: z.string().describe("The ID of the document to create the page in"),
    name: z.string().describe("The name of the page to create"),
    content: z.string().optional().describe("The markdown content of the page to create - optional"),
    parentPageId: z.string().optional().describe("The ID of the parent page to create this page under - optional"),
  },
  async ({ docId, name, content, parentPageId }): Promise<CallToolResult> => {
    try {
      const resp = await createPage({
        path: { docId },
        body: {
          name,
          parentPageId: parentPageId ?? undefined,
          pageContent: {
            type: "canvas",
            canvasContent: { format: "markdown", content: content ?? " " },
          },
        },
        throwOnError: true,
      });

      return {
        content: [{ type: "text", text: JSON.stringify(resp.data) }],
      };
    } catch (error) {
      return { content: [{ type: "text", text: `Failed to create page: ${error}` }], isError: true };
    }
  },
);

server.tool(
  "coda_get_page_content",
  "Get the content of a page as markdown",
  {
    docId: z.string().describe("The ID of the document that contains the page to get the content of"),
    pageIdOrName: z.string().describe("The ID or name of the page to get the content of"),
  },
  async ({ docId, pageIdOrName }): Promise<CallToolResult> => {
    try {
      const content = await getPageContent(docId, pageIdOrName);

      if (content === undefined) {
        throw new Error("Unknown error has occurred");
      }

      return { content: [{ type: "text", text: content }] };
    } catch (error) {
      return { content: [{ type: "text", text: `Failed to get page content: ${error}` }], isError: true };
    }
  },
);

server.tool(
  "coda_peek_page",
  "Peek into the beginning of a page and return a limited number of lines",
  {
    docId: z.string().describe("The ID of the document that contains the page to peek into"),
    pageIdOrName: z.string().describe("The ID or name of the page to peek into"),
    numLines: z
      .number()
      .int()
      .positive()
      .describe("The number of lines to return from the start of the page - usually 30 lines is enough"),
  },
  async ({ docId, pageIdOrName, numLines }): Promise<CallToolResult> => {
    try {
      const content = await getPageContent(docId, pageIdOrName);

      if (!content) {
        throw new Error("Unknown error has occurred");
      }

      const preview = content.split(/\r?\n/).slice(0, numLines).join("\n");

      return { content: [{ type: "text", text: preview }] };
    } catch (error) {
      return {
        content: [{ type: "text", text: `Failed to peek page: ${error}` }],
        isError: true,
      };
    }
  },
);

server.tool(
  "coda_replace_page_content",
  "Replace the content of a page with new markdown content",
  {
    docId: z.string().describe("The ID of the document that contains the page to replace the content of"),
    pageIdOrName: z.string().describe("The ID or name of the page to replace the content of"),
    content: z.string().describe("The markdown content to replace the page with"),
  },
  async ({ docId, pageIdOrName, content }): Promise<CallToolResult> => {
    try {
      const resp = await updatePage({
        path: {
          docId,
          pageIdOrName,
        },
        body: {
          // @ts-expect-error auto-generated client types
          contentUpdate: {
            insertionMode: "replace",
            canvasContent: { format: "markdown", content },
          },
        },
        throwOnError: true,
      });

      return { content: [{ type: "text", text: JSON.stringify(resp.data) }] };
    } catch (error) {
      return { content: [{ type: "text", text: `Failed to replace page content: ${error}` }], isError: true };
    }
  },
);

server.tool(
  "coda_append_page_content",
  "Append new markdown content to the end of a page",
  {
    docId: z.string().describe("The ID of the document that contains the page to append the content to"),
    pageIdOrName: z.string().describe("The ID or name of the page to append the content to"),
    content: z.string().describe("The markdown content to append to the page"),
  },
  async ({ docId, pageIdOrName, content }): Promise<CallToolResult> => {
    try {
      const resp = await updatePage({
        path: {
          docId,
          pageIdOrName,
        },
        body: {
          // @ts-expect-error auto-generated client types
          contentUpdate: {
            insertionMode: "append",
            canvasContent: { format: "markdown", content },
          },
        },
        throwOnError: true,
      });

      return { content: [{ type: "text", text: JSON.stringify(resp.data) }] };
    } catch (error) {
      return { content: [{ type: "text", text: `Failed to append page content: ${error}` }], isError: true };
    }
  },
);

server.tool(
  "coda_duplicate_page",
  "Duplicate a page in the current document",
  {
    docId: z.string().describe("The ID of the document that contains the page to duplicate"),
    pageIdOrName: z.string().describe("The ID or name of the page to duplicate"),
    newName: z.string().describe("The name of the new page"),
  },
  async ({ docId, pageIdOrName, newName }): Promise<CallToolResult> => {
    try {
      const pageContent = await getPageContent(docId, pageIdOrName);
      const createResp = await createPage({
        path: { docId },
        body: {
          name: newName,
          pageContent: { type: "canvas", canvasContent: { format: "markdown", content: pageContent } },
        },
        throwOnError: true,
      });

      return { content: [{ type: "text", text: JSON.stringify(createResp.data) }] };
    } catch (error) {
      return { content: [{ type: "text", text: `Failed to duplicate page: ${error}` }], isError: true };
    }
  },
);

server.tool(
  "coda_rename_page",
  "Rename a page in the current document",
  {
    docId: z.string().describe("The ID of the document that contains the page to rename"),
    pageIdOrName: z.string().describe("The ID or name of the page to rename"),
    newName: z.string().describe("The new name of the page"),
  },
  async ({ docId, pageIdOrName, newName }): Promise<CallToolResult> => {
    try {
      const resp = await updatePage({
        path: { docId, pageIdOrName },
        body: {
          name: newName,
        },
        throwOnError: true,
      });

      return { content: [{ type: "text", text: JSON.stringify(resp.data) }] };
    } catch (error) {
      return { content: [{ type: "text", text: `Failed to rename page: ${error}` }], isError: true };
    }
  },
);

server.tool(
  "coda_resolve_link",
  "Resolve metadata given a browser link to a Coda object",
  {
    url: z.string().describe("The URL to resolve"),
  },
  async ({ url }): Promise<CallToolResult> => {
    try {
      const resp = await resolveBrowserLink({
        query: { url },
        throwOnError: true,
      });

      return { content: [{ type: "text", text: JSON.stringify(resp.data) }] };
    } catch (error) {
      return { content: [{ type: "text", text: `Failed to resolve link: ${error}` }], isError: true };
    }
  },
);

// --- ACCOUNT ---

server.tool(
  "coda_whoami",
  "Get basic info about the current user (name, email, token, workspace). Useful to verify the API token works.",
  {},
  async (): Promise<CallToolResult> => {
    try {
      const resp = await whoami({ throwOnError: true });
      return { content: [{ type: "text", text: JSON.stringify(resp.data) }] };
    } catch (error) {
      return { content: [{ type: "text", text: `Failed to get user info: ${error}` }], isError: true };
    }
  },
);

// --- MISCELLANEOUS (mutation status) ---

server.tool(
  "coda_get_mutation_status",
  "Check whether an async mutation (e.g. row upsert, page create) has completed. Pass the requestId from the mutation response.",
  {
    requestId: z.string().describe("Request ID returned from a previous mutation (e.g. upsert rows, create page)"),
  },
  async ({ requestId }): Promise<CallToolResult> => {
    try {
      const resp = await getMutationStatus({ path: { requestId }, throwOnError: true });
      return { content: [{ type: "text", text: JSON.stringify(resp.data) }] };
    } catch (error) {
      return { content: [{ type: "text", text: `Failed to get mutation status: ${error}` }], isError: true };
    }
  },
);

// --- FOLDERS APIs ---

server.tool(
  "coda_list_folders",
  "List folders the user has access to. Optionally filter by workspace or starred.",
  {
    workspaceId: z.string().optional().describe("Show only folders in this workspace"),
    isStarred: z.boolean().optional().describe("If true, only starred folders; if false, only unstarred; omit for all"),
    limit: z.number().int().positive().optional().describe("Max results (default 25)"),
    pageToken: z.string().optional().describe("Token for next page"),
  },
  async ({ workspaceId, isStarred, limit, pageToken }): Promise<CallToolResult> => {
    try {
      const resp = await listFolders({
        query: { workspaceId, isStarred, limit, pageToken },
        throwOnError: true,
      });
      return { content: [{ type: "text", text: JSON.stringify(resp.data) }] };
    } catch (error) {
      return { content: [{ type: "text", text: `Failed to list folders: ${error}` }], isError: true };
    }
  },
);

server.tool(
  "coda_create_folder",
  "Create a new folder in a workspace. The folder must be empty to delete later.",
  {
    name: z.string().describe("Name of the folder"),
    workspaceId: z.string().describe("ID of the workspace to create the folder in"),
    description: z.string().optional().describe("Description of the folder"),
  },
  async ({ name, workspaceId, description }): Promise<CallToolResult> => {
    try {
      const resp = await createFolder({
        body: { name, workspaceId, description },
        throwOnError: true,
      });
      return { content: [{ type: "text", text: JSON.stringify(resp.data) }] };
    } catch (error) {
      return { content: [{ type: "text", text: `Failed to create folder: ${error}` }], isError: true };
    }
  },
);

server.tool(
  "coda_get_folder",
  "Get a folder by ID",
  {
    folderId: z.string().describe("ID of the folder"),
  },
  async ({ folderId }): Promise<CallToolResult> => {
    try {
      const resp = await getFolder({ path: { folderId }, throwOnError: true });
      return { content: [{ type: "text", text: JSON.stringify(resp.data) }] };
    } catch (error) {
      return { content: [{ type: "text", text: `Failed to get folder: ${error}` }], isError: true };
    }
  },
);

server.tool(
  "coda_update_folder",
  "Update folder name or description",
  {
    folderId: z.string().describe("ID of the folder"),
    name: z.string().optional().describe("New name of the folder"),
    description: z.string().optional().describe("New description of the folder"),
  },
  async ({ folderId, name, description }): Promise<CallToolResult> => {
    try {
      const resp = await updateFolder({
        path: { folderId },
        body: { name, description },
        throwOnError: true,
      });
      return { content: [{ type: "text", text: JSON.stringify(resp.data) }] };
    } catch (error) {
      return { content: [{ type: "text", text: `Failed to update folder: ${error}` }], isError: true };
    }
  },
);

server.tool(
  "coda_delete_folder",
  "Delete a folder. The folder must be empty (contain no docs).",
  {
    folderId: z.string().describe("ID of the folder to delete"),
  },
  async ({ folderId }): Promise<CallToolResult> => {
    try {
      const resp = await deleteFolder({ path: { folderId }, throwOnError: true });
      return { content: [{ type: "text", text: JSON.stringify(resp.data) }] };
    } catch (error) {
      return { content: [{ type: "text", text: `Failed to delete folder: ${error}` }], isError: true };
    }
  },
);

// --- DOCS APIs ---

server.tool(
  "coda_create_doc",
  "Create a new Coda doc, optionally copying an existing doc. Requires Doc Maker in the workspace.",
  {
    title: z.string().optional().describe("Title of the new doc. Defaults to 'Untitled'"),
    sourceDoc: z.string().optional().describe("Optional doc ID to copy from"),
    timezone: z.string().optional().describe("Timezone for the new doc"),
    folderId: z.string().optional().describe("ID of folder to create the doc in"),
  },
  async ({ title, sourceDoc, timezone, folderId }): Promise<CallToolResult> => {
    try {
      const resp = await createDoc({
        body: { title, sourceDoc, timezone, folderId },
        throwOnError: true,
      });
      return { content: [{ type: "text", text: JSON.stringify(resp.data) }] };
    } catch (error) {
      return { content: [{ type: "text", text: `Failed to create doc: ${error}` }], isError: true };
    }
  },
);

server.tool(
  "coda_get_doc",
  "Get metadata for a specific doc",
  {
    docId: z.string().describe("ID of the doc"),
  },
  async ({ docId }): Promise<CallToolResult> => {
    try {
      const resp = await getDoc({ path: { docId }, throwOnError: true });
      return { content: [{ type: "text", text: JSON.stringify(resp.data) }] };
    } catch (error) {
      return { content: [{ type: "text", text: `Failed to get doc: ${error}` }], isError: true };
    }
  },
);

server.tool(
  "coda_update_doc",
  "Update doc metadata (title, icon). Requires Doc Maker in the workspace.",
  {
    docId: z.string().describe("ID of the doc"),
    title: z.string().optional().describe("New title of the doc"),
    iconName: z.string().optional().describe("Name of the icon"),
  },
  async ({ docId, title, iconName }): Promise<CallToolResult> => {
    try {
      const resp = await updateDoc({
        path: { docId },
        body: { title, iconName },
        throwOnError: true,
      });
      return { content: [{ type: "text", text: JSON.stringify(resp.data) }] };
    } catch (error) {
      return { content: [{ type: "text", text: `Failed to update doc: ${error}` }], isError: true };
    }
  },
);

server.tool(
  "coda_delete_doc",
  "Delete a doc",
  {
    docId: z.string().describe("ID of the doc to delete"),
  },
  async ({ docId }): Promise<CallToolResult> => {
    try {
      const resp = await deleteDoc({ path: { docId }, throwOnError: true });
      return { content: [{ type: "text", text: JSON.stringify(resp.data) }] };
    } catch (error) {
      return { content: [{ type: "text", text: `Failed to delete doc: ${error}` }], isError: true };
    }
  },
);

server.tool(
  "coda_get_sharing_metadata",
  "Get sharing metadata for a doc (canShare, canShareWithWorkspace, etc.)",
  {
    docId: z.string().describe("ID of the doc"),
  },
  async ({ docId }): Promise<CallToolResult> => {
    try {
      const resp = await getSharingMetadata({ path: { docId }, throwOnError: true });
      return { content: [{ type: "text", text: JSON.stringify(resp.data) }] };
    } catch (error) {
      return { content: [{ type: "text", text: `Failed to get sharing metadata: ${error}` }], isError: true };
    }
  },
);

server.tool(
  "coda_list_permissions",
  "List permissions for a doc",
  {
    docId: z.string().describe("ID of the doc"),
    limit: z.number().int().positive().optional().describe("Max results (default 25)"),
    pageToken: z.string().optional().describe("Token for next page"),
  },
  async ({ docId, limit, pageToken }): Promise<CallToolResult> => {
    try {
      const resp = await getPermissions({
        path: { docId },
        query: { limit, pageToken },
        throwOnError: true,
      });
      return { content: [{ type: "text", text: JSON.stringify(resp.data) }] };
    } catch (error) {
      return { content: [{ type: "text", text: `Failed to list permissions: ${error}` }], isError: true };
    }
  },
);

server.tool(
  "coda_add_permission",
  "Add a permission to a doc (share with a user or group)",
  {
    docId: z.string().describe("ID of the doc"),
    access: z.enum(["readonly", "write", "comment"]).describe("Type of access"),
    principalType: z.enum(["email", "group"]).describe("Principal type"),
    email: z.string().optional().describe("Email when principalType is 'email'"),
    groupId: z.string().optional().describe("Group ID when principalType is 'group'"),
    suppressEmail: z.boolean().optional().describe("Suppress email notification"),
  },
  async ({ docId, access, principalType, email, groupId, suppressEmail }): Promise<CallToolResult> => {
    try {
      const principal =
        principalType === "email"
          ? { type: "email" as const, email: email! }
          : { type: "group" as const, groupId: groupId! };
      const resp = await addPermission({
        path: { docId },
        body: { access, principal, suppressEmail },
        throwOnError: true,
      });
      return { content: [{ type: "text", text: JSON.stringify(resp.data) }] };
    } catch (error) {
      return { content: [{ type: "text", text: `Failed to add permission: ${error}` }], isError: true };
    }
  },
);

server.tool(
  "coda_delete_permission",
  "Delete a permission from a doc",
  {
    docId: z.string().describe("ID of the doc"),
    permissionId: z.string().describe("ID of the permission to delete"),
  },
  async ({ docId, permissionId }): Promise<CallToolResult> => {
    try {
      const resp = await deletePermission({
        path: { docId, permissionId },
        throwOnError: true,
      });
      return { content: [{ type: "text", text: JSON.stringify(resp.data) }] };
    } catch (error) {
      return { content: [{ type: "text", text: `Failed to delete permission: ${error}` }], isError: true };
    }
  },
);

server.tool(
  "coda_search_principals",
  "Search users and groups that can be shared with for this doc. At most 20 results. Query required.",
  {
    docId: z.string().describe("ID of the doc"),
    query: z.string().describe("Search term for users/groups"),
  },
  async ({ docId, query }): Promise<CallToolResult> => {
    try {
      const resp = await searchPrincipals({
        path: { docId },
        query: { query },
        throwOnError: true,
      });
      return { content: [{ type: "text", text: JSON.stringify(resp.data) }] };
    } catch (error) {
      return { content: [{ type: "text", text: `Failed to search principals: ${error}` }], isError: true };
    }
  },
);

server.tool(
  "coda_get_acl_settings",
  "Get ACL settings for a doc (allowEditorsToChangePermissions, allowCopying, etc.)",
  {
    docId: z.string().describe("ID of the doc"),
  },
  async ({ docId }): Promise<CallToolResult> => {
    try {
      const resp = await getAclSettings({ path: { docId }, throwOnError: true });
      return { content: [{ type: "text", text: JSON.stringify(resp.data) }] };
    } catch (error) {
      return { content: [{ type: "text", text: `Failed to get ACL settings: ${error}` }], isError: true };
    }
  },
);

server.tool(
  "coda_update_acl_settings",
  "Update ACL settings for a doc",
  {
    docId: z.string().describe("ID of the doc"),
    allowEditorsToChangePermissions: z.boolean().optional(),
    allowCopying: z.boolean().optional(),
    allowViewersToRequestEditing: z.boolean().optional(),
  },
  async ({
    docId,
    allowEditorsToChangePermissions,
    allowCopying,
    allowViewersToRequestEditing,
  }): Promise<CallToolResult> => {
    try {
      const resp = await updateAclSettings({
        path: { docId },
        body: { allowEditorsToChangePermissions, allowCopying, allowViewersToRequestEditing },
        throwOnError: true,
      });
      return { content: [{ type: "text", text: JSON.stringify(resp.data) }] };
    } catch (error) {
      return { content: [{ type: "text", text: `Failed to update ACL settings: ${error}` }], isError: true };
    }
  },
);

server.tool(
  "coda_list_categories",
  "Get all available doc categories (for publishing)",
  {},
  async (): Promise<CallToolResult> => {
    try {
      const resp = await listCategories({ throwOnError: true });
      return { content: [{ type: "text", text: JSON.stringify(resp.data) }] };
    } catch (error) {
      return { content: [{ type: "text", text: `Failed to list categories: ${error}` }], isError: true };
    }
  },
);

server.tool(
  "coda_publish_doc",
  "Publish a doc or update publish settings",
  {
    docId: z.string().describe("ID of the doc"),
    slug: z.string().optional().describe("Slug for the published doc URL"),
    discoverable: z.boolean().optional().describe("If true, doc is discoverable"),
    earnCredit: z.boolean().optional().describe("If true, may require sign-in; you get Coda credit"),
    categoryNames: z.array(z.string()).optional().describe("Category names"),
    mode: z.enum(["view", "play", "edit"]).optional().describe("Published doc interaction mode"),
  },
  async ({ docId, slug, discoverable, earnCredit, categoryNames, mode }): Promise<CallToolResult> => {
    try {
      const resp = await publishDoc({
        path: { docId },
        body: { slug, discoverable, earnCredit, categoryNames, mode },
        throwOnError: true,
      });
      return { content: [{ type: "text", text: JSON.stringify(resp.data) }] };
    } catch (error) {
      return { content: [{ type: "text", text: `Failed to publish doc: ${error}` }], isError: true };
    }
  },
);

server.tool(
  "coda_unpublish_doc",
  "Unpublish a doc",
  {
    docId: z.string().describe("ID of the doc"),
  },
  async ({ docId }): Promise<CallToolResult> => {
    try {
      const resp = await unpublishDoc({ path: { docId }, throwOnError: true });
      return { content: [{ type: "text", text: JSON.stringify(resp.data) }] };
    } catch (error) {
      return { content: [{ type: "text", text: `Failed to unpublish doc: ${error}` }], isError: true };
    }
  },
);

// --- Pages APIs (additional) ---

server.tool(
  "coda_get_page",
  "Get details about a page (metadata, not full content)",
  {
    docId: z.string().describe("ID of the document"),
    pageIdOrName: z.string().describe("ID or name of the page"),
  },
  async ({ docId, pageIdOrName }): Promise<CallToolResult> => {
    try {
      const resp = await getPage({ path: { docId, pageIdOrName }, throwOnError: true });
      return { content: [{ type: "text", text: JSON.stringify(resp.data) }] };
    } catch (error) {
      return { content: [{ type: "text", text: `Failed to get page: ${error}` }], isError: true };
    }
  },
);

server.tool(
  "coda_delete_page",
  "Delete a page",
  {
    docId: z.string().describe("ID of the document"),
    pageIdOrName: z.string().describe("ID or name of the page to delete"),
  },
  async ({ docId, pageIdOrName }): Promise<CallToolResult> => {
    try {
      const resp = await deletePage({ path: { docId, pageIdOrName }, throwOnError: true });
      return { content: [{ type: "text", text: JSON.stringify(resp.data) }] };
    } catch (error) {
      return { content: [{ type: "text", text: `Failed to delete page: ${error}` }], isError: true };
    }
  },
);

server.tool(
  "coda_begin_page_content_export",
  "Start exporting page content as HTML or Markdown. Use get_page_content_export_status to poll.",
  {
    docId: z.string().describe("ID of the document"),
    pageIdOrName: z.string().describe("ID or name of the page"),
    outputFormat: z.enum(["html", "markdown"]).describe("Export format"),
  },
  async ({ docId, pageIdOrName, outputFormat }): Promise<CallToolResult> => {
    try {
      const resp = await beginPageContentExport({
        path: { docId, pageIdOrName },
        body: { outputFormat },
        throwOnError: true,
      });
      return { content: [{ type: "text", text: JSON.stringify(resp.data) }] };
    } catch (error) {
      return { content: [{ type: "text", text: `Failed to begin export: ${error}` }], isError: true };
    }
  },
);

server.tool(
  "coda_get_page_content_export_status",
  "Check status of a page content export; returns downloadLink when complete",
  {
    docId: z.string().describe("ID of the document"),
    pageIdOrName: z.string().describe("ID or name of the page"),
    requestId: z.string().describe("Export request ID from begin_page_content_export"),
  },
  async ({ docId, pageIdOrName, requestId }): Promise<CallToolResult> => {
    try {
      const resp = await getPageContentExportStatus({
        path: { docId, pageIdOrName, requestId },
        throwOnError: true,
      });
      return { content: [{ type: "text", text: JSON.stringify(resp.data) }] };
    } catch (error) {
      return { content: [{ type: "text", text: `Failed to get export status: ${error}` }], isError: true };
    }
  },
);

// --- Automations (Doc Structure) ---

server.tool(
  "coda_trigger_automation",
  "Trigger a webhook-invoked automation in a doc. Pass optional payload as JSON for the webhook.",
  {
    docId: z.string().describe("ID of the doc containing the automation"),
    ruleId: z.string().describe("ID of the automation rule to trigger"),
    payloadJson: z
      .string()
      .optional()
      .describe(
        'Optional JSON object to send as the webhook payload (e.g. {"message": "Hello"}). Omit for empty body.',
      ),
  },
  async ({ docId, ruleId, payloadJson }): Promise<CallToolResult> => {
    try {
      const body = payloadJson ? (JSON.parse(payloadJson) as Record<string, unknown>) : undefined;
      const resp = await triggerWebhookAutomation({
        path: { docId, ruleId },
        body,
        throwOnError: true,
      });
      return { content: [{ type: "text", text: JSON.stringify(resp.data) }] };
    } catch (error) {
      return { content: [{ type: "text", text: `Failed to trigger automation: ${error}` }], isError: true };
    }
  },
);

// --- Tables APIs ---

server.tool(
  "coda_list_tables",
  "List tables and views in a doc",
  {
    docId: z.string().describe("ID of the document"),
    limit: z.number().int().positive().optional().describe("Max results (default 25)"),
    pageToken: z.string().optional().describe("Token for next page"),
    sortBy: z.enum(["name"]).optional().describe("Sort by name"),
    tableTypes: z
      .array(z.enum(["table", "view"]))
      .optional()
      .describe("Filter by type"),
  },
  async ({ docId, limit, pageToken, sortBy, tableTypes }): Promise<CallToolResult> => {
    try {
      const resp = await listTables({
        path: { docId },
        query: { limit, pageToken, sortBy, tableTypes },
        throwOnError: true,
      });
      return { content: [{ type: "text", text: JSON.stringify(resp.data) }] };
    } catch (error) {
      return { content: [{ type: "text", text: `Failed to list tables: ${error}` }], isError: true };
    }
  },
);

server.tool(
  "coda_get_table",
  "Get details about a specific table or view",
  {
    docId: z.string().describe("ID of the document"),
    tableIdOrName: z.string().describe("ID or name of the table"),
    useUpdatedTableLayouts: z.boolean().optional().describe("Return 'detail'/'form' for layout"),
  },
  async ({ docId, tableIdOrName, useUpdatedTableLayouts }): Promise<CallToolResult> => {
    try {
      const resp = await getTable({
        path: { docId, tableIdOrName },
        query: { useUpdatedTableLayouts },
        throwOnError: true,
      });
      return { content: [{ type: "text", text: JSON.stringify(resp.data) }] };
    } catch (error) {
      return { content: [{ type: "text", text: `Failed to get table: ${error}` }], isError: true };
    }
  },
);

// --- Columns APIs ---

server.tool(
  "coda_list_columns",
  "List columns in a table",
  {
    docId: z.string().describe("ID of the document"),
    tableIdOrName: z.string().describe("ID or name of the table"),
    limit: z.number().int().positive().optional().describe("Max results (default 25)"),
    pageToken: z.string().optional().describe("Token for next page"),
    visibleOnly: z.boolean().optional().describe("Only visible columns (base tables only)"),
  },
  async ({ docId, tableIdOrName, limit, pageToken, visibleOnly }): Promise<CallToolResult> => {
    try {
      const resp = await listColumns({
        path: { docId, tableIdOrName },
        query: { limit, pageToken, visibleOnly },
        throwOnError: true,
      });
      return { content: [{ type: "text", text: JSON.stringify(resp.data) }] };
    } catch (error) {
      return { content: [{ type: "text", text: `Failed to list columns: ${error}` }], isError: true };
    }
  },
);

server.tool(
  "coda_get_column",
  "Get details about a column",
  {
    docId: z.string().describe("ID of the document"),
    tableIdOrName: z.string().describe("ID or name of the table"),
    columnIdOrName: z.string().describe("ID or name of the column"),
  },
  async ({ docId, tableIdOrName, columnIdOrName }): Promise<CallToolResult> => {
    try {
      const resp = await getColumn({
        path: { docId, tableIdOrName, columnIdOrName },
        throwOnError: true,
      });
      return { content: [{ type: "text", text: JSON.stringify(resp.data) }] };
    } catch (error) {
      return { content: [{ type: "text", text: `Failed to get column: ${error}` }], isError: true };
    }
  },
);

// --- Rows APIs ---

server.tool(
  "coda_list_rows",
  "List rows in a table. valueFormat: simple (default), simpleWithArrays, or rich.",
  {
    docId: z.string().describe("ID of the document"),
    tableIdOrName: z.string().describe("ID or name of the table"),
    query: z.string().optional().describe('Filter: columnId:value or "Column Name":value'),
    sortBy: z.enum(["createdAt", "natural", "updatedAt"]).optional().describe("Sort order"),
    valueFormat: z.enum(["simple", "simpleWithArrays", "rich"]).optional().describe("Cell value format"),
    visibleOnly: z.boolean().optional().describe("Only visible rows/columns"),
    limit: z.number().int().positive().optional().describe("Max results (default 25)"),
    pageToken: z.string().optional().describe("Token for next page"),
    syncToken: z.string().optional().describe("Sync token for incremental results"),
    useColumnNames: z.boolean().optional().describe("Use column names in output (fragile)"),
  },
  async ({
    docId,
    tableIdOrName,
    query,
    sortBy,
    valueFormat,
    visibleOnly,
    limit,
    pageToken,
    syncToken,
    useColumnNames,
  }): Promise<CallToolResult> => {
    try {
      const resp = await listRows({
        path: { docId, tableIdOrName },
        query: {
          query,
          sortBy,
          valueFormat,
          visibleOnly,
          limit,
          pageToken,
          syncToken,
          useColumnNames,
        },
        throwOnError: true,
      });
      return { content: [{ type: "text", text: JSON.stringify(resp.data) }] };
    } catch (error) {
      return { content: [{ type: "text", text: `Failed to list rows: ${error}` }], isError: true };
    }
  },
);

server.tool(
  "coda_upsert_rows",
  'Insert or upsert rows into a base table. Pass rows as JSON: array of { cells: [ { column: "colId", value: ... } ] }. Optional keyColumns for upsert.',
  {
    docId: z.string().describe("ID of the document"),
    tableIdOrName: z.string().describe("ID or name of the table (base table, not view)"),
    rowsJson: z
      .string()
      .describe("JSON array of row objects: [{ cells: [{ column: string, value: string|number|boolean }] }]"),
    keyColumns: z.array(z.string()).optional().describe("Column IDs/names for upsert key"),
    disableParsing: z.boolean().optional().describe("If true, API does not parse values"),
  },
  async ({ docId, tableIdOrName, rowsJson, keyColumns, disableParsing }): Promise<CallToolResult> => {
    try {
      const rows = JSON.parse(rowsJson) as Array<{
        cells: Array<{ column: string; value: string | number | boolean }>;
      }>;
      const resp = await upsertRows({
        path: { docId, tableIdOrName },
        body: { rows, keyColumns },
        query: { disableParsing },
        throwOnError: true,
      });
      return { content: [{ type: "text", text: JSON.stringify(resp.data) }] };
    } catch (error) {
      return { content: [{ type: "text", text: `Failed to upsert rows: ${error}` }], isError: true };
    }
  },
);

server.tool(
  "coda_delete_rows",
  "Delete multiple rows by ID",
  {
    docId: z.string().describe("ID of the document"),
    tableIdOrName: z.string().describe("ID or name of the table"),
    rowIds: z.array(z.string()).describe("Row IDs to delete"),
  },
  async ({ docId, tableIdOrName, rowIds }): Promise<CallToolResult> => {
    try {
      const resp = await deleteRows({
        path: { docId, tableIdOrName },
        body: { rowIds },
        throwOnError: true,
      });
      return { content: [{ type: "text", text: JSON.stringify(resp.data) }] };
    } catch (error) {
      return { content: [{ type: "text", text: `Failed to delete rows: ${error}` }], isError: true };
    }
  },
);

server.tool(
  "coda_get_row",
  "Get a single row by ID or name",
  {
    docId: z.string().describe("ID of the document"),
    tableIdOrName: z.string().describe("ID or name of the table"),
    rowIdOrName: z.string().describe("ID or name of the row"),
    valueFormat: z.enum(["simple", "simpleWithArrays", "rich"]).optional(),
    useColumnNames: z.boolean().optional(),
  },
  async ({ docId, tableIdOrName, rowIdOrName, valueFormat, useColumnNames }): Promise<CallToolResult> => {
    try {
      const resp = await getRow({
        path: { docId, tableIdOrName, rowIdOrName },
        query: { valueFormat, useColumnNames },
        throwOnError: true,
      });
      return { content: [{ type: "text", text: JSON.stringify(resp.data) }] };
    } catch (error) {
      return { content: [{ type: "text", text: `Failed to get row: ${error}` }], isError: true };
    }
  },
);

server.tool(
  "coda_update_row",
  'Update a row. Pass row as JSON: { cells: [ { column: "colId", value: ... } ] }',
  {
    docId: z.string().describe("ID of the document"),
    tableIdOrName: z.string().describe("ID or name of the table"),
    rowIdOrName: z.string().describe("ID or name of the row"),
    rowJson: z.string().describe("JSON object: { cells: [{ column: string, value: string|number|boolean }] }"),
    disableParsing: z.boolean().optional(),
  },
  async ({ docId, tableIdOrName, rowIdOrName, rowJson, disableParsing }): Promise<CallToolResult> => {
    try {
      const row = JSON.parse(rowJson) as { cells: Array<{ column: string; value: string | number | boolean }> };
      const resp = await updateRow({
        path: { docId, tableIdOrName, rowIdOrName },
        body: { row },
        query: { disableParsing },
        throwOnError: true,
      });
      return { content: [{ type: "text", text: JSON.stringify(resp.data) }] };
    } catch (error) {
      return { content: [{ type: "text", text: `Failed to update row: ${error}` }], isError: true };
    }
  },
);

server.tool(
  "coda_delete_row",
  "Delete a single row",
  {
    docId: z.string().describe("ID of the document"),
    tableIdOrName: z.string().describe("ID or name of the table"),
    rowIdOrName: z.string().describe("ID or name of the row"),
  },
  async ({ docId, tableIdOrName, rowIdOrName }): Promise<CallToolResult> => {
    try {
      const resp = await deleteRow({
        path: { docId, tableIdOrName, rowIdOrName },
        throwOnError: true,
      });
      return { content: [{ type: "text", text: JSON.stringify(resp.data) }] };
    } catch (error) {
      return { content: [{ type: "text", text: `Failed to delete row: ${error}` }], isError: true };
    }
  },
);

server.tool(
  "coda_push_button",
  "Push a button on a row (triggers the button action in the doc)",
  {
    docId: z.string().describe("ID of the document"),
    tableIdOrName: z.string().describe("ID or name of the table"),
    rowIdOrName: z.string().describe("ID or name of the row"),
    columnIdOrName: z.string().describe("ID or name of the button column"),
  },
  async ({ docId, tableIdOrName, rowIdOrName, columnIdOrName }): Promise<CallToolResult> => {
    try {
      const resp = await pushButton({
        path: { docId, tableIdOrName, rowIdOrName, columnIdOrName },
        throwOnError: true,
      });
      return { content: [{ type: "text", text: JSON.stringify(resp.data) }] };
    } catch (error) {
      return { content: [{ type: "text", text: `Failed to push button: ${error}` }], isError: true };
    }
  },
);

// --- Formulas APIs ---

server.tool(
  "coda_list_formulas",
  "List named formulas in a doc",
  {
    docId: z.string().describe("ID of the document"),
    limit: z.number().int().positive().optional().describe("Max results (default 25)"),
    pageToken: z.string().optional().describe("Token for next page"),
    sortBy: z.enum(["name"]).optional().describe("Sort by name"),
  },
  async ({ docId, limit, pageToken, sortBy }): Promise<CallToolResult> => {
    try {
      const resp = await listFormulas({
        path: { docId },
        query: { limit, pageToken, sortBy },
        throwOnError: true,
      });
      return { content: [{ type: "text", text: JSON.stringify(resp.data) }] };
    } catch (error) {
      return { content: [{ type: "text", text: `Failed to list formulas: ${error}` }], isError: true };
    }
  },
);

server.tool(
  "coda_get_formula",
  "Get a formula by ID or name (returns computed value)",
  {
    docId: z.string().describe("ID of the document"),
    formulaIdOrName: z.string().describe("ID or name of the formula"),
  },
  async ({ docId, formulaIdOrName }): Promise<CallToolResult> => {
    try {
      const resp = await getFormula({
        path: { docId, formulaIdOrName },
        throwOnError: true,
      });
      return { content: [{ type: "text", text: JSON.stringify(resp.data) }] };
    } catch (error) {
      return { content: [{ type: "text", text: `Failed to get formula: ${error}` }], isError: true };
    }
  },
);

// --- ANALYTICS ---

server.tool(
  "coda_list_doc_analytics",
  "List analytics data for docs per day (views, copies, likes, sessions, etc.). Optional filters: docIds, workspaceId, sinceDate, untilDate.",
  {
    docIds: z.array(z.string()).optional().describe("List of doc IDs to fetch"),
    workspaceId: z.string().optional().describe("Filter by workspace"),
    query: z.string().optional().describe("Search term to filter results"),
    isPublished: z.boolean().optional().describe("Limit to published docs"),
    sinceDate: z.string().optional().describe("Activity on or after this date (YYYY-MM-DD)"),
    untilDate: z.string().optional().describe("Activity on or before this date (YYYY-MM-DD)"),
    scale: z.enum(["daily", "cumulative"]).optional().describe("Quantization period; default daily"),
    orderBy: z
      .string()
      .optional()
      .describe("Order by: date, docId, title, createdAt, publishedAt, likes, copies, views, totalSessions, etc."),
    direction: z.enum(["ascending", "descending"]).optional().describe("Sort direction"),
    limit: z.number().int().positive().optional().describe("Max results (1-5000, default 1000)"),
    pageToken: z.string().optional().describe("Token for next page"),
  },
  async ({
    docIds,
    workspaceId,
    query,
    isPublished,
    sinceDate,
    untilDate,
    scale,
    orderBy,
    direction,
    limit,
    pageToken,
  }): Promise<CallToolResult> => {
    try {
      const resp = await listDocAnalytics({
        query: {
          docIds,
          workspaceId,
          query,
          isPublished,
          sinceDate,
          untilDate,
          scale,
          orderBy: orderBy as never,
          direction: direction as never,
          limit,
          pageToken,
        },
        throwOnError: true,
      });
      return { content: [{ type: "text", text: JSON.stringify(resp.data) }] };
    } catch (error) {
      return { content: [{ type: "text", text: `Failed to list doc analytics: ${error}` }], isError: true };
    }
  },
);

server.tool(
  "coda_list_page_analytics",
  "List page analytics for a doc (Enterprise workspace). Returns views, sessions, users per page per day.",
  {
    docId: z.string().describe("ID of the doc"),
    sinceDate: z.string().optional().describe("Activity on or after this date (YYYY-MM-DD)"),
    untilDate: z.string().optional().describe("Activity on or before this date (YYYY-MM-DD)"),
    limit: z.number().int().positive().optional().describe("Max results (1-5000, default 1000)"),
    pageToken: z.string().optional().describe("Token for next page"),
  },
  async ({ docId, sinceDate, untilDate, limit, pageToken }): Promise<CallToolResult> => {
    try {
      const resp = await listPageAnalytics({
        path: { docId },
        query: { sinceDate, untilDate, limit, pageToken },
        throwOnError: true,
      });
      return { content: [{ type: "text", text: JSON.stringify(resp.data) }] };
    } catch (error) {
      return { content: [{ type: "text", text: `Failed to list page analytics: ${error}` }], isError: true };
    }
  },
);

server.tool(
  "coda_get_doc_analytics_summary",
  "Get summarized doc analytics (e.g. total sessions across all docs). Optional filters by date and workspace.",
  {
    isPublished: z.boolean().optional().describe("Limit to published docs"),
    sinceDate: z.string().optional().describe("Activity on or after this date (YYYY-MM-DD)"),
    untilDate: z.string().optional().describe("Activity on or before this date (YYYY-MM-DD)"),
    workspaceId: z.string().optional().describe("Filter by workspace"),
  },
  async ({ isPublished, sinceDate, untilDate, workspaceId }): Promise<CallToolResult> => {
    try {
      const resp = await listDocAnalyticsSummary({
        query: { isPublished, sinceDate, untilDate, workspaceId },
        throwOnError: true,
      });
      return { content: [{ type: "text", text: JSON.stringify(resp.data) }] };
    } catch (error) {
      return { content: [{ type: "text", text: `Failed to get doc analytics summary: ${error}` }], isError: true };
    }
  },
);

server.tool(
  "coda_get_analytics_last_updated",
  "Get the dates (Pacific time) when doc and Pack analytics were last updated.",
  {},
  async (): Promise<CallToolResult> => {
    try {
      const resp = await getAnalyticsLastUpdated({ throwOnError: true });
      return { content: [{ type: "text", text: JSON.stringify(resp.data) }] };
    } catch (error) {
      return { content: [{ type: "text", text: `Failed to get analytics last updated: ${error}` }], isError: true };
    }
  },
);

server.tool(
  "coda_list_pack_analytics",
  "List analytics data for Packs the user can edit (doc installs, workspace installs, formula invocations, etc.).",
  {
    packIds: z.array(z.number().int().positive()).optional().describe("Pack IDs to fetch"),
    workspaceId: z.string().optional().describe("Filter by workspace"),
    query: z.string().optional().describe("Search term to filter results"),
    sinceDate: z.string().optional().describe("Activity on or after this date (YYYY-MM-DD)"),
    untilDate: z.string().optional().describe("Activity on or before this date (YYYY-MM-DD)"),
    scale: z.enum(["daily", "cumulative"]).optional().describe("Quantization period; default daily"),
    orderBy: z
      .string()
      .optional()
      .describe("Order by: date, packId, name, createdAt, docInstalls, workspaceInstalls, etc."),
    direction: z.enum(["ascending", "descending"]).optional().describe("Sort direction"),
    isPublished: z.boolean().optional().describe("Limit to published Packs only"),
    limit: z.number().int().positive().optional().describe("Max results (1-5000, default 1000)"),
    pageToken: z.string().optional().describe("Token for next page"),
  },
  async ({
    packIds,
    workspaceId,
    query,
    sinceDate,
    untilDate,
    scale,
    orderBy,
    direction,
    isPublished,
    limit,
    pageToken,
  }): Promise<CallToolResult> => {
    try {
      const resp = await listPackAnalytics({
        query: {
          packIds,
          workspaceId,
          query,
          sinceDate,
          untilDate,
          scale,
          orderBy: orderBy as never,
          direction: direction as never,
          isPublished,
          limit,
          pageToken,
        },
        throwOnError: true,
      });
      return { content: [{ type: "text", text: JSON.stringify(resp.data) }] };
    } catch (error) {
      return { content: [{ type: "text", text: `Failed to list Pack analytics: ${error}` }], isError: true };
    }
  },
);

server.tool(
  "coda_get_pack_analytics_summary",
  "Get summarized Pack analytics (total doc installs, workspace installs, formula invocations).",
  {
    packIds: z.array(z.number().int().positive()).optional().describe("Pack IDs to fetch"),
    workspaceId: z.string().optional().describe("Filter by workspace"),
    isPublished: z.boolean().optional().describe("Limit to published Packs only"),
    sinceDate: z.string().optional().describe("Activity on or after this date (YYYY-MM-DD)"),
    untilDate: z.string().optional().describe("Activity on or before this date (YYYY-MM-DD)"),
  },
  async ({ packIds, workspaceId, isPublished, sinceDate, untilDate }): Promise<CallToolResult> => {
    try {
      const resp = await listPackAnalyticsSummary({
        query: { packIds, workspaceId, isPublished, sinceDate, untilDate },
        throwOnError: true,
      });
      return { content: [{ type: "text", text: JSON.stringify(resp.data) }] };
    } catch (error) {
      return { content: [{ type: "text", text: `Failed to get Pack analytics summary: ${error}` }], isError: true };
    }
  },
);

server.tool(
  "coda_list_pack_formula_analytics",
  "List analytics for formulas in a Pack (invocations, errors, latency by formula).",
  {
    packId: z.number().int().positive().describe("ID of the Pack"),
    packFormulaNames: z.array(z.string()).optional().describe("Formula names (case-sensitive) to get analytics for"),
    packFormulaTypes: z
      .array(z.enum(["action", "formula", "sync", "metadata"]))
      .optional()
      .describe("Formula types corresponding to packFormulaNames; must match length if provided"),
    sinceDate: z.string().optional().describe("Activity on or after this date (YYYY-MM-DD)"),
    untilDate: z.string().optional().describe("Activity on or before this date (YYYY-MM-DD)"),
    scale: z.enum(["daily", "cumulative"]).optional().describe("Quantization period; default daily"),
    orderBy: z.string().optional().describe("Order by: date, formulaName, formulaType, formulaInvocations, etc."),
    direction: z.enum(["ascending", "descending"]).optional().describe("Sort direction"),
    limit: z.number().int().positive().optional().describe("Max results (1-5000, default 1000)"),
    pageToken: z.string().optional().describe("Token for next page"),
  },
  async ({
    packId,
    packFormulaNames,
    packFormulaTypes,
    sinceDate,
    untilDate,
    scale,
    orderBy,
    direction,
    limit,
    pageToken,
  }): Promise<CallToolResult> => {
    try {
      const resp = await listPackFormulaAnalytics({
        path: { packId },
        query: {
          packFormulaNames,
          packFormulaTypes: packFormulaTypes as never,
          sinceDate,
          untilDate,
          scale,
          orderBy: orderBy as never,
          direction: direction as never,
          limit,
          pageToken,
        },
        throwOnError: true,
      });
      return { content: [{ type: "text", text: JSON.stringify(resp.data) }] };
    } catch (error) {
      return { content: [{ type: "text", text: `Failed to list Pack formula analytics: ${error}` }], isError: true };
    }
  },
);
