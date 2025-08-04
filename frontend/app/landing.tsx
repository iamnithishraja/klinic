import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  Platform,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons, FontAwesome } from '@expo/vector-icons';
// @ts-ignore
import { useRouter } from 'expo-router';

// Components
import Logo from '@/components/Logo';
import FormButton from '@/components/FormButton';
import WebNavigation from '@/components/WebNavigation';
import SkeletonLoader, { 
  SkeletonText, 
  SkeletonCard, 
  SkeletonHero, 
  SkeletonStats, 
  SkeletonTestimonial 
} from '@/components/SkeletonLoader';

// Utils
import { isWeb, isMobile } from '@/utils/platformUtils';

// Types
interface FeatureCard {
  icon: string;
  title: string;
  description: string;
  color: string;
}

interface Testimonial {
  name: string;
  role: string;
  content: string;
  rating: number;
}

const LandingPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [activeTestimonial, setActiveTestimonial] = useState(0);
  const router = useRouter();
  const { width } = Dimensions.get('window');

  // Redirect to login screen if on mobile
  useEffect(() => {
    if (isMobile) {
      // On mobile devices, redirect to login screen
      router.replace('/(auth)/login' as any);
    }
    // On web, make sure we stay on landing page
    else if (isWeb) {
      console.log('Showing landing page on web');
    }
  }, [router]);

  // Simulate loading for skeleton states
  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 1500);
    return () => clearTimeout(timer);
  }, []);

  // Auto-rotate testimonials
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const features: FeatureCard[] = [
    {
      icon: 'doctor',
      title: 'Expert Doctors',
      description: 'Connect with verified healthcare professionals for consultations',
      color: '#4F46E5',
    },
    {
      icon: 'test-tube',
      title: 'Lab Tests',
      description: 'Book lab tests with home collection or visit our centers',
      color: '#10B981',
    },
    {
      icon: 'pill',
      title: 'Medicine Delivery',
      description: 'Get medicines delivered to your doorstep with prescriptions',
      color: '#F59E0B',
    },
    {
      icon: 'robot',
      title: 'AI Health Assistant',
      description: 'Get personalized health insights with our AI-powered assistant',
      color: '#8B5CF6',
    },
    {
      icon: 'video',
      title: 'Video Consultations',
      description: 'Consult doctors remotely with secure video calls',
      color: '#EF4444',
    },
    {
      icon: 'chart-line',
      title: 'Health Tracking',
      description: 'Monitor your health metrics and appointment history',
      color: '#06B6D4',
    },
  ];

  const testimonials: Testimonial[] = [
    {
      name: 'Sarah Johnson',
      role: 'Patient',
      content: 'Klinic made booking my doctor appointment so easy. The video consultation was seamless and the doctor was very professional.',
      rating: 5,
    },
    {
      name: 'Dr. Michael Chen',
      role: 'Cardiologist',
      content: 'As a healthcare provider, Klinic has streamlined my practice. The platform is intuitive and helps me serve more patients effectively.',
      rating: 5,
    },
    {
      name: 'Priya Patel',
      role: 'Patient',
      content: 'The lab test booking with home collection saved me so much time. Results were delivered quickly and the process was hassle-free.',
      rating: 5,
    },
  ];

  const stats = [
    { number: '50K+', label: 'Happy Patients' },
    { number: '500+', label: 'Expert Doctors' },
    { number: '100+', label: 'Lab Centers' },
    { number: '24/7', label: 'AI Support' },
  ];

  const handleGetStarted = () => {
    router.push('/(auth)/register' as any);
  };

  const handleLogin = () => {
    router.push('/(auth)/login' as any);
  };

  const renderSkeleton = () => <SkeletonText lines={3} />;

  const renderStars = (rating: number) => (
    <View className="flex-row">
      {[1, 2, 3, 4, 5].map((star) => (
        <FontAwesome
          key={star}
          name={star <= rating ? 'star' : 'star-o'}
          size={16}
          color={star <= rating ? '#FBBF24' : '#D1D5DB'}
          style={{ marginRight: 2 }}
        />
      ))}
    </View>
  );

  return (
    <ScrollView className="flex-1 bg-background" showsVerticalScrollIndicator={false}>
      <SafeAreaView>
        {/* Header */}
        <WebNavigation onLogin={handleLogin} onGetStarted={handleGetStarted} />

        {/* Hero Section */}
        <View className="px-6 py-8">
          <LinearGradient
            colors={['#4F46E5', '#6366F1', '#8B5CF6']}
            className="rounded-3xl p-8 mb-8"
          >
            {loading ? (
              <SkeletonHero />
            ) : (
              <>
                <Text className="text-4xl font-bold text-white mb-4 text-center">
                  Healthcare at Your Fingertips
                </Text>
                <Text className="text-lg text-white/90 text-center mb-8 leading-relaxed">
                  Connect with expert doctors, book lab tests, and get medicines delivered. 
                  All your healthcare needs in one comprehensive platform.
                </Text>
                <View className="flex-row justify-center space-x-4">
                  <TouchableOpacity
                    onPress={handleGetStarted}
                    className="bg-white px-6 py-3 rounded-lg flex-row items-center"
                  >
                    <MaterialCommunityIcons name="play" size={20} color="#4F46E5" />
                    <Text className="text-primary font-semibold ml-2">Get Started</Text>
                  </TouchableOpacity>
                  <TouchableOpacity className="border border-white px-6 py-3 rounded-lg">
                    <Text className="text-white font-semibold">Learn More</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </LinearGradient>
        </View>

        {/* Stats Section */}
        <View className="px-6 mb-12">
          <View className="bg-white rounded-2xl p-6 shadow-sm">
            <View className="flex-row justify-between">
              {stats.map((stat, index) => (
                <View key={index} className="items-center">
                  {loading ? (
                    <View className="h-8 w-16 bg-gray-200 rounded mb-2" />
                  ) : (
                    <Text className="text-2xl font-bold text-primary mb-1">
                      {stat.number}
                    </Text>
                  )}
                  <Text className="text-sm text-text-secondary text-center">
                    {stat.label}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* Features Section */}
        <View className="px-6 mb-12">
          <Text className="text-3xl font-bold text-text-primary mb-8 text-center">
            Why Choose Klinic?
          </Text>
          <View className="space-y-4">
            {features.map((feature, index) => (
              <View
                key={index}
                className="bg-white rounded-xl p-6 shadow-sm border border-gray-100"
              >
                <View className="flex-row items-start space-x-4">
                  <View
                    className="w-12 h-12 rounded-lg items-center justify-center"
                    style={{ backgroundColor: feature.color }}
                  >
                    <MaterialCommunityIcons
                      name={feature.icon as any}
                      size={24}
                      color="white"
                    />
                  </View>
                  <View className="flex-1">
                    {loading ? (
                      <SkeletonText lines={2} />
                    ) : (
                      <>
                        <Text className="text-lg font-semibold text-text-primary mb-2">
                          {feature.title}
                        </Text>
                        <Text className="text-text-secondary leading-relaxed">
                          {feature.description}
                        </Text>
                      </>
                    )}
                  </View>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Testimonials Section */}
        <View className="px-6 mb-12">
          <Text className="text-3xl font-bold text-text-primary mb-8 text-center">
            What Our Users Say
          </Text>
          <View className="bg-white rounded-2xl p-6 shadow-sm">
            {loading ? (
              <SkeletonTestimonial />
            ) : (
              <>
                <Text className="text-lg text-text-primary mb-4 text-center italic">
                  &ldquo;{testimonials[activeTestimonial].content}&rdquo;
                </Text>
                <View className="items-center">
                  <Text className="font-semibold text-text-primary mb-1">
                    {testimonials[activeTestimonial].name}
                  </Text>
                  <Text className="text-text-secondary mb-2">
                    {testimonials[activeTestimonial].role}
                  </Text>
                  {renderStars(testimonials[activeTestimonial].rating)}
                </View>
                <View className="flex-row justify-center mt-4 space-x-2">
                  {testimonials.map((_, index) => (
                    <TouchableOpacity
                      key={index}
                      onPress={() => setActiveTestimonial(index)}
                      className={`w-2 h-2 rounded-full ${
                        index === activeTestimonial ? 'bg-primary' : 'bg-gray-300'
                      }`}
                    />
                  ))}
                </View>
              </>
            )}
          </View>
        </View>

        {/* CTA Section */}
        <View className="px-6 mb-12">
          <LinearGradient
            colors={['#10B981', '#059669']}
            className="rounded-2xl p-8"
          >
            <Text className="text-2xl font-bold text-white mb-4 text-center">
              Ready to Get Started?
            </Text>
            <Text className="text-white/90 text-center mb-6">
              Join thousands of users who trust Klinic for their healthcare needs
            </Text>
            <View className="flex-row justify-center space-x-4">
              <TouchableOpacity
                onPress={handleGetStarted}
                className="bg-white px-6 py-3 rounded-lg"
              >
                <Text className="text-green-600 font-semibold">Sign Up Now</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleLogin}
                className="border border-white px-6 py-3 rounded-lg"
              >
                <Text className="text-white font-semibold">Login</Text>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </View>

        {/* Footer */}
        <View className="px-6 py-8 bg-gray-50">
          <View className="items-center">
            <Logo size="small" />
            <Text className="text-text-secondary text-center mt-4">
              © 2024 Klinic. All rights reserved.
            </Text>
            <Text className="text-text-secondary text-center mt-2">
              Healthcare at your fingertips
            </Text>
          </View>
        </View>
      </SafeAreaView>
    </ScrollView>
  );
};

export default LandingPage; 