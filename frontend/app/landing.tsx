import React, { useState, useEffect, useRef } from 'react';
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
import { MaterialCommunityIcons, FontAwesome, Ionicons } from '@expo/vector-icons';
// @ts-ignore
import { useRouter } from 'expo-router';

// Components
import Logo from '@/components/Logo';
import FormButton from '@/components/FormButton';
import WebNavigation from '@/components/WebNavigation';

// Utils
import { isWeb, isMobile } from '@/utils/platformUtils';

// Types
interface SectionData {
  id: string;
  title: string;
  icon: string;
  color: string;
  gradient: [string, string, string];
  image: string;
  description: string;
  features: string[];
  benefits: string[];
  imagePosition: 'left' | 'right';
}

const LandingPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const router = useRouter();
  const { width } = Dimensions.get('window');

  // Section refs for scrolling
  const doctorsRef = useRef<View | null>(null);
  const labsRef = useRef<View | null>(null);
  const medicinesRef = useRef<View | null>(null);
  const aiRef = useRef<View | null>(null);
  const videoRef = useRef<View | null>(null);

  // Redirect to login screen if on mobile
  useEffect(() => {
    if (isMobile) {
      router.replace('/(auth)/login' as any);
    }
  }, [router]);

  const sections: SectionData[] = [
    {
      id: 'doctors',
      title: 'Expert Doctors',
      icon: 'stethoscope',
      color: '#4F46E5',
      gradient: ['#4F46E5', '#6366F1', '#8B5CF6'],
      image: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=800&h=600&fit=crop',
      description: 'Connect with verified healthcare professionals across all medical specialties. Book online or in-person consultations with flexible scheduling.',
      imagePosition: 'right',
      features: [
        '500+ Verified Doctors',
        'Online & In-Person Consultations',
        'Video Consultation Support',
        'Flexible Appointment Scheduling',
        'Professional Credential Verification',
        'Patient Reviews & Ratings'
      ],
      benefits: [
        '24/7 Doctor Availability',
        'No Waiting Room Queues',
        'Expert Second Opinions',
        'Digital Prescriptions'
      ]
    },
    {
      id: 'laboratories',
      title: 'Lab Services',
      icon: 'test-tube',
      color: '#10B981',
      gradient: ['#10B981', '#059669', '#047857'],
      image: 'https://images.unsplash.com/photo-1576086213369-97a306d36557?w=800&h=600&fit=crop',
      description: 'Access comprehensive diagnostic services with home collection or lab visits. Get quick results and digital reports.',
      imagePosition: 'left',
      features: [
        '100+ Lab Centers',
        'Home Sample Collection',
        'Lab Visit Options',
        'Wide Range of Tests',
        'Quick Result Delivery',
        'Digital Report System'
      ],
      benefits: [
        'Convenient Home Collection',
        'Same Day Results',
        'Comprehensive Test Menu',
        'Quality Guaranteed'
      ]
    },
    {
      id: 'medicines',
      title: 'Medicine Delivery',
      icon: 'pill',
      color: '#F59E0B',
      gradient: ['#F59E0B', '#D97706', '#B45309'],
      image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=800&h=600&fit=crop',
      description: 'Get prescribed medicines delivered to your doorstep with secure prescription verification and professional delivery.',
      imagePosition: 'right',
      features: [
        'Prescription Upload Required',
        'Doorstep Delivery',
        'Wide Medicine Range',
        'Secure Payment Options',
        'Real-time Tracking',
        'Professional Delivery Partners'
      ],
      benefits: [
        'No Pharmacy Queues',
        'Verified Medications',
        'Timely Delivery',
        'Cost Savings'
      ]
    },
    {
      id: 'ai-assistant',
      title: 'AI Health Assistant',
      icon: 'robot',
      color: '#8B5CF6',
      gradient: ['#8B5CF6', '#7C3AED', '#6D28D9'],
      image: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&h=600&fit=crop',
      description: 'Get personalized health insights and recommendations from our advanced AI assistant. 24/7 health guidance at your fingertips.',
      imagePosition: 'left',
      features: [
        'Symptom Analysis',
        'Health Recommendations',
        'Doctor & Lab Suggestions',
        'Medical History Analysis',
        'Preventive Care Guidance',
        '24/7 Health Support'
      ],
      benefits: [
        'Instant Health Guidance',
        'Personalized Recommendations',
        'Preventive Care Tips',
        'Always Available'
      ]
    },
    {
      id: 'video-consultations',
      title: 'Video Consultations',
      icon: 'video',
      color: '#EF4444',
      gradient: ['#EF4444', '#DC2626', '#B91C1C'],
      image: 'https://www.charakayurveda.com/wp-content/uploads/2023/04/video-consult.jpeg',
      description: 'Consult doctors remotely with high-quality, secure video calls. Get expert medical advice without leaving your home.',
      imagePosition: 'right',
      features: [
        'HD Video Quality',
        'Secure Encryption',
        'Screen Sharing Capability',
        'Recording Options',
        'Multi-platform Support',
        'Technical Support'
      ],
      benefits: [
        'No Travel Required',
        'Secure & Private',
        'High Quality Audio/Video',
        'Technical Support Available'
      ]
    }
  ];

  const handleGetStarted = () => {
    router.push('/(auth)/register' as any);
  };

  const handleLogin = () => {
    router.push('/(auth)/login' as any);
  };

  const scrollToSection = (sectionId: string) => {
    const refs = {
      'doctors': doctorsRef,
      'laboratories': labsRef,
      'medicines': medicinesRef,
      'ai-assistant': aiRef,
      'video-consultations': videoRef
    };
    
    const ref = refs[sectionId as keyof typeof refs];
    if (ref?.current) {
      ref.current.measureLayout(
        scrollViewRef.current?.getInnerViewNode() || {},
        (x, y) => {
          scrollViewRef.current?.scrollTo({ y: y - 100, animated: true });
        },
        () => {}
      );
    }
  };

  const renderSection = (section: SectionData, ref: React.RefObject<View | null>) => {
    const isImageLeft = section.imagePosition === 'left';
    
    return (
      <View ref={ref} style={{ paddingHorizontal: 24, marginBottom: 40 }}>
        {/* Section Header */}
        <View style={{ marginBottom: 24, alignItems: 'center' }}>
          <View style={{ 
            backgroundColor: `${section.color}15`, 
            paddingHorizontal: 12, 
            paddingVertical: 6, 
            borderRadius: 16, 
            marginBottom: 12 
          }}>
            <MaterialCommunityIcons name={section.icon as any} size={20} color={section.color} />
          </View>
          <Text style={{ 
            fontSize: 32, 
            fontWeight: 'bold', 
            color: '#111827', 
            marginBottom: 12, 
            textAlign: 'center',
            lineHeight: 40
          }}>
            {section.title}
          </Text>
          <Text style={{ 
            fontSize: 16, 
            color: '#6B7280', 
            textAlign: 'center', 
            lineHeight: 24,
            maxWidth: 600
          }}>
            {section.description}
          </Text>
        </View>

        {/* Features and Image */}
        <View style={{ 
          backgroundColor: '#fff', 
          borderRadius: 16, 
          overflow: 'hidden', 
          shadowColor: '#000', 
          shadowOpacity: 0.08, 
          shadowRadius: 12, 
          elevation: 4,
          borderWidth: 1,
          borderColor: '#F3F4F6'
        }}>
          <View style={{ flexDirection: isImageLeft ? 'row' : 'row-reverse' }}>
            <View style={{ flex: 1, padding: 24 }}>
              <Text style={{ 
                fontSize: 20, 
                fontWeight: 'bold', 
                color: '#111827', 
                marginBottom: 16,
                lineHeight: 28
              }}>
                Why Choose {section.title}?
              </Text>
              <View style={{ gap: 10 }}>
                {section.features.map((feature, index) => (
                  <View key={index} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <View style={{
                      backgroundColor: `${section.color}15`,
                      padding: 4,
                      borderRadius: 6
                    }}>
                      <MaterialCommunityIcons name="check-circle" size={14} color={section.color} />
                    </View>
                    <Text style={{ color: '#374151', fontSize: 14, lineHeight: 20 }}>{feature}</Text>
                  </View>
                ))}
              </View>
            </View>
            <View style={{ flex: 1, position: 'relative' }}>
              <Image
                source={{ uri: section.image }}
                style={{ 
                  width: '100%', 
                  height: '100%', 
                  resizeMode: 'cover',
                  borderTopRightRadius: isImageLeft ? 0 : 16,
                  borderBottomRightRadius: isImageLeft ? 0 : 16,
                  borderTopLeftRadius: isImageLeft ? 16 : 0,
                  borderBottomLeftRadius: isImageLeft ? 16 : 0
                }}
              />
              <View style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0,0,0,0.1)',
                borderTopRightRadius: isImageLeft ? 0 : 16,
                borderBottomRightRadius: isImageLeft ? 0 : 16,
                borderTopLeftRadius: isImageLeft ? 16 : 0,
                borderBottomLeftRadius: isImageLeft ? 16 : 0
              }} />
            </View>
          </View>
        </View>

        {/* Benefits Section */}
        <View style={{ 
          backgroundColor: '#fff', 
          borderRadius: 16, 
          padding: 24, 
          marginTop: 16, 
          shadowColor: '#000', 
          shadowOpacity: 0.05, 
          shadowRadius: 6, 
          elevation: 2,
          borderWidth: 1,
          borderColor: '#F3F4F6'
        }}>
          <Text style={{ 
            fontSize: 18, 
            fontWeight: 'bold', 
            color: '#111827', 
            marginBottom: 16,
            textAlign: 'center'
          }}>
            Key Benefits
          </Text>
          <View style={{ gap: 10 }}>
            {section.benefits.map((benefit, index) => (
              <View key={index} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <View style={{
                  backgroundColor: `${section.color}15`,
                  padding: 4,
                  borderRadius: 6
                }}>
                  <MaterialCommunityIcons name="star" size={14} color={section.color} />
                </View>
                <Text style={{ color: '#374151', fontSize: 14, lineHeight: 20 }}>{benefit}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>
    );
  };

  return (
    <ScrollView 
      ref={scrollViewRef}
      style={{ flex: 1, backgroundColor: '#FFFFFF' }} 
      showsVerticalScrollIndicator={false}
    >
      <SafeAreaView>
        {/* Hero Section - At the very top */}
        <View style={{ paddingHorizontal: 24, paddingVertical: 40 }}>
          <LinearGradient
            colors={['#667eea', '#764ba2']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ 
              borderRadius: 20, 
              padding: 40,
              shadowColor: '#000',
              shadowOpacity: 0.1,
              shadowRadius: 12,
              elevation: 6
            }}
          >
            <View style={{ alignItems: 'center', marginBottom: 24 }}>
              <View style={{
                backgroundColor: 'rgba(255,255,255,0.2)',
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 16,
                marginBottom: 16
              }}>
                <Text style={{ color: '#fff', fontSize: 12, fontWeight: '600' }}>
                  🏥 Complete Healthcare Ecosystem
                </Text>
              </View>
              <Text style={{ 
                fontSize: 40, 
                fontWeight: 'bold', 
                color: '#fff', 
                marginBottom: 16, 
                textAlign: 'center',
                lineHeight: 48,
                maxWidth: 600
              }}>
                Your Health, Our Priority
              </Text>
              <Text style={{ 
                fontSize: 18, 
                color: 'rgba(255,255,255,0.9)', 
                textAlign: 'center', 
                marginBottom: 24, 
                lineHeight: 24,
                maxWidth: 500
              }}>
                Connect with expert doctors, get lab tests, order medicines, and access AI-powered health guidance - all in one comprehensive healthcare platform.
              </Text>
            </View>

            <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 12, marginBottom: 24 }}>
              <TouchableOpacity
                onPress={handleGetStarted}
                style={{ 
                  backgroundColor: '#fff', 
                  paddingHorizontal: 24, 
                  paddingVertical: 12, 
                  borderRadius: 10, 
                  flexDirection: 'row', 
                  alignItems: 'center',
                  shadowColor: '#000',
                  shadowOpacity: 0.1,
                  shadowRadius: 4,
                  elevation: 2
                }}
              >
                <MaterialCommunityIcons name="play" size={18} color="#667eea" />
                <Text style={{ color: '#667eea', fontWeight: '700', marginLeft: 4, fontSize: 14 }}>Get Started</Text>
              </TouchableOpacity>
              {/* <TouchableOpacity style={{ 
                borderWidth: 2, 
                borderColor: '#fff', 
                paddingHorizontal: 24, 
                paddingVertical: 12, 
                borderRadius: 10,
                backgroundColor: 'rgba(255,255,255,0.1)'
              }}>
                <Text style={{ color: '#fff', fontWeight: '700', fontSize: 14 }}>Learn More</Text>
              </TouchableOpacity> */}
            </View>

            <View style={{ alignItems: 'center' }}>
              <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 10, marginBottom: 4 }}>
                Scroll Down
              </Text>
              <MaterialCommunityIcons name="chevron-down" size={16} color="rgba(255,255,255,0.8)" />
            </View>
          </LinearGradient>
        </View>

        {/* About Section */}
        <View style={{ paddingHorizontal: 24, paddingVertical: 40, backgroundColor: '#F8FAFC' }}>
          <View style={{ alignItems: 'center', marginBottom: 32 }}>
            <Text style={{ 
              fontSize: 32, 
              fontWeight: 'bold', 
              color: '#111827', 
              marginBottom: 12, 
              textAlign: 'center',
              lineHeight: 40
            }}>
              About Klinic
            </Text>
            <Text style={{ 
              fontSize: 16, 
              color: '#6B7280', 
              textAlign: 'center', 
              lineHeight: 22,
              maxWidth: 600
            }}>
              We&apos;re a Team of Healthcare Innovators
            </Text>
            <Text style={{ 
              fontSize: 14, 
              color: '#6B7280', 
              textAlign: 'center', 
              lineHeight: 20,
              maxWidth: 500,
              marginTop: 12
            }}>
              Klinic is a comprehensive healthcare platform that connects patients with doctors, laboratories, and pharmacies. We leverage technology to make healthcare accessible, convenient, and efficient for everyone.
            </Text>
          </View>

          <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 16 }}>
            <View style={{ flex: 1, alignItems: 'center', padding: 20, backgroundColor: '#fff', borderRadius: 12, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 }}>
              <MaterialCommunityIcons name="lightbulb" size={32} color="#667eea" style={{ marginBottom: 8 }} />
              <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#111827', marginBottom: 6, textAlign: 'center' }}>
                Innovation First
              </Text>
              <Text style={{ color: '#6B7280', textAlign: 'center', lineHeight: 18, fontSize: 12 }}>
                We use cutting-edge technology to deliver exceptional healthcare solutions that improve patient outcomes.
              </Text>
            </View>
            <View style={{ flex: 1, alignItems: 'center', padding: 20, backgroundColor: '#fff', borderRadius: 12, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 }}>
              <MaterialCommunityIcons name="handshake" size={32} color="#667eea" style={{ marginBottom: 8 }} />
              <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#111827', marginBottom: 6, textAlign: 'center' }}>
                Patient-Centric
              </Text>
              <Text style={{ color: '#6B7280', textAlign: 'center', lineHeight: 18, fontSize: 12 }}>
                Every feature is designed with patients in mind, ensuring a seamless and caring healthcare experience.
              </Text>
            </View>
            <View style={{ flex: 1, alignItems: 'center', padding: 20, backgroundColor: '#fff', borderRadius: 12, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 }}>
              <MaterialCommunityIcons name="shield-check" size={32} color="#667eea" style={{ marginBottom: 8 }} />
              <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#111827', marginBottom: 6, textAlign: 'center' }}>
                Secure & Private
              </Text>
              <Text style={{ color: '#6B7280', textAlign: 'center', lineHeight: 18, fontSize: 12 }}>
                Your health data is protected with industry-leading security standards and privacy measures.
              </Text>
            </View>
          </View>
        </View>

        {/* Stats Section */}
        <View style={{ paddingHorizontal: 24, paddingVertical: 32, backgroundColor: '#fff' }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center' }}>
            <View style={{ alignItems: 'center' }}>
              <Text style={{ fontSize: 32, fontWeight: 'bold', color: '#667eea', marginBottom: 4 }}>500+</Text>
              <Text style={{ color: '#6B7280', fontSize: 12 }}>Expert Doctors</Text>
            </View>
            <View style={{ alignItems: 'center' }}>
              <Text style={{ fontSize: 32, fontWeight: 'bold', color: '#667eea', marginBottom: 4 }}>100+</Text>
              <Text style={{ color: '#6B7280', fontSize: 12 }}>Lab Centers</Text>
            </View>
            <View style={{ alignItems: 'center' }}>
              <Text style={{ fontSize: 32, fontWeight: 'bold', color: '#667eea', marginBottom: 4 }}>24/7</Text>
              <Text style={{ color: '#6B7280', fontSize: 12 }}>AI Support</Text>
            </View>
          </View>
        </View>

        {/* Navigation Buttons */}
        <View style={{ paddingHorizontal: 24, paddingVertical: 24, backgroundColor: '#F8FAFC' }}>
          <Text style={{ 
            fontSize: 24, 
            fontWeight: 'bold', 
            color: '#111827', 
            marginBottom: 20, 
            textAlign: 'center' 
          }}>
            Our Services
          </Text>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 8 }}>
            {sections.map((section) => (
              <TouchableOpacity
                key={section.id}
                onPress={() => scrollToSection(section.id)}
                style={{
                  flex: 1,
                  paddingHorizontal: 8,
                  paddingVertical: 12,
                  borderRadius: 10,
                  backgroundColor: '#fff',
                  alignItems: 'center',
                  shadowColor: '#000',
                  shadowOpacity: 0.05,
                  shadowRadius: 4,
                  elevation: 2,
                  borderWidth: 1,
                  borderColor: '#E5E7EB'
                }}
              >
                <MaterialCommunityIcons
                  name={section.icon as any}
                  size={24}
                  color={section.color}
                  style={{ marginBottom: 6 }}
                />
                <Text style={{
                  fontSize: 10,
                  fontWeight: '600',
                  color: '#111827',
                  textAlign: 'center',
                  lineHeight: 14
                }}>
                  {section.title}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Sections */}
        {renderSection(sections[0], doctorsRef)}
        {renderSection(sections[1], labsRef)}
        {renderSection(sections[2], medicinesRef)}
        {renderSection(sections[3], aiRef)}
        {renderSection(sections[4], videoRef)}

        {/* Final CTA Section */}
        <View style={{ paddingHorizontal: 24, marginBottom: 40, paddingVertical: 40, backgroundColor: '#F8FAFC' }}>
          <LinearGradient
            colors={['#667eea', '#764ba2']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ borderRadius: 16, padding: 32 }}
          >
            <Text style={{ 
              fontSize: 28, 
              fontWeight: 'bold', 
              color: '#fff', 
              marginBottom: 12, 
              textAlign: 'center',
              lineHeight: 36
            }}>
              Ready to Get Started?
            </Text>
            <Text style={{ 
              color: 'rgba(255,255,255,0.9)', 
              textAlign: 'center', 
              marginBottom: 24, 
              fontSize: 16,
              lineHeight: 20
            }}>
              Join thousands of users who trust Klinic for their healthcare needs
            </Text>
            <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 12 }}>
              <TouchableOpacity
                onPress={handleGetStarted}
                style={{ 
                  backgroundColor: '#fff', 
                  paddingHorizontal: 24, 
                  paddingVertical: 12, 
                  borderRadius: 10,
                  shadowColor: '#000',
                  shadowOpacity: 0.1,
                  shadowRadius: 4,
                  elevation: 2
                }}
              >
                <Text style={{ color: '#667eea', fontWeight: '700', fontSize: 14 }}>Get Started</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleLogin}
                style={{ 
                  borderWidth: 2, 
                  borderColor: '#fff', 
                  paddingHorizontal: 24, 
                  paddingVertical: 12, 
                  borderRadius: 10,
                  backgroundColor: 'rgba(255,255,255,0.1)'
                }}
              >
                <Text style={{ color: '#fff', fontWeight: '700', fontSize: 14 }}>Login</Text>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </View>

        {/* Footer */}
        <View style={{ paddingHorizontal: 24, paddingVertical: 32, backgroundColor: '#111827' }}>
          <View style={{ alignItems: 'center' }}>
            <Logo size="small" />
            <Text style={{ color: '#9CA3AF', textAlign: 'center', marginTop: 16, fontSize: 12 }}>
              © 2024 Klinic. All rights reserved.
            </Text>
            <Text style={{ color: '#9CA3AF', textAlign: 'center', marginTop: 4, fontSize: 10 }}>
              Complete healthcare ecosystem for everyone
            </Text>
          </View>
        </View>
      </SafeAreaView>
    </ScrollView>
  );
};

export default LandingPage;