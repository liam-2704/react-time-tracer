#!/usr/bin/env node

// A simple local server intended to be used as 
// the back end for a course programming assignment.

// Run from the command line with node, e.g.,
// "node server.js --init --port=3010 --verbose".
// (--init will restore the database in its default state,
// --port can be used to set the port, and --verbose 
// echoes information about the operations to the 
// standard output. --empty can be used to start with an 
// empty database.)

// Created by TJH (2024). For the time being, this 
// should be considered as a work in progress, and 
// not as a finished product. Suggestions for improvements 
// are welcome.

// Version 1.2 (2025-09-17) (Added additional_data 
//                           field also to the tags table
//                           and improved error handling.
//                           For single values, a single
//                           object is now returned instead
//                           of an array with one object.)

// Version 1.3 (2026-09-21) (Updated the sqlite version and 
//                           modified the default data.)

// TODO: migrate to using in-built node:sqlite module


const bodyParser = require('body-parser');
const { error } = require('console');
const express = require('express')
const cors = require('cors');
const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();
const app = express();
app.use(bodyParser.json());
app.use(cors());
let port = 3010;

let init = false;
let empty = false;
let verbose = false;

// Handle the command line arguments.
// (Supports now combining different 
// one-character options, e.g., -ivp=3010)
let nextIsPort = false;
for (let arg of process.argv) {
  if (arg) {
    if (nextIsPort) {
      port = +arg;
      nextIsPort = false;
    }
    else {
      const oneCharOptionsPossiblyCombined = arg.startsWith('-') && !arg.startsWith('--');
      if (arg.startsWith('--init') || (oneCharOptionsPossiblyCombined && arg.includes('i'))) {
        init = true;
      }
      if (arg.startsWith('--empty') || (oneCharOptionsPossiblyCombined && arg.includes('e'))) {
        init = true;
        empty = true;
      }
      if (arg.startsWith('--verbose') || (oneCharOptionsPossiblyCombined && arg.includes('v'))) {
        verbose = true;
      }
      if (arg.startsWith('--port') || (oneCharOptionsPossiblyCombined && arg.includes('p'))) {
        if (arg.split('=').length > 1) {
          port = +(arg.split('=')[1]);
        }
        else {
          nextIsPort = true;
        }
      }
    }
  }  
}

//const data_store = ':memory:'
const data_store = './db_file.db'


// Instead of this, decided to take a softer approach to
// resetting the situation and not to remove the file, but just 
// to drop the existing tables and recreate them. This way, the
// possible problems with file being used by other processes
// (such as some database manager programs like DBeaver) are avoided. 
/*
if (init) {
  fs.unlinkSync(data_store); 
}
*/

if (!fs.existsSync(data_store)) {
  console.log(`Creating the DB file ${data_store}.`);
  fs.writeFileSync(data_store, '');
  init = true;
}

let db = new sqlite3.Database(data_store, sqlite3.OPEN_READWRITE, (err) => {
  if (err) {
    return console.error(err.message);
  }
  console.log(`Connected to the database, using ${data_store} as the data store.`);
});

