const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');

const app = express();

// Database connection
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'projectconnect',
  password: 'moni0808',
  port: 5432,
});

// Middleware
app.use(cors());
app.use(express.json());

const JWT_SECRET = 'your-secret-key';

// Auth middleware
const auth = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'No token provided' });
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// Database initialization
const initDB = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role VARCHAR(20) CHECK(role IN ('parent','helper')) NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS projects (
        project_id SERIAL PRIMARY KEY,
        parent_id INT REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        grade_level VARCHAR(50),
        budget NUMERIC(10,2),
        delivery_type VARCHAR(20) DEFAULT 'online',
        difficulty VARCHAR(20) DEFAULT 'beginner',
        deadline DATE,
        category VARCHAR(100),
        status VARCHAR(20) DEFAULT 'open',
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS bids (
        bid_id SERIAL PRIMARY KEY,
        project_id INT REFERENCES projects(project_id) ON DELETE CASCADE,
        freelancer_id INT REFERENCES users(id) ON DELETE CASCADE,
        amount NUMERIC(10,2),
        message TEXT,
        status VARCHAR(20) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Database initialization error:', error);
  }
};

// Auth Routes
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const result = await pool.query(
      'INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4) RETURNING id, name, email, role',
      [name, email, hashedPassword, role]
    );
    
    const token = jwt.sign({ userId: result.rows[0].id }, JWT_SECRET);
    res.json({ token, user: result.rows[0] });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    
    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'User not found' });
    }
    
    const user = result.rows[0];
    const validPassword = await bcrypt.compare(password, user.password);
    
    if (!validPassword) {
      return res.status(400).json({ error: 'Invalid password' });
    }
    
    const token = jwt.sign({ userId: user.id }, JWT_SECRET);
    res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Project Routes
app.post('/api/projects', auth, async (req, res) => {
  try {
    const { title, description, grade_level, budget, delivery_type, difficulty, deadline, category } = req.body;
    
    const result = await pool.query(
      'INSERT INTO projects (parent_id, title, description, grade_level, budget, delivery_type, difficulty, deadline, category) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *',
      [req.user.userId, title, description, grade_level, budget, delivery_type, difficulty, deadline, category]
    );
    
    res.json(result.rows[0]);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.get('/api/projects', async (req, res) => {
  try {
    const { cost, difficulty, category } = req.query;
    let query = `
      SELECT p.*, u.name as parent_name
      FROM projects p
      JOIN users u ON p.parent_id = u.id
      WHERE p.status = 'open'
    `;
    const params = [];
    let paramCount = 0;

    // Apply filters
    if (cost) {
      paramCount++;
      if (cost === 'free') query += ` AND p.budget = 0`;
      else if (cost === 'low') query += ` AND p.budget BETWEEN 1 AND 1000`;
      else if (cost === 'medium') query += ` AND p.budget BETWEEN 1001 AND 5000`;
      else if (cost === 'high') query += ` AND p.budget > 5000`;
    }

    if (difficulty) {
      paramCount++;
      query += ` AND p.difficulty = $${paramCount}`;
      params.push(difficulty);
    }

    if (category) {
      paramCount++;
      query += ` AND p.category = $${paramCount}`;
      params.push(category);
    }

    query += ' ORDER BY p.created_at DESC';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching projects:', error);
    res.status(400).json({ error: error.message });
  }
});

app.get('/api/projects/:id', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT p.*, u.name as parent_name
      FROM projects p
      JOIN users u ON p.parent_id = u.id
      WHERE p.project_id = $1
    `, [req.params.id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching project:', error);
    res.status(400).json({ error: error.message });
  }
});

app.get('/api/my-projects', auth, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT p.*, u.name as parent_name
      FROM projects p
      JOIN users u ON p.parent_id = u.id
      WHERE p.parent_id = $1
      ORDER BY p.created_at DESC
    `, [req.user.userId]);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching my projects:', error);
    res.status(400).json({ error: error.message });
  }
});

// Bid Routes
app.post('/api/bids', auth, async (req, res) => {
  try {
    const { project_id, amount, message } = req.body;
    
    const result = await pool.query(
      'INSERT INTO bids (project_id, freelancer_id, amount, message) VALUES ($1, $2, $3, $4) RETURNING *',
      [project_id, req.user.userId, amount, message]
    );
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error creating bid:', error);
    res.status(400).json({ error: error.message });
  }
});

app.get('/api/projects/:id/bids', auth, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT b.*, u.name as freelancer_name
      FROM bids b
      JOIN users u ON b.freelancer_id = u.id
      WHERE b.project_id = $1
      ORDER BY b.created_at DESC
    `, [req.params.id]);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching bids:', error);
    res.status(400).json({ error: error.message });
  }
});

// Initialize database and start server
initDB().then(() => {
  app.listen(5000, () => {
    console.log('Server running on port 5000');
  });
});

module.exports = app;