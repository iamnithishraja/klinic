import React from 'react';
import { View, Text } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';

// Helper function to format bullet points and structured content
const formatStructuredContent = (content: string) => {
  const lines = content.trim().split('\n').filter(line => line.trim());
  
  return lines.map((line, index) => {
    const trimmedLine = line.trim();
    
    // Check for numbered lists (1. 2. etc.)
    if (trimmedLine.match(/^\d+\.\s+/)) {
      const numberMatch = trimmedLine.match(/^(\d+)\.\s+(.+)/);
      if (numberMatch) {
        const [, number, bulletContent] = numberMatch;
        return (
          <View key={index} style={{ flexDirection: 'row', marginBottom: 10, alignItems: 'flex-start' }}>
            <View style={{
              minWidth: 24,
              height: 24,
              borderRadius: 12,
              backgroundColor: '#8B5CF6',
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: 12,
              marginTop: 2,
              flexShrink: 0,
            }}>
              <Text style={{
                color: '#FFFFFF',
                fontSize: 12,
                fontWeight: 'bold',
              }}>
                {number}
              </Text>
            </View>
            <Text style={{
              color: '#4B5563',
              fontSize: 16,
              lineHeight: 24,
              flex: 1,
            }}>
              {bulletContent}
            </Text>
          </View>
        );
      }
    }
    
    // Check for bullet points (• or * or -)
    if (trimmedLine.match(/^[•\*\-]\s+/)) {
      const bulletContent = trimmedLine.replace(/^[•\*\-]\s+/, '');
      return (
        <View key={index} style={{ flexDirection: 'row', marginBottom: 10, alignItems: 'flex-start' }}>
          <View style={{
            width: 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: '#8B5CF6',
            marginTop: 8,
            marginRight: 12,
            flexShrink: 0,
          }} />
          <Text style={{
            color: '#4B5563',
            fontSize: 16,
            lineHeight: 24,
            flex: 1,
          }}>
            {bulletContent}
          </Text>
        </View>
      );
    }
    
    // Check for section headers (lines ending with :)
    if (trimmedLine.endsWith(':') && trimmedLine.length > 3) {
      return (
        <Text key={index} style={{
          color: '#374151',
          fontSize: 16,
          lineHeight: 24,
          fontWeight: '600',
          marginBottom: 8,
          marginTop: index > 0 ? 8 : 0,
        }}>
          {trimmedLine}
        </Text>
      );
    }
    
    // Regular text
    return (
      <Text key={index} style={{
        color: '#4B5563',
        fontSize: 16,
        lineHeight: 24,
        marginBottom: 8,
      }}>
        {trimmedLine}
      </Text>
    );
  });
};

interface MedicalAssessmentProps {
  content: string;
}

export const MedicalAssessment: React.FC<MedicalAssessmentProps> = ({ content }) => (
  <View 
    style={{
      backgroundColor: '#F0F9FF',
      borderLeftWidth: 4,
      borderLeftColor: '#0EA5E9',
      padding: 18,
      marginBottom: 14,
      borderRadius: 16,
      borderTopLeftRadius: 4,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 8,
      elevation: 3,
    }}
  >
    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 14 }}>
      <View 
        style={{
          width: 36,
          height: 36,
          backgroundColor: '#E0F2FE',
          borderRadius: 18,
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: 12,
        }}
      >
        <FontAwesome name="stethoscope" size={18} color="#0EA5E9" />
      </View>
      <Text 
        style={{
          fontWeight: '600',
          color: '#0C4A6E',
          fontSize: 18,
          flex: 1,
        }}
      >
        Medical Assessment
      </Text>
    </View>
    <View style={{ paddingLeft: 8 }}>
      {formatStructuredContent(content)}
    </View>
  </View>
);

interface RecommendationProps {
  type: string;
  content: string;
}

