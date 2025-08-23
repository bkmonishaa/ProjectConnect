import React, { useState, useEffect, createContext, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, Lock, Mail, Plus, Search, Star, 
  DollarSign, BookOpen, LogOut, Send, Calendar,
  Award, Filter, Heart, ArrowLeft, Clock
} from 'lucide-react';

const API_BASE = 'http://localhost:5000/api';
const AuthContext = createContext();
const useAuth = () => useContext(AuthContext);

// API Service
const api = {
  auth: {
    login: async (email, password) => {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      if (!res.ok) throw new Error('Login failed');
      return res.json();
    },
    register: async (userData) => {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      });
      if (!res.ok) throw new Error('Registration failed');
      return res.json();
    }
  },
  projects: {
    getAll: async (filters = {}) => {
      const params = new URLSearchParams(filters);
      const res = await fetch(`${API_BASE}/projects?${params}`);
      return res.json();
    },
    getById: async (id) => {
      const res = await fetch(`${API_BASE}/projects/${id}`);
      return res.json();
    },
    create: async (projectData, token) => {
      const res = await fetch(`${API_BASE}/projects`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(projectData)
      });
      return res.json();
    },
    getMy: async (token) => {
      const res = await fetch(`${API_BASE}/my-projects`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      return res.json();
    }
  },
  bids: {
    create: async (bidData, token) => {
      const res = await fetch(`${API_BASE}/bids`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(bidData)
      });
      return res.json();
    }
  }
};

