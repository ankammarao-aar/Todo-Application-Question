const express = require("express");
const path = require("path");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "todoApplication.db");

let db = null;

const initializeDB = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3003, () => {
      console.log("Server Running at http://localhost:3003/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};
initializeDB();

const hasPriorityAndStatus = (requestQuery) => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  );
};

const hasPriority = (requestQuery) => {
  return requestQuery.priority !== undefined;
};

const hasStatus = (requestQuery) => {
  return requestQuery.status !== undefined;
};

app.get("/todos/", async (request, response) => {
  let data = null;
  let getTodosQuery = "";
  const { search_q = "", priority, status } = request.query;

  switch (true) {
    case hasPriorityAndStatus(request.query):
      getTodosQuery = `
                SELECT
                    *
                FROM
                    todo
                WHERE
                    todo LIKE '%${search_q}%'
                    AND status = '${status}'
                    AND priority = '${priority}';`;
      break;
    case hasPriority(request.query):
      getTodosQuery = `
                SELECT
                    *
                FROM
                    todo
                WHERE
                    todo LIKE '%${search_q}%'
                    AND priority = '${priority}';`;
      break;
    case hasStatus(request.query):
      getTodosQuery = `
                SELECT 
                    *
                FROM
                    todo
                WHERE
                    todo LIKE '%${search_q}%'
                    AND status = '${status}';`;
      break;
    default:
      getTodosQuery = `
                SELECT 
                    *
                FROM
                    todo
                WHERE
                    todo LIKE '%${search_q}%';`;
  }
  data = await db.all(getTodosQuery);
  response.send(data);
});

app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const getTodoQuery = `
        SELECT 
            *
        FROM
            todo
        WHERE
            id = ${todoId};`;
  const todoDetails = await db.get(getTodoQuery);
  response.send(todoDetails);
});

app.post("/todos/", async (request, response) => {
  const { id, todo, priority, status } = request.body;
  const addTodoQuery = `
        INSERT INTO
            todo (id, todo, priority, status)
        VALUES
            (${id}, '${todo}', '${priority}', '${status}');`;
  await db.run(addTodoQuery);
  response.send("Todo Successfully Added");
});

app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const requestBody = request.body;
  let updateTodds = "";

  switch (true) {
    case requestBody.status !== undefined:
      updateTodds = "Status";
      break;
    case requestBody.priority !== undefined:
      updateTodds = "Priority";
      break;
    case requestBody.todo !== undefined:
      updateTodds = "Todo";
      break;
  }
  const prevTodoQuery = `
        SELECT 
            *
        FROM
            todo
        WHERE
            id = ${todoId};`;
  const previousTodo = await db.get(prevTodoQuery);
  const {
    todo = previousTodo.todo,
    priority = previousTodo.priority,
    status = previousTodo.status,
  } = request.body;

  const updateQuery = `
        UPDATE
            todo
        SET
            todo = '${todo}',
            priority = '${priority}',
            status = '${status}'
        WHERE
            id = ${todoId};`;
  await db.run(updateQuery);
  response.send(`${updateTodds} Updated`);
});

app.delete("/todos/:todoId", async (request, response) => {
  const { todoId } = request.params;
  const deleteTodoQuery = `
        DELETE FROM
            todo
        WHERE
            id = ${todoId};`;
  await db.run(deleteTodoQuery);
  response.send("Todo Deleted");
});

module.exports = app;