export const RecommendationCard: React.FC<RecommendationProps> = ({ type, content }) => {
  const getRecommendationStyle = (type: string) => {
    switch (type) {
      case 'immediate':
        return { 
          backgroundColor: '#FDF2F8', 
          borderColor: '#EC4899', 
          icon: 'heartbeat', 
          iconColor: '#EC4899',
          textColor: '#831843',
          iconBg: '#FCE7F3'
        };
      case 'followup':
        return { 
          backgroundColor: '#F0F9FF', 
          borderColor: '#0EA5E9', 
          icon: 'calendar-check-o', 
          iconColor: '#0EA5E9',
          textColor: '#0C4A6E',
          iconBg: '#E0F2FE'
        };
      case 'lifestyle':
        return { 
          backgroundColor: '#F0FDF4', 
          borderColor: '#22C55E', 
          icon: 'leaf', 
          iconColor: '#22C55E',
          textColor: '#14532D',
          iconBg: '#DCFCE7'
        };
      default:
        return { 
          backgroundColor: '#FAFAFA', 
          borderColor: '#8B5CF6', 
          icon: 'lightbulb-o', 
          iconColor: '#8B5CF6',
          textColor: '#4C1D95',
          iconBg: '#F3E8FF'
        };
    }
  };
  
  const style = getRecommendationStyle(type);
  
  return (
    <View 
      style={{
        backgroundColor: style.backgroundColor,
        borderLeftWidth: 4,
        borderLeftColor: style.borderColor,
        padding: 18,
        marginBottom: 14,
        borderRadius: 16,
        borderTopLeftRadius: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 14 }}>
        <View 
          style={{
            width: 36,
            height: 36,
            backgroundColor: style.iconBg,
            borderRadius: 18,
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: 12,
          }}
        >
          <FontAwesome name={style.icon as any} size={18} color={style.iconColor} />
        </View>
        <Text 
          style={{
            fontWeight: '600',
            color: style.textColor,
            fontSize: 18,
            textTransform: 'capitalize',
            flex: 1,
          }}
        >
          {type} Recommendation
        </Text>
      </View>
      <View style={{ paddingLeft: 8 }}>
        {formatStructuredContent(content)}
      </View>
    </View>
  );
};

interface TestCardProps {
  name: string;
  priority: string;
  reason?: string;
  content: string;
}

