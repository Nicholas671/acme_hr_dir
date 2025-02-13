require('dotenv').config();
const pg = require('pg');
const express = require('express');
const cors = require('cors');
const app = express();
const faker = require('faker');

app.use(express.json());
app.use(require('morgan')('dev'));
app.use(cors());

// Console log the PG info
console.log('DATABASE_URL:', process.env.DATABASE_URL);
console.log('PGUSER:', process.env.PGUSER);
console.log('PGPASSWORD:', process.env.PGPASSWORD);

// Setup the pg.client
const client = new pg.Client({
  connectionString: process.env.DATABASE_URL,
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD
});

// Get an array of employees
app.get('/api/employees', async (req, res, next) => {
  try {
    const SQL = `SELECT * FROM employees;`; // Get all employees
    const response = await client.query(SQL);
    res.send(response.rows);
  } catch (error) {
    next(error);
  }
});

// Post a new employee
app.post('/api/employees', async (req, res, next) => {
  try {
    const { name, job_title, department_id, department_name } = req.body;
    const SQL = `INSERT INTO employees(name, job_title, department_id, department_name) VALUES($1, $2, $3, $4) RETURNING *;`;
    const response = await client.query(SQL, [name, job_title, department_id, department_name]);
    res.send(response.rows[0]);
  } catch (error) {
    next(error);
  }
});

// Update an employee
app.put('/api/employees/:id', async (req, res, next) => {
  try {
    const { name, job_title, department_id, department_name } = req.body;
    const SQL = `UPDATE employees SET name=$1, job_title=$2, department_id=$3, department_name=$4 WHERE id=$5 RETURNING *;`;
    const response = await client.query(SQL, [name, job_title, department_id, department_name, req.params.id]);
    res.send(response.rows[0]);
  } catch (error) {
    next(error);
  }
});

// Delete an employee
app.delete('/api/employees/:id', async (req, res, next) => {
  try {
    const SQL = `DELETE FROM employees WHERE id=$1;`;
    await client.query(SQL, [req.params.id]);
    res.sendStatus(204);
  } catch (error) {
    next(error);
  }
});

// Get an array of employees by department
app.get('/api/departments/:id/employees', async (req, res, next) => {
  try {
    const SQL = `SELECT * FROM employees WHERE department_id=$1;`; // Get all employees in a department
    const response = await client.query(SQL, [req.params.id]);
    res.send(response.rows);
  } catch (error) {
    next(error);
  }
});

// Get an array of departments
app.get('/api/departments', async (req, res, next) => {
  try {
    const SQL = `SELECT * FROM departments;`; // Get all departments
    const response = await client.query(SQL);
    res.send(response.rows);
  } catch (error) {
    next(error);
  }
});

const init = async () => {
  try {
    await client.connect();
    console.log('Connected to the database');
    // Create the Employees and Departments tables
    let SQL = `
    DROP TABLE IF EXISTS employees;
    DROP TABLE IF EXISTS departments;
    CREATE TABLE departments(
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL
    );
    CREATE TABLE employees(
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      job_title VARCHAR(255) default 'employee' NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      department_id INTEGER REFERENCES departments(id) NOT NULL,
      department_name VARCHAR(255) NOT NULL
    );
    `;
    console.log('Generating tables...');
    await client.query(SQL);
    console.log('Tables generated!');

    // Seed the tables with department names, and employee names, job titles, and department ids
    const departments = [];
    for (let i = 0; i < 10; i++) {
      const departmentName = faker.commerce.department();
      const result = await client.query(`INSERT INTO departments(name) VALUES($1) RETURNING id;`, [departmentName]);
      const departmentId = result.rows[0].id;
      departments.push({ id: departmentId, name: departmentName });
    }
    console.log('Departments seeded!');

    for (let i = 0; i < 10; i++) {
      const name = faker.name.findName();
      const jobTitle = faker.name.jobTitle();
      const department = departments[Math.floor(Math.random() * departments.length)];
      SQL = `INSERT INTO employees(name, job_title, department_id, department_name) VALUES($1, $2, $3, $4);`;
      await client.query(SQL, [name, jobTitle, department.id, department.name]);
    }
    console.log('Employees seeded!');
  } catch (error) {
    console.error('Error connecting to the database');
    console.error(error);
  }
};

init();

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});