// Components
const Button = ({ children, onClick, className = '', variant = 'primary', size = 'md', disabled = false }) => {
  const variants = {
    primary: 'bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white',
    secondary: 'bg-gradient-to-r from-emerald-400 to-cyan-500 hover:from-emerald-500 hover:to-cyan-600 text-white',
    outline: 'border-2 border-indigo-300 text-indigo-600 hover:bg-indigo-50 bg-white',
    ghost: 'text-gray-600 hover:bg-gray-100'
  };
  
  const sizes = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-6 py-3 text-base'
  };

  return (
    <motion.button
      whileHover={{ scale: disabled ? 1 : 1.02 }}
      whileTap={{ scale: disabled ? 1 : 0.98 }}
      onClick={onClick}
      disabled={disabled}
      className={`font-medium rounded-xl transition-all duration-200 ${variants[variant]} ${sizes[size]} ${className} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      {children}
    </motion.button>
  );
};

const Input = ({ label, icon: Icon, value, onChange, placeholder, type = 'text', required = false }) => (
  <div className="mb-4">
    <label className="block text-gray-700 font-semibold mb-2 flex items-center gap-2">
      {label}
      {Icon && <Icon size={16} className="text-indigo-500" />}
    </label>
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      required={required}
      className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 focus:outline-none text-gray-700 bg-white"
    />
  </div>
);

const FilterModal = ({ onClose, onApply, currentFilters }) => {
  const [filters, setFilters] = useState(currentFilters);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md"
      >
        <h2 className="text-xl font-bold text-gray-800 mb-4">Filter Projects</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-gray-700 font-semibold mb-2">Budget Range</label>
            <select
              value={filters.cost || ''}
              onChange={(e) => setFilters({...filters, cost: e.target.value})}
              className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-indigo-400 focus:outline-none"
            >
              <option value="">Any Budget</option>
              <option value="free">Free</option>
              <option value="low">₹1 - ₹1,000</option>
              <option value="medium">₹1,001 - ₹5,000</option>
              <option value="high">₹5,000+</option>
            </select>
          </div>
          
          <div>
            <label className="block text-gray-700 font-semibold mb-2">Category</label>
            <select
              value={filters.category || ''}
              onChange={(e) => setFilters({...filters, category: e.target.value})}
              className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-indigo-400 focus:outline-none"
            >
              <option value="">All Categories</option>
              <option value="Science">Science</option>
              <option value="Math">Mathematics</option>
              <option value="Art">Arts & Crafts</option>
              <option value="English">English</option>
              <option value="Social Studies">Social Studies</option>
            </select>
          </div>

          <div>
            <label className="block text-gray-700 font-semibold mb-2">Difficulty</label>
            <select
              value={filters.difficulty || ''}
              onChange={(e) => setFilters({...filters, difficulty: e.target.value})}
              className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-indigo-400 focus:outline-none"
            >
              <option value="">Any Level</option>
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </div>

          <div className="flex gap-3 pt-4">
            <Button onClick={() => onApply(filters)} className="flex-1">Apply Filters</Button>
            <Button onClick={() => { setFilters({}); onApply({}); }} variant="outline">Clear</Button>
            <Button onClick={onClose} variant="ghost">×</Button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

const ProjectCard = ({ project, onClick, showBidButton = false, onBid }) => (
  <motion.div
    whileHover={{ y: -4, shadow: '0 20px 40px rgba(0,0,0,0.1)' }}
    onClick={onClick}
    className="bg-white rounded-2xl shadow-lg p-6 cursor-pointer border border-gray-100 hover:border-indigo-200 relative overflow-hidden group"
  >
    <div className="absolute top-4 right-4 text-2xl opacity-20 group-hover:opacity-40 transition-opacity">
      {project.category === 'Science' ? '🔬' : 
       project.category === 'Math' ? '📊' :
       project.category === 'Art' ? '🎨' :
       project.category === 'English' ? '📚' : '🌟'}
    </div>
    
    <h3 className="font-bold text-xl text-gray-800 mb-3 pr-8">
      {project.title}
    </h3>
    
    <p className="text-gray-600 mb-4 line-clamp-2">{project.description}</p>
    
    <div className="flex gap-2 mb-4 flex-wrap">
      <span className="bg-blue-50 px-3 py-1 rounded-full text-sm font-medium text-blue-700 flex items-center gap-1">
        <BookOpen size={14} />
        Grade {project.grade_level}
      </span>
      <span className="bg-green-50 px-3 py-1 rounded-full text-sm font-medium text-green-700 flex items-center gap-1">
        <DollarSign size={14} />
        ₹{project.budget}
      </span>
      <span className="bg-purple-50 px-3 py-1 rounded-full text-sm font-medium text-purple-700">
        {project.category}
      </span>
    </div>
    
    <div className="flex justify-between items-center">
      <span className="text-sm text-gray-500 flex items-center gap-1">
        <User size={14} />
        {project.parent_name}
      </span>
      
      {showBidButton && (
        <Button 
          size="sm" 
          onClick={(e) => {
            e.stopPropagation();
            onBid(project);
          }}
        >
          <Heart size={14} className="mr-1" />
          Bid
        </Button>
      )}
    </div>
  </motion.div>
);

const ProjectDetails = ({ project, onBack, onBid }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-emerald-50">
      <div className="max-w-4xl mx-auto p-6">
        <div className="flex items-center gap-4 mb-6">
          <Button onClick={onBack} variant="outline" size="sm">
            <ArrowLeft size={16} className="mr-2" />
            Back
          </Button>
          <h1 className="text-3xl font-bold text-gray-800">Project Details</h1>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-8">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">{project.title}</h2>
              <p className="text-gray-600 flex items-center gap-2">
                <User size={16} />
                Posted by {project.parent_name}
              </p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-green-600 mb-1">₹{project.budget}</div>
              <p className="text-sm text-gray-500 flex items-center gap-1">
                <Clock size={14} />
                Due: {new Date(project.deadline).toLocaleDateString()}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="bg-blue-50 p-4 rounded-xl">
              <div className="flex items-center gap-2 mb-2">
                <BookOpen className="text-blue-600" size={20} />
                <span className="font-semibold text-blue-800">Grade Level</span>
              </div>
              <p className="text-blue-600">Grade {project.grade_level}</p>
            </div>
            
            <div className="bg-purple-50 p-4 rounded-xl">
              <div className="flex items-center gap-2 mb-2">
                <Star className="text-purple-600" size={20} />
                <span className="font-semibold text-purple-800">Category</span>
              </div>
              <p className="text-purple-600">{project.category}</p>
            </div>
            
            <div className="bg-orange-50 p-4 rounded-xl">
              <div className="flex items-center gap-2 mb-2">
                <Award className="text-orange-600" size={20} />
                <span className="font-semibold text-orange-800">Difficulty</span>
              </div>
              <p className="text-orange-600 capitalize">{project.difficulty}</p>
            </div>
          </div>

          <div className="mb-6">
            <h3 className="text-xl font-bold text-gray-800 mb-3">Description</h3>
            <p className="text-gray-700 leading-relaxed">{project.description}</p>
          </div>

          <div className="flex gap-4">
            <Button onClick={() => onBid(project)} className="flex-1">
              <Heart size={16} className="mr-2" />
              Submit Bid
            </Button>
            <Button variant="outline">
              <Send size={16} className="mr-2" />
              Message Parent
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

const BidModal = ({ project, onClose, onSubmit }) => {
  const [bidData, setBidData] = useState({ amount: '', message: '' });

  const handleSubmit = () => {
    onSubmit({
      project_id: project.project_id,
      amount: parseFloat(bidData.amount),
      message: bidData.message
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md"
      >
        <h2 className="text-xl font-bold text-gray-800 mb-4">Submit Bid</h2>
        <h3 className="text-lg text-gray-600 mb-4">{project.title}</h3>
        
        <Input
          label="Your Bid Amount (₹)"
          type="number"
          value={bidData.amount}
          onChange={(e) => setBidData({...bidData, amount: e.target.value})}
          placeholder="Enter your bid amount"
          required
        />
        
        <div className="mb-4">
          <label className="block text-gray-700 font-semibold mb-2">Proposal Message</label>
          <textarea
            value={bidData.message}
            onChange={(e) => setBidData({...bidData, message: e.target.value})}
            rows={3}
            placeholder="Explain why you're the best choice for this project..."
            className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-indigo-400 focus:outline-none"
            required
          />
        </div>
        
        <div className="flex gap-3">
          <Button onClick={handleSubmit} className="flex-1">Submit Bid</Button>
          <Button onClick={onClose} variant="outline">Cancel</Button>
        </div>
      </motion.div>
    </motion.div>
  );
};

const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ email: '', password: '', name: '', role: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();

  const handleSubmit = async () => {
    if (loading) return;
    
    setError('');
    setLoading(true);
    
    try {
      let result;
      if (isLogin) {
        result = await api.auth.login(formData.email, formData.password);
      } else {
        result = await api.auth.register(formData);
      }
      login(result.user, result.token);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl p-8 w-full max-w-md"
      >
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
            ProjectConnect
          </h1>
          <p className="text-gray-600">Connect. Create. Learn.</p>
        </div>

        {!isLogin && (
          <Input
            label="Full Name"
            icon={User}
            value={formData.name}
            onChange={(e) => setFormData({...formData, name: e.target.value})}
            placeholder="Enter your name"
            required
          />
        )}
        
        <Input
          label="Email"
          type="email"
          icon={Mail}
          value={formData.email}
          onChange={(e) => setFormData({...formData, email: e.target.value})}
          placeholder="Enter your email"
          required
        />
        
        <Input
          label="Password"
          type="password"
          icon={Lock}
          value={formData.password}
          onChange={(e) => setFormData({...formData, password: e.target.value})}
          placeholder="Enter your password"
          required
        />
        
        {!isLogin && (
          <div className="mb-6">
            <label className="block text-gray-700 font-semibold mb-3">I am a...</label>
            <div className="grid grid-cols-2 gap-3">
              {['parent', 'helper'].map(role => (
                <motion.label
                  key={role}
                  whileHover={{ scale: 1.02 }}
                  className={`cursor-pointer p-4 rounded-xl border-2 text-center transition-all ${
                    formData.role === role
                      ? 'border-indigo-400 bg-indigo-50 text-indigo-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    value={role}
                    checked={formData.role === role}
                    onChange={(e) => setFormData({...formData, role: e.target.value})}
                    className="sr-only"
                  />
                  <div className="text-3xl mb-2">{role === 'parent' ? '👨‍👩‍👧‍👦' : '🎓'}</div>
                  <span className="font-medium capitalize">{role}</span>
                </motion.label>
              ))}
            </div>
          </div>
        )}
        
        {error && (
          <p className="text-red-500 text-center mb-4 text-sm">{error}</p>
        )}
        
        <Button onClick={handleSubmit} className="w-full mb-4" disabled={loading}>
          {loading ? 'Loading...' : (isLogin ? 'Sign In' : 'Create Account')}
        </Button>

        <p className="text-center text-gray-600">
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-indigo-600 hover:text-indigo-700 font-medium"
          >
            {isLogin ? 'Sign up' : 'Sign in'}
          </button>
        </p>
      </motion.div>
    </div>
  );
};