export const TestCard: React.FC<TestCardProps> = ({ name, priority, reason, content }) => {
  const getPriorityConfig = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case 'high': 
        return { 
          backgroundColor: '#EF4444',
          borderColor: '#DC2626',
          textColor: '#FFFFFF',
          icon: 'exclamation-triangle',
          iconColor: '#FFFFFF',
          glowColor: '#EF4444',
          label: 'HIGH PRIORITY',
          urgencyText: 'Urgent'
        };
      case 'medium': 
        return { 
          backgroundColor: '#F59E0B',
          borderColor: '#D97706',
          textColor: '#FFFFFF',
          icon: 'clock-o',
          iconColor: '#FFFFFF',
          glowColor: '#F59E0B',
          label: 'MEDIUM PRIORITY',
          urgencyText: 'Moderate'
        };
      case 'low': 
        return { 
          backgroundColor: '#10B981',
          borderColor: '#059669',
          textColor: '#FFFFFF',
          icon: 'check-circle',
          iconColor: '#FFFFFF',
          glowColor: '#10B981',
          label: 'LOW PRIORITY',
          urgencyText: 'Routine'
        };
      default: 
        return { 
          backgroundColor: '#6B7280',
          borderColor: '#4B5563',
          textColor: '#FFFFFF',
          icon: 'info-circle',
          iconColor: '#FFFFFF',
          glowColor: '#6B7280',
          label: 'PRIORITY',
          urgencyText: 'Standard'
        };
    }
  };
  
  const priorityConfig = getPriorityConfig(priority);
  
  return (
    <View style={{
      backgroundColor: '#FAF5FF',
      borderWidth: 1,
      borderColor: '#DDD6FE',
      padding: 18,
      marginBottom: 14,
      borderRadius: 16,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 4,
      elevation: 2,
    }}>
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 12,
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
          <View style={{
            width: 32,
            height: 32,
            backgroundColor: '#EDE9FE',
            borderRadius: 16,
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <FontAwesome name="flask" size={16} color="#8B5CF6" />
          </View>
          <Text style={{
            marginLeft: 12,
            fontWeight: 'bold',
            color: '#581C87',
            fontSize: 16,
            flex: 1,
          }}>
            {name}
          </Text>
        </View>
        <View style={{
          backgroundColor: priorityConfig.backgroundColor,
          borderWidth: 1,
          borderColor: priorityConfig.borderColor,
          paddingHorizontal: 8,
          paddingVertical: 6,
          borderRadius: 20,
          flexDirection: 'row',
          alignItems: 'center',
          shadowColor: priorityConfig.glowColor,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.3,
          shadowRadius: 4,
          elevation: 4,
        }}>
          <FontAwesome 
            name={priorityConfig.icon} 
            size={12} 
            color={priorityConfig.iconColor} 
            style={{ marginRight: 6 }}
          />
          <Text style={{
            color: priorityConfig.textColor,
            fontSize: 11,
            fontWeight: 'bold',
            textTransform: 'uppercase',
            letterSpacing: 0.5,
          }}>
            {priorityConfig.label}
          </Text>
        </View>
      </View>
      
      {reason && (
        <View style={{
          backgroundColor: '#EDE9FE',
          padding: 12,
          borderRadius: 12,
          marginBottom: 12,
        }}>
          <Text style={{
            color: '#6B21A8',
            fontWeight: '600',
            fontSize: 14,
            marginBottom: 4,
          }}>
            Reason for Testing:
          </Text>
          <Text style={{
            color: '#7C3AED',
            fontSize: 14,
            lineHeight: 20,
          }}>
            {reason}
          </Text>
        </View>
      )}
      
      <View style={{ paddingLeft: 8 }}>
        {formatStructuredContent(content)}
      </View>
    </View>
  );
};

interface MedicationCardProps {
  name: string;
  dosage?: string;
  duration?: string;
  priority?: string;
  content: string;
}

export const MedicationCard: React.FC<MedicationCardProps> = ({ name, dosage, duration, priority, content }) => {
  const getPriorityConfig = (priority?: string) => {
    if (!priority) return null;
    
    switch (priority?.toLowerCase()) {
      case 'high': 
        return { 
          backgroundColor: '#EF4444',
          borderColor: '#DC2626',
          textColor: '#FFFFFF',
          icon: 'exclamation-triangle',
          iconColor: '#FFFFFF',
          label: 'URGENT',
          urgencyText: 'Start Immediately'
        };
      case 'medium': 
        return { 
          backgroundColor: '#F59E0B',
          borderColor: '#D97706',
          textColor: '#FFFFFF',
          icon: 'clock-o',
          iconColor: '#FFFFFF',
          label: 'MODERATE',
          urgencyText: 'Start Soon'
        };
      case 'low': 
        return { 
          backgroundColor: '#10B981',
          borderColor: '#059669',
          textColor: '#FFFFFF',
          icon: 'check',
          iconColor: '#FFFFFF',
          label: 'ROUTINE',
          urgencyText: 'When Convenient'
        };
      default: 
        return null;
    }
  };
  
  const priorityConfig = getPriorityConfig(priority);
  
  return (
  <View style={{
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    padding: 18,
    marginBottom: 14,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  }}>
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
        <View style={{
          width: 32,
          height: 32,
          backgroundColor: '#D1FAE5',
          borderRadius: 16,
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <FontAwesome name="plus-circle" size={16} color="#10B981" />
        </View>
        <Text style={{
          marginLeft: 12,
          fontWeight: 'bold',
          color: '#064E3B',
          fontSize: 16,
          flex: 1,
        }}>
          {name}
        </Text>
      </View>
      {priorityConfig && (
        <View style={{
          backgroundColor: priorityConfig.backgroundColor,
          borderWidth: 1,
          borderColor: priorityConfig.borderColor,
          paddingHorizontal: 8,
          paddingVertical: 4,
          borderRadius: 16,
          flexDirection: 'row',
          alignItems: 'center',
        }}>
          <FontAwesome 
            name={priorityConfig.icon} 
            size={10} 
            color={priorityConfig.iconColor} 
            style={{ marginRight: 4 }}
          />
          <Text style={{
            color: priorityConfig.textColor,
            fontSize: 10,
            fontWeight: 'bold',
            textTransform: 'uppercase',
          }}>
            {priorityConfig.label}
          </Text>
        </View>
      )}
    </View>
    
    <View style={{
      backgroundColor: '#D1FAE5',
      padding: 12,
      borderRadius: 12,
      marginBottom: 12,
    }}>
      {dosage && (
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          marginBottom: duration ? 8 : 0,
        }}>
          <FontAwesome name="eyedropper" size={12} color="#059669" />
          <Text style={{
            marginLeft: 8,
            color: '#065F46',
            fontWeight: '600',
            fontSize: 14,
          }}>
            Dosage: {dosage}
          </Text>
        </View>
      )}
      {duration && (
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <FontAwesome name="calendar" size={12} color="#059669" />
          <Text style={{
            marginLeft: 8,
            color: '#065F46',
            fontWeight: '600',
            fontSize: 14,
          }}>
            Duration: {duration}
          </Text>
        </View>
      )}
    </View>
    
    <View style={{ paddingLeft: 8 }}>
      {formatStructuredContent(content)}
    </View>
  </View>
  );
};

interface DoctorRecommendationCardProps {
  name: string;
  specialization: string;
  city: string;
  fee?: string;
  type?: string;
  priority?: string;
  reason?: string;
  content: string;
}

export const DoctorRecommendationCard: React.FC<DoctorRecommendationCardProps> = ({ 
  name, 
  specialization, 
  city, 
  fee, 
  type, 
  priority, 
  reason, 
  content 
}) => {
  const getPriorityConfig = (priority?: string) => {
    if (!priority) return null;
    
    switch (priority?.toLowerCase()) {
      case 'high': 
        return { 
          backgroundColor: '#EF4444',
          borderColor: '#DC2626',
          textColor: '#FFFFFF',
          icon: 'exclamation-triangle',
          iconColor: '#FFFFFF',
          label: 'URGENT',
          urgencyText: 'Book Today'
        };
      case 'medium': 
        return { 
          backgroundColor: '#F59E0B',
          borderColor: '#D97706',
          textColor: '#FFFFFF',
          icon: 'clock-o',
          iconColor: '#FFFFFF',
          label: 'RECOMMENDED',
          urgencyText: 'Book Soon'
        };
      case 'low': 
        return { 
          backgroundColor: '#10B981',
          borderColor: '#059669',
          textColor: '#FFFFFF',
          icon: 'check',
          iconColor: '#FFFFFF',
          label: 'OPTIONAL',
          urgencyText: 'When Convenient'
        };
      default: 
        return null;
    }
  };
  
  const priorityConfig = getPriorityConfig(priority);
  
  return (
    <View style={{
      backgroundColor: '#EFF6FF',
      borderWidth: 1,
      borderColor: '#DBEAFE',
      padding: 18,
      marginBottom: 14,
      borderRadius: 16,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 4,
      elevation: 2,
    }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
          <View style={{
            width: 32,
            height: 32,
            backgroundColor: '#DBEAFE',
            borderRadius: 16,
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <FontAwesome name="user-md" size={16} color="#2563EB" />
          </View>
          <View style={{ marginLeft: 12, flex: 1 }}>
            <Text style={{
              fontWeight: 'bold',
              color: '#1E3A8A',
              fontSize: 16,
            }}>
              {name}
            </Text>
            <Text style={{
              color: '#1D4ED8',
              fontSize: 14,
              marginTop: 2,
            }}>
              {specialization}
            </Text>
          </View>
        </View>
        {priorityConfig && (
          <View style={{
            backgroundColor: priorityConfig.backgroundColor,
            borderWidth: 1,
            borderColor: priorityConfig.borderColor,
            paddingHorizontal: 8,
            paddingVertical: 4,
            borderRadius: 16,
            flexDirection: 'row',
            alignItems: 'center',
          }}>
            <FontAwesome 
              name={priorityConfig.icon} 
              size={10} 
              color={priorityConfig.iconColor} 
              style={{ marginRight: 4 }}
            />
            <Text style={{
              color: priorityConfig.textColor,
              fontSize: 10,
              fontWeight: 'bold',
              textTransform: 'uppercase',
            }}>
              {priorityConfig.label}
            </Text>
          </View>
        )}
      </View>
      
      <View style={{
        backgroundColor: '#DBEAFE',
        padding: 12,
        borderRadius: 12,
        marginBottom: 12,
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
          <FontAwesome name="map-marker" size={12} color="#1D4ED8" />
          <Text style={{
            marginLeft: 8,
            color: '#1E3A8A',
            fontWeight: '600',
            fontSize: 14,
          }}>
            {city}
          </Text>
          {fee && (
            <>
              <Text style={{ marginHorizontal: 8, color: '#64748B' }}>•</Text>
              <FontAwesome name="rupee" size={12} color="#1D4ED8" />
              <Text style={{
                marginLeft: 4,
                color: '#1E3A8A',
                fontWeight: '600',
                fontSize: 14,
              }}>
                {fee}
              </Text>
            </>
          )}
        </View>
        {type && (
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <FontAwesome name="video-camera" size={12} color="#1D4ED8" />
            <Text style={{
              marginLeft: 8,
              color: '#1E3A8A',
              fontWeight: '500',
              fontSize: 13,
              textTransform: 'capitalize',
            }}>
              {type} Consultation
            </Text>
          </View>
        )}
      </View>
      
      {reason && (
        <View style={{
          backgroundColor: '#DBEAFE',
          padding: 12,
          borderRadius: 12,
          marginBottom: 12,
        }}>
          <Text style={{
            color: '#1E3A8A',
            fontWeight: '600',
            fontSize: 14,
            marginBottom: 4,
          }}>
            Why this doctor:
          </Text>
          <Text style={{
            color: '#1D4ED8',
            fontSize: 14,
            lineHeight: 20,
          }}>
            {reason}
          </Text>
        </View>
      )}
      
      <View style={{ paddingLeft: 8 }}>
        {formatStructuredContent(content)}
      </View>
    </View>
  );
};

interface WarningsCardProps {
  content: string;
}

export const WarningsCard: React.FC<WarningsCardProps> = ({ content }) => (
  <View style={{
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    padding: 18,
    marginBottom: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  }}>
    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
      <View style={{
        width: 32,
        height: 32,
        backgroundColor: '#FEE2E2',
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <FontAwesome name="warning" size={16} color="#EF4444" />
      </View>
      <Text style={{
        marginLeft: 12,
        fontWeight: 'bold',
        color: '#7F1D1D',
        fontSize: 18,
      }}>
        ⚠️ Important Warnings
      </Text>
    </View>
    <View style={{ paddingLeft: 8 }}>
      {formatStructuredContent(content)}
    </View>
  </View>
);

interface NextStepsCardProps {
  content: string;
}

export const NextStepsCard: React.FC<NextStepsCardProps> = ({ content }) => (
  <View 
    style={{
      backgroundColor: '#F8F9FA',
      borderLeftWidth: 4,
      borderLeftColor: '#8B5CF6',
      padding: 20,
      marginBottom: 16,
      borderRadius: 16,
      borderTopLeftRadius: 4,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 8,
      elevation: 3,
    }}
  >
    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
      <View 
        style={{
          width: 36,
          height: 36,
          backgroundColor: '#F3E8FF',
          borderRadius: 18,
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: 12,
        }}
      >
        <FontAwesome name="list-ul" size={18} color="#8B5CF6" />
      </View>
      <Text 
        style={{
          fontWeight: '600',
          color: '#4C1D95',
          fontSize: 18,
          flex: 1,
        }}
      >
        Next Steps
      </Text>
    </View>
    <View style={{ paddingLeft: 8 }}>
      {formatStructuredContent(content)}
    </View>
  </View>
);

interface PlainTextProps {
  content: string;
}

export const PlainText: React.FC<PlainTextProps> = ({ content }) => (
  <View style={{ marginBottom: 12 }}>
    {formatStructuredContent(content)}
  </View>
); 