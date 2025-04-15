## New Features

### 1. Polygon Area Calculation Job
This job calculates the area of a polygon from the GeoJSON provided in the task.

#### Testing:
1. Add a task with `taskType: "polygonArea"` to a workflow YAML file.
2. Start the application and create a workflow using the `/analysis` endpoint.
   ```bash
   curl -X POST http://localhost:3000/analysis \
   -H "Content-Type: application/json" \
   -d '{
    "clientId": "client123",
    "geoJson": {
        "type": "Polygon",
        "coordinates": [
            [
                [
                    -63.624885020050996,
                    -10.311050368263523
                ],
                [
                    -63.624885020050996,
                    -10.367865108370523
                ],
                [
                    -63.61278302732815,
                    -10.367865108370523
                ],
                [
                    -63.61278302732815,
                    -10.311050368263523
                ],
                [
                    -63.624885020050996,
                    -10.311050368263523
                ]
            ]
        ]
    }
    }'
   ```
3. Check the task's `output` field in the database or logs in the terminal for the calculated area.

### On Success:
- The task's `output` field should contain the calculated area and specified unit (square meters)

### On Failure:
- The task's `output` field should contain the error message
- The task's `status` is set to `failed`

### Notes:
GeoJSON object is validated based on RFC 7946. (see https://datatracker.ietf.org/doc/html/rfc7946#section-3)

---

### 2. Report Generation Job
This job aggregates the outputs of all preceding tasks (based on `stepNumber`) in a workflow into a JSON report.

#### Testing:
1. Add a task with `taskType: "reportGeneration"` and specify `stepNumber` in a workflow YAML file.
2. Start the application and create a workflow using the `/analysis` endpoint.
3. Check the task's `output` field in the database or logs for the generated report.
4. Ensure the job runs only after all preceding tasks are complete.

### On Success:
- The task's `output` field should contain the aggregated outputs from preceding tasks in the same workflow.
- The tasks's `finalReport` field should contain information if any tasks within the workflow failed or if every task successfully completed


### On Failure:
- The task's `output` field should contain the error message
- The task's `status` is set to `failed`

### Notes:
Preceding tasks are determined by `stepNumber` specified in the workflow YAML file.
---

### 3. Interdependent Tasks in Workflows
Tasks can now depend on the outputs of earlier tasks.

#### Testing:
1. Update a workflow YAML file to include `dependsOn` for tasks:
   ```yaml
   steps:
     - taskType: "polygonArea"
       stepNumber: 1
     - taskType: "dataAnalysis"
       stepNumber: 2
       dependsOn: 1
   ```
2. Start the application and create a workflow using the `/analysis` endpoint.
3. Verify that the dependent task waits for its dependency to complete and uses its output.

### On Success:
- The task's `input` field should contain the `output` of the task it depends on.

### On Failure:
- Normal flow for task failure
- The task's `input` field should contain the `output` of the task it depends on. (error message)

### Notes:
Failing prerequisite tasks will still set the `output` of the dependent task using its `input`

---

### 4. Final Workflow Results
The aggregated results of all tasks in a workflow are saved in the `finalResult` field of the `Workflow` entity.

#### Testing:
1. Create a workflow with multiple tasks.
2. Wait for all tasks to complete.
3. Check the `finalResult` field of the workflow in the database for the aggregated results.

### On Success:
- The workflow's `finalResult` field should contain the aggregated `output` of all completed tasks in the workflow.

### On Failure:
- The workflow's `finalResult` field should contain the aggregated `output` of all failing tasks in the workflow. (error messages)

### Notes:
`finalResult` is not set for workflows that are still `in_progress`

---

### 5. Workflow Status Endpoint
Retrieve the current status of a workflow.

#### Endpoint:
- **URL:** `/workflow/:id/status`
- **Method:** `GET`

#### Testing:
1. Start the application and create a workflow using the `/analysis` endpoint.
   ```bash
   curl -X POST http://localhost:3000/analysis \
   -H "Content-Type: application/json" \
   -d '{
    "clientId": "client123",
    "geoJson": {
        "type": "Polygon",
        "coordinates": [
            [
                [
                    -63.624885020050996,
                    -10.311050368263523
                ],
                [
                    -63.624885020050996,
                    -10.367865108370523
                ],
                [
                    -63.61278302732815,
                    -10.367865108370523
                ],
                [
                    -63.61278302732815,
                    -10.311050368263523
                ],
                [
                    -63.624885020050996,
                    -10.311050368263523
                ]
            ]
        ]
    }
    }'
   ```
2. Use the following command to check the status of the created workflow:
   ```bash
   curl -X GET http://localhost:3000/workflow/<workflow-id>/status
   ```
3. Verify the response includes the workflow status, completed tasks, and total tasks.

### On Success:
- Receive a response which includes number of completed tasks and the total number of tasks in the workflow
```
{
    "workflowId": "12345",
    "status": "in_progress", // "initial", "in_progress", "completed", "failed"
    "completedTasks": 3,
    "totalTasks": 5
}
 ```

### On Failure:
- Receive a response with a corresponding error status and message:
    - 404 - Workflow not found
    - 500 - Failed to fetch workflow results

### Notes:
Make sure a workflow is created and the schema is not cleared before accessing this API

---

### 6. Workflow Results Endpoint
Retrieve the final results of a completed workflow.

#### Endpoint:
- **URL:** `/workflow/:id/results`
- **Method:** `GET`

#### Testing:
1. Start the application and create a workflow using the `/analysis` endpoint.
   ```bash
   curl -X POST http://localhost:3000/analysis \
   -H "Content-Type: application/json" \
   -d '{
    "clientId": "client123",
    "geoJson": {
        "type": "Polygon",
        "coordinates": [
            [
                [
                    -63.624885020050996,
                    -10.311050368263523
                ],
                [
                    -63.624885020050996,
                    -10.367865108370523
                ],
                [
                    -63.61278302732815,
                    -10.367865108370523
                ],
                [
                    -63.61278302732815,
                    -10.311050368263523
                ],
                [
                    -63.624885020050996,
                    -10.311050368263523
                ]
            ]
        ]
    }
    }'
   ```
2. Use the following command to retrieve the results of a completed workflow:
   ```bash
   curl -X GET http://localhost:3000/workflow/<workflow-id>/results
   ```
3. Verify the response includes the `finalResult` field if the workflow is completed. If not, ensure appropriate error responses are returned.

### On Success:
- Receive a response which includes number of completed tasks and the total number of tasks in the workflow
```
{
    "workflowId": "12345",
    "status": "Completed",
    "finalResult": {
        "output": "[JSON Stringified output of the tasks in the workflow]",
    }
 }
 ```

### On Failure:
- Receive a response with a corresponding error status and message:
    - 400 - Workflow is not completed
    - 404 - Workflow not found
    - 500 - Failed to fetch workflow results

### Notes:
Make sure a workflow is created and the schema is not cleared before accessing this API

---

### Endnotes
- Ensure the database is properly configured before testing.
- Use the logs to debug any issues during task execution or workflow processing.

---

# Backend Coding Challenge

This repository demonstrates a backend architecture that handles asynchronous tasks, workflows, and job execution using TypeScript, Express.js, and TypeORM. The project showcases how to:

- Define and manage entities such as `Task` and `Workflow`.
- Use a `WorkflowFactory` to create workflows from YAML configurations.
- Implement a `TaskRunner` that executes jobs associated with tasks and manages task and workflow states.
- Run tasks asynchronously using a background worker.

## Key Features

1. **Entity Modeling with TypeORM**  
   - **Task Entity:** Represents an individual unit of work with attributes like `taskType`, `status`, `progress`, and references to a `Workflow`.
   - **Workflow Entity:** Groups multiple tasks into a defined sequence or steps, allowing complex multi-step processes.

2. **Workflow Creation from YAML**  
   - Use `WorkflowFactory` to load workflow definitions from a YAML file.
   - Dynamically create workflows and tasks without code changes by updating YAML files.

3. **Asynchronous Task Execution**  
   - A background worker (`taskWorker`) continuously polls for `queued` tasks.
   - The `TaskRunner` runs the appropriate job based on a task’s `taskType`.

4. **Robust Status Management**  
   - `TaskRunner` updates the status of tasks (from `queued` to `in_progress`, `completed`, or `failed`).
   - Workflow status is evaluated after each task completes, ensuring you know when the entire workflow is `completed` or `failed`.

5. **Dependency Injection and Decoupling**  
   - `TaskRunner` takes in only the `Task` and determines the correct job internally.
   - `TaskRunner` handles task state transitions, leaving the background worker clean and focused on orchestration.

## Project Structure

```
src
├─ models/
│   ├─ world_data.json  # Contains world data for analysis
│   
├─ models/
│   ├─ Result.ts        # Defines the Result entity
│   ├─ Task.ts          # Defines the Task entity
│   ├─ Workflow.ts      # Defines the Workflow entity
│   
├─ jobs/
│   ├─ Job.ts           # Job interface
│   ├─ JobFactory.ts    # getJobForTaskType function for mapping taskType to a Job
│   ├─ TaskRunner.ts    # Handles job execution & task/workflow state transitions
│   ├─ DataAnalysisJob.ts (example)
│   ├─ EmailNotificationJob.ts (example)
│
├─ workflows/
│   ├─ WorkflowFactory.ts  # Creates workflows & tasks from a YAML definition
│
├─ workers/
│   ├─ taskWorker.ts    # Background worker that fetches queued tasks & runs them
│
├─ routes/
│   ├─ analysisRoutes.ts # POST /analysis endpoint to create workflows
│
├─ data-source.ts       # TypeORM DataSource configuration
└─ index.ts             # Express.js server initialization & starting the worker
```

## Getting Started

### Prerequisites
- Node.js (LTS recommended)
- npm or yarn
- SQLite or another supported database

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/yourusername/backend-coding-challenge.git
   cd backend-coding-challenge
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure TypeORM:**
    - Edit `data-source.ts` to ensure the `entities` array includes `Task` and `Workflow` entities.
    - Confirm database settings (e.g. SQLite file path).

4. **Create or Update the Workflow YAML:**
    - Place a YAML file (e.g. `example_workflow.yml`) in a `workflows/` directory.
    - Define steps, for example:
      ```yaml
      name: "example_workflow"
      steps:
        - taskType: "analysis"
          stepNumber: 1
        - taskType: "notification"
          stepNumber: 2
      ```

### Running the Application

1. **Compile TypeScript (optional if using `ts-node`):**
   ```bash
   npx tsc
   ```

2. **Start the server:**
   ```bash
   npm start
   ```

   If using `ts-node`, this will start the Express.js server and the background worker after database initialization.

3. **Create a Workflow (e.g. via `/analysis`):**
   ```bash
   curl -X POST http://localhost:3000/analysis \
   -H "Content-Type: application/json" \
   -d '{
    "clientId": "client123",
    "geoJson": {
        "type": "Polygon",
        "coordinates": [
            [
                [
                    -63.624885020050996,
                    -10.311050368263523
                ],
                [
                    -63.624885020050996,
                    -10.367865108370523
                ],
                [
                    -63.61278302732815,
                    -10.367865108370523
                ],
                [
                    -63.61278302732815,
                    -10.311050368263523
                ],
                [
                    -63.624885020050996,
                    -10.311050368263523
                ]
            ]
        ]
    }
    }'
   ```

   This will read the configured workflow YAML, create a workflow and tasks, and queue them for processing.

4. **Check Logs:**
    - The worker picks up tasks from `queued` state.
    - `TaskRunner` runs the corresponding job (e.g., data analysis, email notification) and updates states.
    - Once tasks are done, the workflow is marked as `completed`.


### **Coding Challenge Tasks for the Interviewee**

The following tasks must be completed to enhance the backend system:

---

### **1. Add a New Job to Calculate Polygon Area**
**Objective:**  
Create a new job class to calculate the area of a polygon from the GeoJSON provided in the task.

#### **Steps:**
1. Create a new job file `PolygonAreaJob.ts` in the `src/jobs/` directory.
2. Implement the `Job` interface in this new class.
3. Use `@turf/area` to calculate the polygon area from the `geoJson` field in the task.
4. Save the result in the `output` field of the task.

#### **Requirements:**
- The `output` should include the calculated area in square meters.
- Ensure that the job handles invalid GeoJSON gracefully and marks the task as failed.

---

### **2. Add a Job to Generate a Report**
**Objective:**  
Create a new job class to generate a report by aggregating the outputs of multiple tasks in the workflow.

#### **Steps:**
1. Create a new job file `ReportGenerationJob.ts` in the `src/jobs/` directory.
2. Implement the `Job` interface in this new class.
3. Aggregate outputs from all preceding tasks in the workflow into a JSON report. For example:
   ```json
   {
       "workflowId": "<workflow-id>",
       "tasks": [
           { "taskId": "<task-1-id>", "type": "polygonArea", "output": "<area>" },
           { "taskId": "<task-2-id>", "type": "dataAnalysis", "output": "<analysis result>" }
       ],
       "finalReport": "Aggregated data and results"
   }
   ```
4. Save the report as the `output` of the `ReportGenerationJob`.

#### **Requirements:**
- Ensure the job runs only after all preceding tasks are complete.
- Handle cases where tasks fail, and include error information in the report.

---

### **3. Support Interdependent Tasks in Workflows**
**Objective:**  
Modify the system to support workflows with tasks that depend on the outputs of earlier tasks.

#### **Steps:**
1. Update the `Task` entity to include a `dependency` field that references another task
2. Modify the `TaskRunner` to wait for dependent tasks to complete and pass their outputs as inputs to the current task.
3. Extend the workflow YAML format to specify task dependencies (e.g., `dependsOn`).
4. Update the `WorkflowFactory` to parse dependencies and create tasks accordingly.

#### **Requirements:**
- Ensure dependent tasks do not execute until their dependencies are completed.
- Test workflows where tasks are chained through dependencies.

---

### **4. Ensure Final Workflow Results Are Properly Saved**
**Objective:**  
Save the aggregated results of all tasks in the workflow as the `finalResult` field of the `Workflow` entity.

#### **Steps:**
1. Modify the `Workflow` entity to include a `finalResult` field:
2. Aggregate the outputs of all tasks in the workflow after the last task completes.
3. Save the aggregated results in the `finalResult` field.

#### **Requirements:**
- The `finalResult` must include outputs from all completed tasks.
- Handle cases where tasks fail, and include failure information in the final result.

---

### **5. Create an Endpoint for Getting Workflow Status**
**Objective:**  
Implement an API endpoint to retrieve the current status of a workflow.

#### **Endpoint Specification:**
- **URL:** `/workflow/:id/status`
- **Method:** `GET`
- **Response Example:**
   ```json
   {
       "workflowId": "3433c76d-f226-4c91-afb5-7dfc7accab24",
       "status": "in_progress",
       "completedTasks": 3,
       "totalTasks": 5
   }
   ```

#### **Requirements:**
- Include the number of completed tasks and the total number of tasks in the workflow.
- Return a `404` response if the workflow ID does not exist.

---

### **6. Create an Endpoint for Retrieving Workflow Results**
**Objective:**  
Implement an API endpoint to retrieve the final results of a completed workflow.

#### **Endpoint Specification:**
- **URL:** `/workflow/:id/results`
- **Method:** `GET`
- **Response Example:**
   ```json
   {
       "workflowId": "3433c76d-f226-4c91-afb5-7dfc7accab24",
       "status": "completed",
       "finalResult": "Aggregated workflow results go here"
   }
   ```

#### **Requirements:**
- Return the `finalResult` field of the workflow if it is completed.
- Return a `404` response if the workflow ID does not exist.
- Return a `400` response if the workflow is not yet completed.

---

### **Deliverables**
- **Code Implementation:**
   - New jobs: `PolygonAreaJob` and `ReportGenerationJob`.
   - Enhanced workflow support for interdependent tasks.
   - Workflow final results aggregation.
   - New API endpoints for workflow status and results.

- **Documentation:**
   - Update the README file to include instructions for testing the new features.
   - Document the API endpoints with request and response examples.