const HelperDashboard = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({});
  const [selectedProjectDetails, setSelectedProjectDetails] = useState(null);
  const { token } = useAuth();

  useEffect(() => {
    loadProjects();
  }, [filters]);

  const loadProjects = async () => {
    setLoading(true);
    try {
      const projectsData = await api.projects.getAll(filters);
      setProjects(projectsData.filter(p => p.status === 'open'));
    } catch (error) {
      console.error('Error loading projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleProjectClick = async (project) => {
    try {
      const fullProject = await api.projects.getById(project.project_id);
      setSelectedProjectDetails(fullProject);
    } catch (error) {
      console.error('Error loading project details:', error);
    }
  };

  const handleBid = async (bidData) => {
    try {
      await api.bids.create(bidData, token);
      setSelectedProject(null);
      setSelectedProjectDetails(null);
    } catch (error) {
      console.error('Error submitting bid:', error);
    }
  };

  const applyFilters = (newFilters) => {
    setFilters(newFilters);
    setShowFilters(false);
  };

  if (selectedProjectDetails) {
    return (
      <ProjectDetails 
        project={selectedProjectDetails}
        onBack={() => setSelectedProjectDetails(null)}
        onBid={setSelectedProject}
      />
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-emerald-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading projects...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-emerald-50">
      <div className="max-w-7xl mx-auto p-6">
        <motion.div 
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            Find Amazing Projects! 🔍
          </h1>
          <p className="text-gray-600">Help students bring their ideas to life</p>
        </motion.div>

        <div className="flex justify-center gap-4 mb-8">
          <Button variant="secondary">
            <Search className="mr-2" size={20} />
            Available Projects ({projects.length})
          </Button>
          <Button variant="outline" onClick={() => setShowFilters(true)}>
            <Filter className="mr-2" size={16} />
            Filter
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project, index) => (
            <motion.div
              key={project.project_id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <ProjectCard 
                project={project} 
                showBidButton={true}
                onClick={() => handleProjectClick(project)}
                onBid={setSelectedProject}
              />
            </motion.div>
          ))}
        </div>

        {projects.length === 0 && (
          <div className="text-center py-16 text-gray-500">
            <div className="text-6xl mb-4">🔍</div>
            <p className="text-xl">No projects found</p>
            <p className="text-gray-400 mt-2">Try adjusting your filters</p>
          </div>
        )}
      </div>

      {showFilters && (
        <FilterModal
          onClose={() => setShowFilters(false)}
          onApply={applyFilters}
          currentFilters={filters}
        />
      )}

      {selectedProject && (
        <BidModal
          project={selectedProject}
          onClose={() => setSelectedProject(null)}
          onSubmit={handleBid}
        />
      )}
    </div>
  );
};

