const express = require('express');
const cors = require('cors');

const { v4: uuidv4 } = require('uuid');

const app = express();

app.use(cors());
app.use(express.json());

const users = [];

function checksExistsUserAccount(request, response, next) {
  const { username } = request.headers;

  const user = users.find(
    (user) => user.username === username
  );
  
  if(!user) {
    return response.status(404).json({
      error: 'User not found'
    });
  }

  request.user = user;

  return next();
}

function checksExistsTodoID(request, response, next) {
  const { id } = request.params;
  const { user } = request;
  
  const todoOperation = user.todos.find(
    (todo) => todo.id === id
  );

  if(!todoOperation) {
    return response.status(404).json({
      error: 'Todo not found'
    });
  }

  request.todoOperation = todoOperation;

  return next();
}

app.post('/users', (request, response) => {
  const { name, username } = request.body;

  const userAlreadyExists = users.some(
    (user) => user.username === username
  );

  if(userAlreadyExists) {
    return response.status(400).json({
      error: 'User already exists'
    });
  }

  users.push({
    id: uuidv4(),
    name,
    username,
    todos: []
  });

  response.status(201).send();
});

app.get('/todos', checksExistsUserAccount, (request, response) => {
  const { user } = request;
  return response.json(user.todos);
});

app.post('/todos', checksExistsUserAccount, (request, response) => {
  const { title, deadline } = request.body;
  const { user } = request;

  const todoOperation = {
    id: uuidv4(),
    title,
    done: false,
    deadline: new Date(deadline),
    created_at: new Date()
  }

  user.todos.push(todoOperation);
  return response.status(201).send();
});

app.put('/todos/:id', checksExistsUserAccount, checksExistsTodoID, (request, response) => {
  const { id } = request.params;
  const { title, deadline } = request.body;
  const { user, todoOperation } = request;

  todoOperation.title = title;
  todoOperation.deadline = new Date(deadline);

  user.todos.map((todo) => {
    if(todo.id === id) {
      todo = todoOperation;
    }
  });

  return response.status(200).send();
});

app.patch('/todos/:id/done', checksExistsUserAccount, checksExistsTodoID, (request, response) => {
  const { id } = request.params;
  const { user, todoOperation } = request;

  todoOperation.done = true;

  user.todos.map((todo) => {
    if(todo.id === id) {
      todo = todoOperation;
    }
  });

  return response.status(200).send();
});

app.delete('/todos/:id', checksExistsUserAccount, checksExistsTodoID, (request, response) => {
  const { user, todoOperation } = request;

  user.todos.splice(todoOperation, 1);
  return response.status(200).send(user.todos);
});

module.exports = app;