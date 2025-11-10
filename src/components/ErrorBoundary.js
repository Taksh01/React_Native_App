import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <SafeAreaView style={styles.container}>
          <ScrollView contentContainerStyle={styles.content}>
            <Text style={styles.title}>⚠️ Error Detected</Text>
            <Text style={styles.errorText}>{String(this.state.error)}</Text>
            
            <Text style={styles.stackTitle}>Component Stack:</Text>
            <Text style={styles.stackText}>
              {this.state.errorInfo?.componentStack || 'No stack available'}
            </Text>
            
            <Text style={styles.hint}>
              Check the component stack above to find which screen is causing the error.
            </Text>
          </ScrollView>
        </SafeAreaView>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fee2e2' },
  content: { padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#dc2626', marginBottom: 16 },
  errorText: { fontSize: 16, color: '#991b1b', marginBottom: 20, fontFamily: 'monospace' },
  stackTitle: { fontSize: 18, fontWeight: 'bold', color: '#dc2626', marginBottom: 8 },
  stackText: { fontSize: 12, color: '#7f1d1d', fontFamily: 'monospace', lineHeight: 18 },
  hint: { fontSize: 14, color: '#991b1b', marginTop: 20, fontStyle: 'italic' },
});

export default ErrorBoundary;