const ParentDashboard = () => {
  const [myProjects, setMyProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user, token } = useAuth();

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      const myProjectsData = await api.projects.getMy(token);
      setMyProjects(myProjectsData);
    } catch (error) {
      console.error('Error loading projects:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading projects...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50">
      <div className="max-w-7xl mx-auto p-6">
        <motion.div 
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            Welcome, {user.name}! 👋
          </h1>
          <p className="text-gray-600">Your projects overview</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {myProjects.map((project, index) => (
            <motion.div
              key={project.project_id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <ProjectCard project={project} />
            </motion.div>
          ))}
        </div>

        {myProjects.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <div className="text-6xl mb-4">📝</div>
            <p className="text-xl mb-4">No projects created yet</p>
          </div>
        )}
      </div>
    </div>
  );
};

function App() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);

  const login = (userData, authToken) => {
    setUser(userData);
    setToken(authToken);
  };
  
  const logout = () => {
    setUser(null);
    setToken(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      <div className="App">
        {user && (
          <motion.nav
            initial={{ y: -100 }}
            animate={{ y: 0 }}
            className="bg-white shadow-lg border-b border-gray-200 sticky top-0 z-40"
          >
            <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                ProjectConnect
              </h1>
              <div className="flex items-center gap-4">
                <span className="text-gray-700 font-medium">Hi, {user.name}!</span>
                <Button onClick={logout} variant="outline" size="sm">
                  <LogOut size={16} className="mr-1" />
                  Logout
                </Button>
              </div>
            </div>
          </motion.nav>
        )}

        {!user ? (
          <AuthPage />
        ) : user.role === 'parent' ? (
          <ParentDashboard />
        ) : (
          <HelperDashboard />
        )}
      </div>
    </AuthContext.Provider>
  );
}

export default App;