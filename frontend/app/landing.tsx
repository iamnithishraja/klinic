import React, { useRef } from "react";
import { ScrollView, Image } from "react-native";

const LandingPage = () => {
  const scrollViewRef = useRef<ScrollView>(null);

  const scrollToBottom = () => {
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollToEnd({ animated: true });
    }
  };

  const redirectToLogin = () => {
    window.location.href = "/login";
  };

  const redirectToRegister = () => {
    window.location.href = "/register";
  };

  return (
      <ScrollView ref={scrollViewRef}>
    <div className="min-h-screen bg-gray-50">
      {/* Navbar with curved bottom and gradient blend */}
      <nav className="flex justify-between items-center px-12 md:px-12 pt-6 pb-8 relative z-20"
        style={{
          background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 100%, rgba(102, 126, 234, 0.25) 50%, rgba(118, 75, 162, 0.35) 100%)',
          borderBottomLeftRadius: '79px',
          borderBottomRightRadius: '79px',
          // boxShadow: '0 10px 40px rgba(102, 126, 234, 0.2), 0 0 0 1px rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(20px)',
        }}
      >
          <div className="flex items-center space-x-4">
            {/* Logo with K and medical cross */}
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-lg">
              <Image source={require('@/assets/images/icon.png')} style={{ width: 40, height: 40 }} />
            </div>
            <div className="flex items-center">
              <span className="text-4xl font-bold text-slate-800">Klinic</span>
              <div className="ml-2 flex items-center">
                <span className="text-red-500 text-lg">❤️</span>
                <span className="text-blue-600 text-lg ml-1">+</span>
              </div>
            </div>
          </div>
          
          <div className="hidden md:flex space-x-3">

            <button
              onClick={scrollToBottom}
              className="px-6 py-3 rounded-full text-white font-medium transition-all duration-300 hover:scale-105 shadow-lg"
              style={{
                background: 'linear-gradient(135deg, #4F46E5 0%, #6366F1 100%)',
              }}
            >
              Get Started
            </button>
            <button
              onClick={scrollToBottom}
              className="px-6 py-3 rounded-full text-white font-medium transition-all duration-300 hover:scale-105 shadow-lg"
              style={{
                background: 'linear-gradient(135deg, #4F46E5 0%, #6366F1 100%)',
              }}
            >
              About
            </button>
            <button
              onClick={redirectToLogin}
              className="px-6 py-3 rounded-full text-white font-medium transition-all duration-300 hover:scale-105 shadow-lg"
              style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              }}
            >
              Login
            </button>
            <button
              onClick={redirectToRegister}
              className="px-6 py-3 rounded-full text-white font-medium transition-all duration-300 hover:scale-105 shadow-lg"
              style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              }}
            >
              Register
            </button>

          </div>
        </nav>
        
        {/* Hero Section with Gradient - seamless blend */}
        <div 
          className="min-h-screen relative overflow-hidden -mt-12"
          style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
            paddingTop: '100px',
          }}
        >
          {/* Multiple blending overlays for seamless transition */}
          <div 
            className="absolute top-0 left-0 right-0 h-32 z-10"
            style={{
              background: 'linear-gradient(180deg, rgba(102, 126, 234, 0.4) 0%, rgba(118, 75, 162, 0.2) 30%, transparent 100%)',
            }}
          ></div>
          <div 
            className="absolute top-0 left-0 right-0 h-20 z-11"
            style={{
              background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.1) 0%, transparent 100%)',
              borderBottomLeftRadius: '80px',
              borderBottomRightRadius: '80px',
            }}
          ></div>
          {/* Floating healthcare icons background */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute bottom-40 left-1/4 text-white/10 text-5xl">🩺</div>
            <div className="absolute top-60 left-1/2 text-white/20 text-3xl">❤️</div>
            <div className="absolute bottom-60 right-1/3 text-white/10 text-4xl">💊</div>
            <div className="absolute top-80 left-1/3 text-white/10 text-5xl">🧬</div>
          </div>
        

          {/* Hero Content */}
          <div className="flex flex-col items-center justify-center px-6 py-20 relative z-10">
            <div className="text-center max-w-4xl mx-auto">
              <h1 className="text-6xl md:text-8xl font-bold text-white mb-8 tracking-wider">
                ASK AI DOCTOR
              </h1>
              <p className="text-xl md:text-2xl text-white/90 mb-12 font-light">
                Get instant medical advice from our AI-powered healthcare assistant
              </p>
              
              {/* Search Container - Centered */}
              <div className="max-w-2xl mx-auto space-y-8 flex flex-col items-center">
                <div 
                  className="bg-white rounded-2xl p-8 shadow-2xl w-full"
                  style={{
                    backdropFilter: 'blur(20px)',
                    background: 'rgba(255, 255, 255, 0.95)'
                  }}
                >
                  <textarea
          placeholder="Type Here Patient Details"
                    className="w-full h-24 text-lg text-gray-700 placeholder-gray-400 border-none outline-none resize-none bg-transparent text-center"
                    style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
                  />
                </div>
                
                <button
                  onClick={redirectToLogin}
                  className="text-white px-16 py-5 rounded-full text-xl font-semibold shadow-xl transition-all duration-300 hover:scale-105 hover:shadow-2xl flex items-center justify-center space-x-3"
                  style={{
                    background: 'linear-gradient(135deg, #4F46E5 0%, #6366F1 50%, #8B5CF6 100%)',
                  }}
                >
                  <span className="text-2xl">🔍</span>
                  <span>Search</span>
                </button>
              </div>
            </div>
          </div>

          {/* Multiple K watermarks */}
          <div className="absolute bottom-20 right-20 text-white/10 text-9xl font-bold pointer-events-none">
            Klinic
          </div>
          <div className="absolute bottom-40 left-20 text-white/10 text-6xl font-bold pointer-events-none">
            K
          </div>
        </div>

      {/* Doctor Consultation Section */}
      <div 
        className="min-h-screen py-24 relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 50%, #a5b4fc 100%)',
        }}
      >
        {/* Floating medical icons */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 text-blue-200/30 text-6xl">🩺</div>
          <div className="absolute bottom-32 right-16 text-purple-200/30 text-5xl">❤️</div>
          <div className="absolute top-60 right-20 text-blue-200/30 text-4xl">💊</div>
        </div>
        
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="text-center mb-20">
            <div className="flex flex-col md:flex-row items-center justify-center mb-10">
              <h2 className="text-5xl md:text-7xl font-bold text-slate-800 mb-6 md:mb-0 md:mr-12 leading-tight">
                Online Dr Consultation
              </h2>
              
              {/* Enhanced Phone illustration */}
              <div className="bg-white rounded-3xl p-6 shadow-2xl transform hover:scale-105 transition-transform duration-300">
                <div className="w-24 h-40 bg-gradient-to-b from-gray-50 to-gray-100 rounded-2xl flex items-center justify-center relative border border-gray-200">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full shadow-lg"></div>
                  <div className="absolute -top-3 -right-3 text-red-500 text-xl drop-shadow-lg">❤️</div>
                  <div className="absolute -bottom-3 -left-3 text-blue-600 text-xl drop-shadow-lg">🏥</div>
                  <div className="absolute top-2 left-2 w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                </div>
              </div>
            </div>
            
            <p className="text-2xl text-slate-600 max-w-3xl mx-auto leading-relaxed font-medium">
              Connect with specialized doctors from the comfort of your home
            </p>
          </div>

          {/* Enhanced Specialists Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-12 mb-20">
            {[
              { name: "Mental Health", image: "https://randomuser.me/api/portraits/men/32.jpg", icon: "🧠" },
              { name: "Cardiology", image: "https://randomuser.me/api/portraits/men/41.jpg", icon: "❤️" },
              { name: "Gastroenterology", image: "https://randomuser.me/api/portraits/women/65.jpg", icon: "🍽️" },
              { name: "Neurology", image: "https://randomuser.me/api/portraits/men/12.jpg", icon: "🧬" }
            ].map((specialty, index) => (
              <div key={index} className="flex flex-col items-center space-y-6 group cursor-pointer">
                <div className="relative transform transition-all duration-300 group-hover:scale-110">
                  <img 
                    src={specialty.image} 
                    alt={specialty.name}
                    className="w-40 h-40 rounded-full border-6 border-white shadow-2xl object-cover"
                  />
                  <div className="absolute -bottom-2 -right-2 w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-lg border-4 border-blue-100">
                    <span className="text-xl">{specialty.icon}</span>
                  </div>
                </div>
                <div 
                  className="bg-white px-8 py-4 rounded-full shadow-xl transform transition-all duration-300 group-hover:scale-105"
                  style={{
                    background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
                    border: '2px solid rgba(79, 70, 229, 0.1)'
                  }}
                >
                  <span className="text-blue-700 font-bold text-lg">{specialty.name}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center">
            <button
              onClick={redirectToLogin}
              className="text-white px-16 py-6 rounded-full text-2xl font-bold shadow-2xl transition-all duration-300 hover:scale-105 hover:shadow-3xl transform"
              style={{
                background: 'linear-gradient(135deg, #4F46E5 0%, #6366F1 50%, #8B5CF6 100%)',
              }}
            >
              👩‍⚕️ Click Here to Find More Specialists
            </button>
          </div>
        </div>
      </div>

      {/* Lab Test Section */}
      <div 
        className="min-h-screen py-24 relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 50%, #93c5fd 100%)',
        }}
      >
        {/* Floating lab icons */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-32 right-12 text-blue-200/30 text-5xl">🧪</div>
          <div className="absolute bottom-40 left-16 text-blue-200/30 text-6xl">🔬</div>
          <div className="absolute top-60 left-20 text-blue-200/30 text-4xl">⚗️</div>
        </div>
        
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="text-center mb-20">
            <div className="flex flex-col md:flex-row items-center justify-center mb-10">
              <h2 className="text-5xl md:text-7xl font-bold text-slate-800 mb-6 md:mb-0 md:mr-12 leading-tight">
                Book Lab Test Online
              </h2>
              
              {/* Enhanced Test tube illustration */}
              <div className="relative w-32 h-32 transform hover:scale-110 transition-transform duration-300">
                <div className="absolute top-4 left-8 w-8 h-16 bg-gradient-to-b from-red-400 to-red-600 rounded-full shadow-lg"></div>
                <div className="absolute top-0 right-4 w-12 h-12 border-4 border-white rounded-full bg-blue-100 shadow-xl flex items-center justify-center">
                  <div className="w-6 h-6 border-2 border-blue-600 rounded-full"></div>
                </div>
                <div className="absolute bottom-2 left-2 text-2xl">🧪</div>
                <div className="absolute top-2 right-0 text-xl">✨</div>
              </div>
            </div>
            
            <p className="text-2xl text-slate-600 max-w-3xl mx-auto leading-relaxed font-medium">
              Get accurate lab results with our comprehensive testing services
            </p>
          </div>

          {/* Enhanced Tests Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-20">
            {[
              { name: "Blood Test", icon: "🩸", color: "from-red-400 to-red-600" },
              { name: "ECG", icon: "💓", color: "from-green-400 to-green-600" },
              { name: "Sugar Test", icon: "🍭", color: "from-yellow-400 to-orange-500" },
              { name: "CBC", icon: "🧬", color: "from-purple-400 to-purple-600" }
            ].map((test, index) => (
              <button
                key={index}
                className="group bg-white hover:bg-blue-50 text-slate-700 p-8 rounded-3xl font-bold shadow-xl transition-all duration-300 hover:scale-105 hover:shadow-2xl transform relative overflow-hidden"
                style={{
                  border: '3px solid rgba(59, 130, 246, 0.1)'
                }}
              >
                <div className="flex flex-col items-center space-y-4">
                  <div 
                    className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl shadow-lg bg-gradient-to-r ${test.color} transform group-hover:scale-110 transition-transform duration-300`}
                  >
                    <span className="text-white">{test.icon}</span>
                  </div>
                  <span className="text-lg font-bold text-blue-700 group-hover:text-blue-800">{test.name}</span>
                </div>
                <div className="absolute inset-0 bg-gradient-to-r from-blue-400/0 via-blue-400/5 to-blue-400/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </button>
            ))}
          </div>

          <div className="text-center relative">
            <button
              onClick={redirectToLogin}
              className="text-white px-16 py-6 rounded-full text-2xl font-bold shadow-2xl transition-all duration-300 hover:scale-105 hover:shadow-3xl transform mb-8"
              style={{
                background: 'linear-gradient(135deg, #1E40AF 0%, #3B82F6 50%, #60A5FA 100%)',
              }}
            >
              🧪 Book Now
            </button>
            
            {/* Enhanced Lab technician avatar */}
            <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-white rounded-full border-6 border-blue-600 shadow-2xl flex items-center justify-center transform hover:scale-110 transition-transform duration-300">
              <span className="text-3xl">👩‍🔬</span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-slate-800 py-8">
        <div className="text-center">
          <p className="text-white/70 text-lg">© 2024 Klinic. All rights reserved.</p>
        </div>
      </footer>
    </div>
    </ScrollView>
  );
};

export default LandingPage;