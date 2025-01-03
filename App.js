import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';
import LoginScreen from './screens/LoginScreen';
import DashboardScreen from './screens/DashboardScreen';
import TaskListScreen from './screens/TaskListScreen';
import { initStorage } from './utils/storage';
import { useEffect } from 'react';

const Stack = createStackNavigator();

export default function App() {
  useEffect(() => {
    initStorage()
      .then(() => console.log('Storage initialized'))
      .catch(error => console.error('Storage init error:', error));
  }, []);

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Login">
        <Stack.Screen 
          name="Login" 
          component={LoginScreen} 
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="Dashboard" 
          component={DashboardScreen}
          options={{ headerLeft: null }}
        />
        <Stack.Screen name="TaskList" component={TaskListScreen} />
      </Stack.Navigator>
      <StatusBar style="auto" />
    </NavigationContainer>
  );
}
