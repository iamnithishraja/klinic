// import React, { useState } from 'react';
// import { FaUserCircle, FaChevronDown } from 'react-icons/fa';

// const roles = [
//   { value: 'user', label: 'User' },
//   { value: 'admin', label: 'Admin' },
//   { value: 'doctor', label: 'Doctor' },
//   { value: 'other', label: 'Other/All' },
// ];

// const getUserFromStorage = () => {
//   // Example: Replace with your actual user fetching logic
//   const user = JSON.parse(localStorage.getItem('user_profile') || '{}');
//   return user && user.name ? user : {
//     name: 'Guest',
//     email: 'guest@example.com',
//     role: 'user',
//   };
// };

// const Navbar: React.FC = () => {
//   const [selectedRole, setSelectedRole] = useState('user');
//   const [profileOpen, setProfileOpen] = useState(false);
//   const user = getUserFromStorage();

//   return (
//     <nav className="w-full bg-white shadow-md fixed top-0 left-0 z-50 flex items-center justify-between px-8 py-3 border-b border-gray-100">
//       {/* Left: Logo/Brand */}
//       <div className="flex items-center gap-3">
//         <span className="text-2xl font-bold text-tint tracking-tight">Klinic</span>
//         <span className="text-xs bg-tint text-white px-2 py-1 rounded-full ml-2">Admin Panel</span>
//       </div>

//       {/* Center: Role Selector */}
//       <div className="flex items-center gap-2">
//         <label htmlFor="role-select" className="text-sm font-medium text-gray-700 mr-2">Role:</label>
//         <select
//           id="role-select"
//           value={selectedRole}
//           onChange={e => setSelectedRole(e.target.value)}
//           className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-tint text-gray-800 bg-gray-50 font-semibold shadow-sm hover:border-tint transition-all"
//         >
//           {roles.map(role => (
//             <option key={role.value} value={role.value}>{role.label}</option>
//           ))}
//         </select>
//       </div>

//       {/* Right: Avatar/Profile */}
//       <div className="relative">
//         <button
//           className="flex items-center gap-2 focus:outline-none group"
//           onClick={() => setProfileOpen(v => !v)}
//         >
//           <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xl font-bold shadow-md">
//             {user.name?.charAt(0).toUpperCase() || <FaUserCircle className="text-2xl" />}
//           </div>
//           <FaChevronDown className={`text-tint transition-transform duration-200 ${profileOpen ? 'rotate-180' : ''}`} />
//         </button>
//         {/* Dropdown */}
//         {profileOpen && (
//           <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-lg p-6 z-50 animate-fade-in">
//             <div className="flex items-center gap-3 mb-4">
//               <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold">
//                 {user.name?.charAt(0).toUpperCase() || <FaUserCircle className="text-2xl" />}
//               </div>
//               <div>
//                 <div className="font-bold text-lg text-gray-900">{user.name}</div>
//                 <div className="text-sm text-gray-500">{user.email}</div>
//                 <div className="text-xs text-tint font-semibold mt-1">Role: {user.role}</div>
//               </div>
//             </div>
//             <div className="flex flex-col gap-2">
//               <button className="w-full py-2 rounded-lg bg-tint text-white font-semibold hover:bg-blue-700 transition">View Profile</button>
//               <button
//                 className="w-full py-2 rounded-lg bg-gray-100 text-gray-700 font-semibold hover:bg-gray-200 transition"
//                 onClick={() => {
//                   localStorage.removeItem('admin_token');
//                   window.location.href = '/';
//                 }}
//               >
//                 Logout
//               </button>
//             </div>
//           </div>
//         )}
//       </div>
//     </nav>
//   );
// };

// export default Navbar; 