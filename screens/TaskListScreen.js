import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Modal,
  TextInput,
  Alert,
  RefreshControl
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { getTasks, createTask, updateTask, deleteTask, getCurrentUser } from '../utils/storage';
import { scheduleTaskNotification, cancelTaskNotification } from '../utils/notifications';
import { formatDate } from '../utils/helpers';

export default function TaskListScreen() {
  const [tasks, setTasks] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState(new Date());
  const [priority, setPriority] = useState('medium');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [filter, setFilter] = useState('all'); // 'all', 'pending', 'completed'
  const [sortBy, setSortBy] = useState('dueDate'); // 'dueDate', 'priority'
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    try {
      const user = await getCurrentUser();
      if (user) {
        const userTasks = await getTasks(user.id);
        setTasks(userTasks);
        console.log('Tasks loaded:', userTasks); // Debug log
      }
    } catch (error) {
      console.error('Error loading tasks:', error);
    }
  };

  const handleSaveTask = async () => {
    try {
      if (!title.trim()) {
        Alert.alert('Error', 'Title is required');
        return;
      }

      const formattedDueDate = dueDate instanceof Date ? 
        dueDate.toISOString() : 
        new Date(dueDate).toISOString();

      let result;
      if (editingTask) {
        result = await updateTask(editingTask.id, {
          title,
          description,
          dueDate: formattedDueDate,
          status: editingTask.status,
          priority
        });
        console.log('Task updated:', result); // Debug log
      } else {
        result = await createTask(
          title,
          description,
          formattedDueDate,
          priority
        );
        console.log('Task created:', result); // Debug log
      }

      if (result) {
        const notificationId = await scheduleTaskNotification(
          result.id,
          title,
          new Date(formattedDueDate)
        );
        console.log('Notification scheduled:', notificationId); // Debug log
      }

      setModalVisible(false);
      clearForm();
      await loadTasks(); // Make sure to await this
    } catch (error) {
      console.error('Error saving task:', error);
      Alert.alert('Error', 'Failed to save task');
    }
  };

  const handleDeleteTask = async (taskId) => {
    try {
      await deleteTask(taskId);
      loadTasks();
    } catch (error) {
      console.error('Error deleting task:', error);
      Alert.alert('Error', 'Failed to delete task');
    }
  };

  const clearForm = () => {
    setTitle('');
    setDescription('');
    setDueDate(new Date());
    setPriority('medium');
    setEditingTask(null);
  };

  const openEditModal = (task) => {
    setEditingTask(task);
    setTitle(task.title);
    setDescription(task.description);
    setDueDate(new Date(task.due_date));
    setPriority(task.priority);
    setModalVisible(true);
  };

  const renderTask = ({ item }) => {
    if (!item) return null;
    return (
      <View style={styles.taskItem}>
        <View style={styles.taskContent}>
          <Text style={styles.taskTitle}>{item.title}</Text>
          <Text style={styles.taskDescription}>{item.description}</Text>
          <Text style={styles.taskDate}>
            Due: {formatDate(item.dueDate)}
          </Text>
          <Text>Status: {item.status}</Text>
        </View>
        <View style={styles.taskActions}>
          {item.status !== 'completed' ?
            <TouchableOpacity 
              style={[styles.actionButton, styles.completeButtonColor]}
              onPress={() => handleToggleComplete(item)}
            >
              <Text style={styles.actionButtonText}>Complete</Text>
            </TouchableOpacity>
            : null}
          <TouchableOpacity 
            style={[styles.actionButton, styles.editButton]}
            onPress={() => openEditModal(item)}
          >
            <Text style={styles.actionButtonText}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.actionButton, styles.deleteButton]}
            onPress={() => handleDeleteTask(item.id)}
          >
            <Text style={styles.actionButtonText}>Delete</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderFilterButtons = () => (
    <View style={styles.filterContainer}>
      {['All', 'Pending', 'Completed'].map((filter) => (
        <TouchableOpacity
          key={filter}
          style={[
            styles.filterButton,
            filter === statusFilter && styles.filterButtonActive
          ]}
          onPress={() => setStatusFilter(filter)}
        >
          <Text style={[
            styles.filterButtonText,
            filter === statusFilter && styles.filterButtonTextActive
          ]}>
            {filter}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderSearchBar = () => (
    <TextInput
      style={styles.searchInput}
      placeholder="Search tasks..."
      value={searchQuery}
      onChangeText={setSearchQuery}
    />
  );

  const handleToggleComplete = async (task) => {
    try {
      const newStatus = task.status === 'completed' ? 'pending' : 'completed';
      await updateTask(task.id, {
        ...task,
        status: newStatus
      });
      await loadTasks(); // Reload tasks to update the UI
    } catch (error) {
      console.error('Error toggling task completion:', error);
      Alert.alert('Error', 'Failed to update task status');
    }
  };

  const getFilteredTasks = () => {
    if (!tasks) return [];
    
    return tasks.filter(task => {
      const matchesSearch = task && task.title && 
        task.title.toLowerCase().includes((searchQuery || '').toLowerCase());
        
      switch (statusFilter) {
        case 'Pending':
          return matchesSearch && task.status !== 'completed';
        case 'Completed':
          return matchesSearch && task.status === 'completed';
        default: // 'All'
          return matchesSearch;
      }
    });
  };

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    try {
      await loadTasks();
    } catch (error) {
      console.error('Error refreshing tasks:', error);
    } finally {
      setRefreshing(false);
    }
  }, []);

  return (
    <View style={styles.container}>
      {renderSearchBar()}
      {renderFilterButtons()}
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={styles.sortButton}
          onPress={() => setSortBy(sortBy === 'dueDate' ? 'priority' : 'dueDate')}
        >
          <Text style={styles.sortButtonText}>
            Sort by: {sortBy === 'dueDate' ? 'Due Date' : 'Priority'}
          </Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity 
        style={styles.addButton}
        onPress={() => {
          clearForm();
          setModalVisible(true);
        }}
      >
        <Text style={styles.addButtonText}>Add New Task</Text>
      </TouchableOpacity>

      <FlatList
        data={getFilteredTasks()}
        renderItem={renderTask}
        keyExtractor={item => item.id.toString()}
        style={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#4CAF50']}
            tintColor="#4CAF50"
          />
        }
        contentContainerStyle={styles.listContainer}
      />

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {editingTask ? 'Edit Task' : 'New Task'}
            </Text>
            
            <TextInput
              style={styles.input}
              placeholder="Task Title"
              value={title}
              onChangeText={setTitle}
            />
            
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Description"
              value={description}
              onChangeText={setDescription}
              multiline
            />

            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => setShowDatePicker(true)}
            >
              <Text>Due Date: {dueDate.toLocaleDateString()}</Text>
            </TouchableOpacity>

            {showDatePicker && (
              <DateTimePicker
                value={dueDate}
                mode="date"
                onChange={(event, selectedDate) => {
                  setShowDatePicker(false);
                  if (selectedDate) {
                    setDueDate(selectedDate);
                  }
                }}
              />
            )}

            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.button, styles.saveButton]}
                onPress={handleSaveTask}
              >
                <Text style={styles.buttonText}>Save</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={() => {
                  setModalVisible(false);
                  clearForm();
                }}
              >
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 15,
  },
  addButton: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
    marginBottom: 15,
  },
  addButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  list: {
    flex: 1,
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
  taskContent: {
    marginBottom: 10,
  },
  taskTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  taskDescription: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  taskDate: {
    fontSize: 12,
    color: '#999',
    marginTop: 5,
  },
  taskActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  actionButton: {
    padding: 8,
    borderRadius: 5,
    marginLeft: 10,
  },
  completeButtonColor: {
    backgroundColor: 'lightblue',
  },
  editButton: {
    backgroundColor: '#4CAF50',
  },
  deleteButton: {
    backgroundColor: '#f44336',
  },
  actionButtonText: {
    color: 'white',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    margin: 20,
    padding: 20,
    borderRadius: 10,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  input: {
    backgroundColor: '#f5f5f5',
    padding: 10,
    borderRadius: 5,
    marginBottom: 10,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  dateButton: {
    padding: 10,
    backgroundColor: '#f5f5f5',
    borderRadius: 5,
    marginBottom: 10,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 15,
  },
  button: {
    padding: 10,
    borderRadius: 5,
    flex: 0.48,
  },
  saveButton: {
    backgroundColor: '#007AFF',
  },
  cancelButton: {
    backgroundColor: '#666',
  },
  buttonText: {
    color: 'white',
    textAlign: 'center',
    fontSize: 16,
  },
  searchInput: {
    backgroundColor: 'white',
    padding: 10,
    borderRadius: 5,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  filterContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 10,
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    margin: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  filterButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#fff',
    minWidth: 100,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 2,
  },
  filterButtonActive: {
    backgroundColor: '#4CAF50',
  },
  filterButtonText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  filterButtonTextActive: {
    color: '#fff',
  },
  listContainer: {
    flexGrow: 1,
    paddingBottom: 20
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  completeButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  completedButton: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  completeButtonText: {
    color: '#4CAF50',
    fontSize: 16,
    fontWeight: 'bold',
  },
  completedTask: {
    opacity: 0.7,
    backgroundColor: '#f5f5f5',
  },
  completedText: {
    textDecorationLine: 'line-through',
    color: '#888',
  },
}); 