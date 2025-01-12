// 'use client'

// import { Check } from 'lucide-react';
// import { motion } from 'framer-motion';

// interface AnimatedCheckboxProps {
//   checked: boolean;
//   onChange: () => void;
// }

// export default function AnimatedCheckbox({ checked, onChange }: AnimatedCheckboxProps) {
//   return (
//     <motion.button
//       className={`
//         relative w-5 h-5 rounded-md border-2 
//         ${checked 
//           ? 'border-primary bg-primary' 
//           : 'border-input hover:border-primary/50'
//         }
//         transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary
//       `}
//       onClick={onChange}
//       whileTap={{ scale: 0.9 }}
//       initial={false}
//     >
//       <motion.div
//         initial={{ opacity: 0, scale: 0.5 }}
//         animate={{ opacity: checked ? 1 : 0, scale: checked ? 1 : 0.5 }}
//         transition={{ duration: 0.2 }}
//         className="absolute inset-0 flex items-center justify-center text-primary-foreground"
//       >
//         <Check className="w-3 h-3" />
//       </motion.div>
//     </motion.button>
//   );
// } 