import express from "express";
import { createServer as createViteServer } from "vite";
import { PrismaClient } from "@prisma/client";
import { GoogleGenAI, Type } from "@google/genai";
import Groq from "groq-sdk";
import path from "path";
import { fileURLToPath } from "url";
import axios from "axios";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const prisma = new PrismaClient();
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

function adfToText(doc: any): string {
  if (!doc) return "";
  if (typeof doc === 'string') return doc;
  
  let text = "";
  
  // Handle text nodes
  if (doc.type === 'text' && doc.text) {
    text += doc.text;
  }
  
  // Handle mention nodes
  if (doc.type === 'mention' && doc.attrs?.text) {
    text += doc.attrs.text;
  }

  // Handle hardBreak nodes
  if (doc.type === 'hardBreak') {
    text += "\n";
  }

  // Recursively process children
  if (doc.content && Array.isArray(doc.content)) {
    doc.content.forEach((child: any) => {
      text += adfToText(child);
      // Add newlines for block-level elements
      if (['paragraph', 'heading', 'bulletList', 'orderedList', 'listItem', 'blockquote', 'codeBlock'].includes(child.type)) {
        text += "\n";
      }
    });
  }
  
  return text.trim();
}

async function getJiraClient(connectionId: string) {
  const connection = await prisma.connection.findUnique({ where: { id: connectionId } });
  if (!connection) throw new Error("Connection not found");

  // Normalize baseUrl: Remove trailing slashes and any /rest/api/X suffix
  let baseUrl = connection.baseUrl.replace(/\/$/, "");
  baseUrl = baseUrl.replace(/\/rest\/api\/\d+$/, "");
  baseUrl = baseUrl + "/";
  
  const headers: any = {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    'User-Agent': 'Requirement-Sync-App/1.0'
  };

  if (connection.authType === 'BEARER') {
    headers['Authorization'] = `Bearer ${connection.encryptedSecret}`;
  } else {
    const auth = Buffer.from(`${connection.username}:${connection.encryptedSecret}`).toString('base64');
    headers['Authorization'] = `Basic ${auth}`;
  }

  return axios.create({
    baseURL: baseUrl,
    headers
  });
}