// create tables and populate them with default data
if (init) {
  console.log("Initializing the database.");
  //let initial_tags = ['household chore', 'school', 'hobby', 'important', 'full stack'];
  //let placeholders = initial_tags.map((tag) => '(?)').join(',');
  if (verbose) {
    console.log('Ditching the possibly existing data.');
  }
  db.serialize(() => {
    db.run('DROP TABLE IF EXISTS tags;')
      .run('DROP TABLE IF EXISTS tasks;')
      .run('DROP TABLE IF EXISTS timestamps;')
      .run('DROP TABLE IF EXISTS options;')
      .run("CREATE TABLE tags (id INTEGER PRIMARY KEY, name TEXT, additional_data TEXT DEFAULT '');")
      .run("CREATE TABLE tasks (id INTEGER PRIMARY KEY, name TEXT, tags TEXT, additional_data TEXT DEFAULT '');")
      .run('CREATE TABLE timestamps (id INTEGER PRIMARY KEY, timestamp TEXT, task INTEGER, type INTEGER);')
      .run('CREATE TABLE options (id INTEGER PRIMARY KEY, theme TEXT, alternative INTEGER, own_textual_data TEXT);')
    }
  );
  // Ugly hardcoding, but will do for now.
  // TODO: read the initial data from an external file.
  if (!empty) {
    if (verbose) {
      console.log('Populating the database with default data.');
    }
    
    db.serialize(() => {
      console.log(db);
      //db.run('INSERT INTO tags (name) VALUES ' + placeholders, initial_tags)
      // Instead, let us make this very ugly but more explicit for the time being.
      // Easier to read and modify the default data this way.
      db.run(`INSERT INTO tags (name) VALUES ('household chore');`)
        .run(`INSERT INTO tags (name) VALUES ('school');`)
        .run(`INSERT INTO tags (name) VALUES ('hobby');`)
        .run(`INSERT INTO tags (name) VALUES ('important');`)
        .run(`INSERT INTO tags (name) VALUES ('full stack');`)
        .run(`INSERT INTO tasks (name, tags, additional_data) VALUES ('feed the cat', '1,4', '');`)
        .run(`INSERT INTO tasks (name, tags) VALUES ('code', '2,3,5');`)
        .run(`INSERT INTO tasks (name, tags) VALUES ('sleep', '4');`)
        .run(`INSERT INTO tasks (name, tags) VALUES ('eat', '3,4');`)
        .run(`INSERT INTO tasks (name, tags, additional_data) VALUES ('be ill', '', 'to be avoided');`)
        .run(`INSERT INTO timestamps (timestamp, task, type) VALUES ('2026-09-11 16:23:02.000', 4, 0);`)
        .run(`INSERT INTO timestamps (timestamp, task, type) VALUES ('2026-09-11 16:28:33.542', 5, 0);`)
        .run(`INSERT INTO timestamps (timestamp, task, type) VALUES ('2026-09-11 16:42:04.823', 4, 1);`)
        .run(`INSERT INTO timestamps (timestamp, task, type) VALUES ('2026-09-11 21:48:59.002', 1, 0);`)
        .run(`INSERT INTO timestamps (timestamp, task, type) VALUES ('2026-09-11 21:57:00.999', 1, 1);`)
        .run(`INSERT INTO timestamps (timestamp, task, type) VALUES ('2026-09-12 03:04:14.000', 3, 0);`)
        .run(`INSERT INTO timestamps (timestamp, task, type) VALUES ('2026-09-12 06:34:17.000', 3, 1);`)
        .run(`INSERT INTO timestamps (timestamp, task, type) VALUES ('2026-09-12 06:37:13.345', 1, 0);`)
        .run(`INSERT INTO timestamps (timestamp, task, type) VALUES ('2026-09-12 07:10:06.917', 1, 1);`)
        .run(`INSERT INTO timestamps (timestamp, task, type) VALUES ('2026-09-12 11:01:07.427', 2, 0);`)
        .run(`INSERT INTO timestamps (timestamp, task, type) VALUES ('2026-09-12 16:13:13.555', 2, 1);`)
        .run(`INSERT INTO timestamps (timestamp, task, type) VALUES ('2026-09-12 16:44:26.231', 1, 0);`)
        .run(`INSERT INTO timestamps (timestamp, task, type) VALUES ('2026-09-17 21:39:09.111', 1, 1);`)
        .run(`INSERT INTO options (theme, alternative, own_textual_data) VALUES ('default', 0, '');`)
        .each(`SELECT * FROM tags;`, (err, row) => {
          if (err) {
            throw err;
          }
          if (verbose) {
            console.log("tag:", row);
          }
        })
        .each(`SELECT * FROM tasks;`, (err, row) => {
          if (err) {
            throw err;
          }
          if (verbose) {
            console.log("task:", row);
          }
        })
        .each(`SELECT * FROM timestamps;`, (err, row) => {
          if (err) {
            throw err;
          }
          if (verbose) {
            console.log("timestamp:", row);
          }
        })
        .get(`SELECT * FROM options;`, (err, row) => {
          if (err) {
            throw err;
          }
          if (verbose) {
            console.log("option:", row);
          }
        });
    });
    
  }
}

db.close((err) => {
  if (err) {
    console.error("Throwing error inside .close():", err.message);
    return console.error(err.message);
  }
  if (verbose) {
    console.log('Closing the database connection ok.');
  }
});

const make_query = (query, returnId=false) => {
  db = new sqlite3.Database(data_store, sqlite3.OPEN_READWRITE, (err) => {
    if (err) {
      return console.error(err.message);
    }
  });
  if (returnId) {
    return new Promise((resolve, reject) => {
      db.run(query, function (err) {
        if (err) {
          reject(err);
        }
        resolve(JSON.stringify({id: this.lastID}));
      });
    });
  }
  else {  
    return new Promise((resolve, reject) => {
      db.all(query, (err, rows) => {
        db.close((err) => {
          if (err) {
            return console.error(err.message);
          }
          if (verbose) {
            console.log('Closing the database connection ok.');
          }
        });
        if (err) {
          reject(err);
        }
        resolve(JSON.stringify(rows));
      });
    });
  }
}


