const pg = require('pg');
const client = new pg.Client(process.env.DATABASE_URL || 'postgres://localhost/acme_hr_dir');
const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

const init = async () => {
    await client.connect();
    //Create the Employees and Departments tables
    let SQL = `
DROP TABLE IF EXISTS employees;
DROP TABLE IF EXISTS departments;
CREATE TABLE employees(
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  job_title VARCHAR(255) default 'employee' NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  department_id INTEGER REFERENCES departments(id) NOT NULL
);
CREATE TABLE departments(
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
);
`;
    console.log('Genereating tables...');
    await client.query(SQL);
    console.log('Tables generated!');
    //Seed the tables with department names, and employee names, job titles, and department ids
    SQL = `
INSERT INTO departments(name) VALUES('Catering');
INSERT INTO departments(name) VALUES('Front-of-House');
INSERT INTO departments(name) VALUES('Back-of-House');
INSERT INTO departments(name) VALUES('Management');
`;
    await client.query(SQL);
    //Use Faker to generate random names    
    const departments = ['Catering', 'Front-of-House', 'Back-of-House', 'Management']
    for (let i = 0; i < 10; i++) {
        const name = faker.name.findName();
        const jobTitle = faker.name.jobTitle();
        const departmentId = Math.floor(Math.random() * departments.length) + 1;
        SQL = `INSERT INTO employees(name, job_title, department_id) VALUES ('${name}','${jobTitle}','${departmentId}');`;
        await client.query(SQL);
    }
    console.log('Data seeded')

};



init();