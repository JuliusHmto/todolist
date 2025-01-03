import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  RefreshControl,
} from 'react-native';
import { getTasks, getCurrentUser } from '../utils/storage';
import * as SecureStore from 'expo-secure-store';
import { formatDate } from '../utils/helpers';

export default function DashboardScreen({ navigation }) {
  const [tasks, setTasks] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    completed: 0
  });
  const [userEmail, setUserEmail] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const loadUserData = async () => {
    try {
      const user = await getCurrentUser();
      if (user) {
        setUserEmail(user.email);
        const userTasks = await getTasks(user.id);
        setTasks(userTasks);
        
        // Calculate stats when tasks are loaded
        setStats({
          total: userTasks.length,
          pending: userTasks.filter(t => t.status === 'pending').length,
          completed: userTasks.filter(t => t.status === 'completed').length
        });
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  useEffect(() => {
    loadUserData();
  }, []);

  const handleLogout = async () => {
    try {
      await SecureStore.deleteItemAsync('userToken');
      navigation.replace('Login');
    } catch (error) {
      console.error('Logout error:', error);
      Alert.alert('Error', 'Failed to logout');
    }
  };

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    try {
      const user = await getCurrentUser();
      if (user) {
        setUserEmail(user.email);
        const userTasks = await getTasks(user.id);
        setTasks(userTasks);
        loadUserData();
      }
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setRefreshing(false);
    }
  }, []);

  return (
    <ScrollView
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={['#4CAF50']} 
          tintColor="#4CAF50"
        />
      }
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Welcome, {userEmail}</Text>
        </View>
        <View style={styles.header}>
          <View style={styles.headerButtons}>
            <TouchableOpacity
              style={styles.viewTasksButton}
              onPress={() => navigation.navigate('TaskList')}
            >
              <Text style={styles.viewTasksText}>View All Tasks</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.logoutButton}
              onPress={handleLogout}
            >
              <Text style={styles.logoutButtonText}>Logout</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{stats.total}</Text>
            <Text style={styles.statLabel}>Total Tasks</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{stats.pending}</Text>
            <Text style={styles.statLabel}>Pending</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{stats.completed}</Text>
            <Text style={styles.statLabel}>Completed</Text>
          </View>
        </View>

        <View style={styles.recentTasks}>
          <Text style={styles.sectionTitle}>Recent Tasks</Text>
          {tasks.slice(0, 3).map(task => (
            <View key={task.id} style={styles.taskItem}>
              <Text style={styles.taskTitle}>{task.title}</Text>
              <Text style={styles.taskDate}>Due: {formatDate(task.dueDate)}</Text>
              <Text style={styles.taskDate}>{task.status}</Text>
            </View>
          ))}
        </View>

      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  viewTasksButton: {
    backgroundColor: '#007AFF',
    padding: 8,
    borderRadius: 5,
  },
  viewTasksText: {
    color: 'white',
    fontWeight: '500',
  },
  logoutButton: {
    backgroundColor: '#FF3B30',
    padding: 8,
    borderRadius: 5,
  },
  logoutButtonText: {
    color: 'white',
    fontWeight: '500',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 20,
  },
  statBox: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    width: '30%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
  },
  recentTasks: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  taskItem: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '500',
  },
  taskDate: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
  }
}); 