// *** THE ENDPOINTS ***

const COLLECTIONS = ['tags', 'tasks', 'timestamps', 'options'];

app.get('/', (req, res) => {
  const d = new Date();
  res.send(`<h1>Hello, hello! The server is running, and this is the root.</h1>
    <p>Today is ${d.toLocaleDateString("fi-FI")} 
    and the time is ${d.toLocaleTimeString("fi-FI")}.</p>
    <p>Please consult README.md for the API documentation.</p>`
  );
});

// GET all the stuff from the collection resources
app.get('/:foos', (req, res) => {
  const foos = req.params.foos;
  res.set({'Content-Type': 'application/json; charset=utf-8'});
  if (COLLECTIONS.includes(foos)) {
    if (verbose) {
      console.log(`Fetching all the ${foos}.`);
    }
    make_query(`SELECT * FROM ${foos}`)
      .then((result) => {
        if (verbose) {
          console.log(JSON.stringify(JSON.parse(result), null, 2));
        }
        res.send(result)
      });
  }
  else {
    res.status(404).send({error: `No collection resource called ${foos}.`});
    if (verbose) {
      console.error(`Error: no collection resource called ${foos}.`);
    }
  }
});

// GET all the timestamps for a specific task
app.get('/timesfortask/:task', (req, res) => {
  const task = req.params.task;
  res.set({'Content-Type': 'application/json; charset=utf-8'});
  if (verbose) {
    console.log(`Trying to fetch all the timestamps for task ${task}.`);
  }
  if (isNaN(task) || task != parseInt(task)) {
    res.status(400).send({error: `The task ID (${task}) is not an integer.`});
    if (verbose) {
      console.error(`Error: the task ID (${task}) is not an integer.`);
    }
  }
  else { 
    make_query(`SELECT * FROM timestamps WHERE task = ${task} ORDER BY timestamp;`)
      .then((result) => {
        if (verbose) {
          console.log(JSON.stringify(JSON.parse(result), null, 2));
        }
        res.send(result)
      });
  }
});

// GET all the timestamps of certain type for a specific task
app.get('/timesfortask/:task/:type', (req, res) => {
  const task = req.params.task;
  const type = req.params.type;
  res.set({'Content-Type': 'application/json; charset=utf-8'});
  if (verbose) {
    console.log(`Trying to fetch all the timestamps of type ${type} for task ${task}.`);
  } 
  if (isNaN(task) || task != parseInt(task) || (type != '0' && type != '1')) {
    res.status(400).send({error: `Either the task ID (${task}) is not an integer or the type (${type}) is invalid.`});
    if (verbose) {
      console.error(`Error: the task ID (${task}) is not an integer or the type (${type}) is invalid.`);
    }
  }
  else {
    make_query(`SELECT * FROM timestamps WHERE task = ${task} AND type = ${type} ORDER BY timestamp;`)
      .then((result) => {
        if (verbose) {
          console.log(JSON.stringify(JSON.parse(result), null, 2));
        }
        res.send(result)
      });
  }
});

// GET a specific item
app.get('/:foos/:id', (req, res) => {
  const foos = req.params.foos;
  const id = req.params.id;
  res.set({'Content-Type': 'application/json; charset=utf-8'});
  if (verbose) {
    console.log(`Trying to fetch an item from ${foos} with ID ${id}.`);
  }
  if (isNaN(id) || id != parseInt(id)) {
    res.status(400).send({error: `The ID (${id}) is not an integer.`});
    if (verbose) {
      console.error(`Error: the ID (${id}) is not an integer.`);
    }
  }
  else {
    if (COLLECTIONS.includes(foos)) {
      make_query(`SELECT * FROM ${foos} WHERE id = ${id} LIMIT 1`)
        .then((result) => {
          const firstItem = JSON.parse(result)[0];
          const firstItemString = JSON.stringify(firstItem, null, 2);
          const noSuch = firstItem === undefined;
          if (verbose) {
            console.error(firstItemString || `Error: Item not found`);
          }
          if (noSuch) {
            res.status(404).send({error: 'Item not found'});
          }
          else {
            res.send(firstItem);
          }
        });
    }
    else {
      res.status(404).send({error: `No collection resource called ${foos}.`});
      if (verbose) {
        console.error(`Error: no collection resource called ${foos}.`);
      }
    }
  }
});


