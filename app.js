const express = require("express");
const app = express();
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
app.use(express.json());

const dbPath = path.join(__dirname, "todoApplication.db");
let db = null;

const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });

    app.listen(3000, () => {
      console.log("Server running at http://localhost:3000");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDbAndServer();

const convertTodoDbObjectToResponseObject = (dbObject) => {
  return {
    id: dbObject.id,
    todo: dbObject.todo,
    priority: dbObject.priority,
    status: dbObject.status,
    category: dbObject.category,
    dueDate: dbObject.due_date,
  };
};

const hasStatusProperty = (requestQuery) => {
  return requestQuery.status !== undefined;
};

const hasPropertyProperty = (requestQuery) => {
  return requestQuery.priority !== undefined;
};

const hasPriorityStatusProperty = (requestQuery) => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  );
};
const hasPropertyCategory = (requestQuery) => {
  return requestQuery.category !== undefined;
};

const hasCategoryStatusProperty = (requestQuery) => {
  return (
    requestQuery.category !== undefined && requestQuery.status !== undefined
  );
};

const hasCategoryPriorityProperty = (requestQuery) => {
  return (
    requestQuery.category !== undefined && requestQuery.priority !== undefined
  );
};

app.get("/todos/", async (request, response) => {
  const { status, priority, search_q, category } = request.query;
  let getTodoQuery = "";
  let arrayOf = null;
  switch (true) {
    case hasStatusProperty(request.query):
      getTodoQuery = `
          SELECT * FROM todo
          WHERE status = '${status}';`;
      break;
    case hasPropertyProperty(request.query):
      getTodoQuery = `
          SELECT * FROM todo
          WHERE priority = '${priority}';`;
      break;
    case hasPriorityStatusProperty(request.query):
      getTodoQuery = `
          SELECT * FROM todo
          WHERE priority = '${priority}'
          AND status = '${status}';`;
      break;
    case hasCategoryStatusProperty(request.query):
      getTodoQuery = `
          SELECT * FROM todo
          WHERE category = '${category}'
          AND status = '${status}';`;
      break;
    case hasPropertyCategory(request.query):
      getTodoQuery = `
          SELECT * FROM todo
          WHERE category = '${category}';`;
      break;
    case hasCategoryPriorityProperty(request.query):
      getTodoQuery = `
          SELECT * FROM todo
          WHERE category = '${category}'
          AND priority = '${priority}';`;
      break;

    default:
      getTodoQuery = `
          SELECT * FROM todo
          WHERE todo LIKE '%${search_q}%';`;
  }

  arrayOf = await db.all(getTodoQuery);
  response.send(
    arrayOf.map((eachItem) => ({
      id: eachItem.id,
      todo: eachItem.todo,
      priority: eachItem.priority,
      status: eachItem.status,
      category: eachItem.category,
      dueDate: eachItem.due_date,
    }))
  );
});

app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const getToDoQuery = `
    SELECT
      *
    FROM
      todo
      WHERE id= ${todoId};`;

  const oneTodo = await db.get(getToDoQuery);
  response.send(convertTodoDbObjectToResponseObject(oneTodo));
});

app.get("/agenda/", async (request, response) => {
  const { date } = request.query;
  const getDateQuery = `
    SELECT
      *
    FROM
      todo
      WHERE due_date= ${date};`;

  const oneTodo = await db.all(getDateQuery);
  response.send(oneTodo);
});

app.post("/todos/", async (request, response) => {
  const { id, todo, priority, status, category, dueDate } = request.body;
  const postTodoQuery = `
  INSERT INTO
    todo ( id, todo, category, priority, status, due_date)
  VALUES
    (${id}, '${todo}', '${priority}', '${status}', '${category}', '${dueDate}');`;

  await db.run(postTodoQuery);
  response.send("Todo Successfully Added");
});

app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const requestBody = request.body;
  let updateColumn = "";

  const getToDo = `
  SELECT * FROM todo
  WHERE id=${todoId};`;
  const previousObject = await db.get(getToDo);

  const {
    status = previousObject.status,
    priority = previousObject.priority,
    todo = previousObject.todo,
    category = previousObject.category,
    dueDate = previousObject.due_Date,
  } = request.body;

  switch (true) {
    case requestBody.status !== undefined:
      updateColumn = "Status";
      break;
    case requestBody.todo !== undefined:
      updateColumn = "Todo";
      break;
    case requestBody.priority !== undefined:
      updateColumn = "Priority";
      break;
    case requestBody.category !== undefined:
      updateColumn = "Category";
      break;
    case requestBody.dueDate !== undefined:
      updateColumn = "Due Date";
      break;
  }

  const putTodo = `
            UPDATE
              todo
            SET
              priority = '${priority}',
              status = '${status}',
              todo = '${todo}'
              
            WHERE
              id = ${todoId};`;

  await db.run(putTodo);
  response.send(`${updateColumn} Updated`);
});

app.delete("/todos/:todoId/", async (request, response) => {
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