async function startServer() {
  const app = express();
  app.use(express.json());

  const PORT = 3000;

  // --- API Routes ---

  // Health
  app.get("/api/v1/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // Connections
  app.get("/api/v1/connections", async (req, res) => {
    try {
      const connections = await prisma.connection.findMany({
        orderBy: { createdAt: 'desc' }
      });
      // Mask secrets
      res.json(connections.map(c => ({ ...c, encryptedSecret: undefined })));
    } catch (e: any) {
      console.error("Failed to fetch connections:", e);
      res.status(500).json({ error: "Failed to fetch connections", details: e.message });
    }
  });

  app.post("/api/v1/connections", async (req, res) => {
    try {
      const { name, toolType, baseUrl, authType, username, secret } = req.body;
      
      if (!secret) {
        return res.status(400).json({ error: "Secret is required" });
      }

      const connection = await prisma.connection.create({
        data: {
          name,
          toolType,
          baseUrl,
          authType,
          username,
          encryptedSecret: secret, // In a real app, this would be encrypted
          maskedSecretPreview: (secret || "").substring(0, 4) + "********",
        }
      });
      await prisma.auditLog.create({
        data: { action: "CONNECTION_CREATED", entityType: "Connection", entityId: connection.id }
      });
      res.json(connection);
    } catch (e: any) {
      console.error("Failed to create connection:", e);
      res.status(500).json({ error: "Failed to save connection", details: e.message });
    }
  });

  app.post("/api/v1/connections/validate", async (req, res) => {
    const { baseUrl: rawBaseUrl, username, secret, toolType, authType } = req.body;
    try {
      // Normalize baseUrl
      let baseUrl = rawBaseUrl.replace(/\/$/, "");
      baseUrl = baseUrl.replace(/\/rest\/api\/\d+$/, "");
      baseUrl = baseUrl + "/";

      let headers: any = {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      };

      if (authType === 'BEARER') {
        headers['Authorization'] = `Bearer ${secret}`;
      } else {
        const auth = Buffer.from(`${username}:${secret}`).toString('base64');
        headers['Authorization'] = `Basic ${auth}`;
      }

      const client = axios.create({
        baseURL: baseUrl,
        headers,
        timeout: 10000 // Add timeout
      });

      console.log(`[VALIDATE] Validating ${toolType} at ${baseUrl}`);

      if (toolType === 'ZEPHYR_ESSENTIAL') {
        // Zephyr Essential validation endpoint
        await client.get('v2/projects');
      } else {
        // Jira validation endpoint
        await client.get('rest/api/3/myself');
      }

      res.json({ status: "SUCCESS", message: "Connection validated successfully" });
    } catch (e: any) {
      console.error(`${toolType} validation failed:`, e.response?.data || e.message);
      const errorMsg = e.response?.data?.errorMessages?.[0] || e.response?.data?.message || e.message || `Failed to connect to ${toolType}. Check your credentials and Base URL.`;
      res.status(400).json({ 
        status: "FAILED", 
        message: errorMsg
      });
    }
  });

  app.delete("/api/v1/connections/:id", async (req, res) => {
    await prisma.connection.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  });

  // Workspaces
  app.get("/api/v1/workspaces", async (req, res) => {
    try {
      const workspaces = await prisma.workspace.findMany({
        include: { jiraConnection: true, targetConnection: true },
        orderBy: { createdAt: 'desc' }
      });
      res.json(workspaces);
    } catch (e: any) {
      console.error("Failed to fetch workspaces:", e);
      res.status(500).json({ error: "Failed to fetch workspaces", details: e.message });
    }
  });

  app.post("/api/v1/workspaces", async (req, res) => {
    const { name, jiraConnectionId, targetConnectionId, projectKey, testCaseFormat, automationFramework } = req.body;
    const workspace = await prisma.workspace.create({
      data: {
        name,
        jiraConnectionId,
        targetConnectionId,
        projectKey,
        testCaseFormat: testCaseFormat || "STANDARD",
        automationFramework: automationFramework || "PLAYWRIGHT",
        status: "ACTIVE"
      }
    });
    await prisma.auditLog.create({
      data: { action: "WORKSPACE_CREATED", entityType: "Workspace", entityId: workspace.id }
    });
    res.json(workspace);
  });

  app.get("/api/v1/workspaces/:id", async (req, res) => {
    const workspace = await prisma.workspace.findUnique({
      where: { id: req.params.id },
      include: { jiraConnection: true, targetConnection: true }
    });
    res.json(workspace);
  });

  app.patch("/api/v1/workspaces/:id", async (req, res) => {
    console.log(`[WORKSPACE] Updating workspace ${req.params.id}:`, JSON.stringify(req.body, null, 2));
    const workspace = await prisma.workspace.update({
      where: { id: req.params.id },
      data: req.body
    });
    res.json(workspace);
  });

  // Discovery
  app.get("/api/v1/connections/:id/projects", async (req, res) => {
    try {
      const client = await getJiraClient(req.params.id);
      const projectsRes = await client.get('rest/api/3/project');
      const projects = projectsRes.data.map((p: any) => ({
        key: p.key,
        name: p.name
      }));
      res.json(projects);
    } catch (e: any) {
      console.error("Project discovery failed:", e.response?.data || e.message);
      res.status(500).json({ error: "Failed to fetch projects from Jira" });
    }
  });

  app.post("/api/v1/workspaces/:id/context", async (req, res) => {
    const workspace = await prisma.workspace.findUnique({ 
      where: { id: req.params.id },
      include: { jiraConnection: true }
    });
    if (!workspace || !workspace.jiraConnection) return res.status(404).json({ error: "Workspace or connection not found" });

    try {
      const client = await getJiraClient(workspace.jiraConnectionId);
      
      console.log(`[CONTEXT] Detecting context for Workspace: ${workspace.id}`);
      console.log(`[CONTEXT] Project Key: ${workspace.projectKey}`);

      let detected = { type: "PROJECT", externalId: null as string | null, name: `Project: ${workspace.projectKey}`, state: "ACTIVE" };

      try {
        // 1. Get Boards for the project (Agile API)
        console.log(`[CONTEXT] Fetching boards...`);
        const boardsRes = await client.get(`rest/agile/1.0/board?projectKeyOrId=${workspace.projectKey}`);
        const boards = boardsRes.data.values || [];
        console.log(`[CONTEXT] Found ${boards.length} boards`);
        
        // Try to find a board that mentions the project key in its name or is the first one
        const board = boards.find((b: any) => b.name.includes(workspace.projectKey)) || boards[0];
        
        if (board) {
          console.log(`[CONTEXT] Using board: ${board.name} (ID: ${board.id})`);
          // 2. Get Sprints for the board
          const sprintsRes = await client.get(`rest/agile/1.0/board/${board.id}/sprint`);
          const sprints = sprintsRes.data.values || [];
          console.log(`[CONTEXT] Found ${sprints.length} sprints`);
          
          const activeSprint = sprints.find((s: any) => s.state === 'active');
          if (activeSprint) {
            console.log(`[CONTEXT] Detected active sprint: ${activeSprint.name} (ID: ${activeSprint.id})`);
            detected = { type: "SPRINT", externalId: activeSprint.id.toString(), name: activeSprint.name, state: "ACTIVE" };
          } else {
            console.log("[CONTEXT] No active sprint found on board");
          }
        } else {
          console.log("[CONTEXT] No board found for project");
        }
      } catch (agileErr: any) {
        console.warn("Agile API not available or failed, falling back to project context", agileErr.response?.data || agileErr.message);
      }

      const updated = await prisma.workspace.update({
        where: { id: req.params.id },
        data: {
          planningContextType: detected.type,
          planningContextExternalId: detected.externalId,
          planningContextName: detected.name,
          planningContextState: detected.state
        }
      });

      await prisma.auditLog.create({
        data: { action: "CONTEXT_DETECTED", entityType: "Workspace", entityId: workspace.id, metadataJson: JSON.stringify(detected) }
      });

      res.json(updated);
    } catch (e: any) {
      console.error("Context detection failed:", e.response?.data || e.message);
      const errorDetails = e.response?.data?.errorMessages?.[0] || e.message;
      res.status(500).json({ error: `Failed to detect context: ${errorDetails}` });
    }
  });

  app.get("/api/v1/workspaces/:id/project-info", async (req, res) => {
    const workspace = await prisma.workspace.findUnique({ 
      where: { id: req.params.id },
      include: { jiraConnection: true }
    });
    if (!workspace || !workspace.jiraConnection) return res.status(404).json({ error: "Workspace or connection not found" });

    try {
      const client = await getJiraClient(workspace.jiraConnectionId);
      const projectRes = await client.get(`rest/api/3/project/${workspace.projectKey}`);
      const issueTypesRes = await client.get(`rest/api/3/issuetype`);
      
      res.json({
        project: projectRes.data,
        availableIssueTypes: issueTypesRes.data.map((it: any) => it.name)
      });
    } catch (e: any) {
      res.status(500).json({ error: e.message, details: e.response?.data });
    }
  });

  app.post("/api/v1/workspaces/:id/sync-requirements", async (req, res) => {
    const { forceFull } = req.body;
    const workspace = await prisma.workspace.findUnique({ 
      where: { id: req.params.id },
      include: { jiraConnection: true }
    });
    if (!workspace || !workspace.jiraConnection) return res.status(404).json({ error: "Workspace or connection not found" });

    try {
      const client = await getJiraClient(workspace.jiraConnectionId);
      
      // LOGS for Task 4
      console.log(`[SYNC START] Workspace ID: ${workspace.id}`);
      console.log(`[SYNC START] Context Type: ${workspace.planningContextType}`);
      console.log(`[SYNC START] Context Name: ${workspace.planningContextName}`);
      console.log(`[SYNC START] Project Key: ${workspace.projectKey}`);

      // 1. Discover project (more robust than direct lookup)
      let project;
      try {
        console.log(`Jira Sync: Discovering project "${workspace.projectKey}"...`);
        const allProjectsRes = await client.get(`rest/api/3/project`);
        const allProjects = allProjectsRes.data;
        
        // Try to find by key, ID, or name
        project = allProjects.find((p: any) => 
          p.key.toLowerCase() === workspace.projectKey.toLowerCase() || 
          p.id === workspace.projectKey ||
          p.id === "10034" ||
          p.name.toLowerCase() === workspace.projectKey.toLowerCase()
        );

        if (!project) {
          console.log("Jira Sync: Project not found in list, trying direct lookup...");
          // Fallback to direct lookup if not in list
          const directRes = await client.get(`rest/api/3/project/${workspace.projectKey}`);
          project = directRes.data;
        }

        console.log(`Jira Sync: Successfully resolved project to Key: ${project.key}, ID: ${project.id}`);
      } catch (err: any) {
        console.error(`Jira Sync: Project discovery failed:`, err.response?.data || err.message);
        return res.status(400).json({ 
          error: `Could not find Jira project "${workspace.projectKey}".`,
          details: err.response?.data || err.message
        });
      }

      const safeFields = "summary,description,status,priority,issuetype,updated,comment";
      const customFields = "customfield_10016,customfield_10100"; // Common AC fields
      
      let searchRes;
      let lastUsedJql = "";

      const trySearch = async (jql: string, fields: string) => {
        lastUsedJql = jql;
        const fieldList = fields.split(',').map(f => f.trim()).filter(Boolean);
        
        const executeRequest = async (currentJql: string, currentFields: string[]) => {
          console.log(`Jira Sync: Executing search [JQL: ${currentJql}] [Fields: ${currentFields.join(',')}]`);
          
          const apiVersions = ['rest/api/3/search/jql', 'rest/api/3/search', 'rest/api/2/search'];
          let lastErr: any;

          for (const apiVer of apiVersions) {
            try {
              console.log(`Jira Sync: Trying ${apiVer} (POST)...`);
              const response = await client.post(apiVer, {
                jql: currentJql,
                maxResults: 100, // Increased for Task 1
                fields: currentFields
              });
              console.log(`Jira Sync: ${apiVer} POST Success. Found ${response.data.issues?.length || 0} issues.`);
              return response;
            } catch (postErr: any) {
              const status = postErr.response?.status;
              console.warn(`Jira ${apiVer} POST Failed (Status ${status})`);
              
              if (status !== 404 && status !== 405 && status !== 410) {
                // Try GET on the same version before moving to next version
                try {
                  console.log(`Jira Sync: Trying ${apiVer} (GET)...`);
                  const params = new URLSearchParams({
                    jql: currentJql,
                    maxResults: "100",
                    fields: currentFields.join(',')
                  });
                  const response = await client.get(`${apiVer}?${params.toString()}`);
                  console.log(`Jira Sync: ${apiVer} GET Success. Found ${response.data.issues?.length || 0} issues.`);
                  return response;
                } catch (getErr: any) {
                  console.warn(`Jira ${apiVer} GET Failed (Status ${getErr.response?.status})`);
                  lastErr = getErr;
                }
              } else {
                lastErr = postErr;
              }
            }
          }
          throw lastErr;
        };

        try {
          // Attempt 1: Full search
          return await executeRequest(jql, fieldList);
        } catch (err: any) {
          console.warn(`Jira Sync: Search failed with status ${err.response?.status}. Retrying with minimal fields...`);
          
          try {
            // Attempt 2: Minimal fields (Summary only)
            return await executeRequest(jql, ["summary"]);
          } catch (err2: any) {
            console.warn(`Jira Sync: Search failed even with minimal fields. Retrying with minimal JQL...`);
            
            // Attempt 3: Minimal JQL (Project only, no filters)
            const minimalJql = `project = ${project.id}`;
            if (jql !== minimalJql) {
              try {
                return await executeRequest(minimalJql, ["summary"]);
              } catch (err3: any) {
                console.error(`Jira Sync: Ultimate fallback failed:`, err3.response?.data || err3.message);
                throw err3;
              }
            }
            throw err2;
          }
        }
      };

      try {
        // Attempt 1: Context-aware search (The "Ideal" search)
        let jql = `project = "${project.key}"`; // Use Key in quotes for robustness
        
        if (!forceFull && workspace.planningContextType === 'SPRINT' && workspace.planningContextExternalId) {
          console.log(`[SYNC] Using Sprint Context: ${workspace.planningContextExternalId}`);
          jql += ` AND sprint = ${workspace.planningContextExternalId}`;
        } else if (!forceFull) {
          // If context is BACKLOG or not set, but we want "current sprint issues" (Task 5)
          // we can try to find the active sprint issues by searching the project
          // and filtering by active sprint in JQL if possible, or just fetch all and log.
          console.log(`[SYNC] Context is ${workspace.planningContextType}, fetching project issues...`);
          // Robust filtering (Task 6): allow more types or no filtering initially
          // jql += ` AND issuetype in (Story, Task, Bug, "User Story", "Sub-task", "Test", "Requirement")`;
        }
        
        searchRes = await trySearch(jql, `${safeFields},${customFields}`);
        
        if (searchRes.data.issues?.length === 0) {
           console.log("Attempt 1 returned 0, trying broader search...");
           throw new Error("No issues found with filters");
        }
      } catch (err1: any) {
        try {
          // Attempt 2: Broad Project Search (No filters)
          console.log("Attempt 2: Fetching ALL issues in project...");
          searchRes = await trySearch(`project = "${project.key}"`, safeFields);
          if (searchRes.data.issues?.length === 0) throw new Error("No issues in project at all");
        } catch (err2: any) {
          try {
            // Attempt 3: Key-based search (Last ditch JQL)
            console.log("Attempt 3: Searching by key prefix...");
            searchRes = await trySearch(`key ~ "${project.key}-*"`, "summary");
          } catch (err3: any) {
            // Attempt 4: Text search
            console.log("Attempt 4: Global text search...");
            searchRes = await trySearch(`text ~ "${project.key}"`, "summary");
          }
        }
      }
      
      const issues = searchRes.data.issues || [];
      const distinctTypes = [...new Set(issues.map((i: any) => i.fields?.issuetype?.name))];
      
      console.log(`[SYNC] Raw issue count: ${issues.length}`);
      console.log(`[SYNC] Distinct issue types: ${distinctTypes.join(', ')}`);
      
      const requirements = issues.map((issue: any) => {
        const fields = issue.fields || {};
        // Try multiple common custom fields for Acceptance Criteria
        const ac = fields.customfield_10016 || fields.customfield_10100 || "";
        
        // Extract comments
        const comments = fields.comment?.comments?.map((c: any) => {
          const author = c.author?.displayName || "Unknown";
          const body = adfToText(c.body);
          return `[${author}]: ${body}`;
        }).join("\n\n") || "";
        
        return {
          externalId: issue.id?.toString() || issue.key,
          key: issue.key,
          title: fields.summary || "Untitled Story",
          description: adfToText(fields.description),
          acceptanceCriteria: adfToText(ac) || "See description",
          status: fields.status?.name || "Unknown",
          priority: fields.priority?.name || "Medium",
          issueType: fields.issuetype?.name || "Story",
          comments: comments,
          rawPayloadJson: JSON.stringify(issue)
        };
      });

      console.log(`Jira Sync: Saving ${requirements.length} requirements to database`);
      let persistedCount = 0;
      for (const story of requirements) {
        try {
          await prisma.externalRequirementCache.upsert({
            where: {
              connectionId_externalId_workspaceId: {
                connectionId: workspace.jiraConnectionId,
                externalId: story.externalId,
                workspaceId: workspace.id
              }
            },
            create: {
              workspaceId: workspace.id,
              connectionId: workspace.jiraConnectionId,
              ...story,
              sourceType: "JIRA"
            },
            update: {
              ...story,
              syncedAt: new Date()
            }
          });
          persistedCount++;
        } catch (upsertErr: any) {
          console.error(`Failed to upsert requirement ${story.key}:`, upsertErr.message);
        }
      }

      const readBackCount = await prisma.externalRequirementCache.count({
        where: { workspaceId: workspace.id }
      });

      console.log(`[SYNC] Persisted record count: ${persistedCount}`);
      console.log(`[SYNC] Read-back count for workspace: ${readBackCount}`);

      await prisma.workspace.update({
        where: { id: workspace.id },
        data: { lastSyncedAt: new Date() }
      });

      await prisma.auditLog.create({
        data: { action: "REQUIREMENTS_SYNCED", entityType: "Workspace", entityId: workspace.id, metadataJson: JSON.stringify({ count: requirements.length }) }
      });

      res.json({ 
        success: true, 
        count: requirements.length,
        lastJql: lastUsedJql,
        debug: {
          projectKey: project.key,
          projectId: project.id,
          issuesFound: issues.length
        }
      });
    } catch (e: any) {
      const errorData = e.response?.data;
      console.error("Sync failed:", errorData ? JSON.stringify(errorData, null, 2) : e.message);
      res.status(500).json({ 
        error: "Jira Sync failed", 
        details: e.message,
        jiraResponse: errorData
      });
    }
  });

  app.get("/api/v1/workspaces/:id/requirements", async (req, res) => {
    const requirements = await prisma.externalRequirementCache.findMany({
      where: { workspaceId: req.params.id },
      orderBy: { key: 'asc' }
    });
    res.json(requirements);
  });

  // Generation
  app.post("/api/v1/generation-batches", async (req, res) => {
    const { workspaceId, requirementIds } = req.body;
    
    const batch = await prisma.generationBatch.create({
      data: { workspaceId, status: "IN_PROGRESS" }
    });

    const requirements = await prisma.externalRequirementCache.findMany({
      where: { id: { in: requirementIds } }
    });

    const workspace = await prisma.workspace.findUnique({ where: { id: workspaceId } });
    const format = workspace?.testCaseFormat || "STANDARD";
    const aiProvider = (workspace?.aiProvider || "GEMINI").toUpperCase();

    console.log(`[GEN] Starting generation batch ${batch.id} for workspace ${workspaceId}`);
    console.log(`[GEN] AI Provider: ${aiProvider}`);
    console.log(`[GEN] Groq Key Present: ${!!(workspace?.groqApiKey || process.env.GROQ_API_KEY)}`);

    try {
      for (const reqObj of requirements) {
        console.log(`[GEN] Generating test cases for ${reqObj.key} using ${aiProvider}`);
        
        const prompt = `
          # QA Test Case Generation Assistant

          You are a professional QA assistant. Generate crisp, comprehensive, and structured test cases for the following Jira user story.

          ## INPUT DATA
          - SUMMARY: ${reqObj.title}
          - DESCRIPTION: ${reqObj.description || "N/A"}
          - ACCEPTANCE CRITERIA: ${reqObj.acceptanceCriteria || "N/A"}
          - COMMENTS/DISCUSSION: ${reqObj.comments || "N/A"}
          - TECHNICAL CONTEXT: ${reqObj.technicalContext || "N/A"}

          ## TEST CASE GENERATION RULES
          1. **Coverage**: Focus on RELEVANCE over quantity. Generate 3-7 highly relevant test cases covering Positive scenarios, Negative scenarios, and critical Edge cases.
          2. **Granularity**: Steps must be granular and sequential. Maintain a 1:1 mapping between each action and its specific expected result.
          3. **Format**: The test cases should be in ${format} format.
          4. **Labels**: Assign 2-3 relevant labels to each test case (e.g., 'Functional', 'Regression', 'UI'). Labels MUST NOT contain spaces (use underscores or hyphens instead).

          ## OUTPUT INSTRUCTIONS
          Return the response ONLY as a JSON object with a "testCases" array. 
          Each test case object must include:
          - title: A clear summary of the test case.
          - preconditions: Any setup required, including specific **Test Data**.
          - steps: An array of objects, each with:
            - action: The granular step to perform.
            - expectedResult: The specific expected result for THIS step.
          - expectedResult: The final overall successful outcome.
          - scenarioType: One of [FUNCTIONAL, NEGATIVE, EDGE_CASE, SECURITY].
          - priority: One of [High, Normal, Low].
          - labels: An array of relevant strings.
          - comments: Include any **Gap Analysis** (missing/unclear requirements), assumptions made, or brief explanations for edge cases.

          Always respond in valid JSON format.
        `;

        let testCases: any[] = [];

        if (aiProvider === "GROQ") {
          const apiKey = workspace?.groqApiKey || process.env.GROQ_API_KEY;
          if (!apiKey) {
            throw new Error("Groq API Key not found. Please configure it in Workspace Settings.");
          }
          const groq = new Groq({ apiKey });
          const completion = await groq.chat.completions.create({
            messages: [
              { role: "system", content: "You are a professional QA engineer. Always respond in valid JSON format." },
              { role: "user", content: prompt }
            ],
            model: workspace.groqModel || "llama-3.3-70b-versatile",
            response_format: { type: "json_object" }
          });
          const result = JSON.parse(completion.choices[0]?.message?.content || '{"testCases":[]}');
          testCases = result.testCases || [];
        } else {
          const response = await ai.models.generateContent({
            model: "gemini-3.1-pro-preview",
            contents: prompt,
            config: {
              responseMimeType: "application/json",
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  testCases: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        title: { type: Type.STRING },
                        preconditions: { type: Type.STRING },
                        steps: { 
                          type: Type.ARRAY, 
                          items: { 
                            type: Type.OBJECT,
                            properties: {
                              action: { type: Type.STRING },
                              expectedResult: { type: Type.STRING }
                            },
                            required: ["action", "expectedResult"]
                          } 
                        },
                        expectedResult: { type: Type.STRING },
                        scenarioType: { type: Type.STRING, description: "FUNCTIONAL, NEGATIVE, EDGE_CASE, or SECURITY" },
                        priority: { type: Type.STRING, description: "High, Normal, or Low" },
                        labels: { 
                          type: Type.ARRAY, 
                          items: { type: Type.STRING } 
                        },
                        comments: { type: Type.STRING }
                      },
                      required: ["title", "steps", "expectedResult", "scenarioType", "priority"]
                    }
                  }
                },
                required: ["testCases"]
              }
            }
          });
          const result = JSON.parse(response.text || '{"testCases":[]}');
          testCases = result.testCases || [];
        }

        for (const tc of testCases) {
          await prisma.generatedTestCase.create({
            data: {
              batchId: batch.id,
              requirementId: reqObj.id,
              sourceRequirementKey: reqObj.key,
              sourceRequirementTitle: reqObj.title,
              title: tc.title,
              preconditions: tc.preconditions || "",
              stepsJson: JSON.stringify(tc.steps),
              expectedResult: tc.expectedResult,
              scenarioType: tc.scenarioType,
              priority: tc.priority,
              comments: tc.comments || "",
              labels: Array.isArray(tc.labels) ? tc.labels.join(",") : ""
            }
          });
        }
      }

      await prisma.generationBatch.update({
        where: { id: batch.id },
        data: { status: "COMPLETED" }
      });
    } catch (genErr: any) {
      console.error("[GEN] Generation failed:", genErr);
      await prisma.generationBatch.update({
        where: { id: batch.id },
        data: { status: "FAILED" }
      });
    }

    await prisma.auditLog.create({
      data: { action: "GENERATION_COMPLETED", entityType: "GenerationBatch", entityId: batch.id }
    });

    res.json(batch);
  });

  app.get("/api/v1/workspaces/:id/test-cases", async (req, res) => {
    const testCases = await prisma.generatedTestCase.findMany({
      where: { requirement: { workspaceId: req.params.id } },
      orderBy: { createdAt: 'desc' }
    });
    res.json(testCases);
  });

  app.patch("/api/v1/test-cases/:id", async (req, res) => {
    const tc = await prisma.generatedTestCase.update({
      where: { id: req.params.id },
      data: req.body
    });
    res.json(tc);
  });

  app.post("/api/v1/test-cases/:id/approve", async (req, res) => {
    const updated = await prisma.generatedTestCase.update({
      where: { id: req.params.id },
      data: { status: "APPROVED" }
    });
    res.json(updated);
  });

  app.post("/api/v1/test-cases/:id/generate-script", async (req, res) => {
    const tc = await prisma.generatedTestCase.findUnique({ 
      where: { id: req.params.id },
      include: { batch: { include: { workspace: true } } }
    });
    if (!tc) return res.status(404).json({ error: "Test case not found" });

    const framework = tc.batch.workspace.automationFramework;
    const aiProvider = (tc.batch.workspace.aiProvider || "GEMINI").toUpperCase();
    
    console.log(`[SCRIPT] Generating script for ${tc.id} using ${aiProvider}`);
    console.log(`[SCRIPT] Groq Key Present: ${!!(tc.batch.workspace.groqApiKey || process.env.GROQ_API_KEY)}`);

    const prompt = `
      Generate a ${framework} automation script for the following test case.
      
      TITLE: ${tc.title}
      PRECONDITIONS: ${tc.preconditions || "N/A"}
      STEPS: ${JSON.parse(tc.stepsJson).join(", ")}
      EXPECTED RESULT: ${tc.expectedResult}
      
      The script should be a complete, runnable file.
      Include necessary imports and basic structure.
      Assume a standard setup for ${framework}.
      Only return the code, no markdown formatting.
    `;

    let script = "";
    if (aiProvider === "GROQ") {
      const apiKey = tc.batch.workspace.groqApiKey || process.env.GROQ_API_KEY;
      if (!apiKey) {
        throw new Error("Groq API Key not found. Please configure it in Workspace Settings.");
      }
      const groq = new Groq({ apiKey });
      const completion = await groq.chat.completions.create({
        messages: [{ role: "user", content: prompt }],
        model: tc.batch.workspace.groqModel || "llama-3.3-70b-versatile",
      });
      script = completion.choices[0]?.message?.content || "";
    } else {
      const response = await ai.models.generateContent({
        model: "gemini-3.1-pro-preview",
        contents: prompt,
      });
      script = response.text || "";
    }

    // Clean up markdown if AI included it
    script = script.replace(/^```[a-z]*\n/i, '').replace(/\n```$/i, '');

    const updated = await prisma.generatedTestCase.update({
      where: { id: req.params.id },
      data: { automationScript: script }
    });

    res.json(updated);
  });

  app.get("/api/v1/workspaces/:id/coverage-analysis", async (req, res) => {
    // Mock coverage analysis
    res.json({
      score: 85,
      insights: [
        "Missing validation for session timeout scenarios.",
        "Consider adding edge cases for extremely long input strings in the username field.",
        "Requirement mentions 'Offline Mode' but no test cases cover network disconnection."
      ]
    });
  });

  app.patch("/api/v1/requirements/:id/technical-context", async (req, res) => {
    const { technicalContext } = req.body;
    const updated = await prisma.externalRequirementCache.update({
      where: { id: req.params.id },
      data: { technicalContext }
    });
    res.json(updated);
  });

  app.delete("/api/v1/test-cases/:id", async (req, res) => {
    await prisma.generatedTestCase.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  });

  // Push
  app.post("/api/v1/push-executions", async (req, res) => {
    const { workspaceId, testCaseIds } = req.body;
    
    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
      include: { targetConnection: true }
    });
    if (!workspace || !workspace.targetConnection) return res.status(404).json({ error: "Workspace or target connection not found" });

    const execution = await prisma.pushExecution.create({
      data: { workspaceId, status: "IN_PROGRESS" }
    });

    const testCases = await prisma.generatedTestCase.findMany({
      where: { id: { in: testCaseIds } },
      include: { requirement: true }
    });

    const secret = workspace.targetConnection.encryptedSecret; // In a real app we'd decrypt this
    const headers: any = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${secret}`
    };

    const client = axios.create({
      baseURL: workspace.targetConnection.baseUrl.endsWith('/') ? workspace.targetConnection.baseUrl : `${workspace.targetConnection.baseUrl}/`,
      headers
    });

    for (const tc of testCases) {
      try {
        console.log(`[PUSH] Pushing test case ${tc.id} to Zephyr...`);
        
        // Zephyr Scale Cloud API: POST /v2/testcases
        const steps = JSON.parse(tc.stepsJson).map((step: any) => ({
          inline: {
            description: step.action || step, // Fallback for old data
            expectedResult: step.expectedResult || tc.expectedResult
          }
        }));

        // Only include Jira link if it looks like a valid Jira key (e.g., PROJ-123)
        const jiraLinks = [];
        if (tc.sourceRequirementKey && /^[A-Z][A-Z0-9]+-\d+$/.test(tc.sourceRequirementKey)) {
          jiraLinks.push({
            issueKey: tc.sourceRequirementKey,
            relationshipName: "Relates"
          });
        }

        const payload = {
          projectKey: workspace.projectKey,
          name: tc.title,
          precondition: tc.preconditions || "",
          objective: tc.sourceRequirementTitle,
          priorityName: tc.priority || "Normal",
          statusName: "Draft",
          labels: tc.labels ? tc.labels.split(',').map((l: string) => l.trim().replace(/\s+/g, '_')) : [],
          testSteps: steps,
          links: jiraLinks.length > 0 ? jiraLinks : undefined
        };

        console.log(`[PUSH] Sending payload to Zephyr for ${tc.id}:`, JSON.stringify({ ...payload, testSteps: '...' }));

        let response;
        try {
          response = await client.post('v2/testcases', payload);
        } catch (e: any) {
          // If it failed with 404 and we had links, try one more time without links
          // as the Jira issue key might be the cause of the 404
          if (e.response?.status === 404 && jiraLinks.length > 0) {
            console.warn(`[PUSH] 404 detected for ${tc.id}, retrying without Jira links...`);
            const fallbackPayload = { ...payload, links: undefined };
            response = await client.post('v2/testcases', fallbackPayload);
          } else {
            throw e;
          }
        }

        const targetKey = response.data.key;
        const targetId = response.data.id.toString();

        await prisma.pushExecutionItem.create({
          data: {
            pushExecutionId: execution.id,
            generatedTestCaseId: tc.id,
            sourceRequirementExternalId: tc.requirement.externalId,
            targetExternalTestCaseId: targetId,
            targetExternalTestCaseKey: targetKey,
            createStatus: "SUCCESS",
            linkStatus: "SUCCESS"
          }
        });

        // Create Traceability Link
        await prisma.traceabilityLink.create({
          data: {
            workspaceId,
            requirementId: tc.requirementId,
            generatedTestCaseId: tc.id,
            targetExternalTestCaseId: targetId,
            targetExternalTestCaseKey: targetKey
          }
        });

        // Update Test Case Status
        await prisma.generatedTestCase.update({
          where: { id: tc.id },
          data: { status: "PUSHED" }
        });
      } catch (e: any) {
        console.error(`[PUSH] Failed to push test case ${tc.id}:`, e.response?.data || e.message);
        await prisma.pushExecutionItem.create({
          data: {
            pushExecutionId: execution.id,
            generatedTestCaseId: tc.id,
            sourceRequirementExternalId: tc.requirement.externalId,
            createStatus: "FAILED",
            linkStatus: "FAILED",
            errorMessage: JSON.stringify(e.response?.data || e.message)
          }
        });
      }
    }

    await prisma.pushExecution.update({
      where: { id: execution.id },
      data: { status: "COMPLETED", completedAt: new Date() }
    });

    await prisma.auditLog.create({
      data: { action: "PUSH_COMPLETED", entityType: "PushExecution", entityId: execution.id }
    });

    res.json(execution);
  });

  app.get("/api/v1/workspaces/:id/push-executions", async (req, res) => {
    const executions = await prisma.pushExecution.findMany({
      where: { workspaceId: req.params.id },
      include: { items: true },
      orderBy: { createdAt: 'desc' }
    });
    res.json(executions);
  });

  // Audit
  app.get("/api/v1/audit-logs", async (req, res) => {
    const logs = await prisma.auditLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50
    });
    res.json(logs);
  });

  // Manual Import Route
  app.post("/api/v1/workspaces/:id/manual-import", async (req, res) => {
    const { jsonData } = req.body;
    const workspaceId = req.params.id;

    try {
      const workspace = await prisma.workspace.findUnique({ where: { id: workspaceId } });
      if (!workspace) return res.status(404).json({ error: "Workspace not found" });

      const data = typeof jsonData === 'string' ? JSON.parse(jsonData) : jsonData;
      const issues = data.issues || (Array.isArray(data) ? data : []);
      
      if (issues.length === 0) {
        return res.status(400).json({ error: "No issues found in the provided JSON." });
      }

      const requirements = issues.map((issue: any) => {
        const fields = issue.fields || {};
        const ac = fields.customfield_10016 || fields.customfield_10100 || issue.acceptanceCriteria || "";
        
        // Extract comments from manual import if available
        let comments = "";
        if (fields.comment?.comments) {
          comments = fields.comment.comments.map((c: any) => {
            const author = c.author?.displayName || "Unknown";
            const body = adfToText(c.body);
            return `[${author}]: ${body}`;
          }).join("\n\n");
        } else if (issue.comments) {
          comments = Array.isArray(issue.comments) ? issue.comments.join("\n\n") : issue.comments;
        }

        return {
          workspaceId,
          connectionId: workspace.jiraConnectionId,
          externalId: issue.id?.toString() || issue.key,
          key: issue.key || "REQ",
          title: fields.summary || issue.summary || "Untitled",
          description: adfToText(fields.description || issue.description),
          acceptanceCriteria: adfToText(ac) || "See description",
          status: fields.status?.name || issue.status || "To Do",
          priority: fields.priority?.name || issue.priority || "Medium",
          issueType: fields.issuetype?.name || issue.issueType || issue.type || "Story",
          comments: comments,
          sourceType: "MANUAL",
          rawPayloadJson: JSON.stringify(issue)
        };
      });

      // Upsert requirements
      for (const reqData of requirements) {
        await prisma.externalRequirementCache.upsert({
          where: {
            connectionId_externalId_workspaceId: {
              connectionId: workspace.jiraConnectionId,
              externalId: reqData.externalId,
              workspaceId: workspaceId
            }
          },
          update: reqData,
          create: reqData
        });
      }

      await prisma.workspace.update({
        where: { id: workspaceId },
        data: { lastSyncedAt: new Date() }
      });

      res.json({ success: true, count: requirements.length });
    } catch (err: any) {
      res.status(400).json({ error: "Invalid JSON format: " + err.message });
    }
  });

  // --- Vite Integration ---
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(console.error);