// POST a new item
app.post('/:foo', async (req, res) => {
  const foo = req.params.foo;
  res.set({'Content-Type': 'application/json; charset=utf-8'});
  if (verbose) {
    console.log(`Adding a new item to ${foo}.`);
  }
  let query;
  if (foo === 'tags') {
    query = `INSERT INTO tags (name, additional_data) VALUES ('${req.body.name}', '${req.body.additional_data || ""}')`;
  } 
  else if (foo === 'tasks') {
    query = `INSERT INTO tasks (name, tags, additional_data) VALUES ('${req.body.name}', '${req.body.tags}', '${req.body.additional_data || ""}')`;
  }
  else if (foo === 'timestamps') {
    query = `INSERT INTO timestamps (timestamp, task, type) VALUES ('${req.body.timestamp}', '${req.body.task}', '${req.body.type}')`;
  }
  result = await make_query(query, true);
  if (verbose) {
    console.log(result);
  }
  res.send(result);
});

// PUT a new item
app.put('/:foos/:id', async (req, res) => {
  const foos = req.params.foos;
  const id = req.params.id;
  res.set({'Content-Type': 'application/json; charset=utf-8'});
  if (verbose) {
    console.log(`Adding or replacing an item in ${foos} with ID ${id}.`);
  }
  let query;
  if (foos === 'tags') {
    query = `INSERT OR REPLACE INTO tags (id, name, additional_data) VALUES (${id}, '${req.body.name}', '${req.body.additional_data || ""}')`;
  } 
  else if (foos === 'tasks') {
    console.log("req.body: ", req.body);
    query = `INSERT OR REPLACE INTO tasks (id, name, tags, additional_data) VALUES (${id}, '${req.body.name}', '${req.body.tags}', '${req.body.additional_data || ""}')`;
  }
  else if (foos === 'timestamps') {
    query = `INSERT OR REPLACE INTO timestamps (id, timestamp, task, type) VALUES (${id}, '${req.body.timestamp}', '${req.body.task}', '${req.body.type}')`;
  }
  else if (foos === 'options') {
    query = `INSERT OR REPLACE INTO options (id, theme, alternative, own_textual_data) VALUES (${id}, '${req.body.theme}', '${req.body.alternative}', '${req.body.own_textual_data}')`;
  } 
  result = await make_query(query, true);
  if (verbose) {
    console.log(result);
  }
  res.send(result);
});

// PATCH an item
app.patch('/:foos/:id', async (req, res) => {
  const foos = req.params.foos;
  const id = req.params.id;
  let error = false;
  res.set({'Content-Type': 'application/json; charset=utf-8'});
  if (verbose) {
    console.log(`Updating content of the item in ${foos} with ID ${id}.`);
  }
  let query;
  console.log(req.body);
  
  const keys = Object.keys(req.body);
  const assignments = keys.map((key) => `${key} = '${req.body[key]}'`).join(', ');
  if (assignments.length > 0) {
    query = `UPDATE ${foos} SET ` + assignments + ` WHERE id = ${id};`;
    try {
      await make_query(query);
      result = JSON.stringify({id: id});
    }
    catch (err) {
      result = JSON.stringify({error: err.message});
      console.error(err.message);
      error = true;
    }
  }
  else {
    result = JSON.stringify({error: 'No valid fields to update.'});
  }
  if (verbose && !error) {
    console.log(result);
  }  
  res.send(result);
});

// DELETE an item
app.delete('/:foos/:id', async (req, res) => {
  const foos = req.params.foos;
  const id = req.params.id;
  res.set({'Content-Type': 'application/json; charset=utf-8'});
  if (verbose) {
    console.log(`Deleting /${foos}/${id}.`);
  }
  let query = `DELETE FROM ${foos} WHERE id = ${id}`;
  result = await make_query(query);
  if (result === '[]') {
    if (verbose) {
      console.log(`Item with ID ${id} deleted (if it existed).`);
    }
    res.send(JSON.stringify({message: `Item deleted (if it existed).`}));
  }
  else {
    if (verbose) {
      console.error(`Something went wrong while trying to delete the item with ID ${id} from ${foos}.`);
    }
    res.status(500).send(JSON.stringify({error: `Something went wrong while trying to delete the item with ID ${id} from ${foos}.`}));
  }  
});

app.listen(port, () => {
  console.log(`Listening for API requests on port ${port}!`)
});