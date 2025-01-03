import AsyncStorage from '@react-native-async-storage/async-storage';

// Storage Keys
const KEYS = {
  USERS: 'users',
  TASKS: 'tasks',
  CATEGORIES: 'categories',
  CURRENT_USER: 'currentUser'
};

// Initialize storage with default data
export const initStorage = async () => {
  try {
    // Initialize empty arrays for users and tasks
    const users = await AsyncStorage.getItem(KEYS.USERS);
    if (!users) await AsyncStorage.setItem(KEYS.USERS, JSON.stringify([]));

    const tasks = await AsyncStorage.getItem(KEYS.TASKS);
    if (!tasks) await AsyncStorage.setItem(KEYS.TASKS, JSON.stringify([]));

    return true;
  } catch (error) {
    console.error('Storage initialization error:', error);
    throw error;
  }
};

// User operations
export const registerUser = async (email, password) => {
  try {
    const users = JSON.parse(await AsyncStorage.getItem(KEYS.USERS)) || [];
    
    // Check if email already exists
    if (users.some(user => user.email === email)) {
      throw new Error('Email already registered');
    }

    const newUser = {
      id: Date.now(),
      email,
      password
    };

    users.push(newUser);
    await AsyncStorage.setItem(KEYS.USERS, JSON.stringify(users));
    
    // Return user without password
    const { password: _, ...userWithoutPassword } = newUser;
    return userWithoutPassword;
  } catch (error) {
    console.error('Error registering user:', error);
    throw error;
  }
};

export const validateUser = async (email, password) => {
  try {
    const users = JSON.parse(await AsyncStorage.getItem(KEYS.USERS)) || [];
    const user = users.find(u => u.email === email && u.password === password);
    
    if (user) {
      // Store current user
      const { password: _, ...userWithoutPassword } = user;
      await AsyncStorage.setItem(KEYS.CURRENT_USER, JSON.stringify(userWithoutPassword));
      return userWithoutPassword;
    }
    return null;
  } catch (error) {
    console.error('Error validating user:', error);
    throw error;
  }
};

// Task operations
export const createTask = async (title, description, dueDate, priority) => {
  try {
    const currentUser = await checkUser();
    const tasks = JSON.parse(await AsyncStorage.getItem(KEYS.TASKS)) || [];
    
    const newTask = {
      id: Date.now(),
      userId: currentUser.id,
      title,
      description,
      dueDate,
      status: 'pending',
      priority,
      createdAt: new Date().toISOString()
    };

    tasks.push(newTask);
    await AsyncStorage.setItem(KEYS.TASKS, JSON.stringify(tasks));
    return newTask;
  } catch (error) {
    console.error('Error creating task:', error);
    throw error;
  }
};

export const getTasks = async (userId) => {
  try {
    const tasks = JSON.parse(await AsyncStorage.getItem(KEYS.TASKS)) || [];
    const categories = JSON.parse(await AsyncStorage.getItem(KEYS.CATEGORIES)) || [];
    
    return tasks
      .filter(task => task.userId === userId)
      .map(task => ({
        ...task,
        category: task.categoryId ? 
          categories.find(c => c.id === task.categoryId) : null
      }))
      .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
  } catch (error) {
    console.error('Error getting tasks:', error);
    throw error;
  }
};

export const updateTask = async (taskId, updates) => {
  try {
    const tasks = JSON.parse(await AsyncStorage.getItem(KEYS.TASKS)) || [];
    const taskIndex = tasks.findIndex(t => t.id === taskId);
    
    if (taskIndex === -1) throw new Error('Task not found');

    tasks[taskIndex] = {
      ...tasks[taskIndex],
      ...updates,
      updatedAt: new Date().toISOString()
    };

    await AsyncStorage.setItem(KEYS.TASKS, JSON.stringify(tasks));
    return tasks[taskIndex];
  } catch (error) {
    console.error('Error updating task:', error);
    throw error;
  }
};

export const deleteTask = async (taskId) => {
  try {
    const tasks = JSON.parse(await AsyncStorage.getItem(KEYS.TASKS)) || [];
    const filteredTasks = tasks.filter(task => task.id !== taskId);
    await AsyncStorage.setItem(KEYS.TASKS, JSON.stringify(filteredTasks));
    return true;
  } catch (error) {
    console.error('Error deleting task:', error);
    throw error;
  }
};

// Additional useful functions
export const getCurrentUser = async () => {
  try {
    const userJson = await AsyncStorage.getItem(KEYS.CURRENT_USER);
    return userJson ? JSON.parse(userJson) : null;
  } catch (error) {
    console.error('Error getting current user:', error);
    throw error;
  }
};

export const logout = async () => {
  try {
    await AsyncStorage.removeItem(KEYS.CURRENT_USER);
    return true;
  } catch (error) {
    console.error('Error logging out:', error);
    throw error;
  }
};

const checkUser = async () => {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    throw new Error('No user logged in');
  }
  return currentUser;
}; 